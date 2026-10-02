<template>
  <UiPage
    v-loading="attendanceStore.isLoading"
    :title="$t('davomat')"
    :subtitle="$t('davomatSubtitle')"
    wide
  >
    <template #actions>
      <button
        v-if="isAdmin"
        type="button"
        class="at-cam-sync"
        :class="{ 'is-stale': cameraSync.stale }"
        :title="cameraSync.stale ? $t('camSyncStale', { h: cameraSync.hours }) : ''"
        @click="openCameraDialog"
      >
        <el-icon><VideoCamera /></el-icon>
        <span>{{ cameraSync.label }}</span>
        <span v-if="unlinkedCount" class="at-cam-sync__badge">
          {{ $t('camUnlinkedCount', { n: unlinkedCount }) }}
        </span>
      </button>
      <el-button v-if="!isCurrentMonth" @click="goCurrentMonth">
        {{ $t('attThisMonth') }}
      </el-button>
      <div class="at-month">
        <el-button :icon="ArrowLeft" @click="changeMonth(-1)" />
        <span class="at-month__label">{{ monthLabel }}</span>
        <el-button :icon="ArrowRight" @click="changeMonth(1)" />
      </div>
    </template>

    <div class="at-body" :class="{ 'is-admin': isAdmin }">
      <!-- Admin: xodimlar ro'yxati -->
      <UiPanel v-if="isAdmin" class="at-emps" :title="$t('colEmployee')" flush>
        <template #actions>{{ filteredEmployees.length }}</template>
        <div class="at-emps__search">
          <el-input
            v-model="employeeSearch"
            :placeholder="$t('searchEmployeePlaceholder')"
            :prefix-icon="Search"
            clearable
          />
        </div>
        <ul class="at-emps__list">
          <li
            v-for="u in filteredEmployees"
            :key="u.id"
            class="at-emp"
            :class="{ 'is-active': u.id === selectedUserId }"
            @click="selectEmployee(u.id)"
          >
            <span class="at-avatar">{{ initial(u) }}</span>
            <span class="at-emp__name">{{ u.firstname }} {{ u.lastname }}</span>
          </li>
        </ul>
      </UiPanel>

      <!-- Kalendar va ko'rsatkichlar -->
      <div class="at-main">
        <template v-if="selectedUserId">
          <div class="at-stats">
            <UiStat
              :label="$t('workedDays')"
              tone="good"
              :value="fmtNum(stats.worked)"
              :sub="monthLabel"
            />
            <UiStat
              :label="$t('absentDays')"
              :tone="stats.absent ? 'bad' : ''"
              :value="fmtNum(stats.absent)"
              :sub="monthLabel"
            />
            <UiStat
              :label="$t('totalHours')"
              :hint="$t('attHoursHint')"
              :value="`${fmtNum(stats.hours)} ${$t('hours')}`"
              :sub="$t('attHoursSub')"
            />
            <UiStat
              :label="$t('attConfirmedDays')"
              :hint="$t('attConfirmedHint')"
              :tone="stats.suggested ? 'warn' : 'good'"
              :value="fmtNum(stats.confirmed)"
              :sub="$t('attSuggestedSub', { n: stats.suggested })"
            />
            <UiStat
              :label="$t('fieldTripsTitle')"
              :value="fmtNum(stats.trips)"
              :sub="$t('attTripsSub', { n: stats.tripDays })"
            />
          </div>

          <UiPanel>
            <template #title>
              <span v-if="isAdmin" class="at-avatar">{{ initial(selectedEmployee) }}</span>
              <span>
                {{
                  isAdmin
                    ? `${selectedEmployee?.firstname || ''} ${selectedEmployee?.lastname || ''}`
                    : monthLabel
                }}
              </span>
              <span v-if="isAdmin" class="at-panel-sub">· {{ monthLabel }}</span>
            </template>
            <template v-if="isAdmin && pendingDays.length" #actions>
              <el-button
                type="primary"
                size="small"
                :icon="Check"
                :loading="confirmingMonth"
                @click="confirmMonth"
              >
                {{ $t('attConfirmMonth', { n: pendingDays.length }) }}
              </el-button>
            </template>

            <!-- Rang izohi -->
            <div class="at-legend">
              <span v-for="s in STATUS_LIST" :key="s.key" class="at-legend__item">
                <span class="at-dot" :style="{ background: s.color }"></span>
                {{ $t(s.labelKey) }}
              </span>
              <span class="at-legend__sep"></span>
              <span class="at-legend__item">
                <span class="at-swatch is-confirmed"></span>{{ $t('attLegendConfirmed') }}
              </span>
              <span class="at-legend__item">
                <span class="at-swatch is-suggested"></span>{{ $t('attLegendSuggested') }}
              </span>
              <span class="at-legend__item">
                <span class="at-trip-badge">2</span>{{ $t('attLegendTrips') }}
              </span>
              <span class="at-legend__item">
                <span class="at-day__cam is-legend">09:00 → 18:00</span>{{ $t('attLegendCamera') }}
              </span>
            </div>

            <div class="at-cal">
              <div class="at-cal__week">
                <span v-for="wd in weekdays" :key="wd">{{ $t(wd) }}</span>
              </div>
              <div class="at-cal__grid">
                <span v-for="n in leadingBlanks" :key="'b' + n" class="at-day is-blank"></span>
                <button
                  v-for="day in calendarDays"
                  :key="day.date"
                  type="button"
                  class="at-day"
                  :class="{
                    'is-confirmed': day.confirmed,
                    'is-suggested': !day.confirmed && day.statusKey,
                    'is-today': day.date === todayStr,
                    'is-future': day.future,
                  }"
                  :style="dayStyle(day)"
                  :title="day.statusKey ? $t(statusLabelKey(day.statusKey)) : ''"
                  @click="openDay(day)"
                >
                  <span class="at-day__num">{{ day.dayNum }}</span>
                  <span v-if="day.tripCount" class="at-trip-badge at-day__trips">
                    {{ day.tripCount }}
                  </span>
                  <span v-if="day.statusKey && !day.future" class="at-day__status">
                    {{ $t(statusLabelKey(day.statusKey)) }}
                  </span>
                  <span
                    v-if="day.camera && !day.future"
                    class="at-day__cam"
                    :class="{ 'is-partial': !day.camera.check_in || !day.camera.check_out }"
                    :title="cameraTitle(day.camera)"
                  >
                    {{ day.camera.check_in || '—' }} → {{ day.camera.check_out || '—' }}
                  </span>
                  <span v-if="day.confirmed && day.hours != null" class="at-day__hours">
                    {{ day.hours }} {{ $t('hours') }}
                  </span>
                </button>
              </div>
            </div>
          </UiPanel>
        </template>

        <UiPanel v-else>
          <el-empty :description="$t('selectEmployeeFirst')" />
        </UiPanel>
      </div>
    </div>

    <!-- Day dialog -->
    <el-dialog v-model="dayDialog" :title="dialogTitle" width="460px" destroy-on-close>
      <div v-if="activeDay" class="day-dialog">
        <!-- Admin: tahrirlash formasi -->
        <template v-if="isAdmin">
          <div v-if="!activeDay.confirmed && activeDay.statusKey" class="suggest-hint">
            <el-icon><MagicStick /></el-icon>
            {{ $t('suggestedHint') }}
          </div>

          <label class="field-label">{{ $t('holatLabel') }}</label>
          <div class="status-chips">
            <button
              v-for="s in STATUS_LIST"
              :key="s.key"
              type="button"
              class="status-chip"
              :class="{ selected: form.status === s.key }"
              :style="
                form.status === s.key ? { borderColor: s.color, background: s.color + '22' } : {}
              "
              @click="selectStatus(s.key)"
            >
              <span class="legend-dot" :style="{ background: s.color }"></span>
              {{ $t(s.labelKey) }}
            </button>
          </div>

          <div class="form-row">
            <div class="form-col">
              <label class="field-label">{{ $t('workHours') }}</label>
              <el-input-number
                v-model="form.work_hours"
                :min="0"
                :max="24"
                :step="0.5"
                controls-position="right"
                style="width: 100%"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-col">
              <label class="field-label">{{ $t('checkIn') }}</label>
              <el-time-picker
                v-model="form.check_in"
                format="HH:mm"
                value-format="HH:mm"
                :placeholder="$t('checkIn')"
                style="width: 100%"
              />
            </div>
            <div class="form-col">
              <label class="field-label">{{ $t('checkOut') }}</label>
              <el-time-picker
                v-model="form.check_out"
                format="HH:mm"
                value-format="HH:mm"
                :placeholder="$t('checkOut')"
                style="width: 100%"
              />
            </div>
          </div>

          <p v-if="prefilledFromCamera" class="cam-prefill">
            <el-icon><VideoCamera /></el-icon>{{ $t('camPrefilled') }}
          </p>

          <label class="field-label">{{ $t('attendanceNote') }}</label>
          <el-input
            v-model="form.note"
            type="textarea"
            :rows="2"
            :placeholder="$t('attendanceNotePlaceholder')"
            maxlength="300"
          />
        </template>

        <!-- Xodim: read-only -->
        <template v-else>
          <div class="readonly-status">
            <span
              class="legend-dot"
              :style="{ background: statusColor(activeDay.statusKey) }"
            ></span>
            <span>{{
              activeDay.statusKey ? $t(statusLabelKey(activeDay.statusKey)) : $t('noStatusYet')
            }}</span>
          </div>
          <p v-if="activeDay.record?.work_hours != null" class="readonly-line">
            {{ $t('workHours') }}: <b>{{ activeDay.record.work_hours }} {{ $t('hours') }}</b>
          </p>
          <p v-if="activeDay.record?.check_in" class="readonly-line">
            {{ $t('checkIn') }}: {{ activeDay.record.check_in }} —
            {{ activeDay.record.check_out || '…' }}
          </p>
          <p v-if="activeDay.record?.note" class="readonly-line note">
            {{ activeDay.record.note }}
          </p>
        </template>

        <!-- Kamera: kirish/chiqish terminali (har ikki rol uchun) -->
        <div class="cam-section">
          <h4>{{ $t('camTitle') }}</h4>
          <div v-if="activeDay.camera" class="cam-cells">
            <div class="cam-cell">
              <span class="cam-cell__label">{{ $t('camIn') }}</span>
              <b :class="{ 'is-missing': !activeDay.camera.check_in }">
                {{ activeDay.camera.check_in || $t('camMissingIn') }}
              </b>
              <span class="cam-cell__sub">{{
                $t('camTimes', { n: activeDay.camera.in_count })
              }}</span>
            </div>
            <div class="cam-cell">
              <span class="cam-cell__label">{{ $t('camOut') }}</span>
              <b :class="{ 'is-missing': !activeDay.camera.check_out }">
                {{ activeDay.camera.check_out || $t('camMissingOut') }}
              </b>
              <span class="cam-cell__sub">{{
                $t('camTimes', { n: activeDay.camera.out_count })
              }}</span>
            </div>
          </div>
          <p v-else class="no-trips">{{ $t('camNoData') }}</p>
        </div>

        <!-- Obyekt tashriflari (har ikki rol uchun) -->
        <div class="trips-section">
          <h4>{{ $t('fieldTripsTitle') }}</h4>
          <div v-if="activeDayTrips.length" class="trip-list">
            <div v-for="(trip, i) in activeDayTrips" :key="i" class="trip-item">
              <span class="trip-where">{{ trip.whereto || trip.locationname || '—' }}</span>
              <span class="trip-time"
                >{{ tripTime(trip.when_gone)
                }}<template v-if="trip.when_came"> – {{ tripTime(trip.when_came) }}</template></span
              >
              <span v-if="trip.company_name || trip.client_name" class="trip-company">
                {{ trip.company_name || trip.client_name }}
              </span>
            </div>
          </div>
          <p v-else class="no-trips">{{ $t('noFieldTrips') }}</p>
        </div>
      </div>

      <template #footer v-if="isAdmin">
        <el-button v-if="activeDay?.confirmed" type="danger" plain @click="resetDay">
          {{ $t('resetDay') }}
        </el-button>
        <el-button @click="dayDialog = false">{{ $t('cancel') }}</el-button>
        <el-button type="primary" :loading="attendanceStore.isLoading" @click="saveDay">
          {{ $t('save') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Kamera: terminallar va xodimlarni bog'lash (admin) -->
    <el-dialog v-model="cameraDialog" :title="$t('camTitle')" width="680px">
      <div class="cam-setup">
        <h4>{{ $t('camDevices') }}</h4>
        <div class="cam-devices">
          <div v-for="d in attendanceStore.cameraDevices" :key="d.device_serial" class="cam-device">
            <b>{{ d.direction === 'in' ? $t('camDirIn') : $t('camDirOut') }}</b>
            <span>{{ d.host }}</span>
            <span>{{ $t('camLastSync', { t: fmtSync(d.last_sync_at) }) }}</span>
            <span v-if="d.clock_drift_sec != null">{{
              $t('camDrift', { n: d.clock_drift_sec })
            }}</span>
          </div>
          <p v-if="!attendanceStore.cameraDevices.length" class="no-trips">
            {{ $t('camNeverSynced') }}
          </p>
        </div>

        <h4>{{ $t('camLinkTitle') }}</h4>
        <p class="cam-hint">{{ $t('camLinkHint') }}</p>
        <el-table :data="attendanceStore.cameraEmployees" size="small" max-height="440">
          <el-table-column label="#" width="56">
            <template #default="{ row }">{{ Number(row.employee_no) }}</template>
          </el-table-column>
          <el-table-column :label="$t('camTerminalName')" prop="name" min-width="180" />
          <el-table-column :label="$t('camErpUser')" min-width="260">
            <template #default="{ row }">
              <el-select
                :model-value="row.user_id"
                filterable
                clearable
                :placeholder="$t('camNotLinked')"
                style="width: 100%"
                @change="(v) => linkEmployee(row, v)"
              >
                <el-option
                  v-for="u in employees"
                  :key="u.id"
                  :label="`${u.firstname} ${u.lastname}`"
                  :value="u.id"
                />
              </el-select>
              <button
                v-if="!row.user_id && suggestUser(row)"
                type="button"
                class="cam-suggest"
                @click="linkEmployee(row, suggestUser(row).id)"
              >
                <el-icon><MagicStick /></el-icon>
                {{ suggestUser(row).firstname }} {{ suggestUser(row).lastname }}
              </button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </UiPage>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAttendanceStore } from '@/stores/attendance'
import { useUsersStore } from '@/stores/user'
import { useComeAndGoesStore } from '@/stores/comeandgoes'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  ArrowLeft,
  ArrowRight,
  Check,
  MagicStick,
  VideoCamera,
} from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import UiPage from '@/components/ui/UiPage.vue'
import UiStat from '@/components/ui/UiStat.vue'
import UiPanel from '@/components/ui/UiPanel.vue'
import { fmtNum } from '@/utils/format'

