<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { CompressMode } from '@/utils/compressImage'
import type { RasterFormat, RasterOptions } from '@/utils/svgRaster'
import { isOpaqueRasterSource } from '@/utils/knockoutWhite'
import { t } from '@/i18n'

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
    <h2>{{ t('exportPanel.title') }}</h2>
    <p v-if="disabled">{{ t('exportPanel.needFile') }}</p>
    <template v-else>
      <p v-if="loading">{{ t('exportPanel.loading') }}</p>
      <div class="row">
        <span>{{ t('exportPanel.format') }}</span>
        <el-radio-group v-model="form.target" size="small">
          <el-radio-button value="keep">{{ t('exportPanel.keep') }}</el-radio-button>
          <el-radio-button value="image/png">PNG</el-radio-button>
          <el-radio-button value="image/jpeg">JPEG</el-radio-button>
          <el-radio-button value="image/webp">WebP</el-radio-button>
        </el-radio-group>
      </div>
      <div class="row">
        <span>{{ t('exportPanel.strategy') }}</span>
        <el-radio-group v-model="form.strategy" size="small">
          <el-radio-button value="quality">{{ t('exportPanel.quality') }}</el-radio-button>
          <el-radio-button value="smaller">{{ t('exportPanel.smaller') }}</el-radio-button>
        </el-radio-group>
      </div>
      <div v-if="showScale" class="row">
        <span>{{ t('exportPanel.scale') }}</span>
        <el-radio-group v-model="form.scale" size="small">
          <el-radio-button :value="1">1×</el-radio-button>
          <el-radio-button :value="2">2×</el-radio-button>
          <el-radio-button :value="3">3×</el-radio-button>
        </el-radio-group>
      </div>
      <div v-if="showQuality" class="row">
        <span>{{ t('exportPanel.qualityLabel') }}</span>
        <el-slider
          v-model="form.quality"
          :min="form.strategy === 'smaller' ? 0.5 : 0.1"
          :max="form.strategy === 'smaller' ? 0.9 : 1"
          :step="0.02"
        />
      </div>
      <div v-if="form.target !== 'keep' && !jpegLocked" class="row">
        <span>{{ t('exportPanel.background') }}</span>
        <el-radio-group v-model="form.background" size="small">
          <el-radio-button value="transparent">{{ t('exportPanel.transparent') }}</el-radio-button>
          <el-radio-button value="white">{{ t('exportPanel.white') }}</el-radio-button>
        </el-radio-group>
      </div>
      <p v-if="knockoutWhite" class="hint">{{ t('exportPanel.knockout') }}</p>
      <p v-else-if="form.target === 'keep'" class="hint">
        {{ form.strategy === 'quality' ? t('exportPanel.keepQuality') : t('exportPanel.keepSmaller') }}
      </p>
      <p v-else class="hint">{{ t('exportPanel.convertHint') }}</p>
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
