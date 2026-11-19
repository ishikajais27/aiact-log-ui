'use client'
import { useApi } from '../lib/api'
import { State, Table } from './ui'

export default function Retrieval() {
  const s = useApi('/evala/retrieval')
  const d = s.data
  return (
    <State s={s}>
      {d && (
        <>
          <Table
            rows={Object.entries(d).filter(([k]) => k !== 'note')}
            cols={[
              ['Metric', (r) => r[0]],
              ['Value', (r) => String(r[1])],
            ]}
          />
          <p className="muted">{d.note}</p>
        </>
      )}
    </State>
  )
}
