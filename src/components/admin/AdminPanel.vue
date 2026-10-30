<template>
  <div class="admin-wrap">
    <header class="adm-header">
      <div class="adm-header__left">
        <div class="adm-logo">
          <el-icon :size="20"><Grid /></el-icon>
        </div>
        <div>
          <h1 class="adm-title">{{ $t('admTitle') }}</h1>
          <p class="adm-sub">{{ $t('admSubtitle') }}</p>
        </div>
      </div>
      <div class="adm-header__right">
        <span class="adm-clock">
          {{ $t(greetingKey) }} · <b>{{ liveTime }}</b> · {{ todayLabel(locale) }}
        </span>
        <span class="adm-status"><span class="status-dot"></span>{{ $t('admSystemOk') }}</span>
      </div>
    </header>

    <div class="adm-body">
      <!-- SIDEBAR -->
      <aside class="adm-sidebar">
        <nav class="adm-nav">
          <button
            v-for="tab in TABS"
            :key="tab.name"
            type="button"
            class="adm-nav__item"
            :class="{ 'is-active': activeTab === tab.name }"
            @click="activeTab = tab.name"
          >
            <span class="adm-nav__icon"
              ><el-icon><component :is="tab.icon" /></el-icon
            ></span>
            <span class="adm-nav__lbl">{{ $t(tab.label) }}</span>
          </button>
        </nav>
        <div class="adm-sidebar__footer">
          <div class="adm-user">
            <div class="adm-user__av">
              <el-icon><UserFilled /></el-icon>
            </div>
            <div>
              <span class="adm-user__name">{{ $t('admRoleAdministrator') }}</span>
              <span class="adm-user__role">Super Admin</span>
            </div>
          </div>
          <button class="adm-exit" type="button" @click="router.push('/')">
            <el-icon><Back /></el-icon>
            <span>{{ $t('admBackToApp') }}</span>
          </button>
        </div>
      </aside>

      <!-- MAIN: har bir tab — alohida komponent (tabs/) -->
      <main v-loading="loading" class="adm-main">
        <template v-if="ready">
          <AdminDashboardTab v-if="activeTab === 'dashboard'" @go="(tab) => (activeTab = tab)" />
          <AdminUsersTab v-else-if="activeTab === 'users'" />
          <AdminPermissionsTab v-else-if="activeTab === 'permissions'" />
          <AdminPartnersTab v-else-if="activeTab === 'partners'" />
          <AdminObjectsTab v-else-if="activeTab === 'objects'" />
          <AdminKpTab v-else-if="activeTab === 'kp'" />
          <div v-else-if="activeTab === 'amocrm'" class="adm-page"><AmoCrmStats /></div>
          <AdminAuditTab v-else-if="activeTab === 'audit'" />
          <AdminSettingsTab v-else-if="activeTab === 'settings'" />
        </template>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import {
  Back,
  DataAnalysis,
  Document,
  Grid,
  Key,
  OfficeBuilding,
  Phone,
  Setting,
  User,
  UserFilled,
} from '@element-plus/icons-vue'
import { useUsersStore } from '@/stores/user'
import { usePartnersStore } from '@/stores/partners'
import { useComeAndGoInsideStore } from '@/stores/comeandgoInside'
import { useKPsStore } from '@/stores/kp'
import { errorText } from '@/utils/errorText'
import AdminDashboardTab from './tabs/AdminDashboardTab.vue'
import AdminUsersTab from './tabs/AdminUsersTab.vue'
import { todayLabel, useAdminAudit } from './adminShared'

// Kam ochiladigan tablar kerak bo'lganda yuklanadi
const AdminPermissionsTab = defineAsyncComponent(() => import('./tabs/AdminPermissionsTab.vue'))
const AdminPartnersTab = defineAsyncComponent(() => import('./tabs/AdminPartnersTab.vue'))
const AdminObjectsTab = defineAsyncComponent(() => import('./tabs/AdminObjectsTab.vue'))
const AdminKpTab = defineAsyncComponent(() => import('./tabs/AdminKpTab.vue'))
const AdminAuditTab = defineAsyncComponent(() => import('./tabs/AdminAuditTab.vue'))
const AdminSettingsTab = defineAsyncComponent(() => import('./tabs/AdminSettingsTab.vue'))
const AmoCrmStats = defineAsyncComponent(() => import('@/components/amocrm/AmoCrmStats.vue'))

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const usersStore = useUsersStore()
const partnersStore = usePartnersStore()
const comeandgoInsideStore = useComeAndGoInsideStore()
const kpStore = useKPsStore()
const { fetchLogs, fetchStats } = useAdminAudit()

const TABS = [
  { name: 'dashboard', label: 'admTabDashboard', icon: DataAnalysis },
  { name: 'users', label: 'admTabUsers', icon: User },
  { name: 'permissions', label: 'admTabPermissions', icon: Key },
  { name: 'partners', label: 'admTabPartners', icon: UserFilled },
  { name: 'objects', label: 'admTabObjects', icon: OfficeBuilding },
  { name: 'kp', label: 'admTabKp', icon: Document },
  { name: 'amocrm', label: 'admTabAmo', icon: Phone },
  { name: 'audit', label: 'admTabActivity', icon: Document },
  { name: 'settings', label: 'admTabSettings', icon: Setting },
]

// Faol tab URL'da (?tab=users): sahifa yangilansa yoki havola ulashilsa — o'sha tab ochiladi
const activeTab = ref('dashboard')
const tabFromUrl = String(route.query.tab || '')
if (TABS.some((tab) => tab.name === tabFromUrl)) activeTab.value = tabFromUrl
watch(activeTab, (tab) => {
  if (route.query.tab !== tab) router.replace({ query: { ...route.query, tab } })
})

const greetingKey = computed(() => {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'admGreetMorning'
  if (h >= 12 && h < 17) return 'admGreetDay'
  if (h >= 17 && h < 21) return 'admGreetEvening'
  return 'admGreetNight'
})

const liveTime = ref('')
let clock
const tick = () => {
  liveTime.value = new Date().toLocaleTimeString(locale.value === 'ru' ? 'ru-RU' : 'uz-UZ', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const loading = ref(false)
const ready = ref(false)
onMounted(async () => {
  tick()
  clock = setInterval(tick, 1000)
  loading.value = true
  try {
    await usersStore.getUserInfo(Number(localStorage.getItem('userid')))
    if (!usersStore.currentUser?.is_admin) {
      router.push('/')
      return
    }
  } catch (e) {
    ElMessage.error(errorText(e, t('admLoadUserError')))
    loading.value = false
    return
  }
  await Promise.allSettled([
    usersStore.getAllUsers(),
    partnersStore.getAllPartners(),
    comeandgoInsideStore.getAllComeAndGoInside(),
    kpStore.getAllKPs(),
  ])
  loading.value = false
  ready.value = true
  fetchLogs({ limit: 100 }).catch(console.error)
  fetchStats().catch(console.error)
})
onBeforeUnmount(() => clearInterval(clock))
</script>

<style lang="scss" src="./admin.scss"></style>
