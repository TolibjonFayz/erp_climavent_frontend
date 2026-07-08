<template>
  <div class="raqiblar-page">
    <Sidebar :activePath="'raqiblar'" />
    <Raqiblar />
  </div>
</template>

<script setup>
import Raqiblar from '@/components/Raqiblar/Raqiblar.vue'
import Sidebar from '@/components/Sidebar.vue'
import { useSidebar } from '@/composables/useSidebar'

const { sidebarWidth } = useSidebar()
</script>

<style lang="scss" scoped>
.raqiblar-page {
  width: v-bind('`calc(100% - ${sidebarWidth}px)`');
  margin-left: v-bind('`${sidebarWidth}px`');
  transition:
    width 0.3s ease,
    margin-left 0.3s ease;
}
</style>
