/**
 * <Colophon/>: the row that closes the results overview, after the caveats: help keep Watched free (the maker's Buy Me
 * a Coffee page, in a new tab). The copy is in the maker's own voice, short and plain: a person asking, not a banner.
 *
 * Why it sits here and looks like this:
 *  - It is the last thing in the panel, on phones and laptops alike: it is read only by someone who has seen their
 *    place's week and scrolled past the passes, the moment the site has given them something. Nothing above it moves
 *    for it, and it never covers the globe, the headline or a photo.
 *  - It is one hairline row in the time-lapse row's language (a mark, a mono caps title, one plain line, an arrow), so
 *    it reads as part of the instrument, not as an advert dropped into it. The arrow is the external one, and its
 *    signal colour shows only on hover, like the time-lapse row's: signal stays rare (DESIGN §1).
 *  - It is a plain link: nothing loads from Buy Me a Coffee until it is pressed (src/lib/maker.ts).
 *  - The class names say nothing about donating or sponsors: generic cosmetic filters in blocker lists hide elements
 *    by names like those.
 *
 * <ColophonBar/> (below) says the same at the top of the overview, where it is seen, a few times at most.
 */
import { useState } from 'react'
import { LOCALE_INFO } from '../../../api/_lib/i18n/locales'
import enResults from '@/i18n/en/results'
import { useLocale, useMsgs } from '@/i18n/runtime'
import { SUPPORT_URL } from '@/lib/maker'
import { Glyph } from '@/ui/system'
import s from './Colophon.module.css'

export function Colophon() {
  const m = useMsgs(enResults).colophon
  return (
    <a className={s.row} href={SUPPORT_URL} target="_blank" rel="noopener">
      <Glyph name="cup" size={16} className={s.mark} />
      <span className={s.text}>
        <span className={s.title}>{m.title}</span>
        <span className={s.sub}>{m.sub}</span>
      </span>
      <Glyph name="arrow-up-right" size={12} className={s.arrow} />
    </a>
  )
}

// ── The bar: the same thanks, where it is seen ───────────────────────────────────────────────────────────────────────

/**
 * Why a second, louder place: the row above closes a long panel, and About is opened by about 5% of visits, so almost
 * no one saw either (owner, 2026-11-23). The bar sits at the top of the overview, where every result is read, on these
 * terms:
 *  - on phones it is the first thing in the sheet's body, under the headline (in the half-open sheet, without a
 *    scroll); on laptops it follows the photos and the time-lapse row, still on the first screen but never ahead of
 *    the headline (above it, it was the first thing read);
 *  - never on a browser's first result: that one is the site's first impression, and it stays the headline's alone;
 *  - from its second on, on at most three places, then never again; never again either once it is closed or its link
 *    pressed;
 *  - never beside the shared-link invite (one bar at a time);
 *  - decided once per place and window, when its overview first shows (Back from a pass, a partial report turning
 *    final: the same answer), so it never appears under a reader or leaves without being closed.
 * Remembered in localStorage (`watched.colophon`); where storage throws (a private window), in this tab only.
 */
const STORE_KEY = 'watched.colophon'
const MAX_SHOWN = 3

interface AskState {
  /** Overviews this browser has shown (places and windows) */
  results: number
  /** How many of them showed the bar */
  shown: number
  /** Closed, or its link pressed */
  done: boolean
}

let memory: AskState = { results: 0, shown: 0, done: false }
const decided = new Map<string, boolean>()

function readState(): AskState {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) {
      const v = JSON.parse(raw) as Partial<AskState>
      return { results: Number(v.results) || 0, shown: Number(v.shown) || 0, done: !!v.done }
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

/** Whether the overview of `placeKey` shows the bar (decided once per key; `blocked`: another bar is up). Exported for tests. */
export function decideBar(placeKey: string, blocked: boolean): boolean {
  const known = decided.get(placeKey)
  if (known !== undefined) return known
  const s = readState()
  s.results += 1
  const show = !blocked && !s.done && s.results >= 2 && s.shown < MAX_SHOWN
  if (show) s.shown += 1
  writeState(s)
  decided.set(placeKey, show)
  return show
}

/** Closed or pressed: never again, here (every place this tab decided, so a remounted overview stays without it) or later. */
function finish() {
  writeState({ ...readState(), done: true })
  for (const k of decided.keys()) decided.set(k, false)
}

/** Tests: forget this tab's decisions and memory. */
export function resetBarForTests() {
  decided.clear()
  memory = { results: 0, shown: 0, done: false }
}

export function ColophonBar({ placeKey, blocked }: { placeKey: string; blocked: boolean }) {
  const all = useMsgs(enResults)
  const m = all.colophon
  // What separates two sentences: a space, or nothing in Chinese and Japanese.
  const gap = LOCALE_INFO[useLocale()].sentenceGap
  const [closed, setClosed] = useState(false)
  if (closed || !decideBar(placeKey, blocked)) return null
  return (
    <div className={s.bar}>
      <Glyph name="cup" size={16} className={s.mark} />
      <p className={s.barText}>
        {m.bar}
        {gap}
        <a className={s.barLink} href={SUPPORT_URL} target="_blank" rel="noopener" onClick={finish}>
          {m.link}
          <Glyph name="arrow-up-right" size={10} className={s.barArrow} />
        </a>
      </p>
      <button
        type="button"
        className={s.barClose}
        onClick={() => {
          finish()
          setClosed(true)
        }}
        aria-label={all.invite.dismiss}
      >
        <Glyph name="close" size={12} />
      </button>
    </div>
  )
}
