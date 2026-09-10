<template>
  <div class="modern-settings" v-loading="loading">
    <!-- Top Header Banner in Climavent Primary Blue -->
    <div class="settings-header-banner">
      <div class="banner-content">
        <h1>{{ $t('shaxsiymalumotlar') }}</h1>
        <p>{{ $t('shaxsiymalumotlarSubtitle') }}</p>
      </div>
      <div class="banner-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
      </div>
    </div>

    <div class="settings-layout">
      <!-- Sidebar Navigation -->
      <aside class="settings-sidebar">
        <nav class="settings-nav">
          <button
            :class="['nav-item', { active: activeTab === 'profile' }]"
            @click="activeTab = 'profile'"
          >
            <el-icon class="nav-icon"><User /></el-icon>
            <span class="nav-label">{{ $t('shaxsiymalumotlar') }}</span>
            <div class="active-indicator" v-if="activeTab === 'profile'"></div>
          </button>

          <button
            :class="['nav-item', { active: activeTab === 'security' }]"
            @click="activeTab = 'security'"
          >
            <el-icon class="nav-icon"><Lock /></el-icon>
            <span class="nav-label">{{ $t('security') }}</span>
            <div class="active-indicator" v-if="activeTab === 'security'"></div>
          </button>

          <button
            :class="['nav-item', { active: activeTab === 'preferences' }]"
            @click="activeTab = 'preferences'"
          >
            <el-icon class="nav-icon"><Setting /></el-icon>
            <span class="nav-label">{{ $t('languageSettings') }}</span>
            <div class="active-indicator" v-if="activeTab === 'preferences'"></div>
          </button>
        </nav>

        <div class="sidebar-footer">
          <el-popconfirm
            :title="$t('logoutConfirmTitle')"
            width="280"
            :confirm-button-text="$t('yeah')"
            :cancel-button-text="$t('no')"
            @confirm="logout"
          >
            <template #reference>
              <button class="logout-btn">
                <el-icon><SwitchButton /></el-icon>
                <span>{{ $t('logout') }}</span>
              </button>
            </template>
          </el-popconfirm>
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="settings-content">
        <transition name="fade-slide" mode="out-in">
          <!-- Profile Tab -->
          <div v-if="activeTab === 'profile'" key="profile" class="tab-pane">
            <!-- Avatar Section -->
            <div class="section-card avatar-section">
              <div class="avatar-wrapper">
                <img
                  v-if="usersStore?.currentUser?.profile_image == 'profile.jpg'"
                  src="/user.png"
                  alt="Avatar"
                />
                <img v-else :src="usersStore?.currentUser?.profile_image" alt="Avatar" />
                <el-upload
                  class="avatar-uploader-btn"
                  :action="cloudinaryUrl"
                  :data="uploadData"
                  :show-file-list="false"
                  :on-success="handleAvatarSuccess"
                  :before-upload="beforeAvatarUpload"
                  :on-error="handleAvatarError"
                  v-loading="avatarUploading"
                >
                  <button class="edit-avatar-btn" title="Rasm yuklash">
                    <el-icon><Edit /></el-icon>
                  </button>
                </el-upload>
              </div>

              <div class="avatar-texts">
                <h3>{{ usersStore?.currentUser?.firstname }} {{ usersStore?.currentUser?.lastname }}</h3>
                <p>{{ usersStore?.currentUser?.email || $t('profileimageInfo') }}</p>
                <div class="avatar-actions">
                  <el-upload
                    :action="cloudinaryUrl"
                    :data="uploadData"
                    :show-file-list="false"
                    :on-success="handleAvatarSuccess"
                    :before-upload="beforeAvatarUpload"
                    :on-error="handleAvatarError"
                    v-loading="avatarUploading"
                  >
                    <el-button type="primary" :icon="Upload" round>{{ $t('uploadAvatar') }}</el-button>
                  </el-upload>
                </div>
              </div>
            </div>

            <!-- Personal Info Section -->
            <div class="section-card info-section" v-loading="updateShaxsiyLoading">
              <div class="card-header">
                <div>
                  <h3 class="card-title">{{ $t('shaxsiymalumotlar') }}</h3>
                  <p class="card-subtitle">{{ $t('shaxsiymalumotlarSubtitle') }}</p>
                </div>
                <el-button type="primary" plain round @click="changeUserMainInfoDialog = true" :icon="Edit">
                  {{ $t('edit') }}
                </el-button>
              </div>

              <div class="info-grid">
                <div class="info-group">
                  <label>{{ $t('ism') }}</label>
                  <div class="info-val">{{ usersStore?.currentUser?.firstname || '-' }}</div>
                </div>
                <div class="info-group">
                  <label>{{ $t('familiya') }}</label>
                  <div class="info-val">{{ usersStore?.currentUser?.lastname || '-' }}</div>
                </div>
                <div class="info-group">
                  <label>{{ $t('telefonRaqam') }}</label>
                  <div class="info-val">{{ formatPhoneNumber(usersStore?.currentUser?.phone_number) || '-' }}</div>
                </div>
                <div class="info-group">
                  <label>{{ $t('email') }}</label>
                  <div class="info-val">{{ usersStore?.currentUser?.email || '-' }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Security Tab -->
          <div v-else-if="activeTab === 'security'" key="security" class="tab-pane">
            <div class="section-card">
              <div class="card-header">
                <div>
                  <h3 class="card-title">{{ $t('security') }}</h3>
                  <p class="card-subtitle">Akkaunt xavfsizligi va maxfiy so'z boshqaruvi</p>
                </div>
              </div>

              <div class="security-list">
                <div class="security-item" v-loading="updateUsernameLoading">
                  <div class="sec-info">
                    <div class="sec-icon"><el-icon><User /></el-icon></div>
                    <div>
                      <h4>{{ $t('username') }}</h4>
                      <p>{{ usersStore?.currentUser?.username }}</p>
                    </div>
                  </div>
                </div>

                <div class="security-item" v-loading="updatePasswordLoading">
                  <div class="sec-info">
                    <div class="sec-icon"><el-icon><Lock /></el-icon></div>
                    <div>
                      <h4>Maxfiy so'z</h4>
                      <p class="password-dots">••••••••••••</p>
                    </div>
                  </div>
                  <el-button type="primary" plain round @click="changePasswordDialog = true" :icon="Edit">
                    {{ $t('edit') }}
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <!-- Preferences Tab -->
          <div v-else-if="activeTab === 'preferences'" key="preferences" class="tab-pane">
            <div class="section-card">
              <div class="card-header">
                <div>
                  <h3 class="card-title">{{ $t('languageSettings') }}</h3>
                  <p class="card-subtitle">Tizim uchun o'zingizga qulay tilni tanlang</p>
                </div>
              </div>

              <div class="preference-item" v-loading="languageLoading">
                <div class="pref-info">
                  <h4>{{ $t('currentLanguage') }}</h4>
                  <p>{{ getCurrentLanguageLabel }}</p>
                </div>
                <el-select
                  v-model="selectedLanguage"
                  :placeholder="$t('selectLanguage')"
                  @change="handleLanguageChange"
                  class="modern-select"
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
        </transition>
      </main>
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
import { Edit, User, Lock, SwitchButton, Upload, Setting } from '@element-plus/icons-vue'
import PersonalInfoEditDialog from './PersonalInfoEditDialog.vue'
import UsernameEditDialog from './UsernameEditDialog.vue'
import PasswordEditDialog from './PasswordEditDialog.vue'
import { ElNotification, ElMessage } from 'element-plus'
import type { UploadProps } from 'element-plus'
import { onMounted, ref, computed } from 'vue'
import { getCookie } from '@/utils/cookies'
import { useUsersStore } from '@/stores/user'
import i18n from '@/i18n'

const activeTab = ref('profile')

const changePasswordDialog = ref(false)
const changeUsernameDialog = ref(false)
const changeUserMainInfoDialog = ref(false)
const usersStore = useUsersStore()
const updateShaxsiyLoading = ref(false)
const updateUsernameLoading = ref(false)
const updatePasswordLoading = ref(false)
const loading = ref(false)
const imageUrl = ref('')
const avatarUploading = ref(false)
const languageLoading = ref(false)

// Write the language to the cookie
function setCookieLanguage(value: string, days = 365) {
  const date = new Date()
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
  const expires = 'expires=' + date.toUTCString()
  document.cookie = 'lang=' + encodeURIComponent(value) + ';' + expires + ';path=/'
}

// Language settings
const selectedLanguage = ref(getCookie('lang', 'uz'))
const languages = [
  { value: 'uz', label: "O'zbekcha", flag: '🇺🇿' },
  { value: 'ru', label: 'Русский', flag: '🇷🇺' },
]

const getCurrentLanguageLabel = computed(() => {
  const lang = languages.find((l) => l.value === selectedLanguage.value)
  return lang ? `${lang.flag} ${lang.label}` : ''
})

const handleLanguageChange = (value: string) => {
  languageLoading.value = true
  setCookieLanguage(value)
  i18n.global.locale = value
  ElNotification({
    title: value === 'uz' ? "Til o'zgartirildi!" : 'Язык изменен!',
    message: value === 'uz' ? "O'zbekcha tilga o'tish amalga oshirildi" : 'Русский язык установлен',
    type: 'success',
    duration: 2000,
  })
  languageLoading.value = false
}

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
  imageUrl.value = uploadedImageUrl

  await usersStore.updateUser(localStorage.getItem('userid'), payload)
  ElMessage.success('Rasm muvaffaqiyatli yuklandi! (Bu oyna yangilanadi...)')
  setTimeout(() => location.reload(), 3000)
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

const formatPhoneNumber = (oldnumber: string) => {
  if (!oldnumber || oldnumber.length < 12) return oldnumber
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
  await usersStore.updateUser(userId, formData)
  ElNotification({
    title: "Ma'lumotingiz muvaffaqiyatli yangilandi!",
    message: 'Bu oyna yangilanadi!!!',
    type: 'success',
  })
  changeUserMainInfoDialog.value = false
  setTimeout(() => location.reload(), 3000)
}

const handleSaveUsername = async (formData: any) => {
  updateUsernameLoading.value = true
  const userId = localStorage.getItem('userid')
  await usersStore.updateUser(userId, formData)
  ElNotification({
    title: "Ma'lumotingiz muvaffaqiyatli yangilandi!",
    message: 'Bu oyna yangilanadi!!!',
    type: 'success',
  })
  changeUserMainInfoDialog.value = false
  setTimeout(() => location.reload(), 3000)
}

const handleSavePassword = async (formData: { password: string }) => {
  updatePasswordLoading.value = true
  const userId = localStorage.getItem('userid')
  await usersStore.updateUserPassword(userId, formData)
  ElNotification({
    title: "Ma'lumotingiz muvaffaqiyatli yangilandi!",
    message: 'Bu oyna yangilanadi!!!',
    type: 'success',
  })
  changePasswordDialog.value = false
  updatePasswordLoading.value = false
  setTimeout(() => location.reload(), 3000)
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
.modern-settings {
  font-family: 'Montserrat', sans-serif;
  background-color: #f6f8fb;
  min-height: 100vh;
  padding: 28px 36px;
  color: #1e293b;
  box-sizing: border-box;
}

/* ─── Header Banner (Climavent Signature Blue Gradient) ─── */
.settings-header-banner {
  background: linear-gradient(135deg, #409eff 0%, #3a8ee6 50%, #5dade2 100%);
  border-radius: 20px;
  padding: 36px 44px;
  margin-bottom: 28px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 12px 28px -6px rgba(64, 158, 255, 0.35);
}

.banner-shapes .shape {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.banner-shapes .shape-1 {
  top: -60%;
  right: -10%;
  width: 380px;
  height: 380px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 70%);
}

.banner-shapes .shape-2 {
  bottom: -40%;
  left: 25%;
  width: 260px;
  height: 260px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 70%);
}

.banner-content {
  position: relative;
  z-index: 2;
}

.banner-content h1 {
  font-size: 30px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #ffffff;
  letter-spacing: -0.3px;
}

.banner-content p {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  font-weight: 500;
}

/* ─── Layout ─── */
.settings-layout {
  display: flex;
  gap: 32px;
  max-width: 1240px;
  margin: 0 auto;
}

/* ─── Sidebar ─── */
.settings-sidebar {
  width: 270px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-nav {
  background: #ffffff;
  border-radius: 18px;
  padding: 14px;
  box-shadow: 0 2px 14px rgba(17, 24, 39, 0.04);
  border: 1px solid #eef0f4;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 18px;
  border: none;
  background: transparent;
  width: 100%;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  transition: all 0.25s ease;
  position: relative;
  text-align: left;
  font-family: 'Montserrat', sans-serif;
}

.nav-item:hover {
  background: #f0f7ff;
  color: #409eff;
}

.nav-item.active {
  background: #ecf5ff;
  color: #409eff;
}

.nav-icon {
  font-size: 19px;
  transition: color 0.25s ease;
}

.nav-item.active .nav-icon {
  color: #409eff;
}

.active-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 20px;
  width: 4px;
  background: #409eff;
  border-radius: 0 4px 4px 0;
}

.sidebar-footer {
  margin-top: auto;
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 14px;
  border-radius: 14px;
  border: 1px solid #fee2e2;
  background: #fff5f5;
  color: #ef4444;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.25s ease;
  font-family: 'Montserrat', sans-serif;
}

.logout-btn:hover {
  background: #fee2e2;
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.15);
}

/* ─── Content Area ─── */
.settings-content {
  flex-grow: 1;
  min-width: 0;
}

.tab-pane {
  display: flex;
  flex-direction: column;
  gap: 22px;
  animation: fadeIn 0.35s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 2px 14px rgba(17, 24, 39, 0.04);
  border: 1px solid #eef0f4;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease;
}

.section-card:hover {
  box-shadow: 0 10px 28px rgba(64, 158, 255, 0.08);
  border-color: #d9ecff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 18px;
  border-bottom: 1px solid #f1f5f9;
}

.card-title {
  font-size: 19px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 5px 0;
}

.card-subtitle {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

/* ─── Avatar Section ─── */
.avatar-section {
  display: flex;
  align-items: center;
  gap: 28px;
}

.avatar-wrapper {
  position: relative;
  width: 110px;
  height: 110px;
  flex-shrink: 0;
}

.avatar-wrapper img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #ffffff;
  box-shadow: 0 8px 24px rgba(64, 158, 255, 0.2);
}

.avatar-uploader-btn {
  position: absolute;
  bottom: 0;
  right: 0;
}

.edit-avatar-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #409eff;
  color: #ffffff;
  border: 3px solid #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
  transition: all 0.2s ease;
}

