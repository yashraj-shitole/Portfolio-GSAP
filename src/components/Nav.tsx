import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { data } from '../data'

export function Nav() {
  const [active, setActive] = useState<string>('about')
  const [mobileOpen, setMobileOpen] = useState(false)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll progress bar
    if (!progressRef.current) return
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        if (progressRef.current) {
          progressRef.current.style.transform = `scaleX(${self.progress})`
        }
      },
    })
    return () => st.kill()
  }, [])

  useEffect(() => {
    // Active section indicator
    const triggers = data.sections.map((s) => {
      const triggerEl = document.getElementById(s.id)
      if (!triggerEl) return null
      return ScrollTrigger.create({
        trigger: triggerEl,
        start: 'top 50%',
        end: 'bottom 50%',
        onEnter: () => setActive(s.id),
        onEnterBack: () => setActive(s.id),
      })
    })
    return () => { triggers.forEach((t) => t?.kill()) }
  }, [])

  const scrollTo = (id: string) => {
    setMobileOpen(false)
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <header className="nav fixed top-0 left-0 right-0 z-50">
        <div className="relative glass-deep">
          <div
            ref={progressRef}
            className="absolute top-0 left-0 right-0 h-[2px] origin-left"
            style={{
              background: 'hsl(var(--accent-h) var(--accent-s) var(--accent-l))',
              transform: 'scaleX(0)',
            }}
            aria-hidden="true"
          />
          <div className="container-x flex items-center justify-between h-14 md:h-16">
            <button
              onClick={() => scrollTo('hero')}
              data-cursor="// home"
              className="font-display text-lg font-medium tracking-tight"
              style={{ color: 'hsl(var(--ink-h) var(--ink-s) var(--ink-l))' }}
            >
              <span className="text-accent">Y</span>S
            </button>

            <nav className="hidden md:flex items-center gap-1">
              {data.sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  data-cursor={`// ${s.title.toLowerCase()}`}
                  className="relative px-3 py-2 label-cap transition-colors duration-base"
                  style={{
                    color: active === s.id
                      ? 'hsl(var(--ink-h) var(--ink-s) var(--ink-l))'
                      : 'hsl(var(--ink-soft-h) var(--ink-soft-s) var(--ink-soft-l))',
                  }}
                >
                  {s.title}
                  {active === s.id && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute left-3 right-3 -bottom-0.5 h-px"
                      style={{ background: 'hsl(var(--accent-h) var(--accent-s) var(--accent-l))' }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </nav>

            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden w-10 h-10 flex items-center justify-center"
              aria-label="Toggle menu"
              data-cursor="// menu"
            >
              <span className="block w-5 h-px" style={{ background: 'hsl(var(--ink-h) var(--ink-s) var(--ink-l))', transform: mobileOpen ? 'translateY(0) rotate(45deg)' : 'translateY(-3px)', transition: 'transform 200ms' }} />
              <span className="block w-5 h-px absolute" style={{ background: 'hsl(var(--ink-h) var(--ink-s) var(--ink-l))', transform: mobileOpen ? 'translateY(0) rotate(-45deg)' : 'translateY(3px)', transition: 'transform 200ms' }} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <div className="absolute inset-0" style={{ background: 'hsl(var(--bg-h) var(--bg-s) var(--bg-l) / 0.6)', backdropFilter: 'blur(12px)' }} />
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 30 }}
              className="relative pt-24 px-6"
              onClick={(e) => e.stopPropagation()}
            >
              {data.sections.map((s, i) => (
                <motion.button
                  key={s.id}
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.05 + i * 0.04 }}
                  onClick={() => scrollTo(s.id)}
                  className="block w-full text-left py-4 font-display text-3xl"
                  style={{ color: 'hsl(var(--ink-h) var(--ink-s) var(--ink-l))' }}
                >
                  {s.title}
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
