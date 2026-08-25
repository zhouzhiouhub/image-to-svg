<script setup lang="ts">
import { t } from '@/i18n'

defineProps<{
  originalUrl?: string | null
  originalName?: string
  resultUrl?: string | null
  resultAlt?: string
  converting?: boolean
}>()
</script>

<template>
  <section class="compare">
    <div class="pane">
      <img v-if="originalUrl" :src="originalUrl" :alt="originalName ?? t('compare.originalAlt')" />
      <span v-else>{{ t('compare.original') }}</span>
    </div>
    <div class="pane">
      <template v-if="resultUrl">
        <img :src="resultUrl" :alt="resultAlt ?? t('compare.resultAlt')" :class="{ dim: converting }" />
        <span v-if="converting" class="busy">{{ t('compare.converting') }}</span>
      </template>
      <span v-else-if="converting">{{ t('compare.converting') }}</span>
      <span v-else>{{ t('compare.result') }}</span>
    </div>
  </section>
</template>

<style scoped>
.compare {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  min-height: 280px;
}

.pane {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  background-color: var(--app-bg);
  border: 1px dashed var(--app-dashed);
  border-radius: 8px;
  overflow: hidden;
  color: var(--app-faint);
}

.pane img {
  max-width: 100%;
  max-height: 420px;
  object-fit: contain;
}

.pane img.dim {
  opacity: 0.55;
}

.busy {
  position: absolute;
  right: 12px;
  bottom: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--app-overlay);
  font-size: 12px;
}

@media (max-width: 767px) {
  .compare {
    grid-template-columns: 1fr;
  }
}
</style>
