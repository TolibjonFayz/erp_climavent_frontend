<template>
  <div class="container">
    <div class="header-row">
      <el-icon @click="goback()"><Back /></el-icon>
      <h2>{{ $t('yangiObyektQoshish') }}</h2>
    </div>

    <!-- ASOSIY OBYEKT -->
    <el-form :model="form" label-width="auto" class="form">
      <div class="form-section-title">{{ $t('asosiyObyekt') }}</div>

      <el-form-item :label="$t('obyektgaKetishVaqti')">
        <el-config-provider :locale="locale">
          <el-date-picker
            v-model="form.goingtime"
            type="datetime"
            :placeholder="$t('vaqtniTanlang')"
            :disabled-date="disabledDate"
            class="full-width-picker"
          />
        </el-config-provider>
      </el-form-item>

      <el-form-item :label="$t('qayerga')">
        <el-select v-model="form.where" :placeholder="$t('tanlang')" class="full-width-select">
          <el-option :label="$t('zavod')" value="Zavod" />
          <el-option :label="$t('klient')" value="Klient" />
          <el-option :label="$t('shaxsiy')" value="Shaxsiy" />
          <el-option :label="$t('boshqa')" value="boshqa" />
        </el-select>
        <el-input
          v-if="isWhereBoshqa"
          class="whereotherinput"
          v-model="form.whereother"
          :placeholder="$t('whereotherplaceholder')"
        />
      </el-form-item>

      <el-form-item :label="$t('kpYokiDogovor')">
        <el-select
          v-model="form.dogovororkp"
          :placeholder="$t('tanlang')"
          class="full-width-select"
        >
          <el-option :label="$t('kp')" value="KP" />
          <el-option :label="$t('dogovor')" value="Dogovor" />
          <el-option :label="$t('boshqa')" value="boshqa" />
        </el-select>
        <el-input
          v-if="isDogoKpNotSelected"
          class="whereotherinput"
          :rows="2"
          v-model="form.dogokpother"
          :placeholder="$t('whereother2placeholder')"
          type="textarea"
        />
      </el-form-item>

      <el-form-item :label="$t('dogovorRaqami')" v-if="isDogovorSelected">
        <el-input
          v-model="form.dogovornumber"
          :placeholder="$t('Kiriting')"
          class="full-width-input"
        />
      </el-form-item>

      <el-form-item :label="$t('kpRaqami')" v-if="isKPSelected">
        <el-input v-model="form.kpnumber" :placeholder="$t('Kiriting')" class="full-width-input" />
      </el-form-item>

      <el-form-item v-if="isDogovorSelected" :label="$t('dogovorSanasi')">
        <el-config-provider :locale="locale">
          <el-date-picker
            v-model="form.dogovortime"
            type="date"
            :placeholder="$t('vaqtniTanlang')"
            size="default"
            class="full-width-picker"
          />
        </el-config-provider>
      </el-form-item>

      <el-form-item v-if="isKPSelected" :label="$t('kpSanasi')">
        <el-config-provider :locale="locale">
          <el-date-picker
            v-model="form.kptime"
            type="date"
            :placeholder="$t('vaqtniTanlang')"
            size="default"
            class="full-width-picker"
          />
        </el-config-provider>
      </el-form-item>

      <el-form-item v-if="isKPSelected || isDogovorSelected" :label="$t('firmaNomi')">
        <el-input v-model="form.firmanomi" :placeholder="$t('Kiriting')" class="full-width-input" />
      </el-form-item>

      <span class="location-picker-label">{{ $t('obyektjoylashuvinikiriting') }} 👇</span>
      <LocationPicker
        access-token="pk.eyJ1IjoidG9saWJqb25mYXl6IiwiYSI6ImNtY2x6amdkczBoZG0ya3NkYTI2NW8waWMifQ.yM3o-yj1ZPUGJG-gWREK6Q"
        :initial-center="{ lng: -74.006, lat: 40.7128 }"
        :initial-zoom="12"
        @location-selected="handleLocationSelected"
        @current-location="handleLocationSelected"
        @link-parsed="handleLocationSelected"
      />

      <el-input
        class="more-info-input"
        :rows="3"
        v-model="form.more_info"
        :placeholder="$t('qoshimchamalumotlarUchunJoy')"
        type="textarea"
      />

      <!-- MEDIA UPLOAD SECTION - INTEGRATED -->
      <div class="upload-media-section">
        <div class="section-header">
          <h3>{{ $t('rasmvavideolar') }}</h3>
          <p class="section-description">{{ $t('obyektgaRasmVaVideolar') }}</p>
        </div>

        <el-upload
          ref="uploadRef"
          class="upload-area"
          drag
          :action="cloudinaryUrl"
          :data="uploadData"
          multiple
          :auto-upload="false"
          :before-upload="beforeUpload"
          :on-success="handleUploadSuccess"
          :on-error="handleUploadError"
          :accept="acceptedTypes"
          list-type="picture-card"
          :limit="10"
          v-model:file-list="mediaFileList"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            {{ $t('mediauloadbtn') }}
            <template v-if="mediaFileList.length > 0">
              <br />
              <span class="file-count">{{ mediaFileList.length }} fayl tanlandi</span>
            </template>
          </div>
        </el-upload>

        <div v-if="mediaFileList.length > 0" class="upload-info">
          <el-alert
            :title="`${mediaFileList.length} ta fayl yuklashga tayyor`"
            type="info"
            :closable="false"
            show-icon
          />
        </div>
      </div>
    </el-form>

    <!-- QO'SHIMCHA OBYEKTLAR -->
    <div v-for="(obj, index) in additionalObjects" :key="index" class="additional-object-section">
      <el-form :model="obj" label-width="auto" class="form">
        <div class="form-section-header">
          <div class="form-section-title">{{ $t('qoshimchaObyekt') }} #{{ index + 1 }}</div>
          <el-button
            type="danger"
            size="small"
            :icon="Delete"
            circle
            @click="removeAdditionalObject(index)"
          />
        </div>

        <el-form-item :label="$t('obyektgaKetishVaqti')">
          <el-config-provider :locale="locale">
            <el-date-picker
              v-model="obj.goingtime"
              type="datetime"
              :placeholder="$t('vaqtniTanlang')"
              :disabled-date="disabledDate"
              class="full-width-picker"
            />
          </el-config-provider>
        </el-form-item>

        <el-form-item :label="$t('qayerga')">
          <el-select v-model="obj.where" :placeholder="$t('tanlang')" class="full-width-select">
            <el-option :label="$t('zavod')" value="Zavod" />
            <el-option :label="$t('klient')" value="Klient" />
            <el-option :label="$t('shaxsiy')" value="Shaxsiy" />
            <el-option :label="$t('boshqa')" value="boshqa" />
          </el-select>
          <el-input
            v-if="obj.where === 'boshqa'"
            class="whereotherinput"
            v-model="obj.whereother"
            :placeholder="$t('whereotherplaceholder')"
          />
        </el-form-item>

        <el-form-item :label="$t('kpYokiDogovor')">
          <el-select
            v-model="obj.dogovororkp"
            :placeholder="$t('tanlang')"
            class="full-width-select"
          >
            <el-option :label="$t('kp')" value="KP" />
            <el-option :label="$t('dogovor')" value="Dogovor" />
            <el-option :label="$t('boshqa')" value="boshqa" />
          </el-select>
          <el-input
            v-if="obj.dogovororkp === 'boshqa'"
            class="whereotherinput"
            :rows="2"
            v-model="obj.dogokpother"
            :placeholder="$t('whereother2placeholder')"
            type="textarea"
          />
        </el-form-item>

        <el-form-item :label="$t('dogovorRaqami')" v-if="obj.dogovororkp === 'Dogovor'">
          <el-input
            v-model="obj.dogovornumber"
            :placeholder="$t('Kiriting')"
            class="full-width-input"
          />
        </el-form-item>

        <el-form-item :label="$t('kpRaqami')" v-if="obj.dogovororkp === 'KP'">
          <el-input v-model="obj.kpnumber" :placeholder="$t('Kiriting')" class="full-width-input" />
        </el-form-item>

        <el-form-item v-if="obj.dogovororkp === 'Dogovor'" :label="$t('dogovorSanasi')">
          <el-config-provider :locale="locale">
            <el-date-picker
              v-model="obj.dogovortime"
              type="date"
              :placeholder="$t('vaqtniTanlang')"
              size="default"
              class="full-width-picker"
            />
          </el-config-provider>
        </el-form-item>

        <el-form-item v-if="obj.dogovororkp === 'KP'" :label="$t('kpSanasi')">
          <el-config-provider :locale="locale">
            <el-date-picker
              v-model="obj.kptime"
              type="date"
              :placeholder="$t('vaqtniTanlang')"
              size="default"
              class="full-width-picker"
            />
          </el-config-provider>
        </el-form-item>

        <el-form-item
          v-if="obj.dogovororkp === 'KP' || obj.dogovororkp === 'Dogovor'"
          :label="$t('firmaNomi')"
        >
          <el-input
            v-model="obj.firmanomi"
            :placeholder="$t('Kiriting')"
            class="full-width-input"
          />
        </el-form-item>

        <span class="location-picker-label">{{ $t('obyektjoylashuvinikiriting') }} 👇</span>
        <LocationPicker
          access-token="pk.eyJ1IjoidG9saWJqb25mYXl6IiwiYSI6ImNtY2x6amdkczBoZG0ya3NkYTI2NW8waWMifQ.yM3o-yj1ZPUGJG-gWREK6Q"
          :initial-center="{ lng: -74.006, lat: 40.7128 }"
          :initial-zoom="12"
          @location-selected="(location) => handleAdditionalLocationSelected(index, location)"
          @current-location="(location) => handleAdditionalLocationSelected(index, location)"
          @link-parsed="(location) => handleAdditionalLocationSelected(index, location)"
        />

        <el-input
          class="more-info-input"
          :rows="3"
          v-model="obj.more_info"
          :placeholder="$t('qoshimchamalumotlarUchunJoy')"
          type="textarea"
        />
      </el-form>
    </div>

    <!-- QO'SHISH TUGMASI -->
    <div class="add-button-container" v-if="additionalObjects.length < 5">
      <el-button type="success" plain @click="addAdditionalObject" class="add-button">
        <el-icon style="margin-right: 8px"><Plus /></el-icon>
        <span class="button-text">{{ $t('yangiObyektQoshishBtn') }}</span>
        <span class="button-text-short">Qo'shimcha obyekt</span>
      </el-button>
    </div>

    <!-- SAQLASH VA ORTGA TUGMALARI -->
    <div class="button-group-container">
      <el-button :loading="loading" type="primary" @click="onSubmit">{{ $t('save') }}</el-button>
      <el-button type="warning" plain @click="goback()">{{ $t('cancel') }}</el-button>
    </div>
  </div>
