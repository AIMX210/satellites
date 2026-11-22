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
 * language with a table shows the link's place on screen in it (the page was in English until then).
 */
import type { Place } from '@/types'
import { exonymsActive } from './exonyms'
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
 * Find the country the offline list gives a linked place's name at its point. Never rejects: a tile that cannot be
 * read leaves the name countryless (and remembered so, so it never changes later in the page).
 */
export function resolveLinkCountry(place: Pick<Place, 'label' | 'lat' | 'lon'>): Promise<void> {
  const key = keyOf(place)
  if (resolved.has(key)) return Promise.resolve()
  let p = pending.get(key)
  if (!p) {
    p = localNamed(place.label, place.lat, place.lon).then(
      (r) => void resolved.set(key, r ? { countryCode: r.cc.toLowerCase() || undefined, kind: r.kind === 'r' ? 'region' : r.kind === 'f' || r.kind === 'l' ? 'feature' : undefined } : {}),
      () => void resolved.set(key, {}),
    )
    pending.set(key, p)
  }
  return p
}

/** A linked place as its name is looked up: with the country (and kind) resolveLinkCountry found, if any. */
export function linkedForName<P extends Pick<Place, 'label' | 'lat' | 'lon' | 'countryCode' | 'kind'>>(place: P): P {
  if (place.countryCode) return place
  const found = resolved.get(keyOf(place))
  return found?.countryCode ? { ...place, ...found } : place
}
