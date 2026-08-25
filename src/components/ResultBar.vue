<script setup lang="ts">
import type { AcceptedFile } from '@/components/UploadPanel.vue'
import { formatBytes } from '@/utils/format'

defineProps<{
  source?: AcceptedFile | null
}>()
</script>

<template>
  <section class="bar">
    <template v-if="source">
      <span>{{ source.file.name }}</span>
      <span>{{ source.kind === 'svg' ? 'SVG → 位图' : '位图 → SVG' }}</span>
      <span>{{ formatBytes(source.file.size) }}</span>
      <span v-if="source.width && source.height">{{ source.width }} × {{ source.height }}</span>
    </template>
    <span v-else>指标与下载（待接入）</span>
  </section>
</template>

<style scoped>
.bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px;
  color: #909399;
  font-size: 13px;
}
</style>
