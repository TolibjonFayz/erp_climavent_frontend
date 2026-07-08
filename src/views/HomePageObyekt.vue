<template>
  <div class="home-page-obyekt">
    <Sidebar :activePath="'obyekt'" />
    <Obyektlar />
  </div>
</template>

<script setup>
import Obyektlar from '@/components/Home/Obyektlar.vue'
import Sidebar from '@/components/Sidebar.vue'
import { useSidebar } from '@/composables/useSidebar'

const { sidebarWidth } = useSidebar()
</script>

<style lang="scss" scoped>
.home-page-obyekt {
  display: flex;
  height: 100vh;
  width: v-bind('`calc(100% - ${sidebarWidth}px)`');
  margin-left: v-bind('`${sidebarWidth}px`');
  transition:
    width 0.3s ease,
    margin-left 0.3s ease;
}
</style>
