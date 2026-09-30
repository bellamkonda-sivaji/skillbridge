import React from 'react'
import { useDocumentTitle } from '../../marketing/components'
import { getAudit, formatDate, ROLE_LABEL, ROLE_TONE } from '../api'
import { usePagedList } from '../hooks'
import { DataTable, Pager, Filters, PageHead, ErrorNote, Badge } from '../components'

export default function Audit() {
  useDocumentTitle('Audit log')
  const list = usePagedList(getAudit, { action: '', from: '', to: '' })

  return (
    <>
      <PageHead title="Audit Log" sub="Every change an admin has made" />

      <Filters q={list.filters.q} onQ={(v) => list.setFilter('q', v)} placeholder="Admin or action…" onReset={list.reset}>
        <input className="ad-select" type="date" value={list.filters.from || ''} onChange={(e) => list.setFilter('from', e.target.value)} aria-label="From" />
        <input className="ad-select" type="date" value={list.filters.to || ''} onChange={(e) => list.setFilter('to', e.target.value)} aria-label="To" />
      </Filters>

      <ErrorNote onRetry={list.reload}>{list.error}</ErrorNote>

      <div className="wk-card pad-lg">
        <DataTable
          loading={list.loading}
          cols={['When', 'Admin', 'Role', 'Action', 'Entity', 'Detail']}
          empty="No admin actions recorded yet."
        >
          {list.rows.map((a) => (
            <tr key={a.id}>
              <td className="num">{formatDate(a.createdAt, true)}</td>
              <td className="nm">{a.adminName}</td>
              <td>{a.adminRole ? <Badge tone={ROLE_TONE[a.adminRole] || 'viewed'}>{ROLE_LABEL[a.adminRole] || a.adminRole}</Badge> : '—'}</td>
              <td>{a.action}</td>
              <td>{a.entityType ? `${a.entityType} #${a.entityId}` : '—'}</td>
              <td style={{ whiteSpace: 'normal', maxWidth: 360 }}>{a.detail || <span className="ad-zero">—</span>}</td>
            </tr>
          ))}
        </DataTable>
        <Pager {...list.meta} onPage={list.setPage} />
      </div>
    </>
  )
}
