<template>
  <div ref="rootEl" class="sk-stock" :style="{ '--sk-sticky-h': stickyH + 'px' }">
    <!-- Filtrlar paneli (boshqa sahifalardagi kabi) — pastga aylantirilganda ham tepada turadi -->
    <div ref="stickyEl" class="sk-sticky">
      <UiToolbar>
        <UiField :label="$t('skSearch')" grow data-tour="sk-search">
          <el-input v-model="search" :prefix-icon="Search" clearable :placeholder="$t('skSearchPh')" />
        </UiField>
        <template #actions>
          <el-checkbox v-model="onlyMoved" border>{{ $t('skOnlyMovedLong') }}</el-checkbox>
          <el-button :icon="Download" @click="exportExcel">{{ $t('skExportLong') }}</el-button>
        </template>
      </UiToolbar>
      <div class="sk-chiprows">
        <!-- Guruhlar va holat: yashirin ro'yxat emas, hammasi ko'rinib turadi -->
        <div class="sk-chiprow" data-tour="sk-groups">
          <span class="sk-chiprow__label">{{ $t('skColGroup') }}</span>
          <div class="sk-chips">
            <button type="button" class="sk-chip" :class="{ on: !group }" :aria-pressed="!group" @click="group = ''">
              {{ $t('skAllGroups') }} <b>{{ fmtNum(items.length) }}</b>
            </button>
            <button
              v-for="g in groups"
              :key="g.name"
              type="button"
              class="sk-chip"
              :class="{ on: group === g.name }"
              :aria-pressed="group === g.name"
              @click="group = g.name"
            >
              {{ g.name }} <b>{{ fmtNum(g.count) }}</b>
            </button>
          </div>
        </div>
        <div class="sk-chiprow">
          <span class="sk-chiprow__label">{{ $t('skStatus') }}</span>
          <div class="sk-chips">
            <button
              v-for="s in statusOptions"
              :key="s.value"
              type="button"
              class="sk-chip"
              :class="[`st-${s.value || 'all'}`, { on: status === s.value }]"
              :aria-pressed="status === s.value"
              @click="status = s.value"
            >
              <i v-if="s.value" class="sk-dot" />{{ s.label }} <b>{{ fmtNum(s.count) }}</b>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- SAP kodlari hali biriktirilmagan -->
    <div v-if="items.length && !hasSap" class="sk-notice">
      <el-icon class="sk-notice__icon"><InfoFilled /></el-icon>
      <div class="sk-notice__text">
        <b>{{ $t('skNoSapTitle') }}</b>
        <span>{{ isAdmin ? $t('skNoSapTextAdmin') : $t('skNoSapText') }}</span>
      </div>
      <el-button v-if="isAdmin" type="primary" plain @click="$emit('go-settings')">{{ $t('skNoSapBtn') }}</el-button>
    </div>

    <UiPanel flush data-tour="sk-table">
      <template #title>
        <UiHint :label="$t('skStockTitle')" :hint="$t('skRowHint')" />
        <span class="sk-count">{{ fmtNum(filtered.length) }}</span>
      </template>
      <template #actions>
        <span class="sk-sum">
          {{ $t('skSumIn') }}: <b class="is-in">+{{ fmtQty(sum.in) }}</b> · {{ $t('skSumOut') }}:
          <b class="is-out">−{{ fmtQty(sum.out) }}</b> · {{ $t('skSumClosing') }}: <b>{{ fmtQty(sum.closing) }}</b>
        </span>
        <el-button v-if="hasFilters" size="small" :icon="RefreshLeft" @click="resetFilters">{{ $t('skResetAll') }}</el-button>
        <el-button v-if="mode === 'live'" size="small" type="primary" plain :icon="Plus" @click="$emit('new-item')">
          {{ $t('skNewItem') }}
        </el-button>
      </template>
      <!-- Ustunlar moslashuvchan: ekranga sig'adi, uzun matn keyingi qatorga tushadi -->
      <el-table
        v-loading="loading"
        :data="visible"
        class="sk-table"
        row-class-name="sk-row"
        :default-sort="{ prop: 'sort_order', order: 'ascending' }"
        @row-click="(row) => $emit('open', row.id)"
        @sort-change="onSort"
      >
        <el-table-column v-if="hasCode" prop="sap_code" min-width="100" column-key="sap_code" sortable="custom">
          <template #header><UiHint :label="$t('skSapCode')" :hint="$t('skHintSap')" /></template>
          <template #default="{ row }">
            <span v-if="row.sap_code" class="sk-code">{{ row.sap_code }}</span>
            <span v-else class="sk-none">—</span>
          </template>
        </el-table-column>
        <!-- SAP nomi va ombor jadvalidagi nom — alohida ustunlar (birlashtirilmaydi) -->
        <el-table-column prop="sap_name" min-width="170" column-key="sap_name" sortable="custom">
          <template #header><UiHint :label="$t('skSapName')" :hint="$t('skHintSapName')" /></template>
          <template #default="{ row }">
            <div v-if="row.sap_name" class="sk-name">
              <span v-if="row.sap_approx" class="sk-approx" :title="$t('skSapApproxHint')">≈</span>{{ row.sap_name }}
            </div>
            <span v-else class="sk-none">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" min-width="170" column-key="name" sortable="custom">
          <template #header>{{ $t('skColName') }}</template>
          <template #default="{ row }">
            <div class="sk-name">{{ row.name }}</div>
            <div class="sk-sub">{{ row.group_name || '—' }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="opening" min-width="78" column-key="opening" align="right">
          <template #header><UiHint :label="$t('skColOpeningFull')" :hint="$t('skHintOpening')" /></template>
          <template #default="{ row }">{{ fmtQty(row.opening) }}</template>
        </el-table-column>
        <el-table-column prop="in" min-width="70" column-key="in" align="right">
          <template #header><UiHint :label="$t('skColIn')" :hint="$t('skHintIn')" /></template>
          <template #default="{ row }">
            <b v-if="row.in" class="is-in">+{{ fmtQty(row.in) }}</b><span v-else class="sk-none">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="out" min-width="70" column-key="out" align="right">
          <template #header><UiHint :label="$t('skColOut')" :hint="$t('skHintOut')" /></template>
          <template #default="{ row }">
            <b v-if="row.out" class="is-out">−{{ fmtQty(row.out) }}</b><span v-else class="sk-none">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="reserve" min-width="76" column-key="reserve" align="right">
          <template #header><UiHint :label="$t('skColReserve')" :hint="$t('skHintReserve')" /></template>
          <template #default="{ row }">
            <b v-if="row.reserve - row.release" class="is-reserve">{{ fmtQty(row.reserve - row.release) }}</b>
            <span v-else class="sk-none">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="closing" min-width="132" column-key="closing" align="right" sortable="custom">
          <template #header><UiHint :label="$t('skColClosing')" :hint="$t('skHintClosing')" /></template>
          <template #default="{ row }">
            <span v-if="stockStatus(row) !== 'ok'" class="sk-badge" :class="`st-${stockStatus(row)}`">
              {{ $t(`skBadge_${stockStatus(row)}`) }}
            </span>
            <span class="sk-qty" :class="`st-${stockStatus(row)}`">{{ fmtQty(row.closing) }}</span>
            <span class="sk-unit">{{ unitLabel(row.unit) }}</span>
            <!-- Oxirgi harakat sanasi — alohida ustun emas (jadval ekranga sig'sin) -->
            <div v-if="row.last_move_date" class="sk-sub">{{ $t('skLastMove', { d: dayMonth(row.last_move_date) }) }}</div>
          </template>
        </el-table-column>
        <el-table-column width="40" align="center">
          <template #default>
            <el-icon class="sk-more" :aria-label="$t('skDetails')"><ArrowRight /></el-icon>
          </template>
        </el-table-column>

        <template #empty>
          <div class="sk-empty">
            <template v-if="!items.length">{{ $t('skNoItems') }}</template>
            <template v-else>
              <b>{{ search ? $t('skNothingFoundQ', { q: search }) : $t('skNothingFound') }}</b>
              <span>{{ $t('skNothingHelp') }}</span>
              <el-button type="primary" plain :icon="RefreshLeft" @click="resetFilters">{{ $t('skResetAll') }}</el-button>
            </template>
          </div>
        </template>
      </el-table>

      <!-- Infinite scroll: oxiriga yaqinlashganda keyingi qatorlar o'zi qo'shiladi -->
      <div v-if="filtered.length" class="sk-more-row">
        <span ref="sentinel" class="sk-sentinel" aria-hidden="true" />
        <span class="sk-shown">{{ $t('skShownOf', { n: fmtNum(visible.length), total: fmtNum(filtered.length) }) }}</span>
        <span v-if="loadingMore" class="sk-loading"><el-icon class="is-loading"><Loading /></el-icon> {{ $t('gsLoading') }}</span>
        <el-button v-else-if="hasMore" size="small" @click="loadMore">{{ $t('skShowMore') }}</el-button>
        <el-button v-else-if="visible.length > 30" size="small" text :icon="Top" @click="toTop">{{ $t('skToTop') }}</el-button>
      </div>
    </UiPanel>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import * as XLSX from 'xlsx'
import { ArrowRight, Download, InfoFilled, Loading, Plus, RefreshLeft, Search, Top } from '@element-plus/icons-vue'
import UiField from '@/components/ui/UiField.vue'
import UiHint from '@/components/ui/UiHint.vue'
import UiPanel from '@/components/ui/UiPanel.vue'
import UiToolbar from '@/components/ui/UiToolbar.vue'
import { stockStatus } from '@/stores/sklad'
import { fmtNum } from '@/utils/format'
import { dayMonth, fmtQty, periodLabel, unitLabel } from '@/utils/skladFormat'
import { useInfiniteList } from '@/composables/useInfiniteList'

const props = defineProps({
  items: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  mode: { type: String, default: 'mirror' },
  period: { type: String, default: '' },
  isAdmin: { type: Boolean, default: false },
})
defineEmits(['open', 'new-item', 'go-settings'])
const { t } = useI18n()

const search = ref('')
const group = ref('')
const status = ref('')
const onlyMoved = ref(false)
const sort = ref({ prop: 'sort_order', order: 'ascending' })

// ─── Tepada qotib turadigan panel balandligi (jadval sarlavhasi uning ostiga yopishadi) ───
const rootEl = ref(null)
const stickyEl = ref(null)
const stickyH = ref(0)
let ro = null
onMounted(() => {
  ro = new ResizeObserver(() => (stickyH.value = stickyEl.value?.offsetHeight || 0))
  if (stickyEl.value) ro.observe(stickyEl.value)
})
onBeforeUnmount(() => ro?.disconnect())

// Holat bo'yicha filtr (rezerv — alohida belgi, holat emas)
const matchesStatus = (it, s) => {
  if (!s) return true
  if (s === 'reserved') return !!(it.reserve - it.release)
  const st = stockStatus(it)
  return s === 'empty' ? st === 'empty' || st === 'negative' : st === s
}

const statusOptions = computed(() => {
  const base = filterExcept('status')
  return [
    { value: '', label: t('skAll') },
    { value: 'ok', label: t('skSt_ok') },
    { value: 'low', label: t('skSt_low') },
    { value: 'empty', label: t('skSt_empty') },
    { value: 'negative', label: t('skSt_negative') },
    { value: 'reserved', label: t('skSt_reserved') },
  ]
    .map((o) => ({ ...o, count: base.filter((it) => matchesStatus(it, o.value)).length }))
    .filter((o) => !o.value || o.count || status.value === o.value)
})

const groups = computed(() => {
  const map = new Map()
  for (const it of props.items) map.set(it.group_name || '—', (map.get(it.group_name || '—') || 0) + 1)
  return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
})

const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ')

// Barcha filtrlar (bittasidan tashqari — tugmalardagi sonlarni hisoblash uchun)
function filterExcept(skip) {
  const q = norm(search.value).trim()
  const terms = q ? q.split(' ') : []
  return props.items.filter((it) => {
    if (skip !== 'group' && group.value && (it.group_name || '—') !== group.value) return false
    if (onlyMoved.value && !(it.in || it.out || it.reserve || it.adjust)) return false
    if (skip !== 'status' && !matchesStatus(it, status.value)) return false
    if (terms.length) {
      const hay = norm(`${it.sap_code || ''} ${it.sap_name || ''} ${it.name} ${it.group_name}`)
      if (!terms.every((term) => hay.includes(term))) return false
    }
    return true
  })
}

const filtered = computed(() => {
  const list = filterExcept(null)
  const { prop, order } = sort.value
  if (prop && order) {
    const dir = order === 'ascending' ? 1 : -1
    const val = (it) => (prop === 'reserve' ? it.reserve - it.release : it[prop])
    list.sort((a, b) => {
      const av = val(a) ?? ''
      const bv = val(b) ?? ''
      return (typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), 'ru')) * dir
    })
  }
  return list
})

