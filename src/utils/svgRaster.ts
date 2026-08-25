export type RasterFormat = 'image/png' | 'image/jpeg' | 'image/webp'

export type RasterOptions = {
  type: RasterFormat
  quality: number
  scale: number
  background?: string
}

function parseLength(value: string | null): number | null {
  if (!value) return null
  const match = value.trim().match(/^([\d.]+)(?:px)?$/i)
  if (!match) return null
  const num = Number(match[1])
  return Number.isFinite(num) && num > 0 ? num : null
}

export function parseSvgSize(svgText: string): { width: number; height: number } {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  const root = doc.documentElement
  if (!root || root.tagName.toLowerCase() !== 'svg') {
    throw new Error('SVG 无法渲染')
  }

  const width = parseLength(root.getAttribute('width'))
  const height = parseLength(root.getAttribute('height'))
  if (width && height) return { width, height }

  const viewBox = root.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number)
  if (viewBox && viewBox.length === 4 && viewBox[2] > 0 && viewBox[3] > 0) {
    return { width: viewBox[2], height: viewBox[3] }
  }

  throw new Error('SVG 缺少尺寸信息，无法导出')
}

export async function svgToBlob(svgText: string, options: RasterOptions): Promise<Blob> {
  const size = parseSvgSize(svgText)
  const width = Math.max(1, Math.round(size.width * options.scale))
  const height = Math.max(1, Math.round(size.height * options.scale))

  const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  try {
    const img = new Image()
    img.decoding = 'async'
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('SVG 无法渲染'))
      img.src = url
    })

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('导出失败')

    if (options.background) {
      ctx.fillStyle = options.background
      ctx.fillRect(0, 0, width, height)
    }
    ctx.drawImage(img, 0, 0, width, height)

    const out = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, options.type, options.quality)
    })
    if (!out) throw new Error('导出失败')
    if (out.type !== options.type) {
      throw new Error(`当前浏览器不支持导出 ${options.type}`)
    }
    return out
  } finally {
    URL.revokeObjectURL(url)
  }
}
