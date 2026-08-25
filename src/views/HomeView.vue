<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { homeTools, type ToolStatus } from '@/data/tools'
import { t } from '@/i18n'

const tagType: Record<ToolStatus, 'success' | 'warning' | 'info'> = {
  available: 'success',
  soon: 'warning',
  planned: 'info',
}
</script>

<template>
  <main class="home">
    <section class="hero">
      <h1>{{ t('home.title') }}</h1>
      <p>{{ t('home.lead') }}</p>
    </section>
    <nav class="group" :aria-label="t('nav.list')">
      <div class="grid">
        <RouterLink v-for="tool in homeTools" :key="tool.id" class="card" :to="tool.to">
          <div class="card-top">
            <h3>{{ t(`tools.${tool.id}.title`) }}</h3>
            <el-tag size="small" :type="tagType[tool.status]">{{ t('tools.available') }}</el-tag>
          </div>
          <p>{{ t(`tools.${tool.id}.description`) }}</p>
          <span class="action">{{ tool.status === 'available' ? t('home.start') : t('home.soon') }}</span>
        </RouterLink>
      </div>
    </nav>
  </main>
</template>

<style scoped>
.home {
  max-width: 960px;
  margin: 0 auto;
  padding: 40px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.hero h1 {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 600;
}

.hero p {
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
    padding: 24px 16px 16px;
  }

  .hero h1 {
    font-size: 22px;
  }
}
</style>
