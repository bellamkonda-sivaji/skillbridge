import React from 'react'
import {
  Section, SectionHead, Card, IconBox, Btn, StatBar, CtaBand,
  PageHead, useDocumentTitle,
} from '../components'
import { VALUES, ABOUT_STORY, ABOUT_FACTS, SITE } from '../content'

const PRINCIPLES = [
  { icon: 'users', tone: 'sky', title: 'Both sides matter', text: 'Workers rate employers just as employers rate workers. A platform where only one side is accountable is not a fair one.' },
  { icon: 'doc', tone: 'violet', title: 'The record belongs to the worker', text: 'Every completed shift builds a history the worker owns and can take anywhere — often their first formal proof of employment.' },
  { icon: 'lock', tone: 'green', title: 'A wage is a promise', text: 'Money is committed before work begins. Nobody should finish a day’s work and then have to chase the pay.' },
  { icon: 'globe', tone: 'teal', title: 'Language is not a feature', text: 'We build multilingual from the first screen, because asking someone to work in a language they do not read is its own barrier.' },
]

export default function About() {
  useDocumentTitle('About Us')

  return (
    <>
      <PageHead
        eyebrow="About us"
        title="Building stronger communities through local employment"
        sub={SITE.promise}
      />

      {/* ---------- Story ---------- */}
      <Section style={{ paddingTop: 8 }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          {ABOUT_STORY.map((p, i) => (
            <p key={i} className="mk-lead" style={{ marginTop: i === 0 ? 0 : 18, fontSize: i === 0 ? 19 : 16 }}>
              {p}
            </p>
          ))}
        </div>
        <StatBar stats={ABOUT_FACTS} />
      </Section>

      {/* ---------- Mission / vision / values ---------- */}
      <Section tone="soft">
        <div className="mk-grid mk-grid-3">
          {VALUES.map((v) => (
            <Card key={v.title} hover>
              <IconBox name={v.icon} tone={v.title === 'Our Values' ? 'rose' : v.title === 'Our Vision' ? 'sky' : ''} />
              <h3 className="mk-h3">{v.title}</h3>
              <p className="mk-mt-8">{v.text}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ---------- Principles ---------- */}
      <Section>
        <SectionHead
          eyebrow="What we believe"
          title="The decisions behind the product"
          sub="Four principles that shape what we build and what we refuse to build."
        />
        <div className="mk-grid mk-grid-2">
          {PRINCIPLES.map((p) => (
            <Card key={p.title} style={{ padding: 26 }}>
              <IconBox name={p.icon} tone={p.tone} />
              <h3 className="mk-h3">{p.title}</h3>
              <p className="mk-mt-8">{p.text}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ---------- Where we are ---------- */}
      <Section tone="tint">
        <div className="mk-grid mk-grid-2" style={{ alignItems: 'center', gap: 40 }}>
          <div>
            <div className="mk-eyebrow">Where we are</div>
            <h2 className="mk-h2 mk-mt-8">Starting in one city, properly</h2>
            <p className="mk-lead">
              We are based in {SITE.office}. Rather than launch thinly across the country,
              we are proving the whole employment journey in one market first — from the
              first match to the payslip.
            </p>
            <p className="mk-sub">
              Once local businesses can staff a shift reliably and workers get paid on time,
              every time, we take the same playbook to the next city.
            </p>
            <div className="mk-cta-row">
              <Btn to="/careers" size="sm">Join the team</Btn>
              <Btn to="/contact" variant="outline" size="sm">Get in touch</Btn>
            </div>
          </div>
          <Card style={{ padding: 26 }}>
            <h3 className="mk-h3">What we are building next</h3>
            <div className="mk-checks" style={{ marginTop: 16 }}>
              {[
                { title: 'Attendance and employment records', text: 'A verified record of who worked where, and for how long.' },
                { title: 'Monthly payroll and payslips', text: 'Formal pay records for staff who have never had one.' },
                { title: 'More Indian languages', text: 'Telugu, Kannada, Tamil, Malayalam and Marathi.' },
                { title: 'Android and iOS apps', text: 'Offline-tolerant, built for low-end devices.' },
              ].map((n) => (
                <div className="mk-check" key={n.title}>
                  <span className="ico"><span style={{ fontSize: 13, fontWeight: 700 }}>→</span></span>
                  <span className="txt"><strong>{n.title}</strong>{n.text}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Section>

      <CtaBand
        title="Be part of it"
        sub="Whether you are looking for work, looking to hire, or looking to build with us."
        primary={{ to: '/register', label: 'Get started' }}
        secondary={{ to: '/careers', label: 'See open roles' }}
      />
    </>
  )
}
