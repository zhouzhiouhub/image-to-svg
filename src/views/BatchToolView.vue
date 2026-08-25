<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import UploadPanel from '@/components/UploadPanel.vue'
import type { AcceptedFile } from '@/components/UploadPanel.vue'
import RasterParamPanel from '@/components/RasterParamPanel.vue'
import CompressParamPanel from '@/components/CompressParamPanel.vue'
import { useRasterize } from '@/composables/useRasterize'
import { formatBytes } from '@/utils/format'
import { uniqueZipName, zipStore } from '@/utils/zipStore'
import type { CompressOptions, CompressResult } from '@/utils/compressImage'
import type { RasterFormat, RasterOptions } from '@/utils/svgRaster'

const MAX_BATCH = 30

type BatchMode = 'format' | 'compress'
type ItemStatus = 'queued' | 'running' | 'done' | 'error'

type BatchItem = {
  id: string
  source: AcceptedFile
  status: ItemStatus
  error?: string
  blob?: Blob
  type?: RasterFormat
  width?: number
  height?: number
  keptOriginal?: boolean
}

const items = ref<BatchItem[]>([])
const mode = ref<BatchMode>('format')
const converting = ref(false)
const rasterOptions = ref<RasterOptions>({ type: 'image/png', scale: 1, quality: 0.92 })
const compressOptions = ref<CompressOptions>({
  mode: 'quality',
  format: 'auto',
  quality: 0.72,
})
const { rasterizeFile, compressFile } = useRasterize()
let jobSeq = 0
let idSeq = 0
let restartTimer: ReturnType<typeof setTimeout> | null = null

const doneCount = computed(() => items.value.filter((item) => item.status === 'done' && item.blob).length)
const errorCount = computed(() => items.value.filter((item) => item.status === 'error').length)
const pipeline = computed(() => {
  if (!items.value.length) return ''
  const action = mode.value === 'format' ? '格式转换' : '压缩'
  return `${action} ${doneCount.value}/${items.value.length}`
})

