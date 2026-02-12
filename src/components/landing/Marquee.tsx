export function Marquee() {
  const row1 = [
    { text: 'DEGENARENA HQ', style: 'text-white font-bold' },
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

  // Render a single set of items
  const renderRow = (items: typeof row1, prefix: string) => (
    items.map((item, i) => (
      <span
        key={`${prefix}-${i}`}
        className={`inline-block mx-5 shrink-0 ${item.style}`}
      >
        {item.text}
      </span>
    ))
  )

  return (
    <section className="relative border-y border-white/5 overflow-hidden py-4 space-y-3">
      {/* Row 1 — two identical divs side by side, seamless loop */}
      <div className="flex whitespace-nowrap text-base sm:text-lg tracking-[0.15em] uppercase font-brand marquee-scroll">
        <div className="flex shrink-0">
          {renderRow(row1, 'r1a')}
        </div>
        <div className="flex shrink-0" aria-hidden="true">
          {renderRow(row1, 'r1b')}
        </div>
      </div>

      {/* Row 2 — same technique, reverse direction */}
      <div className="flex whitespace-nowrap text-xs sm:text-sm tracking-[0.2em] uppercase font-brand marquee-scroll-reverse">
        <div className="flex shrink-0">
          {renderRow(row2, 'r2a')}
        </div>
        <div className="flex shrink-0" aria-hidden="true">
          {renderRow(row2, 'r2b')}
        </div>
      </div>
    </section>
  )
}
