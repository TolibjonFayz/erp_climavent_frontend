<template>
  <!-- Telefoniyada o'chib ketgan — tinglab bo'lmaydi -->
  <el-tooltip v-if="status === 'gone'" :content="$t('amoHintRecGone')" placement="top">
    <span class="rp-gone">{{ $t('amoRecStatus_gone') }}</span>
  </el-tooltip>

  <div v-else class="rp" :class="{ 'is-active': src, 'is-playing': playing, 'is-error': failed }">
    <button
      type="button"
      class="rp-play"
      :aria-label="$t(playing ? 'amoRecPause' : 'amoRecPlay')"
      :title="$t(playing ? 'amoRecPause' : 'amoRecPlay')"
      @click="toggle"
    >
      <span v-if="busy" class="rp-spin" aria-hidden="true"></span>
      <svg v-else-if="playing" viewBox="0 0 16 16" aria-hidden="true">
        <rect x="3.5" y="2.5" width="3" height="11" rx="1" />
        <rect x="9.5" y="2.5" width="3" height="11" rx="1" />
      </svg>
      <svg v-else viewBox="0 0 16 16" aria-hidden="true">
        <path d="M5 2.8v10.4c0 .6.7 1 1.2.7l8-5.2a.8.8 0 0 0 0-1.4l-8-5.2C5.7 1.8 5 2.2 5 2.8z" />
      </svg>
    </button>

    <span class="rp-time">{{ fmt(current) }}</span>

    <div
      ref="trackEl"
      class="rp-track"
      role="slider"
      tabindex="0"
      :aria-label="$t('amoRecSeek')"
      aria-valuemin="0"
      :aria-valuemax="Math.round(total)"
      :aria-valuenow="Math.round(current)"
      :aria-valuetext="`${fmt(current)} / ${fmt(total)}`"
      @pointerdown="onPointerDown"
      @keydown="onKey"
    >
      <span class="rp-track__rail">
        <span class="rp-track__buffer" :style="{ width: `${bufferedPct}%` }"></span>
        <span class="rp-track__fill" :style="{ width: `${playedPct}%` }"></span>
      </span>
      <span class="rp-track__thumb" :style="{ left: `${playedPct}%` }"></span>
    </div>

    <span class="rp-time rp-time--total">{{ fmt(total) }}</span>

    <button
      type="button"
      class="rp-speed"
      :class="{ 'is-on': rate !== 1 }"
      :title="$t('amoRecSpeed')"
      :aria-label="`${$t('amoRecSpeed')}: ${rate}x`"
      @click="cycleRate"
    >
      {{ rate }}x
    </button>

    <button
      type="button"
      class="rp-icon"
      :title="$t('amoRecDownload')"
      :aria-label="$t('amoRecDownload')"
      :disabled="downloading"
      @click="download"
    >
      <span v-if="downloading" class="rp-spin rp-spin--dark" aria-hidden="true"></span>
      <svg v-else viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M8 2v8m0 0L4.8 6.8M8 10l3.2-3.2M3 12.5v.5c0 .6.4 1 1 1h8c.6 0 1-.4 1-1v-.5"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <el-tooltip :content="$t(`amoRecStatus_${status || 'pending'}`)" placement="top">
      <span class="rp-badge" :class="status === 'archived' ? 'is-ok' : 'is-wait'">
        <svg v-if="status === 'archived'" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M4 8.5l2.5 2.5L12 5.5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </el-tooltip>

    <audio
      v-if="src"
      ref="audioEl"
      :src="src"
      preload="auto"
      @loadedmetadata="onMeta"
      @durationchange="onMeta"
      @timeupdate="onTime"
      @progress="onProgress"
      @play="onPlay"
      @pause="playing = false"
      @ended="onEnded"
      @waiting="waiting = true"
      @playing="waiting = false"
      @canplay="waiting = false"
      @error="onError"
    ></audio>
  </div>
</template>

<script>
// Bir vaqtda faqat bitta yozuv o'ynasin
let activeAudio = null
</script>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { useAmocrmStore } from '@/stores/amocrm'

const props = defineProps({
  // amo_calls.record_hash
  hash: { type: String, required: true },
  // archived | failed | gone | invalid | null (hali urinilmagan)
  status: { type: String, default: null },
  // amoCRM'dagi suhbat davomiyligi (soniya) — fayl yuklanmaguncha ko'rsatiladi
  duration: { type: Number, default: 0 },
})

