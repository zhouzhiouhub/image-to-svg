<script setup lang="ts">
</script>

<template>
  <section class="compare">
    <div class="pane">原图预览</div>
    <div class="pane">结果预览</div>
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
}

@media (max-width: 767px) {
  .compare {
    grid-template-columns: 1fr;
  }
}
</style>