.edit-avatar-btn:hover {
  transform: scale(1.1);
  background: #337ecc;
}

.avatar-texts h3 {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 6px 0;
  color: #1e293b;
}

.avatar-texts p {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 16px 0;
}

.avatar-actions {
  display: flex;
  gap: 12px;
}

/* ─── Info Grid ─── */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.info-group {
  background: #f8fafc;
  padding: 16px 20px;
  border-radius: 14px;
  border: 1px solid #eef0f4;
  transition: all 0.2s ease;
}

.info-group:hover {
  background: #f0f7ff;
  border-color: #d9ecff;
}

.info-group label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-val {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

/* ─── Security Section ─── */
.security-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.security-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 22px;
  border-radius: 16px;
  border: 1px solid #eef0f4;
  background: #ffffff;
  transition: all 0.25s ease;
}

.security-item:hover {
  border-color: #d9ecff;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.08);
  background: #fcfeff;
}

.sec-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sec-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #ecf5ff;
  color: #409eff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.sec-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.sec-info p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.sec-info p.password-dots {
  font-family: monospace;
  font-size: 18px;
  letter-spacing: 2px;
}

/* ─── Preferences Section ─── */
.preference-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 22px 24px;
  background: #f8fafc;
  border-radius: 16px;
  border: 1px solid #eef0f4;
  transition: all 0.2s ease;
}

