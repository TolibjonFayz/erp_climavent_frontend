<template>
  <div class="container">
    <div class="title">
      <h2>Rasm va videolar</h2>
      <h3>Ushbu obyektga aloqador rasm va videolar</h3>
    </div>

    <!-- Upload Section -->
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
      <el-button type="primary" @click="submitUpload()" :loading="uploading">
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
          <div class="media-content">
            <img
              v-if="isImage(item.video_link)"
              :src="item.video_link"
              :alt="item.video_name"
              @error="handleImageError"
              @click="openModal(item)"
              class="clickable-media"
            />
            <div v-else class="video-container" @click="openModal(item)">
              <video
                :src="item.video_link"
                muted
                preload="metadata"
                @error="handleVideoError"
                class="video-thumbnail"
              />
              <div class="play-overlay">
                <el-icon size="40px" color="white">
                  <VideoPlay />
                </el-icon>
              </div>
            </div>

            <div class="media-overlay">
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
            <h4>{{ item.video_name }}</h4>
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

    <!-- Full Screen Modal -->
    <el-dialog
      v-model="modalVisible"
      :title="selectedMedia?.video_name || 'Media'"
      width="90%"
      top="5vh"
      :close-on-click-modal="true"
      :close-on-press-escape="true"
      class="media-modal"
    >
      <div class="modal-content">
        <img
          v-if="selectedMedia && isImage(selectedMedia.video_link)"
          :src="selectedMedia.video_link"
          :alt="selectedMedia.video_name"
          class="modal-image"
        />
        <video
          v-else-if="selectedMedia"
          :src="selectedMedia.video_link"
          controls
          autoplay
          class="modal-video"
        />
      </div>
    </el-dialog>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="3" animated />
      <p>Media fayllar yuklanmoqda...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UploadInstance, UploadFile } from 'element-plus'
import { UploadFilled, Delete, VideoPlay } from '@element-plus/icons-vue'
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
    'video/mov',
    'video/avi',
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
  if (!uploadRef.value) return

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
      ElMessage.success(`Muvaffaqiyatli yuklandi!`)
      // Refresh the media list instead of reloading the page
      await loadExistingMedia()
    }
  } catch (error) {
    console.error('Failed to save media info:', error)
    ElMessage.warning("Fayl yuklandi, lekin ma'lumotlar bazasida saqlanmadi")
  }
}

// Modal styles
// :deep(.media-modal) {
//   .el-dialog {
//     max-height: 90vh;

//     .el-dialog__body {
//       padding: 0;
//       max-height: 80vh;
//       overflow: hidden;
//     }
//   }
// }

// .modal-content {
//   display: flex;
//   justify-content: center;
//   align-items: center;
//   max-height: 80vh;
//   background: #000;
//   border-radius: 8px;
//   overflow: hidden;

//   .modal-image {
//     max-width: 100%;
//     max-height: 80vh;
//     object-fit: contain;
//     display: block;
//   }

//   .modal-video {
//     width: 100%;
//     max-height: 80vh;
//     object-fit: contain;
//     display: block;
//   }
// }

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

    // Call your store's delete method
    const success = await videosStore.deleteVideo(item.id)

    if (success) {
      existingMedia.value = existingMedia.value.filter((media) => media.id !== item.id)
      ElMessage.success("Fayl muvaffaqiyatli o'chirildi!")
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
  selectedMedia.value = media
  modalVisible.value = true
}

// Filter functions
const setFilter = (filter: string) => {
  activeFilter.value = filter
}

// Format date function
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Error handlers
const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  console.error('Image failed to load:', target.src)
  target.style.display = 'none'
}

const handleVideoError = (event: Event) => {
  const target = event.target as HTMLVideoElement
  console.error('Video failed to load:', target.src)
  target.style.display = 'none'
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
}

.title {
  text-align: center;
  margin: 30px 0;

  h2 {
    font-weight: 600;
    font-size: 22px;
  }

  h3 {
    font-weight: 500;
    font-size: 16px;
  }
}

.media {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 30px;

  .upload-demo {
    width: 52%;
  }
}

.uploadbtn {
  display: flex;
  justify-content: center;
  margin-top: 100px;
}

.gallery-section {
  margin-top: 60px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 15px;

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin: 0;
  }

  .filter-tabs {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.media-item {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);

    .media-overlay {
      opacity: 1;
    }
  }

  .media-content {
    position: relative;
    width: 100%;
    height: 200px;
    overflow: hidden;
    cursor: pointer;

    img,
    .video-container {
      width: 100%;
      height: 100%;
      transition: transform 0.3s ease;
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

      .video-thumbnail {
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
        background: rgba(0, 0, 0, 0.6);
        border-radius: 50%;
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        pointer-events: none;
      }
    }

    &:hover {
      img,
      .video-container {
        transform: scale(1.05);
      }

      .play-overlay {
        background: rgba(0, 0, 0, 0.8);
        transform: translate(-50%, -50%) scale(1.1);
      }
    }

    .clickable-media {
      cursor: pointer;
    }

    .media-overlay {
      position: absolute;
      top: 10px;
      right: 10px;
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 10;
    }
  }

  .media-info {
    padding: 15px;

    h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 500;
      color: #333;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .media-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .upload-date {
        color: #666;
        font-size: 12px;
      }
    }
  }
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #666;

  p {
    margin-top: 20px;
    font-size: 14px;
  }
}

// Responsive design
@media (max-width: 768px) {
  .media {
    .upload-demo {
      width: 90%;
    }
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
    gap: 15px;
  }
}
</style>
