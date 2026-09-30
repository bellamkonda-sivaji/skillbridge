import React, { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDocumentTitle } from '../../marketing/components'
import {
  getTimeseries, getBreakdown, getEmployerAnalytics, getWorkerAnalytics,
  money, num, pct, ratio, formatDate, isoDaysAgo, todayIso,
  DIMENSIONS, GRANULARITIES, SERIES,
} from '../api'
import { useResource } from '../hooks'
import { PageHead, ErrorNote, Card, Select, DataTable, Badge, StatGrid, Empty } from '../components'
import { MetricCard, LineChart, RankedBars, Sparkline, ShareBar } from '../charts'

const TABS = [
  { value: 'activity', label: 'Activity' },
  { value: 'demand', label: 'Categories & Cities' },
  { value: 'employers', label: 'Employers' },
  { value: 'workers', label: 'Workers' },
]

const PRESETS = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
  { value: 365, label: 'Last 12 months' },
]

export default function Analytics() {
  useDocumentTitle('Analytics')
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState(params.get('tab') || 'activity')
  const [days, setDays] = useState(30)
  const range = { from: isoDaysAgo(days), to: todayIso() }

  const pick = (t) => { setTab(t); setParams({ tab: t }, { replace: true }) }

  return (
    <>
      <PageHead title="Analytics" sub="What is happening across the platform, and where">
        <Select value={days} onChange={(v) => setDays(Number(v))} options={PRESETS} all={null} ariaLabel="Date range" />
      </PageHead>

      <div className="ad-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.value} className="ad-tab" role="tab" aria-selected={tab === t.value} onClick={() => pick(t.value)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'activity' && <Activity range={range} days={days} />}
      {tab === 'demand' && <Demand range={range} />}
      {tab === 'employers' && <Employers range={range} />}
      {tab === 'workers' && <Workers range={range} />}
    </>
  )
}

/* ---------------------------------------------------------------- activity */

function Activity({ range, days }) {
  const [granularity, setGranularity] = useState(days > 120 ? 'MONTH' : days > 45 ? 'WEEK' : 'DAY')
  const { data, error, loading, reload } = useResource(
    () => getTimeseries({ ...range, granularity }), [range.from, range.to, granularity],
  )
  const t = data?.totals || {}
  const prev = data?.previousTotals || {}

  return (
    <>
      <ErrorNote onRetry={reload}>{error}</ErrorNote>

      <StatGrid>
        <MetricCard icon="briefcase" tone="blue" label="Jobs posted" value={t.jobsPosted} previous={prev.jobsPosted} />
        <MetricCard icon="doc" tone="violet" label="Applications" value={t.applications} previous={prev.applications} />
        <MetricCard icon="checkCircle" tone="green" label="Workers hired" value={t.hires} previous={prev.hires} />
        <MetricCard icon="store" tone="amber" label="New companies" value={t.employerSignups} previous={prev.employerSignups} />
        <MetricCard icon="users" tone="slate" label="New workers" value={t.workerSignups} previous={prev.workerSignups} />
        <MetricCard icon="calendar" tone="rose" label="Interviews" value={t.interviews} previous={prev.interviews} />
        <MetricCard icon="wallet" tone="green" label="Paid out" value={t.amountPaid} previous={prev.amountPaid} format={money} />
        <MetricCard icon="rupee" tone="amber" label="Platform fees" value={t.platformFees} previous={prev.platformFees} format={money} />
      </StatGrid>

      <Card
        title="Day by day"
        extra={<Select value={granularity} onChange={setGranularity} options={GRANULARITIES} all={null} ariaLabel="Granularity" />}
      >
        {loading ? <div className="ad-skel" style={{ height: 240 }} />
          : <LineChart points={data?.points || []} series={SERIES} />}
        <p className="wk-sub">
          Click a label to hide that line. Every day in the range is plotted, including the quiet ones.
        </p>
      </Card>
    </>
  )
}

/* ------------------------------------------------------------------ demand */

