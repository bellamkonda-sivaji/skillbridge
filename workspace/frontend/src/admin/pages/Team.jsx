import React, { useState } from 'react'
import Icon from '../../marketing/icons'
import { useDocumentTitle } from '../../marketing/components'
import { useAuth } from '../../context/AuthContext'
import {
  getTeam, createAdmin, setAdminRole, setAdminStatus, deleteAdmin,
  ROLES, ROLE_LABEL, ROLE_TONE, formatDate,
} from '../api'
import { useResource } from '../hooks'
import { DataTable, PageHead, ErrorNote, Badge, Phone, Card, Modal, Empty, usePermissions } from '../components'

/**
 * Super Admin only. The server enforces the same rules again — nobody may
 * remove, disable or demote themselves, and the last enabled Super Admin is
 * protected so an installation can never be locked out of its own back office.
 */
export default function Team() {
  useDocumentTitle('Admin team')
  const { user } = useAuth()
  const { isSuperAdmin } = usePermissions()
  const { data, error, loading, reload } = useResource(getTeam, [])
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(null)
  const [actionError, setActionError] = useState('')

  const admins = Array.isArray(data) ? data : []
  const superAdmins = admins.filter((a) => a.role === 'SUPER_ADMIN' && a.enabled)

  if (!isSuperAdmin) {
    return (
      <>
        <PageHead title="Admin Team" />
        <div className="wk-card pad-lg">
          <Empty icon="lock" title="Super Admins only"
            text="Managing the admin team is restricted to Super Admins. Ask one of them if you need a change here." />
        </div>
      </>
    )
  }

  const act = async (fn, id) => {
    setBusy(id); setActionError('')
    try { await fn(); reload() }
    catch (e) { setActionError(e?.response?.data?.message || 'That change was not allowed.') }
    finally { setBusy(null) }
  }

  /* Mirrors the server's guards so the UI does not offer a button that will 403. */
  const isSelf = (a) => a.id === user?.id
  const isLastSuper = (a) => a.role === 'SUPER_ADMIN' && a.enabled && superAdmins.length <= 1

  return (
    <>
      <PageHead title="Admin Team" sub="Who can get into the back office, and what they can do">
        <button className="mk-btn mk-btn-primary mk-btn-sm" onClick={() => setAdding(true)}>
          <Icon name="users" size={14} /> Add admin
        </button>
      </PageHead>

      <ErrorNote onRetry={reload}>{error}</ErrorNote>
      {actionError && <div className="ad-error"><Icon name="shield" size={15} /><span>{actionError}</span></div>}

      <div className="wk-card pad-lg">
        <DataTable
          loading={loading}
          cols={['Name', 'Email', 'Phone', 'Role', 'Status', 'Added', 'Last sign-in', 'Actions']}
          empty="No admin accounts."
        >
          {admins.map((a) => {
            const locked = isSelf(a) || isLastSuper(a)
            return (
              <tr key={a.id}>
                <td>
                  <span className="nm">{a.name}</span>
                  {isSelf(a) && <div className="sb">That’s you</div>}
                  {a.createdByName && <div className="sb">added by {a.createdByName}</div>}
                </td>
                <td>{a.email}</td>
                <td><Phone number={a.phone} /></td>
                <td>
                  <select
                    className="ad-select"
                    style={{ padding: '5px 8px', fontSize: 12.5 }}
                    value={a.role}
                    disabled={locked || busy === a.id}
                    title={locked ? (isSelf(a) ? 'You cannot change your own role' : 'The last Super Admin cannot be demoted') : undefined}
                    onChange={(e) => act(() => setAdminRole(a.id, e.target.value), a.id)}
                  >
                    {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </td>
                <td>
                  <Badge tone={a.enabled ? 'accepted' : 'withdrawn'}>{a.enabled ? 'Active' : 'Disabled'}</Badge>
                </td>
                <td className="num">{formatDate(a.createdAt)}</td>
                <td className="num">{a.lastLoginAt ? formatDate(a.lastLoginAt, true) : <span className="ad-zero">Never</span>}</td>
                <td>
                  <div className="acts">
                    <button
                      className="mk-btn mk-btn-outline mk-btn-sm"
                      disabled={locked || busy === a.id}
                      onClick={() => act(() => setAdminStatus(a.id, !a.enabled), a.id)}
                    >
                      {a.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      className="mk-btn mk-btn-outline mk-btn-sm"
                      style={{ color: '#b91c1c', borderColor: '#fecaca' }}
                      disabled={locked || busy === a.id}
                      onClick={() => {
                        if (window.confirm(`Remove ${a.name}'s admin access? This cannot be undone.`)) {
                          act(() => deleteAdmin(a.id), a.id)
                        }
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </DataTable>
      </div>

      <div style={{ marginTop: 14 }}>
        <Card title="What each role can do">
          <div className="ad-kv">
            {ROLES.map((r) => (
              <div className="r" key={r.value}>
                <span className="k"><Badge tone={ROLE_TONE[r.value]}>{r.label}</Badge></span>
                <span className="v" style={{ fontWeight: 400 }}>{r.hint}</span>
              </div>
            ))}
          </div>
          <p className="wk-sub">
            More than one Super Admin is allowed and encouraged — the last remaining one cannot be
            removed or demoted, so the back office can never lock itself out.
          </p>
        </Card>
      </div>

      {adding && <AddAdmin onClose={() => setAdding(false)} onSaved={() => { setAdding(false); reload() }} />}
    </>
  )
}

function AddAdmin({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'ADMIN' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))
  const valid = form.name.trim().length >= 2 && /^\S+@\S+\.\S+$/.test(form.email) && form.password.length >= 6

  const save = async () => {
    setBusy(true); setError('')
    try {
      await createAdmin({ ...form, name: form.name.trim(), email: form.email.trim(), phone: form.phone.replace(/\D/g, '') || null })
      onSaved()
    } catch (e) {
      setError(e?.response?.data?.message || 'We could not create that account.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="Add an admin" onClose={onClose}>
      {error && <div className="ad-error"><Icon name="shield" size={15} /><span>{error}</span></div>}

      <label className="ad-field"><span>Full name</span>
        <input className="ad-input" value={form.name} onChange={(e) => set('name')(e.target.value)} /></label>
      <label className="ad-field"><span>Email</span>
        <input className="ad-input" type="email" value={form.email} onChange={(e) => set('email')(e.target.value)} /></label>
      <label className="ad-field"><span>Mobile number (optional)</span>
        <input className="ad-input" inputMode="numeric" value={form.phone} onChange={(e) => set('phone')(e.target.value)} /></label>
      <label className="ad-field"><span>Temporary password</span>
        <input className="ad-input" type="text" value={form.password} onChange={(e) => set('password')(e.target.value)} placeholder="At least 6 characters" /></label>

      <div className="ad-field">
        <span>Role</span>
        <div className="ad-roles">
          {ROLES.map((r) => (
            <button key={r.value} type="button" className="ad-role" aria-pressed={form.role === r.value} onClick={() => set('role')(r.value)}>
              <span className="mark" aria-hidden="true" />
              <span><span className="t">{r.label}</span><span className="d">{r.hint}</span></span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
        <button className="mk-btn mk-btn-outline" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="mk-btn mk-btn-primary" onClick={save} disabled={busy || !valid}>
          {busy ? 'Creating…' : 'Create admin'}
        </button>
      </div>
    </Modal>
  )
}
