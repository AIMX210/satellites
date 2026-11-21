/**
 * Persian copy the report engine emits (see docs/i18n/fa.md §3.7, §4.1, §5.4): the computing readout's progress lines
 * and the report's footnotes about degraded data. The engine carries refs; the results render them in the language
 * showing when they paint.
 *
 * Why it reads this way:
 *  - Progress rows are one mono line of about 40 characters beside a number and a duration: verbal nouns in sentence
 *    case («بارگیری کاتالوگ مداری», «محاسبهٔ 412 مدار · 7 روز»), counters after « · ». Arabic script has no capitals, so
 *    the CSS caps change only the Latin names.
 *  - A counted noun is singular after its number («16,912 جسم», «31 صحنه»); a counter reads «12 از 31»: «/» between
 *    two numbers after Persian words would swap its ends.
 *  - Footnotes say what failed and what that means, flatly, in the results' own words: a pass "counts as watched"
 *    («رصدشده به حساب می‌آید»), passes "shown as likely" («محتمل نشان داده می‌شوند»: the likely verdict's lane word).
 *    "One" is a word in a sentence, tested on `n === 1` (CLDR's one also holds 0).
 *  - Proper names stay: NASA GIBS, VIIRS, Sentinel-2, Landsat, Earth Search, Planetary Computer.
 */
import type en from '../en/engine'
import { fmt } from '../../../api/_lib/i18n/format'

const f = fmt('fa')
const nb = '\u00a0'
/** «16,912 جسم»: a grouped count and its (singular) noun */
const count = (n: number, noun: string) => `${f.int(n)}${nb}${noun}`
/** «یکی» · «3 تصویر»: how many of them, after «از N تصویر» */
const some = (n: number) => (n === 1 ? 'یکی' : count(n, 'تصویر'))

const engine: typeof en = {
  progress: {
    loadingCatalog: 'بارگیری کاتالوگ مداری',
    catalog: ({ objects }: { objects: number }) => `کاتالوگ · ${count(objects, 'جسم')}`,
    propagateStart: ({ orbits, days }: { orbits: number; days: number }) => `محاسبهٔ ${count(orbits, 'مدار')} · ${count(days, 'روز')}`,
    propagating: ({ done, total }: { done: number; total: number }) => `محاسبهٔ مدارها · ${f.int(done)} از ${f.int(total)}`,
    searchingArchives: 'جستجوی آرشیوهای Sentinel-2 + Landsat',
    matching: ({ scenes, passes }: { scenes: number; passes: number }) =>
      `تطبیق ${count(scenes, 'صحنه')} با ${count(passes, 'گذر')}`,
    verifyingWeatherStart: 'بررسی موزاییک‌های هواشناسی ناسا',
    verifyingWeather: ({ settled, total }: { settled: number; total: number }) =>
      `بررسی موزاییک‌های هواشناسی ناسا · ${f.int(settled)} از ${f.int(total)}`,
    done: ({ passes, images }: { passes: number; images: number }) => `${count(passes, 'گذر')} · ${count(images, 'تصویر')}`,
  },

  note: {
    archiveSlow: 'آرشیوهای Sentinel-2 و Landsat دیر پاسخ دادند؛ گذرها فقط از هندسهٔ مداری نشان داده می‌شوند.',
    archiveDown: 'به آرشیوهای Sentinel-2 و Landsat دسترسی نبود؛ گذرها فقط از هندسهٔ مداری نشان داده می‌شوند.',
    sentinel2Thumbnails: 'فهرست Sentinel-2 از Earth Search آمد؛ بعضی صحنه‌ها به‌جای برش، تصویر کوچک کل صحنه را نشان می‌دهند.',
    sentinel2EarthSearch: 'فهرست Sentinel-2 از Earth Search آمد (جستجوی Planetary Computer در دسترس نبود).',
    sentinel2Down: 'آرشیو Sentinel-2 در دسترس نیست؛ ممکن است تصویرهای Sentinel-2 کم باشند.',
    landsatDown: 'آرشیو Landsat در دسترس نیست؛ ممکن است تصویرهای Landsat کم باشند.',
    openOcean: 'این نقطه بیرون از برنامهٔ تصویربرداری Sentinel-2 است (دریای آزاد).',
    elementsOld: ({ days }: { days: number }) =>
      `عناصر مداری ${count(days, 'روز')} قدمت دارند، پس زمان گذرها ممکن است چند دقیقه جابه‌جا باشد.`,
    elementsNewer: 'این گذرها از روی عناصر مداری تازه‌تر بازسازی شده‌اند، پس زمانشان ممکن است چند دقیقه جابه‌جا باشد.',
    // "VIIRS images the whole globe": a verb, «از کل زمین تصویر می‌گیرد».
    gibsUnconfirmed: ({ n }: { n: number }) =>
      n === 1
        ? 'سرویس NASA GIBS در تأیید یک تصویر VIIRS کند بود؛ VIIRS هر روز از کل زمین تصویر می‌گیرد، پس آن گذر رصدشده به حساب می‌آید.'
        : `سرویس NASA GIBS در تأیید ${count(n, 'تصویر')} VIIRS کند بود؛ VIIRS هر روز از کل زمین تصویر می‌گیرد، پس آن گذرها رصدشده به حساب می‌آیند.`,
    gibsSlowAll: 'سرویس NASA GIBS به‌موقع پاسخ نداد، پس تصویرهای ماهواره‌های هواشناسی نشان داده نمی‌شوند.',
    // «از N تصویر …، M تصویر»: the service's Latin name and a number never touch.
    gibsSlowSome: ({ missing, total }: { missing: number; total: number }) =>
      `سرویس NASA GIBS از ${count(total, 'تصویر')} ماهواره‌های هواشناسی، ${some(missing)} را به‌موقع نفرستاد؛ آن گذرها محتمل نشان داده می‌شوند.`,
    gibsDownAll: 'به سرویس NASA GIBS دسترسی نبود، پس تصویرهای ماهواره‌های هواشناسی نشان داده نمی‌شوند.',
    gibsDownSome: ({ missing, total }: { missing: number; total: number }) =>
      `سرویس NASA GIBS از ${count(total, 'تصویر')} ماهواره‌های هواشناسی، ${some(missing)} را نتوانست بفرستد؛ آن گذرها محتمل نشان داده می‌شوند.`,
  },
}
export default engine
