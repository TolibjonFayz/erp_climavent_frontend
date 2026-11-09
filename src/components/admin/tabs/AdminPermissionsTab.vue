<template>
  <div class="adm-page perm">
    <div class="perm-head">
      <div>
        <div class="page-head">
          <span class="page-accent"></span>
          <h2 class="page-title">{{ $t('admPermTitle') }}</h2>
        </div>
        <p class="perm-sub">{{ $t('admPermSub') }}</p>
      </div>
      <el-segmented v-model="view" :options="views" />
    </div>

    <!-- ─── Xodim bo'yicha: chapda ro'yxat, o'ngda tanlangan xodim ruxsatlari ─── -->
    <div v-if="view === 'user'" class="perm-split">
      <aside class="perm-users">
        <el-input v-model="search" :placeholder="$t('admPermSearchPh')" :prefix-icon="Search" clearable />
        <ul class="perm-users__list">
          <li
            v-for="u in users"
            :key="u.id"
            class="perm-user"
            :class="{ 'is-active': selected?.id === u.id, 'is-blocked': u.is_blocked }"
            role="button"
            tabindex="0"
            @click="selectedId = u.id"
            @keydown.enter="selectedId = u.id"
          >
            <span class="perm-av" :class="u.is_admin ? 'is-admin' : ''">{{ initial(u) }}</span>
            <span class="perm-user__body">
              <span class="perm-user__name">{{ fullName(u) }}</span>
              <span class="perm-user__un">{{ '@' + u.username }}</span>
            </span>
            <span class="perm-count" :class="countTone(u)">{{ openCount(u) }}/{{ PAGES.length }}</span>
          </li>
          <li v-if="!users.length" class="perm-empty">{{ $t('admNoData') }}</li>
        </ul>
      </aside>

      <section v-if="selected" class="perm-detail">
        <header class="perm-detail__head">
          <span class="perm-av is-lg" :class="selected.is_admin ? 'is-admin' : ''">{{ initial(selected) }}</span>
          <div class="perm-detail__who">
            <h3>{{ fullName(selected) }}</h3>
            <div class="perm-detail__meta">
              <span>{{ '@' + selected.username }}</span>
              <el-tag v-if="selected.is_admin" size="small" type="warning">{{ $t('admPermAdmin') }}</el-tag>
              <el-tag v-if="selected.is_blocked" size="small" type="danger">{{ $t('admBlocked') }}</el-tag>
            </div>
          </div>
          <div class="perm-detail__total">
            <span class="perm-detail__num"><b>{{ openCount(selected) }}</b> / {{ PAGES.length }}</span>
            <span>{{ $t('admPermOpenPages') }}</span>
          </div>
        </header>

        <div class="perm-bulk">
          <el-button :icon="CircleCheck" :loading="bulkSaving === 'on'" @click="setAll(true)">{{ $t('admPermAllOn') }}</el-button>
          <el-button :icon="CircleClose" :loading="bulkSaving === 'off'" @click="setAll(false)">{{ $t('admPermAllOff') }}</el-button>
          <span class="perm-bulk__hint">{{ $t('admPermBossNote') }}</span>
        </div>

        <div v-for="g in GROUPS" :key="g.key" class="perm-group">
          <div class="perm-group__head">
            <h4>{{ $t(g.label) }}</h4>
            <el-button v-if="g.pages.length > 1" link type="primary" size="small" @click="setGroup(g, !groupAllOn(g))">
              {{ groupAllOn(g) ? $t('admPermGroupOff') : $t('admPermGroupOn') }}
            </el-button>
          </div>
          <div class="perm-tiles">
            <label v-for="p in g.pages" :key="p.key" class="perm-tile" :class="{ 'is-on': hasPermission(selected, p.key) }">
              <span class="perm-tile__icon" aria-hidden="true">{{ p.icon }}</span>
              <span class="perm-tile__body">
                <span class="perm-tile__name">{{ $t(p.label) }}</span>
                <span class="perm-tile__desc">{{ $t(`admPermDesc_${p.key}`) }}</span>
              </span>
              <el-switch
                :model-value="hasPermission(selected, p.key)"
                :loading="!!updating[`${selected.id}-${p.key}`]"
                :aria-label="$t(p.label)"
                style="--el-switch-on-color: #15803d"
                @change="(val) => togglePermission(selected, p.key, val)"
              />
            </label>
          </div>
        </div>
      </section>
      <section v-else class="perm-detail perm-empty">{{ $t('admPermPick') }}</section>
    </div>

    <!-- ─── Jadval: hamma xodimlar bir qarashda (guruhlangan ustunlar) ─── -->
    <template v-else>
      <div class="adm-toolbar">
        <el-input v-model="search" :placeholder="$t('admPermSearchPh')" :prefix-icon="Search" clearable class="adm-search" />
      </div>
      <div class="tbl-wrap">
        <el-table :data="users" stripe border style="width: 100%" :empty-text="$t('admNoData')" max-height="70vh">
          <el-table-column :label="$t('admColUser')" min-width="220" fixed="left">
            <template #default="{ row }">
              <div class="perm-tcell">
                <span class="perm-av is-sm" :class="row.is_admin ? 'is-admin' : ''">{{ initial(row) }}</span>
                <div>
                  <div class="perm-user__name">{{ fullName(row) }}</div>
                  <div class="perm-user__un">{{ '@' + row.username }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <!-- Ustunlar guruh tartibida; guruh boshlanishi chap chiziq bilan ajratilgan -->
          <el-table-column
            v-for="p in PAGES"
            :key="p.key"
            min-width="96"
            align="center"
            :class-name="p.groupStart ? 'perm-col-start' : ''"
            :label-class-name="p.groupStart ? 'perm-col-start' : ''"
          >
            <template #header>
              <span class="perm-th"><span aria-hidden="true">{{ p.icon }}</span>{{ $t(p.label) }}</span>
            </template>
            <template #default="{ row }">
              <el-switch
                :model-value="hasPermission(row, p.key)"
                :loading="!!updating[`${row.id}-${p.key}`]"
                size="small"
                style="--el-switch-on-color: #15803d"
                @change="(val) => togglePermission(row, p.key, val)"
              />
            </template>
          </el-table-column>
        </el-table>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { CircleCheck, CircleClose, Search } from '@element-plus/icons-vue'
import { useUsersStore } from '@/stores/user'
import { errorText } from '@/utils/errorText'

const { t } = useI18n()
const usersStore = useUsersStore()

// Bo'limlar ma'no bo'yicha guruhlangan — ro'yxat uzun bo'lsa ham tez topiladi
const GROUPS = [
  {
    key: 'sales',
    label: 'admPermGroupSales',
    pages: [
      { key: 'customers', label: 'admPermCustomers', icon: '🏬' },
      { key: 'leads', label: 'admPermLeads', icon: '🎯' },
      { key: 'kp', label: 'admTabKp', icon: '📄' },
      { key: 'dogovor', label: 'admPermDogovor', icon: '📝' },
      { key: 'competitors', label: 'admPermCompetitors', icon: '⚔️' },
    ],
  },
  {
    key: 'ops',
    label: 'admPermGroupOps',
    pages: [
      { key: 'sites', label: 'admTabObjects', icon: '📍' },
      { key: 'loyiha', label: 'admPermLoyiha', icon: '📐' },
      { key: 'sklad', label: 'admPermSklad', icon: '📦' },
      { key: 'otgruzka', label: 'admPermOtgruzka', icon: '🚚' },
    ],
  },
  {
    key: 'team',
    label: 'admPermGroupTeam',
    pages: [
      { key: 'tasks', label: 'admPermTasks', icon: '✅' },
      { key: 'attendance', label: 'admPermAttendance', icon: '⚡' },
    ],
  },
  {
    key: 'boss',
    label: 'admPermGroupBoss',
    pages: [{ key: 'boss', label: 'admPermBoss', icon: '👑' }],
  },
]
const PAGES = GROUPS.flatMap((g) => g.pages.map((p, i) => ({ ...p, groupStart: i === 0 })))
// "Hammasini yoqish" Boss sahifasini ochmaydi — u faqat alohida, ataylab beriladi
const BULK_KEYS = PAGES.map((p) => p.key).filter((k) => k !== 'boss')

const view = ref('user')
const views = computed(() => [
  { label: t('admPermViewUser'), value: 'user' },
  { label: t('admPermViewTable'), value: 'table' },
])

const search = ref('')
const fullName = (u) => `${u.firstname || ''} ${u.lastname || ''}`.trim() || u.username
const initial = (u) => (u.firstname?.charAt(0) || u.username?.charAt(0) || '?').toUpperCase()
const users = computed(() => {
  const s = search.value.toLowerCase().trim()
  const list = [...usersStore.allUsers].sort((a, b) => Number(!!a.is_blocked) - Number(!!b.is_blocked) || fullName(a).localeCompare(fullName(b)))
  if (!s) return list
  return list.filter((u) =>
    ['firstname', 'lastname', 'username', 'phone_number'].some((k) => String(u[k] ?? '').toLowerCase().includes(s)),
  )
})

const selectedId = ref(null)
const selected = computed(() => usersStore.allUsers.find((u) => u.id === selectedId.value) || null)
// Qidiruv natijasida tanlangan xodim qolmasa — birinchisi tanlanadi
watch(
  users,
  (list) => {
    if (!list.some((u) => u.id === selectedId.value)) selectedId.value = list[0]?.id ?? null
  },
  { immediate: true },
)

// Boss sahifasi sukut bo'yicha yopiq (faqat direktor — id 16), qolganlari ochiq
const hasPermission = (user, key) => {
  if (key === 'boss') {
    if (user.permissions?.boss !== undefined) return user.permissions.boss
    return Number(user.id) === 16
  }
  return user.permissions?.[key] !== false
}
const openCount = (u) => PAGES.filter((p) => hasPermission(u, p.key)).length
const countTone = (u) => {
  const n = openCount(u)
  return n === 0 ? 'is-none' : n >= BULK_KEYS.length ? 'is-full' : 'is-part'
}
const groupAllOn = (g) => g.pages.every((p) => hasPermission(selected.value, p.key))

const updating = ref({})
async function save(user, patch) {
  const permissions = { ...(user.permissions || {}), ...patch }
  await usersStore.updateUser(user.id, { permissions })
  user.permissions = permissions
}
async function togglePermission(user, key, val) {
  updating.value[`${user.id}-${key}`] = true
  try {
    await save(user, { [key]: val })
    ElMessage.success(t('admPermSaved'))
  } catch (err) {
    ElMessage.error(errorText(err, t('xatolikYuzBerdi')))
  } finally {
    updating.value[`${user.id}-${key}`] = false
  }
}

// Bir nechta bo'limni bitta so'rov bilan saqlash
const bulkSaving = ref('')
async function saveMany(keys, val, flag) {
  const user = selected.value
  if (!user) return
  const patch = Object.fromEntries(keys.map((k) => [k, val]))
  bulkSaving.value = flag
  keys.forEach((k) => (updating.value[`${user.id}-${k}`] = true))
  try {
    await save(user, patch)
    ElMessage.success(t('admPermSaved'))
  } catch (err) {
    ElMessage.error(errorText(err, t('xatolikYuzBerdi')))
  } finally {
    bulkSaving.value = ''
    keys.forEach((k) => (updating.value[`${user.id}-${k}`] = false))
  }
}
const setAll = (val) => saveMany(BULK_KEYS, val, val ? 'on' : 'off')
const setGroup = (g, val) => saveMany(g.pages.map((p) => p.key), val, '')
</script>

<style scoped lang="scss">
.perm-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.perm-sub {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--ui-muted);
}
.perm-split {
  display: grid;
  grid-template-columns: minmax(240px, 300px) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}
