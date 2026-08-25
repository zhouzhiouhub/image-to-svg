<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { MAX_EDGE_PX } from '@/types/input'
import type { RasterFormat, ResizeFit, ResizeOptions } from '@/utils/svgRaster'
import { rasterTypeFromFormat } from '@/utils/svgRaster'
import { isOpaqueRasterSource } from '@/utils/knockoutWhite'

const props = defineProps<{
  disabled?: boolean
  loading?: boolean
  sourceWidth?: number
  sourceHeight?: number
  sourceFormat?: string
}>()

const emit = defineEmits<{
  change: [options: ResizeOptions]
}>()

const form = reactive({
  mode: 'pixel' as 'pixel' | 'percent',
  width: 1,
  height: 1,
  percent: 100,
  lockRatio: true,
  fit: 'cover' as ResizeFit,
  type: 'image/png' as RasterFormat,
  quality: 0.92,
  background: 'transparent' as 'transparent' | 'white',
})

let lockedRatio = 1

const jpegLocked = computed(() => form.type === 'image/jpeg')
const showFit = computed(() => form.mode === 'pixel' && !form.lockRatio)
const showBackground = computed(() => !jpegLocked.value && showFit.value && form.fit === 'contain')
const knockoutWhite = computed(
  () =>
    !jpegLocked.value &&
    form.background === 'transparent' &&
    isOpaqueRasterSource(props.sourceFormat) &&
    showBackground.value,
)
const maxPercent = computed(() => {
  const edge = Math.max(props.sourceWidth ?? 1, props.sourceHeight ?? 1)
  return Math.max(1, Math.min(200, Math.floor((MAX_EDGE_PX / edge) * 100)))
})
const outputSize = computed(() => {
  if (form.mode === 'percent') {
    const width = Math.max(1, Math.round((props.sourceWidth ?? 1) * (form.percent / 100)))
    const height = Math.max(1, Math.round((props.sourceHeight ?? 1) * (form.percent / 100)))
    return { width, height }
  }
  return {
    width: Math.max(1, form.width),
    height: Math.max(1, form.height),
  }
})
const options = computed<ResizeOptions>(() => ({
  type: form.type,
  quality: form.quality,
  width: outputSize.value.width,
  height: outputSize.value.height,
  fit: form.mode === 'percent' || form.lockRatio ? 'stretch' : form.fit,
  background: jpegLocked.value || form.background === 'white' ? '#ffffff' : undefined,
  knockoutWhite: knockoutWhite.value,
}))

const presets = computed(() => {
  const width = props.sourceWidth ?? 0
  const height = props.sourceHeight ?? 0
  return [
    { id: 'original', label: '原尺寸', width, height },
    { id: '256', label: '256²', width: 256, height: 256 },
    { id: '512', label: '512²', width: 512, height: 512 },
    { id: '1080', label: '1080²', width: 1080, height: 1080 },
    { id: '720p', label: '1280×720', width: 1280, height: 720 },
    { id: '1080p', label: '1920×1080', width: 1920, height: 1080 },
  ]
})

watch(
  () => [props.sourceWidth, props.sourceHeight, props.sourceFormat] as const,
  ([width, height, format]) => {
    if (!width || !height) return
    form.mode = 'pixel'
    form.width = Math.round(width)
    form.height = Math.round(height)
    form.percent = 100
    form.lockRatio = true
    form.fit = 'cover'
    form.type = rasterTypeFromFormat(format ?? 'png')
    form.background = 'transparent'
    lockedRatio = width / height
  },
  { immediate: true },
)

watch(
  () => form.lockRatio,
  (locked) => {
    if (locked && form.height > 0) lockedRatio = form.width / form.height
  },
)

watch(
  options,
  (value) => {
    emit('change', value)
  },
  { immediate: true },
)

function sameAspect(width: number, height: number) {
  const sourceWidth = props.sourceWidth ?? 1
  const sourceHeight = props.sourceHeight ?? 1
  return Math.abs(width / height - sourceWidth / sourceHeight) < 0.01
}

