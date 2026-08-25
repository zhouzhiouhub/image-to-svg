<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { TraceOptions } from '@/types/trace'

defineProps<{
  disabled?: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  change: [options: TraceOptions]
}>()

const form = reactive({
  colorMode: 'mono' as 'mono' | 'color',
  posterizelevel: 4,
  turdsize: 2,
})

const options = computed<TraceOptions>(() => ({
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
  <section class="panel" :class="{ disabled }">
    <h2>转换参数</h2>
    <p v-if="disabled">请先上传位图后再调节描摹参数</p>
    <template v-else>
      <p v-if="loading">正在描摹为 SVG…</p>
      <div class="row">
        <span>色彩</span>
        <el-radio-group v-model="form.colorMode" size="small">
          <el-radio-button value="mono">黑白</el-radio-button>
          <el-radio-button value="color">多色</el-radio-button>
        </el-radio-group>
      </div>
      <div v-if="form.colorMode === 'color'" class="row">
        <span>层数</span>
        <el-input-number v-model="form.posterizelevel" :min="2" :max="8" size="small" />
      </div>
      <div class="row">
        <span>去噪</span>
        <el-input-number v-model="form.turdsize" :min="0" :max="100" size="small" />
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

.row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.row span {
  width: 36px;
  font-size: 13px;
  color: #606266;
}
</style>
