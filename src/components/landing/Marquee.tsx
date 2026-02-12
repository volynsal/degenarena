export function Marquee() {
  const row1 = [
    { text: 'DegenArena HQ', style: 'text-white font-bold' },
    { text: '◆', style: 'text-arena-purple/50 text-sm' },
    { text: 'The Arena for Competitive Degens', style: 'text-gray-400' },
    { text: '◆', style: 'text-arena-cyan/50 text-sm' },
    { text: 'Build. Compete. Prove.', style: 'text-arena-cyan/60 font-bold' },
    { text: '◆', style: 'text-arena-purple/50 text-sm' },
    { text: 'Witness the Future of Competitive Trading', style: 'text-gray-400' },
    { text: '◆', style: 'text-arena-pink/50 text-sm' },
  ]

  const row2 = [
    { text: 'Competitions', style: 'text-arena-purple/50' },
    { text: '—', style: 'text-white/10' },
    { text: 'Clans', style: 'text-arena-pink/50' },
    { text: '—', style: 'text-white/10' },
    { text: 'Galaxy', style: 'text-arena-cyan/50' },
    { text: '—', style: 'text-white/10' },
    { text: 'Formulas', style: 'text-arena-blue/50' },
    { text: '—', style: 'text-white/10' },
    { text: 'Leaderboards', style: 'text-arena-purple/50' },
    { text: '—', style: 'text-white/10' },
    { text: 'Go Live', style: 'text-arena-pink/50' },
    { text: '—', style: 'text-white/10' },
  ]

  return (
    <section className="relative border-y border-white/5 overflow-hidden py-4 space-y-3">
      {/* Row 1 — primary taglines, scrolling left */}
      <div className="marquee-scroll flex whitespace-nowrap">
        {[...row1, ...row1].map((item, i) => (
          <span
            key={`r1-${i}`}
            className={`inline-block mx-5 text-base sm:text-lg tracking-[0.15em] uppercase font-brand ${item.style}`}
          >
            {item.text}
          </span>
        ))}
      </div>

      {/* Row 2 — feature names, scrolling right (slower) */}
      <div className="marquee-scroll-reverse flex whitespace-nowrap">
        {[...row2, ...row2].map((item, i) => (
          <span
            key={`r2-${i}`}
            className={`inline-block mx-4 text-xs sm:text-sm tracking-[0.2em] uppercase font-brand ${item.style}`}
          >
            {item.text}
          </span>
        ))}
      </div>
    </section>
  )
}
