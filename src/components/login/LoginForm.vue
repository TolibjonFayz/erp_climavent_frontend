<template>
  <div class="lg-page">
    <div class="lg-card">
      <!-- Chap: brend -->
      <aside class="lg-brand">
        <img class="lg-brand__logo" src="/biglogo.png" alt="Climavent" />
        <div class="lg-brand__art">
          <img src="@/assets/login-illustration.svg" alt="" />
        </div>
        <p class="lg-brand__foot">Climavent ERP</p>
      </aside>

      <!-- O'ng: forma -->
      <section class="lg-form-side">
        <div class="lg-lang" role="group" aria-label="Language">
          <button
            type="button"
            :class="['lg-lang__btn', { 'is-active': currentLang === 'uz' }]"
            @click="changeLanguage('uz')"
          >
            UZ
          </button>
          <button
            type="button"
            :class="['lg-lang__btn', { 'is-active': currentLang === 'ru' }]"
            @click="changeLanguage('ru')"
          >
            RU
          </button>
        </div>

        <div class="lg-form-wrap">
          <header class="lg-head">
            <h1>{{ $t('loginPageHeader') }}</h1>
            <p>{{ $t('adminDashboardSubtitle') }}</p>
          </header>

          <form class="lg-form" @submit.prevent="handleLogin">
            <label class="lg-field">
              <span class="lg-field__label">{{ $t('login') }}</span>
              <el-input
                v-model="username"
                :placeholder="$t('login')"
                size="large"
                autocomplete="username"
                :class="{ 'is-error': showLoginError }"
              />
              <span v-if="showLoginError" class="lg-field__error">{{ $t('loginError') }}</span>
            </label>

            <label class="lg-field">
              <span class="lg-field__label">{{ $t('password') }}</span>
              <el-input
                v-model="password"
                :placeholder="$t('password')"
                type="password"
                show-password
                size="large"
                autocomplete="current-password"
                :class="{ 'is-error': showPasswordError }"
              />
              <span v-if="showPasswordError" class="lg-field__error">
                {{ $t('passwordError') }}
              </span>
            </label>

            <el-button
              :loading="loading"
              type="primary"
              native-type="submit"
              size="large"
              class="lg-submit"
            >
              {{ $t('loginBtn') }}
            </el-button>
          </form>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { useUsersStore } from '@/stores/user'
import { ElNotification } from 'element-plus'
import { ref } from 'vue'
import { setCookie } from '@/utils/cookies'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

const usersStore = useUsersStore()
const username = ref('')
const password = ref('')
const showLoginError = ref(false)
const showPasswordError = ref(false)
const loading = ref(false)

const currentLang = ref(locale.value)

const changeLanguage = (lang) => {
  currentLang.value = lang
  locale.value = lang
  setCookie('lang', lang, 365)
}

const handleLogin = async () => {
  showLoginError.value = !username.value
  showPasswordError.value = !password.value
  if (showLoginError.value || showPasswordError.value) return

  loading.value = true
  try {
    const res = await usersStore.loginUser({
      username: username.value,
      password: password.value,
    })
    localStorage.setItem('userid', res.user.id)
    localStorage.setItem('refreshtoken', res.tokens.refreshToken)
    localStorage.setItem('accesstoken', res.tokens.accessToken)
    window.location.href = '/'
  } catch (error) {
    const data = error?.response?.data
    ElNotification({
      title: locale.value === 'uz' ? 'Xatolik' : 'Ошибка',
      message:
        locale.value === 'uz'
          ? data?.message || 'Login amalga oshmadi'
          : data?.messageRu || 'Вход не выполнен',
      type: 'error',
    })
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.lg-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: var(--ui-surface-2);
  box-sizing: border-box;
}
.lg-card {
  display: grid;
  grid-template-columns: 44% 56%;
  width: 100%;
  max-width: 1000px;
  min-height: 560px;
  overflow: hidden;
  background: var(--ui-surface);
  border: 1px solid var(--ui-line);
  border-radius: 14px;
  box-shadow: 0 12px 40px rgba(17, 24, 39, 0.06);
}

/* ─── Brend ─── */
.lg-brand {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px;
  background: var(--ui-link-soft);
  border-right: 1px solid var(--ui-line);
}
.lg-brand__logo {
  align-self: flex-start;
  width: 150px;
  height: auto;
}
.lg-brand__art {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 82%;
    max-width: 380px;
    height: auto;
  }
}
.lg-brand__foot {
  margin: 0;
  font-size: 12px;
  color: var(--ui-muted);
}

/* ─── Forma ─── */
.lg-form-side {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 56px 48px;
}
.lg-lang {
  position: absolute;
  top: 20px;
  right: 24px;
  display: flex;
  padding: 3px;
  background: var(--ui-line-soft);
  border: 1px solid var(--ui-line);
  border-radius: 8px;
}
.lg-lang__btn {
  padding: 4px 12px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  color: var(--ui-muted);
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;

  &.is-active {
    color: var(--ui-ink);
    background: var(--ui-surface);
    box-shadow: 0 1px 2px rgba(17, 24, 39, 0.08);
  }
  &:hover:not(.is-active) {
    color: var(--ui-ink-2);
  }
}
.lg-form-wrap {
  width: 100%;
  max-width: 380px;
}
.lg-head {
  margin-bottom: 28px;

  h1 {
    margin: 0 0 6px;
    font-size: 24px;
    font-weight: 700;
    line-height: 1.25;
    color: var(--ui-ink);
  }
  p {
    margin: 0;
    font-size: 14px;
    color: var(--ui-muted);
  }
}
.lg-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.lg-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.lg-field__label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ui-muted);
}
.lg-field__error {
  font-size: 12px;
  color: var(--ui-bad);
}
.lg-field :deep(.is-error .el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--ui-bad) inset;
}
.lg-submit {
  width: 100%;
  height: 44px;
  margin-top: 6px;
  font-size: 15px;
  font-weight: 600;
}

@media (max-width: 900px) {
  .lg-card {
    grid-template-columns: 1fr;
    max-width: 460px;
    min-height: 0;
  }
  .lg-brand {
    flex-direction: row;
    align-items: center;
    gap: 12px;
    padding: 18px 20px;
    border-right: none;
    border-bottom: 1px solid var(--ui-line);
  }
  .lg-brand__logo {
    width: 120px;
  }
  .lg-brand__art,
  .lg-brand__foot {
    display: none;
  }
  .lg-form-side {
    padding: 56px 20px 28px;
  }
}
</style>

<style lang="scss">
.el-button.is-loading {
  pointer-events: none;
}
</style>
