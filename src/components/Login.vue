<template>
  <div class="login-page">
    <div class="login-box">
      <div class="login-illustration">
        <img src="@/assets/man.png" alt="Man Illustration" />
      </div>

      <div class="login-form">
        <h2>Tizimga kirish</h2>
        <p>Tizimga kirish uchun login va parolingizni kiriting.</p>
        <form @submit.prevent="handleLogin">
          <el-input v-model="username" style="width: 240px" placeholder="Foydalanuvchi nomi" />
          <el-input
            v-model="password"
            style="width: 240px"
            placeholder="Maxfiy so'z"
            type="password"
          />
          <el-button type="primary" native-type="submit">Kirish</el-button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const username = ref('')
const password = ref('')

const handleLogin = () => {
  console.log('Logging in with', username.value, password.value)
}
</script>

<style lang="scss" scoped>
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

  h2 {
    font-size: clamp(24px, 4vw, 28px);
    margin-bottom: 10px;
    color: #0a0a0a;
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
