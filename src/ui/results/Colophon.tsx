/**
 * The maker's thanks: "Help keep Watched free!" and a link to the maker's Buy Me a Coffee page (src/lib/maker.ts, a
 * new tab).
 *
 * Where it is, and where it is not (owner, 2026-11-23):
 *  - Never on the screens people screenshot and record to post (the headline, the photos, the globe, the time-lapse):
 *    an ask in those would travel with every post. A bar near the headline was tried and taken out for that.
 *  - <ColophonLine/> sits at the foot of the share sheet: the people who open it have just decided the site was worth
 *    showing someone, and what they post is the card, drawn on its own, never the sheet.
 *  - <Colophon/> closes the results overview, after the caveats, for whoever reads to the end; About's credits have
 *    the same link.
 *
 * How it looks: the instrument's own parts (a 1px mark, mono caps, a hairline, the external arrow), quieter than the
 * rows around it; the arrow takes the signal colour only on hover (DESIGN §1). It is a plain link: nothing loads from
 * Buy Me a Coffee until it is pressed. The class names say nothing about donating or sponsors, which generic cosmetic
 * filters in blocker lists hide.
 */
import { LOCALE_INFO } from '../../../api/_lib/i18n/locales'
import enResults from '@/i18n/en/results'
import { useLocale, useMsgs } from '@/i18n/runtime'
import { SUPPORT_URL } from '@/lib/maker'
import { Glyph, cx } from '@/ui/system'
import s from './Colophon.module.css'

/** The row that closes the results overview: the ask as its title, the link's words under it. */
export function Colophon() {
  const m = useMsgs(enResults).colophon
  return (
    <a className={s.row} href={SUPPORT_URL} target="_blank" rel="noopener">
      <Glyph name="cup" size={16} className={s.mark} />
      <span className={s.text}>
        <span className={s.title}>{m.title}</span>
        <span className={s.sub}>{m.link}</span>
      </span>
      <Glyph name="arrow-up-right" size={12} className={s.arrow} />
    </a>
  )
}

/** One quiet line: the ask, then its link (the share sheet's foot). */
export function ColophonLine({ className }: { className?: string }) {
  const m = useMsgs(enResults).colophon
  // What separates the two phrases: a space, or nothing in Chinese and Japanese.
  const gap = LOCALE_INFO[useLocale()].sentenceGap
  return (
    <p className={cx(s.line, className)}>
      <Glyph name="cup" size={14} className={s.mark} />
      <span>
        {m.title}
        {gap}
        <a className={s.lineLink} href={SUPPORT_URL} target="_blank" rel="noopener">
          {m.link}
          <Glyph name="arrow-up-right" size={10} className={s.lineArrow} />
        </a>
      </span>
    </p>
  )
}
