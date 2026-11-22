/**
 * The generated place-name tables (src/i18n/<locale>/exonyms.gen.ts) and the rules that choose their names
 * (scripts/exonyms.ts): the choices pinned on small cases, then the committed tables held to their size budget (owner
 * rule: costs nothing, stays fast) and to the names the languages' guides decide.
 */
import { describe, expect, it } from 'vitest'
import {
  addDisplay,
  addNamesake,
  cleanName,
  displayName,
  latinWorthWriting,
  persianForm,
  pickName,
  serializeDisplay,
  type AltName,
  type DisplayTable,
} from '../../scripts/exonyms'
import de from '@/i18n/de/exonyms.gen'
import it_ from '@/i18n/it/exonyms.gen'
import uk from '@/i18n/uk/exonyms.gen'
import ru from '@/i18n/ru/exonyms.gen'
import vi from '@/i18n/vi/exonyms.gen'
import fa from '@/i18n/fa/exonyms.gen'
import hi from '@/i18n/hi/exonyms.gen'
import { parseExonyms } from './exonyms'

const alt = (name: string, flags = ''): AltName => ({
  name,
  preferred: flags.includes('P'),
  short: flags.includes('S'),
  colloquial: flags.includes('C'),
  historic: flags.includes('H'),
})

describe('choosing a name', () => {
  it('takes the preferred name, else the first plain one, else a short one; never a historic or colloquial one', () => {
    const any = () => true
    expect(pickName([alt('Muenchen'), alt('München', 'P')], any)).toBe('München')
    expect(pickName([alt('СПб', 'S'), alt('Ленинград', 'H'), alt('Питер', 'C'), alt('Санкт-Петербург')], any)).toBe('Санкт-Петербург')
    expect(pickName([alt('TPHCM', 'S')], any)).toBe('TPHCM')
    expect(pickName([alt('Sài Gòn', 'H')], any)).toBeUndefined()
    // A first-level region in a Latin table: its short name is its usual one.
    expect(pickName([alt('Kanton Tessin', 'P'), alt('Tessin', 'S')], any, undefined, true)).toBe('Tessin')
  })

  it('writes each language in its own script and forms', () => {
    expect(displayName([alt('Moskva'), alt('Москва', 'P')], 'ru')).toBe('Москва')
    expect(displayName([alt('Bakhmut'), alt('Бахмут', 'P')], 'uk')).toBe('Бахмут')
    expect(displayName([alt("Кам'янське")], 'uk')).toBe('Кам’янське') // the apostrophe the faces draw
    expect(displayName([alt('Свердловская Область')], 'ru', { region: true })).toBe('Свердловская область')
    expect(displayName([alt('Свердловск'), alt('Екатеринбург')], 'ru')).toBe('Екатеринбург') // never the Soviet name
    expect(displayName([alt('बम्बई'), alt('मुंबई')], 'hi')).toBe('मुंबई')
    expect(displayName([alt('Paris')], 'hi')).toBeUndefined()
  })

  it('writes Persian letters, prefers a plain spelling and the town over its province', () => {
    expect(persianForm('كاشان')).toBe('کاشان')
    expect(persianForm('تِهران')).toBe('تهران')
    expect(displayName([alt('استان کرمانشاه'), alt('کرمانشاه')], 'fa')).toBe('کرمانشاه')
    expect(displayName([alt('سِنَّ'), alt('سنندج')], 'fa')).toBe('سنندج') // not سن, the vowel marks stripped
    expect(displayName([alt('استان تهران')], 'fa', { region: true })).toBe('تهران')
    expect(cleanName('يزد', 'fa')).toBe('یزد')
  })

  it('drops a Vietnamese class noun, and abroad takes only a Vietnamese name', () => {
    expect(displayName([alt('Thành Phố Nam Định')], 'vi', { home: true })).toBe('Nam Định')
    expect(displayName([alt('Luân Đôn')], 'vi')).toBe('Luân Đôn')
    expect(displayName([alt('Moskva')], 'vi')).toBeUndefined()
    expect(displayName([alt('GJien Bien')], 'de', { cc: 'VN' })).toBeUndefined()
  })

  it('in a Latin table, writes a name only where it is the language’s own', () => {
    expect(latinWorthWriting('Munich', 'München', false)).toBe(true)
    expect(latinWorthWriting('Biên Hòa', 'Bien Hoa', false)).toBe(false) // accents dropped
    expect(latinWorthWriting('Osaka', 'Ōsaka', false)).toBe(false) // accents added abroad
    expect(latinWorthWriting('Da Nang', 'Đà Nẵng', true)).toBe(true) // and at home
    expect(latinWorthWriting('Kanagawa', 'Präfektur Kanagawa', false)).toBe(false)
    expect(latinWorthWriting('New York', 'New York City', false)).toBe(false)
    expect(latinWorthWriting('Nghệ An Province', 'Nghệ An', true)).toBe(true) // an English class word dropped
    expect(latinWorthWriting('Sankt Augustin', 'St. Augustin', true)).toBe(false)
    // An Italian name for a place abroad is never a scholarly transliteration.
    expect(displayName([alt('Čerkasy')], 'it')).toBeUndefined()
    expect(displayName([alt('Leopoli')], 'it')).toBe('Leopoli')
    expect(displayName([alt('Città del Messico')], 'it')).toBe('Città del Messico')
    expect(displayName([alt('Provincia di Teheran')], 'it', { region: true })).toBe('Teheran')
  })
})

