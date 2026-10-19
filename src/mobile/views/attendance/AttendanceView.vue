<script setup>
import { computed, onActivated, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { showConfirmDialog, showFailToast, showSuccessToast } from 'vant'
import { useAttendanceStore } from '@/stores/attendance'
import { useUsersStore } from '@/stores/user'
import { useComeAndGoesStore } from '@/stores/comeandgoes'
import { fmtNum } from '@/utils/format'
import {
  cameraHours,
  confirmRecord,
  flattenTrips,
  groupTripsByDate,
  hiredFrom,
  isOffStatus,
  suggestStatus,
} from '@/components/attendance/suggest'
import MPage from '../../components/MPage.vue'
import MStats from '../../components/MStats.vue'
import MSheet from '../../components/MSheet.vue'
import MSelectSheet from '../../components/MSelectSheet.vue'
import { useSession } from '../../session'
import { tapFeedback } from '../../native'
import { avatarColor, errorText, initials, monthNames } from '../../utils'
import { personName } from '../tasks/taskRules'

const { t, locale } = useI18n()
const attendanceStore = useAttendanceStore()
const usersStore = useUsersStore()
const comeandgoesStore = useComeAndGoesStore()
const { isAdmin } = useSession()
const currentUserId = Number(localStorage.getItem('userid'))

// Saytdagi AttendanceTable bilan bir xil holatlar va ranglar
const STATUS_LIST = [
  { key: 'direct_object', labelKey: 'statusDirectObject', color: '#67c23a' },
  { key: 'office_then_object', labelKey: 'statusOfficeThenObject', color: '#e6a23c' },
  { key: 'office', labelKey: 'statusOffice', color: '#409eff' },
  { key: 'absent', labelKey: 'statusAbsent', color: '#f56c6c' },
  { key: 'dayoff', labelKey: 'statusDayoff', color: '#c0c4cc' },
]
const WORKED = ['direct_object', 'office_then_object', 'office']
const statusOf = (key) => STATUS_LIST.find((s) => s.key === key)
const WEEKDAYS = ['wdMon', 'wdTue', 'wdWed', 'wdThu', 'wdFri', 'wdSat', 'wdSun']

const pad = (n) => String(n).padStart(2, '0')
const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const todayStr = toDateStr(new Date())
const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth() + 1)
const monthKey = computed(() => `${year.value}-${pad(month.value)}`)
const monthLabel = computed(
  () => `${(monthNames[locale.value] || monthNames.uz)[month.value - 1]} ${year.value}`,
)
const isCurrentMonth = computed(
  () => year.value === now.getFullYear() && month.value === now.getMonth() + 1,
)

function changeMonth(delta) {
  let m = month.value + delta
  let y = year.value
  if (m < 1) [m, y] = [12, y - 1]
  if (m > 12) [m, y] = [1, y + 1]
  month.value = m
  year.value = y
  loadData()
}
function goCurrentMonth() {
  year.value = now.getFullYear()
  month.value = now.getMonth() + 1
  loadData()
}

// ─── Xodim tanlash (admin) ───
const selectedUserId = ref(null)
const selectedTerminalNo = ref(null)
const employees = computed(() => usersStore.allUsers || [])
const terminalOnly = computed(() => attendanceStore.cameraEmployees.filter((e) => !e.user_id))
const employeeSheet = ref(false)
const employeeOptions = computed(() => [
  ...employees.value.map((u) => ({
    value: `u${u.id}`,
    label: personName(u) || u.username,
    sub: u.username,
    avatar: initials(personName(u)),
    avatarColor: avatarColor(personName(u)),
  })),
  ...terminalOnly.value.map((e) => ({
    value: `c${e.employee_no}`,
    label: e.name,
    sub: t('m.terminalOnly'),
    avatar: initials(e.name),
    avatarColor: '#94a3b8',
  })),
])
const selectedKey = computed(() =>
  selectedTerminalNo.value ? `c${selectedTerminalNo.value}` : `u${selectedUserId.value}`,
)
const selectedName = computed(() => {
  if (selectedTerminalNo.value) {
    return terminalOnly.value.find((e) => e.employee_no === selectedTerminalNo.value)?.name || ''
  }
  const u = employees.value.find((x) => x.id === selectedUserId.value)
  return u ? personName(u) || u.username : ''
})
function onSelectEmployee(key) {
  if (key.startsWith('c')) {
    selectedUserId.value = null
    selectedTerminalNo.value = key.slice(1)
  } else {
    selectedTerminalNo.value = null
    selectedUserId.value = Number(key.slice(1))
  }
  loadData()
}

