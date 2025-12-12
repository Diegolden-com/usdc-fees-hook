"use client"

import { useState, useEffect } from "react"
import { DollarSign, TrendingDown, TrendingUp, Wallet } from "lucide-react"

export function HowItWorks() {
  const [currentStep, setCurrentStep] = useState(0)
  const [balance, setBalance] = useState(0)

  // Simulated swap history showing credits accumulating and being used
  const swapHistory = [
    { gasPrice: "low", actualGas: 0.8, fixedFee: 2.99, credit: 2.19, action: "Credit earned" },
    { gasPrice: "low", actualGas: 1.2, fixedFee: 2.99, credit: 1.79, action: "Credit earned" },
    { gasPrice: "medium", actualGas: 2.5, fixedFee: 2.99, credit: 0.49, action: "Credit earned" },
    { gasPrice: "high", actualGas: 8.0, fixedFee: 2.99, credit: -5.01, action: "Credit used" },
    { gasPrice: "low", actualGas: 0.9, fixedFee: 2.99, credit: 2.09, action: "Credit earned" },
    { gasPrice: "spike", actualGas: 25.0, fixedFee: 2.99, credit: -22.01, action: "Credit used" },
    { gasPrice: "low", actualGas: 1.1, fixedFee: 2.99, credit: 1.89, action: "Credit earned" },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        const next = (prev + 1) % swapHistory.length
        return next
      })
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let newBalance = 0
    for (let i = 0; i <= currentStep; i++) {
      newBalance += swapHistory[i].credit
    }
    setBalance(Math.max(0, newBalance))
  }, [currentStep])

  const features = [
    {
      icon: DollarSign,
      title: "Fixed Fees",
      description: "$2.99 (L1) or $0.99 (L2) per swap",
    },
    {
      icon: TrendingUp,
      title: "Self-Hedging",
      description: "Your savings cover your high-gas swaps",
    },
    {
      icon: Wallet,
      title: "No ETH Needed",
      description: "Pay only in USDC via ERC-4337 Paymaster",
    },
    {
      icon: TrendingDown,
      title: "Credit System",
      description: "Borrow up to 50% of lifetime contributions",
    },
  ]

  return (
    <section id="how-it-works" className="py-20 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            How It Works: Individual Gas Hedging
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto text-pretty">
            Accumulate credits during low-gas periods and use them during high-gas periods. You&apos;re hedging your own gas
            cost exposure—no pooled risk, no free-riders.
          </p>
        </div>

        {/* Interactive Balance Simulator */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 mb-16">
          <h3 className="text-lg font-semibold text-foreground mb-6 text-center">
            Balance Simulator: Watch Your Credits Grow
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Balance Display */}
            <div className="flex flex-col items-center justify-center bg-background rounded-xl p-8 border border-border">
              <p className="text-sm text-muted-foreground mb-2">Your Credit Balance</p>
              <p className="text-4xl sm:text-5xl font-bold font-mono text-accent">${balance.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-2">Credits available for high-gas swaps</p>
            </div>

            {/* Swap History */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground mb-3">Recent Swaps</p>
              <div className="h-[400px] overflow-y-auto space-y-3">
              {swapHistory.slice(0, currentStep + 1).map((swap, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    index === currentStep ? "bg-accent/10 border-accent" : "bg-background border-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        swap.gasPrice === "low"
                          ? "bg-green-500"
                          : swap.gasPrice === "medium"
                            ? "bg-yellow-500"
                            : swap.gasPrice === "high"
                              ? "bg-orange-500"
                              : "bg-red-500"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">Swap #{index + 1}</p>
                      <p className="text-xs text-muted-foreground">
                        Gas: ${swap.actualGas.toFixed(2)} → Fixed: ${swap.fixedFee}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`text-sm font-mono font-semibold ${
                      swap.credit > 0 ? "text-green-600" : "text-orange-600"
                    }`}
                  >
                    {swap.credit > 0 ? "+" : ""}${swap.credit.toFixed(2)}
                  </div>
                </div>
              ))}
              </div>
            </div>
          </div>
        </div>

        {/* Key Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="bg-card rounded-xl p-6 border border-border hover:border-accent/50 transition">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            No pool risk - your balance is yours
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            No free-riders - individual accounting
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Built on Uniswap v4 infrastructure
          </div>
        </div>
      </div>
    </section>
  )
}
