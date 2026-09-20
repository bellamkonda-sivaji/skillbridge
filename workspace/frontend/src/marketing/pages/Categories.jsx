import React, { useMemo, useState } from 'react'
import Icon from '../icons'
import {
  Section, SectionHead, Card, IconBox, Btn, CategoryTile, CtaBand,
  PageHead, useDocumentTitle,
} from '../components'
import { CATEGORIES, MORE_CATEGORIES } from '../content'

const ALL = [...CATEGORIES, ...MORE_CATEGORIES]

export default function Categories() {
  useDocumentTitle('Job Categories')
  const [q, setQ] = useState('')

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return ALL
    return ALL.filter(
      (c) => c.name.toLowerCase().includes(term) || (c.roles || '').toLowerCase().includes(term)
    )
  }, [q])

  return (
    <>
      <PageHead
        eyebrow="Categories"
        title="Explore job categories"
        sub="Find opportunities across a wide range of local work — from a single shift to a permanent role."
      >
        <div style={{ maxWidth: 480, margin: '26px auto 0' }}>
          <div className="mk-search">
            <Icon name="search" size={18} style={{ color: '#64748b', flexShrink: 0 }} />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search a role — cashier, cook, driver…"
              aria-label="Search job categories"
            />
          </div>
        </div>
      </PageHead>

      <Section style={{ paddingTop: 8 }}>
        {results.length > 0 ? (
          <>
            <p className="mk-sub mk-center" style={{ marginBottom: 24 }}>
              {results.length} {results.length === 1 ? 'category' : 'categories'}
              {q ? ` matching “${q}”` : ' across local business'}
            </p>
            <div className="mk-grid mk-grid-3">
              {results.map((c) => <CategoryTile key={c.id} cat={c} />)}
            </div>
          </>
        ) : (
          <Card className="mk-center" style={{ padding: 40, maxWidth: 480, margin: '0 auto' }}>
            <IconBox name="search" tone="slate" size={20} />
            <h3 className="mk-h3">No category matches “{q}”</h3>
            <p className="mk-mt-8">
              We add categories as new kinds of local business join. Tell us what you are
              looking for and we will add it.
            </p>
            <div className="mk-cta-row center">
              <Btn to="/contact" variant="outline" size="sm">Suggest a category</Btn>
            </div>
          </Card>
        )}
      </Section>

      {/* ---------- Note on how categories work ---------- */}
      <Section tone="soft">
        <div className="mk-grid mk-grid-3">
          {[
            { icon: 'sparkles', tone: 'violet', title: 'Pick from a shared list', text: 'Workers and employers choose from the same vocabulary, so a “store helper” finds a “store helper” job.' },
            { icon: 'globe', tone: 'teal', title: 'Shown in your language', text: 'Category names are translated, while the underlying job data stays structured and searchable.' },
            { icon: 'trending', tone: 'amber', title: 'Growing with demand', text: 'New categories are added as businesses ask for them, city by city.' },
          ].map((n) => (
            <Card key={n.title}>
              <IconBox name={n.icon} tone={n.tone} />
              <h3 className="mk-h3">{n.title}</h3>
              <p className="mk-mt-8">{n.text}</p>
            </Card>
          ))}
        </div>
      </Section>

      <CtaBand
        title="Find work — or find workers — in your category"
        primary={{ to: '/worker/login', label: 'I need work' }}
        secondary={{ to: '/employer/login', label: 'I want to hire' }}
      />
    </>
  )
}
