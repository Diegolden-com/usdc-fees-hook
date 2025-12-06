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

contract USDCFixedFeeHook is BaseHook {
    using SafeCast for uint256;
    using PoolIdLibrary for PoolKey;
    using CurrencyLibrary for Currency;

    // State variables
    mapping(address => int256) public userBalance;
    mapping(address => uint256) public lifetimeContribution;
    
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

    function _beforeSwap(address sender, PoolKey calldata, SwapParams calldata, bytes calldata)
        internal
        override
        returns (bytes4, BeforeSwapDelta, uint24)
    {
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

    function _afterSwap(address sender, PoolKey calldata, SwapParams calldata, BalanceDelta, bytes calldata)
        internal
        override
        returns (bytes4, int128)
    {
        // 1. Estimate actual gas cost in USDC
        uint256 actualGasCostUSDC = _estimateGasCostUSDC();

        // 2. Calculate surplus/deficit
        int256 delta = int256(FIXED_FEE_USDC) - int256(actualGasCostUSDC);

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

    function _estimateGasCostUSDC() internal pure returns (uint256) {
        // Placeholder for TWAP oracle logic
        // In production: Get ETH price in USDC from pool, multiply by tx.gasprice * ESTIMATED_GAS_PER_SWAP
        
        // For now, let's assume a static gas price or just return a mock value
        // Mock: 1.50 USDC (1.5 * 10^6)
        return 1500000; 
    }
}
