<script setup>
import { computed, onActivated, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showFailToast, showToast } from 'vant'
import { useDogovorStore } from '@/stores/dogovor'
import dogovorApi from '@/api/dogovor'
import { formatDate, telHref } from '@/utils/format'
import MPage from '../../components/MPage.vue'
import MStats from '../../components/MStats.vue'
import MEmpty from '../../components/MEmpty.vue'
import { showActionSheet } from '../../actionSheet'
import { exportExcel } from '../../exporter'
import { useSession } from '../../session'
import { DOGOVOR_STATUSES, canModifyDoc, statusOf } from '../../docRules'
import { errorText, money, moneyShort } from '../../utils'

const { t, locale } = useI18n()
const router = useRouter()
const store = useDogovorStore()
const { user, isAdmin } = useSession()

// ─── Ro'yxat: serverdan bo'laklab (8 mingdan ortiq shartnoma — hammasini yuklamaymiz) ───
const PAGE = 30
const rows = ref([])
const total = ref(0)
const stats = ref({ total: 0, sum: 0, byStatus: {} })
const loaded = ref(false)
const listLoading = ref(false)
const finished = ref(false)

const search = ref('')
const status = ref('')
const params = () => ({ q: search.value.trim() || undefined, status: status.value || undefined })

let seq = 0
async function fetchPage(page) {
  const my = ++seq
  try {
    const res = await dogovorApi.getPage({ ...params(), page, limit: PAGE })
    if (my !== seq) return
    rows.value = page === 1 ? res.rows || [] : [...rows.value, ...(res.rows || [])]
    total.value = res.total || 0
    stats.value = res.stats || stats.value
    finished.value = rows.value.length >= total.value
  } catch (e) {
    if (my === seq) {
      finished.value = true
      showFailToast(errorText(e, t, locale.value))
    }
  } finally {
    if (my === seq) {
      loaded.value = true
      listLoading.value = false
    }
  }
}
const reload = () => fetchPage(1)
function onLoadMore() {
  if (finished.value) return (listLoading.value = false)
  fetchPage(Math.floor(rows.value.length / PAGE) + 1)
}
onMounted(reload)
onActivated(() => loaded.value && reload())

// Qidiruv yozish to'xtagach, holat darhol
let timer = 0
watch(search, () => {
  clearTimeout(timer)
  timer = setTimeout(reload, 300)
})
watch(status, reload)

const stat = (key) => stats.value.byStatus?.[key] || { count: 0, sum: 0 }
const statsCards = computed(() => [
  {
    key: 'all',
    label: t('dogovorStatTotal'),
    value: stats.value.total,
    sub: moneyShort(stats.value.sum, t),
    active: !status.value,
    onClick: () => (status.value = ''),
  },
  ...DOGOVOR_STATUSES.map((s) => ({
    key: s.value,
    label: t(s.labelKey),
    value: stat(s.value).count,
    sub: moneyShort(stat(s.value).sum, t),
    tone: s.value === 'Shipped' ? 'good' : s.value === 'PartlyShipped' ? 'warn' : '',
    active: status.value === s.value,
    onClick: () => (status.value = status.value === s.value ? '' : s.value),
  })),
])


const dgRow = (row, i) => ({
  '№': i + 1,
  [t('dogovorNumberLabel')]: row.dogovor_number ?? '—',
  [t('dogovorDateLabel')]: formatDate(row.dogovor_date),
  [t('dogovorClientLabel')]: row.client_name || '—',
  [t('dogovorSumLabel')]: Number(row.dogovor_sum) || 0,
  [t('dogovorStatusLabel')]: statusOf(DOGOVOR_STATUSES, row.dogovor_status) ? t(statusOf(DOGOVOR_STATUSES, row.dogovor_status).labelKey) : row.dogovor_status || '—',
  [t('dogovorInnLabel')]: row.client_inn || '—',
  [t('dogovorPaymentDateLabel')]: formatDate(row.payment_date),
  [t('dogovorInitialPaymentLabel')]: Number(row.initial_payment) || 0,
  [t('dogovorPrepaymentLabel')]: row.prepayment_percent ?? 0,
  [t('dogovorPhoneLabel')]: row.client_phone || '—',
  [t('dogovorManagerLabel')]: row.manager_name || '—',
  [t('dogovorAddressLabel')]: row.client_address || '—',
  [t('dogovorContactPositionLabel')]: row.contact_position || '—',
  [t('dogovorContactNameLabel')]: row.contact_name || '—',
  [t('dogovorCommentLabel')]: row.comment || '—',
})

// ─── Excel: import va eksport menyusi ───
const exporting = ref(false)
function openMenu() {
  showActionSheet({
    actions: [
      { name: t('m.exportExcel'), subname: t('m.exportCount', { n: total.value }), key: 'export' },
      { name: t('m.importExcel'), key: 'import' },
    ],
    cancelText: t('cancel'),
  })
    .then((a) => (a.key === 'import' ? fileInput.value?.click() : doExport()))
    .catch(() => {})
}
async function doExport() {
  if (!total.value) return showToast(t('m.nothingToExport'))
  exporting.value = true
  try {
    // Filtrga mos hammasi serverdan (ro'yxatda faqat yuklangan bo'lak turadi)
    const list = await dogovorApi.exportList(params())
    await exportExcel('Dogovorlar', [{ name: 'Dogovorlar', rows: list.map(dgRow) }])
  } catch (e) {
    showFailToast(errorText(e, t, locale.value))
  } finally {
    exporting.value = false
  }
}

