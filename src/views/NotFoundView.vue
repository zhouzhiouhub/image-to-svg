<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { t } from '@/i18n'
</script>

<template>
  <main class="not-found">
    <p class="code">404</p>
    <h1>{{ t('notFound.title') }}</h1>
    <p>{{ t('notFound.body') }}</p>
    <nav class="links" :aria-label="t('nav.tools')">
      <RouterLink to="/">{{ t('notFound.home') }}</RouterLink>
      <RouterLink to="/svg">{{ t('tools.svg.title') }}</RouterLink>
      <RouterLink to="/edit">{{ t('tools.edit.title') }}</RouterLink>
      <RouterLink to="/export">{{ t('tools.export.title') }}</RouterLink>
    </nav>
  </main>
</template>

<style scoped>
.not-found {
  max-width: 640px;
  margin: 0 auto;
  padding: 64px 24px;
}

.code {
  margin: 0 0 8px;
  color: var(--app-code);
  font-size: 13px;
  letter-spacing: 0.08em;
}

h1 {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 600;
}

p {
  margin: 0;
  color: var(--app-muted);
  line-height: 1.6;
}

.links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
  margin-top: 20px;
}

.links a {
  color: var(--app-link);
  text-decoration: none;
}

.links a:hover {
  text-decoration: underline;
}

@media (max-width: 767px) {
  .not-found {
    padding: 32px 16px;
  }
}
</style>
