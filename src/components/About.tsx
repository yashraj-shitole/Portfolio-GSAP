import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { SectionReveal } from '../motion/SectionReveal'
import { SectionDecor } from './SectionDecor'
import { data } from '../data'

export function About() {
  return (
    <SectionReveal
      id="about"
      className="container-x"
      decor={
        <>
          <SectionDecor
            shape="ring"
            size={120}
            className="top-12 -left-8"
            path={[{ x: 0, y: 0 }, { x: 80, y: 120 }, { x: 40, y: 260 }, { x: 140, y: 400 }]}
            rotateBy={180}
            opacity={0.55}
            delay={0}
          />
          <SectionDecor
            shape="plus"
            size={70}
            className="top-1/3 -right-4"
            path={[{ x: 0, y: 0 }, { x: -60, y: 100 }, { x: 20, y: 220 }, { x: -80, y: 340 }]}
            rotateStart={0}
            rotateBy={360}
            opacity={0.5}
            delay={0.05}
          />
          <SectionDecor
            shape="diamond"
            size={90}
            className="bottom-20 left-1/4"
            path={[{ x: 0, y: 0 }, { x: 100, y: -60 }, { x: 60, y: -180 }, { x: 180, y: -260 }]}
            rotateBy={-90}
            opacity={0.45}
            delay={0.1}
          />
        </>
      }
    >
      <div data-reveal>
        <p className="label-cap">// 01 — about</p>
        <h2 className="mt-3 font-display text-[length:var(--type-2xl)] font-medium leading-tight tracking-tight">
          {data.sections.find((s) => s.id === 'about')?.title}
        </h2>
        <p className="mt-2 ink-soft text-[length:var(--type-md)]">
          {data.sections.find((s) => s.id === 'about')?.subtitle}
        </p>
      </div>

      <div className="mt-16 grid-12 gap-y-12">
        <div className="col-span-12 lg:col-span-7" data-reveal>
          <p className="text-[length:var(--type-md)] leading-relaxed">
            I'm a full-stack software engineer based in {data.profile.location}, currently building
            production software at <span className="text-accent font-medium">Raykor Technologies</span>.
            My path started with a curiosity about how websites work — that grew into a B.Tech in
            Computer Science, a CDAC PG Diploma in Advanced Computing, and three years of shipping
            features in Angular, MERN, and Spring Boot.
          </p>
          <p className="mt-6 text-[length:var(--type-md)] leading-relaxed ink-soft">
            I care about clean interfaces, fast pages, and code that doesn't need a hero to keep it
            alive.
          </p>
        </div>

        <div className="col-span-12 lg:col-span-5" data-reveal>
          <div className="glass rounded-lg p-6">
            <p className="label-cap">// philosophy</p>
            <p className="mt-4 font-display text-2xl italic leading-snug">
              "Make it work, make it right, make it fast — in that order. Then make it&nbsp;yours."
            </p>
          </div>
        </div>
      </div>

      <div className="mt-20">
        <div data-reveal>
          <p className="label-cap">// stats</p>
        </div>
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-3 gap-6">
          {data.profile.stats.map((s, i) => (
            <div key={i} data-reveal>
              <StatCounter value={s.value} suffix={s.suffix} label={s.label} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-20">
        <div data-reveal>
          <p className="label-cap">// fun facts</p>
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.profile.funFacts.map((f, i) => (
            <div
              key={i}
              data-reveal
              data-cursor="// fact"
              className="group flex items-start gap-4 p-5 border hairline rounded-lg transition-colors duration-base hover:border-accent"
            >
              <span className="text-2xl" aria-hidden="true">{f.icon}</span>
              <span className="text-[length:var(--type-base)] leading-relaxed">{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </SectionReveal>
  )
}

function StatCounter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const valueRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        if (valueRef.current) valueRef.current.textContent = `${value}${suffix}`
        return
      }
      if (!ref.current || !valueRef.current) return
      const obj = { v: 0 }
      gsap.to(obj, {
        v: value,
        duration: 1.6,
        ease: 'power2.out',
        onUpdate: () => {
          if (valueRef.current) valueRef.current.textContent = `${Math.round(obj.v).toLocaleString()}${suffix}`
        },
        scrollTrigger: { trigger: ref.current, start: 'top 80%', toggleActions: 'play none none none' },
      })
    },
    { scope: ref },
  )

  return (
    <div ref={ref} className="border-l-2 pl-4" style={{ borderColor: 'hsl(var(--accent-h) var(--accent-s) var(--accent-l))' }}>
      <div ref={valueRef} className="font-display text-4xl md:text-5xl font-medium tracking-tight">
        0{suffix}
      </div>
      <div className="mt-2 label-cap">{label}</div>
    </div>
  )
}
