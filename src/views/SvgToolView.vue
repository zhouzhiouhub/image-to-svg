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
import type { RasterOptions } from '@/utils/svgRaster'
import type { InputKind } from '@/types/input'

const route = useRoute()
const tool = computed(() => route.meta.tool ?? 'preserve')
const acceptKind = computed<InputKind>(() => (tool.value === 'export' ? 'svg' : 'raster'))
const traceMode = computed(() => (tool.value === 'vector' ? 'vector' : 'preserve'))

const source = ref<AcceptedFile | null>(null)
const previewUrl = ref<string | null>(null)
const resultSvg = ref<string | null>(null)
const resultBlob = ref<Blob | null>(null)
const resultUrl = ref<string | null>(null)
const converting = ref(false)
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
const { rasterize } = useRasterize()
let traceSeq = 0
let rasterSeq = 0

const showTrace = computed(() => tool.value !== 'export')
const showRaster = computed(() => tool.value === 'export')

watch(source, (value, _prev, onCleanup) => {
  if (!value) {
    previewUrl.value = null
    return
  }
  const url = URL.createObjectURL(value.file)
  previewUrl.value = url
  onCleanup(() => URL.revokeObjectURL(url))
})

watch([resultSvg, resultBlob], ([svg, blob], _prev, onCleanup) => {
  if (svg) {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
    resultUrl.value = url
    onCleanup(() => URL.revokeObjectURL(url))
    return
  }
  if (blob) {
    const url = URL.createObjectURL(blob)
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
  resultBlob.value = null
  if (!value || value.kind !== 'raster' || tool.value === 'export') return

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

watch([source, rasterOptions, tool], async () => {
  const value = source.value
  const seq = ++rasterSeq
  if (!value || value.kind !== 'svg' || tool.value !== 'export') return

  converting.value = true
  resultBlob.value = null
  try {
    const svgText = await value.file.text()
    const blob = await rasterize(svgText, rasterOptions.value)
    if (seq !== rasterSeq) return
    resultBlob.value = blob
  } catch (error) {
    if (seq !== rasterSeq) return
    ElMessage.error(error instanceof Error ? error.message : '导出失败')
  } finally {
    if (seq === rasterSeq) converting.value = false
  }
})

onUnmounted(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
})

function onAccepted(payload: AcceptedFile) {
  source.value = payload
}

function onTraceChange(options: TraceOptions) {
  traceOptions.value = { ...options, mode: traceMode.value }
}
</script>

<template>
  <main class="tool">
    <section class="setup">
      <UploadPanel
        :accept-kind="acceptKind"
        :photo-warning="tool === 'vector'"
        @accepted="onAccepted"
      />
      <aside class="params">
        <TraceParamPanel
          v-if="showTrace"
          :mode="traceMode"
          :disabled="!source"
          :loading="converting"
          @change="onTraceChange"
        />
        <RasterParamPanel
          v-if="showRaster"
          :disabled="!source"
          :loading="converting"
          @change="rasterOptions = $event"
        />
      </aside>
    </section>
    <CompareView
      :original-url="previewUrl"
      :original-name="source?.file.name"
      :result-url="resultUrl"
      :converting="converting"
    />
    <ResultBar
      :source="source"
      :svg="resultSvg"
      :raster-blob="resultBlob"
      :raster-type="rasterOptions.type"
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

.setup {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 16px;
}

.params {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (max-width: 767px) {
  .tool {
    padding: 16px;
  }

  .setup {
    grid-template-columns: 1fr;
  }
}
</style>
