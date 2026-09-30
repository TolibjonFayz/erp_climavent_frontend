<template>
  <!-- Sahifa: sarlavha (nomi, izoh, holat) + o'ngda amallar, keyin mazmun -->
  <div class="ui-page" :class="{ 'ui-page--wide': wide }">
    <header v-if="title || $slots.actions || $slots.title" class="ui-page__head">
      <div class="ui-page__title">
        <slot name="title">
          <h1>
            {{ title }}
            <UiHint v-if="hint" :hint="hint" />
          </h1>
        </slot>
        <p v-if="subtitle || $slots.subtitle" class="ui-page__subtitle">
          <slot name="subtitle">{{ subtitle }}</slot>
        </p>
      </div>
      <div v-if="$slots.actions" class="ui-page__actions">
        <slot name="actions" />
      </div>
    </header>
    <div class="ui-page__body">
      <slot />
    </div>
  </div>
</template>

<script setup>
import UiHint from './UiHint.vue'

defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  hint: { type: String, default: '' },
  // Katta jadvalli sahifalar uchun kenglik cheklovisiz
  wide: { type: Boolean, default: false },
})
</script>

<style scoped>
.ui-page {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: var(--ui-page-pad);
  color: var(--ui-ink-2);
  box-sizing: border-box;
}
.ui-page--wide {
  max-width: none;
}
.ui-page__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px 16px;
  flex-wrap: wrap;
  padding-bottom: 16px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--ui-line);
}
.ui-page__title {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.ui-page__title h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.25;
  color: var(--ui-ink);
  display: flex;
  align-items: center;
  gap: 8px;
}
.ui-page__subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--ui-muted);
}
.ui-page__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.ui-page__body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

@media (max-width: 900px) {
  .ui-page {
    padding: 16px;
  }
  .ui-page__title h1 {
    font-size: 19px;
  }
}
</style>
