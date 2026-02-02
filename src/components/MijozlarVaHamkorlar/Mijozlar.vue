<template>
  <div class="mijozlar-container" v-loading="loading">
    <div class="page-header">
      <div class="header-main">
        <div class="header-top">
          <div class="header-text">
            <h1>{{ $t('mijozlarVaHamkorlar') }}</h1>
            <p class="subtitle">{{ $t('mijozlarHamkorlarTable') }}</p>
          </div>

          <div class="statistics-tags-horizontal">
            <el-tag size="large" type="success" effect="plain">
              {{ $t('today') }}: {{ getTodayCount() }}
            </el-tag>
            <el-tag size="large" type="primary" effect="plain">
              {{ $t('thisWeek') }}: {{ getWeekCount() }}
            </el-tag>
            <el-tag size="large" type="warning" effect="plain">
              {{ $t('thisMonth') }}: {{ getMonthCount() }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="modern-tabs" @tab-click="handleClick">
      <el-tab-pane
        :label="`${$t('doimiymijoz')} (${getFilteredPartners('doimiymijoz').length})`"
        name="doimiymijoz"
      >
        <div class="tab-content">
          <div class="tab-header">
            <h2>{{ $t('doimiymijozlar') }}</h2>
            <el-button type="primary" size="large" :icon="Plus" @click="handleAddMijoz">
              {{ $t('yangiQoshish') }}
            </el-button>
          </div>

          <MijozCard
            v-if="getFilteredPartners('doimiymijoz').length > 0"
            :partners="getFilteredPartners('doimiymijoz')"
            @delete="handleDelete"
            @edit="handleEdit"
          />

          <el-empty v-else :description="$t('noPartnersFound')" />
        </div>
      </el-tab-pane>

      <el-tab-pane
        :label="`${$t('montajguruhlar')} (${getFilteredPartners('montajnik').length})`"
        name="montajnik"
      >
        <div class="tab-content">
          <div class="tab-header">
            <h2>{{ $t('montajguruhlar') }}</h2>
            <el-button type="primary" size="large" :icon="Plus" @click="handleAddMijoz">
              {{ $t('yangiQoshish') }}
            </el-button>
          </div>

          <MijozCard
            v-if="getFilteredPartners('montajnik').length > 0"
            :partners="getFilteredPartners('montajnik')"
            @delete="handleDelete"
            @edit="handleEdit"
          />

          <el-empty v-else :description="$t('noMantajnikFound')" />
        </div>
      </el-tab-pane>

      <el-tab-pane
        :label="`${$t('quruvchi')} (${getFilteredPartners('quruvchi').length})`"
        name="quruvchi"
      >
        <div class="tab-content">
          <div class="tab-header">
            <h2>{{ $t('quruvchilar') }}</h2>
            <el-button type="primary" size="large" :icon="Plus" @click="handleAddMijoz">
              {{ $t('yangiQoshish') }}
            </el-button>
          </div>

          <MijozCard
            v-if="getFilteredPartners('quruvchi').length > 0"
            :partners="getFilteredPartners('quruvchi')"
            @delete="handleDelete"
            @edit="handleEdit"
          />

          <el-empty v-else :description="$t('noQuruvchiFound')" />
        </div>
      </el-tab-pane>

      <el-tab-pane
        :label="`${$t('dokonchitadbirkor')} (${getFilteredPartners('dokonchitadbirkor').length})`"
        name="dokonchitadbirkor"
      >
        <div class="tab-content">
          <div class="tab-header">
            <h2>{{ $t('dokonchitadbirkorlar') }}</h2>
            <el-button type="primary" size="large" :icon="Plus" @click="handleAddMijoz">
              {{ $t('yangiQoshish') }}
            </el-button>
          </div>

          <MijozCard
            v-if="getFilteredPartners('dokonchitadbirkor').length > 0"
            :partners="getFilteredPartners('dokonchitadbirkor')"
            @delete="handleDelete"
            @edit="handleEdit"
          />

          <el-empty v-else :description="$t('noDokonchitadbirkorFound')" />
        </div>
      </el-tab-pane>

      <el-tab-pane
        :label="`${$t('proyektinstitut')} (${getFilteredPartners('proyektinstitut').length})`"
        name="proyektinstitut"
      >
        <div class="tab-content">
          <div class="tab-header">
            <h2>{{ $t('proyektinstitutlar') }}</h2>
            <el-button type="primary" size="large" :icon="Plus" @click="handleAddMijoz">
              {{ $t('yangiQoshish') }}
            </el-button>
          </div>

          <MijozCard
            v-if="getFilteredPartners('proyektinstitut').length > 0"
            :partners="getFilteredPartners('proyektinstitut')"
            @delete="handleDelete"
            @edit="handleEdit"
          />

          <el-empty v-else :description="$t('noProyektInstitutFound')" />
        </div>
      </el-tab-pane>

      <el-tab-pane
        :label="`${$t('tenderfirmalar')} (${getFilteredPartners('tenderfirmalar').length})`"
        name="tenderfirmalar"
      >
        <div class="tab-content">
          <div class="tab-header">
            <h2>{{ $t('tenderfirmalar') }}</h2>
            <el-button type="primary" size="large" :icon="Plus" @click="handleAddMijoz">
              {{ $t('yangiQoshish') }}
            </el-button>
          </div>

          <MijozCard
            v-if="getFilteredPartners('tenderfirmalar').length > 0"
            :partners="getFilteredPartners('tenderfirmalar')"
            @delete="handleDelete"
            @edit="handleEdit"
          />

          <el-empty v-else :description="$t('noTenderFirmalarFound')" />
        </div>
      </el-tab-pane>

      <el-tab-pane :label="`${$t('uks')} (${getFilteredPartners('uks').length})`" name="uks">
        <div class="tab-content">
          <div class="tab-header">
            <h2>{{ $t('uks2') }}</h2>
            <el-button type="primary" size="large" :icon="Plus" @click="handleAddMijoz">
              {{ $t('yangiQoshish') }}
            </el-button>
          </div>

          <MijozCard
            v-if="getFilteredPartners('uks').length > 0"
            :partners="getFilteredPartners('uks')"
            @delete="handleDelete"
            @edit="handleEdit"
          />

          <el-empty v-else :description="$t('noUksFound')" />
        </div>
      </el-tab-pane>

      <el-tab-pane
        :label="`${$t('boshqa')} (${getFilteredPartners('boshqa').length})`"
        name="boshqa"
      >
        <div class="tab-content">
          <div class="tab-header">
            <h2>{{ $t('boshqa') }}</h2>
            <el-button type="primary" size="large" :icon="Plus" @click="handleAddMijoz">
              {{ $t('yangiQoshish') }}
            </el-button>
          </div>

          <MijozCard
            v-if="getFilteredPartners('boshqa').length > 0"
            :partners="getFilteredPartners('boshqa')"
            @delete="handleDelete"
            @edit="handleEdit"
          />

          <el-empty v-else :description="$t('noBoshqaFound')" />
        </div>
      </el-tab-pane>

      <el-tab-pane :label="`${$t('jami')} (${getFilteredPartners('jami').length})`" name="jami">
        <div class="tab-content">
          <MijozCardJami
            v-if="getFilteredPartners('jami').length > 0"
            :partners="getFilteredPartners('jami')"
            @delete="handleDelete"
            @edit="handleEdit"
          />

          <el-empty v-else :description="$t('noJamiFound')" />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import router from '@/router'
import { onMounted, ref } from 'vue'
import { usePartnersStore } from '@/stores/partners'
import { Plus } from '@element-plus/icons-vue'
import MijozCard from './MijozCard.vue'
import { ElMessage } from 'element-plus'
import MijozCardJami from './MijozCardJami.vue'

const loading = ref(false)
const activeTab = ref('doimiymijoz')
const partnersStore = usePartnersStore()

const handleAddMijoz = () => {
  localStorage.setItem('mijozTur', activeTab.value)
  router.push({ name: 'mijozlarnew' })
}

const handleEdit = (id) => {
  router.push({ name: 'mijozlar-edit', params: { id } })
}

const handleDelete = async (id) => {
  try {
    loading.value = true
    await partnersStore.deletePartner(id)
    await partnersStore.getAllPartnersOfUser(Number(localStorage.getItem('userid')))
    ElMessage.success("Muvaffaqiyatli o'chirildi!")
  } catch (error) {
    console.error('Delete error:', error)
    ElMessage.error("O'chirishda xatolik yuz berdi!")
  } finally {
    loading.value = false
  }
}

// Date counting functions
const isToday = (date) => {
  const today = new Date()
  const itemDate = new Date(date)
  return (
    itemDate.getDate() === today.getDate() &&
    itemDate.getMonth() === today.getMonth() &&
    itemDate.getFullYear() === today.getFullYear()
  )
}

const isThisWeek = (date) => {
  const today = new Date()
  const itemDate = new Date(date)
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6) // End of week (Saturday)
  weekEnd.setHours(23, 59, 59, 999)
  return itemDate >= weekStart && itemDate <= weekEnd
}

