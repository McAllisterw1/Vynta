const voices = [
  { emoji: "💼", name: "Professional",   description: "Polished and composed" },
  { emoji: "😊", name: "Friendly",       description: "Warm and genuine" },
  { emoji: "🙏", name: "Apologetic",     description: "Empathetic and solution focused" },
  { emoji: "🔥", name: "Savage",         description: "Zero contrition, surgical precision", free: true },
  { emoji: "🎉", name: "Hype Man",       description: "Over the top enthusiastic" },
  { emoji: "😎", name: "Unbothered",     description: "Responds like the review barely registered" },
  { emoji: "📖", name: "Storyteller",    description: "Turns the response into a brand moment" },
  { emoji: "📊", name: "By The Numbers", description: "Fact based, corrects with logic" },
  { emoji: "🤝", name: "Neighbor",       description: "Warm community pillar energy" },
  { emoji: "🏢", name: "Corporate",      description: "Old money, slightly above it all" },
];

export default function Voices() {
  return (
    <section className="bg-cream py-24">
      <div className="mx-auto max-w-6xl px-6">

        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-10 bg-teal" />
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-teal">Your Voice</span>
          </div>
          <h2 className="font-display text-3xl font-bold text-tobacco md:text-4xl mb-3">
            10 ways to say it.
          </h2>
          <p className="max-w-md text-tobacco-light leading-relaxed">
            Every review is different. Pick a personality — the AI handles the rest.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {voices.map(({ emoji, name, description, free }) => (
            <div
              key={name}
              className="flex flex-col items-center gap-2 rounded-sm border border-cream-border bg-sand-pale px-4 py-5 text-center"
            >
              <span className="text-3xl leading-none">{emoji}</span>
              <div className="flex flex-col items-center gap-0.5">
                <p className="text-sm font-semibold text-tobacco">{name}</p>
                {free && (
                  <span className="rounded-full bg-amber-100 px-2 py-px text-[9px] font-medium text-amber-700">
                    Always free
                  </span>
                )}
              </div>
              <p className="text-xs leading-snug text-tobacco-light/80">{description}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
