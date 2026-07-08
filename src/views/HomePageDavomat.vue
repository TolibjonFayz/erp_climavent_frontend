<template>
  <div class="davomat-page">
    <Sidebar :activePath="'davomat'" />
    <Davomat />
  </div>
</template>

<script setup>
import Davomat from '@/components/Davomat/Davomat.vue'
import Sidebar from '@/components/Sidebar.vue'
import { useSidebar } from '@/composables/useSidebar'

const { sidebarWidth } = useSidebar()
</script>

<style lang="scss" scoped>
.davomat-page {
  width: v-bind('`calc(100% - ${sidebarWidth}px)`');
  margin-left: v-bind('`${sidebarWidth}px`');
  transition:
    width 0.3s ease,
    margin-left 0.3s ease;
}
</style>
