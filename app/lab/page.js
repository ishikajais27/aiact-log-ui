'use client'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { api, useApi, useAction, fmt } from '../../lib/api'
import { State, Table, Badge } from '../../components/ui'
import Experiments from '../../components/Experiments'
import './lab.css'

const KINDS = [
  'modify',
  'delete',
  'truncate',
  'backdate',
  'reorder',
  'insert',
  'replay',
]

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
      className={`lb-rv${on ? ' in' : ''} ${className}`}
      style={{ '--d': `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/* Word-by-word masked text reveal */
function Title({ as: Tag = 'h2', lines, accent = -1, className = '' }) {
  const [ref, on] = useInView()
  let k = 0
  return (
    <Tag ref={ref} className={`lb-title${on ? ' in' : ''} ${className}`}>
      {lines.map((l, i) => (
        <span className={'ln' + (i === accent ? ' ac' : '')} key={i}>
          {l.split(' ').map((w, j) => (
            <Fragment key={j}>
              <span className="w">
                <span style={{ '--i': k++ }}>{w}</span>
              </span>{' '}
            </Fragment>
          ))}
        </span>
      ))}
    </Tag>
  )
}

const Pill = ({ n }) => (
  <p className="lb-pill">
    <i aria-hidden="true" />
    Laboratory
    {n && <span className="lb-num">{n}</span>}
  </p>
)

function SecHead({ n, lines, note }) {
  return (
    <div className="lb-head">
      <div>
        <Pill n={n} />
        <Title lines={lines} />
      </div>
      {note && (
        <Reveal as="p" className="lb-note" delay={150}>
          {note}
        </Reveal>
      )}
    </div>
  )
}

const Arrow = () => (
  <span className="lb-arr" aria-hidden="true">
    →
  </span>
)

/* Decorative vector illustration: a chain of blocks with one displaced block */
function ChainArt() {
  const xs = [14, 108, 202, 296, 390]
  return (
    <svg
      className="lb-chain"
      viewBox="0 0 480 300"
      aria-hidden="true"
      focusable="false"
    >
      {xs.map((x, i) => {
        const bad = i === 3
        const y = bad ? 138 : 110
        const y1 = i - 1 === 3 ? 178 : 150
        const y2 = bad ? 178 : 150
        return (
          <g key={i} className={bad ? 'bad' : undefined}>
            {i > 0 && (
              <line
                x1={x - 18}
                y1={y1}
                x2={x}
                y2={y2}
                className={'lk' + (i === 3 || i === 4 ? ' dash' : '')}
              />
            )}
            <rect x={x} y={y} width="76" height="80" rx="6" />
            <line x1={x + 14} y1={y + 24} x2={x + 62} y2={y + 24} />
            <line x1={x + 14} y1={y + 40} x2={x + 46} y2={y + 40} />
            <line x1={x + 14} y1={y + 56} x2={x + 54} y2={y + 56} />
            {bad && <circle cx={x + 38} cy={y - 18} r="4" className="dot" />}
          </g>
        )
      })}
    </svg>
  )
}

/* Horizontal scroller: dark lead tile + cards, progress line and arrows below */
function Rail({ label, count, lead, children }) {
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
      ? first.getBoundingClientRect().width + 12
      : el.clientWidth * 0.8
    el.scrollBy({ left: dir * step, behavior: reduced() ? 'auto' : 'smooth' })
  }
  return (
    <div className="lb-railwrap">
      <div className="lb-stripbox">
        {lead}
        <div
          ref={ref}
          className="lb-rail"
          tabIndex={0}
          role="region"
          aria-label={label}
          onScroll={calc}
        >
          {children}
        </div>
      </div>
      <div className="lb-prog" hidden={!p.can}>
        <div className="lb-track" aria-hidden="true">
          <span className="lb-fill" style={{ width: `${p.pct}%` }} />
          <span className="lb-dot" style={{ left: `${p.pct}%` }} />
        </div>
        <div className="lb-arrows">
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
export default function Lab() {
  const info = useApi('/info')
  const [atk, runAtk] = useAction()
  const [bn, runBn] = useAction()
  const [sim, runSim] = useAction()
  const [tam, runTam] = useAction()
  const [ver, runVer] = useAction()
  const [f, setF] = useState({ kind: 'modify', seq: 5, n: 5, rehash: false })
  const demo = info.data?.demo_enabled
  const tampered = info.data?.tampered

  const idx = [
    ['lb-attacks', '001', 'Attack suite', demo],
    ['lb-bench', '002', 'Benchmark', demo],
    ['lb-live', '003', 'Live log', demo],
    ['lb-exp', '004', 'Experiments E7–E10', demo],
    ['lb-na', '005', 'Not available', true],
  ].filter((x) => x[3])

  return (
    <div className="lb">
      {/* ---------- Hero (reference 1) ---------- */}
      <header className="lb-hero">
        <div className="lb-hero-l">
          <p className="lb-pill">
            <i aria-hidden="true" />
            Art. 12 Audit Log
          </p>
          <Title as="h1" className="xl" lines={['Laboratory']} />
        </div>
        <Reveal className="lb-art" delay={120}>
          <ChainArt />
        </Reveal>
        <Reveal
          as="nav"
          className="lb-hero-nav"
          aria-label="Sections"
          delay={200}
        >
          <div className="lb-stripbox">
            <div className="lb-tile">
              <small>Sections</small>
              <b>{idx.length}</b>
            </div>
            <div className="lb-chips">
              {idx.map(([id, n, t]) => (
                <a key={id} href={`#${id}`} className="lb-chip">
                  <span className="lb-num">{n}</span>
                  {t}
                </a>
              ))}
            </div>
          </div>
        </Reveal>
      </header>

      <State s={info}>
        {!demo ? (
          <Reveal className="lb-off">
            <p className="muted">
              Demo endpoints are disabled on this server (AUDIT_DEMO=0).
            </p>
          </Reveal>
        ) : (
          <>
            {/* ---------- 001 Attack suite ---------- */}
            <section id="lb-attacks" className="lb-sec">
              <SecHead
                n="001"
                lines={['Attack suite']}
                note="(runs on temporary stores; does not touch the live log)"
              />
              <Reveal className="lb-ctl">
                <button
                  type="button"
                  className="lb-btn"
                  onClick={() => runAtk(() => api('/attacks'))}
                  disabled={atk.loading}
                  aria-busy={atk.loading}
                >
                  Run attack suite <Arrow />
                </button>
                <p className="muted">
                  Expected: the control row is "false" (nothing tampered). The
                  last row is a documented limit: events after the last anchor
                  are not protected against tail truncation.
                </p>
                {atk.error && <p className="err span">{atk.error}</p>}
              </Reveal>
              {atk.data &&
                (atk.data.length ? (
                  <Rail
                    label="Attack suite results"
                    count={atk.data.length}
                    lead={
                      <div className="lb-tile">
                        <small>Attacks</small>
                        <b>{atk.data.length}</b>
                      </div>
                    }
                  >
                    {atk.data.map((r, i) => (
                      <Reveal
                        as="article"
                        className="lb-atk"
                        delay={Math.min(i, 5) * 70}
                        key={i}
                      >
                        <div className="lb-atk-top">
                          <span className="lb-num">
                            {String(i + 1).padStart(3, '0')}
                          </span>
                          <span className="lb-det">
                            <small>Detected</small>
                            <Badge ok={r.detected}>{String(r.detected)}</Badge>
                          </span>
                        </div>
                        <h3>{r.attack}</h3>
                        <dl className="lb-kv">
                          <div>
                            <dt>Issue types</dt>
                            <dd>{r.issues.join(', ') || '—'}</dd>
                          </div>
                          <div>
                            <dt>Verify ms</dt>
                            <dd className="mono">{fmt(r.verify_ms, 1)}</dd>
                          </div>
                        </dl>
                      </Reveal>
                    ))}
                  </Rail>
                ) : (
                  <p className="muted">No data.</p>
                ))}
            </section>

            {/* ---------- 002 Benchmark ---------- */}
            <section id="lb-bench" className="lb-sec">
              <SecHead
                n="002"
                lines={['Benchmark']}
                note="(indicative, single node)"
              />
              <div className={'lb-bento' + (bn.data ? '' : ' solo')}>
                <Reveal className="lb-ctl dark col">
                  <button
                    type="button"
                    className="lb-btn"
                    onClick={() =>
                      runBn(() => api('/bench', { params: { n: 300 } }))
                    }
                    disabled={bn.loading}
                    aria-busy={bn.loading}
                  >
                    Run benchmark (300 events) <Arrow />
                  </button>
                  <p className="muted">
                    Async latency is the caller-path submit time only, not
                    durable-write time.
                  </p>
                  {bn.error && <p className="err span">{bn.error}</p>}
                </Reveal>
                {bn.data && (
                  <div className="lb-modes">
                    {['no_logging', 'sync', 'async'].map((k, i) => {
                      const m = bn.data[k]
                      return (
                        <Reveal className="lb-mode" delay={i * 90} key={k}>
                          <p className="lb-pill sm">
                            <i aria-hidden="true" />
                            {k}
                          </p>
                          <b className="lb-big">{fmt(m.p50_ms, 4)}</b>
                          <span className="lb-unit">p50 ms</span>
                          <dl className="lb-kv col">
                            <div>
                              <dt>p95 ms</dt>
                              <dd className="mono">{fmt(m.p95_ms, 4)}</dd>
                            </div>
                            <div>
                              <dt>p99 ms</dt>
                              <dd className="mono">{fmt(m.p99_ms, 4)}</dd>
                            </div>
                            <div>
                              <dt>events/s</dt>
                              <dd className="mono">{m.events_per_s ?? '—'}</dd>
                            </div>
                          </dl>
                        </Reveal>
                      )
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* ---------- 003 Live log (reference 3) ---------- */}
            <section id="lb-live" className="lb-sec">
              <div className="lb-split">
                <div className="lb-split-l">
                  <Pill n="003" />
                  <Title
                    lines={['Live log:', 'simulate and tamper']}
                    accent={1}
                  />
                  <Reveal as="p" className="lb-note lb-sub" delay={150}>
                    (restorable demo)
                  </Reveal>
                  <Reveal className="lb-state" delay={220}>
                    State:{' '}
                    {tampered ? (
                      <Badge ok={false}>
                        tampered: restore before appending
                      </Badge>
                    ) : (
                      <Badge ok>clean</Badge>
                    )}
                  </Reveal>
                </div>

                <ol className="lb-steps">
                  <Reveal as="li" className="lb-step">
                    <div className="lb-step-h">
                      <span className="lb-num">001</span>
                      <h3>Simulate</h3>
                    </div>
                    <div className="lb-step-b">
                      <button
                        type="button"
                        className="lb-btn alt"
                        disabled={tampered}
                        onClick={() =>
                          runSim(async () => {
                            const r = await api('/simulate', {
                              method: 'POST',
                              params: { n: 20 },
                            })
                            info.reload()
                            return r
                          })
                        }
                      >
                        Simulate 20 events <Arrow />
                      </button>
                      {sim.error && <span className="err">{sim.error}</span>}
                    </div>
                  </Reveal>

                  <Reveal as="li" className="lb-step" delay={60}>
                    <div className="lb-step-h">
                      <span className="lb-num">002</span>
                      <h3>Tamper</h3>
                    </div>
                    <div className="lb-step-b">
                      <div className="lb-form">
                        <label className="lb-field">
                          <span>kind</span>
                          <select
                            value={f.kind}
                            onChange={(e) =>
                              setF({ ...f, kind: e.target.value })
                            }
                          >
                            {KINDS.map((k) => (
                              <option key={k}>{k}</option>
                            ))}
                          </select>
                        </label>
                        <label className="lb-field">
                          <span>seq</span>
                          <input
                            type="number"
                            min="1"
                            value={f.seq}
                            onChange={(e) =>
                              setF({ ...f, seq: Number(e.target.value) })
                            }
                          />
                        </label>
                        <label className="lb-field">
                          <span>n</span>
                          <input
                            type="number"
                            min="1"
                            max="1000"
                            value={f.n}
                            onChange={(e) =>
                              setF({ ...f, n: Number(e.target.value) })
                            }
                          />
                        </label>
                        <label className="lb-check">
                          <input
                            type="checkbox"
                            checked={f.rehash}
                            onChange={(e) =>
                              setF({ ...f, rehash: e.target.checked })
                            }
                          />{' '}
                          recompute hashes (modify)
                        </label>
                      </div>
                      <button
                        type="button"
                        className="lb-btn danger"
                        onClick={() =>
                          runTam(async () => {
                            const r = await api('/tamper', {
                              method: 'POST',
                              body: f,
                            })
                            info.reload()
                            return r
                          })
                        }
                      >
                        Tamper <Arrow />
                      </button>
                    </div>
                  </Reveal>

                  <Reveal as="li" className="lb-step" delay={120}>
                    <div className="lb-step-h">
                      <span className="lb-num">003</span>
                      <h3>Verify</h3>
                    </div>
                    <div className="lb-step-b">
                      <button
                        type="button"
                        className="lb-btn alt"
                        onClick={() => runVer(() => api('/verify'))}
                      >
                        Verify <Arrow />
                      </button>
                    </div>
                    {ver.data && (
                      <div className="lb-ver">
                        <Badge ok={ver.data.ok}>
                          {ver.data.ok ? 'chain OK' : 'tampering detected'}
                        </Badge>
                        <Table
                          rows={ver.data.issues}
                          cols={[
                            ['Seq', (r) => r.seq ?? '—'],
                            ['Type', (r) => r.type],
                            ['Detail', (r) => r.detail],
                          ]}
                          empty=""
                        />
                      </div>
                    )}
                    {ver.error && <p className="err">{ver.error}</p>}
                  </Reveal>

                  <Reveal as="li" className="lb-step" delay={180}>
                    <div className="lb-step-h">
                      <span className="lb-num">004</span>
                      <h3>Restore</h3>
                    </div>
                    <div className="lb-step-b">
                      <button
                        type="button"
                        className="lb-btn"
                        onClick={() =>
                          runTam(async () => {
                            const r = await api('/restore', { method: 'POST' })
                            info.reload()
                            return r
                          })
                        }
                      >
                        Restore <Arrow />
                      </button>
                    </div>
                  </Reveal>

                  {tam.error && <li className="err lb-tamerr">{tam.error}</li>}
                </ol>
              </div>
            </section>
            {/* ---------- 004 Experiments E7-E10 ---------- */}
            <section id="lb-exp" className="lb-sec">
              <SecHead
                n="004"
                lines={['Experiments', 'E7 to E10']}
                note="(temporary stores; the live log is not touched)"
              />
              <Experiments />
            </section>
          </>
        )}
      </State>

      {/* ---------- 004 Not available (reference 1 strip) ---------- */}
      <section id="lb-na" className="lb-sec">
        <Reveal className="lb-stripbox na">
          <div className="lb-tile">
            <Pill n="005" />
            <Title className="sm" lines={['Not available']} />
          </div>
          <p className="lb-na-text">
            Not implemented: RFC 3161 timestamping, hybrid logical clocks and
            multi-node aggregation (E7 forks a single node’s chain instead).
          </p>
        </Reveal>
      </section>
    </div>
  )
}
