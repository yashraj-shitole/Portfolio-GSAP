import { SectionReveal } from '../motion/SectionReveal'
import { data } from '../data'

function fmt(d: string): string {
  if (d.length === 7) {
    const [y, m] = d.split('-')
    const month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][Number(m) - 1]
    return `${month} ${y}`
  }
  return d
}

export function Education() {
  return (
    <SectionReveal id="education" className="container-x">
      <div data-reveal>
        <p className="label-cap">// 05 — education & awards</p>
        <h2 className="mt-3 font-display text-[length:var(--type-2xl)] font-medium leading-tight tracking-tight">
          {data.sections.find((s) => s.id === 'education')?.title}
        </h2>
        <p className="mt-2 ink-soft text-[length:var(--type-md)]">
          {data.sections.find((s) => s.id === 'education')?.subtitle}
        </p>
      </div>

      <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Education */}
        <div>
          <p className="label-cap" data-reveal>// education</p>
          <ul className="mt-6 space-y-8">
            {data.education.map((e, i) => (
              <li key={i} data-reveal data-cursor="// edu" className="group">
                <div className="flex items-baseline justify-between gap-4 flex-wrap">
                  <h3 className="font-display text-2xl font-medium tracking-tight">
                    {e.degree} <span className="ink-soft">in</span> {e.field}
                  </h3>
                  <span className="label-cap">
                    {fmt(e.start)} — {e.end ? fmt(e.end) : 'Present'}
                  </span>
                </div>
                <div className="mt-1 ink-soft">{e.institution}</div>
                {e.stack && e.stack.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {e.stack.map((s) => (
                      <span key={s} className="font-mono text-xs px-2 py-0.5 rounded border hairline ink-soft">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>

          {data.publications.length > 0 && (
            <div className="mt-12" data-reveal>
              <p className="label-cap">// publications</p>
              <ul className="mt-4 space-y-4">
                {data.publications.map((p, i) => (
                  <li key={i} className="border-l-2 pl-4" style={{ borderColor: 'hsl(var(--ink-soft-h) var(--ink-soft-s) var(--ink-soft-l))' }}>
                    <div className="font-display text-lg font-medium tracking-tight">
                      {p.title}
                    </div>
                    <div className="mt-1 label-cap">
                      {p.venue} · {fmt(p.date)}
                    </div>
                    <p className="mt-2 text-[length:var(--type-sm)] ink-soft leading-relaxed">
                      {p.description}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Awards */}
        <div>
          <p className="label-cap" data-reveal>// awards</p>
          <ul className="mt-6 space-y-4">
            {data.awards.map((a, i) => (
              <li
                key={i}
                data-reveal
                data-cursor="// award"
                className="glass rounded-lg p-5 hover:border-accent transition-colors duration-base"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-xl font-medium tracking-tight">
                    {a.title}
                  </h3>
                  <span className="label-cap whitespace-nowrap">{fmt(a.date)}</span>
                </div>
                <div className="mt-1 ink-soft text-sm">{a.issuer}</div>
                <p className="mt-3 text-[length:var(--type-sm)] leading-relaxed">
                  {a.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionReveal>
  )
}
