import React, { useState } from 'react'
import Icon from '../icons'
import {
  Section, SectionHead, Card, IconBox, Btn, Steps, Quote, Carousel,
  CtaBand, PageHead, useDocumentTitle,
} from '../components'
import { STEPS, TESTIMONIALS, FAQS } from '../content'
import { Accordion } from '../components'

const FLOWS = [
  {
    icon: 'clock',
    tone: 'amber',
    title: 'Short-term & shift work',
    lead: 'For when you need people today, tomorrow or for the weekend.',
    chain: ['Post', 'Match', 'Confirm', 'Work', 'Attendance', 'Payment', 'Rating'],
    text: 'No interview round unless you want one. We find available, nearby workers fast, confirm them, record attendance on the day and release the wage when the shift is done.',
  },
  {
    icon: 'briefcase',
    tone: 'violet',
    title: 'Long-term employment',
    lead: 'For permanent roles where the fit matters more than the speed.',
    chain: ['Post', 'Apply', 'Shortlist', 'Interview', 'Offer', 'Joining', 'Payroll'],
    text: 'A full hiring flow with shortlisting, interviews, document verification and a joining date — then monthly attendance, payroll and payslips once the person starts.',
  },
]

function Chain({ items }) {
  return (
    <div className="mk-chips" style={{ marginTop: 18 }}>
      {items.map((c, i) => (
        <React.Fragment key={c}>
          <span className="mk-tag blue">{c}</span>
          {i < items.length - 1 && (
            <span style={{ color: '#94a3b8', alignSelf: 'center' }}><Icon name="chevronRight" size={13} /></span>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

export default function HowItWorks() {
  useDocumentTitle('How It Works')
  const [tab, setTab] = useState('worker')
  const isWorker = tab === 'worker'

  return (
    <>
      <PageHead
        eyebrow="How it works"
        title="How SkillBridge works"
        sub="Simple. Transparent. Built for local work."
      >
        <div className="mk-cta-row center" style={{ marginTop: 28 }}>
          <div className="mk-tabs" role="tablist" aria-label="Audience">
            <button
              className="mk-tab" role="tab" aria-selected={isWorker}
              onClick={() => setTab('worker')}
            >
              For Workers
            </button>
            <button
              className="mk-tab" role="tab" aria-selected={!isWorker}
              onClick={() => setTab('employer')}
            >
              For Employers
            </button>
          </div>
        </div>
      </PageHead>

      <Section style={{ paddingTop: 8 }}>
        <Steps steps={isWorker ? STEPS.worker : STEPS.employer} />
        <div className="mk-cta-row center mk-mt-40">
          <Btn to={isWorker ? '/worker/login' : '/employer/login'} size="lg">
            {isWorker ? 'Get Started as a Worker' : 'Post Your First Job'}
          </Btn>
        </div>
      </Section>

      {/* ---------- Two employment modes ---------- */}
      <Section tone="soft">
        <SectionHead
          eyebrow="Two ways to hire"
          title="A day's work and a career need different journeys"
          sub="SkillBridge runs both, so a business can staff a busy Saturday and fill a permanent vacancy in the same place."
        />
        <div className="mk-grid mk-grid-2">
          {FLOWS.map((f) => (
            <Card key={f.title} style={{ padding: 26 }}>
              <IconBox name={f.icon} tone={f.tone} />
              <h3 className="mk-h3">{f.title}</h3>
              <p className="mk-sub" style={{ marginTop: 6 }}>{f.lead}</p>
              <Chain items={f.chain} />
              <p className="mk-mt-16">{f.text}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ---------- Matching explainer ---------- */}
      <Section>
        <SectionHead
          eyebrow="Matching"
          title="Why you see the jobs you see"
          sub="Every job is scored against every nearby worker, so neither side wades through listings that were never going to fit."
        />
        <div className="mk-grid mk-grid-3">
          {[
            { icon: 'pin', title: 'Distance', text: 'How far the workplace is from the worker’s saved location, against the radius they chose.' },
            { icon: 'sparkles', title: 'Skills', text: 'The skills the job needs against the skills on the profile, including common local variations of the same trade.' },
            { icon: 'clock', title: 'Availability', text: 'Whether the worker is free for that shape of work — a single shift, weekends, or full time.' },
            { icon: 'rupee', title: 'Pay expectation', text: 'The offered wage against what the worker expects, normalised across daily, weekly and monthly rates.' },
            { icon: 'star', title: 'Ratings', text: 'Feedback from both sides of previous jobs — on work done, and on wages paid.' },
            { icon: 'checkCircle', title: 'Verified history', text: 'Completed jobs, attendance record and repeat hires on the platform.' },
          ].map((m) => (
            <Card key={m.title} hover>
              <IconBox name={m.icon} small size={18} />
              <h3 className="mk-h3" style={{ marginTop: 14 }}>{m.title}</h3>
              <p className="mk-mt-8">{m.text}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ---------- Testimonials ---------- */}
      <Section tone="soft">
        <SectionHead title="What people say" />
        <Carousel
          items={TESTIMONIALS}
          label="Testimonials"
          render={(t) => <Quote key={t.name + t.quote} item={t} />}
        />
      </Section>

      {/* ---------- FAQ ---------- */}
      <Section>
        <SectionHead eyebrow="Questions" title="Common questions" />
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <Accordion items={FAQS.slice(0, 5)} />
          <div className="mk-cta-row center mk-mt-24">
            <Btn to="/help" variant="outline">Visit the Help Centre</Btn>
          </div>
        </div>
      </Section>

      <CtaBand
        title="Start in under two minutes"
        sub="Free for workers, free to post your first jobs."
        primary={{ to: '/register', label: 'Create your account' }}
        secondary={{ to: '/pricing', label: 'See pricing' }}
      />
    </>
  )
}
