<template>
  <div class="raqiblar-page">
    <LeftMenuRaqiblar />
    <Raqiblar />
  </div>
</template>

<script setup>
import LeftMenuRaqiblar from '@/components/Raqiblar/LeftMenuRaqiblar.vue'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Raqiblar from '@/components/Raqiblar/Raqiblar.vue'

const isSidebarCollapsed = ref(false)

const sidebarWidth = computed(() => {
  return isSidebarCollapsed.value ? 80 : 260
})

const handleSidebarChange = () => {
  const saved = localStorage.getItem('sidebarCollapsed')
  isSidebarCollapsed.value = saved === 'true'
}

const handleResize = () => {
  if (window.innerWidth < 768) {
    isSidebarCollapsed.value = true
  }
}

onMounted(() => {
  handleSidebarChange()
  window.addEventListener('storage', handleSidebarChange)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('storage', handleSidebarChange)
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
.raqiblar-page {
  width: v-bind('`calc(100% - ${sidebarWidth}px)`');
  margin-left: v-bind('`${sidebarWidth}px`');
  transition:
    width 0.3s ease,
    margin-left 0.3s ease;

  @media (max-width: 768px) {
    width: calc(100% - 80px);
    margin-left: 80px;
  }
}
</style>
