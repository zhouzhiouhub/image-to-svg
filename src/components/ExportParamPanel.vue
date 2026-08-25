<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { CompressMode } from '@/utils/compressImage'
import type { RasterFormat, RasterOptions } from '@/utils/svgRaster'
import { isOpaqueRasterSource } from '@/utils/knockoutWhite'

export type ExportTarget = 'keep' | RasterFormat

export type ExportOptions = RasterOptions & {
  target: ExportTarget
  strategy: CompressMode
}

const props = defineProps<{
  disabled?: boolean
  loading?: boolean
  sourceFormat?: string
}>()

const emit = defineEmits<{
  change: [options: ExportOptions]
}>()

const form = reactive({
  target: 'keep' as ExportTarget,
  strategy: 'quality' as CompressMode,
  scale: 1,
  quality: 0.72,
  background: 'transparent' as 'transparent' | 'white',
})

const jpegLocked = computed(() => form.target === 'image/jpeg')
const showScale = computed(() => form.target !== 'keep')
const showQuality = computed(() => form.strategy === 'smaller')
const knockoutWhite = computed(
  () =>
    !jpegLocked.value &&
    form.background === 'transparent' &&
    isOpaqueRasterSource(props.sourceFormat) &&
    form.target !== 'keep',
)

const options = computed<ExportOptions>(() => ({
  target: form.target,
  strategy: form.strategy,
  type: form.target === 'keep' ? 'image/png' : form.target,
  scale: form.target === 'keep' ? 1 : form.scale,
  quality: form.strategy === 'quality' ? 0.92 : form.quality,
  background: jpegLocked.value || form.background === 'white' ? '#ffffff' : undefined,
  knockoutWhite: knockoutWhite.value,
}))

watch(
  options,
  (value) => {
    emit('change', value)
  },
  { immediate: true },
)
</script>

<template>
  <section class="panel" :class="{ disabled }">
    <h2>导出参数</h2>
    <p v-if="disabled">请先上传图片后再选择格式或压缩</p>
    <template v-else>
      <p v-if="loading">正在处理…</p>
      <div class="row">
        <span>格式</span>
        <el-radio-group v-model="form.target" size="small">
          <el-radio-button value="keep">原格式</el-radio-button>
          <el-radio-button value="image/png">PNG</el-radio-button>
          <el-radio-button value="image/jpeg">JPEG</el-radio-button>
          <el-radio-button value="image/webp">WebP</el-radio-button>
        </el-radio-group>
      </div>
      <div class="row">
        <span>策略</span>
        <el-radio-group v-model="form.strategy" size="small">
          <el-radio-button value="quality">保画质</el-radio-button>
          <el-radio-button value="smaller">更小体积</el-radio-button>
        </el-radio-group>
      </div>
      <div v-if="showScale" class="row">
        <span>倍率</span>
        <el-radio-group v-model="form.scale" size="small">
          <el-radio-button :value="1">1×</el-radio-button>
          <el-radio-button :value="2">2×</el-radio-button>
          <el-radio-button :value="3">3×</el-radio-button>
        </el-radio-group>
      </div>
      <div v-if="showQuality" class="row">
        <span>质量</span>
        <el-slider
          v-model="form.quality"
          :min="form.strategy === 'smaller' ? 0.5 : 0.1"
          :max="form.strategy === 'smaller' ? 0.9 : 1"
          :step="0.02"
        />
      </div>
      <div v-if="form.target !== 'keep' && !jpegLocked" class="row">
        <span>背景</span>
        <el-radio-group v-model="form.background" size="small">
          <el-radio-button value="transparent">透明</el-radio-button>
          <el-radio-button value="white">白色</el-radio-button>
        </el-radio-group>
      </div>
      <p v-if="knockoutWhite" class="hint">会把图片边缘的白底抠成透明。</p>
      <p v-else-if="form.target === 'keep'" class="hint">
        {{ form.strategy === 'quality' ? '按原格式高质量重编码；若体积没有变小，会保留原文件。' : '降低质量以换取更小文件，仍导出为原格式。' }}
      </p>
      <p v-else class="hint">按所选格式重新编码。可一次处理多张并打包 zip。</p>
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

.row :deep(.el-radio-group) {
  flex: 1;
  flex-wrap: wrap;
}
</style>
