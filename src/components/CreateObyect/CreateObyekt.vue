<template>
  <div class="container">
    <div class="header-row">
      <el-icon @click="goback()"><Back /></el-icon>
      <h2>Obyekt qo'shish</h2>
      <span class="dot">-</span>
    </div>
    <el-form :model="form" label-width="auto" style="max-width: 600px" class="form">
      <!-- Qachon obyektga ketyapti -->
      <el-form-item label="Obyektga ketish vaqti">
        <el-col :span="11">
          <el-config-provider :locale="locale">
            <el-date-picker
              v-model="form.goingtime"
              type="datetime"
              placeholder="Vaqtni tanlang"
              :disabled-date="disabledDate"
            />
          </el-config-provider>
        </el-col>
      </el-form-item>

      <!-- Qayerga -->
      <el-form-item label="Qayerga">
        <el-select v-model="form.where" placeholder="Tanlang">
          <el-option label="Zavod" value="Zavod" />
          <el-option label="Klient" value="Klient" />
          <el-option label="Shaxsiy" value="Shaxsiy" />
          <el-option label="Boshqa" value="boshqa" />
        </el-select>
        <el-input
          v-if="isWhereBoshqa"
          class="whereotherinput"
          v-model="form.whereother"
          placeholder="Boshqa qayerga ketyapsiz aka?"
        />
      </el-form-item>

      <!-- Dogovor or kp -->
      <el-form-item label="Dogov yoki KP">
        <el-select v-model="form.dogovororkp" placeholder="Tanlang">
          <el-option label="Dogovor" value="Dogovor" />
          <el-option label="KP" value="KP" />
          <el-option label="Boshqa" value="boshqa" />
        </el-select>
        <el-input
          v-if="isDogoKpNotSelected"
          class="whereotherinput"
          v-model="form.dogokpother"
          placeholder="Boshqa nima aka?"
        />
      </el-form-item>

      <!-- Dogovor raqami -->
      <el-form-item label="Dogovor raqami" v-if="isDogovorSelected">
        <el-input v-model="form.dogovornumber" style="width: 240px" placeholder="Kiriting" />
      </el-form-item>

      <!-- KP raqami -->
      <el-form-item label="KP raqami" v-if="isKPSelected">
        <el-input v-model="form.kpnumber" style="width: 240px" placeholder="Kiriting" />
      </el-form-item>

      <!-- Dogovor sanasi -->
      <el-form-item v-if="isDogovorSelected" label="Dogovor sanasi">
        <el-col :span="11">
          <el-config-provider :locale="locale">
            <el-date-picker
              v-model="form.dogovortime"
              type="date"
              placeholder="Vaqtni tanlang"
              size="default"
            />
          </el-config-provider>
        </el-col>
      </el-form-item>

      <!-- KP sanasi -->
      <el-form-item v-if="isKPSelected" label="KP sanasi">
        <el-col :span="11">
          <el-config-provider :locale="locale">
            <el-date-picker
              v-model="form.kptime"
              type="date"
              placeholder="Vaqtni tanlang"
              size="default"
            />
          </el-config-provider>
        </el-col>
      </el-form-item>

      <!-- Firma nomi -->
      <el-form-item v-if="isKPSelected || isDogovorSelected" label="Firma nomi">
        <el-input v-model="form.firmanomi" style="width: 240px" placeholder="Kiriting" />
      </el-form-item>

      <LocationPicker
        access-token="pk.eyJ1IjoidG9saWJqb25mYXl6IiwiYSI6ImNtY2x6amdkczBoZG0ya3NkYTI2NW8waWMifQ.yM3o-yj1ZPUGJG-gWREK6Q"
        :initial-center="{ lng: -74.006, lat: 40.7128 }"
        :initial-zoom="12"
        @location-selected="handleLocationSelected"
        @current-location="handleLocationSelected"
        @link-parsed="handleLocationSelected"
      />

      <el-form-item class="button-group">
        <el-button :loading="loading" type="primary" @click="onSubmit">Saqlash</el-button>
        <el-button type="warning" plain @click="goback()">Bekor qilish</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import LocationPicker from './LocationPicker.vue'
import ru from 'element-plus/dist/locale/ru.mjs'
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useComeAndGoesStore } from '@/stores/comeandgoes'
import router from '@/router'

const comeandgoesStore = useComeAndGoesStore()
const isWhereBoshqa = ref(false)
const isKPSelected = ref(false)
const isDogovorSelected = ref(false)
const isDogoKpNotSelected = ref(false)
const loading = ref(false)

const locale = ru
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
})

const handleLocationSelected = (location) => {
  form.lang = location.lng
  form.lat = location.lat
  form.locationname = location.address || ''
}

const disabledDate = (time) => {
  const today = new Date()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(today.getDate() - 2)
  const twoDaysLater = new Date()
  twoDaysLater.setDate(today.getDate() + 1)
  return time.getTime() < sevenDaysAgo.getTime() || time.getTime() > twoDaysLater.getTime()
}

const onSubmit = async () => {
  if (!form.goingtime) {
    ElMessage.warning('Iltimos, obyektga ketish vaqtini tanlang.')
    return
  }
  if (!form.where) {
    ElMessage.warning('Iltimos, qayerga ketayotganingizni tanlang.')
    return
  }
  if (!form.dogovororkp) {
    ElMessage.warning('Iltimos, Dogovor yoki KP ni tanlang.')
    return
  }
  if (!form.lat && !form.lang) {
    ElMessage.warning('Iltimos, joylashuvni tanlang.')
    return
  } else {
    loading.value = true
    const payload = {
      when_gone: form.goingtime,
      whereto: form.where === 'boshqa' ? form.whereother : form.where,
      dogovor_or_kp: form.dogovororkp === 'boshqa' ? form.dogokpother : form.dogovororkp,
      dogovorkp_date: form.dogovororkp === 'Dogovor' ? form.dogovortime : form.kptime || null,
      dogovorkp_number: form.dogovororkp === 'Dogovor' ? form.dogovornumber : form.kpnumber || null,
      company_name: form.firmanomi,
      lat: form.lat,
      lng: form.lang,
      locationname: form.locationname,
      user_id: Number(localStorage.getItem('userid')),
    }
    await comeandgoesStore.createComeAndGoes(payload)
    router.push('/')
    loading.value = false
  }
}

const goback = () => {
  router.push('/')
}

watch(form, async (value) => {
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
})
</script>

<style scoped lang="scss">
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  min-height: 100vh;
  padding-top: 20px;
}

.header-row {
  display: flex;
  align-items: center;
  gap: 185px;
  margin-bottom: 18px;
}

.header-row .el-icon {
  font-size: 22px;
  color: #222;
  cursor: pointer;
}

.header-row h2 {
  margin: 0;
  color: #222;
  font-weight: 600;
  letter-spacing: 0.5px;
  font-size: 22px;
  line-height: 1;
}

.form {
  background: #fff;
  padding: 32px 40px 24px 40px;
  border-radius: 12px;
  box-shadow: 0 2px 16px 0 rgba(0, 0, 0, 0.07);
  width: 100%;
  max-width: 600px;
}

.el-form-item {
  margin-bottom: 22px;
}

.el-form-item:last-child {
  margin-bottom: 0;
}

.el-button + .el-button {
  margin-left: 12px;
}

.whereotherinput {
  margin-top: 5px;
}

.button-group {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.dot {
  opacity: 0;
}
</style>
