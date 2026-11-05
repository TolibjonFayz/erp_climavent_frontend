<template>
  <!-- ERP'ga tushgan (hali jo'natilmagan) shartnomalar: qaysi mahsulotdan nechtasi omborda tayyor -->
  <div class="sk-rstats">
    <UiStat :label="$t('skRdContracts')" :value="fmtNum(stats.orders)" :sub="$t('skCtrLines', { n: stats.lines })" />
    <UiStat :label="$t('skRd_ready')" :value="fmtNum(stats.ready)" :sub="$t('skRdReadySub')" tone="good" />
    <UiStat :label="$t('skRd_partial')" :value="fmtNum(stats.partial)" :sub="$t('skRdPartialSub')" tone="warn" />
    <UiStat :label="$t('skRd_none')" :value="fmtNum(stats.none)" :sub="$t('skRdNoneSub')" tone="bad" />
  </div>

  <UiToolbar>
    <UiField :label="$t('skSearch')" grow>
      <el-input v-model="search" :prefix-icon="Search" clearable :placeholder="$t('skRdSearchPh')" />
    </UiField>
    <UiField :label="$t('skStatus')">
      <div class="sk-chips">
        <button
          v-for="s in ['', 'ready', 'partial', 'none']"
          :key="s || 'all'"
          type="button"
          class="sk-chip"
          :class="{ 'is-active': status === s }"
          @click="status = s"
        >
          {{ s ? $t(`skRd_${s}`) : $t('skAll') }}
        </button>
      </div>
    </UiField>
  </UiToolbar>

  <UiPanel flush>
    <template #title>
      <UiHint :label="$t('skRdTitle')" :hint="$t('skRdHint')" />
      <span class="sk-count">{{ fmtNum(orders.length) }}</span>
    </template>
    <el-table v-loading="loading" :data="rows" class="sk-table" :span-method="spanMethod" max-height="640">
      <el-table-column :label="$t('skColDogovor')" min-width="200">
        <template #default="{ row }">
          <router-link :to="{ path: '/otgruzka', query: { id: row.order.id } }" class="sk-link"><b>№ {{ row.order.dogovor_number || '—' }}</b></router-link>
          <div class="sk-client">{{ row.order.client_name }}</div>
          <div class="sk-muted">
            {{ row.order.dogovor_date ? formatDate(row.order.dogovor_date) : '' }}
            <template v-if="row.order.manager_name"> · {{ row.order.manager_name }}</template>
          </div>
          <span class="sk-tag" :class="`c-${orderStatus(row.order)}`">
            {{ $t('skRdOrderReady', { ready: row.order.summary.ready_positions, total: row.order.summary.positions }) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('skColName')" min-width="230">
        <template #default="{ row }">
          <span class="sk-name">{{ row.item.name }}</span>
          <div v-if="row.st.item" class="sk-muted">
            {{ $t('skRdMatched') }}:
            <el-button link type="primary" size="small" @click="$emit('open', row.st.item.id)">
              {{ row.st.item.sap_name || row.st.item.name }}
            </el-button>
            <span v-if="row.st.approx" :title="$t('skRdApprox')">≈</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="$t('skRdNeed')" min-width="90" align="right">
        <template #default="{ row }">{{ fmtQty(row.st.qty) }}</template>
      </el-table-column>
      <el-table-column min-width="110" align="right">
        <template #header><UiHint :label="$t('skRdReserved')" :hint="$t('skRdReservedHint')" /></template>
        <template #default="{ row }">{{ row.st.reserved ? fmtQty(row.st.reserved) : '—' }}</template>
      </el-table-column>
      <el-table-column min-width="110" align="right">
        <template #header><UiHint :label="$t('skRdFree')" :hint="$t('skRdFreeHint')" /></template>
        <template #default="{ row }">{{ row.st.balance == null ? '—' : fmtQty(row.st.balance) }}</template>
      </el-table-column>
      <el-table-column :label="$t('skRdReady')" min-width="90" align="right">
        <template #default="{ row }"><b>{{ row.st.status === 'unknown' ? '—' : fmtQty(row.st.ready) }}</b></template>
      </el-table-column>
      <el-table-column :label="$t('skStatus')" min-width="150">
        <template #default="{ row }">
          <span class="sk-tag" :class="`c-${row.st.status}`">{{ $t(`skRd_${row.st.status}`) }}</span>
        </template>
      </el-table-column>
      <template #empty>
        <div class="sk-empty">{{ $t('skRdEmpty') }}</div>
      </template>
    </el-table>
  </UiPanel>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import UiToolbar from '@/components/ui/UiToolbar.vue'
import UiField from '@/components/ui/UiField.vue'
import UiPanel from '@/components/ui/UiPanel.vue'
import UiStat from '@/components/ui/UiStat.vue'
import UiHint from '@/components/ui/UiHint.vue'
import otgruzkaApi from '@/api/otgruzka'
import { fmtNum, formatDate } from '@/utils/format'
import { fmtQty } from '@/utils/skladFormat'
import { otError } from '@/utils/otgruzkaFormat'

defineEmits(['open'])
const loading = ref(false)
const orders = ref([])
const search = ref('')
const status = ref('')

onMounted(async () => {
  loading.value = true
  try {
    orders.value = await otgruzkaApi.readiness()
  } catch (e) {
    ElMessage.error(otError(e))
  } finally {
    loading.value = false
  }
})

// Shartnoma holati: hamma pozitsiya tayyor / bir qismi / hech narsa
function orderStatus(o) {
  const s = o.summary
  if (s.positions && s.ready_positions === s.positions) return 'ready'
  return s.pct > 0 ? 'partial' : 'none'
}

const norm = (s) => String(s || '').toLowerCase()
const visible = computed(() => {
  const q = norm(search.value).trim()
  return orders.value.filter((o) => {
    if (status.value && orderStatus(o) !== status.value) return false
    if (q && !norm(`${o.dogovor_number} ${o.client_name} ${o.manager_name} ${o.items.map((i) => i.name).join(' ')}`).includes(q)) return false
    return true
  })
})
const rows = computed(() => visible.value.flatMap((order) => order.items.map((item, i) => ({ order, item, st: order.rows[i], first: i === 0 }))))

function spanMethod({ row, columnIndex }) {
  if (columnIndex !== 0) return
  return row.first ? { rowspan: row.order.items.length, colspan: 1 } : { rowspan: 0, colspan: 0 }
}

const stats = computed(() => ({
  orders: orders.value.length,
  lines: orders.value.reduce((s, o) => s + o.items.length, 0),
  ready: orders.value.filter((o) => orderStatus(o) === 'ready').length,
  partial: orders.value.filter((o) => orderStatus(o) === 'partial').length,
  none: orders.value.filter((o) => orderStatus(o) === 'none').length,
}))
</script>

<style scoped lang="scss">
.sk-rstats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}
.sk-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.sk-chip {
  padding: 6px 12px;
  border-radius: 99px;
  border: 1px solid var(--ui-line);
  background: var(--ui-surface);
  color: var(--ui-ink-2);
  font-size: 14px;
  cursor: pointer;
  &.is-active {
    background: var(--ui-link-soft);
    border-color: var(--ui-link);
    color: var(--ui-link);
    font-weight: 600;
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
.sk-table {
  :deep(th.el-table__cell) {
    background: var(--ui-surface-2);
    color: var(--ui-ink-2);
    font-weight: 600;
    font-size: 14px;
    text-transform: none;
    letter-spacing: 0;
  }
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
    vertical-align: top;
  }
}
.sk-link {
  color: var(--ui-link);
  text-decoration: none;
}
.sk-client {
  color: var(--ui-ink);
  margin: 2px 0;
}
.sk-name {
  color: var(--ui-ink);
}
.sk-muted {
  font-size: 12px;
  color: var(--ui-muted);
}
.sk-tag {
  display: inline-block;
  margin-top: 4px;
  padding: 1px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  &.c-ready {
    background: var(--ui-good-soft);
    color: var(--ui-good);
  }
  &.c-partial {
    background: var(--ui-warn-soft);
    color: var(--ui-warn-ink);
  }
  &.c-none {
    background: var(--ui-bad-soft);
    color: var(--ui-bad);
  }
  &.c-unknown {
    background: var(--ui-surface-3);
    color: var(--ui-muted);
  }
}
.sk-empty {
  padding: 24px;
  color: var(--ui-muted);
}
</style>
