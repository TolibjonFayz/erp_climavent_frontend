import HomePageSozlamalar from '@/views/HomePageSozlamalar.vue'
import SingleObyektPage from '@/views/SingleObyektPage.vue'
import CreateObyektPage from '@/views/CreateObyektPage.vue'
import { createRouter, createWebHistory } from 'vue-router'
import HomePageDavomat from '@/views/HomePageDavomat.vue'
import HomePage from '@/views/HomePageObyekt.vue'
import LoginPage from '@/views/LoginPage.vue'
import TasksPage from '@/views/TasksPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
      meta: { requiresAuth: true },
    },
    {
      path: '/davomat',
      name: 'davomat',
      component: HomePageDavomat,
      meta: { requiresAuth: true },
    },
    {
      path: '/settings',
      name: 'settings',
      component: HomePageSozlamalar,
      meta: { requiresAuth: true },
    },
    {
      path: '/tasks',
      name: 'tasks',
      component: TasksPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
    },
    {
      path: '/create-obyekt',
      name: 'create-obyekt',
      component: CreateObyektPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/single-obyekt/:id',
      name: 'single-obyekt',
      component: SingleObyektPage,
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('refreshtoken')
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})

export default router