const { t, locale } = useI18n()
const attendanceStore = useAttendanceStore()
const usersStore = useUsersStore()
const comeandgoesStore = useComeAndGoesStore()

const currentUserId = Number(localStorage.getItem('userid'))
const isAdmin = computed(() => !!usersStore.currentUser?.is_admin)

const STATUS_LIST = [
  { key: 'direct_object', labelKey: 'statusDirectObject', color: '#67c23a' },
  { key: 'office_then_object', labelKey: 'statusOfficeThenObject', color: '#e6a23c' },
  { key: 'office', labelKey: 'statusOffice', color: '#409eff' },
  { key: 'absent', labelKey: 'statusAbsent', color: '#f56c6c' },
  { key: 'dayoff', labelKey: 'statusDayoff', color: '#c0c4cc' },
]
const WORKED = ['direct_object', 'office_then_object', 'office']
const statusColor = (key) => STATUS_LIST.find((s) => s.key === key)?.color || '#ebeef5'
const statusLabelKey = (key) => STATUS_LIST.find((s) => s.key === key)?.labelKey || 'noStatusYet'

const weekdays = ['wdMon', 'wdTue', 'wdWed', 'wdThu', 'wdFri', 'wdSat', 'wdSun']
const uzMonths = [
  'Yanvar',
  'Fevral',
  'Mart',
  'Aprel',
  'May',
  'Iyun',
  'Iyul',
  'Avgust',
  'Sentabr',
  'Oktabr',
  'Noyabr',
  'Dekabr',
]