@media (max-width: 820px) {
  .perm-split {
    grid-template-columns: 1fr;
  }
  .perm-users__list {
    max-height: 260px !important;
  }
}
.perm-users {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--ui-line);
  border-radius: 14px;
  background: var(--ui-surface);
  position: sticky;
  top: 12px;
}
.perm-users__list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: calc(100vh - 260px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.perm-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 10px;
  cursor: pointer;
  &:hover,
  &:focus-visible {
    background: var(--ui-surface-2);
    outline: none;
  }
  &.is-active {
    background: var(--ui-link-soft);
    box-shadow: inset 3px 0 0 var(--ui-link);
  }
  &.is-blocked {
    opacity: 0.55;
  }
}
.perm-user__body {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}
.perm-user__name {
  font-weight: 600;
  font-size: 14px;
  color: var(--ui-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.perm-user__un {
  font-size: 12px;
  color: var(--ui-muted);
}
.perm-av {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  font-weight: 700;
  font-size: 14px;
  color: #fff;
  background: #2a78d6;
  &.is-admin {
    background: #d97706;
  }
  &.is-lg {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }
  &.is-sm {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }
}
.perm-count {
  flex: none;
  padding: 1px 8px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  &.is-full {
    background: var(--ui-good-soft);
    color: var(--ui-good);
  }
  &.is-part {
    background: var(--ui-warn-soft);
    color: var(--ui-warn-ink);
  }
  &.is-none {
    background: var(--ui-bad-soft);
    color: var(--ui-bad);
  }
}
.perm-detail {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 18px 20px;
  border: 1px solid var(--ui-line);
  border-radius: 14px;
  background: var(--ui-surface);
  min-width: 0;
}
.perm-detail__head {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  h3 {
    margin: 0;
    font-size: 18px;
    color: var(--ui-ink);
  }
}
.perm-detail__who {
  flex: 1;
  min-width: 0;
}
.perm-detail__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
  font-size: 13px;
  color: var(--ui-muted);
}
.perm-detail__total {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 13px;
  color: var(--ui-muted);
  b {
    font-size: 22px;
    color: var(--ui-ink);
  }
}
.perm-bulk {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--ui-line-soft);
  .el-button + .el-button {
    margin-left: 0;
  }
}
.perm-bulk__hint {
  font-size: 12px;
  color: var(--ui-muted);
}
.perm-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.perm-group__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  h4 {
    margin: 0;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--ui-muted);
  }
}
.perm-tiles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 8px;
}
.perm-tile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--ui-line);
  border-radius: 12px;
  background: var(--ui-surface-2);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  &:hover {
    border-color: var(--ui-link-line);
  }
  &.is-on {
    border-color: var(--ui-good);
    background: var(--ui-good-soft);
  }
}
.perm-tile__icon {
  flex: none;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: var(--ui-surface);
  font-size: 18px;
}
.perm-tile__body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.perm-tile__name {
  font-weight: 600;
  color: var(--ui-ink);
}
.perm-tile__desc {
  font-size: 12px;
  color: var(--ui-muted);
  line-height: 1.35;
}
.perm-empty {
  padding: 32px 12px;
  text-align: center;
  color: var(--ui-muted);
}
.perm-detail__num {
  white-space: nowrap;
}
.perm-tcell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.perm-th {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  line-height: 1.2;
  white-space: normal;
}
:deep(.perm-col-start) {
  border-left: 2px solid var(--ui-line) !important;
}
</style>
