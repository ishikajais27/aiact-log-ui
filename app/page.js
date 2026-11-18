'use client'
import Link from 'next/link'
import { Fragment, useEffect, useRef, useState } from 'react'
import { useApi, short } from '../lib/api'
import { Badge, State } from '../components/ui'
import './home.css'

/* ---- sequence images: public/home/01.jpg, 02.jpg ... (see public/home/README.txt) ---- */
const EXT = 'jpg'
const MAX_IMAGES = 15
const pad = (n) => String(n).padStart(2, '0')

const STATUS = [
  [
    'Hash chain + Ed25519 signatures, Merkle checkpoints, inclusion proofs',
    'Implemented',
  ],
  ['External anchor', 'Simulated (local file, not RFC 3161)'],
  ['Crypto-shredding, retention floor (183 days)', 'Implemented'],
  ['Async bounded writer, fail-open / fail-closed', 'Implemented'],
  [
    'Evaluation A (LLM traceability pilot, 14 units)',
    'Pilot; author-drafted gold; independent annotation pending',
  ],
  ['Epoch pruning, signed deletion records, legal hold', 'Not implemented'],
  [
    'RFC 3161 timestamping, hybrid logical clocks, distributed aggregation',
    'Not implemented',
  ],
]

const STEPS = [
  {
    t: 'Every event is recorded',
    d: 'Events are written to the log automatically. Each entry carries a system ID, a model version and a timestamp.',
    href: '/logs',
    cta: 'Browse the log',
  },
  {
    t: 'Changes can be detected',
    d: 'Entries are linked by hashes and signed, so editing, deleting, reordering or backdating an entry shows up when the log is verified.',
    href: '/logs',
    cta: 'Verify the log',
  },
  {
    t: 'Checkpoints guard the end of the log',
    d: 'Signed checkpoints are anchored to an outside witness, so cutting off the latest entries can be detected. Here the witness is a local file that simulates one, and entries after the last anchor are not yet protected.',
    href: '/logs',
    cta: 'See the checkpoints',
  },
  {
    t: 'Personal data can be erased',
    d: 'Personal data is stored separately, encrypted for each person. Destroying a person’s key makes it unrecoverable while the log still verifies. This is not established as legal erasure.',
    href: '/privacy',
    cta: 'Open privacy tools',
  },
  {
    t: 'Logs are kept for a minimum time',
    d: 'The system refuses to purge stored payloads younger than 183 days, about six months, following Article 19(1).',
    href: '/privacy',
    cta: 'See retention',
  },
  {
    t: 'Each rule traces to evidence',
    d: 'The traceability matrix links each obligation to a requirement, the code that implements it, the tests that check it and evidence you can inspect. It is written by the project’s author; rows marked interpretive are engineering choices, not legal text.',
    href: '/trace',
    cta: 'Read the matrix',
  },
]

const DO = [
  [
    'Logs & verification',
    'Verify the log, create checkpoints and inspect recent events.',
    '/logs',
  ],
  [
    'Traceability',
    'See how each obligation connects to a requirement, code, a test and evidence.',
    '/trace',
  ],
  [
    'Privacy & retention',
    'Erase one person’s data and check the retention rules.',
    '/privacy',
  ],
]
const MORE = [
  [
    'Evaluation',
    'Run the LLM traceability pilot and read its results.',
    '/evaluation',
  ],
  [
    'Lab',
    'Run the attack suite and benchmark, or tamper with the live log in a restorable demo.',
    '/lab',
  ],
]

/* ---- scroll reveal ---- */
function useInView() {
  const ref = useRef(null)
  const [on, setOn] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') return setOn(true)
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true)
          io.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return [ref, on]
}

/* words="line one|line two" reveals word by word; otherwise children fade up */
function Reveal({ as: T = 'div', words, className = '', delay = 0, children }) {
  const [ref, on] = useInView()
  const style = { '--d': delay + 'ms' }
  if (!words)
    return (
      <T
        ref={ref}
        style={style}
        className={`rv ${on ? 'in' : ''} ${className}`}
      >
        {children}
      </T>
    )
  let k = 0
  return (
    <T ref={ref} style={style} className={`rvw ${on ? 'in' : ''} ${className}`}>
      {words.split('|').map((line, li) => (
        <span key={li} className="block">
          {line.split(' ').map((w) => (
            <Fragment key={k}>
              <span className="w">
                <span style={{ '--i': k++ }}>{w}</span>
              </span>{' '}
            </Fragment>
          ))}
        </span>
      ))}
    </T>
  )
}

const Arrow = () => <span aria-hidden="true">↗</span>

