<template>
  <UiPage :title="$t('otTitle')" class="ot-page">
    <template #subtitle>
      <el-tooltip
        :content="modeHint"
        placement="bottom-start"
        :show-after="150"
      >
        <span class="ot-mode" :class="`is-${settings.two_way ? 'two' : settings.mode}`" tabindex="0">
          {{ modeLabel }}
          <el-icon class="ot-mode__info"><InfoFilled /></el-icon>
        </span>
      </el-tooltip>
      <span v-if="settings.mode === 'mirror' && settings.last_sync?.at" class="ot-sub">
        {{ $t('otLastSync') }}: {{ formatDateTimeSec(settings.last_sync.at) }}
      </span>
    </template>

    <template #actions>
      <el-button v-if="settings.sheet_url" :icon="Document" tag="a" :href="settings.sheet_url" target="_blank" rel="noopener">
        {{ $t('otOpenSheet') }}
      </el-button>
      <el-button v-if="settings.mode === 'mirror'" :icon="Refresh" :loading="syncing" @click="syncNow">
        {{ $t('otSyncNow') }}
      </el-button>
      <el-button v-if="editable" type="primary" :icon="Plus" @click="createOpen = true">{{ $t('otNew') }}</el-button>
    </template>

    <!-- Bitta karta sahifasi (/otgruzka/:id): ro'yxat o'rniga shu oynada ochiladi -->
    <template v-if="cardId">
      <el-button class="ot-back" :icon="ArrowLeft" @click="backToList">{{ $t('otBackToList') }}</el-button>
      <OtgruzkaDrawer
        inline
        :model-value="cardId"
        :editable="editable"
        :two-way="!!settings.two_way"
        :is-admin="isAdmin"
        @update:model-value="backToList"
        @changed="onChanged"
      />
    </template>

    <template v-else>
    <el-alert v-if="loadError" type="error" show-icon :closable="false" :title="loadError" />

    <div class="ot-overview">
      <div class="ot-stats">
        <UiStat
          :label="$t('otStatActive')"
          :value="fmtNum(kpi.count)"
          :sub="$t('otStatActiveSub', { n: kpi.count, sum: fmtShort(kpi.sum) })"
        />
        <UiStat
          :label="$t('otStatPaid')"
          tone="good"
          :value="fmtShort(kpi.paid)"
          :sub="$t('otStatPaidSub', { p: kpi.sum ? Math.round((kpi.paid / kpi.sum) * 100) : 0 })"
        />
        <UiStat
          :label="$t('otStatDebt')"
          tone="bad"
          :value="fmtShort(kpi.debt)"
          :sub="$t('otStatDebtSub', { n: kpi.debtCount })"
          clickable
          @click="quickFilter({ pay: 'notpaid' })"
        />
        <UiStat
          :label="$t('otStatNotShipped')"
          :value="fmtShort(kpi.notShipped)"
          :sub="$t('otStatNotShippedSub', { n: kpi.notShippedCount })"
          clickable
          @click="quickFilter({ stage: 'notshipped' })"
        />
      </div>

      <div class="ot-attn" :class="{ 'is-ok': !attention.length }">
        <el-icon class="ot-attn__icon">
          <component :is="attention.length ? WarningFilled : CircleCheck" />
        </el-icon>
        <span class="ot-attn__label">{{ attention.length ? $t('otAttnTitle') : $t('otAttnOk') }}</span>
        <button
          v-for="a in attention"
          :key="a.key"
          type="button"
          class="ot-attn__chip"
          :class="{ 'is-active': filters.alert === a.key }"
          @click="quickFilter({ alert: filters.alert === a.key ? '' : a.key })"
        >
          <b>{{ a.count }}</b> {{ $t(`otAlert_${a.key}`) }}
        </button>
      </div>
    </div>

    <el-tabs v-model="tab" class="ot-tabs">
      <el-tab-pane name="list" :label="$t('otTabList')">
        <OtgruzkaList
          :rows="rows"
          :loading="loading"
          :filters="filters"
          @open="openInTab"
          @reset="resetFilters"
        />
      </el-tab-pane>
      <el-tab-pane name="managers" :label="$t('otTabManagers')">
        <OtgruzkaManagers :rows="rows" @pick="pickManager" />
      </el-tab-pane>
      <el-tab-pane name="lines" :label="$t('otTabLines')" lazy>
        <OtgruzkaLines @open="openInTab" />
      </el-tab-pane>
      <el-tab-pane v-if="isAdmin" name="settings" :label="$t('otTabSettings')" lazy>
        <OtgruzkaSettings :settings="settings" :syncing="syncing" @sync="syncNow" @mode="setMode" @changed="reloadSettings" />
      </el-tab-pane>
    </el-tabs>
    </template>

    <OtgruzkaCreateDialog v-model="createOpen" @created="onCreated" />
  </UiPage>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CircleCheck, Document, InfoFilled, Plus, Refresh, WarningFilled, ArrowLeft } from '@element-plus/icons-vue'
