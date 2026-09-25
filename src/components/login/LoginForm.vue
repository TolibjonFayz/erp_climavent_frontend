<template>
  <div class="login-page">
    <div class="login-container">
      <!-- Left Side - Illustration -->
      <div class="login-illustration">
        <div class="brand-logo">
          <img src="/biglogo.png" alt="Logo" />
        </div>
        <div class="illustration-content">
          <img src="@/assets/login-illustration.svg" alt="Login Illustration" />
        </div>
      </div>

      <!-- Right Side - Form -->
      <div class="login-form-section">
        <div class="lang-switcher">
          <div class="lang-toggle">
            <button
              type="button"
              :class="['lang-btn', { active: currentLang === 'uz' }]"
              @click="changeLanguage('uz')"
            >
              UZ
            </button>
            <button
              type="button"
              :class="['lang-btn', { active: currentLang === 'ru' }]"
              @click="changeLanguage('ru')"
            >
              RU
            </button>
          </div>
        </div>
        <div class="form-wrapper">
          <div class="form-header">
            <h1>{{ $t('loginPageHeader') }}</h1>
            <p class="subtitle">{{ $t('adminDashboardSubtitle') }}</p>
          </div>

          <form @submit.prevent="handleLogin" class="login-form">
            <div class="form-group">
              <label>{{ $t('login') }}</label>
              <el-input
                v-model="username"
                :placeholder="$t('login')"
                size="large"
                class="modern-input"
              />
              <el-alert
                v-if="showLoginError"
                :title="$t('loginError')"
                type="error"
                :closable="false"
                class="field-error"
              />
            </div>

            <div class="form-group">
              <label>{{ $t('password') }}</label>
              <el-input
                v-model="password"
                :placeholder="$t('password')"
                type="password"
                show-password
                size="large"
                class="modern-input"
              />
              <el-alert
                v-if="showPasswordError"
                :title="$t('passwordError')"
                type="error"
                :closable="false"
                class="field-error"
              />
            </div>

            <el-button
              :loading="loading"
              type="primary"
              native-type="submit"
              size="large"
              class="submit-btn"
            >
              {{ $t('loginBtn') }}
            </el-button>
          </form>
        </div>
      </div>
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
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #e3f2fd 0%, #f5f7fa 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
}

.login-container {
  display: grid;
  grid-template-columns: 45% 55%;
  width: 100%;
  max-width: 1100px;
  min-height: 600px;
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
  overflow: hidden;

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    max-width: 480px;
  }
}

.login-illustration {
  background: linear-gradient(135deg, #409eff 0%, #5dade2 100%);
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
    animation: pulse 15s ease-in-out infinite;
  }

  .brand-logo {
    position: relative;
    z-index: 2;
    align-self: flex-start;

    img {
      width: 160px;
      height: auto;
      filter: brightness(0) invert(1);
    }
  }

  .illustration-content {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    flex: 1;

    img {
      width: 85%;
      height: auto;
      max-width: 450px;
      filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.15));
    }
  }

  @media (max-width: 968px) {
    padding: 30px;
    min-height: 250px;

    .brand-logo img {
      width: 120px;
    }

    .illustration-content img {
      width: 70%;
      max-width: 280px;
    }
  }
}

.login-form-section {
  padding: 60px 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  position: relative; // added for lang switcher

  .lang-switcher {
    position: absolute;
    top: 30px;
    right: 40px;

    .lang-toggle {
      display: flex;
      background: #f1f3f5;
      border-radius: 20px;
      padding: 4px;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.04);
      position: relative;
      
      .lang-btn {
        border: none;
        background: transparent;
        padding: 6px 14px;
        font-size: 13px;
        font-weight: 600;
        color: #95a5a6;
        border-radius: 16px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 1;

        &.active {
          background: #ffffff;
          color: #2c3e50;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        &:hover:not(.active) {
          color: #34495e;
        }
      }
    }
  }

  @media (max-width: 968px) {
    padding: 40px 30px;
  }

  @media (max-width: 480px) {
    padding: 30px 20px;
  }
}

.form-wrapper {
  width: 100%;
  max-width: 420px;
}

.form-header {
  margin-bottom: 40px;
  text-align: center;

  h1 {
    font-size: 28px;
    font-weight: 700;
    color: #2c3e50;
    margin: 0 0 8px 0;
    letter-spacing: -0.5px;
  }

  .subtitle {
    font-size: 15px;
    color: #7f8c8d;
    margin: 0;
    font-weight: 400;
  }

  @media (max-width: 480px) {
    margin-bottom: 30px;

    h1 {
      font-size: 24px;
    }

    .subtitle {
      font-size: 14px;
    }
  }
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  position: relative;

  label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #495057;
    margin-bottom: 8px;
  }
}

.field-error {
  margin-top: 8px;
  border-radius: 6px;

  :deep(.el-alert__title) {
    font-size: 12px !important;
  }
}

.submit-btn {
  margin-top: 8px;
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 10px;
  background: #409eff;
  border-color: #409eff;
  transition: all 0.3s ease;

  &:hover {
    background: #66b1ff;
    border-color: #66b1ff;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(64, 158, 255, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

// Element Plus Input Overrides
:deep(.modern-input) {
  .el-input__wrapper {
    border-radius: 10px;
    padding: 8px 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    border: 1px solid #e0e6ed;
    transition: all 0.3s ease;

    &:hover {
      border-color: #409eff;
    }

    &.is-focus {
      border-color: #409eff;
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
    }
  }

  .el-input__inner {
    font-size: 15px;
    color: #2c3e50;

    &::placeholder {
      color: #adb5bd;
    }
  }
}
</style>

<style lang="scss">
.el-alert__title {
  font-size: 12px !important;
}

.el-button.is-loading {
  pointer-events: none;
}
</style>
