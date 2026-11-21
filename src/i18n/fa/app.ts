/**
 * Persian copy for the app's own words (see docs/i18n/fa.md §1.2, §3.1, §3.7 "`app` and boot"): the fault notice, the
 * controller's progress lines and the browser tab's title.
 *
 * Why these forms: a fault says first what failed, impersonally («… بارگیری نشد», «مشکلی پیش آمد»), then the one step
 * as a polite imperative («دوباره امتحان کنید»), with no «لطفاً» and no apology, as the English does. The label is
 * «اشکال», an instrument's word for a malfunction, not «خطا!». Buttons are nouns («تلاش دوباره», «بازگشت»); the busy
 * state is «در حال …». The tab title keeps the brand first and the hero line without its full stop. The usage stats
 * never read this file: they log the English sentence of the same ref.
 */
import type en from '../en/app'

const app: typeof en = {
  documentTitle: 'Watched · چیزی این هفته شما را رصد کرد',

  notice: {
    label: 'اشکال',
    fallback: 'مشکلی پیش آمد.',
    tryAgain: 'تلاش دوباره',
    trying: 'در حال تلاش…',
    back: 'بازگشت',
  },

  faults: {
    catalog: 'کاتالوگ مداری بارگیری نشد. اتصالتان را بررسی کنید و دوباره امتحان کنید.',
    compute: 'هنگام محاسبهٔ گذرها برای این مکان مشکلی پیش آمد. کمی بعد دوباره امتحان کنید.',
  },

  progress: {
    catalog: 'بارگیری عناصر مداری',
    done: 'گزارش آماده است',
  },
}
export default app
