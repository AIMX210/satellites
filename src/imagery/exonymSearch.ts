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
  /** The name as the table writes it */
  shown: string
  /** typedKey of the name, its words apart */
  words: string
  /** The same without spaces */
  compact: string
  /** The same with ä, ö, ü spelled ae, oe, ue, as they are typed without the letters (Koeln for Köln), if it has any */
  spelled?: string
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
  /**
   * The keys of the place's other English names that the table gives the same name to, in the same country (Photon's
   * Zaporizhzhia beside the list's Zaporizhzhya, the Paracels' three): whichever the list has a row for finds it.
   */
  also?: string[]
  /** ISO country code, upper case */
  cc: string
  kind: 'town' | 'region' | 'country'
  /** The query is this place's whole name */
  exact: boolean
  /** The name the query matched, as the table writes it (or the browser names the country) */
  shown: string
}

/** This module, as exonyms.ts holds it once loaded. */
export type ExonymSearch = typeof import('./exonymSearch')

/** At most this many places a typed name can stand for are looked up (each may be one more small file to read). */
export const MAX_ALTERNATES = 5
/** And at most this many more English names of each (Alternate.also). */
const MAX_ALSO = 2

/** A Cyrillic letter: a word with one is Cyrillic, so a Latin look-alike typed in it (i for і) is read as Cyrillic. */
const CYRILLIC = /\p{Script=Cyrillic}/u
/** The Latin letters a Cyrillic keyboard user types for Cyrillic ones that look the same. */
const LOOK_ALIKE: Record<string, string> = { a: 'а', c: 'с', e: 'е', i: 'и', o: 'о', p: 'р', x: 'х', y: 'у' }

/**
 * A name as the visitor types it, for the search through a table: accents, case and punctuation folded as placeKey
 * folds them (Hà Nội, Ha Noi and ha noi meet); Persian's letter forms unified (ي ى → ی, ك → ک, ة → ه, the madda and
 * hamza dropped: آ, أ, إ → ا, ئ → ی, ۀ → ه), so a name typed on an Arabic keyboard, or without its madda, finds the
 * Persian one; the tatweel and the zero-width joiners dropped. Cyrillic is read as both Ukrainian and Russian keyboards
 * type it (і, ї, ы → и; є, э → е; ґ → г: харкив and Харків meet), and a Latin look-alike inside a Cyrillic word (Кривий
 * Рiг with a Latin i) as the Cyrillic letter. Devanagari keeps its vowel signs and virama (placeKey would cut its words
 * at them), drops the nukta, which is typed both ways (ग़ाज़ियाबाद, गाजियाबाद), and writes a nasal before a consonant
 * one way (मुम्बई, मुंबई; रांची, राँची), and ॉ, ॅ as ा, े (मॉस्को, मास्को). Words stay apart by one space;
 * TypedName.compact drops them too (نیویورک, نیو یورک).
 */
export function typedKey(s: string): string {
  const folded = s
    .replace(/[\u0640\u200c\u200d]/g, '')
    .normalize('NFD')
    .replace(/[يىئ]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[ةۀە]/g, 'ه')
    .replace(/[\u0653-\u0655]/g, '')
    .replace(/[\u0900\u0901]/g, '\u0902')
    .replace(/[ङञणनम]\u094d(?=[क-ह])/g, '\u0902')
    .replace(/\u0949/g, '\u093e')
    .replace(/\u0945/g, '\u0947')
    .replace(/\p{Diacritic}/gu, (c) => (c >= '\u0900' && c <= '\u097f' && c !== '\u093c' ? c : ''))
    .toLowerCase()
    .replace(/[łøæœßđðþıħ]/g, (c) => SPELLED[c])
    .replace(/['’ʻʼ`]/g, '')
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ')
    .trim()
  if (!CYRILLIC.test(folded)) return folded
  return folded
    .replace(/[a-z]/g, (c) => LOOK_ALIKE[c] ?? c)
    .replace(/[іы]/g, 'и')
    .replace(/[єэ]/g, 'е')
    .replace(/ґ/g, 'г')
}

/** A name with ä, ö, ü spelled out (Köln → koeln), as TypedName.spelled; undefined if it has none. */
function spelledOut(shown: string): string | undefined {
  if (!/[äöüÄÖÜ]/.test(shown.normalize('NFC'))) return undefined
  return typedKey(shown.normalize('NFC').replace(/[äöüÄÖÜ]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue', Ä: 'Ae', Ö: 'Oe', Ü: 'Ue' })[c] ?? c)).replace(/ /g, '')
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
        const mark = region || body.startsWith('^') ? 1 : 0
        const eq = body.indexOf('=')
        const english = body.slice(mark, eq)
        const shown = eq < 0 ? '' : body.slice(eq + 1)
        const words = typedKey(shown)
        if (words && placeKey(english))
          typed.push({ shown, words, compact: words.replace(/ /g, ''), spelled: spelledOut(shown), english, cc, region, rank: i + g * 1e4 })
      })
  })
  return typed
}

