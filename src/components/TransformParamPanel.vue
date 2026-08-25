<script setup lang="ts">
import type { TransformOp } from '@/utils/transformImage'
import { t } from '@/i18n'

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
    <h2>{{ t('transform.title') }}</h2>
    <p v-if="disabled">{{ t('transform.needFile') }}</p>
    <template v-else>
      <p v-if="loading">{{ t('transform.loading') }}</p>
      <div class="actions">
        <el-button size="small" @click="emit('transform', 'ccw')">{{ t('transform.ccw') }}</el-button>
        <el-button size="small" @click="emit('transform', 'cw')">{{ t('transform.cw') }}</el-button>
        <el-button size="small" @click="emit('transform', 'flipH')">{{ t('transform.flipH') }}</el-button>
        <el-button size="small" @click="emit('transform', 'flipV')">{{ t('transform.flipV') }}</el-button>
        <el-button size="small" @click="emit('reset')">{{ t('transform.reset') }}</el-button>
      </div>
      <p class="hint">{{ t('transform.hint') }}</p>
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