describe('building a table', () => {
  it('names a key only if every place under it in the country shares the name', () => {
    const t: DisplayTable = new Map()
    addDisplay(t, { english: ['Kyiv', 'Kiev'], cc: 'UA', region: false, pop: 2_900_000 }, 'Київ')
    addDisplay(t, { english: ['Kyiv City'], cc: 'UA', region: true, pop: 2_900_000 }, 'місто Київ')
    addDisplay(t, { english: ['Troitsk'], cc: 'RU', region: false, pop: 60_000 }, 'Троицк')
    addDisplay(t, { english: ['Troitsk'], cc: 'RU', region: false, pop: 70_000 }, 'Троицк')
    addDisplay(t, { english: ['Novyi'], cc: 'UA', region: false, pop: 20_000 }, 'Новий')
    addDisplay(t, { english: ['Novyi'], cc: 'UA', region: false, pop: 30_000 }, 'Нове')
    // A namesake too small for the table: a hamlet never takes a city's name away; a town its size does.
    addDisplay(t, { english: ['Hanoi'], cc: 'VN', region: false, pop: 8_000_000 }, 'Hà Nội')
    addNamesake(t, { english: ['Hanoi'], cc: 'VN', region: false, pop: 0 }, 'Lâm')
    addDisplay(t, { english: ['Oleksandriia'], cc: 'UA', region: false, pop: 80_000 }, 'Олександрія')
    addNamesake(t, { english: ['Oleksandriia'], cc: 'UA', region: false, pop: 50_000 }, 'Александрия')
    expect(serializeDisplay(t, false, [{ cc: 'UA', english: 'Kyiv', alias: 'Київ-місто' }])).toBe(
      'VN:Hanoi=Hà Nội|UA:Kyiv=Київ;Kiev=Київ;*Kyiv City=місто Київ;~Kyiv=Київ-місто|RU:Troitsk=Троицк',
    )
    // The largest country first, each country's names largest first; a key two names claim is left out (Novyi).
    expect(serializeDisplay(t, true)).toMatch(/^VN:Hanoi=Hà Nội\|/)
  })
})