const canEdit = computed(() => isAdmin.value && !selectedTerminalNo.value)

const hiredAfterCamera = computed(() => {
  const rows = attendanceStore.cameraEmployees
  const row = selectedTerminalNo.value
    ? rows.find((e) => e.employee_no === selectedTerminalNo.value)
    : rows.find((e) => e.user_id === selectedUserId.value)
  return hiredFrom(row, rows)
})

// ─── Ma'lumot ───
const loading = ref(false)
const fieldTrips = ref([])
const recordsByDate = computed(() => {
  const m = {}
  for (const r of attendanceStore.userRecords) m[r.date] = r
  return m
})
const tripsByDate = computed(() => groupTripsByDate(fieldTrips.value))
const cameraByDate = computed(() => {
  const m = {}
  for (const r of attendanceStore.cameraRecords) m[r.date] = r
  return m
})
const hasCamera = computed(() => attendanceStore.cameraRecords.length > 0)
const officeDaySet = computed(() => new Set(attendanceStore.cameraOfficeDays))

const suggestDay = (dateStr) =>
  suggestStatus(dateStr, {
    today: todayStr,
    trips: tripsByDate.value[dateStr],
    cam: cameraByDate.value[dateStr],
    hasCamera: hasCamera.value,
    officeOpen: officeDaySet.value,
    hiredFrom: hiredAfterCamera.value,
  })

const daysInMonth = computed(() => new Date(year.value, month.value, 0).getDate())
const leadingBlanks = computed(() => (new Date(year.value, month.value - 1, 1).getDay() + 6) % 7)

const calendarDays = computed(() => {
  const days = []
  for (let dn = 1; dn <= daysInMonth.value; dn++) {
    const date = `${year.value}-${pad(month.value)}-${pad(dn)}`
    const record = recordsByDate.value[date]
    const trips = tripsByDate.value[date] || []
    days.push({
      date,
      dayNum: dn,
      future: date > todayStr,
      confirmed: !!record,
      statusKey: record ? record.status : suggestDay(date),
      hours: record ? record.work_hours : null,
      record,
      camera: cameraByDate.value[date] || null,
      trips,
    })
  }
  return days
})

const hm = (v) => (v ? String(v).slice(0, 5) : '')
const arrivalTime = (day) => hm(day.camera?.check_in || day.record?.check_in)
const leaveTime = (day) => hm(day.camera ? day.camera.check_out : day.record?.check_out)
const isSaturday = (date) => new Date(date + 'T00:00:00').getDay() === 6

function cellStyle(day) {
  if (!day.statusKey) return {}
  const c = statusOf(day.statusKey)?.color || '#e5e7eb'
  return day.confirmed
    ? { background: c + '30', borderColor: c }
    : { background: c + '12', borderColor: c + '55', borderStyle: 'dashed' }
}

const stats = computed(() => {
  let worked = 0
  let absent = 0
  let hours = 0
  let trips = 0
  for (const day of calendarDays.value) {
    trips += day.trips.length
    if (day.future || !day.statusKey) continue
    if (WORKED.includes(day.statusKey)) {
      worked++
      hours += day.confirmed ? day.hours || 0 : (cameraHours(day.camera) ?? 8)
    } else if (day.statusKey === 'absent') absent++
  }
  return [
    { key: 'worked', label: t('m.workedDays'), value: fmtNum(worked), tone: 'good' },
    { key: 'absent', label: t('statusAbsent'), value: fmtNum(absent), tone: absent ? 'bad' : '' },
    { key: 'hours', label: t('m.hours'), value: fmtNum(Math.round(hours * 10) / 10) },
    { key: 'trips', label: t('m.siteTrips'), value: fmtNum(trips) },
  ]
})

