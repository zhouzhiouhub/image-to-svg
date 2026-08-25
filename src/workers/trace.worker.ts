import { init, potrace } from 'esm-potrace-wasm'
import type { TraceRequest, TraceResponse } from '@/types/trace'

let ready: Promise<void> | null = null

function ensureInit() {
  if (!ready) ready = init()
  return ready
}

addEventListener('message', async (event: MessageEvent<TraceRequest>) => {
  const data = event.data
  if (data.type !== 'trace') return

  try {
    await ensureInit()
    const svg = await potrace(data.file, {
      turdsize: data.options.turdsize,
      extractcolors: data.options.extractcolors,
      posterizelevel: data.options.posterizelevel,
      alphamax: data.options.alphamax,
      opttolerance: data.options.opttolerance,
    })
    const payload: TraceResponse = {
      type: 'ok',
      id: data.id,
      svg: Array.isArray(svg) ? svg.join('') : svg,
    }
    postMessage(payload)
  } catch (error) {
    const payload: TraceResponse = {
      type: 'error',
      id: data.id,
      message: error instanceof Error ? error.message : '转换失败',
    }
    postMessage(payload)
  }
})
