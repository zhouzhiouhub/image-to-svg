import type { SniffedFormat } from '@/types/input'

function bytesMatch(bytes: Uint8Array, offset: number, signature: number[]): boolean {
  if (bytes.length < offset + signature.length) return false
  return signature.every((value, index) => bytes[offset + index] === value)
}

function asciiAt(bytes: Uint8Array, offset: number, text: string): boolean {
  for (let i = 0; i < text.length; i += 1) {
    if (bytes[offset + i] !== text.charCodeAt(i)) return false
  }
  return true
}

export function sniffFormat(bytes: Uint8Array): SniffedFormat | null {
  if (bytesMatch(bytes, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png'
  if (bytesMatch(bytes, 0, [0xff, 0xd8, 0xff])) return 'jpeg'
  if (bytesMatch(bytes, 0, [0x47, 0x49, 0x46, 0x38])) return 'gif'
  if (bytesMatch(bytes, 0, [0x42, 0x4d])) return 'bmp'
  if (asciiAt(bytes, 0, 'RIFF') && asciiAt(bytes, 8, 'WEBP')) return 'webp'

  const head = new TextDecoder('utf-8', { fatal: false })
    .decode(bytes.slice(0, Math.min(bytes.length, 512)))
    .replace(/^\uFEFF/, '')
    .trimStart()
    .toLowerCase()

  if (head.startsWith('<svg') || (head.startsWith('<?xml') && head.includes('<svg'))) {
    return 'svg'
  }

  return null
}

export function isAnimatedGif(bytes: Uint8Array): boolean {
  let graphicsControls = 0
  for (let i = 0; i < bytes.length - 2; i += 1) {
    if (bytes[i] === 0x21 && bytes[i + 1] === 0xf9 && bytes[i + 2] === 0x04) {
      graphicsControls += 1
      if (graphicsControls > 1) return true
    }
  }
  return false
}

export function isAnimatedPng(bytes: Uint8Array): boolean {
  let offset = 8
  while (offset + 8 <= bytes.length) {
    const length = readUint32(bytes, offset)
    const type = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7],
    )
    if (type === 'acTL') return true
    if (type === 'IDAT' || type === 'IEND') return false
    offset += 12 + length
  }
  return false
}

export function isAnimatedWebp(bytes: Uint8Array): boolean {
  for (let i = 12; i < bytes.length - 3; i += 1) {
    if (asciiAt(bytes, i, 'ANIM') || asciiAt(bytes, i, 'ANMF')) return true
  }
  return false
}

export function svgHasExternalResource(svgText: string): boolean {
  const lower = svgText.toLowerCase()
  const hrefs = lower.match(/(?:href|xlink:href)\s*=\s*["']([^"']+)["']/g) ?? []
  return hrefs.some((item) => {
    const value = item.split('=')[1]?.replace(/['"]/g, '').trim() ?? ''
    return value.startsWith('http://') || value.startsWith('https://') || value.startsWith('//')
  }) || /<\s*style[^>]*>[\s\S]*@import/i.test(svgText)
}

function readUint32(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] << 24) |
    (bytes[offset + 1] << 16) |
    (bytes[offset + 2] << 8) |
    bytes[offset + 3]
  ) >>> 0
}
