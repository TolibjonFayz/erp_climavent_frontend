<template>
  <UiPage :title="$t('ldTitle')" :subtitle="$t('ldSubtitle')" class="ld-page">
    <template #actions>
      <el-button :icon="Refresh" :loading="loading" @click="load">{{ $t('ldRefresh') }}</el-button>
      <el-button type="primary" :icon="Plus" @click="createOpen = true">{{ $t('ldNew') }}</el-button>
    </template>

    <el-alert v-if="loadError" type="error" show-icon :closable="false" :title="loadError" />

    <div class="ld-stats">
      <UiStat
        v-for="s in statCards"
        :key="s.key"
        :label="$t(`ldStatus_${s.key}`)"
        :value="String(counts.status[s.key] || 0)"
        :tone="s.tone"
        clickable
        @click="filters.status = filters.status === s.key ? '' : s.key"
      />
    </div>

    <el-tabs v-model="tab" class="ld-tabs">
      <el-tab-pane name="list" :label="$t('ldTabList')">
        <UiToolbar>
          <UiField :label="$t('ldSearch')" grow>
            <el-input v-model="filters.q" :placeholder="$t('ldSearchPh')" clearable :prefix-icon="Search" />
          </UiField>
          <UiField :label="$t('ldFSource')">
            <el-select v-model="filters.source" clearable :placeholder="$t('ldAll')" class="ld-sel">
              <el-option v-for="s in LEAD_SOURCES" :key="s" :value="s" :label="`${SOURCE_ICON[s]} ${$t(`ldSource_${s}`)} (${counts.source[s] || 0})`" />
            </el-select>
          </UiField>
          <UiField :label="$t('ldFStatus')">
            <el-select v-model="filters.status" clearable :placeholder="$t('ldAll')" class="ld-sel">
              <el-option v-for="s in LEAD_STATUSES" :key="s" :value="s" :label="`${$t(`ldStatus_${s}`)} (${counts.status[s] || 0})`" />
            </el-select>
          </UiField>
          <UiField :label="$t('ldFManager')">
            <el-select v-model="filters.manager_id" clearable filterable :placeholder="$t('ldAll')" class="ld-sel">
              <el-option v-for="u in managers" :key="u.id" :value="u.id" :label="userName(u)" />
            </el-select>
          </UiField>
          <template #actions>
            <el-button v-if="dirty" text @click="resetFilters">{{ $t('ldReset') }}</el-button>
          </template>
        </UiToolbar>

        <UiPanel flush>
          <template #title>{{ $t('ldShown', { n: total }) }}</template>
          <el-table v-loading="loading" :data="items" row-key="id" class="ld-table" @row-click="(r) => (openId = r.id)">
            <el-table-column :label="$t('ldColLead')" min-width="190">
              <template #default="{ row }">
                <div class="ld-name">{{ leadTitle(row) }}</div>
                <div v-if="row.username && row.name" class="ld-sub">@{{ row.username }}</div>
              </template>
            </el-table-column>
            <el-table-column :label="$t('ldColSource')" min-width="150">
              <template #default="{ row }">
                <div v-if="row.source">{{ SOURCE_ICON[row.source] }} {{ $t(`ldSource_${row.source}`) }}</div>
                <div v-if="row.chat_title" class="ld-sub">{{ row.chat_title }}</div>
              </template>
            </el-table-column>
            <el-table-column :label="$t('ldColPhone')" min-width="130">
              <template #default="{ row }">
                <a v-if="row.phone" :href="`tel:${row.phone}`" class="ld-link" @click.stop>{{ row.phone }}</a>
                <span v-else class="ld-sub">—</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('ldColMessage')" min-width="280">
              <template #default="{ row }">
                <div class="ld-msg">{{ row.last_message_text || '—' }}</div>
                <div v-if="row.messages_count > 1" class="ld-sub">{{ $t('ldMsgCount', { n: row.messages_count }) }}</div>
              </template>
            </el-table-column>
            <el-table-column :label="$t('ldColStatus')" width="130">
              <template #default="{ row }">
                <el-tag :type="STATUS_TAG[row.status]" effect="light" round>{{ $t(`ldStatus_${row.status}`) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="$t('ldColManager')" min-width="130">
              <template #default="{ row }">
                <span v-if="row.manager_id">{{ managerName(row.manager_id) }}</span>
                <span v-else class="ld-sub">—</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('ldColWhen')" width="140">
              <template #default="{ row }">{{ formatDateTime(row.last_message_at || row.createdAt) }}</template>
            </el-table-column>
            <template #empty>
              <el-empty :description="$t(dirty ? 'ldEmptyFiltered' : 'ldEmpty')" />
            </template>
          </el-table>
          <div v-if="total > filters.limit" class="ld-pager">
            <el-pagination
              v-model:current-page="filters.page"
              :page-size="filters.limit"
              :total="total"
              layout="prev, pager, next"
              background
            />
          </div>
        </UiPanel>
      </el-tab-pane>

      <el-tab-pane v-if="isAdmin" name="settings" :label="$t('ldTabSettings')" lazy>
        <LeadsSettings />
      </el-tab-pane>
    </el-tabs>

    <LeadDrawer v-model="openId" :managers="managers" :is-admin="isAdmin" @changed="load" />
    <LeadCreateDialog v-model="createOpen" @created="onCreated" />
  </UiPage>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import UiPage from '@/components/ui/UiPage.vue'
import UiStat from '@/components/ui/UiStat.vue'
import UiToolbar from '@/components/ui/UiToolbar.vue'
import UiField from '@/components/ui/UiField.vue'
import UiPanel from '@/components/ui/UiPanel.vue'
import api from '@/api/leads'
import { useUsersStore } from '@/stores/user'
import { formatDateTime } from '@/utils/format'
import { LEAD_SOURCES, LEAD_STATUSES, SOURCE_ICON, STATUS_TAG, leadTitle, userName } from '@/utils/leadsFormat'
import LeadDrawer from './LeadDrawer.vue'
import LeadCreateDialog from './LeadCreateDialog.vue'
import LeadsSettings from './LeadsSettings.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const usersStore = useUsersStore()
const isAdmin = computed(() => !!usersStore.currentUser?.is_admin)

const items = ref([])
const total = ref(0)
const counts = ref({ status: {}, source: {} })
const loading = ref(false)
const loadError = ref('')
const createOpen = ref(false)
const tab = ref('list')
const openId = ref(route.query.id ? Number(route.query.id) : null)

const empty = () => ({ q: '', source: '', status: '', manager_id: null, page: 1, limit: 50 })
const filters = reactive(empty())
const dirty = computed(() => !!(filters.q || filters.source || filters.status || filters.manager_id))

// "Yangi" va "Jarayonda" — e'tibor talab qiladigan kartalar
const statCards = [
  { key: 'new', tone: 'bad' },
  { key: 'in_progress', tone: 'warn' },
  { key: 'won', tone: 'good' },
  { key: 'lost', tone: undefined },
]

const managers = computed(() => (usersStore.allUsers || []).filter((u) => !u.is_blocked))
const managerName = (id) => {
  const u = managers.value.find((m) => m.id === id) || (usersStore.allUsers || []).find((m) => m.id === id)
  return u ? userName(u) : `#${id}`
}

let seq = 0
async function load() {
  const my = ++seq
  loading.value = true
  loadError.value = ''
  try {
    const params = { page: filters.page, limit: filters.limit }
    for (const k of ['q', 'source', 'status', 'manager_id']) if (filters[k]) params[k] = filters[k]
    const res = await api.list(params)
    if (my !== seq) return // eskirgan javob yangisini bosib ketmasin
    items.value = res.items || []
    total.value = res.total || 0
    counts.value = { status: res.counts?.status || {}, source: res.counts?.source || {} }
  } catch (e) {
    if (my === seq) loadError.value = e?.response?.data?.message || t('ldLoadError')
  } finally {
    if (my === seq) loading.value = false
  }
}

function resetFilters() {
  Object.assign(filters, empty())
}

// Qidiruvda har harfga so'rov yubormaslik; boshqa filtrlar darhol ishlaydi
let timer
watch(
  () => [filters.q, filters.source, filters.status, filters.manager_id],
  () => {
    filters.page = 1
    clearTimeout(timer)
    timer = setTimeout(load, 300)
  },
)
watch(() => filters.page, load)

watch(openId, (id) => router.replace({ query: { ...route.query, id: id || undefined } }))

function onCreated(lead) {
  load()
  openId.value = lead.id
}

onMounted(() => {
  load()
  if (!usersStore.allUsers?.length) usersStore.getAllUsers().catch(() => undefined)
})
</script>

<style scoped>
.ld-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
.ld-sel {
  width: 190px;
}
.ld-table :deep(tr) {
  cursor: pointer;
}
.ld-name {
  font-weight: 600;
}
.ld-sub {
  color: var(--ui-text-muted, #8a8f98);
  font-size: 12px;
}
.ld-link {
  color: var(--ui-link, #409eff);
  text-decoration: none;
}
.ld-msg {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  white-space: pre-wrap;
  word-break: break-word;
}
.ld-pager {
  display: flex;
  justify-content: center;
  padding: 12px;
}
</style>
