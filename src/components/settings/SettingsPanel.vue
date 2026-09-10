<template>
  <div class="modern-settings" v-loading="loading">
    <div class="settings-header-banner">
      <div class="banner-content">
        <h1>{{ $t('shaxsiymalumotlar') }}</h1>
        <p>{{ $t('shaxsiymalumotlarSubtitle') }}</p>
      </div>
    </div>

    <div class="settings-layout">
      <!-- Sidebar -->
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
                  <button class="edit-avatar-btn">
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
                  <p class="card-subtitle">Yangi parol o'rnatish yoki akkauntni himoyalash</p>
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
                      <h4>{{ $t('password') }}</h4>
                      <p>••••••••••••</p>
                    </div>
                  </div>
                  <el-button type="primary" plain round @click="changePasswordDialog = true">
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
import { Plus, Edit, User, Lock, SwitchButton, Upload, Setting } from '@element-plus/icons-vue'
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

const handleAvatarError: UploadProps['onError'] = (error) => {
  avatarUploading.value = false
  ElMessage.error('Rasm yuklashda xatolik yuz berdi!')
}

const formatPhoneNumber = (oldnumber: string) => {
  if (!oldnumber || oldnumber.length < 12) return oldnumber;
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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.modern-settings {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background-color: #f8fafc;
  min-height: 100vh;
  padding: 30px 40px;
  color: #0f172a;
}

.settings-header-banner {
  background: linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%);
  border-radius: 24px;
  padding: 40px 50px;
  margin-bottom: 30px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
}

.settings-header-banner::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
  border-radius: 50%;
  pointer-events: none;
}

.banner-content {
  position: relative;
  z-index: 1;
}

.banner-content h1 {
  font-size: 36px;
  font-weight: 800;
  margin: 0 0 10px 0;
  color: #1e1b4b;
  letter-spacing: -0.5px;
}

.banner-content p {
  font-size: 16px;
  color: #4338ca;
  margin: 0;
  opacity: 0.8;
  font-weight: 500;
}

.settings-layout {
  display: flex;
  gap: 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.settings-sidebar {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-nav {
  background: white;
  border-radius: 24px;
  padding: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  border: none;
  background: transparent;
  width: 100%;
  border-radius: 14px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  color: #64748b;
  transition: all 0.3s ease;
  position: relative;
  text-align: left;
}

.nav-item:hover {
  background: #f8fafc;
  color: #334155;
}

.nav-item.active {
  background: #eef2ff;
  color: #4f46e5;
}

.nav-icon {
  font-size: 20px;
}

.active-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 20px;
  width: 4px;
  background: #4f46e5;
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
  padding: 16px;
  border-radius: 16px;
  border: 1px solid #fee2e2;
  background: #fef2f2;
  color: #ef4444;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background: #fee2e2;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
}

.settings-content {
  flex-grow: 1;
  min-width: 0;
}

.tab-pane {
  display: flex;
  flex-direction: column;
  gap: 24px;
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.section-card {
  background: white;
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(226, 232, 240, 0.5);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.section-card:hover {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f1f5f9;
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 6px 0;
}

.card-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

/* Avatar Section Styles */
.avatar-section {
  display: flex;
  align-items: center;
  gap: 30px;
}

.avatar-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
  flex-shrink: 0;
}

.avatar-wrapper img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid white;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.avatar-uploader-btn {
  position: absolute;
  bottom: 0;
  right: 0;
}

.edit-avatar-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #4f46e5;
  color: white;
  border: 3px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
  transition: all 0.2s ease;
}

.edit-avatar-btn:hover {
  transform: scale(1.1);
  background: #4338ca;
}

.avatar-texts h3 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #0f172a;
}

.avatar-texts p {
  font-size: 15px;
  color: #64748b;
  margin: 0 0 16px 0;
}

.avatar-actions {
  display: flex;
  gap: 12px;
}

/* Info Grid Styles */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.info-group {
  background: #f8fafc;
  padding: 16px 20px;
  border-radius: 16px;
  border: 1px solid #f1f5f9;
}

.info-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-val {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
}

/* Security List Styles */
.security-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.security-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-radius: 16px;
  border: 1px solid #f1f5f9;
  background: white;
  transition: all 0.3s ease;
}

.security-item:hover {
  border-color: #e2e8f0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
}

.sec-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sec-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: #eef2ff;
  color: #4f46e5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.sec-info h4 {
  margin: 0 0 4px 0;
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}

.sec-info p {
  margin: 0;
  color: #64748b;
  font-family: monospace;
  font-size: 16px;
}

/* Preference Item Styles */
.preference-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  background: #f8fafc;
  border-radius: 16px;
  border: 1px solid #f1f5f9;
}

.pref-info h4 {
  margin: 0 0 6px 0;
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
}

.pref-info p {
  margin: 0;
  font-size: 14px;
  color: #64748b;
}

.modern-select {
  width: 200px;
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

/* Responsive Design */
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
    padding: 12px;
  }
  .nav-item {
    width: auto;
    white-space: nowrap;
    padding: 12px 20px;
  }
  .active-indicator {
    left: 50%;
    top: auto;
    bottom: 0;
    width: 20px;
    height: 4px;
    transform: translateX(-50%);
    border-radius: 4px 4px 0 0;
  }
}

@media (max-width: 768px) {
  .modern-settings {
    padding: 20px 16px;
  }
  .settings-header-banner {
    padding: 30px 20px;
    border-radius: 20px;
  }
  .banner-content h1 {
    font-size: 28px;
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
    gap: 16px;
  }
  .security-item .el-button {
    width: 100%;
  }
  .preference-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
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
