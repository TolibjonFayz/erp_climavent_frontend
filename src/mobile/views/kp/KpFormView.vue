<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showFailToast, showSuccessToast } from 'vant'
import kpApi from '@/api/kp'
import { useKPsStore } from '@/stores/kp'
import {
  CONTRACT_NUMBER_OPTION,
  KP_COMMENT_OPTIONS,
  OTHER_COMMENT_OPTION,
  deriveCommentForm,
  resolveCommentValue,
} from '@/constants/kpComments'
import MPage from '../../components/MPage.vue'
import MDateField from '../../components/MDateField.vue'
import MSelectSheet from '../../components/MSelectSheet.vue'
import { useSession } from '../../session'
import { KP_STATUSES } from '../../docRules'
import { errorText, money, numOrUndef, textOrUndef } from '../../utils'
import { tapFeedback } from '../../native'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const kpStore = useKPsStore()
const { isAdmin } = useSession()

const editId = computed(() => (route.params.id ? Number(route.params.id) : null))
const loading = ref(!!editId.value)

const form = reactive({
  kp_number: '',
  kp_status: 'Open',
  client_name: '',
  kp_date: '',
  manager_name: '',
  kp_sum: '',
  dogovor_next: '',
  closed_date: '',
  commentSelect: '',
  contractNumber: '',
  customComment: '',
  admin_comment: '',
})
const errors = reactive({})

onMounted(async () => {
  if (!editId.value) return
  try {
    let kp = (kpStore.allKPs || []).find((k) => k.id === editId.value)
    if (!kp) {
      const res = await kpApi.getOne(editId.value)
      kp = res?.data || res
    }
    Object.assign(form, {
      kp_number: kp.kp_number ?? '',
      kp_status: kp.kp_status || kp.status || 'Open',
      client_name: kp.client_name || '',
      kp_date: kp.kp_date ? String(kp.kp_date).slice(0, 10) : '',
      manager_name: kp.manager_name || '',
      kp_sum: kp.kp_sum ?? '',
      dogovor_next: kp.dogovor_next ? String(kp.dogovor_next).slice(0, 10) : '',
      closed_date: kp.closed_date ? String(kp.closed_date).slice(0, 10) : '',
      ...deriveCommentForm(kp.comment),
      admin_comment: kp.admin_comment || '',
    })
  } catch (e) {
    showFailToast(errorText(e, t, locale.value))
    router.back()
  } finally {
    loading.value = false
  }
})

const commentSheet = ref(false)
const commentOptions = KP_COMMENT_OPTIONS.map((c) => ({ value: c, label: c }))

function validate() {
  for (const k of Object.keys(errors)) delete errors[k]
  if (!form.kp_status) errors.kp_status = t('kpValidationStatus')
  if (!form.client_name.trim()) errors.client_name = t('kpValidationClient')
  if (!form.kp_date) errors.kp_date = t('kpValidationDate')
  if (!form.manager_name.trim()) errors.manager_name = t('kpValidationManager')
  if (form.kp_sum === '' || form.kp_sum === null) errors.kp_sum = t('kpValidationSum')
  return !Object.keys(errors).length
}

