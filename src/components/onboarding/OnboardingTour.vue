<template>
  <Teleport to="body">
    <!-- Yo'riqnoma qadami: nishon atrofida yorug' "teshik" + izoh kartasi -->
    <div v-if="step && !suspended" class="onb" :class="{ 'onb--centered': !rect }">
      <div v-if="rect" class="onb__spot" :style="spotStyle" />
      <div v-else class="onb__dim" />

      <div ref="cardEl" class="onb__card" :style="cardStyle" role="dialog" aria-live="polite">
        <div class="onb__top">
          <span>{{ stepNo }} / {{ tour.state.steps.length }}</span>
          <button type="button" class="onb__close" :aria-label="$t('onbClose')" @click="tour.stop()">×</button>
        </div>

        <h4 class="onb__title">{{ step.title }}</h4>
        <p class="onb__body">{{ step.body }}</p>

        <div class="onb__actions">
          <el-button size="small" :disabled="tour.isFirst.value" @click="tour.back()">
            {{ $t('onbBack') }}
          </el-button>
          <el-button size="small" type="primary" @click="tour.next()">
            {{ tour.isLast.value ? $t('onbDone') : $t('onbNext') }}
          </el-button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  tour: { type: Object, required: true },
})

const rect = ref(null)
// Nishondan tashqarida dialog/drawer ochiq bo'lsa — yo'riqnoma vaqtincha yashirinadi,
// aks holda qorong'i qatlam dialogni yopib qo'yadi
const suspended = ref(false)
const cardEl = ref(null)
const cardSize = ref({ w: 360, h: 180 })
let timer = null

const step = computed(() => props.tour.current.value)
const stepNo = computed(() => props.tour.state.index + 1)

function openOverlays() {
  return [...document.querySelectorAll('.el-overlay')].filter((el) => el.getClientRects().length > 0)
}

function measure() {
  const s = step.value
  const target = s?.target ? document.querySelector(s.target) : null
  suspended.value = openOverlays().some((ov) => !target || !ov.contains(target))
  if (cardEl.value) cardSize.value = { w: cardEl.value.offsetWidth, h: cardEl.value.offsetHeight }
  const r = target?.getBoundingClientRect()
  rect.value = r && (r.width || r.height) ? { top: r.top, left: r.left, width: r.width, height: r.height } : null
}

watch(
  step,
  async (s) => {
    clearInterval(timer)
    if (!s) return
    await nextTick()
    const el = s.target && document.querySelector(s.target)
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    measure()
    // Nishon joyi o'zgarishi mumkin (scroll, tab almashishi, karta ochilishi) — kuzatib turamiz
    timer = setInterval(measure, 250)
  },
  { immediate: true },
)

// Klaviatura: ← → qadamlar, Esc — yopish
function onKey(e) {
  if (!step.value || suspended.value) return
  if (e.key === 'Escape') props.tour.stop()
  else if (e.key === 'ArrowRight') props.tour.next()
  else if (e.key === 'ArrowLeft') props.tour.back()
}
onMounted(() => window.addEventListener('keydown', onKey))

onBeforeUnmount(() => {
  clearInterval(timer)
  window.removeEventListener('keydown', onKey)
  if (props.tour.state.active) props.tour.state.active = false
})

const PAD = 6
const spotStyle = computed(() => {
  const r = rect.value
  return {
    top: `${r.top - PAD}px`,
    left: `${r.left - PAD}px`,
    width: `${r.width + PAD * 2}px`,
    height: `${r.height + PAD * 2}px`,
  }
})

// Karta nishon yonida, ekrandan chiqmaydi
const cardStyle = computed(() => {
  const r = rect.value
  if (!r) return {}
  const vw = window.innerWidth
  const vh = window.innerHeight
  const { w, h } = cardSize.value
  const gap = 14
  const clampX = (x) => Math.min(Math.max(12, x), vw - w - 12)
  const clampY = (y) => Math.min(Math.max(12, y), vh - h - 12)
  // 1) ostida, 2) tepasida, 3) chapida, 4) o'ngida, 5) ekranning pastki burchagida
  if (r.top + r.height + gap + h <= vh - 12) return { top: `${r.top + r.height + gap}px`, left: `${clampX(r.left)}px` }
  if (r.top - gap - h >= 12) return { top: `${r.top - gap - h}px`, left: `${clampX(r.left)}px` }
  const midY = clampY(r.top + Math.min(r.height, vh) / 2 - h / 2)
  if (r.left - gap - w >= 12) return { top: `${midY}px`, left: `${r.left - gap - w}px` }
  if (r.left + r.width + gap + w <= vw - 12) return { top: `${midY}px`, left: `${r.left + r.width + gap}px` }
  return { top: `${vh - h - 12}px`, left: `${vw - w - 12}px` }
})
</script>

<style scoped>
.onb {
  position: fixed;
  inset: 0;
  z-index: 3000;
  pointer-events: none;
}
.onb__spot {
  position: fixed;
  border-radius: 10px;
  box-shadow:
    0 0 0 2px var(--ui-link),
    0 0 0 9999px rgba(15, 23, 42, 0.5);
  transition: all 0.25s ease;
}
.onb__dim {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
}
.onb__card {
  position: fixed;
  width: min(360px, calc(100vw - 24px));
  padding: 14px 16px;
  background: var(--ui-surface);
  color: var(--ui-ink-2);
  border: 1px solid var(--ui-line);
  border-radius: var(--ui-radius-lg);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.25);
  pointer-events: auto;
  transition:
    top 0.25s ease,
    left 0.25s ease;
}
.onb--centered .onb__card {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.onb__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--ui-muted);
  font-variant-numeric: tabular-nums;
}
.onb__close {
  border: 0;
  background: none;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  color: var(--ui-muted);
  padding: 0 2px;
}
.onb__close:hover {
  color: var(--ui-ink);
}
.onb__title {
  margin: 6px 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--ui-ink);
}
.onb__body {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.55;
}
.onb__actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
@media (prefers-reduced-motion: reduce) {
  .onb__spot,
  .onb__card {
    transition: none;
  }
}
</style>
