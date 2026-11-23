/**
 * When the overview's thanks bar shows (Colophon.tsx decideBar): never on a browser's first result, then on at most
 * three places, never beside the invite, never again once closed, and the same answer every time a place remounts.
 * The test runner has no localStorage, so this is the tab-memory path, which follows the same rules.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { decideBar, resetBarForTests } from './Colophon'

describe('decideBar', () => {
  beforeEach(() => resetBarForTests())

  it('waits for the second result, then shows on three places at most', () => {
    expect(decideBar('a', false)).toBe(false)
    expect(decideBar('b', false)).toBe(true)
    expect(decideBar('c', false)).toBe(true)
    expect(decideBar('d', false)).toBe(true)
    expect(decideBar('e', false)).toBe(false)
  })

  it('answers the same for a place it has decided (a remount, a report turning final)', () => {
    decideBar('a', false)
    expect(decideBar('b', false)).toBe(true)
    expect(decideBar('b', false)).toBe(true)
    expect(decideBar('a', false)).toBe(false)
  })

  it('never shows beside the invite, which still counts as a result', () => {
    expect(decideBar('a', true)).toBe(false)
    expect(decideBar('b', true)).toBe(false)
    expect(decideBar('c', false)).toBe(true)
  })
})
