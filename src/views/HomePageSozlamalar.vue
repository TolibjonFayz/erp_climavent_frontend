<template>
  <div class="home-page-sozlamalar">
    <Sidebar :activePath="'settings'" />
    <Sozlamalar />
  </div>
</template>

<script setup>
import Sozlamalar from '@/components/Sozlamalar/Sozlamalar.vue'
import Sidebar from '@/components/Sidebar.vue'
import { useSidebar } from '@/composables/useSidebar'

const { sidebarWidth } = useSidebar()
</script>

<style lang="scss" scoped>
.home-page-sozlamalar {
  display: flex;
  height: 100vh;
  width: v-bind('`calc(100% - ${sidebarWidth}px)`');
  margin-left: v-bind('`${sidebarWidth}px`');
  transition:
    width 0.3s ease,
    margin-left 0.3s ease;
}
</style>
