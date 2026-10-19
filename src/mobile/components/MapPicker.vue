<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { showFailToast, showToast } from 'vant'
import { useBackClose } from '../native'
import { MAPBOX_TOKEN, TASHKENT, currentPosition, resolveLink, reverseGeocode } from '../geo'

// To'liq ekranli xarita: markazdagi belgini surib joy tanlanadi.
// Tanlanganda `select` → { lat, lng, address }.
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  initial: { type: Object, default: null }, // { lat, lng }
})
const emit = defineEmits(['update:modelValue', 'select'])
const { t } = useI18n()

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})
useBackClose(open)

const mapEl = ref(null)
const center = ref(null)
const address = ref('')
const resolving = ref(false)
const locating = ref(false)
const moving = ref(false)
const linkOpen = ref(false)
const link = ref('')
const linkBusy = ref(false)
const mapFailed = ref(false)

let map = null
let mapboxgl = null
let geoTimer = null
let geoSeq = 0

async function ensureMap() {
  if (map) {
    map.resize()
    return
  }
  try {
    const mod = await import('mapbox-gl')
    await import('mapbox-gl/dist/mapbox-gl.css')
    mapboxgl = mod.default || mod
    mapboxgl.accessToken = MAPBOX_TOKEN
    const start = props.initial?.lat ? props.initial : TASHKENT
    map = new mapboxgl.Map({
      container: mapEl.value,
      style: document.documentElement.classList.contains('dark')
        ? 'mapbox://styles/mapbox/dark-v11'
        : 'mapbox://styles/mapbox/streets-v12',
      center: [start.lng, start.lat],
      zoom: props.initial?.lat ? 16 : 12,
      attributionControl: false,
      pitchWithRotate: false,
      dragRotate: false,
    })
    map.touchZoomRotate.disableRotation()
    map.on('movestart', () => (moving.value = true))
    map.on('moveend', () => {
      moving.value = false
      const c = map.getCenter()
      center.value = { lat: c.lat, lng: c.lng }
      scheduleGeocode()
    })
    map.on('load', () => {
      const c = map.getCenter()
      center.value = { lat: c.lat, lng: c.lng }
      scheduleGeocode()
      // Avval joy tanlanmagan bo'lsa — darhol GPS'ni so'raymiz
      if (!props.initial?.lat) locate()
    })
  } catch {
    mapFailed.value = true
  }
}

function scheduleGeocode() {
  clearTimeout(geoTimer)
  geoTimer = setTimeout(async () => {
    if (!center.value) return
    const seq = ++geoSeq
    resolving.value = true
    const name = await reverseGeocode(center.value.lng, center.value.lat)
    if (seq !== geoSeq) return
    address.value = name || ''
    resolving.value = false
  }, 450)
}

function flyTo({ lat, lng }, zoom = 17) {
  if (map) map.flyTo({ center: [lng, lat], zoom, duration: 900 })
  else center.value = { lat, lng }
}

async function locate() {
  locating.value = true
  try {
    const pos = await currentPosition()
    flyTo(pos)
  } catch (e) {
    showFailToast(e?.code === 'denied' ? t('m.geoDenied') : t('m.geoFailed'))
  } finally {
    locating.value = false
  }
}

async function applyLink() {
  if (!link.value.trim()) return
  linkBusy.value = true
  try {
    const c = await resolveLink(link.value)
    if (!c) {
      showFailToast({ message: t('m.linkNoCoords'), wordBreak: 'break-word' })
      return
    }
    linkOpen.value = false
    link.value = ''
    flyTo(c)
    showToast(t('m.linkApplied'))
  } finally {
    linkBusy.value = false
  }
}

async function pasteLink() {
  try {
    link.value = await navigator.clipboard.readText()
  } catch {
    /* ruxsat yo'q — qo'lda kiritiladi */
  }
}

async function confirm() {
  if (!center.value) return
  let name = address.value
  if (!name) name = (await reverseGeocode(center.value.lng, center.value.lat)) || ''
  emit('select', { ...center.value, address: name })
  open.value = false
}

watch(open, async (v) => {
  if (!v) return
  await nextTick()
  // Popup animatsiyasi tugagach o'lcham to'g'ri bo'ladi
  setTimeout(ensureMap, 60)
})

onBeforeUnmount(() => {
  clearTimeout(geoTimer)
  map?.remove()
  map = null
})
</script>

