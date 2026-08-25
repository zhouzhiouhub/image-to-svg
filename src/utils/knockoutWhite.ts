const WHITE_TOLERANCE = 36
const WHITE_FEATHER = 28

function whiteDistance(r: number, g: number, b: number) {
  return Math.max(255 - r, 255 - g, 255 - b)
}

function backgroundCoverage(r: number, g: number, b: number) {
  const distance = whiteDistance(r, g, b)
  if (distance <= WHITE_TOLERANCE) return 1
  if (distance >= WHITE_TOLERANCE + WHITE_FEATHER) return 0
  return 1 - (distance - WHITE_TOLERANCE) / WHITE_FEATHER
}

function unblendWhite(channel: number, alpha: number) {
  if (alpha <= 0) return 0
  return Math.max(0, Math.min(255, Math.round((channel - 255 * (1 - alpha)) / alpha)))
}

export function isOpaqueRasterSource(format?: string) {
  return format === 'jpeg' || format === 'bmp' || format === 'gif'
}

export function knockoutWhiteBackground(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
  applyEdgeWhiteKnockout(image)
  ctx.putImageData(image, 0, 0)
}

function applyEdgeWhiteKnockout(image: ImageData) {
  const { data, width, height } = image
  const total = width * height
  const seen = new Uint8Array(total)
  const queue = new Uint32Array(total)
  let head = 0
  let tail = 0

  const coverageAt = (index: number) => {
    const i = index * 4
    if (data[i + 3] === 0) return 1
    return backgroundCoverage(data[i], data[i + 1], data[i + 2])
  }

  const enqueue = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const index = y * width + x
    if (seen[index]) return
    if (coverageAt(index) <= 0) return
    seen[index] = 1
    queue[tail] = index
    tail += 1
  }

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0)
    enqueue(x, height - 1)
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(0, y)
    enqueue(width - 1, y)
  }

  while (head < tail) {
    const index = queue[head]
    head += 1
    const i = index * 4
    const coverage = coverageAt(index)
    const alpha = 1 - coverage
    if (alpha <= 0) {
      data[i] = 0
      data[i + 1] = 0
      data[i + 2] = 0
      data[i + 3] = 0
    } else if (coverage > 0) {
      data[i] = unblendWhite(data[i], alpha)
      data[i + 1] = unblendWhite(data[i + 1], alpha)
      data[i + 2] = unblendWhite(data[i + 2], alpha)
      data[i + 3] = Math.round(data[i + 3] * alpha)
    }

    const x = index % width
    const y = Math.floor(index / width)
    enqueue(x - 1, y)
    enqueue(x + 1, y)
    enqueue(x, y - 1)
    enqueue(x, y + 1)
  }
}