const isThisMonth = (date) => {
  const today = new Date()
  const itemDate = new Date(date)
  return itemDate.getMonth() === today.getMonth() && itemDate.getFullYear() === today.getFullYear()
}

const getTodayCount = () => {
  return partnersStore.allPartnersofUser.filter((item) => item.createdAt && isToday(item.createdAt))
    .length
}

const getWeekCount = () => {
  return partnersStore.allPartnersofUser.filter(
    (item) => item.createdAt && isThisWeek(item.createdAt),
  ).length
}

const getMonthCount = () => {
  return partnersStore.allPartnersofUser.filter(
    (item) => item.createdAt && isThisMonth(item.createdAt),
  ).length
}

const getAllCount = () => {
  return partnersStore.allPartnersofUser.length
}

const getFilteredPartners = (type) => {
  if (type === 'jami') {
    return partnersStore.allPartnersofUser.filter(() => true)
  }

  return partnersStore.allPartnersofUser.filter((item) => item.partner_type === type)
}

const handleClick = () => {
  // Tab click handler
}

onMounted(async () => {
  loading.value = true
  await partnersStore.getAllPartnersOfUser(Number(localStorage.getItem('userid')))
  loading.value = false
})
</script>

<style lang="scss" scoped>
.mijozlar-container {
  width: 100%;
  padding: 32px;
  background: #f5f7fa;
  min-height: 100vh;
  overflow-x: hidden;
}

