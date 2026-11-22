/**
 * What a report waits for before it shows its place's name (src/app/controller.ts runReport): the visitor's place
 * names, if the language's table is still on its way (src/imagery/exonyms.ts, within its 3 s), and for a link's place,
 * the country the offline list gives its name at its point (imagery resolveLinkCountry). A name shown before either
 * would be shown one way and then another, which the owner rule forbids; its own module so a test can hold each back.
 */
import { ensureExonyms, exonymsReady, needsLinkCountry, resolveLinkCountry } from '@/imagery'
import type { Place } from '@/types'

export async function placeNamesReady(place: Place): Promise<void> {
  if (!exonymsReady()) await ensureExonyms()
  if (needsLinkCountry(place)) await resolveLinkCountry(place)
}
