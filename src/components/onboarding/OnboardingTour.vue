<template>
  <Teleport to="body">
    <!-- Yo'riqnoma qadami: nishon atrofida yorug' "teshik" + karta -->
    <div v-if="step && !suspended" class="onb" :class="{ 'onb--centered': !rect }">
      <div v-if="rect" class="onb__spot" :style="spotStyle" />
      <div v-else class="onb__dim" />

      <div ref="cardEl" class="onb__card" :style="cardStyle" role="dialog" aria-live="polite">
        <div class="onb__top">
          <span class="onb__count">{{ stepNo }} / {{ tour.state.steps.length }}</span>
          <span class="onb__level">{{ tour.level.value.icon }} {{ $t(tour.level.value.key) }}</span>
          <button type="button" class="onb__close" :aria-label="$t('onbClose')" @click="tour.stop()">
            ×
          </button>
        </div>
        <div class="onb__bar"><span :style="{ width: tour.progress.value + '%' }" /></div>

        <h4 class="onb__title">
          <span v-if="step.icon" class="onb__icon">{{ step.icon }}</span>{{ step.title }}
        </h4>
        <p class="onb__body">{{ step.body }}</p>

        <div v-if="step.waitFor" class="onb__mission">
          <span class="onb__mission-tag">{{ $t('onbMission') }}</span>
          {{ step.task }}
          <span class="onb__xp">+{{ step.xp }} XP</span>
        </div>

        <div class="onb__actions">
          <span class="onb__total">⭐ {{ tour.xp.value }} / {{ tour.totalXp.value }} XP</span>
          <el-button v-if="step.waitFor" size="small" text @click="tour.skip()">{{ $t('onbSkip') }}</el-button>
          <el-button v-else size="small" type="primary" @click="tour.next()">
            {{ isLast ? $t('onbFinish') : $t('onbNext') }}
            <template v-if="step.xp"> · +{{ step.xp }} XP</template>
          </el-button>
        </div>
      </div>
    </div>

    <!-- "+20 XP" uchib chiqadi -->
    <transition name="onb-gain">
      <div v-if="gain" :key="gain.at" class="onb-gain">+{{ gain.xp }} XP</div>
    </transition>

    <!-- Yakun: nishon va tabrik -->
    <div v-if="tour.state.celebrate" class="onb-finish" @click.self="tour.state.celebrate = false">
      <div class="onb-finish__card">
        <div class="onb-finish__confetti" aria-hidden="true">
          <i v-for="n in 24" :key="n" :style="confettiStyle(n)" />
        </div>
        <div class="onb-finish__badge">{{ badge.icon }}</div>
        <h3>{{ badge.title }}</h3>
        <p>{{ badge.text }}</p>
        <div class="onb-finish__xp">⭐ {{ tour.xp.value }} XP · {{ $t(tour.level.value.key) }}</div>
        <el-button type="primary" @click="tour.state.celebrate = false">{{ $t('onbStartWorking') }}</el-button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  tour: { type: Object, required: true },
  // Yakundagi nishon: { icon, title, text }
  badge: { type: Object, required: true },
})

const rect = ref(null)
// Nishondan tashqarida dialog/drawer ochiq bo'lsa (masalan, mashq dialogi) — yo'riqnoma
// vaqtincha yashirinadi, aks holda qorong'i qatlam dialogni yopib qo'yadi
const suspended = ref(false)
const cardEl = ref(null)
const cardSize = ref({ w: 360, h: 220 })
const gain = ref(null)
let timer = null
let gainTimer = null

const step = computed(() => props.tour.current.value)
const stepNo = computed(() => props.tour.state.index + 1)
const isLast = computed(() => props.tour.state.index === props.tour.state.steps.length - 1)

function openOverlays() {
  return [...document.querySelectorAll('.el-overlay')].filter((el) => el.getClientRects().length > 0)
}

function measure() {
  const s = step.value
  const target = s?.target ? document.querySelector(s.target) : null
  suspended.value = openOverlays().some((ov) => !target || !ov.contains(target))
  if (!s?.target) {
    rect.value = null
    return
  }
  const el = document.querySelector(s.target)
  if (!el) {
    rect.value = null
    return
  }
  const r = el.getBoundingClientRect()
  if (!r.width && !r.height) {
    rect.value = null
    return
  }
  rect.value = { top: r.top, left: r.left, width: r.width, height: r.height }
  if (cardEl.value) cardSize.value = { w: cardEl.value.offsetWidth, h: cardEl.value.offsetHeight }
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
    // Nishon joyi o'zgarishi mumkin (scroll, tab almashishi, yuklanish) — kuzatib turamiz
    timer = setInterval(measure, 250)
  },
  { immediate: true },
)

watch(
  () => props.tour.state.lastGain,
  (g) => {
    if (!g) return
    gain.value = g
    clearTimeout(gainTimer)
    gainTimer = setTimeout(() => (gain.value = null), 1400)
  },
)

