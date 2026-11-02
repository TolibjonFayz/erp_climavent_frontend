<template>
  <!-- Bosh sahifa tepasi: salomlashish, sana va bugungi ishlar (vazifalar, tasdiq so'rovlari) -->
  <section class="tb">
    <div class="tb-hello">
      <h2>{{ $t(greetingKey) }}, {{ firstName }}</h2>
      <span class="tb-date">{{ todayLabel(locale) }}</span>
    </div>
    <div v-if="canTasks" class="tb-chips">
      <button
        v-for="c in chips"
        :key="c.key"
        type="button"
        class="tb-chip"
        :class="`is-${c.tone}`"
        @click="router.push('/tasks')"
      >
        <span class="tb-chip__dot"></span>
        {{ $t(c.label) }}
        <b><UiCount :value="c.count" /></b>
      </button>
      <span v-if="!chips.length" class="tb-clear">{{ $t('tbAllClear') }}</span>
    </div>
  </section>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { todayLabel } from '@/components/admin/adminShared'
import { greetingKey as greetingFor, useTodayTasks } from '@/composables/useTodayTasks'
import UiCount from '@/components/ui/UiCount.vue'

const { locale } = useI18n()
const router = useRouter()
const { canTasks, chips, firstName } = useTodayTasks()
const greetingKey = greetingFor()
</script>

<style scoped>
.tb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 24px;
  padding: 18px 22px;
  border: 1px solid var(--ui-line);
  border-radius: var(--ui-radius);
  background:
    radial-gradient(120% 140% at 0% 0%, var(--ui-link-soft) 0%, transparent 55%),
    var(--ui-surface);
  box-shadow: var(--ui-shadow);
}
.tb-hello {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.tb-hello h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--ui-ink);
}
.tb-date {
  font-size: 13px;
  color: var(--ui-muted);
}
.tb-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tb-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  border: 1px solid var(--ui-line);
  border-radius: 999px;
  background: var(--ui-surface);
  color: var(--ui-ink-2);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
.tb-chip:hover {
  border-color: var(--ui-line-strong);
  background: var(--ui-surface-2);
}
.tb-chip b {
  color: var(--ui-ink);
  font-variant-numeric: tabular-nums;
}
.tb-chip__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--ui-muted);
}
.tb-chip.is-bad .tb-chip__dot { background: var(--ui-bad); }
.tb-chip.is-warn .tb-chip__dot { background: var(--ui-warn); }
.tb-chip.is-link .tb-chip__dot { background: var(--ui-link); }
.tb-chip.is-good .tb-chip__dot { background: var(--ui-good); }
.tb-chip.is-bad b { color: var(--ui-bad); }
.tb-clear {
  font-size: 13px;
  color: var(--ui-muted);
}
</style>
