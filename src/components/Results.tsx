const stats = [
  {
    value: "87%",
    label: "of customers read reviews before choosing a local business",
  },
  {
    value: "More reviews",
    label: "= more inbound calls from customers who trust you",
  },
  {
    value: "Faster responses",
    label: "show customers your business is active and trustworthy",
  },
];

export default function Results() {
  return (
    <section className="bg-cream py-28">
      <div className="mx-auto max-w-6xl px-6">

        {/* Header */}
        <div className="mb-16 max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-10 bg-teal" />
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-teal">Results</span>
          </div>
          <h2 className="font-display text-4xl font-bold text-tobacco leading-tight mb-4 md:text-5xl">
            More reviews. More trust.{" "}
            <em style={{ fontStyle: "italic" }}>More booked jobs.</em>
          </h2>
          <p className="text-tobacco-light leading-relaxed">
            Vynta is built for local service businesses where reputation directly affects revenue.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-6 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.value}
              className="rounded-sm border border-cream-border bg-sand-pale px-8 py-8"
            >
              <div className="font-display text-3xl font-bold text-teal mb-3 leading-tight">
                {stat.value}
              </div>
              <p className="text-sm text-tobacco-mid leading-relaxed">{stat.label}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
