<template>
  <UiPage>
    <template #title>
      <el-button class="sd-back" link :icon="ArrowLeft" @click="router.push({ name: 'sites' })">
        {{ $t('yaqindaBorilganObyektlar') }}
      </el-button>
      <h1 class="sd-title">{{ visit?.whereto || $t('rasmvavideolar') }}</h1>
    </template>
    <template v-if="visit" #subtitle>
      <span v-if="visit.company_name">{{ visit.company_name }} · </span>
      {{ formatDateTime(visit.when_gone) }}
      <template v-if="visit.locationname"> · {{ visit.locationname }}</template>
    </template>

    <div class="sd-grid">
      <!-- Tashrif ma'lumoti -->
      <UiPanel :title="$t('siteVisitInfo')" :icon="Location">
        <el-skeleton v-if="visitLoading" :rows="5" animated />
        <UiInfoList v-else-if="visit" :items="visitItems" />
        <el-empty v-else :image-size="60" :description="$t('Kiritilmagan')" />
      </UiPanel>

      <!-- Yuklash -->
      <UiPanel
        :title="$t('rasmvavideolar')"
        :hint="$t('obyektgaRasmVaVideolar')"
        :icon="UploadFilled"
      >
        <el-upload
          ref="uploadRef"
          class="sd-upload"
          drag
          :action="cloudinaryUrl"
          :data="uploadData"
          multiple
          :auto-upload="false"
          :before-upload="beforeUpload"
          :on-success="handleSuccess"
          :on-error="handleError"
          :accept="acceptedTypes"
          list-type="picture-card"
          :limit="10"
        >
          <el-icon class="sd-upload__icon"><upload-filled /></el-icon>
          <div class="sd-upload__text">{{ $t('mediauloadbtn') }}</div>
        </el-upload>
        <div class="sd-upload__actions">
          <span class="sd-hint">{{ $t('siteUploadHint') }}</span>
          <el-button type="primary" :loading="uploading" @click="submitUpload()">
            {{ uploading ? $t('uploading') : $t('upload') }}
          </el-button>
        </div>
      </UiPanel>
    </div>

    <!-- Galereya -->
    <UiPanel>
      <template #title>
        {{ $t('uploadedmedia') }}
        <span class="sd-count">{{ existingMedia.length }}</span>
      </template>
      <template #actions>
        <el-radio-group v-model="activeFilter" size="small">
          <el-radio-button value="all">
            {{ $t('Hammasi') }} ({{ existingMedia.length }})
          </el-radio-button>
          <el-radio-button value="image">{{ $t('Rasmlar') }} ({{ imageCount }})</el-radio-button>
          <el-radio-button value="video">{{ $t('Videolar') }} ({{ videoCount }})</el-radio-button>
        </el-radio-group>
      </template>

      <el-skeleton v-if="loading" :rows="3" animated />
      <el-empty v-else-if="!existingMedia.length" :description="$t('nomediamauploaded')" />
      <div v-else class="sd-media-grid">
        <article v-for="item in filteredMedia" :key="item.id" class="sd-media">
          <button type="button" class="sd-media__thumb" @click="openModal(item)">
            <img
              v-if="isImage(item.video_link)"
              :src="item.video_link"
              :alt="item.video_name"
              loading="lazy"
              @error="handleImageError"
            />
            <span v-else class="sd-media__video">
              <video :src="item.video_link" preload="metadata" @error="handleVideoError" />
              <el-icon class="sd-media__play" :size="40"><VideoPlay /></el-icon>
            </span>
          </button>
          <div class="sd-media__info">
            <span class="sd-media__name" :title="item.video_name">{{ item.video_name }}</span>
            <div class="sd-media__meta">
              <el-tag
                size="small"
                effect="plain"
                :type="isImage(item.video_link) ? 'success' : 'warning'"
              >
                {{ isImage(item.video_link) ? $t('Rasm') : $t('Video') }}
              </el-tag>
              <span>{{ formatDate(item.created_at || item.createdAt) }}</span>
              <el-button
                class="sd-media__del"
                link
                type="danger"
                :icon="Delete"
                :loading="deletingIds.includes(item.id)"
                :aria-label="$t('delete')"
                @click="deleteMedia(item)"
              />
            </div>
          </div>
        </article>
      </div>
    </UiPanel>

    <!-- Ko'rish oynasi -->
    <el-dialog
      v-model="modalVisible"
      :title="selectedMedia?.video_name || 'Media'"
      width="90%"
      top="3vh"
      append-to-body
      :fullscreen="isFullscreen"
    >
      <template #header>
        <div class="sd-modal__head">
          <span class="sd-modal__title">{{ selectedMedia?.video_name }}</span>
          <div class="sd-modal__actions">
            <el-button
              :icon="isFullscreen ? 'Minus' : 'FullScreen'"
              circle
              @click="toggleFullscreen"
            />
            <a
              v-if="selectedMedia"
              :href="selectedMedia.video_link"
              target="_blank"
              download
              @click.stop
            >
              <el-button circle :icon="Download" />
            </a>
          </div>
        </div>
      </template>

      <div class="sd-modal__body">
        <img
          v-if="selectedMedia && isImage(selectedMedia.video_link)"
          :src="selectedMedia.video_link"
          :alt="selectedMedia.video_name"
          @error="handleImageError"
        />
        <video
          v-else-if="selectedMedia"
          :src="selectedMedia.video_link"
          controls
          autoplay
          @error="handleVideoError"
        >
          {{ $t('yourbrowsersupportvideotag') }}
        </video>
      </div>

      <template #footer>
        <div class="sd-modal__foot">
          <span class="sd-hint">
            {{ $t('malumotkiritilganvaqt') }}: {{ formatDate(selectedMedia?.created_at || selectedMedia?.createdAt) }}
          </span>
          <el-button
            type="danger"
            plain
            :icon="Delete"
            :loading="deletingIds.includes(selectedMedia?.id)"
            @click="deleteMedia(selectedMedia)"
          >
            {{ $t('delete') }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </UiPage>
</template>

<script setup lang="ts">
import type { UploadInstance, UploadFile } from 'element-plus'
import {
  ArrowLeft,
  Delete,
  Download,
  Location,
  UploadFilled,
  VideoPlay,
} from '@element-plus/icons-vue'
import router from '@/router'
import checkInOutApi from '@/api/checkInOut'
import UiPage from '@/components/ui/UiPage.vue'
import UiPanel from '@/components/ui/UiPanel.vue'
import UiInfoList from '@/components/ui/UiInfoList.vue'
import { formatDateTime, formatSpan } from '@/utils/format'
import { useVideosStore } from '@/stores/videos'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute } from 'vue-router'
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const videosStore = useVideosStore()
const route = useRoute()
const { t } = useI18n()
const cloudName = 'dne7ddv2a'
const uploadPreset = 'erp_climavent_uploads'
const cloudinaryUrl = computed(() => `https://api.cloudinary.com/v1_1/${cloudName}/upload`)