</template>

<script setup>
import { useComeAndGoesStore } from '@/stores/comeandgoes'
import { useComeAndGoInsideStore } from '@/stores/comeandgoInside'
import { useVideosStore } from '@/stores/videos'
import LocationPicker from './LocationPicker.vue'
import { UploadFilled } from '@element-plus/icons-vue'
import ru from 'element-plus/dist/locale/ru.mjs'
import { reactive, ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete, Plus } from '@element-plus/icons-vue'
import router from '@/router'

const comeandgoesStore = useComeAndGoesStore()
const comeandgoInsideStore = useComeAndGoInsideStore()
const videosStore = useVideosStore()

const isDogoKpNotSelected = ref(false)
const isDogovorSelected = ref(false)
const isWhereBoshqa = ref(false)
const isKPSelected = ref(false)
const loading = ref(false)
const locale = ru

// MEDIA UPLOAD STATES
const uploadRef = ref()
const mediaFileList = ref([])
const uploadedMediaData = ref([])
const cloudName = 'dne7ddv2a'
const uploadPreset = 'erp_climavent_uploads'
const cloudinaryUrl = computed(() => `https://api.cloudinary.com/v1_1/${cloudName}/upload`)
const uploadData = ref({
  upload_preset: uploadPreset,
  folder: 'website-uploads',
  tags: 'user-upload,media',
})
const acceptedTypes = '.jpg,.jpeg,.png,.gif,.mp4,.webm,.mov,.avi,.mkv'

