/**
 * The document's title and canonical link, kept true to what is on screen and to the page's language. This is the
 * only writer of either once the app runs.
 *
 * index.html and each place page (src/lib/placePage.ts) arrive with the right ones for their address, in English: a
 * search engine and a link preview read those. This keeps them right after the visitor moves on inside the app, and
 * from the start in another language: a search names its place in the tab (and in the browser's history and
 * bookmarks), the landing's title follows a language switch, and the canonical link says "this page" only while a
 * place page shows its own place.
 *
 * A search engine that runs the app runs it in English, so the title it reads here is the sentence the static page
 * carries (pageTitle). Another language names the place and the brand and no more: the sentence is not translated
 * (it would need each language's grammar for an inserted name), and an English sentence in a French tab would be
 * wrong. A curated place is named as that language shows it (Place.label); any other by the name the page shows it
 * under (imagery displayLabel: Москва for Moscow, as the headline says it), once the language's place names are in.
 * Until then (the boot of a link, a table still on its way) the tab keeps the label: asking for a name before its
 * table is in would keep the table out of the page (src/imagery/exonyms.ts), and no name on screen may change. A place
 * page's own place is named, while the app boots under it, as its report will hold it (links.ts pageTarget, then
 * linkPlaceIn): the name it takes then is the one it keeps (Pyramides de Gizeh from the start, not Pyramids of Giza).
 *
 * The landing's title is never read back from document.title: before the app runs, the boot words
 * (src/i18n/bootText.ts) have already set the boot language's title there, so a German page switched to English, or
 * falling back to it when its chunk failed, would keep the German one.
 */
import enApp from '@/i18n/en/app'
import enPlaces from '@/i18n/en/places'
import { currentLocale, msgs, useLocaleStore } from '@/i18n/runtime'
import { displayLabel, exonymsReady, linkedForName } from '@/imagery'
import { bootPlace, isPagePlace, pagePlace, pageTitle, type NamedSpot, type PagePlace } from '@/lib/placePage'
import { curatedId } from '@/ui/landing/places'
import { useApp, type Phase } from '@/state/store'
import type { Place } from '@/types'
import { linkPlaceIn, pageTarget } from './links'

export interface Head {
  title: string
  /** Path of the page search engines should keep for this view */
  canonical: string
}

export interface HeadWords {
  /** The landing's title in the page's language (app.documentTitle) */
  home: string
  /** Whether that language is English: only then is a place's title the static page's sentence */
  english: boolean
  /** A place's name as the page shows it, in a language other than English (else its label) */
  name?: (place: NamedSpot) => string
}

/** A place is on screen from the moment its search starts, whatever comes of it. */
const SHOWS_PLACE: readonly Phase[] = ['computing', 'results', 'error']

/** A place's title in a language other than English: its name and the brand. */
export const plainPlaceTitle = (label: string) => `${label} · Watched`

/**
 * The head for `place` in `phase`. `opening` is the place of the place page being loaded, as its report will hold it:
 * while the app boots, the page already names it, and it is about to be on screen.
 */
export function headFor(
  phase: Phase,
  place: NamedSpot | undefined,
  page: PagePlace | undefined,
  words: HeadWords,
  opening?: NamedSpot,
): Head {
  const shown = SHOWS_PLACE.includes(phase) ? place : phase === 'boot' ? opening : undefined
  if (!shown) return { title: words.home, canonical: '/' }
  // Any other place is a search, not a page: search engines keep the landing for it.
  const title = words.english ? pageTitle(shown.label) : plainPlaceTitle(words.name?.(shown) ?? shown.label)
  return { title, canonical: isPagePlace(shown, page) ? page.path : '/' }
}

/**
 * A place's name as the results show it (ui/results/placeName.ts), for the tab: a curated place's label, any other's
 * name in the language once its table is in (a link's in the country found at its point), else the label.
 */
function shownName(spot: NamedSpot): string {
  const place = spot as Partial<Place> & NamedSpot
  if (!exonymsReady() || !('source' in place) || curatedId(place as Place)) return spot.label
  return displayLabel(place.source === 'url' && place.canonicalLabel === undefined ? linkedForName(place as Place) : (place as Place))
}

function apply(head: Head) {
  if (document.title !== head.title) document.title = head.title
  const link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!link) return
  // The link is absolute, on the production origin the build wrote (a preview still points at the real site).
  const href = new URL(head.canonical, link.href).href
  if (link.href !== href) link.href = href
}

let installed = false

/** Set the head for the page as it starts, and follow the store and the language from then on. */
export function installHeadSync(): void {
  if (installed || typeof document === 'undefined') return
  installed = true
  const page = pagePlace()
  const opening = bootPlace()
  const sync = () => {
    const st = useApp.getState()
    const english = currentLocale() === 'en'
    // The page's place as its report will hold it (controller.ts boot: readUrlTarget, then linkPlaceIn), so the tab
    // names it under the curtain as the results will (Pyramides de Gizeh from the first frame, not Pyramids of Giza).
    const boot = st.phase === 'boot' && opening ? linkPlaceIn(pageTarget(opening), msgs(enPlaces)) : undefined
    const words = { home: msgs(enApp).documentTitle, english, name: english ? undefined : shownName }
    apply(headFor(st.phase, st.place, page, words, boot))
  }
  sync()
  useApp.subscribe((st, prev) => {
    if (st.phase !== prev.phase || st.place !== prev.place) sync()
  })
  useLocaleStore.subscribe(sync)
}
