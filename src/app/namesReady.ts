/**
 * What a report waits for before it shows its place's name (src/app/controller.ts runReport): the visitor's place
 * names, if the language's table is still on its way (src/imagery/exonyms.ts), and for a link's place, the country the
 * offline list gives its name at its point (imagery waitForLinkCountry). A name shown before either would be shown one
 * way and then another, which the owner rule forbids; its own module so a test can hold each back.
 *
 * Both at once, and each EXONYM_WAIT_MS at most: a request that stalls (a tile, the table) must not hold the report,
 * and the boot curtain over a link, for ever; past the wait the name is shown as far as it is known, and stays so.
 */
import { ensureExonyms, exonymsReady, needsLinkCountry, waitForLinkCountry } from '@/imagery'
import type { Place } from '@/types'

export async function placeNamesReady(place: Place): Promise<void> {
  const link = needsLinkCountry(place) ? waitForLinkCountry(place) : undefined
  await Promise.all([exonymsReady() ? undefined : ensureExonyms(), link])
}
