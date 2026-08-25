import { MAX_EDGE_PX, MAX_FILE_BYTES, type InputKind, type ValidateResult } from '@/types/input'
import { parseSvgSize } from '@/utils/svgRaster'
import {
  isAnimatedGif,
  isAnimatedPng,
  isAnimatedWebp,
  sniffFormat,
  svgHasExternalResource,
} from '@/utils/sniffImage'
import { t } from '@/i18n'

export type ValidateOptions = {
  expect?: InputKind
  photoWarning?: boolean
}

export function useFileValidate() {
  async function validate(file: File, options: ValidateOptions = {}): Promise<ValidateResult> {
    if (!file.size) {
      return { ok: false, message: t('validate.empty') }
    }

    if (file.size > MAX_FILE_BYTES) {
      return { ok: false, message: t('validate.tooLarge') }
    }

    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    const format = sniffFormat(bytes)

    if (!format) {
      return { ok: false, message: t('validate.unsupported') }
    }

    if (format === 'gif' && isAnimatedGif(bytes)) {
      return { ok: false, message: t('validate.animated') }
    }
    if (format === 'png' && isAnimatedPng(bytes)) {
      return { ok: false, message: t('validate.animated') }
    }
    if (format === 'webp' && isAnimatedWebp(bytes)) {
      return { ok: false, message: t('validate.animated') }
    }

    if (format === 'svg') {
      if (options.expect === 'raster') {
        return { ok: false, message: t('validate.rasterOnly') }
      }

      const svgText = new TextDecoder().decode(bytes)
      if (svgHasExternalResource(svgText)) {
        return { ok: false, message: t('validate.inlineSvg') }
      }

      try {
        const size = parseSvgSize(svgText)
        return {
          ok: true,
          kind: 'svg',
          format,
          width: size.width,
          height: size.height,
          info: options.expect === 'svg' ? undefined : t('validate.svgInfo'),
        }
      } catch (error) {
        return {
          ok: false,
          message: error instanceof Error ? error.message : t('validate.svgSize'),
        }
      }
    }

    if (options.expect === 'svg') {
      return { ok: false, message: t('validate.svgOnly') }
    }

    try {
      const bitmap = await createImageBitmap(file)
      const { width, height } = bitmap
      bitmap.close()

      if (width > MAX_EDGE_PX || height > MAX_EDGE_PX) {
        return { ok: false, message: t('validate.tooBig') }
      }

      const warning =
        options.photoWarning && format === 'jpeg' && Math.min(width, height) >= 800
          ? t('validate.photo')
          : undefined

      return { ok: true, kind: 'raster', format, width, height, warning }
    } catch {
      return { ok: false, message: t('validate.unsupported') }
    }
  }

  return { validate }
}
