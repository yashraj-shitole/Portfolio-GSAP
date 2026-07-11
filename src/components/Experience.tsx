import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { SectionReveal } from '../motion/SectionReveal'
import { SectionDecor } from './SectionDecor'
import { data, type Experience } from '../data'

function fmt(d: string): string {
  if (d.length === 7) {
    const [y, m] = d.split('-')
    const month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][Number(m) - 1]
    return `${month} ${y}`
  }
  return d
}

export function ExperienceSection() {
  return (
    <SectionReveal
      id="experience"
      className="container-x"
      decor={
        <>
          <SectionDecor
            shape="circle"
            size={100}
            className="top-32 -right-6"
            path={[{ x: 0, y: 0 }, { x: -80, y: 120 }, { x: -40, y: 280 }, { x: -120, y: 420 }]}
            rotateBy={120}
            opacity={0.5}
            delay={0}
          />
          <SectionDecor
            shape="dot-cluster"
            size={80}
            className="top-2/3 -left-6"
            path={[{ x: 0, y: 0 }, { x: 80, y: -80 }, { x: 120, y: -200 }, { x: 60, y: -320 }]}
            rotateBy={-45}
            opacity={0.4}
            delay={0.05}
          />
          <SectionDecor
            shape="squiggle"
            size={140}
            className="bottom-10 right-1/4"
            path={[{ x: 0, y: 0 }, { x: -60, y: -60 }, { x: 20, y: -160 }, { x: -80, y: -240 }]}
            rotateBy={0}
            opacity={0.45}
            delay={0.1}
          />
        </>
      }
    >
      <div data-reveal>
        <p className="label-cap">// 02 — experience</p>
        <h2 className="mt-3 font-display text-[length:var(--type-2xl)] font-medium leading-tight tracking-tight">
          {data.sections.find((s) => s.id === 'experience')?.title}
        </h2>
        <p className="mt-2 ink-soft text-[length:var(--type-md)]">
          {data.sections.find((s) => s.id === 'experience')?.subtitle}
        </p>
      </div>

      <div className="mt-16 relative">
        <div
          aria-hidden="true"
          className="timeline-line absolute left-0 md:left-1/2 top-0 bottom-0 w-px md:-translate-x-px"
          style={{ background: 'hsl(var(--rule-h) var(--rule-s) var(--rule-l))' }}
        />
        <ul className="space-y-12">
          {data.experience.map((e, i) => (
            <li key={i} data-reveal>
              <ExperienceRow exp={e} side={i % 2 === 0 ? 'left' : 'right'} />
            </li>
          ))}
        </ul>
      </div>
    </SectionReveal>
  )
}

function ExperienceRow({ exp, side }: { exp: Experience; side: 'left' | 'right' }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 relative">
      <div
        className="absolute left-0 md:left-1/2 top-2 w-3 h-3 rounded-full -translate-x-[5px]"
        style={{ background: exp.current ? 'hsl(var(--accent-h) var(--accent-s) var(--accent-l))' : 'hsl(var(--ink-h) var(--ink-s) var(--ink-l))' }}
        aria-hidden="true"
      />
      <div className={`pl-8 md:pl-0 ${side === 'left' ? 'md:pr-12 md:text-right' : 'md:order-2 md:pl-12'}`}>
        <div className="label-cap">
          {fmt(exp.start)} — {exp.end ? fmt(exp.end) : 'Present'}
        </div>
        <h3 className="mt-2 font-display text-2xl md:text-3xl font-medium tracking-tight">
          {exp.role}
        </h3>
        <div className="mt-1 text-[length:var(--type-md)]">
          {exp.company}
          {exp.current && (
            <span className="ml-2 inline-flex items-center gap-1 align-middle text-accent text-xs font-mono">
              <span className="present-dot inline-block w-1.5 h-1.5 rounded-full" style={{ background: 'hsl(var(--accent-h) var(--accent-s) var(--accent-l))' }} />
              current
            </span>
          )}
        </div>
        <div className="mt-1 ink-soft text-sm">
          {[exp.location, exp.mode].filter(Boolean).join(' · ')}
        </div>
      </div>
      <div className={`pl-8 md:pl-0 ${side === 'left' ? 'md:pl-12' : 'md:order-1 md:pr-12 md:text-right'}`}>
        <p className="text-[length:var(--type-base)] leading-relaxed">{exp.summary}</p>
        {exp.highlights && exp.highlights.length > 0 && (
          <ul className={`mt-4 space-y-2 ${side === 'left' ? 'md:text-right' : ''}`}>
            {exp.highlights.map((h, i) => (
              <li key={i} className="ink-soft text-[length:var(--type-sm)] leading-relaxed">
                <span className={`text-accent mr-2 ${side === 'left' ? 'md:hidden' : ''}`}>—</span>
                <span className={`hidden ${side === 'left' ? 'md:inline' : ''}`}>— </span>
                {h}
              </li>
            ))}
          </ul>
        )}
        {exp.stack && exp.stack.length > 0 && (
          <div className={`mt-4 flex flex-wrap gap-2 ${side === 'left' ? 'md:justify-end' : ''}`}>
            {exp.stack.map((s) => (
              <span key={s} className="label-cap pill">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/** Used by App to add a gentle pulse to the "current" dot. */
export function ExperiencePulse() {
  useGSAP(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.to('.present-dot', {
      opacity: 0.3,
      repeat: -1,
      yoyo: true,
      duration: 1.4,
      ease: 'sine.inOut',
    })
  })
  return null
}
