---
name: gsap
description: GSAP animation patterns for the portfolio site — preloader timeline, hero reveal (SplitText), scroll-triggered sections (ScrollTrigger), marquees, parallax, hover micro-interactions, magnetic effects, 3D tilt, page-load sequences, cursor glow, infinite floats, custom easings. React-flavored (useGSAP hook, refs, auto-cleanup). Use when asked to "animate", "add scroll reveal", "transition", "parallax", "marquee", "page-load animation", "tilt card", "magnetic button", "split text", "stagger", "infinite float", or to wire up any GSAP motion in the portfolio site.
model: sonnet
risk_level: LOW
version: 1.1.0
---

# GSAP Animation Skill (Portfolio, v1.1)

> **Replaces** the JARVIS-HUD-flavored `gsap-skill.md` (deleted). v1.1 updates v1.0 (portfolio) for the **hybrid editorial + glass** direction, adds SplitText / Flip / MotionPath / Observer / CustomEase / magnetic / tilt / cursor patterns, and documents the **GSAP ↔ Framer** responsibility split.

> **Cross-reference:** for the *what* and *why* of motion choices (durations, easings, distance rules, glass-surface list), see the `frontend-design` skill. This skill is the *how* — the GSAP implementation patterns.

## 1. Overview

GSAP drives every meaningful motion on the portfolio site. The site's aesthetic is editorial + glass: type-driven, restrained, motion as punctuation, with a small number of glass surfaces that float and respond. Every major section has its own timeline.

**Risk Level**: LOW.

**Primary Use Cases**:
- Preloader (multi-stage, exits into hero)
- Hero reveal — SplitText on the headline
- ScrollTrigger on every section (parallax, fade-in, scale, blur)
- 3D tilt on project cards
- Magnetic hover on CTAs
- Cursor glow + hover label
- Marquee strip (continuous horizontal motion)
- Infinite floating decorative elements
- Page-load sequence chaining all of the above

## 2. Stack and Versions

| Package | Version | Notes |
|---|---|---|
| `react` | `^18` |  |
| `react-dom` | `^18` |  |
| `gsap` | `^3.12` | Core, includes ScrollTrigger, SplitText is now bundled as `SplitText` in v3.13+ (otherwise Club GreenSock). |
| `@gsap/react` | `^3.12` | `useGSAP` hook |
| `framer-motion` | `^11` | Layout/AnimatePresence only (see §11) |
| `lenis` | `^1` | Smooth scroll (optional) |

**Register plugins once at the app root:**

```tsx
// main.tsx
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'  // if available
import { Flip } from 'gsap/Flip'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { Observer } from 'gsap/Observer'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(ScrollTrigger, SplitText, Flip, MotionPathPlugin, Observer, CustomEase)
```

**SplitText is a Club GreenSock plugin** in older versions. If you can't get a license, fall back to manually wrapping each word in a span (see §5) — GSAP's `gsap.from` works the same on either.

## 3. Core React Patterns — unchanged from v1.0

### 3.1 `useGSAP` is the only hook

```tsx
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'

export function Section() {
  const container = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.from('.reveal', { y: 24, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out' })
  }, { scope: container })

  return <section ref={container}>...</section>
}
```

### 3.2 Refs, never `document.querySelector` inside animated components

`{ scope: container }` makes all selectors relative to that ref. This is what enables automatic cleanup.

### 3.3 `gsap.set` for initial state — avoid flash

```tsx
useGSAP(() => {
  gsap.set('.reveal', { y: 24, opacity: 0 })
  gsap.to('.reveal', { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: 'power3.out' })
}, { scope: container })
```

### 3.4 Cleanup is automatic

`useGSAP` creates a `gsap.context()` and calls `ctx.revert()` on unmount. Don't manually `kill()` what `useGSAP` created.

## 4. Preloader — new in v1.1

The preloader is a multi-stage timeline. Total duration ≤ 1.5s. It exits by handing off to the hero reveal.

