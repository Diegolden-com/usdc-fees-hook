// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {HookMiner} from "@uniswap/v4-periphery/src/utils/HookMiner.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";

import {BaseScript} from "./base/BaseScript.sol";
import {USDCFixedFeeHook} from "../src/USDCFixedFeeHook.sol";
import {console2} from "forge-std/Script.sol";

/// @notice Mines the address and deploys the USDCFixedFeeHook contract
contract DeployUSDCFixedFeeHook is BaseScript {
    function run() public {
        // hook contracts must have specific flags encoded in the address
        uint160 flags = uint160(
            Hooks.BEFORE_SWAP_FLAG | Hooks.AFTER_SWAP_FLAG
        );

        // Define generic/test fixed fee (e.g., 1 USDC if 6 decimals)
        // For testing, we can use 1 * 10^6
        uint256 fixedFee = 1 * 10**6; 

        // Mine a salt that will produce a hook address with the correct flags
        bytes memory constructorArgs = abi.encode(poolManager, currency0, fixedFee);
        (address hookAddress, bytes32 salt) =
            HookMiner.find(CREATE2_FACTORY, flags, type(USDCFixedFeeHook).creationCode, constructorArgs);

        // Deploy the hook using CREATE2
        vm.startBroadcast();
        USDCFixedFeeHook hook = new USDCFixedFeeHook{salt: salt}(IPoolManager(address(poolManager)), currency0, fixedFee);
        vm.stopBroadcast();

        require(address(hook) == hookAddress, "DeployHookScript: Hook Address Mismatch");
        
        console2.log("USDCFixedFeeHook deployed at:", address(hook));
        console2.log("Currency0 (USDC Proxy):", Currency.unwrap(currency0));
        console2.log("Fixed Fee:", fixedFee);
    }
}
