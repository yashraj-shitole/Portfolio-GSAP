---
name: frontend-design
description: Design guidance for the portfolio site — editorial typography and layout with selective glassmorphism accents. Use for any visual decision: theme, type, color, spacing, motion, layout, glass surfaces, cursor effects, microinteractions. Stack: Vite + React + Tailwind + GSAP + Framer Motion.
model: sonnet
risk_level: LOW
version: 1.1.0
---

# Frontend Design Skill (v1.1 — hybrid editorial + glass)

> **Update from v1.0:** the original was pure editorial-minimalism. The user picked the **hybrid** direction: editorial layout, typography, and motion language, with **selective glassmorphism accents** on a handful of surfaces. Glass is a spice, not the base.

> **Cross-reference:** motion *what* lives here (§7); motion *how* lives in the `gsap` skill. Framer Motion handles *layout* (mount, route, layoutId); GSAP handles *timelines, scroll, and tweening*. See the **GSAP ↔ Framer split** in §11.

## 1. Overview

The portfolio uses an **editorial + glass** hybrid. Most of the page is editorial: type-driven hierarchy, generous whitespace, hairline rules, restrained palette. A small set of surfaces — the nav, project cards, and one or two floating elements — get a frosted-glass treatment to add depth and a "premium" feel without overwhelming the content.

**Risk Level**: LOW — visual decisions only.

**Primary Use Cases**:
- Choosing type pairing, scale, weight
- Defining the color palette (light + dark, with glass tokens)
- Building the spacing scale
- Reviewing components against the glass + anti-pattern lists
- Picking which surfaces get glass and which stay flat

## 2. Design Principles

In priority order — when in doubt, apply the higher one.

1. **Editorial first.** Type, space, and hairline rules do 80% of the work. Glass is decoration on top.
2. **Restraint.** Every visual element must justify its presence. Glass surfaces especially: if you can't name a reason, make it flat.
3. **Generous whitespace.** Empty space is a feature. When the layout feels "almost right," add more space.
4. **One accent color.** A single warm red-orange used sparingly.
5. **Glass is a depth cue, not a theme.** Three to five glass surfaces per page. The rest is flat.
6. **Motion as punctuation.** Animation marks moments (entrance, transition, emphasis). It does not decorate.
7. **Performance is design.** Glass blur, animations, and large images all cost. If a surface is glass, its content must be high-priority (otherwise the blur is paying for nothing).

## 3. Typography

### 3.1 Pairing — unchanged from v1.0

One display serif for headings, one neutral sans for body, one mono for code. Contrast carries the design.

| Role | Recommended | Fallback |
|---|---|---|
| Display | Fraunces, GT Sectra, Newsreader | `'Fraunces', Georgia, serif` |
| Body | Inter, Söhne | `'Inter', system-ui, sans-serif` |
| Mono | JetBrains Mono, Berkeley Mono | `'JetBrains Mono', ui-monospace, monospace` |

### 3.2 Scale (modular, ratio 1.250)

```css
:root {
  --type-xs:   clamp(0.75rem, 0.72rem + 0.15vw, 0.875rem);
  --type-sm:   clamp(0.875rem, 0.84rem + 0.18vw, 1rem);
  --type-base: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
  --type-md:   clamp(1.125rem, 1.05rem + 0.4vw, 1.375rem);
  --type-lg:   clamp(1.5rem, 1.35rem + 0.75vw, 2rem);
  --type-xl:   clamp(2rem, 1.7rem + 1.5vw, 3rem);
  --type-2xl:  clamp(2.75rem, 2.2rem + 2.75vw, 4.5rem);
  --type-3xl:  clamp(3.5rem, 2.6rem + 4.5vw, 6.5rem);
}
```

### 3.3 Line-height, tracking, weight — unchanged

- Display: `line-height 0.95–1.05`, `letter-spacing -0.02em to -0.04em` (tighter as size grows), weight 400–500.
- Body: `line-height 1.5–1.65`, no tracking, weight 400.
- All-caps labels: `tracking 0.12em`, weight 500, color `--ink-soft`.

