/**
 * Persian copy for the About page ("How this works"; see src/i18n/en/about.ts for where each piece shows;
 * docs/i18n/fa.md §1.2, §2, §8.7).
 *
 * Why it reads this way:
 *  - The owner's English is short, plain and second person; the Persian is plain written Persian, conversational and
 *    still declarative, `شما` for the reader and «ما» for the product, no em dashes, no exclamation. The visitor's own
 *    questions are in the first person («می‌تواند مرا ببیند؟»).
 *  - The title «چطور / *کار می‌کند*.» puts the accent on the verb, as the English puts it on "works", the full stop
 *    outside it.
 *  - The privacy section says exactly what the English says, no more and no less (fa.md §8.7).
 *  - Numbers in rich parts are num() islands; the fetch stamp is an ISO time and sits in one.
 *  - The maker's handle is a link and is isolated (LRI…PDI), or its «@» would jump to the far side.
 *  - Names stay: CelesTrak, SGP4, Sentinel-1/-2, Landsat, Planetary Computer, Element 84, Open-Meteo, Photon,
 *    Nominatim, the typefaces. "Could have pointed here" is quoted as the verdict says it, in «».
 */
import type en from '../en/about'
import type { AboutPart, LinkPart } from '../en/about'
import { fmt } from '../../../api/_lib/i18n/format'
import { accent, num, type Part, type Rich } from '../../../api/_lib/i18n/parts'

const f = fmt('fa')
const nb = '\u00a0'

const link = (...parts: Part[]): LinkPart => ({ link: parts })
const handleLink = (handle: string): LinkPart => link(`\u2066${handle}\u2069`)