const uploadData = ref({
  upload_preset: uploadPreset,
  folder: 'website-uploads',
  tags: 'user-upload,media',
})

const acceptedTypes = '.jpg,.jpeg,.png,.gif,.mp4,.webm,.mov,.avi,.mkv'
const uploadRef = ref<UploadInstance>()
const uploading = ref(false)
const loading = ref(true)
const activeFilter = ref('all')
const existingMedia = ref<any[]>([])
const deletingIds = ref<number[]>([])
const modalVisible = ref(false)
const selectedMedia = ref<any>(null)
const isFullscreen = ref(false)

const uploadedMediaData = ref<any[]>([])

// Computed properties for filtering
const filteredMedia = computed(() => {
  if (activeFilter.value === 'all') {
    return existingMedia.value
  }
  return existingMedia.value.filter((item) => {
    const isImg = isImage(item.video_link)
    return activeFilter.value === 'image' ? isImg : !isImg
  })
})

const imageCount = computed(
  () => existingMedia.value.filter((item) => isImage(item.video_link)).length,
)

const videoCount = computed(
  () => existingMedia.value.filter((item) => !isImage(item.video_link)).length,
)

// Helper function to determine if URL is an image
const isImage = (url: string) => {
  if (!url) return false
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']
  return imageExtensions.some((ext) => url.toLowerCase().includes(ext))
}

