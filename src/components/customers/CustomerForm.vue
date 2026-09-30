<template>
  <div class="cf" :class="{ 'cf--page': !embedded }">
    <div v-if="!embedded" class="cf__head">
      <el-button :icon="Back" link @click="goback()" />
      <h2>{{ $t('yangiMijozQoshishText') }}</h2>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="cf__form">
      <!-- Asosiy ma'lumot -->
      <h4 class="cf__section">{{ $t('custFormMain') }}</h4>
      <el-form-item :label="$t('ismFamiliya')" prop="fullname" required>
        <el-input v-model="form.fullname" :placeholder="$t('kiriting')" />
      </el-form-item>

      <div class="cf__grid">
        <el-form-item :label="$t('mijozTuri')" prop="mijozturi" required>
          <el-radio-group v-model="form.mijozturi">
            <el-radio-button value="yuridik">{{ $t('yuridikShaxs') }}</el-radio-button>
            <el-radio-button value="jismoniy">{{ $t('jismoniyShaxs') }}</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <!-- INN faqat yuridik shaxs uchun -->
        <el-form-item v-if="form.mijozturi === 'yuridik'" :label="$t('inn')">
          <el-input v-model="form.inn" :placeholder="$t('kiriting')" />
        </el-form-item>
      </div>

      <div class="cf__grid">
        <el-form-item :label="$t('telefon')" prop="phone_number" required>
          <el-input v-model="form.phone_number" placeholder="+998 90 123 45 67" />
        </el-form-item>
        <el-form-item :label="$t('form_qoshimchaTelefon')">
          <el-input
            v-model="form.additional_phone_number"
            :placeholder="$t('form_qoshimchaTelefon_placeholder')"
          />
        </el-form-item>
      </div>

      <!-- Manzil -->
      <h4 class="cf__section">{{ $t('custFormAddress') }}</h4>
      <div class="cf__grid cf__grid--3">
        <el-form-item :label="$t('respublika')" prop="republic" required>
          <el-select
            v-model="form.republic"
            filterable
            :placeholder="$t('tanlang')"
            @change="onRepublicChange"
          >
            <el-option
              v-for="item in republicOptions"
              :key="item.key"
              :label="item.label"
              :value="item.key"
            />
          </el-select>
          <el-input
            v-if="form.republic === 'boshqa'"
            v-model="form.otherrepublic"
            class="cf__other"
            :placeholder="$t('qaysiRespublika')"
          />
        </el-form-item>

        <el-form-item :label="$t('viloyat')" prop="viloyat" required>
          <el-select
            v-model="form.viloyat"
            filterable
            :placeholder="$t('tanlang')"
            :disabled="!form.republic || (form.republic === 'boshqa' && !form.otherrepublic)"
            @change="onViloyatChange"
          >
            <el-option
              v-for="item in availableViloyatlar"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-input
            v-if="form.viloyat === 'boshqa'"
            v-model="form.otherviloyat"
            class="cf__other"
            :placeholder="$t('qaysiViloyat')"
          />
        </el-form-item>

        <el-form-item :label="$t('shaharTuman')" prop="shahar_tuman" required>
          <el-select
            v-model="form.shahar_tuman"
            filterable
            :placeholder="$t('tanlang')"
            :disabled="!form.viloyat || (form.viloyat === 'boshqa' && !form.otherviloyat)"
            @change="onShaharTumanChange"
          >
            <el-option
              v-for="item in availableShaharTumanlar"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-input
            v-if="form.shahar_tuman === 'boshqa'"
            v-model="form.other_shahar_tuman"
            class="cf__other"
            :placeholder="$t('qaysiShaharTuman')"
          />
        </el-form-item>
      </div>
    </el-form>

    <div class="cf__footer">
      <el-button @click="goback()">{{ $t('cancel') }}</el-button>
      <el-button :loading="loading" type="primary" @click="onSubmit">{{ $t('save') }}</el-button>
    </div>
  </div>
</template>

<script setup>
import { usePartnersStore } from '@/stores/partners'
import { reactive, ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Back } from '@element-plus/icons-vue'
import router from '@/router'
import { useI18n } from 'vue-i18n'
import { createLocationData, createRepublicOptions } from '@/constants/locations'
import { getCookie } from '@/utils/cookies'

