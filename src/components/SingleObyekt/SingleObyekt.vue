<template>
  <div class="container">
    <div class="page-header">
      <div class="header-content">
        <el-button class="back-button" :icon="ArrowLeft" @click="goback()">
          Ortga qaytish
        </el-button>
        <div class="header-text">
          <h1>Obyekt haqida batafsil ma'lumot</h1>
          <p class="subtitle">To'liq ma'lumotlar va joylashuv</p>
        </div>
      </div>
    </div>

    <div v-loading="loading" class="content-wrapper">
      <div
        v-for="(item, index) in comeandgoesStore.allComeAndGoesofUser.comeAndGoInsides"
        :key="index"
        class="object-card"
      >
        <div class="card-header">
          <div class="header-info">
            <span class="object-badge">
              <el-icon><Location /></el-icon>
              Obyekt #{{ index + 1 }}
            </span>
            <el-tag v-if="item.when_came" type="success" size="large">
              <el-icon><CircleCheck /></el-icon>
              Yakunlangan
            </el-tag>
            <el-tag v-else type="warning" size="large">
              <el-icon><Clock /></el-icon>
              Jarayonda
            </el-tag>
          </div>
        </div>

        <div class="card-body">
          <div class="info-grid">
            <!-- Time Information -->
            <div class="info-section">
              <h3 class="section-title">
                <el-icon class="section-icon"><Clock /></el-icon>
                Vaqt ma'lumotlari
              </h3>
              <div class="info-rows">
                <div class="info-row">
                  <span class="info-label">Ketish vaqti</span>
                  <span class="info-value">{{ formatDate(item.when_gone) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Qaytish vaqti</span>
                  <div class="coming-time-wrapper">
                    <span v-if="item.when_came" class="info-value success">
                      {{ formatDate(item.when_came) }}
                    </span>
                    <el-config-provider
                      v-else-if="!isMoreThanTwoDays(item.createdAt)"
                      :locale="locale"
                    >
                      <el-date-picker
                        v-model="item.comingtime"
                        type="datetime"
                        placeholder="Vaqtni tanlang"
                        style="width: 100%"
                        format="DD-MM-YYYY HH:mm"
                        value-format="YYYY-MM-DD HH:mm:ss"
                      />
                    </el-config-provider>
                    <el-alert
                      v-if="isMoreThanTwoDays(item.createdAt) && !item.when_came"
                      class="late-alert"
                      title="Obyekt ochilganidan 2 kundan keyin tahrirlay olmaysiz"
                      type="error"
                      :closable="false"
                      show-icon
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Object Information -->
            <div class="info-section">
              <h3 class="section-title">
                <el-icon class="section-icon"><Document /></el-icon>
                Obyekt ma'lumotlari
              </h3>
              <div class="info-rows">
                <div class="info-row">
                  <span class="info-label">Qayerga</span>
                  <span class="info-value">{{ item.whereto }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Turi</span>
                  <el-tag :type="item.dogovor_or_kp === 'Dogovor' ? 'success' : 'info'">
                    {{ item.dogovor_or_kp }}
                  </el-tag>
                </div>
                <div class="info-row">
                  <span class="info-label">
                    {{ item.dogovor_or_kp === 'Dogovor' ? 'Dogovor raqami' : 'KP raqami' }}
                  </span>
                  <span class="info-value">{{ item.dogovorkp_number }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">
                    {{ item.dogovor_or_kp === 'Dogovor' ? 'Dogovor sanasi' : 'KP sanasi' }}
                  </span>
                  <span class="info-value">{{ formatDate(item.dogovorkp_date) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Firma nomi</span>
                  <span class="info-value company">{{ item.company_name }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Qo'shimcha ma'lumot</span>
                  <span class="info-value">{{ item.more_info }}</span>
                </div>
              </div>
            </div>

            <!-- Location Section -->
            <div class="info-section full-width">
              <h3 class="section-title">
                <el-icon class="section-icon"><MapLocation /></el-icon>
                Joylashuv
              </h3>
              <div class="location-wrapper">
                <LocationShower
                  access-token="pk.eyJ1IjoidG9saWJqb25mYXl6IiwiYSI6ImNtY2x6amdkczBoZG0ya3NkYTI2NW8waWMifQ.yM3o-yj1ZPUGJG-gWREK6Q"
                  :latitude="item.lat"
                  :longitude="item.lng"
                  :zoom="14"
                  :show-address="true"
                />
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <el-button
              type="primary"
              size="large"
              :disabled="!item.comingtime || item.when_came"
              @click="updateCameTime(item)"
              :loading="updateLoading"
              :icon="Check"
            >
              Yangilash
            </el-button>
            <!-- <el-button size="large" @click="goback()" :icon="Close">Bekor qilish</el-button> -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useComeAndGoesStore } from '@/stores/comeandgoes'
import { useComeAndGoInsideStore } from '@/stores/comeandgoinside'
import { onMounted, ref } from 'vue'
import LocationShower from './LocationShower.vue'
import ru from 'element-plus/dist/locale/ru.mjs'
import { useRoute } from 'vue-router'
import router from '@/router'
import { formatDate } from '@/composables/useDateFormatter'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  Location,
  Clock,
  Document,
  MapLocation,
  Check,
  CircleCheck,
} from '@element-plus/icons-vue'

const comeandgoesStore = useComeAndGoesStore()
const comeandgoInsideStore = useComeAndGoInsideStore()
const updateLoading = ref(false)
const loading = ref(false)
const route = useRoute()
const locale = ru

const goback = () => {
  router.push('/obyekt')
}

const updateCameTime = async (item) => {
  if (!item.comingtime) {
    ElMessage.error('Iltimos, vaqtni tanlang!')
    return
  }

  updateLoading.value = true
  try {
    const payload = {
      when_came: item.comingtime,
    }
    await comeandgoInsideStore.updateComeAndGoInsideById(payload, item.id)
    ElMessage.success('Muvaffaqiyatli yangilandi!')
    await comeandgoesStore.getComeAndGoById(route.params.id)
  } catch (error) {
    ElMessage.error('Xatolik yuz berdi!')
    console.error('Update error:', error)
  } finally {
    updateLoading.value = false
  }
}

function isMoreThanTwoDays(time) {
  const givenTime = new Date(time)
  const currentTime = new Date()
  const timeDifference = Math.abs(currentTime - givenTime)
  const twoDaysInMs = 2 * 24 * 60 * 60 * 1000

  return timeDifference >= twoDaysInMs
}

onMounted(async () => {
  loading.value = true
  await comeandgoesStore.getComeAndGoById(route.params.id)
  console.log(comeandgoesStore.allComeAndGoesofUser)
  loading.value = false
})
</script>

<style scoped lang="scss">
.container {
  width: 100%;
  padding: 32px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 32px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 24px;
}

.back-button {
  font-weight: 500;
  padding: 10px 20px;
}

.header-text {
  flex: 1;

  h1 {
    font-size: 32px;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 8px 0;
  }

  .subtitle {
    font-size: 15px;
    color: #6b7280;
    margin: 0;
  }
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.object-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }
}

.card-header {
  background: linear-gradient(135deg, #409eff 0%, #3a8ee6 100%);
  padding: 20px 28px;
}

.header-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.object-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  color: white;
  font-size: 20px;
  font-weight: 600;

  .el-icon {
    font-size: 24px;
  }
}

.card-body {
  padding: 32px 28px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 28px;
  margin-bottom: 32px;
}

.info-section {
  &.full-width {
    grid-column: 1 / -1;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #f3f4f6;
}

.section-icon {
  font-size: 20px;
  color: #409eff;
}

.info-rows {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  background: #f9fafb;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;

  &:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
  }
}

.info-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 15px;
  color: #1f2937;
  font-weight: 600;

  &.primary {
    color: #409eff;
  }

  &.success {
    color: #67c23a;
  }

  &.company {
    color: #409eff;
  }
}

.coming-time-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.late-alert {
  :deep(.el-alert__content) {
    font-size: 13px;
  }
}

.location-wrapper {
  width: 100%;
  padding: 50px 0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid #e5e7eb;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 24px;
  border-top: 2px solid #f3f4f6;

  .el-button {
    padding: 12px 32px;
    font-weight: 600;
    border-radius: 10px;
    transition: all 0.3s ease;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
    }
  }
}

/* Responsive Design */
@media (max-width: 1024px) {
  .container {
    padding: 24px;
  }

  .info-grid {
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .container {
    padding: 16px;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .back-button {
    width: 100%;
  }

  .header-text {
    h1 {
      font-size: 24px;
    }

    .subtitle {
      font-size: 14px;
    }
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .card-body {
    padding: 24px 20px;
  }

  .header-info {
    flex-direction: column;
    align-items: flex-start;
  }

  .action-buttons {
    flex-direction: column;

    .el-button {
      width: 100%;
    }
  }
}

@media (max-width: 480px) {
  .container {
    padding: 12px;
  }

  .header-text h1 {
    font-size: 20px;
  }

  .card-header {
    padding: 16px 20px;
  }

  .card-body {
    padding: 20px 16px;
  }

  .section-title {
    font-size: 16px;
  }

  .object-badge {
    font-size: 18px;
  }
}
</style>
