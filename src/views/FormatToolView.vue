<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import UploadPanel from '@/components/UploadPanel.vue'
import ExportParamPanel from '@/components/ExportParamPanel.vue'
import type { ExportOptions } from '@/components/ExportParamPanel.vue'
import CompareView from '@/components/CompareView.vue'
import QueueResultList from '@/components/QueueResultList.vue'
import ResultBar from '@/components/ResultBar.vue'
import { MAX_QUEUE, useOutputQueue } from '@/composables/useOutputQueue'
import { useRasterize } from '@/composables/useRasterize'
import { t } from '@/i18n'

const previewUrl = ref<string | null>(null)
const resultUrl = ref<string | null>(null)
const exportOptions = ref<ExportOptions>({
  target: 'keep',
  strategy: 'quality',
  type: 'image/png',
  scale: 1,
  quality: 0.92,
})
const { rasterizeFile, compressFile } = useRasterize()
const {
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
  downloadZip,
} = useOutputQueue(async (source) => {
  const options = exportOptions.value
  if (options.target === 'keep') {
    return compressFile(source.file, source.kind, source.format, {
      mode: options.strategy,
      format: 'keep',
      quality: options.quality,
    })
  }
  return rasterizeFile(source.file, source.kind, {
    type: options.target,
    scale: options.scale,
    quality: options.quality,
    background: options.background,
    knockoutWhite: options.knockoutWhite,
  })
})

const formatName: Record<string, string> = {
  png: 'PNG',
  jpeg: 'JPEG',
  webp: 'WebP',
  bmp: 'BMP',
  gif: 'GIF',
  svg: 'SVG',
  'image/png': 'PNG',
  'image/jpeg': 'JPEG',
  'image/webp': 'WebP',
}

const source = computed(() => single.value?.source ?? null)
const resultBlob = computed(() => single.value?.blob ?? null)
const resultType = computed(() => single.value?.type ?? 'image/png')
const resultWidth = computed(() => single.value?.width)
const resultHeight = computed(() => single.value?.height)
const keptOriginal = computed(() => single.value?.keptOriginal === true)
const many = computed(() => items.value.length > 1)
const pipeline = computed(() => {
  if (many.value) {
    const action = exportOptions.value.target === 'keep' ? t('queue.compress') : t('queue.convert')
    return t('queue.progress', { action, done: doneCount.value, total: items.value.length })
  }
  if (!source.value) return ''
  if (keptOriginal.value) return t('queue.kept')
  const from = formatName[source.value.format] ?? source.value.format
  const to = formatName[resultType.value] ?? from
  if (exportOptions.value.target === 'keep') return t('queue.compressFmt', { fmt: from })
  return `${from} → ${to}`
})

watch(source, (value, _prev, onCleanup) => {
  if (!value) {
    previewUrl.value = null
    return
  }
  const url = URL.createObjectURL(value.file)
  previewUrl.value = url
  onCleanup(() => URL.revokeObjectURL(url))
})

watch(resultBlob, (blob, _prev, onCleanup) => {
  if (blob) {
    const url = URL.createObjectURL(blob)
    resultUrl.value = url
    onCleanup(() => URL.revokeObjectURL(url))
    return
  }
  resultUrl.value = null
})

watch(exportOptions, () => {
  scheduleRestart()
})

watch(
  () => single.value?.status,
  (status) => {
    if (status === 'error' && single.value?.error) {
      ElMessage.error(t('queue.failedDetail', { detail: single.value.error }))
    }
  },
)

watch(keptOriginal, (kept) => {
  if (kept && !many.value) ElMessage.info(t('queue.keptInfo'))
})

onUnmounted(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
})

function onExportChange(options: ExportOptions) {
  exportOptions.value = options
}
</script>

<template>
  <main class="tool">
    <UploadPanel
      multiple
      :max-files="MAX_QUEUE"
      :has-file="!!source && !many"
      @accepted-many="addFiles"
    />
    <CompareView
      v-if="!many"
      :original-url="previewUrl"
      :original-name="source?.file.name"
      :result-url="resultUrl"
      :result-alt="t('compare.exportAlt')"
      :converting="converting"
    />
    <ExportParamPanel
      :disabled="!items.length"
      :loading="converting"
      :source-format="source?.format"
      @change="onExportChange"
    />
    <QueueResultList
      v-if="many"
      :items="items"
      :converting="converting"
      :summary="pipeline"
      :done-count="doneCount"
      :error-count="errorCount"
      @download="downloadItem"
      @remove="removeItem"
      @zip="downloadZip"
      @clear="clearItems"
    />
    <ResultBar
      v-else
      :source="source"
      :pipeline="pipeline"
      :raster-blob="resultBlob"
      :raster-type="resultType"
      :result-width="resultWidth"
      :result-height="resultHeight"
      :kept-original="keptOriginal"
      @replace="clearItems"
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
