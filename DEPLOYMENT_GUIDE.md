# Deployment Guide

This guide explains how to deploy the `USDCFixedFeeHook` to a live network (e.g., Base Sepolia, Unichain Testnet).

## Prerequisites

- Access to an RPC URL for the target network.
- A private key with funds (ETH) for gas.
- Correct addresses for USDC on the target network.

## Configuration

## Address Mining

Uniswap v4 hooks require specific flags to be encoded in their address to enable callbacks (e.g., `BEFORE_SWAP`, `AFTER_SWAP`). This means you cannot simply deploy the contract; you must "mine" a salt that, when combined with the deployer address and bytecode, produces a contract address with the correct leading bits.

The `script/DeployUSDCFixedFeeHook.s.sol` script handles this automatically using `HookMiner.find`:

```solidity
(address hookAddress, bytes32 salt) =
    HookMiner.find(CREATE2_FACTORY, flags, type(USDCFixedFeeHook).creationCode, constructorArgs);
```

This brute-forces a salt in the script. For more complex flag combinations, this might take a few seconds or minutes.

## Unichain Testnet Deployment

**Unichain Testnet (Sepolia) Information:**
- **Chain ID:** 1301
- **Pool Manager:** `0x00b036b58a818b1bc34d502d3fe730db729e62ac`
- **RPC URL:** `https://sepolia.unichain.org` (or other provider)
- **Explorer:** `https://sepolia.uniscan.xyz`

**Note:** The included `script/base/BaseScript.sol` uses `hookmate/AddressConstants` which **already supports Unichain Testnet (Chain ID 1301)**. You do not need to manually override the `poolManager` address.

To deploy to Unichain Testnet:

```bash
forge script script/DeployUSDCFixedFeeHook.s.sol \
  --rpc-url https://sepolia.unichain.org \
  --broadcast \
  --private-key <YOUR_PRIVATE_KEY> \
  --verify \
  --etherscan-api-key <YOUR_ETHERSCAN_API_KEY> \
  --verifier-url https://api-sepolia.uniscan.xyz/api
```

### 1. Verify Token Addresses
...

The deployment script relies on `script/base/BaseScript.sol` for token configuration.
**Before deploying to a live network, verify that `token0` and `token1` in `BaseScript.sol` match the token addresses you want to use (e.g., USDC).**

File: `script/base/BaseScript.sol`

```solidity
IERC20 internal constant token0 = IERC20(0x...); // Update this
IERC20 internal constant token1 = IERC20(0x...); // Update this
```

The hook treats `currency0` (which is the sorted token0) as the USDC token in the current script logic:
```solidity
USDCFixedFeeHook hook = new USDCFixedFeeHook{salt: salt}(IPoolManager(address(poolManager)), currency0, fixedFee);
```
*Note: Ensure `token0` is actually the USDC token you intend to use, or adjust the script to select the correct currency.*

## Deployment Command

To deploy to a live network, use the following command, replacing the placeholders:

```bash
forge script script/DeployUSDCFixedFeeHook.s.sol \
  --rpc-url <YOUR_RPC_URL> \
  --broadcast \
  --private-key <YOUR_PRIVATE_KEY> \
  --verify \
  --etherscan-api-key <YOUR_ETHERSCAN_API_KEY>
```

### Example (Base Sepolia)

```bash
forge script script/DeployUSDCFixedFeeHook.s.sol \
  --rpc-url https://sepolia.base.org \
  --broadcast \
  --private-key $PRIVATE_KEY \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY
```

## Verification

The `--verify` flag will automatically verify the contract on Etherscan/Basescan if you provide the API key.
