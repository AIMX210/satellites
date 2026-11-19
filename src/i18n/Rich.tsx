/**
 * Renders rich copy (api/_lib/i18n/parts.ts) as React: text, mono numbers with their dimmer units, the serif accent and
 * emphasis. The caller passes its own CSS-module classes, so a sentence keeps the exact look of the place that shows it
 * (the results prose, the headline, the hero) whatever order the language puts its parts in.
 *
 * Numbers are isolated (`<bdi>` semantics through `unicode-bidi: isolate` in base.css's [dir=rtl] rules): in Arabic a
 * "7.46 km/s" or "16:14:21" never gets reordered by the surrounding right-to-left text.
 */
import { Fragment, type ReactNode } from 'react'
import { LOCALE_INFO } from '../../api/_lib/i18n/locales'
import { isAccent, isNum, percentFirst, percentGapBefore, tightUnit, type Part, type PercentStyle } from '../../api/_lib/i18n/parts'
import { useLocale } from './runtime'

export interface RichClasses {
  /** a number (mono, tabular) */
  num?: string
  /** a number's unit (smaller, bone-3) */
  unit?: string
  /** the serif accent */
  accent?: string
  /** emphasis */
  strong?: string
}

/** Wrap each accent in this element (e.g. 'em' for the hero, the headline's serif span); default <span>. */
type AccentTag = 'em' | 'span' | 'b' | 'strong'

export function Rich({ parts, classes = {}, accentAs = 'span', strongAs = 'strong' }: { parts: readonly Part[]; classes?: RichClasses; accentAs?: AccentTag; strongAs?: AccentTag }): ReactNode {
  const style = LOCALE_INFO[useLocale()]
  return parts.map((p, i) => <Fragment key={i}>{renderPart(p, classes, accentAs, strongAs, style)}</Fragment>)
}

function renderPart(p: Part, c: RichClasses, accentAs: AccentTag, strongAs: AccentTag, style: PercentStyle): ReactNode {
  if (typeof p === 'string') return p
  if (isNum(p))
    return (
      <span className={c.num} data-num="">
        {percentFirst(p, style) ? '%' + p.n : p.n}
        {!p.u || percentFirst(p, style) ? null : tightUnit(p.u) ? percentGapBefore(p.u, style) + p.u : <span className={c.unit}>{p.u}</span>}
      </span>
    )
  const Tag = isAccent(p) ? accentAs : strongAs
  const inner = isAccent(p) ? p.accent : p.strong
  return <Tag className={isAccent(p) ? c.accent : c.strong}>{inner.map((q, i) => <Fragment key={i}>{renderPart(q, c, accentAs, strongAs, style)}</Fragment>)}</Tag>
}
