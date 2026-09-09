<template>
  <div class="detail-container" v-loading="loading">
    <div v-if="loyiha" class="detail-inner">
      <!-- Sarlavha -->
      <div class="detail-header">
        <div class="header-left">
          <el-button class="back-btn" :icon="ArrowLeft" text @click="goBack">
            {{ $t('loyihaBack') }}
          </el-button>
          <h1>
            {{ $t('loyihaDetailTitle') }}
            <span class="order-badge">№{{ loyiha.order_number ?? loyiha.id }}</span>
          </h1>
          <p class="created-line">
            {{ $t('loyihaCreatedBy') }}:
            <strong>{{ fullName(loyiha.creator) || '—' }}</strong>
            · {{ formatDateTime(loyiha.createdAt) }}
          </p>
        </div>

        <div class="header-actions">
          <el-button :icon="EditPen" @click="openEditDialog">{{ $t('edit') }}</el-button>
          <el-popconfirm
            :title="$t('loyihaDeleteConfirm')"
            width="280"
            placement="bottom-end"
            :confirm-button-text="$t('deleteConfirm')"
            :cancel-button-text="$t('cancel')"
            @confirm="handleDelete"
          >
            <template #reference>
              <el-button type="danger" plain :icon="Delete">{{ $t('delete') }}</el-button>
            </template>
          </el-popconfirm>
        </div>
      </div>

      <!-- Asosiy ma'lumotlar -->
      <div class="cards-grid">
        <div class="info-card">
          <h3 class="card-title">{{ $t('loyihaSectionMain') }}</h3>
          <dl class="info-list">
            <div class="info-row">
              <dt>{{ $t('loyihaManagerLabel') }}</dt>
              <dd>{{ loyiha.manager_name || '—' }}</dd>
            </div>
            <div class="info-row">
              <dt>{{ $t('loyihaOtherLabel') }}</dt>
              <dd>{{ loyiha.other_source || '—' }}</dd>
            </div>
            <div class="info-row">
              <dt>{{ $t('loyihaSystemLabel') }}</dt>
              <dd>{{ loyiha.system_info || '—' }}</dd>
            </div>
            <div class="info-row">
              <dt>{{ $t('loyihaAreaLabel') }}</dt>
              <dd>
                <strong v-if="loyiha.area != null">{{ formatNumber(loyiha.area) }} m²</strong>
                <span v-else>—</span>
              </dd>
            </div>
          </dl>
        </div>

        <div class="info-card">
          <h3 class="card-title">{{ $t('loyihaDifficultyLabel') }}</h3>
          <div v-if="loyiha.difficulty" class="difficulty-block">
            <div class="difficulty-value" :class="difficultyClass(loyiha.difficulty)">
              {{ loyiha.difficulty }}<small>/10</small>
            </div>
            <div class="difficulty-bar">
              <div
                class="difficulty-fill"
                :class="difficultyClass(loyiha.difficulty)"
                :style="{ width: loyiha.difficulty * 10 + '%' }"
              ></div>
            </div>
            <span class="difficulty-label">{{ difficultyLabel(loyiha.difficulty) }}</span>
          </div>
          <p v-else class="empty-value">{{ $t('loyihaNotRated') }}</p>
        </div>

        <div class="info-card">
          <h3 class="card-title">{{ $t('loyihaTableContact') }}</h3>
          <ul class="contact-list">
            <li v-if="loyiha.contact_phone">
              <span class="contact-icon">📞</span>
              <a :href="`tel:${loyiha.contact_phone}`">{{ loyiha.contact_phone }}</a>
            </li>
            <li v-if="loyiha.contact_email">
              <span class="contact-icon">✉️</span>
              <a :href="`mailto:${loyiha.contact_email}`">{{ loyiha.contact_email }}</a>
            </li>
            <li v-if="loyiha.contact_address">
              <span class="contact-icon">📍</span>
              <span>{{ loyiha.contact_address }}</span>
            </li>
            <li v-if="!hasContact" class="empty-value">{{ $t('loyihaNoContact') }}</li>
          </ul>
        </div>
      </div>

      <!-- Izoh -->
      <div class="info-card comment-card">
        <h3 class="card-title">{{ $t('loyihaCommentLabel') }}</h3>
        <p v-if="loyiha.comment" class="comment-text">{{ loyiha.comment }}</p>
        <p v-else class="empty-value">{{ $t('loyihaNoComment') }}</p>
      </div>

      <el-alert
        v-if="!loyihaStore.storageReady"
        class="storage-warning"
        type="warning"
        :closable="false"
        show-icon
        :title="$t('loyihaStorageNotReady')"
      />

      <!-- Fayllar -->
      <div class="files-grid">
        <LoyihaFileSection
          archive
          :files="archiveFiles"
          :storage-ready="loyihaStore.storageReady"
          @upload="(e) => handleUpload(e, 'archive')"
          @download="downloadFile"
        />
        <LoyihaFileSection
          :files="workingFiles"
          :storage-ready="loyihaStore.storageReady"
          @upload="(e) => handleUpload(e, 'working')"
          @download="downloadFile"
          @rename="handleRename"
          @remove="handleFileDelete"
        />
      </div>
    </div>

    <el-empty v-else-if="!loading" :description="$t('loyihaNotFound')">
      <el-button type="primary" @click="goBack">{{ $t('loyihaBack') }}</el-button>
    </el-empty>

    <!-- Tahrirlash -->
    <LoyihaFormDialog
      v-model="dialogVisible"
      :model-value-data="loyiha"
      @saved="reload"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { ArrowLeft, EditPen, Delete } from '@element-plus/icons-vue'
