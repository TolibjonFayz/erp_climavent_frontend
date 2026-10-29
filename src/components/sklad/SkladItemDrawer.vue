<template>
  <el-drawer
    :model-value="modelValue != null"
    :size="drawerSize"
    :with-header="false"
    class="sk-drawer"
    @close="$emit('update:modelValue', null)"
  >
    <div v-loading="loading" class="sk-d" data-tour="sk-item-card">
      <template v-if="item">
        <header class="sk-d__head">
          <div>
            <div class="sk-d__code">
              <template v-if="item.sap_code">SAP {{ item.sap_code }} · </template>{{ item.group_name || '—' }}
            </div>
            <h3>{{ itemName(item) }}</h3>
            <div v-if="sheetNameIfDiff(item)" class="sk-d__sheet">{{ $t('skSheetName', { name: item.name }) }}</div>
          </div>
          <el-button text :icon="Close" :aria-label="$t('onbClose')" @click="$emit('update:modelValue', null)" />
        </header>

        <div class="sk-d__balance">
          <div>
            <div class="sk-d__label">{{ $t('skNowBalance') }}</div>
            <div class="sk-d__big" :class="{ neg: balance < 0 }">
              {{ fmtQty(balance) }} <small>{{ unitLabel(item.unit) }}</small>
            </div>
          </div>
          <div class="sk-d__btns">
            <el-button size="small" :icon="Plus" @click="$emit('move', { type: 'in', itemId: item.id })">
              {{ $t('skType_in') }}
            </el-button>
            <el-button size="small" type="primary" @click="$emit('move', { type: 'out', itemId: item.id })">
              {{ $t('skType_out') }}
            </el-button>
          </div>
        </div>

        <!-- Shu oy: boshi → kirim → chiqim → rezerv → oxiri -->
        <div v-if="reportRow" class="sk-d__flow">
          <div><span>{{ $t('skColOpening') }}</span><b>{{ fmtQty(reportRow.opening) }}</b></div>
          <div class="in"><span>{{ $t('skColIn') }}</span><b>+{{ fmtQty(reportRow.in) }}</b></div>
          <div class="out"><span>{{ $t('skColOut') }}</span><b>−{{ fmtQty(reportRow.out) }}</b></div>
          <div class="res"><span>{{ $t('skColReserve') }}</span><b>{{ fmtQty(reportRow.reserve - reportRow.release) }}</b></div>
          <div class="end"><span>{{ $t('skColClosing') }}</span><b>{{ fmtQty(reportRow.closing) }}</b></div>
        </div>

        <!-- Qoldiq dinamikasi -->
        <div v-if="history.points.length > 1" class="sk-d__chart">
          <div class="sk-d__label">{{ $t('skBalanceHistory') }}</div>
          <svg :viewBox="`0 0 ${CW} ${CH}`" role="img" :aria-label="$t('skBalanceHistory')">
            <line :x1="0" :x2="CW" :y1="hy(0)" :y2="hy(0)" class="base" />
            <polyline :points="history.line" class="line" />
            <circle
              v-for="(p, i) in history.points"
              :key="i"
              :cx="hx(i)"
              :cy="hy(p.bal)"
              r="4"
              class="dot"
            >
              <title>{{ p.date.split('-').reverse().join('.') }}: {{ fmtQty(p.bal) }}</title>
            </circle>
          </svg>
          <div class="sk-d__axis">
            <span>{{ history.points[0].date.split('-').reverse().join('.') }}</span>
            <span>{{ history.points.at(-1).date.split('-').reverse().join('.') }}</span>
          </div>
        </div>

        <!-- Admin: minimal miqdor, SAP kodi va nomi -->
        <div v-if="isAdmin" class="sk-d__edit">
          <UiField :label="$t('skMinQty')" :hint="$t('skMinQtyHint')">
            <el-input-number v-model="edit.min_qty" :min="0" controls-position="right" size="small" />
          </UiField>
          <UiField :label="$t('skSapCode')">
            <el-input v-model="edit.sap_code" size="small" class="sk-d__sap" />
          </UiField>
          <UiField :label="$t('skSapName')" grow>
            <el-input v-model="edit.sap_name" size="small" :placeholder="item.name" />
          </UiField>
          <UiField :label="$t('skColUnit')">
            <el-select v-model="edit.unit" filterable allow-create default-first-option size="small" class="sk-d__unit">
            <el-option v-for="u in UNIT_CODES" :key="u" :value="u" :label="unitLabel(u)" />
          </el-select>
          </UiField>
          <el-button size="small" type="primary" plain :loading="saving" @click="save">{{ $t('skSave') }}</el-button>
        </div>
        <div v-else-if="item.min_qty != null" class="sk-d__meta">
          <span>{{ $t('skMinQty') }}: <b>{{ fmtQty(item.min_qty) }}</b></span>
        </div>

        <div v-if="contracts.length" class="sk-d__section">
          <div class="sk-d__label">{{ $t('skTabContracts') }}</div>
          <div v-for="c in contracts" :key="c.id" class="sk-d__ctr">
            № {{ c.dogovor_number || '—' }} · {{ $t('skColIn') }} {{ fmtQty(c.qty_in) }} / {{ $t('skColOut') }}
            {{ fmtQty(c.qty_out) }}
          </div>
        </div>

        <div class="sk-d__section">
          <div class="sk-d__label">{{ $t('skMovesTitle') }} ({{ moves.length }})</div>
          <div v-for="m in moves" :key="m.id" class="sk-d__move" :class="`t-${m.type}`">
            <span class="d">{{ shortDate(m.move_date) }}</span>
            <span class="tp">{{ moveTypeLabel(m.type) }}</span>
            <b class="q">{{ signedQty(m.type, m.qty) }}</b>
            <span class="info">
              {{ [m.dogovor_number && `№${m.dogovor_number}`, m.counterparty, moveComment(m.comment)].filter(Boolean).join(' · ') }}
            </span>
          </div>
        </div>
      </template>
    </div>
  </el-drawer>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Close, Plus } from '@element-plus/icons-vue'
