<template>
  <div class="attendance-container" v-loading="attendanceStore.isLoading">
    <div class="page-header">
      <div class="header-top">
        <div class="header-text">
          <h1>{{ $t('davomat') }}</h1>
          <p class="subtitle">{{ $t('davomatSubtitle') }}</p>
        </div>

        <div class="month-nav">
          <el-button :icon="ArrowLeft" circle @click="changeMonth(-1)" />
          <span class="month-label">{{ monthLabel }}</span>
          <el-button :icon="ArrowRight" circle @click="changeMonth(1)" />
        </div>
      </div>

      <!-- Color legend -->
      <div class="legend">
        <span v-for="s in STATUS_LIST" :key="s.key" class="legend-item">
          <span class="legend-dot" :style="{ background: s.color }"></span>
          {{ $t(s.labelKey) }}
        </span>
      </div>
    </div>

    <div class="davomat-body">
      <!-- Admin: xodimlar ro'yxati -->
      <aside v-if="isAdmin" class="employee-panel">
        <el-input
          v-model="employeeSearch"
          :placeholder="$t('searchEmployeePlaceholder')"
          :prefix-icon="Search"
          clearable
          size="small"
          class="emp-search"
        />
        <ul class="employee-list">
          <li
            v-for="u in filteredEmployees"
            :key="u.id"
            class="employee-item"
            :class="{ active: u.id === selectedUserId }"
            @click="selectEmployee(u.id)"
          >
            <span class="emp-avatar">{{ initial(u) }}</span>
            <span class="emp-name">{{ u.firstname }} {{ u.lastname }}</span>
          </li>
        </ul>
      </aside>

      <!-- Calendar + stats -->
      <main class="calendar-panel">
        <template v-if="selectedUserId">
          <div class="selected-emp-header" v-if="isAdmin">
            <span class="emp-avatar big">{{ initial(selectedEmployee) }}</span>
            <h2>{{ selectedEmployee?.firstname }} {{ selectedEmployee?.lastname }}</h2>
          </div>

          <div class="month-stats">
            <el-tag type="success" effect="plain">
              {{ $t('workedDays') }}: {{ stats.worked }}
            </el-tag>
            <el-tag type="danger" effect="plain">{{ $t('absentDays') }}: {{ stats.absent }}</el-tag>
            <el-tag type="primary" effect="plain">
              {{ $t('totalHours') }}: {{ stats.hours }} {{ $t('hours') }}
            </el-tag>
          </div>

          <div class="calendar">
            <div class="weekday-row">
              <span v-for="wd in weekdays" :key="wd" class="weekday">{{ $t(wd) }}</span>
            </div>
            <div class="days-grid">
              <span v-for="n in leadingBlanks" :key="'b' + n" class="day-cell blank"></span>
              <button
                v-for="day in calendarDays"
                :key="day.date"
                class="day-cell"
                :class="{
                  confirmed: day.confirmed,
                  suggested: !day.confirmed && day.statusKey,
                  today: day.date === todayStr,
                  future: day.future,
                }"
                :style="dayStyle(day)"
                @click="openDay(day)"
              >
                <span class="day-num">{{ day.dayNum }}</span>
                <span v-if="day.confirmed && day.hours != null" class="day-hours">
                  {{ day.hours }}{{ $t('hours') }}
                </span>
                <span v-if="day.tripCount" class="trip-badge">{{ day.tripCount }}</span>
              </button>
            </div>
          </div>
        </template>

        <el-empty v-else :description="$t('selectEmployeeFirst')" />
      </main>
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
              :style="form.status === s.key ? { borderColor: s.color, background: s.color + '22' } : {}"
              @click="selectStatus(s.key)"
            >
              <span class="legend-dot" :style="{ background: s.color }"></span>
              {{ $t(s.labelKey) }}
            </button>
          </div>

          <div class="form-row">
            <div class="form-col">
              <label class="field-label">{{ $t('workHours') }}</label>
              <el-input-number v-model="form.work_hours" :min="0" :max="24" :step="0.5" controls-position="right" style="width: 100%" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-col">
              <label class="field-label">{{ $t('checkIn') }}</label>
              <el-time-picker v-model="form.check_in" format="HH:mm" value-format="HH:mm" :placeholder="$t('checkIn')" style="width: 100%" />
            </div>
            <div class="form-col">
              <label class="field-label">{{ $t('checkOut') }}</label>
              <el-time-picker v-model="form.check_out" format="HH:mm" value-format="HH:mm" :placeholder="$t('checkOut')" style="width: 100%" />
            </div>
          </div>

          <label class="field-label">{{ $t('attendanceNote') }}</label>
          <el-input v-model="form.note" type="textarea" :rows="2" :placeholder="$t('attendanceNotePlaceholder')" maxlength="300" />
        </template>

        <!-- Xodim: read-only -->
        <template v-else>
          <div class="readonly-status">
            <span class="legend-dot" :style="{ background: statusColor(activeDay.statusKey) }"></span>
            <span>{{ activeDay.statusKey ? $t(statusLabelKey(activeDay.statusKey)) : $t('noStatusYet') }}</span>
          </div>
          <p v-if="activeDay.record?.work_hours != null" class="readonly-line">
            {{ $t('workHours') }}: <b>{{ activeDay.record.work_hours }} {{ $t('hours') }}</b>
          </p>
          <p v-if="activeDay.record?.check_in" class="readonly-line">
            {{ $t('checkIn') }}: {{ activeDay.record.check_in }} — {{ activeDay.record.check_out || '…' }}
          </p>
          <p v-if="activeDay.record?.note" class="readonly-line note">{{ activeDay.record.note }}</p>
        </template>

        <!-- Obyekt tashriflari (har ikki rol uchun) -->
        <div class="trips-section">
          <h4>{{ $t('fieldTripsTitle') }}</h4>
          <div v-if="activeDayTrips.length" class="trip-list">
            <div v-for="(trip, i) in activeDayTrips" :key="i" class="trip-item">
              <span class="trip-where">{{ trip.whereto || trip.locationname || '—' }}</span>
              <span class="trip-time">{{ tripTime(trip.when_gone) }}<template v-if="trip.when_came"> – {{ tripTime(trip.when_came) }}</template></span>
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAttendanceStore } from '@/stores/attendance'
import { useUsersStore } from '@/stores/user'
import { useComeAndGoesStore } from '@/stores/comeandgoes'
import { ElMessage } from 'element-plus'
import { Search, ArrowLeft, ArrowRight, MagicStick } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

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
const uzMonths = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']

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

