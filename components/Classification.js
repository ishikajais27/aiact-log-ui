'use client'
import { useEffect, useState } from 'react'
import { api, useApi, useAction, fmt, short } from '../lib/api'
import { State, Table, Badge } from './ui'

const DEFS = [
  [
    'TG',
    'Textually grounded',
    'The normative content is entailed by a cited legal span and adds no mechanism, threshold, actor, scope or stricter condition (paper §9.1).',
  ],
  [
    'ID',
    'Interpretively derived',
    'Adds technical content but cites a provision, gives interpretive reasoning and purpose, acknowledges alternatives and names the addition as a design choice (paper §9.2).',
  ],
  [
    'US',
    'Unsupported',
    'No textual grounding and no defensible interpretation (paper §9.3). Also assigned when an ID justification is incomplete (paper §9.4 step 3).',
  ],
]

export default function Classification({ evalDate }) {
  const info = useApi('/info')
  const lab = useApi('/evala/reference-labels')
  const res = useApi('/evala/classification')
  const [st, setSt] = useState(null)
  const [model, setModel] = useState('')
  const [act, run] = useAction()

  useEffect(() => {
    api('/evala/status')
      .then(setSt)
      .catch(() => {})
  }, [])
  useEffect(() => {
    if (st?.state !== 'running') return
    const t = setInterval(async () => {
      try {
        const x = await api('/evala/status')
        setSt(x)
        if (x.state !== 'running') {
          clearInterval(t)
          res.reload()
        }
      } catch {}
    }, 2000)
    return () => clearInterval(t)
  }, [st?.state])

  const start = () =>
    run(async () => {
      /* Blank or "groq" typed by mistake -> backend uses its default model. */
      const m = model.trim()
      const x = await api('/evala/classify', {
        method: 'POST',
        params: m && m.toLowerCase() !== 'groq' ? { model: m } : {},
      })
      setSt(x)
      return x
    })

  const demo = info.data?.demo_enabled
  const groq = info.data?.groq_configured
  const c = res.data && !res.data.missing ? res.data : null
  const stale =
    c && evalDate && c.meta.eval_a_date && evalDate !== c.meta.eval_a_date

  return (
    <>
      <div className="ev-panel">
        <Table
          rows={DEFS}
          cols={[
            ['Class', (r) => r[0]],
            ['Meaning', (r) => r[1]],
            ['Rule', (r) => r[2]],
          ]}
        />
      </div>

      <div className="ev-panel" style={{ marginTop: 24 }}>
        <div className="ev-panel-top">
          <span>Reference labels for the 15 gold requirements</span>
        </div>
        <State s={lab}>
          {lab.data && (
            <>
              <p className="banner" role="note" style={{ fontSize: '1rem' }}>
                {lab.data.status}
              </p>
              <Table
                rows={lab.data.labels}
                cols={[
                  ['Gold', (r) => r.gold_id],
                  ['Unit', (r) => r.unit],
                  ['Requirement', (r) => short(r.requirement, 90)],
                  ['Class', (r) => r.class],
                  ['Provision', (r) => r.provision],
                  ['Basis', (r) => r.basis],
                  [
                    'Contested',
                    (r) => (r.contested ? `yes (alt. ${r.alternative})` : 'no'),
                  ],
                ]}
              />
            </>
          )}
        </State>
      </div>

      <div className="ev-panel" style={{ marginTop: 24 }}>
        <div className="ev-panel-top">
          <span>Classify the derived requirements (Groq)</span>
          {st && (
            <span className="ev-status" data-state={st.state}>
              status: {st.state} {st.msg}
            </span>
          )}
        </div>
        {!demo ? (
          <p className="muted">Disabled on this server (AUDIT_DEMO=0).</p>
        ) : !groq ? (
          <p className="muted">
            GROQ_API_KEY is not set on the server. Classification needs an LLM;
            the rule-based baseline has no basis to classify.
          </p>
        ) : (
          <>
            <div className="ev-form">
              <label className="ev-field wide">
                <span>Groq model (optional, server default if empty)</span>
                <input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
              </label>
            </div>
            <div className="ev-panel-foot">
              <button
                className="ev-btn"
                onClick={start}
                disabled={act.loading || st?.state === 'running' || !evalDate}
              >
                Classify{' '}
                <span className="ev-btn-arrow" aria-hidden="true">
                  →
                </span>
              </button>
              {!evalDate && (
                <p className="muted">
                  Run Evaluation A first: it produces the requirements to
                  classify.
                </p>
              )}
            </div>
          </>
        )}
        {act.error && <p className="err">{act.error}</p>}
        {st?.state === 'error' && (
          <p className="err">Last job failed: {st.err}</p>
        )}
      </div>

      <State s={res}>
        {c && (
          <div className="ev-panel" style={{ marginTop: 24 }}>
            {!c.meta.source_is_llm && (
              <p className="banner" role="alert">
                These requirements came from the rule-based baseline, not an LLM
                run. Do not report these classes as LLM results.
              </p>
            )}
            {stale && (
              <p className="err">
                Classification is from Evaluation A run {c.meta.eval_a_date};
                the current run is {evalDate}. Re-run classification.
              </p>
            )}
            <div className="ev-panel-top">
              <span>
                {c.meta.model} · {c.meta.date} · prompt{' '}
                {c.meta.classify_prompt_hash}
              </span>
              <span>{c.meta.n_items} requirements · first run only</span>
            </div>
            <Table
              rows={Object.entries(c.summary)}
              cols={[
                ['Cond', (r) => r[0]],
                ['n', (r) => r[1].n],
                ['TG', (r) => r[1].TG],
                ['ID', (r) => r[1].ID],
                ['US', (r) => r[1].US],
                ['Unclassified', (r) => r[1].unclassified],
                ['US rate', (r) => fmt(r[1].us_rate)],
                ['Acceptable min (TG)', (r) => fmt(r[1].acceptable_min)],
                ['Acceptable max (TG+ID)', (r) => fmt(r[1].acceptable_max)],
              ]}
            />
            <p className="muted">{c.meta.acceptable_note}</p>
            <p className="muted">
              Agreement with the author-drafted reference labels on{' '}
              {c.agreement.n_matched} matched requirements:{' '}
              {fmt(c.agreement.raw_agreement)}{' '}
              {Object.entries(c.agreement.confusion_gold_to_model).map(
                ([k, v]) => (
                  <Badge key={k} ok={k.split('->')[0] === k.split('->')[1]}>
                    {k}: {v}
                  </Badge>
                ),
              )}{' '}
              The model's own label differed from the rule-derived class in{' '}
              {c.meta.model_label_differs_from_rule} cases.
            </p>
            <Table
              rows={c.items}
              cols={[
                ['Cond', (r) => r.cond],
                ['Unit', (r) => r.unit],
                ['Requirement', (r) => short(r.requirement, 80)],
                ['Class', (r) => r.class || '—'],
                ['Model label', (r) => r.llm_class || '—'],
                ['Why', (r) => r.why],
                [
                  'Gold match',
                  (r) => (r.gold_id ? `${r.gold_id} (${r.gold_class})` : '—'),
                ],
              ]}
            />
          </div>
        )}
      </State>
    </>
  )
}
