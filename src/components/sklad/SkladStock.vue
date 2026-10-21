<template>
  <UiToolbar>
    <UiField :label="$t('skSearch')" grow>
      <el-input
        v-model="search"
        data-tour="sk-search"
        :prefix-icon="Search"
        clearable
        :placeholder="$t('skSearchPh')"
      />
    </UiField>
    <UiField :label="$t('skStatus')">
      <el-select v-model="status" clearable :placeholder="$t('skAll')" class="sk-select">
        <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
      </el-select>
    </UiField>
    <UiField :label="$t('skOnlyMoved')">
      <el-switch v-model="onlyMoved" />
    </UiField>
    <template #actions>
      <el-button v-if="mode === 'live'" :icon="Plus" @click="$emit('new-item')">{{ $t('skNewItem') }}</el-button>
      <el-button :icon="Download" @click="exportExcel">{{ $t('skExport') }}</el-button>
    </template>
  </UiToolbar>

  <!-- Guruh "chip"lari: bosilsa shu guruh -->
  <div class="sk-groups" data-tour="sk-groups">
    <button type="button" class="sk-chip" :class="{ on: !group }" @click="pickGroup('')">
      {{ $t('skAllGroups') }} <b>{{ fmtNum(items.length) }}</b>
    </button>
    <button
      v-for="g in groups"
      :key="g.name"
      type="button"
      class="sk-chip"
      :class="{ on: group === g.name }"
      @click="pickGroup(g.name)"
    >
      {{ g.name }} <b>{{ fmtNum(g.count) }}</b>
    </button>
  </div>

  <UiPanel flush>
    <template #title>
      {{ $t('skStockTitle') }}
      <span class="sk-count">{{ fmtNum(filtered.length) }}</span>
    </template>
    <template #actions>
      <span class="sk-sum">
        {{ $t('skStatIn') }}: <b class="is-in">+{{ fmtQty(sum.in) }}</b> · {{ $t('skStatOut') }}:
        <b class="is-out">−{{ fmtQty(sum.out) }}</b> · {{ $t('skStatClosing') }}: <b>{{ fmtQty(sum.closing) }}</b>
      </span>
      <el-button v-if="hasFilters" link type="primary" @click="resetFilters">{{ $t('skReset') }}</el-button>
    </template>

    <div data-tour="sk-table">
      <el-table
        v-loading="loading"
        :data="paged"
        size="small"
        class="sk-table"
        row-class-name="sk-row"
        :default-sort="{ prop: 'sort_order', order: 'ascending' }"
        @row-click="(row) => $emit('open', row.id)"
        @sort-change="onSort"
      >
        <el-table-column prop="code" :label="$t('skColCode')" width="96" sortable="custom">
          <template #default="{ row }"><span class="sk-code">{{ row.code }}</span></template>
        </el-table-column>
        <el-table-column prop="name" :label="$t('skColName')" min-width="260" sortable="custom">
          <template #default="{ row }">
            <div class="sk-name">{{ row.name }}</div>
            <div class="sk-group">{{ row.group_name || '—' }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="opening" :label="$t('skColOpening')" width="104" align="right" sortable="custom">
          <template #default="{ row }">{{ fmtQty(row.opening) }}</template>
        </el-table-column>
        <el-table-column prop="in" :label="$t('skColIn')" width="96" align="right" sortable="custom">
          <template #default="{ row }">
            <span :class="{ 'is-in': row.in }">{{ row.in ? '+' + fmtQty(row.in) : '·' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="out" :label="$t('skColOut')" width="96" align="right" sortable="custom">
          <template #default="{ row }">
            <span :class="{ 'is-out': row.out }">{{ row.out ? '−' + fmtQty(row.out) : '·' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="reserve" :label="$t('skColReserve')" width="96" align="right" sortable="custom">
          <template #default="{ row }">
            <span :class="{ 'is-reserve': row.reserve - row.release }">{{
              row.reserve - row.release ? fmtQty(row.reserve - row.release) : '·'
            }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="closing" :label="$t('skColClosing')" width="130" align="right" sortable="custom">
          <template #default="{ row }">
            <span class="sk-qty" :class="`st-${stockStatus(row)}`">{{ fmtQty(row.closing) }}</span>
            <span class="sk-unit">{{ unitLabel(row.unit) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="last_move_date" :label="$t('skColLast')" width="96" align="right" sortable="custom">
          <template #default="{ row }">
            <span class="sk-muted">{{ shortDate(row.last_move_date) }}</span>
          </template>
        </el-table-column>
        <template #empty>
          <div class="sk-empty">{{ items.length ? $t('skNothingFound') : $t('skNoItems') }}</div>
        </template>
      </el-table>
    </div>

    <div v-if="filtered.length > pageSize" class="sk-pager">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :page-sizes="[50, 100, 200]"
        :total="filtered.length"
        layout="total, sizes, prev, pager, next"
        background
        small
      />
    </div>
  </UiPanel>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import * as XLSX from 'xlsx'
import { Download, Plus, Search } from '@element-plus/icons-vue'
import UiToolbar from '@/components/ui/UiToolbar.vue'
import UiField from '@/components/ui/UiField.vue'
import UiPanel from '@/components/ui/UiPanel.vue'
import { stockStatus } from '@/stores/sklad'
import { fmtNum } from '@/utils/format'
import { fmtQty, periodLabel, shortDate, unitLabel } from '@/utils/skladFormat'

const props = defineProps({
  items: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  mode: { type: String, default: 'mirror' },
  period: { type: String, default: '' },
})
defineEmits(['open', 'new-item'])
const { t } = useI18n()

const search = ref('')
const group = ref('')
const status = ref('')
const onlyMoved = ref(false)
const page = ref(1)
const pageSize = ref(50)
const sort = ref({ prop: 'sort_order', order: 'ascending' })

const statusOptions = computed(() => [
  { value: 'ok', label: t('skSt_ok') },
  { value: 'low', label: t('skSt_low') },
  { value: 'empty', label: t('skSt_empty') },
  { value: 'negative', label: t('skSt_negative') },
  { value: 'reserved', label: t('skSt_reserved') },
])

const groups = computed(() => {
  const map = new Map()
  for (const it of props.items) map.set(it.group_name || '—', (map.get(it.group_name || '—') || 0) + 1)
  return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
})

const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ')

const filtered = computed(() => {
  const q = norm(search.value).trim()
  const terms = q ? q.split(' ') : []
  const list = props.items.filter((it) => {
    if (group.value && (it.group_name || '—') !== group.value) return false
    if (onlyMoved.value && !(it.in || it.out || it.reserve || it.adjust)) return false
    if (status.value) {
      const st = stockStatus(it)
      if (status.value === 'reserved' ? !(it.reserve - it.release) : status.value === 'empty' ? st !== 'empty' && st !== 'negative' : st !== status.value) return false
    }
    if (terms.length) {
      const hay = norm(`${it.code} ${it.name} ${it.group_name} ${it.sap_code || ''}`)
      if (!terms.every((term) => hay.includes(term))) return false
    }
    return true
  })
  const { prop, order } = sort.value
  if (prop && order) {
    const dir = order === 'ascending' ? 1 : -1
    list.sort((a, b) => {
      const av = a[prop] ?? ''
      const bv = b[prop] ?? ''
      return (typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), 'ru')) * dir
    })
  }
  return list
})

const paged = computed(() => filtered.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))

const sum = computed(() =>
  filtered.value.reduce(
    (s, it) => ({ in: s.in + it.in, out: s.out + it.out, closing: s.closing + it.closing }),
    { in: 0, out: 0, closing: 0 },
  ),
)

const hasFilters = computed(() => !!(search.value || group.value || status.value || onlyMoved.value))

watch([search, group, status, onlyMoved], () => (page.value = 1))

function pickGroup(name) {
  group.value = name
}

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
    [t('skColCode')]: it.code,
    [t('skColName')]: it.name,
    [t('skColGroup')]: it.group_name || '',
    [t('skColUnit')]: unitLabel(it.unit),
    [t('skColOpening')]: it.opening,
    [t('skColIn')]: it.in,
    [t('skColOut')]: it.out,
    [t('skColReserve')]: it.reserve - it.release,
    [t('skColAdjust')]: it.adjust,
    [t('skColClosing')]: it.closing,
    [t('skColLast')]: it.last_move_date || '',
    SAP: it.sap_code || '',
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [{ wch: 10 }, { wch: 48 }, { wch: 18 }, { wch: 8 }, ...Array(7).fill({ wch: 12 })]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, (periodLabel(props.period) || t('skStockTitle')).slice(0, 31))
  XLSX.writeFile(wb, `${t('skFileStock')}-${props.period}.xlsx`)
}
</script>

<style scoped lang="scss">
.sk-select {
  width: 170px;
}
.sk-groups {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.sk-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--ui-line);
  border-radius: 99px;
  background: var(--ui-surface);
  color: var(--ui-ink-2);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s;
  b {
    font-weight: 600;
    color: var(--ui-muted);
    font-variant-numeric: tabular-nums;
  }
  &:hover {
    border-color: var(--ui-link-line);
  }
  &.on {
    background: var(--ui-link);
    border-color: var(--ui-link);
    color: var(--ui-on-accent);
    b {
      color: var(--ui-on-accent);
      opacity: 0.85;
    }
  }
  &:focus-visible {
    outline: 2px solid var(--ui-link);
    outline-offset: 2px;
  }
}
.sk-count {
  margin-left: 6px;
  padding: 1px 8px;
  border-radius: 99px;
  font-size: 12px;
  background: var(--ui-surface-3);
  color: var(--ui-muted);
}
.sk-sum {
  font-size: 12px;
  b {
    font-variant-numeric: tabular-nums;
    color: var(--ui-ink);
  }
}
.sk-table {
  :deep(.sk-row) {
    cursor: pointer;
  }
  :deep(th.el-table__cell) {
    background: var(--ui-surface-2);
    color: var(--ui-muted);
    font-weight: 600;
    font-size: 12px;
  }
  :deep(.cell) {
    font-variant-numeric: tabular-nums;
  }
}
.sk-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  color: var(--ui-muted);
}
.sk-name {
  color: var(--ui-ink);
  font-weight: 500;
  line-height: 1.35;
}
.sk-group {
  font-size: 11px;
  color: var(--ui-muted);
}
.is-in {
  color: var(--ui-good);
  font-weight: 600;
}
.is-out {
  color: var(--ui-orange-ink);
  font-weight: 600;
}
.is-reserve {
  color: var(--ui-violet-ink);
  font-weight: 600;
}
.sk-qty {
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
  font-size: 11px;
  color: var(--ui-muted);
}
.sk-muted {
  color: var(--ui-muted);
}
.sk-empty {
  padding: 24px;
  color: var(--ui-muted);
}
.sk-pager {
  display: flex;
  justify-content: flex-end;
  padding: 10px 12px;
  border-top: 1px solid var(--ui-line-soft);
}
</style>