/** The committed tables, compressed as a browser fetches them (gzip). */
const TABLES = { de, it: it_, uk, ru, vi, fa, hi }
const gzip = async (s: string) => (await new Response(new Blob([s]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer()).byteLength

describe('the generated tables', () => {
  it('stay within their budget: a chunk of its own up to 12 KiB compressed, one in the language’s chunk up to 5 KiB', async () => {
    const lazy = new Set(['de', 'uk', 'ru', 'fa', 'hi'])
    for (const [lang, src] of Object.entries(TABLES)) {
      const size = await gzip(src)
      expect({ lang, fits: size <= (lazy.has(lang) ? 12 * 1024 : 5 * 1024) }).toEqual({ lang, fits: true })
    }
  })

  it('parse whole, with no reserved character inside a name', () => {
    for (const src of Object.values(TABLES)) {
      const t = parseExonyms(src)
      expect(t.towns.size + t.regions.size).toBeGreaterThan(200)
      for (const group of src.split('|')) for (const entry of group.slice(group.indexOf(':') + 1).split(';')) expect(entry.split('=')).toHaveLength(2)
    }
  })

  it('name the places each language’s guide decides', () => {
    const name = (src: string, cc: string, english: string, region = false) => parseExonyms(src)[region ? 'regions' : 'towns'].get(`${cc}|${english.toLowerCase()}`)
    expect([name(de, 'DE', 'munich'), name(de, 'IT', 'milan'), name(de, 'RU', 'moscow'), name(de, 'UA', 'kyiv')]).toEqual(['München', 'Mailand', 'Moskau', 'Kyjiw'])
    expect([name(it_, 'DE', 'munich'), name(it_, 'GB', 'london'), name(it_, 'RU', 'moscow'), name(it_, 'CN', 'beijing')]).toEqual([
      'Monaco di Baviera',
      'Londra',
      'Mosca',
      'Pechino',
    ])
    expect([name(uk, 'UA', 'kyiv'), name(uk, 'UA', 'kharkiv'), name(uk, 'UA', 'lviv'), name(uk, 'RU', 'moscow'), name(uk, 'UA', 'crimea', true)]).toEqual([
      'Київ',
      'Харків',
      'Львів',
      'Москва',
      'Автономна Республіка Крим',
    ])
    expect([name(ru, 'UA', 'kyiv'), name(ru, 'UA', 'kharkiv'), name(ru, 'UA', 'odesa'), name(ru, 'UA', 'dnipro'), name(ru, 'UA', 'crimea', true)]).toEqual([
      'Киев',
      'Харьков',
      'Одесса',
      'Днепр',
      'Крым',
    ])
    // Never a Soviet-era, colonial or colloquial name on screen (Sài Gòn is a search name only).
    const shown = new Set(Object.values(TABLES).flatMap((src) => [...parseExonyms(src).towns.values(), ...parseExonyms(src).regions.values()]))
    for (const never of ['Ленинград', 'Свердловск', 'Днепропетровск', 'Дніпропетровськ', 'Кіровоград', 'बम्बई', 'बंगलौर', 'Sài Gòn']) expect(shown).not.toContain(never)
    expect([name(vi, 'VN', 'hanoi'), name(vi, 'VN', 'ho chi minh city'), name(vi, 'VN', 'da nang'), name(vi, '', 'south china sea')]).toEqual([
      'Hà Nội',
      'Thành phố Hồ Chí Minh',
      'Đà Nẵng',
      'Biển Đông',
    ])
    expect(vi).toContain('~Ho Chi Minh City=Sài Gòn') // a search name, never shown
    expect([name(fa, 'IR', 'tehran'), name(fa, 'IR', 'isfahan'), name(fa, 'RU', 'moscow'), name(fa, '', 'persian gulf')]).toEqual(['تهران', 'اصفهان', 'مسکو', 'خلیج فارس'])
    expect(fa).not.toMatch(/[يك]/) // Persian letters, not Arabic ones
    expect([name(hi, 'IN', 'new delhi'), name(hi, 'IN', 'mumbai'), name(hi, 'IN', 'kolkata'), name(hi, 'IN', 'bengaluru'), name(hi, 'IN', 'uttar pradesh', true)]).toEqual([
      'नई दिल्ली',
      'मुंबई',
      'कोलकाता',
      'बेंगलुरु',
      'उत्तर प्रदेश',
    ])
  })
})