## 4. Color Tokens

### 4.1 Base palette — unchanged

| Token | Light HSL | Dark HSL | Role |
|---|---|---|---|
| `--bg` | `40 20% 97%` | `220 15% 8%` | Page background |
| `--ink` | `220 15% 12%` | `40 15% 92%` | Primary text |
| `--ink-soft` | `220 8% 35%` | `220 8% 65%` | Secondary text |
| `--rule` | `220 10% 88%` | `220 10% 22%` | Hairlines, borders |
| `--accent` | `12 80% 50%` | `12 75% 58%` | The single accent |

### 4.2 NEW: Glass tokens

Glass is parameterized so every glass surface is consistent. Never hardcode glass values in components.

```css
:root {
  /* Glass */
  --glass-bg:        hsl(var(--bg-h) var(--bg-s) var(--bg-l) / 0.55);
  --glass-bg-strong: hsl(var(--bg-h) var(--bg-s) var(--bg-l) / 0.78);
  --glass-border:    hsl(var(--ink-h) var(--ink-s) var(--ink-l) / 0.10);
  --glass-shadow:    0 8px 32px hsl(var(--ink-h) var(--ink-s) var(--ink-l) / 0.08);
  --glass-blur:      16px;          /* backdrop-filter blur */
  --glass-blur-deep: 28px;          /* for the nav and modals */
  --glass-saturate:  140%;          /* backdrop-filter saturate */
}

@media (prefers-color-scheme: dark) {
  :root {
    --glass-bg:        hsl(220 15% 8% / 0.55);
    --glass-bg-strong: hsl(220 15% 8% / 0.78);
    --glass-border:    hsl(40 15% 92% / 0.08);
    --glass-shadow:    0 8px 32px hsl(0 0% 0% / 0.30);
  }
}
```

Tailwind utility mapping (see §6.1):

```
.glass        { @apply backdrop-blur-glass bg-glass-bg border border-glass-border shadow-glass; }
.glass-deep   { @apply backdrop-blur-glassDeep bg-glass-bg-strong border border-glass-border shadow-glass; }
```

### 4.3 Usage rules

- **Accent is rationed.** Links on hover, active nav, marquee highlight, one italic word in hero.
- **Borders are hairlines.** `1px solid var(--rule)`. No `2px`. No shadows except inside glass.
- **No gradients on body backgrounds.** A subtle conic gradient is allowed behind the hero glass (one place, never repeated).

## 5. Spacing — unchanged from v1.0

```css
:root {
  --space-1:  0.25rem;
  --space-2:  0.5rem;
  --space-3:  0.75rem;
  --space-4:  1rem;
  --space-6:  1.5rem;
  --space-8:  2rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-24: 6rem;
  --space-32: 8rem;
  --space-48: 12rem;
}
```

## 6. Layout

### 6.1 Container and grid — unchanged

```css
.container { max-width: 1200px; margin-inline: auto; padding-inline: clamp(var(--space-4), 4vw, var(--space-12)); }
.grid-12   { display: grid; grid-template-columns: repeat(12, 1fr); gap: var(--space-6); }
```

### 6.2 NEW: Glass-surface rules — when to use glass, when not to

Use glass (in order of priority):
1. **Sticky nav** — because it's layered over scrolling content. Glass separates it visually.
2. **Project cards** — because they need to feel premium and stand out from the editorial list pattern.
3. **Hero secondary panel** (stat block or "currently at" pill) — if it sits over imagery.
4. **Modals / drawers** — for the same reason as the nav.
5. **One "code hint" overlay** in the hero (a small frosted window with a code snippet).

Do NOT use glass for:
- Body text containers
- Section dividers
- Buttons (use flat color, not glass)
- Footer
- Skill categories list
- Timeline entries

**Why this rule:** glass is expensive (paint cost on every frame) and visually loud. Use it where the depth cue earns its cost: surfaces that float over other content.

### 6.3 "Code hints" — the developer-portfolio signature

The site should have visible **code references** to make the developer personality clear:

