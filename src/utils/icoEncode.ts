import type { InputKind } from '@/types/input'
import { decodeToBitmap } from '@/utils/transformImage'
import { rasterizeSourceToSize, type ResizeFit } from '@/utils/svgRaster'

export const ICO_MIME = 'image/x-icon' as const
export type IcoFormat = typeof ICO_MIME

export const ICO_PRESET_SIZES = [16, 24, 32, 48, 64, 72, 80, 96, 128, 256] as const
export const MAX_ICO_EDGE = 256

export type IcoSize = {
  width: number
  height: number
}

export type IcoOptions = {
  sizes: IcoSize[]
  fit: ResizeFit
  background?: string
  knockoutWhite?: boolean
}

export type IcoResult = {
  blob: Blob
  type: IcoFormat
  width: number
  height: number
  previewBlob: Blob
  sizes: IcoSize[]
}

function sizeKey(size: IcoSize) {
  return `${size.width}x${size.height}`
}

export function normalizeIcoSizes(sizes: IcoSize[]): IcoSize[] {
  const seen = new Set<string>()
  const next: IcoSize[] = []
  for (const size of sizes) {
    const width = Math.min(MAX_ICO_EDGE, Math.max(1, Math.round(size.width)))
    const height = Math.min(MAX_ICO_EDGE, Math.max(1, Math.round(size.height)))
    const key = sizeKey({ width, height })
    if (seen.has(key)) continue
    seen.add(key)
    next.push({ width, height })
  }
  return next.sort((a, b) => a.width * a.height - b.width * b.height || a.width - b.width)
}

function packPngsIntoIco(frames: { size: IcoSize; png: Uint8Array }[]): Blob {
  const count = frames.length
  if (!count) throw new Error('请至少选择一个尺寸')

  const headerBytes = 6
  const entryBytes = 16
  let offset = headerBytes + entryBytes * count
  const entries = frames.map((frame) => {
    const start = offset
    offset += frame.png.byteLength
    return start
  })

  const buffer = new ArrayBuffer(offset)
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)

  view.setUint16(0, 0, true)
  view.setUint16(2, 1, true)
  view.setUint16(4, count, true)

  for (let i = 0; i < count; i += 1) {
    const { size, png } = frames[i]
    const entry = headerBytes + i * entryBytes
    view.setUint8(entry, size.width >= 256 ? 0 : size.width)
    view.setUint8(entry + 1, size.height >= 256 ? 0 : size.height)
    view.setUint8(entry + 2, 0)
    view.setUint8(entry + 3, 0)
    view.setUint16(entry + 4, 1, true)
    view.setUint16(entry + 6, 32, true)
    view.setUint32(entry + 8, png.byteLength, true)
    view.setUint32(entry + 12, entries[i], true)
    bytes.set(png, entries[i])
  }

  return new Blob([buffer], { type: ICO_MIME })
}

export async function encodeIcoFromFile(
  file: File,
  kind: InputKind,
  options: IcoOptions,
): Promise<IcoResult> {
  const sizes = normalizeIcoSizes(options.sizes)
  if (!sizes.length) throw new Error('请至少选择一个尺寸')

  const bitmap = await decodeToBitmap(file, kind)
  try {
    const frames: { size: IcoSize; png: Uint8Array }[] = []
    let previewBlob: Blob | null = null

    for (const size of sizes) {
      const result = await rasterizeSourceToSize(bitmap, bitmap.width, bitmap.height, {
        type: 'image/png',
        quality: 1,
        width: size.width,
        height: size.height,
        fit: options.fit,
        background: options.background,
        knockoutWhite: options.knockoutWhite,
      })
      frames.push({ size, png: new Uint8Array(await result.blob.arrayBuffer()) })
      previewBlob = result.blob
    }

    const largest = sizes[sizes.length - 1]
    return {
      blob: packPngsIntoIco(frames),
      type: ICO_MIME,
      width: largest.width,
      height: largest.height,
      previewBlob: previewBlob!,
      sizes,
    }
  } finally {
    bitmap.close()
  }
}
