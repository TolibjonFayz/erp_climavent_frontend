<template>
  <!-- Foiz chizig'i: ingichka bar + raqam -->
  <div class="ot-bar" :class="`is-${tone}`">
    <span class="ot-bar__track"><span class="ot-bar__fill" :style="{ width: `${Math.min(100, pct)}%` }" /></span>
    <span class="ot-bar__num">{{ pct }}%</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: { type: Number, default: 0 },
  tone: { type: String, default: 'link' },
})
const pct = computed(() => Math.round((Number(props.value) || 0) * 100))
</script>

<style scoped>
.ot-bar {
  display: flex;
  align-items: center;
  gap: 6px;
}
.ot-bar__track {
  flex: 1;
  min-width: 24px;
  height: 6px;
  border-radius: 99px;
  background: var(--ui-surface-3, var(--ui-line-soft));
  overflow: hidden;
}
.ot-bar__fill {
  display: block;
  height: 100%;
  border-radius: 99px;
  background: var(--ui-link);
}
.is-good .ot-bar__fill {
  background: var(--ui-good);
}
.is-warn .ot-bar__fill {
  background: var(--ui-warn);
}
.is-bad .ot-bar__fill {
  background: var(--ui-bad);
}
.is-muted .ot-bar__fill {
  background: var(--ui-muted);
}
.ot-bar__num {
  min-width: 30px;
  text-align: right;
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--ui-ink-2);
}
</style>
