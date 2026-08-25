<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import UploadPanel from '@/components/UploadPanel.vue'
import type { AcceptedFile } from '@/components/UploadPanel.vue'
import TransformParamPanel from '@/components/TransformParamPanel.vue'
import CompareView from '@/components/CompareView.vue'
import ResultBar from '@/components/ResultBar.vue'
import {
  applyTransform,
  decodeToBitmap,
  encodeTransformed,
  type TransformOp,
} from '@/utils/transformImage'
import type { RasterFormat } from '@/utils/svgRaster'

const source = ref<AcceptedFile | null>(null)
const previewUrl = ref<string | null>(null)
const resultUrl = ref<string | null>(null)
const resultBlob = ref<Blob | null>(null)
const resultType = ref<RasterFormat>('image/png')
const resultWidth = ref<number>()
const resultHeight = ref<number>()
const converting = ref(false)
const encodeOptions = ref({ type: 'image/png' as RasterFormat, quality: 0.92 })
let original: ImageBitmap | null = null
let working: ImageBitmap | null = null
let opSeq = 0

const pipeline = computed(() => {
  if (!source.value?.width || !source.value.height) return '旋转与翻转'
  if (!resultWidth.value || !resultHeight.value) {
    return `${source.value.width} × ${source.value.height}`
  }
  return `${source.value.width} × ${source.value.height} → ${resultWidth.value} × ${resultHeight.value}`
})

watch(source, async (value, _prev, onCleanup) => {
  original?.close()
  working?.close()
  original = null
  working = null
  resultBlob.value = null
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
  converting.value = true
  try {
    original = await decodeToBitmap(value.file, value.kind)
    working = await createImageBitmap(original)
    await encodeCurrent()
  } catch (error) {
    const detail = error instanceof Error && error.message ? error.message : ''
    ElMessage.error(detail ? `处理失败：${detail}` : '处理失败，请换一张图片后重试')
  } finally {
    converting.value = false
  }
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

watch(encodeOptions, () => {
  if (!working) return
  void encodeCurrent()
})

async function encodeCurrent() {
  if (!working) return
  const seq = ++opSeq
  converting.value = true
  try {
    const result = await encodeTransformed(
      working,
      working.width,
      working.height,
      encodeOptions.value,
    )
    if (seq !== opSeq) return
    resultBlob.value = result.blob
    resultType.value = result.type
    resultWidth.value = result.width
    resultHeight.value = result.height
    if (result.fallbackToPng) {
      ElMessage.warning('当前浏览器无法编码 WebP，已改为 PNG')
    }
  } catch (error) {
    if (seq !== opSeq) return
    const detail = error instanceof Error && error.message ? error.message : ''
    ElMessage.error(detail ? `导出失败：${detail}` : '导出失败')
  } finally {
    if (seq === opSeq) converting.value = false
  }
}

async function onTransform(op: TransformOp) {
  if (!working) return
  const seq = ++opSeq
  converting.value = true
  try {
    const canvas = applyTransform(working, working.width, working.height, op)
    const next = await createImageBitmap(canvas)
    if (seq !== opSeq) {
      next.close()
      return
    }
    working.close()
    working = next
    await encodeCurrent()
  } catch (error) {
    if (seq !== opSeq) return
    const detail = error instanceof Error && error.message ? error.message : ''
    ElMessage.error(detail ? `处理失败：${detail}` : '处理失败')
    converting.value = false
  }
}

async function onReset() {
  if (!original) return
  const seq = ++opSeq
  converting.value = true
  try {
    const next = await createImageBitmap(original)
    if (seq !== opSeq) {
      next.close()
      return
    }
    working?.close()
    working = next
    await encodeCurrent()
  } catch (error) {
    if (seq !== opSeq) return
    converting.value = false
    const detail = error instanceof Error && error.message ? error.message : ''
    ElMessage.error(detail ? `恢复失败：${detail}` : '恢复失败')
  }
}

onUnmounted(() => {
  original?.close()
  working?.close()
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
})

function onAccepted(payload: AcceptedFile) {
  source.value = payload
}

function onReplace() {
  source.value = null
}

function onEncodeChange(options: { type: RasterFormat; quality: number }) {
  encodeOptions.value = options
}
</script>

<template>
  <main class="tool">
    <UploadPanel :has-file="!!source" @accepted="onAccepted" />
    <CompareView
      :original-url="previewUrl"
      :original-name="source?.file.name"
      :result-url="resultUrl"
      result-alt="变换结果"
      :converting="converting"
    />
    <TransformParamPanel
      :disabled="!source"
      :loading="converting"
      :source-format="source?.format"
      @transform="onTransform"
      @reset="onReset"
      @change="onEncodeChange"
    />
    <ResultBar
      :source="source"
      :pipeline="pipeline"
      :raster-blob="resultBlob"
      :raster-type="resultType"
      :result-width="resultWidth"
      :result-height="resultHeight"
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