const about: typeof en = {
  bar: 'درباره',
  close: 'بستن',
  sectionsLabel: 'بخش‌ها',
  title: [['چطور'], [accent('کار می‌کند'), '.']] as Rich[],
  lede: 'نقطه‌ای روی زمین انتخاب کنید. ما حساب می‌کنیم در هفتهٔ گذشته کدام ماهواره‌ها از فراز آن گذشتند، بعد سراغ تصویرهایی می‌رویم که گرفتند. همهٔ این کارها در مرورگر شما و با داده‌های عمومی انجام می‌شود.',

  sections: {
    short: 'به‌طور خلاصه',
    method: 'چطور گذرها را پیدا می‌کنیم',
    words: 'معنی برچسب‌ها',
    accuracy: 'آنچه نمی‌بینیم',
    privacy: 'حریم خصوصی',
    credits: 'منابع',
    keys: 'صفحه‌کلید',
  },

  short: {
    live: {
      term: 'زنده است؟',
      text: 'نه کاملاً. عکس‌ها چند ساعت تا یکی دو روز پس از گرفته شدن به آرشیوها می‌رسند، پس تازه‌ترین گذرها شاید هنوز تصویری نداشته باشند.',
    },
    seeMe: {
      term: 'می‌تواند مرا ببیند؟',
      text: `نه. در بهترین حالت، هر پیکسل این‌جا 10${nb}متر پهنا دارد. یک ماشین یک پیکسل است. شما در آن نیستید.`,
    },
    every: {
      term: 'این همهٔ ماهواره‌هاست؟',
      text: 'نه. ماهواره‌های نظامی و جاسوسی بیشترشان در کاتالوگ‌های عمومی نیستند، و شرکت‌ها نمی‌گویند دوربین‌هایشان را به کجا می‌گیرند.',
    },
  },

  method: {
    orbits: [
      'هر جسمی که در مدار است مجموعه‌ای عمومی از اعداد دارد که مسیرش را توصیف می‌کند. ',
      link('CelesTrak'),
      ' این اعداد را از ردیابی نیروی فضایی آمریکا منتشر می‌کند، و ما هر شش ساعت یک نسخهٔ تازه از آن برمی‌داریم.',
    ] as AboutPart[],
    loaded: (count: number, stamp: string): AboutPart[] =>
      count === 1
        ? ['این صفحه یک جسم را بارگیری کرد، دریافت‌شده در ', num(`\u2066${stamp}\u2069`), '.']
        : ['این صفحه ', num(f.int(count)), `${nb}جسم را بارگیری کرد، دریافت‌شده در `, num(`\u2066${stamp}\u2069`), '.'],
    sgp4: 'ما هر ماهواره را برای هفت روز گذشته از SGP4، مدل استاندارد مدار، می‌گذرانیم و هر باری را که نقطهٔ شما در گسترهٔ دیدش بود یادداشت می‌کنیم.',
    facts: {
      straightDown: {
        term: 'رو به پایین',
        text: `Sentinel-2 و Landsat درست رو به پایین به نواری از زمین نگاه می‌کنند، به پهنای حدود 290${nb}کیلومتر برای Sentinel-2 و 185${nb}کیلومتر برای Landsat. شما باید درون آن نوار باشید.`,
      },
      tilting: {
        term: 'دوربین‌های چرخان',
        text: 'بسیاری از ماهواره‌های تجاری می‌توانند 30 تا 45 درجه کج شوند. اگر در بُردشان بودید، آن را «می‌توانست به این‌جا نگاه کند» می‌نامیم.',
      },
      daylight: { term: 'روشنایی روز', text: 'دوربین‌های معمولی به خورشید نیاز دارند. گذری که در تاریکی باشد هرگز عکس به حساب نمی‌آید.' },
      radar: {
        term: 'رادار',
        text: 'Sentinel-1 به خورشید نیاز ندارد. ریزموج می‌فرستد و پژواکش را ثبت می‌کند، پس از پشت ابر و در شب هم می‌بیند و به یک سوی مسیرش نگاه می‌کند. تصویرهایش هم عمومی‌اند، پس آن‌ها را به رنگ خاکستری نشان می‌دهیم: روشن یعنی زمین ناهموار و ساختمان، تیره یعنی آب آرام.',
      },
      weather: {
        term: 'ماهواره‌های هواشناسی',
        text: 'چند تایشان بالای استوا می‌ایستند و هر 10 دقیقه نیمی از زمین را رصد می‌کنند. اگر در نیمه‌ای از زمین باشید که رو به آن‌هاست، در همهٔ قاب‌ها هستید.',
      },
    },
    archives:
      'بعد آرشیوهای تصویر (Microsoft Planetary Computer، Element 84 و ناسا) را جستجو می‌کنیم و هر تصویر را با گذری که آن را گرفت جفت می‌کنیم. هر تصویری که می‌بینید همان تصویر واقعی است، که پیرامون نقطهٔ شما بریده شده.',
    photoFacts: {
      touchUps: {
        term: 'دست‌کاری‌ها',
        text: 'رنگ عکس‌های Sentinel-2 و Landsat برای صفحهٔ شما متعادل می‌شود و خودشان نرم و کمی تیز می‌شوند، به یک شکل در سراسر تصویر. هیچ چیز اضافه یا حذف نمی‌شود.',
      },
      whichWayUp: {
        term: 'کدام طرف بالاست',
        text: 'عکس‌های Sentinel-2 و Landsat شبکهٔ نقشهٔ خود آرشیو را برای مکان شما نگه می‌دارند، پس شمال ممکن است چند درجه از راستای بالا منحرف باشد. وقتی عکسی را باز می‌کنید، پیکان N آن دقیقاً نشان می‌دهد کجاست.',
      },
    },
  },

  verdictMore: {
    imaged: 'اگر نشانش می‌دهیم، همان تصویر واقعی است.',
    likely: 'تصویر هنوز عمومی نشده، یا به خاطر ابر کنار گذاشته شده است.',
    could: 'هیچ راهی نیست که بدانیم واقعاً نگاه کرد یا نه.',
    overhead: '',
  },

  accuracy: {
    positions: {
      term: 'موقعیت‌های دقیق',
      text: 'دادهٔ عمومی مدارها تا حدود یک کیلومتر دقیق است و هر روز کمی جابه‌جا می‌شود. زمان‌ها ممکن است چند ثانیه اختلاف داشته باشند.',
    },
    secret: { term: 'ماهواره‌های مخفی', text: 'برخی از بهترین دوربین‌های مدار مال ارتش‌ها هستند. آن‌ها این‌جا دیده نمی‌شوند.' },
    clouds: {
      term: 'ابرها',
      text: 'بسیاری از عکس‌ها فقط ابرند. وقتی آرشیو به ما بگوید، پیکسل دقیقِ روی نقطهٔ شما را بررسی می‌کنیم و همین را می‌گوییم.',
    },
    delays: { term: 'تأخیرها', text: 'ممکن است یکی دو روز طول بکشد تا عکس‌ها برسند.' },
  },

  privacy: {
    where: { term: 'کجا اجرا می‌شود', text: 'محاسبهٔ مدارها در مرورگر شما انجام می‌شود.' },
    kept: {
      term: 'آنچه نگه می‌داریم',
      text: `جستجوها را بر اساس شهر و یک ناحیهٔ تقریبی 10${nb}کیلومتری می‌شماریم، هرگز نقطهٔ دقیق شما را، و شمار آنچه باز یا به اشتراک گذاشته می‌شود را نگه می‌داریم. نه نشانی IP، نه کوکی‌ای از خودمان، نه چیزی که یک بازدید را به بازدید بعدی پیوند دهد.`,
    },
    others: {
      term: 'چه کسانی دیگر آن را می‌بینند',
      text: 'بیشتر نام‌های مکان از فهرستی می‌آیند که درون خود سایت است. جستجوهای دیگر به Open-Meteo، Photon یا Nominatim می‌روند. تصویرها مستقیم از آرشیوها بارگیری می‌شوند. میزبان ما بازدید صفحه‌ها و سرعت را بدون کوکی می‌شمارد، و ممکن است یک کوکی امنیتی بگذارد تا آدم‌ها را از ربات‌ها تشخیص دهد. ما هرگز آن را نمی‌خوانیم.',
    },
    links: {
      term: 'پیوندهای اشتراک',
      text: `فقط وقتی چیزی را به اشتراک می‌گذارید ساخته می‌شوند. هر کس پیوند را داشته باشد نام مکان، نقطه‌ای گردشده تا حدود 1${nb}کیلومتر و گذری را که انتخاب کردید می‌بیند.`,
    },
  },

  credits: {
    madeBy: { who: 'ساختهٔ', text: (handle: string): AboutPart[] => ['Armaan، ', handleLink(handle), ' در X'] },
    gibs: 'تصویرها از GIBS ناسا، بخشی از EOSDIS. GOES از طریق NOAA و CIRA، Himawari از طریق JMA.',
    archives: {
      who: 'آرشیوها',
      text: 'Microsoft Planetary Computer و Element 84 Earth Search؛ باند 15 متری Landsat از Copernicus Data Space Ecosystem.',
    },
    orbits: { who: 'مدارها', text: 'مجموعه‌عناصر مداری از CelesTrak. SGP4 با satellite.js.' },
    placeNames: { who: 'نام مکان‌ها', text: 'Photon از komoot. داده‌های نقشه © OpenStreetMap contributors (ODbL).' },
    textures: { who: 'بافت‌های زمین', text: 'Solar System Scope (CC BY 4.0)، از Blue Marble و Black Marble ناسا.' },
    // Names the faces the Persian page is set in too, so the credit says what is on screen
    type: { who: 'حروف', text: 'Instrument Sans و Instrument Serif از Instrument، Martian Mono از Evil Martians، و Noto Sans Arabic و Amiri برای فارسی (SIL OFL).' },
  },

  keys: {
    search: 'جستجوی مکان',
    suggestions: 'حرکت میان پیشنهادها',
    choose: 'انتخاب',
    passes: 'رفتن از گذری به گذر دیگر',
    photos: 'تصویر قبلی / بعدی',
    expand: 'بزرگ کردن تصویر',
    zoom: 'بزرگ‌نمایی (در حالت بزرگ)',
    play: 'پخش یا مکث بازپخش',
    back: 'بازگشت، یا بستن',
    help: 'همین صفحه',
  },
  keyNames: { enter: 'Enter', space: 'فاصله', esc: 'Esc' },

  builtBy: (handle: string): AboutPart[] => ['ساختهٔ ', handleLink(handle)],
  footerNote: 'ساخته‌شده از داده‌های عمومی. هیچ‌یک از این عکس‌ها را ما نگرفته‌ایم.',
}
export default about
