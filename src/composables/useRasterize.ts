import { svgToBlob, type RasterOptions } from '@/utils/svgRaster'

export function useRasterize() {
  async function rasterize(svgText: string, options: RasterOptions): Promise<Blob> {
    return svgToBlob(svgText, options)
  }

  return { rasterize }
}
