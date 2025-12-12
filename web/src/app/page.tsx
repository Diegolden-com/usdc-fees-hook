import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { HowItWorks } from "@/components/how-it-works"
import { Benefits } from "@/components/benefits"
import { SwapInterface } from "@/components/swap-interface"
import { CTA } from "@/components/cta"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
      <Benefits />
      <SwapInterface />
      <CTA />
      <Footer />
    </main>
  )
}
