<template>
  <el-drawer
    v-model="open"
    :size="drawerSize"
    :title="request?.title"
    append-to-body
    destroy-on-close
    class="amo-drill"
  >
    <div class="dr-toolbar">
      <span class="dr-sub">
        <template v-if="request?.subtitle">{{ request.subtitle }} · </template>
        <template v-if="mode === 'phone'">
          {{ $t('amoDrillNumbers', { n: fmtNum(total) }) }} ·
          {{ $t('amoDrillCalls', { n: fmtNum(totalCalls) }) }}
        </template>
        <template v-else
          >{{ $t('amoDrillTotal') }}: <b>{{ fmtNum(total) }}</b></template
        >
      </span>
      <div class="dr-actions">
        <el-switch
          v-if="isCalls"
          v-model="groupByPhone"
          :active-text="$t('amoDrillGroupByPhone')"
          @change="reload"
        />
        <el-switch
          v-if="isMissed"
          v-model="onlyNotCalledBack"
          :active-text="$t('amoDrillOnlyNotCalledBack')"
          @change="reload"
        />
        <el-button
          size="small"
          :icon="Download"
          :loading="exporting"
          :disabled="!total"
          @click="exportExcel"
        >
          Excel
        </el-button>
      </div>
    </div>

    <!-- Qo'ng'iroqlar -->
    <el-table
      v-if="mode === 'call'"
      v-loading="loading"
      :data="items"
      size="small"
      stripe
      :empty-text="$t('amoNoData')"
    >
      <el-table-column :label="$t('amoColDate')" min-width="130">
        <template #default="{ row }">{{ formatDateTime(row.amo_created_at) }}</template>
      </el-table-column>
      <el-table-column :label="$t('amoColPhone')" min-width="160">
        <template #default="{ row }"><PhoneCell :phone="row.phone" /></template>
      </el-table-column>
      <el-table-column :label="$t('amoColDirection')" min-width="100">
        <template #default="{ row }">
          <el-tag size="small" :type="row.direction === 'in' ? 'primary' : 'info'" effect="plain">
            {{ $t(row.direction === 'in' ? 'amoDirIn' : 'amoDirOut') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('amoColResult')" min-width="190">
        <template #default="{ row }">
          <span :class="{ 'is-bad': row.call_status !== TALKED }">
            {{ $t(callStatusKey(row.direction, row.call_status)) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('amoColDuration')" min-width="90" align="right">
        <template #default="{ row }">{{ fmtDuration(row.duration, t) }}</template>
      </el-table-column>
      <el-table-column :label="$t('amoManager')" min-width="140">
        <template #default="{ row }">{{ userName(row.responsible_user_id) }}</template>
      </el-table-column>
      <el-table-column v-if="isMissed" :label="$t('amoColCallback')" min-width="190">
        <template #default="{ row }"><CallbackCell :row="row" /></template>
      </el-table-column>
      <el-table-column width="56" align="center">
        <template #default="{ row }"><AmoLink :row="row" /></template>
      </el-table-column>
    </el-table>

    <!-- Raqamlar bo'yicha guruhlangan -->
    <el-table
      v-else-if="mode === 'phone'"
      v-loading="loading"
      :data="items"
      size="small"
      stripe
      :empty-text="$t('amoNoData')"
    >
      <el-table-column :label="$t('amoColPhone')" min-width="170">
        <template #default="{ row }"><PhoneCell :phone="row.phone" /></template>
      </el-table-column>
      <el-table-column :label="$t('amoColCalls')" min-width="90" align="right" prop="calls" />
      <el-table-column :label="$t('amoColLastCall')" min-width="140">
        <template #default="{ row }">
          <el-tooltip
            :content="`${$t('amoColFirstCall')}: ${formatDateTime(row.first_at)}`"
            placement="top"
          >
            <span>{{ formatDateTime(row.last_at) }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column :label="$t('amoManager')" min-width="140">
        <template #default="{ row }">{{ userName(row.responsible_user_id) }}</template>
      </el-table-column>
      <el-table-column v-if="isMissed" :label="$t('amoColCallback')" min-width="190">
        <template #default="{ row }"><CallbackCell :row="row" /></template>
      </el-table-column>
      <el-table-column width="56" align="center">
        <template #default="{ row }"><AmoLink :row="row" /></template>
      </el-table-column>
    </el-table>

    <!-- Lidlar -->
    <el-table
      v-else
      v-loading="loading"
      :data="items"
      size="small"
      stripe
      :empty-text="$t('amoNoData')"
    >
      <el-table-column :label="$t('amoColLead')" min-width="200">
        <template #default="{ row }">
          <a
            v-if="amoUrl"
            :href="`${amoUrl}/leads/detail/${row.id}`"
            target="_blank"
            rel="noopener"
            class="dr-link"
          >
            {{ row.name || `#${row.id}` }}
          </a>
          <span v-else>{{ row.name || `#${row.id}` }}</span>
          <div v-if="row.tags?.length" class="dr-tags">
            <el-tag v-for="tag in row.tags" :key="tag" size="small" effect="plain">{{
              tag
            }}</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="$t('amoSum')" min-width="120" align="right">
        <template #default="{ row }">{{ fmtNum(Math.round(row.price || 0)) }}</template>
      </el-table-column>
      <el-table-column :label="$t('amoStage')" min-width="170">
        <template #default="{ row }">
          <span class="dr-stage">
            <i class="dr-dot" :style="{ background: stageOf(row)?.color || '#d5d8db' }"></i>
            {{ stageOf(row)?.name || row.status_id }}
          </span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('amoColLossReason')" min-width="150">
        <template #default="{ row }">{{
          row.status_id === 143 ? reasonName(row.loss_reason_id) : ''
        }}</template>
      </el-table-column>
      <el-table-column :label="$t('amoManager')" min-width="140">
        <template #default="{ row }">{{ userName(row.responsible_user_id) }}</template>
      </el-table-column>
      <el-table-column :label="$t('amoColCreated')" min-width="100">
        <template #default="{ row }">{{ formatDate(row.amo_created_at) }}</template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-if="total > pageSize"
      class="dr-pager"
      layout="prev, pager, next"
      :total="total"
      :page-size="pageSize"
      :current-page="page"
      small
      @current-change="goPage"
    />
  </el-drawer>
</template>

<script setup>
import { computed, defineComponent, h, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElButton, ElIcon, ElMessage, ElTooltip } from 'element-plus'
import {
  CircleCheckFilled,
  CopyDocument,
  Download,
  Link,
  WarningFilled,
} from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import { useAmocrmStore } from '@/stores/amocrm'
import {
  TALKED,
  callStatusKey,
  fmtDuration,
  fmtNum,
  formatDate,
  formatDateTime,
  telHref,
} from './amoFormat'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // { type: 'calls' | 'leads', title, subtitle, params }
  request: { type: Object, default: null },
  // getStats javobi: users, amo_url, leads.pipelines, leads.loss_reasons
  stats: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const amoStore = useAmocrmStore()

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})
const drawerSize = computed(() => (window.innerWidth < 768 ? '100%' : '960px'))

const pageSize = 50
const page = ref(1)
const total = ref(0)
const totalCalls = ref(0)
const items = ref([])
const mode = ref('call')
const loading = ref(false)
const exporting = ref(false)
const groupByPhone = ref(false)
const onlyNotCalledBack = ref(false)

const isCalls = computed(() => props.request?.type === 'calls')
const isMissed = computed(() => isCalls.value && props.request?.params?.kind === 'in_missed')
const amoUrl = computed(() => props.stats?.amo_url || '')

const users = computed(() => new Map((props.stats?.users || []).map((u) => [u.id, u.name])))
const userName = (id) => (id ? users.value.get(Number(id)) || `#${id}` : t('amoUnknownManager'))

const stages = computed(() => {
  const m = new Map()
  for (const p of props.stats?.leads?.pipelines || []) {
    for (const s of p.statuses) m.set(`${p.id}:${s.id}`, s)
  }
  return m
})
const stageOf = (row) => stages.value.get(`${row.pipeline_id}:${row.status_id}`)
const reasons = computed(
  () => new Map((props.stats?.leads?.loss_reasons || []).map((r) => [r.id, r.name])),
)
const reasonName = (id) => (id ? reasons.value.get(Number(id)) || `#${id}` : t('amoLossReasonNone'))

function queryParams(extra = {}) {
  const params = { ...(props.request?.params || {}), ...extra }
  if (isCalls.value) {
    if (groupByPhone.value) params.group = 'phone'
    else delete params.group
    if (isMissed.value && onlyNotCalledBack.value) params.not_called_back = 'true'
    else delete params.not_called_back
  }
  return params
}

async function fetchPage(p, limit = pageSize) {
  const params = queryParams({ page: p, limit })
  return isCalls.value ? amoStore.listCalls(params) : amoStore.listLeads(params)
}

async function load() {
  if (!props.request) return
  loading.value = true
  try {
    const res = await fetchPage(page.value)
    items.value = res.items || []
    total.value = res.total || 0
    totalCalls.value = res.total_calls || 0
    mode.value = res.mode
  } catch (err) {
    items.value = []
    total.value = 0
    ElMessage.error(err?.response?.data?.message || err?.message)
  } finally {
    loading.value = false
  }
}

function reload() {
  page.value = 1
  load()
}

function goPage(p) {
  page.value = p
  load()
}

// Har safar yangi ro'yxat ochilganda: o'tkazib yuborilganlar — raqam bo'yicha
watch(
  () => [props.modelValue, props.request],
  ([isOpen]) => {
    if (!isOpen) return
    groupByPhone.value = Boolean(props.request?.groupByPhone)
    onlyNotCalledBack.value = Boolean(props.request?.onlyNotCalledBack)
    items.value = []
    total.value = 0
    reload()
  },
)

// ─── Excel ────────────────────────────────────────────────
function callbackText(row) {
  if (!row.callback_at) return t('amoCallbackNone')
  const who =
    row.callback_direction === 'out' ? t('amoCallbackWeCalled') : t('amoCallbackTheyCalled')
  return `${who} ${formatDateTime(row.callback_at)}`
}

function toSheetRow(row) {
  if (mode.value === 'lead') {
    return {
      [t('amoColLead')]: row.name || `#${row.id}`,
      [t('amoSum')]: Math.round(row.price || 0),
      [t('amoStage')]: stageOf(row)?.name || row.status_id,
      [t('amoColLossReason')]: row.status_id === 143 ? reasonName(row.loss_reason_id) : '',
      [t('amoManager')]: userName(row.responsible_user_id),
      [t('amoColCreated')]: formatDate(row.amo_created_at),
      amoCRM: amoUrl.value ? `${amoUrl.value}/leads/detail/${row.id}` : '',
    }
  }
  const base =
    mode.value === 'phone'
      ? {
          [t('amoColPhone')]: row.phone || '',
          [t('amoColCalls')]: row.calls,
          [t('amoColLastCall')]: formatDateTime(row.last_at),
          [t('amoColFirstCall')]: formatDateTime(row.first_at),
        }
      : {
          [t('amoColDate')]: formatDateTime(row.amo_created_at),
          [t('amoColPhone')]: row.phone || '',
          [t('amoColDirection')]: t(row.direction === 'in' ? 'amoDirIn' : 'amoDirOut'),
          [t('amoColResult')]: t(callStatusKey(row.direction, row.call_status)),
          [t('amoColDuration')]: fmtDuration(row.duration, t),
        }
  return {
    ...base,
    [t('amoManager')]: userName(row.responsible_user_id),
    ...(isMissed.value && { [t('amoColCallback')]: callbackText(row) }),
    amoCRM:
      amoUrl.value && row.entity_id
        ? `${amoUrl.value}/${row.entity_type}/detail/${row.entity_id}`
        : '',
  }
}

async function exportExcel() {
  exporting.value = true
  try {
    const all = []
    const limit = 200
    for (let p = 1; all.length < total.value; p++) {
      const res = await fetchPage(p, limit)
      all.push(...(res.items || []))
      if (!res.items?.length) break
    }
    const ws = XLSX.utils.json_to_sheet(all.map(toSheetRow))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'amoCRM')
    const name = String(props.request?.title || 'amocrm').replace(/[\\/:*?"<>|]/g, '')
    XLSX.writeFile(wb, `${name}.xlsx`)
  } catch (err) {
    ElMessage.error(err?.response?.data?.message || err?.message)
  } finally {
    exporting.value = false
  }
}

// ─── Kichik hujayra komponentlari ─────────────────────────
const PhoneCell = defineComponent({
  props: { phone: { type: String, default: '' } },
  setup(p) {
    const copy = async () => {
      try {
        await navigator.clipboard.writeText(p.phone)
        ElMessage.success(t('amoCopied'))
      } catch {
        /* clipboard ruxsati yo'q */
      }
    }
    return () =>
      p.phone
        ? h('span', { class: 'dr-phone' }, [
            h('a', { href: telHref(p.phone), class: 'dr-link' }, p.phone),
            h(ElTooltip, { content: t('amoCopy'), placement: 'top' }, () =>
              h(ElButton, {
                link: true,
                size: 'small',
                icon: CopyDocument,
                onClick: copy,
                'aria-label': t('amoCopy'),
              }),
            ),
          ])
        : h('span', { class: 'dr-muted' }, '—')
  },
})

const CallbackCell = defineComponent({
  props: { row: { type: Object, required: true } },
  setup(p) {
    return () => {
      const r = p.row
      if (!r.callback_at) {
        return h('span', { class: 'dr-cb dr-cb--none' }, [
          h(ElIcon, null, () => h(WarningFilled)),
          t('amoCallbackNone'),
        ])
      }
      const who =
        r.callback_direction === 'out' ? t('amoCallbackWeCalled') : t('amoCallbackTheyCalled')
      return h('span', { class: 'dr-cb dr-cb--ok' }, [
        h(ElIcon, null, () => h(CircleCheckFilled)),
        `${who} · ${formatDateTime(r.callback_at)}`,
      ])
    }
  },
})

const AmoLink = defineComponent({
  props: { row: { type: Object, required: true } },
  setup(p) {
    return () =>
      amoUrl.value && p.row.entity_id
        ? h(ElTooltip, { content: t('amoOpenInAmo'), placement: 'left' }, () =>
            h(
              'a',
              {
                href: `${amoUrl.value}/${p.row.entity_type}/detail/${p.row.entity_id}`,
                target: '_blank',
                rel: 'noopener',
                class: 'dr-amo',
                'aria-label': t('amoOpenInAmo'),
              },
              [h(ElIcon, null, () => h(Link))],
            ),
          )
        : null
  },
})
</script>

<style lang="scss" scoped>
.dr-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.dr-sub {
  font-size: 13px;
  color: #4b5563;
}
.dr-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.dr-pager {
  margin-top: 14px;
  justify-content: center;
}
:deep(.dr-link) {
  color: #2a78d6;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
}
:deep(.dr-phone) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-variant-numeric: tabular-nums;
}
:deep(.dr-muted) {
  color: #9ca3af;
}
:deep(.dr-cb) {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
}
:deep(.dr-cb--ok) {
  color: #15803d;
}
:deep(.dr-cb--none) {
  color: #b91c1c;
  font-weight: 600;
}
:deep(.dr-amo) {
  color: #6b7280;
  display: inline-flex;
  &:hover {
    color: #2a78d6;
  }
}
.is-bad {
  color: #b45309;
}
.dr-stage {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.dr-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
}
.dr-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 3px;
}
</style>
