import { uniqueZipName, zipStore, type ZipEntry } from '@/utils/zipStore'

export type { ZipEntry }
export { uniqueZipName }

export type ArchiveFormat = 'zip' | '7z' | 'tar' | 'tgz' | 'wim'

export const ARCHIVE_FORMATS: ArchiveFormat[] = ['zip', '7z', 'tar', 'tgz', 'wim']

const ARCHIVE_EXT: Record<ArchiveFormat, string> = {
  zip: 'zip',
  '7z': '7z',
  tar: 'tar',
  tgz: 'tar.gz',
  wim: 'wim',
}

const ARCHIVE_MIME: Record<ArchiveFormat, string> = {
  zip: 'application/zip',
  '7z': 'application/x-7z-compressed',
  tar: 'application/x-tar',
  tgz: 'application/gzip',
  wim: 'application/x-ms-wim',
}

export function archiveFileName(stem: string, format: ArchiveFormat) {
  return `${stem}.${ARCHIVE_EXT[format]}`
}

export function isArchiveFormat(value: string): value is ArchiveFormat {
  return ARCHIVE_FORMATS.includes(value as ArchiveFormat)
}

function concat(parts: Uint8Array[]) {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0))
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

function writeAscii(target: Uint8Array, offset: number, value: string, length: number) {
  const bytes = new TextEncoder().encode(value.slice(0, length))
  target.set(bytes, offset)
}

function writeOctal(target: Uint8Array, offset: number, value: number, length: number) {
  const octal = Math.max(0, value).toString(8).padStart(length - 1, '0')
  writeAscii(target, offset, `${octal}\0`, length)
}

function splitTarPath(path: string): { name: string; prefix: string } {
  const safe = path.replace(/\\/g, '/').replace(/^\/+/, '') || 'image'
  if (safe.length <= 100) return { name: safe, prefix: '' }
  if (safe.length <= 255) {
    const slash = safe.indexOf('/', safe.length - 100)
    if (slash > 0 && slash < 155) {
      return { name: safe.slice(slash + 1), prefix: safe.slice(0, slash) }
    }
  }
  return { name: safe.slice(-100), prefix: '' }
}

function tarHeader(name: string, size: number, mtimeSec: number): Uint8Array {
  const header = new Uint8Array(512)
  const path = splitTarPath(name)
  writeAscii(header, 0, path.name, 100)
  writeOctal(header, 100, 0o644, 8)
  writeOctal(header, 108, 0, 8)
  writeOctal(header, 116, 0, 8)
  writeOctal(header, 124, size, 12)
  writeOctal(header, 136, mtimeSec, 12)
  writeAscii(header, 148, '        ', 8)
  header[156] = 0x30 // regular file
  writeAscii(header, 257, 'ustar', 6)
  writeAscii(header, 263, '00', 2)
  if (path.prefix) writeAscii(header, 345, path.prefix, 155)

  let sum = 0
  for (let i = 0; i < 512; i += 1) sum += header[i]
  writeAscii(header, 148, `${sum.toString(8).padStart(6, '0')}\0 `, 8)
  return header
}

function pad512(size: number) {
  const rem = size % 512
  return rem === 0 ? 0 : 512 - rem
}

export function tarStore(files: ZipEntry[]): Uint8Array {
  const mtimeSec = Math.floor(Date.now() / 1000)
  const parts: Uint8Array[] = []
  for (const file of files) {
    parts.push(tarHeader(file.name, file.data.length, mtimeSec))
    parts.push(file.data)
    const pad = pad512(file.data.length)
    if (pad) parts.push(new Uint8Array(pad))
  }
  parts.push(new Uint8Array(1024))
  return concat(parts)
}

async function gzipBytes(data: Uint8Array): Promise<Uint8Array> {
  if (typeof CompressionStream === 'undefined') {
    throw new Error('当前浏览器不支持 GZIP 压缩')
  }
  const stream = new Blob([toArrayBuffer(data)]).stream().pipeThrough(new CompressionStream('gzip'))
  const buffer = await new Response(stream).arrayBuffer()
  return new Uint8Array(buffer)
}

function toArrayBuffer(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer
}

export async function packArchive(files: ZipEntry[], format: ArchiveFormat): Promise<Blob> {
  if (format === 'zip') return zipStore(files)
  if (format === '7z' || format === 'wim') {
    const { sevenZipStore } = await import('@/utils/sevenZipStore')
    return sevenZipStore(files, format)
  }

  const tar = tarStore(files)
  if (format === 'tar') {
    return new Blob([toArrayBuffer(tar)], { type: ARCHIVE_MIME.tar })
  }

  const gzipped = await gzipBytes(tar)
  return new Blob([toArrayBuffer(gzipped)], { type: ARCHIVE_MIME.tgz })
}
