"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

interface Props {
  plan: string
  featured?: boolean
  children: React.ReactNode
}

export default function PricingButton({ plan, featured, children }: Props) {
  const { isSignedIn } = useUser()
  const router = useRouter()

  async function handleClick() {
    if (isSignedIn) {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json() as { url?: string }
      if (data.url) window.location.href = data.url
    } else {
      localStorage.setItem("pendingPlan", plan)
      router.push("/sign-up")
    }
  }

  const base = "block w-full rounded-sm py-3 text-center text-sm font-semibold cursor-pointer border-0 transition-colors"

  return featured ? (
    <button onClick={handleClick} className={`${base} bg-teal text-cream hover:bg-teal-dark`}>
      {children}
    </button>
  ) : (
    <button onClick={handleClick} className={`${base} border border-cream-border text-tobacco-mid hover:border-tobacco-light hover:text-tobacco bg-transparent`}>
      {children}
    </button>
  )
}
