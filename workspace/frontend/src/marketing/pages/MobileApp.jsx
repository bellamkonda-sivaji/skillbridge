import React, { useState } from 'react'
import Icon from '../icons'
import {
  Section, SectionHead, Card, IconBox, Btn, StoreButtons, PhoneMockups,
  CtaBand, useDocumentTitle,
} from '../components'
import { APP_FEATURES } from '../content'

export default function MobileApp() {
  useDocumentTitle('Mobile App')
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    // Launch notifications are not wired to a backend yet — see NOTE in the README.
    setDone(true)
    setEmail('')
  }

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="mk-hero">
        <div className="mk-container mk-hero-grid">
          <div>
            <span className="mk-pill"><span className="dot" />Coming soon</span>
            <h1 className="mk-h1">Take JobOn with you</h1>
            <p className="mk-lead">
              Find jobs, manage workers and stay updated on the go. Built for the phone
              first, because that is where local hiring actually happens.
            </p>
            <div className="mk-checks">
              {APP_FEATURES.map((f) => (
                <div className="mk-check" key={f}>
                  <span className="ico"><Icon name="check" size={15} strokeWidth={2.4} /></span>
                  <span className="txt">{f}</span>
                </div>
              ))}
            </div>
            <StoreButtons />
            <p className="mk-sub">
              The apps are in development. Everything below already works today in your
              mobile browser — no download needed.
            </p>
          </div>
          <PhoneMockups />
        </div>
      </section>

      {/* ---------- What you can do ---------- */}
      <Section>
        <SectionHead
          eyebrow="On your phone"
          title="The whole job, in your pocket"
          sub="From the first alert to the payment receipt, without opening a laptop."
        />
        <div className="mk-grid mk-grid-3">
          {[
            { icon: 'bell', tone: '', title: 'Real-time job alerts', text: 'Get told the moment a matching job is posted near you — not hours later.' },
            { icon: 'chat', tone: 'sky', title: 'Chat on the go', text: 'Message the employer, agree the details and confirm when to start.' },
            { icon: 'calendar', tone: 'violet', title: 'Attendance check-in', text: 'Mark your shift start and end from the workplace, with the record saved.' },
            { icon: 'wallet', tone: 'green', title: 'Earnings & receipts', text: 'See what you earned, what is pending and what has been paid out.' },
            { icon: 'globe', tone: 'teal', title: 'Your language', text: 'Switch language any time — the whole app follows, not just the menus.' },
            { icon: 'doc', tone: 'amber', title: 'Payslips', text: 'Monthly staff get a proper digital payslip they can download and keep.' },
          ].map((f) => (
            <Card key={f.title} hover>
              <IconBox name={f.icon} tone={f.tone} />
              <h3 className="mk-h3">{f.title}</h3>
              <p className="mk-mt-8">{f.text}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ---------- Notify me ---------- */}
      <Section tone="soft">
        <Card style={{ padding: 32, maxWidth: 560, margin: '0 auto' }}>
          <IconBox name="phone" />
          <h2 className="mk-h2" style={{ fontSize: 24 }}>Get notified at launch</h2>
          <p className="mk-mt-8">
            Leave your email and we will tell you the day the Android and iOS apps go live.
            No other mail, ever.
          </p>
          {done ? (
            <div className="mk-success mk-mt-16">
              Thanks — you are on the list. We will be in touch at launch.
            </div>
          ) : (
            <form onSubmit={submit} className="mk-mt-16">
              <div className="mk-field">
                <label htmlFor="notify-email">Email address</label>
                <input
                  id="notify-email"
                  className="mk-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <Btn type="submit" className="mk-btn-block">Notify me</Btn>
            </form>
          )}
          <p className="mk-sub">
            Prefer to start now? The full platform runs in your mobile browser today.
          </p>
          <div className="mk-cta-row">
            <Btn to="/register" variant="outline" size="sm">Create an account</Btn>
          </div>
        </Card>
      </Section>

      <CtaBand
        title="No app needed to get started"
        sub="JobOn works in any mobile browser, right now."
        primary={{ to: '/worker/login', label: 'I need work' }}
        secondary={{ to: '/employer/login', label: 'I want to hire' }}
      />
    </>
  )
}
