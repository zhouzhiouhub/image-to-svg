import type { TraceOptions, TraceRequest, TraceResponse } from '@/types/trace'

export function useTrace() {
  let worker: Worker | null = null

  function getWorker() {
    if (!worker) {
      worker = new Worker(new URL('../workers/trace.worker.ts', import.meta.url), {
        type: 'module',
      })
    }
    return worker
  }

  function trace(file: File, options: TraceOptions): Promise<string> {
    const id = crypto.randomUUID()
    const current = getWorker()

    return new Promise((resolve, reject) => {
      const onMessage = (event: MessageEvent<TraceResponse>) => {
        if (event.data.id !== id) return
        current.removeEventListener('message', onMessage)
        if (event.data.type === 'ok') resolve(event.data.svg)
        else reject(new Error(event.data.message))
      }

      current.addEventListener('message', onMessage)
      const request: TraceRequest = { type: 'trace', id, file, options }
      current.postMessage(request)
    })
  }

  return { trace }
}
