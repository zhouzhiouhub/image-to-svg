<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import '@/ui/element-plus'
import UploadPanel from '@/components/UploadPanel.vue'
import IcoParamPanel from '@/components/IcoParamPanel.vue'
import type { IcoPanelOptions } from '@/components/IcoParamPanel.vue'
import CompareView from '@/components/CompareView.vue'
import QueueResultList from '@/components/QueueResultList.vue'
import ResultBar from '@/components/ResultBar.vue'
import { MAX_QUEUE, useOutputQueue } from '@/composables/useOutputQueue'
import { encodeIcoFromFile } from '@/utils/icoEncode'
import { t } from '@/i18n'

const previewUrl = ref<string | null>(null)
const resultUrl = ref<string | null>(null)
const icoOptions = ref<IcoPanelOptions>({
  sizes: [
    { width: 16, height: 16 },
    { width: 32, height: 32 },
    { width: 48, height: 48 },
  ],
  fit: 'contain',
})

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
  const options = icoOptions.value
  if (!options.sizes.length) throw new Error(t('icoPanel.needSize'))
  const result = await encodeIcoFromFile(source.file, source.kind, options)
  return {
    blob: result.blob,
    type: result.type,
    width: result.width,
    height: result.height,
    previewBlob: result.previewBlob,
  }
})

const source = computed(() => single.value?.source ?? null)
const resultBlob = computed(() => single.value?.blob ?? null)
const resultType = computed(() => single.value?.type ?? 'image/x-icon')
const resultWidth = computed(() => single.value?.width)
const resultHeight = computed(() => single.value?.height)
const previewBlob = computed(() => single.value?.previewBlob ?? null)
const many = computed(() => items.value.length > 1)
const pipeline = computed(() => {
  if (many.value) {
    return t('queue.progress', {
      action: t('queue.convert'),
      done: doneCount.value,
      total: items.value.length,
    })
  }
  if (!source.value || !resultWidth.value || !resultHeight.value) return ''
  const count = icoOptions.value.sizes.length
  return t('icoPanel.pipeline', {
    from: `${source.value.width} × ${source.value.height}`,
    count,
    size: `${resultWidth.value} × ${resultHeight.value}`,
  })
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

watch(previewBlob, (blob, _prev, onCleanup) => {
  if (blob) {
    const url = URL.createObjectURL(blob)
    resultUrl.value = url
    onCleanup(() => URL.revokeObjectURL(url))
    return
  }
  resultUrl.value = null
})

watch(icoOptions, () => {
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

onUnmounted(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
})

function onIcoChange(options: IcoPanelOptions) {
  icoOptions.value = options
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
      :result-alt="t('compare.icoAlt')"
      :converting="converting"
    />
    <IcoParamPanel
      :disabled="!items.length"
      :loading="converting"
      :source-format="source?.format"
      @change="onIcoChange"
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
  padding: 24px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (max-width: 767px) {
  .tool {
    padding: 16px 0;
  }
}
</style>
