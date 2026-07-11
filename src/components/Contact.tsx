import { SectionReveal } from '../motion/SectionReveal'
import { useMagnetic } from '../motion/useMagnetic'
import { data } from '../data'
import { ArrowUp, Github, Linkedin, Globe, Mail } from 'lucide-react'

export function Contact() {
  return (
    <SectionReveal id="contact" className="container-x">
      <div data-reveal>
        <p className="label-cap">// 06 — contact</p>
        <h2 className="mt-3 font-display text-[length:var(--type-2xl)] font-medium leading-tight tracking-tight">
          {data.sections.find((s) => s.id === 'contact')?.title}
        </h2>
        <p className="mt-2 ink-soft text-[length:var(--type-md)]">
          {data.sections.find((s) => s.id === 'contact')?.subtitle}
        </p>
      </div>

      <div className="mt-16">
        <a
          href={`mailto:${data.profile.email}`}
          data-cursor="// email me"
          data-reveal
          className="contact-email block font-display font-medium tracking-tight leading-none text-[length:var(--type-3xl)] md:text-[length:var(--type-3xl)] hover:text-accent transition-colors duration-base break-all"
          style={{ color: 'hsl(var(--ink-h) var(--ink-s) var(--ink-l))' }}
        >
          {data.profile.email}
        </a>
      </div>

      <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.contact.github && (
          <ContactLink
            href={`https://github.com/${data.contact.github}`}
            label="GitHub"
            sublabel={`@${data.contact.github}`}
            icon={<Github size={20} />}
            dataCursor="// github"
          />
        )}
        {data.contact.linkedin && (
          <ContactLink
            href={`https://www.linkedin.com/in/${data.contact.linkedin}/`}
            label="LinkedIn"
            sublabel={data.contact.linkedin}
            icon={<Linkedin size={20} />}
            dataCursor="// linkedin"
          />
        )}
        {data.contact.website && (
          <ContactLink
            href={data.contact.website}
            label="Website"
            sublabel="yashrajshitole.in"
            icon={<Globe size={20} />}
            dataCursor="// site"
          />
        )}
        {data.contact.email && (
          <ContactLink
            href={`mailto:${data.contact.email}`}
            label="Email"
            sublabel={data.contact.email}
            icon={<Mail size={20} />}
            dataCursor="// mail"
          />
        )}
      </div>
    </SectionReveal>
  )
}

function ContactLink({ href, label, sublabel, icon, dataCursor }: {
  href: string; label: string; sublabel: string; icon: React.ReactNode; dataCursor: string
}) {
  const ref = useMagnetic<HTMLAnchorElement>(0.2)
  return (
    <a
      ref={ref}
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel="noreferrer"
      data-cursor={dataCursor}
      data-reveal
      className="glass rounded-lg p-5 group block will-anim"
    >
      <div className="flex items-center gap-3">
        <span className="ink-soft group-hover:text-accent transition-colors duration-base">{icon}</span>
        <span className="font-display text-xl font-medium tracking-tight">{label}</span>
      </div>
      <div className="mt-3 font-mono text-xs ink-soft truncate">{sublabel}</div>
    </a>
  )
}

export function Footer() {
  return (
    <footer className="container-x mt-32 pb-12 pt-12 border-t hairline">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <p className="font-display text-lg font-medium tracking-tight">
            <span className="text-accent">Y</span>S
          </p>
          <p className="mt-1 font-mono text-xs ink-soft">
            © {new Date().getFullYear()} {data.profile.name}. Built with React, GSAP, and too much chai.
          </p>
        </div>
        <BackToTop />
      </div>
    </footer>
  )
}

function BackToTop() {
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      data-cursor="// top"
      className="group inline-flex items-center gap-2 label-cap"
      style={{ color: 'hsl(var(--ink-soft-h) var(--ink-soft-s) var(--ink-soft-l))' }}
    >
      <span>Back to top</span>
      <span className="w-8 h-8 rounded-full border hairline flex items-center justify-center group-hover:border-accent group-hover:text-accent transition-colors duration-base">
        <ArrowUp size={14} />
      </span>
    </button>
  )
}
