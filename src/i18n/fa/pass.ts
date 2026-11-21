/**
 * Persian copy for one pass's paragraph, the sentences under a pass's picture or plan view (see docs/i18n/fa.md §3.4,
 * the authority on every sentence here; §4.2 for the compass, §5 for the slots).
 *
 * Why it reads this way:
 *  - Persian order: who, when, how high and where, the verb, then how it moved as a second clause («ماهوارهٔ X ساعت
 *    16:14:21 UTC در ارتفاع 786 کیلومتری درست از فراز این مکان گذشت و با سرعت … رو به جنوب می‌رفت.»). The satellite
 *    always follows its head noun «ماهوارهٔ» (a crewed station «ایستگاه فضایی ISS», recognised by its display name:
 *    no message carries a crewed flag), so a Persian word starts the sentence and introduces the name.
 *  - Altitudes and offsets are adjectival, the way Persian measures a position: «در ارتفاع 786 کیلومتری», «در 61
 *    کیلومتری غرب این مکان». "Crossed" and "passed" are «گذشت», never «پرواز کرد» (aircraft, and warplanes in the news
 *    of the regions people search for: fa.md §8.2).
 *  - The place needs no inflection: it stands before «را» as an object, after a preposition («به», «از»), or after
 *    «تصویر» in an ezafe. A Persian word always stands between the place and a satellite's or sensor's Latin name.
 *  - Numbers are num() parts (mono, each its own left-to-right island). Persian units are words and follow the island
 *    as text after a no-break space («786 کیلومتر»): inside it they would read before their number. The clock keeps
 *    its zone inside the island; '°' and '%' attach inside it. One is a word in prose («هر دقیقه»).
 *  - Directions come from three tables (moving «رو به», offset «… غرب این مکان», in the sky «در سمت»); the 16-point
 *    readout letters stay Latin («SSW»), as coordinates do. The geostationary seat arrives formatted («0.2°W») and
 *    sits in an LRI…PDI island, or after Persian its letters and digits swap.
 */
import type en from '../en/pass'
import type { Offset } from '../en/pass'
import { fmt } from '../../../api/_lib/i18n/format'
import { num, type Part, type Rich } from '../../../api/_lib/i18n/parts'
import type { Compass8 } from '@/ui/results/lib/copy'

const f = fmt('fa')
const nb = ' '
/** U+2066 LEFT-TO-RIGHT ISOLATE … U+2069 POP DIRECTIONAL ISOLATE (DOM-only text) */
const ltr = (s: string) => `⁦${s}⁩`

/** Moving (`heading`): «رو به جنوب» */
const HEADING: Record<Compass8, string> = {
  n: 'رو به شمال',
  ne: 'رو به شمال شرقی',
  e: 'رو به شرق',
  se: 'رو به جنوب شرقی',
  s: 'رو به جنوب',
  sw: 'رو به جنوب غربی',
  w: 'رو به غرب',
  nw: 'رو به شمال غربی',
}
/** Where it was from the place (`dir`): «در 61 کیلومتری غرب این مکان» */
const DIR: Record<Compass8, string> = {
  n: 'شمال',
  ne: 'شمال شرقی',
  e: 'شرق',
  se: 'جنوب شرقی',
  s: 'جنوب',
  sw: 'جنوب غربی',
  w: 'غرب',
  nw: 'شمال غربی',
}
/** Where it stood in your sky (`toward`): «در سمت شمال غربی» */
const TOWARD: Record<Compass8, string> = {
  n: 'در سمت شمال',
  ne: 'در سمت شمال شرقی',
  e: 'در سمت شرق',
  se: 'در سمت جنوب شرقی',
  s: 'در سمت جنوب',
  sw: 'در سمت جنوب غربی',
  w: 'در سمت غرب',
  nw: 'در سمت شمال غربی',
}

/** Display names of the crewed stations (src/engine/profiles.ts: ISS, Tiangong): the messages carry no crewed flag */
const CREWED = /^(ISS|Tiangong)\b/
/** «ماهوارهٔ Sentinel-2C», or «ایستگاه فضایی ISS»: the head noun introduces the name, which stays as it came */
const theSat = (sat: string) => (CREWED.test(sat) ? `ایستگاه فضایی${nb}${sat}` : `ماهوارهٔ${nb}${sat}`)
const clock = (time: string, zone: string) => num(time, zone)
/** «786 کیلومتری»: the adjectival measure («در ارتفاع 786 کیلومتری», «نوار 290 کیلومتری») */
const kmAdj = (n: number): Part[] => [num(f.int(n)), `${nb}کیلومتری`]
const deg = (d: number) => num(f.dec(d, 1), '°')
/** «20 متر در هر پیکسل» */
const perPixel = (gsdM: number): Part[] => [num(f.int(gsdM)), `${nb}متر در هر پیکسل`]
/** «هر دقیقه» · «هر 10 دقیقه»: a cadence in prose */
const everyMinutes = (n: number): Part[] =>
  n === 1 ? ['هر دقیقه'] : ['هر ', num(Number.isInteger(n) ? f.int(n) : f.dec(n, 1)), `${nb}دقیقه`]

