<script setup lang="ts">
import { computed, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { AcceptedFile } from '@/components/UploadPanel.vue'
import { recordHistory } from '@/composables/useSessionHistory'
import { formatBytes } from '@/utils/format'
import type { IcoFormat } from '@/utils/icoEncode'
import type { RasterFormat } from '@/utils/svgRaster'
import { t } from '@/i18n'

const props = defineProps<{
  source?: AcceptedFile | null
  pipeline?: string
  svg?: string | null
  rasterBlob?: Blob | null
  rasterType?: RasterFormat | IcoFormat
  resultWidth?: number
  resultHeight?: number
  keptOriginal?: boolean
}>()

const emit = defineEmits<{
  replace: []
}>()

const route = useRoute()
let historyTimer: ReturnType<typeof setTimeout> | null = null

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
  return props.source.kind === 'svg' ? t('result.svgToRaster') : t('result.rasterToSvg')
})

function fileStem() {
  const name = props.source?.file.name ?? 'result'
  return name.replace(/\.[^.]+$/, '') || 'result'
}

function rasterExt() {
  const type = props.rasterType ?? props.rasterBlob?.type
  if (type === 'image/jpeg') return 'jpg'
  if (type === 'image/webp') return 'webp'
  if (type === 'image/x-icon') return 'ico'
  return 'png'
}

async function copySvg() {
  if (!props.svg) return
  try {
    await navigator.clipboard.writeText(props.svg)
    ElMessage.success(t('result.copied'))
  } catch {
    ElMessage.error(t('result.copyFail'))
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

watch(
  () => [props.source, props.svg, props.rasterBlob, props.rasterType, props.pipeline, props.keptOriginal] as const,
  () => {
    if (historyTimer) clearTimeout(historyTimer)
    if (!props.source || (!props.svg && !props.rasterBlob)) return
    historyTimer = setTimeout(() => {
      if (!props.source || (!props.svg && !props.rasterBlob)) return
      recordHistory({
        groupKey: `${String(route.name)}:${props.source.file.name}:${props.source.file.size}`,
        title: t(`seo.${String(route.name)}.title`) || t('result.fallback'),
        pipeline: props.pipeline ?? '',
        sourceName: props.source.file.name,
        svg: props.svg ?? undefined,
        rasterBlob: props.rasterBlob ?? undefined,
        rasterType: props.rasterType,
        keptOriginal: props.keptOriginal,
      })
    }, 500)
  },
)

onUnmounted(() => {
  if (historyTimer) clearTimeout(historyTimer)
})
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
        <span>{{ t('result.paths', { n: pathCount }) }}</span>
        <el-button size="small" type="primary" @click="downloadSvg">{{ t('result.downloadSvg') }}</el-button>
        <el-button size="small" @click="copySvg">{{ t('result.copy') }}</el-button>
      </template>
      <template v-if="rasterBlob">
        <span :class="{ warn: larger, ok: savedPercent > 0 }">{{ t('result.output', { size: formatBytes(rasterBytes) }) }}</span>
        <span v-if="savedPercent > 0">{{ t('result.saved', { n: savedPercent }) }}</span>
        <span v-else-if="keptOriginal">{{ t('result.notSmaller') }}</span>
        <span v-if="resultWidth && resultHeight">{{ resultWidth }} × {{ resultHeight }}</span>
        <el-button size="small" type="primary" @click="downloadRaster">
          {{ t('result.download', { name: keptOriginal ? t('result.originalFile') : rasterExt().toUpperCase() }) }}
        </el-button>
      </template>
      <el-button size="small" @click="emit('replace')">{{ t('result.replace') }}</el-button>
    </template>
    <span v-else>{{ t('result.empty') }}</span>
  </section>
</template>

<style scoped>
.bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
  padding: 12px 16px;
  background: var(--app-surface);
  border-radius: 8px;
  color: var(--app-faint);
  font-size: 13px;
}

.warn {
  color: var(--app-warn);
}

.ok {
  color: var(--app-ok);
}
</style>
