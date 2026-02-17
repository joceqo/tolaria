import type { FrontmatterValue } from '../components/Inspector'

export interface ParsedFrontmatter {
  [key: string]: FrontmatterValue
}

/** Parse YAML frontmatter from content */
export function parseFrontmatter(content: string | null): ParsedFrontmatter {
  if (!content) return {}

  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}

  const yaml = match[1]
  const result: ParsedFrontmatter = {}

  let currentKey: string | null = null
  let currentList: string[] = []
  let inList = false

  const lines = yaml.split('\n')

  for (const line of lines) {
    const listMatch = line.match(/^  - (.*)$/)
    if (listMatch && currentKey) {
      inList = true
      currentList.push(listMatch[1].replace(/^["']|["']$/g, ''))
      continue
    }

    if (inList && currentKey) {
      result[currentKey] = currentList.length === 1 ? currentList[0] : currentList
      currentList = []
      inList = false
    }

    const kvMatch = line.match(/^["']?([^"':]+)["']?\s*:\s*(.*)$/)
    if (kvMatch) {
      currentKey = kvMatch[1].trim()
      const value = kvMatch[2].trim()

      if (value === '' || value === '|' || value === '>') {
        continue
      }

      if (value.startsWith('[') && value.endsWith(']')) {
        const items = value.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''))
        result[currentKey] = items.length === 1 ? items[0] : items
        continue
      }

      const unquoted = value.replace(/^["']|["']$/g, '')

      if (unquoted.toLowerCase() === 'true') {
        result[currentKey] = true
        continue
      }
      if (unquoted.toLowerCase() === 'false') {
        result[currentKey] = false
        continue
      }

      result[currentKey] = unquoted
    }
  }

  if (inList && currentKey) {
    result[currentKey] = currentList.length === 1 ? currentList[0] : currentList
  }

  return result
}
