"use client"

import { Button } from "@/components/ui/button"

export function CTA() {
  return (
    <section className="py-20 sm:py-32 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border-y border-border">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Ready to Get Started?</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
          Join thousands of traders already using USDC Hook for predictable, transparent swaps. Start trading with fixed
          fees today.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8">
            Launch App
          </Button>
          <Button size="lg" variant="outline" className="border-border hover:bg-muted px-8 bg-transparent">
            Read Whitepaper
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mt-6">No credit card required. Start with as little as $10.</p>
      </div>
    </section>
  )
}
