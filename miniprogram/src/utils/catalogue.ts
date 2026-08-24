import type { Spot } from '@shared/domain'

type SearchableSpot = Pick<Spot, 'name' | 'short' | 'region' | 'county' | 'intro'>

export function filterSpots<T extends SearchableSpot> (list: T[], region: string, keyword: string): T[] {
  const query = keyword.trim().toLocaleLowerCase()
  return list.filter((spot) => {
    const regionMatches = region === '全部' || spot.region === region
    if (!regionMatches) return false
    if (!query) return true
    return [spot.name, spot.short, spot.region, spot.county, spot.intro]
      .join(' ')
      .toLocaleLowerCase()
      .includes(query)
  })
}

export function leadingThemes (spot: Spot): string[] {
  return Object.entries(spot.themes)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 2)
    .map(([theme]) => theme)
}