function Demand({ range }) {
  const [dimension, setDimension] = useState('CATEGORY')
  const { data, error, loading, reload } = useResource(
    () => getBreakdown({ ...range, dimension }), [range.from, range.to, dimension],
  )
  const rows = data?.rows || []
  const meta = DIMENSIONS.find((d) => d.value === dimension)

  /* City and skill rows carry supply as well as demand, so they get an extra column. */
  const showSupply = ['CITY', 'SKILL', 'BUSINESS_TYPE'].includes(dimension)

  return (
    <>
      <ErrorNote onRetry={reload}>{error}</ErrorNote>

      <div className="ad-filters">
        <Select value={dimension} onChange={setDimension} options={DIMENSIONS} all={null} ariaLabel="Break down by" />
        {meta && <span className="wk-sub" style={{ marginTop: 0 }}>{meta.hint}</span>}
      </div>

      <div className="ad-three">
        <Card title="Most jobs">
          {loading ? <div className="ad-skel" style={{ height: 160 }} />
            : <RankedBars rows={rows} valueKey="jobCount" color="#2563eb" />}
        </Card>
        <Card title="Most applications">
          {loading ? <div className="ad-skel" style={{ height: 160 }} />
            : <RankedBars rows={rows} valueKey="applicationCount" color="#7c3aed" />}
        </Card>
        <Card title="Most hires">
          {loading ? <div className="ad-skel" style={{ height: 160 }} />
            : <RankedBars rows={rows} valueKey="hireCount" color="#059669" />}
        </Card>
      </div>

      <div style={{ marginTop: 14 }}>
        <Card title={`${meta?.label || 'Breakdown'} in full`}>
          <DataTable
            loading={loading}
            cols={[
              meta?.label || 'Group', 'Jobs', 'Open', 'Vacancies', 'Applications', 'Per job',
              ...(showSupply ? ['Workers', 'Companies'] : []),
              'Interviews', 'Hires', 'Hire rate', 'Fill rate', 'Avg pay/month', 'Paid out',
            ]}
            empty="No activity in this period."
          >
            {rows.map((r) => (
              <tr key={r.key}>
                <td className="nm">{r.label}</td>
                <td className="num">{num(r.jobCount)}</td>
                <td className="num">{num(r.openJobCount)}</td>
                <td className="num">{num(r.vacancies)}</td>
                <td className="num">{num(r.applicationCount)}</td>
                <td className="num">{ratio(r.applicationsPerJob)}</td>
                {showSupply && <td className="num">{num(r.workerCount)}</td>}
                {showSupply && <td className="num">{num(r.employerCount)}</td>}
                <td className="num">{num(r.interviewCount)}</td>
                <td className="num">{num(r.hireCount)}</td>
                <td className="num">{pct(r.hireRate)}</td>
                <td className="num">
                  <Badge tone={r.fillRate >= 0.8 ? 'accepted' : r.fillRate >= 0.4 ? 'pending' : 'rejected'}>
                    {pct(r.fillRate)}
                  </Badge>
                </td>
                <td className="num">{r.avgSalary ? money(Math.round(r.avgSalary)) : '—'}</td>
                <td className="num">{money(r.totalPaid)}</td>
              </tr>
            ))}
          </DataTable>
          <p className="wk-sub">
            Pay is normalised to a monthly equivalent before averaging, so daily and monthly jobs can sit in the same column.
            Fill rate is hires against vacancies; hire rate is hires against applications.
          </p>
        </Card>
      </div>
    </>
  )
}

/* --------------------------------------------------------------- employers */

