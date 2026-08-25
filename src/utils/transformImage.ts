import type { InputKind } from '@/types/input'
import {
  canvasToBlob,
  parseSvgSize,
  rasterTypeFromFormat,
  type RasterFormat,
  type RasterizeResult,
} from '@/utils/svgRaster'

export type TransformOp = 'cw' | 'ccw' | 'flipH' | 'flipV'

export type TransformEncodeOptions = {
  type: RasterFormat
  quality: number
}

export function applyTransform(
  source: CanvasImageSource,
  width: number,
  height: number,
  op: TransformOp,
): HTMLCanvasElement {
  const swap = op === 'cw' || op === 'ccw'
  const canvas = document.createElement('canvas')
  canvas.width = swap ? height : width
  canvas.height = swap ? width : height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建画布')

  if (op === 'cw') {
    ctx.translate(canvas.width, 0)
    ctx.rotate(Math.PI / 2)
  } else if (op === 'ccw') {
    ctx.translate(0, canvas.height)
    ctx.rotate(-Math.PI / 2)
  } else if (op === 'flipH') {
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
  } else {
    ctx.translate(0, canvas.height)
    ctx.scale(1, -1)
  }
  ctx.drawImage(source, 0, 0)
  return canvas
}

export async function encodeTransformed(
  source: CanvasImageSource,
  width: number,
  height: number,
  options: TransformEncodeOptions,
): Promise<RasterizeResult> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('导出失败')
  if (options.type === 'image/jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
  }
  ctx.drawImage(source, 0, 0, width, height)

  try {
    const blob = await canvasToBlob(canvas, options.type, options.quality)
    return {
      blob,
      type: options.type,
      width,
      height,
      capped: false,
      fallbackToPng: false,
    }
  } catch (error) {
    if (options.type === 'image/webp') {
      const blob = await canvasToBlob(canvas, 'image/png', options.quality)
      return {
        blob,
        type: 'image/png',
        width,
        height,
        capped: false,
        fallbackToPng: true,
      }
    }
    throw error
  }
}

export async function decodeToBitmap(file: File, kind: InputKind): Promise<ImageBitmap> {
  if (kind !== 'svg') return createImageBitmap(file)

  const svgText = await file.text()
  parseSvgSize(svgText)
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
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(img.naturalWidth || img.width))
    canvas.height = Math.max(1, Math.round(img.naturalHeight || img.height))
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('无法创建画布')
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return createImageBitmap(canvas)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function outputTypeFromSource(format: string): RasterFormat {
  return rasterTypeFromFormat(format)
}
