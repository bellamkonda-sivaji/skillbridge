import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../icons'
import {
  Section, Card, IconBox, Btn, PageHead, useDocumentTitle,
} from '../components'
import { SITE, CONTACT_SUBJECTS } from '../content'

const DETAILS = [
  { icon: 'mail', tone: '', k: 'Email', v: SITE.email, href: `mailto:${SITE.email}`, note: 'We reply within one working day.' },
  { icon: 'phone', tone: 'green', k: 'Phone', v: SITE.phone, href: `tel:${SITE.phone.replace(/\s/g, '')}`, note: 'Talk to us directly.' },
  { icon: 'pin', tone: 'violet', k: 'Office', v: SITE.office, note: 'Visits by appointment.' },
  { icon: 'clock', tone: 'amber', k: 'Business Hours', v: SITE.hours, note: 'Closed on public holidays.' },
]

const EMPTY = { name: '', email: '', subject: CONTACT_SUBJECTS[0], message: '' }

export default function Contact() {
  useDocumentTitle('Contact Us')
  const [form, setForm] = useState(EMPTY)
  const [sent, setSent] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  /**
   * There is no contact endpoint on the API yet, so the form composes a message
   * in the visitor's own mail client. Swap this for a POST when the endpoint lands.
   */
  const submit = (e) => {
    e.preventDefault()
    const body = `${form.message}\n\n—\nFrom: ${form.name}\nEmail: ${form.email}`
    window.location.href =
      `mailto:${SITE.email}?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(body)}`
    setSent(true)
    setForm(EMPTY)
  }

  return (
    <>
      <PageHead
        eyebrow="Contact"
        title="Get in touch"
        sub="We're here to help. Reach out to us any time."
      />

      <Section style={{ paddingTop: 8 }}>
        <div className="mk-grid mk-grid-2" style={{ gap: 32, alignItems: 'start' }}>
          {/* ---------- Details ---------- */}
          <div>
            <Card style={{ padding: 8 }}>
              {DETAILS.map((d) => (
                <div className="mk-contact-row" key={d.k} style={{ padding: '16px 14px' }}>
                  <IconBox name={d.icon} tone={d.tone} small size={18} />
                  <span>
                    <span className="k" style={{ display: 'block' }}>{d.k}</span>
                    <span className="v" style={{ display: 'block' }}>
                      {d.href ? <a href={d.href}>{d.v}</a> : d.v}
                    </span>
                    <span className="k" style={{ display: 'block', marginTop: 2 }}>{d.note}</span>
                  </span>
                </div>
              ))}
            </Card>

            <Card className="mk-mt-24">
              <IconBox name="chat" tone="sky" />
              <h3 className="mk-h3">Looking for quick answers?</h3>
              <p className="mk-mt-8">
                Most questions about accounts, applications, wages and verification are
                already answered in the Help Centre.
              </p>
              <div className="mk-cta-row">
                <Btn to="/help" variant="outline" size="sm">Visit Help Centre</Btn>
              </div>
            </Card>

            <Card className="mk-mt-24">
              <IconBox name="shield" tone="rose" />
              <h3 className="mk-h3">Reporting something serious?</h3>
              <p className="mk-mt-8">
                For unpaid wages, safety concerns or misconduct, use the subject line
                "Report a safety concern" — these are prioritised and tracked through our{' '}
                <Link to="/legal/grievance">grievance process</Link>.
              </p>
            </Card>
          </div>

          {/* ---------- Form ---------- */}
          <Card style={{ padding: 26 }}>
            <h2 className="mk-h2" style={{ fontSize: 22 }}>Send us a message</h2>
            <p className="mk-sub mk-mt-0" style={{ marginBottom: 20 }}>
              Fill this in and we will get back to you at the email you give us.
            </p>

            {sent && (
              <div className="mk-success" style={{ marginBottom: 18 }}>
                Your message is ready in your email app — press send there and it reaches us.
                If nothing opened, write to <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
              </div>
            )}

            <form onSubmit={submit}>
              <div className="mk-field">
                <label htmlFor="c-name">Name</label>
                <input id="c-name" className="mk-input" required value={form.name}
                  onChange={set('name')} placeholder="Your full name" autoComplete="name" />
              </div>
              <div className="mk-field">
                <label htmlFor="c-email">Email</label>
                <input id="c-email" className="mk-input" type="email" required value={form.email}
                  onChange={set('email')} placeholder="you@example.com" autoComplete="email" />
              </div>
              <div className="mk-field">
                <label htmlFor="c-subject">Subject</label>
                <select id="c-subject" className="mk-select" value={form.subject} onChange={set('subject')}>
                  {CONTACT_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="mk-field">
                <label htmlFor="c-message">Message</label>
                <textarea id="c-message" className="mk-textarea" required value={form.message}
                  onChange={set('message')} placeholder="How can we help?" />
              </div>
              <Btn type="submit" className="mk-btn-block" icon="arrowRight">Send Message</Btn>
              <p className="mk-sub">
                By sending this you agree to our{' '}
                <Link to="/legal/privacy">Privacy Policy</Link>.
              </p>
            </form>
          </Card>
        </div>
      </Section>

      {/* ---------- Audience shortcuts ---------- */}
      <Section tone="soft">
        <div className="mk-grid mk-grid-3">
          {[
            { icon: 'user', tone: '', t: 'I need work', d: 'Create a free worker profile and get matched to jobs near you.', to: '/worker/login', cta: 'Log in as a worker' },
            { icon: 'briefcase', tone: 'violet', t: 'I want to hire', d: 'Post a requirement and reach verified workers nearby.', to: '/employer/login', cta: 'Log in as an employer' },
            { icon: 'users', tone: 'teal', t: 'Partnership or press', d: 'Working with local bodies, training partners or media.', to: '/about', cta: 'About SkillBridge' },
          ].map((c) => (
            <Card key={c.t} hover>
              <IconBox name={c.icon} tone={c.tone} />
              <h3 className="mk-h3">{c.t}</h3>
              <p className="mk-mt-8">{c.d}</p>
              <div className="mk-cta-row">
                <Btn to={c.to} variant="outline" size="sm">{c.cta}</Btn>
              </div>
            </Card>
          ))}
        </div>
      </Section>
    </>
  )
}
