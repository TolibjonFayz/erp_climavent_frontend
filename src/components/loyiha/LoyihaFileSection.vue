<template>
  <!-- Har bo'limda FAQAT BITTA fayl bo'ladi.
       Arxiv — yuklangach qulflanadi; ishchi fayl — almashtirilishi mumkin. -->
  <section class="file-section" :class="{ 'is-archive': archive, 'has-file': !!file }">
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
      <span v-if="file" class="section-status" :class="archive ? 'locked' : 'ready'">
        {{ archive ? $t('loyihaLocked') : $t('loyihaReplaceable') }}
      </span>
    </header>

    <!-- Yuklanayotgan fayl -->
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

    <!-- Yuklash joyi (ochilganda) -->
    <div v-else-if="slotOpen" class="upload-slot">
      <el-upload drag :show-file-list="false" :before-upload="startUpload" :disabled="!storageReady">
        <div class="slot-inner">
          <el-icon class="slot-icon"><UploadFilled /></el-icon>
          <span class="slot-text">{{ $t('loyihaUploadSlot') }}</span>
          <span class="slot-sub">
            {{ file ? $t('loyihaReplaceHint') : $t('loyihaUploadSlotHint') }}
          </span>
        </div>
      </el-upload>
      <el-button class="slot-cancel" text size="small" @click="slotOpen = false">
        {{ $t('cancel') }}
      </el-button>
    </div>

    <!-- Mavjud fayl -->
    <div v-else-if="file" class="file-card">
      <span class="file-icon">{{ fileIcon(file) }}</span>

      <div class="file-body">
        <template v-if="renaming">
          <el-input
            v-model="renameValue"
            size="small"
            class="rename-input"
            @keyup.enter="saveRename"
            @keyup.esc="renaming = false"
          />
        </template>
        <template v-else>
          <span class="file-name" :title="file.file_name">{{ file.file_name }}</span>
          <span class="file-meta">
            {{ formatDateTime(file.createdAt) }} · {{ formatSize(file.size_bytes) }}
            <template v-if="file.uploader"> · {{ fullName(file.uploader) }}</template>
          </span>
        </template>
      </div>

      <div class="file-actions">
        <template v-if="renaming">
          <el-button size="small" type="primary" @click="saveRename">{{ $t('save') }}</el-button>
          <el-button size="small" @click="renaming = false">{{ $t('cancel') }}</el-button>
        </template>
        <template v-else>
          <el-tooltip :content="$t('loyihaDownload')" placement="top">
            <el-button circle size="small" :icon="Download" @click="$emit('download', file)" />
          </el-tooltip>

          <template v-if="!archive">
            <el-tooltip :content="$t('loyihaRename')" placement="top">
              <el-button circle size="small" :icon="EditPen" @click="startRename" />
            </el-tooltip>
            <el-button size="small" :icon="RefreshRight" @click="slotOpen = true">
              {{ $t('loyihaReplace') }}
            </el-button>
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
        </template>
      </div>
    </div>

    <!-- Fayl yo'q: qo'shish tugmasi -->
    <el-button
      v-else
      class="add-file-btn"
      :icon="Plus"
      :disabled="!storageReady"
      @click="slotOpen = true"
    >
      {{ $t('loyihaAddFile') }}
    </el-button>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import {
  Download,
  EditPen,
  Delete,
  UploadFilled,
  Plus,
  RefreshRight,
} from '@element-plus/icons-vue'
import { formatDateTime, formatSize, fullName } from '@/utils/loyihaFormat'

const props = defineProps({
  // Bo'limdagi yagona fayl (yo'q bo'lsa null)
  file: { type: Object, default: null },
  archive: { type: Boolean, default: false },
  storageReady: { type: Boolean, default: true },
})

const emit = defineEmits(['upload', 'download', 'remove', 'rename'])

const slotOpen = ref(false)
// { name, percent } — bir vaqtda bitta fayl
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

const renaming = ref(false)
const renameValue = ref('')

const startRename = () => {
  renaming.value = true
  renameValue.value = props.file?.file_name || ''
}

const saveRename = () => {
  const name = renameValue.value.trim()
  if (!name || name === props.file.file_name) {
    renaming.value = false
    return
  }
  emit('rename', { file: props.file, name })
  renaming.value = false
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

.section-status {
  font-size: 11.5px;
  font-weight: 700;
  padding: 4px 11px;
  border-radius: 999px;
  flex-shrink: 0;
  white-space: nowrap;

  &.locked {
    background: #fef3c7;
    color: #b45309;
  }

  &.ready {
    background: #e0efff;
    color: #2563eb;
  }
}

/* ─── Fayl kartasi ──────────────────────────────── */
.file-card {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 14px 16px;
  border-radius: 14px;
  background: #f9fafb;
  border: 1px solid #eef0f4;
  flex-wrap: wrap;
}

.file-icon {
  font-size: 26px;
  flex-shrink: 0;
}

.file-body {
  flex: 1;
  min-width: 160px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.file-name {
  font-size: 14.5px;
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
  flex-wrap: wrap;
}

/* ─── Yuklash ───────────────────────────────────── */
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
    transition: background 0.2s ease;

    &:hover {
      background: #eaf3ff;
    }
  }
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

.slot-cancel {
  display: block;
  margin: 6px auto 0;
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
