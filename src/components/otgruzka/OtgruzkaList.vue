<template>
  <div class="ot-list">
    <UiToolbar class="ot-toolbar">
      <UiField :label="$t('otSearch')" grow>
        <el-input v-model="filters.q" :placeholder="$t('otSearchPh')" clearable :prefix-icon="Search" />
      </UiField>
      <UiField :label="$t('otFManager')">
        <el-select v-model="filters.manager" clearable filterable :placeholder="$t('otAll')" class="ot-sel">
          <el-option v-for="m in managers" :key="m" :label="m" :value="m" />
        </el-select>
      </UiField>
      <UiField :label="$t('otFStage')">
        <el-select v-model="filters.stage" clearable :placeholder="$t('otAll')" class="ot-sel">
          <el-option :label="$t('otStatNotShipped')" value="notshipped" />
          <el-option v-for="s in STAGES" :key="s" :label="$t(`otStage_${s}`)" :value="s" />
        </el-select>
      </UiField>
      <UiField :label="$t('otFPay')">
        <el-select v-model="filters.pay" clearable :placeholder="$t('otAll')" class="ot-sel">
          <el-option :label="$t('otStatDebt')" value="notpaid" />
          <el-option v-for="p in PAYS" :key="p" :label="$t(`otPay_${p}`)" :value="p" />
        </el-select>
      </UiField>
      <UiField :label="$t('otFSeries')">
        <el-select v-model="filters.series" clearable :placeholder="$t('otAll')" class="ot-sel">
          <el-option v-for="s in SERIES" :key="s" :label="$t(`otSeries_${s}`)" :value="s" />
        </el-select>
      </UiField>
      <template #actions>
        <el-checkbox v-model="filters.showFinal">{{ $t('otShowFinal') }}</el-checkbox>
        <el-button v-if="dirty" text @click="$emit('reset')">{{ $t('otReset') }}</el-button>
      </template>
    </UiToolbar>

    <UiPanel flush>
      <template #title>
        <span class="ot-count">{{ $t('otShown', { n: filtered.length }) }}</span>
        <span v-if="filters.alert" class="ot-alert-tag">{{ $t(`otAlert_${filters.alert}`) }}</span>
      </template>
      <template #actions>
        <span>{{ $t('otColSum') }}: <b>{{ fmtMoney(totals.sum) }}</b></span>
        <span>{{ $t('otStatDebt') }}: <b class="is-bad">{{ fmtMoney(totals.debt) }}</b></span>
      </template>
      <el-table
        v-loading="loading"
        :data="visible"
        row-key="id"
        class="ot-table"
        :row-class-name="rowClass"
        :default-sort="{ prop: 'sheet_row', order: 'ascending' }"
        @row-click="(r) => $emit('open', r.id)"
        @sort-change="onSort"
      >
        <el-table-column :label="$t('otColNumber')" prop="dogovor_number" sortable="custom" min-width="100">
          <template #default="{ row }">
            <div class="ot-num">№ {{ row.dogovor_number || '—' }}</div>
            <div class="ot-series" :class="{ 'is-off': !row.official }">{{ $t(`otSeries_${row.series}`) }}</div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('otColCreated')" prop="created" sortable="custom" min-width="104">
          <template #default="{ row }">
            <div>{{ createdOf(row) ? formatDate(createdOf(row)) : '—' }}</div>
            <div v-if="!row.dogovor_date && row.createdAt" class="ot-muted">{{ $t('otCreatedErp') }}</div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('otColClient')" prop="client_name" sortable="custom" min-width="190">
          <template #default="{ row }">
            <div class="ot-client">{{ row.client_name || '—' }}</div>
            <div class="ot-muted">{{ row.manager_name || '—' }}</div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('otColSum')" prop="contract_sum" sortable="custom" align="right" min-width="120">
          <template #default="{ row }">
            <div class="ot-money">{{ fmtMoney(row.contract_sum) }}</div>
            <div v-if="row.debt > 1" class="ot-muted is-bad">{{ $t('otDebt', { sum: fmtShort(row.debt) }) }}</div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('otColPay')" prop="paid_ratio" sortable="custom" min-width="110">
          <template #default="{ row }">
            <OtBar :value="row.contract_sum > 0 ? row.paid_sum / row.contract_sum : row.paid_sum > 0 ? 1 : 0" :tone="PAY_TONE[row.pay_status]" />
            <div class="ot-muted">{{ $t(`otPay_${row.pay_status}`) }}</div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('otColReady')" prop="ready_pct" sortable="custom" min-width="84">
          <template #default="{ row }">
            <OtBar :value="row.ready_pct" :tone="row.ready_pct >= 1 ? 'good' : 'link'" />
          </template>
        </el-table-column>
        <el-table-column :label="$t('otColShipped')" prop="shipped_pct" sortable="custom" min-width="84">
          <template #default="{ row }">
            <OtBar :value="row.shipped_pct" :tone="row.shipped_pct >= 1 ? 'good' : 'link'" />
          </template>
        </el-table-column>
        <el-table-column :label="$t('otColDidox')" min-width="66" align="center">
          <template #default="{ row }">
            <span v-if="!row.official" class="ot-muted">—</span>
            <span v-else class="ot-didox">
              <el-tooltip :content="`${$t('otDidoxContract')}: ${flag(row.didox_contract)}`">
                <span class="ot-dot" :class="dotClass(row.didox_contract)">{{ $t('otDidoxContractShort') }}</span>
              </el-tooltip>
              <el-tooltip :content="`${$t('otDidoxPoa')}: ${flag(row.didox_poa)}`">
                <span class="ot-dot" :class="dotClass(row.didox_poa)">{{ $t('otDidoxPoaShort') }}</span>
              </el-tooltip>
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('otColStage')" prop="stage" sortable="custom" min-width="140">
          <template #default="{ row }">
            <span class="ot-tag" :class="`is-${STAGE_TONE[row.stage]}`">{{ $t(`otStage_${row.stage}`) }}</span>
            <el-tooltip v-if="row.alerts.length" :content="row.alerts.map((a) => $t(`otAlert_${a}`)).join(' · ')">
              <el-icon class="ot-warn"><WarningFilled /></el-icon>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column :label="$t('otColNext')" prop="next_action_date" sortable="custom" min-width="130">
          <template #default="{ row }">
            <template v-if="row.next_action || row.next_action_date">
              <div class="ot-next" :class="{ 'is-bad': row.alerts.includes('overdue') }">
                {{ row.next_action_date ? formatDate(row.next_action_date) : $t('otNoDate') }}
              </div>
              <div class="ot-muted ot-clip">{{ row.next_action }}</div>
            </template>
            <div v-else class="ot-muted ot-clip">{{ row.note_main || '' }}</div>
          </template>
        </el-table-column>
      </el-table>
      <div ref="sentinel" class="ot-sentinel" />
    </UiPanel>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search, WarningFilled } from '@element-plus/icons-vue'
