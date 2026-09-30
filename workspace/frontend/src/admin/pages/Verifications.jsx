import React, { useState } from 'react'
import Icon from '../../marketing/icons'
import { useDocumentTitle } from '../../marketing/components'
import { getPendingVerifications, verifyWorker, formatDate } from '../api'
import { useResource } from '../hooks'
import { DataTable, PageHead, ErrorNote, Badge, Phone, Empty, usePermissions } from '../components'

export default function Verifications() {
  useDocumentTitle('Verifications')
  const { can } = usePermissions()
  const { data, error, loading, reload } = useResource(getPendingVerifications, [])
  const [busy, setBusy] = useState(null)
  const [actionError, setActionError] = useState('')

  const rows = Array.isArray(data) ? data : []
  const allowed = can('VERIFY_ACCOUNTS')

  const decide = async (row, approved) => {
    const id = row.accountId ?? row.workerAccountId ?? row.id
    setBusy(id); setActionError('')
    try {
      await verifyWorker(id, approved, approved ? 'Approved from the back office' : 'Rejected from the back office')
      reload()
    } catch (e) {
      setActionError(e?.response?.data?.message || 'That action was not allowed.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <PageHead title="Verifications" sub="Workers waiting for their identity to be checked" />

      <ErrorNote onRetry={reload}>{error}</ErrorNote>
      {actionError && <div className="ad-error"><Icon name="shield" size={15} /><span>{actionError}</span></div>}

      <div className="wk-card pad-lg">
        <DataTable
          loading={loading}
          cols={['Worker', 'Phone', 'City', 'Skills', 'Status', 'Actions']}
          empty="Nothing is waiting for verification."
        >
          {rows.map((w) => {
            const id = w.accountId ?? w.workerAccountId ?? w.id
            return (
              <tr key={id}>
                <td className="nm">{w.name || w.workerName}</td>
                <td><Phone number={w.phone} /></td>
                <td>{[w.area, w.city].filter(Boolean).join(', ') || '—'}</td>
                <td style={{ whiteSpace: 'normal', maxWidth: 260 }}>{(w.skills || []).join(', ') || '—'}</td>
                <td><Badge tone="pending">{String(w.verificationStatus || 'pending').toLowerCase()}</Badge></td>
                <td>
                  <div className="acts">
                    <button className="mk-btn mk-btn-primary mk-btn-sm" disabled={!allowed || busy === id} onClick={() => decide(w, true)}>
                      Approve
                    </button>
                    <button
                      className="mk-btn mk-btn-outline mk-btn-sm"
                      style={{ color: '#b91c1c', borderColor: '#fecaca' }}
                      disabled={!allowed || busy === id}
                      onClick={() => decide(w, false)}
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </DataTable>
        {!allowed && (
          <p className="wk-sub">Your role can view this queue but not approve or reject. Ask an Admin or Super Admin.</p>
        )}
      </div>
    </>
  )
}
