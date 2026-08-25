export const MAX_FILE_BYTES = 20 * 1024 * 1024
export const MAX_EDGE_PX = 4096

export const ACCEPT_MIME = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/bmp',
  'image/gif',
  'image/svg+xml',
] as const

export const ACCEPT_ATTR = [...ACCEPT_MIME, '.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif', '.svg'].join(',')

export type InputKind = 'raster' | 'svg'
export type SniffedFormat = 'png' | 'jpeg' | 'webp' | 'bmp' | 'gif' | 'svg'

export type ValidateFailure = {
  ok: false
  message: string
}

export type ValidateSuccess = {
  ok: true
  kind: InputKind
  format: SniffedFormat
  width?: number
  height?: number
  warning?: string
  info?: string
}

export type ValidateResult = ValidateFailure | ValidateSuccess