- A small glass panel in the hero showing a fake `git` command or `code snippet` (with syntax highlighting, but the language is irrelevant — pick JS or bash, 2–4 lines).
- A `<pre>` block in the About section with a stylized "what I do" manifesto (mono font, comments in `--ink-soft`).
- Skill categories displayed in a `// Languages` / `// Frameworks` comment-prefixed grid.
- Mouse-cursor dot that, on hover, shows a label like `// hover` or `click()` near it.

Keep these to 3–5 total. Too many and the site becomes a code editor, not a portfolio.

## 7. Motion Principles

| Token | Value | Use |
|---|---|---|
| `--motion-fast` | `200ms` | hover, focus, micro-interactions |
| `--motion-base` | `400ms` | state changes, panel transitions |
| `--motion-slow` | `800ms` | page-load reveals, section transitions |

| Easing | cubic-bezier | Use |
|---|---|---|
| `--ease-soft` | `cubic-bezier(0.22, 1, 0.36, 1)` | entrances, reveals — settle |
| `--ease-snappy` | `cubic-bezier(0.4, 0, 0.2, 1)` | exits, hovers — snap |

Distance rules: 8–24px y-offset on reveals, `1.0 → 1.03` scale on hover (never more), 60–100ms stagger.

**Reduced motion:** honor `prefers-reduced-motion: reduce` everywhere. Glass surfaces remain, but animations and parallax collapse to final state. The site should be fully readable and navigable without motion.

## 8. Component Patterns — updated for glass

### 8.1 Hero
- Editorial headline (SplitText-ready), one italic accent word.
- Small glass "code hint" panel to the right of the headline (cols 9–12 on desktop, below on mobile).
- Floating decorative elements (infinite GSAP float).
- No CTA button — the contact section is the CTA. Optional: one magnetic "→ see work" link that scrolls to Projects.

### 8.2 Nav — GLASS
- `backdrop-filter: blur(var(--glass-blur-deep)) saturate(var(--glass-saturate))`.
- `background: var(--glass-bg-strong)`, `border-bottom: 1px solid var(--glass-border)`.
- Top: 2px scroll progress bar (accent color).
- Active section: bottom indicator pill in `--accent`.
- Mobile: full-height glass drawer with framer-motion `AnimatePresence`.

### 8.3 Project card — GLASS
- `backdrop-filter: blur(var(--glass-blur))`.
- 3D tilt on mouse move (GSAP, max 8° rotation).
- Project title (display serif), description (body), tech stack pills, links.
- Hover: card lifts 4px, accent underline draws in on the title, subtle scale `1.02`.
- Each card has an `accentColor` (small visual variation across cards).

### 8.4 Experience timeline — FLAT
- Vertical hairline on the left, entries alternate side on desktop, single column on mobile.
- Current role (end === null) has a "Present" pill in `--accent` with a gentle pulse (GSAP `repeat: -1` with a 2s cycle).

### 8.5 Skill category — FLAT with mono prefix
- Each category: `// Languages` mono prefix, then a list.
- On hover, items in that category get a subtle `--ink → --accent` color shift.

### 8.6 Marquee — FLAT
- A single continuous strip between sections, italic display, `--ink-soft`.
- See `gsap` skill §6 for the implementation.

## 9. Anti-Patterns — updated

| Anti-pattern | Why | Replace with |
|---|---|---|
| Glass on more than 5 surfaces per page | Expensive, visually loud | Reserve glass for nav, cards, modals, one code-hint panel |
| Animated glass (changing blur on scroll) | Janky, costs fps | Static glass values |
| Backdrop-filter on `<body>` or large sections | Severe repaint cost | Apply glass only on the floating element |
| Gradient backgrounds | Reads 2010s | Flat `--bg` |
| Drop shadows on flat cards | Reads Material | Hairline `--rule`, or use glass |
| Multiple accent colors | Dilutes the design | The single `--accent` |
| Stock photography | Reads as filler | Real project screenshots, only when useful |
| Cursor trail (multi-element follower) | Distracting, costs fps | One small dot + hover label, only on desktop |
| "Built with ❤️" footer | Cliché | Name + year + accent dot |
| Multiple competing easings | Looks random | Use `--ease-soft` and `--ease-snappy` only |

