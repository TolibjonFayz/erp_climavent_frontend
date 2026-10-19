<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { showFailToast } from 'vant'
import { showActionSheet } from '../actionSheet'
import { MAX_MEDIA_MB, MEDIA_TYPES, isVideoFile } from '../views/sites/siteData'

// Rasm/video tanlash panjarasi. v-model — [{ id, file, url, progress, error }]
const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()

const cameraInput = ref(null)
const videoInput = ref(null)
const galleryInput = ref(null)
let seq = 0

function addFiles(fileList) {
  const items = [...props.modelValue]
  for (const file of fileList || []) {
    const okType = MEDIA_TYPES.includes(file.type) || /^(image|video)\//.test(file.type)
    if (!okType) {
      showFailToast(t('m.mediaOnly'))
      continue
    }
    if (file.size / 1024 / 1024 > MAX_MEDIA_MB) {
      showFailToast(t('m.mediaTooBig', { mb: MAX_MEDIA_MB }))
      continue
    }
    items.push({ id: ++seq, file, url: URL.createObjectURL(file), progress: 0, error: false })
  }
  emit('update:modelValue', items)
}

function onInput(e) {
  addFiles(e.target.files)
  e.target.value = ''
}

function remove(item) {
  URL.revokeObjectURL(item.url)
  emit(
    'update:modelValue',
    props.modelValue.filter((i) => i.id !== item.id),
  )
}

// Kamera / video / galereya tanlovi
function choose() {
  if (props.disabled) return
  showActionSheet({
    actions: [
      { name: t('m.takePhoto'), key: 'camera' },
      { name: t('m.recordVideo'), key: 'video' },
      { name: t('m.fromGallery'), key: 'gallery' },
    ],
    cancelText: t('cancel'),
    closeOnClickAction: true,
  }).then((action) => {
    const el = { camera: cameraInput, video: videoInput, gallery: galleryInput }[action?.key]
    el?.value?.click()
  }).catch(() => {})
}

onBeforeUnmount(() => props.modelValue.forEach((i) => URL.revokeObjectURL(i.url)))
</script>

<template>
  <div class="mpk">
    <div v-for="item in modelValue" :key="item.id" class="mpk__item">
      <video
        v-if="isVideoFile(item.file)"
        :src="item.url"
        class="mpk__thumb"
        muted
        playsinline
        preload="metadata"
      ></video>
      <img v-else :src="item.url" class="mpk__thumb" alt="" />
      <span v-if="isVideoFile(item.file)" class="mpk__badge"><van-icon name="play" /></span>
      <div v-if="item.progress > 0 && item.progress < 100" class="mpk__progress">
        <van-circle
          :current-rate="item.progress"
          :rate="item.progress"
          size="38px"
          :stroke-width="80"
          color="#fff"
          layer-color="rgba(255,255,255,.3)"
          :text="`${item.progress}%`"
        />
      </div>
      <div v-else-if="item.progress === 100" class="mpk__done"><van-icon name="success" /></div>
      <div v-else-if="item.error" class="mpk__done is-error"><van-icon name="cross" /></div>
      <button
        v-if="!disabled && !item.progress"
        type="button"
        class="mpk__remove"
        @click="remove(item)"
      >
        <van-icon name="cross" />
      </button>
    </div>

    <button v-if="!disabled" type="button" class="mpk__add" @click="choose">
      <van-icon name="photograph" />
      <span>{{ $t('m.addMedia') }}</span>
    </button>

    <input ref="cameraInput" type="file" accept="image/*" capture="environment" hidden @change="onInput" />
    <input ref="videoInput" type="file" accept="video/*" capture="environment" hidden @change="onInput" />
    <input ref="galleryInput" type="file" accept="image/*,video/*" multiple hidden @change="onInput" />
  </div>
</template>

<style scoped>
.mpk {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.mpk__item,
.mpk__add {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
}

.mpk__thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: var(--m-line-soft);
  display: block;
}

.mpk__badge {
  position: absolute;
  left: 6px;
  bottom: 6px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 12px;
}

.mpk__progress,
.mpk__done {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
}

.mpk__progress :deep(.van-circle__text) {
  color: #fff;
  font-size: 11px;
}

.mpk__done {
  background: rgba(21, 128, 61, 0.45);
  font-size: 26px;
}

.mpk__done.is-error {
  background: rgba(185, 28, 28, 0.5);
}

.mpk__remove {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 12px;
}

.mpk__add {
  border: 1.5px dashed var(--m-dash);
  background: var(--m-surface-2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--m-muted);
  font-size: 12px;
  font-weight: 500;
}

.mpk__add .van-icon {
  font-size: 26px;
  color: var(--m-primary);
}
</style>
