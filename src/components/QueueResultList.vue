<script setup lang="ts">
import type { QueueItem } from '@/composables/useOutputQueue'
import { formatBytes } from '@/utils/format'
import { t } from '@/i18n'

defineProps<{
  items: QueueItem[]
  converting?: boolean
  summary?: string
  doneCount?: number
  errorCount?: number
}>()

const emit = defineEmits<{
  download: [item: QueueItem]
  remove: [id: string]
  zip: []
  clear: []
}>()
</script>

<template>
  <section class="list">
    <header>
      <span>{{ items.length ? summary : t('queue.empty') }}</span>
      <span v-if="errorCount">{{ t('queue.failed', { n: errorCount }) }}</span>
      <el-button size="small" :disabled="!doneCount" @click="emit('zip')">{{ t('queue.zip') }}</el-button>
      <el-button size="small" :disabled="!items.length" @click="emit('clear')">{{ t('queue.clear') }}</el-button>
    </header>
    <p v-if="!items.length" class="empty">{{ t('queue.hint') }}</p>
    <ul v-else>
      <li v-for="item in items" :key="item.id">
        <div class="meta">
          <strong>{{ item.source.file.name }}</strong>
          <span>{{ formatBytes(item.source.file.size) }}</span>
          <span v-if="item.status === 'running'">{{ t('queue.running') }}</span>
          <span v-else-if="item.status === 'queued'">{{ t('queue.queued') }}</span>
          <span v-else-if="item.status === 'error'" class="warn">{{ item.error }}</span>
          <span v-else-if="item.blob">
            → {{ formatBytes(item.blob.size) }}
            <template v-if="item.keptOriginal"> · {{ t('queue.kept') }}</template>
          </span>
        </div>
        <div class="actions">
          <el-button size="small" :disabled="!item.blob" @click="emit('download', item)">{{ t('queue.download') }}</el-button>
          <el-button size="small" @click="emit('remove', item.id)">{{ t('queue.remove') }}</el-button>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.list {
  padding: 16px;
  background: #fff;
  border-radius: 8px;
}

header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  color: #909399;
  font-size: 13px;
}

.empty {
  margin: 0;
  color: #909399;
  font-size: 13px;
}

ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid #ebeef5;
}

li:first-child {
  border-top: none;
  padding-top: 0;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  min-width: 0;
  font-size: 13px;
  color: #909399;
}

.meta strong {
  color: #303133;
  font-weight: 600;
  word-break: break-all;
}

.actions {
  display: flex;
  gap: 8px;
}

.warn {
  color: #e6a23c;
}
</style>
