import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Icon from '../marketing/icons'
import { listenOnce, listeningSupported, jobSpeech } from './voice'
import { SpeakButton, useSimple } from './SimpleMode'

/**
 * The work a person can look for, as a picture first.
 *
 * Icon and colour do the identifying; the word underneath confirms it for
 * anyone who can read. Somebody who cannot read still recognises the chicken,
 * the car and the broom — that is the whole point of this screen.
 */
export const WORK_TILES = [
  { value: 'RETAIL',     icon: 'store',     tone: 'rose',   key: 'RETAIL' },
  { value: 'KITCHEN',    icon: 'cup',       tone: 'amber',  key: 'KITCHEN' },
  { value: 'DELIVERY',   icon: 'truck',     tone: 'violet', key: 'DELIVERY' },
  { value: 'DRIVER',     icon: 'car',       tone: 'sky',    key: 'DRIVER' },
  { value: 'CLEANING',   icon: 'broom',     tone: 'green',  key: 'CLEANING' },
  { value: 'WAREHOUSE',  icon: 'box',       tone: 'slate',  key: 'WAREHOUSE' },
  { value: 'CONSTRUCTION', icon: 'hammer',  tone: 'orange', key: 'CONSTRUCTION' },
  { value: 'SECURITY',   icon: 'shield',    tone: 'sky',    key: 'SECURITY' },
  { value: 'SALON',      icon: 'scissors',  tone: 'pink',   key: 'SALON' },
  { value: 'MEDICAL',    icon: 'cross',     tone: 'sky',    key: 'MEDICAL' },
  { value: 'RESTAURANT', icon: 'cup',       tone: 'orange', key: 'RESTAURANT' },
  { value: 'OTHER',      icon: 'grid',      tone: 'slate',  key: 'OTHER' },
]

export function WorkTiles({ selected = [], onToggle, single }) {
  const { t } = useTranslation()
  return (
    <div className="sb-tiles">
      {WORK_TILES.map((w) => {
        const on = single ? selected === w.value : selected.includes(w.value)
        const label = t(`opt.category.${w.key}`, w.value)
        return (
          <button
            key={w.value}
            type="button"
            className={`sb-tile ${w.tone}${on ? ' on' : ''}`}
            aria-pressed={on}
            onClick={() => onToggle(w.value)}
          >
            <span className="ic" aria-hidden="true"><Icon name={w.icon} size={30} /></span>
            <span className="lbl">{label}</span>
            {on && <span className="tick" aria-hidden="true"><Icon name="check" size={14} /></span>}
          </button>
        )
      })}
    </div>
  )
}

/**
 * A job as a worker needs to read it: the money, big, first. Then how far away,
 * then when. The employer's name is small — it matters less than whether the
 * person can afford the bus fare to get there.
 */
export function BigJobCard({ job, onApply, applying, onOpen }) {
  const { t } = useTranslation()
  const { simple } = useSimple()
  const tile = tileForJob(job)
  const unit = t(`a11y.per.${job.salaryUnit}`, PER_FALLBACK[job.salaryUnit] || '')

  return (
    <div className="sb-job" onClick={onOpen} role={onOpen ? 'button' : undefined} tabIndex={onOpen ? 0 : undefined}
      onKeyDown={onOpen ? (e) => { if (e.key === 'Enter') onOpen() } : undefined}>
      <div className="head">
        <span className={`ic ${tile.tone}`} aria-hidden="true"><Icon name={tile.icon} size={simple ? 34 : 26} /></span>
        <div className="grow">
          <div className="pay">₹{Number(job.salary || 0).toLocaleString('en-IN')}<span className="per">{unit}</span></div>
          <div className="ttl">{job.title}</div>
        </div>
        <SpeakButton text={jobSpeech(job, t)} label={t('a11y.listen', 'Listen')} size={20} />
      </div>

      <div className="facts">
        {job.distanceKm != null && (
          <span className="fact"><Icon name="pin" size={15} />{Number(job.distanceKm).toFixed(1)} km</span>
        )}
        {(job.area || job.city) && (
          <span className="fact"><Icon name="store" size={15} />{[job.area, job.city].filter(Boolean).join(', ')}</span>
        )}
        {job.engagementModel && (
          <span className="fact"><Icon name="clock" size={15} />{t(`opt.duration.${job.engagementModel}`, DURATION_WORD[job.engagementModel] || '')}</span>
        )}
      </div>

      {onApply && (
        <button
          className="sb-apply"
          disabled={applying === job.id || job.applied}
          onClick={(e) => { e.stopPropagation(); onApply(job) }}
        >
          {job.applied
            ? <><Icon name="check" size={20} /> {t('a11y.applied', 'Applied')}</>
            : applying === job.id
              ? t('a11y.applying', 'Sending…')
              : <><Icon name="checkCircle" size={20} /> {t('a11y.wantThis', 'I want this work')}</>}
        </button>
      )}
    </div>
  )
}