const form = reactive({
  goingtime: '',
  where: '',
  whereother: '',
  dogovororkp: '',
  dogokpother: '',
  dogovornumber: '',
  kpnumber: '',
  dogovortime: '',
  kptime: '',
  firmanomi: '',
  lat: '',
  lang: '',
  locationname: '',
  more_info: '',
})

const additionalObjects = ref([])

const createEmptyObject = () => ({
  goingtime: '',
  where: '',
  whereother: '',
  dogovororkp: '',
  dogokpother: '',
  dogovornumber: '',
  kpnumber: '',
  dogovortime: '',
  kptime: '',
  firmanomi: '',
  lat: '',
  lang: '',
  locationname: '',
  more_info: '',
})

const addAdditionalObject = () => {
  if (additionalObjects.value.length < 5) {
    additionalObjects.value.push(createEmptyObject())
  } else {
    ElMessage.warning("Maksimal 5 ta qo'shimcha obyekt qo'shish mumkin.")
  }
}

const removeAdditionalObject = (index) => {
  additionalObjects.value.splice(index, 1)
}

const handleLocationSelected = (location) => {
  form.lang = location.lng
  form.lat = location.lat
  form.locationname = location.address || ''
}

const handleAdditionalLocationSelected = (index, location) => {
  additionalObjects.value[index].lang = location.lng
  additionalObjects.value[index].lat = location.lat
  additionalObjects.value[index].locationname = location.address || ''
}

