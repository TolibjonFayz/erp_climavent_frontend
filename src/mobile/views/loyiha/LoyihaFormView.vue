<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showFailToast, showSuccessToast } from 'vant'
import loyihaApi from '@/api/loyiha'
import { useLoyihaStore } from '@/stores/loyiha'
import MPage from '../../components/MPage.vue'
import MDateField from '../../components/MDateField.vue'
import { errorText, money, numOrUndef, textOrUndef } from '../../utils'
import { tapFeedback } from '../../native'
import { difficultyLabelKey, difficultyTone } from './loyihaUi'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useLoyihaStore()

const editId = computed(() => (route.params.id ? Number(route.params.id) : null))
const loading = ref(!!editId.value)

const form = reactive({
  status: 'in_progress',
  manager_name: '',
  other_source: '',
  system_info: '',
  area: '',
  difficulty: 5,
  given_date: '',
  finished_date: '',
  contact_phone: '',
  contact_address: '',
  kp_number: '',
  kp_sum: '',
  kp_date: '',
  dogovor_number: '',
  dogovor_sum: '',
  dogovor_date: '',
  comment: '',
})

const day = (v) => (v ? String(v).slice(0, 10) : '')

onMounted(async () => {
  if (!editId.value) return
  try {
    const res = await loyihaApi.getOne(editId.value)
    const d = res?.data || res
    Object.assign(form, {
      status: d.status || 'in_progress',
      manager_name: d.manager_name || '',
      other_source: d.other_source || '',
      system_info: d.system_info || '',
      area: d.area ?? '',
      difficulty: d.difficulty || 5,
      given_date: day(d.given_date),
      finished_date: day(d.finished_date),
      contact_phone: d.contact_phone || '',
      contact_address: d.contact_address || '',
      kp_number: d.kp_number || '',
      kp_sum: d.kp_sum ?? '',
      kp_date: day(d.kp_date),
      dogovor_number: d.dogovor_number || '',
      dogovor_sum: d.dogovor_sum ?? '',
      dogovor_date: day(d.dogovor_date),
      comment: d.comment || '',
    })
  } catch (e) {
    showFailToast(errorText(e, t, locale.value))
    router.back()
  } finally {
    loading.value = false
  }
})

// "Tugadi" tanlansa va tugatilgan kun bo'sh bo'lsa — bugun (saytdagidek)
function setStatus(s) {
  form.status = s
  if (s === 'done' && !form.finished_date) {
    const n = new Date()
    const pad = (x) => String(x).padStart(2, '0')
    form.finished_date = `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`
  }
}

const finishedError = computed(() =>
  form.finished_date && form.given_date && form.finished_date < form.given_date
    ? t('loyihaFinishedBeforeGiven')
    : '',
)