async function loadFieldTrips(userId) {
  try {
    await comeandgoesStore.getComeAndGoesOfUser(userId)
    fieldTrips.value = flattenTrips(comeandgoesStore.allComeAndGoesofUser)
  } catch {
    fieldTrips.value = []
  }
}

async function loadData() {
  loading.value = true
  try {
    if (selectedTerminalNo.value) {
      attendanceStore.userRecords = []
      fieldTrips.value = []
      await attendanceStore.getCameraEmployeeMonth(selectedTerminalNo.value, monthKey.value)
      return
    }
    if (!selectedUserId.value) return
    await Promise.all([
      attendanceStore.getUserMonth(selectedUserId.value, monthKey.value).catch(() => {}),
      attendanceStore.getCameraUserMonth(selectedUserId.value, monthKey.value),
      loadFieldTrips(selectedUserId.value),
    ])
  } finally {
    loading.value = false
  }
}

const reloadRecords = () =>
  selectedUserId.value
    ? attendanceStore.getUserMonth(selectedUserId.value, monthKey.value).catch(() => {})
    : null

const ready = ref(false)
onMounted(async () => {
  if (isAdmin.value) {
    attendanceStore.getCameraSetup()
    if (!employees.value.length) await usersStore.getAllUsers().catch(() => {})
    selectedUserId.value = employees.value.find((u) => u.id === currentUserId)?.id ?? employees.value[0]?.id ?? null
  } else {
    selectedUserId.value = currentUserId
  }
  await loadData()
  ready.value = true
})
onActivated(() => ready.value && loadData())

// ─── Kun oynasi ───
const dayOpen = ref(false)
const active = ref(null)
const form = reactive({ status: 'office', work_hours: 8, check_in: '', check_out: '', note: '' })
const saving = ref(false)

const activeTitle = computed(() => {
  if (!active.value) return ''
  const d = new Date(active.value.date + 'T00:00:00')
  const m = (monthNames[locale.value] || monthNames.uz)[d.getMonth()]
  const wd = t(WEEKDAYS[(d.getDay() + 6) % 7])
  return locale.value === 'ru' ? `${d.getDate()} ${m.toLowerCase()}, ${wd}` : `${d.getDate()}-${m.toLowerCase()}, ${wd}`
})

function openDay(day) {
  if (day.future) return
  active.value = day
  if (canEdit.value) {
    const cam = day.camera
    if (day.record) {
      form.status = day.record.status
      form.work_hours = Number(day.record.work_hours) || 0
      form.check_in = hm(day.record.check_in || cam?.check_in)
      form.check_out = hm(day.record.check_out || cam?.check_out)
      form.note = day.record.note || ''
    } else {
      form.status = day.statusKey || 'office'
      form.work_hours = isOffStatus(day.statusKey) ? 0 : (cameraHours(cam) ?? 8)
      form.check_in = hm(cam?.check_in)
      form.check_out = hm(cam?.check_out)
      form.note = ''
    }
  }
  dayOpen.value = true
}

function selectStatus(key) {
  form.status = key
  if (isOffStatus(key)) form.work_hours = 0
  else if (!form.work_hours) form.work_hours = 8
}

async function saveDay() {
  saving.value = true
  try {
    await attendanceStore.upsert({
      user_id: selectedUserId.value,
      date: active.value.date,
      status: form.status,
      work_hours: form.work_hours,
      check_in: form.check_in || null,
      check_out: form.check_out || null,
      note: form.note.trim() || null,
      created_by: currentUserId,
    })
    tapFeedback()
    showSuccessToast(t('attendanceSaved'))
    dayOpen.value = false
    await reloadRecords()
  } catch (e) {
    showFailToast(errorText(e, t, locale.value))
  } finally {
    saving.value = false
  }
}

async function resetDay() {
  if (!active.value?.record) return
  saving.value = true
  try {
    await attendanceStore.deleteRecord(active.value.record.id)
    showSuccessToast(t('attendanceDeleted'))
    dayOpen.value = false
    await reloadRecords()
  } catch (e) {
    showFailToast(errorText(e, t, locale.value))
  } finally {
    saving.value = false
  }
}