const disabledDate = (time) => {
  const today = new Date()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(today.getDate() - 2)
  const twoDaysLater = new Date()
  twoDaysLater.setDate(today.getDate() + 1)
  return time.getTime() < sevenDaysAgo.getTime() || time.getTime() > twoDaysLater.getTime()
}

// MEDIA UPLOAD HANDLERS
const beforeUpload = (file) => {
  console.log('🔍 Validating file:', file.name)

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

  console.log('✅ File validated:', file.name)
  return true
}

const handleUploadSuccess = (response, file) => {
  console.log('✅ Cloudinary SUCCESS:', file.name, response)

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
  console.log('📊 Total uploaded to Cloudinary:', uploadedMediaData.value.length)
}

const handleUploadError = (error, file) => {
  console.error('❌ Cloudinary upload failed:', file.name, error)
  ElMessage.error(`${file.name} yuklashda xatolik yuz berdi!`)
}

// UPLOAD MEDIA TO DATABASE
const uploadMediaToDatabase = async (comeAndGoId) => {
  console.log('💾 Starting database save...')
  console.log('💾 Media data to save:', uploadedMediaData.value)

  if (uploadedMediaData.value.length === 0) {
    console.log('ℹ️ No media to save to database')
    return { success: true, count: 0 }
  }

  try {
    const savePromises = uploadedMediaData.value.map(async (mediaData, index) => {
      const payload = {
        video_link: mediaData.url,
        video_name: mediaData.filename,
        user_id: Number(localStorage.getItem('userid')),
        comeandgo_id: comeAndGoId,
      }

      console.log(`💾 Saving media ${index + 1}/${uploadedMediaData.value.length}:`, payload)

      const result = await videosStore.createVideo(payload)

      console.log(`✅ Saved media ${index + 1}:`, result)

      return result
    })

    await Promise.all(savePromises)

    console.log('🎉 All media saved to database!')

    return {
      success: true,
      count: uploadedMediaData.value.length,
    }
  } catch (error) {
    console.error('❌ Database save failed:', error)
    throw error
  }
}

const validateObject = (obj, objectName) => {
  if (!obj.goingtime) {
    ElMessage.warning(`${objectName}: Iltimos, obyektga ketish vaqtini tanlang.`)
    return false
  }
  if (!obj.where) {
    ElMessage.warning(`${objectName}: Iltimos, qayerga ketayotganingizni tanlang.`)
    return false
  }
  if (obj.where === 'boshqa' && !obj.whereother) {
    ElMessage.warning(`${objectName}: Iltimos, boshqa qayerga ketayotganingizni kiriting.`)
    return false
  }
  if (!obj.dogovororkp) {
    ElMessage.warning(`${objectName}: Iltimos, Dogovor yoki KP ni tanlang.`)
    return false
  }
  if (obj.dogovororkp === 'boshqa' && !obj.dogokpother) {
    ElMessage.warning(`${objectName}: Iltimos, boshqa nima ekanligini kiriting.`)
    return false
  }
  if (!obj.lat || !obj.lang) {
    ElMessage.warning(`${objectName}: Iltimos, joylashuvni tanlang.`)
    return false
  }
  return true
}

