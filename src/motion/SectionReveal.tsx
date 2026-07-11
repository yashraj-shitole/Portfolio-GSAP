import { useRef, useEffect } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'

/**
 * Reusable section reveal. Children animate in (y + opacity) when the
 * section enters the viewport. Respects reduced motion by setting the
 * final state immediately.
 */
export function SectionReveal({
  id,
  className = '',
  children,
}: {
  id: string
  className?: string
  children: React.ReactNode
}) {
  const container = useRef<HTMLElement>(null)
  const reduced = useRef(false)

  useEffect(() => {
    reduced.current = matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  useGSAP(
    () => {
      const els = gsap.utils.toArray<HTMLElement>('[data-reveal]', container.current)
      if (reduced.current) {
        gsap.set(els, { opacity: 1, y: 0 })
        return
      }
      gsap.from(els, {
        y: 32,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: {
          trigger: container.current,
          start: 'top 78%',
          toggleActions: 'play none none none',
        },
      })
    },
    { scope: container },
  )

  return (
    <section id={id} ref={container} className={`section ${className}`}>
      {children}
    </section>
  )
}
