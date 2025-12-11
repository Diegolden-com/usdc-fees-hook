import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Analytics } from "@vercel/analytics/react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "USDC Fixed-Fee Hook | Predictable DeFi Trading",
  description: "Fixed-fee swaps on Uniswap v4. No more gas surprises. Pay $2.99 on Mainnet or $0.99 on L2s for USDC swaps.",
  keywords: ["DeFi", "Uniswap", "USDC", "Fixed Fee", "Gas", "Ethereum", "Trading"],
  openGraph: {
    title: "USDC Fixed-Fee Hook | Predictable DeFi Trading",
    description: "Fixed-fee swaps on Uniswap v4. No more gas surprises.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "USDC Fixed-Fee Hook | Predictable DeFi Trading",
    description: "Fixed-fee swaps on Uniswap v4. No more gas surprises.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
