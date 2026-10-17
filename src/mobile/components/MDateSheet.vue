<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBackClose } from '../native'

// Sana (yoki sana + vaqt) tanlash oynasi. confirm → Date
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  value: { type: [Date, String, null], default: null },
  title: { type: String, default: '' },
  withTime: { type: Boolean, default: false },
  minDate: { type: Date, default: () => new Date(2020, 0, 1) },
  maxDate: { type: Date, default: () => new Date(new Date().getFullYear() + 3, 11, 31) },
})
const emit = defineEmits(['update:modelValue', 'confirm'])
const { t } = useI18n()

const show = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})
useBackClose(show)

const pad = (n) => String(n).padStart(2, '0')
const date = ref([])
const time = ref([])

watch(
  show,
  (v) => {
    if (!v) return
    let d = props.value ? new Date(props.value) : new Date()
    if (Number.isNaN(d.getTime())) d = new Date()
    if (d < props.minDate) d = new Date(props.minDate)
    if (d > props.maxDate) d = new Date(props.maxDate)
    date.value = [String(d.getFullYear()), pad(d.getMonth() + 1), pad(d.getDate())]
    time.value = [pad(d.getHours()), pad(d.getMinutes())]
  },
  { immediate: true },
)

const formatter = (type, option) => {
  if (type === 'month') option.text = t(`m.month${Number(option.value)}`)
  return option
}

function onConfirm() {
  const [y, m, d] = date.value.map(Number)
  const [h, min] = props.withTime ? time.value.map(Number) : [0, 0]
  emit('confirm', new Date(y, m - 1, d, h, min, 0, 0))
  show.value = false
}
</script>

<template>
  <van-popup
    v-model:show="show"
    position="bottom"
    round
    teleport="body"
    :close-on-popstate="false"
  >
    <van-picker-group
      v-if="withTime"
      :title="title"
      :tabs="[$t('m.date'), $t('m.time')]"
      :confirm-button-text="$t('m.done')"
      :cancel-button-text="$t('cancel')"
      @confirm="onConfirm"
      @cancel="show = false"
    >
      <van-date-picker
        v-model="date"
        :min-date="minDate"
        :max-date="maxDate"
        :formatter="formatter"
      />
      <van-time-picker v-model="time" />
    </van-picker-group>
    <van-date-picker
      v-else
      v-model="date"
      :title="title"
      :min-date="minDate"
      :max-date="maxDate"
      :formatter="formatter"
      :confirm-button-text="$t('m.done')"
      :cancel-button-text="$t('cancel')"
      @confirm="onConfirm"
      @cancel="show = false"
    />
  </van-popup>
</template>
