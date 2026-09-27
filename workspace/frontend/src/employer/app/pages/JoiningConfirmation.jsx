import React, { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../../../marketing/icons'
import { useDocumentTitle } from '../../../marketing/components'
import { Loading, ErrorNote, PageHead } from '../../../worker/components'
import { WhenBanner, Timeline } from '../hiring'
import { getJoining, saveJoining, formatDate } from '../api'

const DOCS = [
  { value: 'AADHAAR', label: 'Aadhaar Card' },
  { value: 'BANK', label: 'Bank Account Details' },
  { value: 'PAN', label: 'PAN Card' },
  { value: 'ADDRESS', label: 'Address Proof' },
  { value: 'PHOTO', label: 'Passport Photo' },
]

/** Photo proof is shrunk before upload — a raw camera JPEG is far too big for
 *  a data URL, and we learnt that the hard way with the business logo. */
function compress(file, max = 720, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('read failed'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('decode failed'))
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * scale)
        c.height = Math.round(img.height * scale)
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
        resolve(c.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Screen 25 — Joining Confirmation.
 *
 * The timeline steps come from the server because they differ by duration: a
 * short job runs Hired → Joined → Work Completed → Payment, while a monthly one
 * runs Offer Accepted → Joined → Work in Progress → Complete and also collects
 * an employee ID, a department and document checks.
 */
export default function JoiningConfirmation() {
  const { offerId } = useParams()
  const [j, setJ] = useState(null)
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState('')
  const fileRef = useRef(null)
  useDocumentTitle('Joining Confirmation')

  const apply = (d) => {
    setJ(d)
    setForm({
      actualJoiningDate: d.actualJoiningDate || '',
      reportingTime: d.reportingTime || '',
      employeeId: d.employeeId || '',
      department: d.department || '',
      documentsVerified: Array.isArray(d.documentsVerified) ? d.documentsVerified : [],
      photoProofUrl: d.photoProofUrl || '',
      notes: d.notes || '',
    })
  }

  const load = () => {
    setJ(null); setError('')
    getJoining(offerId).then(apply).catch((e) =>
      setError(e?.response?.data?.message || 'We could not load this joining record.'))
  }
  useEffect(load, [offerId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (error && !j) return <ErrorNote onRetry={load}>{error}</ErrorNote>
  if (!j || !form) return <Loading rows={3} />

  const short = !!j.isShortJob
  const set = (patch) => { setForm((f) => ({ ...f, ...patch })); setSaved('') }
  const toggleDoc = (v) =>
    set({
      documentsVerified: form.documentsVerified.includes(v)
        ? form.documentsVerified.filter((d) => d !== v)
        : [...form.documentsVerified, v],
    })

  const save = async (markStep) => {
    setSaving(true); setError(''); setSaved('')
    try {
      const updated = await saveJoining(offerId, { ...form, markStep })
      apply(updated)
      setSaved(markStep ? 'Updated' : 'Saved')
    } catch (e) {
      setError(e?.response?.data?.message || 'We could not save that. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const pickPhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      set({ photoProofUrl: await compress(file) })
    } catch {
      setError('We could not read that image. Try another photo.')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const next = (j.steps || []).find((s) => s.state === 'CURRENT')

  return (
    <>
      <Link className="wk-link" to="/employer/offers" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
        <Icon name="chevronLeft" size={15} /> Back to offers
      </Link>

      <WhenBanner id="joining">
        You land here once the worker has accepted. Use it to record that they actually turned up and to
        move the job along until the work is complete and payment is released.
      </WhenBanner>

      <PageHead
        title="Joining Confirmation"
        sub={`${j.workerName} · ${j.jobTitle}`}
      />

      <ErrorNote>{error}</ErrorNote>

      <div className="wk-card pad-lg">
        <h2 className="wk-h2" style={{ marginBottom: 16 }}>{short ? 'Work Status' : 'Joining Status'}</h2>
        <Timeline steps={j.steps || []} />

        {next && (
          <div className="wk-row" style={{ gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
            <button className="mk-btn mk-btn-primary mk-btn-sm" disabled={saving} onClick={() => save(next.key)}>
              {saving ? 'Saving…' : `Mark ${next.label}`}
            </button>
            <span className="wk-sub" style={{ marginTop: 0 }}>{next.note}</span>
          </div>
        )}
      </div>

      <div className="wk-card pad-lg" style={{ marginTop: 14 }}>
        <h2 className="wk-h2" style={{ marginBottom: 14 }}>{short ? 'Work Details' : 'Joining Details'}</h2>

        <div className="wk-form">
          <label className="wk-field">
            <span className="lb">{short ? 'Actual Joining Time' : 'Actual Joining Date'}</span>
            <input
              className="wk-input"
              type="date"
              value={form.actualJoiningDate || ''}
              onChange={(e) => set({ actualJoiningDate: e.target.value })}
            />
          </label>

          <label className="wk-field">
            <span className="lb">Reporting Time</span>
            <input
              className="wk-input"
              type="time"
              value={form.reportingTime || ''}
              onChange={(e) => set({ reportingTime: e.target.value })}
            />
          </label>

          {!short && (
            <>
              <label className="wk-field">
                <span className="lb">Employee ID</span>
                <input
                  className="wk-input"
                  placeholder="e.g. FM-0142"
                  value={form.employeeId}
                  onChange={(e) => set({ employeeId: e.target.value })}
                />
              </label>
              <label className="wk-field">
                <span className="lb">Department</span>
                <input
                  className="wk-input"
                  placeholder="e.g. Store Floor"
                  value={form.department}
                  onChange={(e) => set({ department: e.target.value })}
                />
              </label>
            </>
          )}
        </div>

        {!short && (
          <>
            <h3 className="wk-h2" style={{ fontSize: 15, marginTop: 22, marginBottom: 10 }}>Documents Verified</h3>
            <div style={{ display: 'grid', gap: 9, gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
              {DOCS.map((d) => (
                <label key={d.value} className="wk-row" style={{ gap: 9, cursor: 'pointer', fontSize: 13.5 }}>
                  <input
                    type="checkbox"
                    checked={form.documentsVerified.includes(d.value)}
                    onChange={() => toggleDoc(d.value)}
                  />
                  <span>{d.label}</span>
                </label>
              ))}
            </div>
          </>
        )}

        {short && (
          <>
            <h3 className="wk-h2" style={{ fontSize: 15, marginTop: 22, marginBottom: 8 }}>Photo Proof</h3>
            <p className="wk-sub" style={{ marginTop: 0 }}>
              Optional. A photo taken at the workplace is useful if there is ever a dispute about the day.
            </p>
            {form.photoProofUrl ? (
              <div className="wk-row" style={{ gap: 12, marginTop: 10, alignItems: 'flex-start' }}>
                <img
                  src={form.photoProofUrl}
                  alt="Photo proof"
                  style={{ width: 130, height: 130, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--line)' }}
                />
                <button className="mk-btn mk-btn-outline mk-btn-sm" onClick={() => set({ photoProofUrl: '' })}>
                  Remove
                </button>
              </div>
            ) : (
              <button className="emp-upload" style={{ marginTop: 10 }} onClick={() => fileRef.current?.click()}>
                <span className="ic"><Icon name="eye" size={16} /></span>
                <span className="t"><b>Upload a photo</b> from the workplace</span>
                <span className="h">JPG or PNG</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickPhoto} />
          </>
        )}

        <label className="wk-field" style={{ marginTop: 20 }}>
          <span className="lb">Notes</span>
          <textarea
            className="wk-input"
            rows={3}
            placeholder="Anything worth recording about the joining."
            value={form.notes}
            onChange={(e) => set({ notes: e.target.value })}
          />
        </label>

        <div className="wk-row" style={{ gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
          <button className="mk-btn mk-btn-primary" disabled={saving} onClick={() => save()}>
            {saving ? 'Saving…' : 'Save Details'}
          </button>
          {saved && <span className="wk-badge accepted">{saved}</span>}
          {j.offerAcceptedAt && (
            <span className="wk-sub" style={{ marginTop: 0 }}>
              Offer accepted {formatDate(j.offerAcceptedAt, true)}
            </span>
          )}
        </div>
      </div>
    </>
  )
}
