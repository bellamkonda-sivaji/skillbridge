import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDocumentTitle } from '../../marketing/components'
import { getSkillRegistry, getSkillWorkers, money, num, formatDate } from '../api'
import { usePagedList } from '../hooks'
import {
  DataTable, Pager, Filters, Select, PageHead, ErrorNote, Badge, Phone, Modal, Card,
} from '../components'

const SORTS = [
  { value: 'WORKERS', label: 'Most workers' },
  { value: 'JOBS', label: 'Most jobs' },
  { value: 'DEMAND', label: 'Highest demand' },
]

/**
 * The workers section is deliberately a *skills registry*, not a list of
 * people: what the back office needs to see is which skills the platform has
 * supply of and which ones employers are asking for and cannot fill. A skill
 * drills through to the workers holding it.
 */
export default function Skills() {
  useDocumentTitle('Skills registry')
  const [params] = useSearchParams()
  const [drill, setDrill] = useState(null)
  const list = usePagedList(getSkillRegistry, { q: params.get('q') || '', sort: 'WORKERS' })

  return (
    <>
      <PageHead title="Skills Registry" sub="What the workforce can do, and what employers are asking for" />

      <Filters q={list.filters.q} onQ={(v) => list.setFilter('q', v)} placeholder="Search a skill…" onReset={list.reset}>
        <Select value={list.filters.sort} onChange={(v) => list.setFilter('sort', v)} options={SORTS} all={null} ariaLabel="Sort" />
      </Filters>

      <ErrorNote onRetry={list.reload}>{list.error}</ErrorNote>

      <div className="wk-card pad-lg">
        <DataTable
          loading={list.loading}
          cols={['Skill', 'Category', 'Workers', 'Verified', 'Jobs', 'Open jobs', 'Applications', 'Hired', 'Avg expected pay', 'Demand', '']}
          empty="No skills match that search."
        >
          {list.rows.map((s) => {
            const gapNoWorkers = !s.workerCount && s.openJobCount > 0
            const gapNoJobs = s.workerCount > 0 && !s.jobCount
            return (
              <tr key={s.skill}>
                <td>
                  <span className="nm">{s.skill}</span>
                  {gapNoWorkers && <div className="sb ad-warn">Employers asking, nobody registered</div>}
                  {gapNoJobs && <div className="sb ad-zero">Workers available, no jobs asking</div>}
                </td>
                <td>{s.category || '—'}</td>
                <td className="num">{num(s.workerCount)}</td>
                <td className="num">{num(s.verifiedWorkerCount)}</td>
                <td className="num">{num(s.jobCount)}</td>
                <td className="num">{num(s.openJobCount)}</td>
                <td className="num">{num(s.applicationCount)}</td>
                <td className="num">{num(s.hiredCount)}</td>
                <td className="num">{s.avgExpectedSalary ? money(Math.round(s.avgExpectedSalary)) : '—'}</td>
                <td className="num">
                  {s.demandRatio == null ? '—' : (
                    <Badge tone={s.demandRatio >= 1 ? 'rejected' : s.demandRatio >= 0.5 ? 'pending' : 'accepted'}>
                      {Number(s.demandRatio).toFixed(2)}
                    </Badge>
                  )}
                </td>
                <td>
                  <button
                    className="mk-btn mk-btn-outline mk-btn-sm"
                    disabled={!s.workerCount}
                    onClick={() => setDrill(s.skill)}
                  >
                    Workers
                  </button>
                </td>
              </tr>
            )
          })}
        </DataTable>
        <Pager {...list.meta} onPage={list.setPage} />
      </div>

      {drill && <SkillWorkers skill={drill} onClose={() => setDrill(null)} />}
    </>
  )
}

function SkillWorkers({ skill, onClose }) {
  const list = usePagedList((params) => getSkillWorkers(skill, params), {}, { size: 20 })
  return (
    <Modal title={`Workers with “${skill}”`} onClose={onClose} wide>
      <ErrorNote onRetry={list.reload}>{list.error}</ErrorNote>
      <DataTable
        loading={list.loading}
        cols={['Name', 'Phone', 'City', 'Verified', 'Rating', 'Experience', 'Expected pay', 'Applications', 'Hired']}
        empty="No workers registered with this skill."
      >
        {list.rows.map((w) => (
          <tr key={w.id}>
            <td className="nm">{w.name}</td>
            <td><Phone number={w.phone} /></td>
            <td>{w.city || '—'}</td>
            <td>{w.verified ? <span className="ad-ok">Yes</span> : <span className="ad-zero">No</span>}</td>
            <td className="num">{w.rating ? `${Number(w.rating).toFixed(1)}★ (${num(w.ratingCount)})` : '—'}</td>
            <td className="num">{w.experienceYears != null ? `${w.experienceYears} yr` : '—'}</td>
            <td className="num">{w.expectedSalary != null ? money(w.expectedSalary) : '—'}</td>
            <td className="num">{num(w.applicationCount)}</td>
            <td className="num">{num(w.hiredCount)}</td>
          </tr>
        ))}
      </DataTable>
      <Pager {...list.meta} onPage={list.setPage} />
    </Modal>
  )
}