import UiToolbar from '@/components/ui/UiToolbar.vue'
import UiField from '@/components/ui/UiField.vue'
import UiPanel from '@/components/ui/UiPanel.vue'
import { formatDate } from '@/utils/format'
import { fmtMoney, fmtShort, PAY_TONE, PAYS, SERIES, STAGE_TONE, STAGES } from '@/utils/otgruzkaFormat'
import OtBar from './OtBar.vue'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  loading: Boolean,
  filters: { type: Object, required: true },
})
defineEmits(['open', 'reset'])
const { t } = useI18n()

const managers = computed(() => [...new Set(props.rows.map((r) => r.manager_name).filter(Boolean))].sort())
const dirty = computed(() => {
  const f = props.filters
  return Boolean(f.q || f.manager || f.stage || f.pay || f.series || f.alert || f.showFinal)
})

const norm = (s) => String(s || '').toLowerCase()
const filtered = computed(() => {
  const f = props.filters
  const q = norm(f.q).trim()
  return props.rows.filter((r) => {
    if (r.final_status && !f.showFinal && f.stage !== r.stage) return false
    if (f.manager && r.manager_name !== f.manager) return false
    if (f.stage === 'notshipped') {
      if (r.shipped_pct >= 1 || r.final_status) return false
    } else if (f.stage && r.stage !== f.stage) return false
    if (f.pay === 'notpaid') {
      if (!(r.debt > 1) || r.final_status) return false
    } else if (f.pay && r.pay_status !== f.pay) return false
    if (f.series && r.series !== f.series) return false
    if (f.alert && !r.alerts.includes(f.alert)) return false
    if (q) {
      const hay = norm([r.dogovor_number, r.client_name, r.client_inn, r.manager_name, r.client_contact, r.note_main, r.note_extra, r.next_action, r.invoice_numbers].join(' '))
      if (!q.split(/\s+/).every((w) => hay.includes(w))) return false
    }
    return true
  })
})

