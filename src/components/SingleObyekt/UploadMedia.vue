<template>
  <div class="container">
    <div class="title">
      <h2>Rasm va videolar</h2>
      <h3>Ushbu obyektga aloqador rasm va videolar</h3>
    </div>

    <div class="media">
      <el-upload
        ref="uploadRef"
        class="upload-demo"
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
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          Faylni bu yerga tashlang yoki <em>yuklash uchun bosing</em>
        </div>
      </el-upload>
    </div>
    <div class="uploadbtn">
      <el-button type="primary" @click="submitUpload()" :loading="uploading" size="large">
        {{ uploading ? 'Yuklanmoqda...' : 'Yuklash' }}
      </el-button>
    </div>

    <!-- Gallery Section -->
    <div class="gallery-section" v-if="existingMedia.length > 0">
      <div class="gallery-header">
        <h3>Yuklangan media fayllar</h3>
        <div class="filter-tabs">
          <el-button
            :type="activeFilter === 'all' ? 'primary' : 'default'"
            @click="setFilter('all')"
            size="small"
          >
            Hammasi ({{ existingMedia.length }})
          </el-button>
          <el-button
            :type="activeFilter === 'image' ? 'primary' : 'default'"
            @click="setFilter('image')"
            size="small"
          >
            Rasmlar ({{ imageCount }})
          </el-button>
          <el-button
            :type="activeFilter === 'video' ? 'primary' : 'default'"
            @click="setFilter('video')"
            size="small"
          >
            Videolar ({{ videoCount }})
          </el-button>
        </div>
      </div>

      <div class="media-grid">
        <div v-for="item in filteredMedia" :key="item.id" class="media-item">
          <div class="media-content" @click="openModal(item)">
            <img
              v-if="isImage(item.video_link)"
              :src="item.video_link"
              :alt="item.video_name"
              @error="handleImageError"
            />
            <div v-else class="video-container">
              <video :src="item.video_link" preload="metadata" @error="handleVideoError" />
              <div class="play-overlay">
                <el-icon :size="50">
                  <VideoPlay />
                </el-icon>
              </div>
            </div>

            <div class="media-overlay" @click.stop>
              <el-button
                type="danger"
                size="small"
                circle
                @click.stop="deleteMedia(item)"
                :loading="deletingIds.includes(item.id)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>

          <div class="media-info">
            <h4 :title="item.video_name">{{ item.video_name }}</h4>
            <div class="media-meta">
              <el-tag :type="isImage(item.video_link) ? 'success' : 'warning'" size="small">
                {{ isImage(item.video_link) ? 'Rasm' : 'Video' }}
              </el-tag>
              <span class="upload-date">
                {{ formatDate(item.created_at) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Modal -->
    <el-dialog
      v-model="modalVisible"
      :title="selectedMedia?.video_name || 'Media'"
      width="95%"
      top="2vh"
      :close-on-click-modal="true"
      :close-on-press-escape="true"
      class="media-modal"
      :fullscreen="isFullscreen"
    >
      <template #header>
        <div class="modal-header">
          <span class="modal-title">{{ selectedMedia?.video_name }}</span>
          <div class="modal-actions">
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
              <el-button circle>
                <el-icon><Download /></el-icon>
              </el-button>
            </a>
          </div>
        </div>
      </template>

      <div class="modal-content">
        <img
          v-if="selectedMedia && isImage(selectedMedia.video_link)"
          :src="selectedMedia.video_link"
          :alt="selectedMedia.video_name"
          class="modal-image"
          @error="handleImageError"
        />
        <video
          v-else-if="selectedMedia"
          :src="selectedMedia.video_link"
          controls
          autoplay
          class="modal-video"
          @error="handleVideoError"
        >
          Brauzeringiz videoni qo'llab-quvvatlamaydi.
        </video>
      </div>

      <template #footer>
        <div class="modal-footer">
          <div class="media-details">
            <el-tag :type="isImage(selectedMedia?.video_link) ? 'success' : 'warning'">
              {{ isImage(selectedMedia?.video_link) ? 'Rasm' : 'Video' }}
            </el-tag>
            <span class="upload-date">
              Yuklangan: {{ formatDate(selectedMedia?.created_at) }}
            </span>
          </div>
          <el-button
            type="danger"
            @click="deleteMedia(selectedMedia)"
            :loading="deletingIds.includes(selectedMedia?.id)"
          >
            <el-icon><Delete /></el-icon>
            O'chirish
          </el-button>
        </div>
      </template>
    </el-dialog>

    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="3" animated />
      <p>Media fayllar yuklanmoqda...</p>
    </div>

    <div v-if="!loading && existingMedia.length === 0" class="empty-state">
      <el-empty description="Hali media fayllar yuklanmagan">
        <el-button type="primary" @click="() => uploadRef?.focus()">
          Birinchi faylni yuklash
        </el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UploadInstance, UploadFile } from 'element-plus'
import { UploadFilled, Delete, VideoPlay, Download } from '@element-plus/icons-vue'
import { useVideosStore } from '@/stores/videos'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute } from 'vue-router'
import { ref, computed, onMounted } from 'vue'

