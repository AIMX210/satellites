/**
 * A Hindi card is set as the Hindi page is (src/styles/scripts.css): no tracking anywhere on Devanagari (it cuts the
 * headline stroke between letters), the taller leading its vowel signs need, and a headline size that keeps the taller
 * block in its band. English and every other card keep what they had.
 */
import type { ReactElement } from 'react'
import { describe, expect, it } from 'vitest'
import { defaultCard, shareCard } from './card.js'
import {
  CARD_FS,
  HEAD,
  HEAD_DEVANAGARI,
  TRACK,
  buildCardSpec,
  headLeading,
  headTracking,
  headlineSize,
  headlineSizeDevanagari,
  needsShaping,
  type CardInput,
  type CardSpec,
} from './cardSpec.js'
import { FAMILY } from './fonts.js'
import { LOCALES, LOCALE_INFO } from './i18n/locales.js'
import { accent, plain, type Rich } from './i18n/parts.js'

type Styled = ReactElement<{ style?: Record<string, unknown>; children?: unknown }>

/** Every element of a card with its style and its own text. */
function nodes(node: unknown, out: { style: Record<string, unknown>; text: string }[] = []) {
  if (Array.isArray(node)) node.forEach((n) => nodes(n, out))
  else if (node && typeof node === 'object' && 'props' in node) {
    const { style, children } = (node as Styled).props
    const own = (Array.isArray(children) ? children : [children]).filter((c) => typeof c === 'string').join('')
    if (style) out.push({ style, text: own })
    nodes(children, out)
  }
  return out
}

const T = Date.UTC(2026, 10, 1, 16, 21)
const PASS: CardInput = {
  verdict: 'imaged',
  satName: 'Sentinel-2C',
  placeLabel: 'Waterloo',
  satellites: 256,
  lat: 43.47,
  lon: -80.54,
  pass: { altitudeKm: 786, offNadirDeg: 5.3, groundDistanceKm: 61, groundSpeedKmS: 7.46, headingDeg: 192 },
  tClosest: T,
  timeZone: 'America/Toronto',
  host: 'www.watched.earth',
}
/** A card in Hindi's typography with Hindi words in its headline and rows (the Hindi copy is the card catalog's). */
function hindiCard(head: Rich): CardSpec {
  const spec = buildCardSpec(PASS, 'hi')
  return { ...spec, head, readouts: [{ label: 'ऊँचाई', value: '786' }, ...spec.readouts.slice(1)], footLeft: 'देखें, आपको किसने देखा' }
}

describe('the Hindi card’s type', () => {
  it('is never tracked, and only Hindi takes the Devanagari leading', () => {
    for (const l of LOCALES) {
      const deva = LOCALE_INFO[l].script === 'devanagari'
      if (deva) expect(headTracking(l)).toEqual({ lead: 0, place: 0 })
      expect(headLeading({ locale: l, cjk: undefined })).toBe(deva ? HEAD_DEVANAGARI : HEAD)
    }
    expect(headTracking('en')).toEqual({ lead: -0.02, place: -0.01 })
    // the page's --lh-k (1.3) over the card's own leading
    expect(HEAD_DEVANAGARI.leadLH).toBeCloseTo(HEAD.leadLH * 1.3, 2)
    expect(HEAD_DEVANAGARI.placeLH).toBeCloseTo(HEAD.placeLH * 1.3, 2)
  })

  it('sets its headline untracked at that leading, and its Hindi rows untracked, in satori', () => {
    const els = nodes(shareCard({ spec: hindiCard([accent('Waterloo को'), '256 उपग्रहों ने देखा।']), image: null }))
    const head = els.filter((e) => e.text === 'Waterloo को' || e.text === '256 उपग्रहों ने देखा।')
    expect(head.map((e) => [e.style.letterSpacing, e.style.lineHeight])).toEqual([
      [0, HEAD_DEVANAGARI.placeLH],
      [0, HEAD_DEVANAGARI.leadLH],
    ])
    const mono = els.filter((e) => e.style.fontFamily === FAMILY.mono && e.text)
    const deva = mono.filter((e) => /[ऀ-ॿ]/.test(e.text))
    expect(deva.map((e) => e.text)).toEqual(expect.arrayContaining(['ऊँचाई', 'देखें, आपको किसने देखा']))
    expect(deva.every((e) => e.style.letterSpacing === 0)).toBe(true)
    // a row with no Devanagari in it keeps the mono's tracking ("SENTINEL-2C · MSI · 10 M" over the picture)
    const latin = mono.filter((e) => !needsShaping(e.text) && (e.style.fontSize as number) < CARD_FS.readout && e.text !== PASS.host)
    expect(latin.length).toBeGreaterThan(0)
    for (const e of latin) expect(e.style.letterSpacing).toBe((e.style.fontSize as number) * TRACK.label)
  })

  it('sets the default card’s hero untracked, at that leading, its accent as tall as its sans', () => {
    const els = nodes(defaultCard({ host: '', locale: 'hi' }))
    const display = els.filter((e) => e.style.fontFamily === FAMILY.display && e.text)
    const serif = els.filter((e) => e.style.fontFamily === FAMILY.serif && e.text)
    expect(display.length).toBeGreaterThan(0)
    expect(serif.length).toBeGreaterThan(0)
    for (const e of [...display, ...serif]) expect([e.style.letterSpacing, e.style.lineHeight]).toEqual([0, HEAD_DEVANAGARI.leadLH])
    const size = display[0].style.fontSize as number
    expect(size).toBeLessThan(88) // English's 88 px: Hindi set as large reads larger, and taller
    expect(serif[0].style.fontSize).toBeCloseTo(size * 1.04, 5)
  })
})

describe('the Hindi headline’s size', () => {
  const size = (head: Rich, sub?: string) => {
    const lead = head.filter((p) => typeof p === 'string').join(' ')
    const place = head.filter((p) => typeof p !== 'string').map((p) => plain([p])).join(' ')
    return { S: headlineSizeDevanagari(head, lead, place, sub), latin: headlineSize(lead, place) }
  }

  it('is the Latin ladder’s when the block fits at it', () => {
    const { S, latin } = size([accent('Waterloo को'), '256 उपग्रहों ने देखा।'])
    expect(S).toBe(latin)
    expect(S).toBe(84)
  })

  it('steps down until a long place, a long lead and a sub-line fit the band', () => {
    const head: Rich = [accent('क्षत्रिय त्र्यंबकेश्वर धर्मशाला के ऊपर से'), 'Sentinel-2C की नज़र पहुँच सकती थी।']
    const sub = 'दृश्य के 81% हिस्से पर बादल। उसे ज़्यादातर बादल दिखे।'
    const { S, latin } = size(head, sub)
    expect(S).toBeLessThan(latin)
    expect(S).toBeGreaterThanOrEqual(36)
    // without the sub-line there is more room: never smaller
    expect(size(head).S).toBeGreaterThanOrEqual(S)
  })

  it('leaves English, Cyrillic and Arabic cards on the Latin ladder', () => {
    for (const l of ['en', 'de', 'uk', 'ar'] as const) {
      const spec = buildCardSpec(PASS, l)
      expect(spec.size).toBe(headlineSize(spec.lead, spec.place + spec.tail.replace(/[.。]$/, '')))
    }
  })
})
