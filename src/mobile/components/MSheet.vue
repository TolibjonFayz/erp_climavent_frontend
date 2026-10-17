<script setup>
import { computed } from 'vue'
import { useBackClose } from '../native'

// Pastdan chiquvchi oyna: sarlavha + aylanadigan tana + ixtiyoriy pastki tugmalar.
// Android "orqaga" tugmasi uni yopadi.
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  // Ekranning qancha qismini egallashi mumkin
  maxHeight: { type: String, default: '88%' },
  full: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'closed'])

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})
useBackClose(visible)
</script>

<template>
  <van-popup
    v-model:show="visible"
    position="bottom"
    round
    teleport="body"
    :close-on-popstate="false"
    :safe-area-inset-bottom="false"
    class="m-sheet"
    :class="{ 'is-full': full }"
    :style="{ maxHeight: full ? '100%' : maxHeight }"
    @closed="emit('closed')"
  >
    <div class="m-sheet__grip"></div>
    <header v-if="title || $slots.head" class="m-sheet__head">
      <h3 class="m-sheet__title">
        <slot name="head">{{ title }}</slot>
      </h3>
      <button type="button" class="m-sheet__close" @click="visible = false">
        <van-icon name="cross" />
      </button>
    </header>
    <div class="m-sheet__body">
      <slot />
    </div>
    <footer v-if="$slots.footer" class="m-sheet__foot">
      <slot name="footer" />
    </footer>
  </van-popup>
</template>

<style>
.m-sheet {
  display: flex;
  flex-direction: column;
  padding-bottom: 0 !important;
}

.m-sheet.is-full {
  height: calc(100% - var(--sat) - 12px);
}

.m-sheet__grip {
  flex: 0 0 auto;
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: var(--m-line);
  margin: 8px auto 0;
}

.m-sheet__head {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 8px 8px 18px;
}

.m-sheet__title {
  flex: 1;
  min-width: 0;
  font-size: 17px;
  font-weight: 600;
}

.m-sheet__close {
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  background: var(--m-line-soft);
  display: grid;
  place-items: center;
  font-size: 16px;
  color: var(--m-muted);
}

.m-sheet__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  padding-bottom: calc(16px + var(--sab));
}

.m-sheet__foot + .m-sheet__body,
.m-sheet:has(.m-sheet__foot) .m-sheet__body {
  padding-bottom: 12px;
}

.m-sheet__foot {
  flex: 0 0 auto;
  display: flex;
  gap: 10px;
  padding: 10px 16px calc(10px + var(--sab));
  border-top: 1px solid var(--m-line);
  background: var(--m-surface);
}

.m-sheet__foot > * {
  flex: 1;
}
</style>
