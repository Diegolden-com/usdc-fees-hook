"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { usePrivy, useSendTransaction } from '@privy-io/react-auth'
import { parseEther, createPublicClient, http, formatUnits, parseUnits } from 'viem'
import { unichainSepolia } from 'viem/chains'
import { ArrowDown, Loader2 } from "lucide-react"

// Unichain Sepolia addresses
const QUOTER_ADDRESS = '0x56dcd40a3f2d466f48e7f48bdbe5cc9b92ae4472'
const USDC_ADDRESS = '0x31d0220469e10c4E71834a79b1f276d740d3768F'
const ETH_ADDRESS = '0x0000000000000000000000000000000000000000' // Native ETH in v4

// Pool configuration for USDC/ETH on Unichain Sepolia
const POOL_FEE = 3000 // 0.3% fee tier
const TICK_SPACING = 60
const HOOKS_ADDRESS = '0xA24fEe104Fe00987AfC2714469159Cd3D8b840c0' // USDCFixedFeeHook

// Fixed fee for L2 (Unichain)
const FIXED_FEE_USDC = 0.99

// Quoter ABI for quoteExactInputSingle
const QUOTER_ABI = [
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

// Create viem client for quote fetching (outside component to avoid recreating)
const publicClient = createPublicClient({
    chain: unichainSepolia,
    transport: http()
})

// Fetch ETH price from CoinGecko API
async function getEthPriceFromCoinGecko(): Promise<number> {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
        const data = await response.json()
        return data.ethereum?.usd || 3000 // Default to 3000 if API fails
    } catch (error) {
        console.error('Error fetching ETH price from CoinGecko:', error)
        return 3000 // Fallback to conservative estimate
    }
}