function applyPreset(width: number, height: number) {
  if (!width || !height) return
  form.mode = 'pixel'
  form.width = width
  form.height = height
  form.lockRatio = sameAspect(width, height)
  form.fit = form.lockRatio ? 'stretch' : 'cover'
  if (form.lockRatio) lockedRatio = width / height
}

function syncFromWidth(value: number | undefined) {
  if (value == null) return
  form.width = value
  if (form.lockRatio && lockedRatio > 0) {
    form.height = Math.min(MAX_EDGE_PX, Math.max(1, Math.round(value / lockedRatio)))
  }
}

function syncFromHeight(value: number | undefined) {
  if (value == null) return
  form.height = value
  if (form.lockRatio && lockedRatio > 0) {
    form.width = Math.min(MAX_EDGE_PX, Math.max(1, Math.round(value * lockedRatio)))
  }
}
</script>

<template>
  <section class="panel" :class="{ disabled }">
    <h2>尺寸参数</h2>
    <p v-if="disabled">请先上传图片后再调整尺寸</p>
    <template v-else>
      <p v-if="loading">正在调整尺寸…</p>
      <el-radio-group v-model="form.mode" size="small">
        <el-radio-button value="pixel">像素</el-radio-button>
        <el-radio-button value="percent">比例</el-radio-button>
      </el-radio-group>
      <template v-if="form.mode === 'percent'">
        <div class="row">
          <span>缩放</span>
          <el-slider v-model="form.percent" :min="1" :max="maxPercent" :step="1" />
          <el-input-number v-model="form.percent" :min="1" :max="maxPercent" size="small" />
        </div>
        <p class="hint">结果 {{ outputSize.width }} × {{ outputSize.height }}</p>
      </template>
      <template v-else>
        <div class="row">
          <span>宽</span>
          <el-input-number
            v-model="form.width"
            :min="1"
            :max="MAX_EDGE_PX"
            size="small"
            controls-position="right"
            @change="syncFromWidth"
          />
          <span>高</span>
          <el-input-number
            v-model="form.height"
            :min="1"
            :max="MAX_EDGE_PX"
            size="small"
            controls-position="right"
            @change="syncFromHeight"
          />
        </div>
        <div class="row">
          <span>比例</span>
          <el-switch v-model="form.lockRatio" active-text="保持宽高比" />
        </div>
        <div class="presets">
          <el-button
            v-for="preset in presets"
            :key="preset.id"
            size="small"
            @click="applyPreset(preset.width, preset.height)"
          >
            {{ preset.label }}
          </el-button>
        </div>
        <div v-if="showFit" class="row">
          <span>适配</span>
          <el-radio-group v-model="form.fit" size="small">
            <el-radio-button value="contain">完整显示</el-radio-button>
            <el-radio-button value="cover">居中裁剪</el-radio-button>
            <el-radio-button value="stretch">拉伸</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <el-radio-group v-model="form.type" size="small">
        <el-radio-button value="image/png">PNG</el-radio-button>
        <el-radio-button value="image/jpeg">JPEG</el-radio-button>
        <el-radio-button value="image/webp">WebP</el-radio-button>
      </el-radio-group>
      <div v-if="form.type !== 'image/png'" class="row">
        <span>质量</span>
        <el-slider v-model="form.quality" :min="0.1" :max="1" :step="0.02" />
      </div>
      <div v-if="showBackground" class="row">
        <span>背景</span>
        <el-radio-group v-model="form.background" size="small">
          <el-radio-button value="transparent">透明</el-radio-button>
          <el-radio-button value="white">白色</el-radio-button>
        </el-radio-group>
      </div>
    </template>
  </section>
</template>

<style scoped>
.panel {
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel.disabled {
  opacity: 0.55;
  pointer-events: none;
}

h2 {
  margin: 0;
  font-size: 15px;
}

p {
  margin: 0;
  color: #909399;
  font-size: 13px;
}

.hint {
  line-height: 1.5;
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.row span {
  width: 36px;
  flex-shrink: 0;
  font-size: 13px;
  color: #606266;
}

.row :deep(.el-slider) {
  flex: 1;
}

.row :deep(.el-input-number) {
  width: 110px;
}

.presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
