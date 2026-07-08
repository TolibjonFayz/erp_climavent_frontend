import { ref, computed, onMounted, onUnmounted } from 'vue'

// Sidebar o'lchamlari (px)
export const EXPANDED_WIDTH = 280
export const COLLAPSED_WIDTH = 82
const MOBILE_BREAKPOINT = 768

// --- Singleton reactive holat ---
// Modul darajasidagi ref'lar barcha komponentlar orasida bitta manbaa bo'lib xizmat qiladi,
// shuning uchun sidebar toggle qilinganda sahifalar darhol reaktiv yangilanadi
// (eski `storage` event hack faqat boshqa tab'da ishlar edi va shundan bo'sh joy qolar edi).
const isCollapsed = ref(localStorage.getItem('sidebarCollapsed') === 'true')
const isMobile = ref(typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT)
const isMobileOpen = ref(false)

let refCount = 0

function handleResize() {
  const mobile = window.innerWidth < MOBILE_BREAKPOINT
  isMobile.value = mobile
  // desktopga qaytganda mobil drawer overlay'ni yopamiz
  if (!mobile) isMobileOpen.value = false
}

export function useSidebar() {
  // Sahifa kontenti uchun surilish kengligi.
  // Mobilda sidebar overlay bo'lgani uchun kontent to'liq kenglikda (0) qoladi.
  const sidebarWidth = computed(() => {
    if (isMobile.value) return 0
    return isCollapsed.value ? COLLAPSED_WIDTH : EXPANDED_WIDTH
  })

  function toggleCollapsed() {
    if (isMobile.value) {
      isMobileOpen.value = !isMobileOpen.value
      return
    }
    isCollapsed.value = !isCollapsed.value
    localStorage.setItem('sidebarCollapsed', String(isCollapsed.value))
  }

  function openMobile() {
    isMobileOpen.value = true
  }

  function closeMobile() {
    isMobileOpen.value = false
  }

  onMounted(() => {
    if (refCount === 0) window.addEventListener('resize', handleResize)
    refCount++
    handleResize()
  })

  onUnmounted(() => {
    refCount--
    if (refCount <= 0) {
      refCount = 0
      window.removeEventListener('resize', handleResize)
    }
  })

  return {
    isCollapsed,
    isMobile,
    isMobileOpen,
    sidebarWidth,
    toggleCollapsed,
    openMobile,
    closeMobile,
  }
}
