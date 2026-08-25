<script setup lang="ts">
defineProps<{
  originalUrl?: string | null
  originalName?: string
  resultUrl?: string | null
  converting?: boolean
}>()
</script>

<template>
  <section class="compare">
    <div class="pane">
      <img v-if="originalUrl" :src="originalUrl" :alt="originalName ?? '原图'" />
      <span v-else>原图预览</span>
    </div>
    <div class="pane">
      <span v-if="converting">转换中…</span>
      <img v-else-if="resultUrl" :src="resultUrl" alt="SVG 结果" />
      <span v-else>结果预览</span>
    </div>
  </section>
</template>

<style scoped>
.compare {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.pane {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 8px;
  color: #909399;
  overflow: hidden;
}

.pane img {
  max-width: 100%;
  max-height: 280px;
  object-fit: contain;
}

@media (max-width: 767px) {
  .compare {
    grid-template-columns: 1fr;
  }
}
</style>