import UiField from '@/components/ui/UiField.vue'
import { useSkladStore } from '@/stores/sklad'
import {
  UNIT_CODES,
  apiError,
  fmtQty,
  itemName,
  moveComment,
  moveTypeLabel,
  shortDate,
  sheetNameIfDiff,
  signedQty,
  unitLabel,
} from '@/utils/skladFormat'

const props = defineProps({
  modelValue: { type: Number, default: null },
  reportRow: { type: Object, default: null },
  isAdmin: { type: Boolean, default: false },
})
defineEmits(['update:modelValue', 'move'])
const { t } = useI18n()
const store = useSkladStore()

const loading = ref(false)
const saving = ref(false)
const item = ref(null)
const balance = ref(0)
const moves = ref([])
const contracts = ref([])
const edit = reactive({ min_qty: null, sap_code: '', sap_name: '', unit: '' })
const drawerSize = computed(() => (window.innerWidth < 640 ? '100%' : '520px'))

async function load(id) {
  if (id == null) return
  loading.value = true
  try {
    const res = await store.getItem(id)
    item.value = res.item
    balance.value = res.balance
    moves.value = res.movements || []
    contracts.value = res.contracts || []
    edit.min_qty = res.item.min_qty
    edit.sap_code = res.item.sap_code || ''
    edit.sap_name = res.item.sap_name || ''
    edit.unit = res.item.unit
  } catch (e) {
    ElMessage.error(apiError(e))
  } finally {
    loading.value = false
  }
}
watch(() => props.modelValue, load, { immediate: true })
// Kirim/chiqim kiritilgach hisobot yangilanadi — kartani ham yangilaymiz
watch(
  () => props.reportRow?.closing,
  () => props.modelValue != null && load(props.modelValue),
)

async function save() {
  saving.value = true
  try {
    await store.updateItem(item.value.id, {
      min_qty: edit.min_qty ?? null,
      sap_code: edit.sap_code.trim(),
      sap_name: edit.sap_name.trim(),
      unit: String(edit.unit || '').trim() || 'dona',
    })
    ElMessage.success(t('skSaved'))
    load(item.value.id)
  } catch (e) {
    ElMessage.error(apiError(e))
  } finally {
    saving.value = false
  }
}

