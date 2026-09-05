<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { ICO_PRESET_SIZES, MAX_ICO_EDGE, type IcoSize } from '@/utils/icoEncode'
import type { ResizeFit } from '@/utils/svgRaster'
import { isOpaqueRasterSource } from '@/utils/knockoutWhite'
import { t } from '@/i18n'

export type IcoPanelOptions = {
  sizes: IcoSize[]
  fit: ResizeFit
  background?: string
  knockoutWhite?: boolean
}

const props = defineProps<{
  disabled?: boolean
  loading?: boolean
  sourceFormat?: string
}>()

const emit = defineEmits<{
  change: [options: IcoPanelOptions]
}>()

const form = reactive({
  selected: 32 as number | null,
  customEnabled: false,
  customWidth: 64,
  customHeight: 64,
  fit: 'contain' as ResizeFit,
  background: 'transparent' as 'transparent' | 'white',
})

const presets = ICO_PRESET_SIZES.map((size) => ({
  size,
  label: `${size}×${size}`,
}))

const knockoutWhite = computed(
  () =>
    form.background === 'transparent' &&
    form.fit === 'contain' &&
    isOpaqueRasterSource(props.sourceFormat),
)

const showBackground = computed(() => form.fit === 'contain')

const sizes = computed<IcoSize[]>(() => {
  if (form.customEnabled) {
    return [
      {
        width: Math.min(MAX_ICO_EDGE, Math.max(1, Math.round(form.customWidth))),
        height: Math.min(MAX_ICO_EDGE, Math.max(1, Math.round(form.customHeight))),
      },
    ]
  }
  const size = form.selected ?? 32
  return [{ width: size, height: size }]
})

const options = computed<IcoPanelOptions>(() => ({
  sizes: sizes.value,
  fit: form.fit,
  background: form.background === 'white' ? '#ffffff' : undefined,
  knockoutWhite: knockoutWhite.value,
}))

watch(
  options,
  (value) => {
    emit('change', value)
  },
  { immediate: true },
)

function selectPreset(size: number) {
  form.customEnabled = false
  form.selected = size
}

function onCustomToggle(enabled: string | number | boolean) {
  const on = enabled === true
  form.customEnabled = on
  if (on) form.selected = null
  else if (form.selected == null) form.selected = 32
}
</script>

<template>
  <section class="panel" :class="{ disabled }">
    <h2>{{ t('icoPanel.title') }}</h2>
    <p v-if="disabled">{{ t('icoPanel.needFile') }}</p>
    <template v-else>
      <p v-if="loading">{{ t('icoPanel.loading') }}</p>
      <div class="row">
        <span>{{ t('icoPanel.sizes') }}</span>
        <div class="presets">
          <el-button
            v-for="preset in presets"
            :key="preset.size"
            size="small"
            :type="!form.customEnabled && form.selected === preset.size ? 'primary' : 'default'"
            @click="selectPreset(preset.size)"
          >
            {{ preset.label }}
          </el-button>
        </div>
      </div>
      <div class="row custom">
        <span>{{ t('icoPanel.custom') }}</span>
        <el-switch :model-value="form.customEnabled" @change="onCustomToggle" />
        <template v-if="form.customEnabled">
          <el-input-number
            v-model="form.customWidth"
            :min="1"
            :max="MAX_ICO_EDGE"
            size="small"
            controls-position="right"
          />
          <span class="times">×</span>
          <el-input-number
            v-model="form.customHeight"
            :min="1"
            :max="MAX_ICO_EDGE"
            size="small"
            controls-position="right"
          />
        </template>
      </div>
      <div class="row">
        <span>{{ t('icoPanel.fit') }}</span>
        <el-radio-group v-model="form.fit" size="small">
          <el-radio-button value="contain">{{ t('icoPanel.contain') }}</el-radio-button>
          <el-radio-button value="cover">{{ t('icoPanel.cover') }}</el-radio-button>
          <el-radio-button value="stretch">{{ t('icoPanel.stretch') }}</el-radio-button>
        </el-radio-group>
      </div>
      <div v-if="showBackground" class="row">
        <span>{{ t('icoPanel.background') }}</span>
        <el-radio-group v-model="form.background" size="small">
          <el-radio-button value="transparent">{{ t('icoPanel.transparent') }}</el-radio-button>
          <el-radio-button value="white">{{ t('icoPanel.white') }}</el-radio-button>
        </el-radio-group>
      </div>
      <p v-if="knockoutWhite" class="hint">{{ t('icoPanel.knockout') }}</p>
      <p v-else class="hint">{{ t('icoPanel.hint') }}</p>
    </template>
  </section>
</template>

<style scoped>
.panel {
  padding: 16px;
  background: var(--app-surface);
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
  color: var(--app-faint);
  font-size: 13px;
}

.hint {
  line-height: 1.5;
}

.row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.row > span:first-child {
  width: 48px;
  flex-shrink: 0;
  padding-top: 4px;
  font-size: 13px;
  color: var(--app-muted);
}

.row.custom {
  align-items: center;
}

.row.custom > span:first-child {
  padding-top: 0;
}

.presets {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 8px;
}

.times {
  width: auto !important;
  padding-top: 0 !important;
  color: var(--app-muted);
  font-size: 13px;
}

.row :deep(.el-input-number) {
  width: 110px;
}

.row :deep(.el-radio-group) {
  flex: 1;
  flex-wrap: wrap;
}
</style>
