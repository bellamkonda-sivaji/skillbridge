import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import DashboardShell from '../../components/DashboardShell'
import AdminJobsTab from './AdminJobsTab'
import AdminMatchesTab from './AdminMatchesTab'
import AdminInterviewsTab from './AdminInterviewsTab'
import AdminBusinessTab from './AdminBusinessTab'
import AdminReviewsTab from './AdminReviewsTab'
import AdminPaymentsTab from './AdminPaymentsTab'
import AdminSkillsTab from './AdminSkillsTab'

export default function AdminDashboard() {
  const { t } = useTranslation()
  const [tab, setTab] = useState('jobs')

  const nav = [
    { key: 'jobs', icon: '📋', label: t('admin.postedJobs') },
    { key: 'matchWorkers', icon: '🤝', label: t('admin.matchWorkers') },
    { key: 'interviews', icon: '🗓️', label: t('admin.interviewsScheduled') },
    { key: 'business', icon: '🏢', label: t('admin.businessProfiles') },
    { key: 'reviewsWorker', icon: '👷', label: t('admin.reviewsForWorkers') },
    { key: 'reviewsEmployer', icon: '🏢', label: t('admin.reviewsOfEmployers') },
    { key: 'payments', icon: '💰', label: t('admin.payments') },
    { key: 'skills', icon: '🛠️', label: t('admin.postSkill') }
  ]

  return (
    <DashboardShell nav={nav} active={tab} onNav={setTab} title={t('admin.title')}>
      {tab === 'jobs' && <AdminJobsTab />}
      {tab === 'matchWorkers' && <AdminMatchesTab />}
      {tab === 'interviews' && <AdminInterviewsTab />}
      {tab === 'business' && <AdminBusinessTab />}
      {tab === 'reviewsWorker' && <AdminReviewsTab targetRole="WORKER" />}
      {tab === 'reviewsEmployer' && <AdminReviewsTab targetRole="EMPLOYER" />}
      {tab === 'payments' && <AdminPaymentsTab />}
      {tab === 'skills' && <AdminSkillsTab />}
    </DashboardShell>
  )
}
