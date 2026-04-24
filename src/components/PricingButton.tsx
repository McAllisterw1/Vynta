'use client'

import { useState } from 'react'

interface Props {
  plan: string
  featured?: boolean
  children: React.ReactNode
}

export default function PricingButton({ plan, featured, children }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const { url } = await res.json()
      window.location.href = url
    } catch {
      setLoading(false)
    }
  }

  if (featured) {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className="block w-full rounded-sm bg-teal py-3 text-center text-sm font-semibold text-cream transition-colors hover:bg-teal-dark disabled:opacity-60"
      >
        {loading ? 'Redirecting…' : children}
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="block w-full rounded-sm border border-cream-border py-3 text-center text-sm font-medium text-tobacco-mid transition-colors hover:border-tobacco-light hover:text-tobacco disabled:opacity-60"
    >
      {loading ? 'Redirecting…' : children}
    </button>
  )
}
