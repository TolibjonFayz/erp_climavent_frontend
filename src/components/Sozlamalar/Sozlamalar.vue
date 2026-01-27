<template>
  <div class="settings-container" v-loading="loading">
    <div class="header-section">
      <h1>Shaxsiy ma'lumotlar</h1>
      <p class="subtitle">Profilingizni boshqaring va ma'lumotlaringizni yangilang</p>
    </div>

    <!-- Main Grid Layout -->
    <div class="main-grid">
      <!-- Avatar Section -->
      <div class="avatar-card">
        <div class="avatar-content">
          <div class="current-avatar">
            <img
              v-if="usersStore?.currentUser?.profile_image == 'profile.jpg'"
              src="/user.png"
              alt="User profile picture"
            />
            <img v-else :src="usersStore?.currentUser?.profile_image" alt="User profile picture" />
            <div class="avatar-badge">
              <el-icon><User /></el-icon>
            </div>
          </div>
          <div class="avatar-info">
            <h3>Profil rasmi</h3>
            <p>JPG, PNG yoki GIF (max. 50MB)</p>
            <el-upload
              class="avatar-uploader"
              :action="cloudinaryUrl"
              :data="uploadData"
              :show-file-list="false"
              :on-success="handleAvatarSuccess"
              :before-upload="beforeAvatarUpload"
              :on-error="handleAvatarError"
              v-loading="avatarUploading"
            >
              <el-button type="primary" :icon="Upload">Yangi rasm yuklash</el-button>
            </el-upload>
          </div>
        </div>
      </div>

      <!-- Personal Information Card -->
      <div class="info-card" v-loading="updateShaxsiyLoading">
        <div class="card-header">
          <div class="card-title">
            <el-icon class="title-icon"><User /></el-icon>
            <h3>Shaxsiy ma'lumotlar</h3>
          </div>
          <el-button type="primary" link @click="changeUserMainInfoDialog = true" :icon="Edit">
            Tahrirlash
          </el-button>
        </div>
        <div class="card-body">
          <div class="info-row">
            <div class="info-item">
              <span class="info-label">Ism</span>
              <span class="info-value">{{ usersStore?.currentUser?.firstname }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Familiya</span>
              <span class="info-value">{{ usersStore?.currentUser?.lastname }}</span>
            </div>
          </div>
          <div class="info-row">
            <div class="info-item">
              <span class="info-label">Telefon raqam</span>
              <span class="info-value">{{
                formatPhoneNumber(usersStore?.currentUser?.phone_number)
              }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Email</span>
              <span class="info-value">{{ usersStore?.currentUser?.email }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Security Card -->
      <div class="info-card security-card">
        <div class="card-header">
          <div class="card-title">
            <el-icon class="title-icon"><Lock /></el-icon>
            <h3>Xavfsizlik</h3>
          </div>
        </div>
        <div class="card-body">
          <div class="info-row">
            <div class="info-item" v-loading="updateUsernameLoading">
              <div>
                <span class="info-label">Foydalanuvchi nomi: </span>
                <span class="info-value">{{ usersStore?.currentUser?.username }}</span>
              </div>
              <!-- <el-button type="primary" link @click="changeUsernameDialog = true" :icon="Edit">
                O'zgartirish
              </el-button> -->
            </div>
            <div class="info-item" v-loading="updatePasswordLoading">
              <div>
                <span class="info-label">Maxfiy so'z: </span>
                <span class="info-value password">••••••••••</span>
              </div>
              <el-button type="primary" link @click="changePasswordDialog = true" :icon="Edit">
                O'zgartirish
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- Logout Card -->
      <div class="logout-card">
        <div class="logout-content">
          <div class="logout-info">
            <el-icon class="logout-icon"><SwitchButton /></el-icon>
            <div>
              <h4>Tizimdan chiqish</h4>
              <p>Hisobingizdan xavfsiz chiqish</p>
            </div>
          </div>
          <el-popconfirm
            title="Tizimdan chiqmoqchimisiz?"
            width="280"
            confirm-button-text="Ha"
            cancel-button-text="Yo'q"
            @confirm="logout"
          >
            <template #reference>
              <el-button type="danger" size="large" :icon="SwitchButton">Chiqish</el-button>
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
import PersonalInfoEditDialog from '../SingleObyekt/PersonalInfoEditDialog.vue'
import UsernameEditDialog from '../SingleObyekt/UsernameEditDialog.vue'
import PasswordEditDialog from '../SingleObyekt/PasswordEditDialog.vue'
import { ElNotification, ElMessage } from 'element-plus'
import type { UploadProps } from 'element-plus'
import { Plus, Edit, User, Lock, SwitchButton, Upload } from '@element-plus/icons-vue'
import { useUsersStore } from '@/stores/user'
import { onMounted, ref, computed } from 'vue'

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
  let newnumber = '+998 '
  newnumber += oldnumber?.slice(4, 6) + ' '
  newnumber += oldnumber?.slice(6, 9) + ' '
  newnumber += oldnumber?.slice(9, 11) + ' '
  newnumber += oldnumber?.slice(11)
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
  await usersStore.getUserInfo(Number(userId))
  loading.value = false
})
</script>

<style scoped>
.settings-container {
  width: 100%;
  padding: 32px;
  background: #f5f7fa;
  min-height: 100vh;
  overflow-x: hidden;
  box-sizing: border-box;
}

.header-section {
  margin-bottom: 32px;
}

.header-section h1 {
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

/* Main Grid - 2 columns */
.main-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  width: 100%;
}

/* Avatar Card - spans 1 row */
.avatar-card {
  grid-column: 1 / 2;
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.avatar-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.avatar-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  text-align: center;
}

.current-avatar {
  position: relative;
}

.current-avatar img {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #f3f4f6;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.avatar-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.avatar-badge .el-icon {
  color: white;
  font-size: 20px;
}

.avatar-info h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.avatar-info p {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 16px 0;
}

/* Personal Info Card - spans 1 row */
.info-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  overflow: hidden;
}

