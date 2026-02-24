export const MIN_QUERY_LENGTH = 2
export const MAX_RESULTS = 20

export interface WikilinkBaseItem {
  title: string
  aliases: string[]
  group: string
  entryTitle: string
}

/**
 * Pre-filter wikilink suggestion candidates using case-insensitive substring
 * matching on title, aliases, and group. This avoids creating expensive
 * onItemClick closures for thousands of entries that won't match anyway.
 *
 * Returns [] when query is shorter than MIN_QUERY_LENGTH.
 */
export function preFilterWikilinks<T extends WikilinkBaseItem>(
  items: T[],
  query: string,
): T[] {
  if (query.length < MIN_QUERY_LENGTH) return []
  const lowerQuery = query.toLowerCase()
  return items.filter(item =>
    item.title.toLowerCase().includes(lowerQuery) ||
    item.aliases.some(a => a.toLowerCase().includes(lowerQuery)) ||
    item.group.toLowerCase().includes(lowerQuery)
  )
}
