export const DEPLOYMENT = {
    poolManager: "0x00B036B58a818B1BC34d502D3fE730Db729e62AC",
    swapRouter: "0x9cD2b0a732dd5e023a5539921e0FD1c30E198Dba",
    hook: "0xA24fEe104Fe00987AfC2714469159Cd3D8b840c0",
    usdc: "0x31d0220469e10c4E71834a79b1f276d740d3768F",
    weth: "0x4200000000000000000000000000000000000006"
} as const

export const POOL_KEY = {
    currency0: DEPLOYMENT.usdc < DEPLOYMENT.weth ? DEPLOYMENT.usdc : DEPLOYMENT.weth,
    currency1: DEPLOYMENT.usdc < DEPLOYMENT.weth ? DEPLOYMENT.weth : DEPLOYMENT.usdc,
    fee: 3000,
    tickSpacing: 60,
    hooks: DEPLOYMENT.hook
} as const

export const QUOTER_ADDRESS = '0x56dcd40a3f2d466f48e7f48bdbe5cc9b92ae4472' as const

export const ERC20_ABI = [
    {
        name: 'approve',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
        outputs: [{ name: '', type: 'bool' }]
    },
    {
        name: 'allowance',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
    },
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
    },
    {
        name: 'decimals',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint8' }]
    }
] as const

export const ROUTER_ABI = [
    {
        name: 'swapExactTokensForTokens',
        type: 'function',
        stateMutability: 'payable',
        inputs: [
            { name: 'amountIn', type: 'uint256' },
            { name: 'amountOutMin', type: 'uint256' },
            { name: 'zeroForOne', type: 'bool' },
            {
                name: 'poolKey',
                type: 'tuple',
                components: [
                    { name: 'currency0', type: 'address' },
                    { name: 'currency1', type: 'address' },
                    { name: 'fee', type: 'uint24' },
                    { name: 'tickSpacing', type: 'int24' },
                    { name: 'hooks', type: 'address' }
                ]
            },
            { name: 'hookData', type: 'bytes' },
            { name: 'receiver', type: 'address' },
            { name: 'deadline', type: 'uint256' }
        ],
        outputs: [{ name: 'delta', type: 'int256' }]
    }
] as const

export const QUOTER_ABI = [
    {
        inputs: [
            {
                components: [
                    {
                        components: [
                            { name: 'currency0', type: 'address' },
                            { name: 'currency1', type: 'address' },
                            { name: 'fee', type: 'uint24' },
                            { name: 'tickSpacing', type: 'int24' },
                            { name: 'hooks', type: 'address' }
                        ],
                        name: 'poolKey',
                        type: 'tuple'
                    },
                    { name: 'zeroForOne', type: 'bool' },
                    { name: 'exactAmount', type: 'uint128' },
                    { name: 'sqrtPriceLimitX96', type: 'uint160' },
                    { name: 'hookData', type: 'bytes' }
                ],
                name: 'params',
                type: 'tuple'
            }
        ],
        name: 'quoteExactInputSingle',
        outputs: [
            { name: 'amountOut', type: 'int128' },
            { name: 'gasEstimate', type: 'uint256' }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    }
] as const
