"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { usePrivy } from '@privy-io/react-auth'

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { login, authenticated, user, logout } = usePrivy()

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">₳</span>
            </div>
            <span className="font-semibold text-lg text-foreground">USDC Hook</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition">
              How It Works
            </a>
            <a href="#benefits" className="text-sm text-muted-foreground hover:text-foreground transition">
              Benefits
            </a>
            <a href="#swap" className="text-sm text-muted-foreground hover:text-foreground transition">
              Swap
            </a>
          </nav>

          <div className="hidden sm:flex items-center gap-4">
            {!authenticated ? (
              <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={login}>
                Log In
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={logout} title="Click to logout">
                {user?.wallet?.address?.slice(0, 6)}...{user?.wallet?.address?.slice(-4)}
              </Button>
            )}
          </div>

          <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {isOpen && (
          <nav className="md:hidden mt-4 flex flex-col gap-4 pb-4">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground">
              How It Works
            </a>
            <a href="#benefits" className="text-sm text-muted-foreground hover:text-foreground">
              Benefits
            </a>
            <a href="#swap" className="text-sm text-muted-foreground hover:text-foreground">
              Swap
            </a>
            {!authenticated ? (
              <Button size="sm" className="w-full bg-primary hover:bg-primary/90" onClick={login}>
                Log In
              </Button>
            ) : (
              <Button size="sm" variant="outline" className="w-full" onClick={logout}>
                Logout ({user?.wallet?.address?.slice(0, 4)}...{user?.wallet?.address?.slice(-4)})
              </Button>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
