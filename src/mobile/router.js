import { createRouter, createWebHashHistory } from 'vue-router'
import { ensureUser, hasAccess, isLoggedIn } from './session'

// Pastki menyudagi bo'limlar (tartib bilan). Ruxsati yo'qlari yashiriladi.
export const TABS = [
  { name: 'customers', key: 'customers', icon: 'friends-o', label: 'm.tabCustomers' },
  { name: 'sites', key: 'sites', icon: 'location-o', label: 'm.tabSites' },
  { name: 'tasks', key: 'tasks', icon: 'todo-list-o', label: 'm.tabTasks' },
  { name: 'attendance', key: 'attendance', icon: 'calendar-o', label: 'm.tabAttendance' },
  { name: 'more', key: null, icon: 'apps-o', label: 'm.tabMore' },
]

const tab = (key) => ({ tab: true, requiresAuth: true, permissionKey: key })
const page = (key) => ({ requiresAuth: true, permissionKey: key })

const routes = [
  // Bosh sahifa — guard ruxsati bor birinchi bo'limga yo'naltiradi
  { path: '/', name: 'home', component: { render: () => null }, meta: { requiresAuth: true } },
  { path: '/login', name: 'login', component: () => import('./views/LoginView.vue') },
  { path: '/offline', name: 'offline', component: () => import('./views/OfflineView.vue') },

  {
    path: '/customers',
    name: 'customers',
    component: () => import('./views/customers/CustomersView.vue'),
    meta: tab('customers'),
  },
  {
    path: '/customers/new',
    name: 'customer-new',
    component: () => import('./views/customers/CustomerFormView.vue'),
    meta: page('customers'),
  },
  {
    path: '/customers/:id',
    name: 'customer-detail',
    component: () => import('./views/customers/CustomerDetailView.vue'),
    meta: page('customers'),
  },

  {
    path: '/sites',
    name: 'sites',
    component: () => import('./views/sites/SitesView.vue'),
    meta: tab('sites'),
  },
  {
    path: '/sites/new',
    name: 'site-new',
    component: () => import('./views/sites/SiteFormView.vue'),
    meta: page('sites'),
  },
  {
    path: '/sites/:id',
    name: 'site-detail',
    component: () => import('./views/sites/SiteDetailView.vue'),
    meta: page('sites'),
  },

  {
    path: '/tasks',
    name: 'tasks',
    component: () => import('./views/tasks/TasksView.vue'),
    meta: tab('tasks'),
  },
  {
    path: '/attendance',
    name: 'attendance',
    component: () => import('./views/attendance/AttendanceView.vue'),
    meta: tab('attendance'),
  },

  {
    path: '/more',
    name: 'more',
    component: () => import('./views/more/MoreView.vue'),
    meta: { tab: true, requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('./views/more/ProfileView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/boss',
    name: 'boss',
    component: () => import('./views/boss/BossView.vue'),
    meta: page('boss'),
  },
  {
    path: '/amocrm',
    name: 'amocrm',
    component: () => import('./views/amocrm/AmoView.vue'),
    meta: page('amocrm'),
  },
  {
    path: '/amocrm/list',
    name: 'amocrm-list',
    component: () => import('./views/amocrm/AmoListView.vue'),
    meta: page('amocrm'),
  },

  {
    path: '/kp',
    name: 'kp',
    component: () => import('./views/kp/KpView.vue'),
    meta: page('kp'),
  },
  {
    path: '/kp/new',
    name: 'kp-new',
    component: () => import('./views/kp/KpFormView.vue'),
    meta: page('kp'),
  },
  {
    path: '/kp/:id/edit',
    name: 'kp-edit',
    component: () => import('./views/kp/KpFormView.vue'),
    meta: page('kp'),
  },
  {
    path: '/dogovor',
    name: 'dogovor',
    component: () => import('./views/dogovor/DogovorView.vue'),
    meta: page('dogovor'),
  },
  {
    path: '/dogovor/new',
    name: 'dogovor-new',
    component: () => import('./views/dogovor/DogovorFormView.vue'),
    meta: page('dogovor'),
  },
  {
    path: '/dogovor/:id',
    name: 'dogovor-detail',
    component: () => import('./views/dogovor/DogovorDetailView.vue'),
    meta: page('dogovor'),
  },
  {
    path: '/dogovor/:id/edit',
    name: 'dogovor-edit',
    component: () => import('./views/dogovor/DogovorFormView.vue'),
    meta: page('dogovor'),
  },
  {
    path: '/loyiha',
    name: 'loyiha',
    component: () => import('./views/loyiha/LoyihaView.vue'),
    meta: page('loyiha'),
  },
  {
    path: '/loyiha/new',
    name: 'loyiha-new',
    component: () => import('./views/loyiha/LoyihaFormView.vue'),
    meta: page('loyiha'),
  },
  {
    path: '/loyiha/:id',
    name: 'loyiha-detail',
    component: () => import('./views/loyiha/LoyihaDetailView.vue'),
    meta: page('loyiha'),
  },
  {
    path: '/loyiha/:id/edit',
    name: 'loyiha-edit',
    component: () => import('./views/loyiha/LoyihaFormView.vue'),
    meta: page('loyiha'),
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('./views/admin/AdminView.vue'),
    meta: page('admin'),
  },

  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

let cachedUser = null

export function firstAllowedTab() {
  if (!isLoggedIn()) return '/login'
  const first = TABS.find((t) => !t.key || hasAccess(cachedUser, t.key))
  return { name: first?.name || 'more' }
}

router.beforeEach(async (to) => {
  if (to.name === 'login') {
    return isLoggedIn() ? { name: 'home' } : true
  }
  if (!to.meta.requiresAuth) return true
  if (!isLoggedIn()) return { name: 'login' }

  try {
    cachedUser = await ensureUser()
  } catch {
    // 401 bo'lsa api/client sessiyani tozalagan — login; aks holda tarmoq xatosi
    if (!isLoggedIn()) return { name: 'login' }
    return { name: 'offline', query: { to: to.fullPath } }
  }

  if (to.name === 'home') return firstAllowedTab()

  const key = to.meta.permissionKey
  if (key && !hasAccess(cachedUser, key)) {
    const fallback = firstAllowedTab()
    return fallback.name === to.name ? { name: 'more' } : fallback
  }
  return true
})

export default router
