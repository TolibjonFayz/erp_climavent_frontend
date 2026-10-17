<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { showFailToast } from 'vant'
import { useAmocrmStore } from '@/stores/amocrm'
import { errorText } from '../../utils'

// Suhbat yozuvi: bosilganda havola olinadi va o'ynaladi. Bir vaqtda bitta yozuv.
const props = defineProps({
  hash: { type: String, required: true },
  status: { type: String, default: null }, // archived | failed | gone | invalid | null
  duration: { type: Number, default: 0 },
})
const { t, locale } = useI18n()
const amoStore = useAmocrmStore()

const audio = ref(null)
const src = ref('')
const loading = ref(false)
const playing = ref(false)
const current = ref(0)
const mediaDuration = ref(0)
const unavailable = computed(() => props.status === 'gone' || props.status === 'invalid')
const total = computed(() => mediaDuration.value || props.duration || 0)
const progress = computed(() => (total.value ? Math.min(100, (current.value / total.value) * 100) : 0))

const fmt = (s) => {
  const v = Math.max(0, Math.round(s || 0))
  return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`
}

async function toggle() {
  if (unavailable.value || loading.value) return
  if (playing.value) {
    audio.value.pause()
    return
  }
  if (!src.value) {
    loading.value = true
    try {
      const res = await amoStore.getRecordingUrl(props.hash)
      src.value = res.url
      await nextTick()
    } catch (e) {
      showFailToast(errorText(e, t, locale.value))
      loading.value = false
      return
    }
  }
  // Boshqa yozuv o'ynayotgan bo'lsa — to'xtatamiz
  window.dispatchEvent(new CustomEvent('m-record-play', { detail: props.hash }))
  try {
    await audio.value.play()
  } catch {
    showFailToast(t('m.recordFailed'))
  } finally {
    loading.value = false
  }
}

function onOtherPlay(e) {
  if (e.detail !== props.hash && playing.value) audio.value.pause()
}
window.addEventListener('m-record-play', onOtherPlay)
onBeforeUnmount(() => {
  window.removeEventListener('m-record-play', onOtherPlay)
  audio.value?.pause()
})

function seek(e) {
  if (!total.value || !audio.value || !src.value) return
  const rect = e.currentTarget.getBoundingClientRect()
  const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
  audio.value.currentTime = ratio * total.value
}
</script>

<template>
  <div class="rp" :class="{ 'is-off': unavailable }" @click.stop>
    <button type="button" class="rp__btn" :disabled="unavailable" @click="toggle">
      <van-loading v-if="loading" size="16" color="#fff" />
      <van-icon v-else :name="playing ? 'pause' : 'play'" />
    </button>
    <div class="rp__track" @click="seek">
      <div class="rp__fill" :style="{ width: `${progress}%` }"></div>
    </div>
    <span class="rp__time m-num">
      {{ unavailable ? $t('m.recordGone') : playing || current ? fmt(current) : fmt(total) }}
    </span>
    <audio
      ref="audio"
      :src="src || undefined"
      preload="none"
      @play="playing = true"
      @pause="playing = false"
      @ended="(playing = false), (current = 0)"
      @timeupdate="current = $event.target.currentTime"
      @loadedmetadata="mediaDuration = Number.isFinite($event.target.duration) ? $event.target.duration : 0"
    ></audio>
  </div>
</template>

<style scoped>
.rp {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  padding: 6px 10px 6px 6px;
  border-radius: 22px;
  background: var(--m-primary-soft);
}

.rp.is-off {
  background: var(--m-line-soft);
}

.rp__btn {
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  background: var(--m-primary);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 15px;
}

.rp__btn:disabled {
  background: var(--m-faint);
}

.rp__track {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: rgba(42, 120, 214, 0.18);
  overflow: hidden;
}

.rp__fill {
  height: 100%;
  background: var(--m-primary);
  transition: width 0.2s linear;
}

.rp__time {
  font-size: 12px;
  color: var(--m-ink-2);
  min-width: 36px;
  text-align: right;
}
</style>
