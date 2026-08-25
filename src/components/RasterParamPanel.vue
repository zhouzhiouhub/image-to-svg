<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { RasterFormat, RasterOptions } from '@/utils/svgRaster'

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    loading?: boolean
    title?: string
    emptyText?: string
    loadingText?: string
    initialScale?: number
  }>(),
  {
    title: '转换参数',
    emptyText: '请先上传图片后再选择导出格式',
    loadingText: '正在转换…',
    initialScale: 1,
  },
)

const emit = defineEmits<{
  change: [options: RasterOptions]
}>()

const form = reactive({
  type: 'image/png' as RasterFormat,
  scale: props.initialScale,
  quality: 0.92,
  background: 'transparent' as 'transparent' | 'white',
})

const jpegLocked = computed(() => form.type === 'image/jpeg')

const options = computed<RasterOptions>(() => ({
  type: form.type,
  scale: form.scale,
  quality: form.quality,
  background: jpegLocked.value || form.background === 'white' ? '#ffffff' : undefined,
}))

watch(
  options,
  (value) => {
    emit('change', value)
  },
  { immediate: true },
)
</script>

<template>
  <section class="panel" :class="{ disabled }">
    <h2>{{ title }}</h2>
    <p v-if="disabled">{{ emptyText }}</p>
    <template v-else>
      <p v-if="loading">{{ loadingText }}</p>
      <el-radio-group v-model="form.type" size="small">
        <el-radio-button value="image/png">PNG</el-radio-button>
        <el-radio-button value="image/jpeg">JPEG</el-radio-button>
        <el-radio-button value="image/webp">WebP</el-radio-button>
      </el-radio-group>
      <div class="row">
        <span>倍率</span>
        <el-radio-group v-model="form.scale" size="small">
          <el-radio-button :value="1">1×</el-radio-button>
          <el-radio-button :value="2">2×</el-radio-button>
          <el-radio-button :value="3">3×</el-radio-button>
        </el-radio-group>
      </div>
      <div v-if="form.type !== 'image/png'" class="row">
        <span>质量</span>
        <el-slider v-model="form.quality" :min="0.1" :max="1" :step="0.02" />
      </div>
      <div v-if="!jpegLocked" class="row">
        <span>背景</span>
        <el-radio-group v-model="form.background" size="small">
          <el-radio-button value="transparent">透明</el-radio-button>
          <el-radio-button value="white">白色</el-radio-button>
        </el-radio-group>
      </div>
    </template>
  </section>
</template>

<style scoped>
.panel {
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel.disabled {
  opacity: 0.55;
  pointer-events: none;
}

h2 {
  margin: 0;
  font-size: 15px;
}

p {
  margin: 0;
  color: #909399;
  font-size: 13px;
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.row span {
  width: 36px;
  font-size: 13px;
  color: #606266;
}

.row :deep(.el-slider) {
  flex: 1;
}
</style>
