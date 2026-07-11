import { useRef, useEffect } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { data } from '../data'

interface PreloaderProps {
  onComplete: () => void
}

/**
 * Cinematic preloader.
 * - Logo scales in
 * - Loading bar fills over min duration
 * - Status messages rotate on a fixed interval
 * - On complete, slides up and reveals the page
 * - Respects prefers-reduced-motion: skips animation, calls onComplete immediately.
 */
export function Preloader({ onComplete }: PreloaderProps) {
  const root = useRef<HTMLDivElement>(null)
  const msgRef = useRef<HTMLDivElement>(null)
  const cfg = data.site.loader

  // Reduced motion: skip entirely.
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) onComplete()
  }, [onComplete])

  useGSAP(
    () => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const rootEl = root.current
      const bar = rootEl?.querySelector<HTMLElement>('.preloader__bar-fill')
      const logo = rootEl?.querySelector<HTMLElement>('.preloader__logo')
      const msg = msgRef.current
      if (!rootEl || !bar || !logo || !msg) return

      // Rotate status messages
      let i = 0
      const interval = window.setInterval(() => {
        if (i >= cfg.messages.length - 1) {
          window.clearInterval(interval)
          return
        }
        i++
        gsap.fromTo(
          msg,
          { y: 10, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out', overwrite: 'auto' },
        )
        msg.textContent = cfg.messages[i]
      }, cfg.messageIntervalMs)

      const tl = gsap.timeline({
        onComplete: () => {
          window.clearInterval(interval)
          onComplete()
        },
      })

      tl.from(logo, { scale: 0, opacity: 0, duration: 0.7, ease: 'back.out(1.7)' })
        .from(
          bar,
          { scaleX: 0, transformOrigin: 'left center', duration: cfg.minDurationMs / 1000, ease: 'power2.inOut' },
          '<0.1',
        )
        .to(
          msg,
          { opacity: 0, y: -10, duration: 0.2 },
          '+=0',
        )
        .set(msg, { textContent: cfg.messages[cfg.messages.length - 1] })
        .from(msg, { opacity: 0, y: 10, duration: 0.3, ease: 'power2.out' })
        .to(
          rootEl,
          { yPercent: -100, duration: 0.9, ease: 'power4.inOut' },
          '+=0.3',
        )
    },
    { scope: root },
  )

  return (
    <div
      ref={root}
      className="preloader fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8"
      style={{ background: 'hsl(var(--bg-h) var(--bg-s) var(--bg-l))' }}
      aria-hidden="true"
    >
      <div
        className="preloader__logo font-display text-6xl md:text-7xl will-anim"
        style={{ color: 'hsl(var(--ink-h) var(--ink-s) var(--ink-l))' }}
      >
        {cfg.logoText}
      </div>
      <div className="preloader__bar w-64 md:w-80 h-px overflow-hidden" style={{ background: 'hsl(var(--rule-h) var(--rule-s) var(--rule-l))' }}>
        <div
          className="preloader__bar-fill h-full w-full"
          style={{ background: 'hsl(var(--ink-h) var(--ink-s) var(--ink-l))', transformOrigin: 'left center' }}
        />
      </div>
      <div
        ref={msgRef}
        className="label-cap min-h-[1.5em] text-center"
        style={{ color: 'hsl(var(--ink-soft-h) var(--ink-soft-s) var(--ink-soft-l))' }}
      >
        {cfg.messages[0]}
      </div>
    </div>
  )
}