import UiPage from '@/components/ui/UiPage.vue'
import UiStat from '@/components/ui/UiStat.vue'
import api from '@/api/otgruzka'
import { useUsersStore } from '@/stores/user'
import { fmtNum, formatDateTimeSec } from '@/utils/format'
import { ALERTS, fmtShort, otError } from '@/utils/otgruzkaFormat'
import OtgruzkaList from './OtgruzkaList.vue'
import OtgruzkaManagers from './OtgruzkaManagers.vue'
import OtgruzkaLines from './OtgruzkaLines.vue'
import OtgruzkaSettings from './OtgruzkaSettings.vue'
import OtgruzkaDrawer from './OtgruzkaDrawer.vue'
import OtgruzkaCreateDialog from './OtgruzkaCreateDialog.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const usersStore = useUsersStore()
const isAdmin = computed(() => !!usersStore.currentUser?.is_admin)

const rows = ref([])
const settings = ref({ mode: 'mirror' })
const loading = ref(false)
const loadError = ref('')
const syncing = ref(false)
const createOpen = ref(false)
const tab = ref(['list', 'managers', 'lines', 'settings'].includes(route.query.tab) ? route.query.tab : 'list')
// Ochiq karta — manzilda (/otgruzka/:id). Eski havolalar (?id=) yangi manzilga o'tkaziladi
const cardId = computed(() => Number(route.params.id) || null)
if (route.query.id && Number(route.query.id)) router.replace({ path: `/otgruzka/${Number(route.query.id)}` })

const emptyFilters = () => ({ q: '', manager: '', stage: '', pay: '', series: '', didox: '', alert: '', showFinal: false })
const filters = reactive(emptyFilters())

// Ro'yxatdan bosilgan karta shu oynada alohida sahifa bo'lib ochiladi
function openInTab(id) {
  if (id) router.push({ path: `/otgruzka/${id}` })
}
// Orqaga: ro'yxatdan kelingan bo'lsa — tarixda orqaga (filtrlar saqlanadi), aks holda ro'yxatga
function backToList() {
  if (String(window.history.state?.back || '').startsWith('/otgruzka')) router.back()
  else router.push({ path: '/otgruzka' })
}

// Tab va ochiq karta manzilda — havolani ulashsa shu holat ochiladi
watch(tab, (tb) => {
  if (cardId.value) return
  const query = { ...route.query, tab: tb === 'list' ? undefined : tb, id: undefined }
  router.replace({ query })
})

// ERP asosiy yoki ikki tomonlama sinxron — ERP'da tahrirlash mumkin
const editable = computed(() => settings.value.mode === 'live' || !!settings.value.two_way)
const modeLabel = computed(() =>
  settings.value.mode === 'live' ? t('otModeLive') : settings.value.two_way ? t('otModeTwoWay') : t('otModeMirror'),
)
const modeHint = computed(() => {
  const min = settings.value.sync_interval_min || 5
  if (settings.value.mode === 'live') return t('otLiveHint')
  return settings.value.two_way ? t('otTwoWayHint', { min }) : t('otMirrorHint', { min })
})
async function reloadSettings() {
  settings.value = await api.getSettings().catch(() => settings.value)
}

const active = computed(() => rows.value.filter((r) => !r.final_status))
const kpi = computed(() => {
  const k = { count: 0, sum: 0, paid: 0, debt: 0, debtCount: 0, notShipped: 0, notShippedCount: 0 }
  for (const r of active.value) {
    k.count++
    k.sum += r.contract_sum
    k.paid += r.paid_sum
    k.debt += r.debt
    if (r.debt > 1) k.debtCount++
    if (r.shipped_pct < 1) {
      k.notShipped += r.contract_sum * (1 - Math.min(1, r.shipped_pct))
      k.notShippedCount++
    }
  }
  return k
})
const attention = computed(() =>
  ALERTS.map((key) => ({ key, count: rows.value.filter((r) => r.alerts.includes(key)).length })).filter((a) => a.count),
)

