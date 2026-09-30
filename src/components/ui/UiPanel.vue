<template>
  <!-- Panel: sarlavhali oq karta (48px sarlavha qatori + mazmun) -->
  <section class="ui-panel" :class="{ 'ui-panel--flush': flush }">
    <header v-if="title || $slots.title || $slots.actions" class="ui-panel__head">
      <h3>
        <slot name="title">
          <el-icon v-if="icon" class="ui-panel__icon"><component :is="icon" /></el-icon>
          <UiHint :label="title" :hint="hint" />
        </slot>
      </h3>
      <div v-if="$slots.actions" class="ui-panel__actions">
        <slot name="actions" />
      </div>
    </header>
    <div class="ui-panel__body">
      <slot />
    </div>
  </section>
</template>

<script setup>
import UiHint from './UiHint.vue'

defineProps({
  title: { type: String, default: '' },
  hint: { type: String, default: '' },
  icon: { type: [Object, Function], default: null },
  // Jadval kabi mazmun chetigacha yopishsin (ichki bo'shliqsiz)
  flush: { type: Boolean, default: false },
})
</script>

<style scoped>
.ui-panel {
  background: var(--ui-surface);
  border: 1px solid var(--ui-line);
  border-radius: var(--ui-radius);
  min-width: 0;
}
.ui-panel__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  min-height: 48px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--ui-line-soft);
}
.ui-panel__head h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--ui-ink);
  display: flex;
  align-items: center;
  gap: 8px;
}
.ui-panel__icon {
  color: var(--ui-muted);
}
.ui-panel__actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--ui-muted);
}
.ui-panel__body {
  padding: 16px;
  min-width: 0;
}
.ui-panel--flush .ui-panel__body {
  padding: 0;
}
.ui-panel--flush :deep(.el-table) {
  border-radius: 0 0 var(--ui-radius) var(--ui-radius);
  box-shadow: none;
}
</style>
