/**
 * Place names in the visitor's language, for display only (src/imagery/exonyms.ts reads it): the name a German, an
 * Italian, a Ukrainian, a Russian, a Vietnamese, a Persian or a Hindi map gives a town or region that the place data
 * (GeoNames, and the geocoders asked in English) names in English, and the Korean names of four places Korean readers
 * know by another name. The same names let a search typed in the visitor's language find the place offline (Москва,
 * Ha Noi, Mailand). English has none: an English page shows every name exactly as it came, and downloads no table.
 *
 * TRANSLATORS: not written by hand, except Korean's four (src/i18n/ko/exonyms.ts, the owner's). The other tables are
 * generated from GeoNames by scripts/build-exonyms.ts (src/i18n/<locale>/exonyms.gen.ts, never edited): a wrong name
 * is fixed in scripts/exonyms.ts (OVERRIDES), then the tables are generated again.
 *
 * Usage stats, record_lookup, links and shares keep the English name (Place.label, canonicalLabel), so one town is one
 * row in every language.
 */
import { ns } from '../ns'

/** A table's namespace: the names, and how a large one arrives (`load`) and whether countries are named (`countries`). */
export interface ExonymsNamespace {
  /**
   * The table: countries apart by `|`, each `<ISO code>:` then its names apart by `;`, each `<English name>=<shown
   * name>`, a first-level region's starting with `*`. The English name is matched as typed in a search (case, accents
   * and punctuation aside). A country code of nothing (`:Sea of Japan=동해`) holds names for places that have no
   * country (a sea). An entry starting with `~` is a search name only, never shown (`~Ho Chi Minh City=Sài Gòn`). Each
   * country's names come largest first, which is how a search through them ranks. No name may hold `|`, `;`, `=`,
   * `:` or `~`, nor start with `*`.
   * E.g. `DE:Munich=München;Cologne=Köln;*Bavaria=Bayern|AT:Vienna=Wien`.
   */
  names: string
  /**
   * A large table ships as a chunk of its own: `names` stays '' until `load()` has filled it in (src/imagery/exonyms.ts
   * ensureExonyms calls it at idle, and before anything shows a place name). Without it, the table is in `names`.
   */
  load?: () => Promise<void>
  /**
   * A country found by search, or shown on its own, takes the browser's name for it in the language (Intl, as the
   * where line already does: Германия, not Germany), and a search typed as the language names a country finds it.
   */
  countries?: boolean
}

const exonyms: ExonymsNamespace = { names: '' }
export default ns('exonyms', exonyms)
