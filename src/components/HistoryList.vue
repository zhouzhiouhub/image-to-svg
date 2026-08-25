<script setup lang="ts">
import { useSessionHistory, removeHistory, clearHistory } from '@/composables/useSessionHistory'
import { formatBytes } from '@/utils/format'
import type { RasterFormat } from '@/utils/svgRaster'
import { t } from '@/i18n'

const { records } = useSessionHistory()

function rasterExt(type?: RasterFormat, blob?: Blob) {
  const mime = type ?? blob?.type
  if (mime === 'image/jpeg') return 'jpg'
  if (mime === 'image/webp') return 'webp'
  return 'png'
}

function stem(name: string) {
  return name.replace(/\.[^.]+$/, '') || 'result'
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function downloadSvg(svg: string, sourceName: string) {
  download(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), `${stem(sourceName)}.svg`)
}

function downloadRaster(record: (typeof records.value)[number]) {
  if (!record.rasterBlob) return
  const name = record.keptOriginal
    ? record.sourceName
    : `${stem(record.sourceName)}.${rasterExt(record.rasterType, record.rasterBlob)}`
  download(record.rasterBlob, name)
}
</script>

<template>
  <section v-if="records.length" class="panel">
    <header>
      <div>
        <h2>{{ t('history.title') }}</h2>
        <p class="hint">{{ t('history.hint') }}</p>
      </div>
      <el-button size="small" @click="clearHistory">{{ t('history.clear') }}</el-button>
    </header>
    <ul>
      <li v-for="item in records" :key="item.id">
        <img :src="item.previewUrl" :alt="item.sourceName" />
        <div class="meta">
          <strong>{{ item.sourceName }}</strong>
          <span>{{ item.title }}{{ item.pipeline ? ` · ${item.pipeline}` : '' }}</span>
          <span v-if="item.rasterBlob">{{ formatBytes(item.rasterBlob.size) }}</span>
        </div>
        <div class="actions">
          <el-button v-if="item.svg" size="small" @click="downloadSvg(item.svg, item.sourceName)">
            SVG
          </el-button>
          <el-button v-if="item.rasterBlob" size="small" type="primary" @click="downloadRaster(item)">
            {{ t('history.download') }}
          </el-button>
          <el-button size="small" @click="removeHistory(item.id)">{{ t('history.remove') }}</el-button>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.panel {
  max-width: 1280px;
  margin: 0 auto 24px;
  padding: 16px;
  background: var(--app-surface);
  border-radius: 8px;
}

header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

h2 {
  margin: 0;
  font-size: 15px;
}

.hint {
  margin: 4px 0 0;
  color: var(--app-faint);
  font-size: 12px;
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
  gap: 12px;
  padding: 8px 0;
  border-top: 1px solid var(--app-border);
}

li:first-child {
  border-top: none;
  padding-top: 0;
}

img {
  width: 48px;
  height: 48px;
  object-fit: contain;
  background: var(--app-bg);
  border-radius: 4px;
}

.meta {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 160px;
  font-size: 13px;
  color: var(--app-faint);
}

.meta strong {
  color: var(--app-text);
  font-weight: 600;
  word-break: break-all;
}

.actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 767px) {
  .panel {
    margin: 0 16px 16px;
  }
}
</style>
