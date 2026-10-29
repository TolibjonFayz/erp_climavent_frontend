<script setup>
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'

const route = useRoute()
// Layout (sidebar) bo'limlar orasida o'tganda qayta yaratilmaydi — faqat o'ng tomon almashadi
const nav = computed(() => route.meta.nav)
</script>

<template>
  <AppLayout v-if="nav" :active="nav">
    <RouterView />
  </AppLayout>
  <RouterView v-else />
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>
