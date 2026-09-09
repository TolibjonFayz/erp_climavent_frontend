<template>
  <section class="file-section" :class="{ 'is-archive': archive }">
    <header class="section-head">
      <div class="section-title">
        <span class="section-icon">{{ archive ? '🔒' : '📁' }}</span>
        <div>
          <h3>{{ archive ? $t('loyihaArchiveSection') : $t('loyihaWorkingSection') }}</h3>
          <p class="section-hint">
            {{ archive ? $t('loyihaArchiveHint') : $t('loyihaWorkingHint') }}
          </p>
        </div>
      </div>
      <span class="section-count">{{ files.length }}</span>
    </header>

    <ul class="file-list">
      <li v-for="file in sortedFiles" :key="file.id" class="file-row">
        <span class="file-icon">{{ fileIcon(file) }}</span>

        <div class="file-body">
          <template v-if="renamingId === file.id">
            <el-input
              v-model="renameValue"
              size="small"
              class="rename-input"
              @keyup.enter="saveRename(file)"
              @keyup.esc="renamingId = null"
            />
          </template>
          <template v-else>
            <span class="file-name" :title="file.file_name">{{ file.file_name }}</span>
            <span class="file-meta">
              {{ formatDateTime(file.createdAt) }} · {{ formatSize(file.size_bytes) }}
              <template v-if="file.uploader"> · {{ fullName(file.uploader) }}</template>
              <template v-if="file.title"> · {{ file.title }}</template>
            </span>
          </template>
        </div>

        <div class="file-actions">
          <template v-if="renamingId === file.id">
            <el-button size="small" type="primary" @click="saveRename(file)">
              {{ $t('save') }}
            </el-button>
            <el-button size="small" @click="renamingId = null">{{ $t('cancel') }}</el-button>
          </template>
          <template v-else>
            <el-tooltip :content="$t('loyihaDownload')" placement="top">
              <el-button circle size="small" :icon="Download" @click="$emit('download', file)" />
            </el-tooltip>
            <template v-if="!archive">
              <el-tooltip :content="$t('edit')" placement="top">
                <el-button circle size="small" :icon="EditPen" @click="startRename(file)" />
              </el-tooltip>
              <el-popconfirm
                :title="$t('loyihaFileDeleteConfirm')"
                width="240"
                :confirm-button-text="$t('deleteConfirm')"
                :cancel-button-text="$t('cancel')"
                @confirm="$emit('remove', file)"
              >
                <template #reference>
                  <el-button circle size="small" type="danger" plain :icon="Delete" />
                </template>
              </el-popconfirm>
            </template>
            <el-tooltip v-else :content="$t('loyihaArchiveLocked')" placement="top">
              <span class="locked-badge">🔒</span>
            </el-tooltip>
          </template>
        </div>
      </li>

      <li v-if="!files.length" class="file-empty">{{ $t('loyihaNoFiles') }}</li>
    </ul>

    <!-- Yuklash joyi avvaldan ko'rinmaydi: "Fayl qo'shish" bosilganda bitta joy
         ochiladi, fayl yuklangach yana yopiladi — keyingisi uchun qaytadan bosiladi. -->
    <div class="upload-area" :class="{ 'is-disabled': !storageReady }">
      <div v-if="uploading" class="upload-progress">
        <div class="upload-file-line">
          <span class="upload-file-name">{{ uploading.name }}</span>
          <span class="upload-percent">{{ uploading.percent }}%</span>
        </div>
        <el-progress
          :percentage="uploading.percent"
          :stroke-width="10"
          :status="uploading.percent === 100 ? 'success' : undefined"
          :show-text="false"
        />
      </div>

      <div v-else-if="slotOpen" class="upload-slot">
        <el-upload
          drag
          :show-file-list="false"
          :before-upload="startUpload"
          :disabled="!storageReady"
        >
          <div class="slot-inner">
            <el-icon class="slot-icon"><UploadFilled /></el-icon>
            <span class="slot-text">{{ $t('loyihaUploadSlot') }}</span>
            <span class="slot-sub">{{ $t('loyihaUploadSlotHint') }}</span>
          </div>
        </el-upload>
        <el-button class="slot-cancel" text size="small" @click="slotOpen = false">
          {{ $t('cancel') }}
        </el-button>
      </div>

      <el-button
        v-else
        class="add-file-btn"
        :icon="Plus"
        :disabled="!storageReady"
        @click="slotOpen = true"
      >
        {{ $t('loyihaAddFile') }}
      </el-button>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Download, EditPen, Delete, UploadFilled, Plus } from '@element-plus/icons-vue'
import { formatDateTime, formatSize, fullName } from '@/utils/loyihaFormat'

const props = defineProps({
  files: { type: Array, default: () => [] },
  archive: { type: Boolean, default: false },
  storageReady: { type: Boolean, default: true },
})

