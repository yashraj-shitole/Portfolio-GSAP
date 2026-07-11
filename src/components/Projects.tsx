import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { motion } from 'framer-motion'
import { ArrowUpRight, Github, ExternalLink } from 'lucide-react'
import { SectionReveal } from '../motion/SectionReveal'
import { data, type Project } from '../data'

export function Projects() {
  return (
    <SectionReveal id="projects" className="container-x">
      <div data-reveal>
        <p className="label-cap">// 04 — projects</p>
        <h2 className="mt-3 font-display text-[length:var(--type-2xl)] font-medium leading-tight tracking-tight">
          {data.sections.find((s) => s.id === 'projects')?.title}
        </h2>
        <p className="mt-2 ink-soft text-[length:var(--type-md)]">
          {data.sections.find((s) => s.id === 'projects')?.subtitle}
        </p>
      </div>

      <div className="mt-16 space-y-8">
        {data.projects.map((p, i) => (
          <div key={p.id} data-reveal>
            <ProjectCard project={p} index={i} />
          </div>
        ))}
      </div>
    </SectionReveal>
  )
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (matchMedia('(hover: none)').matches) return
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const card = cardRef.current
      if (!card) return

      const onMove = (e: MouseEvent) => {
        const r = card.getBoundingClientRect()
        const x = (e.clientX - r.left) / r.width - 0.5
        const y = (e.clientY - r.top) / r.height - 0.5
        gsap.to(card, {
          rotateY: x * 6,
          rotateX: -y * 6,
          transformPerspective: 1200,
          duration: 0.4,
          ease: 'power2.out',
        })
      }
      const onLeave = () => {
        gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.7, ease: 'power3.out' })
      }
      card.addEventListener('mousemove', onMove)
      card.addEventListener('mouseleave', onLeave)
      return () => {
        card.removeEventListener('mousemove', onMove)
        card.removeEventListener('mouseleave', onLeave)
        gsap.killTweensOf(card)
      }
    },
    { scope: cardRef },
  )

  const reverse = index % 2 === 1

  return (
    <motion.article
      ref={cardRef}
      whileHover={!matchMedia('(hover: none)').matches ? { y: -4 } : undefined}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      data-cursor="// project"
      className="project-card glass rounded-xl p-6 md:p-10 preserve-3d"
    >
      <div className={`grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 ${reverse ? 'md:[direction:rtl]' : ''}`}>
        <div className="md:col-span-7 md:[direction:ltr]">
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="label-cap">// {String(index + 1).padStart(2, '0')}</span>
            <span className="label-cap">{project.year}</span>
            <span className="label-cap">{project.duration}</span>
            {project.team && <span className="label-cap">· {project.team}</span>}
          </div>
          <h3 className="mt-4 font-display text-3xl md:text-4xl font-medium tracking-tight leading-tight">
            {project.name}
          </h3>
          <p className="mt-2 text-[length:var(--type-md)] ink-soft italic font-display">
            {project.tagline}
          </p>
          <p className="mt-6 text-[length:var(--type-base)] leading-relaxed max-w-prose">
            {project.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            {project.techStack.map((t) => (
              <span
                key={t.name}
                className="font-mono text-xs px-2.5 py-1 rounded-full border hairline"
                style={{ color: 'hsl(var(--ink-soft-h) var(--ink-soft-s) var(--ink-soft-l))' }}
              >
                {t.name}
              </span>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            {project.url && (
              <a
                href={project.url}
                target="_blank"
                rel="noreferrer"
                data-cursor="// live"
                className="group inline-flex items-center gap-2 label-cap"
                style={{ color: 'hsl(var(--ink-h) var(--ink-s) var(--ink-l))' }}
              >
                <ExternalLink size={14} />
                Live
                <ArrowUpRight size={12} className="transition-transform duration-base group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            )}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer"
                data-cursor="// source"
                className="group inline-flex items-center gap-2 label-cap ink-soft hover:text-ink"
              >
                <Github size={14} />
                Source
                <ArrowUpRight size={12} className="transition-transform duration-base group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            )}
          </div>
        </div>

        <div className="md:col-span-5 md:[direction:ltr]">
          <ProjectDetail project={project} />
        </div>
      </div>
    </motion.article>
  )
}

function ProjectDetail({ project }: { project: Project }) {
  return (
    <div className="space-y-5">
      {project.features.length > 0 && (
        <div>
          <p className="label-cap">// features</p>
          <ul className="mt-2 space-y-1.5">
            {project.features.map((f, i) => (
              <li key={i} className="text-[length:var(--type-sm)] leading-relaxed flex gap-2">
                <span className="text-accent shrink-0">→</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {project.challenges.length > 0 && (
        <div>
          <p className="label-cap">// challenges</p>
          <ul className="mt-2 space-y-1.5">
            {project.challenges.map((c, i) => (
              <li key={i} className="text-[length:var(--type-sm)] leading-relaxed ink-soft flex gap-2">
                <span className="shrink-0">⚠</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {project.results.length > 0 && (
        <div>
          <p className="label-cap">// results</p>
          <ul className="mt-2 space-y-1.5">
            {project.results.map((r, i) => (
              <li key={i} className="text-[length:var(--type-sm)] leading-relaxed flex gap-2">
                <span className="text-accent shrink-0">✓</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