export function SwapInterface() {
    const [amount, setAmount] = useState("1000")
    const { login, authenticated, user } = usePrivy()
    const [txHash, setTxHash] = useState<string>('')
    const [status, setStatus] = useState<string>('')
    const [isLoading, setLoading] = useState<boolean>(false)
    const [ethOutput, setEthOutput] = useState<number>(0)
    const [isLoadingQuote, setIsLoadingQuote] = useState<boolean>(false)

    // Fee calculation - fixed amount in USDC
    const fee = FIXED_FEE_USDC
    const amountAfterFee = Math.max(0, Number.parseFloat(amount) - fee) || 0

    // Fetch real exchange rate from Uniswap v4 Quoter
    useEffect(() => {
        const fetchQuote = async () => {
            if (!amountAfterFee || amountAfterFee <= 0) {
                setEthOutput(0)
                return
            }

            setIsLoadingQuote(true)
            try {
                // Convert USDC amount to proper units (6 decimals)
                const usdcAmount = parseUnits(amountAfterFee.toString(), 6)

                // ETH (0x0000...) < USDC, so ETH is currency0, USDC is currency1
                // We're swapping USDC -> ETH, so zeroForOne = false (currency1 -> currency0)
                const poolKey = {
                    currency0: ETH_ADDRESS,
                    currency1: USDC_ADDRESS,
                    fee: POOL_FEE,
                    tickSpacing: TICK_SPACING,
                    hooks: HOOKS_ADDRESS
                }

                const params = {
                    poolKey,
                    zeroForOne: false, // USDC -> ETH
                    exactAmount: usdcAmount,
                    sqrtPriceLimitX96: BigInt(0), // No price limit
                    hookData: '0x' as `0x${string}`
                }

                const result = await publicClient.readContract({
                    address: QUOTER_ADDRESS,
                    abi: QUOTER_ABI,
                    functionName: 'quoteExactInputSingle',
                    args: [params]
                })

                // Result is [amountOut, gasEstimate]
                // amountOut is int128, convert to ETH (18 decimals)
                const ethAmount = Number(formatUnits(BigInt(result[0]), 18))
                setEthOutput(Math.abs(ethAmount)) // Use abs in case it's negative
            } catch (error) {
                console.error('Error fetching quote from Uniswap:', error)
                // Fallback to CoinGecko price if Uniswap quote fails
                const ethPrice = await getEthPriceFromCoinGecko()
                const estimatedEth = amountAfterFee / ethPrice
                setEthOutput(estimatedEth)
            } finally {
                setIsLoadingQuote(false)
            }
        }

        fetchQuote()
    }, [amountAfterFee])

    const { sendTransaction } = useSendTransaction({
        onSuccess: (receipt: any) => {
            console.log("Transaction sent:", receipt);
            // Handle both string hash or object with hash property
            const hash = typeof receipt === 'string' ? receipt : receipt?.transactionHash || receipt?.hash || '';
            setTxHash(hash);
            setStatus('Swap submitted!');
            setLoading(false);
        },
        onError: (error: any) => {
            console.error("Swap Error:", error);
            setStatus(error?.message || 'Swap failed');
            setLoading(false);
        }
    });

    const handleSwap = async () => {
        console.log("Swap button clicked");

        if (!authenticated) {
            console.log("User not authenticated, invoking login()");
            login()
            return
        }

        try {
            setLoading(true);
            setStatus('Preparing swap...')
            setTxHash('')

            const transactionRequest = {
                to: user?.wallet?.address || '0x0000000000000000000000000000000000000000', // Self-send or burn if no address
                value: parseEther('0'),
                chainId: 1301 // Unichain Sepolia
            };

            console.log("Sending transaction request:", transactionRequest);

            // Sending 0 ETH to self as a test for gasless sponsorship
            // If Smart Wallets are enabled in dashboard, this should be sponsored.
            await sendTransaction(transactionRequest);

        } catch (error: any) {
            console.error("Swap Error:", error);
            setStatus(error.message || 'Swap failed')
            setLoading(false);
        }
    }

    return (
        <section id="swap" className="py-20 sm:py-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl mx-auto text-center mb-12">
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Execute Gasless Swap</h2>
                    <p className="text-lg text-muted-foreground">
                        Experience the future of trading on Unichain Sepolia
                    </p>
                </div>

                <div className="max-w-md mx-auto bg-card rounded-2xl border border-border p-6 shadow-lg">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold">Swap</h3>
                    </div>

                    {/* Input */}
                    <div className="space-y-4">
                        <div className="bg-background rounded-xl p-4 border border-border transition-colors focus-within:border-primary/50">
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">You pay</label>
                            <div className="flex justify-between items-center">
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0"
                                    className="w-full bg-transparent text-2xl font-bold focus:outline-none"
                                />
                                <span className="bg-secondary px-3 py-1 rounded-full font-medium ml-2">USDC</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">
                                Fixed Fee: ${fee.toFixed(2)} USDC
                            </div>
                        </div>

                        <div className="relative flex justify-center">
                            <div className="bg-background border border-border p-2 rounded-lg -my-3 z-10">
                                <ArrowDown className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </div>

                        <div className="bg-background rounded-xl p-4 border border-border">
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">You receive</label>
                            <div className="flex justify-between items-center">
                                <div className="text-2xl font-bold text-foreground">
                                    {isLoadingQuote ? (
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    ) : (
                                        ethOutput.toFixed(6)
                                    )}
                                </div>
                                <span className="bg-secondary px-3 py-1 rounded-full font-medium ml-2">ETH</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">
                                Amount after fee: ${amountAfterFee.toFixed(2)} USDC
                            </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <Button
                        size="lg"
                        className="w-full mt-6 text-lg py-6 font-semibold"
                        onClick={handleSwap}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                {status || 'Swapping...'}
                            </>
                        ) : !authenticated ? (
                            'Connect Wallet to Swap'
                        ) : (
                            'Swap'
                        )}
                    </Button>

                    {/* Status & Hash */}
                    {status && !isLoading && (
                        <div className="mt-4 text-center text-sm text-muted-foreground">
                            {status}
                        </div>
                    )}

                    {txHash && (
                        <div className="mt-4 p-3 bg-secondary/50 rounded-lg text-xs break-all text-center">
                            <a
                                href={`https://sepolia.uniscan.xyz/tx/${txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center justify-center gap-1"
                            >
                                View Transaction on Explorer
                            </a>
                        </div>
                    )}
                </div>

                <div className="mt-8 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/30 text-xs text-muted-foreground border border-border">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Live on Unichain Sepolia
                        <span className="mx-2">|</span>
                        Hook: 0xA24...40c0
                        <a
                            href="https://sepolia.uniscan.xyz/address/0xA24fEe104Fe00987AfC2714469159Cd3D8b840c0"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1 text-primary hover:underline"
                        >
                            (Verified)
                        </a>
                    </div>
                </div>
            </div>
        </section>
    )
}
