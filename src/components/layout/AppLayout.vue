<template>
  <div class="app-layout">
    <TheSidebar :active-path="active" />
    <main class="app-layout__content">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { useSidebar } from '@/composables/useSidebar'
import TheSidebar from './TheSidebar.vue'

defineProps({
  active: { type: String, required: true },
})

const { sidebarWidth } = useSidebar()
</script>

<style scoped>
.app-layout__content {
  min-height: 100vh;
  width: v-bind('`calc(100% - ${sidebarWidth}px)`');
  margin-left: v-bind('`${sidebarWidth}px`');
  transition:
    width 0.3s ease,
    margin-left 0.3s ease;
}
</style>
