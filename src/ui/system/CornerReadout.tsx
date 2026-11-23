import { forwardRef, type ReactNode } from 'react'
import { cx } from './primitives'
import s from './CornerReadout.module.css'

export type Corner = 'tl' | 'tr' | 'bl' | 'br'

/**
 * A fixed mono readout in one corner of the bezel (DESIGN §4). Lines stack; right corners align right.
 * The block ignores pointer events except for links and buttons inside it. The ref is the block (the
 * HUD measures the top pair to publish its inset).
 */
export const CornerReadout = forwardRef<
  HTMLDivElement,
  {
    corner: Corner
    children: ReactNode
    className?: string
    /** Accessible name for the region, e.g. "Catalog status" */
    label?: string
    /** aria-live politeness for readouts whose text changes meaningfully (not for ticking clocks) */
    live?: 'polite' | 'off'
  }
>(function CornerReadout({ corner, children, className, label, live }, ref) {
  return (
    // data-corner: so a view that must keep clear of a corner can find it (the landing's code line, Landing.tsx)
    <div ref={ref} className={cx(s.corner, s[corner], className)} data-corner={corner} role={label ? 'group' : undefined} aria-label={label} aria-live={live}>
      {children}
    </div>
  )
})
