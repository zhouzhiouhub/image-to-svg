import {
  canvasToBlob,
  type RasterFormat,
  type RasterizeResult,
} from '@/utils/svgRaster'

export type CropRect = {
  x: number
  y: number
  width: number
  height: number
}

export function fullCrop(width: number, height: number): CropRect {
  return { x: 0, y: 0, width, height }
}

export function clampCrop(crop: CropRect, imageWidth: number, imageHeight: number): CropRect {
  const width = Math.min(imageWidth, Math.max(1, Math.round(crop.width)))
  const height = Math.min(imageHeight, Math.max(1, Math.round(crop.height)))
  const x = Math.min(imageWidth - width, Math.max(0, Math.round(crop.x)))
  const y = Math.min(imageHeight - height, Math.max(0, Math.round(crop.y)))
  return { x, y, width, height }
}

export function fitCropAspect(
  crop: CropRect,
  imageWidth: number,
  imageHeight: number,
  aspect: number,
): CropRect {
  let width = Math.min(imageWidth, Math.max(1, crop.width))
  let height = Math.max(1, Math.round(width / aspect))
  if (height > imageHeight) {
    height = imageHeight
    width = Math.max(1, Math.round(height * aspect))
  }
  if (width > imageWidth) {
    width = imageWidth
    height = Math.max(1, Math.round(width / aspect))
  }
  return clampCrop({ ...crop, width, height }, imageWidth, imageHeight)
}

export function cropToCanvas(
  source: CanvasImageSource,
  crop: CropRect,
  background?: string,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = crop.width
  canvas.height = crop.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建画布')
  if (background) {
    ctx.fillStyle = background
    ctx.fillRect(0, 0, crop.width, crop.height)
  }
  ctx.drawImage(source, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height)
  return canvas
}

export async function encodeCrop(
  source: CanvasImageSource,
  crop: CropRect,
  type: RasterFormat,
  quality: number,
): Promise<RasterizeResult> {
  const canvas = cropToCanvas(source, crop, type === 'image/jpeg' ? '#ffffff' : undefined)
  try {
    const blob = await canvasToBlob(canvas, type, quality)
    return {
      blob,
      type,
      width: crop.width,
      height: crop.height,
      capped: false,
      fallbackToPng: false,
    }
  } catch (error) {
    if (type === 'image/webp') {
      const blob = await canvasToBlob(canvas, 'image/png', quality)
      return {
        blob,
        type: 'image/png',
        width: crop.width,
        height: crop.height,
        capped: false,
        fallbackToPng: true,
      }
    }
    throw error
  }
}
