/**
 * Searching in the visitor's own names (./exonymSearch.ts through geocode.ts searchPlaces): a query typed as the
 * language writes a place finds it in the offline list, ranked as the place itself, with no network when the list
 * knows it. The real offline list (public/places) and the real generated tables.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { setBundleForTests } from '@/i18n/runtime'
import viExonyms from '@/i18n/vi/exonyms'
import deExonyms from '@/i18n/de/exonyms'
import itExonyms from '@/i18n/it/exonyms'
import ukExonyms from '@/i18n/uk/exonyms'
import ruExonyms from '@/i18n/ru/exonyms'
import faExonyms from '@/i18n/fa/exonyms'
import hiExonyms from '@/i18n/hi/exonyms'
import deNames from '@/i18n/de/exonyms.gen'
import itNames from '@/i18n/it/exonyms.gen'
import ukNames from '@/i18n/uk/exonyms.gen'
import ruNames from '@/i18n/ru/exonyms.gen'
import faNames from '@/i18n/fa/exonyms.gen'
import hiNames from '@/i18n/hi/exonyms.gen'
import { exonymSearch, typedKey } from './exonymSearch'
import { displayLabel, searchPlaces } from './geocode'
import { ensureExonyms, exonymAlternates, exonymHome } from './exonyms'
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

/** Each language's own countries, as its namespace gives them (a name at home leads the same name abroad). */
const HOME = { de: deExonyms, it: itExonyms, uk: ukExonyms, ru: ruExonyms, vi: viExonyms, fa: faExonyms, hi: hiExonyms }

const as = async (locale: keyof typeof HOME, names?: string) => {
  const { home, umlauts } = HOME[locale]
  setBundleForTests(locale, { exonyms: names === undefined ? viExonyms : { names, countries: true, home, umlauts } })
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
    // As keyboards type them: Persian without its madda or hamza, Ukrainian on a Russian layout or with a Latin i,
    // Hindi with a half nasal or chandrabindu for the anusvara, and ॉ for ा.
    expect(typedKey('اسلام اباد')).toBe(typedKey('اسلام آباد'))
    expect(typedKey('اذربایجان')).toBe(typedKey('آذربایجان'))
    expect(typedKey('قایم شهر')).toBe(typedKey('قائم شهر'))
    expect(typedKey('харкив')).toBe(typedKey('Харків'))
    expect(typedKey('Кривий Рiг')).toBe(typedKey('Кривий Ріг'))
    expect(typedKey('Белгород')).toBe(typedKey('Бєлгород'))
    expect(typedKey('मुम्बई')).toBe(typedKey('मुंबई'))
    expect(typedKey('चण्डीगढ़')).toBe(typedKey('चंडीगढ़'))
    expect(typedKey('रांची')).toBe(typedKey('राँची'))
    expect(typedKey('मास्को')).toBe(typedKey('मॉस्को'))
    expect(typedKey('Hanoi')).toBe('hanoi') // Latin stays Latin
  })
})

