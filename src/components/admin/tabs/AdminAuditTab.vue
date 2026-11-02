<template>
  <div class="adm-page">
    <div class="page-head">
      <span class="page-accent"></span>
      <h2 class="page-title">{{ $t('admTabActivity') }}</h2>
      <el-segmented
        v-model="mode"
        :options="[
          { label: $t('admAllActivity'), value: 'activity' },
          { label: $t('admLegacyActions'), value: 'legacy' },
        ]"
        size="small"
        class="audit-mode"
      />
      <el-button v-if="mode === 'legacy'" size="small" type="danger" plain style="margin-left: auto" @click="clearLogs">
        <el-icon><Delete /></el-icon> {{ $t('admClearLogs') }}
      </el-button>
    </div>

    <div v-if="mode === 'activity'" class="activity-card">
      <ActivityFeed :users="usersStore.allUsers" />
    </div>

    <template v-else>
      <div class="adm-toolbar">
        <el-input
          v-model="search"
          :placeholder="$t('admAuditSearchPh')"
          :prefix-icon="Search"
          clearable
          class="adm-search"
        />
        <el-select v-model="actionFilter" :placeholder="$t('admActionType')" clearable class="adm-select">
          <el-option :label="$t('admActRole')" value="role" />
          <el-option :label="$t('admBlockUnblock')" value="block" />
          <el-option :label="$t('admActView')" value="view" />
          <el-option :label="$t('admActExport')" value="export" />
        </el-select>
        <button class="adm-reset-btn" @click="resetFilters">
          <el-icon><RefreshLeft /></el-icon> {{ $t('admReset') }}
        </button>
      </div>

      <div class="audit-mini-stats">
        <div class="audit-ms-item">
          <span class="audit-ms-val">{{ stats?.total ?? 0 }}</span>
          <span class="audit-ms-lbl">{{ $t('admTotalActions') }}</span>
        </div>
        <div class="audit-ms-item">
          <span class="audit-ms-val">{{ stats?.today ?? 0 }}</span>
          <span class="audit-ms-lbl">{{ $t('admToday') }}</span>
        </div>
        <div class="audit-ms-item">
          <span class="audit-ms-val">{{ stats?.role ?? 0 }}</span>
          <span class="audit-ms-lbl">{{ $t('admRoleChanges') }}</span>
        </div>
        <div class="audit-ms-item">
          <span class="audit-ms-val">{{ stats?.block ?? 0 }}</span>
          <span class="audit-ms-lbl">{{ $t('admBlockActions') }}</span>
        </div>
      </div>

      <div class="audit-timeline">
        <div v-for="log in filtered" :key="log.id" class="audit-entry" :class="'audit-entry--' + log.type">
          <div class="audit-entry__line"></div>
          <div class="audit-entry__dot">
            <el-icon><component :is="auditIcon(log.action)" /></el-icon>
          </div>
          <div class="audit-entry__body">
            <div class="audit-entry__top">
              <span class="audit-entry__actor"><el-icon><UserFilled /></el-icon> {{ logActor(log) }}</span>
              <span class="audit-entry__action-tag" :class="'tag--' + log.type">{{ auditLabel(t, log.action) }}</span>
              <span class="audit-entry__time"><el-icon><Timer /></el-icon> {{ logTime(log) }}</span>
            </div>
            <div class="audit-entry__msg">{{ log.message }}</div>
            <div v-if="log.meta" class="audit-entry__meta">{{ log.meta }}</div>
          </div>
        </div>
        <div v-if="!filtered.length" class="empty-audit">
          <div class="empty-audit__icon"><el-icon><Search /></el-icon></div>
          <div class="empty-audit__title">{{ $t('admNoActionsFound') }}</div>
          <div class="empty-audit__sub">{{ $t('admNoActionsFoundSub') }}</div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, RefreshLeft, Search, Timer, UserFilled } from '@element-plus/icons-vue'
import ActivityFeed from '@/components/admin/ActivityFeed.vue'
import { useUsersStore } from '@/stores/user'
import { auditIcon, auditLabel, logActor, logTime, useAdminAudit } from '../adminShared'

const { t } = useI18n()
const usersStore = useUsersStore()
const { auditLogs, stats, clearAllLogs, fetchStats } = useAdminAudit()

const mode = ref('activity')
const search = ref('')
const actionFilter = ref('')
function resetFilters() {
  search.value = ''
  actionFilter.value = ''
}

const filtered = computed(() => {
  const s = search.value.toLowerCase().trim()
  return (auditLogs.value || []).filter((l) => {
    const actor = `${logActor(l)} ${l.admin?.username ?? ''}`.toLowerCase()
    return (
      (!s || l.message.toLowerCase().includes(s) || actor.includes(s)) &&
      (!actionFilter.value || l.action === actionFilter.value)
    )
  })
})

async function clearLogs() {
  try {
    await ElMessageBox.confirm(t('admClearLogsConfirm'), t('admWarning'), {
      confirmButtonText: t('admYesDelete'),
      cancelButtonText: t('cancel'),
      type: 'warning',
    })
  } catch {
    return
  }
  await clearAllLogs()
  await fetchStats()
  ElMessage.success(t('admLogsCleared'))
}
</script>
