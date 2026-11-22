import { afterEach, describe, expect, it, vi } from 'vitest'
import ruNames from '@/i18n/ru/exonyms.gen'
import { setBundleForTests } from '@/i18n/runtime'
import { displayLabel, linkedForName } from '@/imagery'
import type { Place } from '@/types'
import { placeNamesReady } from './namesReady'

const FILES = import.meta.glob<string>('/public/places/**/*.txt', { query: '?raw', import: 'default' })

describe('placeNamesReady: what a report waits for before it names its place', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    setBundleForTests('en', null)
  })

  it('waits for a table still on its way, then for a link’s country, before resolving', async () => {
    const tiles: (() => void)[] = []
    vi.stubGlobal('fetch', async (input: string) => {
      const file = FILES[`/public${String(input)}`]
      if (String(input).includes('/t/')) await new Promise<void>((done) => tiles.push(done))
      return file ? new Response(await file()) : new Response('', { status: 404 })
    })
    let arrive: (() => void) | undefined
    const ns: { names: string; load: () => Promise<void> } = {
      names: '',
      load: () => new Promise<void>((done) => (arrive = () => ((ns.names = ruNames), done()))),
    }
    setBundleForTests('ru', { exonyms: ns })
    const link: Place = { label: 'Moscow', lat: 55.756, lon: 37.617, source: 'url' }
    let ready = false
    const waiting = placeNamesReady(link).then(() => (ready = true))
    await vi.waitFor(() => expect(arrive).toBeDefined())
    await new Promise((r) => setTimeout(r, 20))
    expect(ready).toBe(false)
    arrive?.()
    await vi.waitFor(() => expect(tiles.length).toBeGreaterThan(0))
    await new Promise((r) => setTimeout(r, 20))
    expect(ready).toBe(false) // the link's country is still being looked up
    for (const done of tiles) done()
    await waiting
    expect(displayLabel(linkedForName(link))).toBe('Москва')
  })
})
