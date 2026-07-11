// src/components/ParticleReveal.tsx
// A particle assembly effect for a portrait image.
//
// Phase 0 — wait (1.0s after mount): nothing visible. Gives the
// page time to settle and the hero headline to read.
//
// Phase 1 — fly-in (6.0s, after the wait): particles fly in from
// off-screen and travel part-way toward their target positions on
// the image, stopping at the 80% merge waypoint. The image fades
// in to 80% opacity during this phase. Float + rotation are at
// full amplitude from frame 1 of phase 1 — no ramp-in delay.
//
// Phase 2 — float hold (0.5s): the 80% waypoint is held briefly
// while particles continue to float + rotate. Gives the user a
// beat to read the partial assembly.
//
// Phase 3 — fly-out (≈3.5s, staggered): each particle waits a
// random 0..2s past the float hold, then travels to a random
// off-viewport exit point over 1.5s. The image stays at 80%
// opacity. Particles don't fade — they leave as visible dots
// flying off-screen.
//
// Phase 4 (scroll) — at any time, scrolling continues the merge
// from the 80% waypoint to the final target. When the user has
// scrolled past, particles lock into their final positions and
// fade out; the image goes to 100%.
//
// Final state: the image at 80% opacity (or 100% if scrolled),
// no particles left.
import { useRef, useMemo, useState, useLayoutEffect } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { ParticleManifest } from '../data/particle'

export interface ParticleRevealProps {
  /** The full-resolution image URL. */
  src: string
  /** Particle manifest (sampled positions + colors). */
  manifest: ParticleManifest
  /** Alt text for the image. */
  alt: string
  /** Optional caption above the image. */
  caption?: string
  /** Optional meta line below. */
  meta?: string
  /** Optional cursor label. */
  cursorLabel?: string
  /** Maximum rendered width in CSS (e.g. "640px", "100%"). The image
   *  scales to fit, preserving its native aspect ratio. */
  maxWidth?: string
  /** Where the particle "fly-in" originates. "viewport" = from off-screen
   *  edges of the user's viewport; "section" = from the edges of this
   *  component. Default "viewport" — particles fly across the screen. */
  flyOrigin?: 'viewport' | 'section'
  /** Optional external trigger element for the ScrollTrigger. When set,
   *  the assembly progress (0..1) maps to the scroll range of this
   *  element rather than the wrap. Useful when the wrap is small and
   *  nested inside a larger scrollable ancestor (e.g. the hero) — the
   *  caller can anchor the reveal to the ancestor's full height.
   *  Defaults to the wrap itself. */
  triggerRef?: React.RefObject<HTMLElement | null>
}