function quickFilter(patch) {
  Object.assign(filters, { stage: '', pay: '', alert: '' }, patch)
  tab.value = 'list'
}
function resetFilters() {
  Object.assign(filters, emptyFilters())
}
function pickManager(name) {
  Object.assign(filters, emptyFilters(), { manager: name })
  tab.value = 'list'
}

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const [s, list] = await Promise.all([api.getSettings(), api.list()])
    settings.value = s
    rows.value = list
  } catch (e) {
    loadError.value = otError(e)
  } finally {
    loading.value = false
  }
}

async function syncNow() {
  syncing.value = true
  try {
    const r = await api.sync()
    ElMessage.success(t('otSyncDone', r))
    await load()
  } catch (e) {
    ElMessage.error(otError(e, 'otErr_OT_SYNC_FAILED'))
    settings.value = await api.getSettings().catch(() => settings.value)
  } finally {
    syncing.value = false
  }
}

async function setMode(mode) {
  const label = mode === 'live' ? t('otModeLive') : t('otModeMirror')
  try {
    await ElMessageBox.confirm(t('otSetModeConfirm', { mode: label }), t('otSetMode'), { type: 'warning' })
  } catch {
    return
  }
  try {
    settings.value = await api.updateSettings({ mode })
    ElMessage.success(t('otSaved'))
  } catch (e) {
    ElMessage.error(otError(e))
  }
}

// Kartada o'zgarish bo'lsa — ro'yxatdagi qatorni yangilaymiz (butun ro'yxatni qayta yuklamasdan)
function onChanged(order) {
  const i = rows.value.findIndex((r) => r.id === order.id)
  const row = { ...order, lines_count: order.lines?.length ?? rows.value[i]?.lines_count ?? 0 }
  delete row.payments
  delete row.notes
  delete row.lines
  if (i >= 0) rows.value.splice(i, 1, { ...rows.value[i], ...row })
  else rows.value.unshift(row)
}
function onCreated(order) {
  onChanged(order)
  openInTab(order.id)
}

onMounted(load)
</script>

<style scoped lang="scss">
.ot-back {
  align-self: flex-start;
  margin-bottom: 12px;
}
.ot-mode {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 600;
  cursor: help;
  &::before {
    content: '';
    width: 7px;
    height: 7px;
    border-radius: 50%;
  }
  &.is-mirror {
    background: var(--ui-link-soft);
    color: var(--ui-link);
    &::before {
      background: var(--ui-link);
    }
  }
  &.is-two {
    background: var(--ui-good-soft);
    color: var(--ui-good);
    &::before {
      background: var(--ui-good);
    }
  }
  &.is-live {
    background: var(--ui-good-soft);
    color: var(--ui-good);
    &::before {
      background: var(--ui-good);
    }
  }
}
.ot-mode__info {
  font-size: 12px;
  opacity: 0.75;
}
.ot-sub {
  margin-left: 10px;
}
.ot-page :deep(.ui-page__title) {
  flex: 1 1 240px;
}
.ot-page :deep(.ui-page__actions) {
  margin-left: auto;
  .el-button + .el-button {
    margin-left: 0;
  }
}
.ot-page :deep(.ui-field__label) {
  font-size: 13px;
  text-transform: none;
  letter-spacing: 0;
  color: var(--ui-ink-2);
}
.ot-overview {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ot-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
@media (max-width: 1100px) {
  .ot-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.ot-attn {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border: 1px solid var(--ui-warn-line);
  border-radius: var(--ui-radius);
  background: var(--ui-warn-soft);
  &.is-ok {
    border-color: var(--ui-good-line);
    background: var(--ui-good-soft);
  }
}
.ot-attn__icon {
  font-size: 18px;
  color: var(--ui-warn);
  .is-ok & {
    color: var(--ui-good);
  }
}
.ot-attn__label {
  font-weight: 700;
  color: var(--ui-ink);
  margin-right: 4px;
}
.ot-attn__chip {
  border: 1px solid var(--ui-warn-line);
  background: var(--ui-surface);
  color: var(--ui-ink-2);
  border-radius: 99px;
  padding: 4px 12px;
  font-size: 13px;
  cursor: pointer;
  b {
    color: var(--ui-warn-ink);
  }
  &:hover {
    border-color: var(--ui-warn);
  }
  &.is-active {
    background: var(--ui-warn);
    border-color: var(--ui-warn);
    color: #fff;
    b {
      color: #fff;
    }
  }
}
</style>
