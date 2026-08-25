<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import UploadPanel from '@/components/UploadPanel.vue'
import type { AcceptedFile } from '@/components/UploadPanel.vue'
import CropEditor from '@/components/CropEditor.vue'
import TransformParamPanel from '@/components/TransformParamPanel.vue'
import CropParamPanel from '@/components/CropParamPanel.vue'
import ResizeParamPanel from '@/components/ResizeParamPanel.vue'
import ResultBar from '@/components/ResultBar.vue'
import {
  applyTransform,
  decodeToBitmap,
  outputTypeFromSource,
  type TransformOp,
} from '@/utils/transformImage'
import { clampCrop, cropToCanvas, fitCropAspect, fullCrop, type CropRect } from '@/utils/cropImage'
import { rasterizeSourceToSize, type RasterFormat, type ResizeOptions } from '@/utils/svgRaster'
import { t } from '@/i18n'

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
const resizeToken = ref(0)
const workingRev = ref(0)
const frameWidth = ref(1)
const frameHeight = ref(1)
const resizeOptions = ref<ResizeOptions>({
  type: 'image/png',
  quality: 0.92,
  width: 1,
  height: 1,
  fit: 'stretch',
})
let original: ImageBitmap | null = null
let working: ImageBitmap | null = null
let jobSeq = 0
let encodeTimer: ReturnType<typeof setTimeout> | null = null

const imageWidth = computed(() => frameWidth.value)
const imageHeight = computed(() => frameHeight.value)
const pipeline = computed(() => {
  if (!source.value) return ''
  if (!resultWidth.value || !resultHeight.value) return t('pipeline.edit')
  return `${source.value.width} × ${source.value.height} → ${resultWidth.value} × ${resultHeight.value}`
})

watch(source, async (value) => {
  if (encodeTimer) clearTimeout(encodeTimer)
  jobSeq += 1
  original?.close()
  working?.close()
  original = null
  working = null
  resultBlob.value = null
  resultWidth.value = undefined
  resultHeight.value = undefined
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
  if (!value) {
    converting.value = false
    return
  }
  converting.value = true
  try {
    original = await decodeToBitmap(value.file, value.kind)
    working = await createImageBitmap(original)
    frameWidth.value = working.width
    frameHeight.value = working.height
    crop.value = fullCrop(working.width, working.height)
    resizeToken.value += 1
    workingRev.value += 1
    await refreshPreview()
    scheduleEncode()
  } catch (error) {
    converting.value = false
    const detail = error instanceof Error && error.message ? error.message : ''
    ElMessage.error(detail ? t('errors.processDetail', { detail }) : t('errors.processRetry'))
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
  [crop, resizeOptions],
  () => {
    if (!working) return
    scheduleEncode()
  },
  { deep: true },
)

async function refreshPreview() {
  if (!working) return
  const canvas = document.createElement('canvas')
  canvas.width = working.width
  canvas.height = working.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建预览')
  ctx.drawImage(working, 0, 0)
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((next) => (next ? resolve(next) : reject(new Error('预览失败'))), 'image/png')
  })
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = URL.createObjectURL(blob)
}

function scheduleEncode() {
  const seq = ++jobSeq
  if (encodeTimer) clearTimeout(encodeTimer)
  converting.value = true
  encodeTimer = setTimeout(() => {
    void runEncode(seq)
  }, 80)
}

async function runEncode(seq: number) {
  if (!working || !source.value) return
  try {
    const nextCrop = clampCrop(crop.value, working.width, working.height)
    const cropped = cropToCanvas(working, nextCrop)
    const result = await rasterizeSourceToSize(cropped, nextCrop.width, nextCrop.height, {
      ...resizeOptions.value,
      type: outputTypeFromSource(source.value.format),
    })
    if (seq !== jobSeq) return
    resultBlob.value = result.blob
    resultType.value = result.type
    resultWidth.value = result.width
    resultHeight.value = result.height
    if (result.fallbackToPng) {
      ElMessage.warning(t('errors.webp'))
    }
  } catch (error) {
    if (seq !== jobSeq) return
    const detail = error instanceof Error && error.message ? error.message : ''
    ElMessage.error(detail ? t('errors.editDetail', { detail }) : t('errors.edit'))
  } finally {
    if (seq === jobSeq) converting.value = false
  }
}

