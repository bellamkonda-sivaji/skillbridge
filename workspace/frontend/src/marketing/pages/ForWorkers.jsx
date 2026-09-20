import React from 'react'
import Icon from '../icons'
import {
  Section, SectionHead, Card, IconBox, Btn, Steps, CategoryTile,
  Quote, Carousel, CtaBand, HeroCollage, useDocumentTitle,
} from '../components'
import { STEPS, CATEGORIES, TESTIMONIALS, WORKER_BENEFITS, HIGHLIGHTS } from '../content'

export default function ForWorkers() {
  useDocumentTitle('For Workers')

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="mk-hero">
        <div className="mk-container mk-hero-grid">
          <div>
            <span className="mk-pill"><span className="dot" />For Workers</span>
            <h1 className="mk-h1">Find work near you. Get paid on time.</h1>
            <p className="mk-lead">
              Build a profile once and get matched to local jobs that fit your skills,
              your area and the kind of work you want — daily, weekly or permanent.
            </p>
            <div className="mk-checks">
              {[
                'Jobs matched to your skills and area',
                'Verified employers only',
                'Apply in one tap, chat directly',
                'Payment released through SkillBridge',
                'Build a work history you can carry',
              ].map((t) => (
                <div className="mk-check" key={t}>
                  <span className="ico"><Icon name="check" size={15} strokeWidth={2.4} /></span>
                  <span className="txt">{t}</span>
                </div>
              ))}
            </div>
            <div className="mk-cta-row">
              <Btn to="/register?role=WORKER" size="lg">Create a Worker Account</Btn>
              <Btn to="/jobs" variant="outline" size="lg">Browse jobs</Btn>
            </div>
          </div>
          <HeroCollage />
        </div>
      </section>

      {/* ---------- Benefits ---------- */}
      <Section tone="soft">
        <SectionHead
          eyebrow="Why workers choose SkillBridge"
          title="Work that fits your life"
          sub="No résumé, no agent, no fee. Just work near you, with the wage agreed up front."
        />
        <div className="mk-grid mk-grid-3">
          {WORKER_BENEFITS.map((b, i) => (
            <Card key={b.title} hover>
              <IconBox
                name={['pin', 'clock', 'shield', 'wallet', 'doc', 'globe'][i]}
                tone={['', 'amber', 'green', 'violet', 'sky', 'teal'][i]}
              />
              <h3 className="mk-h3">{b.title}</h3>
              <p className="mk-mt-8">{b.text}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ---------- Steps ---------- */}
      <Section>
        <SectionHead eyebrow="Getting started" title="From sign-up to your first wage" />
        <Steps steps={STEPS.worker} />
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

      {/* ---------- What you need ---------- */}
      <Section tone="tint">
        <div className="mk-grid mk-grid-2" style={{ alignItems: 'center', gap: 40 }}>
          <div>
            <div className="mk-eyebrow">What you need</div>
            <h2 className="mk-h2 mk-mt-8">A phone number is enough to start</h2>
            <p className="mk-lead">
              You do not need a résumé or a computer. Sign up with your mobile number,
              pick your skills from a list, drop a pin on your area, and you are visible
              to every employer hiring nearby.
            </p>
            <p className="mk-sub">
              Identity verification is needed before you can be hired, and a few roles ask for
              extra documents — a driving licence for delivery work, for example. We only ask
              for what the job actually requires.
            </p>
            <div className="mk-cta-row">
              <Btn to="/safety" variant="outline" size="sm">How verification works</Btn>
            </div>
          </div>
          <Card style={{ padding: 26 }}>
            <h3 className="mk-h3">Your profile shows employers</h3>
            <div className="mk-checks" style={{ marginTop: 18 }}>
              {[
                { title: 'Skills and experience', text: 'Picked from a shared list, so employers search the same words you use.' },
                { title: 'Your area and radius', text: 'How far you are willing to travel each day.' },
                { title: 'Availability', text: 'Immediate, part time, full time, weekends or evenings.' },
                { title: 'Verified work history', text: 'Jobs completed, attendance and repeat hires.' },
                { title: 'Ratings from employers', text: 'Built from the jobs you actually finished.' },
              ].map((r) => (
                <div className="mk-check" key={r.title}>
                  <span className="ico"><Icon name="check" size={15} strokeWidth={2.4} /></span>
                  <span className="txt"><strong>{r.title}</strong>{r.text}</span>
                </div>
              ))}
            </div>
            <p className="mk-sub">
              Your past wages stay private. They are never shown to a future employer
              unless you choose to share them.
            </p>
          </Card>
        </div>
      </Section>

      {/* ---------- Categories ---------- */}
      <Section>
        <SectionHead
          eyebrow="Where the work is"
          title="Jobs across every kind of local business"
          sub="From supermarkets and kitchens to warehouses, salons and workshops."
        />
        <div className="mk-grid mk-grid-4">
          {CATEGORIES.map((c) => <CategoryTile key={c.id} cat={c} />)}
        </div>
        <div className="mk-cta-row center mk-mt-32">
          <Btn to="/categories" variant="outline">View all categories</Btn>
        </div>
      </Section>

      {/* ---------- Stories ---------- */}
      <Section tone="soft">
        <SectionHead title="Workers who found their next job here" />
        <Carousel
          items={TESTIMONIALS}
          label="Worker stories"
          render={(t) => <Quote key={t.name + t.quote} item={t} />}
        />
      </Section>

      <CtaBand
        title="Your next job is probably down the road"
        sub="Creating a worker profile is free and always will be."
        primary={{ to: '/register?role=WORKER', label: 'Create a Worker Account' }}
        secondary={{ to: '/how-it-works', label: 'See how it works' }}
      />
    </>
  )
}
