"use client"

import Image from "next/image"
import { Shield, Zap, Globe, Lock, TrendingDown, Coins, ExternalLink } from "lucide-react"

export function Features() {
  const features = [
    {
      icon: Coins,
      title: "Fixed $2.99 or $0.99 Fees",
      description: "Pay $2.99 on Mainnet or $0.99 on L2s. Always. No matter what gas prices do.",
    },
    {
      icon: Shield,
      title: "Your Balance, Your Control",
      description: "No pooled risk. Credits you accumulate are yours alone—no free-riders.",
    },
    {
      icon: TrendingDown,
      title: "Hedge Your Own Gas",
      description: "Low-gas swaps build credits. High-gas swaps use them. Self-balancing protection.",
    },
    {
      icon: Lock,
      title: "No ETH Required",
      description: "Pay everything in USDC via ERC-4337 Paymaster. Simplify your treasury.",
    },
    {
      icon: Globe,
      title: "Multi-Chain Ready",
      description: "Available on Ethereum, Base, Arbitrum, and Unichain with unified experience.",
    },
    {
      icon: Zap,
      title: "Uniswap v4 Native",
      description: "Built on battle-tested Uniswap v4 infrastructure for security and liquidity.",
    },
  ]

  return (
    <section id="features" className="py-20 sm:py-32 bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            The Gas Cost Problem, Solved
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Gas fees spike 10-100x during network congestion. CFOs can&apos;t budget for that. Neither can you.
          </p>
        </div>

        <div className="mb-16">
          <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl border border-primary/20 p-6 mb-8">
            <div className="flex items-start gap-4">
              <ExternalLink className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">See Real Data</h3>
                <p className="text-muted-foreground text-sm mb-3">
                  Check out this{" "}
                  <a
                    href="https://dune.com/topboynotch/uniswap-v4-analysis"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    Dune dashboard showing Uniswap v4 gas price spikes
                  </a>{" "}
                  to see how dramatically gas costs fluctuate throughout the day.
                </p>
              </div>
            </div>
          </div>

          <h3 className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-8">
            Industry Leaders Recognize the Problem
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Vitalik's gas futures market tweet */}
            <div className="bg-background rounded-xl border border-border overflow-hidden hover:border-accent/50 transition">
              <div className="relative w-full h-auto">
                <Image
                  src="/images/vitalik-gas-futures-tweet.png"
                  alt="Vitalik Buterin discussing gas futures markets and hedging against gas prices"
                  width={600}
                  height={400}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </div>
            {/* Adam's tweet about stablecoin payments */}
            <div className="bg-background rounded-xl border border-border overflow-hidden hover:border-accent/50 transition">
              <div className="relative w-full h-auto">
                <Image
                  src="/images/adam-tweet.png"
                  alt="Adam discussing Stripe rolling out USD-settled stablecoin payments"
                  width={600}
                  height={400}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-background rounded-2xl border border-border p-6 sm:p-8 mb-16 max-w-3xl mx-auto">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-6 rounded-xl bg-red-50 border border-red-200">
              <h4 className="font-semibold text-foreground mb-4">Traditional DeFi</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Low congestion:</span>
                  <span className="font-mono text-foreground">$0.50</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">High congestion:</span>
                  <span className="font-mono text-red-600 font-semibold">$30-50</span>
                </div>
              </div>
            </div>
            <div className="p-6 rounded-xl bg-green-50 border border-green-200">
              <h4 className="font-semibold text-foreground mb-4">With Fixed-Fee Hook</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">L1 (Mainnet):</span>
                  <span className="font-mono text-green-600 font-semibold">$2.99</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">L2 (Base, etc.):</span>
                  <span className="font-mono text-green-600 font-semibold">$0.99</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-background rounded-xl p-8 border border-border hover:border-accent/50 transition"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
