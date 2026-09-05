<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { homeTools } from '@/data/tools'
import { t } from '@/i18n'
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
            <h2>{{ t(`tools.${tool.id}.title`) }}</h2>
            <span class="status" :data-status="tool.status">{{ t('tools.available') }}</span>
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
  padding: 40px 0 24px;
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
  color: var(--app-muted);
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
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 1100px) {
  .grid {
    grid-template-columns: 1fr 1fr 1fr 1fr;
  }
}

.card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  color: inherit;
  text-decoration: none;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.card:hover {
  border-color: var(--app-hover);
  box-shadow: var(--app-shadow);
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
}

.status {
  flex-shrink: 0;
  padding: 0 7px;
  border: 1px solid var(--app-tag-ok-border);
  border-radius: 4px;
  background: var(--app-tag-ok-bg);
  color: var(--app-tag-ok-text);
  font-size: 12px;
  line-height: 20px;
}

.status[data-status='soon'] {
  border-color: var(--app-tag-warn-border);
  background: var(--app-tag-warn-bg);
  color: var(--app-tag-warn-text);
}

.status[data-status='planned'] {
  border-color: var(--app-tag-info-border);
  background: var(--app-tag-info-bg);
  color: var(--app-tag-info-text);
}

.card p {
  margin: 0;
  flex: 1;
  color: var(--app-muted);
  font-size: 14px;
  line-height: 1.6;
}

.action {
  font-size: 13px;
  color: var(--app-link);
}

@media (max-width: 767px) {
  .home {
    padding: 24px 0 16px;
  }

  .hero h1 {
    font-size: 22px;
  }
}
</style>
