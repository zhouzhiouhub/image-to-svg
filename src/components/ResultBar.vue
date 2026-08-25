<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { AcceptedFile } from '@/components/UploadPanel.vue'
import { formatBytes } from '@/utils/format'
import type { RasterFormat } from '@/utils/svgRaster'

const props = defineProps<{
  source?: AcceptedFile | null
  pipeline?: string
  svg?: string | null
  rasterBlob?: Blob | null
  rasterType?: RasterFormat
  resultWidth?: number
  resultHeight?: number
  keptOriginal?: boolean
}>()

const emit = defineEmits<{
  replace: []
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
const savedPercent = computed(() => {
  if (!props.source || !props.rasterBlob || props.rasterBlob.size >= props.source.file.size) return 0
  return Math.round((1 - props.rasterBlob.size / props.source.file.size) * 100)
})
const pipelineLabel = computed(() => {
  if (props.pipeline) return props.pipeline
  if (!props.source) return ''
  return props.source.kind === 'svg' ? 'SVG → 位图' : '位图 → SVG'
})

function fileStem() {
  const name = props.source?.file.name ?? 'result'
  return name.replace(/\.[^.]+$/, '') || 'result'
}

function rasterExt() {
  const type = props.rasterType ?? props.rasterBlob?.type
  if (type === 'image/jpeg') return 'jpg'
  if (type === 'image/webp') return 'webp'
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
  if (props.keptOriginal && props.source) {
    download(props.rasterBlob, props.source.file.name)
    return
  }
  download(props.rasterBlob, `${fileStem()}.${rasterExt()}`)
}
</script>

<template>
  <section class="bar">
    <template v-if="source">
      <span>{{ source.file.name }}</span>
      <span>{{ pipelineLabel }}</span>
      <span>{{ formatBytes(source.file.size) }}</span>
      <span v-if="source.width && source.height">{{ source.width }} × {{ source.height }}</span>
      <template v-if="svg">
        <span :class="{ warn: larger }">SVG {{ formatBytes(svgBytes) }}</span>
        <span>路径 {{ pathCount }}</span>
        <el-button size="small" type="primary" @click="downloadSvg">下载 SVG</el-button>
        <el-button size="small" @click="copySvg">复制代码</el-button>
      </template>
      <template v-if="rasterBlob">
        <span :class="{ warn: larger, ok: savedPercent > 0 }">结果 {{ formatBytes(rasterBytes) }}</span>
        <span v-if="savedPercent > 0">减小 {{ savedPercent }}%</span>
        <span v-else-if="keptOriginal">体积未减小</span>
        <span v-if="resultWidth && resultHeight">{{ resultWidth }} × {{ resultHeight }}</span>
        <el-button size="small" type="primary" @click="downloadRaster">
          下载 {{ keptOriginal ? '原文件' : rasterExt().toUpperCase() }}
        </el-button>
      </template>
      <el-button size="small" @click="emit('replace')">换一张</el-button>
    </template>
    <span v-else>上传后可预览体积并下载</span>
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

.ok {
  color: #67c23a;
}
</style>
