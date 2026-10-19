<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showConfirmDialog, showFailToast, showSuccessToast } from 'vant'
import dogovorApi from '@/api/dogovor'
import { useDogovorStore } from '@/stores/dogovor'
import { formatDate, telHref } from '@/utils/format'
import MPage from '../../components/MPage.vue'
import MEmpty from '../../components/MEmpty.vue'
import { useSession } from '../../session'
import { DOGOVOR_STATUSES, canModifyDoc, editHoursLeft, statusOf } from '../../docRules'
import { errorText, money } from '../../utils'
import { printDogovor } from '../../printer'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useDogovorStore()
const { user, isAdmin } = useSession()

const id = Number(route.params.id)
const row = ref(null)
const loading = ref(true)
const failed = ref(false)

async function load() {
  failed.value = false
  try {
    const res = await dogovorApi.getOne(id)
    row.value = res?.data || res
  } catch {
    // Ro'yxatdagi nusxa bo'lsa — shuni ko'rsatamiz
    row.value = (store.allDogovors || []).find((d) => d.id === id) || null
    failed.value = !row.value
  } finally {
    loading.value = false
  }
}
onMounted(load)

const canModify = computed(() => canModifyDoc(row.value, user.value))
const status = computed(() => statusOf(DOGOVOR_STATUSES, row.value?.dogovor_status))

const items = computed(() => (Array.isArray(row.value?.items) ? row.value.items : []))
const subtotal = computed(() =>
  items.value.reduce((acc, i) => acc + (Number(i.qty) || 0) * (Number(i.price) || 0), 0),
)

const fields = computed(() => {
  const d = row.value || {}
  return {
    main: [
      [t('dogovorManagerLabel'), d.manager_name],
      [t('dogovorSumLabel'), d.dogovor_sum != null ? money(d.dogovor_sum, t) : ''],
      [t('dogovorPaymentDateLabel'), d.payment_date ? formatDate(d.payment_date) : ''],
      [t('dogovorInitialPaymentLabel'), d.initial_payment != null ? money(d.initial_payment, t) : ''],
      [t('dogovorPrepaymentLabel'), d.prepayment_percent != null ? `${d.prepayment_percent}%` : ''],
      [t('dogovorProductionDaysLabel'), d.production_days],
    ].filter(([, v]) => v !== '' && v != null),
    client: [
      [t('dogovorInnLabel'), d.client_inn],
      [t('dogovorContactNameLabel'), d.contact_name],
      [t('dogovorContactPositionLabel'), d.contact_position],
      [t('dogovorAddressLabel'), d.client_address],
      [t('dogovorBankLabel'), d.client_bank],
      [t('dogovorAccountLabel'), d.client_account],
      [t('dogovorMfoLabel'), d.client_mfo],
      [t('dogovorVatCodeLabel'), d.client_vat_code],
    ].filter(([, v]) => v),
  }
})

const printing = ref(false)
async function print() {
  printing.value = true
  try {
    await printDogovor(row.value)
  } catch {
    showFailToast(t('dogovorPrintError'))
  } finally {
    printing.value = false
  }
}

async function remove() {
  try {
    await showConfirmDialog({
      message: t('dogovorDeleteConfirm'),
      confirmButtonText: t('deleteConfirm'),
      cancelButtonText: t('cancel'),
    })
  } catch {
    return
  }
  try {
    await store.deleteDogovor(id)
    showSuccessToast(t('dogovorMessageDeleted'))
    store.getAllDogovors().catch(() => {})
    router.back()
  } catch (e) {
    showFailToast(errorText(e, t, locale.value))
  }
}
</script>

