<template>
  <UiPage>
    <template #title>
      <el-button class="sf-back" link :icon="ArrowLeft" @click="goback()">
        {{ $t('yaqindaBorilganObyektlar') }}
      </el-button>
      <h1 class="sf-title">{{ $t('yangiObyektQoshish') }}</h1>
    </template>

    <UiPanel :title="$t('asosiyObyekt')" :icon="Location">
      <el-form :model="form" :rules="formRules" ref="formRef" label-position="top" class="sf-form">
        <el-form-item
          label-position="top"
          :label="$t('obyektgaKetishVaqti')"
          prop="goingtime"
          required
        >
          <el-config-provider :locale="locale">
            <div class="datetime-split">
              <el-date-picker
                v-model="goingDate"
                type="date"
                :placeholder="$t('vaqtniTanlang')"
                :disabled-date="disabledDate"
                format="YYYY-MM-DD"
              />
              <el-time-picker v-model="goingTime" format="HH:mm" :placeholder="$t('soatminut')" />
            </div>
          </el-config-provider>
        </el-form-item>

        <el-form-item :label="$t('qayerga')" prop="where" required>
          <el-select v-model="form.where" :placeholder="$t('tanlang')">
            <el-option :label="$t('zavod')" value="Zavod" />
            <el-option :label="$t('klient')" value="Klient" />
            <el-option :label="$t('shaxsiy')" value="Shaxsiy" />
            <el-option :label="$t('boshqa')" value="boshqa" />
          </el-select>
          <el-input
            v-if="isWhereBoshqa"
            class="sf-other"
            v-model="form.whereother"
            :placeholder="$t('whereotherplaceholder')"
          />
        </el-form-item>

        <el-form-item :label="$t('kpYokiDogovor')" prop="dogovororkp" required>
          <el-select v-model="form.dogovororkp" :placeholder="$t('tanlang')">
            <el-option :label="$t('kp')" value="KP" />
            <el-option :label="$t('dogovor')" value="Dogovor" />
            <el-option :label="$t('boshqa')" value="boshqa" />
          </el-select>
          <el-input
            v-if="isDogoKpNotSelected"
            class="sf-other"
            :rows="2"
            v-model="form.dogokpother"
            :placeholder="$t('whereother2placeholder')"
            type="textarea"
          />
        </el-form-item>

        <el-form-item
          :label="$t('dogovorRaqami')"
          v-if="isDogovorSelected"
          prop="dogovornumber"
          required
        >
          <el-input v-model="form.dogovornumber" :placeholder="$t('Kiriting')" />
        </el-form-item>

        <el-form-item :label="$t('kpRaqami')" v-if="isKPSelected" prop="kpnumber" required>
          <el-input v-model="form.kpnumber" :placeholder="$t('Kiriting')" />
        </el-form-item>

        <el-form-item
          v-if="isDogovorSelected"
          :label="$t('dogovorSanasi')"
          prop="dogovortime"
          required
        >
          <el-config-provider :locale="locale">
            <el-date-picker
              v-model="form.dogovortime"
              type="date"
              :placeholder="$t('vaqtniTanlang')"
              size="default"
            />
          </el-config-provider>
        </el-form-item>

        <el-form-item v-if="isKPSelected" :label="$t('kpSanasi')" prop="kptime" required>
          <el-config-provider :locale="locale">
            <el-date-picker
              v-model="form.kptime"
              type="date"
              :placeholder="$t('vaqtniTanlang')"
              size="default"
            />
          </el-config-provider>
        </el-form-item>

        <el-form-item
          v-if="isKPSelected || isDogovorSelected"
          :label="$t('firmaNomi')"
          prop="firmanomi"
          required
        >
          <el-input v-model="form.firmanomi" :placeholder="$t('Kiriting')" />
        </el-form-item>

        <el-form-item prop="location" class="sf-full sf-loc-label">
          <template #label>
            <span>{{ $t('obyektjoylashuvinikiriting') }}</span>
          </template>
        </el-form-item>
        <LocationPicker
          class="sf-full"
          :access-token="Mapboxtoken"
          :initial-center="{ lng: -74.006, lat: 40.7128 }"
          :initial-zoom="12"
          @location-selected="handleLocationSelected"
          @current-location="handleLocationSelected"
          @link-parsed="handleLocationSelected"
        />
        <el-form-item class="sf-full" :label="$t('qoshimchamalumotlarUchunJoy')">
          <el-input
            :rows="5"
            v-model="form.more_info"
            :placeholder="$t('qoshimchamalumotlarUchunJoy')"
            type="textarea"
          />
        </el-form-item>

        <!-- Rasm va videolar -->
        <div class="sf-full sf-media">
          <h4 class="sf-sub">
            {{ $t('rasmvavideolar') }}
            <span class="sf-sub__hint">{{ $t('obyektgaRasmVaVideolar') }}</span>
          </h4>

          <el-upload
            ref="uploadRef"
            class="sf-upload"
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
                <span class="sf-file-count">
                  {{ $t('siteFilesSelected', { n: mediaFileList.length }) }}
                </span>
              </template>
            </div>
          </el-upload>

          <p class="sf-hint">{{ $t('siteUploadHint') }}</p>
        </div>
      </el-form>
    </UiPanel>

    <!-- QO'SHIMCHA OBYEKTLAR -->
    <UiPanel
      v-for="(obj, index) in additionalObjects"
      :key="index"
      :title="`${$t('qoshimchaObyekt')} #${index + 1}`"
      :icon="Location"
    >
      <template #actions>
        <el-button type="danger" link :icon="Delete" @click="removeAdditionalObject(index)">
          {{ $t('delete') }}
        </el-button>
      </template>
      <el-form
        :model="obj"
        :rules="getAdditionalFormRules(obj)"
        :ref="(el) => setAdditionalFormRef(el, index)"
        label-position="top"
        class="sf-form"
      >
        <el-form-item
          label-position="top"
          :label="$t('obyektgaKetishVaqti')"
          prop="goingtime"
          required
        >
          <el-config-provider :locale="locale">
            <div class="datetime-split">
              <el-date-picker
                v-model="obj.goingDate"
                type="date"
                :placeholder="$t('vaqtniTanlang')"
                :disabled-date="disabledDate"
                format="YYYY-MM-DD"
                @change="syncAdditionalGoingTime(index, obj)"
              />
              <el-time-picker
                v-model="obj.goingTime"
                format="HH:mm"
                :placeholder="$t('soatminut')"
                @change="syncAdditionalGoingTime(index, obj)"
              />
            </div>
          </el-config-provider>
        </el-form-item>

        <el-form-item :label="$t('qayerga')" prop="where" required>
          <el-select v-model="obj.where" :placeholder="$t('tanlang')">
            <el-option :label="$t('zavod')" value="Zavod" />
            <el-option :label="$t('klient')" value="Klient" />
            <el-option :label="$t('shaxsiy')" value="Shaxsiy" />
            <el-option :label="$t('boshqa')" value="boshqa" />
          </el-select>
          <el-input
            v-if="obj.where === 'boshqa'"
            class="sf-other"
            v-model="obj.whereother"
            :placeholder="$t('whereotherplaceholder')"
          />
        </el-form-item>

        <el-form-item :label="$t('kpYokiDogovor')" prop="dogovororkp" required>
          <el-select v-model="obj.dogovororkp" :placeholder="$t('tanlang')">
            <el-option :label="$t('kp')" value="KP" />
            <el-option :label="$t('dogovor')" value="Dogovor" />
            <el-option :label="$t('boshqa')" value="boshqa" />
          </el-select>
          <el-input
            v-if="obj.dogovororkp === 'boshqa'"
            class="sf-other"
            :rows="2"
            v-model="obj.dogokpother"
            :placeholder="$t('whereother2placeholder')"
            type="textarea"
          />
        </el-form-item>

        <el-form-item
          :label="$t('dogovorRaqami')"
          v-if="obj.dogovororkp === 'Dogovor'"
          prop="dogovornumber"
          required
        >
          <el-input v-model="obj.dogovornumber" :placeholder="$t('Kiriting')" />
        </el-form-item>

        <el-form-item
          :label="$t('kpRaqami')"
          v-if="obj.dogovororkp === 'KP'"
          prop="kpnumber"
          required
        >
          <el-input v-model="obj.kpnumber" :placeholder="$t('Kiriting')" />
        </el-form-item>

        <el-form-item
          v-if="obj.dogovororkp === 'Dogovor'"
          :label="$t('dogovorSanasi')"
          prop="dogovortime"
          required
        >
          <el-config-provider :locale="locale">
            <el-date-picker
              v-model="obj.dogovortime"
              type="date"
              :placeholder="$t('vaqtniTanlang')"
              size="default"
            />
          </el-config-provider>
        </el-form-item>

        <el-form-item
          v-if="obj.dogovororkp === 'KP'"
          :label="$t('kpSanasi')"
          prop="kptime"
          required
        >
          <el-config-provider :locale="locale">
            <el-date-picker
              v-model="obj.kptime"
              type="date"
              :placeholder="$t('vaqtniTanlang')"
              size="default"
            />
          </el-config-provider>
        </el-form-item>

        <el-form-item
          v-if="obj.dogovororkp === 'KP' || obj.dogovororkp === 'Dogovor'"
          :label="$t('firmaNomi')"
          prop="firmanomi"
          required
        >
          <el-input v-model="obj.firmanomi" :placeholder="$t('Kiriting')" />
        </el-form-item>

        <el-form-item prop="location" required class="sf-full sf-loc-label">
          <template #label>
            <span>{{ $t('obyektjoylashuvinikiriting') }}</span>
          </template>
        </el-form-item>
        <LocationPicker
          class="sf-full"
          :access-token="Mapboxtoken"
          :initial-center="{ lng: -74.006, lat: 40.7128 }"
          :initial-zoom="12"
          @location-selected="(location) => handleAdditionalLocationSelected(index, location)"
          @current-location="(location) => handleAdditionalLocationSelected(index, location)"
          @link-parsed="(location) => handleAdditionalLocationSelected(index, location)"
        />
        <el-form-item class="sf-full" :label="$t('qoshimchamalumotlarUchunJoy')">
          <el-input
            :rows="3"
            v-model="obj.more_info"
            :placeholder="$t('qoshimchamalumotlarUchunJoy')"
            type="textarea"
          />
        </el-form-item>
      </el-form>
    </UiPanel>

    <!-- Qo'shimcha obyekt qo'shish (5 tagacha) -->
    <button
      v-if="additionalObjects.length < 5"
      type="button"
      class="sf-add"
      @click="addAdditionalObject"
    >
      <el-icon><Plus /></el-icon>
      {{ $t('yangiObyektQoshishBtn') }}
      <span class="sf-add__hint">{{ additionalObjects.length }}/5</span>
    </button>

    <!-- Saqlash paneli -->
    <div class="sf-footer">
      <span class="sf-hint">{{
        $t('siteFormFooterHint', { n: additionalObjects.length + 1 })
      }}</span>
      <div class="sf-footer__actions">
        <el-button @click="goback()">{{ $t('cancel') }}</el-button>
        <el-button :loading="loading" type="primary" @click="onSubmit">{{ $t('save') }}</el-button>
      </div>
    </div>
  </UiPage>
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
import { ArrowLeft, Delete, Location, Plus } from '@element-plus/icons-vue'
import UiPage from '@/components/ui/UiPage.vue'
import UiPanel from '@/components/ui/UiPanel.vue'
import router from '@/router'

