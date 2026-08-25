import type { InputKind } from '@/types/input'
import {
  canvasToBlob,
  parseSvgSize,
  rasterTypeFromFormat,
  scaledCanvasSize,
  type RasterFormat,
  type RasterizeResult,
} from '@/utils/svgRaster'

export type CompressMode = 'quality' | 'smaller'
export type CompressFormat = 'auto' | 'keep' | RasterFormat

export type CompressOptions = {
  mode: CompressMode
  format: CompressFormat
  quality: number
}

export type CompressResult = RasterizeResult & {
  keptOriginal: boolean
}

const QUALITY_KEEP = 0.92

function originalRasterType(format: string): RasterFormat {
  return rasterTypeFromFormat(format === 'svg' ? 'png' : format)
}

function hasTransparentPixels(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return false
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) return true
  }
  return false
}

function shouldProbeAlpha(kind: InputKind, sourceFormat: string) {
  return kind === 'svg' || sourceFormat === 'png' || sourceFormat === 'webp' || sourceFormat === 'gif'
}

function drawImage(
  source: CanvasImageSource,
  width: number,
  height: number,
  background?: string,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('导出失败')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  if (background) {
    ctx.fillStyle = background
    ctx.fillRect(0, 0, width, height)
  }
  ctx.drawImage(source, 0, 0, width, height)
  return canvas
}

async function encodeCandidate(
  source: CanvasImageSource,
  width: number,
  height: number,
  type: RasterFormat,
  quality: number,
): Promise<{ blob: Blob; type: RasterFormat } | null> {
  const canvas = drawImage(source, width, height, type === 'image/jpeg' ? '#ffffff' : undefined)
  try {
    const blob = await canvasToBlob(canvas, type, quality)
    return { blob, type }
  } catch {
    if (type !== 'image/webp') return null
    try {
      const blob = await canvasToBlob(canvas, 'image/png', quality)
      return { blob, type: 'image/png' }
    } catch {
      return null
    }
  }
}

function candidateTypes(format: CompressFormat, sourceFormat: string, hasAlpha: boolean): RasterFormat[] {
  if (format === 'keep') return [originalRasterType(sourceFormat)]
  if (format === 'image/png' || format === 'image/jpeg' || format === 'image/webp') return [format]
  if (hasAlpha) return ['image/webp', 'image/png']
  return ['image/webp', 'image/jpeg']
}

async function withDecodedImage<T>(
  file: File,
  kind: InputKind,
  run: (source: CanvasImageSource, width: number, height: number) => Promise<T>,
): Promise<T> {
  if (kind === 'svg') {
    const svgText = await file.text()
    const size = parseSvgSize(svgText)
    const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    try {
      const img = new Image()
      img.decoding = 'async'
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('SVG 无法渲染'))
        img.src = url
      })
      return await run(img, size.width, size.height)
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  const bitmap = await createImageBitmap(file)
  try {
    return await run(bitmap, bitmap.width, bitmap.height)
  } finally {
    bitmap.close()
  }
}

export async function compressInput(
  file: File,
  kind: InputKind,
  sourceFormat: string,
  options: CompressOptions,
): Promise<CompressResult> {
  return withDecodedImage(file, kind, async (source, sourceWidth, sourceHeight) => {
    const output = scaledCanvasSize(sourceWidth, sourceHeight, 1)
    const hasAlpha = shouldProbeAlpha(kind, sourceFormat)
      ? hasTransparentPixels(drawImage(source, output.width, output.height))
      : false
    const quality = options.mode === 'quality' ? QUALITY_KEEP : options.quality
    const types = candidateTypes(options.format, sourceFormat, hasAlpha)

    let best: { blob: Blob; type: RasterFormat } | null = null
    let fallbackToPng = false
    for (const type of types) {
      const encoded = await encodeCandidate(source, output.width, output.height, type, quality)
      if (!encoded) continue
      if (type === 'image/webp' && encoded.type === 'image/png') fallbackToPng = true
      if (!best || encoded.blob.size < best.blob.size) best = encoded
    }

    const keepOriginal = Boolean(best && best.blob.size >= file.size && kind !== 'svg')
    if (!best || keepOriginal) {
      if (!best) throw new Error('压缩失败')
      return {
        blob: file,
        type: originalRasterType(sourceFormat),
        width: output.width,
        height: output.height,
        capped: output.capped,
        fallbackToPng: false,
        keptOriginal: true,
      }
    }

    return {
      blob: best.blob,
      type: best.type,
      width: output.width,
      height: output.height,
      capped: output.capped,
      fallbackToPng,
      keptOriginal: false,
    }
  })
}