// SAP ma'lumoti (kod yoki nom) birorta mahsulotda bo'lsa — eslatma ko'rsatilmaydi;
// SAP kodi ustuni faqat kodlar mavjud bo'lsa (sayt katalogidan faqat nomlar keladi)
const hasSap = computed(() => props.items.some((it) => it.sap_code || it.sap_name))
const hasCode = computed(() => props.items.some((it) => it.sap_code))

// Avval 30 ta qator, pastga aylantirilgani sayin yana 30 tadan
const { visible, hasMore, loadMore, loadingMore, sentinel } = useInfiniteList(filtered, { step: 30 })

const sum = computed(() =>
  filtered.value.reduce(
    (s, it) => ({ in: s.in + it.in, out: s.out + it.out, closing: s.closing + it.closing }),
    { in: 0, out: 0, closing: 0 },
  ),
)

const hasFilters = computed(() => !!(search.value || group.value || status.value || onlyMoved.value))

// Filtr o'zgarsa — ro'yxat boshidan ko'rinsin (pastda turgan bo'lsa, jadval tepasiga)
function toTop() {
  const top = rootEl.value?.getBoundingClientRect().top
  if (top != null && top < 0) rootEl.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
watch([search, group, status, onlyMoved], toTop)

function onSort({ prop, order }) {
  sort.value = { prop: order ? prop : 'sort_order', order: order || 'ascending' }
}

function resetFilters() {
  search.value = ''
  group.value = ''
  status.value = ''
  onlyMoved.value = false
}

function setStatus(s) {
  resetFilters()
  status.value = s
}
defineExpose({ setStatus })

function exportExcel() {
  const rows = filtered.value.map((it) => ({
    [t('skSapCode')]: it.sap_code || '',
    [t('skSapName')]: it.sap_name || '',
    [t('skXlsSheetName')]: it.name,
    [t('skColGroup')]: it.group_name || '',
    [t('skColUnit')]: unitLabel(it.unit),
    [t('skColOpeningFull')]: it.opening,
    [t('skColIn')]: it.in,
    [t('skColOut')]: it.out,
    [t('skColReserve')]: it.reserve - it.release,
    [t('skColAdjust')]: it.adjust,
    [t('skColClosing')]: it.closing,
    [t('skColLastFull')]: it.last_move_date || '',
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [{ wch: 14 }, { wch: 48 }, { wch: 48 }, { wch: 18 }, { wch: 8 }, ...Array(7).fill({ wch: 14 })]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, (periodLabel(props.period) || t('skStockTitle')).slice(0, 31))
  XLSX.writeFile(wb, `${t('skFileStock')}-${props.period}.xlsx`)
}
</script>

<style scoped lang="scss">
/* Yoshi kattaroq foydalanuvchilar uchun: yirik shrift, katta bosiladigan joylar,
   KATTA HARFSIZ sarlavhalar, holat — rang bilan birga so'z bilan ham */
.sk-stock {
  /* Brauzerning "scroll anchoring"i jadval ostidagi elementlarni (el-table yordamchi qismlari,
     "Ko'proq" qatori) langar qilib oladi: pastga 30 qator qo'shilganda butun ro'yxat tepaga
     sakraydi va yuklash zanjirga aylanadi. Ro'yxat bloki langar bo'lmasin — ko'rinib turgan
     qatorlar joyida qoladi, yangilari pastga qo'shiladi. */
  overflow-anchor: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 15px;
}

/* ─── Qotib turadigan filtr paneli (UiToolbar + tugmali filtrlar bitta panelda) ─── */
.sk-sticky {
  position: sticky;
  top: 0;
  z-index: 6;
  display: flex;
  flex-direction: column;
  background: var(--ui-surface-2);
  border: 1px solid var(--ui-line);
  border-radius: var(--ui-radius);
  box-shadow: 0 8px 16px -14px rgba(15, 23, 42, 0.45);
  :deep(.ui-toolbar) {
    border: 0;
    border-radius: var(--ui-radius) var(--ui-radius) 0 0;
    background: transparent;
  }
  :deep(.ui-toolbar .el-input__inner) {
    font-size: 15px;
  }
  :deep(.el-checkbox__label) {
    font-size: 14px;
  }
}
.sk-chiprows {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 16px 12px;
  border-top: 1px solid var(--ui-line-soft);
}
.sk-chiprow {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.sk-chiprow__label {
  flex: 0 0 64px;
  padding-top: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ui-ink-2);
}
.sk-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}
.sk-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  padding: 4px 12px;
  border: 1px solid var(--ui-line);
  border-radius: 99px;
  background: var(--ui-surface);
  color: var(--ui-ink-2);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s,
    color 0.15s;
  b {
    font-weight: 600;
    color: var(--ui-muted);
    font-variant-numeric: tabular-nums;
  }
  &:hover {
    border-color: var(--ui-link-line);
    color: var(--ui-ink);
  }
  &.on {
    background: var(--ui-ink);
    border-color: var(--ui-ink);
    color: var(--ui-surface);
    b {
      color: var(--ui-surface);
      opacity: 0.75;
    }
  }
  &:focus-visible {
    outline: 3px solid var(--ui-link-line);
    outline-offset: 2px;
  }
}
.sk-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: var(--ui-line-strong);
}
.st-ok .sk-dot {
  background: var(--ui-good);
}
.st-low .sk-dot {
  background: var(--ui-warn);
}
.st-negative .sk-dot {
  background: var(--ui-bad);
}
.st-reserved .sk-dot {
  background: var(--ui-violet-ink);
}
.sk-chip.on .sk-dot {
  box-shadow: 0 0 0 2px var(--ui-surface);
}
.sk-count {
  padding: 1px 8px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 600;
  background: var(--ui-surface-3);
  color: var(--ui-ink-2);
  font-variant-numeric: tabular-nums;
}
.sk-sum {
  font-size: 13px;
  color: var(--ui-muted);
  b {
    font-variant-numeric: tabular-nums;
    color: var(--ui-ink);
  }
  b.is-in {
    color: var(--ui-good);
  }
  b.is-out {
    color: var(--ui-orange-ink);
  }
}

