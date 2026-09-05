import type { ZipEntry } from '@/utils/zipStore'

function toArrayBuffer(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer
}

function safeEntryName(name: string) {
  const base = name.replace(/\\/g, '/').split('/').filter(Boolean).pop() || 'image'
  return base.replace(/[<>:"|?*\u0000-\u001f]/g, '_') || 'image'
}

let wasmBinaryPromise: Promise<ArrayBuffer> | null = null

async function loadWasmBinary() {
  if (!wasmBinaryPromise) {
    wasmBinaryPromise = import('7z-wasm/7zz.wasm?url')
      .then((mod) => fetch(mod.default))
      .then(async (response) => {
        if (!response.ok) throw new Error('无法加载 7z 引擎')
        return response.arrayBuffer()
      })
  }
  return wasmBinaryPromise
}

function runMain(callMain: (args: string[]) => void, args: string[]) {
  try {
    callMain(args)
  } catch (error) {
    const status =
      error && typeof error === 'object' && 'status' in error
        ? Number((error as { status: unknown }).status)
        : NaN
    if (status === 0) return
    if (Number.isFinite(status) && status !== 0) {
      throw new Error(`7z 打包失败（代码 ${status}）`)
    }
    throw error
  }
}

export async function sevenZipStore(files: ZipEntry[]): Promise<Blob> {
  if (!files.length) throw new Error('没有可打包的文件')

  const [{ default: SevenZip }, wasmBinary] = await Promise.all([
    import('7z-wasm'),
    loadWasmBinary(),
  ])

  const sevenZip = await SevenZip({
    wasmBinary,
    print: () => {},
    printErr: () => {},
  })

  sevenZip.FS.mkdir('/in')
  sevenZip.FS.mkdir('/out')

  const used = new Set<string>()
  for (const file of files) {
    let name = safeEntryName(file.name)
    if (used.has(name)) {
      const dot = name.lastIndexOf('.')
      const stem = dot > 0 ? name.slice(0, dot) : name
      const ext = dot > 0 ? name.slice(dot) : ''
      let index = 2
      let next = `${stem}-${index}${ext}`
      while (used.has(next)) {
        index += 1
        next = `${stem}-${index}${ext}`
      }
      name = next
    }
    used.add(name)
    sevenZip.FS.writeFile(`/in/${name}`, file.data)
  }

  runMain(sevenZip.callMain.bind(sevenZip), ['a', '-t7z', '-mx=5', '-y', '/out/archive.7z', '/in/*'])

  let packed: Uint8Array
  try {
    packed = sevenZip.FS.readFile('/out/archive.7z', { encoding: 'binary' })
  } catch {
    throw new Error('7z 打包失败')
  }
  if (!packed.length) throw new Error('7z 打包失败')

  return new Blob([toArrayBuffer(packed)], { type: 'application/x-7z-compressed' })
}
