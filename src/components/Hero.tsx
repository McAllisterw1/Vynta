import ReputationAuditWidget from "@/components/ReputationAuditWidget";

const stats = [
  { value: "87%", label: "of customers check reviews before calling" },
  { value: "3×", label: "more insight than any review tool you've used" },
  { value: "24/7", label: "early warning system watching your reputation" },
];

export default function Hero() {
  return (
    <section className="bg-cream pt-20 overflow-hidden">
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(45,155,138,0); }
          50%       { box-shadow: 0 0 0 8px rgba(45,155,138,0.15); }
        }
        @keyframes bounce-x {
          0%, 100% { transform: translateX(0); }
          50%       { transform: translateX(4px); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .widget-pulse { animation: pulse-glow 2.8s ease-in-out infinite; border-radius: 20px; }
        .bounce-x     { animation: bounce-x 1.4s ease-in-out infinite; display: inline-block; }
        .fade-in-up   { animation: fade-in-up 0.7s ease both; }
      `}</style>

      <div className="mx-auto w-full max-w-6xl px-6 pt-4 pb-20">
        <div className="flex items-start gap-12">

          {/* Left: text content */}
          <div className="flex-1 min-w-0">

            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px w-10 bg-teal" />
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-teal">
                Reputation Intelligence for Local Businesses
              </span>
            </div>

            {/* Headline */}
            <h1
              className="font-display font-bold text-tobacco leading-[1.08] tracking-tight max-w-3xl mb-6"
              style={{ fontSize: "clamp(2.6rem, 6.5vw, 5rem)" }}
            >
              Your Reputation Is a{" "}
              <em
                className="bg-clip-text text-transparent"
                style={{ fontStyle: "italic", backgroundImage: "linear-gradient(135deg, #2D9B8A 0%, #4F46E5 100%)" }}
              >Gold Mine.</em>{" "}Start Working It.
            </h1>

            {/* Subheadline */}
            <p className="mb-10 max-w-xl text-base leading-relaxed text-tobacco-mid">
              Vynta goes beyond review management. Get early warnings before complaints
              spike, see exactly what revenue you&apos;re leaving on the table, and know
              precisely where competitors are beating you — all in one intelligence platform.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-6">
              <a
                href="/sign-up"
                className="rounded bg-teal px-8 py-3.5 text-sm font-medium text-cream transition-colors hover:bg-teal-dark"
              >
                See Your Reputation Intelligence
              </a>
              <a
                href="#features"
                className="group flex items-center gap-2 text-sm font-medium text-tobacco-mid border-b border-tobacco-light pb-px transition-colors hover:border-tobacco hover:text-tobacco"
              >
                See How It Works
                <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5">
                  <path fillRule="evenodd" d="M2 8a.75.75 0 0 1 .75-.75h8.69L8.22 4.03a.75.75 0 0 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06-1.06l3.22-3.22H2.75A.75.75 0 0 1 2 8Z" clipRule="evenodd" />
                </svg>
              </a>
            </div>

            {/* Stats row */}
            <div className="mt-14 pt-10 border-t border-cream-border flex flex-wrap gap-10">
              {stats.map((stat, i) => (
                <div key={stat.label} className="flex items-center gap-10">
                  <div>
                    <div className="font-display text-3xl font-semibold text-teal">{stat.value}</div>
                    <div className="mt-0.5 text-sm text-tobacco-light">{stat.label}</div>
                  </div>
                  {i < stats.length - 1 && (
                    <div className="h-10 w-px bg-cream-border" />
                  )}
                </div>
              ))}
            </div>

          </div>

          {/* Right: live reputation audit widget */}
          <div className="hidden xl:block shrink-0 w-[400px] fade-in-up" style={{ animationDelay: "0.3s" }}>

            {/* Attention-grabber label */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-xs font-semibold text-teal uppercase tracking-[0.18em]">
                Free audit — no signup
              </span>
              <span className="bounce-x text-teal">→</span>
            </div>

            {/* Pulsing wrapper */}
            <div className="widget-pulse">
              <ReputationAuditWidget />
            </div>

            <p className="text-center text-xs text-tobacco-light/60 mt-3">
              Takes 10 seconds · See your score instantly
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