const props = defineProps({
  // When true (used inside a dialog) emit events instead of navigating away
  embedded: { type: Boolean, default: false },
})
const emit = defineEmits(['success', 'cancel'])

const partnersStore = usePartnersStore()
const loading = ref(false)
const { t } = useI18n()
const formRef = ref()

const lang = getCookie('lang', 'uz')

// ─── Form state ───────────────────────────────────────────────────────────────
const form = reactive({
  republic: '',
  otherrepublic: '',
  viloyat: '',
  otherviloyat: '',
  shahar_tuman: '',
  other_shahar_tuman: '',
  mijozturi: '',
  inn: '',
  phone_number: '',
  additional_phone_number: '',
  fullname: '',
})

// ─── Location data ────────────────────────────────────────────────────────────
const LOCATION_DATA = createLocationData(t)

const republicOptions = createRepublicOptions(t)

// ─── Computed cascading options ───────────────────────────────────────────────
const availableViloyatlar = computed(() => {
  const republic = form.republic
  if (!republic) return []
  if (republic === 'boshqa') {
    return form.otherrepublic ? [{ value: 'boshqa', label: t('Boshqa') }] : []
  }
  const viloyatlar = LOCATION_DATA[republic] || []
  return [
    ...viloyatlar.map((v) => ({ value: v.value, label: v.label })),
    { value: 'boshqa', label: t('Boshqa') },
  ]
})

const availableShaharTumanlar = computed(() => {
  const republic = form.republic
  const viloyat = form.viloyat
  if (!republic || !viloyat) return []
  if (viloyat === 'boshqa') {
    return form.otherviloyat ? [{ value: 'boshqa', label: t('Boshqa') }] : []
  }
  if (republic === 'boshqa') return []
  const viloyatlar = LOCATION_DATA[republic] || []
  const found = viloyatlar.find((v) => v.value === viloyat)
  if (!found) return []
  return found.tumanlar.map((item) => ({
    ...item,
    value: item.value === t('Boshqa') ? 'boshqa' : item.value,
  }))
})

// ─── Cascade reset handlers ───────────────────────────────────────────────────
const onRepublicChange = () => {
  form.viloyat = ''
  form.otherviloyat = ''
  form.shahar_tuman = ''
  form.other_shahar_tuman = ''
  form.otherrepublic = ''
}

const onViloyatChange = () => {
  form.shahar_tuman = ''
  form.other_shahar_tuman = ''
  form.otherviloyat = ''
}

const onShaharTumanChange = () => {
  form.other_shahar_tuman = ''
}

// ─── Validation messages ──────────────────────────────────────────────────────
const messages = {
  uz: {
    republic: 'Iltimos respublikani tanlang',
    otherrepublic: 'Iltimos respublikani kiriting',
    viloyat: 'Iltimos viloyatni tanlang',
    otherviloyat: 'Iltimos viloyatni kiriting',
    shahar_tuman: 'Iltimos shahar/tumanni tanlang',
    other_shahar_tuman: 'Iltimos shahar/tuman nomini kiriting',
    mijozturi: 'Iltimos mijoz turini tanlang',
    phone_number: 'Iltimos telefon raqamni kiriting',
    fullname: 'Iltimos ism familiyani kiriting',
  },
  ru: {
    republic: 'Пожалуйста, выберите республику',
    otherrepublic: 'Пожалуйста, введите республику',
    viloyat: 'Пожалуйста, выберите область',
    otherviloyat: 'Пожалуйста, введите область',
    shahar_tuman: 'Пожалуйста, выберите город/район',
    other_shahar_tuman: 'Пожалуйста, введите название города/района',
    mijozturi: 'Пожалуйста, выберите тип клиента',
    phone_number: 'Пожалуйста, введите номер телефона',
    fullname: 'Пожалуйста, введите имя и фамилию',
  },
}

