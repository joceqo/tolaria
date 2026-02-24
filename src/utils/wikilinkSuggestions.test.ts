import { describe, it, expect } from 'vitest'
import { preFilterWikilinks, MIN_QUERY_LENGTH, MAX_RESULTS, type WikilinkBaseItem } from './wikilinkSuggestions'

function makeItem(title: string, aliases: string[] = [], group = 'Note'): WikilinkBaseItem {
  return { title, aliases, group, entryTitle: title }
}

describe('preFilterWikilinks', () => {
  const items: WikilinkBaseItem[] = [
    makeItem('Build Laputa App', ['laputa-app'], 'Project'),
    makeItem('Quarterly Review', ['q1-review'], 'Responsibility'),
    makeItem('TypeScript Tips', ['ts-tips']),
    makeItem('Café Notes', ['café']),
    makeItem('React Hooks Deep-Dive', ['react-hooks']),
  ]

  it('returns empty for query shorter than MIN_QUERY_LENGTH', () => {
    expect(preFilterWikilinks(items, '')).toEqual([])
    expect(preFilterWikilinks(items, 'a')).toEqual([])
  })

  it('returns matches for query of exactly MIN_QUERY_LENGTH', () => {
    const result = preFilterWikilinks(items, 'la')
    expect(result.length).toBeGreaterThan(0)
    expect(result.some(r => r.title === 'Build Laputa App')).toBe(true)
  })

  it('matches on title (case-insensitive)', () => {
    const result = preFilterWikilinks(items, 'quarterly')
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Quarterly Review')
  })

  it('matches on aliases', () => {
    const result = preFilterWikilinks(items, 'ts-tip')
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('TypeScript Tips')
  })

  it('matches on group', () => {
    const result = preFilterWikilinks(items, 'Project')
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Build Laputa App')
  })

  it('handles accented characters', () => {
    const result = preFilterWikilinks(items, 'café')
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Café Notes')
  })

  it('handles hyphens in query', () => {
    const result = preFilterWikilinks(items, 'deep-di')
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('React Hooks Deep-Dive')
  })

  it('returns empty when nothing matches', () => {
    expect(preFilterWikilinks(items, 'zzzzz')).toEqual([])
  })

  it('returns all matches when multiple items match', () => {
    // Both "Build Laputa App" and "React Hooks Deep-Dive" contain 'e'
    // but query must be >= 2 chars, so use a longer shared substring
    const result = preFilterWikilinks(items, 'No') // "Note" group + "Café Notes"
    expect(result.length).toBeGreaterThan(1)
  })

  it('handles empty items array', () => {
    expect(preFilterWikilinks([], 'test')).toEqual([])
  })
})

describe('constants', () => {
  it('MIN_QUERY_LENGTH is 2', () => {
    expect(MIN_QUERY_LENGTH).toBe(2)
  })

  it('MAX_RESULTS is 20', () => {
    expect(MAX_RESULTS).toBe(20)
  })
})

describe('preFilterWikilinks with large dataset', () => {
  const largeItems: WikilinkBaseItem[] = Array.from({ length: 10000 }, (_, i) =>
    makeItem(`Note ${i}`, [`alias-${i}`], i % 3 === 0 ? 'Project' : 'Note')
  )

  it('handles 10000+ items without throwing', () => {
    const result = preFilterWikilinks(largeItems, 'Note 50')
    expect(result.length).toBeGreaterThan(0)
    expect(result.length).toBeLessThan(largeItems.length)
  })

  it('short query on large dataset returns empty', () => {
    expect(preFilterWikilinks(largeItems, 'N')).toEqual([])
  })
})
