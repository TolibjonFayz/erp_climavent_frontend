<template>
  <div class="app-layout" :class="{ 'is-ready': ready }">
    <TheSidebar :active-path="active" />
    <main class="app-layout__content">
      <slot />
    </main>
    <GlobalSearch v-model="searchOpen" />
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, provide, ref } from 'vue'
import { useSidebar } from '@/composables/useSidebar'
import TheSidebar from './TheSidebar.vue'
import GlobalSearch from './GlobalSearch.vue'

defineProps({
  active: { type: String, required: true },
})

const { sidebarWidth } = useSidebar()

// Sidebar kengligi (v-bind CSS o'zgaruvchisi) birinchi chizishdan keyin o'rnatiladi — animatsiya
// shu paytda yoqilgan bo'lsa, sahifa yangilanganda kontent chapdan surilib keladi. Shuning uchun
// animatsiya faqat birinchi kadrlardan keyin (sidebar yig'ilib-yoyilganda) ishlaydi.
const ready = ref(false)

// Umumiy qidiruv: Ctrl+K (Mac'da Cmd+K) yoki sidebar'dagi tugma
const searchOpen = ref(false)
provide('openGlobalSearch', () => (searchOpen.value = true))
const onKeydown = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    searchOpen.value = true
  }
}
onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  requestAnimationFrame(() => requestAnimationFrame(() => (ready.value = true)))
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.app-layout__content {
  min-height: 100vh;
  width: v-bind('`calc(100% - ${sidebarWidth}px)`');
  margin-left: v-bind('`${sidebarWidth}px`');
  background: var(--bg-color); /* Match global background */
}
.is-ready .app-layout__content {
  transition:
    width 0.4s cubic-bezier(0.16, 1, 0.3, 1),
    margin-left 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
