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
    { path: '/', name: 'customers', component: CustomersView, meta: { requiresAuth: true } },
    {
      path: '/customers/:id',
      name: 'customer-detail',
      component: CustomerDetailView,
      meta: { requiresAuth: true },
    },
    { path: '/sites', name: 'sites', component: SitesView, meta: { requiresAuth: true } },
    {
      path: '/sites/create',
      name: 'site-create',
      component: CreateSiteView,
      meta: { requiresAuth: true },
    },
    {
      path: '/sites/:id',
      name: 'site-detail',
      component: SiteDetailView,
      meta: { requiresAuth: true },
    },
    { path: '/attendance', name: 'attendance', component: AttendanceView, meta: { requiresAuth: true } },
    { path: '/tasks', name: 'tasks', component: TasksView, meta: { requiresAuth: true } },
    { path: '/competitors', name: 'competitors', component: CompetitorsView, meta: { requiresAuth: true } },
    { path: '/settings', name: 'settings', component: SettingsView, meta: { requiresAuth: true } },
    { path: '/admin', name: 'admin', component: AdminView, meta: { requiresAuth: true } },
    {
      path: '/boss',
      name: 'boss',
      component: BossView,
      meta: { requiresAuth: true, bossOnly: true },
    },
    { path: '/login', name: 'login', component: LoginView },
  ],
})

router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('refreshtoken')
  if (to.meta.requiresAuth && !isAuthenticated) {
    return next('/login')
  }
  if (to.meta.bossOnly && Number(localStorage.getItem('userid')) !== BOSS_USER_ID) {
    return next('/')
  }
  next()
})

export default router
