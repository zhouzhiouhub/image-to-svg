<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import UploadPanel from '@/components/UploadPanel.vue'
import type { AcceptedFile } from '@/components/UploadPanel.vue'
import TraceParamPanel from '@/components/TraceParamPanel.vue'
import RasterParamPanel from '@/components/RasterParamPanel.vue'
import CompareView from '@/components/CompareView.vue'
import ResultBar from '@/components/ResultBar.vue'
import { useTrace } from '@/composables/useTrace'
import { useRasterize } from '@/composables/useRasterize'
import type { TraceOptions } from '@/types/trace'
import type { RasterFormat, RasterOptions } from '@/utils/svgRaster'

const route = useRoute()
const tool = computed(() => route.meta.tool ?? 'preserve')
const traceMode = computed(() => (tool.value === 'vector' ? 'vector' : 'preserve'))

const source = ref<AcceptedFile | null>(null)
const previewUrl = ref<string | null>(null)
const resultSvg = ref<string | null>(null)
const resultUrl = ref<string | null>(null)
const converting = ref(false)
const exporting = ref(false)
const rasterBlob = ref<Blob | null>(null)
const rasterType = ref<RasterFormat>('image/png')
const rasterWidth = ref<number>()
const rasterHeight = ref<number>()
const rasterOptions = ref<RasterOptions>({
  type: 'image/png',
  scale: 2,
  quality: 0.92,
})
const traceOptions = ref<TraceOptions>({
  mode: 'preserve',
  turdsize: 8,
  extractcolors: true,
  posterizelevel: 16,
})
const { trace } = useTrace()
const { rasterizeSvg } = useRasterize()
let traceSeq = 0
let exportSeq = 0
let exportTimer: ReturnType<typeof setTimeout> | null = null

watch(source, (value, _prev, onCleanup) => {
  if (!value) {
    previewUrl.value = null
    return
  }
  const url = URL.createObjectURL(value.file)
  previewUrl.value = url
  onCleanup(() => URL.revokeObjectURL(url))
})

watch(resultSvg, (svg, _prev, onCleanup) => {
  if (svg) {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
    resultUrl.value = url
    onCleanup(() => URL.revokeObjectURL(url))
    return
  }
  resultUrl.value = null
})

watch([source, traceOptions, tool], async () => {
  const value = source.value
  const seq = ++traceSeq
  resultSvg.value = null
  rasterBlob.value = null
  rasterWidth.value = undefined
  rasterHeight.value = undefined
  if (!value || value.kind !== 'raster') {
    converting.value = false
    exporting.value = false
    return
  }

  converting.value = true
  await nextTick()
  if (seq !== traceSeq) return
  try {
    const svg = await trace(value.file, { ...traceOptions.value, mode: traceMode.value })
    if (seq !== traceSeq) return
    resultSvg.value = svg
  } catch (error) {
    if (seq !== traceSeq) return
    const detail = error instanceof Error && error.message ? error.message : ''
    ElMessage.error(detail ? `转换失败：${detail}` : '转换失败，请换一张更小的静态图标后重试')
  } finally {
    if (seq === traceSeq) converting.value = false
  }
})

watch([resultSvg, rasterOptions], ([svg]) => {
  const seq = ++exportSeq
  if (exportTimer) {
    clearTimeout(exportTimer)
    exportTimer = null
  }
  if (!svg) {
    rasterBlob.value = null
    rasterWidth.value = undefined
    rasterHeight.value = undefined
    exporting.value = false
    return
  }
  exporting.value = true
  exportTimer = setTimeout(() => {
    void runExport(svg, seq)
  }, 120)
})

async function runExport(svg: string, seq: number) {
  try {
    const result = await rasterizeSvg(svg, rasterOptions.value)
    if (seq !== exportSeq) return
    rasterBlob.value = result.blob
    rasterType.value = result.type
    rasterWidth.value = result.width
    rasterHeight.value = result.height
    if (result.fallbackToPng) {
      ElMessage.warning('当前浏览器无法编码 WebP，已改为 PNG')
    }
  } catch (error) {
    if (seq !== exportSeq) return
    rasterBlob.value = null
    rasterWidth.value = undefined
    rasterHeight.value = undefined
    const detail = error instanceof Error && error.message ? error.message : ''
    ElMessage.error(detail ? `导出失败：${detail}` : '导出位图失败')
  } finally {
    if (seq === exportSeq) exporting.value = false
  }
}

onUnmounted(() => {
  if (exportTimer) clearTimeout(exportTimer)
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
})

function onAccepted(payload: AcceptedFile) {
  source.value = payload
}

function onReplace() {
  source.value = null
}

function onTraceChange(options: TraceOptions) {
  traceOptions.value = { ...options, mode: traceMode.value }
}

function onRasterChange(options: RasterOptions) {
  rasterOptions.value = options
}
</script>

<template>
  <main class="tool">
    <UploadPanel
      accept-kind="raster"
      :photo-warning="tool === 'vector'"
      :has-file="!!source"
      @accepted="onAccepted"
    />
    <CompareView
      :original-url="previewUrl"
      :original-name="source?.file.name"
      :result-url="resultUrl"
      result-alt="SVG 结果"
      :converting="converting"
    />
    <TraceParamPanel
      :mode="traceMode"
      :disabled="!source"
      :loading="converting"
      @change="onTraceChange"
    />
    <RasterParamPanel
      title="再导出为位图"
      empty-text="转换出 SVG 后可导出 PNG / JPEG / WebP"
      loading-text="正在导出位图…"
      :initial-scale="2"
      :disabled="!resultSvg"
      :loading="exporting"
      source-format="svg"
      @change="onRasterChange"
    />
    <ResultBar
      :source="source"
      :svg="resultSvg"
      :raster-blob="rasterBlob"
      :raster-type="rasterType"
      :result-width="rasterWidth"
      :result-height="rasterHeight"
      @replace="onReplace"
    />
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

@media (max-width: 767px) {
  .tool {
    padding: 16px;
  }
}
</style>
