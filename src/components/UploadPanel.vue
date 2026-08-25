<script setup lang="ts">
</script>

<template>
  <section class="panel">
    <p>拖拽图片到此处，或点击选择文件</p>
    <p class="hint">支持 Ctrl+V 粘贴 · PNG / JPG / WebP / BMP / GIF / SVG</p>
  </section>
</template>

<style scoped>
.panel {
  min-height: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #fff;
  border: 1px dashed #dcdfe6;
  border-radius: 8px;
  color: #606266;
}

.hint {
  margin: 0;
  font-size: 13px;
  color: #909399;
}
</style>
