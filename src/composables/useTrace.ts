import { init, potrace } from 'esm-potrace-wasm'
import type { TraceOptions } from '@/types/trace'
import { traceColorImageData } from '@/utils/colorTrace'
import { canvasImageData, drawScaledBitmap, restoreSvgSize, traceEdgeSteps } from '@/utils/traceImage'

let ready: Promise<void> | null = null

function ensureInit() {
  if (!ready) ready = init()
  return ready
}

export function useTrace() {
  async function trace(file: File, options: TraceOptions): Promise<string> {
    const bitmap = await createImageBitmap(file)
    const sourceWidth = bitmap.width
    const sourceHeight = bitmap.height
    let lastError: unknown

    try {
      if (options.extractcolors) {
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => resolve())
        })
        for (const maxEdge of traceEdgeSteps(true, sourceWidth, sourceHeight)) {
          const canvas = drawScaledBitmap(bitmap, maxEdge)
          try {
            const svg = traceColorImageData(canvasImageData(canvas), options)
            return restoreSvgSize(svg, sourceWidth, sourceHeight, canvas.width, canvas.height)
          } catch (error) {
            lastError = error
          }
        }
      } else {
        await ensureInit()
        for (const maxEdge of traceEdgeSteps(false, sourceWidth, sourceHeight)) {
          const canvas = drawScaledBitmap(bitmap, maxEdge)
          try {
            const svg = await potrace(canvas, {
              turdsize: options.turdsize,
              extractcolors: false,
              alphamax: options.alphamax,
              opttolerance: options.opttolerance,
            })
            const markup = Array.isArray(svg) ? svg.join('') : svg
            return restoreSvgSize(markup, sourceWidth, sourceHeight, canvas.width, canvas.height)
          } catch (error) {
            lastError = error
          }
        }
      }
    } finally {
      bitmap.close()
    }

    throw lastError instanceof Error ? lastError : new Error('转换失败')
  }

  return { trace }
}