.page-header {
  margin-bottom: 32px;
}

.header-main {
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

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.header-text {
  flex: 1;
  min-width: 250px;

  h1 {
    font-size: 32px;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 8px 0;
    word-break: break-word;
  }

  .subtitle {
    font-size: 15px;
    color: #6b7280;
    margin: 0;
    word-break: break-word;
  }
}

.statistics-tags-horizontal {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;

  .el-tag {
    font-size: 14px;
    font-weight: 600;
    padding: 10px 16px;
    border-radius: 8px;
    white-space: nowrap;
  }
}

.statistics-header {
  margin-bottom: 18px;

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 4px 0;
  }

  .statistics-subtitle {
    font-size: 13px;
    color: #6b7280;
    margin: 0;
  }
}

.date-filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  flex-shrink: 0;

  .el-tag {
    font-size: 15px;
    font-weight: 600;
    padding: 10px 20px;
    border-radius: 8px;
  }
}

.modern-tabs {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  :deep(.el-tabs__header) {
    margin-bottom: 32px;
  }

  :deep(.el-tabs__nav-wrap::after) {
    background: #e5e7eb;
  }

  :deep(.el-tabs__item) {
    font-size: 15px;
    font-weight: 500;
    color: #6b7280;
    padding: 0 24px;
    height: 48px;
    line-height: 48px;
    white-space: nowrap;

    &:hover {
      color: #409eff;
    }

    &.is-active {
      color: #409eff;
      font-weight: 600;
    }
  }

  :deep(.el-tabs__active-bar) {
    height: 3px;
    background: #409eff;
  }
}

.tab-content {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f3f4f6;
  gap: 16px;
  flex-wrap: wrap;

  h2 {
    font-size: 24px;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
    word-break: break-word;
    flex: 1;
    min-width: 200px;
  }

  .el-button {
    flex-shrink: 0;
  }
}

// Desktop Large
@media (max-width: 1400px) {
  .mijozlar-container {
    padding: 28px;
  }

  .header-text h1 {
    font-size: 30px;
  }
}

// Desktop
@media (max-width: 1200px) {
  .mijozlar-container {
    padding: 24px;
  }

  .header-text h1 {
    font-size: 28px;
  }

  .modern-tabs {
    padding: 20px;
  }
}

