<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import UploadPanel from '@/components/UploadPanel.vue'
import type { AcceptedFile } from '@/components/UploadPanel.vue'
import TraceParamPanel from '@/components/TraceParamPanel.vue'
import RasterParamPanel from '@/components/RasterParamPanel.vue'
import CompareView from '@/components/CompareView.vue'
import ResultBar from '@/components/ResultBar.vue'

const title = import.meta.env.VITE_APP_TITLE ?? '图片转SVG工具'
const source = ref<AcceptedFile | null>(null)
const previewUrl = ref<string | null>(null)

const showTrace = computed(() => !source.value || source.value.kind === 'raster')
const showRaster = computed(() => !source.value || source.value.kind === 'svg')

watch(source, (value, _prev, onCleanup) => {
  if (!value) {
    previewUrl.value = null
    return
  }
  const url = URL.createObjectURL(value.file)
  previewUrl.value = url
  onCleanup(() => URL.revokeObjectURL(url))
})

onUnmounted(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})

function onAccepted(payload: AcceptedFile) {
  source.value = payload
}
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>{{ title }}</h1>
    </header>
    <main class="app-main">
      <section class="app-setup">
        <UploadPanel @accepted="onAccepted" />
        <aside class="app-params">
          <TraceParamPanel v-if="showTrace" :disabled="!source" />
          <RasterParamPanel v-if="showRaster" :disabled="!source" />
        </aside>
      </section>
      <CompareView :original-url="previewUrl" :original-name="source?.file.name" />
      <ResultBar :source="source" />
    </main>
  </div>
</template>

<style>
:root {
  font-family: system-ui, sans-serif;
  color: #303133;
  background: #f5f7fa;
}

body {
  margin: 0;
}

.app {
  min-height: 100vh;
}

.app-header {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
}

.app-header h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.app-main {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.app-setup {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 16px;
}

@media (max-width: 767px) {
  .app-setup {
    grid-template-columns: 1fr;
  }
}

.app-params {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
