<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import HistoryList from '@/components/HistoryList.vue'

const route = useRoute()
const isHome = computed(() => route.name === 'home')
const showHeading = computed(() => route.name === 'svg' || route.name === 'edit' || route.name === 'export')
const pageTitle = computed(() => (typeof route.meta.title === 'string' ? route.meta.title : ''))
const pageDescription = computed(() =>
  showHeading.value && typeof route.meta.description === 'string' ? route.meta.description : '',
)
const favicon = `${import.meta.env.BASE_URL}favicon.svg`
</script>

<template>
  <div class="app">
    <header class="app-header">
      <RouterLink class="brand" to="/">
        <img :src="favicon" alt="Kinolin Tool" width="28" height="28" />
        <span>Kinolin Tool</span>
      </RouterLink>
      <nav v-if="!isHome" class="nav">
        <h1 v-if="showHeading" class="page-title">{{ pageTitle }}</h1>
        <RouterLink class="home-link" to="/">返回首页</RouterLink>
      </nav>
    </header>
    <div class="app-body">
      <p v-if="pageDescription" class="page-lead">{{ pageDescription }}</p>
      <RouterView :key="route.fullPath" />
      <HistoryList />
    </div>
    <footer class="app-footer">
      <div class="footer-inner">
        <nav v-if="!isHome" class="footer-nav" aria-label="功能导航">
          <RouterLink to="/svg">图片转 SVG</RouterLink>
          <RouterLink to="/edit">调整画面</RouterLink>
          <RouterLink to="/export">转格式 / 压缩</RouterLink>
        </nav>
        <p>图片仅在浏览器本地处理，不上传服务器。</p>
      </div>
    </footer>
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
  display: flex;
  flex-direction: column;
}

.app-body {
  flex: 1;
}

.app-header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  color: inherit;
  text-decoration: none;
  font-size: 18px;
  font-weight: 600;
}

.brand img {
  display: block;
}

.nav {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  margin: 0;
  color: #606266;
  font-size: 14px;
  font-weight: 500;
}

.page-lead {
  max-width: 1280px;
  margin: 0 auto;
  padding: 16px 24px 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
}

.home-link {
  color: #409eff;
  font-size: 14px;
  text-decoration: none;
}

.home-link:hover {
  text-decoration: underline;
}

.app-footer {
  margin-top: auto;
  border-top: 1px solid #ebeef5;
  background: #fff;
  color: #909399;
  font-size: 13px;
}

.footer-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 16px 24px;
}

.footer-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
  margin-bottom: 8px;
}

.footer-nav a {
  color: #606266;
  text-decoration: none;
}

.footer-nav a:hover,
.footer-nav a.router-link-active {
  color: #409eff;
}

.app-footer p {
  margin: 0;
}

@media (max-width: 767px) {
  .app-header {
    padding: 0 16px;
  }

  .page-title {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .page-lead {
    padding: 12px 16px 0;
  }

  .footer-inner {
    padding: 16px;
  }
}
</style>
