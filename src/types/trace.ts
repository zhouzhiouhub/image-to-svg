export type TraceOptions = {
  turdsize: number
  extractcolors: boolean
  posterizelevel?: number
  alphamax?: number
  opttolerance?: number
}

export type TraceRequest = {
  type: 'trace'
  id: string
  file: File
  options: TraceOptions
}

export type TraceResponse =
  | { type: 'ok'; id: string; svg: string }
  | { type: 'error'; id: string; message: string }
