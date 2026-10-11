import React, { useState } from 'react'
import Icon from '../../marketing/icons'
import { useDocumentTitle } from '../../marketing/components'
import { getEmployerVerifications, setEmployerVerified } from '../api'
import { useResource } from '../hooks'
import { PageHead, ErrorNote, Badge, Phone, Empty, usePermissions } from '../components'

/**
 * Checking a business against the proof it sent.
 *
 * Employers upload a registration certificate, a photo of the shop and the
 * owner's ID during onboarding, and until now nothing showed them to
 * anyone: the uploading side of verification existed and the reviewing side
 * did not, so every business stayed unverified however much it had provided.
 *
 * The documents are shown full width and openable, because a certificate
 * read at thumbnail size has not been checked. The phone number is here too
 * - staff ring the business, and the paperwork only supports that call.
 */
export default function EmployerVerifications() {
  useDocumentTitle('Business verification')
  const { can } = usePermissions()
  const { data, error, loading, reload } = useResource(getEmployerVerifications, [])
  const [busy, setBusy] = useState(null)
  const [actionError, setActionError] = useState('')
  const [zoom, setZoom] = useState(null)

  const rows = Array.isArray(data) ? data : []
  const allowed = can('VERIFY_ACCOUNTS')
  const waiting = rows.filter((r) => !r.verified)
  const done = rows.filter((r) => r.verified)

  const decide = async (row, verified) => {
    setBusy(row.employerAccountId); setActionError('')
    try {
      await setEmployerVerified(row.employerAccountId, verified)
      reload()
    } catch (e) {
      setActionError(e?.response?.data?.message || 'That did not go through.')
    } finally {
      setBusy(null)
    }
  }

  const docs = (row) => [
    ['Registration', row.registrationDocUrl],
    ['Owner ID', row.ownerIdDocUrl],
    ['Shop photo', row.logoUrl],
  ].filter(([, url]) => url)

  const card = (row) => (
    <div className="wk-card ad-verify" key={row.employerAccountId}>
      <div className="ad-verify-head">
        <div>
          <h3>{row.businessName || row.ownerName || 'Unnamed business'}</h3>
          <p className="wk-sub">
            {[row.businessType, row.city, row.pincode].filter(Boolean).join(' · ')}
          </p>
          <p className="wk-sub">
            {row.ownerName} · <Phone value={row.phone} />
            {row.shopCount > 1 ? ` · ${row.shopCount} places` : ''}
          </p>
        </div>
        <Badge tone={row.verified ? 'green' : 'amber'}>
          {row.verified ? 'Verified' : 'Waiting'}
        </Badge>
      </div>

      {row.address ? <p className="ad-verify-addr">{row.address}</p> : null}

      {docs(row).length ? (
        <div className="ad-docs">
          {docs(row).map(([label, url]) => (
            <figure key={label} className="ad-doc">
              <button type="button" onClick={() => setZoom({ label, url })}>
                <img src={url} alt={label} />
              </button>
              <figcaption>{label}</figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <p className="ad-verify-none">
          Nothing uploaded yet. Ring them before deciding.
        </p>
      )}

      {allowed ? (
        <div className="ad-verify-btns">
          {row.verified ? (
            <button className="btn ghost" disabled={busy === row.employerAccountId}
              onClick={() => decide(row, false)}>
              Undo verification
            </button>
          ) : (
            <button className="btn" disabled={busy === row.employerAccountId}
              onClick={() => decide(row, true)}>
              {busy === row.employerAccountId ? 'Saving…' : 'Mark verified'}
            </button>
          )}
        </div>
      ) : null}
    </div>
  )

  return (
    <>
      <PageHead
        title="Business verification"
        sub="Check the proof a business sent before it hires anyone"
      />
      <ErrorNote onRetry={reload}>{error || actionError}</ErrorNote>

      {loading ? <p className="wk-sub">Loading…</p> : null}

      {!loading && !rows.length ? <Empty>No businesses yet.</Empty> : null}

      {waiting.length ? (
        <>
          <h2 className="ad-verify-group">Waiting ({waiting.length})</h2>
          {waiting.map(card)}
        </>
      ) : null}

      {done.length ? (
        <>
          <h2 className="ad-verify-group">Verified ({done.length})</h2>
          {done.map(card)}
        </>
      ) : null}

      {/* Full size, because a certificate read at thumbnail size has not
          actually been read. */}
      {zoom ? (
        <div className="ad-doc-zoom" onClick={() => setZoom(null)} role="presentation">
          <figcaption>{zoom.label} — tap anywhere to close</figcaption>
          <img src={zoom.url} alt={zoom.label} />
        </div>
      ) : null}
    </>
  )
}
