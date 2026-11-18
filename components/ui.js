'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getKey, setKey } from '../lib/api'

const LINKS = [
  ['/', 'Home'],
  ['/trace', 'Trace'],
  ['/evaluation', 'Evaluation'],
  ['/logs', 'Logs'],
  ['/lab', 'Lab'],
  ['/privacy', 'Privacy'],
]

export function Nav() {
  const path = usePathname()
  const [k, setK] = useState('')
  useEffect(() => {
    setK(getKey())
  }, [])
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
      <input
        type="password"
        placeholder="X-API-Key (if set)"
        value={k}
        onChange={(e) => {
          setK(e.target.value)
          setKey(e.target.value)
        }}
      />
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
