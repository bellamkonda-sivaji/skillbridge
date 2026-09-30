import React from 'react'
import { Link } from 'react-router-dom'
import Icon from '../icons'
import {
  Section, SectionHead, Card, IconBox, Btn, StatBar, Steps,
  CategoryTile, Quote, Carousel, CtaBand, HeroCollage, PhoneMockups,
  StoreButtons, useDocumentTitle,
} from '../components'
import {
  SITE, STATS, CATEGORIES, STEPS, TESTIMONIALS, SAFETY, HIGHLIGHTS, APP_FEATURES,
} from '../content'
import HowItWorksFilm from '../HowItWorksFilm'

const WHY = [
  { icon: 'pin', tone: '', title: 'Work near home', text: 'Set a radius of 1–10 km and see only the jobs you can actually reach, with the distance on every card.' },
  { icon: 'shield', tone: 'green', title: 'Verified both ways', text: 'Workers and businesses are both checked, so neither side is taking a blind risk.' },
  { icon: 'clock', tone: 'amber', title: 'A day or a career', text: 'One shift, a festival week or a permanent role — all handled in the same place.' },
  { icon: 'wallet', tone: 'violet', title: 'Wages you can count on', text: 'Employers fund the job up front. Payment is released once the work is confirmed.' },
  { icon: 'doc', tone: 'sky', title: 'A work history you own', text: 'Every completed job becomes a verified record you can show the next employer.' },
  { icon: 'globe', tone: 'teal', title: 'In your language', text: 'Built multilingual from day one, not translated as an afterthought.' },
]

export default function Home() {
  useDocumentTitle(null)

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="mk-hero">
        <div className="mk-container mk-hero-grid">
          <div>
            <span className="mk-pill"><span className="dot" />{SITE.tagline}</span>
            <h1 className="mk-h1">
              Find the right <span className="accent">worker</span>.<br />
              Or the right <span className="accent">job</span>.
            </h1>
            <p className="mk-lead">
              JobOn connects local businesses with skilled and unskilled workers in real time.
              Verified profiles. Safe payments. Stronger communities.
            </p>
            <div className="mk-cta-row">
              <Btn to="/worker/login" size="lg">I need work</Btn>
              <Btn to="/employer/login" variant="outline" size="lg">I want to hire</Btn>
            </div>
            <StatBar stats={STATS} />
          </div>
          <HeroCollage />
        </div>
      </section>

      {/* ---------- The animated walkthrough ---------- */}
      <HowItWorksFilm />

      {/* ---------- How it works ---------- */}
      <Section tone="soft">
        <SectionHead
          eyebrow="How it works"
          title="Four steps from signing up to getting paid"
          sub="The same simple flow whether you are looking for a day's work or building a permanent team."
        />
        <Steps steps={STEPS.worker} />
        <div className="mk-cta-row center mk-mt-40">
          <Btn to="/how-it-works" variant="outline" icon="arrowRight">See how it works</Btn>
        </div>
      </Section>

      {/* ---------- Categories ---------- */}
      <Section>
        <SectionHead
          eyebrow="Job categories"
          title="Explore job categories"
          sub="Find opportunities across a wide range of local work."
        />
        <div className="mk-grid mk-grid-4">
          {CATEGORIES.map((c) => <CategoryTile key={c.id} cat={c} />)}
        </div>
        <div className="mk-cta-row center mk-mt-40">
          <Btn to="/categories" variant="outline">View All Categories</Btn>
        </div>
      </Section>

      {/* ---------- Why JobOn ---------- */}
      <Section tone="soft">
        <SectionHead
          eyebrow="Why JobOn"
          title="More than a job board"
          sub="We stay with the work from the first match to the final payment — and the record it leaves behind."
        />
        <div className="mk-grid mk-grid-3">
          {WHY.map((f) => (
            <Card key={f.title} hover>
              <IconBox name={f.icon} tone={f.tone} />
              <h3 className="mk-h3">{f.title}</h3>
              <p className="mk-mt-8">{f.text}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ---------- Two audiences ---------- */}
      <Section>
        <div className="mk-grid mk-grid-2">
          <Card style={{ padding: 28 }}>
            <IconBox name="user" />
            <h3 className="mk-h2" style={{ fontSize: 24 }}>Looking for work?</h3>
            <p className="mk-mt-8">
              Build a profile in minutes, get matched to jobs near your home, and get paid
              through the platform with a record of every shift you complete.
            </p>
            <div className="mk-cta-row">
              <Btn to="/for-workers" size="sm">For Workers</Btn>
              <Btn to="/jobs" variant="outline" size="sm">Browse jobs</Btn>
            </div>
          </Card>
          <Card style={{ padding: 28 }}>
            <IconBox name="briefcase" tone="violet" />
            <h3 className="mk-h2" style={{ fontSize: 24 }}>Looking to hire?</h3>
            <p className="mk-mt-8">
              Post a requirement in two minutes and get a ranked shortlist of verified workers
              nearby — for one shift or a permanent role.
            </p>
            <div className="mk-cta-row">
              <Btn to="/for-employers" size="sm">For Employers</Btn>
              <Btn to="/workers" variant="outline" size="sm">Browse workers</Btn>
            </div>
          </Card>
        </div>

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

      {/* ---------- Testimonials ---------- */}
      <Section tone="soft">
        <SectionHead
          eyebrow="Success stories"
          title="Real stories. Real impact."
          sub="People and businesses growing together with JobOn."
        />
        <Carousel
          items={TESTIMONIALS}
          label="Success stories"
          render={(t) => <Quote key={t.name + t.quote} item={t} />}
        />
        <div className="mk-cta-row center mk-mt-32">
          <Btn to="/stories" variant="outline">Read more stories</Btn>
        </div>
      </Section>

      {/* ---------- Safety ---------- */}
      <Section>
        <SectionHead
          eyebrow="Trust & safety"
          title="A safer platform for everyone"
          sub="We verify identities, businesses and payments to build trust on both sides."
        />
        <div className="mk-grid mk-grid-3">
          {SAFETY.map((s) => (
            <Card key={s.title} hover>
              <IconBox name={s.icon} tone={s.tone} />
              <h3 className="mk-h3">{s.title}</h3>
              <p className="mk-mt-8">{s.text}</p>
            </Card>
          ))}
        </div>
        <div className="mk-cta-row center mk-mt-32">
          <Btn to="/safety" variant="outline">How verification works</Btn>
        </div>
      </Section>

      {/* ---------- Mobile app ---------- */}
      <Section tone="tint">
        <div className="mk-grid mk-grid-2" style={{ alignItems: 'center', gap: 40 }}>
          <div>
            <div className="mk-eyebrow">Mobile app</div>
            <h2 className="mk-h2 mk-mt-8">Take JobOn with you</h2>
            <p className="mk-lead">
              Find jobs, manage workers and stay updated on the go.
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
              Apps are on the way. <Link to="/app">Get notified at launch</Link> — the full
              platform already works in your mobile browser.
            </p>
          </div>
          <PhoneMockups />
        </div>
      </Section>

      <CtaBand
        title="Ready to find your next job, or your next hire?"
        sub="Joining takes two minutes and costs workers nothing."
        primary={{ to: '/register?role=WORKER', label: 'Create a Worker Account' }}
        secondary={{ to: '/employer/login', label: 'Hire Workers' }}
      />
    </>
  )
}