// ─── Oyni tasdiqlash (admin) ───
const pendingDays = computed(() =>
  calendarDays.value.filter((d) => d.date < todayStr && !d.confirmed && d.statusKey),
)
const confirming = ref(false)
async function confirmMonth() {
  const days = pendingDays.value
  try {
    await showConfirmDialog({
      title: t('attConfirmMonthTitle'),
      message: t('m.confirmMonthBody', { name: selectedName.value, month: monthLabel.value, n: days.length }),
      confirmButtonText: t('save'),
      cancelButtonText: t('cancel'),
    })
  } catch {
    return
  }
  confirming.value = true
  try {
    const { created } = await attendanceStore.bulkCreate(
      days.map((day) =>
        confirmRecord({
          userId: selectedUserId.value,
          date: day.date,
          status: day.statusKey,
          cam: day.camera,
          createdBy: currentUserId,
        }),
      ),
    )
    showSuccessToast(t('attConfirmMonthDone', { n: created }))
  } catch (e) {
    showFailToast(errorText(e, t, locale.value))
  } finally {
    confirming.value = false
    await reloadRecords()
  }
}

const tripTime = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>

<template>
  <MPage :title="$t('m.tabAttendance')" large tabbar :on-refresh="loadData">
    <template #header>
      <button v-if="isAdmin" type="button" class="av-emp" @click="employeeSheet = true">
        <span class="m-avatar is-sm" :style="{ background: avatarColor(selectedName) }">
          {{ initials(selectedName) }}
        </span>
        <span class="av-emp__name">{{ selectedName || $t('m.choose') }}</span>
        <van-icon name="arrow-down" />
      </button>
      <div class="av-month">
        <button type="button" class="m-head__btn" @click="changeMonth(-1)">
          <van-icon name="arrow-left" />
        </button>
        <div class="av-month__label">
          {{ monthLabel }}
          <van-loading v-if="loading" size="14" />
        </div>
        <button type="button" class="m-head__btn" @click="changeMonth(1)">
          <van-icon name="arrow" />
        </button>
        <button v-if="!isCurrentMonth" type="button" class="av-today" @click="goCurrentMonth">
          {{ $t('m.today') }}
        </button>
      </div>
    </template>

    <MStats :items="stats" />

    <div class="m-card av-cal">
      <div class="av-cal__wd">
        <span v-for="(wd, i) in WEEKDAYS" :key="wd" :class="{ 'is-weekend': i >= 5 }">{{ $t(wd) }}</span>
      </div>
      <div class="av-cal__grid">
        <span v-for="i in leadingBlanks" :key="`b${i}`"></span>
        <button
          v-for="day in calendarDays"
          :key="day.date"
          type="button"
          class="av-day"
          :class="{ 'is-today': day.date === todayStr, 'is-future': day.future }"
          :style="cellStyle(day)"
          @click="openDay(day)"
        >
          <span class="av-day__num">{{ day.dayNum }}</span>
          <span v-if="arrivalTime(day)" class="av-day__time">{{ arrivalTime(day) }}</span>
          <span
            v-else-if="!day.future && isSaturday(day.date) && isOffStatus(day.statusKey)"
            class="av-day__time is-muted"
          >
            {{ $t('m.shortDayAbbr') }}
          </span>
          <span v-if="day.trips.length" class="av-day__trips">{{ day.trips.length }}</span>
          <van-icon v-if="day.confirmed" name="success" class="av-day__ok" />
        </button>
      </div>
    </div>

    <div class="av-legend">
      <span v-for="s in STATUS_LIST" :key="s.key">
        <i :style="{ background: s.color }"></i>{{ $t(s.labelKey) }}
      </span>
      <span class="av-legend__note">
        <i class="is-dashed"></i>{{ $t('m.suggested') }}
      </span>
    </div>

    <div v-if="canEdit && pendingDays.length" class="av-confirm">
      <van-button type="primary" block :loading="confirming" icon="passed" @click="confirmMonth">
        {{ $t('m.confirmMonthN', { n: pendingDays.length }) }}
      </van-button>
    </div>

    <!-- Kun tafsiloti / tahriri -->
    <MSheet v-model="dayOpen" :title="activeTitle">
      <template v-if="active">
        <div class="av-sheet">
          <div class="av-sheet__status">
            <span
              v-if="active.statusKey"
              class="av-badge"
              :style="{ background: statusOf(active.statusKey)?.color + '26', color: 'var(--m-ink)' }"
            >
              <i :style="{ background: statusOf(active.statusKey)?.color }"></i>
              {{ $t(statusOf(active.statusKey)?.labelKey || 'noStatusYet') }}
            </span>
            <span class="m-tag" :class="active.confirmed ? 'is-good' : ''">
              {{ active.confirmed ? $t('m.confirmed') : $t('m.suggested') }}
            </span>
          </div>

          <div class="av-times">
            <div>
              <span>{{ $t('camIn') }}</span>
              <b class="m-num">{{ arrivalTime(active) || '—' }}</b>
            </div>
            <div>
              <span>{{ $t('camOut') }}</span>
              <b class="m-num">{{ leaveTime(active) || (active.camera?.is_inside ? $t('m.inside') : '—') }}</b>
            </div>
            <div>
              <span>{{ $t('m.hours') }}</span>
              <b class="m-num">
                {{ active.confirmed ? active.hours ?? '—' : (cameraHours(active.camera) ?? '—') }}
              </b>
            </div>
          </div>

          <template v-if="active.trips.length">
            <p class="av-sub">{{ $t('m.siteTrips') }} · {{ active.trips.length }}</p>
            <div v-for="(trip, i) in active.trips" :key="i" class="av-trip">
              <span class="av-trip__time m-num">
                {{ tripTime(trip.when_gone) }}<template v-if="trip.when_came"> – {{ tripTime(trip.when_came) }}</template>
              </span>
              <span class="av-trip__text">
                <b>{{ trip.whereto }}</b>
                <template v-if="trip.company_name"> · {{ trip.company_name }}</template>
              </span>
            </div>
          </template>

          <p v-if="active.record?.note && !canEdit" class="av-note">{{ active.record.note }}</p>
        </div>

        <template v-if="canEdit">
          <p class="av-sub av-pad">{{ $t('m.setStatus') }}</p>
          <div class="av-statuses">
            <button
              v-for="s in STATUS_LIST"
              :key="s.key"
              type="button"
              :class="{ 'is-active': form.status === s.key }"
              :style="form.status === s.key ? { borderColor: s.color, background: s.color + '1f' } : {}"
              @click="selectStatus(s.key)"
            >
              <i :style="{ background: s.color }"></i>{{ $t(s.labelKey) }}
            </button>
          </div>
          <van-cell-group inset class="av-form">
            <van-field :label="$t('m.hours')">
              <template #input>
                <van-stepper v-model="form.work_hours" :min="0" :max="24" :step="0.5" :decimal-length="1" />
              </template>
            </van-field>
            <van-field :label="$t('camIn')">
              <template #input>
                <input v-model="form.check_in" type="time" class="av-time" />
              </template>
            </van-field>
            <van-field :label="$t('camOut')">
              <template #input>
                <input v-model="form.check_out" type="time" class="av-time" />
              </template>
            </van-field>
            <van-field
              v-model="form.note"
              type="textarea"
              rows="2"
              autosize
              :placeholder="$t('m.note')"
            />
          </van-cell-group>
        </template>
      </template>
      <template v-if="canEdit" #footer>
        <van-button v-if="active?.record" plain type="danger" :loading="saving" @click="resetDay">
          {{ $t('m.resetDay') }}
        </van-button>
        <van-button type="primary" :loading="saving" @click="saveDay">{{ $t('save') }}</van-button>
      </template>
    </MSheet>

    <MSelectSheet
      v-model="employeeSheet"
      :title="$t('colEmployee')"
      :options="employeeOptions"
      :selected="selectedKey"
      @select="onSelectEmployee"
    />
  </MPage>
