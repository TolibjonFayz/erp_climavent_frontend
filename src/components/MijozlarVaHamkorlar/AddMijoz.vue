<template>
  <div class="container">
    <div class="header-row">
      <el-icon @click="goback()"><Back /></el-icon>
      <h2>{{ $t('yangiMijozQoshishText') }}</h2>
    </div>

    <el-form :model="form" label-width="auto" class="form">
      <el-form-item :label="$t('respublika')">
        <el-select
          v-model="form.republic"
          filterable
          :placeholder="$t('tanlang')"
          class="full-width-select"
        >
          <el-option :label="$t('ozbekiston')" value="ozbekiston" />
          <el-option :label="$t('qozogiston')" value="qozogiston" />
          <el-option :label="$t('tojikiston')" value="tojikiston" />
          <el-option :label="$t('turkmaniston')" value="turkmaniston" />
          <el-option :label="$t('qizgiziston')" value="qizgiziston" />
          <el-option :label="$t('afgoniston')" value="afgoniston" />
          <el-option :label="$t('azarbayjon')" value="azarbayjon" />
          <el-option :label="$t('eron')" value="eron" />
          <el-option :label="$t('pokiston')" value="pokiston" />
          <el-option :label="$t('armeniya')" value="armeniya" />
          <el-option :label="$t('boshqa')" value="boshqa" />
        </el-select>
        <el-input
          v-if="isBoshqaRespublika"
          class="whereotherinput"
          v-model="form.otherrepublic"
          :placeholder="$t('qaysiRespublika')"
        />
      </el-form-item>

      <el-form-item :label="$t('viloyat')">
        <el-select
          v-model="form.viloyat"
          filterable
          :placeholder="$t('tanlang')"
          class="full-width-select"
        >
          <el-option :label="$t('toshkent_shahri')" value="toshkent_shahri" />
          <el-option :label="$t('toshkent')" value="toshkent" />
          <el-option :label="$t('andijon')" value="andijon" />
          <el-option :label="$t('fargona')" value="fargona" />
          <el-option :label="$t('namangan')" value="namangan" />
          <el-option :label="$t('sirdaryo')" value="sirdaryo" />
          <el-option :label="$t('jizzax')" value="jizzax" />
          <el-option :label="$t('samarqand')" value="samarqand" />
          <el-option :label="$t('qashqadaryo')" value="qashqadaryo" />
          <el-option :label="$t('surxondaryo')" value="surxondaryo" />
          <el-option :label="$t('navoiy')" value="navoiy" />
          <el-option :label="$t('buxoro')" value="buxoro" />
          <el-option :label="$t('xorazm')" value="xorazm" />
          <el-option :label="$t('qoraqalpogiston')" value="qoraqalpogiston" />
          <el-option :label="$t('boshqa')" value="boshqa" />
        </el-select>
        <el-input
          v-if="isBoshqaViloyat"
          class="whereotherinput"
          :rows="2"
          v-model="form.otherviloyat"
          :placeholder="$t('qaysiViloyat')"
          type="textarea"
        />
      </el-form-item>

      <el-form-item :label="$t('shaharTuman')">
        <el-select
          v-model="form.shahar_tuman"
          filterable
          :placeholder="$t('tanlang')"
          class="full-width-select"
        >
          <el-option :label="$t('bektemir')" value="bektemir" />
          <el-option :label="$t('chilonzor')" value="chilonzor" />
          <el-option :label="$t('yashnobod')" value="yashnobod" />
          <el-option :label="$t('mirobod')" value="mirobod" />
          <el-option :label="$t('mirzo_ulugbek')" value="mirzo_ulugbek" />
          <el-option :label="$t('sergeli')" value="sergeli" />
          <el-option :label="$t('shayhontohur')" value="shayhontohur" />
          <el-option :label="$t('olmazor')" value="olmazor" />
          <el-option :label="$t('uchtepa')" value="uchtepa" />
          <el-option :label="$t('yakkasaroy')" value="yakkasaroy" />
          <el-option :label="$t('yunusobod')" value="yunusobod" />
          <el-option :label="$t('yangihayot')" value="yangihayot" />
          <el-option :label="$t('boshqa')" value="boshqa" />
        </el-select>
        <el-input
          v-if="isBoshqaShaharTuman"
          class="whereotherinput"
          :rows="2"
          v-model="form.other_shahar_tuman"
          :placeholder="$t('qaysiShaharTuman')"
          type="textarea"
        />
      </el-form-item>

      <el-form-item :label="$t('mijozTuri')">
        <el-radio-group v-model="form.mijozturi" class="responsive-radio-group">
          <el-radio value="Yuridik shaxs">{{ $t('yuridikShaxs') }}</el-radio>
          <el-radio value="Jismoniy shaxs">{{ $t('jismoniyShaxs') }}</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item :label="$t('inn')" v-if="form.mijozturi === 'Yuridik shaxs'">
        <el-input v-model="form.inn" :placeholder="$t('tanlang')" class="full-width-input" />
      </el-form-item>

      <el-form-item :label="$t('telefon')">
        <el-input
          v-model="form.phone_number"
          :placeholder="$t('tanlang')"
          class="full-width-input"
        />
      </el-form-item>

      <el-form-item :label="$t('qoshimcha')">
        <el-input
          v-model="form.additional_phone_number"
          :placeholder="$t('tanlang')"
          class="full-width-input"
        />
      </el-form-item>
      <el-form-item :label="$t('ismFamiliya')">
        <el-input v-model="form.fullname" :placeholder="$t('tanlang')" class="full-width-input" />
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
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import router from '@/router'

