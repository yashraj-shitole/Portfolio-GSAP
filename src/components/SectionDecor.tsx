// src/components/SectionDecor.tsx
// A single decorative SVG object that lives inside a section. It traces a
// curved path through the section as the user scrolls, and scales in / out
// (hidden → revealed) tied to the section's position in the viewport.
// The parent section's text content should have `relative z-10` so the
// object appears to "come from behind the text" as you scroll.
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

type Shape = 'circle' | 'plus' | 'diamond' | 'squiggle' | 'ring' | 'cross' | 'dot-cluster'

export interface SectionDecorProps {
  /** Path waypoints in CSS pixels. The object starts at its initial
   *  absolutely-positioned location and the waypoints are added as
   *  relative offsets. So `{x: 100, y: 0}` means "100px right, same height". */
  path: { x: number; y: number }[]
  /** Which shape to draw. */
  shape?: Shape
  /** Size of the SVG bounding box in px (the shape is centered inside it). */
  size?: number
  /** Position within the section (Tailwind classes). */
  className?: string
  /** Optional starting rotation in degrees. */
  rotateStart?: number
  /** Total rotation across the section's lifetime, in degrees. */
  rotateBy?: number
  /** Final opacity at peak. */
  opacity?: number
  /** Stagger the reveal slightly into the section (0..1 fraction). */
  delay?: number
}

export function SectionDecor({
  path,
  shape = 'circle',
  size = 80,
  className = '',
  rotateStart = 0,
  rotateBy = 180,
  opacity = 0.7,
  delay = 0,
}: SectionDecorProps) {
  const wrapper = useRef<HTMLDivElement>(null)
  const groupRef = useRef<SVGGElement>(null)

  useGSAP(
    () => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        if (groupRef.current) gsap.set(groupRef.current, { opacity, scale: 1 })
        return
      }

      const g = groupRef.current
      const wrap = wrapper.current
      if (!g || !wrap) return

      const section = wrap.closest<HTMLElement>('section')
      if (!section) return

      // Initial state: hidden (scale 0)
      gsap.set(g, { opacity: 0, scale: 0, transformOrigin: '50% 50%' })

      // Each instance gets its own tween pair, tied to its parent section.
      // Scale 0 → 1 → 0 across the section's lifetime, and motionPath drives
      // the position along the curve.
      gsap
        .timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',   // section's top hits viewport bottom
            end: 'bottom top',     // section's bottom hits viewport top
            scrub: 0.6,
          },
        })
        // Reveal: scale 0 → 1 in the first 20% of the section
        .to(g, { opacity, scale: 1, duration: 0.15, ease: 'power2.out' }, 0 + delay)
        // Hide: scale 1 → 0 in the last 20%
        .to(g, { opacity: 0, scale: 0, duration: 0.15, ease: 'power2.in' }, 0.85 + delay)
        // Path tracing — over the section's full lifetime
        .to(
          g,
          {
            motionPath: {
              path: path.map((p) => ({ x: p.x, y: p.y })),
              curviness: 1.8,
              autoRotate: false,
            },
            rotation: rotateStart + rotateBy,
            ease: 'power1.inOut',
            duration: 1,
          },
          0 + delay,
        )
    },
    { scope: wrapper },
  )

  return (
    <div
      ref={wrapper}
      aria-hidden="true"
      className={`pointer-events-none absolute ${className}`}
      style={{ width: size, height: size, zIndex: 0 }}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className="overflow-visible"
      >
        <g ref={groupRef} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
          <ShapeRenderer shape={shape} />
        </g>
      </svg>
    </div>
  )
}

function ShapeRenderer({ shape }: { shape: Shape }) {
  const stroke = 'hsl(var(--accent-h) var(--accent-s) var(--accent-l))'
  const fill = 'hsl(var(--accent-h) var(--accent-s) var(--accent-l))'
  const soft = 'hsl(var(--ink-soft-h) var(--ink-soft-s) var(--ink-soft-l))'

  switch (shape) {
    case 'circle':
      return (
        <circle
          cx="12" cy="12" r="9"
          fill="none"
          stroke={stroke}
          strokeWidth="1.2"
          strokeDasharray="3 2"
        />
      )
    case 'ring':
      return (
        <>
          <circle cx="12" cy="12" r="10" fill="none" stroke={stroke} strokeWidth="0.6" />
          <circle cx="12" cy="12" r="6" fill="none" stroke={stroke} strokeWidth="1.4" />
          <circle cx="12" cy="12" r="2" fill={fill} />
        </>
      )
    case 'plus':
      return (
        <g stroke={stroke} strokeWidth="1.4" strokeLinecap="round">
          <line x1="12" y1="2" x2="12" y2="22" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <circle cx="12" cy="12" r="2" fill={fill} stroke="none" />
        </g>
      )
    case 'diamond':
      return (
        <g transform="translate(12 12)">
          <rect
            x="-9" y="-9" width="18" height="18"
            transform="rotate(45)"
            fill="none"
            stroke={stroke}
            strokeWidth="1.2"
          />
          <rect
            x="-4" y="-4" width="8" height="8"
            transform="rotate(45)"
            fill={fill}
          />
        </g>
      )
    case 'cross':
      return (
        <g stroke={soft} strokeWidth="1" opacity="0.8">
          <line x1="6" y1="6" x2="18" y2="18" />
          <line x1="18" y1="6" x2="6" y2="18" />
        </g>
      )
    case 'squiggle':
      return (
        <path
          d="M 2 12 Q 6 4, 12 12 T 22 12"
          fill="none"
          stroke={stroke}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      )
    case 'dot-cluster':
      return (
        <g fill={stroke}>
          <circle cx="6" cy="6" r="1.5" />
          <circle cx="18" cy="6" r="1.5" />
          <circle cx="12" cy="12" r="2.5" fill={fill} />
          <circle cx="6" cy="18" r="1.5" />
          <circle cx="18" cy="18" r="1.5" />
        </g>
      )
  }
}
