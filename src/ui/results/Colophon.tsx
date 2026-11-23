/**
 * <Colophon/>: the line that closes the results overview, after the caveats: Watched is free, one person makes it,
 * and here is how to say thanks (the maker's Buy Me a Coffee page, in a new tab).
 *
 * Why it sits here and looks like this:
 *  - It is the last thing in the panel, on phones and laptops alike: it is read only by someone who has seen their
 *    place's week and scrolled past the passes, the moment the site has given them something. Nothing above it moves
 *    for it, and it never covers the globe, the headline or a photo.
 *  - It is one hairline row in the time-lapse row's language (a mark, a mono caps title, one plain line, an arrow), so
 *    it reads as part of the instrument, not as an advert dropped into it. The arrow is the external one, and its
 *    signal colour shows only on hover, like the time-lapse row's: signal stays rare (DESIGN §1).
 *  - It is a plain link: nothing loads from Buy Me a Coffee until it is pressed (src/lib/maker.ts).
 *  - The class names say nothing about donating or sponsors: generic cosmetic filters in blocker lists hide elements
 *    by names like those.
 */
import enResults from '@/i18n/en/results'
import { useMsgs } from '@/i18n/runtime'
import { SUPPORT_URL } from '@/lib/maker'
import { Glyph } from '@/ui/system'
import s from './Colophon.module.css'

export function Colophon() {
  const m = useMsgs(enResults).colophon
  return (
    <a className={s.row} href={SUPPORT_URL} target="_blank" rel="noopener">
      <Glyph name="cup" size={16} className={s.mark} />
      <span className={s.text}>
        <span className={s.title}>{m.title}</span>
        <span className={s.sub}>{m.sub}</span>
      </span>
      <Glyph name="arrow-up-right" size={12} className={s.arrow} />
    </a>
  )
}