const DURATION_WORD = {
  ONE_DAY: '1 day', FEW_DAYS: 'A few days', FEW_WEEKS: 'A few weeks',
  MONTHS: 'Months', PERMANENT: 'Regular work',
}

const PER_FALLBACK = {
  HOURLY: '/hr', PER_SHIFT: '/shift', DAILY: '/day', PER_WEEK: '/week', MONTHLY: '/month',
}

/**
 * Which picture to put on a job.
 *
 * The job search does not carry a category, and plenty of real postings will
 * never have one set, so the icon is inferred from the words the employer
 * actually wrote. Order matters: the first match wins, so the more specific
 * trades are listed before the general ones.
 */
const KEYWORDS = [
  ['DRIVER',       /\b(driver|driving|auto|lorry|truck|tempo|cab|taxi)\b/i],
  ['DELIVERY',     /\b(delivery|courier|parcel|deliver)\b/i],
  ['CONSTRUCTION', /\b(mestri|mistri|mason|carpenter|carpentry|plumber|plumbing|electrician|wiring|welder|welding|painter|painting|construction|site|tiling|fitter|fabricat)/i],
  ['KITCHEN',      /\b(cook\w*|kitchen|chef|tandoor|biryani|cater\w*)\b/i],
  ['RESTAURANT',   /\b(waiter|server|hotel|restaurant|cafe|dhaba|steward)\b/i],
  ['CLEANING',     /\b(clean\w*|housekeep\w*|sweep\w*|maid|wash\w*|laundry|dish\w*)\b/i],
  ['SECURITY',     /\b(security|guard\w*|watchman|bouncer)\b/i],
  ['SALON',        /\b(salon|beauty|barber|hair|parlour|parlor|spa)\b/i],
  ['MEDICAL',      /\b(medical|pharmac|chemist|clinic|hospital|nurse)\b/i],
  ['WAREHOUSE',    /\b(warehouse|godown|load\w*|unload\w*|pack\w*|stock\w*|inventory|helper)\b/i],
  ['RETAIL',       /\b(shop|store|retail|supermarket|kirana|cashier|billing|counter|sales|shelf)\b/i],
]

export function tileForJob(job) {
  const byValue = WORK_TILES.find((w) => w.value === (job.category || job.workerCategory))
  if (byValue) return byValue
  const hay = [job.title, job.businessName, ...(job.requiredSkills || [])].filter(Boolean).join(' ')
  for (const [value, re] of KEYWORDS) {
    if (re.test(hay)) return WORK_TILES.find((w) => w.value === value) || WORK_TILES[WORK_TILES.length - 1]
  }
  return WORK_TILES[WORK_TILES.length - 1]
}

/**
 * Search you can talk to.
 *
 * The microphone is the primary control here, not a nicety: typing a job title
 * is the single hardest thing we ask of someone who cannot spell it.
 */
export function VoiceSearch({ value, onChange, placeholder }) {
  const { t, i18n } = useTranslation()
  const [listening, setListening] = useState(false)
  const [partial, setPartial] = useState('')
  const [error, setError] = useState('')

  const listen = async () => {
    setError(''); setPartial(''); setListening(true)
    try {
      const said = await listenOnce(i18n.language, { onPartial: setPartial })
      if (said) onChange(said)
    } catch (e) {
      setError(e.message)
    } finally {
      setListening(false); setPartial('')
    }
  }

  return (
    <div className="sb-search-wrap">
      <div className={`sb-search${listening ? ' listening' : ''}`}>
        <Icon name="search" size={18} />
        <input
          value={listening ? partial : value}
          placeholder={listening ? t('a11y.listening', 'Listening…') : placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
        {value && !listening && (
          <button className="x" onClick={() => onChange('')} aria-label={t('a11y.clear', 'Clear')}>
            <Icon name="close" size={16} />
          </button>
        )}
        {listeningSupported() && (
          <button
            className={`mic${listening ? ' on' : ''}`}
            onClick={listen}
            aria-label={t('a11y.speak', 'Speak to search')}
            title={t('a11y.speak', 'Speak to search')}
          >
            <Icon name="phone" size={18} />
          </button>
        )}
      </div>
      {error && <p className="sb-search-err">{error}</p>}
      {listening && <p className="sb-search-hint">{t('a11y.sayJob', 'Say the work you want — for example, “driver” or “cleaning”.')}</p>}
    </div>
  )
}

/** A big, unmissable call button — the action that actually closes deals here. */
export function CallButton({ phone, label, className = '' }) {
  const { t } = useTranslation()
  if (!phone) return null
  return (
    <a className={`sb-call ${className}`} href={`tel:+91${phone}`}>
      <Icon name="phone" size={20} />
      <span>{label || t('a11y.call', 'Call')}</span>
    </a>
  )
}
