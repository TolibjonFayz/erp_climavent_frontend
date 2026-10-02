<template>
  <UiPage v-loading="loading" :subtitle="$t('bossSubtitle')" wide>
    <template #title>
      <h1 class="bs-title">
        {{ $t('boss') }}
        <el-tag type="warning" size="small" effect="plain">{{ $t('bossBadge') }}</el-tag>
      </h1>
    </template>
    <template #actions>
      <el-button :icon="Bell" @click="openAnnouncementDialog">
        {{ $t('newAnnouncement') }}
      </el-button>
      <el-button type="primary" :icon="Aim" @click="openTargetDialog()">
        {{ $t('setTarget') }}
      </el-button>
    </template>

    <!-- Asosiy ko'rsatkichlar -->
    <div class="bs-kpis">
      <UiStat
        v-for="k in kpis"
        :key="k.key"
        :label="$t(k.label)"
        :tone="k.tone"
        :value="k.value"
        :sub="k.sub"
      />
    </div>

    <!-- E'lonlar -->
    <UiPanel
      v-if="bossStore.announcements.length"
      :title="$t('bsAnnouncements')"
      :icon="Bell"
      flush
    >
      <template #actions>{{ bossStore.announcements.length }}</template>
      <ul class="bs-ann">
        <li v-for="a in bossStore.announcements.slice(0, 3)" :key="a.id" class="bs-ann__item">
          <div class="bs-ann__text">
            <b>{{ a.title }}</b>
            <span>{{ a.message }}</span>
          </div>
          <el-tooltip :content="$t('delete')" placement="top">
            <el-button text :icon="Close" size="small" @click="removeAnnouncement(a.id)" />
          </el-tooltip>
        </li>
      </ul>
    </UiPanel>

    <div class="bs-grid">
      <!-- Reyting -->
      <UiPanel class="bs-leader" :title="$t('leaderboardTitle')" :icon="Trophy" flush>
        <template #actions>{{ leaderboard.length }}</template>
        <div class="bs-table-scroll">
          <table class="bs-table">
            <thead>
              <tr>
                <th class="is-rank">#</th>
                <th>{{ $t('colEmployee') }}</th>
                <th class="is-num">{{ $t('colTrips') }}</th>
                <th class="is-num">{{ $t('colContracts') }}</th>
                <th class="is-num">{{ $t('colTasks') }}</th>
                <th>{{ $t('colTarget') }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in leaderboard" :key="row.id">
                <td class="is-rank" :class="i < 3 && `is-top${i + 1}`">{{ i + 1 }}</td>
                <td>
                  <div class="bs-emp">
                    <span class="bs-avatar">{{ initial(row) }}</span>
                    <span class="bs-emp__name">{{ row.firstname }} {{ row.lastname }}</span>
                    <el-tag v-if="row.is_admin" size="small" effect="plain">
                      {{ $t('adminBadge') }}
                    </el-tag>
                  </div>
                </td>
                <td class="is-num">{{ fmtNum(row.trips) }}</td>
                <td class="is-num is-strong">{{ fmtNum(row.contracts) }}</td>
                <td class="is-num">{{ fmtNum(row.tasksDone) }}</td>
                <td class="bs-target">
                  <template v-if="row.target">
                    <div class="bs-bar">
                      <div
                        class="bs-bar__fill"
                        :class="{ 'is-done': targetPct(row) >= 100 }"
                        :style="{ width: targetPct(row) + '%' }"
                      ></div>
                    </div>
                    <span class="bs-target__text">
                      {{ row.targetProgress }}/{{ row.target.target_value }} · {{ targetPct(row) }}%
                    </span>
                  </template>
                  <el-button
                    v-else
                    link
                    type="primary"
                    size="small"
                    :icon="Plus"
                    @click="openTargetDialog(row)"
                  >
                    {{ $t('noTarget') }}
                  </el-button>
                </td>
                <td class="is-actions">
                  <el-popconfirm
                    :title="
                      row.id === 16
                        ? ''
                        : row.is_admin
                          ? $t('confirmRemoveAdmin')
                          : $t('confirmMakeAdmin')
                    "
                    :confirm-button-text="$t('yeah')"
                    :cancel-button-text="$t('no')"
                    :disabled="row.id === 16"
                    @confirm="toggleAdmin(row)"
                  >
                    <template #reference>
                      <el-button
                        link
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
      </UiPanel>

      <!-- Mijozlar turi bo'yicha -->
      <UiPanel :title="$t('clientsByTypeTitle')" :icon="PieChart">
        <div class="bs-donut">
          <svg viewBox="0 0 42 42" class="bs-donut__svg">
            <circle class="bs-donut__ring" cx="21" cy="21" r="15.915" />
            <circle
              v-for="(seg, i) in donutSegments"
              :key="i"
              class="bs-donut__seg"
              cx="21"
              cy="21"
              r="15.915"
              :stroke="seg.color"
              :stroke-dasharray="`${seg.pct} ${100 - seg.pct}`"
              :stroke-dashoffset="seg.offset"
            />
            <text x="21" y="20" class="bs-donut__num">
              {{ fmtNum(partnersStore.allPartners.length) }}
            </text>
            <text x="21" y="25" class="bs-donut__cap">{{ $t('kpiPartners') }}</text>
          </svg>
          <div class="bs-legend">
            <div v-for="(seg, i) in clientsByType" :key="i" class="bs-legend__row">
              <span class="bs-dot" :style="{ background: seg.color }"></span>
              <span class="bs-legend__name">
                {{ $t(seg.type) !== seg.type ? $t(seg.type) : seg.type }}
              </span>
              <span class="bs-legend__val">{{ fmtNum(seg.count) }}</span>
            </div>
          </div>
        </div>
      </UiPanel>

      <!-- Shartnomalar -->
      <UiPanel :title="$t('contractsTitle')" :icon="Document">
        <template #actions>{{ $t('totalContracts') }}: {{ fmtNum(contractTrips.length) }}</template>
        <div class="bs-trend">
          <div v-for="(m, i) in contractTrend" :key="i" class="bs-trend__col">
            <div class="bs-trend__bar" :style="{ height: trendHeight(m.count) + '%' }">
              <span class="bs-trend__val">{{ m.count }}</span>
            </div>
            <span class="bs-trend__label">{{ m.label }}</span>
          </div>
        </div>
        <div class="bs-list">
          <div v-if="!recentContracts.length" class="bs-empty">{{ $t('noContracts') }}</div>
          <div v-for="(c, i) in recentContracts" :key="i" class="bs-list__row">
            <span class="bs-list__main">{{ c.company || c.whereto || '—' }}</span>
            <span class="bs-list__sub">{{ c.empName }}</span>
            <span class="bs-list__date">{{ c.date }}</span>
          </div>
        </div>
      </UiPanel>

      <!-- Davomat -->
      <UiPanel :title="$t('attendanceOverviewTitle')" :icon="Calendar">
        <div class="bs-today">
          <div class="bs-today__cell is-good">
            <span class="bs-today__num">{{ fmtNum(presentToday) }}</span>
            <span class="bs-today__cap">{{ $t('presentLabel') }}</span>
          </div>
          <div class="bs-today__cell is-bad">
            <span class="bs-today__num">{{ fmtNum(absentToday) }}</span>
            <span class="bs-today__cap">{{ $t('absentLabel') }}</span>
          </div>
        </div>
        <div class="bs-hbars">
          <div v-for="s in attendanceByStatus" :key="s.key" class="bs-hbar">
            <span class="bs-dot" :style="{ background: s.color }"></span>
            <span class="bs-hbar__label">{{ $t(s.label) }}</span>
            <div class="bs-hbar__track">
              <div class="bs-hbar__fill" :style="{ width: s.pct + '%', background: s.color }"></div>
            </div>
            <span class="bs-hbar__val">{{ s.count }}</span>
          </div>
        </div>
      </UiPanel>

      <!-- Hududlar -->
      <UiPanel :title="$t('byRegionTitle')" :icon="Location">
        <div class="bs-hbars">
          <div v-for="(r, i) in byRegion" :key="i" class="bs-hbar">
            <span class="bs-hbar__label is-wide" :title="r.region">{{ r.region }}</span>
            <div class="bs-hbar__track">
              <div class="bs-hbar__fill is-link" :style="{ width: regionPct(r.count) + '%' }"></div>
            </div>
            <span class="bs-hbar__val">{{ fmtNum(r.count) }}</span>
          </div>
        </div>
      </UiPanel>
    </div>

    <!-- amoCRM: qo'ng'iroqlar va sdelkalar -->
    <AmoCrmStats class="bs-amo" />

    <!-- Target dialog -->
    <el-dialog v-model="targetDialog" :title="$t('setTarget')" width="420px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item :label="$t('selectEmployeeLabel')">
          <el-select
            v-model="targetForm.user_id"
            filterable
            style="width: 100%"
            :placeholder="$t('selectEmployee')"
          >
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
            <el-input-number
              v-model="targetForm.target_value"
              :min="1"
              :max="999"
              style="width: 100%"
            />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="targetDialog = false">{{ $t('cancel') }}</el-button>
        <el-button type="primary" @click="saveTarget">{{ $t('save') }}</el-button>
      </template>
    </el-dialog>

    <!-- Announcement dialog -->
    <el-dialog
      v-model="announcementDialog"
      :title="$t('newAnnouncement')"
      width="460px"
      destroy-on-close
    >
      <el-form label-position="top">
        <el-form-item :label="$t('announcementTitleLabel')">
          <el-input
            v-model="annForm.title"
            :placeholder="$t('announcementTitlePlaceholder')"
            maxlength="100"
          />
        </el-form-item>
        <el-form-item :label="$t('announcementMessageLabel')">
          <el-input
            v-model="annForm.message"
            type="textarea"
            :rows="3"
            :placeholder="$t('announcementMessagePlaceholder')"
            maxlength="400"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="announcementDialog = false">{{ $t('cancel') }}</el-button>
        <el-button type="primary" @click="saveAnnouncement">{{ $t('save') }}</el-button>
      </template>
    </el-dialog>
  </UiPage>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useUsersStore } from '@/stores/user'
