<script setup lang="ts">
import type { TransformOp } from '@/utils/transformImage'

defineProps<{
  disabled?: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  transform: [op: TransformOp]
  reset: []
}>()
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
      <p class="hint">先调整方向，再在左侧框选。导出保持原图格式。</p>
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

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
