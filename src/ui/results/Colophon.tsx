/**
 * The maker's thanks: "Help keep Watched free!" and a link to the maker's Buy Me a Coffee page (src/lib/maker.ts, a
 * new tab).
 *
 * Where it is, and where it is not (owner, 2026-11-23):
 *  - Kept off the screens people screenshot and record to post (the headline, the photos, the globe, the time-lapse):
 *    an ask there would travel with every post. The one exception is <ColophonBar/> (below), and only for the people
 *    who keep searching: from a browser's third result, until they close it.
 *  - <ColophonLine/> sits at the foot of the share sheet: the people who open it have just decided the site was worth
 *    showing someone, and what they post is the card, drawn on its own, never the sheet.
 *  - <Colophon/> closes the results overview, after the caveats, for whoever reads to the end; About's credits have
 *    the same link.
 *
 * How it looks: the instrument's own parts (a 1px mark, mono caps, a hairline, the external arrow), quieter than the
 * rows around it; the arrow takes the signal colour only on hover (DESIGN §1). It is a plain link: nothing loads from
 * Buy Me a Coffee until it is pressed. The class names say nothing about donating or sponsors, which generic cosmetic
 * filters in blocker lists hide.
 */
import { useState } from 'react'
import { LOCALE_INFO } from '../../../api/_lib/i18n/locales'
import enResults from '@/i18n/en/results'
import { useLocale, useMsgs } from '@/i18n/runtime'
import { SUPPORT_URL } from '@/lib/maker'
import { Glyph, cx } from '@/ui/system'
import s from './Colophon.module.css'

/** The row that closes the results overview: the ask as its title, the link's words under it. */
export function Colophon() {
  const m = useMsgs(enResults).colophon
  return (
    <a className={s.row} href={SUPPORT_URL} target="_blank" rel="noopener">
      <Glyph name="cup" size={16} className={s.mark} />
      <span className={s.text}>
        <span className={s.title}>{m.title}</span>
        <span className={s.sub}>{m.link}</span>
      </span>
      <Glyph name="arrow-up-right" size={12} className={s.arrow} />
    </a>
  )
}

/** One quiet line: the ask, then its link (the share sheet's foot). */
export function ColophonLine({ className }: { className?: string }) {
  const m = useMsgs(enResults).colophon
  // What separates the two phrases: a space, or nothing in Chinese and Japanese.
  const gap = LOCALE_INFO[useLocale()].sentenceGap
  return (
    <p className={cx(s.line, className)}>
      <Glyph name="cup" size={14} className={s.mark} />
      <span>
        {m.title}
        {gap}
        <a className={s.lineLink} href={SUPPORT_URL} target="_blank" rel="noopener">
          {m.link}
          <Glyph name="arrow-up-right" size={10} className={s.lineArrow} />
        </a>
      </span>
    </p>
  )
}

// ── The bar: for people who keep searching ────────────────────────────────────────────────────────────────────────────

/**
 * The one ask on the results screen itself, for the people who use the site most (owner, 2026-11-23):
 *  - from a browser's third result on (places and windows; a first search's screenshots, the ones most often posted,
 *    never have it), on phones the first thing under the headline (the half-open sheet shows it), on laptops after the
 *    photos and the time-lapse row (still the first screen, never ahead of the headline);
 *  - gone for good once its × or its link is pressed, in every later visit too;
 *  - never beside the shared-link invite (one bar at a time);
 *  - decided once per place and window, when its overview first shows (Back from a pass, a partial report turning
 *    final: the same answer), so it never appears under a reader.
 * Remembered in localStorage (`watched.colophon`); where storage throws (a private window), in this tab only.
 */
const STORE_KEY = 'watched.colophon'
/** The bar shows from this result on */
const FROM_RESULT = 3

interface AskState {
  /** Overviews this browser has shown (places and windows) */
  results: number
  /** Closed, or its link pressed */
  done: boolean
}

let memory: AskState = { results: 0, done: false }
const decided = new Map<string, boolean>()

function readState(): AskState {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) {
      const v = JSON.parse(raw) as Partial<AskState>
      return { results: Number(v.results) || 0, done: !!v.done }
    }
  } catch {
    // no storage: this tab's memory
  }
  return { ...memory }
}

function writeState(next: AskState) {
  memory = next
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(next))
  } catch {
    // kept in memory only
  }
}

/** Whether the overview of `placeKey` shows the bar (decided once per key; `blocked`: another bar is up). */
export function decideBar(placeKey: string, blocked: boolean): boolean {
  const known = decided.get(placeKey)
  if (known !== undefined) return known
  const s = readState()
  s.results += 1
  writeState(s)
  const show = !blocked && !s.done && s.results >= FROM_RESULT
  decided.set(placeKey, show)
  return show
}

/** Closed or pressed: never again, here (every place this tab decided, so a remounted overview stays without it) or later. */
export function finishBar() {
  writeState({ ...readState(), done: true })
  for (const k of decided.keys()) decided.set(k, false)
}

/** Tests: forget this tab's decisions and memory. */
export function resetBarForTests() {
  decided.clear()
  memory = { results: 0, done: false }
}

export function ColophonBar({ placeKey, blocked }: { placeKey: string; blocked: boolean }) {
  const all = useMsgs(enResults)
  const m = all.colophon
  const gap = LOCALE_INFO[useLocale()].sentenceGap
  const [closed, setClosed] = useState(false)
  if (closed || !decideBar(placeKey, blocked)) return null
  return (
    <div className={s.bar}>
      <Glyph name="cup" size={16} className={s.mark} />
      <p className={s.barText}>
        {m.title}
        {gap}
        <a className={s.barLink} href={SUPPORT_URL} target="_blank" rel="noopener" onClick={finishBar}>
          {m.link}
          <Glyph name="arrow-up-right" size={10} className={s.barArrow} />
        </a>
      </p>
      <button
        type="button"
        className={s.barClose}
        onClick={() => {
          finishBar()
          setClosed(true)
        }}
        aria-label={all.invite.dismiss}
      >
        <Glyph name="close" size={12} />
      </button>
    </div>
  )
}
