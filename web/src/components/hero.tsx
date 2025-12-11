"use client"

import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-32 lg:py-40">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-muted px-3 py-1 rounded-full mb-6">
            <span className="w-2 h-2 bg-accent rounded-full" />
            <span className="text-xs font-medium text-muted-foreground">New: Batch operations now available</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Fixed-Fee Swaps
            <span className="block text-accent">No More Gas Surprises</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Predictable pricing for USDC swaps. Institutions and traders save on variable gas costs while maintaining
            security and transparency.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8">
              Start Trading
            </Button>
            <Button size="lg" variant="outline" className="border-border hover:bg-muted px-8 bg-transparent">
              View Documentation
            </Button>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-accent mb-1">0.05%</div>
              <p className="text-xs sm:text-sm text-muted-foreground">Fixed Fee</p>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-accent mb-1">100M+</div>
              <p className="text-xs sm:text-sm text-muted-foreground">Daily Volume</p>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-accent mb-1">$2M+</div>
              <p className="text-xs sm:text-sm text-muted-foreground">Gas Saved</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