const isPersonal = (trip) => (trip.whereto || '').trim().toLowerCase() === 'shaxsiy'

const suggestStatus = (dateStr) => {
  if (dateStr > todayStr) return null // future date
  const trips = tripsByDate.value[dateStr] || []
  const d = new Date(dateStr + 'T00:00:00')
  const weekend = d.getDay() === 0 || d.getDay() === 6
  if (trips.length) {
    const earliest = Math.min(...trips.map((tr) => new Date(tr.when_gone).getHours()))
    if (earliest < 10) {
      return trips.every(isPersonal) ? 'absent' : 'direct_object'
    }
    return 'office_then_object'
  }
  if (weekend) return 'dayoff'
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
  for (const day of calendarDays.value) {
    if (day.future || !day.statusKey) continue
    if (WORKED.includes(day.statusKey)) {
      worked++
      hours += day.confirmed ? day.hours || 0 : 8
    } else if (day.statusKey === 'absent') {
      absent++
    }
  }
  return { worked, absent, hours: Math.round(hours * 10) / 10 }
})

// ─── Day dialog ───
const dayDialog = ref(false)
const activeDay = ref(null)
const form = reactive({ status: 'office', work_hours: 8, check_in: null, check_out: null, note: '' })

const dialogTitle = computed(() => {
  if (!activeDay.value) return ''
  const d = new Date(activeDay.value.date + 'T00:00:00')
  const label = locale.value === 'ru'
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
    if (day.record) {
      form.status = day.record.status
      form.work_hours = day.record.work_hours
      form.check_in = day.record.check_in || null
      form.check_out = day.record.check_out || null
      form.note = day.record.note || ''
    } else {
      form.status = day.statusKey || 'office'
      form.work_hours = day.statusKey === 'absent' || day.statusKey === 'dayoff' ? 0 : 8
      form.check_in = null
      form.check_out = null
      form.note = ''
    }
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
    loadFieldTrips(selectedUserId.value),
  ])
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
.attendance-container {
  width: 100%;
  padding: 28px 32px;
  background: #f5f7fa;
  min-height: 100vh;
  box-sizing: border-box;
}