## 10. Accessibility — unchanged

- AA contrast minimum (AAA for `--ink` on `--bg`).
- `prefers-reduced-motion: reduce` honored (motion and parallax collapse; glass remains).
- Visible focus rings (`2px solid var(--accent)` with `2px` offset).
- Semantic HTML (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`).
- One `<h1>` per page; heading levels don't skip.
- Skip link is the first focusable element.

### NEW: glass + accessibility

- `backdrop-filter` is decorative; the content must be readable on any background.
- When `--glass-bg` is too low contrast on a busy background, fall back to `--glass-bg-strong` (less see-through) or a flat fill.
- Test the nav on a section with a busy image underneath — text must remain legible.
- Don't rely on blur alone to separate a surface; always pair with a border.

## 11. NEW: GSAP ↔ Framer Motion split

Both libraries are in the stack. To avoid the cleanup-race and double-bundle issues, follow this responsibility split:

| Use GSAP for | Use Framer Motion for |
|---|---|
| Page-load timeline (preloader → hero) | AnimatePresence for mount/unmount (modals, drawers) |
| ScrollTrigger (parallax, scroll reveals, scrub) | `layout` prop for layout transitions (cards reflowing in a grid) |
| SplitText (char/word/line reveals) | `layoutId` for shared element transitions between routes |
| Stagger (multiple children revealing) | Spring-based micro-interactions (button press, toggle) |
| Infinite float (decorative elements) | Drag (if any) |
| Magnetic hover (custom cursor on CTAs) | Tooltip mount/unmount |
| Observer (gesture-based nav) | Page-route transitions (if added) |
| Custom Ease | Toast / notification enter/exit |
| Timeline scrubbing | |

**Rules:**
- A single component uses one library for its motion. Don't mix `gsap.from()` and `motion.div` on the same node.
- If you need both (e.g., a Framer mount animation that then triggers a GSAP timeline), use `useGSAP` and a ref-based handoff.
- Library choice is per-attribute, not per-file. A `motion.div` for mount + a `useGSAP` for the inner timeline is fine.

## 12. Implementation Tips

- **CSS approach:** Tailwind + a small `tokens.css` for design tokens (colors, type, spacing, motion, glass). Tailwind's `@theme` directive (v4) or extended `theme.extend.colors` (v3) maps tokens to utilities.
- **Dark mode:** token-driven via `prefers-color-scheme`; no toggle in v1.
- **Responsiveness:** mobile-first. The 12-col grid collapses to 4-col with 16px gutter on mobile. Glass blur reduces from 28px to 12px on mobile to save GPU.
- **Performance budgets:**
  - Total JS bundle: < 250KB gzipped.
  - LCP < 1.5s on throttled fast-3G.
  - CLS < 0.05.
  - No layout shift when preloader exits.

## 13. Pre-Implementation Checklist

Before any component:
- [ ] Tokens file imported once in `main.tsx`.
- [ ] Fonts self-hosted (no Google Fonts CDN — use `@fontsource-variable`).
- [ ] Reduced-motion media query in the global stylesheet.
- [ ] Skip link is the first focusable element.
- [ ] Component uses tokens (no magic numbers).
- [ ] If glass: backdrop-filter + a border + a background fill, plus a contrast check on a busy image.
- [ ] GSAP vs Framer responsibility is clear (one library per node).

Before considering the site "done":
- [ ] Lighthouse a11y 100.
- [ ] CLS < 0.05, LCP < 1.5s.
- [ ] Reduced-motion produces a static, fully-readable version.
- [ ] Glass surfaces ≤ 5 per page.
- [ ] Single accent color used in ≤ 3 places per page.

## 14. Summary

Editorial + glass in seven words: **type-driven, restrained, glass only where it earns its cost.**

The site should disappear behind the work. Glass surfaces, motion, and code hints are punctuation — not the main sentence.