/** "786 km overhead" / "786 km up, 61 km to the west", after the clock and before «گذشت» */
const where = (altKm: number, offset?: Offset): Part[] =>
  offset
    ? ['در ارتفاع ', ...kmAdj(altKm), '، در ', ...kmAdj(offset.km), ` ${DIR[offset.dir]} این مکان`]
    : ['در ارتفاع ', ...kmAdj(altKm), ' درست از فراز این مکان']

const pass: typeof en = {
  // Latin letters, as coordinates are (fa.md §4.2): Persian has no established 16-point abbreviations.
  compass16: {
    n: 'N',
    nne: 'NNE',
    ne: 'NE',
    ene: 'ENE',
    e: 'E',
    ese: 'ESE',
    se: 'SE',
    sse: 'SSE',
    s: 'S',
    ssw: 'SSW',
    sw: 'SW',
    wsw: 'WSW',
    w: 'W',
    wnw: 'WNW',
    nw: 'NW',
    nnw: 'NNW',
  },

  // ── a geostationary scan ─────────────────────────────────────────────────────────────────
  geo: {
    // «می‌ایستد» ("stands"): the satellite is «زمین‌ایستا», and «ثابت» stays the fixed camera's word.
    sits: (o: { sat: string; altKm: number; seat?: string; cadenceMin?: number }): Rich => [
      `${theSat(o.sat)} گذر نمی‌کند. در ارتفاع `,
      ...kmAdj(o.altKm),
      ` بالای استوا${o.seat !== undefined ? ` در ${ltr(o.seat)}` : ''} می‌ایستد و `,
      ...(o.cadenceMin ? [...everyMinutes(o.cadenceMin), ' '] : []),
      'تمام نیمه‌ای از زمین را که رو به آن است اسکن می‌کند.',
    ],
    reached: (o: { place: string; time: string; zone: string; heading: Compass8 }): Rich => [
      'خط این اسکن حدود ساعت ',
      clock(o.time, o.zone),
      ` به ${o.place} رسید و ${HEADING[o.heading]} پیش می‌رفت.`,
    ],
    infrared: 'این‌جا تاریک بود، پس این تصویر فروسرخ است: دمای بالای ابرها؛ هرچه سردتر، روشن‌تر.',
  },

  // ── a pass with a picture ────────────────────────────────────────────────────────────────
  crossed: (o: { sat: string; altKm: number; offset?: Offset; time: string; zone: string; heading: Compass8; speedKmS: number }): Rich => [
    `${theSat(o.sat)} ساعت `,
    clock(o.time, o.zone),
    ' ',
    ...where(o.altKm, o.offset),
    ' گذشت و با سرعت ',
    num(f.dec(o.speedKmS, 2)),
    `${nb}کیلومتر بر ثانیه ${HEADING[o.heading]} می‌رفت.`,
  ],
  // «تصویر [PLACE]» stands between the sensor's name and the place, so the two never touch.
  mosaic: (o: { sensor: string; place: string; gsdM: number }): Rich => [
    `تصویربردار ${o.sensor} این ماهواره تصویر ${o.place} را با دقت `,
    ...perPixel(o.gsdM),
    ' به موزاییک روزانهٔ رنگ طبیعی ناسا افزود.',
  ],
  radarImaged: (o: { deg: number; place: string; gsdM: number; dark: boolean }): Rich => [
    'رادار این ماهواره با زاویهٔ ',
    deg(o.deg),
    ` به پهلو، ${o.place} را با دقت `,
    ...perPixel(o.gsdM),
    o.dark ? ' رصد کرد، در تاریکی.' : ' رصد کرد.',
  ],
  lookingDown: 'درست رو به پایین نگاه می‌کرد.',
  lookingOff: (d: number): Rich => ['با ', deg(d), ' انحراف از راستای قائم رو به پایین نگاه می‌کرد.'],
  cloudCover: (pct: number): Rich => ['پوشش ابر در کل صحنه: ', num(f.int(pct), '%'), '.'],

  // ── "Likely watched" ─────────────────────────────────────────────────────────────────────
  likely: {
    crossed: (o: { sat: string; altKm: number; offset?: Offset; time: string; zone: string; swathKm?: number }): Rich => [
      `${theSat(o.sat)} ساعت `,
      clock(o.time, o.zone),
      ' ',
      ...where(o.altKm, o.offset),
      ...(o.swathKm ? [' گذشت، و این‌جا درون نوار تصویربرداری ', ...kmAdj(o.swathKm), '‌اش بود.'] : [' گذشت.']),
    ],
    archiveFailed: 'روز بود، پس باید این نقطه را ثبت کرده باشد. فعلاً جستجو در آرشیو ممکن نشد.',
    noScene: 'برای این گذر هیچ صحنه‌ای وجود ندارد. Sentinel-2 فقط خشکی و آب‌های ساحلی را ثبت می‌کند و شاید این نقطه در برنامه‌اش نبوده است.',
    notYet:
      'روز بود، پس تقریباً به‌یقین این نقطه را ثبت کرده است. ' +
      'هنوز هیچ صحنه‌ای از این گذر منتشر نشده است؛ آرشیوها ممکن است یک روز یا بیشتر عقب باشند.',
    dark: 'این‌جا تاریک بود. تصویربردارهای هواشناسی شب‌ها با فروسرخ کار می‌کنند، پس ابرهای شما را دید، نه خیابان‌هایتان را.',
    mosaicUnconfirmed: 'موزاییک روزانهٔ ناسا برای این گذر در نقطهٔ شما تأیید نشد.',
    notPublished: 'تصویرهایش برای پیش‌بینی هوا به کار می‌روند و به شکل تصویری که بتوانیم نشان دهیم منتشر نمی‌شوند.',
  },

  // ── "Could have pointed here" ────────────────────────────────────────────────────────────
  could: {
    withinView: (o: { sat: string; time: string; zone: string; offset?: Offset }): Rich => [
      `${theSat(o.sat)} ساعت `,
      clock(o.time, o.zone),
      ' از دیدرس این مکان گذشت',
      ...(o.offset ? ['، در ', ...kmAdj(o.offset.km), ` ${DIR[o.offset.dir]}.`] : ['، درست از بالای سر.']),
    ],
    // Starts with the place, as the English does; «‌اش» (its) is the satellite of the sentence before.
    insideSwath: (o: { place: string; swathKm: number }): Rich => [
      `${o.place} درون نوار `,
      ...kmAdj(o.swathKm),
      '‌اش بود. اپراتورش منتشر نمی‌کند کجا را تصویر کرده است، پس نمی‌توانیم بدانیم رصد کرد یا نه.',
    ],
    // "Mapped" is «تصویر راداری گرفتن»: «نقشه‌برداری» is surveying.
    radar: (o: { place: string; deg?: number; openArchive: boolean }): Rich => [
      'رادار از پشت ابر و در تاریکی هم می‌بیند. ',
      ...(o.deg === undefined
        ? [`می‌توانست از ${o.place} تصویر راداری بگیرد.`]
        : ['اگر ', deg(o.deg), ` به پهلو نگاه می‌کرد، می‌توانست از ${o.place} تصویر راداری بگیرد.`]),
      o.openArchive ? ' در این گذر هیچ تصویر منتشرشده‌ای از آن نیافتیم.' : ' نمی‌توانیم بدانیم گرفت یا نه.',
    ],
    camera: (o: { place: string; deg?: number }): Rich => [
      ...(o.deg === undefined
        ? [`با نگاهی درست رو به پایین، می‌توانست ${o.place} را رصد کند.`]
        : ['اگر دوربینش را ', deg(o.deg), ` از راستای قائم می‌چرخاند، می‌توانست ${o.place} را رصد کند.`]),
      ' نمی‌توانیم بدانیم رصد کرد یا نه.',
    ],
  },

  // ── "Passed overhead" ────────────────────────────────────────────────────────────────────
  overhead: (o: { sat: string; altKm: number; time: string; zone: string; elevationDeg: number; toward?: Compass8 }): Rich => [
    `${theSat(o.sat)} ساعت `,
    clock(o.time, o.zone),
    ' در ارتفاع ',
    ...kmAdj(o.altKm),
    ' گذشت، ',
    num(f.int(o.elevationDeg), '°'),
    o.toward === undefined ? ' بالای افق شما، تقریباً درست بالای سر.' : ` بالای افق شما، ${TOWARD[o.toward]}.`,
  ],
  // "Steady" is a light that does not twinkle («چشمک نمی‌زند»), never «ثابت» (stationary).
  darkStation: 'جای شما تاریک بود. اگر ایستگاه هنوز در نور خورشید بود، مانند نقطه‌ای روشن که چشمک نمی‌زند از آسمان شما گذشت.',
}
export default pass
