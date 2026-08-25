<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import UploadPanel from '@/components/UploadPanel.vue'
import type { AcceptedFile } from '@/components/UploadPanel.vue'
import CompressParamPanel from '@/components/CompressParamPanel.vue'
import CompareView from '@/components/CompareView.vue'
import ResultBar from '@/components/ResultBar.vue'
import { useRasterize } from '@/composables/useRasterize'
import { formatBytes } from '@/utils/format'
import type { CompressOptions } from '@/utils/compressImage'
import type { RasterFormat } from '@/utils/svgRaster'

const source = ref<AcceptedFile | null>(null)
const previewUrl = ref<string | null>(null)
const resultUrl = ref<string | null>(null)
const resultBlob = ref<Blob | null>(null)
const resultType = ref<RasterFormat>('image/png')
const resultWidth = ref<number>()
const resultHeight = ref<number>()
const converting = ref(false)
const keptOriginal = ref(false)
const compressOptions = ref<CompressOptions>({
  mode: 'quality',
  format: 'auto',
  quality: 0.72,
})
const { compressFile } = useRasterize()
let convertSeq = 0
let convertTimer: ReturnType<typeof setTimeout> | null = null

const pipeline = computed(() => {
  if (!source.value) return ''
  if (keptOriginal.value) return '已保留原文件'
  if (!resultBlob.value) return '图片压缩'
  const saved = source.value.file.size - resultBlob.value.size
  if (saved <= 0) return '图片压缩'
  const percent = Math.round((saved / source.value.file.size) * 100)
  return `减小 ${percent}% · ${formatBytes(source.value.file.size)} → ${formatBytes(resultBlob.value.size)}`
})

watch(source, (value, _prev, onCleanup) => {
  resultBlob.value = null
  resultWidth.value = undefined
  resultHeight.value = undefined
  keptOriginal.value = false
  if (!value) {
    previewUrl.value = null
    converting.value = false
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

watch([source, compressOptions], ([value]) => {
  const seq = ++convertSeq
  if (convertTimer) {
    clearTimeout(convertTimer)
    convertTimer = null
  }

  if (!value) {
    converting.value = false
    return
  }

  converting.value = true
  convertTimer = setTimeout(() => {
    void runConvert(value, seq)
  }, 120)
})

async function runConvert(value: AcceptedFile, seq: number) {
  try {
    const result = await compressFile(value.file, value.kind, value.format, compressOptions.value)
    if (seq !== convertSeq) return
    resultBlob.value = result.blob
    resultType.value = result.type
    resultWidth.value = result.width
    resultHeight.value = result.height
    keptOriginal.value = result.keptOriginal
    if (result.fallbackToPng) {
      ElMessage.warning('当前浏览器无法编码 WebP，已改为 PNG')
    }
    if (result.capped) {
      ElMessage.warning('导出边长已限制在 4096px')
    }
    if (result.keptOriginal) {
      ElMessage.info('压缩后体积未减小，已保留原文件')
    }
  } catch (error) {
    if (seq !== convertSeq) return
    resultBlob.value = null
    resultWidth.value = undefined
    resultHeight.value = undefined
    keptOriginal.value = false
    const detail = error instanceof Error && error.message ? error.message : ''
    ElMessage.error(detail ? `压缩失败：${detail}` : '压缩失败，请换一张图片后重试')
  } finally {
    if (seq === convertSeq) converting.value = false
  }
}

onUnmounted(() => {
  if (convertTimer) clearTimeout(convertTimer)
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
})

function onAccepted(payload: AcceptedFile) {
  source.value = payload
}

function onCompressChange(options: CompressOptions) {
  compressOptions.value = options
}
</script>

<template>
  <main class="tool">
    <UploadPanel @accepted="onAccepted" />
    <CompareView
      :original-url="previewUrl"
      :original-name="source?.file.name"
      :result-url="resultUrl"
      result-alt="压缩结果"
      :converting="converting"
    />
    <CompressParamPanel
      :disabled="!source"
      :loading="converting"
      @change="onCompressChange"
    />
    <ResultBar
      :source="source"
      :pipeline="pipeline"
      :raster-blob="resultBlob"
      :raster-type="resultType"
      :result-width="resultWidth"
      :result-height="resultHeight"
      :kept-original="keptOriginal"
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
