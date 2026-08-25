<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { RasterFormat } from '@/utils/svgRaster'
import { outputTypeFromSource } from '@/utils/transformImage'
import type { TransformOp } from '@/utils/transformImage'

const props = defineProps<{
  disabled?: boolean
  loading?: boolean
  sourceFormat?: string
}>()

const emit = defineEmits<{
  transform: [op: TransformOp]
  reset: []
  change: [options: { type: RasterFormat; quality: number }]
}>()

const form = reactive({
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
  () => ({ type: form.type, quality: form.quality }),
  (value) => {
    emit('change', value)
  },
  { immediate: true },
)
</script>

<template>
  <section class="panel" :class="{ disabled }">
    <h2>旋转与翻转</h2>
    <p v-if="disabled">请先上传图片后再调整方向</p>
    <template v-else>
      <p v-if="loading">正在处理…</p>
      <div class="actions">
        <el-button size="small" @click="emit('transform', 'ccw')">向左 90°</el-button>
        <el-button size="small" @click="emit('transform', 'cw')">向右 90°</el-button>
        <el-button size="small" @click="emit('transform', 'flipH')">水平翻转</el-button>
        <el-button size="small" @click="emit('transform', 'flipV')">垂直翻转</el-button>
        <el-button size="small" @click="emit('reset')">恢复原图</el-button>
      </div>
      <el-radio-group v-model="form.type" size="small">
        <el-radio-button value="image/png">PNG</el-radio-button>
        <el-radio-button value="image/jpeg">JPEG</el-radio-button>
        <el-radio-button value="image/webp">WebP</el-radio-button>
      </el-radio-group>
      <div v-if="form.type !== 'image/png'" class="row">
        <span>质量</span>
        <el-slider v-model="form.quality" :min="0.1" :max="1" :step="0.02" />
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

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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
</style>
