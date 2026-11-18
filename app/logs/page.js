'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { api, useApi, useAction, short } from '../../lib/api'
import { State, Table, Badge } from '../../components/ui'
import './logs.css'

/* ---------- Presentation helpers (no data logic) ---------- */
const reduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const isEmpty = (rows) => !rows || !rows.length

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
      className={`lg-rv${on ? ' in' : ''} ${className}`}
      style={{ '--d': `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/* Line-by-line masked text reveal */
function Title({ as: Tag = 'h2', lines, className = '' }) {
  const [ref, on] = useInView()
  return (
    <Tag ref={ref} className={`lg-title${on ? ' in' : ''} ${className}`}>
      {lines.map((l, i) => (
        <span className="ln" key={i}>
          <span style={{ '--i': i }}>{l}</span>
        </span>
      ))}
    </Tag>
  )
}

const Eyebrow = ({ n }) => (
  <p className="lg-eyebrow">
    <i aria-hidden="true" />
    {n}
  </p>
)

/* Decorative isometric wireframe cubes */
const CUBES = {
  1: [[50, 50]],
  2: [
    [50, 60],
    [50, 40],
  ],
  3: [
    [50, 62],
    [32.7, 52],
    [67.3, 52],
  ],
  4: [
    [50, 66],
    [32.7, 56],
    [67.3, 56],
    [50, 46],
  ],
}
const cube = (x, y) => {
  const w = 17.3
  return `M${x} ${y - 20}L${x + w} ${y - 10}L${x + w} ${y + 10}L${x} ${y + 20}L${x - w} ${y + 10}L${x - w} ${y - 10}ZM${x - w} ${y - 10}L${x} ${y}L${x + w} ${y - 10}M${x} ${y}V${y + 20}`
}
function Cubes({ n }) {
  return (
    <svg
      className="lg-cubes"
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
    >
      <path d={CUBES[n].map(([x, y]) => cube(x, y)).join('')} />
    </svg>
  )
}

/* Horizontal scroller with progress line and arrows */
function Rail({ label, count, children }) {
  const ref = useRef(null)
  const [p, setP] = useState({ can: false, pct: 0 })
  const calc = useCallback(() => {
    const el = ref.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setP({
      can: max > 2,
      pct:
        max > 2 ? Math.min(100, Math.max(0, (el.scrollLeft / max) * 100)) : 0,
    })
  }, [])
  useEffect(() => {
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [calc, count])
  const go = (dir) => {
    const el = ref.current
    if (!el) return
    const first = el.firstElementChild
    const step = first
      ? first.getBoundingClientRect().width + 20
      : el.clientWidth * 0.8
    el.scrollBy({ left: dir * step, behavior: reduced() ? 'auto' : 'smooth' })
  }
  return (
    <div className="lg-railwrap">
      <div
        ref={ref}
        className="lg-rail"
        tabIndex={0}
        role="region"
        aria-label={label}
        onScroll={calc}
      >
        {children}
      </div>
      <div className="lg-prog" hidden={!p.can}>
        <div className="lg-track" aria-hidden="true">
          <span className="lg-fill" style={{ width: `${p.pct}%` }} />
          <span className="lg-dot" style={{ left: `${p.pct}%` }} />
        </div>
        <div className="lg-arrows">
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => go(-1)}
            disabled={p.pct <= 0}
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => go(1)}
            disabled={p.pct >= 99.5}
          >
            →
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Page ---------- */
export default function Logs() {
  const ev = useApi('/events', { limit: 30 })
  const cps = useApi('/checkpoints')
  const [ver, runVer] = useAction()
  const [pr, runPr] = useAction()
  const [cp, runCp] = useAction()
  const [sel, setSel] = useState(null) // visual only: which record is highlighted
  const v = ver.data

  const openProof = (r) => {
    setSel(r.seq)
    runPr(() => api(`/proof/${r.seq}`))
  }

  const plural = (n, a, b) => `${n} ${n === 1 ? a : b}`
  const nCp = Array.isArray(cps.data) ? cps.data.length : null
  const nEv = Array.isArray(ev.data) ? ev.data.length : null
  const cards = [
    [
      'lg-verify',
      'Verify',
      v
        ? `${v.ok ? 'chain OK' : 'INTEGRITY ISSUES'} · checked ${v.checked} events`
        : null,
    ],
    [
      'lg-cps',
      'Checkpoints & anchors',
      nCp !== null ? plural(nCp, 'checkpoint', 'checkpoints') : null,
    ],
    [
      'lg-events',
      'Recent events',
      nEv !== null ? plural(nEv, 'event', 'events') : null,
    ],
    ['lg-na', 'Not available', null],
  ]

  return (
    <div className="lg">
      {/* ---------- Hero (reference 1) ---------- */}
      <header className="lg-hero lg-band dark">
        <div className="lg-hero-l">
          <p className="lg-eyebrow">
            <i aria-hidden="true" />
            Art. 12 Audit Log
          </p>
          <Title
            as="h1"
            className="xl"
            lines={['Logs &', <em key="v">verification</em>]}
          />
          <hr className="lg-rule" />
          <Reveal as="a" href="#lg-verify" className="lg-cta" delay={300}>
            Verify <span aria-hidden="true">↓</span>
          </Reveal>
        </div>
        <nav className="lg-index" aria-label="Sections">
          {cards.map(([id, t, d], i) => (
            <Reveal
              as="a"
              href={`#${id}`}
              className="lg-card"
              delay={i * 90}
              key={id}
            >
              <Cubes n={i + 1} />
              <span className="lg-card-n">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="lg-card-t">{t}</span>
              {d && <span className="lg-card-d">{d}</span>}
            </Reveal>
          ))}
        </nav>
      </header>

      {/* ---------- 01 Verify ---------- */}
      <section id="lg-verify" className="lg-sec">
        <div className="lg-top">
          <div>
            <Eyebrow n="01" />
            <Title lines={['Verify']} />
          </div>
          <Reveal className="lg-actions" delay={150}>
            <button
              type="button"
              className="lg-btn"
              onClick={() => runVer(() => api('/verify'))}
              disabled={ver.loading}
              aria-busy={ver.loading}
            >
              Verify now{' '}
              <span className="lg-arr" aria-hidden="true">
                ↗
              </span>
            </button>
            <button
              type="button"
              className="lg-btn alt"
              aria-busy={cp.loading}
              onClick={() =>
                runCp(async () => {
                  const r = await api('/checkpoint', { method: 'POST' })
                  cps.reload()
                  ev.reload()
                  return r
                })
              }
            >
              Create checkpoint + anchor{' '}
              <span className="lg-arr" aria-hidden="true">
                ↗
              </span>
            </button>
          </Reveal>
        </div>

        {ver.error && <p className="err">{ver.error}</p>}
        {cp.error && <p className="err">{cp.error}</p>}
        {cp.data && <p className="mono lg-cpdata">{JSON.stringify(cp.data)}</p>}

        {v && (
          <Reveal className="lg-result">
            <div className="lg-verdict">
              <Badge ok={v.ok}>{v.ok ? 'chain OK' : 'INTEGRITY ISSUES'}</Badge>
            </div>
            <div className="lg-stats">
              <div>
                <b>{v.checked}</b>
                <span>events checked</span>
              </div>
              <div>
                <b>{v.checkpoints}</b>
                <span>checkpoints</span>
              </div>
              <div>
                <b>{v.anchors}</b>
                <span>anchors</span>
              </div>
              <div>
                <b>{v.unanchored_events}</b>
                <span>events after the last anchor</span>
                <em>(not protected against tail truncation)</em>
              </div>
              <div>
                <b>
                  {v.verify_ms}
                  <small> ms</small>
                </b>
                <span>verification time</span>
              </div>
            </div>
            <Table
              rows={v.issues}
              cols={[
                ['Seq', (r) => r.seq ?? '—'],
                ['Type', (r) => r.type],
                ['Detail', (r) => r.detail],
              ]}
              empty="No issues detected."
            />
          </Reveal>
        )}
      </section>

      {/* ---------- 02 Checkpoints & anchors (references 2 and 3) ---------- */}
      <section id="lg-cps" className="lg-sec lg-band alt">
        <div className="lg-top">
          <div>
            <Eyebrow n="02" />
            <Title lines={['Checkpoints', '& anchors']} />
          </div>
          <Reveal as="p" className="lg-note lg-top-r" delay={150}>
            The anchor is a local file that simulates an external witness (not
            RFC 3161).
          </Reveal>
        </div>
        <State s={cps}>
          {isEmpty(cps.data) ? (
            <p className="muted">No checkpoints yet.</p>
          ) : (
            <Rail label="Checkpoints and anchors" count={cps.data.length}>
              {cps.data.map((r, i) => (
                <Reveal
                  as="article"
                  className="lg-cp"
                  delay={Math.min(i, 4) * 70}
                  key={i}
                >
                  <div className="lg-cp-top">
                    <span className="lg-cp-id">
                      <small>ID</small>
                      {r.id}
                    </span>
                    <span className="lg-cp-anch">
                      <small>Anchored</small>
                      <Badge ok={r.anchored}>{r.anchored ? 'yes' : 'no'}</Badge>
                    </span>
                  </div>
                  <div className="lg-cp-vis">
                    <Cubes n={(i % 4) + 1} />
                    <div className="lg-cp-range">
                      <small>Range</small>
                      <b>{`${r.from_seq}–${r.to_seq}`}</b>
                    </div>
                  </div>
                  <dl className="lg-kv col">
                    <div>
                      <dt>Merkle root</dt>
                      <dd className="mono">{short(r.root, 16)}</dd>
                    </div>
                    <div>
                      <dt>Anchor hash</dt>
                      <dd className="mono">{short(r.anchor_hash, 16)}</dd>
                    </div>
                  </dl>
                </Reveal>
              ))}
            </Rail>
          )}
        </State>
      </section>

      {/* ---------- 03 Recent events (reference 1: heading left, records right) ---------- */}
      <section id="lg-events" className="lg-sec">
        <div className="lg-split">
          <div className="lg-head">
            <Eyebrow n="03" />
            <Title lines={['Recent', 'events']} />
            <Reveal as="p" className="lg-note" delay={150}>
              Click a row for its Merkle inclusion proof
            </Reveal>
          </div>

          <div className="lg-main">
            <State s={ev}>
              {isEmpty(ev.data) ? (
                <p className="muted">
                  No events yet. Add some on the Lab page (demo mode) or POST
                  /api/events.
                </p>
              ) : (
                <ol className="lg-recs">
                  {ev.data.map((r, i) => (
                    <Reveal as="li" delay={Math.min(i, 6) * 40} key={i}>
                      <div
                        role="button"
                        tabIndex={0}
                        className={'lg-rec' + (sel === r.seq ? ' on' : '')}
                        aria-pressed={sel === r.seq}
                        data-busy={
                          sel === r.seq && pr.loading ? '1' : undefined
                        }
                        onClick={() => openProof(r)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            openProof(r)
                          }
                        }}
                      >
                        <span className="lg-rec-seq">
                          <small>Seq</small>
                          {r.seq}
                        </span>
                        <div className="lg-rec-body">
                          <b className="lg-rec-type">{r.event_type}</b>
                          <dl className="lg-kv">
                            <div>
                              <dt>Art. 12</dt>
                              <dd>{r.art12}</dd>
                            </div>
                            <div>
                              <dt>System</dt>
                              <dd>{r.system_id}</dd>
                            </div>
                            <div>
                              <dt>Model</dt>
                              <dd>{r.model_version}</dd>
                            </div>
                            <div>
                              <dt>Subject (pseudonym)</dt>
                              <dd className="mono">{r.subject}</dd>
                            </div>
                          </dl>
                          <dl className="lg-kv lg-hashes">
                            <div>
                              <dt>prev_hash</dt>
                              <dd className="mono">{short(r.prev_hash, 12)}</dd>
                            </div>
                            <div>
                              <dt>entry_hash</dt>
                              <dd className="mono">
                                {short(r.entry_hash, 12)}
                              </dd>
                            </div>
                            <div>
                              <dt>sig</dt>
                              <dd className="mono">{short(r.sig, 12)}</dd>
                            </div>
                          </dl>
                        </div>
                      </div>
                    </Reveal>
                  ))}
                </ol>
              )}
            </State>
          </div>

          <div className="lg-proofwrap">
            {pr.error && (
              <p className="muted lg-proof-err">Proof: {pr.error}</p>
            )}
            {pr.data && (
              <aside className="lg-proof" aria-live="polite">
                <p className="lg-proof-h">
                  Inclusion proof for seq {pr.data.seq}:{' '}
                  <Badge ok={pr.data.valid}>
                    {pr.data.valid ? 'valid' : 'INVALID'}
                  </Badge>{' '}
                  against checkpoint {pr.data.checkpoint}
                </p>
                <pre>{JSON.stringify(pr.data, null, 1)}</pre>
              </aside>
            )}
          </div>
        </div>
      </section>

      {/* ---------- 04 Not available (reference 4 band) ---------- */}
      <section id="lg-na" className="lg-sec lg-band dark">
        <div className="lg-top">
          <div>
            <Eyebrow n="04" />
            <Title lines={['Not', 'available']} />
          </div>
          <Reveal as="p" className="lg-na-text lg-top-r" delay={150}>
            Distributed aggregation, RFC 3161 timestamps, hybrid logical clocks:
            not implemented.
          </Reveal>
        </div>
      </section>
    </div>
  )
}