const videosStore = useVideosStore()
const route = useRoute()
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
    await ElMessageBox.confirm(
      `"${item.video_name}" faylni o'chirishni istaysizmi?`,
      'Tasdiqlash',
      {
        confirmButtonText: "O'chirish",
        cancelButtonText: 'Bekor qilish',
        type: 'warning',
      },
    )

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

// Filter functions
const setFilter = (filter: string) => {
  activeFilter.value = filter
}

// Format date function
const formatDate = (dateString: string) => {
  if (!dateString) return "Noma'lum"
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch (error) {
    return "Noma'lum"
  }
}

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

onMounted(async () => {
  await loadExistingMedia()
})
</script>

<style lang="scss" scoped>
.container {
  margin-bottom: 50px;
  padding: 0 16px;
}

.title {
  text-align: center;
  margin: 40px 0 30px;

  h2 {
    font-weight: 600;
    font-size: 28px;
    color: #303133;
    margin-bottom: 8px;
  }

  h3 {
    font-weight: 400;
    font-size: 16px;
    color: #606266;
  }
}

.media {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 30px;

  .upload-demo {
    width: 100%;
    max-width: 600px;
  }
}

.uploadbtn {
  display: flex;
  justify-content: center;
  margin-top: 30px;

  .el-button {
    padding: 14px 40px;
    font-size: 16px;
  }
}

.gallery-section {
  margin-top: 60px;
  padding: 30px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 15px;

  h3 {
    font-size: 20px;
    font-weight: 600;
    color: #303133;
    margin: 0;
  }

  .filter-tabs {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.media-item {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);

    .media-overlay {
      opacity: 1;
    }
  }

  .media-content {
    position: relative;
    width: 100%;
    height: 240px;
    overflow: hidden;
    cursor: pointer;
    background: #f5f5f5;

    img,
    .video-container {
      width: 100%;
      height: 100%;
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    img {
      object-fit: cover;
    }

    .video-container {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #000;

      video {
        width: 100%;
        height: 100%;
        object-fit: cover;
        pointer-events: none;
      }

      .play-overlay {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(64, 158, 255, 0.9);
        border-radius: 50%;
        width: 70px;
        height: 70px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        pointer-events: none;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);

        .el-icon {
          color: white;
          font-size: 32px;
        }
      }
    }

    &:hover {
      img {
        transform: scale(1.08);
      }

      .video-container {
        transform: scale(1.05);

        .play-overlay {
          background: rgba(64, 158, 255, 1);
          transform: translate(-50%, -50%) scale(1.15);
        }
      }
    }

    .media-overlay {
      position: absolute;
      top: 12px;
      right: 12px;
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 10;

      .el-button {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

        &:hover {
          background: #f56c6c;
          color: white;
        }
      }
    }
  }

  .media-info {
    padding: 16px 18px;

    h4 {
      margin: 0 0 12px 0;
      font-size: 15px;
      font-weight: 500;
      color: #303133;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.4;
    }

    .media-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;

      .upload-date {
        color: #909399;
        font-size: 12px;
      }
    }
  }
}

// Modal styles
:deep(.media-modal) {
  .el-dialog__header {
    padding: 20px 24px;
    background: linear-gradient(135deg, #409eff 0%, #5cadff 100%);
    margin: 0;
  }

  .el-dialog__body {
    padding: 0;
    background: #000;
  }

  .el-dialog__footer {
    padding: 16px 24px;
    background: #f8f9fa;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  .modal-title {
    color: white;
    font-weight: 600;
    font-size: 18px;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .modal-actions {
    display: flex;
    gap: 8px;

    .el-button {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: none;

      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    }

    a {
      text-decoration: none;
    }
  }
}

.modal-content {
  width: 100%;
  max-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;

  .modal-image,
  .modal-video {
    max-width: 100%;
    max-height: 80vh;
    object-fit: contain;
  }
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .media-details {
    display: flex;
    gap: 12px;
    align-items: center;

    .upload-date {
      color: #606266;
      font-size: 14px;
    }
  }
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;

  p {
    margin-top: 20px;
    font-size: 14px;
  }
}

// Responsive design
@media (max-width: 768px) {
  .container {
    padding: 0 12px;
  }

  .title {
    margin: 30px 0 20px;

    h2 {
      font-size: 22px;
    }

    h3 {
      font-size: 14px;
    }
  }

  .media {
    .upload-demo {
      width: 100%;
    }
  }

  .gallery-section {
    padding: 20px 16px;
    margin-top: 40px;
  }

  .gallery-header {
    flex-direction: column;
    align-items: stretch;

    .filter-tabs {
      justify-content: center;
    }
  }

  .media-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .modal-header {
    .modal-title {
      font-size: 16px;
    }
  }

  .modal-footer {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;

    .el-button {
      width: 100%;
    }
  }
}
</style>