describe('exonymSearch', () => {
  const T = 'VN:Ho Chi Minh City=Thành phố Hồ Chí Minh;Hanoi=Hà Nội;*Hanoi=Hà Nội;~Ho Chi Minh City=Sài Gòn|CN:Hainan=Hải Nam'
  const key = (cc: string) => cc.toLowerCase()

  it('finds a name exactly, by its start, by its later words, and by a search name, best first', () => {
    const find = (q: string) => exonymSearch(T, q, key).map((a) => `${a.cc}:${a.key}:${a.kind}${a.exact ? '!' : ''}`)
    expect(find('Hà Nội')).toEqual(['VN:hanoi:town!', 'VN:hanoi:region!'])
    expect(find('ha noi')).toEqual(['VN:hanoi:town!', 'VN:hanoi:region!'])
    expect(find('Hồ Chí Minh')).toEqual(['VN:ho chi minh city:town']) // the name after its class noun, not whole
    expect(find('Sài Gòn')).toEqual(['VN:ho chi minh city:town!'])
    expect(find('ha')).toEqual(['VN:hanoi:town', 'VN:hanoi:region', 'CN:hainan:town'])
    expect(find('xyz')).toEqual([])
  })

  it('looks a name two English names share up under both, as one place', () => {
    const r = exonymSearch('UA:Zaporizhzhia=Saporischschja;Zaporizhzhya=Saporischschja;*Zaporizhzhia=Oblast Saporischschja', 'Saporischschja', key)
    expect(r.map((a) => [a.key, a.kind, a.also])).toEqual([
      ['zaporizhzhia', 'town', ['zaporizhzhya']],
      ['zaporizhzhia', 'region', undefined],
    ])
  })

  it('finds a German name typed without its umlauts', () => {
    const r = exonymSearch('DE:Cologne=Köln|VN:Thai Nguyen=Thái Nguyên', 'Koeln', key)
    expect(r).toEqual([{ key: 'cologne', cc: 'DE', kind: 'town', exact: true, shown: 'Köln' }])
  })

  it('finds the countries the browser names in the language', () => {
    const r = exonymSearch(T, 'Đức', key, [{ compact: typedKey('Đức'), cc: 'DE', shown: 'Đức' }])
    expect(r).toEqual([{ key: 'de', cc: 'DE', kind: 'country', exact: true, shown: 'Đức' }])
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

  it('settles a name shared by places: home first, the place named as typed, the town before its region', async () => {
    serveFiles()
    await as('vi')
    const first = async (q: string) => (await searchLocal(q, undefined, 6, exonymAlternates(q, countryName), exonymHome()))[0]
    expect(await first('Thái Nguyên')).toMatchObject({ cc: 'VN' }) // not Taiyuan, which Vietnamese also calls so
    expect(await first('thai nguyen')).toMatchObject({ cc: 'VN' })
    expect(await first('Nha Trang')).toMatchObject({ name: 'Nha Trang', cc: 'VN' }) // not Nhà Trắng, the White House
    expect(await first('Luân Đôn')).toMatchObject({ name: 'London', cc: 'GB' }) // not Tower Bridge, Cầu Tháp Luân Đôn
    await as('fa', faNames)
    expect(await first('لندن')).toMatchObject({ name: 'London', cc: 'GB' }) // not Heathrow, فرودگاه هیترو لندن
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

  it('finds what the native review typed (2026-11-22), offline and first', async () => {
    const files = serveFiles()
    const first = async (q: string) => (await searchPlaces(q))[0]
    await as('de', deNames)
    expect(await first('Kiew')).toMatchObject({ label: 'Kyiv', countryCode: 'ua' })
    expect(await first('Koeln')).toMatchObject({ label: 'Köln', countryCode: 'de' })
    expect(await first('Bodensee')).toMatchObject({ label: 'Lake Constance', countryCode: 'de' })
    const kherson = await first('Cherson')
    expect([kherson.label, displayLabel(kherson)]).toEqual(['Kherson', 'Cherson']) // the city, not its oblast
    // Umlauts typed out, for towns the table has no entry for; an old name's landmark row gives way to the city.
    expect(await first('Muenster')).toMatchObject({ label: 'Münster', countryCode: 'de' })
    expect(await first('Luebeck')).toMatchObject({ label: 'Lübeck', countryCode: 'de' })
    expect(await first('Peking')).toMatchObject({ label: 'Beijing', countryCode: 'cn' })
    // The table writes a geocoder's spelling first, which the list has no row for: the city still leads its oblast.
    expect(await first('Saporischschja')).toMatchObject({ label: 'Zaporizhzhya', countryCode: 'ua', lat: 47.852 })
    expect(await first('Mykolajiw')).toMatchObject({ label: 'Mykolayiv', countryCode: 'ua', lat: 46.976 })
    await as('it', itNames)
    expect(await first('Kiev')).toMatchObject({ label: 'Kyiv', countryCode: 'ua' })
    expect(await first('Betlemme')).toMatchObject({ label: 'Bethlehem', countryCode: 'ps' }) // not a hamlet in Apulia
    await as('vi')
    // The city before the province the table names alike, however either was found; an exact name at home first.
    for (const [q, label] of [['Huế', 'Huế'], ['hue', 'Huế'], ['Thanh Hoá', 'Thanh Hóa'], ['Hải Phòng', 'Haiphong'], ['hai phong', 'Haiphong']])
      expect([q, (await first(q)).label, (await first(q)).kind]).toEqual([q, label, undefined])
    expect(await first('Quận 1')).toMatchObject({ label: 'Quận Một' })
    // Two rows that read alike within 25 km are one (the city and the province around it, a city-state and its state).
    expect((await searchPlaces('Huế')).filter((p) => displayLabel(p) === 'Huế')).toHaveLength(1)
    await as('it', itNames)
    expect((await searchPlaces('Berlino')).map(displayLabel)).toEqual(['Berlino'])
    await as('uk', ukNames)
    expect(await first('харкив')).toMatchObject({ label: 'Kharkiv' }) // и for і, from a Russian layout
    expect(await first('Киев')).toMatchObject({ label: 'Kyiv' }) // a search name, never shown
    expect(displayLabel(await first('Бунге'))).toBe('Бунге')
    await as('ru', ruNames)
    const murmansk = await first('Мурманск')
    expect([murmansk.label, murmansk.kind, displayLabel(murmansk)]).toEqual(['Murmansk', undefined, 'Мурманск'])
    await as('fa', faNames)
    expect(displayLabel(await first('اسلام اباد'))).toBe('اسلام\u200cآباد') // typed without its madda
    expect(await first('قدس')).toMatchObject({ label: 'Jerusalem' }) // not Shahr-e Qods, شهر قدس
    await as('hi', hiNames)
    expect(await first('मुम्बई')).toMatchObject({ label: 'Mumbai' })
    expect(displayLabel(await first('बर्न'))).toBe('बर्न')
    expect(files.network()).toEqual([])
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
