/**
 * Ukrainian place names (Київ, Харків, Львів, Москва) for display and for search: the table scripts/build-exonyms.ts generates from
 * GeoNames (./exonyms.gen.ts, never edited: a wrong name is fixed in scripts/exonyms.ts, then generated again; the
 * rules for Ukrainian are docs/i18n/uk.md §4.3's). Countries take the browser's names (`countries`).
 *
 * Why a chunk of its own: the table writes every name in Cyrillic, ~12 kB compressed, more than the first screen should carry, so neither
 * the Ukrainian chunk nor the first paint holds it. `load` fetches it, once, and fills `names` in; src/imagery/exonyms.ts
 * calls it at idle once the landing is up and awaits it before anything shows a place name (a search, a pin, a report,
 * a switch to Ukrainian), so a name is never shown first in English and then changed.
 */
import type en from '../en/exonyms'

let loading: Promise<void> | undefined

const exonyms: typeof en = {
  names: '',
  countries: true,
  home: ['UA'],
  load: () =>
    (loading ??= import('./exonyms.gen').then(
      (m) => void (exonyms.names = m.default),
      (err: unknown) => {
        loading = undefined // offline or a stale build: the next call tries again
        throw err
      },
    )),
}
export default exonyms
