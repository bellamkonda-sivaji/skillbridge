import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../marketing/icons'
import { useDocumentTitle } from '../../marketing/components'
import { getOverview, money, num, timeAgo, stageOf } from '../api'
import { useResource } from '../hooks'
import {
  StatGrid, StatTile, Funnel, TrendChart, Card, PageHead, ErrorNote, Empty, Select, usePermissions,
} from '../components'

const RANGES = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
]

export default function Overview() {
  useDocumentTitle('Admin overview')
  const [days, setDays] = useState(30)
  const { can } = usePermissions()
  const { data, error, loading, reload } = useResource(() => getOverview(days), [days])

  const d = data || {}
  const w = d.workers || {}, e = d.employers || {}, j = d.jobs || {}
  const a = d.applications || {}, i = d.interviews || {}, o = d.offers || {}, p = d.payments || {}

  return (
    <>
      <PageHead title="Overview" sub="Everything happening across JobOn">
        <Select
          value={days}
          onChange={(v) => setDays(Number(v))}
          options={RANGES}
          all={null}
          ariaLabel="Date range"
        />
      </PageHead>

      <ErrorNote onRetry={reload}>{error}</ErrorNote>

      <StatGrid>
        <StatTile icon="users" tone="blue" label="Registered workers" value={w.total}
          sub={`${num(w.newInPeriod || 0)} new · ${num(w.verified || 0)} verified`} to="/admin/skills" />
        <StatTile icon="store" tone="violet" label="Registered companies" value={e.total}
          sub={`${num(e.newInPeriod || 0)} new · ${num(e.verified || 0)} verified`} to="/admin/companies" />
        <StatTile icon="briefcase" tone="amber" label="Jobs posted" value={j.total}
          sub={`${num(j.open || 0)} open · ${num(j.filled || 0)} filled`} to="/admin/jobs" />
        <StatTile icon="doc" tone="slate" label="Applications" value={a.total}
          sub={`${num(a.contacted || 0)} contacted · ${num(a.notContacted || 0)} not`} to="/admin/applications" />
        <StatTile icon="calendar" tone="blue" label="Interviews" value={i.total}
          sub={`${num(i.upcoming || 0)} upcoming · ${num(i.completed || 0)} held`} to="/admin/interviews" />
        <StatTile icon="checkCircle" tone="green" label="Offers accepted" value={o.accepted}
          sub={`${num(o.pending || 0)} pending · ${num(o.declined || 0)} declined`} />
        {can('VIEW_PAYMENTS') && (
          <>
            <StatTile icon="wallet" tone="green" label="Paid to workers" value={money(p.totalPaidOut)}
              sub={`${money(p.inPeriod || 0)} in this period`} to="/admin/payments" />
            <StatTile icon="rupee" tone="amber" label="Platform fees" value={money(p.platformFees)}
              sub={p.pending ? `${money(p.pending)} pending` : 'All settled'} to="/admin/payments" />
          </>
        )}
      </StatGrid>

      <div className="ad-side">
        <Card title="Daily activity" extra={<span className="wk-sub" style={{ marginTop: 0 }}>Last {days} days</span>}>
          {loading ? <div className="ad-skel" style={{ height: 140 }} />
            : d.trend?.length ? <TrendChart data={d.trend} />
            : <Empty icon="trending" title="No activity yet" text="Once jobs are posted and workers apply, the daily pattern shows here." />}
        </Card>

        <Card title="Hiring funnel" extra={<Link className="wk-link" to="/admin/applications">All applications</Link>}>
          {loading ? <div className="ad-skel" style={{ height: 180 }} /> : <Funnel data={d.funnel} />}
          <p className="wk-sub">
            Each bar is measured against the step before it, so the percentages show where candidates drop out.
          </p>
        </Card>
      </div>

      <div className="ad-side" style={{ marginTop: 14 }}>
        <Card title="Recent activity">
          {d.recentActivity?.length ? (
            <div className="ad-timeline">
              {d.recentActivity.slice(0, 12).map((r, idx) => {
                const s = stageOf(r.type)
                return (
                  <div className={`ad-tl ${s.tone}`} key={`${r.at}-${idx}`}>
                    <span className="rail">
                      <span className="dot"><Icon name={s.icon} size={14} /></span>
                      <span className="line" />
                    </span>
                    <div className="bd">
                      <div className="t">{r.summary}</div>
                      <div className="m"><span>{timeAgo(r.at)}</span></div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            !loading && <Empty icon="clock" title="Nothing recent" text="New applications, offers and hires will appear here." />
          )}
        </Card>

        <Card title="Top skills" extra={<Link className="wk-link" to="/admin/skills">Full registry</Link>}>
          {d.topSkills?.length ? (
            <div className="ad-kv">
              {d.topSkills.slice(0, 10).map((s) => (
                <div className="r" key={s.skill}>
                  <span className="k" style={{ width: 'auto', flex: 1, color: 'var(--ink)' }}>
                    <Link className="wk-link" to={`/admin/skills?q=${encodeURIComponent(s.skill)}`}>{s.skill}</Link>
                  </span>
                  <span className="v" style={{ flex: 'none', textAlign: 'right' }}>
                    {num(s.workerCount)} workers · {num(s.jobCount)} jobs
                  </span>
                </div>
              ))}
            </div>
          ) : (
            !loading && <Empty icon="target" title="No skills yet" text="Skills appear as workers register and jobs are posted." />
          )}
        </Card>
      </div>
    </>
  )
}
