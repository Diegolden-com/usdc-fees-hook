# Local Testing with Anvil

This guide explains how to test the `USDCFixedFeeHook` on a local Anvil chain.

## Prerequisites

- Foundry (Forge & Anvil) installed.

## Steps

### 1. Start Anvil

Open a terminal window and assume the role of the blockchain node.

```bash
anvil
```

### 2. Deploy V4 Core Contracts

In a **new** terminal window, deploy the Uniswap V4 core contracts (PoolManager, etc.) to your local Anvil chain.

```bash
forge script script/testing/00_DeployV4.s.sol \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### 3. Deploy USDCFixedFeeHook

Deploy the hook contract. This script will also deploy mock tokens if they aren't found (handled by `BaseScript`).

```bash
forge script script/DeployUSDCFixedFeeHook.s.sol \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

## Notes

- The `BaseScript` automatically detects chain ID `31337` (Anvil) and handles local deployments.
- The default private key `0xac09...` is one of the pre-funded accounts in Anvil.
