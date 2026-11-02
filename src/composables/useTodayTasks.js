// Bugungi ishlar (sayt va mobil bosh sahifasi uchun): muddati o'tgan, bugun muddati, yangi,
// jarayonda vazifalar va tasdiq kutayotgan so'rovlar. Vazifalarni sidebar / ilova o'zi yuklaydi.
import { computed } from 'vue'
import { useUsersStore } from '@/stores/user'
import { useTasksStore } from '@/stores/tasks'

const DAY_MS = 24 * 60 * 60 * 1000

export function greetingKey(date = new Date()) {
  const h = date.getHours()
  if (h >= 5 && h < 12) return 'admGreetMorning'
  if (h >= 12 && h < 17) return 'admGreetDay'
  if (h >= 17 && h < 21) return 'admGreetEvening'
  return 'admGreetNight'
}

export function useTodayTasks() {
  const usersStore = useUsersStore()
  const tasksStore = useTasksStore()
  const user = computed(() => usersStore.currentUser || {})
  const canTasks = computed(() => user.value.permissions?.tasks !== false)

  const chips = computed(() => {
    const list = (user.value.is_admin ? tasksStore.allTasks : tasksStore.myTasks) || []
    const open = list.filter((t) => t.status !== 'done')
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const today = start.getTime()
    const due = (t) => (t.deadline ? new Date(t.deadline).getTime() : NaN)
    return [
      { key: 'overdue', tone: 'bad', label: 'tbOverdue', count: open.filter((t) => due(t) < today).length },
      { key: 'today', tone: 'warn', label: 'tbDueToday', count: open.filter((t) => due(t) >= today && due(t) < today + DAY_MS).length },
      { key: 'todo', tone: 'ink', label: 'tbNew', count: open.filter((t) => t.status === 'todo').length },
      { key: 'progress', tone: 'link', label: 'tbInProgress', count: open.filter((t) => t.status === 'in_progress').length },
      { key: 'approvals', tone: 'good', label: 'tbApprovals', count: (tasksStore.pendingApprovals || []).length },
    ].filter((c) => c.count > 0)
  })

  const firstName = computed(() => user.value.firstname || user.value.username || '')
  return { user, canTasks, chips, firstName }
}
