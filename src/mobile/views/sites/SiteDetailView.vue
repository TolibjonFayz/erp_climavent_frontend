<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showFailToast, showImagePreview, showSuccessToast } from 'vant'
import checkInOutApi from '@/api/checkInOut'
import { useVideosStore } from '@/stores/videos'
import { formatDate, formatDateTime, formatSpan } from '@/utils/format'
import MPage from '../../components/MPage.vue'
import MEmpty from '../../components/MEmpty.vue'
import MSheet from '../../components/MSheet.vue'
import MediaPicker from '../../components/MediaPicker.vue'
import { openMap, pushOverlay, useBackClose } from '../../native'
import { imageThumb, isImageUrl, uploadToCloudinary, videoPoster, whereTone } from './siteData'

const { t } = useI18n()
const route = useRoute()
const videosStore = useVideosStore()

const loading = ref(true)
const failed = ref(false)
const visit = ref(null)
const media = ref([])

const insides = computed(() => visit.value?.comeAndGoInsides || visit.value?.comeandgoinsides || [])

async function loadVisit() {
  const res = await checkInOutApi.getOne(route.params.id)
  visit.value = res?.data || res
}
async function loadMedia() {
  try {
    const res = await videosStore.getVideosOfAObyekt(route.params.id)
    media.value = Array.isArray(res) ? res : res?.data || []
  } catch {
    media.value = []
  }
}
async function load() {
  failed.value = false
  try {
    await Promise.all([loadVisit(), loadMedia()])
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
}
onMounted(load)

const title = computed(() => {
  const v = insides.value[0]
  return v?.company_name || v?.whereto || t('m.visit')
})

const rowsOf = (v) =>
  [
    { key: 'gone', label: t('ketilganvaqt'), value: v.when_gone ? formatDateTime(v.when_gone) : '' },
    { key: 'came', label: t('kelganvaqt'), value: v.when_came ? formatDateTime(v.when_came) : '' },
    { key: 'span', label: t('siteDuration'), value: formatSpan(v.when_gone, v.when_came, t) },
    {
      key: 'doc',
      label: t('shartnomaKp'),
      value: [v.dogovor_or_kp, v.dogovorkp_number && `№${v.dogovorkp_number}`].filter(Boolean).join(' '),
    },
    { key: 'docDate', label: t('m.docDate'), value: v.dogovorkp_date ? formatDate(v.dogovorkp_date) : '' },
    { key: 'created', label: t('malumotkiritilganvaqt'), value: v.createdAt ? formatDateTime(v.createdAt) : '' },
  ].filter((r) => r.value)

// ─── Media ko'rish ───
const images = computed(() => media.value.filter((m) => isImageUrl(m.video_link)))
const videoOpen = ref(false)
const videoUrl = ref('')
useBackClose(videoOpen)

function openMedia(item) {
  if (isImageUrl(item.video_link)) {
    const urls = images.value.map((m) => m.video_link)
    let release = () => {}
    const preview = showImagePreview({
      images: urls,
      startPosition: Math.max(0, urls.indexOf(item.video_link)),
      closeable: true,
      closeOnPopstate: false,
      onClose: () => release(),
    })
    release = pushOverlay(() => preview.close())
  } else {
    videoUrl.value = item.video_link
    videoOpen.value = true
  }
}

// ─── Yangi media yuklash ───
const uploadOpen = ref(false)
const pending = ref([])
const uploading = ref(false)

async function uploadPending() {
  if (!pending.value.length) return
  uploading.value = true
  let failedCount = 0
  for (const item of pending.value) {
    if (item.progress === 100) continue
    try {
      item.progress = 1
      item.error = false
      const res = await uploadToCloudinary(item.file, (p) => (item.progress = Math.max(1, p)))
      await videosStore.createVideo({
        video_link: res.secure_url,
        video_name: item.file.name,
        user_id: Number(localStorage.getItem('userid')),
        comeandgo_id: Number(route.params.id),
      })
      item.progress = 100
    } catch {
      item.progress = 0
      item.error = true
      failedCount++
    }
  }
  uploading.value = false
  await loadMedia()
  if (failedCount) {
    showFailToast(t('m.mediaPartlyFailed', { n: failedCount }))
    pending.value = pending.value.filter((i) => i.progress !== 100)
  } else {
    showSuccessToast(t('m.uploaded'))
    pending.value = []
    uploadOpen.value = false
  }
}
</script>

<template>
  <MPage :title="title" :back="{ name: 'sites' }" :on-refresh="load">
    <div v-if="loading" class="m-card" style="margin-top: 12px"><van-skeleton :row="6" /></div>

    <MEmpty v-else-if="failed" icon="warning-o" :title="$t('m.loadFailed')">
      <van-button round type="primary" @click="load">{{ $t('m.retry') }}</van-button>
    </MEmpty>

    <template v-else>
      <section v-for="(v, i) in insides" :key="v.id || i">
        <div class="m-section">
          <span class="m-section__title">
            {{ insides.length > 1 ? $t('m.objectN', { n: i + 1 }) : $t('m.visit') }}
          </span>
        </div>
        <div class="m-card sd-card">
          <div class="sd-card__head">
            <span class="m-tag" :class="whereTone(v.whereto)">{{ v.whereto || '—' }}</span>
            <h3 class="sd-card__title">{{ v.company_name || '—' }}</h3>
          </div>

          <button
            v-if="v.locationname || v.lat"
            type="button"
            class="sd-loc"
            :disabled="!v.lat"
            @click="openMap(v.lat, v.lng, v.company_name)"
          >
            <van-icon name="location" class="sd-loc__icon" />
            <span class="sd-loc__text">{{ v.locationname || `${v.lat}, ${v.lng}` }}</span>
            <span v-if="v.lat" class="sd-loc__open">{{ $t('m.openMap') }}</span>
          </button>

          <dl class="sd-rows">
            <template v-for="r in rowsOf(v)" :key="r.key">
              <dt>{{ r.label }}</dt>
              <dd class="m-num">{{ r.value }}</dd>
            </template>
          </dl>

          <p v-if="v.more_info" class="sd-note">{{ v.more_info }}</p>
        </div>
      </section>

      <div class="m-section">
        <span class="m-section__title">{{ $t('m.photosVideos') }} · {{ media.length }}</span>
        <button type="button" class="m-section__action" @click="uploadOpen = true">
          + {{ $t('m.add') }}
        </button>
      </div>
      <div v-if="media.length" class="sd-grid">
        <button
          v-for="m in media"
          :key="m.id"
          type="button"
          class="sd-tile"
          @click="openMedia(m)"
        >
          <img
            v-if="isImageUrl(m.video_link)"
            :src="imageThumb(m.video_link)"
            loading="lazy"
            alt=""
          />
          <template v-else>
            <img v-if="videoPoster(m.video_link)" :src="videoPoster(m.video_link)" loading="lazy" alt="" />
            <span class="sd-tile__play"><van-icon name="play" /></span>
          </template>
        </button>
      </div>
      <div v-else class="m-card sd-nomedia" @click="uploadOpen = true">
        <van-icon name="photograph" />
        <span>{{ $t('m.noMedia') }}</span>
      </div>
    </template>

    <MSheet v-model="uploadOpen" :title="$t('m.addMedia')">
      <div class="sd-upload">
        <MediaPicker v-model="pending" :disabled="uploading" />
      </div>
      <template #footer>
        <van-button
          type="primary"
          :disabled="!pending.length"
          :loading="uploading"
          @click="uploadPending"
        >
          {{ $t('m.uploadN', { n: pending.length }) }}
        </van-button>
      </template>
    </MSheet>

    <van-popup
      v-model:show="videoOpen"
      teleport="body"
      class="sd-video"
      closeable
      close-icon-position="top-right"
      :style="{ width: '100%', height: '100%', background: '#000' }"
    >
      <video v-if="videoOpen" :src="videoUrl" controls autoplay playsinline class="sd-video__el"></video>
    </van-popup>
  </MPage>
</template>

<style scoped>
.sd-card__head {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.sd-card__title {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.sd-loc {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 12px;
  border: 0;
  border-radius: 10px;
  background: var(--m-primary-soft);
  text-align: left;
  font-size: 13px;
  line-height: 1.4;
  color: var(--m-ink-2);
}

.sd-loc__icon {
  color: var(--m-primary);
  font-size: 18px;
}

.sd-loc__text {
  flex: 1;
}

.sd-loc__open {
  flex: 0 0 auto;
  color: var(--m-primary);
  font-weight: 600;
}

.sd-rows {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px 14px;
  margin: 14px 0 0;
  font-size: 14px;
}

.sd-rows dt {
  color: var(--m-muted);
}

.sd-rows dd {
  margin: 0;
  text-align: right;
  color: var(--m-ink);
  font-weight: 500;
}

.sd-note {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--m-line-soft);
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  color: var(--m-ink-2);
}

.sd-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
  padding: 0 12px;
}

.sd-tile {
  position: relative;
  aspect-ratio: 1;
  border: 0;
  padding: 0;
  border-radius: 8px;
  overflow: hidden;
  background: #1f2937;
}

.sd-tile img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.sd-tile__play {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 28px;
  background: rgba(0, 0, 0, 0.25);
}

.sd-nomedia {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 28px;
  color: var(--m-muted);
  font-size: 14px;
}

.sd-nomedia .van-icon {
  font-size: 32px;
  color: var(--m-primary);
}

.sd-upload {
  padding: 4px 16px 8px;
}

.sd-video__el {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