// Tablet Large
@media (max-width: 992px) {
  .mijozlar-container {
    padding: 20px;
  }

  .page-header {
    margin-bottom: 24px;
  }

  .header-main {
    margin-bottom: 20px;
  }

  .header-top {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    margin-bottom: 18px;
  }

  .header-text {
    min-width: 200px;

    h1 {
      font-size: 26px;
    }

    .subtitle {
      font-size: 14px;
    }
  }

  .statistics-tags-horizontal {
    justify-content: flex-start;

    .el-tag {
      padding: 8px 14px;
      font-size: 13px;
    }
  }

  .modern-tabs {
    padding: 18px;
    border-radius: 12px;
  }

  .tab-header {
    flex-direction: column;
    align-items: stretch;
    margin-bottom: 20px;
    padding-bottom: 16px;
    gap: 12px;

    h2 {
      font-size: 20px;
      min-width: auto;
    }

    .el-button {
      width: 100%;
    }
  }
}

// Tablet
@media (max-width: 768px) {
  .mijozlar-container {
    padding: 16px;
  }

  .page-header {
    margin-bottom: 18px;
  }

  .header-main {
    margin-bottom: 16px;
  }

  .header-top {
    flex-direction: column;
    align-items: stretch;
    gap: 14px;
    margin-bottom: 16px;
  }

  .header-text {
    min-width: auto;

    h1 {
      font-size: 22px;
    }

    .subtitle {
      font-size: 13px;
    }
  }

  .statistics-tags-horizontal {
    gap: 8px;
    justify-content: flex-start;

    .el-tag {
      padding: 8px 12px;
      font-size: 12px;
    }
  }

  .modern-tabs {
    padding: 16px;
    border-radius: 12px;
  }

  :deep(.el-tabs__item) {
    padding: 0 16px;
    font-size: 14px;
    height: 44px;
    line-height: 44px;
  }

  .tab-header {
    margin-bottom: 18px;
    padding-bottom: 14px;
    gap: 10px;

    h2 {
      font-size: 18px;
    }
  }
}

// Small Tablet / Large Mobile
@media (max-width: 640px) {
  .mijozlar-container {
    padding: 12px;
  }

  .page-header {
    margin-bottom: 16px;
  }

  .header-main {
    margin-bottom: 14px;
  }

  .header-top {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    margin-bottom: 14px;
  }

  .header-text h1 {
    font-size: 20px;
    margin-bottom: 6px;
  }

  .header-text .subtitle {
    font-size: 12px;
    margin-bottom: 10px;
  }

  .statistics-tags-horizontal {
    gap: 8px;
    justify-content: flex-start;
    flex-wrap: wrap;

    .el-tag {
      padding: 8px 10px;
      font-size: 11px;
      flex: 1;
      min-width: 90px;
      text-align: center;
    }
  }

  .modern-tabs {
    padding: 12px;
    border-radius: 10px;
  }

  :deep(.el-tabs__item) {
    padding: 0 12px;
    font-size: 13px;
    height: 40px;
    line-height: 40px;
  }

  .tab-header {
    margin-bottom: 16px;
    padding-bottom: 12px;

    h2 {
      font-size: 16px;
    }
  }
}

// Mobile
@media (max-width: 480px) {
  .mijozlar-container {
    padding: 10px;
  }

  .page-header {
    margin-bottom: 14px;
  }

  .header-main {
    margin-bottom: 12px;
  }

  .header-top {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    margin-bottom: 12px;
  }

  .header-text h1 {
    font-size: 18px;
    margin-bottom: 4px;
  }

  .header-text .subtitle {
    font-size: 11px;
    margin-bottom: 8px;
  }

  .statistics-tags-horizontal {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    justify-content: stretch;

    .el-tag {
      padding: 10px 8px;
      font-size: 11px;
      text-align: center;
      white-space: normal;
      height: auto;
      line-height: 1.2;
    }
  }

  .modern-tabs {
    padding: 10px;
    border-radius: 8px;
  }

  :deep(.el-tabs__item) {
    padding: 0 10px;
    font-size: 12px;
    height: 38px;
    line-height: 38px;
  }

  :deep(.el-tabs__header) {
    margin-bottom: 20px;
  }

  .tab-header {
    margin-bottom: 14px;
    padding-bottom: 10px;

    h2 {
      font-size: 14px;
    }
  }
}

// Extra Small Mobile
@media (max-width: 360px) {
  .mijozlar-container {
    padding: 8px;
  }

  .header-text h1 {
    font-size: 16px;
  }

  .header-text .subtitle {
    font-size: 10px;
  }

  .statistics-tags-horizontal {
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;

    .el-tag {
      padding: 8px 6px;
      font-size: 10px;
    }
  }

  .tab-header h2 {
    font-size: 13px;
  }
}
</style>

