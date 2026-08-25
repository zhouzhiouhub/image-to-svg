<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import UploadPanel from '@/components/UploadPanel.vue'
import type { AcceptedFile } from '@/components/UploadPanel.vue'
import TraceParamPanel from '@/components/TraceParamPanel.vue'
import CompareView from '@/components/CompareView.vue'
import ResultBar from '@/components/ResultBar.vue'
import { useTrace } from '@/composables/useTrace'
import type { TraceOptions } from '@/types/trace'
import { t } from '@/i18n'

const route = useRoute()
const traceMode = ref<'preserve' | 'vector'>(route.query.mode === 'vector' ? 'vector' : 'preserve')

const source = ref<AcceptedFile | null>(null)
const previewUrl = ref<string | null>(null)
const resultSvg = ref<string | null>(null)
const resultUrl = ref<string | null>(null)
const converting = ref(false)
const traceOptions = ref<TraceOptions>({
  mode: traceMode.value,
  turdsize: 8,
  extractcolors: true,
  posterizelevel: 16,
})
const { trace } = useTrace()
let traceSeq = 0

const pipeline = computed(() => (traceMode.value === 'vector' ? t('pipeline.vector') : t('pipeline.preserve')))

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

watch([source, traceOptions], async () => {
  const value = source.value
  const seq = ++traceSeq
  resultSvg.value = null
  if (!value || value.kind !== 'raster') {
    converting.value = false
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
    ElMessage.error(detail ? t('errors.convertDetail', { detail }) : t('errors.convert'))
  } finally {
    if (seq === traceSeq) converting.value = false
  }
})

onUnmounted(() => {
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
</script>

<template>
  <main class="tool">
    <UploadPanel
      accept-kind="raster"
      :photo-warning="traceMode === 'vector'"
      :has-file="!!source"
      @accepted="onAccepted"
    />
    <CompareView
      :original-url="previewUrl"
      :original-name="source?.file.name"
      :result-url="resultUrl"
      :result-alt="t('compare.svgAlt')"
      :converting="converting"
    />
    <TraceParamPanel
      v-model:mode="traceMode"
      :disabled="!source"
      :loading="converting"
      @change="onTraceChange"
    />
    <ResultBar :source="source" :pipeline="pipeline" :svg="resultSvg" @replace="onReplace" />
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
