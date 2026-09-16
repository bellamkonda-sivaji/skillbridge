import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import DashboardShell from '../../components/DashboardShell'
import { WalletTab } from '../../components/WalletTab'
import { ReviewsTab } from '../../components/ReviewsTab'
import BusinessProfileTab from './BusinessProfileTab'
import PostJobTab from './PostJobTab'
import MyJobsTab from './MyJobsTab'

export default function EmployerDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [tab, setTab] = useState('postJob')
  const [refreshJobs, setRefreshJobs] = useState(0)

  const nav = [
    { key: 'postJob', icon: '➕', label: t('employer.postJob') },
    { key: 'jobs', icon: '📋', label: t('employer.myJobs') },
    { key: 'profile', icon: '🏢', label: t('employer.profile') },
    { key: 'reviews', icon: '⭐', label: t('common.reviews') },
    { key: 'wallet', icon: '💰', label: t('wallet.title') }
  ]

  return (
    <DashboardShell nav={nav} active={tab} onNav={setTab} title={t('employer.title')}>
      {tab === 'postJob' && <PostJobTab onPosted={() => setRefreshJobs((x) => x + 1)} />}
      {tab === 'jobs' && <MyJobsTab key={refreshJobs} />}
      {tab === 'profile' && <BusinessProfileTab />}
      {tab === 'reviews' && <ReviewsTab userId={user.id} canWrite={false} />}
      {tab === 'wallet' && <WalletTab />}
    </DashboardShell>
  )
}
