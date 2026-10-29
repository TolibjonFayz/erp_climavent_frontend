import { computed, ref } from 'vue'
import bossApi from '@/api/boss'
import { useTasksStore } from '@/stores/tasks'
import { useUsersStore } from '@/stores/user'

// Sidebar'dagi bildirishnoma qo'ng'irog'i: Boss e'lonlari, menga berilgan yangi vazifalar,
// tasdiq kutayotgan so'rovlar (tasdiqlovchi/admin uchun). Holat butun ilova uchun bitta.
const POLL_MS = 5 * 60 * 1000

const announcements = ref([])
const seenAt = ref(0)
let timer = null

const userId = () => Number(localStorage.getItem('userid'))
const seenKey = () => `notif:seen:${userId()}`
const ts = (d) => (d ? new Date(d).getTime() : 0)

function readSeen() {
  try {
    seenAt.value = Number(localStorage.getItem(seenKey())) || 0
  } catch {
    seenAt.value = 0
  }
}

export function useNotifications() {
  const tasksStore = useTasksStore()
  const usersStore = useUsersStore()

  const isAdmin = computed(() => !!usersStore.currentUser?.is_admin)
  const isApprover = computed(
    () => isAdmin.value || (tasksStore.approver && Number(tasksStore.approver.id) === userId()),
  )

  // Menga berilgan, hali boshlanmagan vazifalar (admin ham o'ziga berilganini ko'radi)
  const newTasks = computed(() => {
    const list = isAdmin.value ? tasksStore.allTasks : tasksStore.myTasks
    return list.filter((t) => t.status === 'todo' && Number(t.assigned_to) === userId())
  })

  const items = computed(() => {
    const list = [
      ...announcements.value.map((a) => ({
        key: `ann-${a.id}`,
        type: 'announcement',
        title: a.title,
        text: a.message,
        author: a.author ? `${a.author.firstname} ${a.author.lastname || ''}`.trim() : '',
        time: a.createdAt,
      })),
      ...newTasks.value.map((t) => ({
        key: `task-${t.id}`,
        type: 'task',
        title: t.title,
        text: t.description || '',
        time: t.createdAt,
        to: '/tasks',
      })),
    ]
    list.sort((a, b) => ts(b.time) - ts(a.time))
    return list.map((n) => ({ ...n, unread: ts(n.time) > seenAt.value }))
  })

  const pendingApprovals = computed(() =>
    isApprover.value ? tasksStore.pendingApprovals.length : 0,
  )
  const unreadCount = computed(
    () => items.value.filter((n) => n.unread).length + pendingApprovals.value,
  )

  async function refresh() {
    try {
      announcements.value = (await bossApi.getFeed()) || []
    } catch {
      // bildirishnoma ikkinchi darajali — xatoni jimgina o'tkazamiz
    }
    try {
      // Xodimning vazifalari kichik ro'yxat — yangi vazifa sahifa yangilanmasdan ko'rinsin
      if (!isAdmin.value && userId()) await tasksStore.getMyTasks(userId())
      if (!tasksStore.approver) await tasksStore.getApprover()
      if (isApprover.value) await tasksStore.getPendingApprovals()
    } catch {
      // tasdiqlovchi aniqlanmadi — so'rovlar bo'limi ko'rinmaydi
    }
  }

  function start() {
    readSeen()
    if (timer) return
    refresh()
    timer = setInterval(refresh, POLL_MS)
  }

  function markAllSeen() {
    seenAt.value = Date.now()
    try {
      localStorage.setItem(seenKey(), String(seenAt.value))
    } catch {
      // brauzer saqlashga ruxsat bermasa — faqat shu sessiyada o'qilgan bo'ladi
    }
  }

  return { items, unreadCount, pendingApprovals, start, refresh, markAllSeen }
}