import { useLoyihaStore } from '@/stores/loyiha'
import loyihaApi from '@/api/loyiha'
import LoyihaFileSection from './LoyihaFileSection.vue'
import LoyihaFormDialog from './LoyihaFormDialog.vue'
import {
  formatNumber,
  formatDateTime,
  difficultyClass,
  fullName,
} from '@/utils/loyihaFormat'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const loyihaStore = useLoyihaStore()

const loyiha = ref(null)
const loading = ref(true)
const dialogVisible = ref(false)

const loyihaId = computed(() => Number(route.params.id))

const archiveFiles = computed(() =>
  (loyiha.value?.files || []).filter((f) => f.section === 'archive'),
)
const workingFiles = computed(() =>
  (loyiha.value?.files || []).filter((f) => f.section === 'working'),
)
const hasContact = computed(
  () =>
    !!(
      loyiha.value?.contact_phone ||
      loyiha.value?.contact_email ||
      loyiha.value?.contact_address
    ),
)

const difficultyLabel = (value) => {
  const n = Number(value) || 0
  if (n >= 8) return t('loyihaDifficultyHigh')
  if (n >= 4) return t('loyihaDifficultyMid')
  return t('loyihaDifficultyLow')
}

const reload = async () => {
  try {
    const res = await loyihaApi.getOne(loyihaId.value)
    loyiha.value = res?.data || res
  } catch (error) {
    if (error?.response?.status === 404 || error?.response?.status === 403) {
      loyiha.value = null
    } else {
      ElMessage.error(t('loyihaMessageLoadError'))
    }
  }
}

const goBack = () => router.push('/loyiha')

const openEditDialog = () => {
  dialogVisible.value = true
}

const handleDelete = async () => {
  try {
    await loyihaStore.deleteLoyiha(loyihaId.value)
    ElMessage.success(t('loyihaMessageDeleted'))
    router.push('/loyiha')
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || t('loyihaMessageDeleteError'))
  }
}

// ─── Fayllar ───
const handleUpload = async ({ file, onProgress, onDone, onError }, section) => {
  try {
    await loyihaStore.uploadFile(loyihaId.value, section, file, onProgress)
    onDone()
    ElMessage.success(t('loyihaFileUploaded'))
    await reload()
  } catch (error) {
    onError()
    ElMessage.error(error?.response?.data?.message || t('loyihaFileUploadError'))
  }
}

