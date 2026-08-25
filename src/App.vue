<script setup lang="ts">
import { computed, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import HistoryList from '@/components/HistoryList.vue'
import { GITHUB_URL, t, useI18n } from '@/i18n'
import { applyRouteSeo } from '@/seo'

const route = useRoute()
const { locale, setLocale } = useI18n()
const isHome = computed(() => route.name === 'home')
const showHeading = computed(() => route.name === 'svg' || route.name === 'edit' || route.name === 'export')
const pageKey = computed(() => (typeof route.name === 'string' ? route.name : 'notFound'))
const pageTitle = computed(() => (showHeading.value ? t(`seo.${pageKey.value}.title`) : ''))
const pageDescription = computed(() => (showHeading.value ? t(`seo.${pageKey.value}.description`) : ''))
const favicon = `${import.meta.env.BASE_URL}favicon.svg`

watch([locale, () => route.fullPath], () => {
  applyRouteSeo(route)
})
</script>

<template>
  <div class="app">
    <header class="app-header">
      <RouterLink class="brand" to="/">
        <img :src="favicon" alt="Kinolin Tool" width="28" height="28" />
        <span>Kinolin Tool</span>
      </RouterLink>
      <div class="header-end">
        <nav v-if="!isHome" class="nav">
          <h1 v-if="showHeading" class="page-title">{{ pageTitle }}</h1>
          <RouterLink class="home-link" to="/">{{ t('nav.home') }}</RouterLink>
        </nav>
        <div class="lang" role="group" :aria-label="t('lang.label')">
          <button type="button" :aria-pressed="locale === 'zh'" @click="setLocale('zh')">
            {{ t('lang.zh') }}
          </button>
          <button type="button" :aria-pressed="locale === 'en'" @click="setLocale('en')">
            {{ t('lang.en') }}
          </button>
        </div>
      </div>
    </header>
    <div class="app-body">
      <p v-if="pageDescription" class="page-lead">{{ pageDescription }}</p>
      <RouterView :key="route.fullPath" />
      <HistoryList />
    </div>
    <footer class="app-footer">
      <div class="footer-inner">
        <nav class="footer-nav" :aria-label="t('nav.tools')">
          <RouterLink to="/privacy">{{ t('footer.privacy') }}</RouterLink>
          <a :href="GITHUB_URL" target="_blank" rel="noopener noreferrer">{{ t('footer.github') }}</a>
        </nav>
        <p>{{ t('footer.note') }}</p>
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

html,
body,
#app {
  height: 100%;
}

body {
  margin: 0;
  overflow: hidden;
}

.app {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.app-header {
  flex-shrink: 0;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  z-index: 10;
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

.header-end {
  display: flex;
  align-items: center;
  gap: 16px;
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

.lang {
  display: flex;
  gap: 4px;
}

.lang button {
  margin: 0;
  padding: 4px 8px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: #909399;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.lang button[aria-pressed='true'] {
  background: #ecf5ff;
  color: #409eff;
}

.app-footer {
  flex-shrink: 0;
  border-top: 1px solid #ebeef5;
  background: #fff;
  color: #909399;
  font-size: 13px;
  z-index: 10;
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
