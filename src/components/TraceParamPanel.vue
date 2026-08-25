<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { TraceOptions } from '@/types/trace'

const props = defineProps<{
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
    <h2>转换方式</h2>
    <el-radio-group v-model="mode" size="small">
      <el-radio-button value="preserve">原样封装</el-radio-button>
      <el-radio-button value="vector">矢量描摹</el-radio-button>
    </el-radio-group>
    <p class="hint">
      {{
        mode === 'preserve'
          ? '把原图像素完整封进 SVG，颜色和透明与原图一致，放大不会变清晰。'
          : '描成可缩放的矢量路径，适合图标和线稿；复杂渐变会被拆成色块。'
      }}
    </p>
    <div class="params" :class="{ disabled }">
      <p v-if="disabled">请先上传位图后再开始转换</p>
      <template v-else>
        <p v-if="loading">{{ mode === 'preserve' ? '正在保真封装为 SVG…' : '正在描摹为 SVG…' }}</p>
        <template v-if="mode === 'vector'">
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
            渐变会被拆成色块。层数调到 16–24 更接近原图，文件也会更大。
          </p>
        </template>
      </template>
    </div>
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
