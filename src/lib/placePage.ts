/**
 * Place pages: /place/<slug>, one static HTML file per well-known place, written at build time (src/seo/,
 * scripts/build-seo.ts). Each is the app's own index.html with that place's title, description and canonical link in
 * the head, and the place itself in a JSON script, so a search engine gets a page per place and a visitor lands
 * straight on that place's results.
 *
 * This module is what the app knows about them: the place a page was built for, and which address shows what is on
 * screen. The place travels in the page because the app has no list of places to look a slug up in (the list is
 * ~2,000 rows; the first screen never needs it).
 *
 * The address keeps the page's own path while its place is on screen, so a link copied from the address bar is the
 * page search engines know. Any other place is `/?q=…`, as ever, and the landing is `/`.
 *
 * Dependency-free: the globe's texture preloader and the back stack read it before the app starts, and the page
 * generator runs it under Node.
 */

/** Where place pages live: `/place` is the list of them, `/place/<slug>` a page. */
export const PLACE_PREFIX = '/place'
/** The id of a place page's `<script type="application/json">`. */
export const PLACE_PAGE_ID = 'place-page'

/** The <title> of the landing, and of every address that is not a place's. index.html says the same (src/seo/pages.test.ts). */
export const HOME_TITLE = 'Watched · See every satellite that passed over you this week'
export const HOME_DESCRIPTION =
  'Enter any place on Earth. See every satellite that passed over it in the last 7 days, and the actual pictures they took. Free, no sign-up.'

/** A place's <title>: the name first (a tab, a search result), then what the page holds. */
export const pageTitle = (label: string) => `${label}: this week’s satellite images and passes · Watched`

export interface PagePlace {
  /** The page's own path, `/place/<slug>` */
  path: string
  label: string
  sublabel?: string
  lat: number
  lon: number
  /** ISO 3166-1 alpha-2, lowercase */
  cc?: string
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Whether `pathname` is a place page's (or the list's): an address the app never writes a search onto. */
export const isPlacePath = (pathname: string) => pathname === PLACE_PREFIX || pathname.startsWith(`${PLACE_PREFIX}/`)

/** The place in a page's JSON script, checked field by field (the file is ours, but a cached copy may be older). */
export function parsePagePlace(json: string | null | undefined): PagePlace | undefined {
  if (!json) return undefined
  let v: unknown
  try {
    v = JSON.parse(json)
  } catch {
    return undefined
  }
  if (!v || typeof v !== 'object') return undefined
  const o = v as Record<string, unknown>
  const { path, label, sublabel, lat, lon, cc } = o
  if (typeof path !== 'string' || !path.startsWith(`${PLACE_PREFIX}/`) || !SLUG.test(path.slice(PLACE_PREFIX.length + 1))) return undefined
  if (typeof label !== 'string' || !label.trim()) return undefined
  if (typeof lat !== 'number' || typeof lon !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return undefined
  return {
    path,
    label,
    sublabel: typeof sublabel === 'string' && sublabel.trim() ? sublabel : undefined,
    lat,
    lon,
    cc: typeof cc === 'string' && /^[a-z]{2}$/.test(cc) ? cc : undefined,
  }
}

/** The browser's document and address, when there is one. Named here, not as globals: Node compiles this file too. */
const browser = globalThis as { document?: { getElementById(id: string): { textContent: string | null } | null }; location?: { pathname: string } }

let read: PagePlace | null | undefined

/** The place this document was built for, if it is a place page. Read once: the script never changes. */
export function pagePlace(): PagePlace | undefined {
  if (read === undefined) read = parsePagePlace(browser.document?.getElementById(PLACE_PAGE_ID)?.textContent) ?? null
  return read ?? undefined
}

/**
 * The page's place when the address is still the page's own: what a load of /place/<slug> opens. A `?q=` or `?s=`
 * on the same address asks for something else and wins (src/app/links.ts).
 */
export function bootPlace(pathname: string = browser.location?.pathname ?? ''): PagePlace | undefined {
  const page = pagePlace()
  return page && pathname === page.path ? page : undefined
}

/** Whether `place` is the one the page was built for: same name, same point. */
export function isPagePlace(place: { label: string; lat: number; lon: number }, page: PagePlace | undefined): page is PagePlace {
  return !!page && place.label === page.label && place.lat === page.lat && place.lon === page.lon
}

/**
 * The path a search or the landing is written onto: the one the visitor is on, except a place page's, which names
 * one place only.
 */
export const homePath = (pathname: string) => (isPlacePath(pathname) ? '/' : pathname)

/**
 * The address for `place` on screen (with `passId` open). Coordinates are rounded to 3 decimals (~110 m): people
 * copy the address bar far more often than they press Share, and it must not leak a precise location (the share
 * card promises ~1 km). A place page's own place needs none: its path names it.
 */
export function addressOf(place: { label: string; lat: number; lon: number }, passId: string | undefined, page: PagePlace | undefined, pathname: string): string {
  const p = new URLSearchParams()
  if (isPagePlace(place, page)) {
    if (passId) p.set('p', passId)
    const q = p.toString()
    return q ? `${page.path}?${q}` : page.path
  }
  p.set('q', `${place.lat.toFixed(3)},${place.lon.toFixed(3)}`)
  p.set('n', place.label)
  if (passId) p.set('p', passId)
  return `${homePath(pathname)}?${p.toString()}`
}

/** Whether a load of this address opens straight onto results: a `?q=` or `?s=` link, or a place page. */
export function opensOnResults(pathname: string, search: string): boolean {
  if (/[?&](q|s)=/.test(search)) return pathname === '/' || isPlacePath(pathname)
  return !!bootPlace(pathname)
}
