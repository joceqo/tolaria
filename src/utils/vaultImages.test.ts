import { describe, it, expect, vi } from 'vitest'
import { resolveImageUrls, portableImageUrls } from './vaultImages'

let tauriMode = false

vi.mock('@tauri-apps/api/core', () => ({
  convertFileSrc: vi.fn((path: string) => `asset://localhost/${encodeURIComponent(path)}`),
}))

vi.mock('../mock-tauri', () => ({
  isTauri: () => tauriMode,
}))

function assetUrl(path: string): string {
  return `asset://localhost/${encodeURIComponent(path)}`
}

describe('resolveImageUrls', () => {
  it('is a no-op outside Tauri', () => {
    tauriMode = false
    const md = '![alt](attachments/file.png)'
    expect(resolveImageUrls(md, '/vault')).toBe(md)
  })

  it('is a no-op when vaultPath is empty', () => {
    tauriMode = true
    const md = '![alt](attachments/file.png)'
    expect(resolveImageUrls(md, '')).toBe(md)
  })

  it('converts relative attachment path to asset URL', () => {
    tauriMode = true
    const md = '![screenshot](attachments/1776369786040-CleanShot_2026-04-16.png)'
    const result = resolveImageUrls(md, '/vault')
    expect(result).toBe(`![screenshot](${assetUrl('/vault/attachments/1776369786040-CleanShot_2026-04-16.png')})`)
  })

  it('leaves an already-correct asset URL unchanged', () => {
    tauriMode = true
    const url = assetUrl('/vault/attachments/file.png')
    const md = `![alt](${url})`
    expect(resolveImageUrls(md, '/vault')).toBe(md)
  })

  it('rewrites a legacy asset URL from a different vault', () => {
    tauriMode = true
    const legacyPath = '/Users/luca/Workspace/tolaria-getting-started/attachments/1776369786040-CleanShot.png'
    const legacyUrl = assetUrl(legacyPath)
    const md = `![CleanShot](${legacyUrl})`
    const result = resolveImageUrls(md, '/Users/john/Documents/Getting Started')
    expect(result).toBe(`![CleanShot](${assetUrl('/Users/john/Documents/Getting Started/attachments/1776369786040-CleanShot.png')})`)
  })

  it('leaves external http URLs unchanged', () => {
    tauriMode = true
    const md = '![logo](https://example.com/logo.png)'
    expect(resolveImageUrls(md, '/vault')).toBe(md)
  })

  it('leaves data URLs unchanged', () => {
    tauriMode = true
    const md = '![icon](data:image/png;base64,abc123)'
    expect(resolveImageUrls(md, '/vault')).toBe(md)
  })

  it('handles multiple images in one document', () => {
    tauriMode = true
    const legacy = assetUrl('/old/attachments/a.png')
    const relative = 'attachments/b.png'
    const md = `![a](${legacy})\n\n![b](${relative})`
    const result = resolveImageUrls(md, '/vault')
    expect(result).toContain(`![a](${assetUrl('/vault/attachments/a.png')})`)
    expect(result).toContain(`![b](${assetUrl('/vault/attachments/b.png')})`)
  })

  it('preserves image alt text with spaces', () => {
    tauriMode = true
    const md = '![my screenshot](attachments/file.png)'
    const result = resolveImageUrls(md, '/vault')
    expect(result).toBe(`![my screenshot](${assetUrl('/vault/attachments/file.png')})`)
  })

  it('skips unknown asset URL with no /attachments/ segment', () => {
    tauriMode = true
    const url = assetUrl('/some/other/path/file.png')
    const md = `![alt](${url})`
    expect(resolveImageUrls(md, '/vault')).toBe(md)
  })
})

describe('portableImageUrls', () => {
  it('converts vault attachment asset URL to relative path', () => {
    const url = assetUrl('/vault/attachments/1776369786040-CleanShot.png')
    const md = `![screenshot](${url})`
    expect(portableImageUrls(md, '/vault')).toBe('![screenshot](attachments/1776369786040-CleanShot.png)')
  })

  it('is a no-op when vaultPath is empty', () => {
    const url = assetUrl('/vault/attachments/file.png')
    const md = `![alt](${url})`
    expect(portableImageUrls(md, '')).toBe(md)
  })

  it('leaves asset URLs from other vaults unchanged', () => {
    const url = assetUrl('/other-vault/attachments/file.png')
    const md = `![alt](${url})`
    expect(portableImageUrls(md, '/vault')).toBe(md)
  })

  it('leaves relative paths unchanged', () => {
    const md = '![alt](attachments/file.png)'
    expect(portableImageUrls(md, '/vault')).toBe(md)
  })

  it('leaves external URLs unchanged', () => {
    const md = '![logo](https://example.com/logo.png)'
    expect(portableImageUrls(md, '/vault')).toBe(md)
  })

  it('handles multiple images', () => {
    const url1 = assetUrl('/vault/attachments/a.png')
    const url2 = assetUrl('/vault/attachments/b.png')
    const md = `![a](${url1})\n\n![b](${url2})`
    const result = portableImageUrls(md, '/vault')
    expect(result).toContain('![a](attachments/a.png)')
    expect(result).toContain('![b](attachments/b.png)')
  })
})

describe('resolveImageUrls / portableImageUrls round-trip', () => {
  it('relative → asset → relative is stable', () => {
    tauriMode = true
    const original = '![shot](attachments/file.png)'
    const resolved = resolveImageUrls(original, '/vault')
    const restored = portableImageUrls(resolved, '/vault')
    expect(restored).toBe(original)
  })
})
