/**
 * The search through a language's place names (src/imagery/exonyms.ts holds the display half): a query typed the way
 * the visitor's language writes a place (Москва, Ha Noi, Mailand, تهران, नई दिल्ली) finds the place the offline list
 * files under its English name, so a Cyrillic, Persian or Devanagari query is answered offline instead of by
 * Open-Meteo, and a Vietnamese one finds the capital Hà Nội before a hamlet of that name.
 *
 * A chunk of its own, loaded with the table (exonyms.ts ensureExonyms) and only in a language that has one: English
 * downloads none of it. The table is indexed once, the first time a search reads it (~900 names: a scan per keystroke
 * costs well under a millisecond).
 */
import { currentLocale } from '@/i18n/runtime'
import { LOCALE_INFO } from '../../api/_lib/i18n/locales'
import { placeKey, SPELLED } from './placeKey'

/** One name a search can find: as the visitor types it, the place it names, and its rank in the table. */
export interface TypedName {
  /** typedKey of the name, its words apart */
  words: string
  /** The same without spaces */
  compact: string
  /** The English name the offline list files the place under */
  english: string
  /** ISO country code, upper case ('' for no country) */
  cc: string
  region: boolean
  /** Position in its country's names (largest first), then its country's position: lower is larger */
  rank: number
}

/** A place in the offline list that a typed name stands for: its English name and country, and what it is. */
export interface Alternate {
  /** placeKey of the English name the offline list files it under */
  key: string
  /** ISO country code, upper case */
  cc: string
  kind: 'town' | 'region' | 'country'
  /** The query is this place's whole name (or the whole of a name after its first words: Hồ Chí Minh) */
  exact: boolean
}

/** This module, as exonyms.ts holds it once loaded. */
export type ExonymSearch = typeof import('./exonymSearch')

/** At most this many places a typed name can stand for are looked up (each may be one more small file to read). */
export const MAX_ALTERNATES = 5

/**
 * A name as the visitor types it, for the search through a table: accents, case and punctuation folded as placeKey
 * folds them (Hà Nội, Ha Noi and ha noi meet); Persian's letter forms unified (ي ى → ی, ك → ک, ة → ه), so a name typed
 * on an Arabic keyboard finds the Persian one; the tatweel and the zero-width joiners dropped. Devanagari keeps its
 * vowel signs and virama (placeKey would cut its words at them) and drops only the nukta, which is typed both ways
 * (ग़ाज़ियाबाद, गाजियाबाद). Words stay apart by one space; TypedName.compact drops them too (نیویورک, نیو یورک).
 */