const saving = ref(false)
async function save() {
  if (!validate()) {
    showFailToast(t('m.fillRequired'))
    return
  }
  // Saytdagi KP.vue handleSubmit bilan bir xil payload
  const payload = {
    kp_number: numOrUndef(form.kp_number),
    kp_status: form.kp_status,
    client_name: form.client_name.trim(),
    kp_date: form.kp_date,
    manager_name: form.manager_name.trim(),
    kp_sum: Number(form.kp_sum),
    dogovor_next: form.dogovor_next || undefined,
    closed_date: form.closed_date || undefined,
    comment: resolveCommentValue(form) || undefined,
  }
  if (isAdmin.value) payload.admin_comment = textOrUndef(form.admin_comment)

  saving.value = true
  try {
    if (editId.value) {
      await kpStore.updateKP(editId.value, payload)
      showSuccessToast(t('kpMessageUpdated'))
    } else {
      await kpStore.createKP(payload)
      showSuccessToast(t('kpMessageSaved'))
    }
    tapFeedback()
    kpStore.getAllKPs().catch(() => {})
    router.back()
  } catch (e) {
    showFailToast({ message: errorText(e, t, locale.value), wordBreak: 'break-word' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <MPage :title="editId ? $t('m.editKp') : $t('kpDialogTitle')" :back="{ name: 'kp' }">
    <div v-if="loading" class="m-card" style="margin-top: 12px"><van-skeleton :row="6" /></div>
    <div v-else class="mf">
      <div class="m-section"><span class="m-section__title">{{ $t('kpStatusLabel') }}</span></div>
      <div class="mf-seg">
        <button
          v-for="s in KP_STATUSES"
          :key="s.value"
          type="button"
          :class="{ 'is-active': form.kp_status === s.value }"
          @click="form.kp_status = s.value"
        >
          {{ $t(s.labelKey) }}
        </button>
      </div>

      <div class="m-section"><span class="m-section__title">{{ $t('m.mainInfo') }}</span></div>
      <van-cell-group inset>
        <van-field v-model="form.kp_number" :label="$t('kpNumberLabel')" label-align="top" type="digit" :placeholder="$t('m.optional')" />
        <van-field v-model="form.client_name" :label="$t('kpClientLabel')" label-align="top" :error-message="errors.client_name" :placeholder="$t('kiriting')" />
        <van-field v-model="form.manager_name" :label="$t('kpManagerLabel')" label-align="top" :error-message="errors.manager_name" :placeholder="$t('kiriting')" />
        <van-field
          v-model="form.kp_sum"
          :label="$t('kpSumLabel')"
          label-align="top"
          type="number"
          :error-message="errors.kp_sum"
          :placeholder="'0'"
        >
          <template #extra>
            <span v-if="form.kp_sum !== ''" class="mf-hint m-num">{{ money(form.kp_sum, t) }}</span>
          </template>
        </van-field>
      </van-cell-group>

      <div class="m-section"><span class="m-section__title">{{ $t('m.dates') }}</span></div>
      <van-cell-group inset>
        <MDateField v-model="form.kp_date" :label="$t('kpDateLabel')" :clearable="false" :error="errors.kp_date" />
        <MDateField v-model="form.dogovor_next" :label="$t('kpNextDateLabel')" />
        <MDateField v-model="form.closed_date" :label="$t('kpClosedDateLabel')" />
      </van-cell-group>

      <div class="m-section"><span class="m-section__title">{{ $t('kpCommentLabel') }}</span></div>
      <van-cell-group inset>
        <van-field
          :model-value="form.commentSelect"
          :label="$t('kpCommentLabel')"
          label-align="top"
          readonly
          is-link
          type="textarea"
          autosize
          rows="1"
          :placeholder="$t('m.choose')"
          @click="commentSheet = true"
        >
          <template v-if="form.commentSelect" #right-icon>
            <van-icon name="clear" class="mf-clear" @click.stop="form.commentSelect = ''" />
          </template>
        </van-field>
        <van-field
          v-if="form.commentSelect === CONTRACT_NUMBER_OPTION"
          v-model="form.contractNumber"
          :label="$t('kpContractNumberLabel')"
          label-align="top"
          :placeholder="$t('kiriting')"
        />
        <van-field
          v-if="form.commentSelect === OTHER_COMMENT_OPTION"
          v-model="form.customComment"
          :label="$t('kpCustomCommentLabel')"
          label-align="top"
          type="textarea"
          rows="3"
          autosize
        />
        <van-field
          v-if="isAdmin"
          v-model="form.admin_comment"
          :label="$t('kpAdminCommentLabel')"
          label-align="top"
          type="textarea"
          rows="2"
          autosize
        />
      </van-cell-group>
    </div>

    <template #footer>
      <div class="m-footer">
        <van-button type="primary" block :loading="saving" :disabled="loading" @click="save">{{ $t('save') }}</van-button>
      </div>
    </template>

    <MSelectSheet
      v-model="commentSheet"
      :title="$t('kpCommentLabel')"
      :options="commentOptions"
      :selected="form.commentSelect"
      searchable
      @select="(v) => (form.commentSelect = v)"
    />
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

.mf-hint {
  align-self: flex-end;
  font-size: 12px;
  color: var(--m-muted);
  white-space: nowrap;
}

.mf-clear {
  color: var(--m-faint);
  font-size: 18px;
}
</style>
