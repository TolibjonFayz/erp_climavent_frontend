<script setup>
import { ref, useSlots } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  // Orqaga tugmasi; tarix bo'lmasa shu marshrutga qaytadi
  back: { type: [Boolean, String, Object], default: false },
  // Katta sarlavha (pastki menyu sahifalari)
  large: { type: Boolean, default: false },
  // Tortib yangilash
  onRefresh: { type: Function, default: null },
  // Sahifa tagida pastki menyu bor (joy qoldiriladi)
  tabbar: { type: Boolean, default: false },
  bodyClass: { type: String, default: '' },
})

const router = useRouter()
const route = useRoute()
const slots = useSlots()
const body = ref(null)
const refreshing = ref(false)

function goBack() {
  if (window.history.state?.back) {
    router.back()
    return
  }
  const fallback = typeof props.back === 'boolean' ? { name: 'home' } : props.back
  router.replace(fallback)
}

async function doRefresh() {
  try {
    await props.onRefresh()
  } finally {
    refreshing.value = false
  }
}

function scrollTop() {
  body.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

defineExpose({ body, scrollTop, route })
</script>

<template>
  <div class="m-page" :class="{ 'has-tabbar': tabbar }">
    <header class="m-head" :class="{ 'is-large': large }">
      <div class="m-head__bar">
        <button v-if="back" class="m-head__btn is-back" type="button" @click="goBack">
          <van-icon name="arrow-left" />
        </button>
        <div class="m-head__titles" @click="scrollTop">
          <h1 class="m-head__title">
            <slot name="title">{{ title }}</slot>
          </h1>
          <p v-if="subtitle" class="m-head__subtitle">{{ subtitle }}</p>
        </div>
        <div v-if="slots.right" class="m-head__right">
          <slot name="right" />
        </div>
      </div>
      <slot name="header" />
    </header>

    <main ref="body" class="m-page__body" :class="bodyClass">
      <van-pull-refresh
        v-if="onRefresh"
        v-model="refreshing"
        class="m-page__refresh"
        @refresh="doRefresh"
      >
        <slot />
      </van-pull-refresh>
      <slot v-else />
    </main>

    <slot name="footer" />
  </div>
</template>

<style>
.m-page {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--m-bg);
  overflow: hidden;
}

.m-head {
  flex: 0 0 auto;
  background: var(--m-surface);
  padding-top: var(--sat);
  padding-left: var(--sal);
  padding-right: var(--sar);
  border-bottom: 1px solid var(--m-line);
  position: relative;
  z-index: 5;
}

.m-head__bar {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 52px;
  padding: 0 8px 0 16px;
}

.m-head__btn {
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  border: 0;
  background: none;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 20px;
  color: var(--m-ink);
}

.m-head__btn:active {
  background: var(--m-line-soft);
}

.m-head__btn.is-back {
  margin-left: -10px;
}

.m-head__titles {
  flex: 1;
  min-width: 0;
}

.m-head__title {
  font-size: 17px;
  font-weight: 600;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.m-head__subtitle {
  font-size: 12px;
  color: var(--m-muted);
  margin-top: 1px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.m-head.is-large .m-head__bar {
  min-height: 56px;
}

.m-head.is-large .m-head__title {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.m-head__right {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 2px;
}

.m-page__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  padding-bottom: 24px;
  padding-left: var(--sal);
  padding-right: var(--sar);
}

.m-page.has-tabbar .m-page__body {
  padding-bottom: calc(var(--tabbar-h) + var(--sab) + 24px);
}

.m-page__refresh {
  min-height: 100%;
}
</style>
