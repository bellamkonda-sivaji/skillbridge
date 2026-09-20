import React from 'react'
import Icon from '../icons'
import {
  Section, SectionHead, Card, IconBox, Btn, CtaBand, PageHead, useDocumentTitle,
} from '../components'
import { PERKS, OPEN_ROLES, SITE } from '../content'

export default function Careers() {
  useDocumentTitle('Careers')

  return (
    <>
      <PageHead
        eyebrow="Careers"
        title="Join our team"
        sub="Help us create opportunities and change lives — one local job at a time."
      >
        <div className="mk-cta-row center" style={{ marginTop: 26 }}>
          <Btn href="#roles" size="lg">View Open Positions</Btn>
        </div>
      </PageHead>

      {/* ---------- Perks ---------- */}
      <Section style={{ paddingTop: 8 }}>
        <div className="mk-grid mk-grid-4">
          {PERKS.map((p, i) => (
            <Card key={p.title} hover>
              <IconBox name={p.icon} tone={['rose', 'amber', 'violet', 'teal'][i]} />
              <h3 className="mk-h3">{p.title}</h3>
              <p className="mk-mt-8">{p.text}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ---------- Why here ---------- */}
      <Section tone="soft">
        <div className="mk-grid mk-grid-2" style={{ alignItems: 'center', gap: 40 }}>
          <div>
            <div className="mk-eyebrow">Why SkillBridge</div>
            <h2 className="mk-h2 mk-mt-8">Software for people software usually ignores</h2>
            <p className="mk-lead">
              The people who stock our shelves, cook our food and run our shops have been served
              by notice boards and word of mouth. Building for them means designing for low-end
              phones, patchy networks, seven languages and users who may be opening their first app.
            </p>
            <p className="mk-sub">
              It is harder than building another dashboard. It is also the reason the work matters.
            </p>
          </div>
          <Card style={{ padding: 26 }}>
            <h3 className="mk-h3">How we work</h3>
            <div className="mk-checks" style={{ marginTop: 16 }}>
              {[
                { title: 'Small teams, real ownership', text: 'You will own a surface end to end, not a ticket queue.' },
                { title: 'Ship and learn', text: 'We put things in front of real workers and employers early.' },
                { title: 'Field first', text: 'Everyone spends time with the shops and workers we build for.' },
                { title: 'Outcomes over hours', text: 'Flexible working, with the trust that comes with it.' },
              ].map((r) => (
                <div className="mk-check" key={r.title}>
                  <span className="ico"><Icon name="check" size={15} strokeWidth={2.4} /></span>
                  <span className="txt"><strong>{r.title}</strong>{r.text}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Section>

      {/* ---------- Open roles ---------- */}
      <Section id="roles">
        <SectionHead
          eyebrow="Open positions"
          title="Roles we are hiring for"
          sub={`Most roles are based in ${SITE.office}, with remote options across India.`}
        />
        <div className="mk-list" style={{ maxWidth: 820, margin: '0 auto' }}>
          {OPEN_ROLES.map((r) => (
            <a
              className="mk-list-row"
              key={r.title}
              href={`mailto:${SITE.email}?subject=${encodeURIComponent('Application: ' + r.title)}`}
            >
              <span>
                <span className="t">{r.title}</span>
                <span className="d">{r.team} · {r.location} · {r.type}</span>
              </span>
              <span className="arrow"><Icon name="arrowRight" size={18} /></span>
            </a>
          ))}
        </div>
        <p className="mk-sub mk-center mk-mt-24">
          Do not see your role? Write to us at{' '}
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a> — we read every message.
        </p>
      </Section>

      {/* ---------- Process ---------- */}
      <Section tone="tint">
        <SectionHead
          eyebrow="Hiring process"
          title="What to expect"
          sub="Four steps, usually inside two weeks. We tell you where you stand at every stage."
        />
        <div className="mk-steps">
          {[
            { icon: 'mail', title: 'Apply', text: 'Send us your CV or a link to your work with a short note.' },
            { icon: 'chat', title: 'Intro call', text: 'A 30-minute conversation about the role and what you want next.' },
            { icon: 'briefcase', title: 'Practical round', text: 'A real problem from our product, discussed live. No trick puzzles.' },
            { icon: 'checkCircle', title: 'Offer', text: 'Team conversation, references, and a written offer with clear terms.' },
          ].map((s, i) => (
            <div className="mk-step" key={s.title}>
              <div className="mk-step-num">{i + 1}</div>
              <div className="mk-step-ico"><Icon name={s.icon} size={20} /></div>
              <h3 className="mk-h3">{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <CtaBand
        title="Build brighter lives with us"
        sub="If the mission resonates, we would like to hear from you."
        primary={{ to: '/contact', label: 'Get in touch' }}
        secondary={{ to: '/about', label: 'About SkillBridge' }}
      />
    </>
  )
}