const emit = defineEmits(['upload', 'download', 'remove', 'rename'])

// Yangi fayllar tepada
const sortedFiles = computed(() =>
  [...props.files].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
)

// Yuklash joyi ochiqmi — "Fayl qo'shish" bosilganda ochiladi
const slotOpen = ref(false)

// { name, percent } — faqat bitta fayl bir vaqtda yuklanadi
const uploading = ref(null)

const startUpload = (file) => {
  uploading.value = { name: file.name, percent: 0 }
  slotOpen.value = false
  emit('upload', {
    file,
    onProgress: (percent) => {
      if (uploading.value) uploading.value.percent = percent
    },
    onDone: () => {
      // 100% ni ko'rsatib, keyin joyni yopamiz — keyingi fayl uchun
      // foydalanuvchi "Fayl qo'shish" ni qaytadan bosadi
      if (uploading.value) uploading.value.percent = 100
      setTimeout(() => {
        uploading.value = null
      }, 400)
    },
    onError: () => {
      uploading.value = null
    },
  })
  return false // Element Plus o'zi yubormasin — biz o'zimiz yuboramiz
}

const renamingId = ref(null)
const renameValue = ref('')

const startRename = (file) => {
  renamingId.value = file.id
  renameValue.value = file.file_name
}

const saveRename = (file) => {
  const name = renameValue.value.trim()
  if (!name || name === file.file_name) {
    renamingId.value = null
    return
  }
  emit('rename', { file, name })
  renamingId.value = null
}

const fileIcon = (file) => {
  const ext = (file.file_name || '').split('.').pop().toLowerCase()
  if (['pdf'].includes(ext)) return '📕'
  if (['doc', 'docx'].includes(ext)) return '📘'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return '📗'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return '🖼️'
  if (['dwg', 'dxf'].includes(ext)) return '📐'
  if (['zip', 'rar', '7z'].includes(ext)) return '🗜️'
  return '📄'
}
</script>

<style lang="scss" scoped>
.file-section {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: 20px 22px;

  &.is-archive {
    background: #fffdf6;
    border-color: #f3dfb5;
  }
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.section-title {
  display: flex;
  gap: 10px;

  h3 {
    margin: 0 0 3px;
    font-size: 16px;
    font-weight: 700;
    color: #1f2937;
  }
}

.section-icon {
  font-size: 20px;
  line-height: 1.2;
}

.section-hint {
  margin: 0;
  font-size: 12.5px;
  color: #6b7280;
  line-height: 1.5;
  max-width: 340px;
}

.section-count {
  background: #f3f4f6;
  color: #4b5563;
  font-size: 13px;
  font-weight: 700;
  padding: 3px 12px;
  border-radius: 999px;
  flex-shrink: 0;
}

.file-list {
  list-style: none;
  margin: 0 0 14px;
  padding: 0;
}

.file-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  border-radius: 12px;
  transition: background 0.15s ease;

  &:hover {
    background: #f9fafb;
  }

  & + .file-row {
    border-top: 1px solid #f3f4f6;
  }
}

.file-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.file-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.file-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  font-size: 12px;
  color: #9ca3af;
}

.rename-input {
  max-width: 320px;
}

.file-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.locked-badge {
  font-size: 14px;
  color: #b45309;
  cursor: default;
  padding: 0 6px;
}

.file-empty {
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
  padding: 22px 0;
}

/* ─── Yuklash joyi ──────────────────────────────── */
.upload-area {
  &.is-disabled {
    opacity: 0.55;
  }
}

.add-file-btn {
  width: 100%;
  border-style: dashed;
  color: #4b5563;

  &:hover:not(.is-disabled) {
    color: #409eff;
    border-color: #409eff;
  }
}

.upload-slot {
  :deep(.el-upload) {
    width: 100%;
  }

  :deep(.el-upload-dragger) {
    width: 100%;
    padding: 18px 12px;
    border-radius: 14px;
    border: 1.5px dashed #409eff;
    background: #f4f9ff;
    transition:
      border-color 0.2s ease,
      background 0.2s ease;

    &:hover {
      background: #eaf3ff;
    }
  }
}

.slot-cancel {
  display: block;
  margin: 6px auto 0;
  color: #9ca3af;
}

.slot-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.slot-icon {
  font-size: 26px;
  color: #9aa5b1;
}

.slot-text {
  font-size: 14px;
  font-weight: 600;
  color: #4b5563;
}

.slot-sub {
  font-size: 12px;
  color: #9ca3af;
}

.upload-progress {
  border: 1.5px solid #cfe4ff;
  background: #f4f9ff;
  border-radius: 14px;
  padding: 14px 16px;
}

.upload-file-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.upload-file-name {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.upload-percent {
  font-size: 14px;
  font-weight: 700;
  color: #409eff;
  flex-shrink: 0;
}
</style>