import { usePartnersStore } from '@/stores/partners'
import { useComeAndGoInsideStore } from '@/stores/comeandgoInside'
import { useTasksStore } from '@/stores/tasks'
import { useAttendanceStore } from '@/stores/attendance'
import { useBossStore } from '@/stores/boss'
import AmoCrmStats from '@/components/amocrm/AmoCrmStats.vue'
import { ElMessage } from 'element-plus'
import {
  Aim,
  Bell,
  Calendar,
  Close,
  Document,
  Location,
  PieChart,
  Plus,
  Trophy,
} from '@element-plus/icons-vue'
import UiPage from '@/components/ui/UiPage.vue'
import UiStat from '@/components/ui/UiStat.vue'
import UiPanel from '@/components/ui/UiPanel.vue'
import { fmtNum } from '@/utils/format'
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

const PALETTE = [
  '#2a78d6',
  '#15803d',
  '#d97706',
  '#b91c1c',
  '#64748b',
  '#7c3aed',
  '#0d9488',
  '#334155',
]

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
  const users = usersStore.allUsers || []
  const admins = users.filter((u) => u.is_admin).length
  const monthCaption = `${uzMonthsShort[now.getMonth()]} ${now.getFullYear()}`
  return [
    {
      key: 'emp',
      label: 'kpiEmployees',
      value: fmtNum(users.length),
      sub: t('bsAdminsSub', { n: admins }),
    },
    {
      key: 'part',
      label: 'kpiPartners',
      value: fmtNum((partnersStore.allPartners || []).length),
      sub: t('bsTypesSub', { n: clientsByType.value.length }),
    },
    { key: 'trips', label: 'kpiTripsMonth', value: fmtNum(tripsMonth), sub: monthCaption },
    {
      key: 'contracts',
      label: 'kpiContractsMonth',
      tone: 'good',
      value: fmtNum(contractsMonth),
      sub: monthCaption,
    },
    {
      key: 'present',
      label: 'kpiPresentToday',
      tone: 'good',
      value: fmtNum(presentToday.value),
      sub: t('bsAbsentSub', { n: absentToday.value }),
    },
    {
      key: 'taskrate',
      label: 'kpiTaskRate',
      tone: taskRate < 50 && tasks.length ? 'warn' : '',
      value: taskRate + '%',
      sub: t('bsTasksSub', { done: doneTasks, total: tasks.length }),
    },
  ]
})

