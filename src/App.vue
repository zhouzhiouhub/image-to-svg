<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'

const route = useRoute()
const isHome = computed(() => route.name === 'home')
const pageTitle = computed(() => (typeof route.meta.title === 'string' ? route.meta.title : ''))
const favicon = `${import.meta.env.BASE_URL}favicon.svg`
</script>

<template>
  <div class="app">
    <header class="app-header">
      <RouterLink class="brand" to="/">
        <img :src="favicon" alt="" width="28" height="28" />
        <span>Kinolin Tool</span>
      </RouterLink>
      <nav v-if="!isHome" class="nav">
        <span class="page-title">{{ pageTitle }}</span>
        <RouterLink class="home-link" to="/">返回首页</RouterLink>
      </nav>
    </header>
    <RouterView :key="route.fullPath" />
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
  color: #606266;
  font-size: 14px;
}

.home-link {
  color: #409eff;
  font-size: 14px;
  text-decoration: none;
}

.home-link:hover {
  text-decoration: underline;
}

@media (max-width: 767px) {
  .app-header {
    padding: 0 16px;
  }

  .page-title {
    display: none;
  }
}
</style>
