const TRACE_EDGES = [1024, 768, 512] as const
const COLOR_TRACE_EDGES = [800, 512, 384] as const

export function drawScaledBitmap(bitmap: ImageBitmap, maxEdge: number): HTMLCanvasElement {
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建画布')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return canvas
}

export function restoreSvgSize(
  svg: string,
  width: number,
  height: number,
  tracedWidth: number,
  tracedHeight: number,
): string {
  if (tracedWidth === width && tracedHeight === height) return svg
  return svg.replace(/<svg\b([^>]*)>/, (_match, attrs: string) => {
    const rest = attrs.replace(/\s(width|height|viewBox)="[^"]*"/g, '')
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${tracedWidth} ${tracedHeight}"${rest}>`
  })
}

export function traceEdgeSteps(extractcolors: boolean): readonly number[] {
  return extractcolors ? COLOR_TRACE_EDGES : TRACE_EDGES
}
