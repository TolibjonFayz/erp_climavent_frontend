<template>
  <div class="sk-cstats">
    <UiStat :label="$t('skCtrCount')" :value="fmtNum(stats.contracts)" :sub="$t('skCtrLines', { n: stats.lines })" />
    <UiStat :label="$t('skCtrInStock')" :value="fmtQty(stats.inStock)" :sub="$t('skCtrInStockSub')" tone="good" />
    <UiStat :label="$t('skCtrWaiting')" :value="fmtNum(stats.waiting)" :sub="$t('skCtrWaitingSub')" tone="warn" />
    <UiStat :label="$t('skCtrShipped')" :value="fmtNum(stats.shipped)" :sub="$t('skCtrShippedSub')" />
  </div>

  <UiToolbar>
    <UiField :label="$t('skSearch')" grow>
      <el-input v-model="search" :prefix-icon="Search" clearable :placeholder="$t('skCtrSearchPh')" />
    </UiField>
    <UiField :label="$t('skStatus')">
      <el-select v-model="status" clearable :placeholder="$t('skAll')" class="sk-select">
        <el-option v-for="s in ['waiting', 'stock', 'partial', 'shipped']" :key="s" :value="s" :label="$t(`skCtr_${s}`)" />
      </el-select>
    </UiField>
  </UiToolbar>

  <UiPanel flush>
    <template #title>
      {{ $t('skCtrTitle') }} <span class="sk-count">{{ fmtNum(filtered.length) }}</span>
    </template>
    <el-table
      v-loading="loading"
      :data="filtered"
      class="sk-table"
      :span-method="spanMethod"
      max-height="640"
    >
      <el-table-column :label="$t('skColDogovor')" min-width="110" column-key="skColDogovor">
        <template #default="{ row }">
          <b>{{ row.dogovor_number || '—' }}</b>
          <div class="sk-muted">{{ $t('skCtrPositions', { n: groupSize(row) }) }}</div>
        </template>
      </el-table-column>
      <el-table-column :label="$t('skColName')" min-width="220" column-key="skColName">
        <template #default="{ row }">
          <span class="sk-name">{{ row.item_name }}</span>
          <el-button v-if="row.item_id" link type="primary" size="small" @click="$emit('open', row.item_id)">
            {{ row.item?.sap_code || $t('skOpenCard') }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column :label="$t('skCtrQty')" min-width="120" column-key="skCtrQty" align="right">
        <template #default="{ row }">{{ row.qty_contract == null ? '—' : fmtQty(row.qty_contract) }}</template>
      </el-table-column>
      <el-table-column :label="$t('skColIn')" min-width="100" column-key="skColIn" align="right">
        <template #default="{ row }">{{ fmtQty(row.qty_in) }}</template>
      </el-table-column>
      <el-table-column :label="$t('skColOut')" min-width="100" column-key="skColOut" align="right">
        <template #default="{ row }">{{ fmtQty(row.qty_out) }}</template>
      </el-table-column>
      <el-table-column :label="$t('skCtrLeft')" min-width="110" column-key="skCtrLeft" align="right">
        <template #default="{ row }"><b>{{ fmtQty(left(row)) }}</b></template>
      </el-table-column>
      <el-table-column :label="$t('skStatus')" min-width="170" column-key="skStatus">
        <template #default="{ row }">
          <span class="sk-tag" :class="`c-${lineStatus(row)}`">{{ $t(`skCtr_${lineStatus(row)}`) }}</span>
        </template>
      </el-table-column>
      <template #empty>
        <div class="sk-empty">{{ $t('skCtrEmpty') }}</div>
      </template>
    </el-table>
  </UiPanel>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { Search } from '@element-plus/icons-vue'
import UiToolbar from '@/components/ui/UiToolbar.vue'
import UiField from '@/components/ui/UiField.vue'
import UiPanel from '@/components/ui/UiPanel.vue'
import UiStat from '@/components/ui/UiStat.vue'
import { useSkladStore } from '@/stores/sklad'
import { fmtNum } from '@/utils/format'
import { fmtQty } from '@/utils/skladFormat'


defineEmits(['open'])
const store = useSkladStore()
const loading = ref(false)
const search = ref('')
const status = ref('')

onMounted(async () => {
  loading.value = true
  try {
    await store.loadContracts()
  } finally {
    loading.value = false
  }
})

const left = (r) => (Number(r.qty_in) || 0) - (Number(r.qty_out) || 0)

// waiting — hali kelmagan, stock — omborda to'liq, partial — qisman jo'natilgan, shipped — jo'natib bo'lingan
function lineStatus(r) {
  const inQ = Number(r.qty_in) || 0
  const outQ = Number(r.qty_out) || 0
  if (!inQ) return 'waiting'
  if (outQ >= inQ) return 'shipped'
  if (outQ > 0) return 'partial'
  return 'stock'
}

const norm = (s) => String(s || '').toLowerCase()
const filtered = computed(() => {
  const q = norm(search.value).trim()
  return store.contracts.filter((r) => {
    if (status.value && lineStatus(r) !== status.value) return false
    if (q && !norm(`${r.dogovor_number} ${r.item_name}`).includes(q)) return false
    return true
  })
})

// Bir shartnomaning qatorlari ketma-ket — birinchi ustunni birlashtiramiz
const sizes = computed(() => {
  const map = new Map()
  for (const r of filtered.value) map.set(r.dogovor_number, (map.get(r.dogovor_number) || 0) + 1)
  return map
})
const groupSize = (row) => sizes.value.get(row.dogovor_number) || 1

function spanMethod({ row, rowIndex, columnIndex }) {
  if (columnIndex !== 0) return
  const prev = filtered.value[rowIndex - 1]
  if (prev && prev.dogovor_number === row.dogovor_number) return { rowspan: 0, colspan: 0 }
  let n = 1
  while (filtered.value[rowIndex + n]?.dogovor_number === row.dogovor_number) n++
  return { rowspan: n, colspan: 1 }
}

const stats = computed(() => {
  const all = store.contracts
  return {
    contracts: new Set(all.map((r) => r.dogovor_number).filter(Boolean)).size,
    lines: all.length,
    inStock: all.reduce((s, r) => s + Math.max(0, left(r)), 0),
    waiting: all.filter((r) => lineStatus(r) === 'waiting').length,
    shipped: all.filter((r) => lineStatus(r) === 'shipped').length,
  }
})
</script>

<style scoped lang="scss">
.sk-cstats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}
.sk-select {
  width: 190px;
}
.sk-count {
  margin-left: 6px;
  padding: 1px 8px;
  border-radius: 99px;
  font-size: 12px;
  background: var(--ui-surface-3);
  color: var(--ui-muted);
}
.sk-table {
  :deep(th.el-table__cell) {
    background: var(--ui-surface-2);
    color: var(--ui-ink-2);
    font-weight: 600;
    font-size: 14px;
    text-transform: none;
    letter-spacing: 0;
  }
  /* Element Plus so'zni istalgan harfdan bo'ladi — sarlavhada bo'lmasin */
  :deep(th .cell) {
    word-break: normal;
    white-space: normal;
    line-height: 1.3;
  }
  :deep(.cell) {
    font-variant-numeric: tabular-nums;
    word-break: normal;
  }
  :deep(td .cell) {
    overflow-wrap: anywhere;
    font-size: 14px;
    line-height: 1.45;
  }
  :deep(td.el-table__cell) {
    padding: 10px 0;
  }
}
.sk-name {
  color: var(--ui-ink);
  margin-right: 6px;
}
.sk-muted {
  font-size: 11px;
  color: var(--ui-muted);
}
.sk-tag {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  &.c-waiting {
    background: var(--ui-warn-soft);
    color: var(--ui-warn-ink);
  }
  &.c-stock {
    background: var(--ui-good-soft);
    color: var(--ui-good);
  }
  &.c-partial {
    background: var(--ui-link-soft);
    color: var(--ui-link);
  }
  &.c-shipped {
    background: var(--ui-surface-3);
    color: var(--ui-muted);
  }
}
.sk-empty {
  padding: 24px;
  color: var(--ui-muted);
}
</style>
