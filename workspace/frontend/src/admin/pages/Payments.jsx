import React from 'react'
import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../../marketing/components'
import { listPayments, money, num, formatDate } from '../api'
import { usePagedList } from '../hooks'
import {
  DataTable, Pager, Filters, Select, PageHead, ErrorNote, Badge, StatGrid, StatTile,
} from '../components'

const TYPES = [
  { value: 'CREDIT', label: 'Credit' },
  { value: 'DEBIT', label: 'Debit' },
]

export default function Payments() {
  useDocumentTitle('Payments')
  const list = usePagedList(listPayments, { type: '', from: '', to: '' })
  const s = list.meta?.summary || {}

  return (
    <>
      <PageHead title="Payments" sub="Every rupee that moved through the platform" />

      <StatGrid>
        <StatTile icon="wallet" tone="green" label="Paid out to workers" value={money(s.totalOut)} />
        <StatTile icon="trending" tone="blue" label="Received from employers" value={money(s.totalIn)} />
        <StatTile icon="rupee" tone="amber" label="Platform fees" value={money(s.platformFees)} />
        <StatTile icon="doc" tone="slate" label="Transactions" value={s.count} />
      </StatGrid>

      <Filters q={list.filters.q} onQ={(v) => list.setFilter('q', v)} placeholder="Worker, company or reference…" onReset={list.reset}>
        <Select value={list.filters.type} onChange={(v) => list.setFilter('type', v)} options={TYPES} all="All types" ariaLabel="Type" />
        <input className="ad-select" type="date" value={list.filters.from || ''} onChange={(e) => list.setFilter('from', e.target.value)} aria-label="From" />
        <input className="ad-select" type="date" value={list.filters.to || ''} onChange={(e) => list.setFilter('to', e.target.value)} aria-label="To" />
      </Filters>

      <ErrorNote onRetry={list.reload}>{list.error}</ErrorNote>

      <div className="wk-card pad-lg">
        <DataTable
          loading={list.loading}
          cols={['When', 'Type', 'Amount', 'Fee', 'Worker', 'Company', 'Job', 'Reference', 'Status']}
          empty="No transactions match these filters."
        >
          {list.rows.map((p) => (
            <tr key={p.id}>
              <td className="num">{formatDate(p.at, true)}</td>
              <td><Badge tone={p.type === 'CREDIT' ? 'accepted' : 'withdrawn'}>{String(p.type || '').toLowerCase()}</Badge></td>
              <td className="num" style={{ fontWeight: 700, color: p.type === 'CREDIT' ? '#047857' : '#b91c1c' }}>
                {p.type === 'CREDIT' ? '+' : '−'}{money(p.amount)}
              </td>
              <td className="num">{p.platformFee != null ? money(p.platformFee) : '—'}</td>
              <td>{p.workerName || '—'}</td>
              <td>{p.employerId ? <Link className="wk-link" to={`/admin/companies/${p.employerId}`}>{p.businessName}</Link> : (p.businessName || '—')}</td>
              <td>{p.jobId ? <Link className="wk-link" to={`/admin/jobs/${p.jobId}`}>{p.jobTitle}</Link> : (p.jobTitle || '—')}</td>
              <td>
                {p.reference || '—'}
                {p.description && <div className="sb" style={{ whiteSpace: 'normal', maxWidth: 220 }}>{p.description}</div>}
              </td>
              <td>{p.status ? <Badge tone="viewed">{String(p.status).toLowerCase()}</Badge> : '—'}</td>
            </tr>
          ))}
        </DataTable>
        <Pager {...list.meta} onPage={list.setPage} />
      </div>
    </>
  )
}
