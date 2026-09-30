<template>
  <!-- Ko'rsatkich kartasi: rangli nuqtali nom, katta qiymat, izoh. Bosiladigan bo'lishi mumkin -->
  <component
    :is="clickable ? 'button' : 'div'"
    :type="clickable ? 'button' : undefined"
    class="ui-stat"
    :class="[
      tone && `is-${tone}`,
      { 'is-link': clickable, 'is-sm': size === 'sm', 'is-money': money },
    ]"
  >
    <span class="ui-stat__label">
      <UiHint :label="label" :hint="hint" />
    </span>
    <span class="ui-stat__value"
      ><slot>{{ value }}</slot></span
    >
    <span class="ui-stat__sub">{{ sub || ' ' }}</span>
  </component>
</template>

<script setup>
import UiHint from './UiHint.vue'

defineProps({
  label: { type: String, required: true },
  hint: { type: String, default: '' },
  value: { type: [String, Number], default: '' },
  sub: { type: String, default: '' },
  // good | bad | warn — nomdagi nuqta rangi (bad'da qiymat ham qizil)
  tone: { type: String, default: '' },
  clickable: { type: Boolean, default: false },
  size: { type: String, default: 'md' },
  // Katta summalar — shrift kichrayadi va pastga tushadi (kesilmaydi)
  money: { type: Boolean, default: false },
})
</script>

<style scoped>
.ui-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 14px 16px;
  background: var(--ui-surface);
  border: 1px solid var(--ui-line);
  border-radius: var(--ui-radius);
  text-align: left;
  font: inherit;
  color: inherit;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}
.ui-stat.is-link {
  cursor: pointer;
}
.ui-stat.is-link:hover {
  border-color: #bfdbfe;
  box-shadow: var(--ui-shadow-hover);
}
.ui-stat.is-link:focus-visible {
  outline: 2px solid var(--ui-link);
  outline-offset: 2px;
}
.ui-stat__label {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  min-height: 32px;
  font-size: 12px;
  line-height: 16px;
  color: var(--ui-muted);
}
.ui-stat__label::before {
  content: '';
  width: 8px;
  height: 8px;
  margin-top: 4px;
  border-radius: 2px;
  background: #cbd5e1;
  flex-shrink: 0;
}
.ui-stat.is-good .ui-stat__label::before {
  background: var(--ui-good);
}
.ui-stat.is-bad .ui-stat__label::before {
  background: var(--ui-bad);
}
.ui-stat.is-warn .ui-stat__label::before {
  background: var(--ui-warn);
}
.ui-stat__value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--ui-ink);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ui-stat.is-bad .ui-stat__value {
  color: var(--ui-bad);
}
.ui-stat.is-sm .ui-stat__value {
  font-size: 20px;
}
.ui-stat.is-money .ui-stat__value {
  font-size: 17px;
  line-height: 1.35;
  white-space: normal;
}
.ui-stat__sub {
  min-height: 32px;
  font-size: 12px;
  line-height: 16px;
  color: var(--ui-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
