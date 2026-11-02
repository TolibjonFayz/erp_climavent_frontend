<template>
  <!-- Manzil: respublika → viloyat → shahar/tuman. Bazaga doimiy o'zbekcha nom yoziladi
       (constants/locations.js → locationPayload), ro'yxatda yo'g'i — "Boshqa" + qo'lda -->
  <div class="loc">
    <el-form-item :label="$t('respublika')" prop="republic" :required="required">
      <el-select v-model="form.republic" filterable :placeholder="$t('tanlang')" @change="onRepublicChange">
        <el-option v-for="item in republicOptions" :key="item.key" :label="item.label" :value="item.key" />
      </el-select>
      <el-input
        v-if="form.republic === 'boshqa'"
        v-model="form.otherrepublic"
        class="loc__other"
        :placeholder="$t('qaysiRespublika')"
      />
    </el-form-item>

    <el-form-item :label="$t('viloyat')" prop="viloyat" :required="required">
      <el-select
        v-model="form.viloyat"
        filterable
        :placeholder="$t('tanlang')"
        :disabled="!form.republic || (form.republic === 'boshqa' && !form.otherrepublic)"
        @change="onViloyatChange"
      >
        <el-option v-for="item in viloyatlar" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-input
        v-if="form.viloyat === 'boshqa'"
        v-model="form.otherviloyat"
        class="loc__other"
        :placeholder="$t('qaysiViloyat')"
      />
    </el-form-item>

    <el-form-item :label="$t('shaharTuman')" prop="shahar_tuman" :required="required">
      <el-select
        v-model="form.shahar_tuman"
        filterable
        :placeholder="$t('tanlang')"
        :disabled="!form.viloyat || (form.viloyat === 'boshqa' && !form.otherviloyat)"
        @change="form.other_shahar_tuman = ''"
      >
        <el-option v-for="item in tumanlar" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-input
        v-if="form.shahar_tuman === 'boshqa'"
        v-model="form.other_shahar_tuman"
        class="loc__other"
        :placeholder="$t('qaysiShaharTuman')"
      />
    </el-form-item>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { createLocationData, createRepublicOptions } from '@/constants/locations'

const props = defineProps({
  // republic, otherrepublic, viloyat, otherviloyat, shahar_tuman, other_shahar_tuman
  form: { type: Object, required: true },
  required: { type: Boolean, default: false },
})
const form = props.form

const { t, locale } = useI18n()
// Tarjimalar til almashganda ham yangilansin
const locationData = computed(() => (locale.value, createLocationData(t)))
const republicOptions = computed(() => (locale.value, createRepublicOptions(t)))
const other = () => ({ value: 'boshqa', label: t('Boshqa') })

const viloyatlar = computed(() => {
  if (!form.republic) return []
  if (form.republic === 'boshqa') return form.otherrepublic ? [other()] : []
  return [...(locationData.value[form.republic] || []), other()]
})

const tumanlar = computed(() => {
  if (!form.republic || !form.viloyat) return []
  if (form.viloyat === 'boshqa') return form.otherviloyat ? [other()] : []
  const found = (locationData.value[form.republic] || []).find((v) => v.value === form.viloyat)
  if (!found) return []
  return found.tumanlar.map((item) => (item.value === 'Boshqa' ? other() : item))
})

function onRepublicChange() {
  Object.assign(form, { otherrepublic: '', viloyat: '', otherviloyat: '', shahar_tuman: '', other_shahar_tuman: '' })
}
function onViloyatChange() {
  Object.assign(form, { otherviloyat: '', shahar_tuman: '', other_shahar_tuman: '' })
}
</script>

<style scoped>
.loc {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0 16px;
}
.loc__other {
  margin-top: 8px;
}
@media (max-width: 640px) {
  .loc {
    grid-template-columns: 1fr;
  }
}
</style>
