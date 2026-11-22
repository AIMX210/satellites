/**
 * The country of a place opened from a link, for its name only. A link is data (src/app/links.ts): `n=Munich` and a
 * point, no country, written the same in every language. Without a country, a name could only be looked up among the
 * table's countryless names (./exonyms.ts), so a German reader who searched München and reloaded, or opened a link a
 * friend sent, read Munich. A name alone cannot pick the country (London is Londra in Italian; London, Ontario is not):
 * the point can. The offline list's place of that name nearest the point (./localPlaces.ts localNamed: the tiles
 * around it, and the landmarks) gives its country and what it is (a town, a region, a feature).
 *
 * Display only: the Place keeps no country (the usage stats and the address bar see the link as it came), and a link
 * whose name the list does not know near its point (a street, a typed label) stays countryless. Resolved before the
 * report shows the name (src/app/controller.ts runReport), once per link, and never in a language without a table
 * (English fetches nothing for it), so a name is never shown first one way and then another; and before a switch to a
 * language with a table shows the link's place on screen in it (the page was in English until then). A report waits
 * for it EXONYM_WAIT_MS at most (waitForLinkCountry), as for the table: a tile that stalls must not hold the report,
 * and the boot curtain over it, for ever. Past that wait, or once its name has been shown without a country (a switch
 * waits 3 s at most too), the link is countryless for the rest of the page: an answer that comes later is not applied.
 */
import type { Place } from '@/types'
import { EXONYM_WAIT_MS, exonymsActive } from './exonyms'
import { localNamed } from './localPlaces'

type Linked = Pick<Place, 'countryCode' | 'kind'>

const resolved = new Map<string, Linked>()
const pending = new Map<string, Promise<void>>()
const keyOf = (p: Pick<Place, 'label' | 'lat' | 'lon'>) => `${p.lat.toFixed(3)},${p.lon.toFixed(3)}|${p.label}`

/**
 * Does `place` need resolving before its name is shown: a link's, with no country, in a language with names (or, with
 * `forSwitch`, in the language a switch is going to: src/i18n/runtime.ts waitBeforeSwitch)? A link to a curated place
 * is named from the 'places' namespace instead (src/app/links.ts linkPlaceIn).
 */
export const needsLinkCountry = (place: Place, forSwitch = false): boolean =>
  place.source === 'url' && !place.countryCode && place.canonicalLabel === undefined && (forSwitch || exonymsActive()) && !resolved.has(keyOf(place))

/**
 * Settle a link's lookup, unless it is settled already: countryless once a wait gave up or the name was shown without
 * it, so a later answer is late.
 */
function settle(key: string, found: Linked) {
  if (!resolved.has(key)) resolved.set(key, found)
}

/**
 * Find the country the offline list gives a linked place's name at its point: start the lookup, or join the one under
 * way, and resolve when it answers, however long that takes (the boot starts it beside the engine). Never rejects: a
 * tile that cannot be read leaves the name countryless (and remembered so, so it never changes later in the page).
 */
export function resolveLinkCountry(place: Pick<Place, 'label' | 'lat' | 'lon'>): Promise<void> {
  const key = keyOf(place)
  if (resolved.has(key)) return Promise.resolve()
  let p = pending.get(key)
  if (!p) {
    const kindOf = (k: string) => (k === 'r' ? 'region' : k === 'f' || k === 'l' ? 'feature' : undefined)
    p = localNamed(place.label, place.lat, place.lon).then(
      (r) => settle(key, r ? { countryCode: r.cc.toLowerCase() || undefined, kind: kindOf(r.kind) } : {}),
      () => settle(key, {}),
    )
    pending.set(key, p)
  }
  return p
}

/**
 * resolveLinkCountry, waited for EXONYM_WAIT_MS at most: what anything about to show a link's name waits for. Past
 * the wait, the link is countryless for the rest of the page (its name as the countryless names give it), whatever
 * the lookup answers later. Never rejects.
 */
export async function waitForLinkCountry(place: Pick<Place, 'label' | 'lat' | 'lon'>): Promise<void> {
  const key = keyOf(place)
  if (resolved.has(key)) return
  let timer: ReturnType<typeof setTimeout> | undefined
  const limit = new Promise<void>((done) => (timer = setTimeout(done, EXONYM_WAIT_MS)))
  await Promise.race([resolveLinkCountry(place), limit])
  clearTimeout(timer)
  settle(key, {})
}

/**
 * A linked place as its name is looked up: with the country (and kind) resolveLinkCountry found, if any. Asked in a
 * language with names before the lookup has answered (a switch that stopped waiting for it), the name is shown without
 * a country now, and so the link stays countryless for the rest of the page: an answer that comes later would rename
 * the place on screen. On an English page nothing is settled: a switch still looks the country up.
 */
export function linkedForName<P extends Pick<Place, 'label' | 'lat' | 'lon' | 'countryCode' | 'kind'>>(place: P): P {
  if (place.countryCode) return place
  const key = keyOf(place)
  if (exonymsActive()) settle(key, {})
  const found = resolved.get(key)
  return found?.countryCode ? { ...place, ...found } : place
}
