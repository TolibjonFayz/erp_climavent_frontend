<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTasksStore } from '@/stores/tasks'
import { TABS } from './router'
import { useSession } from './session'
import { tapFeedback } from './native'

const route = useRoute()
const router = useRouter()
const { user, can, isAdmin } = useSession()
const tasksStore = useTasksStore()

const tabs = computed(() => TABS.filter((t) => !t.key || can(t.key)))
const showTabbar = computed(() => !!route.meta.tab)

// Pastki menyudagi sahifalar keshda turadi (aylantirish holati va ma'lumot saqlanadi)
const cached = [
  'CustomersView',
  'SitesView',
  'TasksView',
  'AttendanceView',
  'MoreView',
  'AmoView',
  'BossView',
]

// Vazifalar belgisi: ochiq vazifalar soni (tasdiq kutayotganlar ham)
const taskBadge = computed(() => {
  const list = isAdmin.value ? tasksStore.allTasks : tasksStore.myTasks
  const open = (list || []).filter((t) => t.status !== 'done').length
  return open || ''
})

// Kirgandan keyin vazifalarni jimgina yuklaymiz — belgi darhol ko'rinsin
watch(
  () => user.value?.id,
  (id) => {
    if (!id || !can('tasks')) return
    const req = isAdmin.value ? tasksStore.getAllTasks() : tasksStore.getMyTasks(id)
    req.catch(() => {})
  },
  { immediate: true },
)

// O'tish yo'nalishi: oldinga — chapga suriladi, orqaga — o'ngga; tablar orasida animatsiya yo'q
const transition = ref('')
router.afterEach((to, from) => {
  if (!from.name || (to.meta.tab && from.meta.tab)) {
    transition.value = ''
    return
  }
  const pos = window.history.state?.position ?? 0
  const prev = router.__lastPos ?? 0
  transition.value = pos >= prev ? 'slide-left' : 'slide-right'
  router.__lastPos = pos
})

function onTabChange() {
  tapFeedback()
}
</script>

<template>
  <!-- Tab sahifalari nomi bo'yicha keshlanadi; ichki sahifalar har id uchun yangidan -->
  <router-view v-slot="{ Component, route: r }">
    <transition :name="transition">
      <keep-alive :include="cached">
        <component :is="Component" :key="r.meta.tab ? r.name : r.fullPath" />
      </keep-alive>
    </transition>
  </router-view>

  <van-tabbar
    v-show="showTabbar"
    route
    fixed
    safe-area-inset-bottom
    class="m-tabbar"
    @change="onTabChange"
  >
    <van-tabbar-item
      v-for="t in tabs"
      :key="t.name"
      :to="{ name: t.name }"
      :icon="t.icon"
      :badge="t.name === 'tasks' ? taskBadge : ''"
      replace
    >
      {{ $t(t.label) }}
    </van-tabbar-item>
  </van-tabbar>
</template>

<style>
.m-tabbar {
  border-top: 1px solid var(--m-line);
  padding-left: var(--sal);
  padding-right: var(--sar);
}

.m-tabbar.van-hairline--top-bottom::after {
  display: none;
}

.m-tabbar .van-tabbar-item__icon .van-badge {
  background: var(--m-bad);
}
</style>
