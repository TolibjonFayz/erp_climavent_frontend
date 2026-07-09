<template>
  <div class="boss-container" v-loading="loading">
    <!-- Header -->
    <div class="boss-header">
      <div class="header-text">
        <h1>{{ $t('boss') }} <span class="boss-tag">{{ $t('bossBadge') }}</span></h1>
        <p class="subtitle">{{ $t('bossSubtitle') }}</p>
      </div>
      <div class="header-actions">
        <el-button :icon="Bell" @click="openAnnouncementDialog">{{ $t('newAnnouncement') }}</el-button>
        <el-button type="primary" :icon="Aim" @click="openTargetDialog()">{{ $t('setTarget') }}</el-button>
      </div>
    </div>

    <!-- KPI cards -->
    <div class="kpi-grid">
      <div class="kpi-card" v-for="k in kpis" :key="k.key" :style="{ '--accent': k.color }">
        <div class="kpi-icon" :style="{ background: k.color + '1a', color: k.color }">
          <el-icon :size="22"><component :is="k.icon" /></el-icon>
        </div>
        <div class="kpi-body">
          <div class="kpi-value">{{ k.value }}</div>
          <div class="kpi-label">{{ $t(k.label) }}</div>
        </div>
      </div>
    </div>

    <!-- Announcements -->
    <div v-if="bossStore.announcements.length" class="announcements-bar">
      <div v-for="a in bossStore.announcements.slice(0, 3)" :key="a.id" class="announcement-pill">
        <el-icon class="ann-icon"><Bell /></el-icon>
        <div class="ann-text">
          <b>{{ a.title }}</b>
          <span>{{ a.message }}</span>
        </div>
        <el-button text :icon="Close" size="small" @click="removeAnnouncement(a.id)" />
      </div>
    </div>

    <div class="boss-grid">
      <!-- Leaderboard -->
      <section class="panel leaderboard">
        <div class="panel-head">
          <h3>{{ $t('leaderboardTitle') }}</h3>
        </div>
        <div class="table-scroll">
          <table class="lb-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{{ $t('colEmployee') }}</th>
                <th class="num">{{ $t('colTrips') }}</th>
                <th class="num">{{ $t('colContracts') }}</th>
                <th class="num">{{ $t('colTasks') }}</th>
                <th>{{ $t('colTarget') }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in leaderboard" :key="row.id">
                <td class="rank" :class="`rank-${i + 1}`">{{ i + 1 }}</td>
                <td>
                  <div class="emp-cell">
                    <span class="emp-avatar">{{ initial(row) }}</span>
                    <span class="emp-name">
                      {{ row.firstname }} {{ row.lastname }}
                      <span v-if="row.is_admin" class="mini-badge">{{ $t('adminBadge') }}</span>
                    </span>
                  </div>
                </td>
                <td class="num">{{ row.trips }}</td>
                <td class="num strong">{{ row.contracts }}</td>
                <td class="num">{{ row.tasksDone }}</td>
                <td class="target-cell">
                  <template v-if="row.target">
                    <div class="target-bar">
                      <div
                        class="target-fill"
                        :style="{ width: targetPct(row) + '%', background: targetPct(row) >= 100 ? '#67c23a' : '#409eff' }"
                      ></div>
                    </div>
                    <span class="target-text">{{ row.targetProgress }}/{{ row.target.target_value }}</span>
                  </template>
                  <el-button v-else text size="small" :icon="Plus" @click="openTargetDialog(row)">
                    {{ $t('noTarget') }}
                  </el-button>
                </td>
                <td>
                  <el-popconfirm
                    :title="row.id === 16 ? '' : (row.is_admin ? $t('confirmRemoveAdmin') : $t('confirmMakeAdmin'))"
                    :confirm-button-text="$t('yeah')"
                    :cancel-button-text="$t('no')"
                    @confirm="toggleAdmin(row)"
                    :disabled="row.id === 16"
                  >
                    <template #reference>
                      <el-button
                        text
                        size="small"
                        :type="row.is_admin ? 'danger' : 'primary'"
                        :disabled="row.id === 16"
                      >
                        {{ row.is_admin ? $t('removeAdmin') : $t('makeAdmin') }}
                      </el-button>
                    </template>
                  </el-popconfirm>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Clients by type (donut) -->
      <section class="panel">
        <div class="panel-head"><h3>{{ $t('clientsByTypeTitle') }}</h3></div>
        <div class="donut-wrap">
          <svg viewBox="0 0 42 42" class="donut">
            <circle class="donut-ring" cx="21" cy="21" r="15.915" />
            <circle
              v-for="(seg, i) in donutSegments"
              :key="i"
              class="donut-seg"
              cx="21"
              cy="21"
              r="15.915"
              :stroke="seg.color"
              :stroke-dasharray="`${seg.pct} ${100 - seg.pct}`"
              :stroke-dashoffset="seg.offset"
            />
            <text x="21" y="20" class="donut-num">{{ partnersStore.allPartners.length }}</text>
            <text x="21" y="25" class="donut-cap">{{ $t('kpiPartners') }}</text>
          </svg>
          <div class="legend-list">
            <div v-for="(seg, i) in clientsByType" :key="i" class="legend-row">
              <span class="legend-dot" :style="{ background: seg.color }"></span>
              <span class="legend-name">{{ $t(seg.type) !== seg.type ? $t(seg.type) : seg.type }}</span>
              <span class="legend-val">{{ seg.count }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Contracts -->
      <section class="panel">
        <div class="panel-head">
          <h3>{{ $t('contractsTitle') }}</h3>
          <span class="head-stat">{{ $t('totalContracts') }}: {{ contractTrips.length }}</span>
        </div>
        <div class="trend-row">
          <div v-for="(m, i) in contractTrend" :key="i" class="trend-bar-wrap">
            <div class="trend-bar" :style="{ height: trendHeight(m.count) + '%' }">
              <span class="trend-val">{{ m.count }}</span>
            </div>
            <span class="trend-label">{{ m.label }}</span>
          </div>
        </div>
        <div class="contracts-list">
          <div v-if="!recentContracts.length" class="empty-line">{{ $t('noContracts') }}</div>
          <div v-for="(c, i) in recentContracts" :key="i" class="contract-item">
            <span class="contract-company">{{ c.company || c.whereto || '—' }}</span>
            <span class="contract-emp">{{ c.empName }}</span>
            <span class="contract-date">{{ c.date }}</span>
          </div>
        </div>
      </section>

      <!-- Attendance overview -->
      <section class="panel">
        <div class="panel-head"><h3>{{ $t('attendanceOverviewTitle') }}</h3></div>
        <div class="att-today">
          <div class="att-stat present">
            <div class="att-num">{{ presentToday }}</div>
            <div class="att-cap">{{ $t('presentLabel') }}</div>
          </div>
          <div class="att-stat absent">
            <div class="att-num">{{ absentToday }}</div>
            <div class="att-cap">{{ $t('absentLabel') }}</div>
          </div>
        </div>
        <div class="att-bars">
          <div v-for="s in attendanceByStatus" :key="s.key" class="att-bar-row">
            <span class="att-bar-dot" :style="{ background: s.color }"></span>
            <span class="att-bar-label">{{ $t(s.label) }}</span>
            <div class="att-bar-track">
              <div class="att-bar-fill" :style="{ width: s.pct + '%', background: s.color }"></div>
            </div>
            <span class="att-bar-val">{{ s.count }}</span>
          </div>
        </div>
      </section>

      <!-- By region -->
      <section class="panel">
        <div class="panel-head"><h3>{{ $t('byRegionTitle') }}</h3></div>
        <div class="region-bars">
          <div v-for="(r, i) in byRegion" :key="i" class="region-row">
            <span class="region-name">{{ r.region }}</span>
            <div class="region-track">
              <div class="region-fill" :style="{ width: regionPct(r.count) + '%' }"></div>
            </div>
            <span class="region-val">{{ r.count }}</span>
          </div>
        </div>
      </section>
    </div>

    <!-- Target dialog -->
    <el-dialog v-model="targetDialog" :title="$t('setTarget')" width="420px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item :label="$t('selectEmployeeLabel')">
          <el-select v-model="targetForm.user_id" filterable style="width: 100%" :placeholder="$t('selectEmployee')">
            <el-option
              v-for="u in usersStore.allUsers"
              :key="u.id"
              :label="`${u.firstname} ${u.lastname}`"
              :value="u.id"
            />
          </el-select>
        </el-form-item>
        <div class="form-row">
          <el-form-item :label="$t('metricLabel')" class="form-half">
            <el-select v-model="targetForm.metric" style="width: 100%">
              <el-option :label="$t('metricContracts')" value="contracts" />
              <el-option :label="$t('metricTrips')" value="trips" />
              <el-option :label="$t('metricTasks')" value="tasks" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('targetValueLabel')" class="form-half">
            <el-input-number v-model="targetForm.target_value" :min="1" :max="999" style="width: 100%" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="targetDialog = false">{{ $t('cancel') }}</el-button>
        <el-button type="primary" @click="saveTarget">{{ $t('save') }}</el-button>
      </template>
    </el-dialog>

    <!-- Announcement dialog -->
    <el-dialog v-model="announcementDialog" :title="$t('newAnnouncement')" width="460px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item :label="$t('announcementTitleLabel')">
          <el-input v-model="annForm.title" :placeholder="$t('announcementTitlePlaceholder')" maxlength="100" />
        </el-form-item>
        <el-form-item :label="$t('announcementMessageLabel')">
          <el-input v-model="annForm.message" type="textarea" :rows="3" :placeholder="$t('announcementMessagePlaceholder')" maxlength="400" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="announcementDialog = false">{{ $t('cancel') }}</el-button>
        <el-button type="primary" @click="saveAnnouncement">{{ $t('save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useUsersStore } from '@/stores/user'
import { usePartnersStore } from '@/stores/partners'
import { useComeAndGoInsideStore } from '@/stores/comeandgoInside'
import { useTasksStore } from '@/stores/tasks'
import { useAttendanceStore } from '@/stores/attendance'
import { useBossStore } from '@/stores/boss'
import { ElMessage } from 'element-plus'
import { Plus, Bell, Aim, Close, User, Briefcase, Promotion, Document, Check } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const usersStore = useUsersStore()
const partnersStore = usePartnersStore()
const comeandgoInsideStore = useComeAndGoInsideStore()
const tasksStore = useTasksStore()
const attendanceStore = useAttendanceStore()
const bossStore = useBossStore()

const currentUserId = Number(localStorage.getItem('userid'))
const loading = ref(false)

const pad = (n) => String(n).padStart(2, '0')
const now = new Date()
const month = ref(`${now.getFullYear()}-${pad(now.getMonth() + 1)}`)
const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`

const PALETTE = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399', '#9b59b6', '#1abc9c', '#34495e']

// ─── helpers ───
const initial = (u) => (u?.firstname ? u.firstname.charAt(0).toUpperCase() : '?')
const tripEmpId = (trip) => trip.come_and_go_father?.user_id
const isContract = (trip) => !!(trip.dogovorkp_number && String(trip.dogovorkp_number).trim())
const monthOf = (iso) => (iso ? String(iso).slice(0, 7) : '')

const trips = computed(() => comeandgoInsideStore.allComeAndGoInsides || [])
const contractTrips = computed(() => trips.value.filter(isContract))

// ─── KPIs ───
const kpis = computed(() => {
  const tasks = tasksStore.allTasks || []
  const doneTasks = tasks.filter((t) => t.status === 'done').length
  const taskRate = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0
  const tripsMonth = trips.value.filter((tr) => monthOf(tr.when_gone) === month.value).length
  const contractsMonth = contractTrips.value.filter(
    (tr) => monthOf(tr.dogovorkp_date || tr.when_gone) === month.value,
  ).length
  return [
    { key: 'emp', label: 'kpiEmployees', value: (usersStore.allUsers || []).length, color: '#409eff', icon: User },
    { key: 'part', label: 'kpiPartners', value: (partnersStore.allPartners || []).length, color: '#9b59b6', icon: Briefcase },
    { key: 'trips', label: 'kpiTripsMonth', value: tripsMonth, color: '#1abc9c', icon: Promotion },
    { key: 'contracts', label: 'kpiContractsMonth', value: contractsMonth, color: '#67c23a', icon: Document },
    { key: 'present', label: 'kpiPresentToday', value: presentToday.value, color: '#e6a23c', icon: Check },
    { key: 'taskrate', label: 'kpiTaskRate', value: taskRate + '%', color: '#f56c6c', icon: Check },
  ]
})

// ─── Leaderboard ───
const leaderboard = computed(() => {
  const tasks = tasksStore.allTasks || []
  const rows = (usersStore.allUsers || []).map((u) => {
    const empTrips = trips.value.filter((tr) => tripEmpId(tr) === u.id)
    const contracts = empTrips.filter(isContract).length
    const tasksDone = tasks.filter((tk) => tk.assigned_to === u.id && tk.status === 'done').length
    const target = (bossStore.targets || []).find((tg) => tg.user_id === u.id && tg.month === month.value)
    let targetProgress = 0
    if (target) {
      targetProgress =
        target.metric === 'trips'
          ? empTrips.length
          : target.metric === 'tasks'
            ? tasksDone
            : contracts
    }
    return { ...u, trips: empTrips.length, contracts, tasksDone, target, targetProgress }
  })
  return rows.sort((a, b) => b.trips - a.trips || b.contracts - a.contracts)
})

const targetPct = (row) =>
  row.target ? Math.min(100, Math.round((row.targetProgress / row.target.target_value) * 100)) : 0

// ─── Clients by type (donut) ───
const clientsByType = computed(() => {
  const map = {}
  for (const p of partnersStore.allPartners || []) {
    const type = p.partner_type || 'boshqa'
    map[type] = (map[type] || 0) + 1
  }
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count], i) => ({ type, count, color: PALETTE[i % PALETTE.length] }))
})

const donutSegments = computed(() => {
  const total = (partnersStore.allPartners || []).length || 1
  let offset = 25 // 12 o'rin (yuqori) dan boshlash
  return clientsByType.value.map((seg) => {
    const pct = (seg.count / total) * 100
    const s = { pct, offset, color: seg.color }
    offset = (offset - pct + 100) % 100
    return s
  })
})

// ─── Contracts ───
const recentContracts = computed(() => {
  const userMap = {}
  for (const u of usersStore.allUsers || []) userMap[u.id] = `${u.firstname} ${u.lastname}`
  return [...contractTrips.value]
    .sort((a, b) => new Date(b.dogovorkp_date || b.when_gone) - new Date(a.dogovorkp_date || a.when_gone))
    .slice(0, 8)
    .map((c) => ({
      company: c.company_name,
      whereto: c.whereto,
      empName: userMap[tripEmpId(c)] || '—',
      date: fmtDate(c.dogovorkp_date || c.when_gone),
    }))
})

const contractTrend = computed(() => {
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
    const count = contractTrips.value.filter(
      (tr) => monthOf(tr.dogovorkp_date || tr.when_gone) === key,
    ).length
    months.push({ key, count, label: uzMonthsShort[d.getMonth()] })
  }
  return months
})
const uzMonthsShort = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']
const trendMax = computed(() => Math.max(1, ...contractTrend.value.map((m) => m.count)))
const trendHeight = (c) => Math.round((c / trendMax.value) * 100)

const fmtDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

// ─── Attendance ───
const absentToday = computed(
  () => (attendanceStore.allRecords || []).filter((a) => a.date === todayStr && a.status === 'absent').length,
)
const presentToday = computed(() => {
  const emp = (usersStore.allUsers || []).length
  return Math.max(0, emp - absentToday.value)
})
const ATT_STATUSES = [
  { key: 'direct_object', label: 'statusDirectObject', color: '#67c23a' },
  { key: 'office_then_object', label: 'statusOfficeThenObject', color: '#e6a23c' },
  { key: 'office', label: 'statusOffice', color: '#409eff' },
  { key: 'absent', label: 'statusAbsent', color: '#f56c6c' },
  { key: 'dayoff', label: 'statusDayoff', color: '#c0c4cc' },
]
const attendanceByStatus = computed(() => {
  const recs = attendanceStore.allRecords || []
  const total = recs.length || 1
  return ATT_STATUSES.map((s) => {
    const count = recs.filter((a) => a.status === s.key).length
    return { ...s, count, pct: Math.round((count / total) * 100) }
  })
})

// ─── By region ───
const byRegion = computed(() => {
  const map = {}
  for (const p of partnersStore.allPartners || []) {
    const r = p.viloyat || p.republic || '—'
    map[r] = (map[r] || 0) + 1
  }
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([region, count]) => ({ region, count }))
})
const regionMax = computed(() => Math.max(1, ...byRegion.value.map((r) => r.count)))
const regionPct = (c) => Math.round((c / regionMax.value) * 100)

// ─── Actions ───
const targetDialog = ref(false)
const targetForm = reactive({ user_id: null, metric: 'contracts', target_value: 10 })
const openTargetDialog = (row) => {
  targetForm.user_id = row ? row.id : null
  targetForm.metric = 'contracts'
  targetForm.target_value = 10
  targetDialog.value = true
}
const saveTarget = async () => {
  if (!targetForm.user_id) return
  try {
    await bossStore.upsertTarget({
      user_id: targetForm.user_id,
      month: month.value,
      metric: targetForm.metric,
      target_value: targetForm.target_value,
      created_by: currentUserId,
    })
    ElMessage.success(t('targetSaved'))
    targetDialog.value = false
    await bossStore.getTargets(month.value)
  } catch {
    ElMessage.error(t('xatolikYuzBerdi'))
  }
}

const announcementDialog = ref(false)
const annForm = reactive({ title: '', message: '' })
const openAnnouncementDialog = () => {
  annForm.title = ''
  annForm.message = ''
  announcementDialog.value = true
}
const saveAnnouncement = async () => {
  if (!annForm.title.trim() || !annForm.message.trim()) return
  try {
    await bossStore.createAnnouncement({
      title: annForm.title.trim(),
      message: annForm.message.trim(),
      created_by: currentUserId,
    })
    ElMessage.success(t('announcementCreated'))
    announcementDialog.value = false
    await bossStore.getAnnouncements()
  } catch {
    ElMessage.error(t('xatolikYuzBerdi'))
  }
}
const removeAnnouncement = async (id) => {
  try {
    await bossStore.deleteAnnouncement(id)
    ElMessage.success(t('announcementDeleted'))
    await bossStore.getAnnouncements()
  } catch {
    ElMessage.error(t('xatolikYuzBerdi'))
  }
}

const toggleAdmin = async (row) => {
  if (row.id === 16) return
  try {
    await bossStore.setAdmin(row.id, !row.is_admin)
    ElMessage.success(t('adminChanged'))
    await usersStore.getAllUsers()
  } catch {
    ElMessage.error(t('xatolikYuzBerdi'))
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      usersStore.getAllUsers(),
      partnersStore.getAllPartners(),
      comeandgoInsideStore.getAllComeAndGoInside(),
      tasksStore.getAllTasks(),
      attendanceStore.getAllMonth(month.value),
      bossStore.getTargets(month.value),
      bossStore.getAnnouncements(),
    ])
  } catch (e) {
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
.boss-container {
  width: 100%;
  padding: 28px 32px;
  background: #f5f7fa;
  min-height: 100vh;
  box-sizing: border-box;
}

.boss-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 22px;
}
.header-text h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 10px;
}
.boss-tag {
  font-size: 12px;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #f59e0b, #f56c6c);
  padding: 3px 10px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.header-text .subtitle {
  margin: 4px 0 0;
  font-size: 14px;
  color: #6b7280;
}
.header-actions {
  display: flex;
  gap: 10px;
}

/* KPI */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}
.kpi-card {
  background: white;
  border-radius: 14px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border-bottom: 3px solid var(--accent);
}
.kpi-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.kpi-value {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.1;
}
.kpi-label {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

/* Announcements */
.announcements-bar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.announcement-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff8e6;
  border: 1px solid #fde2b3;
  border-radius: 12px;
  padding: 10px 14px;
  flex: 1;
  min-width: 260px;
}
.ann-icon {
  color: #e6a23c;
  flex-shrink: 0;
}
.ann-text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.ann-text b {
  font-size: 13px;
  color: #1f2937;
}
.ann-text span {
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Grid */
.boss-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 18px;
  align-items: start;
}
.panel {
  background: white;
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}
.leaderboard {
  grid-row: span 2;
}
.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}
.panel-head h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}
.head-stat {
  font-size: 13px;
  color: #6b7280;
}

/* Leaderboard table */
.table-scroll {
  overflow-x: auto;
}
.lb-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.lb-table th {
  text-align: left;
  color: #9ca3af;
  font-weight: 600;
  padding: 8px 10px;
  border-bottom: 1px solid #f0f0f0;
  white-space: nowrap;
}
.lb-table th.num {
  text-align: center;
}
.lb-table td {
  padding: 10px;
  border-bottom: 1px solid #f7f7f7;
}
.lb-table td.num {
  text-align: center;
  color: #4b5563;
}
.lb-table td.num.strong {
  font-weight: 700;
  color: #67c23a;
}
.rank {
  font-weight: 700;
  color: #9ca3af;
  width: 30px;
}
.rank-1 {
  color: #f59e0b;
}
.rank-2 {
  color: #94a3b8;
}
.rank-3 {
  color: #cd7f32;
}
.emp-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.emp-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #409eff;
  color: white;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.emp-name {
  white-space: nowrap;
}
.mini-badge {
  font-size: 10px;
  background: #ecf5ff;
  color: #409eff;
  padding: 1px 6px;
  border-radius: 6px;
  margin-left: 4px;
}
.target-cell {
  min-width: 120px;
}
.target-bar {
  height: 6px;
  background: #f0f0f0;
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 3px;
}
.target-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease;
}
.target-text {
  font-size: 11px;
  color: #6b7280;
}

/* Donut */
.donut-wrap {
  display: flex;
  align-items: center;
  gap: 18px;
}
.donut {
  width: 130px;
  height: 130px;
  flex-shrink: 0;
}
.donut-ring {
  fill: none;
  stroke: #f0f0f0;
  stroke-width: 4;
}
.donut-seg {
  fill: none;
  stroke-width: 4;
  transition: stroke-dasharray 0.4s ease;
}
.donut-num {
  font-size: 7px;
  font-weight: 700;
  fill: #1f2937;
  text-anchor: middle;
}
.donut-cap {
  font-size: 2.6px;
  fill: #9ca3af;
  text-anchor: middle;
  text-transform: uppercase;
}
.legend-list {
  flex: 1;
  min-width: 0;
}
.legend-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 0;
  font-size: 13px;
}
.legend-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}
.legend-name {
  flex: 1;
  color: #4b5563;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.legend-val {
  font-weight: 600;
  color: #1f2937;
}

/* Contracts trend */
.trend-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 90px;
  margin-bottom: 14px;
  padding-top: 14px;
}
.trend-bar-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
  gap: 4px;
}
.trend-bar {
  width: 70%;
  background: linear-gradient(180deg, #67c23a, #95d475);
  border-radius: 6px 6px 0 0;
  position: relative;
  min-height: 3px;
  transition: height 0.3s ease;
}
.trend-val {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  font-weight: 600;
  color: #4b5563;
}
.trend-label {
  font-size: 11px;
  color: #9ca3af;
}
.contracts-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.contract-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 0;
  border-bottom: 1px solid #f7f7f7;
  font-size: 13px;
}
.contract-company {
  flex: 1;
  font-weight: 500;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.contract-emp {
  color: #6b7280;
  font-size: 12px;
}
.contract-date {
  color: #9ca3af;
  font-size: 12px;
  white-space: nowrap;
}
.empty-line {
  color: #9ca3af;
  font-size: 13px;
  padding: 10px 0;
  text-align: center;
}

/* Attendance */
.att-today {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.att-stat {
  flex: 1;
  border-radius: 12px;
  padding: 14px;
  text-align: center;
}
.att-stat.present {
  background: #f0f9eb;
}
.att-stat.absent {
  background: #fef0f0;
}
.att-num {
  font-size: 26px;
  font-weight: 700;
}
.att-stat.present .att-num {
  color: #67c23a;
}
.att-stat.absent .att-num {
  color: #f56c6c;
}
.att-cap {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}
.att-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.att-bar-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}
.att-bar-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.att-bar-label {
  width: 110px;
  color: #4b5563;
  flex-shrink: 0;
}
.att-bar-track {
  flex: 1;
  height: 6px;
  background: #f0f0f0;
  border-radius: 999px;
  overflow: hidden;
}
.att-bar-fill {
  height: 100%;
  border-radius: 999px;
}
.att-bar-val {
  width: 24px;
  text-align: right;
  color: #6b7280;
}

/* Region */
.region-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.region-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}
.region-name {
  width: 90px;
  color: #4b5563;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
}
.region-track {
  flex: 1;
  height: 14px;
  background: #f0f0f0;
  border-radius: 6px;
  overflow: hidden;
}
.region-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff, #79bbff);
  border-radius: 6px;
  transition: width 0.3s ease;
}
.region-val {
  width: 24px;
  text-align: right;
  font-weight: 600;
  color: #1f2937;
}

.form-row {
  display: flex;
  gap: 14px;
}
.form-half {
  flex: 1;
}

/* Responsive */
@media (max-width: 1100px) {
  .kpi-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .boss-grid {
    grid-template-columns: 1fr;
  }
  .leaderboard {
    grid-row: auto;
  }
}
@media (max-width: 768px) {
  .boss-container {
    padding: 20px 14px;
  }
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
