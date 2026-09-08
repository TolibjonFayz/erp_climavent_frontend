<template>
  <div class="tasks-container" v-loading="tasksStore.isLoading">
    <div class="page-header">
      <div class="header-top">
        <div class="header-text">
          <h1>{{ $t('tasks') }}</h1>
          <p class="subtitle">{{ $t('tasksSubtitle') }}</p>
        </div>

        <div class="statistics-tags-horizontal">
          <el-tag size="large" type="info" effect="plain">
            {{ $t('total') }}: {{ sourceTasks.length }}
          </el-tag>
          <el-tag size="large" type="warning" effect="plain">
            {{ $t('statusInProgress') }}: {{ countByStatus('in_progress') }}
          </el-tag>
          <el-tag size="large" type="success" effect="plain">
            {{ $t('statusDone') }}: {{ countByStatus('done') }}
          </el-tag>
          <el-tag v-if="pendingCount > 0" size="large" type="warning" effect="dark">
            {{ $t('taskPendingCount') }}: {{ pendingCount }}
          </el-tag>
          <el-tag v-if="overdueCount > 0" size="large" type="danger" effect="plain">
            {{ $t('overdue') }}: {{ overdueCount }}
          </el-tag>
        </div>
      </div>

      <!-- Tasdiqlovchi uchun: kutayotgan so'rovlar banneri -->
      <el-alert
        v-if="isApprover && tasksStore.pendingApprovals.length"
        class="approval-banner"
        type="warning"
        :closable="false"
        show-icon
      >
        <template #title>
          {{ $t('taskApprovalRequests') }}: {{ tasksStore.pendingApprovals.length }}
          <el-button link type="primary" @click="approvalsDrawer = true">
            {{ $t('taskOpenRequests') }}
          </el-button>
        </template>
      </el-alert>

      <div class="toolbar">
        <el-input
          v-model="searchQuery"
          :placeholder="$t('taskSearchPlaceholder')"
          :prefix-icon="Search"
          clearable
          class="search-input"
        />
        <el-select v-model="priorityFilter" class="priority-filter">
          <el-option :label="$t('allPriorities')" value="all" />
          <el-option :label="$t('priorityHigh')" value="high" />
          <el-option :label="$t('priorityMedium')" value="medium" />
          <el-option :label="$t('priorityLow')" value="low" />
        </el-select>

        <!-- Admin: xodim bo'yicha filtr -->
        <el-select v-if="isAdmin" v-model="employeeFilter" class="employee-filter" filterable>
          <el-option :label="$t('allEmployees')" value="all" />
          <el-option
            v-for="u in employees"
            :key="u.id"
            :label="`${u.firstname} ${u.lastname}`"
            :value="u.id"
          />
        </el-select>

        <el-button :icon="DataAnalysis" size="large" @click="reportDialog = true">
          {{ $t('taskReport') }}
        </el-button>
        <el-button :icon="Download" size="large" @click="exportExcel">
          {{ $t('taskExportExcel') }}
        </el-button>

        <!-- Admin: yangi vazifa biriktirish -->
        <el-button
          v-if="isAdmin"
          type="primary"
          size="large"
          :icon="Plus"
          @click="openCreateDialog"
        >
          {{ $t('newTask') }}
        </el-button>
      </div>
    </div>

    <div class="kanban-board">
      <div
        v-for="column in columns"
        :key="column.status"
        class="kanban-column"
        :class="[`column-${column.status}`, { 'drag-over': dragOverColumn === column.status }]"
        @dragover.prevent
        @dragenter.prevent="dragOverColumn = column.status"
        @dragleave="onDragLeave($event, column.status)"
        @drop="onDrop(column.status)"
      >
        <div class="column-header">
          <span class="column-dot" :class="`dot-${column.status}`"></span>
          <h3>{{ $t(column.labelKey) }}</h3>
          <span class="column-count">{{ filteredTasks(column.status).length }}</span>
        </div>

        <div class="column-body">
          <div
            v-for="task in filteredTasks(column.status)"
            :key="task.id"
            class="task-card"
            :class="[`priority-border-${task.priority}`, { 'is-pending': !!task.pending_status }]"
            draggable="true"
            @dragstart="onDragStart(task.id)"
            @dragend="onDragEnd"
          >
            <div class="task-card-top">
              <el-tag :type="priorityTagType(task.priority)" size="small" effect="light">
                {{ $t(priorityLabelKey(task.priority)) }}
              </el-tag>

              <div class="task-actions" v-if="isAdmin">
                <el-button text size="small" :icon="EditPen" @click="openEditDialog(task)" />
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

            <h4 class="task-title" :class="{ 'task-done': task.status === 'done' }">
              {{ task.title }}
            </h4>
            <p v-if="task.description" class="task-description">{{ task.description }}</p>

            <!-- Admin: vazifa kimga biriktirilgani -->
            <div v-if="isAdmin && task.assignee" class="task-assignee">
              <span class="assignee-avatar">{{ initial(task.assignee) }}</span>
              <span class="assignee-name">
                {{ task.assignee.firstname }} {{ task.assignee.lastname }}
              </span>
            </div>

            <div v-if="task.deadline" class="task-deadline" :class="deadlineClass(task)">
              <el-icon><Calendar /></el-icon>
              <span>{{ formatDeadline(task.deadline) }}</span>
              <span v-if="isOverdue(task)" class="deadline-badge">{{ $t('overdue') }}</span>
              <span v-else-if="isDueToday(task)" class="deadline-badge today">
                {{ $t('dueToday') }}
              </span>
            </div>

            <!-- Tasdiq kutilmoqda -->
            <div v-if="task.pending_status" class="approval-box pending">
              <div class="approval-line">
                <el-icon><Clock /></el-icon>
                <strong>{{ $t('taskApprovalPending') }}</strong>
                <span class="approval-arrow">→ {{ $t(statusLabelKey(task.pending_status)) }}</span>
              </div>
              <p class="approval-meta">
                {{ $t('taskApproverLabel') }}: {{ approverName }}
              </p>
              <p v-if="task.approval_note" class="approval-note">"{{ task.approval_note }}"</p>
            </div>

            <!-- Rad etilgan -->
            <div
              v-else-if="task.approval_result === 'rejected'"
              class="approval-box rejected"
            >
              <div class="approval-line">
                <el-icon><CircleClose /></el-icon>
                <strong>{{ $t('taskWasRejected') }}</strong>
              </div>
              <p v-if="task.approval_reject_reason" class="approval-note">
                "{{ task.approval_reject_reason }}"
              </p>
            </div>

            <div class="task-footer">
              <span class="task-created">{{ formatDateRelative(task.createdAt) }}</span>

              <div class="task-move-buttons">
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

                <!-- Oldinga siljish -->
                <template v-else>
                  <el-button
                    v-if="nextStatus(task.status)"
                    size="small"
                    :type="task.status === 'todo' ? 'primary' : 'success'"
                    plain
                    @click="advance(task)"
                  >
                    {{ isAdmin ? $t(advanceLabelKey(task.status)) : $t('taskRequestApproval') }}
                  </el-button>
                  <el-button
                    v-if="task.status === 'done'"
                    size="small"
                    type="info"
                    plain
                    @click="moveBack(task, 'todo')"
                  >
                    {{ $t('reopenTask') }}
                  </el-button>
                  <el-button
                    v-else-if="task.status === 'in_progress'"
                    size="small"
                    type="info"
                    plain
                    @click="moveBack(task, 'todo')"
                  >
                    {{ $t('taskBackToTodo') }}
                  </el-button>
                </template>
              </div>
            </div>
          </div>

          <el-empty
            v-if="filteredTasks(column.status).length === 0"
            :description="emptyText(column.status)"
            :image-size="64"
          />
        </div>
      </div>
    </div>

    <p class="drag-hint">{{ isAdmin ? $t('dragHint') : $t('dragHintApproval') }}</p>

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
      <div class="report-cards">
        <div class="report-card">
          <span class="report-card-label">{{ $t('total') }}</span>
          <span class="report-card-value">{{ report.total }}</span>
        </div>
        <div class="report-card todo">
          <span class="report-card-label">{{ $t('statusTodo') }}</span>
          <span class="report-card-value">{{ report.todo }}</span>
        </div>
        <div class="report-card progress">
          <span class="report-card-label">{{ $t('statusInProgress') }}</span>
          <span class="report-card-value">{{ report.in_progress }}</span>
        </div>
        <div class="report-card done">
          <span class="report-card-label">{{ $t('statusDone') }}</span>
          <span class="report-card-value">{{ report.done }}</span>
        </div>
        <div class="report-card pending">
          <span class="report-card-label">{{ $t('taskPendingCount') }}</span>
          <span class="report-card-value">{{ report.pending }}</span>
        </div>
        <div class="report-card overdue">
          <span class="report-card-label">{{ $t('overdue') }}</span>
          <span class="report-card-value">{{ report.overdue }}</span>
        </div>
        <div class="report-card rate">
          <span class="report-card-label">{{ $t('taskCompletionRate') }}</span>
          <span class="report-card-value">{{ report.completionRate }}%</span>
        </div>
        <div class="report-card avg">
          <span class="report-card-label">{{ $t('taskAvgCompletionDays') }}</span>
          <span class="report-card-value">{{ report.avgDays ?? '—' }}</span>
        </div>
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
  </div>
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
  task.assignee
    ? `${task.assignee.firstname} ${task.assignee.lastname || ''}`.trim()
    : t('unknown')

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

