// src/components/Hero.tsx
// First-screen hero. Left: name, role, bio, location/email chips.
// Right: a particle-assembled portrait — particles fly in from off-screen
// and converge onto the image as the user scrolls. The full image
// resolves at native resolution once the hero has scrolled past.
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { data } from '../data'
import { ParticleReveal } from './ParticleReveal'
import { PORTRAIT_PARTICLES } from '../data/particle'
import portraitSrc from '../assets/portrait.png'

const headlineWords = ['Yashraj', 'Shitole', '—', 'Software', 'Engineer']

export function Hero() {
  const container = useRef<HTMLElement>(null)
  const floatingRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const el = container.current
      if (!el) return

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      // Stagger the headline words in
      tl.from('.hero__word', {
        y: 32,
        opacity: 0,
        letterSpacing: '0.04em',
        duration: 0.9,
        stagger: 0.07,
      })
        .from('.hero__sub', { y: 12, opacity: 0, duration: 0.6 }, '-=0.4')
        .from('.hero__meta', { y: 8, opacity: 0, duration: 0.5, stagger: 0.08 }, '-=0.4')
        .from('.scroll-cue', { opacity: 0, y: 12, duration: 0.5 }, '-=0.3')

      // Infinite float on decorative shapes (left side only — the right
      // side holds the portrait, so right-side dots would overlap it).
      if (floatingRef.current) {
        gsap.utils.toArray<HTMLElement>('.hero__float').forEach((node, idx) => {
          gsap.to(node, {
            y: '+=14',
            duration: 2.4 + (idx % 3) * 0.4,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: idx * 0.2,
          })
        })
      }
    },
    { scope: container },
  )

  return (
    <section
      ref={container}
      id="hero"
      className="section--hero relative flex items-center"
      style={{ background: 'hsl(var(--bg-h) var(--bg-s) var(--bg-l))' }}
    >
      {/* Decorative floating accents (left side only) */}
      <div ref={floatingRef} aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="hero__float absolute left-[8%] top-[24%] w-2 h-2 rounded-full" style={{ background: 'hsl(var(--accent-h) var(--accent-s) var(--accent-l))' }} />
        <div className="hero__float absolute left-[20%] bottom-[22%] w-1.5 h-1.5 rounded-full" style={{ background: 'hsl(var(--ink-h) var(--ink-s) var(--ink-l) / 0.4)' }} />
      </div>

      <div className="container-x relative w-full">
        <div className="grid-12">
          <div className="col-span-12 lg:col-span-8">
            <p className="label-cap mb-6 hero__meta">// portfolio / v1</p>
            <h1 className="font-display font-medium leading-[0.98] tracking-tight text-[length:var(--type-3xl)]">
              {headlineWords.map((w, i) => (
                <span key={i} className="hero__word inline-block mr-[0.18em]">
                  {w === 'Engineer' ? (
                    <em className="text-accent" style={{ fontStyle: 'italic' }}>{w}</em>
                  ) : (
                    w
                  )}
                </span>
              ))}
            </h1>
            <p className="hero__sub mt-8 max-w-xl text-[length:var(--type-md)] ink-soft">
              {data.profile.bio}
            </p>
            <div className="hero__meta mt-8 flex flex-wrap gap-3">
              <a
                href="/Yashraj-Shitole-CV.pdf"
                download
                data-cursor="// cv"
                className="label-cap inline-flex items-center gap-2 rounded-full px-5 py-2.5"
                style={{
                  background: 'hsl(var(--ink-h) var(--ink-s) var(--ink-l))',
                  color: 'hsl(var(--bg-h) var(--bg-s) var(--bg-l))',
                }}
              >
                Download CV <span aria-hidden="true">↓</span>
              </a>
              <a
                href="#projects"
                data-cursor="// work"
                className="label-cap inline-flex items-center gap-2 rounded-full px-5 py-2.5 border hairline"
              >
                See projects <span aria-hidden="true">→</span>
              </a>
            </div>
            <div className="hero__meta mt-6 flex flex-wrap gap-3">
              {data.profile.location && (
                <span className="label-cap pill">
                  ◉ {data.profile.location}
                </span>
              )}
              <a
                href={`mailto:${data.profile.email}`}
                data-cursor="// email"
                className="label-cap pill border hairline"
                style={{ borderColor: 'hsl(var(--rule-h) var(--rule-s) var(--rule-l))', paddingInline: '0.75rem', paddingBlock: '0.4rem' }}
              >
                ✉ {data.profile.email}
              </a>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 lg:col-start-9 mt-12 lg:mt-0">
            <ParticleReveal
              src={portraitSrc}
              manifest={PORTRAIT_PARTICLES}
              alt="Portrait of Yashraj Shitole"
              caption="// subject.01 — particle assembly"
              meta={`${PORTRAIT_PARTICLES.count} px · native ${PORTRAIT_PARTICLES.sourceSize[0]}×${PORTRAIT_PARTICLES.sourceSize[1]} · from off-screen`}
              cursorLabel="subject.01"
              maxWidth="100%"
            />
          </div>
        </div>

        <div className="scroll-cue mt-16 lg:mt-24 flex items-center gap-3">
          <span className="label-cap">Scroll</span>
          <span className="block w-12 h-px" style={{ background: 'hsl(var(--ink-h) var(--ink-s) var(--ink-l) / 0.5)' }} />
        </div>
      </div>
    </section>
  )
}
