/**
 * How scripts/build-exonyms.ts chooses the names in the generated display tables (src/i18n/<locale>/exonyms.gen.ts,
 * read by src/imagery/exonyms.ts): the name a German, Italian, Ukrainian, Russian, Vietnamese, Persian or Hindi map
 * gives a place that the data (GeoNames, and the geocoders asked in English) names in English: München, Mosca, Київ,
 * Москва, Hà Nội, تهران, नई दिल्ली.
 *
 * Why these rules:
 *  - Every name ships in its language's chunk and must earn its bytes (owner rule: costs nothing, stays fast). A
 *    Latin-script language writes only the names that differ from the English (München, not Berlin); Cyrillic,
 *    Persian and Hindi write every name, so their tables cover fewer places (RULES: the large towns everywhere, more at
 *    home, every first-level region at home), sized to stay under ~12 kB compressed (src/imagery/exonymTables.test.ts).
 *  - GeoNames marks few names preferred (Mailand, Londra and Київ are not), and lists historic, colloquial, inflected
 *    and administrative forms beside the name itself (Ленинград, Питер, Киевом, استان کرمانشاه, Thành phố Nam Định). So
 *    pickName takes the preferred name, else the first plain one, else a short one; never a historic or colloquial one;
 *    only in the language's script; and never a form `penalty` marks while a plain one exists.
 *  - The data is not always right for a reader (Mumbai's first Hindi name is बम्बई, Delhi's Persian one is Old Delhi):
 *    OVERRIDES fixes a name by GeoNames id or first-level code, and is the only place a name is written by hand. A wrong
 *    name is fixed there, then the tables are generated again.
 *  - A name is the same place's in every language, so one town is one row in the usage stats: a table only displays,
 *    and adds search names (ALIASES: Sài Gòn) that find the place without ever being shown.
 *
 * Pure TypeScript with no Node or DOM dependency: the build script reads the files and calls these, and the app's
 * tests check them.
 */
import { placeKey } from '../src/imagery/placeKey'

/** One alternate name, with GeoNames' flags. */
export interface AltName {
  name: string
  preferred: boolean
  short: boolean
  colloquial: boolean
  historic: boolean
}

/** The languages that get a generated table. */
export const LANGS = ['de', 'it', 'uk', 'ru', 'vi', 'fa', 'hi'] as const
export type Lang = (typeof LANGS)[number]

