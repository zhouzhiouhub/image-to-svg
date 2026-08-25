<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { RasterFormat } from '@/utils/svgRaster'
import { outputTypeFromSource } from '@/utils/transformImage'

const props = defineProps<{
  disabled?: boolean
  loading?: boolean
  sourceFormat?: string
  cropWidth?: number
  cropHeight?: number
}>()

const emit = defineEmits<{
  aspect: [value: number | null]
  change: [options: { type: RasterFormat; quality: number }]
  reset: []
}>()

const form = reactive({
  aspect: 'free' as 'free' | '1' | '4-3' | '16-9',
  type: 'image/png' as RasterFormat,
  quality: 0.92,
})

watch(
  () => props.sourceFormat,
  (format) => {
    if (!format) return
    form.type = outputTypeFromSource(format)
  },
)

watch(
  () => form.aspect,
  (value) => {
    if (value === '1') emit('aspect', 1)
    else if (value === '4-3') emit('aspect', 4 / 3)
    else if (value === '16-9') emit('aspect', 16 / 9)
    else emit('aspect', null)
  },
)

watch(
  () => ({ type: form.type, quality: form.quality }),
  (value) => {
    emit('change', value)
  },
  { immediate: true },
)
</script>

<template>
  <section class="panel" :class="{ disabled }">
    <h2>裁剪参数</h2>
    <p v-if="disabled">请先上传图片后再框选裁剪</p>
    <template v-else>
      <p v-if="loading">正在裁剪…</p>
      <div class="row">
        <span>比例</span>
        <el-radio-group v-model="form.aspect" size="small">
          <el-radio-button value="free">自由</el-radio-button>
          <el-radio-button value="1">1:1</el-radio-button>
          <el-radio-button value="4-3">4:3</el-radio-button>
          <el-radio-button value="16-9">16:9</el-radio-button>
        </el-radio-group>
      </div>
      <p v-if="cropWidth && cropHeight" class="hint">选区 {{ cropWidth }} × {{ cropHeight }}</p>
      <el-button size="small" @click="emit('reset')">重置选区</el-button>
      <el-radio-group v-model="form.type" size="small">
        <el-radio-button value="image/png">PNG</el-radio-button>
        <el-radio-button value="image/jpeg">JPEG</el-radio-button>
        <el-radio-button value="image/webp">WebP</el-radio-button>
      </el-radio-group>
      <div v-if="form.type !== 'image/png'" class="row">
        <span>质量</span>
        <el-slider v-model="form.quality" :min="0.1" :max="1" :step="0.02" />
      </div>
      <p class="hint">在左侧原图上拖拽框选，可拖动选框或四角调整。</p>
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
