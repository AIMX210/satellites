/**
 * Searching in the visitor's own names (./exonymSearch.ts through geocode.ts searchPlaces): a query typed as the
 * language writes a place finds it in the offline list, ranked as the place itself, with no network when the list
 * knows it. The real offline list (public/places) and the real generated tables.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { setBundleForTests } from '@/i18n/runtime'
import viExonyms from '@/i18n/vi/exonyms'
import deNames from '@/i18n/de/exonyms.gen'
import ukNames from '@/i18n/uk/exonyms.gen'
import ruNames from '@/i18n/ru/exonyms.gen'
import faNames from '@/i18n/fa/exonyms.gen'
import hiNames from '@/i18n/hi/exonyms.gen'
import { exonymSearch, typedKey } from './exonymSearch'
import { displayLabel, searchPlaces } from './geocode'
import { ensureExonyms, exonymAlternates } from './exonyms'
import { countryName, searchLocal } from './localPlaces'

const FILES = import.meta.glob<string>('/public/places/**/*.txt', { query: '?raw', import: 'default' })

/** Serves the committed place files; any other request (a network geocoder) is recorded and answered empty. */
function serveFiles() {
  const f = vi.fn(async (input: string) => {
    const url = String(input)
    if (url.startsWith('/places/')) {
      const file = FILES[`/public${url}`]
      return file ? new Response(await file()) : new Response('', { status: 404 })
    }
    return Response.json({ results: [], features: [] })
  })
  vi.stubGlobal('fetch', f)
  return { network: () => f.mock.calls.map((c) => String(c[0])).filter((u) => !u.startsWith('/places/')) }
}

const as = async (locale: 'de' | 'uk' | 'ru' | 'vi' | 'fa' | 'hi', names?: string) => {
  setBundleForTests(locale, { exonyms: names === undefined ? viExonyms : { names, countries: true } })
  await ensureExonyms()
}

describe('typedKey', () => {
  it('folds a name as it is typed in each script', () => {
    expect(typedKey('Hà Nội')).toBe(typedKey('ha noi'))
    expect(typedKey('Đà Nẵng')).toBe('da nang')
    expect(typedKey('Москва')).toBe(typedKey('МОСКВА'))
    expect(typedKey('Кам’янське')).toBe(typedKey("Кам'янське"))
    expect(typedKey('كرج')).toBe(typedKey('کرج')) // Arabic kaf, Persian kaf
    expect(typedKey('يزد')).toBe(typedKey('یزد'))
    expect(typedKey('می\u200cشود')).toBe(typedKey('میشود')) // the zero-width non-joiner
    expect(typedKey('ग़ाज़ियाबाद')).toBe(typedKey('गाजियाबाद')) // the nukta
    expect(typedKey('मुंबई')).not.toBe(typedKey('मंबई')) // vowel signs kept
  })
})

describe('exonymSearch', () => {
  const T = 'VN:Ho Chi Minh City=Thành phố Hồ Chí Minh;Hanoi=Hà Nội;*Hanoi=Hà Nội;~Ho Chi Minh City=Sài Gòn|CN:Hainan=Hải Nam'
  const key = (cc: string) => cc.toLowerCase()

  it('finds a name exactly, by its start, by its later words, and by a search name, best first', () => {
    const find = (q: string) => exonymSearch(T, q, key).map((a) => `${a.cc}:${a.key}:${a.kind}${a.exact ? '!' : ''}`)
    expect(find('Hà Nội')).toEqual(['VN:hanoi:town!', 'VN:hanoi:region!'])
    expect(find('ha noi')).toEqual(['VN:hanoi:town!', 'VN:hanoi:region!'])
    expect(find('Hồ Chí Minh')).toEqual(['VN:ho chi minh city:town!']) // the name after its class noun
    expect(find('Sài Gòn')).toEqual(['VN:ho chi minh city:town!'])
    expect(find('ha')).toEqual(['VN:hanoi:town', 'VN:hanoi:region', 'CN:hainan:town'])
    expect(find('xyz')).toEqual([])
  })

  it('finds the countries the browser names in the language', () => {
    const r = exonymSearch(T, 'Đức', key, [{ compact: typedKey('Đức'), cc: 'DE' }])
    expect(r).toEqual([{ key: 'de', cc: 'DE', kind: 'country', exact: true }])
  })
})

describe('searching in the visitor’s own names (real data)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    setBundleForTests('en', null)
  })

  it('ranks the capital Hà Nội above the hamlet of that name, and finds it however it is typed', async () => {
    serveFiles()
    await as('vi')
    for (const q of ['Hà Nội', 'Ha Noi', 'ha noi']) {
      const r = await searchLocal(q, undefined, 6, exonymAlternates(q, countryName))
      expect(r[0]).toMatchObject({ name: 'Hanoi', cc: 'VN', exact: true, lat: 21.024 })
      expect(r[1]).toMatchObject({ name: 'Hanoi', cc: 'VN', p: 0, lat: 20.328 }) // the hamlet in Ninh Bình, below
    }
    const hcmc = await searchPlaces('Sài Gòn')
    expect(hcmc[0]).toMatchObject({ label: 'Ho Chi Minh City', countryCode: 'vn' })
    expect(displayLabel(hcmc[0])).toBe('Thành phố Hồ Chí Minh')
  })

  it('answers a Cyrillic query offline when the table knows the place, and asks the network when it does not', async () => {
    const files = serveFiles()
    await as('ru', ruNames)
    const moscow = await searchPlaces('Москва')
    expect(moscow[0]).toMatchObject({ label: 'Moscow', countryCode: 'ru' })
    expect(displayLabel(moscow[0])).toBe('Москва')
    expect((await searchPlaces('Киев'))[0]).toMatchObject({ label: 'Kyiv', countryCode: 'ua' })
    expect(files.network()).toEqual([])
    // As it is typed, the city leads its landmarks (a prefix with few rows may still ask the network, as in English).
    expect((await searchPlaces('Моск'))[0]).toMatchObject({ label: 'Moscow' })
    await searchPlaces('Урюпинская улица')
    expect(files.network().length).toBeGreaterThan(0)
  })

  it('in Ukrainian, Persian and Hindi too, with the place shown in that language', async () => {
    serveFiles()
    await as('uk', ukNames)
    expect(displayLabel((await searchPlaces('Харків'))[0])).toBe('Харків')
    await as('fa', faNames)
    const tehran = (await searchPlaces('تهران'))[0]
    expect(tehran).toMatchObject({ label: 'Tehran', countryCode: 'ir' })
    expect(displayLabel(tehran)).toBe('تهران')
    expect((await searchPlaces('كرج'))[0]).toMatchObject({ label: 'Karaj' }) // typed with the Arabic kaf
    await as('hi', hiNames)
    const delhi = (await searchPlaces('नई दिल्ली'))[0]
    expect(delhi).toMatchObject({ label: 'New Delhi', countryCode: 'in' })
    expect(displayLabel(delhi)).toBe('नई दिल्ली')
  })

  it('finds a German or Italian exonym, and a country by the browser’s name for it', async () => {
    serveFiles()
    await as('de', deNames)
    expect((await searchPlaces('München'))[0]).toMatchObject({ label: 'Munich', countryCode: 'de' })
    expect((await searchPlaces('Mailand'))[0]).toMatchObject({ label: 'Milan', countryCode: 'it' })
    const germany = (await searchPlaces('Deutschland'))[0]
    expect(germany).toMatchObject({ label: 'Germany', countryCode: 'de' })
    expect(displayLabel(germany)).toBe('Deutschland')
  })
})