// Kun oxiridagi qoldiq (eski → yangi) — harakatlardan qayta hisoblanadi
const SIGN = { in: 1, out: -1, reserve: -1, release: 1, adjust: 1 }
const history = computed(() => {
  const asc = [...moves.value].reverse()
  const byDay = new Map()
  let bal = 0
  for (const m of asc) {
    bal = m.type === 'snapshot' ? m.qty : bal + SIGN[m.type] * m.qty
    byDay.set(m.move_date, bal)
  }
  const points = [...byDay.entries()].map(([date, b]) => ({ date, bal: b })).slice(-40)
  return { points, line: points.map((p, i) => `${hx(i, points.length)},${hy(p.bal, points)}`).join(' ') }
})
const CW = 460
const CH = 90
const hx = (i, n = history.value.points.length) => (n > 1 ? 6 + (i / (n - 1)) * (CW - 12) : CW / 2)
function hy(v, pts = history.value.points) {
  const vals = pts.map((p) => p.bal).concat(0)
  const max = Math.max(...vals)
  const min = Math.min(...vals)
  const span = max - min || 1
  return CH - 8 - ((v - min) / span) * (CH - 16)
}
</script>

<style scoped lang="scss">
.sk-d {
  min-height: 100%;
  color: var(--ui-ink-2);
}
.sk-d__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  h3 {
    margin: 4px 0 0;
    font-size: 18px;
    color: var(--ui-ink);
    line-height: 1.3;
  }
}
.sk-d__sheet {
  margin-top: 4px;
  font-size: 12px;
  color: var(--ui-muted);
}
.sk-d__code {
  font-size: 12px;
  color: var(--ui-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.sk-d__label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ui-muted);
  margin-bottom: 6px;
}
.sk-d__balance {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  margin: 18px 0 14px;
  padding: 14px 16px;
  border: 1px solid var(--ui-line);
  border-radius: var(--ui-radius);
  background: var(--ui-surface-2);
}
.sk-d__big {
  font-size: 30px;
  font-weight: 800;
  color: var(--ui-ink);
  font-variant-numeric: tabular-nums;
  small {
    font-size: 14px;
    font-weight: 500;
    color: var(--ui-muted);
  }
  &.neg {
    color: var(--ui-bad);
  }
}
.sk-d__btns {
  display: flex;
  gap: 6px;
}
.sk-d__flow {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  margin-bottom: 16px;
  div {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px;
    border-radius: 8px;
    background: var(--ui-surface-2);
    font-size: 11px;
    color: var(--ui-muted);
    b {
      font-size: 15px;
      color: var(--ui-ink);
      font-variant-numeric: tabular-nums;
    }
  }
  .in b {
    color: var(--ui-good);
  }
  .out b {
    color: var(--ui-orange-ink);
  }
  .res b {
    color: var(--ui-violet-ink);
  }
  .end {
    background: var(--ui-link-soft);
  }
}
.sk-d__chart {
  margin-bottom: 16px;
  svg {
    width: 100%;
    height: auto;
    display: block;
  }
  .base {
    stroke: var(--ui-line-strong);
    stroke-dasharray: 3 3;
  }
  .line {
    fill: none;
    stroke: #2a78d6;
    stroke-width: 2;
  }
  .dot {
    fill: #2a78d6;
    stroke: var(--ui-surface);
    stroke-width: 2;
  }
}
:global(html.dark) .sk-d__chart .line {
  stroke: #3987e5;
}
:global(html.dark) .sk-d__chart .dot {
  fill: #3987e5;
}
.sk-d__axis {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--ui-muted);
}
.sk-d__edit {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
  padding: 12px;
  margin-bottom: 16px;
  border: 1px dashed var(--ui-line-strong);
  border-radius: var(--ui-radius);
}
.sk-d__sap {
  width: 130px;
}
.sk-d__unit {
  width: 110px;
}
.sk-d__meta {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  font-size: 13px;
}
.sk-d__section {
  margin-bottom: 16px;
}
.sk-d__ctr {
  font-size: 13px;
  padding: 4px 0;
}
.sk-d__move {
  display: grid;
  grid-template-columns: 44px 110px 64px 1fr;
  gap: 8px;
  align-items: baseline;
  padding: 6px 0;
  border-top: 1px solid var(--ui-line-soft);
  font-size: 13px;
  .d {
    color: var(--ui-muted);
    font-variant-numeric: tabular-nums;
  }
  .q {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .info {
    font-size: 12px;
    color: var(--ui-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  &.t-in .q,
  &.t-release .q {
    color: var(--ui-good);
  }
  &.t-out .q {
    color: var(--ui-orange-ink);
  }
  &.t-reserve .q {
    color: var(--ui-violet-ink);
  }
  &.t-snapshot {
    .tp,
    .q {
      color: var(--ui-muted);
    }
  }
}
@media (max-width: 640px) {
  .sk-d__flow {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
