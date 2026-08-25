import { MAX_EDGE_PX, type InputKind } from '@/types/input'

export type RasterFormat = 'image/png' | 'image/jpeg' | 'image/webp'

export type RasterOptions = {
  type: RasterFormat
  quality: number
  scale: number
  background?: string
}

export type ResizeFit = 'contain' | 'cover' | 'stretch'

export type ResizeOptions = {
  type: RasterFormat
  quality: number
  width: number
  height: number
  fit: ResizeFit
  background?: string
}

export type RasterizeResult = {
  blob: Blob
  type: RasterFormat
  width: number
  height: number
  capped: boolean
  fallbackToPng: boolean
}

function parseLength(value: string | null): number | null {
  if (!value) return null
  const match = value.trim().match(/^([\d.]+)(?:px)?$/i)
  if (!match) return null
  const num = Number(match[1])
  return Number.isFinite(num) && num > 0 ? num : null
}

export function parseSvgSize(svgText: string): { width: number; height: number } {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  const root = doc.documentElement
  if (!root || root.tagName.toLowerCase() !== 'svg') {
    throw new Error('SVG 无法渲染')
  }

  const width = parseLength(root.getAttribute('width'))
  const height = parseLength(root.getAttribute('height'))
  if (width && height) return { width, height }

  const viewBox = root.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number)
  if (viewBox && viewBox.length === 4 && viewBox[2] > 0 && viewBox[3] > 0) {
    return { width: viewBox[2], height: viewBox[3] }
  }

  throw new Error('SVG 缺少尺寸信息，无法导出')
}

export function scaledCanvasSize(width: number, height: number, scale: number) {
  let nextWidth = Math.max(1, Math.round(width * scale))
  let nextHeight = Math.max(1, Math.round(height * scale))
  const edge = Math.max(nextWidth, nextHeight)
  let capped = false
  if (edge > MAX_EDGE_PX) {
    const factor = MAX_EDGE_PX / edge
    nextWidth = Math.max(1, Math.round(nextWidth * factor))
    nextHeight = Math.max(1, Math.round(nextHeight * factor))
    capped = true
  }
  return { width: nextWidth, height: nextHeight, capped }
}

export function rasterTypeFromFormat(format: string): RasterFormat {
  if (format === 'jpeg' || format === 'image/jpeg') return 'image/jpeg'
  if (format === 'webp' || format === 'image/webp') return 'image/webp'
  return 'image/png'
}

function resolveBackground(options: { type: RasterFormat; background?: string }): string | undefined {
  if (options.type === 'image/jpeg') return options.background ?? '#ffffff'
  return options.background
}

export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: RasterFormat,
  quality: number,
): Promise<Blob> {
  const out = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality)
  })
  if (!out) throw new Error('导出失败')
  if (out.type !== type) {
    throw new Error(`当前浏览器不支持导出 ${type}`)
  }
  return out
}

function drawSource(
  source: CanvasImageSource,
  width: number,
  height: number,
  background?: string,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('导出失败')
  if (background) {
    ctx.fillStyle = background
    ctx.fillRect(0, 0, width, height)
  }
  ctx.drawImage(source, 0, 0, width, height)
  return canvas
}

function drawFitted(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  destWidth: number,
  destHeight: number,
  fit: ResizeFit,
  background?: string,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = destWidth
  canvas.height = destHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('导出失败')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  if (background) {
    ctx.fillStyle = background
    ctx.fillRect(0, 0, destWidth, destHeight)
  }

  if (fit === 'stretch') {
    ctx.drawImage(source, 0, 0, destWidth, destHeight)
    return canvas
  }

  const scale =
    fit === 'cover'
      ? Math.max(destWidth / sourceWidth, destHeight / sourceHeight)
      : Math.min(destWidth / sourceWidth, destHeight / sourceHeight)
  const drawWidth = sourceWidth * scale
  const drawHeight = sourceHeight * scale
  ctx.drawImage(source, (destWidth - drawWidth) / 2, (destHeight - drawHeight) / 2, drawWidth, drawHeight)
  return canvas
}

async function encodeCanvas(
  canvas: HTMLCanvasElement,
  options: { type: RasterFormat; quality: number },
): Promise<{ blob: Blob; type: RasterFormat; fallbackToPng: boolean }> {
  try {
    const blob = await canvasToBlob(canvas, options.type, options.quality)
    return { blob, type: options.type, fallbackToPng: false }
  } catch (error) {
    if (options.type === 'image/webp') {
      const blob = await canvasToBlob(canvas, 'image/png', options.quality)
      return { blob, type: 'image/png', fallbackToPng: true }
    }
    throw error
  }
}

export async function rasterizeSvgText(svgText: string, options: RasterOptions): Promise<RasterizeResult> {
  const size = parseSvgSize(svgText)
  const output = scaledCanvasSize(size.width, size.height, options.scale)
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

    const canvas = drawSource(img, output.width, output.height, resolveBackground(options))
    const encoded = await encodeCanvas(canvas, options)
    return {
      ...encoded,
      width: output.width,
      height: output.height,
      capped: output.capped,
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function svgToBlob(svgText: string, options: RasterOptions): Promise<Blob> {
  const result = await rasterizeSvgText(svgText, options)
  return result.blob
}

export async function rasterizeBitmapFile(file: File, options: RasterOptions): Promise<RasterizeResult> {
  const bitmap = await createImageBitmap(file)
  try {
    const output = scaledCanvasSize(bitmap.width, bitmap.height, options.scale)
    const canvas = drawSource(bitmap, output.width, output.height, resolveBackground(options))
    const encoded = await encodeCanvas(canvas, options)
    return {
      ...encoded,
      width: output.width,
      height: output.height,
      capped: output.capped,
    }
  } finally {
    bitmap.close()
  }
}

export async function rasterizeInput(
  file: File,
  kind: InputKind,
  options: RasterOptions,
): Promise<RasterizeResult> {
  if (kind === 'svg') {
    return rasterizeSvgText(await file.text(), options)
  }
  return rasterizeBitmapFile(file, options)
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

export async function rasterizeToSize(
  file: File,
  kind: InputKind,
  options: ResizeOptions,
): Promise<RasterizeResult> {
  return withDecodedImage(file, kind, async (source, sourceWidth, sourceHeight) => {
    const output = scaledCanvasSize(options.width, options.height, 1)
    const canvas = drawFitted(
      source,
      sourceWidth,
      sourceHeight,
      output.width,
      output.height,
      options.fit,
      resolveBackground(options),
    )
    const encoded = await encodeCanvas(canvas, options)
    return {
      ...encoded,
      width: output.width,
      height: output.height,
      capped: output.capped,
    }
  })
}
