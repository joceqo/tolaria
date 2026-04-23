import { convertFileSrc } from '@tauri-apps/api/core'
import { isTauri } from '../mock-tauri'

// Matches markdown image syntax: ![alt](url) or ![alt](url "title")
const MD_IMAGE_PATTERN = /!\[([^\]]*)\]\(([^)\s"]+)(?:\s+"[^"]*")?\)/g

function extractAttachmentFilename(absolutePath: string): string | null {
  const idx = absolutePath.lastIndexOf('/attachments/')
  if (idx === -1) return null
  const filename = absolutePath.slice(idx + '/attachments/'.length)
  return filename || null
}

/**
 * Rewrite image URLs in markdown to asset:// URLs resolvable in the current vault.
 *
 * Handles two cases:
 * - Relative paths like `attachments/filename.png` → `asset://localhost/<vault>/attachments/filename.png`
 * - Legacy absolute asset URLs from a different vault (e.g., template vault cloned to a
 *   different path) → extract filename, rebuild for current vault
 *
 * No-op outside Tauri or when vaultPath is empty.
 */
export function resolveImageUrls(markdown: string, vaultPath: string): string {
  if (!isTauri() || !vaultPath) return markdown

  return markdown.replace(new RegExp(MD_IMAGE_PATTERN.source, 'g'), (match, alt, url) => {
    if (!url.startsWith('asset://') && !url.startsWith('http') && !url.startsWith('data:')) {
      return `![${alt}](${convertFileSrc(`${vaultPath}/${url}`)})`
    }

    if (url.startsWith('asset://localhost/')) {
      const absolutePath = decodeURIComponent(url.slice('asset://localhost/'.length))

      if (absolutePath.startsWith(vaultPath + '/') || absolutePath === vaultPath) {
        return match
      }

      const filename = extractAttachmentFilename(absolutePath)
      if (filename) {
        return `![${alt}](${convertFileSrc(`${vaultPath}/attachments/${filename}`)})`
      }
    }

    return match
  })
}

/**
 * Rewrite asset:// image URLs in markdown to portable relative paths for disk storage.
 * Inverse of resolveImageUrls — converts `asset://localhost/<vault>/attachments/f.png`
 * back to `attachments/f.png`.
 */
export function portableImageUrls(markdown: string, vaultPath: string): string {
  if (!vaultPath) return markdown

  const attachmentsPrefix = vaultPath + '/attachments/'

  return markdown.replace(new RegExp(MD_IMAGE_PATTERN.source, 'g'), (match, alt, url) => {
    if (!url.startsWith('asset://localhost/')) return match

    const absolutePath = decodeURIComponent(url.slice('asset://localhost/'.length))

    if (absolutePath.startsWith(attachmentsPrefix)) {
      const filename = absolutePath.slice(attachmentsPrefix.length)
      return `![${alt}](attachments/${filename})`
    }

    return match
  })
}
