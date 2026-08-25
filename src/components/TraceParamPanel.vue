<script setup lang="ts">
defineProps<{
  disabled?: boolean
  loading?: boolean
}>()
</script>

<template>
  <section class="panel" :class="{ disabled }">
    <h2>转换参数</h2>
    <p v-if="disabled">请先上传位图后再调节描摹参数</p>
    <p v-else-if="loading">正在描摹为 SVG…</p>
    <p v-else>已使用默认参数进行黑白描摹</p>
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
