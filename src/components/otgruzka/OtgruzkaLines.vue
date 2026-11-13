<template>
  <div class="ot-lines">
    <UiToolbar>
      <UiField :label="$t('otSearch')" grow>
        <el-input v-model="q" :placeholder="$t('otSearchPh')" clearable :prefix-icon="Search" />
      </UiField>
      <UiField :label="$t('otLineLabel')">
        <el-select v-model="label" clearable filterable :placeholder="$t('otAll')" class="ot-sel">
          <el-option v-for="l in labels" :key="l" :label="l" :value="l" />
        </el-select>
      </UiField>
    </UiToolbar>
    <el-alert v-if="error" type="error" show-icon :closable="false" :title="error" />
    <UiPanel flush>
      <template #title>{{ $t('otShown', { n: filtered.length }) }}</template>
      <template #actions>
        <el-checkbox v-model="onlyOver" :disabled="!overCount">{{ $t('otOverOnly', { n: overCount }) }}</el-checkbox>
      </template>
      <el-table v-loading="loading" :data="filtered" class="ot-lt" :row-class-name="rowClass" @row-click="(r) => r.order_id && $emit('open', r.order_id)">
        <el-table-column :label="$t('otLineDogovor')" prop="dogovor_label" min-width="110" sortable />
        <el-table-column :label="$t('otLineLabel')" prop="client_label" min-width="150" sortable>
          <template #default="{ row }">
            <div>{{ row.client_label || '—' }}</div>
            <div v-if="row.order" class="ot-muted">{{ row.order.client_name }}</div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('otLineName')" prop="item_name" min-width="280" sortable>
          <template #default="{ row }">
            <div>{{ row.item_name }}</div>
            <!-- Shu tovar schyot-fakturalarda shartnomadagidan ko'p yozilgan -->
            <el-popover v-if="row.over" placement="bottom-start" :width="480" trigger="click">
              <template #reference>
                <button type="button" class="ot-over-chip" @click.stop>
                  <el-icon><WarningFilled /></el-icon>
                  {{ $t('otOverLineChip', { contract: fmtQty(row.over.qty), invoiced: fmtQty(row.over.invoiced), n: fmtQty(row.over.over) }) }}
                </button>
              </template>
              <div class="ot-over-pop" @click.stop>
                <OtOverDetails :item="row.over" compact />
              </div>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column :label="$t('otLineQty')" prop="qty_contract" align="right" min-width="100" />
        <el-table-column :label="$t('otLineIn')" prop="qty_in" align="right" min-width="90" />
        <el-table-column :label="$t('otLineOut')" prop="qty_out" align="right" min-width="100">
          <template #default="{ row }">
            <span :class="{ 'is-bad': row.over }">{{ row.qty_out ?? '' }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('otLineRest')" align="right" min-width="100">
          <template #default="{ row }"><b>{{ rest(row) }}</b></template>
        </el-table-column>
        <el-table-column :label="$t('otPayComment')" prop="note" min-width="140" />
      </el-table>
    </UiPanel>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { Search, WarningFilled } from '@element-plus/icons-vue'
import UiToolbar from '@/components/ui/UiToolbar.vue'
import UiField from '@/components/ui/UiField.vue'
import UiPanel from '@/components/ui/UiPanel.vue'
import api from '@/api/otgruzka'
import { otError } from '@/utils/otgruzkaFormat'
import { fmtQty } from '@/utils/skladFormat'
import OtOverDetails from './OtOverDetails.vue'

defineEmits(['open'])
const rows = ref([])
const loading = ref(false)
const error = ref('')
const q = ref('')
const label = ref('')
const onlyOver = ref(false)
const overCount = computed(() => rows.value.filter((r) => r.over).length)
const rowClass = ({ row }) => [row.order_id ? 'is-link' : '', row.over ? 'is-over' : ''].filter(Boolean).join(' ')

const labels = computed(() => [...new Set(rows.value.map((r) => r.client_label).filter(Boolean))].sort())
const filtered = computed(() => {
  const words = q.value.toLowerCase().trim().split(/\s+/).filter(Boolean)
  return rows.value.filter((r) => {
    if (label.value && r.client_label !== label.value) return false
    if (onlyOver.value && !r.over) return false
    if (!words.length) return true
    const hay = [r.dogovor_label, r.client_label, r.item_name, r.note, r.order?.client_name].join(' ').toLowerCase()
    return words.every((w) => hay.includes(w))
  })
})
const rest = (r) => (r.qty_in ?? 0) - (r.qty_out ?? 0)

onMounted(async () => {
  loading.value = true
  try {
    rows.value = await api.lines()
  } catch (e) {
    error.value = otError(e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.ot-lines {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ot-sel {
  width: 200px;
}
.ot-lt {
  font-size: 14px;
}
.ot-lt :deep(.el-table__cell .cell) {
  word-break: normal;
}
.ot-lt :deep(.el-table__row.is-link) {
  cursor: pointer;
}
.ot-muted {
  font-size: 12px;
  color: var(--ui-muted);
}
.ot-lt :deep(.el-table__row.is-over > td) {
  background: var(--ui-bad-soft);
}
.is-bad {
  font-weight: 700;
  color: var(--ui-bad);
}
</style>
