<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import UploadPanel from '@/components/UploadPanel.vue'
import type { AcceptedFile } from '@/components/UploadPanel.vue'
import CropEditor from '@/components/CropEditor.vue'
import CropParamPanel from '@/components/CropParamPanel.vue'
import ResultBar from '@/components/ResultBar.vue'
import { decodeToBitmap } from '@/utils/transformImage'
import { clampCrop, encodeCrop, fitCropAspect, fullCrop, type CropRect } from '@/utils/cropImage'
import type { RasterFormat } from '@/utils/svgRaster'

const source = ref<AcceptedFile | null>(null)
const previewUrl = ref<string | null>(null)
const resultUrl = ref<string | null>(null)
const resultBlob = ref<Blob | null>(null)
const resultType = ref<RasterFormat>('image/png')
const resultWidth = ref<number>()
const resultHeight = ref<number>()
const converting = ref(false)
const aspect = ref<number | null>(null)
const crop = ref<CropRect>({ x: 0, y: 0, width: 1, height: 1 })
const encodeOptions = ref({ type: 'image/png' as RasterFormat, quality: 0.92 })
let working: ImageBitmap | null = null
let cropSeq = 0
let cropTimer: ReturnType<typeof setTimeout> | null = null

const imageWidth = computed(() => source.value?.width ?? working?.width ?? 1)
const imageHeight = computed(() => source.value?.height ?? working?.height ?? 1)
const pipeline = computed(() => {
  if (!source.value) return ''
  if (!resultWidth.value || !resultHeight.value) return '图片裁剪'
  return `${imageWidth.value} × ${imageHeight.value} → ${resultWidth.value} × ${resultHeight.value}`
})

watch(source, async (value, _prev, onCleanup) => {
  if (cropTimer) clearTimeout(cropTimer)
  cropSeq += 1
  working?.close()
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
    working = await decodeToBitmap(value.file, value.kind)
    crop.value = fullCrop(working.width, working.height)
  } catch (error) {
    converting.value = false
    const detail = error instanceof Error && error.message ? error.message : ''
    ElMessage.error(detail ? `处理失败：${detail}` : '处理失败，请换一张图片后重试')
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

watch(
  [crop, encodeOptions],
  () => {
    if (!working) return
    const seq = ++cropSeq
    if (cropTimer) clearTimeout(cropTimer)
    converting.value = true
    cropTimer = setTimeout(() => {
      void runCrop(seq)
    }, 80)
  },
  { deep: true },
)

async function runCrop(seq = ++cropSeq) {
  if (!working) return
  try {
    const next = clampCrop(crop.value, working.width, working.height)
    const result = await encodeCrop(working, next, encodeOptions.value.type, encodeOptions.value.quality)
    if (seq !== cropSeq) return
    resultBlob.value = result.blob
    resultType.value = result.type
    resultWidth.value = result.width
    resultHeight.value = result.height
    if (result.fallbackToPng) {
      ElMessage.warning('当前浏览器无法编码 WebP，已改为 PNG')
    }
  } catch (error) {
    if (seq !== cropSeq) return
    const detail = error instanceof Error && error.message ? error.message : ''
    ElMessage.error(detail ? `裁剪失败：${detail}` : '裁剪失败')
  } finally {
    if (seq === cropSeq) converting.value = false
  }
}

function onAspect(value: number | null) {
  aspect.value = value
  if (!working || !value) return
  crop.value = fitCropAspect(crop.value, working.width, working.height, value)
}

function onResetCrop() {
  if (!working) return
  crop.value = aspect.value
    ? fitCropAspect(fullCrop(working.width, working.height), working.width, working.height, aspect.value)
    : fullCrop(working.width, working.height)
}

onUnmounted(() => {
  if (cropTimer) clearTimeout(cropTimer)
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
    <section class="compare">
      <div class="pane">
        <CropEditor
          v-if="previewUrl && source"
          :src="previewUrl"
          :image-width="imageWidth"
          :image-height="imageHeight"
          :aspect="aspect"
          v-model:crop="crop"
        />
        <span v-else>原图预览</span>
      </div>
      <div class="pane">
        <img v-if="resultUrl" :src="resultUrl" alt="裁剪结果" :class="{ dim: converting }" />
        <span v-else-if="converting">裁剪中…</span>
        <span v-else>结果预览</span>
      </div>
    </section>
    <CropParamPanel
      :disabled="!source"
      :loading="converting"
      :source-format="source?.format"
      :crop-width="crop.width"
      :crop-height="crop.height"
      @aspect="onAspect"
      @reset="onResetCrop"
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

.compare {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.pane {
  position: relative;
  min-height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: #909399;
  overflow: hidden;
  background-color: #fff;
  background-image:
    linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
    linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
    linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
  background-size: 16px 16px;
  background-position:
    0 0,
    0 8px,
    8px -8px,
    -8px 0;
}

.pane img {
  max-width: 100%;
  max-height: 360px;
  object-fit: contain;
}

.pane img.dim {
  opacity: 0.45;
}

@media (max-width: 767px) {
  .tool {
    padding: 16px;
  }

  .compare {
    grid-template-columns: 1fr;
  }
}
</style>
