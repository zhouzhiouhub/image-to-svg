<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { CompressFormat, CompressMode, CompressOptions } from '@/utils/compressImage'

const props = defineProps<{
  disabled?: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  change: [options: CompressOptions]
}>()

const form = reactive({
  mode: 'quality' as CompressMode,
  format: 'auto' as CompressFormat,
  quality: 0.72,
})

const options = computed<CompressOptions>(() => ({
  mode: form.mode,
  format: form.format,
  quality: form.quality,
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
    <h2>压缩参数</h2>
    <p v-if="disabled">请先上传图片后再开始压缩</p>
    <template v-else>
      <p v-if="loading">正在压缩…</p>
      <div class="row">
        <span>策略</span>
        <el-radio-group v-model="form.mode" size="small">
          <el-radio-button value="quality">保画质</el-radio-button>
          <el-radio-button value="smaller">更小体积</el-radio-button>
        </el-radio-group>
      </div>
      <div class="row">
        <span>格式</span>
        <el-radio-group v-model="form.format" size="small">
          <el-radio-button value="auto">自动</el-radio-button>
          <el-radio-button value="keep">原格式</el-radio-button>
          <el-radio-button value="image/webp">WebP</el-radio-button>
          <el-radio-button value="image/jpeg">JPEG</el-radio-button>
          <el-radio-button value="image/png">PNG</el-radio-button>
        </el-radio-group>
      </div>
      <div v-if="form.mode === 'smaller' && form.format !== 'image/png'" class="row">
        <span>质量</span>
        <el-slider v-model="form.quality" :min="0.5" :max="0.9" :step="0.02" />
      </div>
      <p v-if="form.mode === 'quality'" class="hint">
        按高质量重编码，优先 WebP；若体积没有变小，会保留原文件。
      </p>
      <p v-else class="hint">降低质量以换取更小文件，观感可能略有损失。</p>
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
