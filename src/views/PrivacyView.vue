<script setup lang="ts">
import { t } from '@/i18n'
</script>

<template>
  <main class="privacy">
    <h1>{{ t('privacy.title') }}</h1>
    <p>{{ t('privacy.lead') }}</p>
    <h2>{{ t('privacy.localTitle') }}</h2>
    <p>{{ t('privacy.localBody') }}</p>
    <h2>{{ t('privacy.historyTitle') }}</h2>
    <p>{{ t('privacy.historyBody') }}</p>
    <h2>{{ t('privacy.sourceTitle') }}</h2>
    <p>{{ t('privacy.sourceBody') }}</p>
  </main>
</template>

<style scoped>
.privacy {
  max-width: 720px;
  margin: 0 auto;
  padding: 40px 24px 32px;
}

h1 {
  margin: 0 0 12px;
  font-size: 24px;
  font-weight: 600;
}

h2 {
  margin: 28px 0 8px;
  font-size: 16px;
  font-weight: 600;
}

p {
  margin: 0;
  color: #606266;
  line-height: 1.7;
}

@media (max-width: 767px) {
  .privacy {
    padding: 24px 16px 16px;
  }

  h1 {
    font-size: 22px;
  }
}
</style>