function fileKey(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`
}

function rasterExt(type?: RasterFormat) {
  if (type === 'image/jpeg') return 'jpg'
  if (type === 'image/webp') return 'webp'
  return 'png'
}

function resultName(item: BatchItem) {
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

function onAcceptedMany(files: AcceptedFile[]) {
  const existing = new Set(items.value.map((item) => fileKey(item.source.file)))
  const room = MAX_BATCH - items.value.length
  if (room <= 0) {
    ElMessage.warning(`最多同时处理 ${MAX_BATCH} 张`)
    return
  }
  const next: BatchItem[] = []
  for (const source of files) {
    const key = fileKey(source.file)
    if (existing.has(key)) continue
    if (next.length >= room) break
    existing.add(key)
    idSeq += 1
    next.push({
      id: `${key}:${idSeq}`,
      source,
      status: 'queued',
    })
  }
  if (!next.length) return
  if (files.length > next.length && items.value.length + next.length >= MAX_BATCH) {
    ElMessage.warning(`最多同时处理 ${MAX_BATCH} 张，已截取`)
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
      let result: CompressResult | { blob: Blob; type: RasterFormat; width: number; height: number; keptOriginal?: boolean }
      if (mode.value === 'format') {
        result = await rasterizeFile(item.source.file, item.source.kind, rasterOptions.value)
      } else {
        result = await compressFile(item.source.file, item.source.kind, item.source.format, compressOptions.value)
      }
      if (current !== jobSeq) return
      item.blob = result.blob
      item.type = result.type
      item.width = result.width
      item.height = result.height
      item.keptOriginal = result.keptOriginal === true
      item.status = 'done'
    } catch (error) {
      if (current !== jobSeq) return
      item.blob = undefined
      item.status = 'error'
      item.error = error instanceof Error && error.message ? error.message : '处理失败'
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

function onModeChange() {
  scheduleRestart()
}

function onRasterChange(options: RasterOptions) {
  rasterOptions.value = options
  if (mode.value === 'format') scheduleRestart()
}

function onCompressChange(options: CompressOptions) {
  compressOptions.value = options
  if (mode.value === 'compress') scheduleRestart()
}

function downloadItem(item: BatchItem) {
  if (!item.blob) return
  downloadBlob(item.blob, resultName(item))
}

async function downloadZip() {
  const ready = items.value.filter((item) => item.status === 'done' && item.blob)
  if (!ready.length) {
    ElMessage.warning('还没有可下载的结果')
    return
  }
  const used = new Set<string>()
  const entries = await Promise.all(
    ready.map(async (item) => ({
      name: uniqueZipName(used, resultName(item)),
      data: new Uint8Array(await item.blob!.arrayBuffer()),
    })),
  )
  downloadBlob(zipStore(entries), 'images.zip')
}

onUnmounted(() => {
  jobSeq += 1
  if (restartTimer) clearTimeout(restartTimer)
})
</script>

<template>
  <main class="tool">
    <UploadPanel multiple :max-files="MAX_BATCH" @accepted-many="onAcceptedMany" />
    <section class="panel">
      <h2>批量操作</h2>
      <el-radio-group v-model="mode" size="small" @change="onModeChange">
        <el-radio-button value="format">格式转换</el-radio-button>
        <el-radio-button value="compress">压缩</el-radio-button>
      </el-radio-group>
      <p class="hint">适合转格式和压缩。逐张下载，或打包成 zip。</p>
    </section>
    <RasterParamPanel
      v-if="mode === 'format'"
      title="转换参数"
      empty-text="请先添加图片后再选择导出格式"
      loading-text="正在批量转换…"
      :initial-scale="1"
      :disabled="!items.length"
      :loading="converting"
      @change="onRasterChange"
    />
    <CompressParamPanel
      v-else
      :disabled="!items.length"
      :loading="converting"
      @change="onCompressChange"
    />
    <section class="list">
      <header class="list-head">
        <span>{{ items.length ? pipeline : '尚未添加图片' }}</span>
        <span v-if="errorCount">失败 {{ errorCount }}</span>
        <el-button size="small" :disabled="!doneCount" @click="downloadZip">下载 ZIP</el-button>
        <el-button size="small" :disabled="!items.length" @click="clearItems">清空</el-button>
      </header>
      <p v-if="!items.length" class="empty">拖入多张图片后会按当前参数逐张处理</p>
      <ul v-else>
        <li v-for="item in items" :key="item.id">
          <div class="meta">
            <strong>{{ item.source.file.name }}</strong>
            <span>{{ formatBytes(item.source.file.size) }}</span>
            <span v-if="item.status === 'running'">处理中…</span>
            <span v-else-if="item.status === 'queued'">排队中</span>
            <span v-else-if="item.status === 'error'" class="warn">{{ item.error }}</span>
            <span v-else-if="item.blob">
              → {{ formatBytes(item.blob.size) }}
              <template v-if="item.keptOriginal"> · 已保留原文件</template>
            </span>
          </div>
          <div class="actions">
            <el-button size="small" :disabled="!item.blob" @click="downloadItem(item)">下载</el-button>
            <el-button size="small" @click="removeItem(item.id)">移除</el-button>
          </div>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.tool {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel,
.list {
  padding: 16px;
  background: #fff;
  border-radius: 8px;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

h2 {
  margin: 0;
  font-size: 15px;
}

.hint,
.empty {
  margin: 0;
  color: #909399;
  font-size: 13px;
}

.list-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  color: #909399;
  font-size: 13px;
}

ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid #ebeef5;
}

li:first-child {
  border-top: none;
  padding-top: 0;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  min-width: 0;
  font-size: 13px;
  color: #909399;
}

.meta strong {
  color: #303133;
  font-weight: 600;
  word-break: break-all;
}

.actions {
  display: flex;
  gap: 8px;
}

.warn {
  color: #e6a23c;
}

@media (max-width: 767px) {
  .tool {
    padding: 16px;
  }
}
</style>
