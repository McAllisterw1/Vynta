const bullets = [
  "Customers check your reviews before they ever call you.",
  "A complaint spike can quietly kill new leads for weeks before you notice.",
  "You have no idea what your competitors are doing better than you right now.",
  "Most businesses are leaving real revenue on the table and don't know it.",
  "Vynta watches your reputation 24/7, spots threats early, and tells you exactly what to do next.",
];

export default function Pain() {
  return (
    <section className="bg-tobacco py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">

          {/* Left: headline */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-8 bg-sand/40" />
              <div className="h-1 w-1 rotate-45 bg-sand/60" />
              <div className="h-px w-8 bg-sand/40" />
            </div>
            <h2
              className="font-display font-bold text-cream leading-[1.1] tracking-tight"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              Your reputation is either winning jobs —
              <em style={{ fontStyle: "italic", color: "#C49A6C" }}> or losing them.</em>
            </h2>
            <a
              href="/sign-up"
              className="mt-10 inline-block rounded bg-teal px-7 py-3 text-sm font-medium text-cream transition-colors hover:bg-teal-dark"
            >
              Get Your Free Intelligence Report
            </a>
          </div>

          {/* Right: bullets */}
          <div className="flex flex-col gap-4">
            {bullets.map((bullet, i) => (
              <div
                key={i}
                className={`flex items-start gap-4 rounded-sm px-5 py-4 ${
                  i === bullets.length - 1
                    ? "bg-teal/20 border border-teal/30"
                    : "bg-tobacco-mid/40 border border-tobacco-mid/60"
                }`}
              >
                <div className={`mt-0.5 shrink-0 h-5 w-5 rounded-full flex items-center justify-center ${
                  i === bullets.length - 1 ? "bg-teal" : "bg-tobacco-mid"
                }`}>
                  {i === bullets.length - 1 ? (
                    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 text-cream">
                      <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 text-sand-light/60">
                      <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm9-1a1 1 0 1 0-2 0v2.586L5.707 8.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l2-2A1 1 0 0 0 9 9V7Z" />
                    </svg>
                  )}
                </div>
                <p className={`text-sm leading-relaxed ${
                  i === bullets.length - 1 ? "font-medium text-cream" : "text-sand-light/80"
                }`}>
                  {bullet}
                </p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
