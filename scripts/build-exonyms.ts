/**
 * Generate the place-name display tables: src/i18n/<de|it|uk|ru|vi|fa|hi>/exonyms.gen.ts, the names those languages
 * give the places the data names in English (München, Mosca, Київ, Москва, Hà Nội, تهران, नई दिल्ली), read by
 * src/imagery/exonyms.ts. Which names, and why, is scripts/exonyms.ts; this script only reads GeoNames and writes the
 * tables. It never touches the offline place list (public/places, scripts/build-places.ts): each rebuild of that adds
 * ~10 MB to git history, while a table is a few kB.
 *
 * What a table covers (RULES in scripts/exonyms.ts): the towns of cities500 above the language's threshold, more at
 * home, the first-level regions (admin1CodesASCII), the curated landmarks (scripts/landmarks.ts) GeoNames knows (found
 * in allCountries by name, near the landmark's point), the large seas and oceans (countryless features with an English
 * Wikipedia article), and the hand-made OVERRIDES and search ALIASES. Countries are not in it: the browser names them
 * (Intl.DisplayNames).
 *
 * Usage: NODE_OPTIONS=--max-old-space-size=6000 npm run data:exonyms <dir with the GeoNames downloads>
 *   The dir must hold cities500.zip, admin1CodesASCII.txt, allCountries.zip and alternateNamesV2.zip from
 *   https://download.geonames.org/export/dump/ (~650 MB; needs `unzip` on the PATH). Keep the downloads out of the
 *   repository. Takes ~1 minute and ~3 GB of memory, and prints each table's size; src/imagery/exonymTables.test.ts
 *   checks the size budget.
 *
 * Source: GeoNames (CC BY 4.0).
 */
import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import { gzipSync } from 'node:zlib'
import { LANDMARKS } from './landmarks'
import { placeKey } from '../src/imagery/placeKey'
import {
  addDisplay,
  addNamesake,
  ALIASES,
  atHome,
  cleanName,
  displayName,
  LANGS,
  OVERRIDES,
  pickName,
  RULES,
  serializeDisplay,
  type Alias,
  type AltName,
  type DisplayTable,
  type Lang,
  type Named,
} from './exonyms'

const SRC = process.argv[2]
/** Optional: a directory (outside the repository) to write each table's names into, one per line, for review. */
const REVIEW = process.argv[3]
if (!SRC) throw new Error('usage: tsx scripts/build-exonyms.ts <geonames dir> [review dir]')

/** Feature codes left out, as the offline list leaves them out: historical, abandoned or destroyed places. */
const SKIP = new Set(['PPLH', 'PPLQ', 'PPLW', 'PPLCH', 'PPLR'])
/** Sections of a city: named only when they are as large as a town the table names anywhere. */
const SECTION = 'PPLX'
/** Seas and oceans with no country: the largest (by how many names GeoNames has) of those with a Wikipedia article. */
const WATER_CODES = new Set(['OCN', 'SEA', 'GULF'])
const WATERS = Math.max(...LANGS.map((l) => RULES[l].waters))
/** How far from its point a landmark's GeoNames feature may be, in degrees (a lake's or a reef's point is far off). */
const LANDMARK_REACH = 1

interface Town {
  id: string
  name: string
  cc: string
  admin1: string
  pop: number
  section: boolean
  capital: boolean
  /** How many names it has in other languages (scripts/exonyms.ts TownFacts) */
  names: number
}

/**
 * A table as a single-quoted string literal, its invisible characters (Persian's zero-width non-joiner, a direction
 * mark) written as escapes, so the file shows them and an editor cannot drop them unseen.
 */
const literal = (s: string) =>
  `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/[\u00ad\u200b-\u200f\u2028\u2029\u2060\ufeff]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`)}'`

async function* unzipLines(zip: string, member?: string): AsyncGenerator<string> {
  const p = spawn('unzip', ['-p', zip, ...(member ? [member] : [])], { stdio: ['ignore', 'pipe', 'inherit'] })
  yield* createInterface({ input: p.stdout, crlfDelay: Infinity })
}