const comeandgoesStore = useComeAndGoesStore()
const comeandgoInsideStore = useComeAndGoInsideStore()
const videosStore = useVideosStore()

const Mapboxtoken = import.meta.env.VITE_MAPBOX_TOKEN

const isDogoKpNotSelected = ref(false)
const isDogovorSelected = ref(false)
const isWhereBoshqa = ref(false)
const isKPSelected = ref(false)
const loading = ref(false)
const locale = ru

const formRef = ref()
const additionalFormRefs = ref([])

const setAdditionalFormRef = (el, index) => {
  if (el) {
    additionalFormRefs.value[index] = el
  }
}

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

// ✅ Asosiy forma uchun alohida date va time ref'lar
const goingDate = ref('')
const goingTime = ref('')

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

// Auto-combine goingDate + goingTime into form.goingtime whenever either changes
watch([goingDate, goingTime], ([date, time]) => {
  if (date && time) {
    const d = new Date(date)
    const t = new Date(time)
    d.setHours(t.getHours(), t.getMinutes(), 0, 0)
    form.goingtime = d
  } else {
    form.goingtime = ''
  }
})

const formRules = reactive({
  goingtime: [
    { required: true, message: 'Iltimos, obyektga ketish vaqtini tanlang', trigger: 'change' },
  ],
  where: [
    { required: true, message: 'Iltimos, qayerga ketayotganingizni tanlang', trigger: 'change' },
  ],
  dogovororkp: [
    { required: true, message: 'Iltimos, Dogovor yoki KP ni tanlang', trigger: 'change' },
  ],
  dogovornumber: [
    { required: true, message: 'Iltimos, dogovor raqamini kiriting', trigger: 'blur' },
  ],
  kpnumber: [{ required: true, message: 'Iltimos, KP raqamini kiriting', trigger: 'blur' }],
  dogovortime: [
    { required: true, message: 'Iltimos, dogovor sanasini tanlang', trigger: 'change' },
  ],
  kptime: [{ required: true, message: 'Iltimos, KP sanasini tanlang', trigger: 'change' }],
  firmanomi: [{ required: true, message: 'Iltimos, firma nomini kiriting', trigger: 'blur' }],
  location: [
    {
      required: true,
      validator: (rule, value, callback) => {
        if (!form.lat || !form.lang) {
          callback(new Error('Iltimos, joylashuvni tanlang'))
        } else {
          callback()
        }
      },
      trigger: 'change',
    },
  ],
})