export function typedKey(s: string): string {
  return s
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ه')
    .replace(/[\u0640\u200c\u200d]/g, '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, (c) => (c >= '\u0900' && c <= '\u097f' && c !== '\u093c' ? c : ''))
    .toLowerCase()
    .replace(/[łøæœßđðþıħ]/g, (c) => SPELLED[c])
    .replace(/['’ʻʼ`]/g, '')
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ')
    .trim()
}

/** Every name of a table a search can find, shown or search-only (`~`), in the table's order. */
export function typedNames(src: string): TypedName[] {
  const typed: TypedName[] = []
  src.split('|').forEach((group, g) => {
    const at = group.indexOf(':')
    if (at < 0) return
    const cc = group.slice(0, at).trim().toUpperCase()
    group
      .slice(at + 1)
      .split(';')
      .forEach((entry, i) => {
        const body = entry.startsWith('~') ? entry.slice(1) : entry
        const region = body.startsWith('*')
        const eq = body.indexOf('=')
        const english = body.slice(region ? 1 : 0, eq)
        const words = eq < 0 ? '' : typedKey(body.slice(eq + 1))
        if (words && placeKey(english)) typed.push({ words, compact: words.replace(/ /g, ''), english, cc, region, rank: i + g * 1e4 })
      })
  })
  return typed
}

let indexed: { src: string; typed: TypedName[] } | undefined

/** The browser's country names in the active language, typed as the visitor types them (built once a language). */
let countryNames: { locale: string; list: { compact: string; cc: string }[] } | undefined
const NOT_COUNTRIES = /^(European Union|United Nations|Unknown Region|Eurozone|Outlying Oceania|Pseudo)/

export function countriesTyped(): { compact: string; cc: string }[] {
  const locale = currentLocale()
  if (countryNames?.locale === locale) return countryNames.list
  const list: { compact: string; cc: string }[] = []
  try {
    const en = new Intl.DisplayNames(['en'], { type: 'region' })
    const styles = (['long', 'short'] as const).map((style) => new Intl.DisplayNames([LOCALE_INFO[locale].intl], { type: 'region', style }))
    for (let a = 65; a <= 90; a++)
      for (let b = 65; b <= 90; b++) {
        const cc = String.fromCharCode(a, b)
        const english = en.of(cc)
        if (!english || english === cc || NOT_COUNTRIES.test(english)) continue
        for (const names of styles) {
          const name = names.of(cc)
          const compact = name && name !== cc ? typedKey(name).replace(/ /g, '') : ''
          if (compact && !list.some((x) => x.cc === cc && x.compact === compact)) list.push({ compact, cc })
        }
      }
  } catch {
    /* no Intl.DisplayNames: countries only by their English names */
  }
  countryNames = { locale, list }
  return list
}

/**
 * The places `query` stands for in the table `src`, best first, at most MAX_ALTERNATES: the names that are the query
 * (exact), whose later words are all of it (exact too: Hồ Chí Minh for Thành phố Hồ Chí Minh), that start with it, or
 * whose later words start with it (3+ letters), each group in the table's order (largest first), and the `countries`
 * named so (each country's offline key from `countryKey`). A name two English names share in one country (the city
 * Kyiv and the list's landmark row for "Kiev" are both Киев) stands for the larger.
 */
export function exonymSearch(src: string, query: string, countryKey: (cc: string) => string, countries: readonly { compact: string; cc: string }[] = []): Alternate[] {
  if (indexed?.src !== src) indexed = { src, typed: typedNames(src) }
  const q = typedKey(query).replace(/ /g, '')
  if (!q) return []
  const hits: { a: Alternate; tier: number; rank: number; name: string }[] = []
  for (const n of indexed.typed) {
    let tier = n.compact === q ? 0 : n.compact.startsWith(q) ? 2 : -1
    if (tier < 0 && [...q].length >= 3) {
      const words = n.words.split(' ')
      for (let i = 1; i < words.length && tier < 0; i++) {
        const tail = words.slice(i).join('')
        if (tail === q) tier = 1
        else if (tail.startsWith(q)) tier = 3
      }
    }
    if (tier >= 0) hits.push({ a: { key: placeKey(n.english), cc: n.cc, kind: n.region ? 'region' : 'town', exact: tier <= 1 }, tier, rank: n.rank, name: n.compact })
  }
  for (const c of countries) {
    const tier = c.compact === q ? 0 : c.compact.startsWith(q) ? 2 : -1
    if (tier >= 0) hits.push({ a: { key: countryKey(c.cc), cc: c.cc, kind: 'country', exact: tier === 0 }, tier, rank: -1, name: c.compact })
  }
  hits.sort((x, y) => x.tier - y.tier || x.rank - y.rank)
  const seen = new Set<string>()
  const out: Alternate[] = []
  for (const { a, name } of hits) {
    // One place per name in a country: Киев is the city Kyiv, not also the landmark row the list keeps for "Kiev".
    const k = `${a.kind}|${a.cc}|${a.key}`
    const named = `${a.kind}|${a.cc}|=${name}`
    if (seen.has(k) || seen.has(named)) continue
    seen.add(k).add(named)
    out.push(a)
    if (out.length >= MAX_ALTERNATES) break
  }
  return out
}
