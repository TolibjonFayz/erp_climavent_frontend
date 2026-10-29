<template>
  <div class="app-layout">
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

// Umumiy qidiruv: Ctrl+K (Mac'da Cmd+K) yoki sidebar'dagi tugma
const searchOpen = ref(false)
provide('openGlobalSearch', () => (searchOpen.value = true))
const onKeydown = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    searchOpen.value = true
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.app-layout__content {
  min-height: 100vh;
  width: v-bind('`calc(100% - ${sidebarWidth}px)`');
  margin-left: v-bind('`${sidebarWidth}px`');
  transition:
    width 0.4s cubic-bezier(0.16, 1, 0.3, 1),
    margin-left 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  background: var(--bg-color); /* Match global background */
}
</style>
