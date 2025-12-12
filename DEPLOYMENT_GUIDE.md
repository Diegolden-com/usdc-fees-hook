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
- **RPC URL:** `https://sepolia.unichain.org`
- **Explorer:** `https://sepolia.uniscan.xyz`

**Important: Tokens**
The deployment script now supports environment variables for token addresses.
- **USDC (Unichain Sepolia):** `0x31d0220469e10c4E71834a79b1f276d740d3768F`
- **Token1 (Dummy/Arb):** `0x4200000000000000000000000000000000000006` (Used to ensure correct ordering if needed, or simply another test token)

### Deployment Command

To deploy to Unichain Testnet with the correct USDC address:

```bash
# Set environment variables for tokens (USDC and a secondary token)
export TOKEN0=0x31d0220469e10c4E71834a79b1f276d740d3768F
export TOKEN1=0x4200000000000000000000000000000000000006

forge script script/DeployUSDCFixedFeeHook.s.sol \
  --rpc-url unichain_sepolia \
  --broadcast \
  --private-key <YOUR_PRIVATE_KEY> \
  --verify
```

*Note: The script automatically sorts `TOKEN0` and `TOKEN1` to determine `currency0` and `currency1`. Ensure `TOKEN0` is the address you intend to be the USDC fee token if that's how your logic expects it, or check the logs.*

### 1. Verify Token Addresses

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