</template>

<style scoped>
.av-emp {
  display: flex;
  align-items: center;
  gap: 10px;
  width: calc(100% - 24px);
  margin: 0 12px 6px;
  padding: 8px 12px;
  border: 1px solid var(--m-line);
  border-radius: 12px;
  background: var(--m-surface-2);
  text-align: left;
}

.av-emp__name {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.av-month {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px 6px;
}

.av-month__label {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.av-today {
  position: absolute;
  right: 60px;
  border: 0;
  padding: 4px 10px;
  border-radius: 8px;
  background: var(--m-primary-soft);
  color: var(--m-primary);
  font-size: 12px;
  font-weight: 600;
}

.av-month {
  position: relative;
}

.av-cal {
  margin-top: 8px;
  padding: 10px 8px;
}

/* Planshetda kataklar haddan tashqari kattalashmasin */
@media (min-width: 600px) {
  .av-cal {
    max-width: 560px;
    margin-left: auto;
    margin-right: auto;
  }
}

.av-cal__wd,
.av-cal__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
}

.av-cal__wd span {
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--m-muted);
  padding-bottom: 6px;
}

.av-cal__wd span.is-weekend {
  color: var(--m-bad);
}

.av-day {
  position: relative;
  aspect-ratio: 0.82;
  border: 1px solid var(--m-line-soft);
  border-radius: 9px;
  background: var(--m-surface);
  padding: 4px 2px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.av-day.is-future {
  opacity: 0.45;
}

.av-day.is-today {
  outline: 2px solid var(--m-primary);
  outline-offset: 1px;
}

.av-day__num {
  font-size: 14px;
  font-weight: 600;
  color: var(--m-ink);
}

.av-day__time {
  font-size: 10px;
  color: var(--m-ink-2);
  font-variant-numeric: tabular-nums;
}

.av-day__time.is-muted {
  color: var(--m-faint);
}

.av-day__trips {
  position: absolute;
  right: 2px;
  bottom: 2px;
  min-width: 13px;
  height: 13px;
  padding: 0 3px;
  border-radius: 7px;
  background: var(--m-ink);
  color: var(--m-on-solid);
  font-size: 8px;
  font-weight: 700;
  line-height: 13px;
}

.av-day__ok {
  position: absolute;
  top: 3px;
  right: 3px;
  font-size: 9px;
  color: var(--m-good);
}

.av-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  padding: 4px 16px 0;
  font-size: 12px;
  color: var(--m-ink-2);
}

