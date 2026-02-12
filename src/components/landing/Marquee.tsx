'use client'

import { useEffect, useRef } from 'react'

export function Marquee() {
  const row1Ref = useRef<HTMLDivElement>(null)
  const row2Ref = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    function startMarquee(container: HTMLDivElement, speed: number, reverse: boolean) {
      let pos = reverse ? -(container.scrollWidth / 2) : 0
      const half = container.scrollWidth / 2

      let animId: number
      const step = () => {
        if (reverse) {
          pos += speed
          if (pos >= 0) pos = -half
        } else {
          pos -= speed
          if (pos <= -half) pos = 0
        }
        container.style.transform = `translateX(${pos}px)`
        animId = requestAnimationFrame(step)
      }
      animId = requestAnimationFrame(step)
      return () => cancelAnimationFrame(animId)
    }

    const cancel1 = row1Ref.current ? startMarquee(row1Ref.current, 1.5, false) : () => {}
    const cancel2 = row2Ref.current ? startMarquee(row2Ref.current, 1.0, true) : () => {}

    return () => { cancel1(); cancel2() }
  }, [])

  const renderItems = (items: typeof row1, prefix: string) =>
    items.map((item, i) => (
      <span
        key={`${prefix}-${i}`}
        className={`inline-block mx-5 shrink-0 ${item.style}`}
      >
        {item.text}
      </span>
    ))

  // Repeat enough times to always fill the screen
  const repeat = (items: typeof row1, prefix: string, times: number) => {
    const out = []
    for (let t = 0; t < times; t++) {
      out.push(...renderItems(items, `${prefix}${t}`))
    }
    return out
  }

  return (
    <section className="relative border-y border-white/5 overflow-hidden py-4 space-y-3">
      {/* Row 1 — JS-driven continuous scroll left */}
      <div
        ref={row1Ref}
        className="flex whitespace-nowrap text-base sm:text-lg tracking-[0.15em] uppercase font-brand will-change-transform"
      >
        {repeat(row1, 'r1', 6)}
      </div>

      {/* Row 2 — JS-driven continuous scroll right */}
      <div
        ref={row2Ref}
        className="flex whitespace-nowrap text-xs sm:text-sm tracking-[0.2em] uppercase font-brand will-change-transform"
      >
        {repeat(row2, 'r2', 6)}
      </div>
    </section>
  )
}