const createInsidePayload = (obj) => {
  return {
    when_gone: obj.goingtime,
    whereto: obj.where === 'boshqa' ? obj.whereother : obj.where,
    dogovor_or_kp: obj.dogovororkp === 'boshqa' ? obj.dogokpother : obj.dogovororkp,
    dogovorkp_date: obj.dogovororkp === 'Dogovor' ? obj.dogovortime : obj.kptime || null,
    dogovorkp_number: obj.dogovororkp === 'Dogovor' ? obj.dogovornumber : obj.kpnumber || null,
    company_name: obj.firmanomi,
    lat: obj.lat,
    lng: obj.lang,
    locationname: obj.locationname,
    more_info: obj.more_info,
    user_id: Number(localStorage.getItem('userid')),
  }
}

const onSubmit = async () => {
  console.log('🎯 SUBMIT STARTED')
  console.log('📁 Media files selected:', mediaFileList.value.length)

  if (!validateObject(form, 'Asosiy obyekt')) {
    return
  }

  for (let i = 0; i < additionalObjects.value.length; i++) {
    if (!validateObject(additionalObjects.value[i], `Qo'shimcha obyekt #${i + 1}`)) {
      return
    }
  }

  loading.value = true

  try {
    console.log('1️⃣ Creating parent ComeAndGoes...')

    // 1. Parent obyekt yaratish
    const parentPayload = {
      user_id: Number(localStorage.getItem('userid')),
    }
    const parentResponse = await comeandgoesStore.createComeAndGoes(parentPayload)

    const comeAndGoId = parentResponse?.newCGO?.id

    console.log('✅ Parent created with ID:', comeAndGoId)

    if (!comeAndGoId) {
      throw new Error('ComeAndGoes ID olinmadi')
    }

    console.log('2️⃣ Creating main inside obyekt...')

    // 2. Main inside obyekt yaratish
    const mainInsidePayload = {
      ...createInsidePayload(form),
      come_and_go_father_id: comeAndGoId,
    }
    await comeandgoInsideStore.createComeAndGoInside(mainInsidePayload)

    console.log('✅ Main inside obyekt created')

    // 3. Qo'shimcha obyektlarni yaratish
    if (additionalObjects.value.length > 0) {
      console.log(`3️⃣ Creating ${additionalObjects.value.length} additional obyekts...`)

      for (let i = 0; i < additionalObjects.value.length; i++) {
        const additionalInsidePayload = {
          ...createInsidePayload(additionalObjects.value[i]),
          come_and_go_father_id: comeAndGoId,
        }
        await comeandgoInsideStore.createComeAndGoInside(additionalInsidePayload)
        console.log(`✅ Additional obyekt ${i + 1} created`)
      }
    }

    // 4. Media fayllarni yuklash
    let mediaUploadCount = 0

    if (mediaFileList.value.length > 0) {
      console.log('4️⃣ Media files detected:', mediaFileList.value.length)
      console.log('📤 Uploading to Cloudinary...')

      // Reset uploaded data
      uploadedMediaData.value = []

      // Trigger Cloudinary upload
      if (uploadRef.value) {
        uploadRef.value.submit()

        // Wait for Cloudinary uploads to complete
        const maxWait = 60000 // 60 seconds
        const checkInterval = 500
        let waited = 0

        while (uploadedMediaData.value.length < mediaFileList.value.length && waited < maxWait) {
          await new Promise((resolve) => setTimeout(resolve, checkInterval))
          waited += checkInterval
          console.log(
            `⏳ Waiting for Cloudinary... ${uploadedMediaData.value.length}/${mediaFileList.value.length} (${waited}ms)`,
          )
        }

        if (uploadedMediaData.value.length < mediaFileList.value.length) {
          console.warn('⚠️ Not all files uploaded to Cloudinary in time')
          ElMessage.warning(
            `Faqat ${uploadedMediaData.value.length}/${mediaFileList.value.length} media fayl yuklandi`,
          )
        } else {
          console.log('✅ All files uploaded to Cloudinary')
        }

        // Save to database
        if (uploadedMediaData.value.length > 0) {
          console.log('5️⃣ Saving media to database...')
          const dbResult = await uploadMediaToDatabase(comeAndGoId)
          mediaUploadCount = dbResult.count
          console.log('✅ Media saved to database:', mediaUploadCount)
        }
      }
    } else {
      console.log('ℹ️ No media files selected')
    }

    // Success message
    if (mediaUploadCount > 0) {
      ElMessage.success(`Barcha obyektlar va ${mediaUploadCount} ta media muvaffaqiyatli saqlandi!`)
    } else {
      ElMessage.success('Barcha obyektlar muvaffaqiyatli saqlandi!')
    }

    console.log('🎉 ALL DONE! Redirecting...')
    router.push('/obyekt')
  } catch (error) {
    console.error('❌ ERROR:', error)
    ElMessage.error('Xatolik yuz berdi: ' + (error.message || "Iltimos, qaytadan urinib ko'ring."))
  } finally {
    loading.value = false
  }
}