const tsv = (file: string) =>
  readFileSync(join(SRC, file), 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => l.split('\t'))

async function main() {
  const started = Date.now()
  const regions = new Map<string, { code: string; name: string; cc: string }>()
  for (const p of tsv('admin1CodesASCII.txt')) regions.set(p[3], { code: p[0], name: p[1], cc: p[0].split('.')[0] })

  const towns: Town[] = []
  const regionPop = new Map<string, number>()
  for await (const l of unzipLines(join(SRC, 'cities500.zip'))) {
    const p = l.split('\t')
    if (p.length < 15 || SKIP.has(p[7])) continue
    const pop = Number(p[14]) || 0
    const admin1 = `${p[8]}.${p[10]}`
    const section = p[7] === SECTION
    if (!section) regionPop.set(admin1, (regionPop.get(admin1) ?? 0) + pop)
    towns.push({ id: p[0], name: p[1], cc: p[8], admin1, pop, section, capital: p[7] === 'PPLC', names: 0 })
  }

  // The landmarks' GeoNames features (a name or alias of the landmark among the feature's names, the nearest), and
  // the countryless seas and oceans.
  const cell = (lat: number, lon: number) => `${Math.floor(lat)}|${Math.floor(lon)}`
  const near = new Map<string, number[]>()
  LANDMARKS.forEach(([, , lat, lon], i) => {
    for (let a = -1; a <= 1; a++)
      for (let o = -1; o <= 1; o++) {
        const k = cell(lat + a * LANDMARK_REACH, lon + o * LANDMARK_REACH)
        const list = near.get(k) ?? []
        if (!list.includes(i)) list.push(i)
        near.set(k, list)
      }
  })
  const landmarkKeys = LANDMARKS.map(([name, , , , , aliases]) => new Set([name, ...(aliases ?? [])].map(placeKey)))
  const landmarkHit: ({ id: string; d: number; own: boolean } | undefined)[] = LANDMARKS.map(() => undefined)
  const waterCandidates = new Map<string, { name: string; names: number }>()
  for await (const l of unzipLines(join(SRC, 'allCountries.zip'))) {
    const p = l.split('\t', 9)
    const lat = Number(p[4])
    const lon = Number(p[5])
    if (!p[8] && WATER_CODES.has(p[7])) waterCandidates.set(p[0], { name: p[1], names: p[3] ? p[3].split(',').length : 0 })
    const here = near.get(cell(lat, lon))
    if (!here) continue
    for (const i of here) {
      const [, , la, lo, cc] = LANDMARKS[i]
      if (p[8] && p[8] !== cc.toUpperCase()) continue
      const d = Math.hypot(la - lat, (lo - lon) * Math.cos((la * Math.PI) / 180))
      if (d > LANDMARK_REACH) continue
      const own = placeKey(LANDMARKS[i][0]) === placeKey(p[1]) || placeKey(LANDMARKS[i][0]) === placeKey(p[2])
      const named = own || landmarkKeys[i].has(placeKey(p[1])) || p[3].split(',').some((n) => landmarkKeys[i].has(placeKey(n)))
      if (!named) continue
      const had = landmarkHit[i]
      if (!had || (own && !had.own) || (own === had.own && d < had.d)) landmarkHit[i] = { id: p[0], d, own }
    }
  }

  // The alternate names of every town, region, landmark and water in the table languages and English, and which
  // waters have an English Wikipedia article.
  const wanted = new Set<string>([...towns.map((t) => t.id), ...regions.keys(), ...waterCandidates.keys()])
  for (const h of landmarkHit) if (h) wanted.add(h.id)
  const langs = new Set<string>([...LANGS, 'en'])
  const alts = new Map<string, Map<string, AltName[]>>()
  const wiki = new Set<string>()
  const nameCount = new Map<string, number>()
  const isLanguage = /^[a-z]{2,3}(-[A-Za-z]+)?$/
  for await (const l of unzipLines(join(SRC, 'alternateNamesV2.zip'), 'alternateNamesV2.txt')) {
    const a = l.indexOf('\t')
    if (!wanted.has(l.slice(a + 1, l.indexOf('\t', a + 1)))) continue
    const p = l.split('\t')
    if (p[2] === 'link') {
      if (p[3].includes('en.wikipedia.org/')) wiki.add(p[1])
      continue
    }
    if (isLanguage.test(p[2])) nameCount.set(p[1], (nameCount.get(p[1]) ?? 0) + 1)
    if (!langs.has(p[2])) continue
    let byLang = alts.get(p[1])
    if (!byLang) alts.set(p[1], (byLang = new Map()))
    const list = byLang.get(p[2]) ?? []
    list.push({ name: p[3], preferred: p[4] === '1', short: p[5] === '1', colloquial: p[6] === '1', historic: p[7] === '1' })
    byLang.set(p[2], list)
  }
  for (const t of towns) t.names = nameCount.get(t.id) ?? 0
  const waters = [...waterCandidates].filter(([id]) => wiki.has(id)).sort((a, b) => b[1].names - a[1].names).slice(0, WATERS)

  /**
   * A place's English spellings: GeoNames' own name (the offline list's), then, in a Latin table, its English name if
   * that differs (Köln, Cologne: what Photon and Open-Meteo say). A script table writes every name it has, so it
   * spends no bytes on a second spelling: the offline list, which answers nearly every search and pin, has the first.
   */
  const englishOf = (id: string, name: string, both: boolean) => {
    const en = both ? pickName(alts.get(id)?.get('en'), (n) => !!placeKey(n)) : undefined
    return en && placeKey(en) !== placeKey(name) ? [name, en] : [name]
  }

  const report: string[] = []
  for (const lang of LANGS) {
    const rules = RULES[lang]
    const over = OVERRIDES[lang]
    const table: DisplayTable = new Map()
    const nameOf = (id: string, cc: string, home: boolean, region = false) => {
      if (over[id]) return over[id]
      const shown = displayName(alts.get(id)?.get(lang), lang, { region, home, cc })
      // Abroad, a Latin name that is also one of the place's English names is an old English spelling, not the
      // language's own (Allahabad for Prayagraj, Port Elizabeth for Gqeberha).
      if (shown && rules.latin && !home && alts.get(id)?.get('en')?.some((a) => placeKey(a.name) === placeKey(shown))) return undefined
      return shown
    }
    const spellings = (id: string, name: string) => englishOf(id, name, rules.latin)

    // Towns: the large ones everywhere and every capital, more in the neighbours the rules list, more at home.
    const inTable = (t: Town, home: boolean) =>
      home
        ? !t.section && t.pop >= rules.homeMinPop
        : rules.abroad(t) || (!t.section && !!rules.near?.countries.includes(t.cc) && t.pop >= rules.near.minPop)
    /** At home, a Latin table keeps the data's name where it is already written in the language (Biên Hòa, Köln). */
    const keepsOwn = (t: Town, home: boolean) => rules.latin && home && /[^\x00-\x7f]/.test(t.name) && !over[t.id]
    const small: Town[] = []
    for (const t of towns) {
      const home = atHome(rules, t.cc, t.admin1)
      const shown = inTable(t, home) && !keepsOwn(t, home) ? nameOf(t.id, t.cc, home) : undefined
      if (shown) addDisplay(table, { english: spellings(t.id, t.name), cc: t.cc, region: false, pop: t.pop, home }, shown)
      else small.push(t)
    }
    // Regions: every one at home, and abroad those of the countries the rules list.
    for (const [id, r] of regions) {
      const home = atHome(rules, r.cc, r.code)
      if (!home && rules.regionsAbroad !== 'all' && !rules.regionsAbroad.includes(r.cc)) continue
      const shown = over[r.code] ?? nameOf(id, r.cc, home, true)
      if (shown) addDisplay(table, { english: spellings(id, r.name), cc: r.cc, region: true, pop: regionPop.get(r.code) ?? 0, home }, shown)
    }
    // Landmarks GeoNames knows, under their own (curated) English name, ranked as a city of a million. In a Latin
    // table only a feature named by the landmark's own name (not an airport's code or a nickname), and only a name
    // that is more than its English with words around it (not Mount Rushmore National Memorial).
    LANDMARKS.forEach(([name, , , , cc], i) => {
      const hit = landmarkHit[i]
      const home = atHome(rules, cc.toUpperCase(), '')
      const shown = hit && (!rules.latin || hit.own) ? nameOf(hit.id, cc.toUpperCase(), home) : undefined
      if (shown) addDisplay(table, { english: [name], cc: cc.toUpperCase(), region: false, pop: 1e6, home }, shown)
    })
    // Seas and oceans: countryless.
    for (const [id, w] of waters.slice(0, rules.waters)) {
      const shown = nameOf(id, '', false)
      if (shown) addDisplay(table, { english: englishOf(id, w.name, rules.latin), cc: '', region: false, pop: w.names * 1e4 }, shown)
    }
    // Hand-made names given by English name (`CC:English`), countryless or in a country.
    for (const [k, shown] of Object.entries(over)) {
      const at = k.indexOf(':')
      if (at < 0) continue
      const cc = k.slice(0, at)
      const region = k[at + 1] === '*'
      const english = k.slice(at + (region ? 2 : 1))
      const had = table.get(cc)?.get(`${region ? '*' : ''}${placeKey(english)}`)
      if (had) had.shown = shown ? cleanName(shown, lang) : null
      else if (shown) addDisplay(table, { english: [english], cc, region, pop: 1e7, home: true }, cleanName(shown, lang))
    }
    // Namesakes too small for the table make its keys ambiguous only if they have names of their own.
    for (const t of small) {
      const home = atHome(rules, t.cc, t.admin1)
      addNamesake(table, { english: spellings(t.id, t.name), cc: t.cc, region: false, pop: t.pop }, nameOf(t.id, t.cc, home))
    }

    const aliases: Alias[] = []
    for (const [id, names] of Object.entries(ALIASES[lang])) {
      const t = towns.find((x) => x.id === id)
      if (t) for (const alias of names) aliases.push({ cc: t.cc, english: t.name, alias: cleanName(alias, lang) })
    }
    const names = serializeDisplay(table, rules.latin, aliases)
    const entries = names ? names.split('|').reduce((n, g) => n + g.split(';').length, 0) : 0
    const bytes = Buffer.byteLength(names)
    const gz = gzipSync(names, { level: 9 }).length
    writeFileSync(
      `src/i18n/${lang}/exonyms.gen.ts`,
      `/**
 * Generated by scripts/build-exonyms.ts from GeoNames (CC BY 4.0). Do not edit: a wrong name is fixed in
 * scripts/exonyms.ts (OVERRIDES), then the table is generated again. Format: src/i18n/en/exonyms.ts.
 * ${entries} names, ${bytes} bytes, ${gz} compressed.
 */
export default ${literal(names)}
`,
    )
    report.push(`${lang}: ${entries} names, ${bytes} bytes, ${gz} gzip`)
    if (REVIEW) writeFileSync(join(REVIEW, `${lang}.txt`), names.split('|').flatMap((g) => g.split(';').map((e, i) => (i ? `${g.slice(0, g.indexOf(':'))}:${e}` : e))).join('\n') + '\n')
  }
  const found = landmarkHit.filter(Boolean).length
  console.log(`${towns.length} towns, ${regions.size} regions, ${found}/${LANDMARKS.length} landmarks, ${waters.length} waters (${((Date.now() - started) / 1000).toFixed(0)} s)`)
  for (const r of report) console.log(r)
  for (const [i, h] of landmarkHit.entries()) if (!h) console.log(`  landmark not in GeoNames: ${LANDMARKS[i][0]}`)
}

void main()
