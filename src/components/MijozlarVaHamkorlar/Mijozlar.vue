<template>
  <div class="mijozlar-container" v-loading="loading">
    <div class="page-header">
      <div class="header-text">
        <h1>Hamkorlar va mijozlar</h1>
        <p class="subtitle">Barcha hamkorlar va mijozlar ro'yxati</p>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="modern-tabs" @tab-click="handleClick">
      <el-tab-pane label="Doimiy mijoz" name="doimiymijoz">
        <div class="tab-content">
          <div class="tab-header">
            <h2>Doimiy mijozlar</h2>
            <el-button type="primary" size="large" :icon="Plus" @click="handleAddMijoz">
              Yangi qo'shish
            </el-button>
          </div>

          <MijozCard
            v-if="getFilteredPartners('doimiymijoz').length > 0"
            :partners="getFilteredPartners('doimiymijoz')"
            @delete="handleDelete"
            @edit="handleEdit"
          />

          <el-empty v-else description="Doimiy mijozlar topilmadi" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="Montaj guruhlar" name="montajnik">
        <div class="tab-content">
          <div class="tab-header">
            <h2>Montaj guruhlar</h2>
            <el-button type="primary" size="large" :icon="Plus" @click="handleAddMijoz">
              Yangi qo'shish
            </el-button>
          </div>

          <MijozCard
            v-if="getFilteredPartners('montajnik').length > 0"
            :partners="getFilteredPartners('montajnik')"
            @delete="handleDelete"
            @edit="handleEdit"
          />

          <el-empty v-else description="Montajniklar topilmadi" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="Quruvchi" name="quruvchi">
        <div class="tab-content">
          <div class="tab-header">
            <h2>Quruvchilar</h2>
            <el-button type="primary" size="large" :icon="Plus" @click="handleAddMijoz">
              Yangi qo'shish
            </el-button>
          </div>

          <MijozCard
            v-if="getFilteredPartners('quruvchi').length > 0"
            :partners="getFilteredPartners('quruvchi')"
            @delete="handleDelete"
            @edit="handleEdit"
          />

          <el-empty v-else description="Quruvchilar topilmadi" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="Do'kon / Bozor" name="dokonchitadbirkor">
        <div class="tab-content">
          <div class="tab-header">
            <h2>Do'konchi tadbirkorlar</h2>
            <el-button type="primary" size="large" :icon="Plus" @click="handleAddMijoz">
              Yangi qo'shish
            </el-button>
          </div>

          <MijozCard
            v-if="getFilteredPartners('dokonchitadbirkor').length > 0"
            :partners="getFilteredPartners('dokonchitadbirkor')"
            @delete="handleDelete"
            @edit="handleEdit"
          />

          <el-empty v-else description="Do'konchi tadbirkorlar topilmadi" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="Proyekt instituti" name="proyektinstitut">
        <div class="tab-content">
          <div class="tab-header">
            <h2>Proyekt institutlar</h2>
            <el-button type="primary" size="large" :icon="Plus" @click="handleAddMijoz">
              Yangi qo'shish
            </el-button>
          </div>

          <MijozCard
            v-if="getFilteredPartners('proyektinstitut').length > 0"
            :partners="getFilteredPartners('proyektinstitut')"
            @delete="handleDelete"
            @edit="handleEdit"
          />

          <el-empty v-else description="Proyekt institutlar topilmadi" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="Tender firmalar" name="tenderfirmalar">
        <div class="tab-content">
          <div class="tab-header">
            <h2>Tender o'tkazadigan firmalar ro'yxati</h2>
            <el-button type="primary" size="large" :icon="Plus" @click="handleAddMijoz">
              Yangi qo'shish
            </el-button>
          </div>

          <MijozCard
            v-if="getFilteredPartners('tenderfirmalar').length > 0"
            :partners="getFilteredPartners('tenderfirmalar')"
            @delete="handleDelete"
            @edit="handleEdit"
          />

          <el-empty v-else description="Tender firmalar topilmadi" />
        </div>
      </el-tab-pane>

      <el-tab-pane label='"UKS" - Yagona buyurtmachi' name="uks">
        <div class="tab-content">
          <div class="tab-header">
            <h2>UKS tashkiloti</h2>
            <el-button type="primary" size="large" :icon="Plus" @click="handleAddMijoz">
              Yangi qo'shish
            </el-button>
          </div>

          <MijozCard
            v-if="getFilteredPartners('uks').length > 0"
            :partners="getFilteredPartners('uks')"
            @delete="handleDelete"
            @edit="handleEdit"
          />

          <el-empty v-else description="UKS tashkilotlar topilmadi" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="Boshqa" name="boshqa">
        <div class="tab-content">
          <div class="tab-header">
            <h2>Boshqalar</h2>
            <el-button type="primary" size="large" :icon="Plus" @click="handleAddMijoz">
              Yangi qo'shish
            </el-button>
          </div>

          <MijozCard
            v-if="getFilteredPartners('boshqa').length > 0"
            :partners="getFilteredPartners('boshqa')"
            @delete="handleDelete"
            @edit="handleEdit"
          />

          <el-empty v-else description="Boshqa hamkorlar topilmadi" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="Jami" name="jami">
        <div class="tab-content">
          <MijozCardJami
            v-if="getFilteredPartners('jami').length > 0"
            :partners="getFilteredPartners('jami')"
            @delete="handleDelete"
            @edit="handleEdit"
          />

          <el-empty v-else description="Boshqa hamkorlar topilmadi" />
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

.header-text {
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

  .header-text h1 {
    font-size: 26px;
  }

  .header-text .subtitle {
    font-size: 14px;
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

  .header-text h1 {
    font-size: 22px;
  }

  .header-text .subtitle {
    font-size: 13px;
  }

  .modern-tabs {
    padding: 16px;
    border-radius: 12px;
    margin: 0 -16px;
    width: calc(100% + 32px);
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

  .header-text h1 {
    font-size: 20px;
    margin-bottom: 6px;
  }

  .header-text .subtitle {
    font-size: 12px;
  }

  .modern-tabs {
    padding: 12px;
    border-radius: 10px;
    margin: 0 -12px;
    width: calc(100% + 24px);
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

  .header-text h1 {
    font-size: 18px;
    margin-bottom: 4px;
  }

  .header-text .subtitle {
    font-size: 11px;
  }

  .modern-tabs {
    padding: 10px;
    border-radius: 8px;
    margin: 0 -10px;
    width: calc(100% + 20px);
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

  .tab-header h2 {
    font-size: 13px;
  }
}
</style>