.av-legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.av-legend i {
  width: 10px;
  height: 10px;
  border-radius: 3px;
}

.av-legend i.is-dashed {
  border: 1px dashed var(--m-muted);
}

.av-confirm {
  padding: 16px 12px 0;
}

.av-sheet {
  padding: 0 16px 4px;
}

.av-sheet__status {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.av-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
}

.av-badge i {
  width: 9px;
  height: 9px;
  border-radius: 3px;
}

.av-times {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 14px;
}

.av-times div {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--m-surface-2);
  border: 1px solid var(--m-line);
}

.av-times span {
  font-size: 11px;
  color: var(--m-muted);
}

.av-times b {
  font-size: 17px;
}

.av-sub {
  margin: 16px 0 8px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--m-muted);
}

.av-pad {
  padding: 0 16px;
}

.av-trip {
  display: flex;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--m-line-soft);
  font-size: 14px;
}

.av-trip__time {
  flex: 0 0 auto;
  color: var(--m-muted);
}

.av-trip__text {
  color: var(--m-ink-2);
}

.av-note {
  margin-top: 12px;
  font-size: 14px;
  color: var(--m-ink-2);
  white-space: pre-wrap;
}

.av-statuses {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding: 0 16px 12px;
}

.av-statuses button {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 6px 10px;
  border: 1px solid var(--m-line);
  border-radius: 10px;
  background: var(--m-surface);
  font-size: 13px;
  font-weight: 500;
  text-align: left;
}

.av-statuses button.is-active {
  box-shadow: inset 0 0 0 1px currentColor;
}

.av-statuses i {
  flex: 0 0 auto;
  width: 10px;
  height: 10px;
  border-radius: 3px;
}

.av-time {
  border: 0;
  background: var(--m-line-soft);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 15px;
  color: var(--m-ink);
}
</style>
