import { useState, useEffect, useCallback } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { createPublicClient, http, formatUnits, parseAbi } from 'viem'
import { unichainSepolia } from 'viem/chains'
import { DEPLOYMENT, ERC20_ABI } from '@/lib/constants'

const publicClient = createPublicClient({
    chain: unichainSepolia,
    transport: http()
})

export function useWalletBalances() {
    const { user, authenticated } = usePrivy()
    const [balances, setBalances] = useState({ eth: '0', usdc: '0' })
    const [isLoading, setIsLoading] = useState(false)

    const fetchBalances = useCallback(async () => {
        if (!authenticated || !user?.wallet?.address) {
            setBalances({ eth: '0', usdc: '0' })
            return
        }

        setIsLoading(true)
        try {
            const address = user.wallet.address as `0x${string}`

            const [ethBalance, usdcBalance] = await Promise.all([
                publicClient.getBalance({ address }),
                publicClient.readContract({
                    address: DEPLOYMENT.usdc,
                    abi: ERC20_ABI,
                    functionName: 'balanceOf',
                    args: [address]
                })
            ])

            setBalances({
                eth: Number(formatUnits(ethBalance, 18)).toFixed(4),
                usdc: Number(formatUnits(usdcBalance as bigint, 6)).toFixed(2)
            })
        } catch (error) {
            console.error('Error fetching balances:', error)
        } finally {
            setIsLoading(false)
        }
    }, [authenticated, user?.wallet?.address])

    useEffect(() => {
        fetchBalances()
    }, [fetchBalances])

    return { balances, isLoading, refetch: fetchBalances }
}
