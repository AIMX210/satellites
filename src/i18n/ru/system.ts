/**
 * Russian copy for the shared primitives (see docs/i18n/ru.md §1.3): the few words a component says itself. Buttons
 * and their accessible names are infinitives, which address no one («Закрыть», «Развернуть панель»).
 */
import type en from '../en/system'

const system: typeof en = {
  close: 'Закрыть',
  expandPanel: 'Развернуть панель',
  collapsePanel: 'Свернуть панель',
}
export default system