```tsx
export function Preloader({ onComplete }: { onComplete: () => void }) {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onComplete()
      return
    }

    const messages = [
      'Loading Components...',
      'Initializing Portfolio...',
      'Compiling Experience...',
      'Rendering Projects...',
      'Building Developer Profile...',
      'Ready.',
    ]
    let i = 0
    const msgEl = root.current!.querySelector('.preloader__msg')!
    const msgInterval = setInterval(() => {
      if (i < messages.length - 1) {
        i++
        gsap.fromTo(msgEl, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' })
        msgEl.textContent = messages[i]
      }
    }, 220)

    const tl = gsap.timeline({
      onComplete: () => {
        clearInterval(msgInterval)
        onComplete()
      },
    })

    tl.from('.preloader__logo', { scale: 0, duration: 0.6, ease: 'back.out(1.7)' })
      .from('.preloader__bar-fill', { scaleX: 0, duration: 1.1, ease: 'power2.inOut' }, '<')
      .to('.preloader__bar-fill', { backgroundColor: 'var(--accent)', duration: 0.2 }, '-=0.1')
      .to('.preloader', {
        yPercent: -100,
        duration: 0.8,
        ease: 'power4.inOut',
      }, '+=0.1')
  }, { scope: root })

  return (
    <div ref={root} className="preloader">
      <div className="preloader__logo">YS</div>
      <div className="preloader__bar"><div className="preloader__bar-fill" /></div>
      <div className="preloader__msg">Loading Components...</div>
    </div>
  )
}
```

**Hand-off to hero:** the preloader triggers `onComplete`, which flips a `loaded` state in `App`. The hero is already mounted (with `gsap.set` to opacity 0); the preloader exit's `yPercent: -100` reveals it. Both are timed to start the hero reveal at `-=0.4` of the preloader exit so they overlap.

## 5. Hero — SplitText

```tsx
useGSAP(() => {
  // Manual word-wrap fallback (works without the SplitText plugin):
  // <h1>Yashraj Shitole</h1> becomes <h1><span class="word">Yashraj</span> <span class="word">Shitole</span></h1>
  // (Or use SplitText if licensed: new SplitText('.headline', { type: 'chars,words' }))

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

  tl.from('.nav', { y: -8, opacity: 0, duration: 0.5 })
    .from('.headline .word', {
      y: 24,
      opacity: 0,
      letterSpacing: '0.04em',
      duration: 0.8,
      stagger: 0.08,
    }, '-=0.2')
    .from('.hero-sub', { y: 12, opacity: 0, duration: 0.6 }, '-=0.4')
    .from('.code-hint', { y: 16, opacity: 0, duration: 0.7 }, '-=0.4')
    .from('.hero-meta', { opacity: 0, duration: 0.4 }, '-=0.3')
}, { scope: container })
```

## 6. Scroll-Triggered Section Reveals — unchanged

```tsx
useGSAP(() => {
  gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
    gsap.from(el, {
      y: 24,
      opacity: 0,
      duration: 0.7,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    })
  })
}, { scope: container })
```

## 7. NEW: 3D Tilt on Cards (vanilla GSAP, no library)

```tsx
useGSAP(() => {
  const cards = gsap.utils.toArray<HTMLElement>('.tilt-card')

  cards.forEach((card) => {
    const onMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      gsap.to(card, {
        rotateY: x * 8,    // max 8°
        rotateX: -y * 8,
        transformPerspective: 1000,
        duration: 0.3,
        ease: 'power2.out',
      })
    }
    const onLeave = () => {
      gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.5, ease: 'power3.out' })
    }
    card.addEventListener('mousemove', onMove)
    card.addEventListener('mouseleave', onLeave)

    return () => {
      card.removeEventListener('mousemove', onMove)
      card.removeEventListener('mouseleave', onLeave)
    }
  })
}, { scope: container })
```

**Disable on touch devices:**

```tsx
const isTouch = matchMedia('(hover: none)').matches
if (isTouch) return
```

## 8. NEW: Magnetic Hover (CTAs)

```tsx
function useMagnetic(ref: RefObject<HTMLElement>, strength = 0.3) {
  useGSAP(() => {
    const el = ref.current
    if (!el || matchMedia('(hover: none)').matches) return

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const x = (e.clientX - rect.left) - rect.width / 2
      const y = (e.clientY - rect.top) - rect.height / 2
      gsap.to(el, { x: x * strength, y: y * strength, duration: 0.4, ease: 'power3.out' })
    }
    const onLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' })
    }

    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, { scope: ref })
}
```

## 9. NEW: Cursor Glow + Hover Label

A small, performant cursor effect. **Not a full particle trail** — that costs fps.

```tsx
export function CursorGlow() {
  const dot = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)

  useGSAP(() => {
    if (matchMedia('(hover: none)').matches) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

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
      const l = t.closest('[data-cursor]')?.getAttribute('data-cursor')
      if (l) {
        gsap.to(label.current, { opacity: 1, scale: 1, duration: 0.2 })
        label.current!.textContent = l
      }
    }
    const onOut = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('[data-cursor]')) {
        gsap.to(label.current, { opacity: 0, scale: 0.8, duration: 0.2 })
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
  }, { scope: dot })

  return (
    <>
      <div ref={dot} className="cursor-dot" aria-hidden="true" />
      <span ref={label} className="cursor-label" aria-hidden="true" />
    </>
  )
}
```