// ─── Date helpers (local time) ───
const pad = (n) => String(n).padStart(2, '0')
const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const todayStr = toDateStr(new Date())

const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth() + 1) // 1-12
const monthKey = computed(() => `${year.value}-${pad(month.value)}`)
const monthLabel = computed(() => {
  if (locale.value === 'ru') {
    return new Date(year.value, month.value - 1, 1).toLocaleDateString('ru-RU', {
      month: 'long',
      year: 'numeric',
    })
  }
  return `${uzMonths[month.value - 1]} ${year.value}`
})

const changeMonth = (delta) => {
  let m = month.value + delta
  let y = year.value
  if (m < 1) {
    m = 12
    y -= 1
  } else if (m > 12) {
    m = 1
    y += 1
  }
  month.value = m
  year.value = y
  loadData()
}

const isCurrentMonth = computed(
  () => year.value === now.getFullYear() && month.value === now.getMonth() + 1,
)
const goCurrentMonth = () => {
  year.value = now.getFullYear()
  month.value = now.getMonth() + 1
  loadData()
}

// ─── Employees (admin) ───
const employeeSearch = ref('')
const selectedUserId = ref(null)
const employees = computed(() => usersStore.allUsers || [])
const filteredEmployees = computed(() => {
  const q = employeeSearch.value.trim().toLowerCase()
  if (!q) return employees.value
  return employees.value.filter((u) =>
    `${u.firstname} ${u.lastname} ${u.username}`.toLowerCase().includes(q),
  )
})
const selectedEmployee = computed(() => employees.value.find((u) => u.id === selectedUserId.value))
const initial = (u) => (u?.firstname ? u.firstname.charAt(0).toUpperCase() : '?')

