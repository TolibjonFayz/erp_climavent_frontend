<template>
  <UiPanel flush :title="$t('otTabManagers')" :hint="$t('otMgrHint')">
    <el-table :data="managers" class="ot-mgr" @row-click="(r) => $emit('pick', r.manager)">
      <el-table-column :label="$t('otManager')" prop="manager" min-width="170" sortable />
      <el-table-column :label="$t('otMgrCount')" prop="count" align="right" min-width="110" sortable />
      <el-table-column :label="$t('otColSum')" prop="contract_sum" align="right" min-width="130" sortable>
        <template #default="{ row }">{{ fmtMoney(row.contract_sum) }}</template>
      </el-table-column>
      <el-table-column :label="$t('otMgrDebt')" prop="debt" align="right" min-width="130" sortable>
        <template #default="{ row }"><span :class="{ 'is-bad': row.debt > 1 }">{{ fmtMoney(row.debt) }}</span></template>
      </el-table-column>
      <el-table-column :label="$t('otMgrOpen')" prop="open" align="right" min-width="100" sortable />
      <el-table-column :label="$t('otMgrOpenSum')" prop="open_sum" align="right" min-width="140" sortable>
        <template #default="{ row }">{{ fmtMoney(row.open_sum) }}</template>
      </el-table-column>
      <el-table-column :label="$t('otMgrDone')" prop="done" align="right" min-width="110" sortable>
        <template #default="{ row }">
          {{ row.done }} <span class="ot-muted">· {{ fmtShort(row.done_sum) }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('otAttnTitle')" prop="alerts" align="right" min-width="100" sortable>
        <template #default="{ row }">
          <span v-if="row.alerts" class="ot-tag is-warn">{{ row.alerts }}</span>
          <span v-else class="ot-muted">—</span>
        </template>
      </el-table-column>
    </el-table>
  </UiPanel>
</template>

<script setup>
import { computed } from 'vue'
import UiPanel from '@/components/ui/UiPanel.vue'
import { fmtMoney, fmtShort } from '@/utils/otgruzkaFormat'

const props = defineProps({ rows: { type: Array, default: () => [] } })
defineEmits(['pick'])

// "Зависшая сумма" jadvaldagidek: yakunlanmagan shartnomalar summasi; rad/zapas hisobga olinmaydi
const managers = computed(() => {
  const map = new Map()
  for (const r of props.rows) {
    if (r.final_status) continue
    const name = r.manager_name || '—'
    const m = map.get(name) || { manager: name, count: 0, contract_sum: 0, debt: 0, open: 0, open_sum: 0, done: 0, done_sum: 0, alerts: 0 }
    m.count++
    m.contract_sum += r.contract_sum
    m.debt += r.debt
    if (r.stage === 'done') {
      m.done++
      m.done_sum += r.contract_sum
    } else {
      m.open++
      m.open_sum += r.contract_sum
    }
    if (r.alerts.length) m.alerts++
    map.set(name, m)
  }
  return [...map.values()].sort((a, b) => b.open_sum - a.open_sum)
})
</script>

<style scoped>
.ot-mgr {
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}
.ot-mgr :deep(.el-table__row) {
  cursor: pointer;
}
.ot-mgr :deep(.el-table__cell .cell) {
  word-break: normal;
}
.ot-muted {
  font-size: 12px;
  color: var(--ui-muted);
}
.is-bad {
  color: var(--ui-bad);
  font-weight: 600;
}
</style>
