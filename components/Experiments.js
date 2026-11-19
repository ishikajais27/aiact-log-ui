'use client'
import { api, useApi, useAction, fmt } from '../lib/api'
import { State, Table, Badge } from './ui'

const Arrow = () => (
  <span className="lb-arr" aria-hidden="true">
    →
  </span>
)
const EXPECT = {
  detect: 'detected',
  no_detect: 'not detected (control)',
  known_limit: 'not detected (documented limit)',
}
const yn = (v) => <Badge ok={v}>{String(v)}</Badge>

const COLS = [
  ['Case', (r) => r.case],
  ['Detected', (r) => String(r.detected)],
  ['Expectation', (r) => EXPECT[r.expected] || r.expected],
  ['Where', (r) => r.layer],
  ['As expected', (r) => yn(r.as_expected)],
  ['Issue types', (r) => r.issues.join(', ') || '—'],
  ['Note', (r) => r.note || '—'],
]
const COLS8 = [
  ['Scenario', (r) => r.scenario],
  ['Submitted', (r) => r.submitted],
  ['Accepted', (r) => r.accepted],
  ['Dropped', (r) => r.dropped],
  ['Gap events', (r) => r.gap_events],
  ['Gap total', (r) => r.gap_total],
  ['Persisted', (r) => r.persisted],
  ['Lost, unrecorded', (r) => r.unrecorded],
  ['All accounted', (r) => yn(r.accounted)],
  ['Chain OK', (r) => yn(r.chain_ok)],
  ['p99 caller ms', (r) => fmt(r.p99_ms, 4)],
  ['Note', (r) => r.note],
]

function Exp({ e }) {
  const [s, run] = useAction()
  return (
    <div className="lb-ctl">
      <button
        type="button"
        className="lb-btn"
        onClick={() => run(() => api(`/experiments/${e.id}`))}
        disabled={s.loading}
        aria-busy={s.loading}
      >
        Run {e.id} <Arrow />
      </button>
      <p className="muted">
        <b>
          {e.id}: {e.title}
        </b>{' '}
        ({e.paper}). {e.summary}
      </p>
      <ul className="muted span">
        {e.limits.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
      {s.error && <p className="err span">{s.error}</p>}
      {s.data && (
        <div className="span">
          <Table
            rows={s.data}
            cols={e.id === 'E8' ? COLS8 : COLS}
            empty="No data."
          />
        </div>
      )}
    </div>
  )
}

export default function Experiments() {
  const list = useApi('/experiments')
  return (
    <State s={list}>
      {list.data && list.data.map((e) => <Exp key={e.id} e={e} />)}
    </State>
  )
}
