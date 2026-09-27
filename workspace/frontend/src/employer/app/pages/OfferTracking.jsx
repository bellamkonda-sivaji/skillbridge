import React, { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Icon from '../../../marketing/icons'
import { Avatar, useDocumentTitle } from '../../../marketing/components'
import { Loading, ErrorNote, PageHead, PillTabs } from '../../../worker/components'
import { WhenBanner, DataTable } from '../hiring'
import {
  listOffers, cancelOffer, money,
  OFFER_STATUS_LABEL, OFFER_STATUS_TONE, formatDate,
} from '../api'

const TABS = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'DECLINED', label: 'Declined' },
  { value: 'EXPIRED', label: 'Expired' },
]

/** Screen 24 — Offer Tracking. Every offer the employer has sent, and where it stands. */
export default function OfferTracking() {
  const [params, setParams] = useSearchParams()
  const justSent = params.get('sent')
  const [offers, setOffers] = useState(null)
  const [tab, setTab] = useState('ALL')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null)
  useDocumentTitle('Offer Tracking')

  const load = () => {
    setOffers(null); setError('')
    listOffers('ALL')
      .then((d) => setOffers(Array.isArray(d) ? d : []))
      .catch(() => setError('We could not load your offers.'))
  }
  useEffect(load, [])

  const counts = useMemo(() => {
    const c = {}
    for (const o of offers || []) c[o.status] = (c[o.status] || 0) + 1
    return c
  }, [offers])

  /* A viewed offer is still awaiting an answer, so it belongs under Pending. */
  const shown = (offers || []).filter((o) => {
    if (tab === 'ALL') return true
    if (tab === 'PENDING') return o.status === 'PENDING' || o.status === 'VIEWED'
    return o.status === tab
  })

  const withdraw = async (offer) => {
    setBusy(offer.id)
    try {
      const updated = await cancelOffer(offer.id)
      setOffers((l) => l.map((o) => (o.id === offer.id ? { ...o, ...updated } : o)))
    } catch (e) {
      setError(e?.response?.data?.message || 'We could not withdraw that offer.')
    } finally {
      setBusy(null)
    }
  }

  const tabCount = (v) =>
    v === 'ALL' ? offers?.length ?? 0
      : v === 'PENDING' ? (counts.PENDING || 0) + (counts.VIEWED || 0)
      : counts[v] || 0

  return (
    <>
      <WhenBanner id="offer-tracking">
        Once you send an offer or a work confirmation, it lands here. Follow it until the worker accepts,
        then move on to confirming that they joined.
      </WhenBanner>

      {justSent && (
        <div className="emp-when" style={{ borderColor: '#a7f3d0', background: '#ecfdf5' }}>
          <span className="ic" style={{ color: '#047857', borderColor: '#a7f3d0' }} aria-hidden="true">
            <Icon name="check" size={14} />
          </span>
          <div className="bd">
            <div className="t" style={{ color: '#065f46' }}>Offer sent</div>
            <div className="d">The worker has been notified and can respond from their app.</div>
          </div>
          <button className="x" aria-label="Dismiss" onClick={() => setParams({}, { replace: true })}>
            <Icon name="close" size={14} />
          </button>
        </div>
      )}

      <PageHead title="Offer Tracking" sub="Offers and work confirmations you have sent" />

      <ErrorNote onRetry={load}>{error}</ErrorNote>

      <div style={{ margin: '4px 0 16px' }}>
        <PillTabs
          tabs={TABS.map((t) => ({ ...t, label: `${t.label} (${tabCount(t.value)})` }))}
          value={tab}
          onChange={setTab}
        />
      </div>

      {!offers && !error ? <Loading rows={3} /> : (
        <div className="wk-card pad-lg">
          <DataTable
            head={['Candidate', 'Job Title', 'Offer Date', 'Status', 'Joining Date', 'Actions']}
            empty={tab === 'ALL' ? 'You have not sent any offers yet.' : `No ${TABS.find((t) => t.value === tab)?.label.toLowerCase()} offers.`}
          >
            {shown.map((o) => (
              <tr key={o.id}>
                <td>
                  <div className="emp-app-row">
                    <Avatar name={o.workerName || '?'} size={36} />
                    <div className="meta">
                      <div className="nm">{o.workerName}</div>
                      <div className="sb">{o.workerPhone ? `+91 ${o.workerPhone}` : ''}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="nm" style={{ fontWeight: 600 }}>{o.jobTitle}</div>
                  <div className="sb">
                    {o.offerLabel || 'Offer'}
                    {o.salary != null ? ` · ${money(o.salary)}` : ''}
                  </div>
                </td>
                <td className="num">{formatDate(o.sentAt)}</td>
                <td>
                  <span className={`wk-badge ${OFFER_STATUS_TONE[o.status] || 'viewed'}`}>
                    {OFFER_STATUS_LABEL[o.status] || o.status}
                  </span>
                  {o.status === 'PENDING' && o.expiresAt && (
                    <div className="sb">Expires {formatDate(o.expiresAt)}</div>
                  )}
                </td>
                <td className="num">{formatDate(o.joiningDate || o.workDate) || '—'}</td>
                <td>
                  <div className="acts">
                    {o.status === 'ACCEPTED' ? (
                      <Link className="mk-btn mk-btn-primary mk-btn-sm" to={`/employer/offers/${o.id}/joining`}>
                        Confirm Joining
                      </Link>
                    ) : (
                      <Link className="mk-btn mk-btn-ghost mk-btn-sm" to={`/employer/workers/${o.workerId}`}>
                        View
                      </Link>
                    )}
                    {(o.status === 'PENDING' || o.status === 'VIEWED') && (
                      <button
                        className="mk-btn mk-btn-outline mk-btn-sm"
                        disabled={busy === o.id}
                        onClick={() => withdraw(o)}
                      >
                        {busy === o.id ? '…' : 'Withdraw'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      )}
    </>
  )
}
