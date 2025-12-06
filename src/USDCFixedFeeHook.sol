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
import "forge-std/console.sol";


contract USDCFixedFeeHook is BaseHook {
    using StateLibrary for IPoolManager;

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

    error CreditLimitExceeded();
    error InsufficientUSDCAllowance();

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

    function _beforeSwap(address sender, PoolKey calldata key, SwapParams calldata, bytes calldata)
        internal
        override
        returns (bytes4, BeforeSwapDelta, uint24)
    {
        // Update TWAP
        // _updateTWAP(key); // Commented out to isolate error
        // If tests pass without this, the issue is in _updateTWAP.
        
        _updateTWAP(key);

        // Collect fixed fee
        // In a real implementation, we might want to use a permit or check allowance
        // For this MVP, we assume the user has approved the hook to spend USDC
        // Note: sender in v4 hooks might be the router, so we need to be careful about who pays.
        // For simplicity here, we assume tx.origin or we'd need to pass the user address in hook data.
        // Let's assume the sender is the user for now.
        
        // Transfer USDC from user to this hook
        // IERC20(Currency.unwrap(USDC)).transferFrom(sender, address(this), FIXED_FEE_USDC);
        
        // In v4, we might want to take the fee from the swap amount if it's a USDC pair, 
        // but the requirement is a fixed fee. 
        // Let's assume we just track the obligation here and settle in afterSwap or separate tx?
        // The README says "Users pay a fixed USDC fee for every swap".
        
        // Let's actually transfer it.
        // NOTE: This requires the user to have approved the hook.
        // We use safeTransferFrom in production, but standard interface here.
        IERC20(Currency.unwrap(USDC)).transferFrom(sender, address(this), FIXED_FEE_USDC);

        return (BaseHook.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }

    function _afterSwap(address sender, PoolKey calldata key, SwapParams calldata, BalanceDelta, bytes calldata)
        internal
        override
        returns (bytes4, int128)
    {
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
            userBalance[sender] += delta;
            lifetimeContribution[sender] += uint256(delta);
        } else {
            // Deficit: User draws down credits
            // Check credit limit: 50% of lifetime contributions
            uint256 creditLimit = lifetimeContribution[sender] / 2;
            
            // If new balance would be less than negative credit limit, revert
            if (userBalance[sender] + delta < -int256(creditLimit)) {
                revert CreditLimitExceeded();
            }
            
            userBalance[sender] += delta;
        }

        return (BaseHook.afterSwap.selector, 0);
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
            int56 newCumulativeTick = latest.cumulativeTick + int56(currentTick) * int56(uint56(timeElapsed));
            
            // If window passed, overwrite old observation (index 1-lastObservationIndex)
            // Actually, for a ring buffer of 2, we just toggle.
            // But we want to keep "latest" and "oldest".
            // If timeElapsed > TWAP_WINDOW, we should shift.
            // Simplified: Always update "latest" (index 0). If time > window, move current latest to "old" (index 1) then update latest.
            
            // Wait, standard way:
            // Write new observation if enough time passed?
            // Or just update cumulative tick on EVERY swap?
            // We update cumulative tick on every swap.
            // We only need to store a SNAPSHOT if we want to calculate average over a window.
            
            // Let's just update the CURRENT slot with new cumulative tick.
            // And if the OLD slot is too old (older than window), we overwrite it with the PREVIOUS current slot?
            // No, that's getting complicated.
            
            // Simple Ring Buffer of 2:
            // Slot 0: Always the LATEST cumulative tick.
            // Slot 1: A snapshot from ~1 hour ago.
            
            // Logic:
            // 1. Update cumulative tick based on time elapsed since Slot 0's timestamp.
            // 2. If (Slot 0 timestamp - Slot 1 timestamp) > TWAP_WINDOW:
            //    Copy Slot 0 to Slot 1.
            // 3. Update Slot 0 with new cumulative tick and new timestamp.
            
            // But wait, we need the cumulative tick BEFORE adding the new time delta?
            // No, cumulative tick is integral of tick * time.
            
            int56 nextCumulativeTick = latest.cumulativeTick + int56(currentTick) * int56(uint56(timeElapsed));
            
            Observation memory oldest = observations[1]; // Fixed index for oldest
            
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
        
        if (!latest.initialized) return 0;
        if (!oldest.initialized) return 0; // Should handle this better, maybe return current tick?
        
        uint32 timeDelta = latest.timestamp - oldest.timestamp;
        if (timeDelta == 0) return 0; // Avoid div by zero
        
        int56 tickCumDelta = latest.cumulativeTick - oldest.cumulativeTick;
        
        return int24(tickCumDelta / int56(uint56(timeDelta)));
    }

    function _estimateGasCostUSDC(PoolKey calldata key) internal view returns (uint256) {
        // 1. Get TWAP Tick (ETH/USDC price)
        int24 twapTick = getTWAPTick();
        
        // If TWAP is 0 (not enough history), fallback to current tick
        if (twapTick == 0) {
            (, int24 currentTick,,) = poolManager.getSlot0(key.toId());
            twapTick = currentTick;
        }
        
        uint160 sqrtPriceX96 = TickMath.getSqrtPriceAtTick(twapTick);
        uint256 gasPrice = tx.gasprice;
        // Default to a reasonable gas price if tx.gasprice is 0 (e.g. in some test envs)
        if (gasPrice == 0) gasPrice = 10 gwei; 
        
        uint256 gasCostInWei = gasPrice * ESTIMATED_GAS_PER_SWAP;
        
        if (key.currency0 == USDC) {
            // USDC is token0, ETH (or other) is token1
            // Price P = token1 / token0
            // We have gasCost in token1 (ETH)
            // Cost in token0 = gasCost / P
            // P = sqrtPrice^2 / 2^192
            // Cost = gasCost * 2^192 / sqrtPrice^2
            
            // To avoid overflow/underflow with 2^192, we use FullMath
            // numerator = gasCost * 2^192
            // denominator = sqrtPrice * sqrtPrice
            
            // We can do: (gasCost * 2^96 / sqrtPrice) * 2^96 / sqrtPrice
            // But gasCost * 2^192 might overflow 256 bits?
            // gasCost ~ 0.01 ETH = 1e16 wei. 2^192 ~ 6e57. Product ~ 6e73. Fits in uint256 (1e77).
            // So we can try mulDiv.
            
            uint256 priceSquared = FullMath.mulDiv(sqrtPriceX96, sqrtPriceX96, 1); // just sqr
            // Cost = gasCost * 2^192 / priceSquared
            // But we can't pass 2^192 directly if it overflows with gasCost?
            // Wait, mulDiv(a, b, c) computes a*b/c.
            // We want gasCost * (2^192 / priceSquared).
            // Or (gasCost * 2^192) / priceSquared.
            
            // Let's use the inverse price relationship.
            // 1/P = 2^192 / sqrtPrice^2
            // Cost = gasCost * (1/P)
            
            // We can compute 2^192 / priceSquared first?
            // Or better:
            // Cost = mulDiv(gasCost, 1 << 192, priceSquared);
            
            return FullMath.mulDiv(gasCostInWei, 1 << 192, priceSquared);
            
        } else {
            // USDC is token1, ETH is token0
            // Price P = token1 / token0 (USDC / ETH)
            // We have gasCost in token0 (ETH)
            // Cost in token1 = gasCost * P
            // Cost = gasCost * sqrtPrice^2 / 2^192
            
            uint256 priceSquared = FullMath.mulDiv(sqrtPriceX96, sqrtPriceX96, 1);
            return FullMath.mulDiv(gasCostInWei, priceSquared, 1 << 192);
        }
    }
}