const getAdditionalFormRules = (obj) => {
  return {
    goingtime: [
      { required: true, message: 'Iltimos, obyektga ketish vaqtini tanlang', trigger: 'change' },
    ],
    where: [
      { required: true, message: 'Iltimos, qayerga ketayotganingizni tanlang', trigger: 'change' },
    ],
    dogovororkp: [
      { required: true, message: 'Iltimos, Dogovor yoki KP ni tanlang', trigger: 'change' },
    ],
    dogovornumber: [
      { required: true, message: 'Iltimos, dogovor raqamini kiriting', trigger: 'blur' },
    ],
    kpnumber: [{ required: true, message: 'Iltimos, KP raqamini kiriting', trigger: 'blur' }],
    dogovortime: [
      { required: true, message: 'Iltimos, dogovor sanasini tanlang', trigger: 'change' },
    ],
    kptime: [{ required: true, message: 'Iltimos, KP sanasini tanlang', trigger: 'change' }],
    firmanomi: [{ required: true, message: 'Iltimos, firma nomini kiriting', trigger: 'blur' }],
    location: [
      {
        required: true,
        validator: (rule, value, callback) => {
          if (!obj.lat || !obj.lang) {
            callback(new Error('Iltimos, joylashuvni tanlang'))
          } else {
            callback()
          }
        },
        trigger: 'change',
      },
    ],
  }
}