function Employers({ range }) {
  const { data, error, loading, reload } = useResource(
    () => getEmployerAnalytics({ ...range, limit: 20 }), [range.from, range.to],
  )
  const t = data?.totals || {}

  return (
    <>
      <ErrorNote onRetry={reload}>{error}</ErrorNote>

      <StatGrid>
        <MetricCard icon="store" tone="violet" label="Companies" value={t.totalEmployers} />
        <MetricCard icon="sparkles" tone="amber" label="New this period" value={t.newEmployers} />
        <MetricCard icon="briefcase" tone="blue" label="Actively posting" value={t.activeEmployers}
          format={num} />
        <MetricCard icon="shield" tone="green" label="Verified" value={t.verifiedEmployers} />
        <MetricCard icon="doc" tone="slate" label="Jobs per company" value={t.avgJobsPerEmployer} format={ratio} />
        <MetricCard icon="trending" tone="blue" label="Repeat posters" value={t.repeatPosterRate} format={pct} />
        <MetricCard icon="clock" tone="rose" label="Time to fill" value={t.avgTimeToFillDays} format={ratio} suffix=" days" />
        <MetricCard icon="wallet" tone="green" label="Total spend" value={t.totalSpend} format={money} />
      </StatGrid>

      <div className="ad-side">
        <Card title="Companies posting the most">
          {loading ? <div className="ad-skel" style={{ height: 200 }} /> : (
            <DataTable
              cols={['Company', 'Type', 'City', 'Jobs', 'Applicants', 'Interviews', 'Hires', 'Fill rate', 'Time to fill', 'Spend']}
              empty="No companies posted in this period."
            >
              {(data?.top || []).map((e) => (
                <tr key={e.employerId}>
                  <td>
                    <Link className="nm wk-link" to={`/admin/companies/${e.employerId}`}>{e.businessName}</Link>
                    <div className="sb">{e.verified ? 'Verified' : 'Not verified'} · {e.plan || '—'}</div>
                  </td>
                  <td>{e.businessType || '—'}</td>
                  <td>{e.city || '—'}</td>
                  <td className="num">{num(e.jobCount)}</td>
                  <td className="num">{num(e.applicationCount)}</td>
                  <td className="num">{num(e.interviewCount)}</td>
                  <td className="num">{num(e.hireCount)}</td>
                  <td className="num">{pct(e.fillRate)}</td>
                  <td className="num">{e.avgTimeToFillDays ? `${ratio(e.avgTimeToFillDays)} d` : '—'}</td>
                  <td className="num">{money(e.totalSpend)}</td>
                </tr>
              ))}
            </DataTable>
          )}
        </Card>

        <div style={{ display: 'grid', gap: 14 }}>
          <Card title="New companies over time">
            {loading ? <div className="ad-skel" style={{ height: 48 }} />
              : <Sparkline points={data?.signupTrend || []} color="#d97706" />}
            <p className="wk-sub" style={{ marginTop: 8 }}>
              {num(t.newEmployers)} registered in this period.
            </p>
          </Card>

          <Card title="By plan">
            {loading ? <div className="ad-skel" style={{ height: 60 }} />
              : <ShareBar rows={data?.byPlan || []} valueKey="employerCount" />}
          </Card>

          <Card title="How quickly jobs get traction">
            <div className="ad-kv">
              <div className="r">
                <span className="k">First applicant</span>
                <span className="v">{t.avgTimeToFirstApplicantHours ? `${ratio(t.avgTimeToFirstApplicantHours)} hours` : '—'}</span>
              </div>
              <div className="r">
                <span className="k">First hire</span>
                <span className="v">{t.avgTimeToFillDays ? `${ratio(t.avgTimeToFillDays)} days` : '—'}</span>
              </div>
              <div className="r">
                <span className="k">Applications per job</span>
                <span className="v">{ratio(t.avgApplicationsPerJob)}</span>
              </div>
              <div className="r">
                <span className="k">Platform fees earned</span>
                <span className="v">{money(t.platformFees)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}

/* ----------------------------------------------------------------- workers */

function Workers({ range }) {
  const { data, error, loading, reload } = useResource(
    () => getWorkerAnalytics({ ...range, limit: 20 }), [range.from, range.to],
  )
  const t = data?.totals || {}

  return (
    <>
      <ErrorNote onRetry={reload}>{error}</ErrorNote>

      <StatGrid>
        <MetricCard icon="users" tone="blue" label="Workers" value={t.totalWorkers} />
        <MetricCard icon="sparkles" tone="amber" label="New this period" value={t.newWorkers} />
        <MetricCard icon="doc" tone="violet" label="Applied" value={t.activeWorkers} />
        <MetricCard icon="checkCircle" tone="green" label="Got a job" value={t.workersHired} />
        <MetricCard icon="trending" tone="green" label="Hire rate" value={t.hireRate} format={pct} />
        <MetricCard icon="shield" tone="slate" label="Verified" value={t.verifiedRate} format={pct} />
        <MetricCard icon="clock" tone="rose" label="Time to hire" value={t.avgTimeToHireDays} format={ratio} suffix=" days" />
        <MetricCard icon="wallet" tone="green" label="Total earned" value={t.totalEarned} format={money} />
      </StatGrid>

      <div className="ad-side">
        <Card title="Workers getting hired most">
          {loading ? <div className="ad-skel" style={{ height: 200 }} /> : (
            <DataTable
              cols={['Worker', 'City', 'Skills', 'Applications', 'Interviews', 'Hires', 'Hire rate', 'Rating', 'Earned']}
              empty="No worker activity in this period."
            >
              {(data?.top || []).map((w) => (
                <tr key={w.workerId}>
                  <td>
                    <span className="nm">{w.name}</span>
                    <div className="sb">{w.verified ? 'Verified' : 'Not verified'}</div>
                  </td>
                  <td>{w.city || '—'}</td>
                  <td style={{ whiteSpace: 'normal', maxWidth: 200 }}>{(w.skills || []).slice(0, 3).join(', ') || '—'}</td>
                  <td className="num">{num(w.applicationCount)}</td>
                  <td className="num">{num(w.interviewCount)}</td>
                  <td className="num">{num(w.hireCount)}</td>
                  <td className="num">{pct(w.hireRate)}</td>
                  <td className="num">{w.avgRating ? `${ratio(w.avgRating)}★ (${num(w.ratingCount)})` : '—'}</td>
                  <td className="num">{money(w.totalEarned)}</td>
                </tr>
              ))}
            </DataTable>
          )}
        </Card>

        <div style={{ display: 'grid', gap: 14 }}>
          <Card title="Workers getting jobs, day by day">
            {loading ? <div className="ad-skel" style={{ height: 48 }} />
              : <Sparkline points={data?.hireTrend || []} color="#059669" />}
            <p className="wk-sub" style={{ marginTop: 8 }}>{num(t.workersHired)} hired in this period.</p>
          </Card>

          <Card title="New workers signing up">
            {loading ? <div className="ad-skel" style={{ height: 48 }} />
              : <Sparkline points={data?.signupTrend || []} color="#0891b2" />}
            <p className="wk-sub" style={{ marginTop: 8 }}>{num(t.newWorkers)} registered in this period.</p>
          </Card>

          <Card title="Skills actually getting hired" extra={<Link className="wk-link" to="/admin/skills">Registry</Link>}>
            {loading ? <div className="ad-skel" style={{ height: 140 }} />
              : (data?.topSkillsHired || []).length
                ? <RankedBars rows={(data.topSkillsHired || []).map((s) => ({ ...s, label: s.skill, key: s.skill }))}
                    valueKey="hireCount" color="#059669" />
                : <Empty icon="target" title="No hires yet" text="Once workers are hired, the skills behind those hires rank here." />}
          </Card>
        </div>
      </div>
    </>
  )
}
