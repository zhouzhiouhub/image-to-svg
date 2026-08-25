<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import UploadPanel from '@/components/UploadPanel.vue'
import type { AcceptedFile } from '@/components/UploadPanel.vue'
import CompressParamPanel from '@/components/CompressParamPanel.vue'
import CompareView from '@/components/CompareView.vue'
import QueueResultList from '@/components/QueueResultList.vue'
import ResultBar from '@/components/ResultBar.vue'
import { MAX_QUEUE, useOutputQueue } from '@/composables/useOutputQueue'
import { useRasterize } from '@/composables/useRasterize'
import { formatBytes } from '@/utils/format'
import type { CompressOptions } from '@/utils/compressImage'

const previewUrl = ref<string | null>(null)
const resultUrl = ref<string | null>(null)
const compressOptions = ref<CompressOptions>({
  mode: 'quality',
  format: 'keep',
  quality: 0.72,
})
const { compressFile } = useRasterize()
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
} = useOutputQueue((source) => compressFile(source.file, source.kind, source.format, compressOptions.value))

const source = computed(() => single.value?.source ?? null)
const resultBlob = computed(() => single.value?.blob ?? null)
const resultType = computed(() => single.value?.type ?? 'image/png')
const resultWidth = computed(() => single.value?.width)
const resultHeight = computed(() => single.value?.height)
const keptOriginal = computed(() => single.value?.keptOriginal === true)
const many = computed(() => items.value.length > 1)
const pipeline = computed(() => {
  if (many.value) return `图片压缩 ${doneCount.value}/${items.value.length}`
  if (!source.value) return ''
  if (keptOriginal.value) return '已保留原文件'
  if (!resultBlob.value) return '图片压缩'
  const saved = source.value.file.size - resultBlob.value.size
  if (saved <= 0) return '图片压缩'
  const percent = Math.round((saved / source.value.file.size) * 100)
  return `减小 ${percent}% · ${formatBytes(source.value.file.size)} → ${formatBytes(resultBlob.value.size)}`
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

watch(compressOptions, () => {
  scheduleRestart()
})

watch(
  () => single.value?.status,
  (status) => {
    if (status === 'error' && single.value?.error) {
      ElMessage.error(`压缩失败：${single.value.error}`)
    }
  },
)

watch(keptOriginal, (kept) => {
  if (kept && !many.value) ElMessage.info('压缩后体积未减小，已保留原文件')
})

onUnmounted(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
})

function onCompressChange(options: CompressOptions) {
  compressOptions.value = { ...options, format: 'keep' }
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
      result-alt="压缩结果"
      :converting="converting"
    />
    <CompressParamPanel
      :disabled="!items.length"
      :loading="converting"
      @change="onCompressChange"
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
