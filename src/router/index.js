import { createRouter, createWebHistory } from 'vue-router'


// Boss (director) user id — only this user may open /boss
const BOSS_USER_ID = 16

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'customers', component: () => import('@/views/CustomersView.vue'), meta: { requiresAuth: true, permissionKey: 'customers', nav: 'customers' } },
    {
      path: '/customers/:id',
      name: 'customer-detail',
      component: () => import('@/views/CustomerDetailView.vue'),
      meta: { requiresAuth: true, permissionKey: 'customers', nav: 'customers' },
    },
    { path: '/sites', name: 'sites', component: () => import('@/views/SitesView.vue'), meta: { requiresAuth: true, permissionKey: 'sites', nav: 'sites' } },
    {
      path: '/sites/create',
      name: 'site-create',
      component: () => import('@/views/CreateSiteView.vue'),
      meta: { requiresAuth: true, permissionKey: 'sites', nav: 'sites' },
    },
    {
      path: '/sites/:id',
      name: 'site-detail',
      component: () => import('@/views/SiteDetailView.vue'),
      meta: { requiresAuth: true, permissionKey: 'sites', nav: 'sites' },
    },
    {
      path: '/attendance',
      name: 'attendance',
      component: () => import('@/views/AttendanceView.vue'),
      meta: { requiresAuth: true, permissionKey: 'attendance', nav: 'attendance' },
    },
    { path: '/tasks', name: 'tasks', component: () => import('@/views/TasksView.vue'), meta: { requiresAuth: true, permissionKey: 'tasks', nav: 'tasks' } },
    {
      path: '/kp',
      name: 'kp',
      component: () => import('@/views/KPView.vue'),
      meta: { requiresAuth: true, permissionKey: 'kp', nav: 'kp' },
    },
    {
      path: '/dogovor',
      name: 'dogovor',
      component: () => import('@/views/DogovorView.vue'),
      meta: { requiresAuth: true, permissionKey: 'dogovor', nav: 'dogovor' },
    },
    {
      path: '/loyiha',
      name: 'loyiha',
      component: () => import('@/views/LoyihaView.vue'),
      meta: { requiresAuth: true, permissionKey: 'loyiha', nav: 'loyiha' },
    },
    {
      path: '/loyiha/:id',
      name: 'loyiha-detail',
      component: () => import('@/views/LoyihaDetailView.vue'),
      meta: { requiresAuth: true, permissionKey: 'loyiha', nav: 'loyiha' },
    },
    {
      path: '/sklad',
      name: 'sklad',
      component: () => import('@/views/SkladView.vue'),
      meta: { requiresAuth: true, permissionKey: 'sklad', nav: 'sklad' },
    },
    {
      path: '/competitors',
      name: 'competitors',
      component: () => import('@/views/CompetitorsView.vue'),
      meta: { requiresAuth: true, permissionKey: 'competitors', nav: 'competitors' },
    },
    { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue'), meta: { requiresAuth: true, nav: 'settings' } },
    { path: '/admin', name: 'admin', component: () => import('@/views/AdminView.vue'), meta: { requiresAuth: true, adminOnly: true } },
    {
      path: '/boss',
      name: 'boss',
      component: () => import('@/views/BossView.vue'),
      meta: { requiresAuth: true, permissionKey: 'boss', nav: 'boss' },
    },
    { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue') },
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
        const allowedPages = ['customers', 'sites', 'competitors', 'kp', 'dogovor', 'loyiha', 'sklad', 'attendance', 'tasks'].filter(k => perms[k] !== false)
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
