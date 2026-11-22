/**
 * Vietnamese place names (Hà Nội, Thành phố Hồ Chí Minh, Luân Đôn, Biển Đông) for display and for search: the table scripts/build-exonyms.ts generates from
 * GeoNames (./exonyms.gen.ts, never edited: a wrong name is fixed in scripts/exonyms.ts, then generated again; the
 * rules for Vietnamese are docs/i18n/vi.md §8's). Countries take the browser's names (`countries`).
 *
 * Why in the Vietnamese chunk itself: the table writes only its differing names, ~4 kB compressed, so it is in with the rest of the
 * language's words, before any place name is shown, and costs no request of its own.
 */
import type en from '../en/exonyms'
import names from './exonyms.gen'

const exonyms: typeof en = { names, countries: true, home: ['VN'] }
export default exonyms
