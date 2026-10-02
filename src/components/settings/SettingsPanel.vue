<template>
  <UiPage v-loading="loading" :title="$t('settings')" :subtitle="$t('shaxsiymalumotlarSubtitle')">
    <div class="st-grid">
      <!-- Profil: rasm va asosiy ma'lumot -->
      <UiPanel class="st-profile">
        <div class="st-profile__body">
          <el-upload
            class="avatar-uploader"
            :action="cloudinaryUrl"
            :data="uploadData"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            :before-upload="beforeAvatarUpload"
            :on-error="handleAvatarError"
          >
            <div class="st-avatar" :class="{ 'is-uploading': avatarUploading }">
              <img
                v-if="usersStore?.currentUser?.profile_image == 'profile.jpg'"
                src="/user.png"
                alt="Avatar"
              />
              <img v-else :src="usersStore?.currentUser?.profile_image" alt="Avatar" />
              <div class="st-avatar__overlay">
                <el-icon><Camera /></el-icon>
                <span>{{ $t('uploadAvatar') }}</span>
              </div>
            </div>
          </el-upload>

          <h2 class="st-name">
            {{ usersStore?.currentUser?.firstname }} {{ usersStore?.currentUser?.lastname }}
          </h2>
          <p class="st-username">@{{ usersStore?.currentUser?.username || '—' }}</p>
          <el-tag
            :type="usersStore?.currentUser?.is_admin ? 'primary' : 'info'"
            size="small"
            effect="plain"
          >
            {{ usersStore?.currentUser?.is_admin ? $t('admin') : $t('colEmployee') }}
          </el-tag>

          <p class="st-hint">{{ $t('profileimageInfo') }}</p>
          <el-upload
            class="avatar-button-uploader"
            :action="cloudinaryUrl"
            :data="uploadData"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            :before-upload="beforeAvatarUpload"
            :on-error="handleAvatarError"
          >
            <el-button :icon="Upload" :loading="avatarUploading">
              {{ $t('uploadAvatar') }}
            </el-button>
          </el-upload>
        </div>
      </UiPanel>

      <div class="st-main">
        <!-- Shaxsiy ma'lumotlar -->
        <UiPanel v-loading="updateShaxsiyLoading" :title="$t('shaxsiymalumotlar')" :icon="User">
          <template #actions>
            <el-button link type="primary" :icon="Edit" @click="changeUserMainInfoDialog = true">
              {{ $t('edit') }}
            </el-button>
          </template>
          <UiInfoList :items="infoItems" />
        </UiPanel>

        <!-- Xavfsizlik -->
        <UiPanel :title="$t('security')" :hint="$t('setSecuritySub')" :icon="Lock">
          <div class="st-rows">
            <div v-loading="updateUsernameLoading" class="st-row">
              <div class="st-row__text">
                <span class="st-row__label">{{ $t('username') }}</span>
                <span class="st-row__value is-mono">
                  {{ usersStore?.currentUser?.username || '—' }}
                </span>
              </div>
              <el-button :icon="Edit" @click="changeUsernameDialog = true">
                {{ $t('edit') }}
              </el-button>
            </div>
            <div v-loading="updatePasswordLoading" class="st-row">
              <div class="st-row__text">
                <span class="st-row__label">{{ $t('setPasswordLabel') }}</span>
                <span class="st-row__value is-dots">••••••••••</span>
              </div>
              <el-button :icon="Key" @click="changePasswordDialog = true">
                {{ $t('edit') }}
              </el-button>
            </div>
          </div>
        </UiPanel>

        <!-- Til -->
        <UiPanel :title="$t('languageSettings')" :hint="$t('setLanguageSub')" :icon="Setting">
          <div v-loading="languageLoading" class="st-row">
            <div class="st-row__text">
              <span class="st-row__label">{{ $t('currentLanguage') }}</span>
              <span class="st-row__value">{{ getCurrentLanguageLabel }}</span>
            </div>
            <el-select
              v-model="selectedLanguage"
              :placeholder="$t('selectLanguage')"
              class="st-lang"
              @change="handleLanguageChange"
            >
              <el-option
                v-for="lang in languages"
                :key="lang.value"
                :label="lang.label"
                :value="lang.value"
              >
                <span class="st-lang__opt">
                  <span>{{ lang.flag }}</span>
                  {{ lang.label }}
                </span>
              </el-option>
            </el-select>
          </div>
        </UiPanel>

        <!-- Chiqish -->
        <UiPanel class="st-logout">
          <div class="st-row">
            <div class="st-row__text">
              <span class="st-row__value">{{ $t('logout') }}</span>
              <span class="st-row__label">{{ $t('logoutInfo') }}</span>
            </div>
            <el-popconfirm
              :title="$t('logoutConfirmTitle')"
              width="280"
              :confirm-button-text="$t('yeah')"
              :cancel-button-text="$t('no')"
              @confirm="logout"
            >
              <template #reference>
                <el-button type="danger" plain :icon="SwitchButton">
                  {{ $t('logout') }}
                </el-button>
              </template>
            </el-popconfirm>
          </div>
        </UiPanel>
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
  </UiPage>
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
import UiPage from '@/components/ui/UiPage.vue'
import UiPanel from '@/components/ui/UiPanel.vue'
import UiInfoList from '@/components/ui/UiInfoList.vue'
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