const selectEmployee = (id) => {
  selectedUserId.value = id
  loadData()
}

// ─── Data ───
const fieldTrips = ref([]) // flattened insides for selected user

const recordsByDate = computed(() => {
  const map = {}
  for (const r of attendanceStore.userRecords) map[r.date] = r
  return map
})

const tripsByDate = computed(() => {
  const map = {}
  for (const trip of fieldTrips.value) {
    if (!trip.when_gone) continue
    const d = toDateStr(new Date(trip.when_gone))
    ;(map[d] ||= []).push(trip)
  }
  return map
})

// Kamera: kunlik birinchi kirish / oxirgi chiqish (Hikvision terminallari)
const cameraByDate = computed(() => {
  const map = {}
  for (const r of attendanceStore.cameraRecords) map[r.date] = r
  return map
})
// Xodim terminalga bog'langan va shu oyda qaydi bor — kamerasiz ish kuni "kelmadi" deb taklif qilinadi
const hasCamera = computed(() => attendanceStore.cameraRecords.length > 0)
const officeDaySet = computed(() => new Set(attendanceStore.cameraOfficeDays))
// Shu oyda kamera ishlagan, lekin bu o'tgan kuni ofisda hech kim qayd etilmagan
const isOfficeClosed = (dateStr) =>
  officeDaySet.value.size > 0 && dateStr < todayStr && !officeDaySet.value.has(dateStr)

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
// Kelgan → ketgan oralig'i soatda (0.5 ga yaxlitlangan)
const cameraHours = (cam) => {
  if (!cam?.check_in || !cam?.check_out) return null
  const diff = toMinutes(cam.check_out) - toMinutes(cam.check_in)
  return diff > 0 ? Math.round((diff / 60) * 2) / 2 : null
}
const cameraTitle = (cam) =>
  `${t('camIn')}: ${cam.check_in || t('camMissingIn')} · ${t('camOut')}: ${cam.check_out || t('camMissingOut')}`

const isPersonal = (trip) => (trip.whereto || '').trim().toLowerCase() === 'shaxsiy'