Add `data-cursor="// click"` to any element to label it on hover.

## 10. NEW: Infinite Floating Decorations

```tsx
useGSAP(() => {
  gsap.utils.toArray<HTMLElement>('.float').forEach((el, i) => {
    gsap.to(el, {
      y: '+=12',
      duration: 2 + (i % 3) * 0.4,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: i * 0.2,
    })
  })
}, { scope: container })
```

Stagger the delays by index so they don't all bob in sync. Use `sine.inOut` for organic motion; avoid linear (mechanical) and avoid elastic (cartoonish for editorial).

## 11. NEW: MotionPath — for a hero accent line that draws a path

```tsx
useGSAP(() => {
  gsap.from('.hero-line', {
    motionPath: {
      path: [{ x: 0, y: 0 }, { x: 60, y: -20 }, { x: 120, y: 0 }, { x: 180, y: 30 }],
      curviness: 1.5,
    },
    duration: 1.5,
    ease: 'power2.inOut',
  })
}, { scope: container })
```

Use sparingly. One path-draw in the hero, that's it. More becomes a screensaver.

## 12. NEW: Flip — for layout reflow (a feature grid rearranging)

```tsx
useGSAP(() => {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const state = Flip.getState('.project-card')
      // toggle a class on the grid that changes the order
      document.querySelector('.grid')?.classList.toggle('is-flipped')
      Flip.from(state, { duration: 0.6, ease: 'power2.inOut', stagger: 0.05 })
    })
  })
}, { scope: container })
```

**Note:** Flip is most useful for layout transitions that Framer's `layout` prop can't handle. Default to Framer for the simple case; reach for Flip when the reflow is complex.

## 13. NEW: Observer — for section-snapping (mobile-friendly)

```tsx
useGSAP(() => {
  const sections = gsap.utils.toArray<HTMLElement>('section')
  let current = 0

  Observer.create({
    target: window,
    type: 'wheel,touch',
    onDown: () => { /* snap to prev */ },
    onUp:   () => { /* snap to next */ },
    tolerance: 50,
    preventDefault: true,
  })
}, { scope: container })
```

**Caveat:** section-snap is aggressive and can hurt accessibility (keyboard users, reduced motion). Use only behind a user toggle, or skip it.

## 14. NEW: CustomEase

```tsx
CustomEase.create('editorial', '0.22, 1, 0.36, 1')     // already in --ease-soft
CustomEase.create('snappy', '0.4, 0, 0.2, 1')            // already in --ease-snappy
CustomEase.create('magnetic', '0.34, 1.56, 0.64, 1')    // subtle overshoot
CustomEase.create('reveal', 'M0,0 C0.2,0 0.1,1 1,1')    // slow start, fast end
```

**Use `magnetic`** for magnetic-hover returns (the elastic feel). **Use `reveal`** for hero headline letters (more cinematic than `power3.out`).

## 15. NEW: Timeline Chaining — the page-load sequence

```tsx
useGSAP(() => {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

  tl.from('.nav', { y: -8, opacity: 0, duration: 0.5 })
    .from('.headline .word', { y: 24, opacity: 0, letterSpacing: '0.04em', duration: 0.8, stagger: 0.08 }, '-=0.2')
    .from('.code-hint', { y: 16, opacity: 0, duration: 0.7 }, '-=0.4')
    .from('.hero-sub', { y: 12, opacity: 0, duration: 0.6 }, '-=0.5')
    .from('.hero-meta', { opacity: 0, duration: 0.4 }, '-=0.3')
    .from('.scroll-cue', { opacity: 0, y: 8, duration: 0.5 }, '-=0.2')
}, { scope: container })
```

## 16. NEW: GSAP ↔ Framer Motion split

Both libraries are in the stack. To avoid cleanup races and double-bundle:

| Use GSAP for | Use Framer Motion for |
|---|---|
| Page-load timeline | AnimatePresence (mount/unmount of modals, drawers) |
| ScrollTrigger | `layout` prop (cards reflowing in a grid) |
| SplitText | `layoutId` (shared element transitions) |
| Stagger | Spring micro-interactions (button press) |
| Infinite float | Drag |
| Magnetic hover | Tooltip mount/unmount |
| Observer | Toast / notification enter/exit |
| CustomEase | Page-route transitions |
| 3D tilt | |
| Cursor glow | |

