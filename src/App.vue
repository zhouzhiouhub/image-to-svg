<script setup lang="ts">
import { computed, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import HistoryList from '@/components/HistoryList.vue'
import { GITHUB_URL, t, useI18n } from '@/i18n'
import { applyRouteSeo } from '@/seo'
import { useTheme } from '@/theme'

const route = useRoute()
const { locale, setLocale } = useI18n()
const { theme, setTheme } = useTheme()
const isHome = computed(() => route.name === 'home')
const showHeading = computed(() => route.name === 'svg' || route.name === 'edit' || route.name === 'export')
const pageKey = computed(() => (typeof route.name === 'string' ? route.name : 'notFound'))
const pageTitle = computed(() => (showHeading.value ? t(`seo.${pageKey.value}.title`) : ''))
const pageDescription = computed(() => (showHeading.value ? t(`seo.${pageKey.value}.description`) : ''))
const favicon = `${import.meta.env.BASE_URL}favicon.svg`
const langToggleLabel = computed(() =>
  t('lang.toggle', { name: locale.value === 'zh' ? t('lang.en') : t('lang.zh') }),
)
const themeToggleLabel = computed(() =>
  t('theme.toggle', { name: theme.value === 'light' ? t('theme.dark') : t('theme.light') }),
)

function toggleLocale() {
  setLocale(locale.value === 'zh' ? 'en' : 'zh')
}

function toggleTheme() {
  setTheme(theme.value === 'light' ? 'dark' : 'light')
}

watch([locale, () => route.fullPath], () => {
  applyRouteSeo(route)
})
</script>

<template>
  <div class="app" :class="theme">
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
        <div class="chrome-btns">
          <button
            type="button"
            class="icon-btn"
            :aria-label="langToggleLabel"
            :title="langToggleLabel"
            @click="toggleLocale"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
              />
            </svg>
          </button>
          <button
            type="button"
            class="icon-btn"
            :aria-label="themeToggleLabel"
            :title="themeToggleLabel"
            @click="toggleTheme"
          >
            <svg v-if="theme === 'light'" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
              />
            </svg>
            <svg v-else viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
              />
            </svg>
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
      </div>
    </footer>
  </div>
</template>

<style>
:root {
  font-family: system-ui, sans-serif;
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
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 16px;
  padding: 8px 24px;
  background-color: var(--app-surface);
  border-bottom: 1px solid var(--app-border);
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
  color: var(--app-muted);
  font-size: 14px;
  font-weight: 500;
}

.page-lead {
  max-width: 1280px;
  margin: 0 auto;
  padding: 16px 24px 0;
  color: var(--app-muted);
  font-size: 14px;
  line-height: 1.6;
}

.home-link {
  color: var(--app-link);
  font-size: 14px;
  text-decoration: none;
}

.home-link:hover {
  text-decoration: underline;
}

.chrome-btns {
  display: flex;
  align-items: center;
  gap: 2px;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--app-faint);
  cursor: pointer;
}

.icon-btn svg {
  display: block;
  width: 18px;
  height: 18px;
}

.icon-btn:hover {
  color: var(--app-text);
  background: var(--app-accent-soft);
}

.icon-btn:focus-visible {
  outline: 2px solid var(--app-accent);
  outline-offset: 2px;
}

.app-footer {
  flex-shrink: 0;
  border-top: 1px solid var(--app-border);
  background-color: var(--app-surface);
  color: var(--app-muted);
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
}

.footer-nav a {
  color: var(--app-muted);
  text-decoration: none;
}

.footer-nav a:hover,
.footer-nav a.router-link-active {
  color: var(--app-link);
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