const suggestStatus = (dateStr) => {
  if (dateStr > todayStr) return null // future date
  const trips = tripsByDate.value[dateStr] || []
  const cam = cameraByDate.value[dateStr]
  const d = new Date(dateStr + 'T00:00:00')
  const weekend = d.getDay() === 0 || d.getDay() === 6
  if (trips.length) {
    const firstTrip = new Date(Math.min(...trips.map((tr) => new Date(tr.when_gone).getTime())))
    const tripMinutes = firstTrip.getHours() * 60 + firstTrip.getMinutes()
    // Kamera ofisga kirganini ko'rsatsa — ofisdan keyin obyektga
    if (cam?.check_in && toMinutes(cam.check_in) < tripMinutes && !trips.every(isPersonal)) {
      return 'office_then_object'
    }
    if (firstTrip.getHours() < 10) {
      return trips.every(isPersonal) ? 'absent' : 'direct_object'
    }
    return 'office_then_object'
  }
  if (weekend) return cam ? 'office' : 'dayoff'
  // Butun ofisda kamera qaydi yo'q ish kuni — bayram/dam olish
  if (isOfficeClosed(dateStr)) return 'dayoff'
  if (hasCamera.value && !cam && dateStr < todayStr) return 'absent'
  return 'office'
}

const daysInMonth = computed(() => new Date(year.value, month.value, 0).getDate())
const leadingBlanks = computed(() => {
  const firstDow = new Date(year.value, month.value - 1, 1).getDay() // 0=Sun
  return (firstDow + 6) % 7 // Monday-based
})

const calendarDays = computed(() => {
  const days = []
  for (let dn = 1; dn <= daysInMonth.value; dn++) {
    const dateStr = `${year.value}-${pad(month.value)}-${pad(dn)}`
    const record = recordsByDate.value[dateStr]
    const trips = tripsByDate.value[dateStr] || []
    days.push({
      date: dateStr,
      dayNum: dn,
      future: dateStr > todayStr,
      confirmed: !!record,
      statusKey: record ? record.status : suggestStatus(dateStr),
      hours: record ? record.work_hours : null,
      record,
      camera: cameraByDate.value[dateStr] || null,
      tripCount: trips.length,
    })
  }
  return days
})

const dayStyle = (day) => {
  if (!day.statusKey) return {}
  const c = statusColor(day.statusKey)
  if (day.confirmed) return { background: c + '33', borderColor: c }
  return { background: c + '14' } // suggested — very light
}

const stats = computed(() => {
  let worked = 0
  let absent = 0
  let hours = 0
  let confirmed = 0
  let suggested = 0
  let trips = 0
  let tripDays = 0
  for (const day of calendarDays.value) {
    trips += day.tripCount
    if (day.tripCount) tripDays++
    if (day.future || !day.statusKey) continue
    if (day.confirmed) confirmed++
    else suggested++
    if (WORKED.includes(day.statusKey)) {
      worked++
      hours += day.confirmed ? day.hours || 0 : (cameraHours(day.camera) ?? 8)
    } else if (day.statusKey === 'absent') {
      absent++
    }
  }
  return {
    worked,
    absent,
    hours: Math.round(hours * 10) / 10,
    confirmed,
    suggested,
    trips,
    tripDays,
  }
})

// ─── Day dialog ───
const dayDialog = ref(false)
const activeDay = ref(null)
const prefilledFromCamera = ref(false)
const form = reactive({
  status: 'office',
  work_hours: 8,
  check_in: null,
  check_out: null,
  note: '',
})

const dialogTitle = computed(() => {
  if (!activeDay.value) return ''
  const d = new Date(activeDay.value.date + 'T00:00:00')
  const label =
    locale.value === 'ru'
      ? d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
      : `${d.getDate()}-${uzMonths[d.getMonth()].toLowerCase()}`
  return isAdmin.value ? `${t('editAttendance')} — ${label}` : `${t('dayDetails')} — ${label}`
})

const activeDayTrips = computed(() =>
  activeDay.value ? tripsByDate.value[activeDay.value.date] || [] : [],
)

const tripTime = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const openDay = (day) => {
  if (day.future) return
  activeDay.value = day
  if (isAdmin.value) {
    // Bo'sh kelgan/ketgan vaqtlar kameradan to'ldiriladi
    const cam = day.camera
    if (day.record) {
      form.status = day.record.status
      form.work_hours = day.record.work_hours
      form.check_in = day.record.check_in || cam?.check_in || null
      form.check_out = day.record.check_out || cam?.check_out || null
      form.note = day.record.note || ''
    } else {
      form.status = day.statusKey || 'office'
      form.work_hours =
        day.statusKey === 'absent' || day.statusKey === 'dayoff' ? 0 : (cameraHours(cam) ?? 8)
      form.check_in = cam?.check_in || null
      form.check_out = cam?.check_out || null
      form.note = ''
    }
    prefilledFromCamera.value =
      !!cam &&
      ((!day.record?.check_in && !!cam.check_in) || (!day.record?.check_out && !!cam.check_out))
  }
  dayDialog.value = true
}

const selectStatus = (key) => {
  form.status = key
  if (key === 'absent' || key === 'dayoff') form.work_hours = 0
  else if (!form.work_hours) form.work_hours = 8
}

