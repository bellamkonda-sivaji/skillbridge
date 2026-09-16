import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import DashboardShell from '../../components/DashboardShell'
import { WalletTab } from '../../components/WalletTab'
import { InterviewsTab } from '../../components/InterviewsTab'
import { ReviewsTab } from '../../components/ReviewsTab'
import WorkerProfileTab from './WorkerProfileTab'
import JobWorkedTab from './JobWorkedTab'
import MySkillsTab from './MySkillsTab'

export default function WorkerDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [tab, setTab] = useState('jobWorked')

  const nav = [
    { key: 'jobWorked', icon: '🧰', label: t('worker.jobWorked') },
    { key: 'mySkills', icon: '🛠️', label: t('worker.mySkills') },
    { key: 'interviews', icon: '🗓️', label: t('worker.interviews') },
    { key: 'profile', icon: '👤', label: t('worker.profile') },
    { key: 'reviews', icon: '⭐', label: t('common.reviews') },
    { key: 'wallet', icon: '💰', label: t('wallet.title') }
  ]

  return (
    <DashboardShell nav={nav} active={tab} onNav={setTab} title={t('worker.title')}>
      {tab === 'jobWorked' && <JobWorkedTab />}
      {tab === 'mySkills' && <MySkillsTab />}
      {tab === 'interviews' && <InterviewsTab role="worker" />}
      {tab === 'profile' && <WorkerProfileTab />}
      {tab === 'reviews' && <ReviewsTab userId={user.id} canWrite={false} />}
      {tab === 'wallet' && <WalletTab />}
    </DashboardShell>
  )
}
