/**
 * Persian copy for the shared primitives (see docs/i18n/fa.md §1.2): the few words a component says itself.
 *
 * Why these words: buttons are nouns or verbal nouns, the form Persian interfaces use for an action («بستن», never an
 * imperative to the reader). The grip opens and folds the panel: «باز کردن» / «جمع کردن», the everyday pair.
 */
import type en from '../en/system'

const system: typeof en = {
  close: 'بستن',
  expandPanel: 'باز کردن پنل',
  collapsePanel: 'جمع کردن پنل',
}
export default system