<template>
  <van-popup
    v-model:show="open"
    position="bottom"
    teleport="body"
    :close-on-popstate="false"
    class="mp"
    :style="{ height: '100%' }"
  >
    <div class="mp__map" ref="mapEl"></div>
    <div v-if="mapFailed" class="mp__failed">{{ $t('m.mapFailed') }}</div>

    <!-- Markazdagi belgi -->
    <div class="mp__pin" :class="{ 'is-moving': moving }">
      <svg viewBox="0 0 24 36" width="36" height="54" aria-hidden="true">
        <path
          d="M12 0C5.4 0 0 5.3 0 11.9 0 20.8 12 36 12 36s12-15.2 12-24.1C24 5.3 18.6 0 12 0z"
          fill="#2a78d6"
        />
        <circle cx="12" cy="12" r="4.6" fill="#fff" />
      </svg>
      <span class="mp__pin-shadow"></span>
    </div>

    <header class="mp__top">
      <button type="button" class="mp__round" @click="open = false">
        <van-icon name="arrow-left" />
      </button>
      <button type="button" class="mp__link-btn" @click="linkOpen = !linkOpen">
        <van-icon name="link-o" /> {{ $t('m.pasteMapLink') }}
      </button>
    </header>

    <div v-if="linkOpen" class="mp__link">
      <van-field
        v-model="link"
        :placeholder="$t('m.mapLinkPlaceholder')"
        clearable
        class="mp__link-input"
        @keyup.enter="applyLink"
      >
        <template #button>
          <van-button size="small" @click="pasteLink">{{ $t('m.paste') }}</van-button>
        </template>
      </van-field>
      <van-button type="primary" size="small" block :loading="linkBusy" @click="applyLink">
        {{ $t('m.showOnMap') }}
      </van-button>
    </div>

    <button type="button" class="mp__round mp__locate" :disabled="locating" @click="locate">
      <van-loading v-if="locating" size="20" />
      <van-icon v-else name="aim" />
    </button>

    <footer class="mp__sheet">
      <p class="mp__label">{{ $t('m.selectedPlace') }}</p>
      <p class="mp__address">
        <van-loading v-if="resolving" size="14" />
        <span v-else>{{ address || $t('m.addressUnknown') }}</span>
      </p>
      <p v-if="center" class="mp__coords m-num">
        {{ center.lat.toFixed(6) }}, {{ center.lng.toFixed(6) }}
      </p>
      <van-button
        type="primary"
        block
        size="large"
        :disabled="!center || moving"
        @click="confirm"
      >
        {{ $t('m.choosePlace') }}
      </van-button>
    </footer>
  </van-popup>
</template>

<style>
.mp {
  overflow: hidden;
  background: var(--m-map-bg);
}

/* mapbox-gl.css `.mapboxgl-map { position: relative }` ni bosib ketmasligi uchun aniqroq selektor */
.mp .mp__map {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.mp__failed {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  text-align: center;
  color: var(--m-muted);
}

.mp__pin {
  position: absolute;
  left: 50%;
  /* Belgi uchi aynan xarita markazida (map.getCenter) */
  top: 50%;
  transform: translate(-50%, calc(-100% + 4px));
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
}

.mp__pin svg {
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.25));
  transition: transform 0.18s ease;
}

.mp__pin.is-moving svg {
  transform: translateY(-10px);
}

.mp__pin-shadow {
  width: 10px;
  height: 4px;
  margin-top: -2px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.35);
  transform: translateY(100%);
}

.mp__top {
  position: absolute;
  top: calc(var(--sat) + 10px);
  left: 12px;
  right: 12px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  z-index: 3;
}

.mp__round {
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 50%;
  background: var(--m-surface);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
  display: grid;
  place-items: center;
  font-size: 20px;
  color: var(--m-ink);
}

.mp__link-btn {
  border: 0;
  height: 44px;
  padding: 0 16px;
  border-radius: 22px;
  background: var(--m-surface);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.mp__link {
  position: absolute;
  top: calc(var(--sat) + 64px);
  left: 12px;
  right: 12px;
  z-index: 3;
  background: var(--m-surface);
  border-radius: 14px;
  padding: 10px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
  display: grid;
  gap: 8px;
}

.mp__link-input {
  padding: 6px 8px;
  background: var(--m-line-soft);
  border-radius: 10px;
}

.mp__locate {
  position: absolute;
  right: 14px;
  bottom: calc(var(--sab) + 200px);
  z-index: 3;
  color: var(--m-primary);
}

.mp__sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3;
  background: var(--m-surface);
  border-radius: 18px 18px 0 0;
  padding: 16px 16px calc(var(--sab) + 14px);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.12);
}

.mp__label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--m-muted);
}

.mp__address {
  margin-top: 6px;
  min-height: 40px;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.mp__coords {
  margin: 2px 0 12px;
  font-size: 12px;
  color: var(--m-faint);
}
</style>
