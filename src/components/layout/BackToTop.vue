<template>
  <!-- Uzun sahifalarda: pastga tushilganda o'ng pastki burchakda chiqadi, bosilsa tepaga silliq ko'tariladi -->
  <Transition name="btt">
    <button v-if="visible" type="button" class="btt" :title="$t('backToTop')" :aria-label="$t('backToTop')" @click="toTop">
      <el-icon><Top /></el-icon>
    </button>
  </Transition>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Top } from '@element-plus/icons-vue'

// Bir ekrandan ko'proq pastga tushilgandagina ko'rinadi
const visible = ref(false)
let frame = 0
const check = () => {
  frame = 0
  visible.value = window.scrollY > Math.max(400, window.innerHeight * 0.8)
}
const onScroll = () => {
  if (!frame) frame = requestAnimationFrame(check)
}
const toTop = () => {
  const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' })
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  check()
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  if (frame) cancelAnimationFrame(frame)
})
</script>

<style scoped>
.btt {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 1500; /* jadval sticky sarlavhalaridan yuqori, Element Plus dialog/drawer (2000+) dan past */
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--ui-line);
  background: var(--ui-surface);
  color: var(--ui-link);
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.18);
  transition:
    transform 0.15s ease,
    background 0.15s ease;
}
.btt:hover {
  transform: translateY(-2px);
  background: var(--ui-link-soft);
}
.btt:focus-visible {
  outline: 2px solid var(--ui-link);
  outline-offset: 2px;
}
.btt-enter-active,
.btt-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.btt-enter-from,
.btt-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
@media (max-width: 640px) {
  .btt {
    right: 16px;
    bottom: 16px;
  }
}
</style>
