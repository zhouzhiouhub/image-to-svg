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
      <h1>选择你要做的事</h1>
      <p>图片在浏览器本地处理，不上传服务器。图片转 SVG 有两种做法，效果不同，请先选功能再上传。</p>
    </section>
    <section v-for="group in toolGroups" :key="group.title" class="group">
      <header class="group-head">
        <h2>{{ group.title }}</h2>
        <p v-if="group.intro">{{ group.intro }}</p>
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
    </section>
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
  grid-template-columns: 1fr 1fr;
  gap: 16px;
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

  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