/* ─── SAP haqida eslatma ─── */
.sk-notice {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid var(--ui-link-line);
  border-radius: var(--ui-radius);
  background: var(--ui-link-soft);
  color: var(--ui-ink-2);
}
.sk-notice__icon {
  font-size: 22px;
  color: var(--ui-link);
  flex-shrink: 0;
}
.sk-notice__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  b {
    color: var(--ui-ink);
  }
}

/* ─── Jadval ─── */
.sk-table {
  /* Sarlavha qatori filtr paneli ostida qotib turishi uchun */
  overflow: visible;
  border-radius: 0 0 var(--ui-radius) var(--ui-radius);
  :deep(.el-table__inner-wrapper) {
    overflow: visible;
  }
  :deep(.el-table__header-wrapper) {
    position: sticky;
    top: calc(var(--sk-sticky-h, 0px) - 1px);
    z-index: 5;
  }
  :deep(th.el-table__cell) {
    background: var(--ui-surface-2);
    color: var(--ui-ink-2);
    font-weight: 600;
    font-size: 14px;
    text-transform: none;
    letter-spacing: 0;
  }
  /* Element Plus so'zni istalgan harfdan bo'ladi ("ПОСЛЕДНЕ / Е") — sarlavhada bo'lmasin */
  :deep(th .cell) {
    word-break: normal;
    overflow-wrap: normal;
    white-space: normal;
    line-height: 1.3;
  }
  :deep(td .cell) {
    word-break: normal;
    overflow-wrap: anywhere;
    white-space: normal;
    font-size: 15px;
    line-height: 1.4;
    font-variant-numeric: tabular-nums;
  }
  :deep(td.el-table__cell) {
    padding: 12px 0;
  }
  :deep(.sk-row) {
    cursor: pointer;
  }
  :deep(.sk-row:hover .sk-more) {
    color: var(--ui-link);
  }
}
.sk-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 14px;
  font-weight: 600;
  color: var(--ui-ink);
}
.sk-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--ui-ink);
}
.sk-approx {
  display: inline-block;
  margin-right: 5px;
  padding: 0 5px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 700;
  line-height: 18px;
  background: var(--ui-warn-soft);
  color: var(--ui-warn);
  cursor: help;
}
.sk-saptag {
  display: inline-block;
  margin-right: 6px;
  padding: 0 5px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
  vertical-align: 1px;
  background: var(--ui-link-soft);
  color: var(--ui-link);
  border: 1px solid var(--ui-link-line);
}
.sk-sub {
  margin-top: 2px;
  font-size: 13px;
  color: var(--ui-muted);
}
.sk-none {
  color: var(--ui-faint);
}
.is-in {
  color: var(--ui-good);
}
.is-out {
  color: var(--ui-orange-ink);
}
.is-reserve {
  color: var(--ui-violet-ink);
}
.sk-qty {
  font-size: 17px;
  font-weight: 700;
  color: var(--ui-ink);
  &.st-empty {
    color: var(--ui-muted);
  }
  &.st-negative {
    color: var(--ui-bad);
  }
  &.st-low {
    color: var(--ui-warn);
  }
}
.sk-unit {
  margin-left: 4px;
  font-size: 13px;
  color: var(--ui-muted);
}
.sk-badge {
  display: inline-block;
  margin-right: 8px;
  padding: 1px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  vertical-align: 2px;
  &.st-empty {
    background: var(--ui-surface-3);
    color: var(--ui-ink-2);
  }
  &.st-negative {
    background: var(--ui-bad-soft);
    color: var(--ui-bad);
  }
  &.st-low {
    background: var(--ui-warn-soft);
    color: var(--ui-warn-ink);
  }
}
.sk-more {
  font-size: 18px;
  color: var(--ui-faint);
}
.sk-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 16px;
  font-size: 15px;
  line-height: 1.5;
  color: var(--ui-muted);
  b {
    color: var(--ui-ink);
  }
}
.sk-more-row {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px 14px;
  padding: 14px 12px;
  border-top: 1px solid var(--ui-line-soft);
}
.sk-sentinel {
  position: absolute;
  top: 0;
  left: 0;
  width: 1px;
  height: 1px;
}
.sk-shown {
  font-size: 13px;
  color: var(--ui-muted);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 900px) {
  /* Telefonda filtrlar ko'p joy oladi — qotirmaymiz, faqat jadval sarlavhasi */
  .sk-sticky {
    position: static;
  }
  .sk-table :deep(.el-table__header-wrapper) {
    top: 0;
  }
  .sk-chiprow {
    flex-direction: column;
    gap: 6px;
  }
  .sk-chiprow__label {
    flex: none;
    padding-top: 0;
  }
}
.sk-loading {
  display: inline-flex;
  /* tugma bilan bir xil balandlik — almashganda qatorlar siljimasin */
  height: 24px;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--ui-muted);
}
</style>