onBeforeUnmount(() => {
  clearInterval(timer)
  clearTimeout(gainTimer)
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

// Karta nishonning ostida (joy bo'lmasa tepasida), ekrandan chiqmaydi
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

const COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#6250d6']
function confettiStyle(n) {
  return {
    left: `${(n * 37) % 100}%`,
    background: COLORS[n % COLORS.length],
    animationDelay: `${(n % 8) * 0.08}s`,
    transform: `rotate(${(n * 47) % 360}deg)`,
  }
}
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
    0 0 0 3px var(--ui-link),
    0 0 0 9999px rgba(15, 23, 42, 0.55);
  transition: all 0.25s ease;
  animation: onb-pulse 1.6s ease-in-out infinite;
}
.onb__dim {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
}
@keyframes onb-pulse {
  0%,
  100% {
    box-shadow:
      0 0 0 3px var(--ui-link),
      0 0 0 9999px rgba(15, 23, 42, 0.55);
  }
  50% {
    box-shadow:
      0 0 0 6px var(--ui-link-line),
      0 0 0 9999px rgba(15, 23, 42, 0.55);
  }
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
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--ui-muted);
}
.onb__level {
  margin-left: auto;
  font-weight: 600;
  color: var(--ui-ink-2);
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
.onb__bar {
  height: 6px;
  margin: 8px 0 12px;
  border-radius: 99px;
  background: var(--ui-surface-3);
  overflow: hidden;
}
.onb__bar span {
  display: block;
  height: 100%;
  border-radius: 99px;
  background: linear-gradient(90deg, var(--ui-link), #1baf7a);
  transition: width 0.4s ease;
}
.onb__title {
  margin: 0 0 6px;
  font-size: 16px;
  color: var(--ui-ink);
  display: flex;
  gap: 8px;
  align-items: center;
}
.onb__icon {
  font-size: 20px;
}
.onb__body {
  margin: 0 0 10px;
  font-size: 13px;
  line-height: 1.5;
}
.onb__mission {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  margin-bottom: 10px;
  border-radius: 8px;
  background: var(--ui-link-soft);
  border: 1px dashed var(--ui-link-line);
  font-size: 13px;
  color: var(--ui-ink);
}
.onb__mission-tag {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ui-link);
}
.onb__xp {
  margin-left: auto;
  font-weight: 700;
  color: var(--ui-warn);
}
.onb__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
}
.onb__total {
  margin-right: auto;
  font-size: 12px;
  font-weight: 600;
  color: var(--ui-muted);
}

.onb-gain {
  position: fixed;
  top: 84px;
  right: 32px;
  z-index: 3100;
  padding: 8px 14px;
  border-radius: 99px;
  background: var(--ui-warn-soft);
  border: 1px solid var(--ui-warn-line);
  color: var(--ui-warn-ink);
  font-weight: 800;
  pointer-events: none;
}
.onb-gain-enter-active {
  animation: onb-rise 1.4s ease forwards;
}
.onb-gain-leave-active {
  transition: opacity 0.2s;
}
.onb-gain-leave-to {
  opacity: 0;
}
@keyframes onb-rise {
  0% {
    opacity: 0;
    transform: translateY(12px) scale(0.8);
  }
  20% {
    opacity: 1;
    transform: translateY(0) scale(1.08);
  }
  100% {
    opacity: 0;
    transform: translateY(-28px) scale(1);
  }
}

.onb-finish {
  position: fixed;
  inset: 0;
  z-index: 3200;
  display: grid;
  place-items: center;
  background: rgba(15, 23, 42, 0.55);
}
.onb-finish__card {
  position: relative;
  width: min(380px, calc(100vw - 32px));
  padding: 28px 24px 22px;
  text-align: center;
  background: var(--ui-surface);
  border: 1px solid var(--ui-line);
  border-radius: 18px;
  overflow: hidden;
}
.onb-finish__card h3 {
  margin: 8px 0 6px;
  color: var(--ui-ink);
  font-size: 20px;
}
.onb-finish__card p {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--ui-ink-2);
}
.onb-finish__badge {
  font-size: 64px;
  line-height: 1;
  animation: onb-pop 0.6s cubic-bezier(0.2, 1.6, 0.4, 1);
}
.onb-finish__xp {
  margin-bottom: 16px;
  font-weight: 700;
  color: var(--ui-warn);
}
.onb-finish__confetti {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.onb-finish__confetti i {
  position: absolute;
  top: -12px;
  width: 7px;
  height: 12px;
  border-radius: 2px;
  animation: onb-fall 1.8s ease-in forwards;
}
@keyframes onb-fall {
  to {
    top: 110%;
    opacity: 0.2;
  }
}
@keyframes onb-pop {
  from {
    transform: scale(0.2);
  }
  to {
    transform: scale(1);
  }
}
@media (prefers-reduced-motion: reduce) {
  .onb__spot,
  .onb-finish__badge,
  .onb-finish__confetti i,
  .onb-gain-enter-active {
    animation: none;
  }
}
</style>
