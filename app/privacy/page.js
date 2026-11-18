'use client'
import { Fragment, useEffect, useRef, useState } from 'react'
import { api, useApi, useAction } from '../../lib/api'
import { State, Table, Badge } from '../../components/ui'
import './privacy.css'

/* ---------- Presentation helpers (no data logic) ---------- */
const reduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

function useInView() {
  const ref = useRef(null)
  const [on, setOn] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduced() || typeof IntersectionObserver === 'undefined') {
      setOn(true)
      return
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true)
          io.disconnect()
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px -5% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return [ref, on]
}

function Reveal({
  as: Tag = 'div',
  delay = 0,
  className = '',
  children,
  ...rest
}) {
  const [ref, on] = useInView()
  return (
    <Tag
      ref={ref}
      className={`lp-rv${on ? ' in' : ''} ${className}`}
      style={{ '--d': `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/* Word-by-word masked text reveal */
function Title({ as: Tag = 'h2', lines, className = '' }) {
  const [ref, on] = useInView()
  let k = 0
  return (
    <Tag ref={ref} className={`lp-title${on ? ' in' : ''} ${className}`}>
      {lines.map((l, i) => (
        <span className="ln" key={i}>
          {l.split(' ').map((w, j) => (
            <Fragment key={j}>
              <span className="w">
                <span
                  className={w === '&' ? 'amp' : undefined}
                  style={{ '--i': k++ }}
                >
                  {w}
                </span>
              </span>{' '}
            </Fragment>
          ))}
        </span>
      ))}
    </Tag>
  )
}

/* Thin reading-progress line (fixed, outside the clipped wrapper) */
function ReadProgress() {
  const ref = useRef(null)
  useEffect(() => {
    let raf = 0
    const upd = () => {
      raf = 0
      const el = ref.current
      if (!el) return
      const h = document.documentElement
      const max = h.scrollHeight - h.clientHeight
      el.style.transform = `scaleX(${max > 0 ? Math.min(1, h.scrollTop / max) : 0})`
    }
    const on = () => {
      if (!raf) raf = requestAnimationFrame(upd)
    }
    upd()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => {
      window.removeEventListener('scroll', on)
      window.removeEventListener('resize', on)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  return <div ref={ref} className="lp-progress" aria-hidden="true" />
}

function Rule() {
  const [ref, on] = useInView()
  return <hr ref={ref} className={`lp-rule lp-rv${on ? ' in' : ''}`} />
}

const Arrow = () => (
  <span className="lp-arr" aria-hidden="true">
    →
  </span>
)

/* Decorative seal: a keyhole inside a rotating ring of text */
function Seal() {
  return (
    <svg
      className="lp-seal"
      viewBox="0 0 400 400"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <path
          id="lp-circ"
          d="M200,200 m-165,0 a165,165 0 1,1 330,0 a165,165 0 1,1 -330,0"
        />
      </defs>
      <g className="lp-seal-ring">
        <text className="lp-seal-text">
          <textPath href="#lp-circ" textLength="1020" lengthAdjust="spacing">
            DATA PROTECTION · RETENTION · CRYPTOGRAPHIC ERASURE ·
          </textPath>
        </text>
      </g>
      <circle cx="200" cy="200" r="132" className="lp-seal-dots" />
      <circle cx="200" cy="200" r="104" className="lp-seal-line" />
      <circle cx="200" cy="184" r="26" className="lp-seal-key" />
      <path d="M186 204 L214 204 L224 262 L176 262 Z" className="lp-seal-key" />
    </svg>
  )
}

function Section({ id, n, children }) {
  return (
    <section id={id} className="lp-sec">
      <div className="lp-gut">
        <span className="lp-sn">§&nbsp;{n}</span>
      </div>
      <div className="lp-col">{children}</div>
    </section>
  )
}

/* ---------- Page ---------- */
export default function Privacy() {
  const info = useApi('/info')
  const ev = useApi('/events', { limit: 50 })
  const [sh, runSh] = useAction()
  const [pu, runPu] = useAction()
  const [days, setDays] = useState(30)

  const shred = (subject) => {
    if (
      !window.confirm(
        `Destroy the encryption key for ${subject}? This cannot be undone.`,
      )
    )
      return
    runSh(async () => {
      const r = await api(`/shred/${encodeURIComponent(subject)}`, {
        method: 'POST',
      })
      ev.reload()
      return r
    })
  }

  const rows = Array.isArray(ev.data) ? ev.data : null
  const nEnc = rows
    ? rows.filter((r) => r.pii_status === 'encrypted').length
    : 0

  const toc = [
    ['lp-retention', '§ 1', 'Retention'],
    ['lp-payload', '§ 2', 'Payload availability'],
    ['lp-na', '§ 3', 'Not available'],
  ]

  return (
    <>
      <ReadProgress />
      <div className="lp">
        {/* ---------- Masthead ---------- */}
        <header className="lp-hero">
          <div className="lp-hero-l">
            <p className="lp-label">Art. 12 Audit Log</p>
            <Title as="h1" className="xl" lines={['Privacy &', 'retention']} />
            <Rule />
            <nav className="lp-toc" aria-label="Provisions">
              <p className="lp-label">Provisions</p>
              <ol>
                {toc.map(([id, s, t], i) => (
                  <Reveal as="li" delay={i * 90} key={id}>
                    <a href={`#${id}`}>
                      <span className="s">{s}</span>
                      <span className="t">{t}</span>
                      <span className="d" aria-hidden="true" />
                      <span className="g" aria-hidden="true">
                        ↓
                      </span>
                    </a>
                  </Reveal>
                ))}
              </ol>
            </nav>
          </div>
          <Reveal className="lp-hero-r" delay={120}>
            <Seal />
          </Reveal>
        </header>

        {/* ---------- § 1 Retention ---------- */}
        <Section id="lp-retention" n="1">
          <div className="lp-head">
            <Title lines={['Retention']} />
          </div>
          <State s={info}>
            {info.data && (
              <div className="lp-ret">
                <Reveal className="lp-figure">
                  <b>{info.data.retention_floor_days}</b>
                  <span>days · retention floor</span>
                </Reveal>
                <div className="lp-ret-r">
                  <Reveal as="p" className="lp-clause" delay={80}>
                    Retention floor (Art. 19(1), about six months):{' '}
                    <b>{info.data.retention_floor_days} days</b>. Purging
                    payloads younger than this is refused.
                  </Reveal>
                  <Reveal className="lp-purge" delay={160}>
                    <label className="lp-purge-l">
                      purge payloads older than{' '}
                      <input
                        type="number"
                        min="0"
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                      />{' '}
                      days
                    </label>
                    <button
                      type="button"
                      className="lp-btn"
                      onClick={() =>
                        runPu(async () => {
                          const r = await api('/purge', {
                            method: 'POST',
                            params: { days },
                          })
                          ev.reload()
                          return r
                        })
                      }
                    >
                      Purge <Arrow />
                    </button>
                  </Reveal>
                  {pu.error && (
                    <p className="err">Refused / failed: {pu.error}</p>
                  )}
                  {pu.data && (
                    <p className="lp-result">
                      Purged payload rows: {pu.data.purged}
                    </p>
                  )}
                </div>
              </div>
            )}
          </State>
        </Section>

        {/* ---------- § 2 Payload availability ---------- */}
        <Section id="lp-payload" n="2">
          <div className="lp-head">
            <Title lines={['Payload availability', 'per event']} />
            <Reveal as="p" className="lp-note" delay={150}>
              (payload contents are never loaded here)
            </Reveal>
          </div>
          <State s={ev}>
            {rows && (
              <Reveal className="lp-stats">
                <div>
                  <b>{rows.length}</b>
                  <span>Events listed</span>
                </div>
                <div>
                  <b>{nEnc}</b>
                  <span>Encrypted payloads</span>
                </div>
              </Reveal>
            )}
            <Reveal className="lp-ledger">
              <Table
                rows={ev.data}
                cols={[
                  ['Seq', (r) => r.seq],
                  ['Type', (r) => r.event_type],
                  [
                    'Subject (pseudonym)',
                    (r) => <span className="mono">{r.subject}</span>,
                  ],
                  [
                    'Payload',
                    (r) => (
                      <Badge ok={r.pii_status === 'encrypted'}>
                        {r.pii_status}
                      </Badge>
                    ),
                  ],
                  [
                    '',
                    (r) =>
                      r.pii_status === 'encrypted' ? (
                        <button
                          type="button"
                          className="lp-btn danger sm"
                          onClick={() => shred(r.subject)}
                        >
                          Shred subject
                        </button>
                      ) : null,
                  ],
                ]}
              />
            </Reveal>
          </State>
          {sh.error && <p className="err">{sh.error}</p>}
          {sh.data && (
            <p className="lp-notice" aria-live="polite">
              Payload rows made unrecoverable: {sh.data.pii_rows_unrecoverable}.
              The chain still verifies (envelopes hold only keyed hashes and
              pseudonyms).
            </p>
          )}
        </Section>

        {/* ---------- § 3 Not available ---------- */}
        <Section id="lp-na" n="3">
          <div className="lp-head">
            <Title lines={['Not available']} />
          </div>
          <Reveal as="p" className="lp-reserve" delay={120}>
            Epoch pruning, signed deletion records, legal-hold handling and a
            deletion-verification report are not implemented. Cryptographic
            erasure is not established as legal erasure, and old log rows from
            before this change still carry raw subject identifiers.
          </Reveal>
        </Section>
      </div>
    </>
  )
}
