<script setup>
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { showFailToast, showSuccessToast } from 'vant'
import { useUsersStore } from '@/stores/user'
import MPage from '../../components/MPage.vue'
import MSheet from '../../components/MSheet.vue'
import { currentUserId, useSession } from '../../session'
import { avatarColor, errorText, initials } from '../../utils'
import { uploadToCloudinary } from '../sites/siteData'

const { t, locale } = useI18n()
const usersStore = useUsersStore()
const { user, fullName } = useSession()

const saving = ref(false)
const avatarBusy = ref(false)
const avatarInput = ref(null)

async function reloadUser() {
  await usersStore.getUserInfo(currentUserId())
}

async function save(payload, okKey, done) {
  saving.value = true
  try {
    await usersStore.updateUser(currentUserId(), payload)
    await reloadUser()
    showSuccessToast(t(okKey))
    done?.()
  } catch (e) {
    showFailToast(errorText(e, t, locale.value))
  } finally {
    saving.value = false
  }
}

// ─── Shaxsiy ma'lumot ───
const infoOpen = ref(false)
const info = reactive({ firstname: '', lastname: '', phone_number: '', email: '' })
function openInfo() {
  for (const k of Object.keys(info)) info[k] = user.value?.[k] || ''
  infoOpen.value = true
}
const saveInfo = () => save({ ...info }, 'm.saved', () => (infoOpen.value = false))

// ─── Login ───
const usernameOpen = ref(false)
const username = ref('')
function openUsername() {
  username.value = user.value?.username || ''
  usernameOpen.value = true
}
function saveUsername() {
  if (!username.value.trim()) return showFailToast(t('loginError'))
  return save({ username: username.value.trim() }, 'm.saved', () => (usernameOpen.value = false))
}

// ─── Parol ───
const passOpen = ref(false)
const pass = reactive({ password: '', confirm: '' })
function openPass() {
  pass.password = ''
  pass.confirm = ''
  passOpen.value = true
}
async function savePass() {
  if (pass.password.length < 4) return showFailToast(t('m.passwordShort'))
  if (pass.password !== pass.confirm) return showFailToast(t('m.passwordMismatch'))
  saving.value = true
  try {
    await usersStore.updateUserPassword(currentUserId(), { password: pass.password })
    await reloadUser()
    showSuccessToast(t('m.passwordChanged'))
    passOpen.value = false
  } catch (e) {
    showFailToast(errorText(e, t, locale.value))
  } finally {
    saving.value = false
  }
}

// ─── Rasm ───
async function onAvatar(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) return showFailToast(t('m.mediaOnly'))
  avatarBusy.value = true
  try {
    const res = await uploadToCloudinary(file)
    await usersStore.updateUser(currentUserId(), { profile_image: res.secure_url })
    await reloadUser()
    showSuccessToast(t('m.photoUpdated'))
  } catch (err) {
    showFailToast(errorText(err, t, locale.value))
  } finally {
    avatarBusy.value = false
  }
}
</script>

<template>
  <MPage :title="$t('m.profile')" :back="{ name: 'more' }">
    <section class="pf-hero">
      <button type="button" class="pf-avatar" :disabled="avatarBusy" @click="avatarInput?.click()">
        <img v-if="user?.profile_image" :src="user.profile_image" alt="" />
        <span v-else class="m-avatar" :style="{ background: avatarColor(fullName) }">{{ initials(fullName) }}</span>
        <span class="pf-avatar__cam">
          <van-loading v-if="avatarBusy" size="14" color="#fff" />
          <van-icon v-else name="photograph" />
        </span>
      </button>
      <input ref="avatarInput" type="file" accept="image/*" hidden @change="onAvatar" />
      <h2>{{ fullName }}</h2>
      <p>@{{ user?.username }}</p>
    </section>

    <div class="m-section">
      <span class="m-section__title">{{ $t('m.personalInfo') }}</span>
      <button type="button" class="m-section__action" @click="openInfo">{{ $t('edit') }}</button>
    </div>
    <van-cell-group inset>
      <van-cell :title="$t('ism')" :value="user?.firstname || '—'" />
      <van-cell :title="$t('familiya')" :value="user?.lastname || '—'" />
      <van-cell :title="$t('telefonRaqam')" :value="user?.phone_number || '—'" />
      <van-cell :title="$t('email')" :value="user?.email || '—'" />
    </van-cell-group>

    <div class="m-section"><span class="m-section__title">{{ $t('m.security') }}</span></div>
    <van-cell-group inset>
      <van-cell :title="$t('login')" :value="user?.username" is-link @click="openUsername" />
      <van-cell :title="$t('password')" value="••••••" is-link @click="openPass" />
    </van-cell-group>

    <MSheet v-model="infoOpen" :title="$t('m.personalInfo')">
      <van-cell-group inset class="pf-form">
        <van-field v-model="info.firstname" :label="$t('ism')" label-align="top" />
        <van-field v-model="info.lastname" :label="$t('familiya')" label-align="top" />
        <van-field v-model="info.phone_number" :label="$t('telefonRaqam')" label-align="top" type="tel" />
        <van-field v-model="info.email" :label="$t('email')" label-align="top" type="email" />
      </van-cell-group>
      <template #footer>
        <van-button @click="infoOpen = false">{{ $t('cancel') }}</van-button>
        <van-button type="primary" :loading="saving" @click="saveInfo">{{ $t('save') }}</van-button>
      </template>
    </MSheet>

    <MSheet v-model="usernameOpen" :title="$t('login')">
      <van-cell-group inset class="pf-form">
        <van-field v-model="username" :label="$t('login')" label-align="top" autocapitalize="off" />
      </van-cell-group>
      <template #footer>
        <van-button @click="usernameOpen = false">{{ $t('cancel') }}</van-button>
        <van-button type="primary" :loading="saving" @click="saveUsername">{{ $t('save') }}</van-button>
      </template>
    </MSheet>

    <MSheet v-model="passOpen" :title="$t('m.changePassword')">
      <van-cell-group inset class="pf-form">
        <van-field v-model="pass.password" type="password" :label="$t('m.newPassword')" label-align="top" autocomplete="new-password" />
        <van-field v-model="pass.confirm" type="password" :label="$t('m.repeatPassword')" label-align="top" autocomplete="new-password" />
      </van-cell-group>
      <template #footer>
        <van-button @click="passOpen = false">{{ $t('cancel') }}</van-button>
        <van-button type="primary" :loading="saving" @click="savePass">{{ $t('save') }}</van-button>
      </template>
    </MSheet>
  </MPage>
</template>

<style scoped>
.pf-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px 18px;
  background: var(--m-surface);
  border-bottom: 1px solid var(--m-line);
}

.pf-avatar {
  position: relative;
  width: 88px;
  height: 88px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
}

.pf-avatar img,
.pf-avatar .m-avatar {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  object-fit: cover;
  font-size: 30px;
}

.pf-avatar__cam {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2px solid #fff;
  background: var(--m-primary);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 14px;
}

.pf-hero h2 {
  margin-top: 12px;
  font-size: 20px;
  font-weight: 700;
}

.pf-hero p {
  margin-top: 2px;
  color: var(--m-muted);
  font-size: 14px;
}

.pf-form :deep(.van-field__label) {
  color: var(--m-muted);
  font-size: 13px;
}
</style>
