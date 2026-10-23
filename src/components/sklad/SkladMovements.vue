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
        <el-option v-for="d in days" :key="d" :label="dayMonth(d)" :value="d" />
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
      <el-button v-if="cols.changed.value" size="small" text :title="$t('skResizeHint')" @click="cols.reset()">{{ $t('skResetWidths') }}</el-button>
      <span class="sk-sum">
        {{ $t('skStatIn') }}: <b class="is-in">+{{ fmtQty(sum.in) }}</b> · {{ $t('skStatOut') }}:
        <b class="is-out">−{{ fmtQty(sum.out) }}</b>
      </span>
    </template>
    <el-table v-loading="loading" :data="paged" :key="cols.version.value" class="sk-table ui-resizable" row-class-name="sk-row" border @header-dragend="cols.onDragEnd" @row-click="(r) => $emit('open', r.item_id)">
      <el-table-column :label="$t('skColDate')" v-bind="cols.col('skColDate', { width: 90 })" column-key="skColDate">
        <template #default="{ row }">{{ dayMonth(row.move_date) }}</template>
      </el-table-column>
      <el-table-column :label="$t('skMoveType')" v-bind="cols.col('skMoveType', { width: 140 })" column-key="skMoveType">
        <template #default="{ row }">
          <span class="sk-tag" :class="`t-${row.type}`">{{ moveTypeLabel(row.type) }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('skColName')" v-bind="cols.col('skColName', { minWidth: 220 })" column-key="skColName">
        <template #default="{ row }">
          <div class="sk-name">{{ itemName(row.item) }}</div>
          <div class="sk-group">
            <template v-if="row.item?.sap_code">{{ row.item.sap_code }} · </template>{{ row.item?.group_name || '—' }}
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="$t('skColQty')" v-bind="cols.col('skColQty', { width: 100 })" column-key="skColQty" align="right">
        <template #default="{ row }">
          <b :class="`q-${row.type}`">{{ signedQty(row.type, row.qty) }}</b>
        </template>
      </el-table-column>
      <el-table-column :label="$t('skColDogovor')" v-bind="cols.col('skColDogovor', { width: 110 })" column-key="skColDogovor">
        <template #default="{ row }">
          <span v-if="row.dogovor_number">{{ row.dogovor_number }}</span><span v-else class="sk-none">—</span>
        </template>
      </el-table-column>
      <!-- Kimdan/kimga, hujjat, izoh va kim kiritgani — bitta ustunda (jadval ekranga sig'sin) -->
      <el-table-column :label="$t('skColDetails')" v-bind="cols.col('skColDetails', { minWidth: 200 })" column-key="skColDetails">
        <template #default="{ row }">
          <div v-if="row.counterparty">{{ row.counterparty }}</div>
          <div v-if="row.doc_number" class="sk-group">№ {{ row.doc_number }}</div>
          <div v-if="moveComment(row.comment)" class="sk-muted">{{ moveComment(row.comment) }}</div>
          <div class="sk-src">
            {{ row.source === 'sheet' ? $t('skFromSheet') : $t('skEnteredBy', { name: creatorName(row) }) }}
          </div>
        </template>
      </el-table-column>
      <el-table-column width="52" align="center" :resizable="false">
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
import { apiError, dayMonth, fmtQty, itemName, moveComment, moveTypeLabel, signedQty } from '@/utils/skladFormat'
import { useColumnWidths } from '@/composables/useColumnWidths'

// Ustun chegarasini sudrab kenglikni o'zgartirish (brauzerda eslab qolinadi)
const cols = useColumnWidths('sklad-moves')

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
      const hay = norm(`${m.item?.name} ${m.item?.sap_name || ''} ${m.item?.sap_code || ''} ${m.dogovor_number} ${m.counterparty} ${m.doc_number} ${moveComment(m.comment)}`)
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
    ElMessage.error(apiError(e))
  }
}

function exportExcel() {
  const rows = filtered.value.map((m) => ({
    [t('skColDate')]: m.move_date,
    [t('skMoveType')]: moveTypeLabel(m.type),
    [t('skSapCode')]: m.item?.sap_code || '',
    [t('skColName')]: itemName(m.item),
    [t('skColGroup')]: m.item?.group_name || '',
    [t('skColQty')]: m.qty,
    [t('skColDogovor')]: m.dogovor_number || '',
    [t('skColCounterparty')]: m.counterparty || '',
    [t('skColDoc')]: m.doc_number || '',
    [t('skColComment')]: moveComment(m.comment),
    [t('skSource')]: m.source === 'sheet' ? t('skSourceSheet') : creatorName(m),
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, t('skMovesTitle').slice(0, 31))
  XLSX.writeFile(wb, `${t('skFileMoves')}-${store.period}.xlsx`)
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
    color: var(--ui-ink-2);
    font-weight: 600;
    font-size: 14px;
    text-transform: none;
    letter-spacing: 0;
  }
  /* Element Plus so'zni istalgan harfdan bo'ladi — sarlavhada bo'lmasin */
  :deep(th .cell) {
    word-break: normal;
    white-space: nowrap;
  }
  :deep(.cell) {
    font-variant-numeric: tabular-nums;
    word-break: normal;
  }
  :deep(td .cell) {
    font-size: 14px;
    line-height: 1.45;
  }
  :deep(td.el-table__cell) {
    padding: 10px 0;
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
.sk-none {
  color: var(--ui-faint);
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
