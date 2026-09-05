<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import '@/ui/element-plus'
import UploadPanel from '@/components/UploadPanel.vue'
import type { AcceptedFile } from '@/components/UploadPanel.vue'
import IcoParamPanel from '@/components/IcoParamPanel.vue'
import type { IcoPanelOptions } from '@/components/IcoParamPanel.vue'
import CompareView from '@/components/CompareView.vue'
import ResultBar from '@/components/ResultBar.vue'
import { encodeIcoFromFile } from '@/utils/icoEncode'
import { t } from '@/i18n'

const source = ref<AcceptedFile | null>(null)
const previewUrl = ref<string | null>(null)
const resultUrl = ref<string | null>(null)
const resultBlob = ref<Blob | null>(null)
const previewBlob = ref<Blob | null>(null)
const resultWidth = ref<number>()
const resultHeight = ref<number>()
const converting = ref(false)
const icoOptions = ref<IcoPanelOptions>({
  sizes: [{ width: 32, height: 32 }],
  fit: 'contain',
})
let jobSeq = 0
let encodeTimer: ReturnType<typeof setTimeout> | null = null

const pipeline = computed(() => {
  if (!source.value || !resultWidth.value || !resultHeight.value) return ''
  const size = icoOptions.value.sizes[0]
  const label = size ? `${size.width} × ${size.height}` : `${resultWidth.value} × ${resultHeight.value}`
  return t('icoPanel.pipeline', {
    from: `${source.value.width} × ${source.value.height}`,
    size: label,
  })
})

watch(source, (value, _prev, onCleanup) => {
  if (encodeTimer) clearTimeout(encodeTimer)
  jobSeq += 1
  resultBlob.value = null
  previewBlob.value = null
  resultWidth.value = undefined
  resultHeight.value = undefined
  if (!value) {
    previewUrl.value = null
    converting.value = false
    return
  }
  const url = URL.createObjectURL(value.file)
  previewUrl.value = url
  onCleanup(() => URL.revokeObjectURL(url))
  scheduleEncode()
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

watch(
  icoOptions,
  () => {
    if (!source.value) return
    scheduleEncode()
  },
  { deep: true },
)

onUnmounted(() => {
  jobSeq += 1
  if (encodeTimer) clearTimeout(encodeTimer)
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
})

function scheduleEncode() {
  if (encodeTimer) clearTimeout(encodeTimer)
  encodeTimer = setTimeout(() => {
    void runEncode()
  }, 180)
}

async function runEncode() {
  const current = ++jobSeq
  const file = source.value
  if (!file) return
  if (!icoOptions.value.sizes.length) {
    ElMessage.warning(t('icoPanel.needSize'))
    return
  }
  converting.value = true
  try {
    const result = await encodeIcoFromFile(file.file, file.kind, icoOptions.value)
    if (current !== jobSeq) return
    resultBlob.value = result.blob
    previewBlob.value = result.previewBlob
    resultWidth.value = result.width
    resultHeight.value = result.height
  } catch (error) {
    if (current !== jobSeq) return
    resultBlob.value = null
    previewBlob.value = null
    const detail = error instanceof Error && error.message ? error.message : t('errors.failed')
    ElMessage.error(t('queue.failedDetail', { detail }))
  } finally {
    if (current === jobSeq) converting.value = false
  }
}

function onAccepted(file: AcceptedFile) {
  source.value = file
}

function onIcoChange(options: IcoPanelOptions) {
  icoOptions.value = options
}

function clearSource() {
  source.value = null
}
</script>

<template>
  <main class="tool">
    <UploadPanel :has-file="!!source" @accepted="onAccepted" />
    <CompareView
      :original-url="previewUrl"
      :original-name="source?.file.name"
      :result-url="resultUrl"
      :result-alt="t('compare.icoAlt')"
      :converting="converting"
    />
    <IcoParamPanel
      :disabled="!source"
      :loading="converting"
      :source-format="source?.format"
      @change="onIcoChange"
    />
    <ResultBar
      :source="source"
      :pipeline="pipeline"
      :raster-blob="resultBlob"
      :raster-type="'image/x-icon'"
      :result-width="resultWidth"
      :result-height="resultHeight"
      @replace="clearSource"
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
