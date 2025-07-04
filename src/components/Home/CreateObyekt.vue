<template>
  <div class="container">
    <h2>Obyekt qo'shish</h2>
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
          <el-option label="Zavod" value="zavod" />
          <el-option label="Klient" value="klient" />
          <el-option label="Shaxsiy" value="shaxsiy" />
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
          <el-option label="Dogovor" value="dogovor" />
          <el-option label="KP" value="kp" />
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
        <el-input v-model="form.dogovornumber" style="width: 240px" placeholder="Kiriting" />
      </el-form-item>

      <!-- Dogovor sanasi -->
      <el-form-item v-if="isDogovorSelected" label="Dogovor sanasi">
        <el-col :span="11">
          <el-config-provider :locale="locale">
            <el-date-picker
              v-model="value1"
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
              v-model="value1"
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
        :access-token="MAPBOX_ACCESS_TOKEN"
        :initial-center="[69.2401, 41.2995]"
        :initial-zoom="10"
        :show-geocoding="true"
        @location-selected="handleLocationSelected"
      />

      <el-form-item>
        <el-button type="primary" @click="onSubmit">Saqlash</el-button>
        <el-button type="warning" plain>Bekor qilish</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import LocationPicker from './LocationPicker.vue'
import ru from 'element-plus/dist/locale/ru.mjs'
import { reactive, ref, watch } from 'vue'

const isWhereBoshqa = ref(false)
const isKPSelected = ref(false)
const isDogovorSelected = ref(false)
const isDogoKpNotSelected = ref(false)

const locale = ru
const form = reactive({
  goingtime: '',
  where: '',
  whereother: '',
  dogovororkp: '',
  dogokpother: '',
  dogovornumber: '',
  dogovortime: '',
  firmanomi: '',
  lat: '',
  lng: '',
})

const MAPBOX_ACCESS_TOKEN =
  'pk.eyJ1IjoidG9saWJqb25mYXl6IiwiYSI6ImNtY2x6amdkczBoZG0ya3NkYTI2NW8waWMifQ.yM3o-yj1ZPUGJG-gWREK6Q'

const handleLocationSelected = (location) => {
  console.log('Location selected:', location)
  form.lng = location.lng
  form.lat = location.lat
  console.log(form)
}

const disabledDate = (time) => {
  const today = new Date()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(today.getDate() - 2)
  const twoDaysLater = new Date()
  twoDaysLater.setDate(today.getDate() + 1)
  return time.getTime() < sevenDaysAgo.getTime() || time.getTime() > twoDaysLater.getTime()
}

const onSubmit = () => {
  console.log('submit!')
}

watch(form, async (value) => {
  if (value.where == 'boshqa') {
    isWhereBoshqa.value = true
  } else {
    isWhereBoshqa.value = false
  }
  if (value.dogovororkp == 'kp') {
    isKPSelected.value = true
    isDogovorSelected.value = false
    isDogoKpNotSelected.value = false
  } else if (value.dogovororkp == 'dogovor') {
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

h2 {
  margin-bottom: 18px;
  color: #222;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.whereotherinput {
  margin-top: 5px;
}
</style>
