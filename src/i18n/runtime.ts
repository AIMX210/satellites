/**
 * The app's language at runtime: which locale is active, its messages, and switching without a reload.
 *
 * How messages are organised, and why: English is split into namespaces (src/i18n/en/*.ts), each imported by the code
 * that uses it, so every English string stays in the chunk that shows it (the results copy in the results chunk, the
 * About page's in its own) and an English visitor downloads exactly what they did before. Every other language is ONE
 * bundle (src/i18n/<locale>/index.ts, all namespaces, ~10–20 kB compressed) that index.html's boot script starts
 * downloading in parallel with the app (src/i18n/boot.ts), and main.tsx awaits before the first render, so no English
 * ever flashes and no request waits on another.
 *
 *   const en = ns('landing', { search: 'Search a place', … })   // src/i18n/en/landing.ts: English, and the type
 *   const m = useMsgs(en)                                        // React: the active language's 'landing' namespace
 *   const m = msgs(en)                                           // anywhere else, read at call time
 *
 * A translation that lacks a namespace (or a whole bundle that failed to load) falls back to English per namespace, so
 * the worst case is English, never a blank or a key. Switching (the language switcher) loads the new bundle, swaps it in
 * and bumps `useLocaleStore`, which re-renders every component that read messages through `useMsgs`.
 */
import { create } from 'zustand'
import { DEFAULT_LOCALE, LOCALE_INFO, isLocale, type Locale } from '../../api/_lib/i18n/locales'

/** A whole translation: namespace key → that namespace's messages (typed against English in each file). */
export type Bundle = Record<string, object>

const KEYS = new WeakMap<object, string>()

/** Declare an English namespace: the object is the English copy and the type every translation must match. */
export function ns<T extends object>(key: string, english: T): T {
  KEYS.set(english, key)
  return english
}

/** The localStorage key the switcher writes and index.html's boot script reads. */
export const LANG_KEY = 'watched.lang'

function htmlLocale(): Locale {
  const v = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-locale') : null
  return isLocale(v) ? v : DEFAULT_LOCALE
}

let active: Locale = htmlLocale()
let bundle: Bundle | null = null

export const useLocaleStore = create<{ locale: Locale; version: number }>(() => ({ locale: active, version: 0 }))

/** The active locale (what the page shows). */
export const currentLocale = (): Locale => active

/** The active language's messages for an English namespace (English when it has none). Read it at call time. */
export function msgs<T extends object>(english: T): T {
  if (!bundle) return english
  const key = KEYS.get(english)
  return ((key && (bundle[key] as T | undefined)) || english) as T
}

/** React: the active language's messages for a namespace; re-renders when the language changes. */
export function useMsgs<T extends object>(english: T): T {
  useLocaleStore((s) => s.version)
  return msgs(english)
}

/** React: the active locale; re-renders when it changes. */
export const useLocale = (): Locale => useLocaleStore((s) => s.locale)

// One bundle per locale, each its own chunk. English has none: its namespaces ship with the code that uses them.
const loaders = import.meta.glob<{ default: Bundle }>(['./*/index.ts', '!./en/**'])

function loaderFor(locale: Locale): (() => Promise<{ default: Bundle }>) | undefined {
  return loaders[`./${locale}/index.ts`]
}

/** Fetch a locale's bundle (the boot script has usually started it already). Never rejects: English on failure. */
async function fetchBundle(locale: Locale): Promise<Bundle | null> {
  if (locale === DEFAULT_LOCALE) return null
  const load = loaderFor(locale)
  if (!load) return null
  try {
    return (await load()).default
  } catch {
    // A stale tab after a deploy, or offline: one more try, then English rather than a broken page.
    try {
      return (await load()).default
    } catch {
      return null
    }
  }
}

function applyToDocument(locale: Locale) {
  if (typeof document === 'undefined') return
  const info = LOCALE_INFO[locale]
  const root = document.documentElement
  root.lang = locale
  root.dir = info.dir
  root.setAttribute('data-locale', locale)
  root.setAttribute('data-script', info.script)
}

/**
 * Before the first render (main.tsx): load the language index.html chose. If its bundle cannot be loaded, the page
 * falls back to English everywhere, attributes included, so glyphs and direction always match the words.
 */
export async function startLocale(): Promise<void> {
  if (import.meta.env.DEV && /[?&]hl=pseudo(?:&|$)/.test(location.search)) return startPseudo()
  const want = htmlLocale()
  const b = await fetchBundle(want)
  const locale = b || want === DEFAULT_LOCALE ? want : DEFAULT_LOCALE
  bundle = b
  active = locale
  applyToDocument(locale)
  useLocaleStore.setState({ locale, version: useLocaleStore.getState().version + 1 })
}

/** The switcher: load, swap, remember. Resolves once the page shows the new language. */
export async function setLocale(locale: Locale): Promise<void> {
  try {
    localStorage.setItem(LANG_KEY, locale)
  } catch {
    /* storage blocked: the choice lasts for this page */
  }
  if (locale === active) return
  const b = await fetchBundle(locale)
  if (!b && locale !== DEFAULT_LOCALE) return
  bundle = b
  active = locale
  applyToDocument(locale)
  useLocaleStore.setState({ locale, version: useLocaleStore.getState().version + 1 })
}

/** Dev: every English namespace pseudo-translated (src/i18n/pseudo.ts). The namespace key is the file's name. */
async function startPseudo(): Promise<void> {
  const [{ pseudoBundle }, mods] = await Promise.all([
    import('./pseudo'),
    Promise.all(Object.entries(import.meta.glob<{ default: object }>('./en/*.ts')).map(async ([path, load]) => [path, (await load()).default] as const)),
  ])
  const english = Object.fromEntries(mods.map(([path, m]) => [/\.\/en\/(.+)\.ts$/.exec(path)![1], m]))
  bundle = pseudoBundle(english)
  useLocaleStore.setState({ locale: active, version: useLocaleStore.getState().version + 1 })
}

/** Tests: install a bundle synchronously (null for English). */
export function setBundleForTests(locale: Locale, b: Bundle | null): void {
  bundle = b
  active = locale
  useLocaleStore.setState({ locale, version: useLocaleStore.getState().version + 1 })
}