/* ---- sticky image sequence ---- */
function useImages() {
  const [urls, setUrls] = useState([])
  useEffect(() => {
    let dead = false
    ;(async () => {
      const ok = []
      for (let i = 1; i <= MAX_IMAGES; i++) {
        const src = `/home/${pad(i)}.${EXT}`
        const good = await new Promise((r) => {
          const im = new Image()
          im.onload = () => r(true)
          im.onerror = () => r(false)
          im.src = src
        })
        if (!good || dead) break
        ok.push(src)
      }
      if (!dead) setUrls(ok)
    })()
    return () => {
      dead = true
    }
  }, [])
  return urls
}

function Sequence() {
  const urls = useImages()
  const count = urls.length || STEPS.length
  const root = useRef(null)
  const [img, setImg] = useState(0)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const el = root.current
    let raf = 0
    const tick = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const total = Math.max(el.offsetHeight - window.innerHeight, 1)
      const p = Math.min(1, Math.max(0, -r.top / total))
      const s = Math.min(STEPS.length - 1, Math.floor(p * STEPS.length))
      setImg(Math.min(count - 1, Math.floor(p * count)))
      setStep(s)
      el.style.setProperty(
        '--sp',
        String(Math.min(1, Math.max(0, p * STEPS.length - s))),
      )
    }
    const on = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }
    tick()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => {
      window.removeEventListener('scroll', on)
      window.removeEventListener('resize', on)
      cancelAnimationFrame(raf)
    }
  }, [count])

  return (
    <section
      ref={root}
      id="how"
      className="hp-seq hp-band bg-cream text-burgundy"
      style={{ '--n': Math.max(count, STEPS.length) }}
    >
      <div className="hp-stick">
        <div className="hp-in hp-grid">
          <ol className="hp-steps">
            {STEPS.map((s, i) => (
              <li key={s.t} className={`hp-step ${i === step ? 'on' : ''}`}>
                <span className="bar" />
                <h3>{s.t}</h3>
                <div className="body">
                  <div>
                    <p>{s.d}</p>
                    <Link href={s.href}>{s.cta}</Link>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <div
            className="hp-frame"
            role="img"
            aria-label={`Image ${img + 1} of ${count}`}
          >
            {Array.from({ length: count }).map((_, i) =>
              urls[i] ? (
                <img
                  key={i}
                  src={urls[i]}
                  alt=""
                  decoding="async"
                  draggable={false}
                  className={`hp-slide ${i === img ? 'on' : ''}`}
                />
              ) : (
                <div
                  key={i}
                  className={`hp-slide hp-ph ${i === img ? 'on' : ''}`}
                >
                  <span className="ser">{pad(i + 1)}</span>
                  <small>
                    Placeholder: add public/home/{pad(i + 1)}.{EXT}
                  </small>
                </div>
              ),
            )}
            <span className="hp-cnt">
              {pad(img + 1)} / {pad(count)}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

function Cards({ items, light, two }) {
  return (
    <div className={`hp-cards ${two ? 'two' : ''}`}>
      {items.map(([t, d, h], i) => (
        <Reveal key={h} delay={i * 120}>
          <Link href={h} className={`hp-card ${light ? 'lt' : ''}`}>
            <span className="num">{pad(i + 1)}</span>
            <h3>{t}</h3>
            <p>{d}</p>
            <span className="go">
              <Arrow />
            </span>
          </Link>
        </Reveal>
      ))}
    </div>
  )
}

function Footer() {
  return (
    <footer className="hp-foot hp-band">
      <div className="hp-in">
        <div className="top">
          <Reveal as="h2" words="Check the log for yourself" />
          <Link href="/logs" className="hp-btn">
            Open the logs <Arrow />
          </Link>
        </div>
        <div className="cols">
          <div className="col">
            <h4>Menu</h4>
            {[
              ['/', 'Home'],
              ['/trace', 'Trace'],
              ['/evaluation', 'Evaluation'],
              ['/logs', 'Logs'],
              ['/lab', 'Lab'],
              ['/privacy', 'Privacy'],
            ].map(([h, t]) => (
              <Link key={h} href={h}>
                {t}
              </Link>
            ))}
          </div>
          <div className="col">
            <h4>Project</h4>
            <p>
              From Provision to Evidence: an Art. 12 / 19(1) case study. A
              reference implementation for a tamper-evident, privacy-aware
              AI-system log.
            </p>
          </div>
          <div className="col">
            <h4>References</h4>
            <a
              href="https://eur-lex.europa.eu/eli/reg/2024/1689/oj"
              target="_blank"
              rel="noopener noreferrer"
            >
              Regulation (EU) 2024/1689 on EUR-Lex
            </a>
            <a
              href="https://artificialintelligenceact.eu/article/12/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Article 12: record-keeping
            </a>
            <a
              href="https://artificialintelligenceact.eu/article/19/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Article 19: automatically generated logs
            </a>
          </div>
        </div>
        <div className="bot">
          <div>
            <span className="mark">Art. 12 Audit Log</span>
            <span>
              © {new Date().getFullYear()} Art. 12 Audit Log. It demonstrates a
              design; it does not establish legal compliance.
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function Home() {
  const info = useApi('/info')
  const d = info.data
  return (
    <div className="hp">
      <section className="hp-hero hp-band">
        <div className="hp-in flex flex-1 flex-col">
          <div className="mid">
            <p className="hp-eye">Welcome</p>
            <Reveal
              as="h1"
              words="From Provision to Evidence:|Art. 12 / 19(1) case study"
            />
            <Reveal as="p" className="lead" delay={500}>
              Reference implementation for a tamper-evident, privacy-aware
              AI-system log.
            </Reveal>
            <Reveal as="p" className="note" delay={650}>
              It demonstrates a design; it does not establish legal compliance.
            </Reveal>
            <Reveal className="acts" delay={800}>
              <Link href="/logs" className="hp-btn">
                View the logs <Arrow />
              </Link>
              <Link href="/trace" className="hp-btn ol">
                See the traceability <Arrow />
              </Link>
            </Reveal>
          </div>
          <nav className="hp-tabs" aria-label="On this page">
            <a href="#about">What it does</a>
            <a href="#how">How it works</a>
            <a href="#status">Where it stands</a>
          </nav>
        </div>
      </section>

      <section id="about" className="hp-light hp-band">
        <div className="hp-in">
          <p className="hp-eye">About</p>
          <Reveal
            as="h2"
            className="hp-state"
            words="A log is only useful as evidence if nobody can quietly change it."
          />
          <Reveal as="p" className="hp-p">
            This project records what an AI system does, lets anyone check that
            the record is intact, and lets personal data be erased without
            breaking that check.
          </Reveal>
          <Reveal as="p" className="hp-p">
            It is built around Articles 12 and 19(1) of the EU AI Act, which
            cover automatic logging and how long logs are kept.
          </Reveal>
          <State s={info}>
            {d && (
              <>
                <div className="hp-figs">
                  {[
                    ['Events', d.events],
                    ['Checkpoints', d.checkpoints],
                    ['Anchors', d.anchors],
                  ].map(([l, v], i) => (
                    <Reveal key={l} className="hp-fig" delay={i * 120}>
                      <span className="n">{v}</span>
                      <span className="l">{l} in the live log</span>
                    </Reveal>
                  ))}
                </div>
                <div className="hp-meta">
                  <div>
                    <span className="k">Demo tamper state</span>
                    {d.tampered ? (
                      <Badge ok={false}>tampered</Badge>
                    ) : (
                      <Badge ok>clean</Badge>
                    )}
                  </div>
                  <div>
                    <span className="k">API key required</span>
                    {d.auth_required ? 'yes' : 'no'}
                  </div>
                  <div>
                    <span className="k">Demo endpoints</span>
                    {d.demo_enabled ? 'enabled' : 'disabled'}
                  </div>
                  <p className="mono sm:col-span-3">
                    head: {short(d.head_hash, 24)} · pubkey:{' '}
                    {short(d.pubkey, 24)}
                  </p>
                </div>
              </>
            )}
          </State>
        </div>
      </section>

      <section className="hp-dark hp-band">
        <div className="hp-in">
          <p className="hp-eye">What you can do</p>
          <Reveal
            as="h2"
            className="hp-sec-h"
            words="Check, trace and protect the record."
          />
          <Cards items={DO} />
        </div>
      </section>

      <section className="hp-light hp-band" style={{ paddingBottom: 0 }}>
        <div className="hp-in">
          <p className="hp-eye">How it works</p>
          <Reveal
            as="h2"
            className="hp-sec-h"
            words="A log that can show it hasn’t been altered."
          />
        </div>
      </section>
      <Sequence />

      <section id="status" className="hp-dark hp-band">
        <div className="hp-in">
          <p className="hp-eye">Implementation status</p>
          <Reveal
            as="h2"
            className="hp-sec-h"
            words="What is built, and what is not."
          />
          <div className="hp-rows mt-16">
            {STATUS.map(([c, s], i) => (
              <Reveal key={c} className="row" delay={(i % 4) * 80}>
                <span>{c}</span>
                <span>{s}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="hp-light hp-band">
        <div className="hp-in">
          <p className="hp-eye">More to explore</p>
          <Reveal
            as="h2"
            className="hp-sec-h"
            words="Test the system yourself."
          />
          <Cards items={MORE} light two />
        </div>
      </section>

      <Footer />
    </div>
  )
}
