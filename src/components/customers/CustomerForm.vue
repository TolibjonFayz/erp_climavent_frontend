<template>
  <div class="container" :class="{ embedded }">
    <div class="header-row" v-if="!embedded">
      <el-icon @click="goback()"><Back /></el-icon>
      <h2>{{ $t('yangiMijozQoshishText') }}</h2>
    </div>

    <el-form :model="form" :rules="rules" ref="formRef" label-width="auto" class="form">
      <!-- ISM FAMILIYA -->
      <el-form-item :label="$t('ismFamiliya')" prop="fullname" required>
        <el-input v-model="form.fullname" :placeholder="$t('kiriting')" class="full-width-input" />
      </el-form-item>

      <!-- MIJOZ TURI -->
      <el-form-item :label="$t('mijozTuri')" prop="mijozturi" required>
        <el-radio-group v-model="form.mijozturi" class="responsive-radio-group">
          <el-radio value="yuridik">{{ $t('yuridikShaxs') }}</el-radio>
          <el-radio value="jismoniy">{{ $t('jismoniyShaxs') }}</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- INN (faqat yuridik shaxs uchun) -->
      <el-form-item :label="$t('inn')" v-if="form.mijozturi === 'yuridik'">
        <el-input v-model="form.inn" :placeholder="$t('kiriting')" class="full-width-input" />
      </el-form-item>

      <!-- TELEFON -->
      <el-form-item :label="$t('telefon')" prop="phone_number" required>
        <el-input
          v-model="form.phone_number"
          :placeholder="$t('kiriting')"
          class="full-width-input"
        />
      </el-form-item>

      <!-- QO'SHIMCHA TELEFON -->
      <el-form-item :label="$t('form_qoshimchaTelefon')">
        <el-input
          v-model="form.additional_phone_number"
          :placeholder="$t('form_qoshimchaTelefon_placeholder')"
          class="full-width-input"
        />
      </el-form-item>

      <!-- RESPUBLIKA -->
      <el-form-item :label="$t('respublika')" prop="republic" required>
        <el-select
          v-model="form.republic"
          filterable
          :placeholder="$t('tanlang')"
          class="full-width-select"
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
          class="whereotherinput"
          v-model="form.otherrepublic"
          :placeholder="$t('qaysiRespublika')"
        />
      </el-form-item>

      <!-- VILOYAT -->
      <el-form-item :label="$t('viloyat')" prop="viloyat" required>
        <el-select
          v-model="form.viloyat"
          filterable
          :placeholder="$t('tanlang')"
          class="full-width-select"
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
          class="whereotherinput"
          :rows="2"
          v-model="form.otherviloyat"
          :placeholder="$t('qaysiViloyat')"
          type="textarea"
        />
      </el-form-item>

      <!-- SHAHAR / TUMAN -->
      <el-form-item :label="$t('shaharTuman')" prop="shahar_tuman" required>
        <el-select
          v-model="form.shahar_tuman"
          filterable
          :placeholder="$t('tanlang')"
          class="full-width-select"
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
          class="whereotherinput"
          :rows="2"
          v-model="form.other_shahar_tuman"
          :placeholder="$t('qaysiShaharTuman')"
          type="textarea"
        />
      </el-form-item>
    </el-form>

    <div class="button-group-container">
      <el-button :loading="loading" type="primary" @click="onSubmit">{{ $t('save') }}</el-button>
      <el-button type="warning" plain @click="goback()">{{ $t('cancel') }}</el-button>
    </div>
  </div>
</template>

<script setup>
import { usePartnersStore } from '@/stores/partners'
import { reactive, ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
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

/* Inside a dialog: no full-screen centering or shadow needed */
.container.embedded {
  min-height: auto;
  padding: 0;

  .form {
    box-shadow: none;
    padding: 4px 2px;
    max-width: 100%;
    border-radius: 0;
  }

  .button-group-container {
    padding: 0;
    max-width: 100%;
    margin-top: 20px;
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

  .el-icon {
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

  h2 {
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
      letter-spacing: 0.3px;
    }
    @media (max-width: 380px) {
      font-size: 16px;
    }
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

    .el-button {
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

  &:last-child {
    margin-bottom: 0;
  }
}

.whereotherinput {
  padding-top: 5px;
}

.full-width-select {
  width: 100%;
}

.full-width-input {
  width: 100%;

  @media (min-width: 769px) {
    max-width: 240px;
  }
}

.responsive-radio-group {
  display: flex;
  flex-direction: row;
  gap: 16px;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 12px;
  }
}

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

:deep(.el-select) {
  width: 100%;
}

:deep(.el-form-item) {
  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
  }
}

:deep(.el-radio) {
  @media (max-width: 480px) {
    margin-right: 0;
    display: flex;
    align-items: center;
  }
}

:deep(.el-radio__label) {
  @media (max-width: 480px) {
    font-size: 14px;
  }
}
</style>
