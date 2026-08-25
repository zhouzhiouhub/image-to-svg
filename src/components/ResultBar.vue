<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { AcceptedFile } from '@/components/UploadPanel.vue'
import { formatBytes } from '@/utils/format'

const props = defineProps<{
  source?: AcceptedFile | null
  svg?: string | null
}>()

const pathCount = computed(() => props.svg?.match(/<path\b/gi)?.length ?? 0)
const svgBytes = computed(() => (props.svg ? new Blob([props.svg]).size : 0))
const larger = computed(() => !!props.source && svgBytes.value > props.source.file.size)

function fileStem() {
  const name = props.source?.file.name ?? 'result'
  return name.replace(/\.[^.]+$/, '') || 'result'
}

async function copySvg() {
  if (!props.svg) return
  try {
    await navigator.clipboard.writeText(props.svg)
    ElMessage.success('已复制 SVG 代码')
  } catch {
    ElMessage.error('复制失败，请手动选择代码')
  }
}

function downloadSvg() {
  if (!props.svg) return
  const url = URL.createObjectURL(new Blob([props.svg], { type: 'image/svg+xml;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `${fileStem()}.svg`
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <section class="bar">
    <template v-if="source">
      <span>{{ source.file.name }}</span>
      <span>{{ source.kind === 'svg' ? 'SVG → 位图' : '位图 → SVG' }}</span>
      <span>{{ formatBytes(source.file.size) }}</span>
      <span v-if="source.width && source.height">{{ source.width }} × {{ source.height }}</span>
      <template v-if="svg">
        <span :class="{ warn: larger }">SVG {{ formatBytes(svgBytes) }}</span>
        <span>路径 {{ pathCount }}</span>
        <el-button size="small" type="primary" @click="downloadSvg">下载 SVG</el-button>
        <el-button size="small" @click="copySvg">复制代码</el-button>
      </template>
    </template>
    <span v-else>指标与下载（待接入）</span>
  </section>
</template>

<style scoped>
.bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px;
  color: #909399;
  font-size: 13px;
}

.warn {
  color: #e6a23c;
}
</style>
