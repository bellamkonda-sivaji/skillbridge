import React from 'react'
import {
  Section, SectionHead, Card, Btn, Quote, Avatar, Stars, StatBar,
  CtaBand, PageHead, useDocumentTitle,
} from '../components'
import { TESTIMONIALS, STATS } from '../content'

const FEATURED = {
  name: 'Venkat S',
  role: 'Warehouse Helper, Tirupati',
  headline: 'From one weekend shift to a permanent job',
  body: [
    'Venkat took a single Saturday shift at a city warehouse because it was 3 km from his home and paid ₹750 for the day. He had no résumé and no references — just a profile with three skills and a pin on the map.',
    'He turned up on time for four more shifts. Each one was recorded: attendance marked, wage released, rating left by the employer. By the fifth, the warehouse manager could see a record instead of a stranger.',
    'When a permanent helper role opened two months later, they did not advertise it. They offered it to Venkat.',
  ],
}

export default function Stories() {
  useDocumentTitle('Success Stories')

  return (
    <>
      <PageHead
        eyebrow="Success stories"
        title="Real stories. Real impact."
        sub="People and businesses growing together with SkillBridge."
      />

      {/* ---------- Featured story ---------- */}
      <Section style={{ paddingTop: 8 }}>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div className="mk-grid mk-grid-2" style={{ gap: 0 }}>
            <div style={{ background: 'linear-gradient(135deg,#1d4ed8,#2563eb 60%,#4f8cff)', padding: 32, color: '#fff' }}>
              <Avatar name={FEATURED.name} size={64} />
              <h2 className="mk-h2" style={{ color: '#fff', fontSize: 26, marginTop: 20 }}>
                {FEATURED.headline}
              </h2>
              <p style={{ color: 'rgba(255,255,255,.9)', marginTop: 14, fontSize: 15 }}>
                {FEATURED.name} · {FEATURED.role}
              </p>
              <div style={{ marginTop: 16 }}><Stars rating={5} /></div>
            </div>
            <div style={{ padding: 32 }}>
              {FEATURED.body.map((p, i) => (
                <p key={i} style={{ marginBottom: 14, fontSize: 15.5 }}>{p}</p>
              ))}
              <Btn to="/register?role=WORKER" size="sm">Start your work history</Btn>
            </div>
          </div>
        </Card>
      </Section>

      {/* ---------- All stories ---------- */}
      <Section tone="soft">
        <SectionHead title="More from our community" />
        <div className="mk-grid mk-grid-3">
          {TESTIMONIALS.map((t) => <Quote key={t.name + t.quote} item={t} />)}
        </div>
      </Section>

      {/* ---------- Numbers ---------- */}
      <Section>
        <SectionHead
          eyebrow="The platform so far"
          title="Built one local job at a time"
          sub="Figures shown are our launch targets for the first year of operation."
        />
        <StatBar stats={STATS} />
      </Section>

      <CtaBand
        title="Write the next one"
        sub="Join the workers and businesses building something better, locally."
        primary={{ to: '/worker/login', label: 'I need work' }}
        secondary={{ to: '/employer/login', label: 'I want to hire' }}
      />
    </>
  )
}
