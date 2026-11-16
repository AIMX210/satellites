import { describe, expect, it } from 'vitest'
import { SEASON_REGIONS, seasonRegionAt } from './seasonRegions'
import { SEASON_HALF_DAYS } from './timelapse'

const zoneOf = (lat: number, lon: number) => seasonRegionAt({ lat, lon })?.name

describe('war zones', () => {
  it('holds the places people search for in them, the coast included', () => {
    const inside: [string, number, number, string][] = [
      ['Gaza City', 31.5017, 34.4668, 'Gaza Strip'],
      ['Beit Hanoun', 31.5385, 34.5352, 'Gaza Strip'],
      ['Khan Younis', 31.3402, 34.3063, 'Gaza Strip'],
      ['Rafah', 31.2969, 34.2455, 'Gaza Strip'],
      ['Jenin', 32.4597, 35.3009, 'West Bank'],
      ['Ramallah', 31.9038, 35.2063, 'West Bank'],
      ['Hebron', 31.5326, 35.0998, 'West Bank'],
      ['Kyiv', 50.4501, 30.5234, 'Ukraine'],
      ['Lviv', 49.8397, 24.0297, 'Ukraine'],
      ['Odesa', 46.4825, 30.7233, 'Ukraine'],
      ['Kharkiv', 49.9935, 36.2304, 'Ukraine'],
      ['Bakhmut', 48.5953, 38.0003, 'Ukraine'],
      ['Mariupol', 47.0971, 37.5434, 'Ukraine'],
      ['Donetsk', 48.0159, 37.8028, 'Ukraine'],
      // Natural Earth's coast puts these a kilometre or two out to sea: NEAR_KM brings them in.
      ['Kherson', 46.6354, 32.6169, 'Ukraine'],
      ['Henichesk', 46.17, 34.82, 'Ukraine'],
      ['Ochakiv', 46.6167, 31.5333, 'Ukraine'],
      ['Sevastopol', 44.6054, 33.5224, 'Ukraine'],
      ['Kerch', 45.36, 36.47, 'Ukraine'],
      ['Chernobyl', 51.2763, 30.0997, 'Ukraine'],
      ['Beirut', 33.8938, 35.5018, 'Lebanon'],
      ['Tyre', 33.2705, 35.196, 'Lebanon'],
      ['Khiam', 33.3296, 35.6131, 'Lebanon'],
    ]
    for (const [name, lat, lon, zone] of inside) expect([name, zoneOf(lat, lon)]).toEqual([name, zone])
  })

  it('leaves out their neighbours, so their loops keep turning through the seasons', () => {
    const outside: [string, number, number][] = [
      ['Tel Aviv', 32.0853, 34.7818],
      ['West Jerusalem', 31.7683, 35.2137],
      ['Sderot', 31.525, 34.5958],
      ['Ashkelon', 31.6688, 34.5743],
      ['Haifa', 32.794, 34.9896],
      ['Amman', 31.9539, 35.9106],
      ['El Arish', 31.13, 33.8],
      ['Damascus', 33.5138, 36.2765],
      ['Bucharest', 44.4268, 26.1025],
      ['Chișinău', 47.0105, 28.8638],
      ['Minsk', 53.9045, 27.5615],
      ['Przemyśl', 49.7838, 22.7678],
      ['Belgorod', 50.5997, 36.5983],
      ['Taganrog', 47.2362, 38.8975],
      ['Novorossiysk', 44.72, 37.77],
      ['Groom Lake', 37.2508, -115.8098],
    ]
    for (const [name, lat, lon] of outside) expect([name, zoneOf(lat, lon)]).toEqual([name, undefined])
  })

  it('keeps every season inside the calendar year, so a year never takes the next winter’s December', () => {
    for (const z of SEASON_REGIONS) {
      expect(z.day - SEASON_HALF_DAYS).toBeGreaterThanOrEqual(0)
      expect(z.day + SEASON_HALF_DAYS).toBeLessThanOrEqual(364)
    }
  })

  it('names each season by the month its window is centred on', () => {
    const month = (day: number) => new Date(Date.UTC(2023, 0, 1 + day)).getUTCMonth()
    const name = (m: number) => (['winter', 'spring', 'summer', 'autumn'] as const)[Math.floor(((m + 1) % 12) / 3)]
    for (const z of SEASON_REGIONS) expect([z.name, z.season]).toEqual([z.name, name(month(z.day))])
  })

  it('stores each ring as lon, lat pairs of real coordinates', () => {
    for (const z of SEASON_REGIONS) {
      for (const r of z.rings) {
        expect(r.length % 2).toBe(0)
        expect(r.length).toBeGreaterThanOrEqual(6)
        for (let i = 0; i < r.length; i += 2) {
          expect(Math.abs(r[i])).toBeLessThanOrEqual(180)
          expect(Math.abs(r[i + 1])).toBeLessThanOrEqual(90)
        }
      }
    }
  })
})
