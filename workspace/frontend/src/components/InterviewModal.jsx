import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import api, { errMsg } from '../api'
import { Modal } from './controls'

export default function InterviewModal({ open, onClose, workerId, jobId, onDone }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    scheduledAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    mode: 'IN_PERSON', location: '', notes: ''
  })
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    try {
      await api.post('/employer/interviews', {
        workerId, jobId: jobId || null,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        mode: form.mode, location: form.location, notes: form.notes
      })
      onClose()
      onDone?.()
    } catch (e) { alert(errMsg(e)) } finally { setBusy(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={t('interview.inviteTitle')}>
      <div className="field">
        <label>{t('interview.scheduledAt')}</label>
        <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
      </div>
      <div className="field">
        <label>{t('interview.mode')}</label>
        <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
          <option value="IN_PERSON">{t('interview.modeInPerson')}</option>
          <option value="VIDEO">{t('interview.modeVideo')}</option>
          <option value="PHONE">{t('interview.modePhone')}</option>
        </select>
      </div>
      <div className="field">
        <label>{t('interview.location')}</label>
        <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Shop address / phone / video link" />
      </div>
      <div className="field">
        <label>{t('interview.notes')}</label>
        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>
      <button className="btn btn-primary btn-block" disabled={busy} onClick={submit}>
        {busy ? '...' : t('common.send')}
      </button>
    </Modal>
  )
}
