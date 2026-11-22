/**
 * A linked place's name in the visitor's language: the link carries a name and a point, and the offline list at that
 * point says which country (and which kind of place) the name is. The real offline list (public/places) and tables.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { setBundleForTests } from '@/i18n/runtime'
import deNames from '@/i18n/de/exonyms.gen'
import itNames from '@/i18n/it/exonyms.gen'
import type { Place } from '@/types'
import { displayLabel } from './geocode'
import { ensureExonyms } from './exonyms'
import { linkedForName, needsLinkCountry, resolveLinkCountry } from './linkCountry'

const FILES = import.meta.glob<string>('/public/places/**/*.txt', { query: '?raw', import: 'default' })

function serveFiles() {
  const f = vi.fn(async (input: string) => {
    const file = FILES[`/public${String(input)}`]
    return file ? new Response(await file()) : new Response('', { status: 404 })
  })
  vi.stubGlobal('fetch', f)
  return f
}

const link = (label: string, lat: number, lon: number): Place => ({ label, lat, lon, source: 'url' })
const shown = async (p: Place) => {
  if (needsLinkCountry(p)) await resolveLinkCountry(p)
  return displayLabel(linkedForName(p))
}

describe('a linked place’s name', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    setBundleForTests('en', null)
  })

  it('takes the country the offline list gives that name at the link’s point', async () => {
    serveFiles()
    setBundleForTests('de', { exonyms: { names: deNames, countries: true } })
    await ensureExonyms()
    expect(await shown(link('Munich', 48.137, 11.575))).toBe('München')
    setBundleForTests('it', { exonyms: { names: itNames, countries: true } })
    expect(await shown(link('London', 51.509, -0.126))).toBe('Londra')
    expect(await shown(link('London', 42.984, -81.246))).toBe('London') // Ontario
    expect(await shown(link('Corso Buenos Aires 12', 45.48, 9.21))).toBe('Corso Buenos Aires 12') // unknown there
  })

  it('fetches nothing in English, and leaves the place itself as it came', async () => {
    const f = serveFiles()
    const p = link('Munich', 48.137, 11.575)
    expect(needsLinkCountry(p)).toBe(false)
    expect(f).not.toHaveBeenCalled()
    setBundleForTests('de', { exonyms: { names: deNames, countries: true } })
    await resolveLinkCountry(p)
    expect(p).toEqual(link('Munich', 48.137, 11.575))
  })

  it('is found, on an English page, for a switch to a language with names (the place on screen is named in it)', async () => {
    serveFiles()
    const p = link('Kyiv', 50.454, 30.524)
    expect([needsLinkCountry(p), needsLinkCountry(p, true)]).toEqual([false, true])
    await resolveLinkCountry(p)
    setBundleForTests('de', { exonyms: { names: deNames, countries: true } })
    await ensureExonyms()
    expect(displayLabel(linkedForName(p))).toBe('Kyjiw')
  })

  it('keeps the name a link was shown under: an answer after it was shown countryless is not applied', async () => {
    const held: (() => void)[] = []
    vi.stubGlobal('fetch', async (input: string) => {
      const file = FILES[`/public${String(input)}`]
      await new Promise<void>((done) => held.push(done))
      return file ? new Response(await file()) : new Response('', { status: 404 })
    })
    const p = link('Moscow', 55.756, 37.617)
    expect(displayLabel(linkedForName(p))).toBe('Moscow') // on screen in English
    expect(needsLinkCountry(p, true)).toBe(true) // a switch still looks its country up
    const lookup = resolveLinkCountry(p) // the switch's, stalled
    // The switch stopped waiting and shows the page in German: the name, without its country.
    setBundleForTests('de', { exonyms: { names: deNames, countries: true } })
    expect(displayLabel(linkedForName(p))).toBe('Moscow')
    await vi.waitFor(() => expect(held.length).toBeGreaterThan(0))
    for (const done of held) done()
    await lookup
    expect(displayLabel(linkedForName(p))).toBe('Moscow') // not Moskau
  })
})
