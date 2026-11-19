/**
 * Renders rich copy (api/_lib/i18n/parts.ts) as React: text, mono numbers with their dimmer units, the serif accent and
 * emphasis. The caller passes its own CSS-module classes, so a sentence keeps the exact look of the place that shows it
 * (the results prose, the headline, the hero) whatever order the language puts its parts in.
 *
 * Numbers are isolated (`<bdi>` semantics through `unicode-bidi: isolate` in base.css's [dir=rtl] rules): in Arabic a
 * "7.46 km/s" or "16:14:21" never gets reordered by the surrounding right-to-left text.
 */
import { Fragment, type ReactNode } from 'react'
import { isAccent, isNum, tightUnit, type Part } from '../../api/_lib/i18n/parts'

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
  return parts.map((p, i) => <Fragment key={i}>{renderPart(p, classes, accentAs, strongAs)}</Fragment>)
}

function renderPart(p: Part, c: RichClasses, accentAs: AccentTag, strongAs: AccentTag): ReactNode {
  if (typeof p === 'string') return p
  if (isNum(p))
    return (
      <span className={c.num} data-num="">
        {p.n}
        {p.u ? tightUnit(p.u) ? p.u : <span className={c.unit}>{p.u}</span> : null}
      </span>
    )
  const Tag = isAccent(p) ? accentAs : strongAs
  const inner = isAccent(p) ? p.accent : p.strong
  return <Tag className={isAccent(p) ? c.accent : c.strong}>{inner.map((q, i) => <Fragment key={i}>{renderPart(q, c, accentAs, strongAs)}</Fragment>)}</Tag>
}
