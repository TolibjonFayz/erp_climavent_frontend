<template>
  <!-- Nomlangan filtr maydoni: kichik UPPERCASE nom + boshqaruv elementi -->
  <div class="ui-field" :class="{ 'ui-field--grow': grow }">
    <span v-if="label" class="ui-field__label">
      <UiHint :label="label" :hint="hint" />
    </span>
    <span class="ui-field__control">
      <slot />
    </span>
  </div>
</template>

<script setup>
import UiHint from './UiHint.vue'

defineProps({
  label: { type: String, default: '' },
  hint: { type: String, default: '' },
  // Qidiruv kabi maydonlar bo'sh joyni egallasin
  grow: { type: Boolean, default: false },
})
</script>

<style scoped>
.ui-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.ui-field--grow {
  flex: 1 1 240px;
}
.ui-field__label {
  font-size: 11px;
  font-weight: 600;
  color: var(--ui-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.ui-field__control {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  min-width: 0;
}
.ui-field__control > :deep(*) {
  max-width: 100%;
}
</style>
