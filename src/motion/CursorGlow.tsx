import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

/**
 * Custom cursor: a small dot following the pointer with quickTo, plus a
 * label that appears when hovering any element with a [data-cursor] attr.
 * Skipped on touch devices and under prefers-reduced-motion.
 */
export function CursorGlow() {
  const dot = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const isTouch = matchMedia('(hover: none)').matches
    const isReduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (isTouch || isReduced || !dot.current || !label.current) return

    const xTo = gsap.quickTo(dot.current, 'x', { duration: 0.18, ease: 'power3.out' })
    const yTo = gsap.quickTo(dot.current, 'y', { duration: 0.18, ease: 'power3.out' })
    const lxTo = gsap.quickTo(label.current, 'x', { duration: 0.3, ease: 'power3.out' })
    const lyTo = gsap.quickTo(label.current, 'y', { duration: 0.3, ease: 'power3.out' })

    const onMove = (e: MouseEvent) => {
      xTo(e.clientX); yTo(e.clientY)
      lxTo(e.clientX + 12); lyTo(e.clientY + 12)
    }
    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      const l = t.closest<HTMLElement>('[data-cursor]')?.getAttribute('data-cursor')
      if (l && label.current) {
        label.current.textContent = l
        gsap.to(label.current, { opacity: 1, scale: 1, duration: 0.2 })
      }
    }
    const onOut = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('[data-cursor]') && label.current) {
        gsap.to(label.current, { opacity: 0, scale: 0.85, duration: 0.2 })
      }
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseover', onOver)
    window.addEventListener('mouseout', onOut)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
      window.removeEventListener('mouseout', onOut)
    }
  }, [])

  return (
    <>
      <div ref={dot} className="cursor-dot" aria-hidden="true" />
      <span ref={label} className="cursor-label" aria-hidden="true" />
    </>
  )
}
