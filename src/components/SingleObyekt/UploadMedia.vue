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
      <el-button type="primary" @click="submitUpload()" :loading="uploading">
        {{ uploading ? 'Yuklanmoqda...' : 'Yuklash' }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UploadInstance, UploadFile } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { useVideosStore } from '@/stores/videos'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'
import { ref, computed } from 'vue'

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

const uploadedMediaData = ref<any[]>([])

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
      setTimeout(() => {
        location.reload()
      }, 3000)
    }
  } catch (error) {
    console.error('Failed to save media info:', error)
    ElMessage.warning("Fayl yuklandi, lekin ma'lumotlar bazasida saqlanmadi")
  }
}

const getUploadedMediaData = () => {
  return uploadedMediaData.value
}

defineExpose({
  getUploadedMediaData,
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
</style>
