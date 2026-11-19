/**
 * The document's title and canonical link, kept true to what is on screen.
 *
 * index.html and each place page (src/lib/placePage.ts) arrive with the right ones for their address. This keeps
 * them right after the visitor moves on inside the app: a search names its place in the tab (and in the browser's
 * history and bookmarks), and the canonical link says "this page" only while a place page shows its own place.
 * A search engine that runs the app reads the title from here, so it is the same sentence the static page carries.
 */
import { HOME_TITLE, isPagePlace, pagePlace, pageTitle, type PagePlace } from '@/lib/placePage'
import { useApp, type Phase } from '@/state/store'

export interface Head {
  title: string
  /** Path of the page search engines should keep for this view */
  canonical: string
}

/** A place is on screen from the moment its search starts, whatever comes of it. */
const SHOWS_PLACE: readonly Phase[] = ['computing', 'results', 'error']

export function headFor(phase: Phase, place: { label: string; lat: number; lon: number } | undefined, page: PagePlace | undefined): Head {
  if (!place || !SHOWS_PLACE.includes(phase)) return { title: HOME_TITLE, canonical: '/' }
  // Any other place is a search, not a page: search engines keep the landing for it.
  return { title: pageTitle(place.label), canonical: isPagePlace(place, page) ? page.path : '/' }
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

/** Follow the store from now on. Boot leaves the head alone: the page that was served is already right. */
export function installHeadSync(): void {
  if (installed || typeof document === 'undefined') return
  installed = true
  const page = pagePlace()
  useApp.subscribe((st, prev) => {
    if (st.phase === prev.phase && st.place === prev.place) return
    if (st.phase === 'boot') return
    apply(headFor(st.phase, st.place, page))
  })
}
