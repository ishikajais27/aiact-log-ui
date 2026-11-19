'use client'
import { useApi, short } from '../lib/api'
import { State, Table } from './ui'

export default function Units() {
  const s = useApi('/evala/units')
  const d = s.data
  const rows = d
    ? d.pilot_units.map((u) => ({
        ...u,
        ...d.mapping.find((m) => m.pilot === u.id),
      }))
    : []
  return (
    <State s={s}>
      {d && (
        <>
          <div className="ev-duo">
            <div className="ev-panel">
              <div className="ev-panel-top">
                <span>Research paper · Table 8 (provisional)</span>
                <span>{d.counts.paper} units</span>
              </div>
              <Table
                rows={d.paper_units}
                cols={[
                  ['Paper unit', (r) => r.id],
                  ['Provision', (r) => r.provision],
                  ['Obligation', (r) => r.obligation],
                ]}
              />
            </div>
            <div className="ev-panel">
              <div className="ev-panel-top">
                <span>Pilot · data.py</span>
                <span>
                  {d.counts.pilot} units · {d.counts.clusters_pilot} clusters
                </span>
              </div>
              <ul>
                <li>
                  Paper: {d.counts.paper} core units in{' '}
                  {d.counts.clusters_paper} clusters. Expected range:{' '}
                  {d.paper_expected_range}.
                </li>
                {Object.entries(d.split).map(([k, v]) => (
                  <li key={k}>
                    Paper {k} is split into pilot {v.join(', ')}.
                  </li>
                ))}
                {d.pilot_only.map((p) => (
                  <li key={p}>Pilot {p} has no unit in paper Table 8.</li>
                ))}
              </ul>
              <p className="muted">{d.note}</p>
              {!d.reason_documented && (
                <p className="muted">
                  The reason for the difference is not documented in the paper
                  or the code.
                </p>
              )}
            </div>
          </div>
          <div className="ev-panel" style={{ marginTop: 24 }}>
            <Table
              rows={rows}
              cols={[
                ['Pilot unit', (r) => r.id],
                ['Provision', (r) => r.provision],
                ['Pilot text', (r) => short(r.text, 110)],
                ['Paper unit', (r) => r.paper || '—'],
                ['Relation', (r) => r.relation],
              ]}
            />
          </div>
        </>
      )}
    </State>
  )
}
