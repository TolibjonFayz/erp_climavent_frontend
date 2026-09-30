<template>
  <!-- Filtrlar paneli: ichida UiField'lar; o'ng tomonda ixtiyoriy amallar -->
  <div class="ui-toolbar">
    <div class="ui-toolbar__fields">
      <slot />
    </div>
    <div v-if="$slots.actions" class="ui-toolbar__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.ui-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px 24px;
  flex-wrap: wrap;
  padding: 12px 16px;
  background: var(--ui-surface-2);
  border: 1px solid var(--ui-line);
  border-radius: var(--ui-radius);
}
.ui-toolbar__fields {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  align-items: flex-end;
  min-width: 0;
  flex: 1 1 auto;
}
.ui-toolbar__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

@media (max-width: 900px) {
  .ui-toolbar,
  .ui-toolbar__fields {
    flex-direction: column;
    align-items: stretch;
  }
  .ui-toolbar__fields > :deep(*) {
    width: 100%;
    max-width: 100%;
  }
}
</style>
