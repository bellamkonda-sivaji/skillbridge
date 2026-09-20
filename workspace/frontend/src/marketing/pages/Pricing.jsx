import React from 'react'
import Icon from '../icons'
import {
  Section, SectionHead, Card, IconBox, Btn, Accordion, CtaBand,
  PageHead, useDocumentTitle,
} from '../components'
import { PRICING } from '../content'

const PRICING_FAQS = [
  {
    q: 'Will SkillBridge always be free for workers?',
    a: 'Yes. Workers never pay to create a profile, apply to jobs, be hired, or receive their wages. We do not take a cut of a worker’s pay, and no fee is ever deducted from a payslip.',
  },
  {
    q: 'What do employers eventually pay for?',
    a: 'Posting your first jobs is free. As hiring volume grows, paid plans cover higher posting limits, featured placement, bulk hiring tools and detailed workforce reports. Any charge is shown before you confirm it.',
  },
  {
    q: 'Is there a commission on wages?',
    a: 'No commission is taken from the worker. Where a service fee applies to an employer for payment processing, it is shown separately on the transaction and never reduces the agreed wage.',
  },
  {
    q: 'Do I need to add money before posting a job?',
    a: 'You can create and publish a job for free. Funds are only needed at the point of confirming a hire, because the wage is committed before work begins.',
  },
  {
    q: 'Can I cancel at any time?',
    a: 'Yes. There is no lock-in. You can stop posting or close your account whenever you like, and any unused wallet balance is returned to you.',
  },
]

export default function Pricing() {
  useDocumentTitle('Pricing')

  return (
    <>
      <PageHead
        eyebrow="Pricing"
        title="Simple and transparent pricing"
        sub="No hidden charges. Choose a plan that works for you."
      />

      {/* ---------- Plans ---------- */}
      <Section style={{ paddingTop: 8 }}>
        <div className="mk-grid mk-grid-2" style={{ maxWidth: 820, margin: '0 auto' }}>
          {PRICING.map((p) => (
            <Card key={p.audience} className={`mk-price-card${p.featured ? ' featured' : ''}`}>
              {p.featured && <span className="mk-price-tag">Most popular</span>}
              <IconBox name={p.icon} tone={p.featured ? 'violet' : ''} />
              <h3 className="mk-h3">{p.audience}</h3>
              <div className="mk-price">{p.price}</div>
              <p className="mk-sub mk-mt-0">{p.note}</p>
              <ul className="mk-price-list">
                {p.features.map((f) => (
                  <li key={f}>
                    <Icon name="check" size={17} strokeWidth={2.4} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Btn to={p.to} variant={p.featured ? 'primary' : 'outline'} className="mk-btn-block">
                {p.cta}
              </Btn>
            </Card>
          ))}
        </div>

        <div className="mk-note mk-mt-32" style={{ maxWidth: 820, margin: '32px auto 0' }}>
          <strong>Workers are never charged.</strong> Any platform fee applies to businesses only,
          is shown before you confirm, and is never deducted from an agreed wage.
        </div>
      </Section>

      {/* ---------- What's included ---------- */}
      <Section tone="soft">
        <SectionHead
          eyebrow="Included for everyone"
          title="The essentials are not an upgrade"
          sub="Verification, wage protection and support come with every account, on every plan."
        />
        <div className="mk-grid mk-grid-3">
          {[
            { icon: 'shield', tone: 'green', title: 'Verification', text: 'Identity and business checks on both sides of every hire.' },
            { icon: 'lock', tone: 'amber', title: 'Wage protection', text: 'Funds committed before work starts, released when it is confirmed.' },
            { icon: 'chat', tone: 'sky', title: 'Chat & interviews', text: 'Message candidates and schedule interviews at no cost.' },
            { icon: 'doc', tone: 'violet', title: 'Records & payslips', text: 'Attendance, payment history and payslips for monthly staff.' },
            { icon: 'star', tone: 'rose', title: 'Two-way ratings', text: 'Reputation that follows both workers and employers.' },
            { icon: 'bell', tone: 'teal', title: 'Support', text: 'Help in your language, and a grievance process with real timelines.' },
          ].map((f) => (
            <Card key={f.title}>
              <IconBox name={f.icon} tone={f.tone} small size={18} />
              <h3 className="mk-h3" style={{ marginTop: 14 }}>{f.title}</h3>
              <p className="mk-mt-8">{f.text}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ---------- FAQ ---------- */}
      <Section>
        <SectionHead eyebrow="Questions" title="Pricing questions" />
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <Accordion items={PRICING_FAQS} />
        </div>
      </Section>

      <CtaBand
        title="Start free today"
        sub="No card required. Nothing to pay until you are ready to hire."
        primary={{ to: '/register', label: 'Create your account' }}
        secondary={{ to: '/contact', label: 'Talk to us' }}
      />
    </>
  )
}
