<template>
  <div class="container">
    <div class="page-header">
      <div class="header-content">
        <el-button class="back-button" :icon="ArrowLeft" @click="goback()">
          {{ $t('back') }}
        </el-button>
        <div class="header-text">
          <h1>{{ $t('mijozmaininfo') }}</h1>
          <p class="subtitle">{{ $t('toliqmalumot') }}</p>
        </div>
      </div>
    </div>

    <div v-loading="loading" class="content-wrapper">
      <div v-if="partnerData" class="object-card">
        <div class="card-header">
          <div class="header-info">
            <span class="object-badge">
              <el-icon><User /></el-icon>
              {{ partnerData.fullname }}
            </span>
            <el-tag
              :type="partnerData.partner_type === 'doimiymijoz' ? 'success' : 'warning'"
              size="large"
            >
              <el-icon><CircleCheck /></el-icon>
              {{ partnerData.partner_type }}
            </el-tag>
          </div>
        </div>

        <div class="card-body">
          <div class="info-grid">
            <!-- Personal Information -->
            <div class="info-section">
              <h3 class="section-title">
                <el-icon class="section-icon"><User /></el-icon>
                {{ $t('shaxsiymalumot') }}
              </h3>
              <div class="info-rows">
                <div class="info-row">
                  <span class="info-label">{{ $t('toliqFIO') }}</span>
                  <span class="info-value">{{ partnerData.fullname }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">{{ $t('mijozTuri') }}</span>
                  <span class="info-value">{{ partnerData.mijozturi }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">{{ $t('inn') }}</span>
                  <span class="info-value">{{ partnerData.inn || "Yo'q" }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">{{ $t('qoshimcha') }}</span>
                  <div class="more-info-wrapper">
                    <span class="info-value">{{ partnerData.more_info || "Yo'q" }}</span>
                    <el-button
                      type="text"
                      size="small"
                      @click="openMoreInfoDialog"
                      :icon="Edit"
                      class="edit-more-info-btn"
                    >
                      {{ $t('edit') }}
                    </el-button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Location Information -->
            <div class="info-section">
              <h3 class="section-title">
                <el-icon class="section-icon"><Location /></el-icon>
                {{ $t('manzilmalumoti') }}
              </h3>
              <div class="info-rows">
                <div class="info-row">
                  <span class="info-label">{{ $t('respublika') }}</span>
                  <span class="info-value">{{ formatLocationName(partnerData.republic) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">{{ $t('viloyat') }}</span>
                  <span class="info-value">{{ formatLocationName(partnerData.viloyat) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">{{ $t('shaharTuman') }}</span>
                  <span class="info-value">{{ formatLocationName(partnerData.shahar_tuman) }}</span>
                </div>
              </div>
            </div>

            <div class="info-section">
              <h3 class="section-title">
                <el-icon class="section-icon"><Phone /></el-icon>
                {{ $t('aloqamalumoti') }}
              </h3>
              <div class="info-rows">
                <div class="info-row">
                  <span class="info-label">{{ $t('telefon') }}</span>
                  <el-link type="primary" :href="`tel:${partnerData.phone_number}`">
                    {{ partnerData.phone_number }}
                  </el-link>
                </div>
                <div class="info-row">
                  <span class="info-label">{{ $t('qoshimchaTelefon') }}</span>
                  <el-link type="primary" :href="`tel:${partnerData.additional_phone_number}`">
                    {{ partnerData.additional_phone_number }}
                  </el-link>
                </div>
              </div>
            </div>

            <div class="info-section">
              <h3 class="section-title">
                <el-icon class="section-icon"><Document /></el-icon>
                {{ $t('hamkorturi') }}
              </h3>
              <div class="info-rows">
                <div class="info-row">
                  <span class="info-label">{{ $t('hamkorturi') }}</span>
                  <el-tag :type="partnerData.partner_type === 'doimiymijoz' ? 'success' : 'info'">
                    {{ partnerData.partner_type }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>

          <div class="action-buttons">
            <el-button type="primary" size="large" @click="openEditDialog" :icon="Edit">
              {{ $t('edit') }}
            </el-button>
          </div>
        </div>
      </div>

      <div v-if="!loading && !partnerData" style="text-align: center; padding: 60px 20px">
        <el-empty :description="$t('Kiritilmagan')" />
      </div>
    </div>

    <!-- Edit Dialog -->
    <el-dialog
      v-model="editDialogVisible"
      title="Tahrirlash"
      :width="dialogWidth"
      :close-on-click-modal="false"
      class="edit-dialog"
    >
      <div v-if="!canEdit" class="edit-warning">
        <el-alert
          type="error"
          :title="`Bu hamkor ${getCreatedDaysAgo()} kun oldin yaratilgan. Faqat bir kun ichida tahrir qilsa bo'ladi!`"
          :closable="false"
          show-icon
        />
      </div>

      <el-form v-else ref="editFormRef" :model="editForm" label-width="150px" class="edit-form">
        <el-form-item label="F.I.O" prop="fullname">
          <el-input v-model="editForm.fullname" placeholder="F.I.O ni kiriting" />
        </el-form-item>

        <el-form-item label="Mijoz turi" prop="mijozturi">
          <el-input v-model="editForm.mijozturi" placeholder="Mijoz turini kiriting" />
        </el-form-item>

        <el-form-item label="INN" prop="inn">
          <el-input v-model="editForm.inn" placeholder="INN ni kiriting" />
        </el-form-item>

        <el-form-item label="Telefon raqami" prop="phone_number">
          <el-input v-model="editForm.phone_number" placeholder="Telefon raqamini kiriting" />
        </el-form-item>

        <el-form-item label="Qo'shimcha telefon" prop="additional_phone_number">
          <el-input
            v-model="editForm.additional_phone_number"
            placeholder="Qo'shimcha telefon kiriting"
          />
        </el-form-item>

        <el-form-item label="Respublika" prop="republic">
          <el-input v-model="editForm.republic" placeholder="Respublikani kiriting" />
        </el-form-item>

        <el-form-item label="Viloyat" prop="viloyat">
          <el-input v-model="editForm.viloyat" placeholder="Viloyatni kiriting" />
        </el-form-item>

        <el-form-item label="Shahar/Tuman" prop="shahar_tuman">
          <el-input v-model="editForm.shahar_tuman" placeholder="Shahar/Tumanни kiriting" />
        </el-form-item>

        <el-form-item label="Qo'shimcha ma'lumot" prop="more_info">
          <el-input
            v-model="editForm.more_info"
            type="textarea"
            placeholder="Qo'shimcha ma'lumot kiriting"
            rows="4"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">Bekor qilish</el-button>
        <el-button v-if="canEdit" type="primary" :loading="editLoading" @click="handleSaveEdit">
          Saqlash
        </el-button>
      </template>
    </el-dialog>

    <!-- More Info Edit Dialog -->
    <el-dialog
      v-model="moreInfoDialogVisible"
      title="Qo'shimcha ma'lumot"
      :width="dialogWidth"
      :close-on-click-modal="false"
      class="more-info-dialog"
    >
      <el-form ref="moreInfoFormRef" :model="moreInfoForm" label-width="120px" class="edit-form">
        <el-form-item label="Qo'shimcha ma'lumot" prop="more_info">
          <el-input
            v-model="moreInfoForm.more_info"
            type="textarea"
            placeholder="Qo'shimcha ma'lumotni kiriting"
            rows="8"
            show-word-limit
            maxlength="1000"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="moreInfoDialogVisible = false">Bekor qilish</el-button>
        <el-button type="primary" :loading="moreInfoLoading" @click="handleSaveMoreInfo">
          Saqlash
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import router from '@/router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  Location,
  User,
  Phone,
  Document,
  Edit,
  Delete,
  CircleCheck,
} from '@element-plus/icons-vue'
import { usePartnersStore } from '@/stores/partners'

const partnersStore = usePartnersStore()
const loading = ref(false)
const editLoading = ref(false)
const editDialogVisible = ref(false)
const moreInfoLoading = ref(false)
const moreInfoDialogVisible = ref(false)
const route = useRoute()

// Edit form
const editForm = ref({
  fullname: '',
  mijozturi: '',
  inn: '',
  phone_number: '',
  additional_phone_number: '',
  republic: '',
  viloyat: '',
  shahar_tuman: '',
  more_info: '',
})

// More Info form
const moreInfoForm = ref({
  more_info: '',
})

// Check if can edit (created less than 1 day ago)
const canEdit = computed(() => {
  if (!partnerData.value?.createdAt) return false
  const createdTime = new Date(partnerData.value.createdAt)
  const currentTime = new Date()
  const diffInMs = currentTime - createdTime
  const oneDayInMs = 24 * 60 * 60 * 1000
  return diffInMs < oneDayInMs
})

// Responsive dialog width
const dialogWidth = computed(() => {
  if (typeof window === 'undefined') return '50%'
  const width = window.innerWidth
  if (width < 480) return '90%'
  if (width < 768) return '85%'
  if (width < 1024) return '70%'
  return '50%'
})

// Get how many days ago created
const getCreatedDaysAgo = () => {
  if (!partnerData.value?.createdAt) return 0
  const createdTime = new Date(partnerData.value.createdAt)
  const currentTime = new Date()
  const diffInMs = currentTime - createdTime
  const daysAgo = Math.floor(diffInMs / (24 * 60 * 60 * 1000))
  return daysAgo
}

// Comprehensive location name formatter
const formatLocationName = (name) => {
  if (!name) return ''

  // Dictionary of special cases
  const specialCases = {
    ozbekiston: "O'zbekiston",
    qazoqstan: 'Qozoqstan',
    turkmonistaon: 'Turkmaniston',
    tajikiston: 'Tajikiston',
    kirgiziston: 'Qirgiziston',
    rossiya: 'Rossiya',
  }

  // Split by underscore
  const words = name.split('_')

  const formattedWords = words.map((word) => {
    // Check if it's in special cases dictionary
    if (specialCases[word.toLowerCase()]) {
      return specialCases[word.toLowerCase()]
    }

    // Handle words with suffixes
    if (word.endsWith('shahri') || word.endsWith('shahr')) {
      const base = word.replace(/shahri$|shahr$/, '')
      return base.charAt(0).toUpperCase() + base.slice(1).toLowerCase() + ' shahri'
    }

    if (word.endsWith('tumani') || word.endsWith('tuman')) {
      const base = word.replace(/tumani$|tuman$/, '')
      return base.charAt(0).toUpperCase() + base.slice(1).toLowerCase() + ' tumani'
    }

    if (word.endsWith('rayoni') || word.endsWith('rayon')) {
      const base = word.replace(/rayoni$|rayon$/, '')
      return base.charAt(0).toUpperCase() + base.slice(1).toLowerCase() + ' rayoni'
    }

    // Default: capitalize first letter
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  })

  return formattedWords.join(' ')
}

const partnerData = computed(() => {
  return partnersStore.partnerbyid
})

const goback = () => {
  router.push('/')
}

const openEditDialog = () => {
  if (!canEdit.value) {
    editDialogVisible.value = true
    return
  }

  // Fill form with current data
  if (partnerData.value) {
    editForm.value = {
      fullname: partnerData.value.fullname || '',
      mijozturi: partnerData.value.mijozturi || '',
      inn: partnerData.value.inn || '',
      phone_number: partnerData.value.phone_number || '',
      additional_phone_number: partnerData.value.additional_phone_number || '',
      republic: partnerData.value.republic || '',
      viloyat: partnerData.value.viloyat || '',
      shahar_tuman: partnerData.value.shahar_tuman || '',
      more_info: partnerData.value.more_info || '',
    }
  }

  editDialogVisible.value = true
}

const handleSaveEdit = async () => {
  if (!canEdit.value) {
    ElMessage.error('Tahrirlashning vaqti tugagan!')
    return
  }

  editLoading.value = true
  try {
    await partnersStore.updateOnePartner(editForm.value, route.params.id)
    ElMessage.success('Hamkor muvaffaqiyatli tahrirlandi')
    editDialogVisible.value = false
    await partnersStore.getOnePartner(route.params.id)
  } catch (error) {
    ElMessage.error('Tahrirlashda xatolik yuz berdi')
    console.error(error)
  } finally {
    editLoading.value = false
  }
}

const openMoreInfoDialog = () => {
  if (partnerData.value) {
    moreInfoForm.value = {
      more_info: partnerData.value.more_info || '',
    }
  }
  moreInfoDialogVisible.value = true
}

const handleSaveMoreInfo = async () => {
  moreInfoLoading.value = true
  try {
    await partnersStore.updateOnePartner(
      { more_info: moreInfoForm.value.more_info },
      route.params.id
    )
    ElMessage.success("Qo'shimcha ma'lumot muvaffaqiyatli yangilandi")
    moreInfoDialogVisible.value = false
    await partnersStore.getOnePartner(route.params.id)
  } catch (error) {
    ElMessage.error("Yangilashda xatolik yuz berdi")
    console.error(error)
  } finally {
    moreInfoLoading.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await partnersStore.getOnePartner(route.params.id)
  } catch (error) {
    ElMessage.error("Mijoz ma'lumotlarini yuklashda xatolik yuz berdi")
  } finally {
    loading.value = false
  }
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
  flex-wrap: wrap;
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

.more-info-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  width: 100%;

  .info-value {
    flex: 1;
    word-break: break-word;
    line-height: 1.5;
  }

  .edit-more-info-btn {
    flex-shrink: 0;
    color: #409eff;
    padding: 4px 8px;
    font-size: 12px;
    white-space: nowrap;

    &:hover {
      color: #66b1ff;
      background: #f0f9ff;
      border-radius: 4px;
    }
  }
}

.user-info-wrapper {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.user-avatar {
  flex-shrink: 0;
  width: 100px;
  height: 100px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid #e5e7eb;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.user-details {
  flex: 1;
  min-width: 0;

  .info-rows {
    gap: 12px;
  }

  .info-row {
    padding: 10px;
    border: none;
    background: transparent;

    &:hover {
      background: #f3f4f6;
    }
  }
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

.edit-warning {
  margin-bottom: 20px;
  padding: 16px;
  background: #fef0f0;
  border-radius: 8px;

  :deep(.el-alert) {
    padding: 12px 16px;
    background: transparent;
    border: none;

    .el-alert__content {
      font-size: 14px;
    }
  }
}

.edit-form {
  padding: 20px 0;

  :deep(.el-form-item) {
    margin-bottom: 20px;

    .el-form-item__label {
      font-weight: 500;
      color: #1f2937;
    }

    .el-input__wrapper {
      box-shadow: 0 0 0 1px #e5e7eb;

      &:hover {
        box-shadow: 0 0 0 1px #d1d5db;
      }

      &.is-focus {
        box-shadow: 0 0 0 2px #409eff;
      }
    }

    textarea {
      resize: vertical;
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

  .edit-form {
    :deep(.el-form-item__label) {
      width: auto !important;
    }

    :deep(.el-form-item) {
      flex-direction: column;
    }
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
    gap: 12px;
  }

  .action-buttons {
    flex-direction: column;

    .el-button {
      width: 100%;
    }
  }

  .user-info-wrapper {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .user-avatar {
    width: 80px;
    height: 80px;
  }

  .edit-dialog {
    :deep(.el-dialog) {
      max-height: 90vh;
      border-radius: 12px;
    }

    :deep(.el-dialog__header) {
      padding: 16px;
    }

    :deep(.el-dialog__body) {
      padding: 16px;
      max-height: calc(90vh - 120px);
      overflow-y: auto;
    }

    :deep(.el-dialog__footer) {
      padding: 16px;
    }
  }

  .more-info-dialog {
    :deep(.el-dialog) {
      max-height: 80vh;
      border-radius: 12px;
    }

    :deep(.el-dialog__header) {
      padding: 16px;
    }

    :deep(.el-dialog__body) {
      padding: 16px;
      max-height: calc(80vh - 120px);
      overflow-y: auto;
    }

    :deep(.el-dialog__footer) {
      padding: 16px;
    }
  }

  .edit-form {
    :deep(.el-form-item__label) {
      width: 100% !important;
      margin-bottom: 8px !important;
    }

    :deep(.el-form-item__content) {
      line-height: normal;
    }
  }

  .edit-warning {
    margin-bottom: 16px;
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 12px;
  }

  .header-text h1 {
    font-size: 20px;
  }

  .header-text .subtitle {
    font-size: 12px;
  }

  .card-header {
    padding: 12px 16px;
  }

  .card-body {
    padding: 16px 12px;
  }

  .section-title {
    font-size: 16px;
    margin-bottom: 16px;
  }

  .object-badge {
    font-size: 16px;
    gap: 6px;

    .el-icon {
      font-size: 18px;
    }
  }

  .header-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;

    .el-tag {
      width: 100%;
      justify-content: flex-start;
    }
  }

  .info-grid {
    gap: 12px;
  }

  .info-section {
    padding: 0;
  }

  .section-title {
    font-size: 14px;
    gap: 6px;

    .section-icon {
      font-size: 16px;
    }
  }

  .info-rows {
    gap: 12px;
  }

  .info-row {
    padding: 10px;
    gap: 6px;

    &:hover {
      background: #f9fafb;
    }
  }

  .info-label {
    font-size: 12px;
  }

  .info-value {
    font-size: 14px;
  }

  .more-info-wrapper {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;

    .info-value {
      width: 100%;
    }

    .edit-more-info-btn {
      width: 100%;
      text-align: center;
      padding: 6px 10px;
      font-size: 13px;
    }
  }

  .action-buttons {
    flex-direction: column;
    padding-top: 16px;
    gap: 8px;

    .el-button {
      width: 100%;
      padding: 10px 16px;
      font-size: 14px;
    }
  }

  .edit-dialog {
    :deep(.el-dialog) {
      width: 95vw !important;
      max-height: 95vh;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }

    :deep(.el-dialog__header) {
      padding: 12px 16px;
      border-bottom: 1px solid #e5e7eb;
    }

    :deep(.el-dialog__title) {
      font-size: 16px;
      font-weight: 600;
    }

    :deep(.el-dialog__close) {
      font-size: 18px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    :deep(.el-dialog__body) {
      padding: 12px 16px;
      max-height: calc(95vh - 130px);
      overflow-y: auto;

      &::-webkit-scrollbar {
        width: 4px;
      }

      &::-webkit-scrollbar-track {
        background: #f1f5f9;
      }

      &::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 2px;

        &:hover {
          background: #94a3b8;
        }
      }
    }

    :deep(.el-dialog__footer) {
      padding: 12px 16px;
      border-top: 1px solid #e5e7eb;

      .el-button {
        width: 100%;
        padding: 10px 16px;
        font-size: 14px;

        &:not(:last-child) {
          margin-right: 0;
          margin-bottom: 8px;
        }
      }
    }
  }

  .more-info-dialog {
    :deep(.el-dialog) {
      width: 95vw !important;
      max-height: 95vh;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }

    :deep(.el-dialog__header) {
      padding: 12px 16px;
      border-bottom: 1px solid #e5e7eb;
    }

    :deep(.el-dialog__title) {
      font-size: 16px;
      font-weight: 600;
    }

    :deep(.el-dialog__close) {
      font-size: 18px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    :deep(.el-dialog__body) {
      padding: 12px 16px;
      max-height: calc(95vh - 130px);
      overflow-y: auto;

      &::-webkit-scrollbar {
        width: 4px;
      }

      &::-webkit-scrollbar-track {
        background: #f1f5f9;
      }

      &::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 2px;

        &:hover {
          background: #94a3b8;
        }
      }
    }

    :deep(.el-dialog__footer) {
      padding: 12px 16px;
      border-top: 1px solid #e5e7eb;

      .el-button {
        width: 100%;
        padding: 10px 16px;
        font-size: 14px;

        &:not(:last-child) {
          margin-right: 0;
          margin-bottom: 8px;
        }
      }
    }
  }

  .edit-warning {
    margin-bottom: 12px;
    padding: 10px;
    border-radius: 6px;

    :deep(.el-alert) {
      padding: 10px 12px;

      .el-alert__content {
        font-size: 13px;
        line-height: 1.4;
      }
    }
  }

  .edit-form {
    padding: 12px 0;

    :deep(.el-form-item) {
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    :deep(.el-form-item__label) {
      width: 100% !important;
      margin-bottom: 8px !important;
      font-size: 13px;
      font-weight: 500;
      display: block !important;
      text-align: left;
      padding: 0 !important;
    }

    :deep(.el-form-item__content) {
      line-height: normal;
    }

    :deep(.el-input__wrapper) {
      border-radius: 6px;
      font-size: 14px;
    }

    :deep(.el-input) {
      --el-input-border-radius: 6px;
    }

    :deep(textarea) {
      font-size: 14px;
      line-height: 1.5;
      border-radius: 6px;
    }
  }

  .user-info-wrapper {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 12px;
    gap: 12px;
  }

  .user-avatar {
    width: 60px;
    height: 60px;
    border-radius: 8px;
  }

  .user-details {
    width: 100%;

    .info-rows {
      gap: 10px;
    }
  }
}
</style>