const additionalObjects = ref([])

// createEmptyObject — includes goingDate and goingTime
const createEmptyObject = () => ({
  goingDate: '',
  goingTime: '',
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

// Keeps goingtime in sync for the additional objects
const syncAdditionalGoingTime = (index, obj) => {
  if (obj.goingDate && obj.goingTime) {
    const d = new Date(obj.goingDate)
    const t = new Date(obj.goingTime)
    d.setHours(t.getHours(), t.getMinutes(), 0, 0)
    additionalObjects.value[index].goingtime = d
  } else {
    additionalObjects.value[index].goingtime = ''
  }
}

const addAdditionalObject = () => {
  if (additionalObjects.value.length < 5) {
    additionalObjects.value.push(createEmptyObject())
  } else {
    ElMessage.warning("Maksimal 5 ta qo'shimcha obyekt qo'shish mumkin.")
  }
}

const removeAdditionalObject = (index) => {
  additionalObjects.value.splice(index, 1)
  additionalFormRefs.value.splice(index, 1)
}

const handleLocationSelected = (location) => {
  form.lang = location.lng
  form.lat = location.lat
  form.locationname = location.address || ''
  if (formRef.value) {
    formRef.value.validateField('location')
  }
}

const handleAdditionalLocationSelected = (index, location) => {
  additionalObjects.value[index].lang = location.lng
  additionalObjects.value[index].lat = location.lat
  additionalObjects.value[index].locationname = location.address || ''
  if (additionalFormRefs.value[index]) {
    additionalFormRefs.value[index].validateField('location')
  }
}

const disabledDate = (time) => {
  const today = new Date()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(today.getDate() - 2)
  const twoDaysLater = new Date()
  twoDaysLater.setDate(today.getDate() + 1)
  return time.getTime() < sevenDaysAgo.getTime() || time.getTime() > twoDaysLater.getTime()
}

const beforeUpload = (file) => {
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

const handleUploadSuccess = (response, file) => {
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
}

const handleUploadError = (error, file) => {
  console.error('❌ Cloudinary upload failed:', file.name, error)
  ElMessage.error(`${file.name} yuklashda xatolik yuz berdi!`)
}

const uploadMediaToDatabase = async (comeAndGoId) => {
  if (uploadedMediaData.value.length === 0) {
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

      const result = await videosStore.createVideo(payload)

      return result
    })

    await Promise.all(savePromises)

    return {
      success: true,
      count: uploadedMediaData.value.length,
    }
  } catch (error) {
    console.error('❌ Database save failed:', error)
    throw error
  }
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
  let isMainFormValid = false
  try {
    await formRef.value.validate()
    isMainFormValid = true
  } catch (error) {
    ElMessage.error("Asosiy obyekt: Iltimos, barcha majburiy maydonlarni to'ldiring")
    return
  }

  if (additionalObjects.value.length > 0) {
    for (let i = 0; i < additionalFormRefs.value.length; i++) {
      if (!additionalFormRefs.value[i]) {
        console.warn(`⚠️ Form ref ${i} is null`)
        continue
      }

      try {
        await additionalFormRefs.value[i].validate()
      } catch (error) {
        ElMessage.error(
          `Qo'shimcha obyekt #${i + 1}: Iltimos, barcha majburiy maydonlarni to'ldiring`,
        )
        return
      }
    }
  }

  loading.value = true

  try {
    const parentPayload = {
      user_id: Number(localStorage.getItem('userid')),
    }
    const parentResponse = await comeandgoesStore.createComeAndGoes(parentPayload)

    const comeAndGoId = parentResponse?.newCGO?.id

    if (!comeAndGoId) {
      throw new Error('ComeAndGoes ID olinmadi')
    }

    const mainInsidePayload = {
      ...createInsidePayload(form),
      come_and_go_father_id: comeAndGoId,
    }
    await comeandgoInsideStore.createComeAndGoInside(mainInsidePayload)

    if (additionalObjects.value.length > 0) {
      for (let i = 0; i < additionalObjects.value.length; i++) {
        const additionalInsidePayload = {
          ...createInsidePayload(additionalObjects.value[i]),
          come_and_go_father_id: comeAndGoId,
        }
        await comeandgoInsideStore.createComeAndGoInside(additionalInsidePayload)
      }
    }

    let mediaUploadCount = 0

    if (mediaFileList.value.length > 0) {
      uploadedMediaData.value = []

      if (uploadRef.value) {
        uploadRef.value.submit()

        const maxWait = 60000
        const checkInterval = 500
        let waited = 0

        while (uploadedMediaData.value.length < mediaFileList.value.length && waited < maxWait) {
          await new Promise((resolve) => setTimeout(resolve, checkInterval))
          waited += checkInterval
        }

        if (uploadedMediaData.value.length < mediaFileList.value.length) {
          console.warn('⚠️ Not all files uploaded to Cloudinary in time')
          ElMessage.warning(
            `Faqat ${uploadedMediaData.value.length}/${mediaFileList.value.length} media fayl yuklandi`,
          )
        } else {
        }

        if (uploadedMediaData.value.length > 0) {
          const dbResult = await uploadMediaToDatabase(comeAndGoId)
          mediaUploadCount = dbResult.count
        }
      }
    } else {
    }

    if (mediaUploadCount > 0) {
      ElMessage.success(`Barcha obyektlar va ${mediaUploadCount} ta media muvaffaqiyatli saqlandi!`)
    } else {
      ElMessage.success('Barcha obyektlar muvaffaqiyatli saqlandi!')
    }

    router.push('/sites')
  } catch (error) {
    console.error('❌ ERROR:', error)
    ElMessage.error('Xatolik yuz berdi: ' + (error.message || "Iltimos, qaytadan urinib ko'ring."))
  } finally {
    loading.value = false
  }
}

const goback = () => {
  router.push('/sites')
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

<style scoped>
.sf-back {
  align-self: flex-start;
  margin-bottom: 2px;
  color: var(--ui-muted);
}
.sf-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--ui-ink);
}