const saveDay = async () => {
  try {
    await attendanceStore.upsert({
      user_id: selectedUserId.value,
      date: activeDay.value.date,
      status: form.status,
      work_hours: form.work_hours,
      check_in: form.check_in || null,
      check_out: form.check_out || null,
      note: form.note.trim() || null,
      created_by: currentUserId,
    })
    ElMessage.success(t('attendanceSaved'))
    dayDialog.value = false
    await reloadAttendance()
  } catch {
    ElMessage.error(t('xatolikYuzBerdi'))
  }
}

const resetDay = async () => {
  try {
    if (activeDay.value.record) {
      await attendanceStore.deleteRecord(activeDay.value.record.id)
      ElMessage.success(t('attendanceDeleted'))
    }
    dayDialog.value = false
    await reloadAttendance()
  } catch {
    ElMessage.error(t('xatolikYuzBerdi'))
  }
}

// ─── Oyni ommaviy tasdiqlash (admin) ───
// Bugungacha bo'lgan tasdiqlanmagan kunlar taklif qilingan holat + kamera vaqtlari bilan saqlanadi
const pendingDays = computed(() =>
  calendarDays.value.filter((d) => d.date < todayStr && !d.confirmed && d.statusKey),
)
const confirmingMonth = ref(false)

const confirmMonth = async () => {
  const days = pendingDays.value
  const counts = STATUS_LIST.map((s) => ({
    label: t(s.labelKey),
    n: days.filter((d) => d.statusKey === s.key).length,
  }))
    .filter((c) => c.n)
    .map((c) => `${c.label}: ${c.n}`)
    .join(', ')
  try {
    await ElMessageBox.confirm(
      t('attConfirmMonthBody', {
        name: `${selectedEmployee.value?.firstname || ''} ${selectedEmployee.value?.lastname || ''}`,
        month: monthLabel.value,
        n: days.length,
        counts,
      }),
      t('attConfirmMonthTitle'),
      { confirmButtonText: t('save'), cancelButtonText: t('cancel'), type: 'info' },
    )
  } catch {
    return // bekor qilindi
  }

  confirmingMonth.value = true
  let saved = 0
  try {
    for (const day of days) {
      const off = day.statusKey === 'absent' || day.statusKey === 'dayoff'
      await attendanceStore.upsert({
        user_id: selectedUserId.value,
        date: day.date,
        status: day.statusKey,
        work_hours: off ? 0 : (cameraHours(day.camera) ?? 8),
        check_in: day.camera?.check_in || null,
        check_out: day.camera?.check_out || null,
        note: null,
        created_by: currentUserId,
      })
      saved++
    }
    ElMessage.success(t('attConfirmMonthDone', { n: saved }))
  } catch {
    ElMessage.error(t('xatolikYuzBerdi'))
  } finally {
    confirmingMonth.value = false
    await reloadAttendance()
  }
}

// ─── Loading ───
const reloadAttendance = async () => {
  if (selectedUserId.value) {
    await attendanceStore.getUserMonth(selectedUserId.value, monthKey.value)
  }
}

const loadData = async () => {
  if (!selectedUserId.value) return
  await Promise.all([
    attendanceStore.getUserMonth(selectedUserId.value, monthKey.value),
    attendanceStore.getCameraUserMonth(selectedUserId.value, monthKey.value),
    loadFieldTrips(selectedUserId.value),
  ])
}

// ─── Kamera sozlamalari (admin) ───
const cameraDialog = ref(false)
const unlinkedCount = computed(
  () => attendanceStore.cameraEmployees.filter((e) => !e.user_id).length,
)

const fmtSync = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  return toDateStr(d) === todayStr ? time : `${pad(d.getDate())}.${pad(d.getMonth() + 1)} ${time}`
}
// Agent ofis kompyuterida ishlaydi — 24 soatdan ko'p jim tursa ogohlantiramiz
const cameraSync = computed(() => {
  const times = attendanceStore.cameraDevices.map((d) => d.last_sync_at).filter(Boolean)
  if (!times.length) return { label: t('camNeverSynced'), stale: false, hours: 0 }
  const last = times.sort().at(-1)
  const hours = Math.floor((Date.now() - new Date(last).getTime()) / 3600000)
  return { label: t('camLastSync', { t: fmtSync(last) }), stale: hours >= 24, hours }
})

const openCameraDialog = async () => {
  cameraDialog.value = true
  await attendanceStore.getCameraSetup()
}

// Terminal ismi ERP'dagi ism/familiyaga to'g'ri kelsa — bitta nomzod bo'lsagina taklif qilamiz
const normalize = (s) => (s || '').toLowerCase().replace(/[^a-zа-яё0-9]/gi, '')
const suggestUser = (row) => {
  const words = (row.name || '')
    .split(/\s+/)
    .map(normalize)
    .filter((w) => w.length > 2)
  const taken = new Set(attendanceStore.cameraEmployees.map((e) => e.user_id).filter(Boolean))
  const matches = employees.value.filter(
    (u) =>
      !taken.has(u.id) &&
      words.some((w) => w === normalize(u.firstname) || w === normalize(u.lastname)),
  )
  if (matches.length === 1) return matches[0]
  // Ism ham, familiya ham mos kelgani aniqroq
  const both = matches.filter(
    (u) => words.includes(normalize(u.firstname)) && words.includes(normalize(u.lastname)),
  )
  return both.length === 1 ? both[0] : null
}

