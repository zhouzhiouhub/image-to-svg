import {
  rasterizeInput,
  svgToBlob,
  type RasterOptions,
  type RasterizeResult,
} from '@/utils/svgRaster'
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

  return { rasterize, rasterizeFile }
}
