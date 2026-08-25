<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { TraceOptions } from '@/types/trace'
import { t } from '@/i18n'

defineProps<{
  disabled?: boolean
  loading?: boolean
}>()

const mode = defineModel<'preserve' | 'vector'>('mode', { required: true })

const emit = defineEmits<{
  change: [options: TraceOptions]
}>()

const form = reactive({
  colorMode: 'color' as 'mono' | 'color',
  posterizelevel: 16,
  turdsize: 8,
})

const options = computed<TraceOptions>(() => ({
  mode: mode.value,
  turdsize: form.turdsize,
  extractcolors: form.colorMode === 'color',
  posterizelevel: form.colorMode === 'color' ? form.posterizelevel : undefined,
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
  <section class="panel">
    <h2>{{ t('trace.title') }}</h2>
    <el-radio-group v-model="mode" size="small">
      <el-radio-button value="preserve">{{ t('trace.preserve') }}</el-radio-button>
      <el-radio-button value="vector">{{ t('trace.vector') }}</el-radio-button>
    </el-radio-group>
    <p class="hint">
      {{ mode === 'preserve' ? t('trace.preserveHint') : t('trace.vectorHint') }}
    </p>
    <div class="params" :class="{ disabled }">
      <p v-if="disabled">{{ t('trace.needFile') }}</p>
      <template v-else>
        <p v-if="loading">{{ mode === 'preserve' ? t('trace.loadingPreserve') : t('trace.loadingVector') }}</p>
        <template v-if="mode === 'vector'">
          <div class="row">
            <span>{{ t('trace.color') }}</span>
            <el-radio-group v-model="form.colorMode" size="small">
              <el-radio-button value="mono">{{ t('trace.mono') }}</el-radio-button>
              <el-radio-button value="color">{{ t('trace.multi') }}</el-radio-button>
            </el-radio-group>
          </div>
          <div v-if="form.colorMode === 'color'" class="row">
            <span>{{ t('trace.layers') }}</span>
            <el-input-number v-model="form.posterizelevel" :min="4" :max="32" size="small" />
          </div>
          <div class="row">
            <span>{{ t('trace.denoise') }}</span>
            <el-input-number v-model="form.turdsize" :min="0" :max="100" size="small" />
          </div>
          <p v-if="form.colorMode === 'color'" class="hint">{{ t('trace.colorHint') }}</p>
        </template>
      </template>
    </div>
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

.params.disabled {
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
  align-items: center;
  gap: 12px;
}

.row span {
  width: 36px;
  font-size: 13px;
  color: var(--app-muted);
}
</style>
