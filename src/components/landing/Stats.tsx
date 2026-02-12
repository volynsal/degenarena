'use client'

import { useEffect, useRef, useState } from 'react'
import { ShieldCheck, Trophy, Activity, Target } from 'lucide-react'

const stats = [
  {
    icon: ShieldCheck,
    value: 0,
    suffix: '',
    label: 'Verified Profiles',
    description: 'Every trader tracked and verified',
    color: 'text-arena-cyan',
  },
  {
    icon: Trophy,
    value: 0,
    suffix: '',
    label: 'Competitions Run',
    description: 'Tournaments completed to date',
    color: 'text-arena-purple',
  },
  {
    icon: Activity,
    value: 0,
    suffix: '',
    label: 'Signals Triggered',
    description: 'Real-time alerts fired for traders',
    color: 'text-arena-pink',
  },
  {
    icon: Target,
    value: 100,
    suffix: '%',
    label: 'On-Chain Verified',
    description: 'No faking, no hiding results',
    color: 'text-arena-cyan',
  },
]

function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const duration = 1500
          const steps = 40
          const increment = target / steps
          let current = 0
          const timer = setInterval(() => {
            current += increment
            if (current >= target) {
              setCount(target)
              clearInterval(timer)
            } else {
              setCount(Math.floor(current))
            }
          }, duration / steps)
        }
      },
      { threshold: 0.3 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return (
    <span ref={ref} className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-none">
      {target === 0 ? '—' : count}
      {target > 0 && suffix}
    </span>
  )
}

export function Stats() {
  return (
    <section className="py-20 sm:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Bracketed label */}
        <div className="text-center mb-6">
          <span className="text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase text-gray-500">
            [ Game Changing Stats ]
          </span>
        </div>

        {/* Section headline */}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white text-center max-w-3xl mx-auto mb-16">
          Real numbers. Real performance. No screenshots.
        </h2>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="text-center group"
            >
              <stat.icon
                size={28}
                strokeWidth={1.5}
                className={`${stat.color} mx-auto mb-4 opacity-60 group-hover:opacity-100 transition-opacity`}
              />
              <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              <p className="text-sm sm:text-base font-semibold text-gray-300 mt-3 mb-1">
                {stat.label}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
