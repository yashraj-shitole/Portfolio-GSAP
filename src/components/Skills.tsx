import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { SectionReveal } from '../motion/SectionReveal'
import { data, type SkillCategory, type SkillItem } from '../data'

export function Skills() {
  return (
    <SectionReveal id="skills" className="container-x">
      <div data-reveal>
        <p className="label-cap">// 03 — skills</p>
        <h2 className="mt-3 font-display text-[length:var(--type-2xl)] font-medium leading-tight tracking-tight">
          {data.sections.find((s) => s.id === 'skills')?.title}
        </h2>
        <p className="mt-2 ink-soft text-[length:var(--type-md)]">
          {data.sections.find((s) => s.id === 'skills')?.subtitle}
        </p>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {data.skills.map((cat, i) => (
          <div key={cat.category} data-reveal>
            <SkillCard category={cat} delay={i * 0.05} />
          </div>
        ))}
      </div>
    </SectionReveal>
  )
}

function SkillCard({ category, delay }: { category: SkillCategory; delay: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
      if (!ref.current) return
      const bars = ref.current.querySelectorAll<HTMLElement>('.skill-bar-fill')
      gsap.from(bars, {
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 1,
        ease: 'power2.out',
        stagger: 0.06,
        delay,
        scrollTrigger: { trigger: ref.current, start: 'top 80%', toggleActions: 'play none none none' },
      })
    },
    { scope: ref },
  )

  return (
    <div ref={ref} className="border hairline rounded-lg p-5 hover:border-accent transition-colors duration-base" data-cursor="// stack">
      <p className="label-cap font-mono mb-4">// {category.category.toLowerCase()}</p>
      <ul className="space-y-3">
        {category.items.map((item) => (
          <li key={item.name}>
            <SkillRow item={item} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function SkillRow({ item }: { item: SkillItem }) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-[length:var(--type-sm)] font-medium">{item.name}</span>
        <span className="font-mono text-xs ink-soft">{item.level}</span>
      </div>
      <div className="h-1 w-full" style={{ background: 'hsl(var(--rule-h) var(--rule-s) var(--rule-l))' }}>
        <div
          className="skill-bar-fill h-full w-full origin-left"
          style={{
            background: 'hsl(var(--ink-h) var(--ink-s) var(--ink-l))',
            transform: `scaleX(${item.level / 100})`,
          }}
        />
      </div>
    </div>
  )
}
