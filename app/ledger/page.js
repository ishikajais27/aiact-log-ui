'use client'
import { useApi, short } from '../../lib/api'
import { PageHead, State, Card, Table, Badge } from '../../components/ui'

export default function Ledger() {
  const s = useApi('/ledger')
  const d = s.data
  return (
    <>
      <PageHead
        n="07"
        label="Ledger"
        title="Checkpoint ledger:"
        italic="what “blockchain” means here"
      />
      <Card title="Scope">
        <p className="muted">
          The research paper says Art. 12 does not require distributed ledgers
          (§3.1) and leaves the external-anchoring technology undecided (§11).
          This page shows what is implemented: signed Merkle checkpoints
          (“blocks”) hash-linked through the anchor log. It is not a distributed
          blockchain.
        </p>
      </Card>
      <State s={s}>
        {d && (
          <>
            <Card title="Properties">
              <Table
                rows={d.properties}
                cols={[
                  ['Property', (r) => r[0]],
                  ['Value', (r) => r[1]],
                ]}
              />
            </Card>
            <Card title="Blocks">
              <p>
                Ledger verification:{' '}
                <Badge ok={d.chain_ok}>
                  {d.blocks.length
                    ? d.chain_ok
                      ? 'all blocks verify'
                      : 'problem found'
                    : 'no blocks yet'}
                </Badge>
                {d.anchor_log_bad_lines > 0 && (
                  <> · {d.anchor_log_bad_lines} unreadable anchor line(s)</>
                )}
              </p>
              <Table
                rows={d.blocks}
                empty="No checkpoints yet. Create one from the Logs page."
                cols={[
                  ['Block', (r) => r.block],
                  [
                    'Seq range',
                    (r) => `${r.from_seq}–${r.to_seq} (${r.events})`,
                  ],
                  ['Merkle root', (r) => short(r.merkle_root, 14)],
                  ['Anchor hash', (r) => short(r.anchor_hash, 14)],
                  ['Prev anchor', (r) => short(r.anchor_prev, 14)],
                  [
                    'Signature',
                    (r) => (
                      <Badge ok={r.signature_ok}>
                        {String(r.signature_ok)}
                      </Badge>
                    ),
                  ],
                  [
                    'Anchored',
                    (r) => (
                      <Badge ok={r.anchored && r.anchor_matches_checkpoint}>
                        {String(r.anchored)}
                      </Badge>
                    ),
                  ],
                  [
                    'Linked',
                    (r) => <Badge ok={r.link_ok}>{String(r.link_ok)}</Badge>,
                  ],
                ]}
              />
            </Card>
          </>
        )}
      </State>
    </>
  )
}
