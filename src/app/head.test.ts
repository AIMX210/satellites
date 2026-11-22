/**
 * The tab title as a place page boots and opens its report (installHeadSync, against a stand-in document): the first
 * place name the tab shows is the one it keeps, in every language. Each test loads the modules afresh, as a page does.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Bundle } from '@/i18n/runtime'

/** The place pages' own data, as dist/place/<slug>.html carries it. */
const GIZA = { path: '/place/pyramids-of-giza', label: 'Pyramids of Giza', lat: 29.9792, lon: 31.1342, cc: 'eg' }

/** A place page's document: its static title, its place, and every title the app writes after. */
function pageDocument(page: object, title: string) {
  const titles: string[] = []
  const doc = {
    get title() {
      return title
    },
    set title(t: string) {
      title = t
      titles.push(t)
    },
    querySelector: () => null,
    getElementById: (id: string) => (id === 'place-page' ? { textContent: JSON.stringify(page) } : null),
    documentElement: { getAttribute: () => null },
  }
  return { doc, titles }
}

/** Boot a place page in `locale` (with `bundle`): the head as the controller installs it, and the store. */
async function bootPage(page: { path: string }, locale: 'fr' | 'ru', bundle: () => Promise<Bundle>) {
  vi.resetModules()
  const { doc, titles } = pageDocument(page, 'static')
  vi.stubGlobal('document', doc)
  vi.stubGlobal('location', { pathname: page.path, search: '' })
  const runtime = await import('@/i18n/runtime')
  runtime.setBundleForTests(locale, await bundle())
  const { installHeadSync } = await import('./head')
  const { useApp } = await import('@/state/store')
  const { readUrlTarget, linkPlaceIn } = await import('./links')
  const { bootPlace } = await import('@/lib/placePage')
  const enPlaces = (await import('@/i18n/en/places')).default
  installHeadSync()
  /** What the controller does once boot ends: the report's place on screen, computing. */
  const openReport = () => {
    const target = readUrlTarget('', Date.now(), bootPlace())
    if (target?.kind !== 'q') throw new Error('no place page target')
    useApp.getState().setPlace(linkPlaceIn(target.place, runtime.msgs(enPlaces)))
    useApp.getState().setPhase('computing')
  }
  return { titles, openReport }
}

describe('the tab title of a place page', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('names a curated place in the page’s language from the first frame, as its report will', async () => {
    const { titles, openReport } = await bootPage(GIZA, 'fr', async () => (await import('@/i18n/fr/index')).default)
    openReport()
    expect(titles).toEqual(['Pyramides de Gizeh · Watched'])
  })
})
