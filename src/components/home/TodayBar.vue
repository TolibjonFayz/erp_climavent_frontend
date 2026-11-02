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
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUsersStore } from '@/stores/user'
import { useTasksStore } from '@/stores/tasks'
import { todayLabel } from '@/components/admin/adminShared'
import UiCount from '@/components/ui/UiCount.vue'

const { locale } = useI18n()
const router = useRouter()
const usersStore = useUsersStore()
const tasksStore = useTasksStore()

const user = computed(() => usersStore.currentUser || {})
const firstName = computed(() => user.value.firstname || user.value.username || '')
const greetingKey = computed(() => {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'admGreetMorning'
  if (h >= 12 && h < 17) return 'admGreetDay'
  if (h >= 17 && h < 21) return 'admGreetEvening'
  return 'admGreetNight'
})

const canTasks = computed(() => user.value.permissions?.tasks !== false)

// Vazifalar ro'yxatini sidebar yuklaydi (admin — hammasi, xodim — o'zinikilar)
const startOfToday = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}
const chips = computed(() => {
  const list = (user.value.is_admin ? tasksStore.allTasks : tasksStore.myTasks) || []
  const open = list.filter((t) => t.status !== 'done')
  const today = startOfToday()
  const dayMs = 24 * 60 * 60 * 1000
  const due = (t) => (t.deadline ? new Date(t.deadline).getTime() : NaN)
  const all = [
    { key: 'overdue', tone: 'bad', label: 'tbOverdue', count: open.filter((t) => due(t) < today).length },
    { key: 'today', tone: 'warn', label: 'tbDueToday', count: open.filter((t) => due(t) >= today && due(t) < today + dayMs).length },
    { key: 'todo', tone: 'ink', label: 'tbNew', count: open.filter((t) => t.status === 'todo').length },
    { key: 'progress', tone: 'link', label: 'tbInProgress', count: open.filter((t) => t.status === 'in_progress').length },
    { key: 'approvals', tone: 'good', label: 'tbApprovals', count: (tasksStore.pendingApprovals || []).length },
  ]
  return all.filter((c) => c.count > 0)
})
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
