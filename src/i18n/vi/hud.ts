/**
 * Vietnamese copy for the HUD (see docs/i18n/vi.md §3.8): corner lines in mono caps, one nowrap line each.
 *
 * Why these words: on a 375 px phone the About link (top left) and the sun line (top right) nearly touch, so *Cách
 * hoạt động* keeps English's 14 characters and the sun is *Mặt Trời* (a celestial body's name, capitalised, §6.4).
 * The sub-solar point is said as what it is, the place where the sun stands at the zenith, in the words geography class
 * uses (*Mặt Trời ở thiên đỉnh*). The replay's clock is *Lúc đó* ("at that moment"). Ages are written out (*42 phút*,
 * *5 giờ*, *3 ngày*): Vietnamese has no abbreviations for them and needs none. Coordinates, clocks, UTC and ISO stamps
 * arrive as they are.
 */
import type en from '../en/hud'
import { fmt } from '../../../api/_lib/i18n/format'
import { num, type Rich } from '../../../api/_lib/i18n/parts'
import type { AgeUnit } from '@/ui/hud/readouts'

const f = fmt('vi')

/** The catalog's age: "<1 phút", "42 phút", "5 giờ", "3 ngày" */
function ageVi(unit: AgeUnit, n: number): string {
  if (unit === 'underMinute') return '<1 phút'
  if (unit === 'minute') return `${f.int(n)} phút`
  if (unit === 'hour') return `${f.int(n)} giờ`
  return `${f.int(n)} ngày`
}

const hud: typeof en = {
  about: 'Cách hoạt động',
  home: 'Watched, trang chủ',
  regionTime: 'Thời gian',
  regionCatalog: 'Danh mục quỹ đạo',
  regionSun: 'Mặt Trời',

  scene: 'Lúc đó',
  sun: (lat: string, lon: string) => `Mặt Trời ${lat} ${lon}`,
  subsolar: 'Mặt Trời ở thiên đỉnh',
  gmst: (time: string) => `GMST ${time}`,

  objects: (n: number) => f.plural(n, { other: `${f.int(n)} vật thể` }),
  objectsPending: (count: string): Rich => [num(count), ' vật thể'],
  catalog: 'Danh mục',
  fetched: (stamp: string) => `Lấy lúc ${stamp}`,
  catalogAge: (unit: AgeUnit, n: number, stale: boolean) => `${stale ? 'Cũ, ' : ''}${ageVi(unit, n)} trước`,
  catalogUnavailable: 'Không có danh mục',
  catalogLoading: 'Đang tải danh mục',
}
export default hud
