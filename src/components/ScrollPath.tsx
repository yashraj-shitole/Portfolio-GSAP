// src/components/ScrollPath.tsx
// Decorative scroll-path animation: a curving line draws on the right edge
// of the page as the user scrolls, and a glowing dot rides the same path
// from top to bottom, with a section label that updates as the dot passes
// each section. Powered by GSAP's MotionPathPlugin + ScrollTrigger.scrub.
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { data } from '../data'

// The path's start is in the upper-right of the viewport, end is lower-right.
// We use a fixed right-side rail with a subtle horizontal wave.
const PATH_D = 'M 30 0 C 60 120, 0 240, 30 360 S 60 600, 30 720 S 0 880, 30 1000'

export function ScrollPath() {
  const container = useRef<HTMLDivElement>(null)
  const drawPathRef = useRef<SVGPathElement>(null)
  const dotRef = useRef<SVGCircleElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        if (drawPathRef.current) drawPathRef.current.style.strokeDashoffset = '0'
        return
      }

      const drawPath = drawPathRef.current
      const dot = dotRef.current
      const label = labelRef.current
      if (!drawPath || !dot || !label) return

      const len = drawPath.getTotalLength()
      drawPath.style.strokeDasharray = `${len}`
      drawPath.style.strokeDashoffset = `${len}`

      gsap.set(dot, { opacity: 0, scale: 0.6, transformOrigin: '50% 50%' })
      gsap.set(label, { opacity: 0 })

      // Master scrub: draw path on + move dot along the SAME path
      // so the dot's progress is always equal to the path's draw progress.
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.6,
        },
      })

      tl.to(drawPath, { strokeDashoffset: 0 }, 0)

      tl.to(
        dot,
        {
          motionPath: {
            path: drawPath, // reference the SVG <path> element directly
            align: drawPath,
            alignOrigin: [0.5, 0.5],
            autoRotate: false,
          },
          onStart: () => {
            gsap.to(dot, { opacity: 1, scale: 1, duration: 0.4, overwrite: true })
            gsap.to(label, { opacity: 1, duration: 0.4, overwrite: true })
          },
        },
        0,
      )

      // Section label transitions
      const sections = data.sections
      sections.forEach((section) => {
        const target = document.getElementById(section.id)
        if (!target) return
        ScrollTrigger.create({
          trigger: target,
          start: 'top 55%',
          end: 'bottom 45%',
          onEnter: () => flashLabel(label, section.title),
          onEnterBack: () => flashLabel(label, section.title),
        })
      })

      // Subtle dot pulse at each section midpoint (small attention beat)
      sections.forEach((section, idx) => {
        const target = document.getElementById(section.id)
        if (!target) return
        tl.to(
          dot,
          {
            scale: 1.7,
            duration: 0.06,
            yoyo: true,
            repeat: 1,
            ease: 'power2.inOut',
          },
          // Pin pulse to where the section's midpoint falls in the overall scroll
          // by computing the position fraction: each section roughly occupies
          // 1/N of the page, so midpoint ≈ (idx + 0.5) / N.
          (idx + 0.5) / sections.length,
        )
      })
    },
    { scope: container },
  )

  return (
    <div
      ref={container}
      aria-hidden="true"
      className="pointer-events-none fixed inset-y-0 right-4 sm:right-8 z-30 hidden md:block"
      style={{ width: '64px' }}
    >
      <svg
        viewBox="0 0 60 1000"
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full overflow-visible"
      >
        {/* Faint base rail — always visible at low opacity */}
        <path
          d={PATH_D}
          fill="none"
          stroke="hsl(var(--rule-h) var(--rule-s) var(--rule-l))"
          strokeWidth="0.6"
          strokeOpacity="0.5"
        />
        {/* Animated path — draws on as the user scrolls */}
        <path
          ref={drawPathRef}
          d={PATH_D}
          fill="none"
          stroke="hsl(var(--accent-h) var(--accent-s) var(--accent-l))"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* The dot that rides the path */}
        <circle
          ref={dotRef}
          cx="0"
          cy="0"
          r="4"
          fill="hsl(var(--accent-h) var(--accent-s) var(--accent-l))"
          style={{
            filter: 'drop-shadow(0 0 8px hsl(var(--accent-h) var(--accent-s) var(--accent-l) / 0.7))',
          }}
        />
      </svg>

      {/* Floating section label that tracks near the dot */}
      <div
        ref={labelRef}
        className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap"
        style={{ pointerEvents: 'none' }}
      >
        <span
          className="label-cap glass-deep rounded-full px-3 py-1 inline-block"
          style={{
            color: 'hsl(var(--ink-h) var(--ink-s) var(--ink-l))',
          }}
        >
          <span data-label-text>hero</span>
        </span>
      </div>
    </div>
  )
}

function flashLabel(el: HTMLDivElement, text: string) {
  const span = el.querySelector<HTMLSpanElement>('[data-label-text]')
  if (!span || span.textContent === text) return
  gsap.to(el, {
    opacity: 0,
    x: -4,
    duration: 0.18,
    ease: 'power2.in',
    onComplete: () => {
      if (span) span.textContent = text
      gsap.fromTo(
        el,
        { opacity: 0, x: 4 },
        { opacity: 1, x: 0, duration: 0.32, ease: 'power3.out' },
      )
    },
  })
}
