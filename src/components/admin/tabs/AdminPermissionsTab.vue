<template>
  <div class="adm-page">
    <div class="page-head">
      <span class="page-accent"></span>
      <h2 class="page-title">{{ $t('admPermTitle') }}</h2>
    </div>
    <div class="adm-toolbar">
      <el-input
        v-model="search"
        :placeholder="$t('admPermSearchPh')"
        :prefix-icon="Search"
        clearable
        class="adm-search"
      />
    </div>
    <div class="tbl-wrap">
      <el-table :data="users" stripe border style="width: 100%" :empty-text="$t('admNoData')">
        <el-table-column :label="$t('admColUser')" min-width="250" fixed="left">
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
          v-for="page in PAGES"
          :key="page.key"
          :label="$t(page.label)"
          min-width="110"
          align="center"
        >
          <template #default="{ row }">
            <el-switch
              :model-value="hasPermission(row, page.key)"
              :loading="updating[`${row.id}-${page.key}`]"
              style="--el-switch-on-color: #15803d"
              @change="(val) => togglePermission(row, page.key, val)"
            />
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useUsersStore } from '@/stores/user'
import { errorText } from '@/utils/errorText'

const { t } = useI18n()
const usersStore = useUsersStore()

const PAGES = [
  { key: 'customers', label: 'admPermCustomers' },
  { key: 'sites', label: 'admTabObjects' },
  { key: 'competitors', label: 'admPermCompetitors' },
  { key: 'kp', label: 'admTabKp' },
  { key: 'dogovor', label: 'admPermDogovor' },
  { key: 'loyiha', label: 'admPermLoyiha' },
  { key: 'sklad', label: 'admPermSklad' },
  { key: 'attendance', label: 'admPermAttendance' },
  { key: 'tasks', label: 'admPermTasks' },
  { key: 'boss', label: 'admPermBoss' },
]

const search = ref('')
const users = computed(() => {
  const s = search.value.toLowerCase().trim()
  if (!s) return usersStore.allUsers
  return usersStore.allUsers.filter((u) =>
    ['firstname', 'lastname', 'username', 'phone_number'].some((k) => (u[k] ?? '').toLowerCase().includes(s)),
  )
})

// Boss sahifasi sukut bo'yicha yopiq (faqat direktor — id 16), qolganlari ochiq
const hasPermission = (user, key) => {
  if (key === 'boss') {
    if (user.permissions?.boss !== undefined) return user.permissions.boss
    return Number(user.id) === 16
  }
  return user.permissions?.[key] !== false
}

const updating = ref({})
async function togglePermission(user, key, val) {
  const permissions = { ...(user.permissions || {}), [key]: val }
  updating.value[`${user.id}-${key}`] = true
  try {
    await usersStore.updateUser(user.id, { permissions })
    user.permissions = permissions
    ElMessage.success(t('admPermSaved'))
  } catch (err) {
    ElMessage.error(errorText(err, t('xatolikYuzBerdi')))
  } finally {
    updating.value[`${user.id}-${key}`] = false
  }
}
</script>
