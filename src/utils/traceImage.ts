const MONO_FALLBACK_EDGES = [1024, 768, 512] as const
const COLOR_FALLBACK_EDGES = [2048, 1600, 1280, 960] as const

export function drawScaledBitmap(bitmap: ImageBitmap, maxEdge: number): HTMLCanvasElement {
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('无法创建画布')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return canvas
}

export function canvasImageData(canvas: HTMLCanvasElement): ImageData {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('无法读取像素')
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

export function restoreSvgSize(
  svg: string,
  width: number,
  height: number,
  tracedWidth: number,
  tracedHeight: number,
): string {
  if (tracedWidth === width && tracedHeight === height && /\swidth="/.test(svg) && /\sheight="/.test(svg)) {
    return svg
  }
  return svg.replace(/<svg\b([^>]*)>/, (_match, attrs: string) => {
    const rest = attrs.replace(/\s(width|height|viewBox)="[^"]*"/g, '')
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${tracedWidth} ${tracedHeight}"${rest}>`
  })
}

export function traceEdgeSteps(extractcolors: boolean, width: number, height: number): number[] {
  const native = Math.max(width, height)
  const caps = extractcolors ? COLOR_FALLBACK_EDGES : [native, ...MONO_FALLBACK_EDGES]
  const steps: number[] = []
  for (const cap of caps) {
    const edge = Math.min(native, cap)
    if (!steps.includes(edge)) steps.push(edge)
  }
  return steps
}