const barWidth = (value) =>
  report.value.total ? `${(value / report.value.total) * 100}%` : '0%'

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
    [t('taskPendingCount')]: task.pending_status
      ? t(statusLabelKey(task.pending_status))
      : '—',
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
    { [t('colEmployee')]: t('taskCompletionRate'), [t('total')]: `${report.value.completionRate}%` },
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
.tasks-container {
  width: 100%;
  padding: 32px;
  background: #f5f7fa;
  min-height: 100vh;
  overflow-x: hidden;
  box-sizing: border-box;
}

.page-header {
  margin-bottom: 24px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.header-text {
  h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
    color: #1f2937;
  }

  .subtitle {
    margin: 4px 0 0;
    font-size: 14px;
    color: #6b7280;
  }
}

.statistics-tags-horizontal {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.approval-banner {
  margin-bottom: 16px;
}

.toolbar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;

  .search-input {
    max-width: 280px;
    flex: 1;
    min-width: 180px;
  }

  .priority-filter {
    width: 170px;
  }

  .employee-filter {
    width: 200px;
  }
}

/* ─── Kanban board ───────────────────────────────── */
.kanban-board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  align-items: start;
}

.kanban-column {
  background: #eef1f6;
  border-radius: 16px;
  padding: 16px;
  min-height: 320px;
  border: 2px dashed transparent;
  transition:
    border-color 0.2s ease,
    background 0.2s ease;

  &.drag-over {
    border-color: #409eff;
    background: #e3efff;
  }

  /* "Jarayonda" ustuni — sariq ohang */
  &.column-in_progress {
    background: #fdf6e3;
  }
}