const downloadFile = async (file) => {
  try {
    const url = await loyihaStore.getFileLink(file.id, 'download')
    if (url) window.open(url, '_blank')
  } catch {
    ElMessage.error(t('loyihaFileLinkError'))
  }
}

const handleRename = async ({ file, name }) => {
  try {
    await loyihaStore.updateFile(file.id, { file_name: name })
    ElMessage.success(t('loyihaFileUpdated'))
    await reload()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || t('loyihaFileUpdateError'))
  }
}

const handleFileDelete = async (file) => {
  try {
    await loyihaStore.deleteFile(file.id)
    ElMessage.success(t('loyihaFileDeleted'))
    await reload()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || t('loyihaFileDeleteError'))
  }
}

onMounted(async () => {
  await Promise.all([reload(), loyihaStore.checkStorage()])
  loading.value = false
})
</script>

<style lang="scss" scoped>
.detail-container {
  width: 100%;
  min-height: 100vh;
  padding: 32px;
  background: #f5f7fa;
  box-sizing: border-box;
}

.detail-inner {
  max-width: 1240px;
  margin: 0 auto;
}

/* ─── Sarlavha ──────────────────────────────────── */
.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  background: #fff;
  border-radius: 22px;
  padding: 22px 26px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.07);
  margin-bottom: 20px;
}

.back-btn {
  margin-bottom: 6px;
  padding-left: 0;
}

.header-left h1 {
  margin: 0 0 6px;
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.order-badge {
  background: linear-gradient(135deg, #409eff, #3a8ee6);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  padding: 4px 14px;
  border-radius: 999px;
}

.created-line {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* ─── Kartalar ──────────────────────────────────── */
.cards-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: 18px;
  margin-bottom: 18px;
}

.info-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: 20px 22px;
}

.card-title {
  margin: 0 0 14px;
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.info-list {
  margin: 0;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  padding: 9px 0;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }

  dt {
    font-size: 13px;
    color: #6b7280;
    flex-shrink: 0;
  }

  dd {
    margin: 0;
    font-size: 14px;
    color: #1f2937;
    font-weight: 500;
    text-align: right;
    word-break: break-word;
  }
}

.empty-value {
  color: #9ca3af;
  font-size: 13.5px;
  margin: 0;
}

/* Og'irlik */
.difficulty-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.difficulty-value {
  font-size: 40px;
  font-weight: 800;
  line-height: 1;

  small {
    font-size: 18px;
    font-weight: 600;
    color: #9ca3af;
  }

  &.diff-low {
    color: #10b981;
  }
  &.diff-mid {
    color: #e6a23c;
  }
  &.diff-high {
    color: #f56c6c;
  }
}

.difficulty-bar {
  height: 8px;
  background: #f1f3f6;
  border-radius: 999px;
  overflow: hidden;
}

.difficulty-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease;

  &.diff-low {
    background: #10b981;
  }
  &.diff-mid {
    background: #e6a23c;
  }
  &.diff-high {
    background: #f56c6c;
  }
}

.difficulty-label {
  font-size: 13px;
  color: #6b7280;
}

/* Kontaktlar */
.contact-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 11px;

  li {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    font-size: 14px;
    color: #1f2937;
    word-break: break-word;
  }

  a {
    color: #409eff;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.contact-icon {
  flex-shrink: 0;
}

/* Izoh */
.comment-card {
  margin-bottom: 18px;
}

.comment-text {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.75;
  color: #374151;
  white-space: pre-wrap;
  word-break: break-word;
}

.storage-warning {
  margin-bottom: 18px;
}

/* Fayllar */
.files-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

@media (max-width: 1100px) {
  .cards-grid {
    grid-template-columns: 1fr 1fr;
  }
  .files-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .detail-container {
    padding: 18px 12px;
  }
  .cards-grid {
    grid-template-columns: 1fr;
  }
  .detail-header {
    flex-direction: column;
  }
}
</style>
