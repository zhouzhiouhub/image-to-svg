<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import UploadPanel from '@/components/UploadPanel.vue'
import type { AcceptedFile } from '@/components/UploadPanel.vue'
import RasterParamPanel from '@/components/RasterParamPanel.vue'
import CompareView from '@/components/CompareView.vue'
import QueueResultList from '@/components/QueueResultList.vue'
import ResultBar from '@/components/ResultBar.vue'
import { MAX_QUEUE, useOutputQueue } from '@/composables/useOutputQueue'
import { useRasterize } from '@/composables/useRasterize'
import type { RasterOptions } from '@/utils/svgRaster'

const previewUrl = ref<string | null>(null)
const resultUrl = ref<string | null>(null)
const rasterOptions = ref<RasterOptions>({
  type: 'image/png',
  scale: 1,
  quality: 0.92,
})
const { rasterizeFile } = useRasterize()
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
} = useOutputQueue((source) => rasterizeFile(source.file, source.kind, rasterOptions.value))

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
const many = computed(() => items.value.length > 1)
const pipeline = computed(() => {
  if (many.value) return `格式转换 ${doneCount.value}/${items.value.length}`
  if (!source.value) return ''
  const from = formatName[source.value.format] ?? source.value.format
  const to = formatName[resultType.value] ?? 'PNG'
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

watch(rasterOptions, () => {
  scheduleRestart()
})

watch(
  () => single.value?.status,
  (status) => {
    if (status === 'error' && single.value?.error) {
      ElMessage.error(`转换失败：${single.value.error}`)
    }
  },
)

onUnmounted(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
})

function onRasterChange(options: RasterOptions) {
  rasterOptions.value = options
}

function onAccepted(payload: AcceptedFile) {
  addFiles([payload])
}
</script>

<template>
  <main class="tool">
    <UploadPanel
      multiple
      :max-files="MAX_QUEUE"
      :has-file="!!source && !many"
      @accepted="onAccepted"
      @accepted-many="addFiles"
    />
    <CompareView
      v-if="!many"
      :original-url="previewUrl"
      :original-name="source?.file.name"
      :result-url="resultUrl"
      result-alt="转换结果"
      :converting="converting"
    />
    <RasterParamPanel
      title="转换参数"
      empty-text="请先上传图片后再选择导出格式"
      :loading-text="many ? '正在批量转换…' : '正在转换…'"
      :initial-scale="1"
      :disabled="!items.length"
      :loading="converting"
      :source-format="source?.format"
      @change="onRasterChange"
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
