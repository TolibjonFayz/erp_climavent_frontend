<template>
  <div class="container">
    <div class="header-row">
      <el-icon @click="goback()"><Back /></el-icon>
      <h2>Obyekt haqida batafsil ma'lumot</h2>
      <span class="dot">-</span>
    </div>
    <el-form
      v-loading="loading"
      :model="form"
      label-width="auto"
      style="max-width: 700px"
      class="form"
    >
      <!-- Qachon obyektga ketyapti -->
      <el-form-item label="Obyektga ketish vaqti:">
        <span>{{ form.goingtime }}</span>
      </el-form-item>

      <!-- Qachon obyektdan kelgan -->
      <el-form-item label="Obyektdan ishga qaytilgan vaqt:">
        <span style="margin-right: 10px" v-if="form.comingtime">{{
          formatDateShort(form.comingtime)
        }}</span>
        <el-col :span="11" v-if="!isMoreThanTwoDays(form.createdAt)">
          <el-config-provider :locale="locale">
            <el-date-picker v-model="form.comingtime" type="date" placeholder="Vaqtni tanlang" />
          </el-config-provider>
        </el-col>
        <el-alert
          v-if="isMoreThanTwoDays(form.createdAt) && !form.comingtime"
          class="itslatebro"
          title="Obyekt ochilganidan 2kundan keyin tahrirlay olmaysiz"
          type="error"
          :closable="false"
        />
      </el-form-item>

      <!-- Qayerga -->
      <el-form-item label="Qayerga:">
        <span>{{ form.where }}</span>
      </el-form-item>

      <!-- Dogovor or kp -->
      <el-form-item label="Dogov yoki KP:">
        <span>{{ form.dogovororkp }}</span>
      </el-form-item>

      <!-- Dogovor raqami -->
      <el-form-item label="Dogovor raqami:" v-if="form.dogovororkp == 'Dogovor'">
        <span>{{ form.dogovorkpnumber }}</span>
      </el-form-item>

      <!-- KP raqami -->
      <el-form-item label="KP raqami:" v-if="form.dogovororkp == 'KP'">
        <span>{{ form.dogovorkpnumber }}</span>
      </el-form-item>

      <!-- Dogovor sanasi -->
      <el-form-item v-if="form.dogovororkp == 'Dogovor'" label="Dogovor sanasi:">
        <span>{{ form.dogovorkptime }}</span>
      </el-form-item>

      <!-- KP sanasi -->
      <el-form-item v-if="form.dogovororkp == 'KP'" label="KP sanasi:">
        <span>{{ form.dogovorkptime }}</span>
      </el-form-item>

      <!-- Firma nomi -->
      <el-form-item v-if="form.firmanomi" label="Firma nomi:">
        <span>{{ form.firmanomi }}</span>
      </el-form-item>

      <LocationShower
        access-token="pk.eyJ1IjoidG9saWJqb25mYXl6IiwiYSI6ImNtY2x6amdkczBoZG0ya3NkYTI2NW8waWMifQ.yM3o-yj1ZPUGJG-gWREK6Q"
        :latitude="form.lat"
        :longitude="form.lang"
        :zoom="14"
        :show-address="true"
      />

      <el-form-item class="button-group">
        <el-button
          type="primary"
          :disabled="!isUpdating"
          @click="updateCameTime()"
          :loading="updateLoading"
          >Yangilash</el-button
        >
        <el-button type="warning" plain @click="goback()">Ortga</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { useComeAndGoesStore } from '@/stores/comeandgoes'
import { onMounted, reactive, ref, watch } from 'vue'
import LocationShower from './LocationShower.vue'
import ru from 'element-plus/dist/locale/ru.mjs'
import { useRoute } from 'vue-router'
import router from '@/router'

const comeandgoesStore = useComeAndGoesStore()
const updateLoading = ref(false)
const isUpdating = ref(false)
const loading = ref(false)
const route = useRoute()
const locale = ru

const form = reactive({
  goingtime: '',
  comingtime: '',
  where: '',
  dogovororkp: '',
  dogovorkpnumber: '',
  dogovorkptime: '',
  firmanomi: '',
  lat: '',
  lang: '',
  locationname: '',
  createdAt: '',
})

const goback = () => {
  router.push('/')
}

const updateCameTime = async () => {
  updateLoading.value = true
  const payload = {
    when_came: form.comingtime,
  }
  await comeandgoesStore.updateComeAndGoById(payload, route.params.id)
  isUpdating.value = false
  updateLoading.value = false
}

const formatDateShort = (date) => {
  const d = new Date(date)
  return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`
}

function isMoreThanTwoDays(time) {
  const givenTime = new Date(time)
  const currentTime = new Date()
  const timeDifference = Math.abs(currentTime - givenTime)
  const twoDaysInMs = 2 * 24 * 60 * 60 * 1000

  if (timeDifference < twoDaysInMs) {
    return false
  } else {
    return true
  }
}

watch(form, async (value) => {
  if (value.comingtime != null) {
    isUpdating.value = true
  }
})

onMounted(async () => {
  loading.value = true
  await comeandgoesStore.getComeAndGoById(route.params.id)
  form.goingtime = comeandgoesStore.comeandgobyid.when_gone
  form.comingtime = comeandgoesStore.comeandgobyid.when_came
  form.where = comeandgoesStore.comeandgobyid.whereto
  form.dogovororkp = comeandgoesStore.comeandgobyid.dogovor_or_kp
  form.dogovorkpnumber = comeandgoesStore.comeandgobyid.dogovorkp_number
  form.dogovorkptime = comeandgoesStore.comeandgobyid.dogovorkp_date
  form.lat = comeandgoesStore.comeandgobyid.lat
  form.lang = comeandgoesStore.comeandgobyid.lng
  form.firmanomi = comeandgoesStore.comeandgobyid.company_name
  form.createdAt = comeandgoesStore.comeandgobyid.createdAt
  loading.value = false
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
  gap: 140px;
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
  max-width: 700px;
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

.itslatebro {
  width: 350px;
  height: 30px;
}
</style>