// Tartiblash
const sort = ref({ prop: 'sheet_row', order: 'ascending' })
function onSort({ prop, order }) {
  sort.value = { prop: order ? prop : 'sheet_row', order: order || 'ascending' }
}
// "Yaratilgan": shartnoma sanasi, bo'lmasa karta ERP'ga qo'shilgan sana
const createdOf = (r) => r.dogovor_date || r.createdAt || null
const sortVal = (r, p) => {
  // Bir kunda bir nechta bo'lsa — keyin qo'shilgani keyin turadi
  if (p === 'created') {
    const d = createdOf(r)
    return d ? `${String(d).slice(0, 10)} ${String(r.createdAt || '')}` : ''
  }
  if (p === 'paid_ratio') return r.contract_sum > 0 ? r.paid_sum / r.contract_sum : 0
  if (p === 'dogovor_number') return Number(r.dogovor_number) || 0
  if (p === 'stage') return STAGES.indexOf(r.stage)
  return r[p] ?? ''
}
const sorted = computed(() => {
  const { prop, order } = sort.value
  const dir = order === 'descending' ? -1 : 1
  return [...filtered.value].sort((a, b) => {
    const x = sortVal(a, prop)
    const y = sortVal(b, prop)
    if (x === y) return a.id - b.id
    if (x === '' || x === null) return 1
    if (y === '' || y === null) return -1
    return (typeof x === 'string' ? x.localeCompare(y) : x - y) * dir
  })
})

// Ko'p qatorni birdaniga chizmaslik uchun — 40 tadan, pastga yetganda yana
const PAGE = 40
const limit = ref(PAGE)
const visible = computed(() => sorted.value.slice(0, limit.value))
watch(() => [props.filters.q, props.filters.manager, props.filters.stage, props.filters.pay, props.filters.series, props.filters.alert, props.filters.showFinal, sort.value], () => (limit.value = PAGE))
const sentinel = ref(null)
let io = null
onMounted(() => {
  io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting) && limit.value < sorted.value.length) limit.value += PAGE
  }, { rootMargin: '400px' })
  if (sentinel.value) io.observe(sentinel.value)
})
onBeforeUnmount(() => io?.disconnect())

const totals = computed(() => {
  let sum = 0
  let debt = 0
  for (const r of filtered.value) {
    if (r.final_status) continue
    sum += r.contract_sum
    debt += r.debt
  }
  return { sum, debt }
})

const flag = (v) => (v === true ? t('otYes') : v === false ? t('otNo') : t('otNa'))
const dotClass = (v) => (v === true ? 'is-good' : v === false ? 'is-bad' : 'is-muted')
const rowClass = ({ row }) => (row.final_status ? 'is-final' : '')
</script>

<style scoped lang="scss">
.ot-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ot-toolbar {
  position: sticky;
  top: 0;
  z-index: 5;
}
.ot-sel {
  width: 170px;
}
.ot-count {
  font-size: 14px;
}
.ot-alert-tag {
  margin-left: 8px;
  padding: 2px 10px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 600;
  background: var(--ui-warn-soft);
  color: var(--ui-warn-ink);
}
.is-bad {
  color: var(--ui-bad);
}
.ot-table {
  font-size: 14px;
  :deep(.el-table__row) {
    cursor: pointer;
  }
  :deep(.el-table__row.is-final) {
    opacity: 0.6;
  }
  :deep(.el-table__cell .cell) {
    word-break: normal;
    overflow-wrap: break-word;
  }
  :deep(.ot-tag) {
    white-space: normal;
  }
}
.ot-num {
  font-weight: 700;
  color: var(--ui-ink);
}
.ot-series {
  font-size: 12px;
  color: var(--ui-link);
  &.is-off {
    color: var(--ui-muted);
  }
}
.ot-client {
  font-weight: 600;
  color: var(--ui-ink);
  line-height: 1.3;
}
.ot-muted {
  font-size: 12px;
  color: var(--ui-muted);
}
.ot-money {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: var(--ui-ink);
}
.ot-clip {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.ot-next {
  font-weight: 600;
  &.is-bad {
    color: var(--ui-bad);
  }
}
.ot-didox {
  display: inline-flex;
  gap: 4px;
}
.ot-dot {
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  &.is-good {
    background: var(--ui-good-soft);
    color: var(--ui-good);
  }
  &.is-bad {
    background: var(--ui-bad-soft);
    color: var(--ui-bad);
  }
  &.is-muted {
    background: var(--ui-surface-2);
    color: var(--ui-muted);
  }
}
.ot-warn {
  margin-left: 6px;
  color: var(--ui-warn);
  vertical-align: middle;
}
.ot-sentinel {
  height: 1px;
}
</style>

<style lang="scss">
/* Holat belgisi (boshqa otgruzka komponentlari ham ishlatadi) */
.ot-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.6;
  white-space: nowrap;
  &.is-good {
    background: var(--ui-good-soft);
    color: var(--ui-good);
  }
  &.is-warn {
    background: var(--ui-warn-soft);
    color: var(--ui-warn-ink);
  }
  &.is-bad {
    background: var(--ui-bad-soft);
    color: var(--ui-bad);
  }
  &.is-link {
    background: var(--ui-link-soft);
    color: var(--ui-link);
  }
  &.is-muted {
    background: var(--ui-surface-2);
    color: var(--ui-ink-2);
  }
}
</style>
