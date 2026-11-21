/**
 * Hindi copy for the time-lapse (see docs/i18n/hi.md §4.1, §6.5, §7): the player, its waiting screen, its share and
 * video buttons, and the words the MP4 draws.
 *
 * Why these words: a cloud-free photo of the place is a «साफ़ झलक» (f), as the gallery calls a clear look, counted
 * with Hindi's plural («11 साफ़ झलकें»); a year's photo is a «फ़्रेम» (m). Dates come from Intl at 'UTC' with the full
 * month («22 अक्टूबर 2015»); a year after «से» is a bare number, never grouped. A single-season loop names its season
 * as one phrase («हर पतझड़ में एक»). The waiting screen's steps are the product's «हम» at work («संग्रह खँगाल रहे
 * हैं»: "rummaging the archive"), with no gendered reader. Planetary Computer, Sentinel-2, Copernicus, H.264 and the
 * browsers' names stay; the licence credit is English, in the code. The video file's fallback word is lowercase ASCII.
 */
import type en from '../en/timelapse'
import { fmt } from '../../../api/_lib/i18n/format'
import { formatDate } from '../../../api/_lib/i18n/dates'
import type { SeasonName } from '@/imagery/seasonRegions'

const f = fmt('hi')
const pad2 = (n: number) => String(n).padStart(2, '0')
/** Hindi counts zero with the plural; Intl files 0 under `one` (docs/i18n/hi.md §5.3) */
const pl = <T,>(n: number, one: T, other: T): T => (n === 0 ? other : f.plural(n, { one, other }))

/** A number never parts from its unit: Intl's ordinary space after a digit becomes a no-break space. */
const tie = (s: string) => s.replace(/(\d) /g, '$1\u00a0')
/** «22 अक्टूबर 2015» */
const day = (ms: number) => tie(formatDate('hi', ms, 'UTC', { day: 'numeric', month: 'long', year: 'numeric' }))
/** «22 अक्टूबर» */
const dayMonth = (ms: number) => tie(formatDate('hi', ms, 'UTC', { day: 'numeric', month: 'long' }))
/** «1 साफ़ झलक», «11 साफ़ झलकें» */
const looks = (n: number) => `${f.int(n)}\u00a0${pl(n, 'साफ़ झलक', 'साफ़ झलकें')}`
const EACH: Record<SeasonName, string> = {
  winter: 'हर सर्दी में एक',
  spring: 'हर वसंत में एक',
  summer: 'हर गर्मी में एक',
  autumn: 'हर पतझड़ में एक',
}

const timelapse: typeof en = {
  // ── The dialog and its bar ──
  dialog: (place: string) => `${place} का टाइम-लैप्स`,
  title: 'टाइम-लैप्स',
  close: 'बंद करें',
  escKey: 'Esc',

  // ── Controls ──
  play: 'चलाएँ',
  pause: 'रोकें',
  slider: 'फ़्रेम',
  frameList: 'फ़्रेम',

  // ── Dates and the readout ──
  date: day,
  dayMonth,
  readout: (ms: number, satellite: string) => `${day(ms)} · ${satellite}`,
  frameSpoken: (index: number, total: number, ms: number) => `फ़्रेम ${f.int(index)}, कुल ${f.int(total)}: ${day(ms)}`,

  // ── The caption ──
  captionYearly: (count: number) => `${looks(count)} · साल में एक`,
  captionSeason: (count: number, season: SeasonName) => `${looks(count)} · ${EACH[season]}`,
  captionGathering: (since: number) => `साल में एक साफ़ झलक · ${since} से`,
  captionShort: 'इस जगह का कोई टाइम-लैप्स नहीं',
  captionError: 'संग्रह ने जवाब नहीं दिया',

  // ── The note under the frames ──
  note: (km: number) =>
    `हर फ़्रेम उसी ${f.int(km)}\u00a0किमी के वर्ग का है, Sentinel-2 से लिया गया और यहाँ की हर फ़ोटो की तरह रंग-संतुलित। हर साल अलग मौसम चुनने की कोशिश होती है। जिस साल कोई साफ़ झलक नहीं मिलती, उसे छोड़ दिया जाता है।`,
  noteOneSeason: (km: number) =>
    `हर फ़्रेम उसी ${f.int(km)}\u00a0किमी के वर्ग का है, Sentinel-2 से लिया गया और यहाँ की हर फ़ोटो की तरह रंग-संतुलित। हर साल एक ही मौसम से है। जिस साल उस मौसम में कोई साफ़ झलक नहीं मिलती, उसे छोड़ दिया जाता है।`,
  source: 'Copernicus Sentinel-2, Planetary Computer के ज़रिए',

  // ── The waiting screen ──
  listing: 'संग्रह खँगाल रहे हैं',
  choosing: 'साफ़ झलकें चुन रहे हैं',
  developing: 'फ़्रेम तैयार हो रहे हैं',
  choosingProgress: (done: number, total: number) => `साफ़ झलकें चुन रहे हैं, ${f.int(total)} में से ${f.int(done)}`,
  developingProgress: (done: number, total: number) => `फ़्रेम तैयार हो रहे हैं, ${f.int(total)} में से ${f.int(done)}`,
  tooCloudy: 'यहाँ टाइम-लैप्स के लिए बादल बहुत ज़्यादा हैं।',
  tooFew: (count: number, since: number, needed: number) =>
    `${since} से ${count === 0 ? 'कोई साफ़ झलक नहीं' : looks(count)} · ${f.int(needed)} चाहिए`,
  noAnswer: 'संग्रह ने जवाब नहीं दिया।',
  unreachable: 'Planetary Computer से संपर्क नहीं हो सका',
  retry: 'फिर कोशिश करें',

  // ── Sharing and the video ──
  share: 'शेयर करें',
  linkCopied: 'लिंक कॉपी हो गया',
  shareTitle: (place: string) => `${place}, साल दर साल`,
  video: 'वीडियो',
  rendering: (pct: number) => `बन रहा है ${pad2(pct)}%`,
  videoFailed: 'वीडियो नहीं बना',
  saveVideo: 'वीडियो सेव करें',
  noH264: 'इस ब्राउज़र में H.264 एनकोडर नहीं है: फ़ाइल Chrome और Firefox में चलेगी',
  fileNamePlace: 'jagah',
}
export default timelapse