const goback = () => {
  router.push('/obyekt')
}

watch(
  form,
  (value) => {
    if (value.where == 'boshqa') {
      isWhereBoshqa.value = true
    } else {
      isWhereBoshqa.value = false
    }
    if (value.dogovororkp == 'KP') {
      isKPSelected.value = true
      isDogovorSelected.value = false
      isDogoKpNotSelected.value = false
    } else if (value.dogovororkp == 'Dogovor') {
      isDogovorSelected.value = true
      isKPSelected.value = false
      isDogoKpNotSelected.value = false
    } else if (value.dogovororkp == 'boshqa') {
      isDogoKpNotSelected.value = true
      isKPSelected.value = false
      isDogovorSelected.value = false
    } else {
      isKPSelected.value = false
      isDogovorSelected.value = false
      isDogoKpNotSelected.value = false
    }
  },
  { deep: true },
)
</script>

<style scoped lang="scss">
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  min-height: 100vh;
  padding: 20px;
  padding-bottom: 40px;

  @media (max-width: 768px) {
    padding: 12px;
    padding-bottom: 24px;
  }

  @media (max-width: 480px) {
    padding: 8px;
    padding-bottom: 20px;
  }
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 600px;
  margin-bottom: 18px;
  padding: 0 8px;

  @media (max-width: 768px) {
    margin-bottom: 14px;
    padding: 0 4px;
  }

  @media (max-width: 480px) {
    margin-bottom: 12px;
    padding: 0 2px;
  }
}

.header-row .el-icon {
  font-size: 22px;
  color: #222;
  cursor: pointer;
  flex-shrink: 0;

  @media (max-width: 768px) {
    font-size: 20px;
  }

  @media (max-width: 480px) {
    font-size: 18px;
  }
}

.header-row h2 {
  margin: 0;
  color: #222;
  font-weight: 600;
  letter-spacing: 0.5px;
  font-size: 22px;
  line-height: 1;
  text-align: center;
  flex-grow: 1;

  @media (max-width: 768px) {
    font-size: 20px;
  }

  @media (max-width: 480px) {
    font-size: 18px;
  }
}

.form {
  background: #fff;
  padding: 32px 40px 24px 40px;
  border-radius: 12px;
  box-shadow: 0 2px 16px 0 rgba(0, 0, 0, 0.07);
  width: 100%;
  max-width: 600px;

  @media (max-width: 768px) {
    padding: 24px 20px 18px 20px;
    border-radius: 10px;
  }

  @media (max-width: 480px) {
    padding: 20px 16px 16px 16px;
    border-radius: 8px;
  }

  .location-picker-label {
    font-size: 14px;
    display: block;
    font-weight: 400;
    margin-bottom: 10px;
    color: #606266;

    @media (max-width: 480px) {
      font-size: 13px;
      margin-bottom: 8px;
    }
  }

  .more-info-input {
    margin-top: 16px;
    width: 100%;

    @media (max-width: 480px) {
      margin-top: 12px;
    }
  }
}

.form-section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #409eff;

  @media (max-width: 768px) {
    font-size: 15px;
    margin-bottom: 16px;
    padding-bottom: 8px;
  }

  @media (max-width: 480px) {
    font-size: 14px;
    margin-bottom: 14px;
    padding-bottom: 6px;
  }
}

.form-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  gap: 12px;

  @media (max-width: 480px) {
    gap: 8px;
  }

  .form-section-title {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
    flex: 1;
    min-width: 0;
  }
}

.additional-object-section {
  width: 100%;
  max-width: 600px;
  margin-top: 24px;

  @media (max-width: 768px) {
    margin-top: 20px;
  }

  @media (max-width: 480px) {
    margin-top: 16px;
  }
}