const LATIN_NAME = /^[\p{Script=Latin}\p{M}\p{N}][\p{Script=Latin}\p{M}\p{N} .,'’()/-]*$/u
const CYRILLIC_NAME = /^[\p{Script=Cyrillic}\p{M}\p{N}][\p{Script=Cyrillic}\p{M}\p{N} .,'’ʼ()-]*$/u
/** Persian letters, marks and the zero-width non-joiner Persian writes inside words (U+200C). */
const PERSIAN_NAME = /^[\p{Script=Arabic}\p{M}][\p{Script=Arabic}\p{M}\u200c ()-]*$/u
const DEVANAGARI_NAME = /^[\p{Script=Devanagari}\p{M}][\p{Script=Devanagari}\p{M}\u200c\u200d ()-]*$/u

/** How a language's table is built. */
export interface Rules {
  /** What a shown name may be written in */
  script: RegExp
  /** Latin script: a name is written only where it differs from the English one (the rest show as they come) */
  latin: boolean
  /** The language's own countries: ISO codes, or a country's first-level region (CH.TI: Ticino, Switzerland's Italian canton) */
  home: readonly string[]
  /** Which towns abroad get their names (by size, fame and rank: `famous`) */
  abroad: (t: TownFacts) => boolean
  /** And a town this large at home */
  homeMinPop: number
  /** And a town this large in the neighbours its readers search most (Ukraine's towns in Russian) */
  near?: { countries: readonly string[]; minPop: number }
  /** First-level regions named: every one at home, and abroad the regions of the countries listed (or all) */
  regionsAbroad: 'all' | readonly string[]
  /** How many of the largest seas and oceans (countryless) get their names */
  waters: number
}

/** What the rules know of a town. */
export interface TownFacts {
  pop: number
  /** How many names it has in other languages in GeoNames: how widely it is known (Venice has 150, Weifang 24) */
  names: number
  capital: boolean
}

/**
 * Abroad, a table names the capitals and the towns that are large and widely known: population alone would spend a
 * script table's bytes on districts of Shanghai and on cities few readers search, and leave out Venice. A Latin table
 * writes only its differing names, so it can name many more.
 */
const LATIN_ABROAD = (t: TownFacts) => t.capital || t.pop >= 1_000_000 || (t.pop >= 100_000 && t.names >= 50) || t.names >= 90
const SCRIPT_ABROAD = (t: TownFacts) => t.capital || t.pop >= 5_000_000 || (t.pop >= 1_000_000 && t.names >= 60) || (t.pop >= 300_000 && t.names >= 90)

/**
 * The thresholds per language, chosen by size (src/imagery/exonymTables.test.ts holds each table to its budget).
 *
 * A Latin table writes only the names that differ from the English (München, not Berlin), so it names every town of
 * 5,000 people at home, the neighbours' towns of 50,000 and the known towns abroad (LATIN_ABROAD) in a few kB. A
 * table in another script writes every name it has, at ~12 bytes compressed a name, so it names what its readers
 * search: the capitals and the large, widely known towns abroad (SCRIPT_ABROAD, ~400), every region at home and the
 * home countries' towns down to a size that fits (Russia's, Belarus's, Kazakhstan's and Kyrgyzstan's of 100,000+;
 * Ukraine's of 10,000+, as docs/i18n/uk.md §4.3 asks; Iran's, Afghanistan's and Tajikistan's of 50,000+; India's of
 * 100,000+), Ukraine's towns of 100,000+ in Russian, the curated landmarks GeoNames knows and the large seas.
 */
export const RULES: Record<Lang, Rules> = {
  de: {
    script: LATIN_NAME,
    latin: true,
    home: ['DE', 'AT', 'CH', 'LI'],
    abroad: LATIN_ABROAD,
    homeMinPop: 5_000,
    near: { countries: ['IT', 'FR', 'BE', 'NL', 'LU', 'DK', 'PL', 'CZ', 'SK', 'HU', 'SI', 'HR'], minPop: 50_000 },
    regionsAbroad: ['IT', 'FR', 'BE', 'NL', 'PL', 'CZ', 'ES', 'GB', 'US', 'RU', 'UA'],
    waters: 40,
  },
  it: {
    script: LATIN_NAME,
    latin: true,
    home: ['IT', 'SM', 'VA', 'CH.TI'],
    abroad: LATIN_ABROAD,
    homeMinPop: 5_000,
    near: { countries: ['CH', 'FR', 'DE', 'AT', 'SI', 'HR', 'ES', 'MT', 'BE', 'GR'], minPop: 50_000 },
    regionsAbroad: ['CH', 'FR', 'DE', 'AT', 'ES', 'BE', 'GB', 'US', 'RU'],
    waters: 40,
  },
  uk: {
    script: CYRILLIC_NAME,
    latin: false,
    home: ['UA'],
    abroad: SCRIPT_ABROAD,
    homeMinPop: 10_000,
    near: { countries: ['RU', 'BY', 'PL', 'MD'], minPop: 500_000 },
    regionsAbroad: [],
    waters: 15,
  },
  ru: {
    script: CYRILLIC_NAME,
    latin: false,
    home: ['RU', 'BY', 'KZ', 'KG'],
    abroad: SCRIPT_ABROAD,
    homeMinPop: 100_000,
    near: { countries: ['UA'], minPop: 100_000 },
    regionsAbroad: ['UA'],
    waters: 15,
  },
  vi: {
    script: LATIN_NAME,
    latin: true,
    home: ['VN'],
    abroad: LATIN_ABROAD,
    homeMinPop: 5_000,
    near: { countries: ['CN', 'LA', 'KH', 'TH'], minPop: 100_000 },
    regionsAbroad: ['CN', 'LA', 'KH', 'US', 'GB'],
    waters: 40,
  },
  fa: { script: PERSIAN_NAME, latin: false, home: ['IR', 'AF', 'TJ'], abroad: SCRIPT_ABROAD, homeMinPop: 50_000, regionsAbroad: [], waters: 15 },
  hi: { script: DEVANAGARI_NAME, latin: false, home: ['IN'], abroad: SCRIPT_ABROAD, homeMinPop: 100_000, regionsAbroad: [], waters: 15 },
}

/** Is a place (its country, and its first-level code `CC.xx`) at home for the language? */
export function atHome(rules: Rules, cc: string, admin1Code: string): boolean {
  return rules.home.some((h) => (h.includes('.') ? h === admin1Code : h === cc))
}

/** Characters the table's format reserves (src/i18n/en/exonyms.ts). */
const RESERVED = /[|;=:*~\n]/

/**
 * Names never shown in any language, whatever GeoNames' flags say: the Soviet-era names it lists as current beside
 * the city's own (Свердловск for Екатеринбург, Днепропетровск for Дніпро), and Bombay in Hindi.
 */
const NEVER = new Set(
  [
    'Ленинград', 'Свердловск', 'Горький', 'Куйбышев', 'Калинин', 'Сталинград', 'Царицын', 'Днепропетровск', 'Дніпропетровськ',
    'Кировоград', 'Кіровоград', 'Артёмовск', 'Артемовск', 'Артемівськ', 'Ворошиловград', 'Жданов', 'Загорск', 'Орджоникидзе',
    'Фрунзе', 'Ленинабад', 'Ленинакан', 'Целиноград', 'Акмола', 'Гурьев', 'Петроград', 'Станислав', 'Станиславов',
    'Станіслав', 'Кировабад', 'Молотов', 'Ворошилов', 'बम्बई', 'बॉम्बे', 'बंबई',
  ].map((n) => n.normalize('NFC')),
)

/**
 * Administrative forms that are not the place's name, per language: a province or county prefix on a Persian town
 * (استان کرمانشاه for Kermanshah), a Russian or Ukrainian settlement type; in a Latin table, the class noun before a
 * name (Thành phố Nam Định, Provinz Nghe An, Provincia di Teheran), which is dropped, so that what is left is the
 * language's own name for the place or nothing new. A script table takes a name with one only if the place has no
 * other (and a region's is its usual form: استان تهران).
 */
const ADMIN_FORM: Partial<Record<Lang, RegExp>> = {
  fa: /^(استان|شهرستان|شهرک|شهرك|شهر|بخش|دهستان|روستای|منطقه|ناحیه|بندر) /u,
  ru: /^(город|посёлок|поселок|село|деревня|станица|пгт|аул) /iu,
  uk: /^(місто|селище|село) /iu,
  vi: /^(thành phố|tp\.?|thị xã|thị trấn|tỉnh|huyện|quận|xã|phường) /iu,
  de: /^(Bundesstaat|Bundesland|Provinz|Präfektur|Distrikt|Departement|Département|Gouvernement|Gouvernorat|Woiwodschaft|Kanton|Region|Republik|Staat|Emirat|Bezirk|Landkreis|Kreis|Gemeinde|Stadt|Municipio) /u,
  it: /^(Provincia|Regione|Stato|Distretto|Divisione|Dipartimento|Governatorato|Prefettura|Cantone|Canton|Repubblica|Contea|Voivodato|Città-Stato|Città metropolitana|Comune|Municipio|Emirato)( autonoma| autonomo| federale)?( di| del| della| dello| dei| degli| delle| dell[’']|d[’'])? ?/iu,
}

/**
 * A Persian region is named bare in a where line, as an Iranian or Afghan address writes it (کرج، البرز، ایران): GeoNames
 * writes some with استان (province) or ولایت (Afghan province) and some without.
 */
const PERSIAN_REGION = /^(استان|ولایت) /u

/**
 * Names a language never takes for a place abroad: in Italian, a scholarly transliteration of a Cyrillic name (Iževsk,
 * Charkiv, Tjumen'), which is no Italian name; Italian has one only where it is a word of its own (Leopoli, Mosca).
 */
const FOREIGN_FORM: Partial<Record<Lang, RegExp>> = { it: /[čšžČŠŽ]|(?<!Oblast)'(?= |$)/u }

/** A Vietnamese letter: it tells a Vietnamese name for a foreign place (Luân Đôn, Bắc Kinh) from the place's own (Moskva). */
const VIETNAMESE = /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/iu

const marks = (s: string) => (s.normalize('NFD').match(/\p{M}/gu) ?? []).length
/** Is the key `inner` a whole-word run of the key `outer`? */
const within = (inner: string, outer: string) => ` ${outer} `.includes(` ${inner} `)

/**
 * In a Latin table, is `shown` worth writing for a place the data spells `english`? Not if it only drops or changes
 * accents (Bien Hoa for Biên Hòa, Hué for Huế, Ōsaka for Osaka), or only adds or drops words around the same name
 * (Präfektur Kanagawa, New York City for New York, Washington for Washington D.C.), or abbreviates (St. Augustin):
 * those are spellings, not the language's own name. Dropping an English class word is (Nghệ An for Nghệ An Province),
 * and so, at home, is adding the language's accents (Đà Nẵng for Da Nang, Zürich for Zurich).
 */
export function latinWorthWriting(english: string, shown: string, home: boolean): boolean {
  const a = placeKey(english)
  const b = placeKey(shown)
  if (!a || !b || (shown.includes('.') && !english.includes('.'))) return false
  if (a === b) return home && marks(shown) > marks(english)
  // Dropping an English class word is the language's own name (Nghệ An for Nghệ An Province, Gent for Ghent City).
  if (within(b, a)) return ENGLISH_CLASS.test(` ${a} `.replace(` ${b} `, ' ').trim())
  return !within(a, b)
}

/** The English class words around a place's name in the data (Nghệ An Province, Kyiv City, Moscow Oblast). */
const ENGLISH_CLASS = /^((province|city|region|district|oblast|governorate|prefecture|state|municipality|county|division|krai|kray|republic|of|the) ?)+$/

/** Persian writes Persian letters: Arabic ي and ك become ی and ک, the tatweel goes, and the vowel marks too. */
export function persianForm(s: string): string {
  return s
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ـ/g, '')
    .replace(/[\u064b-\u0652\u0670]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Ukrainian writes its apostrophe as ’ (U+2019): the faces cannot draw ʼ (U+02BC), and ' is a typewriter's. */
const ukApostrophe = (s: string) => s.replace(/['ʼ]/g, '’')

/**
 * A name as the language's table writes it: Unicode normalization, Persian letter forms, the Cyrillic apostrophe, no
 * stress marks (GeoNames marks the stress on a few names), and a region's class word in lower case as Russian and
 * Ukrainian write it (GeoNames writes «Свердловская Область»).
 */
export function cleanName(name: string, lang: Lang): string {
  const s = name.normalize('NFC').trim()
  if (lang === 'fa') return persianForm(s)
  if (lang === 'uk' || lang === 'ru')
    return ukApostrophe(s)
      .replace(/[\u0300\u0301]/g, '')
      .replace(/ (Область|Край|Округ|Автономный Округ|Автономна Республіка)(?= |$)/gu, (w) => w.toLowerCase())
  return s
}

/** Has the name vowel marks (Persian harakat), so a plain spelling should be preferred? */
const VOCALIZED = /[\u064b-\u0652\u0670]/

/**
 * A language's name for a place among its alternate names in that language: the preferred one, else the first that
 * is neither short nor flagged, else a short one; never a historic or colloquial name, and only one `ok` accepts.
 * A name `penalty` marks (an administrative form, a vocalized spelling) is taken only if nothing else is left.
 * `region`: a first-level region in a Latin table, whose short name is its usual one (Bayern, Tessin), not an
 * abbreviation (a Russian region's short name drops its class word: Челябинская).
 */
export function pickName(
  alts: readonly AltName[] | undefined,
  ok: (name: string) => boolean,
  penalty: (name: string) => boolean = () => false,
  region = false,
): string | undefined {
  const usable = (alts ?? []).filter((a) => !a.historic && !a.colloquial && ok(a.name))
  const plain = usable.filter((a) => !penalty(a.name))
  const order = region
    ? [plain.filter((a) => a.preferred && a.short), plain.filter((a) => a.short), plain.filter((a) => a.preferred), plain, usable]
    : [plain.filter((a) => a.preferred), plain.filter((a) => !a.short), usable.filter((a) => a.preferred), usable.filter((a) => !a.short), usable]
  for (const list of order) if (list.length) return list[0].name
  return undefined
}

/**
 * A display name as the table writes it, or undefined if the language has none for the place. `home`: the place is
 * in one of the language's own countries (abroad, a Vietnamese name must be Vietnamese: Luân Đôn, not Moskva). `cc`:
 * its country (GeoNames writes some Vietnamese places' Đ as GJ in other languages: GJien Bien).
 */
export function displayName(alts: readonly AltName[] | undefined, lang: Lang, { region = false, home = false, cc = '' } = {}): string | undefined {
  const rules = RULES[lang]
  const admin = ADMIN_FORM[lang]
  // A vocalized spelling (Persian vowel marks: س\u0650ن\u064e\u0651) is a dictionary's, not a map's: taken only if nothing plain is left,
  // and judged before cleanName strips the marks (سن\u0651 without them is another word).
  const plain = (alts ?? []).filter((a) => !VOCALIZED.test(a.name))
  let usable = (plain.some((a) => !a.historic && !a.colloquial) ? plain : (alts ?? [])).map((a) => ({ ...a, name: cleanName(a.name, lang) }))
  if (rules.latin && admin) usable = usable.map((a) => ({ ...a, name: a.name.replace(admin, '').trim() }))
  if (lang === 'fa' && region) usable = usable.map((a) => ({ ...a, name: a.name.replace(PERSIAN_REGION, '') }))
  const foreign = home ? undefined : FOREIGN_FORM[lang]
  const picked = pickName(
    usable,
    (n) =>
      !!n &&
      rules.script.test(n) &&
      !RESERVED.test(n) &&
      !NEVER.has(n) &&
      (lang !== 'vi' || home || VIETNAMESE.test(n)) &&
      !(cc === 'VN' && /G[Jj]/.test(n)) &&
      !foreign?.test(n),
    (n) => !rules.latin && !region && !!admin?.test(n),
    region && rules.latin,
  )
  if (!picked) return undefined
  // A name GeoNames writes in lower case ("oblast' di Zaporižžja") starts a label with a capital.
  return picked.charAt(0).toLocaleUpperCase(lang) + picked.slice(1)
}

/** A place a table may name: its English spellings (the data's), and what it is. */
export interface Named {
  /** The English spellings the data may carry: GeoNames' own name first (the offline list's), then its English name */
  english: readonly string[]
  cc: string
  region: boolean
  /** People (a region's: its towns'), for the order and for namesakes */
  pop: number
  /** In one of the language's own countries */
  home?: boolean
}

/** One key of a table being built: the data's spellings, the name shown (null: ambiguous), and its people. */
export interface Entry {
  spellings: Set<string>
  shown: string | null
  pop: number
  /** In one of the language's own countries */
  home: boolean
}
/** A table being built: by country, then by key (`*` before a region's). */
export type DisplayTable = Map<string, Map<string, Entry>>

const keyOf = (english: string, region: boolean) => `${region ? '*' : ''}${placeKey(english)}`

/**
 * Add a place's name to a table, under each of its English spellings' keys. Where another place in the same country
 * has the same key and another name, the key names neither (`shown` null): the label could be either.
 */
export function addDisplay(table: DisplayTable, place: Named, shown: string) {
  let country = table.get(place.cc)
  if (!country) table.set(place.cc, (country = new Map()))
  for (const english of place.english) {
    if (!placeKey(english) || RESERVED.test(english)) continue
    const key = keyOf(english, place.region)
    const had = country.get(key)
    if (!had) country.set(key, { spellings: new Set([english]), shown, pop: place.pop, home: !!place.home })
    else {
      had.spellings.add(english)
      had.pop = Math.max(had.pop, place.pop)
      if (had.shown !== shown) had.shown = null
    }
  }
}

/**
 * A place too small for the table (`shown`: its own name in the language, if it has one): a key it shares with a
 * place in the table, in the same country, names neither if their names differ and the namesake is not tiny beside
 * it (a tenth of its people or more). A namesake with no name in the language is presumed to share the larger
 * place's, and so is a hamlet (Hanoi has a namesake of no people that GeoNames calls Lâm in Vietnamese).
 */
export function addNamesake(table: DisplayTable, place: Named, shown: string | undefined) {
  const country = table.get(place.cc)
  if (!country || shown === undefined) return
  for (const english of place.english) {
    const had = country.get(keyOf(english, place.region))
    if (had && had.shown !== null && had.shown !== shown && place.pop * 10 >= had.pop) had.shown = null
  }
}

/** A search-only name (ALIASES): finds a place, never shown. */
export interface Alias {
  cc: string
  english: string
  alias: string
}

/**
 * The table as src/i18n/en/exonyms.ts describes it, by country (the countries with the largest places first, the
 * countryless names last), each country's names largest first, so a search ranks by the order: a key's entry only if
 * it names one place and some spelling of it in the data is worth the bytes (in a Latin table, latinWorthWriting:
 * Zurich for Zürich at home; in a script table, any spelling), written under that spelling.
 */
export function serializeDisplay(table: DisplayTable, latin: boolean, aliases: readonly Alias[] = []): string {
  const groups: { cc: string; top: number; entries: string[] }[] = []
  const countries = new Set([...table.keys(), ...aliases.map((a) => a.cc)])
  for (const cc of countries) {
    const rows: { pop: number; text: string }[] = []
    const here = table.get(cc)
    for (const [key, e] of here ?? []) {
      // A region named like a town of the same country, and shown alike (Moscow, the city and the federal city), needs
      // no entry of its own: a part of the where line falls back to the towns (src/imagery/exonyms.ts).
      if (e.shown === null || (key.startsWith('*') && here?.get(key.slice(1))?.shown === e.shown)) continue
      const shown = e.shown
      const english = [...e.spellings].find((s) => (latin ? latinWorthWriting(s, shown, e.home) : placeKey(s) !== placeKey(shown)))
      if (english === undefined) continue
      rows.push({ pop: e.pop, text: `${key.startsWith('*') ? '*' : ''}${english}=${e.shown}` })
    }
    rows.sort((a, b) => b.pop - a.pop)
    const entries = rows.map((r) => r.text)
    for (const a of aliases) if (a.cc === cc && !RESERVED.test(a.english + a.alias)) entries.push(`~${a.english}=${a.alias}`)
    if (entries.length) groups.push({ cc, top: cc ? (rows[0]?.pop ?? 0) : -1, entries })
  }
  groups.sort((a, b) => b.top - a.top || a.cc.localeCompare(b.cc))
  return groups.map((g) => `${g.cc}:${g.entries.join(';')}`).join('|')
}

// ── Curated names ────────────────────────────────────────────────────────────────────────

/**
 * Names fixed by hand, by GeoNames id (a town, a landmark's feature), by first-level code (`UA.01`), or by
 * `<CC>:<English name>` for a name the data gives in that country (a curated landmark's, scripts/landmarks.ts),
 * `:<English name>` for a place with no country (a sea). An empty name removes the entry: the place shows as it
 * comes. Each says why.
 *
 * The landmarks' names were read in every language (2026-11-22): GeoNames matched a few to a neighbour (Mecca to the
 * Kaaba, the Moai to Easter Island, LAX to Los Angeles), and spells a few as an import from the US gazetteer would
 * (Деас Вэлли for Death Valley); those are written here.
 */
export const OVERRIDES: Record<Lang, Record<string, string>> = {
  /**
   * German: Ukraine's oblasts and capital as docs/i18n/de.md §8 writes them (Kyjiw, Oblast Kyjiw: GeoNames mixes Kiew and
   * city names), Spain's and France's regions by their German names (GeoNames has Nordkastilien, Neuguitanien), the
   * Klagemauer; names GeoNames gives that are old, ancient or another language's are removed (Haltern in Westfalen,
   * Tralleis, Gäncä, Merath), and Aarhus is spelt so since 2011.
   */
  de: {
    'UA.02': 'Oblast Tschernihiw',
    'UA.05': 'Oblast Donezk',
    'UA.07': 'Oblast Charkiw',
    'UA.12': 'Kyjiw',
    'UA.13': 'Oblast Kyjiw',
    'UA.15': 'Oblast Lwiw',
    'UA.19': 'Oblast Riwne',
    'UA.27': 'Oblast Schytomyr',
    'ES.55': 'Kastilien und León',
    'ES.54': 'Kastilien-La Mancha',
    'ES.34': 'Asturien',
    'ES.32': 'Navarra',
    'FR.75': 'Nouvelle-Aquitaine',
    'IL:Western Wall': 'Klagemauer',
    'DK:Aarhus': '',
    'DE:Haltern am See': '',
    'DE:Burgdorf, Hanover': '',
    'DE:Heppenheim an der Bergstrasse': '',
    'DE:Rotenburg (Wümme)': '',
    'TR:Aydın': '',
    'TR:Afyonkarahisar': '',
    'KG:Manas': '',
    'AZ:Ganja': '',
    'UZ:Samarkand': '',
    'IN:Meerut': '',
    'IN:Howrah': '',
  },
  /**
   * Italian: France's new regions by their Italian names (GeoNames has the provisional ones: Nord-Passo di
   * Calais-Piccardia), Flanders, Togliatti; ancient and colonial names removed (Iconio, Tralli, Gimma, Poona), and a
   * label never takes an article (Pentagono, not Il Pentagono).
   */
  it: {
    'FR.32': 'Alta Francia',
    'FR.75': 'Nuova Aquitania',
    'FR.44': '',
    'BE:*Flanders': 'Fiandre',
    'BE:*Flemish Region': 'Fiandre',
    'RU:*Mariy-El Republic': '',
    'RU:Tolyatti': 'Togliatti',
    'US:Pentagon': 'Pentagono',
    'CA:CN Tower': '',
    'TR:Kayseri': '',
    'TR:Konya': '',
    'TR:Antakya': '',
    'TR:Aydın': '',
    'TR:Edirne': '',
    'IN:Pune': '',
    'ET:Jimma': '',
    'IT:Lido di Jesolo': '',
    'IT:Cerese': '',
    /** Ukraine's towns as the gazetteer gives them (docs/i18n/it.md §8: Kyiv, Kharkiv, Odesa), Italian's own exonyms kept. */
    'UA:Kharkiv': '',
    'UA:Donetsk': '',
    'UA:Kremenchuk': '',
    'UA:Chernivtsi': '',
  },
  /**
   * Ukraine's first-level names as its Constitution lists them (docs/i18n/uk.md §4.3: official names are never
   * "corrected": the city is Дніпро, the oblast still Дніпропетровська). GeoNames' own Ukrainian names capitalise
   * «Область» and call Crimea «Республіка Крим».
   */
  uk: {
    'UA.01': 'Черкаська область',
    'UA.02': 'Чернігівська область',
    'UA.03': 'Чернівецька область',
    'UA.04': 'Дніпропетровська область',
    'UA.05': 'Донецька область',
    'UA.06': 'Івано-Франківська область',
    'UA.07': 'Харківська область',
    'UA.08': 'Херсонська область',
    'UA.09': 'Хмельницька область',
    'UA.10': 'Кіровоградська область',
    'UA.11': 'Автономна Республіка Крим',
    'UA.12': 'місто Київ',
    'UA.13': 'Київська область',
    'UA.14': 'Луганська область',
    'UA.15': 'Львівська область',
    'UA.16': 'Миколаївська область',
    'UA.17': 'Одеська область',
    'UA.18': 'Полтавська область',
    'UA.19': 'Рівненська область',
    'UA.20': 'місто Севастополь',
    'UA.21': 'Сумська область',
    'UA.22': 'Тернопільська область',
    'UA.23': 'Вінницька область',
    'UA.24': 'Волинська область',
    'UA.25': 'Закарпатська область',
    'UA.26': 'Запорізька область',
    'UA.27': 'Житомирська область',
    'TR:Hagia Sophia': 'Айя-Софія',
    'IN:Taj Mahal': 'Тадж-Махал',
    'CL:Moai': 'Моаї',
    'AE:Dubai International Airport': 'Міжнародний аеропорт Дубай',
    'CA:Pearson Airport': 'Міжнародний аеропорт Торонто-Пірсон',
    'CH:Matterhorn': 'Маттерхорн',
    'GF:Guiana Space Centre': 'Гвіанський космічний центр',
    /** Towns renamed since 2016 that GeoNames still names in Ukrainian by their Soviet names (Красний Луч, Щорс). */
    'UA:Khrustalnyi': 'Хрустальний',
    'UA:Sheptytskyi': 'Шептицький',
    'UA:Khrestivka': 'Хрестівка',
    'UA:Holubivka': 'Голубівка',
    'UA:Snovsk': 'Сновськ',
    'UA:Chystyakove': 'Чистякове',
    'UA:Khanzhonkivskyi': '',
    'RU:Yekaterinburg': 'Єкатеринбург',
    "BY:Homyel'": 'Гомель',
  },
  /**
   * Russian: Ukraine's oblasts by their standard Russian names (docs/i18n/ru.md §8: Днепропетровская, Кировоградская;
   * Crimea is Крым, in Ukraine, with no «Республика»: that is the occupying administration's name), and Sevastopol.
   */
  ru: {
    'UA.01': 'Черкасская область',
    'UA.02': 'Черниговская область',
    'UA.03': 'Черновицкая область',
    'UA.04': 'Днепропетровская область',
    'UA.05': 'Донецкая область',
    'UA.06': 'Ивано-Франковская область',
    'UA.07': 'Харьковская область',
    'UA.08': 'Херсонская область',
    'UA.09': 'Хмельницкая область',
    'UA.10': 'Кировоградская область',
    'UA.11': 'Крым',
    'UA.12': 'Киев',
    'UA.13': 'Киевская область',
    'UA.14': 'Луганская область',
    'UA.15': 'Львовская область',
    'UA.16': 'Николаевская область',
    'UA.17': 'Одесская область',
    'UA.18': 'Полтавская область',
    'UA.19': 'Ровенская область',
    'UA.20': 'Севастополь',
    'UA.21': 'Сумская область',
    'UA.22': 'Тернопольская область',
    'UA.23': 'Винницкая область',
    'UA.24': 'Волынская область',
    'UA.25': 'Закарпатская область',
    'UA.26': 'Запорожская область',
    'UA.27': 'Житомирская область',
    /** Brasília is Бразилиа (GeoNames gives it the country's name, Бразилия). */
    3469058: 'Бразилиа',
    'SA:Mecca': 'Мекка',
    'CL:Moai': 'Моаи',
    'TR:Hagia Sophia': 'Айя-София',
    'AE:Dubai International Airport': 'Международный аэропорт Дубай',
    'GF:Guiana Space Centre': 'Гвианский космический центр',
    'US:Vandenberg Space Force Base': 'База Ванденберг',
    'US:Yosemite Valley': 'Долина Йосемити',
    'US:Death Valley': 'Долина Смерти',
    'US:LAX': '',
    'US:Golden Gate Park': '',
    'PK:K2': '',
    'OM:Strait of Hormuz': 'Ормузский пролив',
    /** Regions in full, where GeoNames abbreviates or uses a colloquial name (Ставрополье, Ямало-Ненецкий АО). */
    'RU.70': 'Ставропольский край',
    'RU.29': 'Кемеровская область',
    'RU.64': 'Сахалинская область',
    'RU.87': 'Ямало-Ненецкий автономный округ',
    'RU.89': 'Еврейская автономная область',
    'RU.50': 'Ненецкий автономный округ',
    'RU.15': 'Чукотский автономный округ',
  },
  /**
   * Vietnamese: the 34 provinces and cities since the 2025 merger by their Vietnamese names (GeoNames has few, and
   * writes the new ones in ASCII), bare as a where line writes them (Nghệ An, not Tỉnh Nghệ An); Ho Chi Minh City by
   * its official name, as the task and docs/i18n/vi.md write it. The East Sea and its islands by their Vietnamese names
   * on Vietnamese pages, display only, as Korean shows 동해 (vi.md §8; flagged to the owner): countryless, and in the
   * countries the data files them under.
   */
  vi: {
    'VN.01': 'Hà Nội',
    'VN.04': 'Cao Bằng',
    'VN.08': 'Tuyên Quang',
    'VN.11': 'Điện Biên',
    'VN.12': 'Lai Châu',
    'VN.14': 'Sơn La',
    'VN.15': 'Lào Cai',
    'VN.19': 'Thái Nguyên',
    'VN.20': 'Lạng Sơn',
    'VN.22': 'Quảng Ninh',
    'VN.24': 'Bắc Ninh',
    'VN.25': 'Phú Thọ',
    'VN.31': 'Hải Phòng',
    'VN.33': 'Hưng Yên',
    'VN.37': 'Ninh Bình',
    'VN.38': 'Thanh Hóa',
    'VN.40': 'Nghệ An',
    'VN.42': 'Hà Tĩnh',
    'VN.44': 'Quảng Trị',
    'VN.46': 'Huế',
    'VN.48': 'Đà Nẵng',
    'VN.51': 'Quảng Ngãi',
    'VN.52': 'Gia Lai',
    'VN.56': 'Khánh Hòa',
    'VN.66': 'Đắk Lắk',
    'VN.68': 'Lâm Đồng',
    'VN.75': 'Đồng Nai',
    'VN.79': 'Thành phố Hồ Chí Minh',
    'VN.80': 'Tây Ninh',
    'VN.82': 'Đồng Tháp',
    'VN.86': 'Vĩnh Long',
    'VN.91': 'An Giang',
    'VN.92': 'Cần Thơ',
    'VN.96': 'Cà Mau',
    1566083: 'Thành phố Hồ Chí Minh',
    ':South China Sea': 'Biển Đông',
    'VN:South China Sea': 'Biển Đông',
    'TH:South China Sea': 'Biển Đông',
    ':Paracel Islands': 'Quần đảo Hoàng Sa',
    ':Xisha Islands': 'Quần đảo Hoàng Sa',
    ':Spratly Islands': 'Quần đảo Trường Sa',
    ':Nansha Islands': 'Quần đảo Trường Sa',
    'FR:Mont Blanc': '',
    /** Modern Vietnamese writes these as their own names (Busan, Incheon, Pleiku), not as old Sino-Vietnamese ones. */
    'KR:Busan': '',
    'KR:Incheon': '',
    'KR:Daegu': '',
    'VN:Pleiku': '',
    'NZ:Lower Hutt': '',
    'US:Palm Desert': '',
    'KH:*Kampot': '',
  },
  /**
   * Persian: Delhi is دهلی (GeoNames' first Persian name for it is Old Delhi), Gorgan گرگان; the Persian Gulf is
   * خلیج فارس wherever the data names it, by either name (fa.md §8.4: never any other name).
   */
  fa: {
    1273294: 'دهلی',
    132892: 'گرگان',
    ':Persian Gulf': 'خلیج فارس',
    ':Arabian Gulf': 'خلیج فارس',
    'SA:Mecca': 'مکه',
    'CL:Moai': 'موآی',
    /**
     * Iranian towns GeoNames names in Persian by something else: a quarantine, a construction site, a castle, a former
     * name (قرنطینۀ کمال آباد, محل احداث شهرک مسکونی پرند, قلعۀ مریوان, اشرف), or misspelt (امروجان for Borujen).
     */
    'IR:Kamālshahr': 'کمال\u200cشهر',
    'IR:Marīvān': 'مریوان',
    'IR:Shahr-e Ṣadrā': 'صدرا',
    'IR:Pardīs': 'پردیس',
    'IR:Shahrak-e Pardīsān': '',
    'IR:Parand': 'پرند',
    'IR:Behshahr': 'بهشهر',
    'IR:Bāqershahr': 'باقرشهر',
    'IR:Meshkīn Dasht': 'مشکین\u200cدشت',
    'IR:Ṣāleḥīeh': 'صالحیه',
    'IR:Borūjen': 'بروجن',
    'IR:Dehdasht': 'دهدشت',
    'IR:Şabbāshahr': 'صباشهر',
    'IR:Borāzjān': 'برازجان',
    'IR:Mehestan': 'مهستان',
    'IR:Tūyserkān': 'تویسرکان',
    'IR:Būmahen': 'بومهن',
    'AF:Ghazni': 'غزنی',
  },
  /**
   * Hindi: the modern official names where GeoNames' first Hindi name is the old one (मुंबई, not बम्बई; बेंगलुरु, not
   * बंगलौर; प्रयागराज, not इलाहाबाद), the common spellings of Moscow and Paris, and the states and territories it has no
   * Hindi name for, in the Central Hindi Directorate's spelling (anusvara: झारखंड, आंध्र प्रदेश).
   */
  hi: {
    1275339: 'मुंबई',
    1277333: 'बेंगलुरु',
    1278994: 'प्रयागराज',
    1261731: 'नासिक',
    524901: 'मॉस्को',
    2988507: 'पेरिस',
    'IN.21': 'ओडिशा',
    'IN.14': 'लक्षद्वीप',
    'IN.52': 'दादरा और नगर हवेली और दमन और दीव',
    'IN.02': 'आंध्र प्रदेश',
    'IN.38': 'झारखंड',
    'IN.20': 'नागालैंड',
    'IN.05': 'चंडीगढ़',
    'IN.25': 'तमिलनाडु',
    'IN.01': 'अंडमान और निकोबार द्वीपसमूह',
    'GB:Stonehenge': 'स्टोनहेंज',
    'US:Mount Rainier': 'माउंट रेनियर',
    'PK:K2': 'के2',
    'CL:Moai': 'मोआई',
    'ES:Alhambra': 'अलहम्ब्रा',
    /** Modern official names where GeoNames' Hindi one is the old (गुलबर्ग, मैंगलूर, बेलगाँव), and a few misspellings. */
    'IN:Puducherry': 'पुदुच्चेरी',
    'IN:Kalaburagi': 'कलबुर्गी',
    'IN:Mangaluru': 'मंगलुरु',
    'IN:Belagavi': 'बेलगावी',
    'IN:Mysuru': 'मैसूरु',
    'IN:Shivamogga': 'शिवमोग्गा',
    'IN:Ballari': 'बल्लारी',
    'IN:Korba': 'कोरबा',
    'IN:Gondiā': 'गोंदिया',
    'IN:Malda': 'मालदा',
    'IN:Gangtok': 'गंगटोक',
    'IN:Kozhikode': 'कोझिकोड',
    'RU:Rostov-on-Don': 'रोस्तोव-ऑन-डॉन',
  },
}

/**
 * Search-only names, by GeoNames id: what people type for a place whose shown name is another (Sài Gòn for Ho Chi Minh
 * City, colloquial and never shown, docs/i18n/vi.md). Never displayed.
 */
export const ALIASES: Record<Lang, Record<string, readonly string[]>> = {
  de: {},
  it: {},
  uk: {},
  ru: { 498817: ['Петербург', 'Питер'] },
  vi: { 1566083: ['Sài Gòn', 'Hồ Chí Minh', 'TP Hồ Chí Minh', 'TPHCM'] },
  fa: {},
  hi: { 1275339: ['बम्बई', 'बंबई'], 1277333: ['बंगलौर'], 1278994: ['इलाहाबाद'] },
}
