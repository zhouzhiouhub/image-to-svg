<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { toolGroups, type ToolStatus } from '@/data/tools'

const tagType: Record<ToolStatus, 'success' | 'warning' | 'info'> = {
  available: 'success',
  soon: 'warning',
  planned: 'info',
}
</script>

<template>
  <main class="home">
    <section class="hero">
      <h1>Kinolin Tool</h1>
      <p>
        免费在浏览器本地把 PNG、JPG 转成 SVG，也能裁剪、旋转、改尺寸，以及转换 PNG / JPEG / WebP 并压缩。图片不上传服务器。
      </p>
    </section>
    <nav v-for="group in toolGroups" :key="group.title" class="group" aria-label="功能列表">
      <header v-if="group.intro" class="group-head">
        <h2>{{ group.title }}</h2>
        <p>{{ group.intro }}</p>
      </header>
      <div class="grid">
        <RouterLink v-for="tool in group.tools" :key="tool.id" class="card" :to="tool.to">
          <div class="card-top">
            <h3>{{ tool.title }}</h3>
            <el-tag size="small" :type="tagType[tool.status]">{{ tool.statusLabel }}</el-tag>
          </div>
          <p>{{ tool.description }}</p>
          <span class="action">{{ tool.status === 'available' ? '开始使用' : '查看计划' }}</span>
        </RouterLink>
      </div>
    </nav>
  </main>
</template>

<style scoped>
.home {
  max-width: 960px;
  margin: 0 auto;
  padding: 40px 24px 64px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.hero h1 {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 600;
}

.hero p,
.group-head p {
  margin: 0;
  max-width: 640px;
  color: #606266;
  line-height: 1.6;
}

.group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.group-head h2 {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 600;
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: 1fr 1fr 1fr;
  }
}

.card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  color: inherit;
  text-decoration: none;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.card:hover {
  border-color: #c6e2ff;
  box-shadow: 0 4px 16px rgb(64 158 255 / 8%);
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
}

.card p {
  margin: 0;
  flex: 1;
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
}

.action {
  font-size: 13px;
  color: #409eff;
}

@media (max-width: 767px) {
  .home {
    padding: 24px 16px 48px;
  }

  .hero h1 {
    font-size: 22px;
  }
}
</style>
