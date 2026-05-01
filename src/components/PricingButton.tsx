interface Props {
  featured?: boolean
  children: React.ReactNode
}

export default function PricingButton({ featured, children }: Props) {
  if (featured) {
    return (
      <a
        href="/sign-up"
        className="block w-full rounded-sm bg-teal py-3 text-center text-sm font-semibold text-cream transition-colors hover:bg-teal-dark"
      >
        {children}
      </a>
    )
  }

  return (
    <a
      href="/sign-up"
      className="block w-full rounded-sm border border-cream-border py-3 text-center text-sm font-medium text-tobacco-mid transition-colors hover:border-tobacco-light hover:text-tobacco"
    >
      {children}
    </a>
  )
}