const saving = ref(false)
async function save() {
  if (finishedError.value) return showFailToast(finishedError.value)
  // Saytdagi LoyihaFormDialog bilan bir xil payload
  const payload = {
    status: form.status,
    manager_name: textOrUndef(form.manager_name),
    other_source: textOrUndef(form.other_source),
    system_info: textOrUndef(form.system_info),
    area: numOrUndef(form.area),
    difficulty: form.difficulty || undefined,
    given_date: form.given_date || null,
    finished_date: form.finished_date || null,
    contact_phone: textOrUndef(form.contact_phone),
    contact_address: textOrUndef(form.contact_address),
    kp_number: textOrUndef(form.kp_number),
    kp_sum: numOrUndef(form.kp_sum),
    kp_date: textOrUndef(form.kp_date),
    dogovor_number: textOrUndef(form.dogovor_number),
    dogovor_sum: numOrUndef(form.dogovor_sum),
    dogovor_date: textOrUndef(form.dogovor_date),
    comment: textOrUndef(form.comment),
  }
  saving.value = true
  try {
    if (editId.value) {
      await store.updateLoyiha(editId.value, payload)
      showSuccessToast(t('loyihaMessageUpdated'))
      router.back()
    } else {
      const res = await store.createLoyiha(payload)
      showSuccessToast(t('loyihaMessageSaved'))
      const created = res?.data || res
      // Yangi loyiha — fayl yuklash uchun darhol uning sahifasiga
      if (created?.id) router.replace({ name: 'loyiha-detail', params: { id: created.id } })
      else router.back()
    }
    tapFeedback()
    store.getAllLoyihas().catch(() => {})
  } catch (e) {
    showFailToast({ message: errorText(e, t, locale.value), wordBreak: 'break-word' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <MPage :title="editId ? $t('loyihaEditTitle') : $t('loyihaDialogTitle')" :back="{ name: 'loyiha' }">
    <div v-if="loading" class="m-card" style="margin-top: 12px"><van-skeleton :row="8" /></div>
    <div v-else class="mf">
      <div class="m-section"><span class="m-section__title">{{ $t('loyihaStatusLabel') }}</span></div>
      <div class="mf-seg">
        <button type="button" :class="{ 'is-active': form.status === 'in_progress' }" @click="setStatus('in_progress')">
          🔧 {{ $t('loyihaStatusInProgress') }}
        </button>
        <button type="button" :class="{ 'is-active': form.status === 'done' }" @click="setStatus('done')">
          ✅ {{ $t('loyihaStatusDone') }}
        </button>
      </div>

      <div class="m-section"><span class="m-section__title">{{ $t('loyihaSectionMain') }}</span></div>
      <van-cell-group inset>
        <van-field v-model="form.manager_name" :label="$t('loyihaManagerLabel')" label-align="top" :placeholder="$t('loyihaManagerPlaceholder')" />
        <van-field v-model="form.other_source" :label="$t('loyihaOtherLabel')" label-align="top" :placeholder="$t('loyihaOtherPlaceholder')" />
        <van-field v-model="form.system_info" :label="$t('loyihaSystemLabel')" label-align="top" :placeholder="$t('loyihaSystemPlaceholder')" />
        <van-field v-model="form.area" :label="$t('loyihaAreaLabel')" label-align="top" type="number" />
        <van-field :label="$t('loyihaDifficultyLabel')" label-align="top">
          <template #input>
            <div class="mf-diff">
              <van-slider v-model="form.difficulty" :min="1" :max="10" :step="1" bar-height="6px" />
              <span class="m-tag" :class="difficultyTone(form.difficulty)">
                {{ form.difficulty }} · {{ $t(difficultyLabelKey(form.difficulty)) }}
              </span>
            </div>
          </template>
        </van-field>
        <MDateField v-model="form.given_date" :label="$t('loyihaGivenDateLabel')" />
        <MDateField v-model="form.finished_date" :label="$t('loyihaFinishedDateLabel')" :error="finishedError" />
      </van-cell-group>

      <div class="m-section"><span class="m-section__title">{{ $t('loyihaSectionClient') }}</span></div>
      <van-cell-group inset>
        <van-field v-model="form.contact_phone" :label="$t('loyihaPhoneLabel')" label-align="top" type="tel" />
        <van-field v-model="form.contact_address" :label="$t('loyihaAddressLabel')" label-align="top" type="textarea" rows="1" autosize />
      </van-cell-group>

      <div class="m-section"><span class="m-section__title">{{ $t('loyihaSectionKp') }}</span></div>
      <van-cell-group inset>
        <van-field v-model="form.kp_number" :label="$t('loyihaKpNumberLabel')" label-align="top" />
        <van-field v-model="form.kp_sum" :label="$t('loyihaKpSumLabel')" label-align="top" type="number">
          <template #extra><span v-if="form.kp_sum !== ''" class="mf-hint m-num">{{ money(form.kp_sum, t) }}</span></template>
        </van-field>
        <MDateField v-model="form.kp_date" :label="$t('loyihaKpDateLabel')" />
      </van-cell-group>

      <div class="m-section"><span class="m-section__title">{{ $t('loyihaSectionDogovor') }}</span></div>
      <van-cell-group inset>
        <van-field v-model="form.dogovor_number" :label="$t('loyihaDogovorNumberLabel')" label-align="top" />
        <van-field v-model="form.dogovor_sum" :label="$t('loyihaDogovorSumLabel')" label-align="top" type="number">
          <template #extra><span v-if="form.dogovor_sum !== ''" class="mf-hint m-num">{{ money(form.dogovor_sum, t) }}</span></template>
        </van-field>
        <MDateField v-model="form.dogovor_date" :label="$t('loyihaDogovorDateLabel')" />
      </van-cell-group>

      <div class="m-section"><span class="m-section__title">{{ $t('loyihaCommentLabel') }}</span></div>
      <van-cell-group inset>
        <van-field v-model="form.comment" type="textarea" rows="3" autosize :placeholder="$t('loyihaCommentPlaceholder')" />
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

.mf-seg {
  display: flex;
  margin: 0 12px;
  padding: 3px;
  border-radius: 12px;
  background: var(--m-line-soft);
}

.mf-seg button {
  flex: 1;
  border: 0;
  background: none;
  padding: 10px 4px;
  border-radius: 9px;
  font-size: 14px;
  font-weight: 500;
  color: var(--m-muted);
}

.mf-seg button.is-active {
  background: var(--m-surface);
  color: var(--m-ink);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.mf-diff {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 10px 4px 4px;
}

.mf-diff .van-slider {
  flex: 1;
}

.mf-hint {
  align-self: flex-end;
  font-size: 12px;
  color: var(--m-muted);
  white-space: nowrap;
}
</style>
