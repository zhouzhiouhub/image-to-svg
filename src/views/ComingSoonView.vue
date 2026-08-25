<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const title = computed(() => (typeof route.meta.title === 'string' ? route.meta.title : '功能准备中'))
const description = computed(() =>
  typeof route.meta.description === 'string' ? route.meta.description : '',
)
const statusLabel = computed(() =>
  typeof route.meta.statusLabel === 'string' ? route.meta.statusLabel : '即将推出',
)
</script>

<template>
  <main class="soon">
    <el-tag size="small" :type="route.name === 'app' ? 'info' : 'warning'">{{ statusLabel }}</el-tag>
    <h1>{{ title }}</h1>
    <p>{{ description }}</p>
    <p class="note">该功能还在准备中。当前可以先使用「原样转 SVG」或「矢量描摹」，图片仍在浏览器本地处理。</p>
    <div class="actions">
      <el-button type="primary" @click="router.push('/')">返回首页</el-button>
      <el-button @click="router.push('/svg/preserve')">原样转 SVG</el-button>
      <el-button @click="router.push('/svg/vector')">矢量描摹</el-button>
    </div>
  </main>
</template>

<style scoped>
.soon {
  max-width: 640px;
  margin: 0 auto;
  padding: 64px 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

h1 {
  margin: 4px 0 0;
  font-size: 24px;
  font-weight: 600;
}

p {
  margin: 0;
  color: #606266;
  line-height: 1.6;
}

.note {
  color: #909399;
  font-size: 13px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

@media (max-width: 767px) {
  .soon {
    padding: 32px 16px;
  }
}
</style>
