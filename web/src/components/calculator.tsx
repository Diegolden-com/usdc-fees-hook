"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function Calculator() {
  const [amount, setAmount] = useState("1000")
  const FEE_PERCENTAGE = 0.05
  const fee = (Number.parseFloat(amount) * FEE_PERCENTAGE) / 100 || 0
  const total = Number.parseFloat(amount) - fee || 0

  return (
    <section id="calculator" className="py-20 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Fee Calculator</h2>
            <p className="text-lg text-muted-foreground">
              See exactly how much you&apos;ll pay with our transparent fixed-fee model
            </p>
          </div>

          <div className="bg-card rounded-lg p-8 border border-border">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Amount to Swap (USDC)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                  placeholder="Enter amount"
                />
              </div>

              <div className="bg-background rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Input Amount</span>
                  <span className="font-semibold text-foreground">${Number.parseFloat(amount).toLocaleString()}</span>
                </div>
                <div className="border-t border-border" />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Fixed Fee (0.05%)</span>
                  <span className="font-semibold text-accent">${fee.toFixed(4)}</span>
                </div>
                <div className="border-t border-border" />
                <div className="flex justify-between items-center">
                  <span className="text-foreground font-semibold">You Receive</span>
                  <span className="font-bold text-lg text-foreground">
                    ${total.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                  </span>
                </div>
              </div>

              <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Execute Swap
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