let indexed: { src: string; typed: TypedName[] } | undefined

/** The browser's country names in the active language, typed as the visitor types them (built once a language). */
let countryNames: { locale: string; list: { compact: string; cc: string; shown: string }[] } | undefined
const NOT_COUNTRIES = /^(European Union|United Nations|Unknown Region|Eurozone|Outlying Oceania|Pseudo)/

export function countriesTyped(): { compact: string; cc: string; shown: string }[] {
  const locale = currentLocale()
  if (countryNames?.locale === locale) return countryNames.list
  const list: { compact: string; cc: string; shown: string }[] = []
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
          if (compact && name && !list.some((x) => x.cc === cc && x.compact === compact)) list.push({ compact, cc, shown: name })
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
 * (exact), whose later words are all of it (Hồ Chí Minh for Thành phố Hồ Chí Minh, but not exact: London's airports
 * end with London in Persian, and Shahr-e Qods is not Jerusalem), that start with it, or whose later words start with
 * it (3+ letters), each group in the table's order (largest first), and the `countries` named so (each country's
 * offline key from `countryKey`). A name two English names share in one country (the city Kyiv and the list's
 * landmark row for "Kiev" are both Киев) is one place, the larger, looked up under each of them (`also`, at most
 * MAX_ALSO more): the table may write first a spelling the list has no row for (a geocoder's).
 */
export function exonymSearch(
  src: string,
  query: string,
  countryKey: (cc: string) => string,
  countries: readonly { compact: string; cc: string; shown?: string }[] = [],
): Alternate[] {
  if (indexed?.src !== src) indexed = { src, typed: typedNames(src) }
  const q = typedKey(query).replace(/ /g, '')
  if (!q) return []
  const hits: { a: Alternate; tier: number; rank: number; name: string }[] = []
  for (const n of indexed.typed) {
    let tier = n.compact === q || n.spelled === q ? 0 : n.compact.startsWith(q) || n.spelled?.startsWith(q) ? 2 : -1
    if (tier < 0 && [...q].length >= 3) {
      const words = n.words.split(' ')
      for (let i = 1; i < words.length && tier < 0; i++) {
        const tail = words.slice(i).join('')
        if (tail === q) tier = 1
        else if (tail.startsWith(q)) tier = 3
      }
    }
    if (tier >= 0)
      hits.push({
        a: { key: placeKey(n.english), cc: n.cc, kind: n.region ? 'region' : 'town', exact: tier === 0, shown: n.shown },
        tier,
        rank: n.rank,
        name: n.compact,
      })
  }
  for (const c of countries) {
    const tier = c.compact === q ? 0 : c.compact.startsWith(q) ? 2 : -1
    if (tier >= 0) hits.push({ a: { key: countryKey(c.cc), cc: c.cc, kind: 'country', exact: tier === 0, shown: c.shown ?? c.compact }, tier, rank: -1, name: c.compact })
  }
  hits.sort((x, y) => x.tier - y.tier || x.rank - y.rank)
  const seen = new Set<string>()
  const byName = new Map<string, Alternate>()
  const out: Alternate[] = []
  for (const { a, name } of hits) {
    // One place per name in a country: Киев is the city Kyiv, not also the landmark row the list keeps for "Kiev", but
    // looked up under both.
    const k = `${a.kind}|${a.cc}|${a.key}`
    const named = `${a.kind}|${a.cc}|=${name}`
    if (seen.has(k)) continue
    seen.add(k)
    const same = byName.get(named)
    if (same) {
      if ((same.also ??= []).length < MAX_ALSO) same.also.push(a.key)
      continue
    }
    if (out.length >= MAX_ALTERNATES) continue
    byName.set(named, a)
    out.push(a)
  }
  return out
}
