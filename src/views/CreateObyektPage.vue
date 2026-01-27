<template>
  <div class="main">
    <CreateObyekt class="container" />
  </div>
</template>

<script setup>
import CreateObyekt from '@/components/CreateObyect/CreateObyekt.vue'
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
.main {
  background: #f5f7fa;
  margin-left: v-bind('`${sidebarWidth}px`');
  width: v-bind('`calc(100% - ${sidebarWidth}px)`');
  transition: margin-left 0.3s ease, width 0.3s ease;

  @media (max-width: 768px) {
    margin-left: 80px;
    width: calc(100% - 80px);
  }
}
</style>
