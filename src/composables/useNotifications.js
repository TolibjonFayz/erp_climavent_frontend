import { computed, ref } from 'vue'
import bossApi from '@/api/boss'
import otgruzkaApi from '@/api/otgruzka'
import { useTasksStore } from '@/stores/tasks'
import { useUsersStore } from '@/stores/user'

// Sidebar'dagi bildirishnoma qo'ng'irog'i: Boss e'lonlari, menga berilgan yangi vazifalar,
// tasdiq kutayotgan so'rovlar (tasdiqlovchi/admin), omborga yangi shartnomalar.
// Har bildirishnoma alohida o'qiladi (bosilganda); "Barchasini o'qilgan qilish" — hammasini.
// O'qilganlar shu brauzerda, foydalanuvchi bo'yicha saqlanadi. Holat butun ilova uchun bitta.
const POLL_MS = 5 * 60 * 1000
const MAX_READ_KEYS = 500

const announcements = ref([])
const skladChecks = ref([]) // [{ id, dogovor_number, client_name, manager_name, at }]
const seenAt = ref(0) // "Barchasini o'qilgan" bosilgan vaqt — undan oldingilar o'qilgan
const readKeys = ref(new Set()) // alohida bosib o'qilganlar
let timer = null

const userId = () => Number(localStorage.getItem('userid'))
const seenKey = () => `notif:seen:${userId()}`
const readKey = () => `notif:read:${userId()}`
const ts = (d) => (d ? new Date(d).getTime() : 0)

function loadState() {
  try {
    seenAt.value = Number(localStorage.getItem(seenKey())) || 0
    readKeys.value = new Set(JSON.parse(localStorage.getItem(readKey()) || '[]'))
  } catch {
    seenAt.value = 0
    readKeys.value = new Set()
  }
}

function saveState() {
  try {
    localStorage.setItem(seenKey(), String(seenAt.value))
    // Ro'yxat cheksiz o'smasin — eng oxirgilari qoladi
    localStorage.setItem(readKey(), JSON.stringify([...readKeys.value].slice(-MAX_READ_KEYS)))
  } catch {
    // brauzer saqlashga ruxsat bermasa — faqat shu sessiyada o'qilgan bo'ladi
  }
}

export function useNotifications() {
  const tasksStore = useTasksStore()
  const usersStore = useUsersStore()

  const isAdmin = computed(() => !!usersStore.currentUser?.is_admin)
  const isApprover = computed(
    () => isAdmin.value || (tasksStore.approver && Number(tasksStore.approver.id) === userId()),
  )
  // Ombor sahifasiga ruxsati bor xodimlar (admin ham) ko'radi
  const canSklad = computed(() => !!usersStore.currentUser && usersStore.currentUser.permissions?.sklad !== false)

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
      ...(isApprover.value ? tasksStore.pendingApprovals : []).map((t) => ({
        // So'rov qayta yuborilsa — yangi bildirishnoma (kalitda so'rov vaqti)
        key: `appr-${t.id}-${ts(t.approval_requested_at)}`,
        type: 'approval',
        title: t.title,
        text: t.approval_note || t.description || '',
        time: t.approval_requested_at || t.updatedAt || t.createdAt,
        to: '/tasks',
      })),
      ...(canSklad.value ? skladChecks.value : []).map((c) => ({
        key: `sklad-${c.id}-${ts(c.at)}`,
        type: 'sklad',
        title: `№ ${c.dogovor_number || '—'} · ${c.client_name || ''}`,
        text: c.manager_name || '',
        time: c.at,
        to: '/sklad?tab=checks',
      })),
    ]
    list.sort((a, b) => ts(b.time) - ts(a.time))
    return list.map((n) => ({ ...n, unread: ts(n.time) > seenAt.value && !readKeys.value.has(n.key) }))
  })

  const unreadCount = computed(() => items.value.filter((n) => n.unread).length)

  async function refresh() {
    try {
      announcements.value = (await bossApi.getFeed()) || []
    } catch {
      // bildirishnoma ikkinchi darajali — xatoni jimgina o'tkazamiz
    }
    try {
      if (canSklad.value) skladChecks.value = (await otgruzkaApi.skladChecksCount())?.items || []
    } catch {
      skladChecks.value = []
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
    loadState()
    if (timer) return
    refresh()
    timer = setInterval(refresh, POLL_MS)
  }

  /** Bitta bildirishnomani o'qilgan deb belgilash (bosilganda) */
  function markRead(key) {
    if (readKeys.value.has(key)) return
    const next = new Set(readKeys.value)
    next.delete(key) // oxiriga o'tkazish — kesishda yangilari qolsin
    next.add(key)
    readKeys.value = next
    saveState()
  }

  function markAllSeen() {
    // Kompyuter soati serverdan orqada bo'lsa ham ko'rinib turganlarning hammasi o'qilgan bo'lsin
    seenAt.value = Math.max(Date.now(), ...items.value.map((n) => ts(n.time)))
    readKeys.value = new Set() // vaqt bo'yicha hammasi o'qilgan — alohida ro'yxat kerak emas
    saveState()
  }

  return { items, unreadCount, start, refresh, markRead, markAllSeen }
}
