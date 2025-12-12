"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { usePrivy } from '@privy-io/react-auth'
import { useWalletBalances } from "@/hooks/use-wallet-balances"
import { ExternalLink, LogOut, Wallet } from "lucide-react"

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const { login, authenticated, user, logout } = usePrivy()
  const { balances, isLoading, refetch } = useWalletBalances()
  const profileRef = useRef<HTMLDivElement>(null)

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleProfileClick = () => {
    if (!isProfileOpen) {
      refetch()
    }
    setIsProfileOpen(!isProfileOpen)
  }

  const handleLogout = async () => {
    await logout()
    setIsProfileOpen(false)
  }

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
              <div className="relative" ref={profileRef}>
                <Button
                  size="sm"
                  variant={isProfileOpen ? "secondary" : "outline"}
                  onClick={handleProfileClick}
                  className="gap-2"
                >
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  {user?.wallet?.address?.slice(0, 6)}...{user?.wallet?.address?.slice(-4)}
                </Button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Connected Wallet</span>
                        <a
                          href={`https://sepolia.uniscan.xyz/address/${user?.wallet?.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          View <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>

                      <div className="space-y-2">
                        <div className="bg-secondary/30 rounded-lg p-3 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs">
                              Ξ
                            </div>
                            <span className="font-medium">ETH</span>
                          </div>
                          <span className="font-mono">
                            {isLoading ? "..." : balances.eth}
                          </span>
                        </div>

                        <div className="bg-secondary/30 rounded-lg p-3 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-xs text-green-500">
                              $
                            </div>
                            <span className="font-medium">USDC</span>
                          </div>
                          <span className="font-mono">
                            {isLoading ? "..." : balances.usdc}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                          onClick={handleLogout}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
              <div className="space-y-3">
                <div className="p-3 bg-secondary/30 rounded-lg border border-border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-muted-foreground">ETH</span>
                    <span className="font-mono text-sm">{isLoading ? "..." : balances.eth}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">USDC</span>
                    <span className="font-mono text-sm">{isLoading ? "..." : balances.usdc}</span>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="w-full justify-center text-red-500 hover:bg-red-500/10 hover:text-red-600" onClick={logout}>
                  Logout
                </Button>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
