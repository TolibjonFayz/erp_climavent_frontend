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
          <el-tag size="large" type="primary" effect="plain">
            {{ $t('statusInProgress') }}: {{ countByStatus('in_progress') }}
          </el-tag>
          <el-tag size="large" type="success" effect="plain">
            {{ $t('statusDone') }}: {{ countByStatus('done') }}
          </el-tag>
          <el-tag v-if="overdueCount > 0" size="large" type="danger" effect="plain">
            {{ $t('overdue') }}: {{ overdueCount }}
          </el-tag>
        </div>
      </div>

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
            :class="`priority-border-${task.priority}`"
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

            <div class="task-footer">
              <span class="task-created">{{ formatDateRelative(task.createdAt) }}</span>

              <div class="task-move-buttons">
                <el-button
                  v-if="task.status === 'todo'"
                  size="small"
                  type="primary"
                  plain
                  @click="moveTask(task.id, 'in_progress')"
                >
                  {{ $t('startTask') }}
                </el-button>
                <el-button
                  v-if="task.status === 'in_progress'"
                  size="small"
                  type="success"
                  plain
                  @click="moveTask(task.id, 'done')"
                >
                  {{ $t('completeTask') }}
                </el-button>
                <el-button
                  v-if="task.status === 'done'"
                  size="small"
                  type="info"
                  plain
                  @click="moveTask(task.id, 'todo')"
                >
                  {{ $t('reopenTask') }}
                </el-button>
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

    <p class="drag-hint">{{ $t('dragHint') }}</p>

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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import { useUsersStore } from '@/stores/user'
import { formatDateRelative } from '@/composables/useDateFormatter'
import { ElMessage } from 'element-plus'
import { Plus, Search, EditPen, Delete, Calendar } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const tasksStore = useTasksStore()
const usersStore = useUsersStore()

const currentUserId = Number(localStorage.getItem('userid'))
const isAdmin = computed(() => !!usersStore.currentUser?.is_admin)

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
  if (id) {
    const task = sourceTasks.value.find((t) => t.id === id)
    if (task && task.status !== status) moveTask(id, status)
  }
}

const moveTask = async (id, status) => {
  try {
    await tasksStore.updateStatus(id, status)
    await refresh()
  } catch {
    ElMessage.error(t('xatolikYuzBerdi'))
  }
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
  if (isAdmin.value) {
    await Promise.all([tasksStore.getAllTasks(), usersStore.getAllUsers()])
  } else {
    await tasksStore.getMyTasks(currentUserId)
  }
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
    background: #409eff;
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
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;

  &:hover {
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  &:active {
    cursor: grabbing;
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

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  border-top: 1px solid #f3f4f6;
  padding-top: 10px;
}

.task-created {
  font-size: 12px;
  color: #9ca3af;
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