**Rules:**
- A single DOM node uses one library for its motion.
- If a node needs both (e.g., Framer mount → GSAP timeline), pass a ref and have `useGSAP` target it.
- Library choice is per-attribute, not per-file. A `motion.div` mount + a `useGSAP` on its children is fine.

## 17. Performance

### 17.1 Animate only `transform` and `opacity`

Same as v1.0. Layout properties (width, height, top, left, margin) trigger layout, jank.

### 17.2 Batch ScrollTrigger

```tsx
ScrollTrigger.batch('[data-reveal]', {
  start: 'top 80%',
  onEnter: (els) => gsap.to(els, { y: 0, opacity: 1, stagger: 0.08, overwrite: true }),
})
```

### 17.3 `will-change` — apply before, remove after

```tsx
el.style.willChange = 'transform, opacity'
gsap.to(el, { x: 100, onComplete: () => { el.style.willChange = 'auto' } })
```

### 17.4 Reduce motion on mobile + reduced-motion

- Cursor glow / magnetic / tilt: skip on `(hover: none)` (touch devices).
- All reveal timelines: set final state immediately on `(prefers-reduced-motion: reduce)`.
- Marquee: freeze, don't remove (it's a visual element with content).

### 17.5 Glass + GPU

- `backdrop-filter: blur()` repaints on every animation frame if anything underneath moves. Hero parallax + glass = potential 60→45fps drop. Test on a low-end Android.
- If fps drops, remove the parallax on the hero and keep the glass static.

## 18. Anti-Patterns — updated

| Anti-pattern | Why | Do this instead |
|---|---|---|
| `gsap.from()` in render body | Re-runs every render | Wrap in `useGSAP` |
| `document.querySelector` inside animated component | Leaks | Use refs + `{ scope }` |
| Animating layout properties | Triggers layout, jank | Transforms + opacity only |
| `will-change` set permanently | Memory leak | Set in onStart, clear in onComplete |
| `elastic` easings on editorial content | Cartoonish | `power2.out` / `power3.out` / custom `magnetic` |
| New `gsap.timeline()` in render | Re-runs | Build once inside `useGSAP` |
| Missing reduced-motion check | A11y | Set final state immediately |
| `repeat: -1` on non-marquee | Distracts | Reserve for marquees, cursor pulses, infinite floats |
| Individual ScrollTrigger per element | Reflows | `ScrollTrigger.batch` |
| `ease: 'linear'` | Mechanical | Soft/snappy tokens |
| Mixing `gsap.from` and `motion.div` on the same node | Cleanup race | One library per node |
| Glass + heavy parallax | FPS drop | Static glass, motion on the foreground |
| `MotionPath` on more than one element | Screensaver | One path-draw in the hero |
| Section-snap (Observer) on the main scroll | Hurts a11y | Skip it, or put behind a user toggle |
| Multiple cursor effects (dot + trail + ring) | FPS drop | One dot + hover label only |

## 19. Pre-Implementation Checklist

Before any animation:
- [ ] `useGSAP` is the entry point.
- [ ] Selectors inside `{ scope: ref }` or refs to elements.
- [ ] Initial state set with `gsap.set` (or `from`) — no flash.
- [ ] Reduced-motion branch written first.
- [ ] `will-change` added in onStart, removed in onComplete.
- [ ] Animation uses only `transform` and `opacity`.
- [ ] Library choice is clear: GSAP or Framer, not both on the same node.

Before considering the animation "done":
- [ ] 60fps in DevTools Performance.
- [ ] No CLS change with vs without animation.
- [ ] Unmount kills all tweens.
- [ ] Reduced-motion is fully readable.
- [ ] No `console.log` left over.

## 20. Summary

GSAP on the portfolio site in eight rules:

1. **`useGSAP` is the only entry point.**
2. **Refs, not selectors.** Scope to the component.
3. **Transforms and opacity only.**
4. **Three durations.** 200/400/800ms.
5. **Two easings + custom.** `power2.out` / `power3.out` / `magnetic` / `reveal`.
6. **Reduced motion first.** Write the no-animation branch, then animate.
7. **Cleanup is automatic.** Trust `useGSAP`. Don't double-cleanup.
8. **One library per node.** GSAP for timelines/scroll, Framer for layout/mount.

Every animation should serve the content. If you can remove an animation and lose nothing, remove it.
