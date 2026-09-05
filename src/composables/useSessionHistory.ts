import { computed, ref } from 'vue'
import type { IcoFormat } from '@/utils/icoEncode'
import type { RasterFormat } from '@/utils/svgRaster'

export type HistoryRecordInput = {
  groupKey: string
  title: string
  pipeline: string
  sourceName: string
  svg?: string
  rasterBlob?: Blob
  rasterType?: RasterFormat | IcoFormat
  keptOriginal?: boolean
}

export type HistoryRecord = HistoryRecordInput & {
  id: string
  createdAt: number
  previewUrl: string
}

type StoredRecord = Omit<HistoryRecord, 'previewUrl'>

const MAX_HISTORY = 12
const DB_NAME = 'kinolin-tool'
const STORE = 'history'
const LIST_KEY = 'records'
const records = ref<HistoryRecord[]>([])

function previewFrom(input: Pick<HistoryRecordInput, 'svg' | 'rasterBlob'>) {
  if (input.rasterBlob) return URL.createObjectURL(input.rasterBlob)
  if (input.svg) return URL.createObjectURL(new Blob([input.svg], { type: 'image/svg+xml' }))
  return ''
}

function revoke(record: HistoryRecord) {
  if (record.previewUrl) URL.revokeObjectURL(record.previewUrl)
}

function toStored(record: HistoryRecord): StoredRecord {
  const { previewUrl: _previewUrl, ...rest } = record
  return rest
}

function fromStored(record: StoredRecord): HistoryRecord {
  return {
    ...record,
    previewUrl: previewFrom(record),
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('无法打开本地记录'))
  })
}

function txDone(tx: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('本地记录写入失败'))
    tx.onabort = () => reject(tx.error ?? new Error('本地记录已取消'))
  })
}

async function persist() {
  if (typeof indexedDB === 'undefined') return
  const db = await openDb()
  try {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(records.value.map(toStored), LIST_KEY)
    await txDone(tx)
  } finally {
    db.close()
  }
}

async function restore() {
  if (typeof indexedDB === 'undefined') return
  const db = await openDb()
  try {
    const stored = await new Promise<StoredRecord[] | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const request = tx.objectStore(STORE).get(LIST_KEY)
      request.onsuccess = () => resolve(request.result as StoredRecord[] | undefined)
      request.onerror = () => reject(request.error ?? new Error('无法读取本地记录'))
    })
    if (!Array.isArray(stored) || !stored.length) return
    records.value = stored.slice(0, MAX_HISTORY).map(fromStored)
  } finally {
    db.close()
  }
}

let ready: Promise<void> | undefined

function whenHistoryReady() {
  ready ||= restore().catch(() => undefined)
  return ready
}

function afterReady(run: () => void) {
  void whenHistoryReady().then(run)
}

export function loadSessionHistory() {
  return whenHistoryReady()
}

export function recordHistory(input: HistoryRecordInput) {
  if (!input.svg && !input.rasterBlob) return
  afterReady(() => {
    const existing = records.value.find((item) => item.groupKey === input.groupKey)
    if (existing) revoke(existing)
    const next: HistoryRecord = {
      ...input,
      id: `${input.groupKey}:${Date.now()}`,
      createdAt: Date.now(),
      previewUrl: previewFrom(input),
    }
    const list = [next, ...records.value.filter((item) => item.groupKey !== input.groupKey)]
    for (const extra of list.slice(MAX_HISTORY)) revoke(extra)
    records.value = list.slice(0, MAX_HISTORY)
    void persist()
  })
}

export function removeHistory(id: string) {
  afterReady(() => {
    const target = records.value.find((item) => item.id === id)
    if (target) revoke(target)
    records.value = records.value.filter((item) => item.id !== id)
    void persist()
  })
}

export function clearHistory() {
  afterReady(() => {
    for (const item of records.value) revoke(item)
    records.value = []
    void persist()
  })
}

export function useSessionHistory() {
  return {
    records: computed(() => records.value),
  }
}
