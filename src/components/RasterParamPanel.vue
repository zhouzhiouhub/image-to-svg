<script setup lang="ts">
defineProps<{
  disabled?: boolean
}>()
</script>

<template>
  <section class="panel" :class="{ disabled }">
    <h2>导出参数</h2>
    <p>{{ disabled ? '请先上传 SVG 后再选择导出格式' : 'SVG 栅格化为 PNG / JPEG / WebP（待接入）' }}</p>
  </section>
</template>

<style scoped>
.panel {
  padding: 16px;
  background: #fff;
  border-radius: 8px;
}

.panel.disabled {
  opacity: 0.55;
  pointer-events: none;
}

h2 {
  margin: 0 0 8px;
  font-size: 15px;
}

p {
  margin: 0;
  color: #909399;
  font-size: 13px;
}
</style>