const infoItems = computed(() => {
  const u = usersStore?.currentUser
  const t = i18n.global.t
  return [
    { key: 'firstname', label: t('ism'), value: u?.firstname },
    { key: 'lastname', label: t('familiya'), value: u?.lastname },
    {
      key: 'phone',
      label: t('telefonRaqam'),
      value: u?.phone_number ? formatPhoneNumber(u.phone_number) : '',
      href: u?.phone_number ? `tel:${u.phone_number}` : '',
    },
    { key: 'email', label: t('email'), value: u?.email },
  ]
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
      title: 'Foydalanuvchi nomi muvaffaqiyatli yangilandi!',
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
.st-grid {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}
.st-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

/* ─── Profil ─── */
.st-profile__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 0 4px;
  text-align: center;
}
.st-avatar {
  position: relative;
  width: 112px;
  height: 112px;
  margin-bottom: 8px;
  overflow: hidden;
  border: 1px solid var(--ui-line);
  border-radius: 50%;
  cursor: pointer;
}
.st-avatar.is-uploading {
  opacity: 0.6;
}
.st-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.st-avatar__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px;
  font-size: 11px;
  font-weight: 600;
  color: white;
  background: rgba(17, 24, 39, 0.55);
  opacity: 0;
  transition: opacity 0.2s;
}
.st-avatar:hover .st-avatar__overlay {
  opacity: 1;
}
.st-avatar__overlay .el-icon {
  font-size: 20px;
}
.st-name {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--ui-ink);
}
.st-username {
  margin: 0 0 4px;
  font-size: 13px;
  color: var(--ui-muted);
}
.st-hint {
  margin: 12px 0 4px;
  padding-top: 12px;
  width: 100%;
  font-size: 12px;
  line-height: 1.5;
  color: var(--ui-muted);
  border-top: 1px solid var(--ui-line-soft);
}

/* ─── Sozlama qatorlari ─── */
.st-rows {
  display: flex;
  flex-direction: column;
}
.st-rows .st-row + .st-row {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--ui-line);
}
.st-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.st-row__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.st-row__label {
  font-size: 12px;
  color: var(--ui-muted);
}
.st-row__value {
  font-size: 14px;
  font-weight: 600;
  color: var(--ui-ink);
}
.st-row__value.is-mono {
  font-family: ui-monospace, Consolas, monospace;
}
.st-row__value.is-dots {
  letter-spacing: 2px;
}
.st-lang {
  width: 200px;
}
.st-lang__opt {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.st-logout {
  border-color: #fecaca;
}

@media (max-width: 900px) {
  .st-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .st-row {
    flex-direction: column;
    align-items: stretch;
  }
  .st-lang {
    width: 100%;
  }
}
</style>

<style>
/* El-upload tozalash */
.avatar-uploader .el-upload,
.avatar-button-uploader .el-upload {
  border: none !important;
  background: transparent !important;
  display: block;
}
</style>
