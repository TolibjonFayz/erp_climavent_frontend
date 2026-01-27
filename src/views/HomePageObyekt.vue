<template>
  <div class="home-page-obyekt">
    <LeftMenuObyekt />
    <Obyektlar />
  </div>
</template>

<script setup>
import LeftMenuObyekt from '@/components/Home/LeftMenuObyekt.vue'
import Obyektlar from '@/components/Home/Obyektlar.vue'
import { ref, computed, onMounted, onUnmounted } from 'vue'

const isSidebarCollapsed = ref(false)

const sidebarWidth = computed(() => {
  return isSidebarCollapsed.value ? 80 : 310
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
.home-page-obyekt {
  display: flex;
  height: 100vh;
  width: v-bind('`calc(100% - ${sidebarWidth}px)`');
  margin-left: v-bind('`${sidebarWidth}px`');
  transition: width 0.3s ease, margin-left 0.3s ease;

  @media (max-width: 768px) {
    width: calc(100% - 80px);
    margin-left: 80px;
  }
}
</style>
