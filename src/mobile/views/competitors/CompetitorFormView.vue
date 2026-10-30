<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showFailToast, showSuccessToast } from 'vant'
import competitorsApi from '@/api/competitors'
import MPage from '../../components/MPage.vue'
import { errorText } from '../../utils'
import { tapFeedback } from '../../native'

// Raqib qo'shish yoki tahrirlash (katalog umumiy — bir raqib bir marta yoziladi)
const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()

const editId = computed(() => (route.params.id ? Number(route.params.id) : null))
const loading = ref(!!editId.value)
const FIELDS = ['name', 'brands', 'website', 'phone', 'strengths', 'weaknesses', 'note']
const form = reactive(Object.fromEntries(FIELDS.map((f) => [f, ''])))
const nameError = ref('')

onMounted(async () => {
  if (!editId.value) return
  try {
    const c = ((await competitorsApi.list()) || []).find((x) => x.id === editId.value)
    if (!c) throw new Error('not found')
    for (const f of FIELDS) form[f] = c[f] || ''
  } catch (e) {
    showFailToast(errorText(e, t, locale.value))
    router.back()
  } finally {
    loading.value = false
  }
})

const saving = ref(false)
async function save() {
  nameError.value = form.name.trim() ? '' : t('cmpNameRequired')
  if (nameError.value) return
  saving.value = true
  try {
    if (editId.value) await competitorsApi.update(editId.value, { ...form })
    else await competitorsApi.create({ ...form })
    showSuccessToast(t('cmpSaved'))
    tapFeedback()
    router.back()
  } catch (e) {
    showFailToast({ message: errorText(e, t, locale.value), wordBreak: 'break-word' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <MPage :title="editId ? $t('cmpEditTitle') : $t('cmpAddTitle')" :back="{ name: 'competitors' }">
    <div v-if="loading" class="m-card" style="margin-top: 12px"><van-skeleton :row="5" /></div>
    <div v-else class="mf">
      <div class="m-section"><span class="m-section__title">{{ $t('m.mainInfo') }}</span></div>
      <van-cell-group inset>
        <van-field v-model="form.name" :label="$t('cmpName')" label-align="top" maxlength="160" :error-message="nameError" :placeholder="$t('kiriting')" />
        <van-field v-model="form.brands" :label="$t('cmpBrands')" label-align="top" maxlength="300" :placeholder="$t('cmpBrandsHint')" />
        <van-field v-model="form.website" :label="$t('cmpWebsite')" label-align="top" maxlength="200" placeholder="example.uz" />
        <van-field v-model="form.phone" :label="$t('telefon')" label-align="top" type="tel" maxlength="64" placeholder="+998..." />
      </van-cell-group>

      <div class="m-section"><span class="m-section__title">{{ $t('cmpStrengths') }} / {{ $t('cmpWeaknesses') }}</span></div>
      <van-cell-group inset>
        <van-field v-model="form.strengths" :label="$t('cmpStrengths')" label-align="top" type="textarea" rows="2" autosize />
        <van-field v-model="form.weaknesses" :label="$t('cmpWeaknesses')" label-align="top" type="textarea" rows="2" autosize />
        <van-field v-model="form.note" :label="$t('cmpNote')" label-align="top" type="textarea" rows="2" autosize />
      </van-cell-group>
    </div>

    <template #footer>
      <div class="m-footer">
        <van-button type="primary" block :loading="saving" :disabled="loading" @click="save">{{ $t('save') }}</van-button>
      </div>
    </template>
  </MPage>
</template>

<style scoped>
.mf {
  padding-bottom: 16px;
}
.mf :deep(.van-field__label) {
  color: var(--m-muted);
  font-size: 13px;
}
</style>
