'use client'
import { useEffect, useRef, useState } from 'react'
import { useApi } from '../../lib/api'
import { State } from '../../components/ui'
import './trace.css'

const reduce = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function Trace() {
  const t = useApi('/trace')
  const rows = t.data || []
  const track = useRef(null)
  const cards = useRef([])
  const [act, setAct] = useState(0)

  /* active card = the one nearest the centre of the track */
  useEffect(() => {
    const el = track.current
    if (!el) return
    let raf = 0
    const calc = () => {
      raf = 0
      const mid = el.scrollLeft + el.clientWidth / 2
      let best = 0
      let dist = Infinity
      cards.current.forEach((c, i) => {
        if (!c) return
        const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid)
        if (d < dist) {
          dist = d
          best = i
        }
      })
      setAct(best)
    }
    const on = () => {
      if (!raf) raf = requestAnimationFrame(calc)
    }
    el.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    calc()
    return () => {
      el.removeEventListener('scroll', on)
      window.removeEventListener('resize', on)
      cancelAnimationFrame(raf)
    }
  }, [rows.length])

  const go = (i) => {
    const el = track.current
    const c = cards.current[i]
    if (!el || !c) return
    el.scrollTo({
      left: c.offsetLeft + c.offsetWidth / 2 - el.clientWidth / 2,
      behavior: reduce() ? 'auto' : 'smooth',
    })
  }
  const key = (e) => {
    if (e.key === 'ArrowRight')
      (e.preventDefault(), go(Math.min(act + 1, rows.length - 1)))
    if (e.key === 'ArrowLeft') (e.preventDefault(), go(Math.max(act - 1, 0)))
  }

  return (
    <div className="tl">
      <header className="tl-top">
        <h1>Traceability</h1>
        <p className="lead">
          Obligation → requirement → module → test → evidence.
        </p>
        <p className="note">
          The matrix is builder-authored; “interpretive” rows are engineering
          choices, not statutory text. The backend has no separate “engineering
          control” field and no TG/ID/US labels.
        </p>
      </header>

      <State s={t}>
        {rows.length === 0 ? (
          <p className="muted">No data.</p>
        ) : (
          <>
            <div className="tl-tabs" role="tablist" aria-label="Obligations">
              {rows.map((r, i) => (
                <button
                  key={r.id}
                  type="button"
                  role="tab"
                  aria-selected={i === act}
                  className={`tl-tab ${i === act ? 'on' : ''}`}
                  onClick={() => go(i)}
                >
                  {r.id}
                </button>
              ))}
            </div>

            <div
              className="tl-track hp-band"
              ref={track}
              tabIndex={0}
              onKeyDown={key}
              role="group"
              aria-roledescription="carousel"
              aria-label="Traceability records"
            >
              {rows.map((r, i) => (
                <article
                  key={r.id}
                  ref={(el) => (cards.current[i] = el)}
                  className={`tl-card ${i === act ? 'on' : ''}`}
                  aria-label={`${r.id}, ${r.provision}`}
                  onClick={() => i !== act && go(i)}
                >
                  <div className="tl-side">
                    <span className="n">{r.id}</span>
                    <span className="p">{r.provision}</span>
                    <span className={`cls ${r.cls}`}>{r.cls}</span>
                  </div>
                  <div className="tl-main">
                    <h2>{r.obligation}</h2>
                    <p className="q">{r.requirement}</p>
                    <dl className="tl-det">
                      <div>
                        <dt>Module</dt>
                        <dd>{r.module}</dd>
                      </div>
                      <div>
                        <dt>Tests</dt>
                        <dd>
                          {(r.tests || []).map((x) => (
                            <span key={x}>{x}</span>
                          ))}
                        </dd>
                      </div>
                      <div>
                        <dt>Evidence</dt>
                        <dd>{r.evidence}</dd>
                      </div>
                    </dl>
                  </div>
                </article>
              ))}
            </div>

            <div className="tl-nav">
              <button
                type="button"
                className="tl-arrow"
                aria-label="Previous record"
                disabled={act === 0}
                onClick={() => go(act - 1)}
              >
                ←
              </button>
              <span>
                Record {act + 1} of {rows.length}
              </span>
              <button
                type="button"
                className="tl-arrow"
                aria-label="Next record"
                disabled={act === rows.length - 1}
                onClick={() => go(act + 1)}
              >
                →
              </button>
            </div>
          </>
        )}
      </State>
    </div>
  )
}
