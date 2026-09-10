<template>
  <div class="settings-page" v-loading="loading">
    <!-- Top Header Banner (Climavent Signature Blue Gradient) -->
    <div class="settings-banner">
      <div class="banner-content">
        <h1>{{ $t('shaxsiymalumotlar') }}</h1>
        <p>{{ $t('shaxsiymalumotlarSubtitle') }}</p>
      </div>
      <div class="banner-decorations">
        <div class="glow-circle circle-1"></div>
        <div class="glow-circle circle-2"></div>
      </div>
    </div>

    <!-- Main Settings Grid -->
    <div class="settings-grid">
      <!-- 1. Avatar Card -->
      <div class="settings-card avatar-card">
        <div class="card-body avatar-body">
          <div class="avatar-wrapper">
            <el-upload
              class="avatar-uploader"
              :action="cloudinaryUrl"
              :data="uploadData"
              :show-file-list="false"
              :on-success="handleAvatarSuccess"
              :before-upload="beforeAvatarUpload"
              :on-error="handleAvatarError"
            >
              <div class="avatar-image-container" :class="{ uploading: avatarUploading }">
                <img
                  v-if="usersStore?.currentUser?.profile_image == 'profile.jpg'"
                  src="/user.png"
                  alt="Avatar"
                />
                <img v-else :src="usersStore?.currentUser?.profile_image" alt="Avatar" />
                <div class="avatar-overlay">
                  <el-icon><Camera /></el-icon>
                  <span>{{ $t('uploadAvatar') }}</span>
                </div>
              </div>
            </el-upload>
          </div>

          <div class="avatar-meta">
            <h3>{{ usersStore?.currentUser?.firstname }} {{ usersStore?.currentUser?.lastname }}</h3>
            <p class="avatar-hint">{{ $t('profileimageInfo') }}</p>

            <el-upload
              class="avatar-button-uploader"
              :action="cloudinaryUrl"
              :data="uploadData"
              :show-file-list="false"
              :on-success="handleAvatarSuccess"
              :before-upload="beforeAvatarUpload"
              :on-error="handleAvatarError"
            >
              <el-button type="primary" :icon="Upload" :loading="avatarUploading" round>
                {{ $t('uploadAvatar') }}
              </el-button>
            </el-upload>
          </div>
        </div>
      </div>

      <!-- 2. Personal Information Card -->
      <div class="settings-card info-card" v-loading="updateShaxsiyLoading">
        <div class="card-header">
          <div class="card-title-group">
            <div class="card-icon-badge">
              <el-icon><User /></el-icon>
            </div>
            <div>
              <h3>{{ $t('shaxsiymalumotlar') }}</h3>
              <p>{{ $t('shaxsiymalumotlarSubtitle') }}</p>
            </div>
          </div>
          <el-button
            type="primary"
            plain
            round
            :icon="Edit"
            @click="changeUserMainInfoDialog = true"
          >
            {{ $t('edit') }}
          </el-button>
        </div>

        <div class="card-body">
          <div class="info-grid">
            <div class="info-cell">
              <span class="info-label">{{ $t('ism') }}</span>
              <span class="info-value">{{ usersStore?.currentUser?.firstname || '-' }}</span>
            </div>
            <div class="info-cell">
              <span class="info-label">{{ $t('familiya') }}</span>
              <span class="info-value">{{ usersStore?.currentUser?.lastname || '-' }}</span>
            </div>
            <div class="info-cell">
              <span class="info-label">{{ $t('telefonRaqam') }}</span>
              <span class="info-value">{{
                formatPhoneNumber(usersStore?.currentUser?.phone_number) || '-'
              }}</span>
            </div>
            <div class="info-cell">
              <span class="info-label">{{ $t('email') }}</span>
              <span class="info-value">{{ usersStore?.currentUser?.email || '-' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Security Card -->
      <div class="settings-card security-card">
        <div class="card-header">
          <div class="card-title-group">
            <div class="card-icon-badge">
              <el-icon><Lock /></el-icon>
            </div>
            <div>
              <h3>{{ $t('security') }}</h3>
              <p>Akkaunt ma'lumotlari va xavfsizlik sozlamalari</p>
            </div>
          </div>
        </div>

        <div class="card-body security-body">
          <!-- Username Row -->
          <div class="setting-row" v-loading="updateUsernameLoading">
            <div class="row-left">
              <div class="row-icon">
                <el-icon><User /></el-icon>
              </div>
              <div class="row-text">
                <span class="row-label">{{ $t('username') }}</span>
                <span class="row-value font-mono">{{ usersStore?.currentUser?.username || '-' }}</span>
              </div>
            </div>
            <el-button
              type="primary"
              plain
              round
              :icon="Edit"
              @click="changeUsernameDialog = true"
            >
              {{ $t('edit') }}
            </el-button>
          </div>

          <!-- Password Row -->
          <div class="setting-row" v-loading="updatePasswordLoading">
            <div class="row-left">
              <div class="row-icon">
                <el-icon><Key /></el-icon>
              </div>
              <div class="row-text">
                <span class="row-label">Maxfiy so'z</span>
                <span class="row-value password-dots">••••••••••••</span>
              </div>
            </div>
            <el-button
              type="primary"
              plain
              round
              :icon="Edit"
              @click="changePasswordDialog = true"
            >
              {{ $t('edit') }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- 4. Language Settings Card -->
      <div class="settings-card language-card">
        <div class="card-header">
          <div class="card-title-group">
            <div class="card-icon-badge">
              <el-icon><Setting /></el-icon>
            </div>
            <div>
              <h3>{{ $t('languageSettings') }}</h3>
              <p>Tizim interfeysi uchun qulay tilni tanlang</p>
            </div>
          </div>
        </div>

        <div class="card-body language-body">
          <div class="setting-row" v-loading="languageLoading">
            <div class="row-left">
              <div class="row-icon">
                <span class="language-flag-badge">{{ selectedLanguageFlag }}</span>
              </div>
              <div class="row-text">
                <span class="row-label">{{ $t('currentLanguage') }}</span>
                <span class="row-value">{{ getCurrentLanguageLabel }}</span>
              </div>
            </div>

            <el-select
              v-model="selectedLanguage"
              :placeholder="$t('selectLanguage')"
              @change="handleLanguageChange"
              class="language-selector"
            >
              <el-option
                v-for="lang in languages"
                :key="lang.value"
                :label="lang.label"
                :value="lang.value"
              >
                <div class="language-option">
                  <span class="language-flag">{{ lang.flag }}</span>
                  <span class="language-name">{{ lang.label }}</span>
                </div>
              </el-option>
            </el-select>
          </div>
        </div>
      </div>

      <!-- 5. Logout Card (Full Width at Bottom) -->
      <div class="settings-card logout-card">
        <div class="logout-content">
          <div class="logout-info">
            <div class="logout-icon-box">
              <el-icon><SwitchButton /></el-icon>
            </div>
            <div class="logout-text">
              <h4>{{ $t('logout') }}</h4>
              <p>{{ $t('logoutInfo') }}</p>
            </div>
          </div>

          <el-popconfirm
            :title="$t('logoutConfirmTitle')"
            width="280"
            :confirm-button-text="$t('yeah')"
            :cancel-button-text="$t('no')"
            @confirm="logout"
          >
            <template #reference>
              <el-button type="danger" size="large" :icon="SwitchButton">
                {{ $t('logout') }}
              </el-button>
            </template>
          </el-popconfirm>
        </div>
      </div>
    </div>

    <!-- Dialogs -->
    <PersonalInfoEditDialog
      v-model="changeUserMainInfoDialog"
      :user-info="usersStore?.currentUser"
      :loading="updateShaxsiyLoading"
      @save="handleSavePersonalInfo"
    />

    <UsernameEditDialog
      v-model="changeUsernameDialog"
      :user-info="usersStore?.currentUser"
      :loading="updateUsernameLoading"
      @save="handleSaveUsername"
    />

    <PasswordEditDialog
      v-model="changePasswordDialog"
      :loading="updatePasswordLoading"
      @save="handleSavePassword"
    />
  </div>
</template>

<script setup lang="ts">
import {
  Edit,
  User,
  Lock,
  SwitchButton,
  Upload,
  Setting,
  Camera,
  Key,
} from '@element-plus/icons-vue'
import PersonalInfoEditDialog from './PersonalInfoEditDialog.vue'
import UsernameEditDialog from './UsernameEditDialog.vue'
import PasswordEditDialog from './PasswordEditDialog.vue'
import { ElNotification, ElMessage } from 'element-plus'
import type { UploadProps } from 'element-plus'
import { onMounted, ref, computed } from 'vue'
import { getCookie } from '@/utils/cookies'
import { useUsersStore } from '@/stores/user'
import i18n from '@/i18n'

const changePasswordDialog = ref(false)
const changeUsernameDialog = ref(false)
const changeUserMainInfoDialog = ref(false)

const usersStore = useUsersStore()
const updateShaxsiyLoading = ref(false)
const updateUsernameLoading = ref(false)
const updatePasswordLoading = ref(false)
const loading = ref(false)
const avatarUploading = ref(false)
const languageLoading = ref(false)

// Tilni cookie ga yozish
function setCookieLanguage(value: string, days = 365) {
  const date = new Date()
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
  const expires = 'expires=' + date.toUTCString()
  document.cookie = 'lang=' + encodeURIComponent(value) + ';' + expires + ';path=/'
}

// Til sozlamalari
const selectedLanguage = ref(getCookie('lang', 'uz'))
const languages = [
  { value: 'uz', label: "O'zbekcha", flag: '🇺🇿' },
  { value: 'ru', label: 'Русский', flag: '🇷🇺' },
]

const selectedLanguageFlag = computed(() => {
  const lang = languages.find((l) => l.value === selectedLanguage.value)
  return lang ? lang.flag : '🌐'
})

const getCurrentLanguageLabel = computed(() => {
  const lang = languages.find((l) => l.value === selectedLanguage.value)
  return lang ? `${lang.flag} ${lang.label}` : ''
})

const handleLanguageChange = (value: string) => {
  languageLoading.value = true
  setCookieLanguage(value)

  if (typeof i18n.global.locale === 'object' && 'value' in i18n.global.locale) {
    i18n.global.locale.value = value
  } else {
    i18n.global.locale = value
  }

  ElNotification({
    title: value === 'uz' ? "Til o'zgartirildi!" : 'Язык изменен!',
    message: value === 'uz' ? "O'zbekcha tilga o'tish amalga oshirildi" : 'Русский язык установлен',
    type: 'success',
    duration: 2000,
  })
  languageLoading.value = false
}

// Cloudinary
const cloudName = 'dne7ddv2a'
const uploadPreset = 'erp_climavent_uploads'
const cloudinaryUrl = computed(() => `https://api.cloudinary.com/v1_1/${cloudName}/upload`)

const uploadData = ref({
  upload_preset: uploadPreset,
  folder: 'profile-avatars',
  tags: 'user-avatar,profile',
})

const handleAvatarSuccess: UploadProps['onSuccess'] = async (response) => {
  avatarUploading.value = false
  const uploadedImageUrl = response.secure_url
  const payload = { profile_image: uploadedImageUrl }

  const userId = localStorage.getItem('userid')
  if (userId) {
    await usersStore.updateUser(userId, payload)
    ElMessage.success('Rasm muvaffaqiyatli yuklandi!')
    setTimeout(() => location.reload(), 1500)
  }
}

const beforeAvatarUpload: UploadProps['beforeUpload'] = (rawFile) => {
  const isImage = rawFile.type.startsWith('image/')
  const isLt50M = rawFile.size / 1024 / 1024 < 50

  if (!isImage) {
    ElMessage.error('Faqat rasm fayllarini yuklash mumkin!')
    return false
  }
  if (!isLt50M) {
    ElMessage.error("Rasm hajmi 50MB dan kam bo'lishi kerak!")
    return false
  }
  avatarUploading.value = true
  return true
}

const handleAvatarError: UploadProps['onError'] = () => {
  avatarUploading.value = false
  ElMessage.error('Rasm yuklashda xatolik yuz berdi!')
}

const formatPhoneNumber = (oldnumber?: string | null) => {
  if (!oldnumber) return '-'
  if (oldnumber.length < 12) return oldnumber
  let newnumber = '+998 '
  newnumber += oldnumber.slice(4, 6) + ' '
  newnumber += oldnumber.slice(6, 9) + ' '
  newnumber += oldnumber.slice(9, 11) + ' '
  newnumber += oldnumber.slice(11)
  return newnumber
}

const handleSavePersonalInfo = async (formData: any) => {
  updateShaxsiyLoading.value = true
  const userId = localStorage.getItem('userid')
  if (userId) {
    await usersStore.updateUser(userId, formData)
    ElNotification({
      title: "Ma'lumotingiz muvaffaqiyatli yangilandi!",
      type: 'success',
    })
    changeUserMainInfoDialog.value = false
    setTimeout(() => location.reload(), 1500)
  }
}

const handleSaveUsername = async (formData: any) => {
  updateUsernameLoading.value = true
  const userId = localStorage.getItem('userid')
  if (userId) {
    await usersStore.updateUser(userId, formData)
    ElNotification({
      title: "Foydalanuvchi nomi muvaffaqiyatli yangilandi!",
      type: 'success',
    })
    changeUsernameDialog.value = false
    setTimeout(() => location.reload(), 1500)
  }
}

const handleSavePassword = async (formData: { password: string }) => {
  updatePasswordLoading.value = true
  const userId = localStorage.getItem('userid')
  if (userId) {
    await usersStore.updateUserPassword(userId, formData)
    ElNotification({
      title: "Maxfiy so'z muvaffaqiyatli yangilandi!",
      type: 'success',
    })
    changePasswordDialog.value = false
    updatePasswordLoading.value = false
    setTimeout(() => location.reload(), 1500)
  }
}

const logout = () => {
  localStorage.removeItem('userid')
  localStorage.removeItem('accesstoken')
  localStorage.removeItem('refreshtoken')
  location.reload()
}

onMounted(async () => {
  loading.value = true
  const userId = localStorage.getItem('userid')
  if (userId) {
    await usersStore.getUserInfo(Number(userId))
  }
  loading.value = false
})
</script>

<style scoped>
.settings-page {
  font-family: 'Montserrat', sans-serif;
  background-color: #f6f8fb;
  min-height: 100vh;
  padding: 28px 36px;
  color: #1e293b;
  box-sizing: border-box;
}

/* ─── Header Banner ─── */
.settings-banner {
  background: linear-gradient(135deg, #409eff 0%, #3a8ee6 50%, #5dade2 100%);
  border-radius: 20px;
  padding: 34px 44px;
  margin-bottom: 26px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 26px -6px rgba(64, 158, 255, 0.35);
}

.banner-decorations .glow-circle {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.banner-decorations .circle-1 {
  top: -50%;
  right: -10%;
  width: 380px;
  height: 380px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 70%);
}

.banner-decorations .circle-2 {
  bottom: -40%;
  left: 20%;
  width: 260px;
  height: 260px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 70%);
}

.banner-content {
  position: relative;
  z-index: 2;
}

.banner-content h1 {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 6px 0;
  color: #ffffff;
  letter-spacing: -0.3px;
}

.banner-content p {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  font-weight: 500;
}

/* ─── Grid Layout ─── */
.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  max-width: 1300px;
  margin: 0 auto;
}

/* ─── Cards Base ─── */
.settings-card {
  background: #ffffff;
  border-radius: 18px;
  border: 1px solid #eef0f4;
  box-shadow: 0 2px 14px rgba(17, 24, 39, 0.04);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.settings-card:hover {
  box-shadow: 0 8px 26px rgba(64, 158, 255, 0.08);
  border-color: #d9ecff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 22px 26px;
  border-bottom: 1px solid #f1f5f9;
}

.card-title-group {
  display: flex;
  align-items: center;
  gap: 14px;
}

.card-icon-badge {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #ecf5ff;
  color: #409eff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.card-title-group h3 {
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 3px 0;
}

.card-title-group p {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.card-body {
  padding: 24px 26px;
  flex: 1;
}

/* ─── Avatar Card ─── */
.avatar-body {
  display: flex;
  align-items: center;
  gap: 26px;
  padding: 30px 28px;
}

.avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.avatar-image-container {
  position: relative;
  width: 116px;
  height: 116px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  border: 4px solid #ffffff;
  box-shadow: 0 6px 20px rgba(64, 158, 255, 0.22);
  transition: transform 0.2s ease;
}

.avatar-image-container:hover {
  transform: scale(1.03);
}

.avatar-image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(17, 24, 39, 0.55);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #ffffff;
  opacity: 0;
  transition: opacity 0.25s ease;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  padding: 8px;
}

.avatar-image-container:hover .avatar-overlay {
  opacity: 1;
}

.avatar-overlay .el-icon {
  font-size: 22px;
}

.avatar-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.avatar-meta h3 {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.avatar-hint {
  font-size: 13px;
  color: #64748b;
  margin: 0 0 6px 0;
}

/* ─── Personal Info Card ─── */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-cell {
  background: #f8fafc;
  padding: 14px 18px;
  border-radius: 12px;
  border: 1px solid #eef0f4;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-cell:hover {
  background: #f0f7ff;
  border-color: #d9ecff;
}

.info-label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

/* ─── Security & Language Shared Rows ─── */
.security-body,
.language-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-radius: 14px;
  border: 1px solid #eef0f4;
  background: #ffffff;
  transition: all 0.2s ease;
}

.setting-row:hover {
  border-color: #d9ecff;
  box-shadow: 0 4px 14px rgba(64, 158, 255, 0.08);
  background: #fcfeff;
}

.row-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.row-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #ecf5ff;
  color: #409eff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.row-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.row-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.row-value {
  font-size: 14px;
  color: #1e293b;
  font-weight: 600;
}

.font-mono {
  font-family: monospace;
  font-size: 15px;
}

.password-dots {
  letter-spacing: 2px;
  font-size: 17px;
}

/* ─── Language Selector ─── */
.language-flag-badge {
  font-size: 20px;
}

.language-selector {
  width: 190px;
}

.language-option {
  display: flex;
  align-items: center;
  gap: 10px;
}

.language-flag {
  font-size: 18px;
}

.language-name {
  font-size: 14px;
  font-weight: 500;
}

/* ─── Logout Card (Full Width) ─── */
.logout-card {
  grid-column: 1 / -1;
  padding: 24px 28px;
  border-color: #fee2e2;
  background: #ffffff;
}

.logout-card:hover {
  border-color: #fca5a5;
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.08);
}

.logout-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logout-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logout-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: #fee2e2;
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.logout-text h4 {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 3px 0;
}

.logout-text p {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

/* ─── Responsive Design ─── */
@media (max-width: 1024px) {
  .settings-grid {
    grid-template-columns: 1fr;
    gap: 18px;
  }

  .logout-card {
    grid-column: 1;
  }
}

@media (max-width: 768px) {
  .settings-page {
    padding: 18px 14px;
  }

  .settings-banner {
    padding: 24px 20px;
    border-radius: 16px;
  }

  .banner-content h1 {
    font-size: 22px;
  }

  .banner-content p {
    font-size: 13px;
  }

  .avatar-body {
    flex-direction: column;
    text-align: center;
    align-items: center;
  }

  .avatar-meta {
    align-items: center;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .setting-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .setting-row .el-button,
  .language-selector {
    width: 100%;
  }

  .logout-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .logout-content .el-button {
    width: 100%;
  }
}
</style>

<style>
/* El-upload clean resets */
.avatar-uploader .el-upload,
.avatar-button-uploader .el-upload {
  border: none !important;
  background: transparent !important;
  display: block;
}
</style>
