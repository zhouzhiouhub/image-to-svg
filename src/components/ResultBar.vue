<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { AcceptedFile } from '@/components/UploadPanel.vue'
import { formatBytes } from '@/utils/format'
import type { RasterFormat } from '@/utils/svgRaster'

const props = defineProps<{
  source?: AcceptedFile | null
  svg?: string | null
  rasterBlob?: Blob | null
  rasterType?: RasterFormat
}>()

const pathCount = computed(() => props.svg?.match(/<path\b/gi)?.length ?? 0)
const svgBytes = computed(() => (props.svg ? new Blob([props.svg]).size : 0))
const rasterBytes = computed(() => props.rasterBlob?.size ?? 0)
const larger = computed(() => {
  if (!props.source) return false
  if (props.svg) return svgBytes.value > props.source.file.size
  if (props.rasterBlob) return rasterBytes.value > props.source.file.size
  return false
})

function fileStem() {
  const name = props.source?.file.name ?? 'result'
  return name.replace(/\.[^.]+$/, '') || 'result'
}

function rasterExt() {
  if (props.rasterType === 'image/jpeg') return 'jpg'
  if (props.rasterType === 'image/webp') return 'webp'
  return 'png'
}

async function copySvg() {
  if (!props.svg) return
  try {
    await navigator.clipboard.writeText(props.svg)
    ElMessage.success('已复制 SVG 代码')
  } catch {
    ElMessage.error('复制失败，请手动选择代码')
  }
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function downloadSvg() {
  if (!props.svg) return
  download(new Blob([props.svg], { type: 'image/svg+xml;charset=utf-8' }), `${fileStem()}.svg`)
}

function downloadRaster() {
  if (!props.rasterBlob) return
  download(props.rasterBlob, `${fileStem()}.${rasterExt()}`)
}
</script>

<template>
  <section class="bar">
    <template v-if="source">
      <span>{{ source.file.name }}</span>
      <span>{{ source.kind === 'svg' ? 'SVG → 位图' : '位图 → SVG' }}</span>
      <span>{{ formatBytes(source.file.size) }}</span>
      <span v-if="source.width && source.height">{{ source.width }} × {{ source.height }}</span>
      <template v-if="svg">
        <span :class="{ warn: larger }">SVG {{ formatBytes(svgBytes) }}</span>
        <span>路径 {{ pathCount }}</span>
        <el-button size="small" type="primary" @click="downloadSvg">下载 SVG</el-button>
        <el-button size="small" @click="copySvg">复制代码</el-button>
      </template>
      <template v-else-if="rasterBlob">
        <span :class="{ warn: larger }">结果 {{ formatBytes(rasterBytes) }}</span>
        <el-button size="small" type="primary" @click="downloadRaster">下载 {{ rasterExt().toUpperCase() }}</el-button>
      </template>
    </template>
    <span v-else>指标与下载（待接入）</span>
  </section>
</template>

<style scoped>
.bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px;
  color: #909399;
  font-size: 13px;
}

.warn {
  color: #e6a23c;
}
</style>