.add-button-container {
  margin-top: 24px;
  margin-bottom: 24px;
  width: 100%;
  max-width: 600px;
  display: flex;
  justify-content: center;

  @media (max-width: 768px) {
    margin-top: 20px;
    margin-bottom: 20px;
  }

  @media (max-width: 480px) {
    margin-top: 16px;
    margin-bottom: 16px;
  }

  .add-button {
    @media (max-width: 768px) {
      padding: 8px 16px;
    }

    @media (max-width: 480px) {
      padding: 6px 12px;
      font-size: 14px;
    }

    .button-text {
      @media (max-width: 640px) {
        display: none;
      }
    }

    .button-text-short {
      display: none;

      @media (max-width: 640px) {
        display: inline;
      }
    }
  }
}

.button-group-container {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  width: 100%;
  max-width: 600px;
  padding: 0 40px;

  @media (max-width: 768px) {
    padding: 0 20px;
    margin-top: 20px;
    gap: 10px;
  }

  @media (max-width: 480px) {
    padding: 0 16px;
    margin-top: 16px;
    gap: 8px;
    justify-content: center;
  }

  .el-button {
    @media (max-width: 480px) {
      flex: 1;
      max-width: 150px;
    }
  }
}

.el-form-item {
  margin-bottom: 22px;

  @media (max-width: 768px) {
    margin-bottom: 18px;
  }

  @media (max-width: 480px) {
    margin-bottom: 16px;
  }
}

.el-form-item:last-child {
  margin-bottom: 0;
}

.whereotherinput {
  padding-top: 5px;
}

// MEDIA UPLOAD STYLES
:deep(.el-upload-list--picture-card) {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.upload-media-section {
  margin-top: 32px;
  padding: 24px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px dashed #d0d7de;

  @media (max-width: 768px) {
    margin-top: 24px;
    padding: 16px;
  }

  .section-header {
    margin-bottom: 20px;

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
      margin: 0 0 8px 0;

      @media (max-width: 768px) {
        font-size: 16px;
      }
    }

    .section-description {
      font-size: 14px;
      color: #606266;
      margin: 0;

      @media (max-width: 768px) {
        font-size: 13px;
      }
    }
  }

  .upload-area {
    width: 100%;

    :deep(.el-upload.el-upload--picture-card) {
      width: 100% !important;
      height: auto !important;
      display: block !important;
      border: 0 !important; /* tashqi kvadrat border kerakmas */
      background: transparent !important;
    }

    /* draggerning o'zini dropzone ko'rinishiga keltiramiz */
    :deep(.el-upload--picture-card .el-upload-dragger) {
      width: 100% !important;
      height: auto !important;
      min-height: 180px;
      padding: 24px 16px !important;
      box-sizing: border-box;

      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      border-radius: 10px;
    }

    /* icon + text markazda, tartibli */
    :deep(.el-upload--picture-card .el-icon--upload) {
      margin-bottom: 10px;
    }

    :deep(.el-upload--picture-card .el-upload__text) {
      text-align: center;
      line-height: 1.3;
      white-space: normal;
      max-width: 360px;
    }

    .el-upload__text {
      font-size: 14px;
      color: #606266;

      @media (max-width: 768px) {
        font-size: 13px;
      }

      .file-count {
        color: #409eff;
        font-weight: 600;
        font-size: 13px;
      }
    }
  }

  .upload-info {
    margin-top: 16px;

    @media (max-width: 768px) {
      margin-top: 12px;
    }
  }
}

:deep(.el-upload-list) {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-top: 16px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 8px;
  }
}

:deep(.el-upload-list__item) {
  margin: 0;
}

// Full width classes for responsive inputs
.full-width-picker {
  width: 100% !important;

  @media (max-width: 768px) {
    width: 100% !important;
  }
}

.full-width-select {
  width: 100%;
}

.full-width-input {
  width: 100%;
}

// Override Element Plus label width on mobile
:deep(.el-form-item__label) {
  @media (max-width: 768px) {
    width: 100% !important;
    text-align: left !important;
    margin-bottom: 8px;
  }
}

:deep(.el-form-item__content) {
  @media (max-width: 768px) {
    margin-left: 0 !important;
    width: 100%;
  }
}

// Make date pickers responsive
:deep(.el-date-editor) {
  width: 100% !important;

  @media (max-width: 768px) {
    width: 100% !important;
  }
}

// Make selects responsive
:deep(.el-select) {
  width: 100%;
}

// Responsive form layout
:deep(.el-form-item) {
  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
  }
}
</style>
