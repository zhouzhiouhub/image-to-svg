<script setup lang="ts">
withDefaults(
  defineProps<{
    originalUrl?: string | null
    originalName?: string
    resultUrl?: string | null
    resultAlt?: string
    converting?: boolean
  }>(),
  {
    resultAlt: '转换结果',
  },
)
</script>

<template>
  <section class="compare">
    <div class="pane">
      <img v-if="originalUrl" :src="originalUrl" :alt="originalName ?? '原图'" />
      <span v-else>原图预览</span>
    </div>
    <div class="pane">
      <template v-if="resultUrl">
        <img :src="resultUrl" :alt="resultAlt" :class="{ dim: converting }" />
        <span v-if="converting" class="busy">转换中…</span>
      </template>
      <span v-else-if="converting">转换中…</span>
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
  position: relative;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: #909399;
  overflow: hidden;
  background-color: #fff;
  background-image:
    linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
    linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
    linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
  background-size: 16px 16px;
  background-position:
    0 0,
    0 8px,
    8px -8px,
    -8px 0;
}

.pane img {
  max-width: 100%;
  max-height: 280px;
  object-fit: contain;
}

.pane img.dim {
  opacity: 0.45;
}

.busy {
  position: absolute;
  font-size: 13px;
}

@media (max-width: 767px) {
  .compare {
    grid-template-columns: 1fr;
  }
}
</style>
