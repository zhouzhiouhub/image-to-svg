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
  mode: 'preserve' as 'preserve' | 'vector',
  colorMode: 'color' as 'mono' | 'color',
  posterizelevel: 16,
  turdsize: 8,
})

const options = computed<TraceOptions>(() => ({
  mode: form.mode,
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
      <p v-if="loading">{{ form.mode === 'preserve' ? '正在保真封装为 SVG…' : '正在描摹为 SVG…' }}</p>
      <div class="row">
        <span>模式</span>
        <el-radio-group v-model="form.mode" size="small">
          <el-radio-button value="preserve">原样</el-radio-button>
          <el-radio-button value="vector">矢量</el-radio-button>
        </el-radio-group>
      </div>
      <template v-if="form.mode === 'vector'">
        <div class="row">
          <span>色彩</span>
          <el-radio-group v-model="form.colorMode" size="small">
            <el-radio-button value="mono">黑白</el-radio-button>
            <el-radio-button value="color">多色</el-radio-button>
          </el-radio-group>
        </div>
        <div v-if="form.colorMode === 'color'" class="row">
          <span>层数</span>
          <el-input-number v-model="form.posterizelevel" :min="4" :max="32" size="small" />
        </div>
        <div class="row">
          <span>去噪</span>
          <el-input-number v-model="form.turdsize" :min="0" :max="100" size="small" />
        </div>
        <p v-if="form.colorMode === 'color'" class="hint">
          渐变会被拆成色块，无法还原成真正的 SVG 渐变。层数调到 16–24 更接近原图，文件也会更大。
        </p>
      </template>
      <p v-else class="hint">原样模式会保留 PNG 的全部像素、颜色和透明效果，但 SVG 内部仍是位图。</p>
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
  font-size: 13px;
  color: #606266;
}
</style>