const { t } = useI18n()
const amoStore = useAmocrmStore()

const src = ref('')
const audioEl = ref(null)
const trackEl = ref(null)
const loading = ref(false)
const waiting = ref(false)
const downloading = ref(false)
const playing = ref(false)
const failed = ref(false)
const current = ref(0)
const mediaDuration = ref(0)
const buffered = ref(0)
const rate = ref(1)

const busy = computed(() => loading.value || (playing.value && waiting.value))
const total = computed(() => mediaDuration.value || props.duration || 0)
const playedPct = computed(() =>
  total.value ? Math.min(100, (current.value / total.value) * 100) : 0,
)
const bufferedPct = computed(() =>
  total.value ? Math.min(100, (buffered.value / total.value) * 100) : 0,
)

function fmt(sec) {
  const s = Math.max(0, Math.floor(Number(sec) || 0))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

// Havola birinchi bosilganda olinadi (R2 havolasi qisqa muddatli)
async function ensureLoaded() {
  if (src.value) return true
  loading.value = true
  failed.value = false
  try {
    const res = await amoStore.getRecordingUrl(props.hash)
    src.value = res.url
    await nextTick()
    audioEl.value.playbackRate = rate.value
    return true
  } catch (err) {
    ElMessage.error(err?.response?.data?.message || err?.message)
    return false
  } finally {
    loading.value = false
  }
}

async function toggle() {
  if (playing.value) {
    audioEl.value?.pause()
    return
  }
  if (!(await ensureLoaded())) return
  try {
    await audioEl.value.play()
  } catch {
    /* xato onError'da ko'rsatiladi */
  }
}

async function seekTo(ratio) {
  const r = Math.min(1, Math.max(0, ratio))
  if (!(await ensureLoaded())) return
  const a = audioEl.value
  const apply = () => {
    const d = Number.isFinite(a.duration) && a.duration ? a.duration : total.value
    a.currentTime = r * d
    current.value = a.currentTime
  }
  if (a.readyState >= 1) apply()
  else a.addEventListener('loadedmetadata', apply, { once: true })
}

// Bosib yoki sudrab o'tkazish
function ratioAt(clientX) {
  const rect = trackEl.value.getBoundingClientRect()
  return rect.width ? (clientX - rect.left) / rect.width : 0
}

function onPointerDown(e) {
  if (e.button !== 0) return
  const el = trackEl.value
  el.setPointerCapture?.(e.pointerId)
  seekTo(ratioAt(e.clientX))
  const move = (ev) => seekTo(ratioAt(ev.clientX))
  const up = () => {
    el.removeEventListener('pointermove', move)
    el.removeEventListener('pointerup', up)
    el.removeEventListener('pointercancel', up)
  }
  el.addEventListener('pointermove', move)
  el.addEventListener('pointerup', up)
  el.addEventListener('pointercancel', up)
}

function onKey(e) {
  const step = { ArrowRight: 5, ArrowLeft: -5 }[e.key]
  if (step && total.value) {
    e.preventDefault()
    seekTo((current.value + step) / total.value)
  } else if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    toggle()
  }
}

const RATES = [1, 1.5, 2]
function cycleRate() {
  rate.value = RATES[(RATES.indexOf(rate.value) + 1) % RATES.length]
  if (audioEl.value) audioEl.value.playbackRate = rate.value
}

async function download() {
  downloading.value = true
  try {
    const res = await amoStore.getRecordingUrl(props.hash, true)
    // Arxivdagisi fayl nomi bilan yuklanadi; telefoniyadagisi yangi oynada ochiladi
    const a = document.createElement('a')
    a.href = res.url
    a.rel = 'noopener'
    if (!res.archived) a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    a.remove()
  } catch (err) {
    ElMessage.error(err?.response?.data?.message || err?.message)
  } finally {
    downloading.value = false
  }
}

// ─── <audio> hodisalari ───────────────────────────────────
function onMeta() {
  const d = audioEl.value?.duration
  if (Number.isFinite(d) && d > 0) mediaDuration.value = d
}

function onTime() {
  current.value = audioEl.value?.currentTime || 0
  onProgress()
}

function onProgress() {
  const b = audioEl.value?.buffered
  if (b?.length) buffered.value = b.end(b.length - 1)
}

function onPlay() {
  if (activeAudio && activeAudio !== audioEl.value) activeAudio.pause()
  activeAudio = audioEl.value
  playing.value = true
  failed.value = false
}

function onEnded() {
  playing.value = false
  current.value = 0
}