/* Forma: kompyuterda ikki ustun, xarita/izoh/media to'liq kenglikda */
.sf-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 20px;
}
.sf-form > .sf-full {
  grid-column: 1 / -1;
}
.sf-form :deep(.el-form-item) {
  margin-bottom: 16px;
}
.sf-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--ui-ink-2);
  padding-bottom: 4px;
}
.sf-form :deep(.el-select),
.sf-form :deep(.el-input),
.sf-form :deep(.el-date-editor) {
  width: 100%;
}
.sf-loc-label {
  margin-bottom: 6px !important;
}
.datetime-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  width: 100%;
}
.sf-other {
  margin-top: 8px;
}

/* Media */
.sf-media {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--ui-line-soft);
}
.sf-sub {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--ui-ink);
}
.sf-sub__hint {
  font-size: 12px;
  font-weight: 400;
  color: var(--ui-muted);
}
.sf-upload :deep(.el-upload--picture-card) {
  display: block;
  width: 100%;
  height: auto;
  border: none;
  background: none;
}
.sf-upload :deep(.el-upload-dragger) {
  width: 100%;
  padding: 20px 16px;
  border-radius: var(--ui-radius);
  background: var(--ui-surface-2);
}
.sf-upload :deep(.el-icon--upload) {
  font-size: 36px;
  color: var(--ui-faint);
  margin-bottom: 4px;
}
.sf-upload :deep(.el-upload__text) {
  font-size: 13px;
  color: var(--ui-muted);
}
.sf-file-count {
  font-weight: 600;
  color: var(--ui-link);
}
.sf-hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--ui-muted);
}

/* Qo'shimcha obyekt qo'shish */
.sf-add {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  color: var(--ui-link);
  background: var(--ui-surface);
  border: 1px dashed #bfdbfe;
  border-radius: var(--ui-radius);
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s;
}
.sf-add:hover {
  background: var(--ui-link-soft);
  border-color: var(--ui-link);
}
.sf-add:focus-visible {
  outline: 2px solid var(--ui-link);
  outline-offset: 2px;
}
.sf-add__hint {
  font-size: 12px;
  font-weight: 500;
  color: var(--ui-muted);
}

/* Saqlash paneli — pastda yopishib turadi */
.sf-footer {
  position: sticky;
  bottom: 0;
  z-index: 5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid var(--ui-line);
  border-radius: var(--ui-radius);
  box-shadow: 0 -4px 16px rgba(17, 24, 39, 0.06);
}
.sf-footer .sf-hint {
  margin: 0;
}
.sf-footer__actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

@media (max-width: 768px) {
  .sf-form {
    grid-template-columns: 1fr;
  }
}
</style>
