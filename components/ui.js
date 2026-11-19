'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  ['/', 'Home'],
  ['/trace', 'Trace'],
  ['/evaluation', 'Evaluation'],
  ['/logs', 'Logs'],
  ['/lab', 'Lab'],
  ['/ledger', 'Ledger'],
  ['/privacy', 'Privacy'],
]

export function Nav() {
  const path = usePathname()
  return (
    <nav className="site-nav">
      <b className="brand">Art. 12 Audit Log</b>
      <div className="links">
        {LINKS.map(([h, t]) => (
          <Link key={h} href={h} className={path === h ? 'on' : ''}>
            {t}
          </Link>
        ))}
      </div>
    </nav>
  )
}

/* Burgundy band with gold numeral, eyebrow and a display headline whose second line is italic. */
export function PageHead({ n, label, title, italic }) {
  return (
    <header className="band">
      <div className="band-in">
        <p className="eyebrow">
          <span className="num">{n}</span>
          <span className="lbl">{label}</span>
        </p>
        <h1>
          {title}
          {italic && (
            <>
              <br />
              <em>{italic}</em>
            </>
          )}
        </h1>
      </div>
    </header>
  )
}

export function State({ s, children }) {
  if (s.loading && !s.data) return <p className="muted">Loading…</p>
  if (s.error) return <p className="err">Error: {s.error}</p>
  return children
}

export const Card = ({ title, children }) => (
  <section className="card">
    {title && <h2>{title}</h2>}
    {children}
  </section>
)
export const Badge = ({ ok, children }) => (
  <span className={'badge ' + (ok ? 'ok' : 'bad')}>{children}</span>
)

export function Table({ cols, rows, empty = 'No data.', onRow }) {
  if (!rows || !rows.length) return <p className="muted">{empty}</p>
  return (
    <div className="scroll">
      <table>
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c[0]}>{c[0]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              onClick={onRow ? () => onRow(r) : undefined}
              className={onRow ? 'click' : ''}
            >
              {cols.map((c) => (
                <td key={c[0]}>{c[1](r)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
