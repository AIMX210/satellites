/**
 * Place names as the visitor reads them: München for a German, Monaco di Baviera for an Italian, Київ for a Ukrainian,
 * Москва for a Russian, Hà Nội for a Vietnamese, تهران for a Persian reader, नई दिल्ली for a Hindi one, 동해 for a
 * Korean, where the place data says Munich, Kyiv, Moscow or Sea of Japan. Display only (geocode.ts displayLabel and
 * displaySublabel, ui/results/placeName.ts): a Place keeps its English label and sublabel, which the usage stats,
 * record_lookup, links and shares carry, so one town is one row in every language. And search: a query typed the way
 * the visitor's language writes a place (Москва, Ha Noi, Mailand) finds that place in the offline list
 * (./exonymSearch.ts, read by geocode.ts searchPlaces through exonymAlternates).
 *
 * The names come from the active language's 'exonyms' namespace (src/i18n/en/exonyms.ts gives its format), so each
 * language's table ships with that language only; English has none, and an English page shows every name as it came
 * and downloads nothing for it. A small table is in the language's chunk; a large one (Cyrillic, Persian and Hindi
 * write every name) is a chunk of its own, fetched at idle once the landing is up (ensureExonyms) and awaited by
 * everything that shows a place name first: a search, a pin, a report, a language switch. The search through a table
 * is a chunk of its own too (./exonymSearch.ts), loaded with it, so English carries none of it. A name must never change
 * after it is shown (owner rule), so a table that arrives after a name was shown without it is not applied in that
 * page: the page keeps the names it showed.
 *
 * Why by country: the same English name is many places (London, Ontario is never Londra; Kyiv the city is Київ, Kyiv
 * the oblast's sublabel is Київська область), so a name is looked up in the place's own country, among towns first
 * for a label and among regions first for a part of the where line. A place with no country code (a sea; a place
 * opened from a link) is looked up among the table's countryless names only, so a link to "London" shows London.
 */
import enExonyms from '@/i18n/en/exonyms'
import { msgs } from '@/i18n/runtime'
import { placeKey } from './placeKey'
import type { Alternate, ExonymSearch } from './exonymSearch'

export interface ExonymTable {
  /** `<CC>|<placeKey of the English name>` → the name shown, for towns (and anything not a region) */
  towns: Map<string, string>
  /** The same, for first-level regions */
  regions: Map<string, string>
}

/** The table's display half (src/i18n/en/exonyms.ts): a search-only entry (`~`) is left to ./exonymSearch.ts. */
export function parseExonyms(src: string): ExonymTable {
  const towns = new Map<string, string>()
  const regions = new Map<string, string>()
  for (const group of src.split('|')) {
    const at = group.indexOf(':')
    if (at < 0) continue
    const cc = group.slice(0, at).trim().toUpperCase()
    for (const entry of group.slice(at + 1).split(';')) {
      const eq = entry.indexOf('=')
      const region = entry.startsWith('*')
      const english = entry.slice(region ? 1 : 0, eq)
      const shown = entry.slice(eq + 1)
      if (eq < 0 || entry.startsWith('~') || !placeKey(english) || !shown) continue
      ;(region ? regions : towns).set(`${cc}|${placeKey(english)}`, shown)
    }
  }
  return { towns, regions }
}

let parsed: { src: string; table: ExonymTable } | undefined
/** Namespaces whose table arrived after a name was shown without it: kept out for the rest of the page. */
const late = new WeakSet<object>()

/** The active language's table source, or '' for one that has none (English) or whose table is not in yet. */
function activeSource(shown: boolean): string {
  const m = msgs(enExonyms)
  if (late.has(m)) return ''
  // A name shown now, before the language's own chunk of names is in: this page keeps showing it as it came.
  if (!m.names && shown && m.load) {
    late.add(m)
    if (import.meta.env.DEV) console.warn('A place name was shown before its language’s names loaded; they stay as they came on this page.')
  }
  return m.names
}

function activeTable(shown: boolean): ExonymTable | undefined {
  const src = activeSource(shown)
  if (!src) return undefined
  if (parsed?.src !== src) parsed = { src, table: parseExonyms(src) }
  return parsed.table
}

/** Is the active language's table in (or has it none to load)? Synchronous: what a caller checks before awaiting. */
export function exonymsReady(): boolean {
  const m = msgs(enExonyms)
  return !m.load || !!m.names || late.has(m)
}

let search: ExonymSearch | undefined
let searchLoad: Promise<void> | undefined

/**
 * Load the active language's table if it is a chunk of its own, and the search through it (idempotent, shared by every
 * caller; nothing in English). Never rejects: a failed load leaves the names as they came, and the next call tries
 * again, until a name has been shown.
 */
export async function ensureExonyms(): Promise<void> {
  const m = msgs(enExonyms)
  if (!m.names && !m.load) return
  searchLoad ??= import('./exonymSearch').then(
    (x) => void (search = x),
    () => void (searchLoad = undefined),
  )
  try {
    await Promise.all([exonymsReady() ? undefined : m.load?.(), searchLoad])
  } catch {
    /* offline or a stale build: names as they came */
  }
}

/**
 * `name` as the visitor's language names that place in country `cc` (ISO, any case; undefined: no country), or `name`
 * itself. `as` says what the name is: a place's own name ('label': towns first) or a part of its where line ('where':
 * regions first). Read at call time.
 */
export function exonym(name: string, cc: string | undefined, as: 'label' | 'where'): string {
  const t = activeTable(true)
  if (!t) return name
  const key = `${(cc ?? '').toUpperCase()}|${placeKey(name)}`
  const [first, then] = as === 'label' ? [t.towns, t.regions] : [t.regions, t.towns]
  return first.get(key) ?? then.get(key) ?? name
}

/** Does the active language name countries by the browser's names on their own label too (its namespace says so)? */
export const namesCountries = (): boolean => !!msgs(enExonyms).countries && !!activeTable(true)

/** English country names as the offline list writes them, where the browser's differ only in form (& for and). */
export const englishCountryKey = (english: string) => placeKey(english.replace(/&/g, 'and').replace(/^St\. /, 'Saint '))

/**
 * The places a query typed in the visitor's language stands for (./exonymSearch.ts), once ensureExonyms has loaded
 * the search: [] in English, or before.
 */
export function exonymAlternates(query: string, countryName: (cc: string) => string): Alternate[] {
  const src = activeSource(false)
  if (!src || !search) return []
  return search.exonymSearch(src, query, (cc) => englishCountryKey(countryName(cc)), msgs(enExonyms).countries ? search.countriesTyped() : [])
}