.info-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px 20px;
  border-bottom: 1px solid #f3f4f6;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 22px;
  color: #667eea;
}

.card-title h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.card-body {
  padding: 28px;
}

.info-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 20px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.security-card .info-item {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.security-card .info-item:hover {
  background-color: #f9fafb;
}

.info-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.info-value {
  font-size: 15px;
  color: #1f2937;
  font-weight: 600;
}

.info-value.password {
  letter-spacing: 2px;
  font-size: 18px;
}

/* Security Card - spans full width */
.security-card {
  grid-column: 1 / -1;
}

/* Logout Card - spans full width */
.logout-card {
  grid-column: 1 / -1;
  background: white;
  border-radius: 16px;
  padding: 28px 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.logout-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.logout-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logout-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.logout-icon {
  font-size: 42px;
  color: #ef4444;
  background: #fee2e2;
  padding: 14px;
  border-radius: 12px;
}

.logout-info h4 {
  font-size: 17px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.logout-info p {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

/* Responsive Design */

/* Tablet - 1280px to 1024px */
@media (max-width: 1280px) {
  .settings-container {
    padding: 28px;
  }

  .header-section h1 {
    font-size: 30px;
  }

  .main-grid {
    gap: 22px;
  }
}

/* Tablet - 1024px */
@media (max-width: 1024px) {
  .settings-container {
    padding: 24px;
    min-height: calc(100vh - 48px);
  }

  .header-section {
    margin-bottom: 28px;
  }

  .header-section h1 {
    font-size: 28px;
    margin-bottom: 6px;
  }

  .subtitle {
    font-size: 14px;
  }

  .main-grid {
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .avatar-card {
    padding: 24px;
  }

  .current-avatar img {
    width: 120px;
    height: 120px;
  }

  .avatar-info h3 {
    font-size: 18px;
  }

  .card-header {
    padding: 20px 24px 16px;
  }

  .card-body {
    padding: 24px;
  }

  .card-title h3 {
    font-size: 17px;
  }

  .title-icon {
    font-size: 20px;
  }

  .logout-card {
    padding: 24px 28px;
  }
}

/* iPad and Small Tablets - 768px to 1023px */
@media (max-width: 1023px) {
  .settings-container {
    padding: 20px 16px;
  }

  .header-section {
    margin-bottom: 24px;
  }

  .header-section h1 {
    font-size: 26px;
  }

  .subtitle {
    font-size: 14px;
  }

  .main-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .avatar-card {
    grid-column: 1;
    padding: 22px;
  }

  .security-card {
    grid-column: 1;
  }

  .logout-card {
    grid-column: 1;
  }

  .info-row {
    grid-template-columns: 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }

  .info-item {
    padding: 12px 0;
  }

  .current-avatar img {
    width: 110px;
    height: 110px;
  }

  .avatar-badge {
    width: 38px;
    height: 38px;
    bottom: 2px;
    right: 2px;
  }

  .avatar-badge .el-icon {
    font-size: 18px;
  }

  .avatar-info h3 {
    font-size: 19px;
  }

  .avatar-info p {
    font-size: 13px;
  }

  .card-header {
    padding: 20px;
    gap: 12px;
  }

  .card-title {
    flex: 1;
    min-width: 200px;
  }

  .card-title h3 {
    font-size: 17px;
  }

  .card-body {
    padding: 20px;
  }

  .info-label {
    font-size: 13px;
  }

  .info-value {
    font-size: 14px;
  }

  .security-card .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 14px;
  }

  .logout-card {
    padding: 20px;
  }

  .logout-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .logout-info {
    flex-direction: column;
    gap: 12px;
  }

  .logout-icon {
    font-size: 38px;
  }

  .logout-info h4 {
    font-size: 16px;
  }

  .logout-info p {
    font-size: 13px;
  }
}

/* Mobile Landscape and Large Phones - 641px to 767px */
@media (max-width: 767px) and (min-width: 641px) {
  .settings-container {
    padding: 18px 14px;
  }

  .header-section {
    margin-bottom: 22px;
  }

  .header-section h1 {
    font-size: 24px;
  }

  .subtitle {
    font-size: 13px;
  }

  .main-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .avatar-card {
    padding: 20px;
  }

  .current-avatar img {
    width: 100px;
    height: 100px;
  }

  .avatar-info h3 {
    font-size: 17px;
  }

  .avatar-info p {
    font-size: 12px;
  }

  .card-header {
    padding: 18px;
    flex-direction: column;
    gap: 10px;
  }

  .card-title h3 {
    font-size: 16px;
  }

  .card-body {
    padding: 18px;
  }

  .info-row {
    gap: 14px;
    margin-bottom: 14px;
  }

  .info-label {
    font-size: 12px;
  }

  .info-value {
    font-size: 13px;
  }

  .logout-card {
    padding: 18px;
  }
}

/* Mobile - 480px to 640px */
@media (max-width: 640px) {
  .settings-container {
    padding: 16px 12px;
    min-height: calc(100vh - 32px);
  }

  .header-section {
    margin-bottom: 20px;
  }

  .header-section h1 {
    font-size: 22px;
    margin-bottom: 4px;
  }

  .subtitle {
    font-size: 13px;
  }

  .main-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .avatar-card {
    grid-column: 1;
    padding: 20px 16px;
  }

  .avatar-content {
    gap: 16px;
  }

  .current-avatar img {
    width: 95px;
    height: 95px;
    border: 3px solid #f3f4f6;
  }

  .avatar-badge {
    width: 36px;
    height: 36px;
    bottom: 0;
    right: 0;
    border: 3px solid white;
  }

  .avatar-badge .el-icon {
    font-size: 17px;
  }

  .avatar-info h3 {
    font-size: 18px;
    margin-bottom: 6px;
  }

  .avatar-info p {
    font-size: 12px;
    margin-bottom: 14px;
  }

  .security-card {
    grid-column: 1;
  }

  .logout-card {
    grid-column: 1;
    padding: 16px;
  }

  .card-header {
    padding: 16px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    border-bottom: 1px solid #f3f4f6;
  }

  .card-header button {
    align-self: flex-end;
  }

  .card-title {
    width: 100%;
  }

  .card-title h3 {
    font-size: 16px;
    margin-bottom: 0;
  }

  .title-icon {
    font-size: 20px;
  }

  .card-body {
    padding: 16px;
  }

  .info-row {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-bottom: 16px;
  }

  .info-item {
    gap: 6px;
  }

  .info-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .info-value {
    font-size: 14px;
  }

  .security-card .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 12px;
  }

  .security-card .info-item > div {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .security-card .info-item button {
    align-self: flex-start;
  }

  .logout-card {
    padding: 16px 12px;
  }

  .logout-content {
    flex-direction: column;
    align-items: center;
    gap: 14px;
    text-align: center;
  }

  .logout-info {
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .logout-icon {
    font-size: 32px;
    padding: 12px;
  }

  .logout-info h4 {
    font-size: 16px;
    margin-bottom: 2px;
  }

  .logout-info p {
    font-size: 12px;
    margin: 0;
  }
}

/* Small Mobile Phones - 380px to 479px */
@media (max-width: 479px) {
  .settings-container {
    padding: 14px 10px;
  }

  .header-section {
    margin-bottom: 18px;
  }

  .header-section h1 {
    font-size: 20px;
  }

  .subtitle {
    font-size: 12px;
  }

  .main-grid {
    gap: 10px;
  }

  .avatar-card {
    padding: 18px 14px;
  }

  .avatar-content {
    gap: 14px;
  }

  .current-avatar img {
    width: 85px;
    height: 85px;
  }

  .avatar-badge {
    width: 32px;
    height: 32px;
  }

  .avatar-badge .el-icon {
    font-size: 16px;
  }

  .avatar-info h3 {
    font-size: 16px;
  }

  .avatar-info p {
    font-size: 11px;
  }

  .card-header {
    padding: 14px;
    gap: 10px;
  }

  .card-title h3 {
    font-size: 15px;
  }

  .title-icon {
    font-size: 18px;
  }

  .card-body {
    padding: 14px;
  }

  .info-row {
    gap: 10px;
    margin-bottom: 12px;
  }

  .info-label {
    font-size: 10px;
  }

  .info-value {
    font-size: 13px;
  }

  .logout-card {
    padding: 14px;
  }

  .logout-icon {
    font-size: 28px;
    padding: 10px;
  }

  .logout-info h4 {
    font-size: 15px;
  }

  .logout-info p {
    font-size: 11px;
  }
}

/* Very Small Mobile - 320px to 379px */
@media (max-width: 379px) {
  .settings-container {
    padding: 12px 8px;
  }

  .header-section {
    margin-bottom: 16px;
  }

  .header-section h1 {
    font-size: 18px;
  }

  .subtitle {
    font-size: 11px;
  }

  .main-grid {
    gap: 8px;
  }

  .avatar-card {
    padding: 16px 12px;
  }

  .avatar-content {
    gap: 12px;
  }

  .current-avatar img {
    width: 80px;
    height: 80px;
  }

  .avatar-badge {
    width: 28px;
    height: 28px;
    border: 2px solid white;
  }

  .avatar-badge .el-icon {
    font-size: 14px;
  }

  .avatar-info h3 {
    font-size: 15px;
  }

  .avatar-info p {
    font-size: 10px;
  }

  .card-header {
    padding: 12px;
    gap: 8px;
  }

  .card-title h3 {
    font-size: 14px;
  }

  .title-icon {
    font-size: 16px;
  }

  .card-body {
    padding: 12px;
  }

  .info-row {
    gap: 8px;
    margin-bottom: 10px;
  }

  .info-label {
    font-size: 9px;
  }

  .info-value {
    font-size: 12px;
  }

  .logout-card {
    padding: 12px;
  }

  .logout-icon {
    font-size: 24px;
    padding: 8px;
  }

  .logout-info h4 {
    font-size: 14px;
  }

  .logout-info p {
    font-size: 10px;
  }
}
</style>

<style>
.avatar-uploader .el-upload {
  border: none;
}
</style>