// ─── Validation rules ─────────────────────────────────────────────────────────
const rules = computed(() => ({
  republic: [
    {
      required: true,
      message: messages[lang]?.republic || messages.uz.republic,
      trigger: 'change',
    },
    {
      validator: (rule, value, callback) => {
        if (value === 'boshqa' && !form.otherrepublic) {
          callback(new Error(messages[lang]?.otherrepublic || messages.uz.otherrepublic))
        } else callback()
      },
      trigger: 'change',
    },
  ],
  viloyat: [
    { required: true, message: messages[lang]?.viloyat || messages.uz.viloyat, trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        if (value === 'boshqa' && !form.otherviloyat) {
          callback(new Error(messages[lang]?.otherviloyat || messages.uz.otherviloyat))
        } else callback()
      },
      trigger: 'change',
    },
  ],
  shahar_tuman: [
    {
      required: true,
      message: messages[lang]?.shahar_tuman || messages.uz.shahar_tuman,
      trigger: 'change',
    },
    {
      validator: (rule, value, callback) => {
        if (value === 'boshqa' && !form.other_shahar_tuman) {
          callback(new Error(messages[lang]?.other_shahar_tuman || messages.uz.other_shahar_tuman))
        } else callback()
      },
      trigger: 'change',
    },
  ],
  mijozturi: [
    {
      required: true,
      message: messages[lang]?.mijozturi || messages.uz.mijozturi,
      trigger: 'change',
    },
  ],
  phone_number: [
    {
      required: true,
      message: messages[lang]?.phone_number || messages.uz.phone_number,
      trigger: 'blur',
    },
  ],
  fullname: [
    { required: true, message: messages[lang]?.fullname || messages.uz.fullname, trigger: 'blur' },
  ],
}))

// ─── Payload builder ──────────────────────────────────────────────────────────
// Resolve the translated republic name (its value, not the key)
const getRepublicValue = (key) => {
  if (!key || key === 'boshqa') return null
  const found = republicOptions.find((r) => r.key === key)
  return found ? found.value : key
}

const PARTNER_TYPE_LABELS = {
  yuridik: t('yuridikShaxs'),
  jismoniy: t('jismoniyShaxs'),
}

const buildPartnerPayload = (obj) => ({
  republic: obj.republic === 'boshqa' ? obj.otherrepublic : getRepublicValue(obj.republic),
  viloyat: obj.viloyat === 'boshqa' ? obj.otherviloyat : obj.viloyat,
  shahar_tuman: obj.shahar_tuman === 'boshqa' ? obj.other_shahar_tuman : obj.shahar_tuman,
  mijozturi: PARTNER_TYPE_LABELS[obj.mijozturi] || obj.mijozturi,
  inn: obj.inn,
  phone_number: obj.phone_number,
  additional_phone_number: obj.additional_phone_number,
  fullname: obj.fullname,
  partner_type: localStorage.getItem('mijozTur'),
  user_id: Number(localStorage.getItem('userid')),
})

// ─── Submit ───────────────────────────────────────────────────────────────────
const onSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    loading.value = true
    const payload = buildPartnerPayload(form)
    await partnersStore.createPartner(payload)
    ElMessage.success("Barcha ma'lumotlar muvaffaqiyatli saqlandi!")
    if (props.embedded) emit('success')
    else router.push('/')
  } catch (error) {
    if (error !== false) {
      ElMessage.error(
        'Xatolik yuz berdi: ' + (error.message || "Iltimos, qaytadan urinib ko'ring."),
      )
      console.error('Error saving partner:', error)
    }
  } finally {
    loading.value = false
  }
}

const goback = () => {
  if (props.embedded) emit('cancel')
  else router.push('/')
}
</script>

<style scoped>
.cf--page {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--ui-page-pad);
}
.cf__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}
.cf__head h2 {
  margin: 0;
  font-size: 20px;
  color: var(--ui-ink);
}
.cf__section {
  margin: 4px 0 12px;
  padding-bottom: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--ui-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--ui-line-soft);
}
.cf__section:not(:first-child) {
  margin-top: 8px;
}
.cf__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}
.cf__grid--3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.cf__form :deep(.el-form-item) {
  margin-bottom: 16px;
}
.cf__form :deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--ui-ink-2);
  padding-bottom: 4px;
}
.cf__form :deep(.el-select),
.cf__form :deep(.el-input) {
  width: 100%;
}
.cf__other {
  margin-top: 8px;
}
.cf__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--ui-line-soft);
}

@media (max-width: 640px) {
  .cf__grid,
  .cf__grid--3 {
    grid-template-columns: 1fr;
  }
}
</style>
