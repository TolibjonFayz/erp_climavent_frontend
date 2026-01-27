<template>
  <div class="container">
    <div class="header-row">
      <el-icon @click="goback()"><Back /></el-icon>
      <h2>Yangi mijoz haqida ma'lumot</h2>
    </div>

    <el-form :model="form" label-width="auto" class="form">
      <el-form-item label="Respublika">
        <el-select
          v-model="form.republic"
          filterable
          placeholder="Tanlang"
          class="full-width-select"
        >
          <el-option label="O'zbekiston" value="ozbekiston" />
          <el-option label="Qozog'iston" value="qozogiston" />
          <el-option label="Tojikiston" value="tojikiston" />
          <el-option label="Turkmaniston" value="turkmaniston" />
          <el-option label="Qizg'iziston" value="qizgiziston" />
          <el-option label="Afg'oniston" value="afgoniston" />
          <el-option label="Azarbayjon" value="azarbayjon" />
          <el-option label="Eron" value="eron" />
          <el-option label="Pokiston" value="pokiston" />
          <el-option label="Armeniya" value="armeniya" />
          <el-option label="Boshqa" value="boshqa" />
        </el-select>
        <el-input
          v-if="isBoshqaRespublika"
          class="whereotherinput"
          v-model="form.otherrepublic"
          placeholder="Qaysi respublika?"
        />
      </el-form-item>

      <el-form-item label="Viloyat">
        <el-select
          v-model="form.viloyat"
          filterable
          placeholder="Tanlang"
          class="full-width-select"
        >
          <el-option label="Toshkent shahri" value="toshkent_shahri" />
          <el-option label="Toshkent viloyat" value="toshkent" />
          <el-option label="Andijon viloyat" value="andijon" />
          <el-option label="Fargʻona viloyat" value="fargona" />
          <el-option label="Namangan viloyat" value="namangan" />
          <el-option label="Sirdaryo viloyat" value="sirdaryo" />
          <el-option label="Jizzax viloyat" value="jizzax" />
          <el-option label="Samarqand viloyat" value="samarqand" />
          <el-option label="Qashqadaryo viloyat" value="qashqadaryo" />
          <el-option label="Surxondaryo viloyat" value="surxondaryo" />
          <el-option label="Navoiy viloyat" value="navoiy" />
          <el-option label="Buxoro viloyat" value="buxoro" />
          <el-option label="Xorazm viloyat" value="xorazm" />
          <el-option label="Qoraqalpogʻiston Respublikasi" value="qoraqalpogiston" />
          <el-option label="Boshqa" value="boshqa" />
        </el-select>
        <el-input
          v-if="isBoshqaViloyat"
          class="whereotherinput"
          :rows="2"
          v-model="form.otherviloyat"
          placeholder="Qaysi viloyat?"
          type="textarea"
        />
      </el-form-item>

      <el-form-item label="Tuman/Shahar">
        <el-select
          v-model="form.shahar_tuman"
          filterable
          placeholder="Tanlang"
          class="full-width-select"
        >
          <el-option label="Bektemir tumani" value="bektemir" />
          <el-option label="Chilonzor tumani" value="chilonzor" />
          <el-option label="Yashnobod tumani" value="yashnobod" />
          <el-option label="Mirobod tumani" value="mirobod" />
          <el-option label="Mirzo Ulugʻbek tumani" value="mirzo_ulugbek" />
          <el-option label="Sergeli tumani" value="sergeli" />
          <el-option label="Shayhontohur tumani" value="shayhontohur" />
          <el-option label="Olmazor tumani" value="olmazor" />
          <el-option label="Uchtepa tumani" value="uchtepa" />
          <el-option label="Yakkasaroy tumani" value="yakkasaroy" />
          <el-option label="Yunusobod tumani" value="yunusobod" />
          <el-option label="Yangihayot tumani" value="yangihayot" />
          <el-option label="Boshqa" value="boshqa" />
        </el-select>
        <el-input
          v-if="isBoshqaShaharTuman"
          class="whereotherinput"
          :rows="2"
          v-model="form.other_shahar_tuman"
          placeholder="Qaysi shahar/tuman?"
          type="textarea"
        />
      </el-form-item>

      <el-form-item label="Mijoz turi">
        <el-radio-group v-model="form.mijozturi" class="responsive-radio-group">
          <el-radio value="Yuridik shaxs">Yuridik shaxs</el-radio>
          <el-radio value="Jismoniy shaxs">Jismoniy shaxs</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="INN" v-if="form.mijozturi === 'Yuridik shaxs'">
        <el-input v-model="form.inn" placeholder="Kiriting" class="full-width-input" />
      </el-form-item>

      <el-form-item label="Telefon raqam">
        <el-input v-model="form.phone_number" placeholder="Kiriting" class="full-width-input" />
      </el-form-item>

      <el-form-item label="Qo'shimcha telefon raqam">
        <el-input
          v-model="form.additional_phone_number"
          placeholder="Kiriting"
          class="full-width-input"
        />
      </el-form-item>
      <el-form-item label="Ism familiya">
        <el-input v-model="form.fullname" placeholder="Kiriting" class="full-width-input" />
      </el-form-item>
    </el-form>

    <div class="button-group-container">
      <el-button :loading="loading" type="primary" @click="onSubmit">Saqlash</el-button>
      <el-button type="warning" plain @click="goback()">Ortga</el-button>
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
  if (!obj.mijozturi) {
    ElMessage.warning(`Iltimos mijoz turini tanlang.`)
    return false
  }
  if (!obj.inn && obj.mijozturi === 'Yuridik shaxs') {
    ElMessage.warning(`Iltimos INN ni kiriting.`)
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
