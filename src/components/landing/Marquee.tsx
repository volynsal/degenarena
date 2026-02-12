export function Marquee() {
  const items = [
    'DegenArena HQ',
    '(',
    'The Arena for Competitive Degens',
    ')',
    'DegenArena HQ',
    '(',
    'Witness the Future of Competitive Trading',
    ')',
  ]

  return (
    <section className="relative py-6 border-y border-white/5 overflow-hidden">
      <div className="marquee-scroll flex whitespace-nowrap">
        {/* Duplicate for seamless loop */}
        {[...items, ...items].map((item, i) => (
          <span
            key={i}
            className={`inline-block mx-6 text-lg sm:text-xl tracking-[0.15em] uppercase font-brand ${
              item === '(' || item === ')'
                ? 'text-arena-purple/60 text-2xl sm:text-3xl font-light'
                : item === 'DegenArena'
                  ? 'text-white font-bold'
                  : 'text-gray-400 font-normal'
            }`}
          >
            {item}
          </span>
        ))}
      </div>
    </section>
  )
}
