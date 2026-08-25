<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import UploadPanel from '@/components/UploadPanel.vue'
import type { AcceptedFile } from '@/components/UploadPanel.vue'
import ResizeParamPanel from '@/components/ResizeParamPanel.vue'
import CompareView from '@/components/CompareView.vue'
import ResultBar from '@/components/ResultBar.vue'
import { useRasterize } from '@/composables/useRasterize'
import { formatDimension } from '@/utils/format'
import type { RasterFormat, ResizeOptions } from '@/utils/svgRaster'

const source = ref<AcceptedFile | null>(null)
const previewUrl = ref<string | null>(null)
const resultUrl = ref<string | null>(null)
const resultBlob = ref<Blob | null>(null)
const resultType = ref<RasterFormat>('image/png')
const resultWidth = ref<number>()
const resultHeight = ref<number>()
const converting = ref(false)
const resizeOptions = ref<ResizeOptions>({
  type: 'image/png',
  quality: 0.92,
  width: 1,
  height: 1,
  fit: 'stretch',
})
const { resizeFile } = useRasterize()
let convertSeq = 0
let convertTimer: ReturnType<typeof setTimeout> | null = null

const pipeline = computed(() => {
  if (!source.value?.width || !source.value.height) return '尺寸调整'
  if (!resultWidth.value || !resultHeight.value) {
    return formatDimension(source.value.width, source.value.height)
  }
  return `${formatDimension(source.value.width, source.value.height)} → ${formatDimension(resultWidth.value, resultHeight.value)}`
})

watch(source, (value, _prev, onCleanup) => {
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

watch([source, resizeOptions], ([value]) => {
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
    const result = await resizeFile(value.file, value.kind, resizeOptions.value)
    if (seq !== convertSeq) return
    resultBlob.value = result.blob
    resultType.value = result.type
    resultWidth.value = result.width
    resultHeight.value = result.height
    if (result.fallbackToPng) {
      ElMessage.warning('当前浏览器无法编码 WebP，已改为 PNG')
    }
    if (result.capped) {
      ElMessage.warning('导出边长已限制在 4096px')
    }
  } catch (error) {
    if (seq !== convertSeq) return
    resultBlob.value = null
    resultWidth.value = undefined
    resultHeight.value = undefined
    const detail = error instanceof Error && error.message ? error.message : ''
    ElMessage.error(detail ? `调整失败：${detail}` : '调整失败，请换一张图片后重试')
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

function onResizeChange(options: ResizeOptions) {
  resizeOptions.value = options
}
</script>

<template>
  <main class="tool">
    <UploadPanel @accepted="onAccepted" />
    <CompareView
      :original-url="previewUrl"
      :original-name="source?.file.name"
      :result-url="resultUrl"
      result-alt="调整结果"
      :converting="converting"
    />
    <ResizeParamPanel
      :disabled="!source"
      :loading="converting"
      :source-width="source?.width"
      :source-height="source?.height"
      :source-format="source?.format"
      @change="onResizeChange"
    />
    <ResultBar
      :source="source"
      :pipeline="pipeline"
      :raster-blob="resultBlob"
      :raster-type="resultType"
      :result-width="resultWidth"
      :result-height="resultHeight"
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