const linkEmployee = async (row, userId) => {
  try {
    await attendanceStore.linkCameraEmployee(row.employee_no, userId || null)
    ElMessage.success(userId ? t('camLinked') : t('camNotLinked'))
    await attendanceStore.getCameraUserMonth(selectedUserId.value, monthKey.value)
  } catch {
    ElMessage.error(t('xatolikYuzBerdi'))
  }
}

const loadFieldTrips = async (userId) => {
  try {
    await comeandgoesStore.getComeAndGoesOfUser(userId)
    const containers = comeandgoesStore.allComeAndGoesofUser || []
    const trips = []
    for (const c of Array.isArray(containers) ? containers : []) {
      const insides = c.comeAndGoInsides || c.comeandgoinsides || []
      for (const ins of insides) trips.push(ins)
    }
    fieldTrips.value = trips
  } catch {
    fieldTrips.value = []
  }
}

onMounted(async () => {
  if (!usersStore.currentUser) {
    await usersStore.getUserInfo(currentUserId)
  }
  if (isAdmin.value) {
    attendanceStore.getCameraSetup()
    await usersStore.getAllUsers()
    if (employees.value.length) {
      selectedUserId.value = employees.value[0].id
      await loadData()
    }
  } else {
    selectedUserId.value = currentUserId
    await loadData()
  }
})
</script>

<style lang="scss" scoped>
/* ─── Oy tanlash ─── */
.at-month {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--ui-line);
  border-radius: 8px;
  background: var(--ui-surface);

  .el-button {
    border: none;
    background: transparent;
  }
  .el-button + .el-button {
    margin-left: 0;
  }
}
.at-month__label {
  min-width: 140px;
  padding: 0 4px;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  text-transform: capitalize;
  color: var(--ui-ink);
}

/* ─── Joylashuv ─── */
.at-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
  align-items: start;

  &.is-admin {
    grid-template-columns: 260px minmax(0, 1fr);
  }
}
.at-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

/* ─── Xodimlar ─── */
.at-emps {
  position: sticky;
  top: 16px;
}
.at-emps__search {
  padding: 12px 12px 8px;
}
.at-emps__list {
  max-height: calc(100vh - 220px);
  margin: 0;
  padding: 0 8px 8px;
  list-style: none;
  overflow-y: auto;
}
.at-emp {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.12s;

  &:hover {
    background: var(--ui-surface-2);
  }
  &.is-active {
    background: var(--ui-link-soft);

    .at-emp__name {
      font-weight: 600;
      color: var(--ui-link);
    }
  }
}
.at-emp__name {
  font-size: 13px;
  color: var(--ui-ink-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.at-avatar {
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 700;
  color: var(--ui-link);
  background: var(--ui-link-soft);
  border-radius: 50%;
}
.at-emp.is-active .at-avatar {
  color: white;
  background: var(--ui-link);
}
.at-panel-sub {
  font-weight: 400;
  color: var(--ui-muted);
  text-transform: capitalize;
}

/* ─── Ko'rsatkichlar ─── */
.at-stats {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

/* ─── Izoh ─── */
.at-legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--ui-line-soft);
}
.at-legend__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--ui-muted);
}
.at-legend__sep {
  width: 1px;
  height: 14px;
  background: var(--ui-line);
}
.at-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}
.at-swatch {
  width: 16px;
  height: 12px;
  border-radius: 3px;

  &.is-confirmed {
    background: #dbeafe;
    border: 1.5px solid #60a5fa;
  }
  &.is-suggested {
    background: #f8fafc;
    border: 1.5px dashed #94a3b8;
  }
}
.at-trip-badge {
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: white;
  background: #64748b;
  border-radius: 999px;
  box-sizing: border-box;
}

