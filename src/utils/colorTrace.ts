import ImageTracer from 'imagetracerjs'
import type { TraceOptions } from '@/types/trace'

export function traceColorImageData(imageData: ImageData, options: TraceOptions): string {
  return ImageTracer.imagedataToSVG(imageData, {
    numberofcolors: options.posterizelevel ?? 16,
    pathomit: options.turdsize,
    colorsampling: 2,
    colorquantcycles: 3,
    mincolorratio: 0,
    ltres: 1,
    qtres: 1,
    scale: 1,
    viewbox: true,
    strokewidth: 1,
    roundcoords: 1,
    rightangleenhance: true,
    desc: false,
    blurradius: 0,
    linefilter: false,
    layering: 0,
  })
}