.preference-item:hover {
  background: #f0f7ff;
  border-color: #d9ecff;
}

.pref-info h4 {
  margin: 0 0 6px 0;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.pref-info p {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}

.modern-select {
  width: 210px;
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

/* ─── Transitions ─── */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ─── Responsive ─── */
@media (max-width: 1024px) {
  .settings-layout {
    flex-direction: column;
  }
  .settings-sidebar {
    width: 100%;
    flex-direction: column;
  }
  .settings-nav {
    flex-direction: row;
    overflow-x: auto;
    padding: 10px;
  }
  .nav-item {
    width: auto;
    white-space: nowrap;
    padding: 11px 18px;
  }
  .active-indicator {
    left: 50%;
    top: auto;
    bottom: 0;
    width: 24px;
    height: 3px;
    transform: translateX(-50%);
    border-radius: 3px 3px 0 0;
  }
}

@media (max-width: 768px) {
  .modern-settings {
    padding: 18px 14px;
  }
  .settings-header-banner {
    padding: 26px 20px;
    border-radius: 16px;
  }
  .banner-content h1 {
    font-size: 24px;
  }
  .banner-content p {
    font-size: 13px;
  }
  .info-grid {
    grid-template-columns: 1fr;
  }
  .avatar-section {
    flex-direction: column;
    text-align: center;
  }
  .avatar-actions {
    justify-content: center;
  }
  .security-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }
  .security-item .el-button {
    width: 100%;
  }
  .preference-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }
  .modern-select {
    width: 100%;
  }
}
</style>

<style>
.avatar-uploader-btn .el-upload {
  border: none !important;
  background: transparent !important;
}
</style>
