<template>
  <UiPage
    v-loading="tasksStore.isLoading"
    :title="$t('tasks')"
    :subtitle="$t('tasksSubtitle')"
    wide
  >
    <template #actions>
      <el-button :icon="DataAnalysis" @click="reportDialog = true">
        {{ $t('taskReport') }}
      </el-button>
      <el-button :icon="Download" @click="exportExcel">{{ $t('taskExportExcel') }}</el-button>
      <!-- Admin: yangi vazifa biriktirish -->
      <el-button v-if="isAdmin" type="primary" :icon="Plus" @click="openCreateDialog">
        {{ $t('newTask') }}
      </el-button>
    </template>

    <!-- Tasdiqlovchi uchun: kutayotgan so'rovlar banneri -->
    <el-alert
      v-if="isApprover && tasksStore.pendingApprovals.length"
      type="warning"
      :closable="false"
      show-icon
    >
      <template #title>
        {{ $t('taskApprovalRequests') }}: <b>{{ tasksStore.pendingApprovals.length }}</b>
        <el-button link type="primary" class="tb-alert-link" @click="approvalsDrawer = true">
          {{ $t('taskOpenRequests') }}
        </el-button>
      </template>
    </el-alert>

    <!-- Ko'rsatkichlar -->
    <div class="tb-stats">
      <UiStat
        :label="$t('total')"
        :value="fmtNum(sourceTasks.length)"
        :sub="$t('taskStatDoneRate', { n: report.completionRate })"
        :class="{ 'is-active': !quickFilter }"
        clickable
        @click="quickFilter = null"
      />
      <UiStat
        :label="$t('statusTodo')"
        :value="fmtNum(countByStatus('todo'))"
        :sub="$t('taskStatShare', { n: share(countByStatus('todo')) })"
      />
      <UiStat
        :label="$t('statusInProgress')"
        tone="warn"
        :value="fmtNum(countByStatus('in_progress'))"
        :sub="$t('taskStatShare', { n: share(countByStatus('in_progress')) })"
      />
      <UiStat
        :label="$t('statusDone')"
        tone="good"
        :value="fmtNum(countByStatus('done'))"
        :sub="
          report.avgDays != null
            ? `${$t('taskAvgCompletionDays')}: ${report.avgDays}`
            : $t('taskStatShare', { n: share(countByStatus('done')) })
        "
      />
      <UiStat
        :label="$t('taskPendingCount')"
        :hint="$t('taskPendingHint')"
        tone="warn"
        :value="fmtNum(pendingCount)"
        :sub="$t('taskApproverLabel') + ': ' + approverName"
        :class="{ 'is-active': quickFilter === 'pending' }"
        clickable
        @click="toggleQuick('pending')"
      />
      <UiStat
        :label="$t('overdue')"
        :hint="$t('taskOverdueHint')"
        :tone="overdueCount ? 'bad' : ''"
        :value="fmtNum(overdueCount)"
        :sub="$t('taskStatDueToday', { n: dueTodayCount })"
        :class="{ 'is-active': quickFilter === 'overdue' }"
        clickable
        @click="toggleQuick('overdue')"
      />
    </div>

    <!-- Filtrlar -->
    <UiToolbar>
      <UiField :label="$t('custSearch')" grow>
        <el-input
          v-model="searchQuery"
          :placeholder="$t('taskSearchPlaceholder')"
          :prefix-icon="Search"
          clearable
        />
      </UiField>
      <UiField :label="$t('taskPriority')">
        <el-select v-model="priorityFilter" class="tb-select">
          <el-option :label="$t('allPriorities')" value="all" />
          <el-option :label="$t('priorityHigh')" value="high" />
          <el-option :label="$t('priorityMedium')" value="medium" />
          <el-option :label="$t('priorityLow')" value="low" />
        </el-select>
      </UiField>
      <!-- Admin: xodim bo'yicha filtr -->
      <UiField v-if="isAdmin" :label="$t('colEmployee')">
        <el-select v-model="employeeFilter" class="tb-select-lg" filterable>
          <el-option :label="$t('allEmployees')" value="all" />
          <el-option
            v-for="u in employees"
            :key="u.id"
            :label="`${u.firstname} ${u.lastname}`"
            :value="u.id"
          />
        </el-select>
      </UiField>
      <template #actions>
        <el-button v-if="hasFilters" link type="primary" @click="resetFilters">
          {{ $t('kpResetFilters') }}
        </el-button>
      </template>
    </UiToolbar>

    <div class="tb-board">
      <section
        v-for="column in columns"
        :key="column.status"
        class="tb-col"
        :class="{ 'is-drag-over': dragOverColumn === column.status }"
        @dragover.prevent
        @dragenter.prevent="dragOverColumn = column.status"
        @dragleave="onDragLeave($event, column.status)"
        @drop="onDrop(column.status)"
      >
        <header class="tb-col__head">
          <span class="tb-dot" :class="`is-${column.status}`"></span>
          <h3>{{ $t(column.labelKey) }}</h3>
          <span class="tb-count">{{ filteredTasks(column.status).length }}</span>
        </header>

        <div class="tb-col__body">
          <article
            v-for="task in filteredTasks(column.status)"
            :key="task.id"
            class="tb-card"
            :class="[`is-${task.priority}`, { 'is-pending': !!task.pending_status }]"
            draggable="true"
            @dragstart="onDragStart(task.id)"
            @dragend="onDragEnd"
          >
            <div class="tb-card__top">
              <el-tag :type="priorityTagType(task.priority)" size="small" effect="light">
                {{ $t(priorityLabelKey(task.priority)) }}
              </el-tag>
              <div v-if="isAdmin" class="tb-card__actions">
                <el-tooltip :content="$t('edit')" placement="top">
                  <el-button text size="small" :icon="EditPen" @click="openEditDialog(task)" />
                </el-tooltip>
                <el-popconfirm
                  :title="$t('taskDeleteConfirm')"
                  :confirm-button-text="$t('yeah')"
                  :cancel-button-text="$t('no')"
                  @confirm="handleDelete(task.id)"
                >
                  <template #reference>
                    <el-button text size="small" type="danger" :icon="Delete" />
                  </template>
                </el-popconfirm>
              </div>
            </div>

            <h4 class="tb-card__title" :class="{ 'is-done': task.status === 'done' }">
              {{ task.title }}
            </h4>
            <p v-if="task.description" class="tb-card__desc">{{ task.description }}</p>

            <!-- Mas'ul (admin ko'radi) va muddat -->
            <div v-if="(isAdmin && task.assignee) || task.deadline" class="tb-meta">
              <span v-if="isAdmin && task.assignee" class="tb-assignee">
                <span class="tb-avatar">{{ initial(task.assignee) }}</span>
                {{ task.assignee.firstname }} {{ task.assignee.lastname }}
              </span>
              <span v-if="task.deadline" class="tb-deadline" :class="deadlineClass(task)">
                <el-icon><Calendar /></el-icon>
                {{ formatDeadline(task.deadline) }}
                <span v-if="isOverdue(task)" class="tb-badge is-bad">{{ $t('overdue') }}</span>
                <span v-else-if="isDueToday(task)" class="tb-badge is-warn">
                  {{ $t('dueToday') }}
                </span>
              </span>
            </div>

            <!-- Tasdiq kutilmoqda -->
            <div v-if="task.pending_status" class="tb-note is-warn">
              <div class="tb-note__line">
                <el-icon><Clock /></el-icon>
                <b>{{ $t('taskApprovalPending') }}</b>
                <span>→ {{ $t(statusLabelKey(task.pending_status)) }}</span>
              </div>
              <p class="tb-note__meta">{{ $t('taskApproverLabel') }}: {{ approverName }}</p>
              <p v-if="task.approval_note" class="tb-note__quote">"{{ task.approval_note }}"</p>
            </div>

            <!-- Rad etilgan -->
            <div v-else-if="task.approval_result === 'rejected'" class="tb-note is-bad">
              <div class="tb-note__line">
                <el-icon><CircleClose /></el-icon>
                <b>{{ $t('taskWasRejected') }}</b>
              </div>
              <p v-if="task.approval_reject_reason" class="tb-note__quote">
                "{{ task.approval_reject_reason }}"
              </p>
            </div>

            <footer class="tb-card__foot">
              <span class="tb-created">{{ formatDateRelative(task.createdAt) }}</span>

              <div class="tb-card__moves">
                <!-- Tasdiqlovchi: qaror qabul qilish -->
                <template v-if="task.pending_status && isApprover">
                  <el-button size="small" type="success" @click="approve(task)">
                    {{ $t('taskApprove') }}
                  </el-button>
                  <el-button size="small" type="danger" plain @click="openRejectDialog(task)">
                    {{ $t('taskReject') }}
                  </el-button>
                </template>

                <!-- So'rov yuborgan xodim: bekor qilish -->
                <el-button
                  v-else-if="task.pending_status"
                  size="small"
                  plain
                  @click="cancelRequest(task)"
                >
                  {{ $t('taskCancelRequest') }}
                </el-button>

                <!-- Oldinga / orqaga siljish -->
                <template v-else>
                  <el-button
                    v-if="task.status === 'done'"
                    size="small"
                    @click="moveBack(task, 'todo')"
                  >
                    {{ $t('reopenTask') }}
                  </el-button>
                  <el-button
                    v-else-if="task.status === 'in_progress'"
                    size="small"
                    @click="moveBack(task, 'todo')"
                  >
                    {{ $t('taskBackToTodo') }}
                  </el-button>
                  <el-button
                    v-if="nextStatus(task.status)"
                    size="small"
                    :type="task.status === 'todo' ? 'primary' : 'success'"
                    plain
                    @click="advance(task)"
                  >
                    {{ isAdmin ? $t(advanceLabelKey(task.status)) : $t('taskRequestApproval') }}
                  </el-button>
                </template>
              </div>
            </footer>
          </article>

          <div v-if="filteredTasks(column.status).length === 0" class="tb-empty">
            {{ emptyText(column.status) }}
          </div>
        </div>
      </section>
    </div>

    <p class="tb-drag-hint">{{ isAdmin ? $t('dragHint') : $t('dragHintApproval') }}</p>

    <!-- Add / Edit dialog (faqat admin) -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingTask ? $t('editTask') : $t('newTask')"
      width="480px"
      class="task-dialog"
      destroy-on-close
    >
      <el-form
        ref="taskFormRef"
        :model="taskForm"
        :rules="formRules"
        label-position="top"
        @submit.prevent
      >
        <el-form-item :label="$t('assignTo')" prop="assigned_to">
          <el-select
            v-model="taskForm.assigned_to"
            :placeholder="$t('selectEmployee')"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="u in employees"
              :key="u.id"
              :label="`${u.firstname} ${u.lastname}`"
              :value="u.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('taskTitle')" prop="title">
          <el-input
            v-model="taskForm.title"
            :placeholder="$t('taskTitlePlaceholder')"
            maxlength="120"
            show-word-limit
          />
        </el-form-item>

        <el-form-item :label="$t('taskDescription')">
          <el-input
            v-model="taskForm.description"
            type="textarea"
            :rows="3"
            :placeholder="$t('taskDescriptionPlaceholder')"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <div class="form-row">
          <el-form-item :label="$t('taskPriority')" class="form-half">
            <el-select v-model="taskForm.priority">
              <el-option :label="$t('priorityHigh')" value="high" />
              <el-option :label="$t('priorityMedium')" value="medium" />
              <el-option :label="$t('priorityLow')" value="low" />
            </el-select>
          </el-form-item>

          <el-form-item :label="$t('taskDeadline')" class="form-half">
            <el-date-picker
              v-model="taskForm.deadline"
              type="date"
              :placeholder="$t('selectDeadline')"
              format="DD.MM.YYYY"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('cancel') }}</el-button>
        <el-button type="primary" :loading="tasksStore.isLoading" @click="handleSubmit">
          {{ $t('save') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Tasdiq so'rash dialogi -->
    <el-dialog
      v-model="requestDialog"
      :title="$t('taskRequestApproval')"
      width="440px"
      destroy-on-close
    >
      <p class="request-target">
        <strong>{{ requestTask?.title }}</strong>
      </p>
      <p class="request-hint">
        {{ $t('taskMoveTo') }}:
        <el-tag size="small" type="warning">
          {{ requestStatus ? $t(statusLabelKey(requestStatus)) : '' }}
        </el-tag>
        · {{ $t('taskApproverLabel') }}: <strong>{{ approverName }}</strong>
      </p>
      <el-input
        v-model="requestNote"
        type="textarea"
        :rows="3"
        maxlength="500"
        show-word-limit
        :placeholder="$t('taskApprovalNotePlaceholder')"
      />
      <template #footer>
        <el-button @click="requestDialog = false">{{ $t('cancel') }}</el-button>
        <el-button type="primary" :loading="tasksStore.isLoading" @click="sendRequest">
          {{ $t('taskSendRequest') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Rad etish dialogi -->
    <el-dialog v-model="rejectDialog" :title="$t('taskReject')" width="420px" destroy-on-close>
      <p class="request-target">
        <strong>{{ rejectTask?.title }}</strong>
      </p>
      <el-input
        v-model="rejectReason"
        type="textarea"
        :rows="3"
        maxlength="500"
        show-word-limit
        :placeholder="$t('taskRejectReasonPlaceholder')"
      />
      <template #footer>
        <el-button @click="rejectDialog = false">{{ $t('cancel') }}</el-button>
        <el-button type="danger" :loading="tasksStore.isLoading" @click="confirmReject">
          {{ $t('taskReject') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Tasdiq so'rovlari drawer (tasdiqlovchi uchun) -->
    <el-drawer
      v-model="approvalsDrawer"
      :title="$t('taskApprovalRequests')"
      size="420px"
      direction="rtl"
    >
      <div v-if="!tasksStore.pendingApprovals.length" class="drawer-empty">
        {{ $t('taskNoPendingApprovals') }}
      </div>
      <div v-for="task in tasksStore.pendingApprovals" :key="task.id" class="request-card">
        <h4>{{ task.title }}</h4>
        <p class="request-card-meta">
          {{ $t('taskRequestedBy') }}:
          <strong v-if="task.assignee">
            {{ task.assignee.firstname }} {{ task.assignee.lastname }}
          </strong>
        </p>
        <p class="request-card-meta">
          {{ $t(statusLabelKey(task.status)) }} →
          <el-tag size="small" type="warning">{{ $t(statusLabelKey(task.pending_status)) }}</el-tag>
        </p>
        <p v-if="task.approval_note" class="approval-note">"{{ task.approval_note }}"</p>
        <p class="request-card-meta muted">
          {{ formatDateRelative(task.approval_requested_at) }}
        </p>
        <div class="request-card-actions">
          <el-button size="small" type="success" @click="approve(task)">
            {{ $t('taskApprove') }}
          </el-button>
          <el-button size="small" type="danger" plain @click="openRejectDialog(task)">
            {{ $t('taskReject') }}
          </el-button>
        </div>
      </div>
    </el-drawer>

    <!-- Hisobot dialogi -->
    <el-dialog
      v-model="reportDialog"
      :title="$t('taskReportTitle')"
      width="900px"
      class="report-dialog"
    >
      <div class="tb-report-stats">
        <UiStat size="sm" :label="$t('total')" :value="fmtNum(report.total)" />
        <UiStat size="sm" :label="$t('statusTodo')" :value="fmtNum(report.todo)" />
        <UiStat
          size="sm"
          tone="warn"
          :label="$t('statusInProgress')"
          :value="fmtNum(report.in_progress)"
        />
        <UiStat size="sm" tone="good" :label="$t('statusDone')" :value="fmtNum(report.done)" />
        <UiStat
          size="sm"
          tone="warn"
          :label="$t('taskPendingCount')"
          :value="fmtNum(report.pending)"
        />
        <UiStat
          size="sm"
          :tone="report.overdue ? 'bad' : ''"
          :label="$t('overdue')"
          :value="fmtNum(report.overdue)"
        />
        <UiStat
          size="sm"
          tone="good"
          :label="$t('taskCompletionRate')"
          :value="`${report.completionRate}%`"
        />
        <UiStat size="sm" :label="$t('taskAvgCompletionDays')" :value="report.avgDays ?? '—'" />
      </div>

      <div class="report-bar">
        <div class="bar-seg todo" :style="{ width: barWidth(report.todo) }"></div>
        <div class="bar-seg progress" :style="{ width: barWidth(report.in_progress) }"></div>
        <div class="bar-seg done" :style="{ width: barWidth(report.done) }"></div>
      </div>

      <h4 class="report-subtitle">{{ $t('taskPerEmployee') }}</h4>
      <el-table :data="report.byEmployee" size="small" stripe border max-height="320">
        <el-table-column prop="name" :label="$t('colEmployee')" min-width="160" />
        <el-table-column prop="total" :label="$t('total')" width="80" align="center" />
        <el-table-column prop="todo" :label="$t('statusTodo')" width="90" align="center" />
        <el-table-column
          prop="in_progress"
          :label="$t('statusInProgress')"
          width="110"
          align="center"
        />
        <el-table-column prop="done" :label="$t('statusDone')" width="100" align="center" />
        <el-table-column prop="overdue" :label="$t('overdue')" width="120" align="center" />
        <el-table-column :label="$t('taskCompletionRate')" width="140" align="center">
          <template #default="{ row }">
            <el-progress :percentage="row.rate" :stroke-width="10" />
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button @click="reportDialog = false">{{ $t('cancel') }}</el-button>
        <el-button type="primary" :icon="Download" @click="exportExcel">
          {{ $t('taskExportExcel') }}
        </el-button>
      </template>
    </el-dialog>
  </UiPage>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import * as XLSX from 'xlsx'
import { useTasksStore } from '@/stores/tasks'
import { useUsersStore } from '@/stores/user'
import { formatDateRelative } from '@/composables/useDateFormatter'
import { ElMessage } from 'element-plus'
import {
  Plus,
  Search,
  EditPen,
  Delete,
  Calendar,
  Clock,
  CircleClose,
  Download,
  DataAnalysis,
} from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import UiPage from '@/components/ui/UiPage.vue'
import UiStat from '@/components/ui/UiStat.vue'
import UiToolbar from '@/components/ui/UiToolbar.vue'
import UiField from '@/components/ui/UiField.vue'
import { fmtNum } from '@/utils/format'

const { t } = useI18n()
const tasksStore = useTasksStore()
const usersStore = useUsersStore()

const currentUserId = Number(localStorage.getItem('userid'))
const isAdmin = computed(() => !!usersStore.currentUser?.is_admin)

// Tasdiqlovchi — belgilangan xodim (Gulshoda) yoki admin
const isApprover = computed(
  () => isAdmin.value || Number(tasksStore.approver?.id) === currentUserId,
)
const approverName = computed(() => {
  const a = tasksStore.approver
  return a ? `${a.firstname} ${a.lastname || ''}`.trim() : t('taskApproverFallback')
})

// Admins work over allTasks, employees over their own myTasks
const sourceTasks = computed(() => (isAdmin.value ? tasksStore.allTasks : tasksStore.myTasks))
const employees = computed(() => usersStore.allUsers || [])

const searchQuery = ref('')
const priorityFilter = ref('all')
const employeeFilter = ref('all')
// Kartadan tanlanadigan tezkor filtr: 'overdue' | 'pending' | null
const quickFilter = ref(null)
const toggleQuick = (key) => {
  quickFilter.value = quickFilter.value === key ? null : key
}
const hasFilters = computed(
  () =>
    !!searchQuery.value.trim() ||
    priorityFilter.value !== 'all' ||
    employeeFilter.value !== 'all' ||
    !!quickFilter.value,
)
const resetFilters = () => {
  searchQuery.value = ''
  priorityFilter.value = 'all'
  employeeFilter.value = 'all'
  quickFilter.value = null
}

const columns = [
  { status: 'todo', labelKey: 'statusTodo' },
  { status: 'in_progress', labelKey: 'statusInProgress' },
  { status: 'done', labelKey: 'statusDone' },
]

// Bosqichlar tartibi — backend bilan bir xil
const STAGE_ORDER = ['todo', 'in_progress', 'done']
const nextStatus = (status) => STAGE_ORDER[STAGE_ORDER.indexOf(status) + 1] || null
const statusLabelKey = (status) =>
  ({ todo: 'statusTodo', in_progress: 'statusInProgress', done: 'statusDone' })[status] ||
  'statusTodo'
const advanceLabelKey = (status) => (status === 'todo' ? 'startTask' : 'completeTask')

const filteredTasks = (status) => {
  let list = sourceTasks.value.filter((t) => t.status === status)

  if (priorityFilter.value !== 'all') {
    list = list.filter((t) => t.priority === priorityFilter.value)
  }

  if (isAdmin.value && employeeFilter.value !== 'all') {
    list = list.filter((t) => t.assigned_to === employeeFilter.value)
  }

  if (quickFilter.value === 'overdue') list = list.filter((t) => isOverdue(t))
  else if (quickFilter.value === 'pending') list = list.filter((t) => !!t.pending_status)

  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)),
    )
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 }
  return [...list].sort((a, b) => {
    // Tasdiq kutayotganlar tepada — ular e'tibor talab qiladi
    if (!!a.pending_status !== !!b.pending_status) return a.pending_status ? -1 : 1
    const p = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (p !== 0) return p
    if (a.deadline && b.deadline) return new Date(a.deadline) - new Date(b.deadline)
    if (a.deadline) return -1
    if (b.deadline) return 1
    return new Date(b.createdAt) - new Date(a.createdAt)
  })
}

const countByStatus = (status) => sourceTasks.value.filter((t) => t.status === status).length
const overdueCount = computed(() => sourceTasks.value.filter((t) => isOverdue(t)).length)
const pendingCount = computed(() => sourceTasks.value.filter((t) => !!t.pending_status).length)
const dueTodayCount = computed(() => sourceTasks.value.filter((t) => isDueToday(t)).length)
// Umumiy sonning ulushi, %
const share = (n) =>
  sourceTasks.value.length ? Math.round((n / sourceTasks.value.length) * 100) : 0

const emptyText = (status) => {
  if (!isAdmin.value && status === 'todo' && sourceTasks.value.length === 0) {
    return t('noTasksAssigned')
  }
  return t('noTasksInColumn')
}

// ─── Priority helpers ───
const priorityTagType = (priority) =>
  ({ high: 'danger', medium: 'warning', low: 'info' })[priority] || 'info'

const priorityLabelKey = (priority) =>
  ({ high: 'priorityHigh', medium: 'priorityMedium', low: 'priorityLow' })[priority] ||
  'priorityMedium'

const initial = (user) => (user?.firstname ? user.firstname.charAt(0).toUpperCase() : '?')

// ─── Deadline helpers ───
const isOverdue = (task) => {
  if (!task.deadline || task.status === 'done') return false
  const end = new Date(task.deadline)
  end.setHours(23, 59, 59, 999)
  return end < new Date()
}

const isDueToday = (task) => {
  if (!task.deadline || task.status === 'done') return false
  const d = new Date(task.deadline)
  const now = new Date()
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  )
}

const deadlineClass = (task) => {
  if (isOverdue(task)) return 'deadline-overdue'
  if (isDueToday(task)) return 'deadline-today'
  return ''
}

const formatDeadline = (deadline) => {
  const d = new Date(deadline)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}.${mm}.${d.getFullYear()}`
}

// ─── Refresh (role-based) ───
const refresh = async () => {
  if (isAdmin.value) await tasksStore.getAllTasks()
  else await tasksStore.getMyTasks(currentUserId)
  if (isApprover.value) await tasksStore.getPendingApprovals()
}

// ─── Drag & drop ───
const draggedTaskId = ref(null)
const dragOverColumn = ref(null)

const onDragStart = (id) => {
  draggedTaskId.value = id
}
const onDragEnd = () => {
  draggedTaskId.value = null
  dragOverColumn.value = null
}
const onDragLeave = (event, status) => {
  if (!event.currentTarget.contains(event.relatedTarget) && dragOverColumn.value === status) {
    dragOverColumn.value = null
  }
}
const onDrop = (status) => {
  const id = draggedTaskId.value
  onDragEnd()
  if (!id) return
  const task = sourceTasks.value.find((t) => t.id === id)
  if (!task || task.status === status) return

  const forward = STAGE_ORDER.indexOf(status) > STAGE_ORDER.indexOf(task.status)
  // Xodim oldinga faqat tasdiq orqali o'tadi
  if (forward && !isAdmin.value) openRequestDialog(task, status)
  else moveTask(id, status)
}

const moveTask = async (id, status) => {
  try {
    await tasksStore.updateStatus(id, status)
    await refresh()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || t('xatolikYuzBerdi'))
  }
}

const moveBack = (task, status) => moveTask(task.id, status)

// ─── Tasdiqlash oqimi ───
const requestDialog = ref(false)
const requestTask = ref(null)
const requestStatus = ref(null)
const requestNote = ref('')

const openRequestDialog = (task, status) => {
  requestTask.value = task
  requestStatus.value = status || nextStatus(task.status)
  requestNote.value = ''
  requestDialog.value = true
}

// Admin to'g'ridan-to'g'ri ko'chiradi, xodim tasdiq so'raydi
const advance = (task) => {
  const next = nextStatus(task.status)
  if (!next) return
  if (isAdmin.value) moveTask(task.id, next)
  else openRequestDialog(task, next)
}

const sendRequest = async () => {
  if (!requestTask.value || !requestStatus.value) return
  try {
    await tasksStore.requestApproval(
      requestTask.value.id,
      requestStatus.value,
      requestNote.value.trim() || undefined,
    )
    ElMessage.success(t('taskRequestSent'))
    requestDialog.value = false
    await refresh()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || t('xatolikYuzBerdi'))
  }
}

const cancelRequest = async (task) => {
  try {
    await tasksStore.cancelApproval(task.id)
    ElMessage.success(t('taskRequestCancelled'))
    await refresh()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || t('xatolikYuzBerdi'))
  }
}

const approve = async (task) => {
  try {
    await tasksStore.approveTask(task.id)
    ElMessage.success(t('taskApproved'))
    await refresh()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || t('xatolikYuzBerdi'))
  }
}

const rejectDialog = ref(false)
const rejectTask = ref(null)
const rejectReason = ref('')

const openRejectDialog = (task) => {
  rejectTask.value = task
  rejectReason.value = ''
  rejectDialog.value = true
}

const confirmReject = async () => {
  if (!rejectTask.value) return
  try {
    await tasksStore.rejectTask(rejectTask.value.id, rejectReason.value.trim() || undefined)
    ElMessage.success(t('taskRejected'))
    rejectDialog.value = false
    await refresh()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || t('xatolikYuzBerdi'))
  }
}

const approvalsDrawer = ref(false)

// ─── Hisobot ───
const reportDialog = ref(false)

const employeeName = (task) =>
  task.assignee ? `${task.assignee.firstname} ${task.assignee.lastname || ''}`.trim() : t('unknown')

const report = computed(() => {
  const list = sourceTasks.value
  const done = list.filter((t) => t.status === 'done')

  // Bajarish muddati: yaratilgandan yakunlangangacha o'rtacha kun
  const durations = done
    .filter((t) => t.completed_at && t.createdAt)
    .map((t) => (new Date(t.completed_at) - new Date(t.createdAt)) / 86400000)
    .filter((d) => d >= 0)
  const avgDays = durations.length
    ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10
    : null

  const groups = new Map()
  list.forEach((task) => {
    const key = task.assigned_to
    const name = employeeName(task)
    if (!groups.has(key)) {
      groups.set(key, { name, total: 0, todo: 0, in_progress: 0, done: 0, overdue: 0 })
    }
    const row = groups.get(key)
    row.total += 1
    row[task.status] = (row[task.status] || 0) + 1
    if (isOverdue(task)) row.overdue += 1
  })

  const byEmployee = [...groups.values()]
    .map((row) => ({ ...row, rate: row.total ? Math.round((row.done / row.total) * 100) : 0 }))
    .sort((a, b) => b.total - a.total)

  return {
    total: list.length,
    todo: list.filter((t) => t.status === 'todo').length,
    in_progress: list.filter((t) => t.status === 'in_progress').length,
    done: done.length,
    pending: list.filter((t) => !!t.pending_status).length,
    overdue: list.filter((t) => isOverdue(t)).length,
    completionRate: list.length ? Math.round((done.length / list.length) * 100) : 0,
    avgDays,
    byEmployee,
  }
})

const barWidth = (value) => (report.value.total ? `${(value / report.value.total) * 100}%` : '0%')

// ─── Excel eksport (2 varaq: vazifalar + hisobot) ───
const exportExcel = () => {
  const list = sourceTasks.value
  if (!list.length) {
    ElMessage.warning(t('taskNoDataToExport'))
    return
  }

  const rows = list.map((task, index) => ({
    '№': index + 1,
    [t('taskTitle')]: task.title,
    [t('taskDescription')]: task.description || '—',
    [t('assigneeLabel')]: employeeName(task),
    [t('kpTableStatus')]: t(statusLabelKey(task.status)),
    [t('taskPriority')]: t(priorityLabelKey(task.priority)),
    [t('taskDeadline')]: task.deadline ? formatDeadline(task.deadline) : '—',
    [t('overdue')]: isOverdue(task) ? t('yeah') : '—',
    [t('taskPendingCount')]: task.pending_status ? t(statusLabelKey(task.pending_status)) : '—',
    [t('taskApprovalNote')]: task.approval_note || '—',
    [t('taskRejectReason')]: task.approval_reject_reason || '—',
    [t('statusDone')]: task.completed_at
      ? new Date(task.completed_at).toLocaleDateString('uz-UZ')
      : '—',
  }))

  const summary = [
    { [t('colEmployee')]: t('total'), [t('total')]: report.value.total },
    { [t('colEmployee')]: t('statusTodo'), [t('total')]: report.value.todo },
    { [t('colEmployee')]: t('statusInProgress'), [t('total')]: report.value.in_progress },
    { [t('colEmployee')]: t('statusDone'), [t('total')]: report.value.done },
    { [t('colEmployee')]: t('taskPendingCount'), [t('total')]: report.value.pending },
    { [t('colEmployee')]: t('overdue'), [t('total')]: report.value.overdue },
    {
      [t('colEmployee')]: t('taskCompletionRate'),
      [t('total')]: `${report.value.completionRate}%`,
    },
    { [t('colEmployee')]: t('taskAvgCompletionDays'), [t('total')]: report.value.avgDays ?? '—' },
    {},
    ...report.value.byEmployee.map((row) => ({
      [t('colEmployee')]: row.name,
      [t('total')]: row.total,
      [t('statusTodo')]: row.todo,
      [t('statusInProgress')]: row.in_progress,
      [t('statusDone')]: row.done,
      [t('overdue')]: row.overdue,
      [t('taskCompletionRate')]: `${row.rate}%`,
    })),
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), t('tasks'))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), t('taskReport'))
  const stamp = new Date().toLocaleDateString('uz-UZ').replace(/\//g, '-')
  XLSX.writeFile(wb, `Vazifalar_${stamp}.xlsx`)
  ElMessage.success(t('taskExportDone'))
}

// ─── Dialog (admin: add / edit) ───
const dialogVisible = ref(false)
const editingTask = ref(null)
const taskFormRef = ref(null)

const taskForm = reactive({
  assigned_to: null,
  title: '',
  description: '',
  priority: 'medium',
  deadline: null,
})

const formRules = {
  title: [{ required: true, message: () => t('taskTitleRequired'), trigger: 'blur' }],
  assigned_to: [{ required: true, message: () => t('employeeRequired'), trigger: 'change' }],
}

const openCreateDialog = () => {
  editingTask.value = null
  taskForm.assigned_to = null
  taskForm.title = ''
  taskForm.description = ''
  taskForm.priority = 'medium'
  taskForm.deadline = null
  dialogVisible.value = true
}

const openEditDialog = (task) => {
  editingTask.value = task
  taskForm.assigned_to = task.assigned_to
  taskForm.title = task.title
  taskForm.description = task.description
  taskForm.priority = task.priority
  taskForm.deadline = task.deadline
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!taskFormRef.value) return
  try {
    await taskFormRef.value.validate()
  } catch {
    return
  }

  const payload = {
    assigned_to: taskForm.assigned_to,
    title: taskForm.title.trim(),
    description: taskForm.description.trim(),
    priority: taskForm.priority,
    deadline: taskForm.deadline,
  }

  try {
    if (editingTask.value) {
      await tasksStore.updateTask(editingTask.value.id, payload)
      ElMessage.success(t('taskUpdated'))
    } else {
      await tasksStore.createTask({ ...payload, status: 'todo', created_by: currentUserId })
      ElMessage.success(t('taskCreated'))
    }
    dialogVisible.value = false
    await refresh()
  } catch {
    ElMessage.error(t('xatolikYuzBerdi'))
  }
}

const handleDelete = async (id) => {
  try {
    await tasksStore.deleteTask(id)
    ElMessage.success(t('taskDeleted'))
    await refresh()
  } catch {
    ElMessage.error(t('xatolikYuzBerdi'))
  }
}

onMounted(async () => {
  if (!usersStore.currentUser) {
    await usersStore.getUserInfo(currentUserId)
  }
  await tasksStore.getApprover()
  if (isAdmin.value) {
    await Promise.all([tasksStore.getAllTasks(), usersStore.getAllUsers()])
  } else {
    await tasksStore.getMyTasks(currentUserId)
  }
  if (isApprover.value) await tasksStore.getPendingApprovals()
})
</script>

<style lang="scss" scoped>
.tb-alert-link {
  margin-left: 8px;
  vertical-align: baseline;
}

/* ─── Ko'rsatkichlar ─── */
.tb-stats {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}
.tb-stats .is-active {
  border-color: var(--ui-link);
  box-shadow: inset 0 0 0 1px var(--ui-link);
}
.tb-select {
  width: 170px;
}
.tb-select-lg {
  width: 220px;
}

/* ─── Kanban ─── */
.tb-board {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  align-items: start;
}
.tb-col {
  min-width: 0;
  background: var(--ui-surface-2);
  border: 1px solid var(--ui-line);
  border-radius: var(--ui-radius);
  transition:
    border-color 0.15s,
    background 0.15s;

  &.is-drag-over {
    border-color: var(--ui-link);
    background: var(--ui-link-soft);
  }
}
.tb-col__head {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 48px;
  padding: 8px 16px;
  background: var(--ui-surface);
  border-bottom: 1px solid var(--ui-line);
  border-radius: var(--ui-radius) var(--ui-radius) 0 0;

  h3 {
    flex: 1;
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--ui-ink);
  }
}
.tb-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
  background: #cbd5e1;

  &.is-in_progress {
    background: var(--ui-warn);
  }
  &.is-done {
    background: var(--ui-good);
  }
}
.tb-count {
  min-width: 24px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
  text-align: center;
  color: var(--ui-muted);
  background: var(--ui-line-soft);
  border-radius: 999px;
  font-variant-numeric: tabular-nums;
}
.tb-col__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 160px;
  padding: 12px;
}
.tb-empty {
  padding: 28px 8px;
  font-size: 13px;
  text-align: center;
  color: var(--ui-faint);
  border: 1px dashed var(--ui-line);
  border-radius: 8px;
}

/* ─── Vazifa kartasi ─── */
.tb-card {
  position: relative;
  padding: 12px 14px 10px 16px;
  background: var(--ui-surface);
  border: 1px solid var(--ui-line);
  border-radius: 8px;
  cursor: grab;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;

  /* Muhimlik — chapdagi ingichka chiziq */
  &::before {
    content: '';
    position: absolute;
    top: 10px;
    bottom: 10px;
    left: 0;
    width: 3px;
    border-radius: 0 3px 3px 0;
    background: #cbd5e1;
  }
  &.is-high::before {
    background: var(--ui-bad);
  }
  &.is-medium::before {
    background: #f59e0b;
  }

  &:hover {
    border-color: #cbd5e1;
    box-shadow: var(--ui-shadow-hover);
  }
  &:active {
    cursor: grabbing;
  }
  &.is-pending {
    border-color: #f5d49a;
  }
}
.tb-card__top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 8px;
  min-height: 24px;
  margin-bottom: 8px;
}
.tb-card__actions {
  display: flex;
  margin-left: auto;

  .el-button + .el-button {
    margin-left: 0;
  }
}
.tb-deadline {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--ui-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;

  &.deadline-overdue {
    color: var(--ui-bad);
  }
  &.deadline-today {
    color: var(--ui-warn);
  }
}
.tb-badge {
  margin-left: 2px;
  padding: 0 6px;
  font-size: 11px;
  font-weight: 600;
  line-height: 18px;
  white-space: nowrap;
  border-radius: 999px;

  &.is-bad {
    color: var(--ui-bad);
    background: #fef2f2;
  }
  &.is-warn {
    color: var(--ui-warn);
    background: #fffbeb;
  }
}
.tb-card__title {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--ui-ink);
  word-break: break-word;

  &.is-done {
    text-decoration: line-through;
    color: var(--ui-faint);
  }
}
.tb-card__desc {
  margin: 0 0 8px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--ui-muted);
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.tb-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px 12px;
  margin-bottom: 8px;
}
.tb-assignee {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--ui-ink-2);
}
.tb-avatar {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 700;
  color: var(--ui-link);
  background: var(--ui-link-soft);
  border-radius: 50%;
}
.tb-note {
  margin-bottom: 8px;
  padding: 8px 10px;
  font-size: 12px;
  border-radius: 6px;
  border: 1px solid;

  &.is-warn {
    color: #92400e;
    background: #fffbeb;
    border-color: #fde68a;
  }
  &.is-bad {
    color: var(--ui-bad);
    background: #fef2f2;
    border-color: #fecaca;
  }
}
.tb-note__line {
  display: flex;
  align-items: center;
  gap: 6px;
}
.tb-note__meta {
  margin: 4px 0 0;
  font-size: 11px;
  opacity: 0.85;
}
.tb-note__quote {
  margin: 4px 0 0;
  font-style: italic;
  word-break: break-word;
}
.tb-card__foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--ui-line-soft);
}
.tb-created {
  font-size: 12px;
  color: var(--ui-faint);
}
.tb-card__moves {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-left: auto;

  .el-button + .el-button {
    margin-left: 0;
  }
}
.tb-drag-hint {
  margin: 0;
  font-size: 12px;
  text-align: center;
  color: var(--ui-faint);
}

/* ─── Dialoglar ─── */
.form-row {
  display: flex;
  gap: 16px;

  .form-half {
    flex: 1;
  }
}
.request-target {
  margin: 0 0 6px;
  font-size: 15px;
  color: var(--ui-ink);
}
.request-hint {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--ui-muted);
}

/* ─── Tasdiq so'rovlari drawer ─── */
.drawer-empty {
  padding: 30px 0;
  font-size: 14px;
  text-align: center;
  color: var(--ui-faint);
}
.request-card {
  margin-bottom: 12px;
  padding: 12px 14px;
  background: var(--ui-surface);
  border: 1px solid var(--ui-line);
  border-radius: var(--ui-radius);

  h4 {
    margin: 0 0 6px;
    font-size: 14px;
    color: var(--ui-ink);
  }
}
.request-card-meta {
  margin: 2px 0;
  font-size: 12px;
  color: var(--ui-muted);

  &.muted {
    color: var(--ui-faint);
  }
}
.approval-note {
  margin: 4px 0 0;
  font-size: 12px;
  font-style: italic;
  color: var(--ui-ink-2);
  word-break: break-word;
}
.request-card-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

/* ─── Hisobot ─── */
.tb-report-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;

  :deep(.ui-stat__label) {
    min-height: 0;
  }
  :deep(.ui-stat__sub) {
    display: none;
  }
}
.report-bar {
  display: flex;
  height: 10px;
  margin-bottom: 18px;
  overflow: hidden;
  background: var(--ui-line-soft);
  border-radius: 999px;

  .bar-seg {
    height: 100%;
    transition: width 0.3s ease;

    &.todo {
      background: #cbd5e1;
    }
    &.progress {
      background: #f59e0b;
    }
    &.done {
      background: var(--ui-good);
    }
  }
}
.report-subtitle {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--ui-ink);
}

/* ─── Responsive ─── */
@media (max-width: 1280px) {
  .tb-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 1100px) {
  .tb-board {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 768px) {
  .tb-stats,
  .tb-report-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .tb-select,
  .tb-select-lg {
    width: 100%;
  }
  .tb-drag-hint {
    display: none;
  }
}
</style>
