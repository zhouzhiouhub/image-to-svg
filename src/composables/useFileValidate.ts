import { MAX_EDGE_PX, MAX_FILE_BYTES, type ValidateResult } from '@/types/input'
import {
  isAnimatedGif,
  isAnimatedPng,
  isAnimatedWebp,
  sniffFormat,
  svgHasExternalResource,
} from '@/utils/sniffImage'

const UNSUPPORTED = '仅支持 PNG / JPG / WebP / BMP / 静态 GIF / SVG 图片'
const ANIMATED = '动图暂不支持转换，仅支持静态图片'

export function useFileValidate() {
  async function validate(file: File): Promise<ValidateResult> {
    if (!file.size) {
      return { ok: false, message: '未检测到可见内容' }
    }

    if (file.size > MAX_FILE_BYTES) {
      return { ok: false, message: '文件超过 20MB，请裁剪或压缩后再试' }
    }

    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    const format = sniffFormat(bytes)

    if (!format) {
      return { ok: false, message: UNSUPPORTED }
    }

    if (format === 'gif' && isAnimatedGif(bytes)) {
      return { ok: false, message: ANIMATED }
    }
    if (format === 'png' && isAnimatedPng(bytes)) {
      return { ok: false, message: ANIMATED }
    }
    if (format === 'webp' && isAnimatedWebp(bytes)) {
      return { ok: false, message: ANIMATED }
    }

    if (format === 'svg') {
      const svgText = new TextDecoder().decode(bytes)
      if (svgHasExternalResource(svgText)) {
        return { ok: false, message: '请使用内联资源的 SVG（图片请转 data URI）' }
      }

      return {
        ok: true,
        kind: 'svg',
        format,
        info: '已检测到 SVG，将导出为 PNG / JPEG / WebP',
      }
    }

    try {
      const bitmap = await createImageBitmap(file)
      const { width, height } = bitmap
      bitmap.close()

      if (width > MAX_EDGE_PX || height > MAX_EDGE_PX) {
        return { ok: false, message: '图片边长超过 4096px，请裁剪后再试' }
      }

      const warning =
        format === 'jpeg' && Math.min(width, height) >= 800
          ? '检测到照片类图片，转换效果可能不佳，建议使用小图标/Logo'
          : undefined

      return { ok: true, kind: 'raster', format, width, height, warning }
    } catch {
      return { ok: false, message: UNSUPPORTED }
    }
  }

  return { validate }
}
