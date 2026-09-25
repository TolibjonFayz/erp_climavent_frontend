import { createRouter, createWebHistory } from 'vue-router'

import CustomersView from '@/views/CustomersView.vue'
import CustomerDetailView from '@/views/CustomerDetailView.vue'
import SitesView from '@/views/SitesView.vue'
import SiteDetailView from '@/views/SiteDetailView.vue'
import CreateSiteView from '@/views/CreateSiteView.vue'
import AttendanceView from '@/views/AttendanceView.vue'
import TasksView from '@/views/TasksView.vue'
import CompetitorsView from '@/views/CompetitorsView.vue'
import SettingsView from '@/views/SettingsView.vue'
import AdminView from '@/views/AdminView.vue'
import BossView from '@/views/BossView.vue'
import LoginView from '@/views/LoginView.vue'

// Boss (director) user id — only this user may open /boss
const BOSS_USER_ID = 16

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'customers', component: CustomersView, meta: { requiresAuth: true, permissionKey: 'customers' } },
    {
      path: '/customers/:id',
      name: 'customer-detail',
      component: CustomerDetailView,
      meta: { requiresAuth: true, permissionKey: 'customers' },
    },
    { path: '/sites', name: 'sites', component: SitesView, meta: { requiresAuth: true, permissionKey: 'sites' } },
    {
      path: '/sites/create',
      name: 'site-create',
      component: CreateSiteView,
      meta: { requiresAuth: true, permissionKey: 'sites' },
    },
    {
      path: '/sites/:id',
      name: 'site-detail',
      component: SiteDetailView,
      meta: { requiresAuth: true, permissionKey: 'sites' },
    },
    {
      path: '/attendance',
      name: 'attendance',
      component: AttendanceView,
      meta: { requiresAuth: true, permissionKey: 'attendance' },
    },
    { path: '/tasks', name: 'tasks', component: TasksView, meta: { requiresAuth: true, permissionKey: 'tasks' } },
    {
      path: '/kp',
      name: 'kp',
      component: () => import('@/views/KPView.vue'),
      meta: { requiresAuth: true, permissionKey: 'kp' },
    },
    {
      path: '/dogovor',
      name: 'dogovor',
      component: () => import('@/views/DogovorView.vue'),
      meta: { requiresAuth: true, permissionKey: 'dogovor' },
    },
    {
      path: '/loyiha',
      name: 'loyiha',
      component: () => import('@/views/LoyihaView.vue'),
      meta: { requiresAuth: true, permissionKey: 'loyiha' },
    },
    {
      path: '/loyiha/:id',
      name: 'loyiha-detail',
      component: () => import('@/views/LoyihaDetailView.vue'),
      meta: { requiresAuth: true, permissionKey: 'loyiha' },
    },
    {
      path: '/competitors',
      name: 'competitors',
      component: CompetitorsView,
      meta: { requiresAuth: true, permissionKey: 'competitors' },
    },
    { path: '/settings', name: 'settings', component: SettingsView, meta: { requiresAuth: true } },
    { path: '/admin', name: 'admin', component: AdminView, meta: { requiresAuth: true, adminOnly: true } },
    {
      path: '/boss',
      name: 'boss',
      component: BossView,
      meta: { requiresAuth: true, permissionKey: 'boss' },
    },
    { path: '/login', name: 'login', component: LoginView },
  ],
})

import { useUsersStore } from '@/stores/user'

router.beforeEach(async (to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('refreshtoken')
  if (to.meta.requiresAuth && !isAuthenticated) {
    return next('/login')
  }

  if (to.meta.requiresAuth) {
    const usersStore = useUsersStore()
    // Ensure user info is loaded
    if (!usersStore.currentUser) {
      try {
        await usersStore.getUserInfo(Number(localStorage.getItem('userid')))
      } catch (e) {
        return next('/login')
      }
    }

    const user = usersStore.currentUser
    const perms = user?.permissions || {}

    // 1. Admin faqat (AdminOnly)
    if (to.meta.adminOnly && !user.is_admin) {
      return next('/settings')
    }

    // 2. Sahifa ruxsatlari (permissionKey)
    if (to.meta.permissionKey) {
      const key = to.meta.permissionKey
      let hasAccess = false
      if (key === 'boss') {
        hasAccess = perms.boss !== undefined ? perms.boss : Number(user.id) === BOSS_USER_ID
      } else {
        hasAccess = perms[key] !== false // undefined bo'lsa ruxsat beriladi (eski logikaga kora)
      }

      if (!hasAccess) {
        // Ruxsati yo'q pagega kirdi, ruxsati bor birinchi pagega redirect qilamiz
        const allowedPages = ['customers', 'sites', 'competitors', 'kp', 'dogovor', 'loyiha', 'attendance', 'tasks'].filter(k => perms[k] !== false)
        if (perms.boss || Number(user.id) === BOSS_USER_ID) allowedPages.push('boss')
        
        if (allowedPages.length > 0) {
           // Agar boshqa page bo'lsa shunga yuboramiz (faqat cheksiz sikl bo'lib qolmasligi uchun)
           const fallbackRoute = allowedPages[0] === 'customers' ? '/' : `/${allowedPages[0]}`
           if (to.path !== fallbackRoute) return next(fallbackRoute)
        }
        return next('/settings') // Hech qaysiga ruxsat yo'q bo'lsa settingsga
      }
    }
  }

  next()
})

export default router
