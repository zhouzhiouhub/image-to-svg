import {
  rasterizeInput,
  rasterizeToSize,
  svgToBlob,
  type RasterOptions,
  type RasterizeResult,
  type ResizeOptions,
} from '@/utils/svgRaster'
import { compressInput, type CompressOptions, type CompressResult } from '@/utils/compressImage'
import type { InputKind } from '@/types/input'

export function useRasterize() {
  async function rasterize(svgText: string, options: RasterOptions): Promise<Blob> {
    return svgToBlob(svgText, options)
  }

  async function rasterizeFile(
    file: File,
    kind: InputKind,
    options: RasterOptions,
  ): Promise<RasterizeResult> {
    return rasterizeInput(file, kind, options)
  }

  async function resizeFile(
    file: File,
    kind: InputKind,
    options: ResizeOptions,
  ): Promise<RasterizeResult> {
    return rasterizeToSize(file, kind, options)
  }

  async function compressFile(
    file: File,
    kind: InputKind,
    sourceFormat: string,
    options: CompressOptions,
  ): Promise<CompressResult> {
    return compressInput(file, kind, sourceFormat, options)
  }

  return { rasterize, rasterizeFile, resizeFile, compressFile }
}