const partnersStore = usePartnersStore()
const isBoshqaRespublika = ref(false)
const isBoshqaViloyat = ref(false)
const isBoshqaShaharTuman = ref(false)
const loading = ref(false)

function getCookie(name) {
  const cookies = document.cookie.split('; ')
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.split('=')
    if (cookieName === name) {
      return decodeURIComponent(cookieValue)
    }
  }
  return 'uz'
}
const lang = getCookie('lang')

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

const validateObject = (obj) => {
  if (lang === 'uz') {
    if (!obj.republic) {
      ElMessage.warning(`Iltimos respublikani tanlang.`)
      return false
    }
    if (obj.republic === 'boshqa' && !obj.otherrepublic) {
      ElMessage.warning(`Iltimos respublikani kiriting.`)
      return false
    }
    if (!obj.viloyat) {
      ElMessage.warning(`Iltimos viloyatni tanlang.`)
      return false
    }
    if (obj.viloyat === 'boshqa' && !obj.otherviloyat) {
      ElMessage.warning(`Iltimos viloyatni kiriting.`)
      return false
    }
    if (!obj.shahar_tuman) {
      ElMessage.warning(`Iltimos shahar/tumanni tanlang.`)
      return false
    }
    if (obj.shahar_tuman === 'boshqa' && !obj.other_shahar_tuman) {
      ElMessage.warning(`Iltimos shahar/tuman nomini kiriting.`)
      return false
    }
    if (!obj.mijozturi) {
      ElMessage.warning(`Iltimos mijoz turini tanlang.`)
      return false
    }
    if (!obj.phone_number) {
      ElMessage.warning(`Iltimos telefon raqamni kiriting.`)
      return false
    }
    if (!obj.fullname) {
      ElMessage.warning(`Iltimos ism familiyani kiriting.`)
      return false
    }
    return true
  } else if (lang === 'ru') {
    if (!obj.republic) {
      ElMessage.warning(`Пожалуйста, выберите республику.`)
      return false
    }
    if (obj.republic === 'boshqa' && !obj.otherrepublic) {
      ElMessage.warning(`Пожалуйста, введите республику.`)
      return false
    }
    if (!obj.viloyat) {
      ElMessage.warning(`Пожалуйста, выберите область.`)
      return false
    }
    if (obj.viloyat === 'boshqa' && !obj.otherviloyat) {
      ElMessage.warning(`Пожалуйста, введите область.`)
      return false
    }
    if (!obj.shahar_tuman) {
      ElMessage.warning(`Пожалуйста, выберите город/район.`)
      return false
    }
    if (obj.shahar_tuman === 'boshqa' && !obj.other_shahar_tuman) {
      ElMessage.warning(`Пожалуйста, введите название города/района.`)
      return false
    }
    if (!obj.mijozturi) {
      ElMessage.warning(`Пожалуйста, выберите тип клиента.`)
      return false
    }
    if (!obj.phone_number) {
      ElMessage.warning(`Пожалуйста, введите номер телефона.`)
      return false
    }
    if (!obj.fullname) {
      ElMessage.warning(`Пожалуйста, введите имя и фамилию.`)
      return false
    }
    return true
  }
}

const createMijozPayload = (obj) => {
  return {
    republic: obj.republic === 'boshqa' ? obj.otherrepublic : obj.republic,
    viloyat: obj.viloyat === 'boshqa' ? obj.otherviloyat : obj.viloyat,
    shahar_tuman: obj.shahar_tuman === 'boshqa' ? obj.other_shahar_tuman : obj.shahar_tuman,
    mijozturi: obj.mijozturi,
    inn: obj.inn,
    phone_number: obj.phone_number,
    additional_phone_number: obj.additional_phone_number,
    fullname: obj.fullname,
    partner_type: localStorage.getItem('mijozTur'),
    user_id: Number(localStorage.getItem('userid')),
  }
}

const onSubmit = async () => {
  if (!validateObject(form)) {
    return
  }
  loading.value = true

  try {
    const mainPayload = {
      ...createMijozPayload(form),
    }
    console.log('Creating partner with payload:', mainPayload)
    await partnersStore.createPartner(mainPayload)
    ElMessage.success('Barcha malumotlar muvaffaqiyatli saqlandi!')
    router.push('/')
  } catch (error) {
    ElMessage.error('Xatolik yuz berdi: ' + (error.message || "Iltimos, qaytadan urinib ko'ring."))
    console.error('Error saving objects:', error)
  } finally {
    loading.value = false
  }
}

const goback = () => {
  router.push('/')
}

watch(
  form,
  (value) => {
    if (value.republic == 'boshqa') {
      isBoshqaRespublika.value = true
    } else {
      isBoshqaRespublika.value = false
    }
    if (value.viloyat == 'boshqa') {
      isBoshqaViloyat.value = true
    } else {
      isBoshqaViloyat.value = false
    }
    if (value.shahar_tuman == 'boshqa') {
      isBoshqaShaharTuman.value = true
    } else {
      isBoshqaShaharTuman.value = false
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
    letter-spacing: 0.3px;
  }

  @media (max-width: 380px) {
    font-size: 16px;
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

  .form-section-title {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
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

// Full width classes for responsive inputs
.full-width-select {
  width: 100%;
}

.full-width-input {
  width: 100%;

  @media (min-width: 769px) {
    max-width: 240px;
  }
}

// Responsive radio group
.responsive-radio-group {
  display: flex;
  flex-direction: row;
  gap: 16px;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 12px;
  }
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

// Radio buttons responsive styling
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
