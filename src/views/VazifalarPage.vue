<template>
  <div class="vazifalar-page">
    <Sidebar :activePath="'tasks'" />
    <Vazifalar />
  </div>
</template>

<script setup>
import Vazifalar from '@/components/Vazifalar/Vazifalar.vue'
import Sidebar from '@/components/Sidebar.vue'
import { useSidebar } from '@/composables/useSidebar'

const { sidebarWidth } = useSidebar()
</script>

<style lang="scss" scoped>
.vazifalar-page {
  width: v-bind('`calc(100% - ${sidebarWidth}px)`');
  margin-left: v-bind('`${sidebarWidth}px`');
  transition:
    width 0.3s ease,
    margin-left 0.3s ease;
}
</style>
