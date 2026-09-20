import React from 'react'
import Icon from '../icons'
import {
  Section, SectionHead, Card, IconBox, Btn, Steps, CategoryTile,
  Quote, Carousel, CtaBand, useDocumentTitle,
} from '../components'
import { STEPS, CATEGORIES, TESTIMONIALS, EMPLOYER_BENEFITS, HIGHLIGHTS } from '../content'

/** A miniature of the job-posting form, used as the hero visual. */
function PostPreview() {
  return (
    <Card style={{ padding: 22, boxShadow: '0 20px 48px rgba(15,23,42,.12)' }}>
      <div className="mk-eyebrow">New requirement</div>
      <h3 className="mk-h3" style={{ marginTop: 10 }}>Need 3 supermarket helpers tomorrow</h3>
      <div className="mk-job-meta">
        <span><Icon name="rupee" size={15} />₹800/day</span>
        <span><Icon name="clock" size={15} />9 AM – 7 PM</span>
        <span><Icon name="pin" size={15} />2.3 km away</span>
        <span><Icon name="users" size={15} />3 positions</span>
      </div>
      <div className="mk-chips" style={{ marginTop: 14 }}>
        <span className="mk-tag blue">Telugu required</span>
        <span className="mk-tag">Experience optional</span>
        <span className="mk-tag urgent">Urgent</span>
      </div>
      <hr className="mk-divider" style={{ margin: '18px 0' }} />
      <div className="mk-eyebrow">Matched workers</div>
      <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
        {[['Ramesh K', '96% match · 1.2 km'], ['Lakshmi D', '91% match · 2.0 km'], ['Venkat S', '88% match · 3.4 km']].map(([n, m]) => (
          <div className="mk-mini-card" key={n} style={{ boxShadow: 'none' }}>
            <span className="mk-icon-box sm" style={{ width: 32, height: 32 }}><Icon name="user" size={16} /></span>
            <span className="meta">
              <span className="name" style={{ display: 'block' }}>{n}</span>
              <span className="role">{m}</span>
            </span>
            <span className="mk-tag blue">Verified</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default function ForEmployers() {
  useDocumentTitle('For Employers')

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="mk-hero">
        <div className="mk-container mk-hero-grid">
          <div>
            <span className="mk-pill"><span className="dot" />For Business</span>
            <h1 className="mk-h1">Hire local talent. Grow faster.</h1>
            <p className="mk-lead">
              Post jobs, find verified workers and manage everything in one place —
              whether you need someone for one shift or a permanent team member.
            </p>
            <div className="mk-checks">
              {[
                'Reach workers in your neighbourhood',
                'Verified profiles and documents',
                'Chat and schedule interviews',
                'Manage attendance and payments',
                'Build a workforce you can rehire',
              ].map((t) => (
                <div className="mk-check" key={t}>
                  <span className="ico"><Icon name="check" size={15} strokeWidth={2.4} /></span>
                  <span className="txt">{t}</span>
                </div>
              ))}
            </div>
            <div className="mk-cta-row">
              <Btn to="/employer/login" size="lg">Post a Job</Btn>
              <Btn to="/workers" variant="outline" size="lg">Browse workers</Btn>
            </div>
          </div>
          <PostPreview />
        </div>
      </section>

      {/* ---------- Benefits ---------- */}
      <Section tone="soft">
        <SectionHead
          eyebrow="Why businesses choose SkillBridge"
          title="Staff your shop without the guesswork"
          sub="Stop relying on notice boards and word of mouth. See who is available nearby, right now."
        />
        <div className="mk-grid mk-grid-3">
          {EMPLOYER_BENEFITS.map((b, i) => (
            <Card key={b.title} hover>
              <IconBox
                name={['pin', 'shield', 'chat', 'wallet', 'clock', 'users'][i]}
                tone={['', 'green', 'sky', 'violet', 'amber', 'teal'][i]}
              />
              <h3 className="mk-h3">{b.title}</h3>
              <p className="mk-mt-8">{b.text}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ---------- Steps ---------- */}
      <Section>
        <SectionHead eyebrow="How hiring works" title="From requirement to first day" />
        <Steps steps={STEPS.employer} />
        <div className="mk-badge-row">
          {HIGHLIGHTS.map((h) => (
            <div className="mk-badge-item" key={h.title}>
              <IconBox name={h.icon} tone={h.tone} small size={18} />
              <span>
                <span className="t" style={{ display: 'block' }}>{h.title}</span>
                <span className="d">{h.text}</span>
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------- Posting is simple ---------- */}
      <Section tone="tint">
        <div className="mk-grid mk-grid-2" style={{ alignItems: 'center', gap: 40 }}>
          <div>
            <div className="mk-eyebrow">Posting a job</div>
            <h2 className="mk-h2 mk-mt-8">Two minutes, not two pages</h2>
            <p className="mk-lead">
              Pick who you need, say how many and for how long, set the wage, and publish.
              No job description to write, no recruitment jargon.
            </p>
            <div className="mk-checks">
              {[
                { title: 'Who you need', text: 'Cashier, helper, cook, cleaner, driver — choose from 50+ local roles.' },
                { title: 'How long', text: 'One shift, a few days, a week, a month or permanent.' },
                { title: 'What it pays', text: 'Daily, weekly or monthly wage, shown clearly to every applicant.' },
                { title: 'Where and when', text: 'Your shop location and working hours, with the distance shown to workers.' },
                { title: 'Whether you want an interview', text: 'Direct hire, a phone call, a visit or a quick skill check.' },
              ].map((r) => (
                <div className="mk-check" key={r.title}>
                  <span className="ico"><Icon name="check" size={15} strokeWidth={2.4} /></span>
                  <span className="txt"><strong>{r.title}</strong>{r.text}</span>
                </div>
              ))}
            </div>
          </div>
          <Card style={{ padding: 26 }}>
            <IconBox name="lock" tone="green" />
            <h3 className="mk-h3">Payments that protect both sides</h3>
            <p className="mk-mt-8">
              You fund the job before the work starts, so the wage is committed. The money is
              only released to the worker once attendance and completion are confirmed.
            </p>
            <p className="mk-mt-16">
              Every transaction is recorded with a reference, and monthly staff get a proper
              payslip — often the first formal pay record they have ever had.
            </p>
            <div className="mk-cta-row">
              <Btn to="/legal/payments" variant="outline" size="sm">Read the payment terms</Btn>
            </div>
          </Card>
        </div>
      </Section>

      {/* ---------- Categories ---------- */}
      <Section>
        <SectionHead
          eyebrow="Who you can hire"
          title="Workers across 50+ local categories"
        />
        <div className="mk-grid mk-grid-4">
          {CATEGORIES.map((c) => <CategoryTile key={c.id} cat={c} to="/workers" />)}
        </div>
        <div className="mk-cta-row center mk-mt-32">
          <Btn to="/categories" variant="outline">View all categories</Btn>
        </div>
      </Section>

      {/* ---------- Stories ---------- */}
      <Section tone="soft">
        <SectionHead title="Businesses hiring on SkillBridge" />
        <Carousel
          items={TESTIMONIALS}
          label="Employer stories"
          render={(t) => <Quote key={t.name + t.quote} item={t} />}
        />
      </Section>

      <CtaBand
        title="Post your first job free"
        sub="Reach verified workers near your business today."
        primary={{ to: '/register?role=EMPLOYER', label: 'Create an Employer Account' }}
        secondary={{ to: '/pricing', label: 'See pricing' }}
      />
    </>
  )
}
