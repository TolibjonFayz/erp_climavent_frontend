<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { createLocationData, createRepublicOptions } from '@/constants/locations'
import MSelectSheet from './MSelectSheet.vue'

// Manzil: respublika → viloyat → shahar/tuman (saytdagi LocationFields bilan bir xil kaskad).
// Bazaga doimiy o'zbekcha nom yoziladi — constants/locations.js → locationPayload.
const props = defineProps({
  // republic, otherrepublic, viloyat, otherviloyat, shahar_tuman, other_shahar_tuman
  form: { type: Object, required: true },
  required: { type: Boolean, default: false },
})
const form = props.form

const { t, locale } = useI18n()
const BOSHQA = 'boshqa'
const other = () => ({ value: BOSHQA, label: t('Boshqa') })
// Tarjimalar til almashganda ham yangilansin
const locationData = computed(() => (locale.value, createLocationData(t)))

const republics = computed(() =>
  (locale.value, createRepublicOptions(t)).map((r) => ({ value: r.key, label: r.label })),
)
const viloyatlar = computed(() => {
  if (!form.republic) return []
  const list = form.republic === BOSHQA ? [] : locationData.value[form.republic] || []
  return [...list.map((v) => ({ value: v.value, label: v.label })), other()]
})
const tumanlar = computed(() => {
  if (!form.viloyat || form.viloyat === BOSHQA || form.republic === BOSHQA) return [other()]
  const found = (locationData.value[form.republic] || []).find((v) => v.value === form.viloyat)
  if (!found) return [other()]
  return found.tumanlar.map((item) => (item.value === 'Boshqa' ? other() : { label: item.label, value: item.value }))
})

const labelOf = (list, value) => list.find((o) => o.value === value)?.label || ''
const rules = (msg) => (props.required ? [{ required: true, message: msg }] : [])

const picker = ref(null) // 'republic' | 'viloyat' | 'tuman'
const pickerOpen = computed({
  get: () => !!picker.value,
  set: (v) => !v && (picker.value = null),
})
const pickerConfig = computed(() => {
  if (picker.value === 'republic') return { title: t('respublika'), options: republics.value, selected: form.republic }
  if (picker.value === 'viloyat') return { title: t('viloyat'), options: viloyatlar.value, selected: form.viloyat }
  return { title: t('shaharTuman'), options: tumanlar.value, selected: form.shahar_tuman }
})

function onPick(value) {
  if (picker.value === 'republic' && value !== form.republic) {
    Object.assign(form, { republic: value, otherrepublic: '', viloyat: '', otherviloyat: '', shahar_tuman: '', other_shahar_tuman: '' })
  } else if (picker.value === 'viloyat' && value !== form.viloyat) {
    Object.assign(form, { viloyat: value, otherviloyat: '', shahar_tuman: '', other_shahar_tuman: '' })
  } else if (picker.value === 'tuman') {
    form.shahar_tuman = value
    if (value !== BOSHQA) form.other_shahar_tuman = ''
  }
}
</script>

<template>
  <van-field
    :model-value="labelOf(republics, form.republic)"
    name="republic"
    :label="$t('respublika')"
    label-align="top"
    readonly
    is-link
    :placeholder="$t('m.choose')"
    :rules="rules($t('m.reqRepublic'))"
    @click="picker = 'republic'"
  />
  <van-field
    v-if="form.republic === 'boshqa'"
    v-model="form.otherrepublic"
    name="otherrepublic"
    :label="$t('m.republicName')"
    label-align="top"
    :rules="rules($t('m.reqRepublic'))"
  />
  <van-field
    :model-value="labelOf(viloyatlar, form.viloyat)"
    name="viloyat"
    :label="$t('viloyat')"
    label-align="top"
    readonly
    is-link
    :disabled="!form.republic"
    :placeholder="$t('m.choose')"
    :rules="rules($t('m.reqRegion'))"
    @click="form.republic && (picker = 'viloyat')"
  />
  <van-field
    v-if="form.viloyat === 'boshqa'"
    v-model="form.otherviloyat"
    name="otherviloyat"
    :label="$t('m.regionName')"
    label-align="top"
    :rules="rules($t('m.reqRegion'))"
  />
  <van-field
    :model-value="labelOf(tumanlar, form.shahar_tuman)"
    name="tuman"
    :label="$t('shaharTuman')"
    label-align="top"
    readonly
    is-link
    :disabled="!form.viloyat"
    :placeholder="$t('m.choose')"
    :rules="rules($t('m.reqDistrict'))"
    @click="form.viloyat && (picker = 'tuman')"
  />
  <van-field
    v-if="form.shahar_tuman === 'boshqa'"
    v-model="form.other_shahar_tuman"
    name="othertuman"
    :label="$t('m.districtName')"
    label-align="top"
    :rules="rules($t('m.reqDistrict'))"
  />

  <MSelectSheet
    v-model="pickerOpen"
    :title="pickerConfig.title"
    :options="pickerConfig.options"
    :selected="pickerConfig.selected"
    @select="onPick"
  />
</template>
