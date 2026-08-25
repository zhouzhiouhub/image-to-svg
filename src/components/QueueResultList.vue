<script setup lang="ts">
import type { QueueItem } from '@/composables/useOutputQueue'
import { formatBytes } from '@/utils/format'

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
      <span>{{ items.length ? summary : '尚未添加图片' }}</span>
      <span v-if="errorCount">失败 {{ errorCount }}</span>
      <el-button size="small" :disabled="!doneCount" @click="emit('zip')">下载 ZIP</el-button>
      <el-button size="small" :disabled="!items.length" @click="emit('clear')">清空</el-button>
    </header>
    <p v-if="!items.length" class="empty">可一次拖入多张，按当前参数逐张处理</p>
    <ul v-else>
      <li v-for="item in items" :key="item.id">
        <div class="meta">
          <strong>{{ item.source.file.name }}</strong>
          <span>{{ formatBytes(item.source.file.size) }}</span>
          <span v-if="item.status === 'running'">处理中…</span>
          <span v-else-if="item.status === 'queued'">排队中</span>
          <span v-else-if="item.status === 'error'" class="warn">{{ item.error }}</span>
          <span v-else-if="item.blob">
            → {{ formatBytes(item.blob.size) }}
            <template v-if="item.keptOriginal"> · 已保留原文件</template>
          </span>
        </div>
        <div class="actions">
          <el-button size="small" :disabled="!item.blob" @click="emit('download', item)">下载</el-button>
          <el-button size="small" @click="emit('remove', item.id)">移除</el-button>
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