const beforeUpload = (file: File) => {
  const isValidType = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
  ].includes(file.type)

  const isValidSize = file.size / 1024 / 1024 < 200

  if (!isValidType) {
    ElMessage.error('Faqat rasm va video fayllar qabul qilinadi!')
    return false
  }
  if (!isValidSize) {
    ElMessage.error("Fayl hajmi 200MB dan kam bo'lishi kerak!")
    return false
  }
  return true
}

const handleSuccess = (response: any, file: UploadFile) => {
  const mediaData = {
    url: response.secure_url,
    public_id: response.public_id,
    resource_type: response.resource_type,
    format: response.format,
    filename: file.name,
    size: response.bytes,
    width: response.width,
    height: response.height,
  }
  uploadedMediaData.value.push(mediaData)
  saveMediaToDatabase(mediaData)
}

const handleError = (error: any, file: UploadFile) => {
  console.error('Upload failed:', error)
  ElMessage.error(`${file.name} yuklashda xatolik yuz berdi!`)
}

const submitUpload = () => {
  if (!uploadRef.value) {
    ElMessage.warning('Iltimos, avval fayl tanlang!')
    return
  }

  uploading.value = true
  uploadRef.value.submit()

  setTimeout(() => {
    uploading.value = false
  }, 3000)
}

// Function to save media info to your database
const saveMediaToDatabase = async (mediaData: any) => {
  try {
    const payload = {
      video_link: mediaData.url,
      video_name: mediaData.filename,
      user_id: Number(localStorage.getItem('userid')),
      comeandgo_id: Number(route.params.id),
    }

    const response = await videosStore.createVideo(payload)

    if (!response) {
      throw new Error('Failed to save media info')
    } else {
      ElMessage.success('Muvaffaqiyatli yuklandi!')
      await loadExistingMedia()
      // Clear upload list
      uploadRef.value?.clearFiles()
    }
  } catch (error) {
    console.error('Failed to save media info:', error)
    ElMessage.error("Ma'lumotlar bazasida saqlashda xatolik!")
  }
}

// Load existing media from database
const loadExistingMedia = async () => {
  try {
    loading.value = true
    const response = await videosStore.getVideosOfAObyekt(route.params.id)
    existingMedia.value = response || []
  } catch (error) {
    console.error('Failed to load existing media:', error)
    ElMessage.error('Mavjud media fayllarni yuklashda xatolik!')
  } finally {
    loading.value = false
  }
}

// Delete media function
const deleteMedia = async (item: any) => {
  if (!item || !item.id) {
    ElMessage.error('Xatolik: Media topilmadi!')
    return
  }

  try {
    await ElMessageBox.confirm(t('confirmDelete'), t('confirmation'), {
      confirmButtonText: t('deleteConfirm'),
      cancelButtonText: t('cancel'),
      type: 'warning',
    })

    deletingIds.value.push(item.id)

    const success = await videosStore.deleteVideo(item.id)

    if (success) {
      existingMedia.value = existingMedia.value.filter((media) => media.id !== item.id)
      ElMessage.success("Fayl muvaffaqiyatli o'chirildi!")
      // Close modal if currently viewing deleted item
      if (selectedMedia.value?.id === item.id) {
        modalVisible.value = false
      }
    } else {
      throw new Error('Delete failed')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete media:', error)
      ElMessage.error("Faylni o'chirishda xatolik!")
    }
  } finally {
    deletingIds.value = deletingIds.value.filter((id) => id !== item.id)
  }
}

// Open modal for full screen view
const openModal = (media: any) => {
  if (!media) return
  selectedMedia.value = media
  modalVisible.value = true
  isFullscreen.value = false
}

// Toggle fullscreen
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

const formatDate = (value?: string) => formatDateTime(value)

// Error handlers
const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  console.error('Image failed to load:', target.src)
  // Show placeholder or error message
  target.alt = 'Rasm yuklanmadi'
}

const handleVideoError = (event: Event) => {
  const target = event.target as HTMLVideoElement
  console.error('Video failed to load:', target.src)
  ElMessage.warning('Video yuklanmadi')
}