// Seeded PRNG — same scatter pattern every render.
function makeRng(seed: number) {
  let t = seed | 0
  return () => {
    t = (t + 0x6d2b79f5) | 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

// Phase 0: hold for WAIT_MS after mount before any reveal starts.
// Gives the page a beat to settle and the hero headline to read.
const WAIT_MS = 1000
// Phase 1: fly-in duration. Particles travel from off-screen to the
// 80% merge waypoint over this window. Lengthened so the 1400-dot
// assembly reads as a deliberate "drawing-in" of the image rather
// than a quick snap.
const FLY_MS = 6000
// Phase 1 endpoint: how far along the halo→target path the particles
// stop at. The remaining fraction is reserved for the scroll-driven
// phase 2. 0.8 = "reveal the image to 80 percent" as requested.
const PHASE1_MERGE = 0.8
// How long the particles float at the 80% waypoint before they
// start flying out. The user sees a brief "settle + bob" moment
// after the fly-in lands.
const FLOAT_HOLD_MS = 500
// How long each particle takes to fly from its waypoint to its
// random off-viewport exit point.
const FLY_OUT_MS = 1500
// Spread of per-particle fly-out start times across this window
// after the float hold ends. Larger value = longer "thinning out"
// effect as particles leave one by one.
const FLY_OUT_STAGGER_MS = 2000

export function ParticleReveal({
  src,
  manifest,
  alt,
  caption,
  meta,
  cursorLabel,
  maxWidth = '560px',
  flyOrigin = 'viewport',
  triggerRef,
}: ParticleRevealProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const imgWrapRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<HTMLDivElement[]>([])
  const [size, setSize] = useState({ w: 0, h: 0 })

  // For each particle, pre-compute its off-screen start position,
  // its "halo" position, AND the per-particle parameters for the
  // post-fly-in float + rotation:
  //   - floatAmp: orbit radius around the 80% waypoint (4–10px)
  //   - floatFreq: orbit frequency in rad/s
  //   - floatPhase: starting angle on the orbit
  //   - rotSpeed: continuous rotation rate in rad/s
  //   - rotPhase: starting rotation angle
  //
  //   off-screen  ──fly-in──▶  waypoint + orbit  ──scroll merge──▶  target
  //
  // We pick one of the four viewport edges (top/bottom/left/right) and
  // a random position along that edge. The halo is the target plus a
  // radial offset of 60–100px in a random direction — close to the
  // image but visibly outside it, used as a passing reference point
  // on the way to the 80% waypoint.
  const particles = useMemo(() => {
    const rng = makeRng(0xfa11 ^ manifest.particles.length)
    return manifest.particles.map((p, i) => {
      // Each particle enters from a random edge.
      // Edges: 0=top, 1=right, 2=bottom, 3=left
      const edge = Math.floor(rng() * 4)
      // Position along the edge as a fraction (0..1)
      const along = rng()
      // How far past the edge (as a fraction of the relevant dimension)
      // — between 5% and 40% of the dimension, so they're clearly off
      // screen at the start.
      const overshoot = 0.05 + rng() * 0.35
      // Halo offset: target + a 60–100px radial offset in a random
      // direction. The halo is the "close to image" rest state.
      const haloDist = 60 + rng() * 40
      const haloAngle = rng() * Math.PI * 2
      const haloDx = Math.cos(haloAngle) * haloDist
      const haloDy = Math.sin(haloAngle) * haloDist
      // Float-orbit parameters: each particle bobs around its 80%
      // waypoint once the fly-in lands. Small amplitudes so the dots
      // look like pixels suspended over the image, not a swarm.
      const floatAmp = 4 + rng() * 6
      const floatFreq = 0.6 + rng() * 1.4  // rad/s
      const floatPhase = rng() * Math.PI * 2
      // Continuous rotation: a small square-ish dot rotating reads as
      // a flickering pixel. ±0.4..0.9 rad/s is a nice "fidgety" range.
      const rotSpeed = (rng() < 0.5 ? -1 : 1) * (0.4 + rng() * 0.5)
      const rotPhase = rng() * Math.PI * 2
      // Fly-out parameters: after the float hold (FLOAT_HOLD_MS
      // after fly-in lands), each particle waits for its own
      // random delay (0..FLY_OUT_STAGGER_MS), then travels to a
      // random off-viewport exit point over FLY_OUT_MS. The exit
      // point is on a random viewport edge (not necessarily the
      // one the particle entered from) and well past the edge.
      const flyOutDelay = rng() * FLY_OUT_STAGGER_MS
      const flyOutEdge = Math.floor(rng() * 4)
      const flyOutAlong = rng()
      const flyOutOvershoot = 0.15 + rng() * 0.4
      return {
        ...p, edge, along, overshoot, haloDx, haloDy,
        floatAmp, floatFreq, floatPhase, rotSpeed, rotPhase,
        flyOutDelay, flyOutEdge, flyOutAlong, flyOutOvershoot, idx: i,
      }
    })
  }, [manifest])

  // Measure the image's rendered size — used to scale target positions.
  useLayoutEffect(() => {
    const el = imgWrapRef.current
    if (!el) return
    const measure = () => {
      const r = el.getBoundingClientRect()
      setSize({ w: r.width, h: r.height })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Cached wrap rect — refreshed on scroll/resize instead of every
  // frame. Calling `getBoundingClientRect()` in a per-frame paint loop
  // forces a synchronous layout, which on a complex hero section
  // easily eats 5-15ms per call — i.e. 30-90% of a 16.6ms frame
  // budget. The rect only changes on scroll, resize, or visibility
  // changes, so we can update it lazily on those events rather than
  // every animation frame.
  const wrapRectRef = useRef({ left: 0, top: 0, vw: 0, vh: 0, valid: false })
  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const refresh = () => {
      const r = el.getBoundingClientRect()
      wrapRectRef.current = {
        left: r.left,
        top: r.top,
        vw: window.innerWidth,
        vh: window.innerHeight,
        valid: true,
      }
    }
    refresh()
    window.addEventListener('scroll', refresh, { passive: true })
    window.addEventListener('resize', refresh)
    return () => {
      window.removeEventListener('scroll', refresh)
      window.removeEventListener('resize', refresh)
    }
  }, [])

  // Pre-compute each particle's per-pixel target, halo, and 80%
  // waypoint positions in container-local coordinates. These never
  // change between frames for a given image size — recomputing
  // them inside the paint loop was 1400 × 5 unnecessary
  // multiplies per frame.
  const particlePositions = useMemo(() => {
    if (!size.w) return null
    const w = size.w
    const h = size.h
    const pm = PHASE1_MERGE
    return particles.map((p) => {
      const tx = p.x * w
      const ty = p.y * h
      const hx = tx + p.haloDx
      const hy = ty + p.haloDy
      const wx = hx + pm * (tx - hx)
      const wy = hy + pm * (ty - hy)
      return { tx, ty, wx, wy }
    })
  }, [particles, size.w, size.h])

  useGSAP(
    () => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        // Reveal the image immediately, hide all particles. The image
        // opacity is set directly here so the reduced-motion path
        // doesn't depend on the paint() function (which is declared
        // below).
        if (imgWrapRef.current) imgWrapRef.current.style.opacity = '1'
        for (const el of particlesRef.current) {
          if (el) el.style.opacity = '0'
        }
        return
      }

      const wrap = wrapRef.current
      if (!wrap) return

      // Tear down any previous rAF loop left over from a prior run of
      // this effect (e.g. after a resize changed the size state and
      // useGSAP re-ran). Without this, multiple loops would compete.
      const prevStop = (wrap as any).__stop
      if (typeof prevStop === 'function') prevStop()

      // Capture the wrap element — narrowing works as long as we
      // reference it once outside the closure.
      const wrapEl = wrap

      // Trigger element: by default the wrap itself, so progress 0..1
      // maps to "wrap top hits viewport top" → "wrap bottom hits
      // viewport top" — exactly the trigger's height of scroll range.
      // When the caller passes a `triggerRef` (e.g. a larger ancestor
      // like the hero), we use that instead so the progress maps to the
      // ancestor's full scroll range.
      const scrollState = { t: 0 }
      const triggerEl = triggerRef?.current ?? wrapEl

      // Capture the load-time origin so phase 0/1 timing is anchored
      // to mount, not to the first paint() call. The wait runs even
      // if the first paint() happens a frame later.
      const loadStart = performance.now()

      // paint() — runs every frame that either state changes. Switches
      // between the three phases (wait → fly-in → float → fly-out)
      // based on elapsed time since mount and current scroll
      // progress.
      function paint() {
        if (!size.w) return
        const positions = particlePositions
        if (!positions) return
        const wr = wrapRectRef.current
        if (!wr.valid) return
        const vw = wr.vw
        const vh = wr.vh
        const wrapLeft = wr.left
        const wrapTop = wr.top

        // Image reveal — rises 0 → 0.8 during the fly-in, then
        // continues to 1.0 driven by scroll. The time-based
        // fly-out does not touch image opacity; the user has to
        // scroll to complete the merge past 80%.
        const elapsed = performance.now() - loadStart
        const phase1Alpha =
          elapsed <= WAIT_MS
            ? 0
            : Math.min(1, (elapsed - WAIT_MS) / FLY_MS)
        const imgOpacity = Math.min(
          1,
          PHASE1_MERGE * phase1Alpha +
            (1 - PHASE1_MERGE) * scrollState.t,
        )
        if (imgWrapRef.current) {
          imgWrapRef.current.style.opacity = String(imgOpacity)
        }

        // Hoisted loop invariants — these are the same for every
        // particle this frame. Computed once outside the loop.
        const phase1Eased = 1 - Math.pow(1 - phase1Alpha, 3)
        const tFloat = (elapsed - WAIT_MS) / 1000
        const phase1Active = phase1Alpha > 0
        const flyInEndMs = WAIT_MS + FLY_MS
        const floatEndMs = flyInEndMs + FLOAT_HOLD_MS

        // Once the last particle has finished flying out, all
        // particles are off-screen and the rAF loop has no work
        // to do — bail out and stop ticking.
        const lastFlyOutEndMs = floatEndMs + FLY_OUT_STAGGER_MS + FLY_OUT_MS
        if (elapsed > lastFlyOutEndMs) {
          const els = particlesRef.current
          for (let i = 0; i < els.length; i++) {
            const el = els[i]
            if (el && el.style.opacity !== '0') el.style.opacity = '0'
          }
          settled = true
          return
        }

        // Per-particle: compute the time-based "how merged is the
        // waypoint-to-target transition" alpha. Without scroll
        // intervention, this is 0 during the float hold, then
        // climbs to 1 over each particle's fly-out window. With
        // scroll, we use whichever is further along — the user
        // can still scroll-snap the image to 100%.
        // (Pre-compute the shared base values; the per-particle
        // offset is computed inline below.)
        // We also use scrollState.t directly to gate the time-based
        // fly-out: once the user scrolls past, particles that
        // haven't flown out yet snap into the image instead of
        // flying off. That's a more useful behavior than continuing
        // to fly them out while the user is clearly trying to read
        // the image.

        const els = particlesRef.current
        for (let i = 0; i < els.length; i++) {
          const el = els[i]
          if (!el) continue
          const t = particles[i]
          const pos = positions[i]
          if (!t || !pos) continue

          // Off-screen start position in container-local pixels.
          // Only matters during the fly-in.
          let sx = 0
          let sy = 0
          switch (t.edge) {
            case 0: // top edge of viewport
              sx = t.along * vw - wrapLeft
              sy = -t.overshoot * vh
              break
            case 1: // right edge
              sx = vw + t.overshoot * vw - wrapLeft
              sy = t.along * vh - wrapTop
              break
            case 2: // bottom edge
              sx = t.along * vw - wrapLeft
              sy = vh + t.overshoot * vh - wrapTop
              break
            case 3: // left edge
              sx = -t.overshoot * vw
              sy = t.along * vh - wrapTop
              break
          }

          // Pre-computed waypoint (0.8) and target (1.0) positions.
          const { tx, ty, wx, wy } = pos

          // Float orbit offset around the current position. The
          // orbit runs continuously from frame 1 of phase 1 so
          // there's no velocity snap when the fly-in lands.
          const orbitAngle = t.floatPhase + t.floatFreq * tFloat
          const ox = t.floatAmp * Math.cos(orbitAngle)
          const oy = t.floatAmp * Math.sin(orbitAngle)

          let x: number
          let y: number
          let rotDeg: number
          let alpha: number

          if (!phase1Active) {
            // Phase 0 — wait: invisible, parked at off-screen.
            x = sx
            y = sy
            rotDeg = 0
            alpha = 0
          } else if (scrollState.t > 0) {
            // Scroll-driven merge: lerp from waypoint to target
            // by scrollState.t. If the user scrolls, this branch
            // wins regardless of where each particle is in its
            // fly-out timing. Particles end up at their targets
            // and the image at 100%.
            const m = scrollState.t
            const mergedX = (1 - m) * wx + m * tx
            const mergedY = (1 - m) * wy + m * ty
            x = mergedX + ox
            y = mergedY + oy
            rotDeg = t.rotPhase + (t.rotSpeed * tFloat) * (180 / Math.PI)
            alpha = 1
          } else {
            // Position while flying in / floating at the waypoint.
            x = sx + (wx - sx) * phase1Eased + ox
            y = sy + (wy - sy) * phase1Eased + oy
            rotDeg = t.rotPhase + (t.rotSpeed * tFloat) * (180 / Math.PI)
            alpha = 1

            // Fly-out: once fly-in has landed, each particle waits
            // for its own random delay (0..FLY_OUT_STAGGER_MS) past
            // the float hold, then travels to a random off-viewport
            // exit point over FLY_OUT_MS. The orbit keeps running
            // during the fly-out so the exit trajectory wobbles
            // slightly rather than being a straight line.
            if (elapsed >= floatEndMs + t.flyOutDelay) {
              // Compute the exit point once per particle, in
              // container-local pixels. Switch used to live inline
              // three times — hoisted so we only pay for it once
              // per particle per frame.
              const fe = t.flyOutEdge
              let ex = 0
              let ey = 0
              if (fe === 0) {
                ex = t.flyOutAlong * vw - wrapLeft
                ey = -t.flyOutOvershoot * vh
              } else if (fe === 1) {
                ex = vw + t.flyOutOvershoot * vw - wrapLeft
                ey = t.flyOutAlong * vh - wrapTop
              } else if (fe === 2) {
                ex = t.flyOutAlong * vw - wrapLeft
                ey = vh + t.flyOutOvershoot * vh - wrapTop
              } else {
                ex = -t.flyOutOvershoot * vw
                ey = t.flyOutAlong * vh - wrapTop
              }
              const tOut = (elapsed - floatEndMs - t.flyOutDelay) / FLY_OUT_MS
              if (tOut < 1) {
                // Eased fly-out — ease-in cubic so particles
                // start slow and accelerate as they leave the
                // image, like leaves caught by a draft.
                const tOutEased = tOut * tOut * tOut
                // Fly-out starts from the waypoint (not the
                // current orbit position) so the trajectory is
                // predictable. The orbit still wobbles the
                // particle on top.
                x = wx + (ex - wx) * tOutEased + ox
                y = wy + (ey - wy) * tOutEased + oy
                // Rotation continues advancing during the
                // fly-out — particles spin faster as they
                // accelerate away.
                rotDeg = t.rotPhase + (t.rotSpeed * tFloat) * (180 / Math.PI)
              } else {
                // Parked at the exit point, fully invisible.
                x = ex
                y = ey
                alpha = 0
              }
            }
          }

          // translate3d promotes each particle to its own GPU
          // compositor layer so the browser can update them in
          // parallel without re-laying out.
          const transform =
            `translate3d(${x}px, ${y}px, 0) rotate(${rotDeg}deg)`
          const e = el as any
          if (e._lastTransform !== transform) {
            e.style.transform = transform
            e._lastTransform = transform
          }
          // Opacity: only write when it actually changes.
          const opStr = alpha < 0.001 ? '0' : alpha > 0.999 ? '1' : String(alpha)
          if (e._lastOpacity !== opStr) {
            e.style.opacity = opStr
            e._lastOpacity = opStr
          }
        }
      }

      // Expose paint() for the resize re-paint.
      ;(wrap as any).__paint = paint

      // Drive paint() every frame for the entire reveal. The loop
      // starts on mount and stops when the component unmounts OR
      // when paint() detects the reveal is fully settled (image at
      // 100%, particles at 0%). Stopping the loop after settle
      // means we're not burning a 60fps frame budget updating 1400
      // invisible elements for the rest of the page's lifetime.
      let rafId = 0
      let alive = true
      let settled = false
      const tick = () => {
        if (!alive || settled) return
        paint()
        rafId = requestAnimationFrame(tick)
      }
      rafId = requestAnimationFrame(tick)
      // Cleanup on unmount. useGSAP's scope cleanup fires when the
      // component unmounts, but we also stash a stop fn on the wrap
      // so a re-run from a dependency change tears down the old loop.
      const stop = () => {
        alive = false
        if (rafId) cancelAnimationFrame(rafId)
      }
      ;(wrap as any).__stop = stop

      // Phase 2 — scroll-driven merge. Tweens scrollState.t 0→1 as
      // the trigger element scrolls past the viewport. Once
      // scrollState.t > 0, paint() switches to reading it and the
      // 80% waypoint collapses into the final target. The float
      // and rotation taper off as the merge completes.
      gsap.to(scrollState, {
        t: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: triggerEl,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.6,
        },
        onUpdate: paint,
      })

      paint()
    },
    { scope: wrapRef, dependencies: [size.w, size.h, manifest.particles.length] },
  )

  // Re-paint on resize so positions stay correct.
  useLayoutEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const paint = (wrap as any).__paint
    if (paint) paint()
  }, [size])

  return (
    <div
      ref={wrapRef}
      className="relative"
      style={{ maxWidth, width: '100%' }}
      data-cursor={cursorLabel ? `// ${cursorLabel}` : undefined}
    >
      {caption && <p className="label-cap mb-3">{caption}</p>}
      <div
        ref={imgWrapRef}
        className="relative w-full"
        style={{
          aspectRatio: `${manifest.sourceSize[0]} / ${manifest.sourceSize[1]}`,
          opacity: 0, // initial state, animated by paint()
        }}
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-contain"
          draggable={false}
        />
        {/* Particles — rendered on top of the image, fly from off-screen
            to their (x, y) positions, then fade out. */}
        {particles.map((p, i) => (
          <div
            key={i}
            ref={(el) => { if (el) particlesRef.current[i] = el }}
            className="absolute left-0 top-0 rounded-full will-change-transform pointer-events-none"
            style={{
              width: 3,
              height: 3,
              backgroundColor: `rgb(${p.r}, ${p.g}, ${p.b})`,
              // Initial: off-screen, hidden. Real values set in paint().
              transform: 'translate(-1000px, -1000px)',
              opacity: 0,
              boxShadow: `0 0 4px rgba(${p.r}, ${p.g}, ${p.b}, 0.55)`,
            }}
          />
        ))}
      </div>
      {meta && <p className="label-cap mt-3 ink-soft">{meta}</p>}
    </div>
  )
}
