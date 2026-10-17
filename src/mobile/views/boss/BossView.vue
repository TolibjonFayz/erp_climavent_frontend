<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showConfirmDialog, showFailToast, showSuccessToast } from 'vant'
import { showActionSheet } from '../../actionSheet'
import { useUsersStore } from '@/stores/user'
import { usePartnersStore } from '@/stores/partners'
import { useComeAndGoInsideStore } from '@/stores/comeandgoInside'
import { useTasksStore } from '@/stores/tasks'
import { useAttendanceStore } from '@/stores/attendance'
import { useBossStore } from '@/stores/boss'
import { fmtNum, formatDate } from '@/utils/format'
import { partnerTypeLabel } from '@/utils/partners'
import MPage from '../../components/MPage.vue'
import MStats from '../../components/MStats.vue'
import MSheet from '../../components/MSheet.vue'
import MSelectSheet from '../../components/MSelectSheet.vue'
import { formatPlace } from '../customers/place'
import { personName } from '../tasks/taskRules'
import { useSession, BOSS_USER_ID } from '../../session'
import { avatarColor, errorText, initials, smartDate } from '../../utils'

const { t, locale } = useI18n()
const router = useRouter()
const usersStore = useUsersStore()
const partnersStore = usePartnersStore()
const insideStore = useComeAndGoInsideStore()
const tasksStore = useTasksStore()
const attendanceStore = useAttendanceStore()
const bossStore = useBossStore()
const { can } = useSession()
const currentUserId = Number(localStorage.getItem('userid'))

