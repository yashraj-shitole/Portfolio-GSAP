import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'

const ITEMS = [
  'Angular', 'React', 'TypeScript', 'Spring Boot', 'Node.js',
  'PostgreSQL', 'MongoDB', 'Tailwind', 'Express', 'REST APIs',
]

/** A single continuous strip of words drifting left. Skipped under reduced motion. */
export function Marquee() {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        if (ref.current) gsap.set(ref.current, { xPercent: 0 })
        return
      }
      const track = ref.current?.querySelector<HTMLDivElement>('.marquee__track')
      if (!track) return
      gsap.to(track, {
        xPercent: -50,
        duration: 30,
        repeat: -1,
        ease: 'none',
      })
    },
    { scope: ref },
  )

  return (
    <div
      ref={ref}
      className="marquee relative overflow-hidden border-y hairline"
      style={{ borderColor: 'hsl(var(--rule-h) var(--rule-s) var(--rule-l))' }}
      aria-hidden="true"
    >
      <div className="marquee__track inline-flex gap-12 whitespace-nowrap py-8 will-anim">
        {[...ITEMS, ...ITEMS].map((item, i) => (
          <span
            key={i}
            className="font-display italic text-3xl md:text-5xl font-medium"
            style={{ color: 'hsl(var(--ink-soft-h) var(--ink-soft-s) var(--ink-soft-l))' }}
          >
            {item}
            <span className="mx-8 text-accent">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}