function resetCropToWorking() {
  if (!working) return
  crop.value = aspect.value
    ? fitCropAspect(fullCrop(working.width, working.height), working.width, working.height, aspect.value)
    : fullCrop(working.width, working.height)
}

async function onTransform(op: TransformOp) {
  if (!working) return
  converting.value = true
  try {
    const canvas = applyTransform(working, working.width, working.height, op)
    const next = await createImageBitmap(canvas)
    working.close()
    working = next
    frameWidth.value = working.width
    frameHeight.value = working.height
    resetCropToWorking()
    resizeToken.value += 1
    workingRev.value += 1
    await refreshPreview()
    scheduleEncode()
  } catch (error) {
    converting.value = false
    const detail = error instanceof Error && error.message ? error.message : ''
    ElMessage.error(detail ? t('errors.processDetail', { detail }) : t('errors.process'))
  }
}

async function onResetAll() {
  if (!original) return
  converting.value = true
  try {
    const next = await createImageBitmap(original)
    working?.close()
    working = next
    frameWidth.value = working.width
    frameHeight.value = working.height
    aspect.value = null
    resetCropToWorking()
    resizeToken.value += 1
    workingRev.value += 1
    await refreshPreview()
    scheduleEncode()
  } catch (error) {
    converting.value = false
    const detail = error instanceof Error && error.message ? error.message : ''
    ElMessage.error(detail ? t('errors.restoreDetail', { detail }) : t('errors.restore'))
  }
}

function onAspect(value: number | null) {
  aspect.value = value
  if (!working || !value) return
  crop.value = fitCropAspect(crop.value, working.width, working.height, value)
}

function onResetCrop() {
  resetCropToWorking()
}

function onResizeChange(options: ResizeOptions) {
  resizeOptions.value = options
}

onUnmounted(() => {
  if (encodeTimer) clearTimeout(encodeTimer)
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
</script>

<template>
  <main class="tool">
    <UploadPanel :has-file="!!source" @accepted="onAccepted" />
    <section class="compare">
      <div class="pane">
        <CropEditor
          v-if="previewUrl && source"
          :key="workingRev"
          :src="previewUrl"
          :image-width="imageWidth"
          :image-height="imageHeight"
          :aspect="aspect"
          v-model:crop="crop"
        />
        <span v-else>{{ t('compare.original') }}</span>
      </div>
      <div class="pane">
        <img v-if="resultUrl" :src="resultUrl" :alt="t('compare.editAlt')" :class="{ dim: converting }" />
        <span v-else-if="converting">{{ t('compare.processing') }}</span>
        <span v-else>{{ t('compare.result') }}</span>
      </div>
    </section>
    <TransformParamPanel
      :disabled="!source"
      :loading="converting"
      @transform="onTransform"
      @reset="onResetAll"
    />
    <CropParamPanel
      :disabled="!source"
      :loading="converting"
      :crop-width="crop.width"
      :crop-height="crop.height"
      @aspect="onAspect"
      @reset="onResetCrop"
    />
    <ResizeParamPanel
      :disabled="!source"
      :loading="converting"
      :source-width="crop.width"
      :source-height="crop.height"
      :source-format="source?.format"
      :reset-token="resizeToken"
      @change="onResizeChange"
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
  color: var(--app-faint);
  overflow: hidden;
  background-color: var(--app-surface);
  background-image:
    linear-gradient(45deg, var(--app-checker) 25%, transparent 25%),
    linear-gradient(-45deg, var(--app-checker) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--app-checker) 75%),
    linear-gradient(-45deg, transparent 75%, var(--app-checker) 75%);
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
