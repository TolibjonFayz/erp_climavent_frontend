<script setup>
// Gorizontal aylantiriladigan ko'rsatkichlar qatori.
// items: [{ key, label, value, sub?, tone?: 'good'|'bad'|'warn', active?, onClick? }]
defineProps({
  items: { type: Array, required: true },
  grid: { type: Boolean, default: false },
})
</script>

<template>
  <div class="m-stats" :class="{ 'is-grid': grid }">
    <component
      :is="s.onClick ? 'button' : 'div'"
      v-for="s in items"
      :key="s.key"
      type="button"
      class="m-stat"
      :class="[s.tone && `is-${s.tone}`, { 'is-active': s.active, 'is-tappable': !!s.onClick }]"
      @click="s.onClick && s.onClick()"
    >
      <span class="m-stat__label">
        <i v-if="s.tone" class="m-stat__dot"></i>
        {{ s.label }}
      </span>
      <span class="m-stat__value m-num">{{ s.value }}</span>
      <span v-if="s.sub" class="m-stat__sub">{{ s.sub }}</span>
    </component>
  </div>
</template>

<style>
.m-stats {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 12px 12px 4px;
  scrollbar-width: none;
}

.m-stats::-webkit-scrollbar {
  display: none;
}

.m-stats.is-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  overflow: visible;
}

.m-stat {
  flex: 0 0 auto;
  min-width: 112px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  padding: 12px 14px;
  background: var(--m-surface);
  border: 1px solid var(--m-line);
  border-radius: 12px;
  text-align: left;
}

.m-stats.is-grid .m-stat {
  min-width: 0;
}

.m-stat.is-tappable:active {
  background: var(--m-surface-2);
}

.m-stat.is-active {
  border-color: var(--m-ink);
  box-shadow: inset 0 0 0 1px var(--m-ink);
}

.m-stat__label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--m-muted);
  line-height: 1.3;
}

.m-stat__dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: var(--m-faint);
}

.m-stat.is-good .m-stat__dot {
  background: var(--m-good);
}

.m-stat.is-bad .m-stat__dot {
  background: var(--m-bad);
}

.m-stat.is-warn .m-stat__dot {
  background: #d97706;
}

.m-stat__value {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--m-ink);
}

.m-stat.is-bad .m-stat__value {
  color: var(--m-bad);
}

.m-stat.is-good .m-stat__value {
  color: var(--m-good);
}

.m-stat__sub {
  font-size: 12px;
  color: var(--m-faint);
  line-height: 1.3;
}
</style>
