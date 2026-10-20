<template>
  <UiToolbar>
    <UiField :label="$t('skSearch')" grow>
      <el-input v-model="search" :prefix-icon="Search" clearable :placeholder="$t('skMoveSearchPh')" />
    </UiField>
    <UiField :label="$t('skMoveType')">
      <div class="sk-types">
        <button
          v-for="tp in typeOptions"
          :key="tp.value"
          type="button"
          class="sk-type"
          :class="[`t-${tp.value || 'all'}`, { on: type === tp.value }]"
          @click="type = tp.value"
        >
          {{ tp.label }} <b>{{ fmtNum(tp.count) }}</b>
        </button>
      </div>
    </UiField>
    <UiField :label="$t('skDay')">
      <el-select v-model="day" clearable :placeholder="$t('skAllDays')" class="sk-day">
        <el-option v-for="d in days" :key="d" :label="shortDate(d)" :value="d" />
      </el-select>
    </UiField>
    <UiField :label="$t('skSource')">
      <el-select v-model="source" clearable :placeholder="$t('skAll')" class="sk-day">
        <el-option value="sheet" :label="$t('skSourceSheet')" />
        <el-option value="erp" :label="$t('skSourceErp')" />
      </el-select>
    </UiField>
    <template #actions>
      <el-button :icon="Download" @click="exportExcel">{{ $t('skExport') }}</el-button>
    </template>
  </UiToolbar>

  <UiPanel flush>
    <template #title>
      {{ $t('skMovesTitle') }}
      <span class="sk-count">{{ fmtNum(filtered.length) }}</span>
    </template>
    <template #actions>
      <span class="sk-sum">
        {{ $t('skStatIn') }}: <b class="is-in">+{{ fmtQty(sum.in) }}</b> · {{ $t('skStatOut') }}:
        <b class="is-out">−{{ fmtQty(sum.out) }}</b>
      </span>
    </template>
    <el-table v-loading="loading" :data="paged" size="small" class="sk-table" row-class-name="sk-row" @row-click="(r) => $emit('open', r.item_id)">
      <el-table-column :label="$t('skColDate')" width="76">
        <template #default="{ row }">{{ shortDate(row.move_date) }}</template>
      </el-table-column>
      <el-table-column :label="$t('skMoveType')" width="120">
        <template #default="{ row }">
          <span class="sk-tag" :class="`t-${row.type}`">{{ moveTypeLabel(row.type) }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('skColName')" min-width="240">
        <template #default="{ row }">
          <div class="sk-name">{{ row.item?.name }}</div>
          <div class="sk-group">{{ row.item?.code }} · {{ row.item?.group_name || '—' }}</div>
        </template>
      </el-table-column>
      <el-table-column :label="$t('skColQty')" width="96" align="right">
        <template #default="{ row }">
          <b :class="`q-${row.type}`">{{ signedQty(row.type, row.qty) }}</b>
        </template>
      </el-table-column>
      <el-table-column :label="$t('skColDogovor')" width="110">
        <template #default="{ row }">{{ row.dogovor_number || '—' }}</template>
      </el-table-column>
      <el-table-column :label="$t('skColCounterparty')" min-width="150">
        <template #default="{ row }">
          <div>{{ row.counterparty || '—' }}</div>
          <div v-if="row.doc_number" class="sk-group">№ {{ row.doc_number }}</div>
        </template>
      </el-table-column>
      <el-table-column :label="$t('skColComment')" min-width="150">
        <template #default="{ row }"><span class="sk-muted">{{ row.comment || '' }}</span></template>
      </el-table-column>
      <el-table-column :label="$t('skSource')" width="130">
        <template #default="{ row }">
          <span v-if="row.source === 'sheet'" class="sk-src">📄 {{ $t('skSourceSheet') }}</span>
          <span v-else class="sk-src">👤 {{ creatorName(row) }}</span>
        </template>
      </el-table-column>
      <el-table-column width="52" align="center">
        <template #default="{ row }">
          <el-popconfirm
            v-if="canDelete(row)"
            :title="$t('skDeleteConfirm')"
            @confirm="remove(row)"
          >
            <template #reference>
              <el-button link type="danger" :icon="Delete" :aria-label="$t('skDelete')" @click.stop />
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
      <template #empty>
        <div class="sk-empty">{{ $t('skNoMoves') }}</div>
      </template>
    </el-table>
    <div v-if="filtered.length > pageSize" class="sk-pager">
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="filtered.length"
        layout="total, prev, pager, next"
        background
        small
      />
    </div>
  </UiPanel>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import * as XLSX from 'xlsx'
import { Delete, Download, Search } from '@element-plus/icons-vue'
import UiToolbar from '@/components/ui/UiToolbar.vue'
import UiField from '@/components/ui/UiField.vue'
import UiPanel from '@/components/ui/UiPanel.vue'
import { useSkladStore } from '@/stores/sklad'
import { fmtNum } from '@/utils/format'
import { fmtQty, moveTypeLabel, shortDate, signedQty } from '@/utils/skladFormat'

const props = defineProps({
  isAdmin: { type: Boolean, default: false },
})
defineEmits(['open'])
const { t } = useI18n()
const store = useSkladStore()

const loading = ref(false)
const search = ref('')
const type = ref('')
const day = ref('')
const source = ref('')
const page = ref(1)
const pageSize = 100
const currentUserId = Number(localStorage.getItem('userid'))
const EDIT_WINDOW_MS = 2 * 24 * 60 * 60 * 1000

async function load() {
  loading.value = true
  try {
    await store.loadMovements()
  } finally {
    loading.value = false
  }
}
onMounted(load)
watch(() => store.period, load)

const moves = computed(() => store.movements)

const typeOptions = computed(() => {
  const count = (tp) => moves.value.filter((m) => !tp || m.type === tp).length
  return [
    { value: '', label: t('skAll'), count: count('') },
    ...['in', 'out', 'reserve', 'release', 'adjust']
      .map((tp) => ({ value: tp, label: moveTypeLabel(tp), count: count(tp) }))
      .filter((o) => o.count),
  ]
})

const days = computed(() => [...new Set(moves.value.map((m) => m.move_date))].sort().reverse())

const norm = (s) => String(s || '').toLowerCase()
const filtered = computed(() => {
  const q = norm(search.value).trim()
  return moves.value.filter((m) => {
    if (type.value && m.type !== type.value) return false
    if (day.value && m.move_date !== day.value) return false
    if (source.value && m.source !== source.value) return false
    if (q) {
      const hay = norm(`${m.item?.name} ${m.item?.code} ${m.dogovor_number} ${m.counterparty} ${m.doc_number} ${m.comment}`)
      if (!hay.includes(q)) return false
    }
    return true
  })
})
const paged = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))
watch([search, type, day, source], () => (page.value = 1))

