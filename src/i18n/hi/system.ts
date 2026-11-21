/**
 * Hindi copy for the shared primitives (see docs/i18n/hi.md §1.3): the few words a component says itself. Every button
 * is the polite imperative in -एँ / करें, the form Hindi interfaces use, which has no gender.
 */
import type en from '../en/system'

const system: typeof en = {
  close: 'बंद करें',
  expandPanel: 'पैनल बड़ा करें',
  collapsePanel: 'पैनल छोटा करें',
}
export default system