// ─── Leaderboard ───
const leaderboard = computed(() => {
  const tasks = tasksStore.allTasks || []
  const rows = (usersStore.allUsers || []).map((u) => {
    const empTrips = trips.value.filter((tr) => tripEmpId(tr) === u.id)
    const contracts = empTrips.filter(isContract).length
    const tasksDone = tasks.filter((tk) => tk.assigned_to === u.id && tk.status === 'done').length
    const target = (bossStore.targets || []).find(
      (tg) => tg.user_id === u.id && tg.month === month.value,
    )
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
    .sort(
      (a, b) =>
        new Date(b.dogovorkp_date || b.when_gone) - new Date(a.dogovorkp_date || a.when_gone),
    )
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
const uzMonthsShort = [
  'Yan',
  'Fev',
  'Mar',
  'Apr',
  'May',
  'Iyn',
  'Iyl',
  'Avg',
  'Sen',
  'Okt',
  'Noy',
  'Dek',
]
const trendMax = computed(() => Math.max(1, ...contractTrend.value.map((m) => m.count)))
const trendHeight = (c) => Math.round((c / trendMax.value) * 100)

const fmtDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

// ─── Attendance ───
const absentToday = computed(
  () =>
    (attendanceStore.allRecords || []).filter((a) => a.date === todayStr && a.status === 'absent')
      .length,
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
.bs-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.25;
  color: var(--ui-ink);
}
.bs-kpis {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}

/* ─── E'lonlar ─── */
.bs-ann {
  margin: 0;
  padding: 0;
  list-style: none;
}
.bs-ann__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--ui-line-soft);

  &:last-child {
    border-bottom: none;
  }
}
.bs-ann__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;

  b {
    font-size: 13px;
    color: var(--ui-ink);
  }
  span {
    font-size: 12px;
    color: var(--ui-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

/* ─── Joylashuv ─── */
.bs-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}
.bs-leader {
  grid-row: span 2;
}

/* ─── Reyting jadvali ─── */
.bs-table-scroll {
  overflow-x: auto;
}
.bs-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  th {
    padding: 10px;
    font-size: 11px;
    font-weight: 600;
    text-align: left;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
    color: var(--ui-muted);
    background: var(--ui-surface-2);
    border-bottom: 1px solid var(--ui-line);
  }
  td {
    padding: 9px 10px;
    color: var(--ui-ink-2);
    border-bottom: 1px solid var(--ui-line-soft);
  }
  tbody tr:hover td {
    background: var(--ui-surface-2);
  }
  tbody tr:last-child td {
    border-bottom: none;
  }
  .is-num {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .is-strong {
    font-weight: 700;
    color: var(--ui-good);
  }
  .is-rank {
    width: 36px;
    font-weight: 700;
    color: var(--ui-faint);
    font-variant-numeric: tabular-nums;
  }
  .is-top1 {
    color: #d97706;
  }
  .is-top2 {
    color: #64748b;
  }
  .is-top3 {
    color: #b45309;
  }
  .is-actions {
    text-align: right;
    white-space: nowrap;
  }
}
.bs-emp {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bs-emp__name {
  min-width: 0;
  font-weight: 500;
  line-height: 1.35;
  color: var(--ui-ink);
}
.bs-avatar {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 700;
  color: var(--ui-link);
  background: var(--ui-link-soft);
  border-radius: 50%;
}
.bs-target {
  min-width: 110px;
}
.bs-bar {
  height: 6px;
  margin-bottom: 4px;
  overflow: hidden;
  background: var(--ui-line-soft);
  border-radius: 999px;
}
.bs-bar__fill {
  height: 100%;
  background: var(--ui-link);
  border-radius: 999px;
  transition: width 0.3s ease;

  &.is-done {
    background: var(--ui-good);
  }
}
.bs-target__text {
  font-size: 11px;
  color: var(--ui-muted);
  font-variant-numeric: tabular-nums;
}

/* ─── Donut ─── */
.bs-donut {
  display: flex;
  align-items: center;
  gap: 18px;
}
.bs-donut__svg {
  width: 128px;
  height: 128px;
  flex-shrink: 0;
}
.bs-donut__ring {
  fill: none;
  stroke: var(--ui-line-soft);
  stroke-width: 4;
}
.bs-donut__seg {
  fill: none;
  stroke-width: 4;
  transition: stroke-dasharray 0.4s ease;
}
.bs-donut__num {
  font-size: 7px;
  font-weight: 700;
  fill: var(--ui-ink);
  text-anchor: middle;
}
.bs-donut__cap {
  font-size: 2.6px;
  fill: var(--ui-muted);
  text-anchor: middle;
  text-transform: uppercase;
}
.bs-legend {
  flex: 1;
  min-width: 0;
}
.bs-legend__row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 13px;
  border-bottom: 1px dashed var(--ui-line);

  &:last-child {
    border-bottom: none;
  }
}
.bs-legend__name {
  flex: 1;
  color: var(--ui-ink-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bs-legend__val {
  font-weight: 600;
  color: var(--ui-ink);
  font-variant-numeric: tabular-nums;
}
.bs-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}

/* ─── Shartnomalar ─── */
.bs-trend {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 96px;
  margin-bottom: 12px;
  padding: 16px 0 0;
  border-bottom: 1px solid var(--ui-line-soft);
}
.bs-trend__col {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  gap: 4px;
  padding-bottom: 6px;
}
.bs-trend__bar {
  position: relative;
  width: 60%;
  min-height: 2px;
  background: var(--ui-good);
  border-radius: 3px 3px 0 0;
  opacity: 0.85;
  transition: height 0.3s ease;
}
.bs-trend__val {
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  font-weight: 600;
  color: var(--ui-ink-2);
}
.bs-trend__label {
  font-size: 11px;
  color: var(--ui-muted);
}
.bs-list__row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 0;
  font-size: 13px;
  border-bottom: 1px dashed var(--ui-line);

  &:last-child {
    border-bottom: none;
  }
}
.bs-list__main {
  flex: 1;
  min-width: 0;
  font-weight: 500;
  color: var(--ui-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bs-list__sub {
  font-size: 12px;
  color: var(--ui-muted);
  white-space: nowrap;
}
.bs-list__date {
  font-size: 12px;
  color: var(--ui-faint);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.bs-empty {
  padding: 10px 0;
  font-size: 13px;
  text-align: center;
  color: var(--ui-faint);
}

/* ─── Davomat ─── */
.bs-today {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 14px;
}
.bs-today__cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border: 1px solid var(--ui-line);
  border-radius: 8px;
}
.bs-today__num {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}
.bs-today__cell.is-good .bs-today__num {
  color: var(--ui-good);
}
.bs-today__cell.is-bad .bs-today__num {
  color: var(--ui-bad);
}
.bs-today__cap {
  font-size: 12px;
  color: var(--ui-muted);
}

/* ─── Gorizontal ustunlar ─── */
.bs-hbars {
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.bs-hbar {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}
.bs-hbar__label {
  width: 120px;
  flex-shrink: 0;
  color: var(--ui-ink-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &.is-wide {
    width: 110px;
    font-size: 13px;
  }
}
.bs-hbar__track {
  flex: 1;
  height: 8px;
  overflow: hidden;
  background: var(--ui-line-soft);
  border-radius: 999px;
}
.bs-hbar__fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease;

  &.is-link {
    background: var(--ui-link);
  }
}
.bs-hbar__val {
  min-width: 28px;
  text-align: right;
  font-weight: 600;
  color: var(--ui-ink);
  font-variant-numeric: tabular-nums;
}

/* ─── Dialoglar ─── */
.form-row {
  display: flex;
  gap: 14px;
}
.form-half {
  flex: 1;
}

@media (max-width: 1280px) {
  .bs-kpis {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 1100px) {
  .bs-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .bs-leader {
    grid-row: auto;
  }
}
@media (max-width: 768px) {
  .bs-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
