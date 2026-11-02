<script setup>
import { computed } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'

const route = useRoute()
const router = useRouter()
// Layout (sidebar) bo'limlar orasida o'tganda qayta yaratilmaydi — faqat o'ng tomon almashadi
const nav = computed(() => route.meta.nav)

// Ketma-ket paydo bo'lish (motion.css → .is-stagger) faqat bo'limlar orasida o'tganda —
// sahifa yangilanganda kontent darhol joyida chiqadi
let firstPath = route.path
router.afterEach((to, from) => {
  if (from.matched.length && to.path !== from.path) firstPath = null
})
const staggerClass = (path) => (firstPath === path ? '' : 'is-stagger')
</script>

<template>
  <AppLayout v-if="nav" :active="nav">
    <!-- Bo'limlar orasida silliq o'tish (assets/motion.css → .page-*); query o'zgarishi qayta chizmaydi -->
    <RouterView v-slot="{ Component, route: current }">
      <Transition name="page" mode="out-in">
        <div :key="current.path" class="page-host" :class="staggerClass(current.path)"><component :is="Component" /></div>
      </Transition>
    </RouterView>
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