const getUploadedMediaData = () => {
  return uploadedMediaData.value
}

defineExpose({
  getUploadedMediaData,
})

// ─── Tashrif ma'lumoti ────────────────────────────────────
const visit = ref<any>(null)
const visitLoading = ref(true)

async function loadVisit() {
  visitLoading.value = true
  try {
    const res: any = await checkInOutApi.getOne(route.params.id)
    const item = res?.data || res
    visit.value = item?.comeAndGoInsides?.[0] || null
  } catch {
    visit.value = null
  } finally {
    visitLoading.value = false
  }
}

const visitItems = computed(() => {
  const v = visit.value || {}
  const dt = (x?: string) => (x ? formatDateTime(x) : '')
  return [
    { key: 'whereto', label: t('qayerga'), value: v.whereto },
    { key: 'company', label: t('kompaniyaNomi'), value: v.company_name },
    { key: 'gone', label: t('ketilganvaqt'), value: dt(v.when_gone) },
    { key: 'came', label: t('kelganvaqt'), value: dt(v.when_came) },
    { key: 'span', label: t('siteDuration'), value: formatSpan(v.when_gone, v.when_came, t) },
    { key: 'contract', label: t('shartnomaKp'), value: v.dogovor_or_kp },
    { key: 'location', label: t('joylashuv'), value: v.locationname },
    { key: 'created', label: t('malumotkiritilganvaqt'), value: dt(v.createdAt) },
  ]
})

onMounted(async () => {
  await Promise.all([loadVisit(), loadExistingMedia()])
})
</script>

<style scoped>
.sd-back {
  align-self: flex-start;
  margin-bottom: 2px;
  color: var(--ui-muted);
}
.sd-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--ui-ink);
}
.sd-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
  gap: 16px;
  align-items: start;
}
.sd-count {
  margin-left: 4px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
  color: var(--ui-muted);
  background: var(--ui-line-soft);
  border-radius: 999px;
}
.sd-hint {
  font-size: 12px;
  color: var(--ui-muted);
}

/* Yuklash maydoni */
.sd-upload :deep(.el-upload--picture-card) {
  display: block;
  width: 100%;
  height: auto;
  border: none;
  background: none;
}
.sd-upload :deep(.el-upload-dragger) {
  width: 100%;
  padding: 22px 16px;
  border-radius: var(--ui-radius);
  background: var(--ui-surface-2);
}
.sd-upload :deep(.el-upload-list--picture-card) {
  gap: 8px;
}
.sd-upload__icon {
  font-size: 36px;
  color: var(--ui-faint);
}
.sd-upload__text {
  font-size: 13px;
  color: var(--ui-muted);
}
.sd-upload__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

/* Galereya */
.sd-media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}
.sd-media {
  border: 1px solid var(--ui-line);
  border-radius: var(--ui-radius);
  overflow: hidden;
  background: var(--ui-surface);
}
.sd-media__thumb {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  padding: 0;
  border: none;
  background: var(--ui-surface-2);
  cursor: zoom-in;
}
.sd-media__thumb img,
.sd-media__thumb video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.sd-media__video {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
}
.sd-media__play {
  position: absolute;
  inset: 0;
  margin: auto;
  color: white;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4));
}
.sd-media__info {
  padding: 8px 10px 10px;
}
.sd-media__name {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--ui-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sd-media__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  font-size: 12px;
  color: var(--ui-muted);
}
.sd-media__del {
  margin-left: auto;
}

/* Ko'rish oynasi */
.sd-modal__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.sd-modal__title {
  font-weight: 600;
  color: var(--ui-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sd-modal__actions {
  display: flex;
  gap: 8px;
}
.sd-modal__body {
  display: flex;
  justify-content: center;
  background: #0b0f17;
  border-radius: var(--ui-radius);
}
.sd-modal__body img,
.sd-modal__body video {
  max-width: 100%;
  max-height: 75vh;
  object-fit: contain;
}
.sd-modal__foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

@media (max-width: 1000px) {
  .sd-grid {
    grid-template-columns: 1fr;
  }
}
</style>
