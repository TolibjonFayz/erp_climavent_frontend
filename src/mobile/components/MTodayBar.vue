<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { todayLabel } from '@/components/admin/adminShared'
import { greetingKey as greetingFor, useTodayTasks } from '@/composables/useTodayTasks'

// Bosh sahifa tepasi: salomlashish, sana va bugungi ishlar (saytdagi TodayBar bilan bir xil hisob)
const { locale } = useI18n()
const router = useRouter()
const { canTasks, chips, firstName } = useTodayTasks()
const greetingKey = greetingFor()
</script>

<template>
  <section class="mtb">
    <h2>{{ $t(greetingKey) }}, {{ firstName }}</h2>
    <p class="mtb-date">{{ todayLabel(locale) }}</p>
    <div v-if="canTasks && chips.length" class="mtb-chips">
      <button
        v-for="c in chips"
        :key="c.key"
        type="button"
        class="mtb-chip"
        :class="`is-${c.tone}`"
        @click="router.push({ name: 'tasks' })"
      >
        <span class="mtb-dot"></span>{{ $t(c.label) }} <b>{{ c.count }}</b>
      </button>
    </div>
  </section>
</template>

<style scoped>
.mtb {
  margin: 12px 16px 0;
  padding: 14px 16px;
  border-radius: var(--m-radius);
  background:
    radial-gradient(120% 140% at 0% 0%, var(--m-primary-soft) 0%, transparent 60%),
    var(--m-surface);
  box-shadow: var(--m-shadow);
}
.mtb h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--m-ink);
}
.mtb-date {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--m-muted);
}
.mtb-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
.mtb-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border: 1px solid var(--m-line);
  border-radius: 999px;
  background: var(--m-surface);
  color: var(--m-ink);
  font: inherit;
  font-size: 13px;
}
.mtb-chip b {
  font-variant-numeric: tabular-nums;
}
.mtb-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--m-muted);
}
.mtb-chip.is-bad .mtb-dot { background: var(--m-bad); }
.mtb-chip.is-bad b { color: var(--m-bad); }
.mtb-chip.is-warn .mtb-dot { background: var(--m-warn); }
.mtb-chip.is-link .mtb-dot { background: var(--m-primary); }
.mtb-chip.is-good .mtb-dot { background: var(--m-good); }
</style>
