<template>
  <UiPage :title="$t('raqibtext')" :subtitle="$t('compSubtitle')">
    <!-- Bo'lim hali ishlab chiqilmoqda -->
    <UiPanel>
      <div class="cp-soon">
        <span class="cp-soon__badge">{{ $t('comingSoon') }}</span>
        <el-icon class="cp-soon__icon" :size="44"><DataAnalysis /></el-icon>
        <h2>{{ $t('compSoonTitle') }}</h2>
        <p>
          {{ $t('yangiTajriba') }}<br />
          {{ $t('sahifamizTezOradaIshgaTushadi') }}
        </p>
      </div>
    </UiPanel>
  </UiPage>
</template>

<script setup>
import { DataAnalysis } from '@element-plus/icons-vue'
import UiPage from '@/components/ui/UiPage.vue'
import UiPanel from '@/components/ui/UiPanel.vue'
</script>

<style scoped>
.cp-soon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 56px 16px;
  text-align: center;
}
.cp-soon__badge {
  padding: 2px 10px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ui-link);
  background: var(--ui-link-soft);
  border-radius: 999px;
}
.cp-soon__icon {
  margin-top: 8px;
  color: var(--ui-faint);
}
.cp-soon h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--ui-ink);
}
.cp-soon p {
  margin: 0;
  max-width: 420px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--ui-muted);
}
</style>
