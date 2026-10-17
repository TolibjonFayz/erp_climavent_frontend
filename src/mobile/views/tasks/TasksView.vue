<script setup>
import { computed, onActivated, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { showConfirmDialog, showFailToast, showSuccessToast } from 'vant'
import { showActionSheet } from '../../actionSheet'
import { useTasksStore } from '@/stores/tasks'
import { useUsersStore } from '@/stores/user'
import { fmtNum, formatDate } from '@/utils/format'
import MPage from '../../components/MPage.vue'
import MEmpty from '../../components/MEmpty.vue'
import MSheet from '../../components/MSheet.vue'
import MSelectSheet from '../../components/MSelectSheet.vue'
import MDateSheet from '../../components/MDateSheet.vue'
import TaskCard from './TaskCard.vue'
import { useSession } from '../../session'
import { tapFeedback } from '../../native'
import { avatarColor, errorText, initials } from '../../utils'
import {
  STAGES,
  isDueToday,
  isOverdue,
  nextStatus,
  personName,
  priorityLabelKey,
  sortTasks,
  statusLabelKey,
} from './taskRules'

const { t, locale } = useI18n()
const tasksStore = useTasksStore()
const usersStore = useUsersStore()
const { isAdmin } = useSession()
const currentUserId = Number(localStorage.getItem('userid'))

const isApprover = computed(
  () => isAdmin.value || Number(tasksStore.approver?.id) === currentUserId,
)
const approverName = computed(() => personName(tasksStore.approver) || t('taskApproverFallback'))
const source = computed(() => (isAdmin.value ? tasksStore.allTasks : tasksStore.myTasks) || [])

const loaded = ref(false)
async function refresh() {
  if (isAdmin.value) await tasksStore.getAllTasks()
  else await tasksStore.getMyTasks(currentUserId)
  if (isApprover.value) await tasksStore.getPendingApprovals()
}
async function load() {
  try {
    await tasksStore.getApprover().catch(() => {})
    if (isAdmin.value) {
      await Promise.all([
        refresh(),
        usersStore.allUsers?.length ? null : usersStore.getAllUsers(),
      ])
    } else {
      await refresh()
    }
  } catch (e) {
    showFailToast(errorText(e, t, locale.value))
  } finally {
    loaded.value = true
  }
}
onMounted(load)
onActivated(() => loaded.value && refresh().catch(() => {}))

// ─── Filtrlar ───
const stage = ref('todo')
const quick = ref(null) // 'overdue' | 'pending' | 'today'
const priority = ref('all')
const employee = ref('all')
const searchOpen = ref(false)
const search = ref('')

const countOf = (status) => source.value.filter((x) => x.status === status).length
const quickCounts = computed(() => ({
  overdue: source.value.filter(isOverdue).length,
  pending: source.value.filter((x) => !!x.pending_status).length,
  today: source.value.filter(isDueToday).length,
}))

const list = computed(() => {
  const q = search.value.trim().toLowerCase()
  let rows = source.value
  // Tezkor filtrlar barcha bosqichlar bo'yicha ishlaydi
  if (quick.value === 'overdue') rows = rows.filter(isOverdue)
  else if (quick.value === 'pending') rows = rows.filter((x) => !!x.pending_status)
  else if (quick.value === 'today') rows = rows.filter(isDueToday)
  else rows = rows.filter((x) => x.status === stage.value)
  if (priority.value !== 'all') rows = rows.filter((x) => x.priority === priority.value)
  if (isAdmin.value && employee.value !== 'all') rows = rows.filter((x) => x.assigned_to === employee.value)
  if (q) {
    rows = rows.filter(
      (x) =>
        x.title.toLowerCase().includes(q) ||
        (x.description || '').toLowerCase().includes(q),
    )
  }
  return sortTasks(rows)
})

const toggleQuick = (k) => (quick.value = quick.value === k ? null : k)
const employees = computed(() => usersStore.allUsers || [])
const employeeOptions = computed(() => [
  { value: 'all', label: t('m.allEmployees') },
  ...employees.value.map((u) => ({
    value: u.id,
    label: personName(u) || u.username,
    sub: u.username,
    avatar: initials(personName(u)),
    avatarColor: avatarColor(personName(u)),
  })),
])
const employeeLabel = computed(
  () => employeeOptions.value.find((o) => o.value === employee.value)?.label || t('m.allEmployees'),
)
const employeeSheet = ref(false)
const priorities = ['all', 'high', 'medium', 'low']

// ─── Harakatlar ───
const busy = ref(false)
async function run(fn, okKey) {
  if (busy.value) return
  busy.value = true
  try {
    await fn()
    if (okKey) showSuccessToast(t(okKey))
    tapFeedback()
    await refresh()
  } catch (e) {
    showFailToast(errorText(e, t, locale.value))
  } finally {
    busy.value = false
  }
}

const moveTask = (task, status) => run(() => tasksStore.updateStatus(task.id, status))

function advance(task) {
  const next = nextStatus(task.status)
  if (!next) return
  if (isAdmin.value) moveTask(task, next)
  else openRequest(task, next)
}

// Xodim: oldinga siljish tasdiq orqali
const request = reactive({ open: false, task: null, status: null, note: '' })
function openRequest(task, status) {
  Object.assign(request, { open: true, task, status, note: '' })
}
const sendRequest = () =>
  run(async () => {
    await tasksStore.requestApproval(request.task.id, request.status, request.note.trim() || undefined)
    request.open = false
  }, 'taskRequestSent')

const cancelRequest = (task) => run(() => tasksStore.cancelApproval(task.id), 'taskRequestCancelled')
const approve = (task) => run(() => tasksStore.approveTask(task.id), 'taskApproved')

const reject = reactive({ open: false, task: null, reason: '' })
const openReject = (task) => Object.assign(reject, { open: true, task, reason: '' })
const confirmReject = () =>
  run(async () => {
    await tasksStore.rejectTask(reject.task.id, reject.reason.trim() || undefined)
    reject.open = false
  }, 'taskRejected')

const approvalsOpen = ref(false)

// ─── Batafsil ───
const detail = ref(null)
const detailOpen = computed({
  get: () => !!detail.value,
  set: (v) => !v && (detail.value = null),
})
// Ro'yxat yangilanganda ochiq vazifa ham yangilansin
const detailTask = computed(
  () => source.value.find((x) => x.id === detail.value?.id) || detail.value,
)

// ─── Admin: yaratish / tahrirlash / o'chirish ───
const form = reactive({
  open: false,
  editing: null,
  assigned_to: null,
  title: '',
  description: '',
  priority: 'medium',
  deadline: null,
})
const assigneeSheet = ref(false)
const deadlineSheet = ref(false)

function openCreate() {
  Object.assign(form, {
    open: true,
    editing: null,
    assigned_to: employee.value !== 'all' ? employee.value : null,
    title: '',
    description: '',
    priority: 'medium',
    deadline: null,
  })
}
function openEdit(task) {
  Object.assign(form, {
    open: true,
    editing: task,
    assigned_to: task.assigned_to,
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    deadline: task.deadline,
  })
}
const assigneeName = computed(() => {
  const u = employees.value.find((x) => x.id === form.assigned_to)
  return u ? personName(u) || u.username : ''
})
function saveTask() {
  if (!form.title.trim()) return showFailToast(t('taskTitleRequired'))
  if (!form.assigned_to) return showFailToast(t('employeeRequired'))
  const payload = {
    assigned_to: form.assigned_to,
    title: form.title.trim(),
    description: form.description.trim(),
    priority: form.priority,
    deadline: form.deadline,
  }
  return run(async () => {
    if (form.editing) await tasksStore.updateTask(form.editing.id, payload)
    else await tasksStore.createTask({ ...payload, status: 'todo', created_by: currentUserId })
    form.open = false
  }, form.editing ? 'taskUpdated' : 'taskCreated')
}

function onMenu(task) {
  showActionSheet({
    title: task.title,
    actions: [
      { name: t('edit'), key: 'edit' },
      { name: t('deleteConfirm'), key: 'delete', color: '#b91c1c' },
    ],
    cancelText: t('cancel'),
    closeOnClickAction: true,
  })
    .then(async (a) => {
      if (a?.key === 'edit') openEdit(task)
      if (a?.key === 'delete') {
        await showConfirmDialog({
          message: t('taskDeleteConfirm'),
          confirmButtonText: t('yeah'),
          cancelButtonText: t('no'),
        })
        detail.value = null
        await run(() => tasksStore.deleteTask(task.id), 'taskDeleted')
      }
    })
    .catch(() => {})
}

// ─── Hisobot ───
const reportOpen = ref(false)
const report = computed(() => {
  const all = source.value
  const done = all.filter((x) => x.status === 'done')
  const durations = done
    .filter((x) => x.completed_at && x.createdAt)
    .map((x) => (new Date(x.completed_at) - new Date(x.createdAt)) / 86400000)
    .filter((d) => d >= 0)
  const avgDays = durations.length
    ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10
    : null
  const groups = new Map()
  for (const task of all) {
    const key = task.assigned_to
    if (!groups.has(key)) {
      groups.set(key, { name: personName(task.assignee) || t('unknown'), total: 0, done: 0, overdue: 0 })
    }
    const row = groups.get(key)
    row.total++
    if (task.status === 'done') row.done++
    if (isOverdue(task)) row.overdue++
  }
  return {
    total: all.length,
    done: done.length,
    rate: all.length ? Math.round((done.length / all.length) * 100) : 0,
    avgDays,
    byEmployee: [...groups.values()]
      .map((r) => ({ ...r, rate: r.total ? Math.round((r.done / r.total) * 100) : 0 }))
      .sort((a, b) => b.total - a.total),
  }
})
</script>

<template>
  <MPage :title="$t('m.tabTasks')" large tabbar :on-refresh="refresh">
    <template #right>
      <button type="button" class="m-head__btn" @click="searchOpen = !searchOpen">
        <van-icon :name="searchOpen ? 'cross' : 'search'" />
      </button>
      <button v-if="isAdmin" type="button" class="m-head__btn" @click="reportOpen = true">
        <van-icon name="bar-chart-o" />
      </button>
      <button v-if="isAdmin" type="button" class="m-head__btn" @click="openCreate">
        <van-icon name="plus" />
      </button>
    </template>

    <template #header>
      <van-search
        v-if="searchOpen"
        v-model="search"
        shape="round"
        autofocus
        :placeholder="$t('m.searchTasks')"
        class="tv-search"
      />
      <div class="tv-seg">
        <button
          v-for="s in STAGES"
          :key="s"
          type="button"
          :class="{ 'is-active': !quick && stage === s }"
          @click="(stage = s), (quick = null)"
        >
          {{ $t(statusLabelKey(s)) }}
          <span class="tv-seg__count">{{ countOf(s) }}</span>
        </button>
      </div>
      <div class="m-chips tv-chips">
        <button
          v-if="quickCounts.overdue"
          type="button"
          class="m-chip is-bad"
          :class="{ 'is-active': quick === 'overdue' }"
          @click="toggleQuick('overdue')"
        >
          {{ $t('overdue') }} <span class="m-chip__count">{{ quickCounts.overdue }}</span>
        </button>
        <button
          v-if="quickCounts.pending"
          type="button"
          class="m-chip is-warn"
          :class="{ 'is-active': quick === 'pending' }"
          @click="toggleQuick('pending')"
        >
          {{ $t('taskApprovalPending') }} <span class="m-chip__count">{{ quickCounts.pending }}</span>
        </button>
        <button
          v-if="quickCounts.today"
          type="button"
          class="m-chip"
          :class="{ 'is-active': quick === 'today' }"
          @click="toggleQuick('today')"
        >
          {{ $t('dueToday') }} <span class="m-chip__count">{{ quickCounts.today }}</span>
        </button>
        <button v-if="isAdmin" type="button" class="m-chip" :class="{ 'is-active': employee !== 'all' }" @click="employeeSheet = true">
          <van-icon name="manager-o" /> {{ employeeLabel }}
        </button>
        <button
          v-for="p in priorities"
          :key="p"
          type="button"
          class="m-chip"
          :class="{ 'is-active': priority === p && p !== 'all' }"
          @click="priority = priority === p ? 'all' : p"
          v-show="p !== 'all'"
        >
          {{ $t(priorityLabelKey(p)) }}
        </button>
      </div>
    </template>

    <button
      v-if="isApprover && tasksStore.pendingApprovals.length"
      type="button"
      class="tv-banner"
      @click="approvalsOpen = true"
    >
      <van-icon name="bell" class="tv-banner__icon" />
      <span class="tv-banner__text">
        <b>{{ $t('taskApprovalRequests') }}: {{ tasksStore.pendingApprovals.length }}</b>
        <small>{{ $t('m.tapToReview') }}</small>
      </span>
      <van-icon name="arrow" />
    </button>

    <div v-if="!loaded">
      <van-skeleton v-for="i in 4" :key="i" :row="3" class="m-card" style="margin-top: 10px" />
    </div>

    <template v-else>
      <div v-if="list.length" class="tv-list">
        <TaskCard
          v-for="task in list"
          :key="task.id"
          :task="task"
          :is-admin="isAdmin"
          :is-approver="isApprover"
          :approver-name="approverName"
          @open="detail = task"
          @advance="advance"
          @move="moveTask"
          @approve="approve"
          @reject="openReject"
          @cancel="cancelRequest"
          @menu="onMenu"
        />
      </div>
      <MEmpty
        v-else
        icon="todo-list-o"
        :title="source.length ? $t('noTasksInColumn') : isAdmin ? $t('m.noTasks') : $t('noTasksAssigned')"
      >
        <van-button v-if="isAdmin" type="primary" round class="tv-empty-btn" @click="openCreate">
          {{ $t('m.newTask') }}
        </van-button>
      </MEmpty>
    </template>

    <!-- Batafsil -->
    <MSheet v-model="detailOpen" :title="$t('m.task')">
      <div v-if="detailTask" class="tv-detail">
        <h3 class="tv-detail__title">{{ detailTask.title }}</h3>
        <p v-if="detailTask.description" class="tv-detail__desc">{{ detailTask.description }}</p>
        <van-cell-group inset class="tv-detail__cells">
          <van-cell :title="$t('kpTableStatus')" :value="$t(statusLabelKey(detailTask.status))" />
          <van-cell :title="$t('taskPriority')" :value="$t(priorityLabelKey(detailTask.priority))" />
          <van-cell
            v-if="detailTask.assignee"
            :title="$t('assigneeLabel')"
            :value="personName(detailTask.assignee)"
          />
          <van-cell
            :title="$t('taskDeadline')"
            :value="detailTask.deadline ? formatDate(detailTask.deadline) : '—'"
          />
          <van-cell :title="$t('m.createdAt')" :value="formatDate(detailTask.createdAt)" />
          <van-cell
            v-if="detailTask.completed_at"
            :title="$t('statusDone')"
            :value="formatDate(detailTask.completed_at)"
          />
        </van-cell-group>
      </div>
      <template v-if="detailTask && isAdmin" #footer>
        <van-button icon="edit" @click="openEdit(detailTask), (detail = null)">{{ $t('edit') }}</van-button>
        <van-button icon="delete-o" type="danger" plain @click="onMenu(detailTask)">
          {{ $t('deleteConfirm') }}
        </van-button>
      </template>
    </MSheet>

    <!-- Tasdiq so'rash -->
    <MSheet v-model="request.open" :title="$t('m.requestApprovalTitle')">
      <div v-if="request.task" class="tv-pad">
        <p class="tv-req__task">{{ request.task.title }}</p>
        <p class="tv-req__move">
          {{ $t(statusLabelKey(request.task.status)) }} →
          <b>{{ $t(statusLabelKey(request.status)) }}</b>
        </p>
        <p class="tv-req__hint">{{ $t('m.approvalHint', { name: approverName }) }}</p>
      </div>
      <van-cell-group inset>
        <van-field
          v-model="request.note"
          type="textarea"
          rows="3"
          autosize
          maxlength="500"
          :placeholder="$t('m.approvalNotePlaceholder')"
        />
      </van-cell-group>
      <template #footer>
        <van-button @click="request.open = false">{{ $t('cancel') }}</van-button>
        <van-button type="primary" :loading="busy" @click="sendRequest">{{ $t('m.sendRequest') }}</van-button>
      </template>
    </MSheet>

    <!-- Rad etish -->
    <MSheet v-model="reject.open" :title="$t('taskReject')">
      <p v-if="reject.task" class="tv-pad tv-req__task">{{ reject.task.title }}</p>
      <van-cell-group inset>
        <van-field
          v-model="reject.reason"
          type="textarea"
          rows="3"
          autosize
          maxlength="500"
          :placeholder="$t('m.rejectReasonPlaceholder')"
        />
      </van-cell-group>
      <template #footer>
        <van-button @click="reject.open = false">{{ $t('cancel') }}</van-button>
        <van-button type="danger" :loading="busy" @click="confirmReject">{{ $t('taskReject') }}</van-button>
      </template>
    </MSheet>

    <!-- Tasdiq so'rovlari -->
    <MSheet v-model="approvalsOpen" :title="$t('taskApprovalRequests')">
      <MEmpty v-if="!tasksStore.pendingApprovals.length" icon="passed" :title="$t('taskNoPendingApprovals')" />
      <div v-for="task in tasksStore.pendingApprovals" :key="task.id" class="m-card tv-approval">
        <h4>{{ task.title }}</h4>
        <p class="m-muted">
          {{ $t('taskRequestedBy') }}: <b>{{ personName(task.assignee) || '—' }}</b>
        </p>
        <p class="tv-req__move">
          {{ $t(statusLabelKey(task.status)) }} → <b>{{ $t(statusLabelKey(task.pending_status)) }}</b>
        </p>
        <p v-if="task.approval_note" class="tv-approval__note">“{{ task.approval_note }}”</p>
        <div class="tv-approval__actions">
          <van-button size="small" plain type="danger" @click="openReject(task)">{{ $t('taskReject') }}</van-button>
          <van-button size="small" type="success" @click="approve(task)">{{ $t('taskApprove') }}</van-button>
        </div>
      </div>
    </MSheet>

    <!-- Admin: vazifa formasi -->
    <MSheet v-model="form.open" :title="form.editing ? $t('m.editTask') : $t('m.newTask')" full>
      <van-cell-group inset class="tv-form">
        <van-field
          :model-value="assigneeName"
          :label="$t('assigneeLabel')"
          label-align="top"
          readonly
          is-link
          :placeholder="$t('m.choose')"
          @click="assigneeSheet = true"
        />
        <van-field
          v-model="form.title"
          :label="$t('taskTitle')"
          label-align="top"
          maxlength="200"
          :placeholder="$t('m.taskTitlePlaceholder')"
        />
        <van-field
          v-model="form.description"
          :label="$t('taskDescription')"
          label-align="top"
          type="textarea"
          rows="3"
          autosize
          :placeholder="$t('m.taskDescPlaceholder')"
        />
        <van-field :label="$t('taskPriority')" label-align="top">
          <template #input>
            <div class="tv-prio">
              <button
                v-for="p in ['low', 'medium', 'high']"
                :key="p"
                type="button"
                :class="[`is-${p}`, { 'is-active': form.priority === p }]"
                @click="form.priority = p"
              >
                {{ $t(priorityLabelKey(p)) }}
              </button>
            </div>
          </template>
        </van-field>
        <van-field
          :model-value="form.deadline ? formatDate(form.deadline) : ''"
          :label="$t('taskDeadline')"
          label-align="top"
          readonly
          is-link
          :placeholder="$t('m.noDeadline')"
          @click="deadlineSheet = true"
        >
          <template v-if="form.deadline" #right-icon>
            <van-icon name="clear" class="tv-clear" @click.stop="form.deadline = null" />
          </template>
        </van-field>
      </van-cell-group>
      <template #footer>
        <van-button @click="form.open = false">{{ $t('cancel') }}</van-button>
        <van-button type="primary" :loading="busy" @click="saveTask">{{ $t('save') }}</van-button>
      </template>
    </MSheet>

    <!-- Hisobot -->
    <MSheet v-model="reportOpen" :title="$t('taskReportTitle')">
      <div class="tv-report">
        <div class="tv-report__kpis">
          <div><b class="m-num">{{ fmtNum(report.total) }}</b><span>{{ $t('total') }}</span></div>
          <div><b class="m-num">{{ fmtNum(report.done) }}</b><span>{{ $t('statusDone') }}</span></div>
          <div><b class="m-num">{{ report.rate }}%</b><span>{{ $t('taskCompletionRate') }}</span></div>
          <div><b class="m-num">{{ report.avgDays ?? '—' }}</b><span>{{ $t('taskAvgCompletionDays') }}</span></div>
        </div>
        <div class="m-bars tv-report__bars">
          <div v-for="r in report.byEmployee" :key="r.name">
            <div class="m-bar__head">
              <span class="m-bar__label"><span>{{ r.name }}</span></span>
              <span class="m-bar__value">
                {{ r.done }}/{{ r.total }}
                <small>{{ r.rate }}%</small>
                <small v-if="r.overdue" class="tv-overdue">· {{ r.overdue }} {{ $t('overdue').toLowerCase() }}</small>
              </span>
            </div>
            <div class="m-bar__track">
              <div class="m-bar__fill" :style="{ width: `${r.rate}%`, background: 'var(--m-good)' }"></div>
            </div>
          </div>
        </div>
      </div>
    </MSheet>

    <MSelectSheet
      v-model="employeeSheet"
      :title="$t('colEmployee')"
      :options="employeeOptions"
      :selected="employee"
      @select="(v) => (employee = v)"
    />
    <MSelectSheet
      v-model="assigneeSheet"
      :title="$t('assigneeLabel')"
      :options="employeeOptions.filter((o) => o.value !== 'all')"
      :selected="form.assigned_to"
      @select="(v) => (form.assigned_to = v)"
    />
    <MDateSheet
      v-model="deadlineSheet"
      :value="form.deadline"
      :title="$t('taskDeadline')"
      :min-date="new Date(new Date().getFullYear() - 1, 0, 1)"
      @confirm="(d) => (form.deadline = d)"
    />
  </MPage>
</template>

<style scoped>
.tv-search {
  padding: 0 12px 6px;
}

.tv-seg {
  display: flex;
  margin: 0 12px 10px;
  padding: 3px;
  border-radius: 12px;
  background: var(--m-line-soft);
}

.tv-seg button {
  flex: 1;
  border: 0;
  background: none;
  padding: 8px 4px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 600;
  color: var(--m-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.tv-seg button.is-active {
  background: var(--m-surface);
  color: var(--m-ink);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.tv-seg__count {
  min-width: 20px;
  padding: 1px 6px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.06);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.tv-chips:empty {
  display: none;
}

.tv-list {
  padding-top: 12px;
}

.tv-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  width: calc(100% - 24px);
  margin: 12px 12px 0;
  padding: 12px 14px;
  border: 1px solid #fde68a;
  border-radius: 14px;
  background: var(--m-warn-soft);
  color: var(--m-warn);
  text-align: left;
}

.tv-banner__icon {
  font-size: 22px;
}

.tv-banner__text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tv-banner__text small {
  font-size: 12px;
  opacity: 0.85;
}

.tv-empty-btn {
  margin-top: 16px;
}

.tv-pad {
  padding: 0 18px 12px;
}

.tv-detail {
  padding-bottom: 8px;
}

.tv-detail__title {
  padding: 0 18px;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.35;
}

.tv-detail__desc {
  padding: 8px 18px 0;
  font-size: 15px;
  line-height: 1.55;
  white-space: pre-wrap;
  color: var(--m-ink-2);
}

.tv-detail__cells {
  margin-top: 16px;
}

.tv-req__task {
  font-size: 16px;
  font-weight: 600;
}

.tv-req__move {
  margin-top: 6px;
  font-size: 14px;
  color: var(--m-ink-2);
}

.tv-req__hint {
  margin-top: 8px;
  font-size: 13px;
  color: var(--m-muted);
}

.tv-approval h4 {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 6px;
}

.tv-approval .m-muted {
  font-size: 13px;
}

.tv-approval__note {
  margin-top: 6px;
  font-size: 13px;
  font-style: italic;
  color: var(--m-ink-2);
}

.tv-approval__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}

.tv-form :deep(.van-field__label) {
  color: var(--m-muted);
  font-size: 13px;
}

.tv-prio {
  display: flex;
  gap: 8px;
  width: 100%;
}

.tv-prio button {
  flex: 1;
  min-height: 40px;
  border: 1px solid var(--m-line);
  border-radius: 10px;
  background: var(--m-surface);
  font-size: 14px;
  font-weight: 500;
  color: var(--m-ink-2);
}

.tv-prio button.is-active.is-low {
  border-color: #64748b;
  background: #f1f5f9;
  color: #334155;
}

.tv-prio button.is-active.is-medium {
  border-color: #f59e0b;
  background: var(--m-warn-soft);
  color: var(--m-warn);
}

.tv-prio button.is-active.is-high {
  border-color: var(--m-bad);
  background: var(--m-bad-soft);
  color: var(--m-bad);
}

.tv-clear {
  color: var(--m-faint);
  font-size: 18px;
}

.tv-report {
  padding: 0 16px 8px;
}

.tv-report__kpis {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.tv-report__kpis div {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px;
  border-radius: 12px;
  background: var(--m-surface-2);
  border: 1px solid var(--m-line);
}

.tv-report__kpis b {
  font-size: 22px;
}

.tv-report__kpis span {
  font-size: 12px;
  color: var(--m-muted);
}

.tv-report__bars {
  margin-top: 18px;
}

.tv-overdue {
  color: var(--m-bad) !important;
}
</style>
