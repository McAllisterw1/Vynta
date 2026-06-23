"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface Props {
  plan: string
  interval: "annual" | "monthly"
  featured?: boolean
  children: React.ReactNode
}

export default function PricingButton({ plan, interval, featured, children }: Props) {
  const { isSignedIn } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (loading) return
    setLoading(true)
    if (isSignedIn) {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval }),
      })
      const data = await res.json() as { url?: string }
      if (data.url) window.location.href = data.url
    } else {
      localStorage.setItem("pendingPlan", plan)
      localStorage.setItem("pendingInterval", interval)
      router.push("/sign-up")
    }
    setLoading(false)
  }

  const base = "block w-full rounded-sm py-3 text-center text-sm font-semibold cursor-pointer border-0 transition-colors"

  return featured ? (
    <button onClick={handleClick} disabled={loading} className={`${base} bg-teal text-cream hover:bg-teal-dark opacity-${loading ? "60" : "100"}`}>
      {loading ? "Loading…" : children}
    </button>
  ) : (
    <button onClick={handleClick} disabled={loading} className={`${base} border border-cream-border text-tobacco-mid hover:border-tobacco-light hover:text-tobacco bg-transparent opacity-${loading ? "60" : "100"}`}>
      {loading ? "Loading…" : children}
    </button>
  )
}
