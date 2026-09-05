import { computed, onUnmounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { AcceptedFile } from '@/components/UploadPanel.vue'
import { archiveFileName, packArchive, uniqueZipName, type ArchiveFormat } from '@/utils/archiveStore'
import type { IcoFormat } from '@/utils/icoEncode'
import type { RasterFormat } from '@/utils/svgRaster'
import { t } from '@/i18n'

export const MAX_QUEUE = 30

export type QueueStatus = 'queued' | 'running' | 'done' | 'error'
export type QueueMime = RasterFormat | IcoFormat

export type QueueItem = {
  id: string
  source: AcceptedFile
  status: QueueStatus
  error?: string
  blob?: Blob
  type?: QueueMime
  width?: number
  height?: number
  keptOriginal?: boolean
  previewBlob?: Blob
}

export type QueueResult = {
  blob: Blob
  type: QueueMime
  width: number
  height: number
  keptOriginal?: boolean
  previewBlob?: Blob
}

function fileKey(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`
}

function rasterExt(type?: QueueMime) {
  if (type === 'image/jpeg') return 'jpg'
  if (type === 'image/webp') return 'webp'
  if (type === 'image/x-icon') return 'ico'
  return 'png'
}

export function resultFileName(item: QueueItem) {
  if (item.keptOriginal) return item.source.file.name
  const stem = item.source.file.name.replace(/\.[^.]+$/, '') || 'image'
  return `${stem}.${rasterExt(item.type)}`
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function useOutputQueue(process: (source: AcceptedFile) => Promise<QueueResult>) {
  const items = ref<QueueItem[]>([])
  const converting = ref(false)
  let jobSeq = 0
  let idSeq = 0
  let restartTimer: ReturnType<typeof setTimeout> | null = null

  const doneCount = computed(() => items.value.filter((item) => item.status === 'done' && item.blob).length)
  const errorCount = computed(() => items.value.filter((item) => item.status === 'error').length)
  const single = computed(() => (items.value.length === 1 ? items.value[0] : null))

  function addFiles(files: AcceptedFile[]) {
    const existing = new Set(items.value.map((item) => fileKey(item.source.file)))
    const room = MAX_QUEUE - items.value.length
    if (room <= 0) {
      ElMessage.warning(t('queue.max', { n: MAX_QUEUE }))
      return
    }
    const next: QueueItem[] = []
    for (const source of files) {
      const key = fileKey(source.file)
      if (existing.has(key)) continue
      if (next.length >= room) break
      existing.add(key)
      idSeq += 1
      next.push({ id: `${key}:${idSeq}`, source, status: 'queued' })
    }
    if (!next.length) return
    if (files.length > next.length && items.value.length + next.length >= MAX_QUEUE) {
      ElMessage.warning(t('queue.maxSlice', { n: MAX_QUEUE }))
    }
    items.value = [...items.value, ...next]
    void runQueue()
  }

  function removeItem(id: string) {
    items.value = items.value.filter((item) => item.id !== id)
  }

  function clearItems() {
    jobSeq += 1
    items.value = []
    converting.value = false
  }

  async function runQueue() {
    const current = ++jobSeq
    converting.value = true
    for (const item of items.value) {
      if (current !== jobSeq) return
      if (item.status === 'done' && item.blob) continue
      item.status = 'running'
      item.error = undefined
      try {
        const result = await process(item.source)
        if (current !== jobSeq) return
        item.blob = result.blob
        item.type = result.type
        item.width = result.width
        item.height = result.height
        item.keptOriginal = result.keptOriginal === true
        item.previewBlob = result.previewBlob
        item.status = 'done'
      } catch (error) {
        if (current !== jobSeq) return
        item.blob = undefined
        item.previewBlob = undefined
        item.status = 'error'
        item.error = error instanceof Error && error.message ? error.message : t('errors.failed')
      }
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
    if (current === jobSeq) converting.value = false
  }

  function restartQueue() {
    for (const item of items.value) {
      item.status = 'queued'
      item.blob = undefined
      item.error = undefined
      item.keptOriginal = undefined
      item.previewBlob = undefined
    }
    void runQueue()
  }

  function scheduleRestart() {
    if (!items.value.length) return
    if (restartTimer) clearTimeout(restartTimer)
    restartTimer = setTimeout(() => {
      restartQueue()
    }, 180)
  }

  function downloadItem(item: QueueItem) {
    if (!item.blob) return
    downloadBlob(item.blob, resultFileName(item))
  }

  async function downloadArchive(format: ArchiveFormat = 'zip') {
    const ready = items.value.filter((item) => item.status === 'done' && item.blob)
    if (!ready.length) {
      ElMessage.warning(t('queue.noneReady'))
      return
    }
    try {
      const used = new Set<string>()
      const entries = await Promise.all(
        ready.map(async (item) => ({
          name: uniqueZipName(used, resultFileName(item)),
          data: new Uint8Array(await item.blob!.arrayBuffer()),
        })),
      )
      const blob = await packArchive(entries, format)
      downloadBlob(blob, archiveFileName('images', format))
    } catch (error) {
      const detail = error instanceof Error && error.message ? error.message : t('errors.failed')
      ElMessage.error(t('queue.archiveFail', { detail }))
    }
  }

  onUnmounted(() => {
    jobSeq += 1
    if (restartTimer) clearTimeout(restartTimer)
  })

  return {
    items,
    converting,
    doneCount,
    errorCount,
    single,
    addFiles,
    removeItem,
    clearItems,
    scheduleRestart,
    downloadItem,
    downloadArchive,
  }
}
