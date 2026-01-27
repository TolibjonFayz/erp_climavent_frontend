<template>
  <div class="login-page">
    <div class="login-box">
      <div class="login-illustration">
        <img src="@/assets/man.png" alt="Man Illustration" />
      </div>

      <div class="login-form">
        <img class="logo" src="/biglogo.png" />
        <p>Tizimga kirish uchun login va parolingizni kiriting!</p>
        <form @submit.prevent="handleLogin">
          <el-input v-model="username" style="width: 240px" placeholder="Login" />
          <el-alert
            v-if="isloginEnterd"
            title="Loginingizni kiriting"
            type="error"
            :closable="false"
          />
          <el-input
            v-model="password"
            style="width: 240px"
            placeholder="Parol"
            type="password"
            show-password
          />
          <el-alert
            v-if="isPasswordEntered"
            title="Maxfiy kodni kiriting"
            type="error"
            :closable="false"
          />
          <el-button :loading="loading" type="primary" native-type="submit">Kirish</el-button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useUsersStore } from '@/stores/user'
import { ElNotification } from 'element-plus'
import { ref } from 'vue'

const usersStore = useUsersStore()
const isPasswordEntered = ref(false)
const isloginEnterd = ref(false)
const username = ref('')
const password = ref('')
const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  // Check if username and password are entered
  if (!username.value) {
    isloginEnterd.value = true
    if (!password.value) {
      isPasswordEntered.value = true
    } else {
      isPasswordEntered.value = false
    }
  } else if (!password.value) {
    isPasswordEntered.value = true
    isloginEnterd.value = false
  } else {
    isloginEnterd.value = false
    isPasswordEntered.value = false

    const payload = {
      username: username.value,
      password: password.value,
    }
    await usersStore
      .loginUser(payload)
      .then((res) => {
        localStorage.setItem('userid', res.user.id)
        localStorage.setItem('refreshtoken', res.tokens.refreshToken)
        localStorage.setItem('accesstoken', res.tokens.accessToken)
        loading.value = false
        window.location.href = '/'
      })
      .catch((error) => {
        ElNotification({
          title: 'Xatolik',
          message: error.response.data.message || 'Login failed',
          type: 'error',
        })
        loading.value = false
      })
  }
}
</script>

<style lang="scss" scoped>
.el-alert {
  margin: -10px 0 0;
  height: 25px;
  .el-alert__title {
    font-size: 12px !important;
  }
}

.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #ffffff;
  height: 100vh;
  padding: 20px;
}

.login-box {
  display: flex;
  width: 100%;
  max-width: 800px;
  min-height: 500px;
  height: auto;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.login-illustration {
  background-color: #409eff;
  width: 35%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    position: absolute;
    width: 95%;
    height: auto;
  }

  @media (max-width: 768px) {
    display: none;
  }
}

.login-form {
  flex: 1;
  padding: clamp(20px, 5vw, 50px);
  text-align: center;
  justify-content: center;
  align-items: center;
  display: flex;
  flex-direction: column;

  .logo {
    width: clamp(120px, 12vw, 180px);
    margin-bottom: 20px;
  }

  p {
    color: #555;
    font-size: clamp(12px, 2vw, 14px);
    margin-bottom: 20px;
    padding: 0 10px;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 15px;
    width: 100%;
    max-width: 240px;

    .el-input {
      width: 100% !important;
    }

    .el-button {
      width: 100%;
    }
  }
}

@media (max-width: 768px) {
  .login-box {
    min-height: auto;
  }
}

@media (max-width: 480px) {
  .login-box {
    box-shadow: none;
  }
}
</style>

<style lang="scss">
.el-alert__title {
  font-size: 11px !important;
}
</style>
