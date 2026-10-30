<template>
  <div class="adm-page">
    <div class="page-head">
      <span class="page-accent"></span>
      <h2 class="page-title">{{ $t('admTabDashboard') }}</h2>
      <span class="page-date">{{ todayLabel(locale) }}</span>
    </div>

    <div class="kpi-grid">
      <UiStat
        :label="$t('admStatUsers')"
        :value="fmtNum(usersStore.allUsers.length)"
        :sub="$t('admStatUsersSub', { a: adminCount, u: userCount, n: newUsersThisMonth })"
      />
      <UiStat
        :label="$t('admStatPartners')"
        tone="good"
        :value="fmtNum(partnersStore.allPartners.length)"
        :sub="$t('admStatTop', { x: topPartnerType.label })"
      />
      <UiStat
        :label="$t('admStatObjects')"
        :value="fmtNum(comeandgoInsideStore.allComeAndGoInsides.length)"
        :sub="$t('admStatLast', { x: lastObjectDate })"
      />
      <UiStat
        :label="$t('admStatAudit')"
        tone="warn"
        :value="fmtNum(auditLogs.length)"
        :sub="$t('admStatToday', { n: auditStats?.today ?? 0 })"
      />
    </div>

    <div class="dash-row">
      <div class="dash-card dash-card--wide">
        <div class="dash-card__head">
          <span class="dash-card__title">{{ $t('admPartnerTypesDist') }}</span>
        </div>
        <div class="chart-bars">
          <div v-for="type in partnerTypeStats" :key="type.value" class="chart-bar-row">
            <span class="chart-bar-lbl">{{ type.label }}</span>
            <div class="chart-bar-track">
              <div
                class="chart-bar-fill"
                :style="{ width: type.percent + '%', background: type.color }"
              ></div>
            </div>
            <span class="chart-bar-num">{{ type.count }}</span>
          </div>
        </div>
      </div>

      <div class="dash-card">
        <div class="dash-card__head">
          <span class="dash-card__title">{{ $t('admTopUsers') }}</span>
          <el-tag size="small" type="info" effect="plain">Top 5</el-tag>
        </div>
        <div class="top-users">
          <div v-for="(u, idx) in visibleActiveUsers" :key="u.username" class="top-user-row">
            <span class="top-user-rank">{{ idx + 1 }}</span>
            <div class="top-user-av" :class="RANK_CLASS[idx] || ''">
              {{ u.firstname?.charAt(0) || u.username?.charAt(0) }}
            </div>
            <div class="top-user-info">
              <span class="top-user-name">{{ u.firstname }} {{ u.lastname }}</span>
              <span class="top-user-un">{{ '@' + u.username }}</span>
              <div class="top-user-bar">
                <div
                  class="top-user-bar__fill"
                  :style="{
                    width: topActiveUsers[0]?.total
                      ? (u.total / topActiveUsers[0].total) * 100 + '%'
                      : '0%',
                  }"
                ></div>
              </div>
              <div class="top-user-stats">
                <span class="tus-item tus-item--partner">
                  <el-icon><UserFilled /></el-icon> {{ $t('admNPartners', { n: u.partners || 0 }) }}
                </span>
                <span class="tus-divider">·</span>
                <span class="tus-item tus-item--object">
                  <el-icon><OfficeBuilding /></el-icon> {{ $t('admNObjects', { n: u.objects || 0 }) }}
                </span>
              </div>
            </div>
            <div class="top-user-total" :class="idx === 0 ? 'total--gold' : ''">
              {{ u.total }}
              <span>{{ $t('admTotalLower') }}</span>
            </div>
          </div>

          <div v-if="!topActiveUsers.length" class="empty-state">
            <el-icon><InfoFilled /></el-icon> {{ $t('admNoData') }}
          </div>

          <button
            v-if="topActiveUsers.length > 5"
            class="show-all-btn"
            @click="showAll = !showAll"
          >
            <span v-if="!showAll">
              <el-icon><ArrowDown /></el-icon>
              {{ $t('admShowAllUsers', { n: topActiveUsers.length }) }}
            </span>
            <span v-else>
              <el-icon><ArrowUp /></el-icon>
              {{ $t('admCollapse') }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <div class="dash-card dash-card--full">
      <div class="dash-card__head">
        <span class="dash-card__title">{{ $t('admRecentActions') }}</span>
        <el-button size="small" text @click="emit('go', 'audit')">
          {{ $t('admSeeAll') }} <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      <div class="activity-feed">
        <div
          v-for="log in auditLogs.slice(0, 8)"
          :key="log.id"
          class="activity-item"
          :class="'activity-item--' + log.type"
        >
          <div class="activity-dot"></div>
          <div class="activity-icon">
            <el-icon><component :is="auditIcon(log.action)" /></el-icon>
          </div>
          <div class="activity-content">
            <span class="activity-actor">{{ logActor(log) }}</span>
            <span class="activity-msg">{{ log.message }}</span>
          </div>
          <span class="activity-time">{{ logTime(log) }}</span>
        </div>
        <div v-if="!auditLogs.length" class="empty-state">
          <el-icon><Document /></el-icon> {{ $t('admNoActionsYet') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Document,
  InfoFilled,
  OfficeBuilding,
  UserFilled,
} from '@element-plus/icons-vue'
import UiStat from '@/components/ui/UiStat.vue'
import { useUsersStore } from '@/stores/user'
import { usePartnersStore } from '@/stores/partners'
import { useComeAndGoInsideStore } from '@/stores/comeandgoInside'
import { fmtNum, formatDate } from '@/utils/format'
import { PARTNER_TYPES, auditIcon, logActor, logTime, todayLabel, useAdminAudit } from '../adminShared'

const emit = defineEmits(['go'])
const { t, locale } = useI18n()
const usersStore = useUsersStore()
const partnersStore = usePartnersStore()
const comeandgoInsideStore = useComeAndGoInsideStore()
const { auditLogs: _auditLogs, stats: auditStats } = useAdminAudit()
const auditLogs = computed(() => _auditLogs.value ?? [])

const RANK_CLASS = ['av--gold', 'av--silver', 'av--bronze']
const showAll = ref(false)

const adminCount = computed(() => usersStore.allUsers.filter((u) => u.is_admin).length)
const userCount = computed(() => usersStore.allUsers.filter((u) => !u.is_admin).length)
const newUsersThisMonth = computed(() => {
  const m = new Date().getMonth()
  return usersStore.allUsers.filter((u) => u.createdAt && new Date(u.createdAt).getMonth() === m).length
})

const partnerTypeStats = computed(() => {
  const all = partnersStore.allPartners
  const total = all.length || 1
  return PARTNER_TYPES.map((type) => {
    const count = all.filter((p) => p.partner_type === type.value).length
    return { ...type, label: t(type.key), count, percent: Math.round((count / total) * 100) }
  })
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
})
const topPartnerType = computed(() => partnerTypeStats.value[0] || { label: '—' })

const lastObjectDate = computed(() => {
  const sorted = [...comeandgoInsideStore.allComeAndGoInsides].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  )
  return sorted[0] ? formatDate(sorted[0].createdAt) : '—'
})

// Kim qancha mijoz va obyekt qo'shgan
const topActiveUsers = computed(() => {
  const map = {}
  usersStore.allUsers.forEach((u) => {
    map[u.username] = { ...u, partners: 0, objects: 0 }
  })
  partnersStore.allPartners.forEach((p) => {
    const un = p.user?.username
    if (!un) return
    if (!map[un]) map[un] = { ...p.user, partners: 0, objects: 0 }
    map[un].partners++
  })
  comeandgoInsideStore.allComeAndGoInsides.forEach((o) => {
    const un = o.come_and_go_father?.user?.username
    if (!un) return
    if (!map[un]) map[un] = { ...o.come_and_go_father?.user, partners: 0, objects: 0 }
    map[un].objects++
  })
  return Object.values(map)
    .map((u) => ({ ...u, total: (u.partners || 0) + (u.objects || 0) }))
    .sort((a, b) => b.total - a.total)
})
const visibleActiveUsers = computed(() =>
  showAll.value ? topActiveUsers.value : topActiveUsers.value.slice(0, 5),
)
</script>
