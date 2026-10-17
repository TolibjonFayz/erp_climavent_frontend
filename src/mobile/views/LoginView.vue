<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showFailToast } from 'vant'
import { useUsersStore } from '@/stores/user'
import { setLanguage } from '../i18n'
import wordmark from '../assets/wordmark.png'

const { t, locale } = useI18n()
const router = useRouter()
const usersStore = useUsersStore()

const username = ref('')
const password = ref('')
const loading = ref(false)

async function onSubmit() {
  loading.value = true
  try {
    const res = await usersStore.loginUser({
      username: username.value.trim(),
      password: password.value,
    })
    localStorage.setItem('userid', res.user.id)
    localStorage.setItem('refreshtoken', res.tokens.refreshToken)
    localStorage.setItem('accesstoken', res.tokens.accessToken)
    usersStore.currentUser = res.user
    router.replace({ name: 'home' })
  } catch (error) {
    const data = error?.response?.data
    const msg = !error?.response
      ? t('m.networkError')
      : locale.value === 'ru'
        ? data?.messageRu || t('m.loginFailed')
        : data?.message || t('m.loginFailed')
    showFailToast({ message: msg, wordBreak: 'break-word' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="lg">
    <div class="lg__lang">
      <button
        v-for="l in ['uz', 'ru']"
        :key="l"
        type="button"
        class="lg__lang-btn"
        :class="{ 'is-active': locale === l }"
        @click="setLanguage(l)"
      >
        {{ l.toUpperCase() }}
      </button>
    </div>

    <div class="lg__brand">
      <img :src="wordmark" alt="Climavent" class="lg__logo" />
      <p class="lg__tag">ERP</p>
    </div>

    <van-form class="lg__form" @submit="onSubmit">
      <h1 class="lg__title">{{ $t('m.loginTitle') }}</h1>
      <p class="lg__sub">{{ $t('m.loginSubtitle') }}</p>

      <label class="lg__label">{{ $t('login') }}</label>
      <van-field
        v-model="username"
        class="lg__input"
        name="username"
        autocomplete="username"
        autocapitalize="off"
        :placeholder="$t('m.loginPlaceholder')"
        left-icon="user-o"
        clearable
        :rules="[{ required: true, message: $t('loginError') }]"
      />

      <label class="lg__label">{{ $t('password') }}</label>
      <van-field
        v-model="password"
        class="lg__input"
        type="password"
        name="password"
        autocomplete="current-password"
        :placeholder="$t('m.passwordPlaceholder')"
        left-icon="lock"
        :rules="[{ required: true, message: $t('passwordError') }]"
      />

      <van-button
        block
        type="primary"
        size="large"
        native-type="submit"
        class="lg__submit"
        :loading="loading"
        :loading-text="$t('m.signingIn')"
      >
        {{ $t('loginBtn') }}
      </van-button>
    </van-form>

    <p class="lg__foot">Climavent ERP</p>
  </div>
</template>

<style scoped>
.lg {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  background: var(--m-surface);
  padding: calc(var(--sat) + 12px) 24px calc(var(--sab) + 20px);
  display: flex;
  flex-direction: column;
}

.lg__lang {
  align-self: flex-end;
  display: flex;
  padding: 3px;
  border-radius: 10px;
  background: var(--m-line-soft);
}

.lg__lang-btn {
  border: 0;
  background: none;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--m-muted);
}

.lg__lang-btn.is-active {
  background: var(--m-surface);
  color: var(--m-ink);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.lg__brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 8vh 0 6vh;
}

.lg__logo {
  width: 210px;
  max-width: 70%;
  height: auto;
}

.lg__tag {
  margin-top: 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.32em;
  color: var(--m-faint);
}

.lg__form {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
}

.lg__title {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.lg__sub {
  margin: 6px 0 24px;
  color: var(--m-muted);
  font-size: 14px;
}

.lg__label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--m-ink-2);
  margin: 0 0 6px 2px;
}

.lg__input {
  border: 1px solid var(--m-line);
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 16px;
  background: var(--m-surface-2);
}

.lg__input:focus-within {
  border-color: var(--m-primary);
  background: var(--m-surface);
}

.lg__input :deep(.van-field__error-message) {
  position: absolute;
  bottom: -20px;
}

.lg__submit {
  margin-top: 12px;
  font-weight: 600;
}

.lg__foot {
  margin-top: auto;
  padding-top: 32px;
  text-align: center;
  font-size: 12px;
  color: var(--m-faint);
}
</style>
