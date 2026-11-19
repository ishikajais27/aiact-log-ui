'use client'
import { useState } from 'react'
import { api, useApi, useAction, short } from '../lib/api'
import { State, Table, Badge } from './ui'

export default function Issues() {
  const cats = useApi('/issues/categories')
  const units = useApi('/evala/units')
  const [filter, setFilter] = useState('')
  const issues = useApi('/issues', filter ? { category_id: filter } : {})
  const [cf, setCf] = useState({ name: '', description: '' })
  const [inf, setInf] = useState({
    category_id: '',
    unit_id: '',
    cond: '',
    title: '',
    detail: '',
  })
  const [ca, runC] = useAction()
  const [ia, runI] = useAction()

  const addCat = () =>
    runC(async () => {
      const r = await api('/issues/categories', { method: 'POST', body: cf })
      setCf({ name: '', description: '' })
      cats.reload()
      return r
    })
  const addIssue = () =>
    runI(async () => {
      const r = await api('/issues', {
        method: 'POST',
        body: {
          category_id: Number(inf.category_id),
          unit_id: inf.unit_id,
          cond: inf.cond || null,
          title: inf.title,
          detail: inf.detail,
        },
      })
      setInf({ ...inf, title: '', detail: '' })
      issues.reload()
      cats.reload()
      return r
    })

  return (
    <>
      <div className="ev-panel">
        <p className="muted" style={{ marginTop: 0 }}>
          Paper §5.3 (RQ3) asks which text characteristics are linked to
          failures. The five built-in categories are the characteristics the
          paper lists. If a failure fits none of them, create a category and
          record an issue under it. Records are annotation data stored in{' '}
          <code>results/issues.db</code>; the LLM pipeline does not read them
          and its output is unchanged.
        </p>
      </div>
      <div className="ev-duo" style={{ marginTop: 24 }}>
        <div className="ev-panel">
          <div className="ev-panel-top">
            <span>Categories</span>
          </div>
          <State s={cats}>
            <Table
              rows={cats.data || []}
              cols={[
                ['Name', (r) => r.name],
                ['Description', (r) => r.description],
                ['Source', (r) => (r.builtin ? 'paper §5.3' : 'user')],
                ['Issues', (r) => r.issues],
              ]}
            />
          </State>
          <div className="ev-panel-foot">
            <div className="ev-form">
              <label className="ev-field">
                <span>New category</span>
                <input
                  value={cf.name}
                  placeholder="name (2–60 chars)"
                  onChange={(e) => setCf({ ...cf, name: e.target.value })}
                />
              </label>
              <label className="ev-field">
                <span>Description</span>
                <input
                  value={cf.description}
                  placeholder="what this failure is"
                  onChange={(e) =>
                    setCf({ ...cf, description: e.target.value })
                  }
                />
              </label>
            </div>
            <p style={{ marginTop: 16 }}>
              <button
                className="ev-btn"
                onClick={addCat}
                disabled={
                  ca.loading || !cf.name.trim() || !cf.description.trim()
                }
              >
                Create category{' '}
                <span className="ev-btn-arrow" aria-hidden="true">
                  →
                </span>
              </button>
            </p>
            {ca.error && <p className="err">{ca.error}</p>}
          </div>
        </div>

        <div className="ev-panel">
          <div className="ev-panel-top">
            <span>New issue</span>
          </div>
          <div className="ev-form">
            <label className="ev-field">
              <span>Category</span>
              <select
                value={inf.category_id}
                onChange={(e) =>
                  setInf({ ...inf, category_id: e.target.value })
                }
              >
                <option value="">select…</option>
                {(cats.data || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="ev-field">
              <span>Pilot unit</span>
              <select
                value={inf.unit_id}
                onChange={(e) => setInf({ ...inf, unit_id: e.target.value })}
              >
                <option value="">select…</option>
                {(units.data?.pilot_units || []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.id} · {u.provision}
                  </option>
                ))}
              </select>
            </label>
            <label className="ev-field">
              <span>Condition (optional)</span>
              <select
                value={inf.cond}
                onChange={(e) => setInf({ ...inf, cond: e.target.value })}
              >
                <option value="">none</option>
                <option>B2</option>
                <option>C3</option>
                <option>C4</option>
              </select>
            </label>
            <label className="ev-field">
              <span>Title</span>
              <input
                value={inf.title}
                placeholder="3–120 chars"
                onChange={(e) => setInf({ ...inf, title: e.target.value })}
              />
            </label>
            <label className="ev-field wide">
              <span>Detail</span>
              <textarea
                rows={3}
                style={{ width: '100%' }}
                value={inf.detail}
                onChange={(e) => setInf({ ...inf, detail: e.target.value })}
              />
            </label>
          </div>
          <div className="ev-panel-foot">
            <button
              className="ev-btn"
              onClick={addIssue}
              disabled={
                ia.loading ||
                !inf.category_id ||
                !inf.unit_id ||
                inf.title.trim().length < 3
              }
            >
              Record issue{' '}
              <span className="ev-btn-arrow" aria-hidden="true">
                →
              </span>
            </button>
            {ia.error && <p className="err">{ia.error}</p>}
          </div>
        </div>
      </div>

      <div className="ev-panel" style={{ marginTop: 24 }}>
        <div className="ev-panel-top">
          <span>Recorded issues</span>
          <label>
            filter:{' '}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ width: 'auto', minHeight: 32 }}
            >
              <option value="">all</option>
              {(cats.data || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <State s={issues}>
          <Table
            rows={issues.data || []}
            empty="No issues recorded yet."
            cols={[
              ['Category', (r) => r.category],
              ['Unit', (r) => r.unit_id],
              ['Cond', (r) => r.cond || '—'],
              ['Title', (r) => r.title],
              ['Detail', (r) => short(r.detail, 120)],
            ]}
          />
        </State>
      </div>
    </>
  )
}
