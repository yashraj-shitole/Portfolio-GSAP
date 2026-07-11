import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * Lenis smooth scroll + ScrollTrigger bridge.
 * - Installs a single Lenis instance on the document.
 * - Drives ScrollTrigger via Lenis's scroll events so reveals and parallax
 *   stay in sync with the smooth scroll.
 * - Skips entirely under prefers-reduced-motion.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })
    lenisRef.current = lenis

    lenis.on('scroll', ScrollTrigger.update)
    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    // Expose for smoke tests / debugging only — lets scripts call
    // (window as any).__lenis.scrollTo(target, { immediate: true })
    // to bypass the smooth animation.
    ;(window as unknown as { __lenis?: Lenis }).__lenis = lenis

    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
      lenisRef.current = null
      delete (window as unknown as { __lenis?: Lenis }).__lenis
    }
  }, [])

  return <>{children}</>
}
