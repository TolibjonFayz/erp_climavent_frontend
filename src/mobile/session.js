import { computed } from 'vue'
import { useUsersStore } from '@/stores/user'

// Direktor — /boss faqat shu foydalanuvchiga (saytdagi router bilan bir xil qoida)
export const BOSS_USER_ID = 16

export const currentUserId = () => Number(localStorage.getItem('userid')) || null
export const isLoggedIn = () => !!localStorage.getItem('refreshtoken')

export function clearSession() {
  localStorage.removeItem('accesstoken')
  localStorage.removeItem('refreshtoken')
  localStorage.removeItem('userid')
}

// Sahifaga ruxsat: saytdagidek — `permissions[key] === false` bo'lmasa ochiq
export function hasAccess(user, key) {
  if (!user) return false
  const perms = user.permissions || {}
  if (key === 'boss') {
    return perms.boss !== undefined ? !!perms.boss : Number(user.id) === BOSS_USER_ID
  }
  if (key === 'admin') return !!user.is_admin
  // amoCRM statistikasi backendda AdminOrBossGuard ortida
  if (key === 'amocrm') return !!user.is_admin || hasAccess(user, 'boss')
  return perms[key] !== false
}

export function useSession() {
  const usersStore = useUsersStore()
  const user = computed(() => usersStore.currentUser)
  const isAdmin = computed(() => !!user.value?.is_admin)
  const can = (key) => hasAccess(user.value, key)
  const fullName = computed(() =>
    user.value ? `${user.value.firstname || ''} ${user.value.lastname || ''}`.trim() : '',
  )
  return { user, isAdmin, can, fullName }
}

export async function ensureUser() {
  const usersStore = useUsersStore()
  if (!usersStore.currentUser) {
    await usersStore.getUserInfo(currentUserId())
  }
  return usersStore.currentUser
}