.column-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  padding: 0 4px;

  h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: #374151;
    flex: 1;
  }
}

.column-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;

  &.dot-todo {
    background: #909399;
  }
  &.dot-in_progress {
    background: #e6a23c;
  }
  &.dot-done {
    background: #67c23a;
  }
}

.column-count {
  background: white;
  color: #6b7280;
  font-size: 13px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 999px;
}

.column-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ─── Task card ──────────────────────────────────── */
.task-card {
  background: white;
  border-radius: 12px;
  padding: 14px 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border-left: 4px solid #d1d5db;
  cursor: grab;
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
  }

  &:active {
    cursor: grabbing;
  }

  &.is-pending {
    box-shadow: 0 0 0 2px #f0c78a inset;
  }

  &.priority-border-high {
    border-left-color: #f56c6c;
  }
  &.priority-border-medium {
    border-left-color: #e6a23c;
  }
  &.priority-border-low {
    border-left-color: #909399;
  }
}

.task-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  min-height: 24px;
}

.task-actions {
  display: flex;
  align-items: center;

  .el-button + .el-button {
    margin-left: 0;
  }
}

.task-title {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  word-break: break-word;

  &.task-done {
    text-decoration: line-through;
    color: #9ca3af;
  }
}

.task-description {
  margin: 0 0 10px;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-assignee {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.assignee-avatar {
  width: 24px;
  height: 24px;
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

.assignee-name {
  font-size: 13px;
  color: #4b5563;
  font-weight: 500;
}

.task-deadline {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 10px;

  &.deadline-overdue {
    color: #f56c6c;
  }

  &.deadline-today {
    color: #e6a23c;
  }
}

.deadline-badge {
  background: #fde2e2;
  color: #f56c6c;
  font-size: 11px;
  font-weight: 600;
  padding: 1px 8px;
  border-radius: 999px;

  &.today {
    background: #faecd8;
    color: #e6a23c;
  }
}

/* ─── Tasdiqlash bloki ───────────────────────────── */
.approval-box {
  border-radius: 8px;
  padding: 8px 10px;
  margin-bottom: 10px;
  font-size: 12px;

  &.pending {
    background: #fdf6ec;
    border: 1px solid #f5dab1;
    color: #b88230;
  }

  &.rejected {
    background: #fef0f0;
    border: 1px solid #fbc4c4;
    color: #c45656;
  }
}

.approval-line {
  display: flex;
  align-items: center;
  gap: 6px;
}

.approval-arrow {
  font-weight: 600;
}

.approval-meta {
  margin: 4px 0 0;
  font-size: 11px;
  opacity: 0.85;
}

.approval-note {
  margin: 4px 0 0;
  font-style: italic;
  word-break: break-word;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  border-top: 1px solid #f3f4f6;
  padding-top: 10px;
  flex-wrap: wrap;
}

.task-created {
  font-size: 12px;
  color: #9ca3af;
}

.task-move-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.drag-hint {
  margin: 18px 4px 0;
  font-size: 12px;
  color: #9ca3af;
  text-align: center;
}

.form-row {
  display: flex;
  gap: 16px;

  .form-half {
    flex: 1;
  }
}

/* ─── So'rov/rad dialoglari ──────────────────────── */
.request-target {
  margin: 0 0 6px;
  font-size: 15px;
  color: #1f2937;
}

.request-hint {
  margin: 0 0 12px;
  font-size: 13px;
  color: #6b7280;
}

/* ─── Tasdiq so'rovlari drawer ───────────────────── */
.drawer-empty {
  color: #9ca3af;
  font-size: 14px;
  text-align: center;
  padding: 30px 0;
}

.request-card {
  border: 1px solid #ebeef5;
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 12px;
  background: #fffdf7;

  h4 {
    margin: 0 0 6px;
    font-size: 14px;
    color: #1f2937;
  }
}

.request-card-meta {
  margin: 2px 0;
  font-size: 12px;
  color: #6b7280;

  &.muted {
    color: #b0b4bb;
  }
}

.request-card-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

/* ─── Hisobot ────────────────────────────────────── */
.report-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.report-card {
  background: #f8fafc;
  border: 1px solid #eef0f4;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;

  &.todo {
    border-left: 4px solid #909399;
  }
  &.progress {
    border-left: 4px solid #e6a23c;
  }
  &.done {
    border-left: 4px solid #67c23a;
  }
  &.pending {
    border-left: 4px solid #f0a020;
  }
  &.overdue {
    border-left: 4px solid #f56c6c;
  }
  &.rate,
  &.avg {
    border-left: 4px solid #409eff;
  }
}

.report-card-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #6b7280;
}

.report-card-value {
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
}

.report-bar {
  display: flex;
  height: 12px;
  border-radius: 999px;
  overflow: hidden;
  background: #eef1f6;
  margin-bottom: 18px;

  .bar-seg {
    height: 100%;
    transition: width 0.3s ease;

    &.todo {
      background: #909399;
    }
    &.progress {
      background: #e6a23c;
    }
    &.done {
      background: #67c23a;
    }
  }
}

.report-subtitle {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

/* ─── Responsive ─────────────────────────────────── */
@media (max-width: 1100px) {
  .kanban-board {
    grid-template-columns: 1fr;
  }

  .kanban-column {
    min-height: auto;
  }
}

@media (max-width: 768px) {
  .tasks-container {
    padding: 20px 14px;
  }

  .header-top {
    flex-direction: column;
    gap: 12px;
  }

  .toolbar {
    .search-input,
    .priority-filter,
    .employee-filter {
      max-width: 100%;
      width: 100%;
    }
  }

  .drag-hint {
    display: none;
  }
}
</style>
