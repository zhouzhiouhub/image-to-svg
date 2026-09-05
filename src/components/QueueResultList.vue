<script setup lang="ts">
import { ref } from 'vue'
import type { QueueItem } from '@/composables/useOutputQueue'
import { ARCHIVE_FORMATS, type ArchiveFormat } from '@/utils/archiveStore'
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
  archive: [format: ArchiveFormat]
  clear: []
}>()

const archiveFormat = ref<ArchiveFormat>('zip')
</script>

<template>
  <section class="list">
    <header>
      <span>{{ items.length ? summary : t('queue.empty') }}</span>
      <span v-if="errorCount">{{ t('queue.failed', { n: errorCount }) }}</span>
      <div v-if="doneCount" class="archive">
        <span>{{ t('queue.archiveFormat') }}</span>
        <el-select v-model="archiveFormat" size="small" class="archive-select">
          <el-option
            v-for="format in ARCHIVE_FORMATS"
            :key="format"
            :value="format"
            :label="t(`queue.archive.${format}`)"
          />
        </el-select>
        <el-button size="small" type="primary" @click="emit('archive', archiveFormat)">
          {{ t('queue.archiveDownload') }}
        </el-button>
      </div>
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
  background: var(--app-surface);
  border-radius: 8px;
}

header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  color: var(--app-faint);
  font-size: 13px;
}

.archive {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.archive-select {
  width: 128px;
}

.empty {
  margin: 0;
  color: var(--app-faint);
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
  border-top: 1px solid var(--app-border);
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
  color: var(--app-faint);
}

.meta strong {
  color: var(--app-text);
  font-weight: 600;
  word-break: break-all;
}

.actions {
  display: flex;
  gap: 8px;
}

.warn {
  color: var(--app-warn);
}
</style>
