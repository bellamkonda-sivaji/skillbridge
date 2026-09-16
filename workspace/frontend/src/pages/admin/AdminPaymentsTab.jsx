import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../api'
import { Badge, EmptyState, Spinner } from '../../components/ui'

export default function AdminPaymentsTab() {
  const { t } = useTranslation()
  const [wallets, setWallets] = useState([])
  const [txns, setTxns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/admin/wallets'), api.get('/admin/payments')])
      .then(([w, p]) => { setWallets(w.data); setTxns(p.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  const roleMap = { WORKER: 'green', EMPLOYER: 'amber', ADMIN: 'blue' }

  return (
    <div>
      <div className="card">
        <h3>{t('admin.wallets')}</h3>
        <table className="data">
          <thead>
            <tr><th>Name</th><th>{t('common.type')}</th><th>{t('wallet.balance')}</th></tr>
          </thead>
          <tbody>
            {wallets.map((w) => (
              <tr key={w.id}>
                <td>{w.name}</td>
                <td><Badge type={roleMap[w.role]}>{w.role}</Badge></td>
                <td style={{ fontWeight: 600 }}>{w.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>{t('admin.payments')}</h3>
        {!txns.length ? <EmptyState emoji="💸" text={t('wallet.noTransactions')} /> : (
          <table className="data">
            <thead>
              <tr><th>{t('wallet.reference')}</th><th>{t('wallet.detail')}</th><th>{t('common.status')}</th><th>{t('wallet.amount')}</th><th>Date</th></tr>
            </thead>
            <tbody>
              {txns.map((tx) => (
                <tr key={tx.id}>
                  <td>{tx.reference}</td>
                  <td>{tx.description}</td>
                  <td><Badge type={tx.type === 'CREDIT' ? 'green' : 'red'}>{tx.type}</Badge></td>
                  <td style={{ fontWeight: 600, color: tx.type === 'CREDIT' ? 'var(--green-600)' : 'var(--red-600)' }}>
                    {tx.type === 'CREDIT' ? '+' : '−'}{tx.amount.toLocaleString()}
                  </td>
                  <td>{new Date(tx.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
