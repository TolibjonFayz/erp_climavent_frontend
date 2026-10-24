<template>
  <el-dialog
    v-model="open"
    :title="$t('amoReportTitle')"
    width="480px"
    append-to-body
    class="yr-dialog"
  >
    <el-form label-position="top" class="yr-form">
      <el-form-item :label="$t('amoReportPeriod')">
        <el-radio-group v-model="period" class="yr-periods">
          <el-radio-button v-for="p in periods" :key="p.key" :value="p.key">
            {{ p.label }}
          </el-radio-button>
        </el-radio-group>
        <div class="yr-range">{{ formatDate(range[0]) }} – {{ formatDate(range[1]) }}</div>
      </el-form-item>
      <el-form-item :label="$t('amoReportScope')">
        <el-radio-group v-model="scope">
          <el-radio-button value="clients">{{ $t('amoScopeClients') }}</el-radio-button>
          <el-radio-button value="all">{{ $t('amoScopeAll') }}</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item :label="$t('amoFilterManager')">
        <el-select v-model="userId" clearable filterable :placeholder="$t('amoAllManagers')">
          <el-option v-for="u in users" :key="u.id" :label="u.name" :value="u.id" />
        </el-select>
      </el-form-item>
    </el-form>

    <p class="yr-note">{{ $t('amoReportContents') }}</p>
    <p class="yr-note yr-note--muted">{{ $t('amoReportHistoryNote') }}</p>

    <template #footer>
      <el-button @click="open = false">{{ $t('cancel') }}</el-button>
      <el-button type="primary" :icon="Download" :loading="busy" @click="download">
        {{ $t('amoReportDownload') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { errorText } from '@/utils/errorText'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import { useAmocrmStore } from '@/stores/amocrm'
import { MONTHS, callStatusKey, countryName, formatDate, formatDateTime, ymd } from './amoFormat'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  users: { type: Array, default: () => [] },
  // Ochilganda statistikadagi tanlov olinadi
  initialScope: { type: String, default: 'clients' },
  initialUserId: { type: Number, default: null },
  amoUrl: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const { t, locale } = useI18n()
const amoStore = useAmocrmStore()

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const thisYear = new Date().getFullYear()
const periods = computed(() => [
  { key: 'last12', label: t('amoReportLast12') },
  ...[thisYear, thisYear - 1, thisYear - 2].map((y) => ({
    key: String(y),
    label: t('amoReportYear', { year: y }),
  })),
])

const period = ref('last12')
const scope = ref('clients')
const userId = ref(null)
const busy = ref(false)

watch(open, (v) => {
  if (!v) return
  scope.value = props.initialScope === 'all' ? 'all' : 'clients'
  userId.value = props.initialUserId || null
})

const range = computed(() => {
  const today = new Date()
  if (period.value === 'last12') {
    const from = new Date(today)
    from.setFullYear(today.getFullYear() - 1)
    from.setDate(from.getDate() + 1)
    return [ymd(from), ymd(today)]
  }
  const y = Number(period.value)
  return [`${y}-01-01`, y === thisYear ? ymd(today) : `${y}-12-31`]
})

// ─── Excel ────────────────────────────────────────────────
const monthNames = computed(() => MONTHS[locale.value] || MONTHS.uz)
const monthLabel = (key) => {
  const [y, m] = key.split('-').map(Number)
  return `${monthNames.value[m - 1]} ${y}`
}
const minutes = (sec) => Math.round((Number(sec) || 0) / 6) / 10

// Davrdagi har bir oy (qo'ng'iroq bo'lmagan oylar ham qatorda turadi)
function monthKeys([from, to]) {
  const keys = []
  const d = new Date(`${from.slice(0, 7)}-01T00:00:00`)
  const end = to.slice(0, 7)
  while (ymd(d).slice(0, 7) <= end) {
    keys.push(ymd(d).slice(0, 7))
    d.setMonth(d.getMonth() + 1)
  }
  return keys
}

function sheet(rows, widths) {
  const ws = Array.isArray(rows[0]) ? XLSX.utils.aoa_to_sheet(rows) : XLSX.utils.json_to_sheet(rows)
  if (widths) ws['!cols'] = widths.map((wch) => ({ wch }))
  return ws
}

function buildWorkbook(r) {
  const users = new Map((r.users || []).map((u) => [u.id, u.name]))
  const userName = (id) => (id ? users.get(Number(id)) || `#${id}` : t('amoUnknownManager'))
  const s = r.summary
  const wb = XLSX.utils.book_new()

  // 1. Umumiy
  const summaryRows = [
    [t('amoReportRowPeriod'), `${formatDate(r.period.from)} – ${formatDate(r.period.to)}`],
    [t('amoReportRowScope'), t(r.scope === 'all' ? 'amoScopeAll' : 'amoScopeClients')],
    [t('amoReportRowManager'), userId.value ? userName(userId.value) : t('amoAllManagers')],
    [t('amoReportRowCreated'), formatDateTime(new Date())],
    [],
    [t('amoCallsTotal'), s.total],
    [t('amoTalked'), s.talked],
    [t('amoColDurationMin'), minutes(s.duration)],
    [],
    [t('amoInTotal'), s.incoming.total],
    [t('amoInAnswered'), s.incoming.answered],
    [t('amoInMissed'), s.incoming.missed],
    [t('amoNotCalledBack'), s.incoming.not_called_back],
    [],
    [t('amoOutTotal'), s.outgoing.total],
    [t('amoOutAnswered'), s.outgoing.answered],
    [t('amoOutNoAnswer'), s.outgoing.no_answer],
    [],
    [t('amoForeignTotal'), s.foreign.total],
    [t('amoForeignNumbers'), s.foreign.numbers],
    [t('amoForeignCountries'), s.foreign.by_country.length],
  ]
  XLSX.utils.book_append_sheet(wb, sheet(summaryRows, [34, 26]), t('amoSheetSummary'))

  // 2. Oylar bo'yicha
  const callMonths = new Map(r.months.map((m) => [m.month, m]))
  const leadMonths = new Map(r.lead_months.map((m) => [m.month, m]))
  const monthRows = monthKeys([r.period.from, r.period.to]).map((key) => {
    const c = callMonths.get(key) || {}
    const l = leadMonths.get(key) || {}
    return {
      [t('amoColMonth')]: monthLabel(key),
      [t('amoCallsTotal')]: c.total || 0,
      [t('amoTalked')]: c.talked || 0,
      [t('amoInTotal')]: c.in_total || 0,
      [t('amoInAnswered')]: c.in_answered || 0,
      [t('amoInMissed')]: c.in_missed || 0,
      [t('amoOutTotal')]: c.out_total || 0,
      [t('amoOutAnswered')]: c.out_answered || 0,
      [t('amoOutNoAnswer')]: c.out_no_answer || 0,
      [t('amoForeignTotal')]: c.foreign_calls || 0,
      [t('amoColNumbers')]: c.numbers || 0,
      [t('amoColDurationMin')]: minutes(c.duration),
      [t('amoColLeadsNew')]: l.created || 0,
      [t('amoColLeadsNewSum')]: Math.round(l.created_sum || 0),
      [t('amoLeadsWon')]: l.won || 0,
      [t('amoColWonSum')]: Math.round(l.won_sum || 0),
      [t('amoLeadsLost')]: l.lost || 0,
    }
  })
  XLSX.utils.book_append_sheet(
    wb,
    sheet(monthRows, [12, 10, 12, 12, 16, 16, 12, 16, 16, 12, 10, 14, 12, 18, 12, 18, 12]),
    t('amoSheetMonths'),
  )

  // 3. Menejerlar
  const managerRows = s.by_user.map((u) => ({
    [t('amoManager')]: userName(u.user_id),
    [t('amoCallsTotal')]: u.total,
    [t('amoTalked')]: u.talked,
    [t('amoInTotal')]: u.in_total,
    [t('amoInAnswered')]: u.in_answered,
    [t('amoInMissed')]: u.in_missed,
    [t('amoOutTotal')]: u.out_total,
    [t('amoOutAnswered')]: u.out_answered,
    [t('amoOutNoAnswer')]: u.out_no_answer,
    [t('amoColDurationMin')]: minutes(u.duration),
  }))
  if (managerRows.length) {
    XLSX.utils.book_append_sheet(
      wb,
      sheet(managerRows, [24, 10, 12, 12, 16, 16, 12, 16, 16, 14]),
      t('amoSheetManagers'),
    )
  }

  // 4. Xorijiy davlatlar
  const foreignRows = s.foreign.by_country.map((c) => ({
    [t('amoColCountry')]: countryName(c.country, locale.value, t),
    [t('amoCallsTotal')]: c.total,
    [t('amoColNumbers')]: c.numbers,
    [t('amoTalked')]: c.talked,
    [t('amoInAnswered')]: c.in_answered,
    [t('amoInMissed')]: c.in_missed,
    [t('amoOutAnswered')]: c.out_answered,
    [t('amoOutNoAnswer')]: c.out_no_answer,
    [t('amoColDurationMin')]: minutes(c.duration),
  }))
  if (foreignRows.length) {
    XLSX.utils.book_append_sheet(
      wb,
      sheet(foreignRows, [22, 10, 10, 12, 16, 16, 16, 16, 14]),
      t('amoSheetForeign'),
    )
  }

  // 5. Barcha kiruvchi / chiquvchi qo'ng'iroqlar
  const callRows = r.calls.map((c) => ({
    [t('amoColDate')]: formatDateTime(c.amo_created_at),
    [t('amoColDirection')]: t(c.direction === 'in' ? 'amoDirIn' : 'amoDirOut'),
    [t('amoColResult')]: t(callStatusKey(c.direction, c.call_status)),
    [t('amoColPhone')]: c.phone || '',
    [t('amoColCountry')]: countryName(c.country, locale.value, t),
    [t('amoColContact')]: c.contact_name || '',
    [t('amoManager')]: userName(c.responsible_user_id),
    [t('amoColDurationSec')]: c.duration || 0,
    [t('amoColPlatform')]: c.source || '',
    ...(r.scope !== 'clients' && {
      [t('amoColExclReason')]: c.excl_reason ? t(`amoExcl_${c.excl_reason}`) : '',
    }),
    [t('amoColRecord')]: c.record_hash ? t(`amoRecStatus_${c.record_status || 'pending'}`) : '',
    amoCRM: r.amo_url && c.entity_id ? `${r.amo_url}/${c.entity_type}/detail/${c.entity_id}` : '',
  }))
  XLSX.utils.book_append_sheet(
    wb,
    sheet(
      callRows.length ? callRows : [{ [t('amoColDate')]: '' }],
      [16, 11, 30, 16, 16, 24, 20, 10, 12, 16, 14, 46],
    ),
    t('amoSheetCalls'),
  )
  return wb
}

async function download() {
  busy.value = true
  try {
    const [from, to] = range.value
    const res = await amoStore.getReport({
      from,
      to,
      scope: scope.value,
      responsible_user_id: userId.value || undefined,
    })
    const wb = buildWorkbook(res)
    const name = `${t('amoReportFile')} ${from} — ${to}`.replace(/[\\/:*?"<>|]/g, '')
    XLSX.writeFile(wb, `${name}.xlsx`)
    ElMessage.success(t('amoReportDone'))
    open.value = false
  } catch (err) {
    ElMessage.error(errorText(err))
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.yr-form :deep(.el-select) {
  width: 100%;
}
.yr-periods {
  flex-wrap: wrap;
}
.yr-range {
  width: 100%;
  margin-top: 6px;
  font-size: 12px;
  color: var(--ui-muted);
}
.yr-note {
  margin: 0 0 8px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--ui-ink-2);
}
.yr-note--muted {
  font-size: 12px;
  color: var(--ui-muted);
}
</style>
