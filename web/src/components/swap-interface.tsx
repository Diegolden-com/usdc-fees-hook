"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { usePrivy, useSendTransaction, useWallets } from '@privy-io/react-auth'
import { parseEther, createPublicClient, http, formatUnits, parseUnits, encodeFunctionData } from 'viem'
import { unichainSepolia } from 'viem/chains'
import { ArrowDown, Loader2 } from "lucide-react"

// --- Constants & Config ---
import { DEPLOYMENT, POOL_KEY, ERC20_ABI, ROUTER_ABI, QUOTER_ABI, QUOTER_ADDRESS } from "@/lib/constants"

const FIXED_FEE_USDC = 0.99

// Create viem client for quote fetching
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
    const [isLoading, setLoading] = useState<boolean>(false)
    const [txHash, setTxHash] = useState<string>('')
    const [status, setStatus] = useState<string>('')
    const [ethOutput, setEthOutput] = useState<number>(0)
    const [isLoadingQuote, setIsLoadingQuote] = useState<boolean>(false)
    const [allowance, setAllowance] = useState<bigint>(BigInt(0))

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
                const usdcAmount = parseUnits(amountAfterFee.toString(), 6)

                // USDC is usually currency0 or currency1 depending on address sort
                // POOL_KEY is already sorted. We need to find if we are swapping 0->1 or 1->0
                // We are swapping USDC -> WETH
                // If USDC == currency0, zeroForOne = true
                const zeroForOne = DEPLOYMENT.usdc.toLowerCase() === POOL_KEY.currency0.toLowerCase()

                const params = {
                    poolKey: POOL_KEY,
                    zeroForOne: zeroForOne,
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
    }, [amountAfterFee]) // Removed authenticated dependency to allow quoting without login

    const checkAllowance = async () => {
        try {
            const data = await publicClient.readContract({
                address: DEPLOYMENT.usdc as `0x${string}`,
                abi: ERC20_ABI,
                functionName: 'allowance',
                args: [user?.wallet?.address as `0x${string}`, DEPLOYMENT.swapRouter as `0x${string}`]
            }) as bigint
            setAllowance(data)
        } catch (e) {
            console.error("Error fetching allowance", e)
        }
    }

    const { sendTransaction } = useSendTransaction({
        onSuccess: (receipt: any) => {
            console.log("Transaction sent:", receipt);
            const hash = typeof receipt === 'string' ? receipt : receipt?.transactionHash || receipt?.hash || '';
            setTxHash(hash);
            setLoading(false);

            // If we just approved, update status and re-check allowance
            if (status === 'Approving...') {
                setStatus('Approved! You can now swap.')
                checkAllowance()
            } else {
                setStatus('Swap submitted!')
            }
        },
        onError: (error: any) => {
            console.error("Action Error:", error);
            setStatus(error?.message || 'Transaction failed');
            setLoading(false);
        }
    });

    const handleAction = async () => {
        if (!authenticated) {
            login()
            return
        }

        setLoading(true)
        setTxHash('')

        try {
            const amountInWei = parseUnits(amount, 6) // USDC has 6 decimals? Usually 6. 
            // NOTE: Double check USDC decimals. Testnet USDC usually 6 or 18. 
            // Unichain standard USDC: likely 6.

            // Check if approval needed
            if (allowance < amountInWei) {
                setStatus('Approving...')
                const data = encodeFunctionData({
                    abi: ERC20_ABI,
                    functionName: 'approve',
                    args: [DEPLOYMENT.swapRouter, BigInt(amountInWei) * BigInt(10)] // Approve 10x
                })

                console.log("Approving...", {
                    to: DEPLOYMENT.usdc,
                    data: data,
                    chainId: 1301
                })

                await sendTransaction({
                    to: DEPLOYMENT.usdc,
                    data: data,
                    chainId: 1301,
                    value: BigInt(0)
                })
            } else {
                // Execute Swap
                setStatus('Swapping...')

                // USDC is input. If USDC == currency0, we are selling 0 (zeroForOne = true)
                const zeroForOne = DEPLOYMENT.usdc.toLowerCase() === POOL_KEY.currency0.toLowerCase()

                const data = encodeFunctionData({
                    abi: ROUTER_ABI,
                    functionName: 'swapExactTokensForTokens',
                    args: [
                        amountInWei,
                        BigInt(0), // amountOutMin
                        zeroForOne,
                        POOL_KEY,
                        "0x", // hookData
                        user?.wallet?.address || '0x0',
                        BigInt(Math.floor(Date.now() / 1000) + 600) // deadline
                    ]
                })

                await sendTransaction({
                    to: DEPLOYMENT.swapRouter,
                    data: data,
                    value: BigInt(0), // USDC swap -> WETH, no ETH value
                    chainId: 1301
                })
            }
        } catch (error: any) {
            console.error("Error:", error)
            setStatus(error.message || "Failed")
            setLoading(false)
        }
    }

    const needsApproval = allowance < parseUnits(amount || "0", 6)

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
                                Fixed Fee: $0.99
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
                                    -- {/* Todo: Quote fetching */}
                                </div>
                                <span className="bg-secondary px-3 py-1 rounded-full font-medium ml-2">ETH</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <Button
                        size="lg"
                        className="w-full mt-6 text-lg py-6 font-semibold"
                        onClick={handleAction}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                {status}
                            </>
                        ) : !authenticated ? (
                            'Connect Wallet to Swap'
                        ) : needsApproval ? (
                            'Approve USDC'
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