/* ─── Kalendar ─── */
.at-cal__week,
.at-cal__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
}
.at-cal__week span {
  padding-bottom: 6px;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ui-muted);
}
.at-day {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-width: 0;
  min-height: 88px;
  padding: 6px 8px;
  font-family: inherit;
  text-align: left;
  background: var(--ui-surface);
  border: 1px solid var(--ui-line);
  border-radius: 8px;
  cursor: pointer;
  transition:
    box-shadow 0.12s,
    border-color 0.12s;

  &:not(.is-blank):not(.is-future):hover {
    box-shadow: var(--ui-shadow-hover);
  }
  &.is-blank {
    background: transparent;
    border: none;
    cursor: default;
  }
  &.is-suggested {
    border-style: dashed;
  }
  &.is-confirmed {
    border-width: 1.5px;
  }
  &.is-today {
    outline: 2px solid var(--ui-link);
    outline-offset: 1px;
  }
  &.is-future {
    cursor: default;
    opacity: 0.45;
  }
}
.at-day__num {
  font-size: 14px;
  font-weight: 700;
  color: var(--ui-ink);
  font-variant-numeric: tabular-nums;
}
.at-day__trips {
  position: absolute;
  top: 6px;
  right: 6px;
}
.at-day__status {
  max-width: 100%;
  font-size: 11px;
  line-height: 1.3;
  color: var(--ui-ink-2);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.at-day.is-suggested .at-day__status {
  color: var(--ui-muted);
}
.at-day__hours {
  margin-top: auto;
  font-size: 11px;
  font-weight: 600;
  color: var(--ui-ink-2);
  font-variant-numeric: tabular-nums;
}

/* ─── Kun dialogi ─── */
.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}
.day-dialog {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.suggest-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  font-size: 12px;
  color: #92400e;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 6px;
}
.field-label {
  margin-bottom: -4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ui-muted);
}
.status-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-family: inherit;
  font-size: 13px;
  color: var(--ui-ink-2);
  background: var(--ui-surface);
  border: 1.5px solid var(--ui-line);
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: #cbd5e1;
  }
}
.form-row {
  display: flex;
  gap: 12px;
}
.form-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.readonly-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--ui-ink);
}
.readonly-line {
  margin: 0;
  font-size: 14px;
  color: var(--ui-ink-2);

  &.note {
    font-style: italic;
    color: var(--ui-muted);
  }
}
.trips-section {
  padding-top: 12px;
  border-top: 1px solid var(--ui-line-soft);

  h4 {
    margin: 0 0 8px;
    font-size: 14px;
    color: var(--ui-ink);
  }
}
.trip-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.trip-item {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  padding: 8px 10px;
  font-size: 13px;
  background: var(--ui-surface-2);
  border: 1px solid var(--ui-line-soft);
  border-radius: 6px;
}
.trip-where {
  font-weight: 600;
  color: var(--ui-ink);
}
.trip-time {
  font-size: 12px;
  color: var(--ui-muted);
  font-variant-numeric: tabular-nums;
}
.trip-company {
  font-size: 12px;
  color: var(--ui-faint);
}
.no-trips {
  margin: 0;
  font-size: 13px;
  color: var(--ui-faint);
}

/* ─── Kamera ─── */
.at-cam-sync {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  font-family: inherit;
  font-size: 13px;
  color: var(--ui-ink-2);
  background: var(--ui-surface);
  border: 1px solid var(--ui-line);
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    border-color: var(--ui-link);
    color: var(--ui-link);
  }
  &.is-stale {
    color: #b91c1c;
    border-color: #fca5a5;
    background: #fef2f2;
  }
}
.at-cam-sync__badge {
  padding: 1px 7px;
  font-size: 11px;
  font-weight: 600;
  color: #92400e;
  background: #fef3c7;
  border-radius: 999px;
}
.at-day__cam {
  font-size: 11px;
  font-weight: 600;
  color: #0f766e;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;

  &.is-partial {
    color: #b45309;
  }
  &.is-legend {
    padding: 1px 6px;
    background: #f0fdfa;
    border-radius: 4px;
  }
}
.cam-prefill {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: -4px 0 0;
  font-size: 12px;
  color: #0f766e;
}
.cam-section {
  padding-top: 12px;
  border-top: 1px solid var(--ui-line-soft);

  h4 {
    margin: 0 0 8px;
    font-size: 14px;
    color: var(--ui-ink);
  }
}
.cam-cells {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.cam-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  background: var(--ui-surface-2);
  border: 1px solid var(--ui-line-soft);
  border-radius: 6px;

  b {
    font-size: 18px;
    color: var(--ui-ink);
    font-variant-numeric: tabular-nums;

    &.is-missing {
      font-size: 13px;
      font-weight: 500;
      color: #b45309;
    }
  }
}
.cam-cell__label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ui-muted);
}
.cam-cell__sub {
  font-size: 12px;
  color: var(--ui-faint);
}
.cam-setup h4 {
  margin: 0 0 8px;
  font-size: 14px;
  color: var(--ui-ink);
}
.cam-devices {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 18px;
}
.cam-device {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  padding: 8px 10px;
  font-size: 13px;
  color: var(--ui-ink-2);
  background: var(--ui-surface-2);
  border: 1px solid var(--ui-line-soft);
  border-radius: 6px;
}
.cam-hint {
  margin: -2px 0 10px;
  font-size: 12px;
  color: var(--ui-muted);
}
.cam-suggest {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  padding: 2px 8px;
  font-family: inherit;
  font-size: 12px;
  color: #92400e;
  background: #fffbeb;
  border: 1px dashed #fcd34d;
  border-radius: 999px;
  cursor: pointer;
}

/* ─── Responsive ─── */
@media (max-width: 1280px) {
  .at-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 900px) {
  .at-body.is-admin {
    grid-template-columns: minmax(0, 1fr);
  }
  .at-emps {
    position: static;
  }
  .at-emps__list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    max-height: none;
  }
  .at-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .at-day {
    min-height: 54px;
    padding: 4px;
  }
  .at-day__status,
  .at-day__cam {
    display: none;
  }
  .at-day__num {
    font-size: 12px;
  }
}
</style>
