'use client'
import { useEffect, useState } from 'react'
import { api, useApi, useAction, fmt } from '../../lib/api'
import { State, Table, Badge } from '../../components/ui'
import Classification from '../../components/Classification'
import Units from '../../components/Units'
import Issues from '../../components/Issues'
import Retrieval from '../../components/Retrieval'
import './evaluation.css'

const ms = (o) => (o ? `${fmt(o.mean)} ± ${fmt(o.sd)}` : '—')

/* Layout wrapper: split (heading one side, content other), optional flip, band, or centred heading. */
function Sec({ id, a, b, note, flip, alt, center, children }) {
  const cls =
    'ev-sec' +
    (flip ? ' flip' : '') +
    (alt ? ' alt' : '') +
    (center ? ' center' : '')
  return (
    <section id={id} className={cls}>
      <div className="ev-sec-in">
        <div className="ev-sec-head">
          <span className="ev-eyebrow" aria-hidden="true" />
          <h2>
            {a}
            {b && <span className="b">{b}</span>}
          </h2>
          {note && <p className="ev-note">{note}</p>}
        </div>
        <div className="ev-sec-body">{children}</div>
      </div>
    </section>
  )
}

export default function Evaluation() {
  const res = useApi('/evala')
  const info = useApi('/info')
  const [st, setSt] = useState(null)
  const [form, setForm] = useState({ backend: 'heuristic', runs: 1, model: '' })
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
      /* Send `model` only when it is a real Groq model id. Blank (or the
         backend name typed by mistake) -> backend uses its default model. */
      const model = form.model.trim()
      const params = { backend: form.backend, runs: form.runs }
      if (
        form.backend !== 'heuristic' &&
        model &&
        model.toLowerCase() !== form.backend
      )
        params.model = model
      const x = await api('/evala/run', { method: 'POST', params })
      setSt(x)
      return x
    })
  const d = res.data && !res.data.missing ? res.data : null

  return (
    <div className="ev">
      {/* ---------- Hero (reference 5) ---------- */}
      <header className="ev-hero">
        <div className="ev-ghost" aria-hidden="true">
          EVALUATION
        </div>

        <div className="ev-hero-text">
          <h1>
            Evaluation A:
            <br />
            <em>LLM traceability pilot</em>
          </h1>
          <hr className="ev-rule" />
          <p className="ev-hero-tag">Art. 12 Audit Log · Evaluation A</p>
          <a className="ev-cta" href="#ev-run">
            Run
            <span aria-hidden="true" className="ev-cta-box">
              ↓
            </span>
          </a>
        </div>

        <div className="ev-hero-art">
          <svg viewBox="0 0 400 400" className="ev-seal" aria-hidden="true">
            <defs>
              <path
                id="ev-circ"
                d="M200,200 m-165,0 a165,165 0 1,1 330,0 a165,165 0 1,1 -330,0"
              />
            </defs>
            <g className="ev-seal-ring">
              <text className="ev-seal-text">
                <textPath
                  href="#ev-circ"
                  textLength="1020"
                  lengthAdjust="spacing"
                >
                  ART. 12 AUDIT LOG · EVALUATION A · LLM TRACEABILITY PILOT ·
                </textPath>
              </text>
            </g>
            <circle cx="200" cy="200" r="128" className="ev-seal-dots" />
            <text x="200" y="238" textAnchor="middle" className="ev-seal-a">
              A
            </text>
          </svg>

          <nav className="ev-index" aria-label="Sections">
            <a href="#ev-class">
              Classification<span aria-hidden="true">+</span>
            </a>
            <a href="#ev-units">
              Units<span aria-hidden="true">+</span>
            </a>
            <a href="#ev-issues">
              Issue categories<span aria-hidden="true">+</span>
            </a>
            {d && (
              <>
                <a href="#ev-results">
                  Results<span aria-hidden="true">+</span>
                </a>
                <a href="#ev-stats">
                  Statistics<span aria-hidden="true">+</span>
                </a>
              </>
            )}
            <a href="#ev-na">
              Not available<span aria-hidden="true">+</span>
            </a>
          </nav>
        </div>
      </header>

      {/* ---------- Run ---------- */}
      <Sec id="ev-run" a="Run" alt>
        <div className="ev-panel">
          {info.data && !info.data.demo_enabled ? (
            <p className="muted">
              Run endpoint disabled on this server (AUDIT_DEMO=0).
            </p>
          ) : (
            <>
              <div className="ev-panel-top">
                <span>Evaluation A</span>
                {st && (
                  <span className="ev-status" data-state={st.state}>
                    status: {st.state} {st.msg}
                  </span>
                )}
              </div>
              <div className="ev-form">
                <label className="ev-field">
                  <span>Backend</span>
                  <select
                    value={form.backend}
                    onChange={(e) =>
                      setForm({ ...form, backend: e.target.value })
                    }
                  >
                    <option value="heuristic">
                      heuristic (rule-based, not an LLM)
                    </option>
                    <option value="groq" disabled={!info.data?.groq_configured}>
                      groq
                      {info.data?.groq_configured
                        ? ''
                        : ' (GROQ_API_KEY not set)'}
                    </option>
                  </select>
                </label>
                <label className="ev-field">
                  <span>runs</span>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={form.runs}
                    onChange={(e) =>
                      setForm({ ...form, runs: Number(e.target.value) })
                    }
                  />
                </label>
                <label className="ev-field wide">
                  <span>Model</span>
                  <input
                    placeholder="optional Groq model id, e.g. openai/gpt-oss-120b (empty = server default)"
                    autoComplete="off"
                    value={form.model}
                    onChange={(e) =>
                      setForm({ ...form, model: e.target.value })
                    }
                  />
                </label>
              </div>
              <div className="ev-panel-foot">
                <button
                  className="ev-btn"
                  onClick={start}
                  disabled={act.loading || st?.state === 'running'}
                >
                  Run
                  <span aria-hidden="true" className="ev-btn-arrow">
                    →
                  </span>
                </button>
              </div>
            </>
          )}
          {act.error && <p className="err">{act.error}</p>}
          {st?.state === 'error' && (
            <p className="err">Last run failed: {st.err}</p>
          )}
        </div>
      </Sec>

      <State s={res}>
        {!d ? (
          <p className="muted ev-empty">
            No results yet. Pending: run the pipeline (a real LLM backend is
            needed for reportable results).
          </p>
        ) : (
          <>
            {!d.meta.is_llm && (
              <div className="banner" role="alert">
                Heuristic (rule-based) baseline. These are NOT LLM results; do
                not report them as such.
              </div>
            )}

            {/* Stat strip (reference 4): counts derived from the loaded data */}
            <div className="ev-stats">
              <div>
                <b>{Object.keys(d.conditions).length}</b>
                <span>Conditions</span>
              </div>
              <div>
                <b>{Object.keys(d.schema_c4 || {}).length}</b>
                <span>Schema fields (C4)</span>
              </div>
              <div>
                <b>
                  {d.stats.cluster_analysis
                    ? d.stats.cluster_analysis.n_clusters
                    : '—'}
                </b>
                <span>Clusters</span>
              </div>
              <div>
                <b>{(d.failures || []).length}</b>
                <span>Units below full recall</span>
              </div>
            </div>

            <Sec id="ev-results" a="Run" b="metadata">
              <Table
                rows={Object.entries(d.meta)}
                cols={[
                  ['Key', (r) => r[0]],
                  ['Value', (r) => String(r[1])],
                ]}
              />
            </Sec>

            <Sec
              a="Derivation"
              b="by condition"
              note="keyword-proxy metrics; mean ± SD over units"
              flip
              alt
            >
              <Table
                rows={Object.entries(d.conditions)}
                cols={[
                  ['Cond', (r) => r[0]],
                  ['Label', (r) => r[1].label],
                  ['Recall', (r) => ms(r[1].recall)],
                  ['Precision', (r) => ms(r[1].precision)],
                  ['Unsupported', (r) => ms(r[1].unsupported)],
                  ['# reqs', (r) => ms(r[1].n)],
                ]}
              />
            </Sec>

            <Sec a="Schema" b="accuracy" note="C4">
              <Table
                rows={Object.entries(d.schema_c4 || {})}
                cols={[
                  ['Field', (r) => r[0]],
                  ['Score', (r) => fmt(r[1])],
                ]}
                empty="No schema outputs parsed."
              />
            </Sec>

            <Sec a="Trace-link" b="recovery" flip alt>
              <Table
                rows={Object.entries(d.trace)}
                cols={[
                  ['Cond', (r) => r[0]],
                  ['Precision', (r) => fmt(r[1].precision)],
                  ['Recall', (r) => fmt(r[1].recall)],
                  ['F1', (r) => fmt(r[1].f1)],
                  [
                    'F1 95% CI',
                    (r) => r[1].f1_ci95.map((x) => fmt(x)).join(' – '),
                  ],
                  ['Full-chain units', (r) => fmt(r[1].completeness)],
                ]}
              />
              <p className="muted">
                Full chain = every gold requirement of a unit has all of its
                links recovered.
              </p>
            </Sec>

            {/* Centred heading + two panels (reference 3) */}
            <Sec
              id="ev-stats"
              a="Statistics"
              b="(exploratory)"
              note={d.stats.note}
              center
            >
              <div className="ev-duo">
                <div className="ev-panel">
                  <Table
                    rows={[
                      [
                        'Retention B2→C3 recall (Wilcoxon)',
                        d.stats.RQ1_retrieval_B2_vs_C3_recall_wilcoxon,
                      ],
                      [
                        'Schema C3→C4 completeness (McNemar)',
                        d.stats.RQ2_schema_C3_vs_C4_completeness_mcnemar,
                      ],
                      [
                        'C3→C4 recall (Wilcoxon)',
                        d.stats.extra_C3_vs_C4_recall_wilcoxon,
                      ],
                    ]}
                    cols={[
                      ['Test', (r) => r[0]],
                      ['p', (r) => fmt(r[1].p)],
                      ['p (Holm)', (r) => fmt(r[1].p_holm)],
                    ]}
                  />
                </div>
                {d.stats.cluster_analysis && (
                  <div className="ev-panel">
                    <p className="ev-cluster">
                      Clusters: {d.stats.cluster_analysis.n_clusters} · Wilcoxon
                      valid per paper (≥8 clusters):{' '}
                      <Badge
                        ok={d.stats.cluster_analysis.wilcoxon_valid_per_paper}
                      >
                        {String(
                          d.stats.cluster_analysis.wilcoxon_valid_per_paper,
                        )}
                      </Badge>
                    </p>
                    <Table
                      rows={[
                        [
                          'C3 − B2 recall',
                          d.stats.cluster_analysis.C3_minus_B2_recall,
                        ],
                        [
                          'C4 − C3 recall',
                          d.stats.cluster_analysis.C4_minus_C3_recall,
                        ],
                      ]}
                      cols={[
                        ['Contrast', (r) => r[0]],
                        ['Mean diff', (r) => fmt(r[1].mean_diff)],
                        [
                          'Cluster-bootstrap 95% CI',
                          (r) => r[1].cluster_boot_ci95.join(' – '),
                        ],
                        [
                          'Leave-one-cluster-out',
                          (r) =>
                            r[1].leave_one_cluster_out
                              ? r[1].leave_one_cluster_out.join(' – ')
                              : '—',
                        ],
                      ]}
                    />
                  </div>
                )}
              </div>
            </Sec>

            <Sec a="RQ3:" b="recall by text characteristic" alt>
              <Table
                rows={Object.entries(d.rq3_by_characteristic)}
                cols={[
                  ['Characteristic', (r) => r[0]],
                  [
                    'n with / without',
                    (r) => `${r[1].n_with} / ${r[1].n_without}`,
                  ],
                  ...['B2', 'C3', 'C4'].map((c) => [
                    c + ' with / without',
                    (r) =>
                      `${fmt(r[1][c].recall_with, 2)} / ${fmt(r[1][c].recall_without, 2)}`,
                  ]),
                ]}
              />
            </Sec>

            <Sec a="Units below" b="full recall" flip>
              <Table
                rows={d.failures}
                cols={[
                  ['Cond', (r) => r.cond],
                  ['Unit', (r) => r.unit],
                  ['Recall', (r) => fmt(r.recall, 2)],
                  ['Unsupported', (r) => fmt(r.unsupported, 2)],
                ]}
                empty="None."
              />
            </Sec>
          </>
        )}
      </State>

      <Sec
        id="ev-class"
        a="Requirement"
        b="classification (TG / ID / US)"
        note="Paper §9. Reference labels are author-drafted; the run uses Groq."
        alt
      >
        <Classification evalDate={d?.meta?.date} />
      </Sec>

      <Sec
        id="ev-retrieval"
        a="Retrieval"
        b="metrics (retriever alone)"
        note="Recall@k, MRR, nDCG from metrics.retrieval_metrics; no LLM involved."
      >
        <div className="ev-panel">
          <Retrieval />
        </div>
      </Sec>

      <Sec id="ev-units" a="Units:" b="paper 10 vs pilot 14" flip>
        <Units />
      </Sec>

      <Sec id="ev-issues" a="Failure taxonomy" b="and new issue categories" alt>
        <Issues />
      </Sec>

      <Sec
        id="ev-na"
        a="Not available"
        b="(not implemented in the backend)"
        flip
      >
        <div className="ev-panel">
          <ul>
            <li>
              Independent annotation of the gold set: pending. The TG/ID/US
              reference labels are author-drafted too.
            </li>
            <li>
              Human-rating results and Krippendorff α:{' '}
              <code>GET /api/evala/ratings</code> computes them once{' '}
              <code>rating_A.csv</code> (and <code>rating_B.csv</code>) are
              filled in; this page does not display them yet.
            </li>
            <li>
              F2 for trace links: computed by <code>metrics.prf</code> but not
              written to <code>eval_a.json</code>.
            </li>
            <li>
              The paper’s conditions RS, C0, C1, C1s, C2 and its K0–K3
              contamination probes: the pilot runs B2, C3, C4 only.
            </li>
          </ul>
        </div>
      </Sec>
    </div>
  )
}
