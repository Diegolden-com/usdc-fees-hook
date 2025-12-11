"use client"

import { Building2, Users, Code2, CheckCircle } from "lucide-react"

export function Benefits() {
  const benefitGroups = [
    {
      icon: Building2,
      title: "For Institutions",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      benefits: [
        "Predictable quarterly budgets",
        "Simplified compliance and auditing",
        "Risk management for treasury operations",
        "CFO-approved cost forecasting",
      ],
    },
    {
      icon: Users,
      title: "For Retail Users",
      color: "text-green-600",
      bgColor: "bg-green-50",
      benefits: [
        "Budget exactly for DeFi strategies",
        "Build credits over time",
        "No more gas price anxiety",
        "Perfect for DCA strategies",
      ],
    },
    {
      icon: Code2,
      title: "For Developers",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      benefits: [
        "Integrate via standard Uniswap v4 SDK",
        "ERC-4337 Paymaster support",
        "Multi-chain deployment ready",
        "Open-source and transparent",
      ],
    },
  ]

  return (
    <section id="benefits" className="py-20 sm:py-32 bg-card border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Built for Everyone in DeFi
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Whether you&apos;re managing institutional assets, trading personally, or building the next DeFi app—predictable
            costs change everything.
          </p>
        </div>

        {/* Three-Column Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefitGroups.map((group, index) => (
            <div
              key={index}
              className="bg-background rounded-2xl p-8 border border-border hover:shadow-lg transition-shadow"
            >
              <div className={`w-14 h-14 rounded-xl ${group.bgColor} flex items-center justify-center mb-6`}>
                <group.icon className={`w-7 h-7 ${group.color}`} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-6">{group.title}</h3>
              <ul className="space-y-4">
                {group.benefits.map((benefit, benefitIndex) => (
                  <li key={benefitIndex} className="flex items-start gap-3">
                    <CheckCircle className={`w-5 h-5 ${group.color} flex-shrink-0 mt-0.5`} />
                    <span className="text-muted-foreground text-sm leading-relaxed">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Chain Support */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground mb-6">Available on multiple chains</p>
          <div className="flex flex-wrap justify-center gap-4">
            {["Ethereum", "Base", "Arbitrum", "Unichain"].map((chain) => (
              <div
                key={chain}
                className="px-4 py-2 bg-background rounded-full border border-border text-sm font-medium text-foreground"
              >
                {chain}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