const sum = computed(() =>
  filtered.value.reduce(
    (s, m) => ({ in: s.in + (m.type === 'in' ? m.qty : 0), out: s.out + (m.type === 'out' ? m.qty : 0) }),
    { in: 0, out: 0 },
  ),
)

const creatorName = (m) => [m.creator?.firstname, m.creator?.lastname].filter(Boolean).join(' ') || t('skSourceErp')

function canDelete(m) {
  if (m.source !== 'erp') return false
  if (props.isAdmin) return true
  return Number(m.created_by) === currentUserId && Date.now() - new Date(m.createdAt).getTime() < EDIT_WINDOW_MS
}

async function remove(m) {
  try {
    await store.removeMovement(m.id)
    ElMessage.success(t('skDeleted'))
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || t('skError'))
  }
}

function exportExcel() {
  const rows = filtered.value.map((m) => ({
    [t('skColDate')]: m.move_date,
    [t('skMoveType')]: moveTypeLabel(m.type),
    [t('skColCode')]: m.item?.code,
    [t('skColName')]: m.item?.name,
    [t('skColGroup')]: m.item?.group_name || '',
    [t('skColQty')]: m.qty,
    [t('skColDogovor')]: m.dogovor_number || '',
    [t('skColCounterparty')]: m.counterparty || '',
    [t('skColDoc')]: m.doc_number || '',
    [t('skColComment')]: m.comment || '',
    [t('skSource')]: m.source === 'sheet' ? t('skSourceSheet') : creatorName(m),
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Harakatlar')
  XLSX.writeFile(wb, `ombor-harakatlar-${store.period}.xlsx`)
}
</script>

<style scoped lang="scss">
.sk-types {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.sk-type {
  padding: 5px 10px;
  border: 1px solid var(--ui-line);
  border-radius: 99px;
  background: var(--ui-surface);
  color: var(--ui-ink-2);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  b {
    color: var(--ui-muted);
    font-weight: 600;
  }
  &.on {
    background: var(--ui-ink);
    border-color: var(--ui-ink);
    color: var(--ui-surface);
    b {
      color: var(--ui-surface);
    }
  }
}
.sk-day {
  width: 130px;
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
.sk-tag {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  &.t-in {
    background: var(--ui-good-soft);
    color: var(--ui-good);
  }
  &.t-out {
    background: var(--ui-orange-soft);
    color: var(--ui-orange-ink);
  }
  &.t-reserve,
  &.t-release {
    background: var(--ui-violet-soft);
    color: var(--ui-violet-ink);
  }
  &.t-adjust,
  &.t-snapshot {
    background: var(--ui-surface-3);
    color: var(--ui-ink-2);
  }
}
.q-in,
.q-release,
.is-in {
  color: var(--ui-good);
}
.q-out,
.is-out {
  color: var(--ui-orange-ink);
}
.q-reserve {
  color: var(--ui-violet-ink);
}
.sk-name {
  color: var(--ui-ink);
  font-weight: 500;
  line-height: 1.35;
}
.sk-group,
.sk-muted,
.sk-src {
  font-size: 12px;
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