.page-header {
  margin-bottom: 20px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  flex-wrap: wrap;
}

.header-text {
  h1 {
    margin: 0;
    font-size: 26px;
    font-weight: 700;
    color: #1f2937;
  }
  .subtitle {
    margin: 4px 0 0;
    font-size: 14px;
    color: #6b7280;
  }
}

.month-nav {
  display: flex;
  align-items: center;
  gap: 12px;

  .month-label {
    font-size: 16px;
    font-weight: 600;
    color: #374151;
    min-width: 130px;
    text-align: center;
    text-transform: capitalize;
  }
}

.legend {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 16px;
}
.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
}
.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ─── Body layout ─── */
.davomat-body {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.employee-panel {
  width: 240px;
  flex-shrink: 0;
  background: white;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}
.emp-search {
  margin-bottom: 10px;
}
.employee-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
}
.employee-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: #f3f4f6;
  }
  &.active {
    background: #409eff;
    .emp-name {
      color: white;
    }
  }
}
.emp-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #409eff;
  color: white;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.big {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }
}
.employee-item.active .emp-avatar {
  background: white;
  color: #409eff;
}
.emp-name {
  font-size: 14px;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.calendar-panel {
  flex: 1;
  min-width: 0;
  background: white;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.selected-emp-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;

  h2 {
    margin: 0;
    font-size: 18px;
    color: #1f2937;
  }
}

.month-stats {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

/* ─── Calendar grid ─── */
.weekday-row,
.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}
.weekday {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #9ca3af;
  padding-bottom: 4px;
}
.days-grid {
  margin-top: 4px;
}
.day-cell {
  position: relative;
  aspect-ratio: 1 / 1;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 6px 8px;
  font-family: inherit;
  transition:
    transform 0.12s ease,
    box-shadow 0.12s ease;

  &.blank {
    border: none;
    background: transparent;
    cursor: default;
  }
  &:not(.blank):hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
  }
  &.suggested {
    border-style: dashed;
  }
  &.confirmed {
    border-width: 1.5px;
  }
  &.today {
    outline: 2px solid #409eff;
    outline-offset: 1px;
  }
  &.future {
    cursor: default;
    opacity: 0.5;
  }
}
.day-num {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}
.day-hours {
  position: absolute;
  bottom: 5px;
  left: 8px;
  font-size: 10px;
  color: #6b7280;
}
.trip-badge {
  position: absolute;
  top: 5px;
  right: 5px;
  background: #909399;
  color: white;
  font-size: 10px;
  font-weight: 600;
  min-width: 15px;
  height: 15px;
  padding: 0 3px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ─── Day dialog ─── */
.day-dialog {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.suggest-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #e6a23c;
  background: #fdf6ec;
  padding: 6px 10px;
  border-radius: 8px;
}
.field-label {
  font-size: 13px;
  font-weight: 600;
  color: #4b5563;
  margin-bottom: -4px;
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
  border: 1.5px solid #e5e7eb;
  border-radius: 999px;
  background: white;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;

  &:hover {
    border-color: #c0c4cc;
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
  color: #1f2937;
}
.readonly-line {
  margin: 0;
  font-size: 14px;
  color: #4b5563;

  &.note {
    font-style: italic;
    color: #6b7280;
  }
}
.trips-section {
  border-top: 1px solid #f0f0f0;
  padding-top: 12px;

  h4 {
    margin: 0 0 8px;
    font-size: 14px;
    color: #374151;
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
  background: #f9fafb;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 13px;
}
.trip-where {
  font-weight: 600;
  color: #1f2937;
}
.trip-time {
  color: #6b7280;
  font-size: 12px;
}
.trip-company {
  color: #9ca3af;
  font-size: 12px;
}
.no-trips {
  margin: 0;
  font-size: 13px;
  color: #9ca3af;
}

/* ─── Responsive ─── */
@media (max-width: 900px) {
  .attendance-container {
    padding: 20px 14px;
  }
  .davomat-body {
    flex-direction: column;
  }
  .employee-panel {
    width: 100%;
    max-height: none;
    flex-direction: column;
  }
  .employee-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .employee-item {
    flex: 0 0 auto;
  }
  .day-cell {
    padding: 4px;
  }
  .day-num {
    font-size: 12px;
  }
}
</style>
