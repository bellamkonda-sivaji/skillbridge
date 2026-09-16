import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api, { errMsg } from '../api'
import { Badge, EmptyState, Spinner } from './ui'

const refLabels = {
  JOB_PAYMENT: 'wallet.jobPayment',
  FUND: 'wallet.fund',
  WITHDRAW: 'wallet.withdraw'
}

export function WalletTab() {
  const { t } = useTranslation()
  const [wallet, setWallet] = useState(null)
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState('fund')

  const load = () => {
    api.get('/wallet').then((res) => setWallet(res.data)).catch(() => {})
  }
  useEffect(load, [])

  const act = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { alert(t('wallet.positive')); return }
    try {
      await api.post(`/wallet/${mode}`, { amount: amt })
      setAmount('')
      load()
    } catch (e) { alert(errMsg(e)) }
  }

  if (!wallet) return <Spinner />

  const txns = wallet.transactions || []

  return (
    <div>
      <div className="grid">
        <div className="card stat-card" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: '#fff' }}>
          <div className="num" style={{ color: '#fff' }}>{wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <div className="lbl" style={{ color: 'rgba(255,255,255,.85)' }}>{t('wallet.balance')}</div>
        </div>
        <div className="card">
          <h3>{mode === 'fund' ? t('wallet.fundTitle') : t('wallet.withdrawTitle')}</h3>
          <div className="row" style={{ alignItems: 'end' }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>{t('wallet.amount')}</label>
              <input type="number" min="0" step="50" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <select value={mode} onChange={(e) => setMode(e.target.value)} style={{ height: 42 }}>
              <option value="fund">{t('wallet.fund')}</option>
              <option value="withdraw">{t('wallet.withdraw')}</option>
            </select>
            <button className="btn btn-primary" onClick={act}>
              {mode === 'fund' ? t('wallet.fund') : t('wallet.withdraw')}
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>{t('wallet.transactions')}</h3>
        {!txns.length ? (
          <EmptyState emoji="💰" text={t('wallet.noTransactions')} />
        ) : (
          <table className="data">
            <thead>
              <tr><th>{t('wallet.reference')}</th><th>{t('wallet.detail')}</th><th>{t('common.status')}</th><th>{t('wallet.amount')}</th><th>Date</th></tr>
            </thead>
            <tbody>
              {txns.map((tx) => (
                <tr key={tx.id}>
                  <td>{t(`wallet.${tx.reference === 'JOB_PAYMENT' ? 'jobPayment' : tx.reference === 'FUND' ? 'fund' : 'withdraw'}`)}</td>
                  <td>{tx.description}</td>
                  <td>
                    <Badge type={tx.type === 'CREDIT' ? 'green' : 'red'}>
                      {tx.type === 'CREDIT' ? 'Credit' : 'Debit'}
                    </Badge>
                  </td>
                  <td style={{ fontWeight: 600, color: tx.type === 'CREDIT' ? 'var(--green-600)' : 'var(--red-600)' }}>
                    {tx.type === 'CREDIT' ? '+' : '−'}{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