function onError() {
  playing.value = false
  waiting.value = false
  failed.value = true
  src.value = ''
  ElMessage.warning(t('amoRecLoadError'))
}

onBeforeUnmount(() => {
  if (activeAudio === audioEl.value) activeAudio = null
})
</script>

<style lang="scss" scoped>
$blue: #2a78d6;
$blue-soft: #e8f1fc;
$ink: #111827;
$muted: #6b7280;
$rail: #e5e9ef;

.rp {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 300px;
  max-width: 100%;
  height: 36px;
  padding: 0 6px 0 3px;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: #fff;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;

  &:hover,
  &.is-active {
    border-color: #cfdcef;
  }
  &.is-playing {
    border-color: #b9d2f2;
    box-shadow: 0 1px 6px rgba(42, 120, 214, 0.12);
  }
  &.is-error {
    border-color: #f3c9c9;
  }

  button {
    font: inherit;
    border: 0;
    padding: 0;
    cursor: pointer;
    flex-shrink: 0;
  }
  button:focus-visible,
  .rp-track:focus-visible {
    outline: 2px solid $blue;
    outline-offset: 2px;
  }
}

.rp-play {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: $blue;
  color: #fff;
  transition:
    background 0.15s,
    transform 0.1s;

  svg {
    width: 12px;
    height: 12px;
    fill: currentColor;
  }
  &:hover {
    background: #1f66bd;
  }
  &:active {
    transform: scale(0.94);
  }
}

.rp-time {
  font-size: 11.5px;
  color: $ink;
  font-variant-numeric: tabular-nums;
  min-width: 30px;
  flex-shrink: 0;

  &--total {
    color: $muted;
    text-align: right;
  }
}

.rp-track {
  position: relative;
  flex: 1;
  min-width: 40px;
  height: 20px;
  display: flex;
  align-items: center;
  cursor: pointer;
  touch-action: none;

  &__rail {
    position: relative;
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: $rail;
    overflow: hidden;
  }
  &__buffer,
  &__fill {
    position: absolute;
    inset: 0 auto 0 0;
    border-radius: 2px;
  }
  &__buffer {
    background: #d3dce8;
  }
  &__fill {
    background: $blue;
  }
  &__thumb {
    position: absolute;
    top: 50%;
    width: 12px;
    height: 12px;
    margin-left: -6px;
    margin-top: -6px;
    border-radius: 50%;
    background: #fff;
    border: 2px solid $blue;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
    opacity: 0;
    transform: scale(0.6);
    transition:
      opacity 0.12s,
      transform 0.12s;
    pointer-events: none;
  }
  &:hover &__rail,
  &:focus-visible &__rail {
    height: 6px;
    border-radius: 3px;
  }
  &:hover &__thumb,
  &:focus-visible &__thumb {
    opacity: 1;
    transform: scale(1);
  }
}
.rp:not(.is-active) .rp-track__fill {
  background: #c4cfdd;
}
.rp.is-active .rp-track__thumb {
  opacity: 1;
  transform: scale(1);
}

.rp-speed {
  height: 22px;
  min-width: 32px;
  padding: 0 6px !important;
  border-radius: 6px;
  background: #f3f4f6;
  color: $muted;
  font-size: 11px !important;
  font-weight: 600;
  font-variant-numeric: tabular-nums;

  &:hover {
    background: #e9ecf0;
    color: $ink;
  }
  &.is-on {
    background: $blue-soft;
    color: $blue;
  }
}

.rp-icon {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: transparent;
  color: $muted;

  svg {
    width: 15px;
    height: 15px;
  }
  &:hover:not(:disabled) {
    background: #f3f4f6;
    color: $ink;
  }
  &:disabled {
    cursor: default;
  }
}

.rp-badge {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  flex-shrink: 0;

  svg {
    width: 11px;
    height: 11px;
  }
  &.is-ok {
    background: #dcfce7;
    color: #15803d;
  }
  &.is-wait {
    width: 8px;
    height: 8px;
    margin: 0 4px;
    background: #d1d5db;
  }
}

.rp-spin {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  animation: rp-spin 0.7s linear infinite;

  &--dark {
    border-color: #d1d5db;
    border-top-color: $muted;
  }
}
@keyframes rp-spin {
  to {
    transform: rotate(360deg);
  }
}

.rp-gone {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: #f3f4f6;
  font-size: 12px;
  color: #9ca3af;
  text-decoration: line-through;
}
</style>
