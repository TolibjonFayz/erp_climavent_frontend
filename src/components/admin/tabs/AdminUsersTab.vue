<template>
  <div class="adm-page">
    <div class="page-head">
      <span class="page-accent"></span>
      <h2 class="page-title">{{ $t('admAllUsers') }}</h2>
    </div>
    <div class="adm-toolbar">
      <el-input
        v-model="search"
        :placeholder="$t('admUsersSearchPh')"
        :prefix-icon="Search"
        clearable
        class="adm-search"
      />
      <el-select v-model="roleFilter" :placeholder="$t('admByRole')" clearable class="adm-select">
        <el-option label="Admin" value="admin" />
        <el-option :label="$t('admRoleUser')" value="user" />
      </el-select>
      <el-select v-model="statusFilter" :placeholder="$t('admStatus')" clearable class="adm-select">
        <el-option :label="$t('admActive')" value="active" />
        <el-option :label="$t('admBlocked')" value="blocked" />
      </el-select>
      <button class="adm-reset-btn" @click="resetFilters">
        <el-icon><RefreshLeft /></el-icon> {{ $t('admReset') }}
      </button>
      <el-button type="primary" :icon="Plus" class="adm-add-btn" @click="createUserVisible = true">
        {{ $t('admAddUser') }}
      </el-button>
    </div>
    <div class="tbl-wrap">
      <el-table
        :data="filteredUsers"
        :row-class-name="({ row }) => (row.is_blocked ? 'row--blocked' : '')"
        stripe
        border
        style="width: 100%"
        :empty-text="$t('admNoData')"
      >
        <el-table-column label="№" type="index" width="75" align="center" />
        <el-table-column prop="id" label="ID" width="75" />
        <el-table-column :label="$t('admColUser')" min-width="180">
          <template #default="{ row }">
            <div class="user-cell">
              <div class="user-cell__av" :class="row.is_admin ? 'av--admin' : 'av--user'">
                {{ row.firstname?.charAt(0) || row.username?.charAt(0) || '?' }}
              </div>
              <div>
                <div class="user-cell__name">{{ row.firstname }} {{ row.lastname }}</div>
                <div class="user-cell__un">{{ '@' + row.username }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('admColLastSeen')"
          min-width="160"
          sortable
          :sort-method="(a, b) => new Date(a.last_seen_at || 0) - new Date(b.last_seen_at || 0)"
        >
          <template #default="{ row }">
            <span
              class="seen"
              :class="{ 'is-online': isOnline(row.last_seen_at), 'is-never': !row.last_seen_at }"
              :title="row.last_seen_at ? formatDateTime(row.last_seen_at) : ''"
            >
              <span class="seen__dot"></span>{{ lastSeenText(t, row.last_seen_at) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="phone_number" :label="$t('admPhone')" min-width="130" />
        <el-table-column prop="email" label="Email" min-width="150" />
        <el-table-column :label="$t('admRole')" width="150" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_admin ? 'success' : 'warning'" size="small">
              {{ row.is_admin ? 'Admin' : $t('admRoleUser') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('admStatus')" width="150" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_blocked ? 'danger' : 'success'" size="small">
              {{ row.is_blocked ? $t('admBlocked') : $t('admActive') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('admActions')" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <div class="action-btns">
              <el-tooltip :content="$t('admDetails')" placement="top">
                <button class="act-btn act-btn--view" @click="openUserDetail(row)">
                  <el-icon><View /></el-icon>
                </button>
              </el-tooltip>
              <el-tooltip
                v-if="row.id !== usersStore.currentUser?.id"
                :content="row.is_admin ? $t('admRemoveAdmin') : $t('admMakeAdmin')"
                placement="top"
              >
                <button
                  :class="row.is_admin ? 'act-btn act-btn--demote' : 'act-btn act-btn--promote'"
                  @click="toggleAdminRole(row)"
                >
                  <el-icon><component :is="row.is_admin ? Minus : StarFilled" /></el-icon>
                </button>
              </el-tooltip>
              <el-tooltip
                v-if="row.id !== usersStore.currentUser?.id"
                :content="row.is_blocked ? $t('admUnblock') : $t('admBlock')"
                placement="top"
              >
                <button
                  :class="row.is_blocked ? 'act-btn act-btn--unblock' : 'act-btn act-btn--block'"
                  @click="toggleBlockUser(row)"
                >
                  <el-icon><component :is="row.is_blocked ? Unlock : Lock" /></el-icon>
                </button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- ═══════ XODIM OYNASI ═══════ -->
    <el-drawer
      v-model="detailVisible"
      direction="rtl"
      size="min(780px, 100vw)"
      :title="$t('admUserDrawerTitle', { u: selectedUser?.username || '' })"
      destroy-on-close
    >
      <div v-if="selectedUser" class="user-drawer">
        <div class="user-drawer__avatar" :class="selectedUser.is_admin ? 'av--admin' : 'av--user'">
          <el-icon :size="30"><UserFilled /></el-icon>
        </div>
        <div class="user-drawer__name">{{ selectedUser.firstname }} {{ selectedUser.lastname }}</div>
        <div class="user-drawer__un">{{ '@' + selectedUser.username }}</div>
        <div class="user-drawer__tags">
          <el-tag :type="selectedUser.is_admin ? 'success' : 'warning'">
            {{ selectedUser.is_admin ? 'Admin' : $t('admRoleUser') }}
          </el-tag>
          <el-tag :type="selectedUser.is_blocked ? 'danger' : 'success'">
            {{ selectedUser.is_blocked ? $t('admBlocked') : $t('admActive') }}
          </el-tag>
        </div>
        <div
          class="seen user-drawer__seen"
          :class="{ 'is-online': isOnline(selectedUser.last_seen_at), 'is-never': !selectedUser.last_seen_at }"
        >
          <span class="seen__dot"></span>
          {{
            isOnline(selectedUser.last_seen_at)
              ? $t('actOnlineNow')
              : $t('admLastSeenPrefix', { x: lastSeenText(t, selectedUser.last_seen_at) })
          }}
        </div>

        <!-- Faollik qisqacha -->
        <div class="user-drawer__kpis">
          <div class="udk">
            <span class="udk__lbl">{{ $t('admLastLogin') }}</span>
            <b class="udk__val">{{ summary?.last_login ? formatDateTime(summary.last_login.createdAt) : '—' }}</b>
            <span v-if="summary?.last_login" class="udk__sub">{{ deviceText(t, summary.last_login) }}</span>
          </div>
          <div class="udk">
            <span class="udk__lbl">{{ $t('admTodayActions') }}</span>
            <b class="udk__val">{{ fmtNum(summary?.today ?? 0) }}</b>
          </div>
          <div class="udk">
            <span class="udk__lbl">{{ $t('admIn30Days') }}</span>
            <b class="udk__val">{{ fmtNum(monthTotal) }}</b>
            <span class="udk__sub">
              {{
                $t('admMonthBreakdown', {
                  c: summary?.last_30_days?.create || 0,
                  u: summary?.last_30_days?.update || 0,
                  d: summary?.last_30_days?.delete || 0,
                })
              }}
            </span>
          </div>
          <div class="udk">
            <span class="udk__lbl">{{ $t('admTotalRecords') }}</span>
            <b class="udk__val">{{ fmtNum(summary?.total ?? 0) }}</b>
          </div>
        </div>

        <el-divider />

        <div class="user-drawer__fields">
          <div class="udf-row">
            <span class="udf-lbl"><el-icon><Phone /></el-icon> {{ $t('admPhone') }}</span>
            <span class="udf-val">{{ selectedUser.phone_number || '—' }}</span>
          </div>
          <div class="udf-row">
            <span class="udf-lbl"><el-icon><Message /></el-icon> Email</span>
            <span class="udf-val">{{ selectedUser.email || '—' }}</span>
          </div>
          <div class="udf-row">
            <span class="udf-lbl"><el-icon><Key /></el-icon> ID</span>
            <span class="udf-val">{{ selectedUser.id }}</span>
          </div>
          <div class="udf-row">
            <span class="udf-lbl"><el-icon><UserFilled /></el-icon> {{ $t('admAddedPartners') }}</span>
            <span class="udf-val">{{ $t('admNCount', { n: partnerCount(selectedUser.username) }) }}</span>
          </div>
          <div class="udf-row">
            <span class="udf-lbl"><el-icon><OfficeBuilding /></el-icon> {{ $t('admAddedObjects') }}</span>
            <span class="udf-val">{{ $t('admNCount', { n: objectCount(selectedUser.username) }) }}</span>
          </div>
        </div>

        <el-divider />

        <!-- Barcha amallar bitta ustunda: bir xil kenglik, ikonka va matn orasida bo'shliq -->
        <div class="user-drawer__actions">
          <el-button :icon="Edit" @click="openEditUser(selectedUser)">{{ $t('admEditInfo') }}</el-button>
          <template v-if="selectedUser.id !== usersStore.currentUser?.id">
            <el-button :icon="Key" @click="openResetPassword(selectedUser)">{{ $t('admResetPassword') }}</el-button>
            <el-button
              :type="selectedUser.is_admin ? 'warning' : 'success'"
              :icon="selectedUser.is_admin ? Minus : StarFilled"
              @click="toggleAdminRole(selectedUser, true)"
            >
              {{ selectedUser.is_admin ? $t('admRemoveAdmin') : $t('admMakeAdmin') }}
            </el-button>
            <el-button
              :type="selectedUser.is_blocked ? 'success' : 'danger'"
              :icon="selectedUser.is_blocked ? Unlock : Lock"
              @click="toggleBlockUser(selectedUser, true)"
            >
              {{ selectedUser.is_blocked ? $t('admUnblock') : $t('admBlock') }}
            </el-button>
            <el-button type="danger" plain :icon="Delete" @click="deleteUser(selectedUser)">
              {{ $t('admDeleteUser') }}
            </el-button>
          </template>
        </div>

        <el-tabs v-model="drawerTab" class="user-drawer__tabs">
          <el-tab-pane :label="$t('admTabActivity')" name="activity">
            <ActivityFeed :user-id="selectedUser.id" />
          </el-tab-pane>
          <el-tab-pane :label="$t('admAdminActionsOnUser')" name="admin">
            <div class="user-audit-list">
              <div
                v-for="log in selectedUserLogs"
                :key="log.id"
                class="user-audit-item"
                :class="'audit-entry--' + log.type"
              >
                <el-icon style="margin-right: 8px; color: #409eff"
                  ><component :is="auditIcon(log.action)"
                /></el-icon>
                <span>{{ log.message }}</span>
                <span class="user-audit-time">{{ logTime(log) }}</span>
              </div>
              <div v-if="!selectedUserLogs.length" class="user-audit-empty">
                {{ $t('admNoActionsOnUser') }}
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-drawer>

    <!-- ═══════ YANGI FOYDALANUVCHI ═══════ -->
    <CreateUserDialog v-model="createUserVisible" />

    <!-- ═══════ TAHRIRLASH ═══════ -->
    <el-dialog v-model="editVisible" :title="$t('admEditInfoTitle')" width="520px" destroy-on-close>
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-position="top" @submit.prevent="saveEdit">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item :label="$t('admFirstname')" prop="firstname">
              <el-input v-model="editForm.firstname" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('admLastname')" prop="lastname">
              <el-input v-model="editForm.lastname" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item :label="$t('admUsernameLogin')" prop="username">
              <el-input v-model="editForm.username" autocomplete="off" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('admPhone')" prop="phone_number">
              <el-input v-model="editForm.phone_number" placeholder="+998..." />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Email" prop="email">
              <el-input v-model="editForm.email" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">{{ $t('cancel') }}</el-button>
        <el-button type="primary" :loading="editLoading" @click="saveEdit">{{ $t('save') }}</el-button>
      </template>
    </el-dialog>

    <!-- ═══════ PAROLNI TIKLASH ═══════ -->
    <el-dialog v-model="resetVisible" :title="$t('admResetPassword')" width="420px" destroy-on-close>
      <p class="reset-pw-hint">
        <b>{{ '@' + (resetUser?.username || '') }}</b> — {{ $t('admResetHint') }}
      </p>
      <el-form ref="resetFormRef" :model="resetForm" :rules="resetRules" label-position="top" @submit.prevent="saveReset">
        <el-form-item :label="$t('admNewPassword')" prop="password">
          <el-input v-model="resetForm.password" type="password" show-password autocomplete="new-password" />
        </el-form-item>
        <el-form-item :label="$t('admRepeatNewPassword')" prop="confirm">
          <el-input v-model="resetForm.confirm" type="password" show-password autocomplete="new-password" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetVisible = false">{{ $t('cancel') }}</el-button>
        <el-button type="primary" :loading="resetLoading" @click="saveReset">{{ $t('save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Delete,
  Edit,
  Key,
  Lock,
  Message,
  Minus,
  OfficeBuilding,
  Phone,
  Plus,
  RefreshLeft,
  Search,
  StarFilled,
  Unlock,
  UserFilled,
  View,
} from '@element-plus/icons-vue'
import ActivityFeed from '@/components/admin/ActivityFeed.vue'
import CreateUserDialog from '@/components/admin/CreateUserDialog.vue'
import activityApi from '@/api/activity'
import usersApi from '@/api/users'
import { useUsersStore } from '@/stores/user'
import { usePartnersStore } from '@/stores/partners'
import { useComeAndGoInsideStore } from '@/stores/comeandgoInside'
import { errorText } from '@/utils/errorText'
import { fmtNum, formatDateTime } from '@/utils/format'
import { deviceText, isOnline, lastSeenText } from '@/utils/activity'
import { auditIcon, logTime, useAdminAudit } from '../adminShared'

const { t } = useI18n()
const usersStore = useUsersStore()
const partnersStore = usePartnersStore()
const comeandgoInsideStore = useComeAndGoInsideStore()
const { fetchByTarget, addAuditLog } = useAdminAudit()

const who = (u) => `"${u.firstname} ${u.lastname}" (@${u.username})`

// ─── Filtrlar ───
const search = ref('')
const roleFilter = ref('')
const statusFilter = ref('')
function resetFilters() {
  search.value = ''
  roleFilter.value = ''
  statusFilter.value = ''
}
const filteredUsers = computed(() => {
  const s = search.value.toLowerCase().trim()
  return usersStore.allUsers.filter((u) => {
    const matchSearch =
      !s ||
      ['firstname', 'lastname', 'username', 'phone_number'].some((k) =>
        (u[k] ?? '').toLowerCase().includes(s),
      )
    const matchRole = !roleFilter.value || (roleFilter.value === 'admin' ? u.is_admin : !u.is_admin)
    const matchStatus =
      !statusFilter.value || (statusFilter.value === 'blocked' ? u.is_blocked : !u.is_blocked)
    return matchSearch && matchRole && matchStatus
  })
})

// ─── Rol va blok ───
async function confirmAction(message, type = 'warning') {
  try {
    await ElMessageBox.confirm(message, t('admConfirm'), {
      confirmButtonText: t('admYes'),
      cancelButtonText: t('cancel'),
      type,
    })
    return true
  } catch {
    return false
  }
}

async function toggleAdminRole(user, closeDrawer = false) {
  const newRole = !user.is_admin
  const label = newRole ? t('admMakeAdmin') : t('admRemoveAdmin')
  if (!(await confirmAction(`${who(user)} — ${label}?`))) return
  try {
    await usersStore.updateUser(user.id, { is_admin: newRole })
    user.is_admin = newRole
    if (closeDrawer) detailVisible.value = false
    addAuditLog({
      action: 'role',
      message: `${who(user)} — ${newRole ? t('admLogMadeAdmin') : t('admLogRemovedAdmin')}`,
      type: newRole ? 'success' : 'warning',
      target_id: user.id,
    })
    ElMessage.success(t('admDoneOk', { x: label }))
  } catch (err) {
    ElMessage.error(errorText(err, t('xatolikYuzBerdi')))
  }
}

async function toggleBlockUser(user, closeDrawer = false) {
  const newBlock = !user.is_blocked
  const label = newBlock ? t('admBlock') : t('admUnblock')
  if (!(await confirmAction(`${who(user)} — ${label}?`, newBlock ? 'error' : 'warning'))) return
  try {
    await usersStore.updateUser(user.id, { is_blocked: newBlock })
    user.is_blocked = newBlock
    if (closeDrawer) detailVisible.value = false
    addAuditLog({
      action: newBlock ? 'block' : 'unblock',
      message: `${who(user)} — ${newBlock ? t('admActBlock') : t('admActUnblock')}`,
      type: newBlock ? 'danger' : 'success',
      target_id: user.id,
    })
    ElMessage.success(t('admDoneOk', { x: label }))
  } catch (err) {
    ElMessage.error(errorText(err, t('xatolikYuzBerdi')))
  }
}

async function deleteUser(user) {
  try {
    await ElMessageBox.confirm(t('admDeleteUserConfirm', { u: who(user) }), t('admDeleteUser'), {
      confirmButtonText: t('admDelete'),
      cancelButtonText: t('cancel'),
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await usersApi.remove(user.id)
    usersStore.allUsers = usersStore.allUsers.filter((u) => u.id !== user.id)
    detailVisible.value = false
    addAuditLog({
      action: 'delete',
      message: `${who(user)} — ${t('admLogUserDeleted')}`,
      type: 'danger',
      target_id: user.id,
    })
    ElMessage.success(t('admUserDeleted', { u: user.username }))
  } catch (err) {
    ElMessage.error(errorText(err, t('admUserNotDeleted')))
  }
}

// ─── Xodim oynasi ───
const detailVisible = ref(false)
const selectedUser = ref(null)
const selectedUserLogs = ref([])
const drawerTab = ref('activity')
const summary = ref(null)
const monthTotal = computed(() =>
  Object.values(summary.value?.last_30_days || {}).reduce((a, b) => a + b, 0),
)

async function openUserDetail(user) {
  selectedUser.value = user
  detailVisible.value = true
  drawerTab.value = 'activity'
  summary.value = null
  activityApi
    .userSummary(user.id)
    .then((s) => {
      if (selectedUser.value?.id === user.id) summary.value = s
    })
    .catch(() => {})
  selectedUserLogs.value = await fetchByTarget(user.username)
  addAuditLog({
    action: 'view',
    message: `${who(user)} — ${t('admLogProfileViewed')}`,
    type: 'info',
    target_id: user.id,
  })
}

const partnerCount = (username) =>
  partnersStore.allPartners.filter((p) => p.user?.username === username).length
const objectCount = (username) =>
  comeandgoInsideStore.allComeAndGoInsides.filter(
    (o) => o.come_and_go_father?.user?.username === username,
  ).length

// ─── Yangi xodim ───
const createUserVisible = ref(false)

// ─── Tahrirlash ───
const required = (key) => ({ required: true, message: t(key), trigger: 'blur' })
const usernameRules = [
  required('admValUsername'),
  { pattern: /^\S+$/, message: t('admValUsernameSpace'), trigger: 'blur' },
]
const editVisible = ref(false)
const editLoading = ref(false)
const editFormRef = ref(null)
const editTarget = ref(null)
const editForm = reactive({ firstname: '', lastname: '', username: '', phone_number: '', email: '' })
// Email tekshirilmaydi: bazada eski "." kabi qiymatlar bor — ular ismni tahrirlashni to'smasin
const editRules = {
  firstname: [required('admValFirstname')],
  lastname: [required('admValLastname')],
  username: usernameRules,
}

function openEditUser(user) {
  editTarget.value = user
  Object.assign(editForm, {
    firstname: user.firstname || '',
    lastname: user.lastname || '',
    username: user.username || '',
    phone_number: user.phone_number || '',
    email: user.email || '',
  })
  editVisible.value = true
}

async function saveEdit() {
  const valid = await editFormRef.value?.validate().catch(() => false)
  if (!valid) return
  const user = editTarget.value
  editLoading.value = true
  try {
    const payload = { ...editForm, username: editForm.username.trim() }
    await usersStore.updateUser(user.id, payload)
    // Jadval, drawer va ro'yxatdagi yozuv bir xil obyekt — joyida yangilaymiz
    Object.assign(user, payload)
    addAuditLog({
      action: 'edit',
      message: `${who(payload)} — ${t('admLogEdited')}`,
      type: 'info',
      target_id: user.id,
    })
    ElMessage.success(t('admSaved'))
    editVisible.value = false
  } catch (err) {
    ElMessage.error(errorText(err, t('admNotSaved')))
  } finally {
    editLoading.value = false
  }
}

// ─── Parolni tiklash ───
const resetVisible = ref(false)
const resetLoading = ref(false)
const resetFormRef = ref(null)
const resetUser = ref(null)
const resetForm = reactive({ password: '', confirm: '' })
const resetRules = {
  password: [required('admValPassword'), { min: 6, message: t('admValPasswordMin'), trigger: 'blur' }],
  confirm: [
    required('admValPasswordRepeat'),
    {
      validator: (_rule, value, cb) =>
        value === resetForm.password ? cb() : cb(new Error(t('admValPasswordMismatch'))),
      trigger: 'blur',
    },
  ],
}

function openResetPassword(user) {
  resetUser.value = user
  Object.assign(resetForm, { password: '', confirm: '' })
  resetVisible.value = true
}

async function saveReset() {
  const valid = await resetFormRef.value?.validate().catch(() => false)
  if (!valid) return
  const user = resetUser.value
  resetLoading.value = true
  try {
    await usersStore.updateUserPassword(user.id, { password: resetForm.password })
    addAuditLog({
      action: 'password',
      message: `${who(user)} — ${t('admLogPasswordReset')}`,
      type: 'warning',
      target_id: user.id,
    })
    ElMessage.success(t('admPasswordUpdated', { u: user.username }))
    resetVisible.value = false
  } catch (err) {
    ElMessage.error(errorText(err, t('admPasswordNotUpdated')))
  } finally {
    resetLoading.value = false
  }
}
</script>
