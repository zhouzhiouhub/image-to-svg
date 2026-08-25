<script setup lang="ts">
defineProps<{
  disabled?: boolean
}>()
</script>

<template>
  <section class="panel" :class="{ disabled }">
    <h2>转换参数</h2>
    <p>{{ disabled ? '请先上传位图后再调节描摹参数' : '位图描摹参数（待接入）' }}</p>
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