const pad = (n) => String(n).padStart(2, '0')
const now = new Date()
const month = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`
const todayStr = `${month}-${pad(now.getDate())}`
const MONTHS_SHORT = {
  uz: ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'],
  ru: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
}
const monthsShort = computed(() => MONTHS_SHORT[locale.value] || MONTHS_SHORT.uz)
const PALETTE = ['#2a78d6', '#15803d', '#d97706', '#b91c1c', '#64748b', '#7c3aed', '#0d9488', '#334155']

const loading = ref(true)
async function load() {
  try {
    await Promise.all([
      usersStore.getAllUsers(),
      partnersStore.getAllPartners(),
      insideStore.getAllComeAndGoInside(),
      tasksStore.getAllTasks(),
      attendanceStore.getAllMonth(month),
      bossStore.getTargets(month),
      bossStore.getAnnouncements(),
    ])
  } catch (e) {
    showFailToast(errorText(e, t, locale.value))
  } finally {
    loading.value = false
  }
}
onMounted(load)

// ─── Saytdagi BossDashboard hisob-kitoblari ───
const users = computed(() => usersStore.allUsers || [])
const partners = computed(() => partnersStore.allPartners || [])
const trips = computed(() => insideStore.allComeAndGoInsides || [])
const tasks = computed(() => tasksStore.allTasks || [])
const tripEmpId = (trip) => trip.come_and_go_father?.user_id
const isContract = (trip) => !!(trip.dogovorkp_number && String(trip.dogovorkp_number).trim())
const monthOf = (iso) => (iso ? String(iso).slice(0, 7) : '')
const contractTrips = computed(() => trips.value.filter(isContract))

const absentToday = computed(
  () =>
    (attendanceStore.allRecords || []).filter((a) => a.date === todayStr && a.status === 'absent')
      .length,
)
const clientsByType = computed(() => {
  const m = {}
  for (const p of partners.value) {
    const type = p.partner_type || 'boshqa'
    m[type] = (m[type] || 0) + 1
  }
  return Object.entries(m)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count], i) => ({ type, count, color: PALETTE[i % PALETTE.length] }))
})

const kpis = computed(() => {
  const done = tasks.value.filter((x) => x.status === 'done').length
  const rate = tasks.value.length ? Math.round((done / tasks.value.length) * 100) : 0
  const caption = `${monthsShort.value[now.getMonth()]} ${now.getFullYear()}`
  return [
    {
      key: 'present',
      label: t('kpiPresentToday'),
      value: fmtNum(Math.max(0, users.value.length - absentToday.value)),
      sub: t('bsAbsentSub', { n: absentToday.value }),
      tone: 'good',
    },
    {
      key: 'trips',
      label: t('kpiTripsMonth'),
      value: fmtNum(trips.value.filter((tr) => monthOf(tr.when_gone) === month).length),
      sub: caption,
    },
    {
      key: 'contracts',
      label: t('kpiContractsMonth'),
      value: fmtNum(
        contractTrips.value.filter((tr) => monthOf(tr.dogovorkp_date || tr.when_gone) === month).length,
      ),
      sub: caption,
      tone: 'good',
    },
    {
      key: 'taskrate',
      label: t('kpiTaskRate'),
      value: `${rate}%`,
      sub: t('bsTasksSub', { done, total: tasks.value.length }),
      tone: rate < 50 && tasks.value.length ? 'warn' : '',
    },
    {
      key: 'emp',
      label: t('kpiEmployees'),
      value: fmtNum(users.value.length),
      sub: t('bsAdminsSub', { n: users.value.filter((u) => u.is_admin).length }),
    },
    {
      key: 'part',
      label: t('kpiPartners'),
      value: fmtNum(partners.value.length),
      sub: t('bsTypesSub', { n: clientsByType.value.length }),
    },
  ]
})

const leaderboard = computed(() =>
  users.value
    .map((u) => {
      const empTrips = trips.value.filter((tr) => tripEmpId(tr) === u.id)
      const contracts = empTrips.filter(isContract).length
      const tasksDone = tasks.value.filter((x) => x.assigned_to === u.id && x.status === 'done').length
      const target = (bossStore.targets || []).find((tg) => tg.user_id === u.id && tg.month === month)
      let progress = 0
      if (target) {
        progress =
          target.metric === 'trips' ? empTrips.length : target.metric === 'tasks' ? tasksDone : contracts
      }
      const pct = target ? Math.min(100, Math.round((progress / target.target_value) * 100)) : 0
      return { ...u, name: personName(u) || u.username, trips: empTrips.length, contracts, tasksDone, target, progress, pct }
    })
    .sort((a, b) => b.trips - a.trips || b.contracts - a.contracts),
)

const contractTrend = computed(() => {
  const out = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
    out.push({
      key,
      label: monthsShort.value[d.getMonth()],
      count: contractTrips.value.filter((tr) => monthOf(tr.dogovorkp_date || tr.when_gone) === key).length,
    })
  }
  return out
})
const trendMax = computed(() => Math.max(1, ...contractTrend.value.map((m) => m.count)))

const recentContracts = computed(() => {
  const names = {}
  for (const u of users.value) names[u.id] = personName(u)
  return [...contractTrips.value]
    .sort((a, b) => new Date(b.dogovorkp_date || b.when_gone) - new Date(a.dogovorkp_date || a.when_gone))
    .slice(0, 8)
    .map((c, i) => ({
      key: c.id || i,
      company: c.company_name,
      whereto: c.whereto,
      emp: names[tripEmpId(c)] || '—',
      date: formatDate(c.dogovorkp_date || c.when_gone),
    }))
})

const ATT = [
  { key: 'direct_object', label: 'statusDirectObject', color: '#67c23a' },
  { key: 'office_then_object', label: 'statusOfficeThenObject', color: '#e6a23c' },
  { key: 'office', label: 'statusOffice', color: '#409eff' },
  { key: 'absent', label: 'statusAbsent', color: '#f56c6c' },
  { key: 'dayoff', label: 'statusDayoff', color: '#c0c4cc' },
]
const attendanceByStatus = computed(() => {
  const recs = attendanceStore.allRecords || []
  const total = recs.length || 1
  return ATT.map((s) => {
    const count = recs.filter((a) => a.status === s.key).length
    return { ...s, count, pct: Math.round((count / total) * 100) }
  })
})

const byRegion = computed(() => {
  const m = {}
  for (const p of partners.value) {
    const r = p.viloyat || p.republic || '—'
    m[r] = (m[r] || 0) + 1
  }
  return Object.entries(m)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([region, count]) => ({ region, count }))
})
const maxOf = (list) => Math.max(1, ...list.map((x) => x.count))
const barPct = (v, max) => `${Math.max(v ? 3 : 0, (v / max) * 100)}%`

// ─── E'lonlar ───
const annOpen = ref(false)
const ann = reactive({ title: '', message: '' })
const saving = ref(false)
function openAnn() {
  ann.title = ''
  ann.message = ''
  annOpen.value = true
}
async function saveAnn() {
  if (!ann.title.trim() || !ann.message.trim()) return showFailToast(t('m.fillRequired'))
  saving.value = true
  try {
    await bossStore.createAnnouncement({ title: ann.title.trim(), message: ann.message.trim(), created_by: currentUserId })
    showSuccessToast(t('announcementCreated'))
    annOpen.value = false
    await bossStore.getAnnouncements()
  } catch (e) {
    showFailToast(errorText(e, t, locale.value))
  } finally {
    saving.value = false
  }
}
async function removeAnn(a) {
  try {
    await showConfirmDialog({ message: t('m.confirmDelete'), confirmButtonText: t('deleteConfirm'), cancelButtonText: t('cancel') })
  } catch {
    return
  }
  try {
    await bossStore.deleteAnnouncement(a.id)
    showSuccessToast(t('announcementDeleted'))
    await bossStore.getAnnouncements()
  } catch (e) {
    showFailToast(errorText(e, t, locale.value))
  }
}

// ─── Maqsad / admin huquqi ───
const targetOpen = ref(false)
const target = reactive({ user_id: null, metric: 'contracts', target_value: 10 })
const targetUserSheet = ref(false)
const METRICS = [
  { value: 'contracts', label: 'm.metricContracts' },
  { value: 'trips', label: 'm.metricTrips' },
  { value: 'tasks', label: 'm.metricTasks' },
]
function openTarget(row) {
  target.user_id = row?.id ?? null
  target.metric = row?.target?.metric || 'contracts'
  target.target_value = row?.target?.target_value || 10
  targetOpen.value = true
}
const targetUserName = computed(() => leaderboard.value.find((r) => r.id === target.user_id)?.name || '')
async function saveTarget() {
  if (!target.user_id) return showFailToast(t('employeeRequired'))
  saving.value = true
  try {
    await bossStore.upsertTarget({ ...target, month, created_by: currentUserId })
    showSuccessToast(t('targetSaved'))
    targetOpen.value = false
    await bossStore.getTargets(month)
  } catch (e) {
    showFailToast(errorText(e, t, locale.value))
  } finally {
    saving.value = false
  }
}

function onEmployee(row) {
  const actions = [{ name: t('m.setTarget'), key: 'target' }]
  if (row.id !== BOSS_USER_ID) {
    actions.push({ name: row.is_admin ? t('m.removeAdmin') : t('m.makeAdmin'), key: 'admin' })
  }
  showActionSheet({ title: row.name, actions, cancelText: t('cancel'), closeOnClickAction: true })
    .then(async (a) => {
      if (a?.key === 'target') openTarget(row)
      if (a?.key === 'admin') {
        try {
          await bossStore.setAdmin(row.id, !row.is_admin)
          showSuccessToast(t('adminChanged'))
          await usersStore.getAllUsers()
        } catch (e) {
          showFailToast(errorText(e, t, locale.value))
        }
      }
    })
    .catch(() => {})
}

const userOptions = computed(() =>
  leaderboard.value.map((r) => ({ value: r.id, label: r.name, avatar: initials(r.name), avatarColor: avatarColor(r.name) })),
)
</script>

<template>
  <MPage :title="$t('m.bossPanel')" :back="{ name: 'more' }" :on-refresh="load">
    <template #right>
      <button v-if="can('amocrm')" type="button" class="m-head__btn" @click="router.push({ name: 'amocrm' })">
        <van-icon name="phone-circle-o" />
      </button>
    </template>

    <div v-if="loading" class="bv-skel">
      <van-skeleton :row="4" class="m-card" />
      <van-skeleton :row="6" class="m-card" />
    </div>

    <template v-else>
      <MStats :items="kpis" grid />

      <!-- E'lonlar -->
      <div class="m-section">
        <span class="m-section__title">{{ $t('m.announcements') }}</span>
        <button type="button" class="m-section__action" @click="openAnn">+ {{ $t('m.add') }}</button>
      </div>
      <div v-if="bossStore.announcements.length" class="bv-anns">
        <article v-for="a in bossStore.announcements" :key="a.id" class="m-card bv-ann">
          <div class="bv-ann__head">
            <h4>{{ a.title }}</h4>
            <button type="button" class="bv-ann__del" @click="removeAnn(a)"><van-icon name="delete-o" /></button>
          </div>
          <p>{{ a.message }}</p>
          <small>{{ smartDate(a.createdAt, t, locale) }}</small>
        </article>
      </div>
      <p v-else class="bv-empty">{{ $t('m.noAnnouncements') }}</p>

      <!-- Reyting -->
      <div class="m-section">
        <span class="m-section__title">{{ $t('m.leaderboard') }}</span>
        <button type="button" class="m-section__action" @click="openTarget(null)">{{ $t('m.setTarget') }}</button>
      </div>
      <div class="m-card bv-lb">
        <button v-for="(r, i) in leaderboard" :key="r.id" type="button" class="bv-lb__row" @click="onEmployee(r)">
          <span class="bv-lb__rank" :class="{ 'is-top': i < 3 }">{{ i + 1 }}</span>
          <span class="m-avatar is-sm" :style="{ background: avatarColor(r.name) }">{{ initials(r.name) }}</span>
          <span class="bv-lb__main">
            <span class="bv-lb__name">
              {{ r.name }}
              <span v-if="r.is_admin" class="m-tag is-blue">{{ $t('m.admin') }}</span>
            </span>
            <span class="bv-lb__meta m-num">
              <van-icon name="location-o" /> {{ r.trips }}
              <van-icon name="description-o" /> {{ r.contracts }}
              <van-icon name="passed" /> {{ r.tasksDone }}
            </span>
            <span v-if="r.target" class="bv-lb__target">
              <span class="m-bar__track"><span class="m-bar__fill" :style="{ width: `${r.pct}%`, background: r.pct >= 100 ? 'var(--m-good)' : undefined }"></span></span>
              <small class="m-num">{{ r.progress }}/{{ r.target.target_value }}</small>
            </span>
          </span>
        </button>
      </div>

      <!-- Shartnomalar dinamikasi -->
      <div class="m-section"><span class="m-section__title">{{ $t('m.contractsTrend') }}</span></div>
      <div class="m-card bv-trend">
        <div v-for="m in contractTrend" :key="m.key" class="bv-trend__col">
          <span class="bv-trend__val m-num">{{ m.count }}</span>
          <span class="bv-trend__area">
            <span class="bv-trend__bar" :style="{ height: `${Math.max(4, (m.count / trendMax) * 100)}%` }"></span>
          </span>
          <span class="bv-trend__label">{{ m.label }}</span>
        </div>
      </div>

      <template v-if="recentContracts.length">
        <div class="m-section"><span class="m-section__title">{{ $t('m.recentContracts') }}</span></div>
        <van-cell-group inset>
          <van-cell
            v-for="c in recentContracts"
            :key="c.key"
            :title="c.company || c.whereto || '—'"
            :label="c.emp"
            :value="c.date"
            value-class="m-num"
          />
        </van-cell-group>
      </template>

      <!-- Davomat -->
      <div class="m-section"><span class="m-section__title">{{ $t('m.attendanceThisMonth') }}</span></div>
      <div class="m-card m-bars">
        <div v-for="s in attendanceByStatus" :key="s.key">
          <div class="m-bar__head">
            <span class="m-bar__label"><i class="m-bar__dot" :style="{ background: s.color }"></i><span>{{ $t(s.label) }}</span></span>
            <span class="m-bar__value">{{ fmtNum(s.count) }}<small>{{ s.pct }}%</small></span>
          </div>
          <div class="m-bar__track"><div class="m-bar__fill" :style="{ width: `${s.pct}%`, background: s.color }"></div></div>
        </div>
      </div>

      <!-- Mijozlar -->
      <div class="m-section"><span class="m-section__title">{{ $t('m.clientsByType') }}</span></div>
      <div class="m-card m-bars">
        <div v-for="c in clientsByType" :key="c.type">
          <div class="m-bar__head">
            <span class="m-bar__label"><i class="m-bar__dot" :style="{ background: c.color }"></i><span>{{ partnerTypeLabel(c.type) }}</span></span>
            <span class="m-bar__value">{{ fmtNum(c.count) }}</span>
          </div>
          <div class="m-bar__track"><div class="m-bar__fill" :style="{ width: barPct(c.count, maxOf(clientsByType)), background: c.color }"></div></div>
        </div>
      </div>

      <div class="m-section"><span class="m-section__title">{{ $t('m.clientsByRegion') }}</span></div>
      <div class="m-card m-bars">
        <div v-for="r in byRegion" :key="r.region">
          <div class="m-bar__head">
            <span class="m-bar__label"><span>{{ formatPlace(r.region) }}</span></span>
            <span class="m-bar__value">{{ fmtNum(r.count) }}</span>
          </div>
          <div class="m-bar__track"><div class="m-bar__fill" :style="{ width: barPct(r.count, maxOf(byRegion)) }"></div></div>
        </div>
      </div>
    </template>

    <MSheet v-model="annOpen" :title="$t('m.newAnnouncement')">
      <van-cell-group inset class="bv-form">
        <van-field v-model="ann.title" :label="$t('m.annTitle')" label-align="top" maxlength="120" />
        <van-field v-model="ann.message" :label="$t('m.annMessage')" label-align="top" type="textarea" rows="4" autosize maxlength="1000" show-word-limit />
      </van-cell-group>
      <template #footer>
        <van-button @click="annOpen = false">{{ $t('cancel') }}</van-button>
        <van-button type="primary" :loading="saving" @click="saveAnn">{{ $t('m.publish') }}</van-button>
      </template>
    </MSheet>

    <MSheet v-model="targetOpen" :title="$t('m.setTarget')">
      <van-cell-group inset class="bv-form">
        <van-field :model-value="targetUserName" :label="$t('colEmployee')" label-align="top" readonly is-link :placeholder="$t('m.choose')" @click="targetUserSheet = true" />
        <van-field :label="$t('m.metric')" label-align="top">
          <template #input>
            <div class="bv-metrics">
              <button v-for="m in METRICS" :key="m.value" type="button" :class="{ 'is-active': target.metric === m.value }" @click="target.metric = m.value">
                {{ $t(m.label) }}
              </button>
            </div>
          </template>
        </van-field>
        <van-field :label="$t('m.targetValue')">
          <template #input>
            <van-stepper v-model="target.target_value" :min="1" :max="1000" integer />
          </template>
        </van-field>
      </van-cell-group>
      <p class="bv-hint">{{ $t('m.targetHint', { month: `${monthsShort[now.getMonth()]} ${now.getFullYear()}` }) }}</p>
      <template #footer>
        <van-button @click="targetOpen = false">{{ $t('cancel') }}</van-button>
        <van-button type="primary" :loading="saving" @click="saveTarget">{{ $t('save') }}</van-button>
      </template>
    </MSheet>

    <MSelectSheet v-model="targetUserSheet" :title="$t('colEmployee')" :options="userOptions" :selected="target.user_id" @select="(v) => (target.user_id = v)" />
  </MPage>
</template>

<style scoped>
.bv-skel {
  padding-top: 12px;
}

.bv-ann__head {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.bv-ann__head h4 {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
}

.bv-ann__del {
  border: 0;
  background: none;
  color: var(--m-faint);
  font-size: 18px;
  padding: 0;
}

.bv-ann p {
  margin-top: 6px;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  color: var(--m-ink-2);
}

.bv-ann small {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: var(--m-faint);
}

.bv-empty {
  padding: 4px 16px;
  font-size: 14px;
  color: var(--m-muted);
}

.bv-lb {
  padding: 4px 0;
}

.bv-lb__row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  border: 0;
  background: none;
  text-align: left;
  border-bottom: 1px solid var(--m-line-soft);
}

.bv-lb__row:last-child {
  border-bottom: 0;
}

.bv-lb__row:active {
  background: var(--m-surface-2);
}

.bv-lb__rank {
  width: 22px;
  font-size: 13px;
  font-weight: 700;
  color: var(--m-faint);
  text-align: center;
}

.bv-lb__rank.is-top {
  color: #d97706;
}

.bv-lb__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.bv-lb__name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
}

.bv-lb__meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--m-muted);
}

.bv-lb__meta .van-icon {
  margin-left: 6px;
}

.bv-lb__meta .van-icon:first-child {
  margin-left: 0;
}

.bv-lb__target {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 3px;
}

.bv-lb__target .m-bar__track {
  flex: 1;
  height: 6px;
}

.bv-lb__target small {
  font-size: 11px;
  color: var(--m-muted);
}

.bv-trend {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  height: 170px;
  padding-top: 18px;
}

.bv-trend__col {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}

.bv-trend__val {
  font-size: 12px;
  font-weight: 600;
}

.bv-trend__area {
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.bv-trend__bar {
  width: 100%;
  max-width: 34px;
  border-radius: 6px 6px 2px 2px;
  background: var(--m-primary);
}

.bv-trend__label {
  font-size: 11px;
  color: var(--m-muted);
}

.bv-form :deep(.van-field__label) {
  color: var(--m-muted);
  font-size: 13px;
}

.bv-metrics {
  display: flex;
  gap: 6px;
  width: 100%;
}

.bv-metrics button {
  flex: 1;
  min-height: 38px;
  border: 1px solid var(--m-line);
  border-radius: 10px;
  background: var(--m-surface);
  font-size: 13px;
}

.bv-metrics button.is-active {
  border-color: var(--m-primary);
  background: var(--m-primary-soft);
  color: var(--m-primary);
  font-weight: 600;
}

.bv-hint {
  padding: 10px 18px 0;
  font-size: 12px;
  color: var(--m-muted);
}
</style>
