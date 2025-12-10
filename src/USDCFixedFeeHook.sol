// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {BaseHook} from "@openzeppelin/uniswap-hooks/src/base/BaseHook.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {IPoolManager, SwapParams, ModifyLiquidityParams} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary, toBeforeSwapDelta} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";
import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {SafeCast} from "@uniswap/v4-core/src/libraries/SafeCast.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {StateLibrary} from "@uniswap/v4-core/src/libraries/StateLibrary.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {FullMath} from "@uniswap/v4-core/src/libraries/FullMath.sol";
import {FixedPoint96} from "@uniswap/v4-core/src/libraries/FixedPoint96.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "forge-std/console.sol";


contract USDCFixedFeeHook is BaseHook {
    using StateLibrary for IPoolManager;
    using FullMath for uint256;
    using SafeERC20 for IERC20;

    // State variables
    mapping(address => int256) public userBalance;
    mapping(address => uint256) public lifetimeContribution;
    
    // TWAP State
    struct Observation {
        uint32 timestamp;
        int56 cumulativeTick;
        bool initialized;
    }
    
    // Ring buffer of size 2: [0] = current/latest, [1] = old/window start
    Observation[2] public observations;
    uint256 public lastObservationIndex;
    uint32 public constant TWAP_WINDOW = 3600; // 1 hour
    
    // Configurable parameters
    uint256 public immutable FIXED_FEE_USDC; // e.g., 2.99 * 10^6 for $2.99
    Currency public immutable USDC;
    
    // Constants for gas estimation (simplified for MVP)
    uint256 public constant ESTIMATED_GAS_PER_SWAP = 230000; 
    uint256 private constant Q192 = uint256(FixedPoint96.Q96) ** 2;

    error CreditLimitExceeded();
    error TWAPNotInitialized();
    error InsufficientUSDCAllowance();
    error InsufficientBalance();

    event FeesCollected(address indexed user, uint256 amount);
    event CreditUpdated(address indexed user, int256 newBalance, int256 delta);
    event Withdrawn(address indexed user, uint256 amount);

    constructor(IPoolManager _poolManager, Currency _usdc, uint256 _fixedFee) BaseHook(_poolManager) {
        USDC = _usdc;
        FIXED_FEE_USDC = _fixedFee;
    }

    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: false,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: true,
            afterSwap: true,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false, // Not strictly needed for this logic unless we want to override swap amount
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    function _beforeSwap(address, PoolKey calldata key, SwapParams calldata, bytes calldata hookData)
        internal
        override
        returns (bytes4, BeforeSwapDelta, uint24)
    {
        // Update TWAP
        _updateTWAP(key);

        // Decode user from hookData
        // If hookData is empty, this will revert, which is effectively checking the requirement
        address user = abi.decode(hookData, (address));

        // Collect fixed fee
        // We use the decoded user address, NOT the msg.sender (router)
        // This solves the Sender Ambiguity issue
        IERC20(Currency.unwrap(USDC)).safeTransferFrom(user, address(this), FIXED_FEE_USDC);
        emit FeesCollected(user, FIXED_FEE_USDC);

        return (BaseHook.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }

    function _afterSwap(address, PoolKey calldata key, SwapParams calldata, BalanceDelta, bytes calldata hookData)
        internal
        override
        returns (bytes4, int128)
    {
        address user = abi.decode(hookData, (address));

        // 1. Estimate actual gas cost in USDC
        uint256 actualGasCostUSDC = _estimateGasCostUSDC(key);
        console.log("Fixed Fee:", FIXED_FEE_USDC);
        console.log("Actual Gas Cost:", actualGasCostUSDC);

        // 2. Calculate surplus/deficit
        int256 delta = int256(FIXED_FEE_USDC) - int256(actualGasCostUSDC);
        console.logInt(delta);

        // 3. Update balances
        if (delta > 0) {
            // Surplus: User accumulates credits
            userBalance[user] += delta;
            lifetimeContribution[user] += uint256(delta);
        } else {
            // Deficit: User draws down credits
            // Check credit limit: 50% of lifetime contributions
            uint256 creditLimit = lifetimeContribution[user] / 2;
            
            // If new balance would be less than negative credit limit, revert
            if (userBalance[user] + delta < -int256(creditLimit)) {
                revert CreditLimitExceeded();
            }
            
            userBalance[user] += delta;
        }

        emit CreditUpdated(user, userBalance[user], delta);

        return (BaseHook.afterSwap.selector, 0);
    }

    /// @notice Allows users to withdraw their positive balance
    function withdraw(uint256 amount) external {
        if (userBalance[msg.sender] < int256(amount)) revert InsufficientBalance();
        
        userBalance[msg.sender] -= int256(amount);
        IERC20(Currency.unwrap(USDC)).safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function _updateTWAP(PoolKey calldata key) internal {
        (, int24 currentTick,,) = poolManager.getSlot0(key.toId());
        uint32 currentTimestamp = uint32(block.timestamp);
        
        Observation memory latest = observations[lastObservationIndex];
        
        if (!latest.initialized) {
            // First observation
            observations[lastObservationIndex] = Observation({
                timestamp: currentTimestamp,
                cumulativeTick: 0,
                initialized: true
            });
            return;
        }
        
        uint32 timeElapsed = currentTimestamp - latest.timestamp;
        if (timeElapsed > 0) {
            int56 nextCumulativeTick = latest.cumulativeTick + int56(currentTick) * int56(uint56(timeElapsed));
            
            // If we don't have an oldest yet, or if the gap between latest and oldest is large enough,
            // we might want to checkpoint.
            // Actually, we want to checkpoint if the *current latest* is significantly newer than the *oldest*.
            // If (currentTimestamp - oldest.timestamp) > TWAP_WINDOW, we update oldest to be the *previous* latest.
            // But we've lost the previous latest state unless we stored it.
            
            // Let's just use a simple array of observations and append? No, gas.
            
            // Correct Logic for Size 2:
            // Always update the "Accumulator".
            // Periodically snapshot the Accumulator to "Oldest".
            
            // Let's separate "Accumulator" from "Observations".
            // Actually, Slot 0 IS the accumulator.
            
            if (!observations[1].initialized) {
                 observations[1] = latest; // Initialize oldest with first observation
            }
            
            // If enough time passed since oldest, update oldest to be the *previous* latest (which is `latest` before update)
            if (currentTimestamp - observations[1].timestamp >= TWAP_WINDOW) {
                observations[1] = latest;
            }
            
            // Update latest
            observations[0] = Observation({
                timestamp: currentTimestamp,
                cumulativeTick: nextCumulativeTick,
                initialized: true
            });
        }
    }

    function getTWAPTick() public view returns (int24) {
        Observation memory latest = observations[0];
        Observation memory oldest = observations[1];
        
        if (!latest.initialized) revert TWAPNotInitialized();
        if (!oldest.initialized) revert TWAPNotInitialized();
        
        uint32 timeDelta = latest.timestamp - oldest.timestamp;
        if (timeDelta == 0) return 0; // Should be handled, but if timestamps equal, no time passed
        
        int56 tickCumDelta = latest.cumulativeTick - oldest.cumulativeTick;
        
        return int24(tickCumDelta / int56(uint56(timeDelta)));
    }

    function _estimateGasCostUSDC(PoolKey calldata key) internal view returns (uint256) {
        // 1. Get TWAP Tick (ETH/USDC price)
        // Try to get TWAP tick, fallback to current tick if not ready
        int24 twapTick;
        try this.getTWAPTick() returns (int24 tick) {
            twapTick = tick;
        } catch {
             (, int24 currentTick,,) = poolManager.getSlot0(key.toId());
            twapTick = currentTick;
        }
        
        uint160 sqrtPriceX96 = TickMath.getSqrtPriceAtTick(twapTick);
        uint256 gasPrice = tx.gasprice;
        if (gasPrice == 0) {
            // Chain-specific fallback
            if (block.chainid == 1) gasPrice = 30 gwei; // Mainnet
            else gasPrice = 0.01 gwei; // L2s
        }
        
        uint256 gasCostInWei = gasPrice * ESTIMATED_GAS_PER_SWAP;
        
        if (key.currency0 == USDC) {
            // USDC is token0
            // Cost = gasCost * 2^192 / sqrtPrice^2
            // We use Q96 for 2^96. 1 << 192 is Q192.
            
            return FullMath.mulDiv(
                gasCostInWei,
                FixedPoint96.Q96,
                sqrtPriceX96
            ).mulDiv(
                FixedPoint96.Q96,
                sqrtPriceX96
            );
            
        } else {
            // USDC is token1
            // Cost = gasCost * sqrtPrice^2 / 2^192
            
            uint256 priceSquared = FullMath.mulDiv(sqrtPriceX96, sqrtPriceX96, 1);
            return FullMath.mulDiv(gasCostInWei, priceSquared, Q192);
        }
    }
}