// ─── Excel import ───
const fileInput = ref(null)
const importing = ref(false)
async function onImport(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  importing.value = true
  try {
    const res = await store.importDogovors(file)
    await reload()
    showToast({
      message: t('dogovorImportSummary', {
        created: res?.imported ?? 0,
        updated: res?.updated ?? 0,
        skipped: res?.skipped ?? 0,
      }),
      wordBreak: 'break-word',
      duration: 4000,
    })
  } catch (err) {
    showFailToast({ message: errorText(err, t, locale.value), wordBreak: 'break-word' })
  } finally {
    importing.value = false
  }
}
</script>

<template>
  <MPage :title="$t('dogovortext')" :back="{ name: 'more' }" :on-refresh="reload">
    <template #right>
      <button type="button" class="m-head__btn" :disabled="importing || exporting" @click="openMenu">
        <van-loading v-if="importing || exporting" size="18" />
        <van-icon v-else name="ellipsis" />
      </button>
      <button type="button" class="m-head__btn" @click="router.push({ name: 'dogovor-new' })">
        <van-icon name="plus" />
      </button>
      <input ref="fileInput" type="file" accept=".xlsx,.xls" hidden @change="onImport" />
    </template>
    <template #header>
      <van-search v-model="search" shape="round" :placeholder="$t('m.searchDogovor')" class="dv-search" />
    </template>

    <p class="dv-scope">{{ isAdmin ? $t('dogovorPageSubtitle') : $t('dogovorPageSubtitleOwn') }}</p>
    <MStats :items="statsCards" />

    <div v-if="!loaded">
      <van-skeleton v-for="i in 5" :key="i" :row="3" class="m-card" />
    </div>
    <template v-else>
      <p v-if="total" class="dv-count">{{ $t('m.foundCount', { n: total }) }}</p>
      <van-list
        v-if="rows.length"
        v-model:loading="listLoading"
        :finished="finished"
        :immediate-check="false"
        :offset="400"
        @load="onLoadMore"
      >
        <article
          v-for="d in rows"
          :key="d.id"
          class="m-card is-tappable dv-item"
          @click="router.push({ name: 'dogovor-detail', params: { id: d.id } })"
        >
          <div class="dv-item__top">
            <span class="dv-num m-num">№ {{ d.dogovor_number ?? '—' }}</span>
            <span class="m-tag" :class="statusOf(DOGOVOR_STATUSES, d.dogovor_status)?.tone">
              {{ statusOf(DOGOVOR_STATUSES, d.dogovor_status) ? $t(statusOf(DOGOVOR_STATUSES, d.dogovor_status).labelKey) : d.dogovor_status || '—' }}
            </span>
            <van-icon v-if="!canModifyDoc(d, user)" name="lock" class="dv-lock" />
            <span class="dv-date m-num">{{ formatDate(d.dogovor_date) }}</span>
          </div>
          <h3 class="dv-client">{{ d.client_name || '—' }}</h3>
          <div class="dv-meta">
            <span>{{ d.manager_name || '—' }}</span>
            <b class="m-num">{{ money(d.dogovor_sum, t) }}</b>
          </div>
          <div v-if="d.client_phone || d.client_inn" class="dv-sub">
            <span v-if="d.client_inn" class="m-num">{{ $t('dogovorInnLabel') }}: {{ d.client_inn }}</span>
            <a v-if="telHref(d.client_phone)" :href="telHref(d.client_phone)" class="dv-phone m-num" @click.stop>
              <van-icon name="phone-o" /> {{ d.client_phone }}
            </a>
          </div>
        </article>
      </van-list>
      <MEmpty
        v-else
        icon="records-o"
        :title="stats.total ? $t('m.nothingFound') : $t('dogovorEmptyTitle')"
        :text="stats.total ? $t('dogovorNoMatchDescription') : $t('dogovorEmptyDescription')"
      />
    </template>
  </MPage>
</template>

<style scoped>
.dv-search {
  padding: 0 12px 8px;
}

.dv-scope {
  padding: 12px 16px 0;
  font-size: 12px;
  color: var(--m-muted);
}

.dv-count {
  padding: 10px 16px 8px;
  font-size: 13px;
  color: var(--m-muted);
}

.dv-item__top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dv-num {
  font-size: 13px;
  font-weight: 700;
  color: var(--m-ink-2);
}

.dv-lock {
  color: var(--m-faint);
}

.dv-date {
  margin-left: auto;
  font-size: 12px;
  color: var(--m-muted);
}

.dv-client {
  margin-top: 8px;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.dv-meta {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 6px;
  font-size: 14px;
  color: var(--m-ink-2);
}

.dv-meta b {
  white-space: nowrap;
  color: var(--m-ink);
}

.dv-sub {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--m-line-soft);
  font-size: 13px;
  color: var(--m-muted);
}

.dv-phone {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  font-weight: 500;
}
</style>