<template>
  <MPage
    :title="row ? `№ ${row.dogovor_number ?? '—'}` : $t('dogovor')"
    :subtitle="row ? formatDate(row.dogovor_date) : ''"
    :back="{ name: 'dogovor' }"
    :on-refresh="load"
  >
    <template v-if="canModify" #right>
      <button type="button" class="m-head__btn" @click="router.push({ name: 'dogovor-edit', params: { id } })">
        <van-icon name="edit" />
      </button>
    </template>

    <div v-if="loading" class="m-card" style="margin-top: 12px"><van-skeleton :row="6" /></div>
    <MEmpty v-else-if="failed" icon="warning-o" :title="$t('m.loadFailed')">
      <van-button round type="primary" @click="load">{{ $t('m.retry') }}</van-button>
    </MEmpty>

    <template v-else-if="row">
      <section class="dd-hero">
        <span class="m-tag" :class="status?.tone">{{ status ? $t(status.labelKey) : row.dogovor_status }}</span>
        <h2>{{ row.client_name }}</h2>
        <p class="dd-sum m-num">{{ money(row.dogovor_sum, t) }}</p>
        <div class="dd-hero__actions">
          <a v-if="telHref(row.client_phone)" :href="telHref(row.client_phone)" class="dd-call">
            <van-icon name="phone" /> {{ row.client_phone }}
          </a>
          <van-button size="small" icon="description-o" :loading="printing" class="dd-print" @click="print">
            {{ $t('m.printDoc') }}
          </van-button>
        </div>
      </section>

      <div v-if="canModify && !isAdmin" class="dd-notice">
        <van-icon name="clock-o" /> {{ $t('m.docEditWindow', { h: editHoursLeft(row) }) }}
      </div>

      <div class="m-section"><span class="m-section__title">{{ $t('dogovorSectionMain') }}</span></div>
      <van-cell-group inset>
        <van-cell v-for="[label, value] in fields.main" :key="label" :title="label" :value="String(value)" value-class="dd-value" />
      </van-cell-group>

      <template v-if="fields.client.length">
        <div class="m-section"><span class="m-section__title">{{ $t('dogovorSectionRequisites') }}</span></div>
        <van-cell-group inset>
          <van-cell v-for="[label, value] in fields.client" :key="label" :title="label" :value="String(value)" value-class="dd-value" />
        </van-cell-group>
      </template>

      <template v-if="items.length">
        <div class="m-section"><span class="m-section__title">{{ $t('dogovorSectionItems') }} · {{ items.length }}</span></div>
        <div class="m-card dd-items">
          <div v-for="(it, i) in items" :key="i" class="dd-item">
            <p class="dd-item__name">{{ i + 1 }}. {{ it.name }}</p>
            <p class="dd-item__calc m-num">
              {{ it.qty }} {{ it.unit || '' }} × {{ money(it.price, t) }}
              <b>{{ money((Number(it.qty) || 0) * (Number(it.price) || 0), t) }}</b>
            </p>
          </div>
          <div class="dd-total">
            <span>{{ $t('dogovorItemsSubtotal') }}</span><b class="m-num">{{ money(subtotal, t) }}</b>
          </div>
          <div class="dd-total">
            <span>{{ $t('dogovorVat') }}</span><b class="m-num">{{ money(subtotal * 0.12, t) }}</b>
          </div>
          <div class="dd-total is-grand">
            <span>{{ $t('dogovorItemsTotal') }}</span><b class="m-num">{{ money(subtotal * 1.12, t) }}</b>
          </div>
        </div>
      </template>

      <template v-if="row.comment">
        <div class="m-section"><span class="m-section__title">{{ $t('dogovorCommentLabel') }}</span></div>
        <p class="m-card dd-text">{{ row.comment }}</p>
      </template>
      <template v-if="isAdmin && row.admin_comment">
        <div class="m-section"><span class="m-section__title">{{ $t('dogovorAdminCommentLabel') }}</span></div>
        <p class="m-card dd-text is-admin">{{ row.admin_comment }}</p>
      </template>

      <p v-if="!canModify" class="dd-locked"><van-icon name="lock" /> {{ $t('m.docLocked') }}</p>
    </template>

    <template v-if="row && canModify" #footer>
      <div class="m-footer">
        <van-button plain type="danger" icon="delete-o" @click="remove">{{ $t('deleteConfirm') }}</van-button>
        <van-button type="primary" icon="edit" @click="router.push({ name: 'dogovor-edit', params: { id } })">
          {{ $t('edit') }}
        </van-button>
      </div>
    </template>
  </MPage>
</template>

<style scoped>
.dd-hero {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 18px 16px;
  background: var(--m-surface);
  border-bottom: 1px solid var(--m-line);
}

.dd-hero h2 {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.dd-sum {
  font-size: 22px;
  font-weight: 700;
  color: var(--m-primary);
}

.dd-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.dd-print {
  height: 36px;
  border-radius: 10px;
  font-weight: 600;
}

.dd-call {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 10px;
  background: var(--m-good);
  color: var(--m-on-solid);
  font-weight: 600;
  font-size: 14px;
}

.dd-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 12px 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--m-primary-soft);
  color: var(--m-primary);
  font-size: 13px;
}

:deep(.dd-value) {
  flex: 1.4;
  color: var(--m-ink);
}

.dd-item {
  padding: 8px 0;
  border-bottom: 1px solid var(--m-line-soft);
}

.dd-item__name {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
}

.dd-item__calc {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 3px;
  font-size: 13px;
  color: var(--m-muted);
}

.dd-item__calc b {
  color: var(--m-ink);
  white-space: nowrap;
}

.dd-total {
  display: flex;
  justify-content: space-between;
  padding-top: 8px;
  font-size: 14px;
  color: var(--m-ink-2);
}

.dd-total.is-grand {
  font-size: 15px;
  color: var(--m-ink);
}

.dd-text {
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
}

.dd-text.is-admin {
  background: var(--m-warn-soft);
  color: var(--m-warn);
}

.dd-locked {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 14px 16px 0;
  font-size: 13px;
  color: var(--m-muted);
}
</style>
