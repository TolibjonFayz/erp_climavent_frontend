<template>
  <div class="set-container">
    <h1>Shaxsiy ma'lumotlar</h1>

    <div class="profiles" v-loading="loading">
      <div class="profile">
        <span style="display: flex; gap: 20px; justify-content: center; align-items: center">
          <h3>Rasm (xohishiy)</h3>
          <img src="/user.png" alt="User profile picture" />
          <el-upload
            class="avatar-uploader"
            action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            :before-upload="beforeAvatarUpload"
          >
            <img v-if="imageUrl" :src="imageUrl" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </span>
      </div>

      <div class="profile">
        <span>
          <p><strong>Ism:</strong>{{ usersStore?.currentUser?.firstname }}</p>
          <p><strong>Familiya:</strong>{{ usersStore?.currentUser?.lastname }}</p>
          <p>
            <strong>Telefon raqam:</strong>
            {{ formatPhoneNumber(usersStore?.currentUser?.phone_number) }}
          </p>
          <p><strong>Email:</strong>{{ usersStore?.currentUser?.email }}</p>
        </span>
        <el-icon class="elicon" @click="changeUsernameDialog = true"><Edit /></el-icon>
      </div>
    </div>

    <el-dialog v-model="changeUsernameDialog" title="Shaxsiy ma'lumotlar" width="500">
      <div class="demo-input-with-icon">
        <div class="input-group">
          <span class="label">Ism</span>
          <div class="input-container">
            <el-input
              style="width: 320px"
              v-model="formShaxsiy.firstname"
              class="responsive-input"
              placeholder="Ism"
            />
          </div>
        </div>
        <div class="input-group">
          <span class="label">Familiya</span>
          <div class="input-container">
            <el-input
              style="width: 320px"
              v-model="formShaxsiy.lastname"
              class="responsive-input"
              placeholder="Familiya"
            >
            </el-input>
          </div>
        </div>
        <div class="input-group">
          <span class="label">Telefon raqam</span>
          <div class="input-container">
            <el-input
              style="width: 320px"
              v-model="formShaxsiy.phone_number"
              class="responsive-input"
              placeholder="Telefon raqam"
            >
            </el-input>
          </div>
        </div>
        <div class="input-group">
          <span class="label">Email</span>
          <div class="input-container">
            <el-input
              style="width: 320px"
              v-model="formShaxsiy.email"
              class="responsive-input"
              placeholder="Email"
            >
            </el-input>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="changeUsernameDialog = false">Bekor qilish</el-button>
          <el-button type="primary" @click="changeUserShaxsiyInfo(formShaxsiy)">Saqlash</el-button>
        </div>
      </template>
    </el-dialog>

    <div class="form-group" v-loading="loading">
      <div class="profile-username">
        <span
          ><strong>Foydalanuvchi nomi: </strong>
          <span> {{ usersStore?.currentUser?.username }}</span></span
        >
        <el-icon class="elicon"><Edit /></el-icon>
      </div>

      <div class="profile-password">
        <span><strong>Maxfiy so'z (Parol): </strong> <span>*********</span></span>
        <el-icon class="elicon"><Edit /></el-icon>
      </div>

      <el-button type="danger">Chiqish</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UploadProps } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useUsersStore } from '@/stores/user'
import { ElMessageBox } from 'element-plus'
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'

const changeUsernameDialog = ref(false)
const usersStore = useUsersStore()
const loading = ref(false)
const imageUrl = ref('')

const formShaxsiy = ref()

//Uploading things
const handleAvatarSuccess: UploadProps['onSuccess'] = (response, uploadFile) => {
  imageUrl.value = URL.createObjectURL(uploadFile.raw!)
}

const beforeAvatarUpload: UploadProps['beforeUpload'] = (rawFile) => {
  ElMessage.warning('Bu funksiya hozircha ishlamayapti!')
  return true
}

//Formatter of phone number
const formatPhoneNumber = (oldnumber: string) => {
  let newnumber = '+998 '
  newnumber += oldnumber?.slice(4, 6)
  newnumber += ' '
  newnumber += oldnumber?.slice(6, 9)
  newnumber += ' '
  newnumber += oldnumber?.slice(9, 11)
  newnumber += ' '
  newnumber += oldnumber?.slice(11)
  return newnumber
}

const changeUserShaxsiyInfo = async (payload: any) => {
  changeUsernameDialog.value = false
  // await usersStore.updateUser(payload)
  console.log(payload)
}

onMounted(async () => {
  loading.value = true
  const userId = localStorage.getItem('userid')
  await usersStore.getUserInfo(Number(userId))
  loading.value = false

  formShaxsiy.value = {
    firstname: usersStore?.currentUser?.firstname || '',
    lastname: usersStore?.currentUser?.lastname || '',
    phone_number: usersStore?.currentUser?.phone_number || '',
    email: usersStore?.currentUser?.email || '',
  }
})
</script>

<style scoped>
.elicon {
  cursor: pointer;
}

.set-container {
  padding: 30px;
  width: 100%;
}

h1 {
  font-size: var(--el-font-size-extra-large);
  margin-bottom: 24px;
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.profiles {
  width: 100%;
  display: flex;
  gap: 24px;
  margin-bottom: 32px;
}

.profile {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 25%;
  background: #f8f9fb;
  padding: 12px;
  border-radius: var(--el-border-radius-base);
  flex: 1;
  border: 1px solid var(--el-border-color-lighter);
}

.form-group {
  display: flex;
  align-items: end;
  gap: 20px;
}
.profile-username {
  display: flex;
  justify-content: space-between;
  width: 20%;
  background: #f8f9fb;
  padding: 12px;
  border-radius: var(--el-border-radius-base);
  border: 1px solid var(--el-border-color-lighter);
}

.profile-password {
  display: flex;
  justify-content: space-between;
  width: 20%;
  background: #f8f9fb;
  padding: 12px;
  border-radius: var(--el-border-radius-base);
  border: 1px solid var(--el-border-color-lighter);
}

.profile h3 {
  margin-bottom: 16px;
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-medium);
}

.profile img {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  border: 2px solid var(--el-border-color);
  padding: 2px;
}

.profile p {
  margin-bottom: 12px;
  color: var(--el-text-color-regular);
  font-size: var(--el-font-size-base);
}

.profile strong {
  color: var(--el-text-color-primary);
  margin-right: 8px;
}

.form-group {
  margin-bottom: 24px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-base);
}

.el-input {
  width: 30%;
  --el-input-hover-border-color: var(--el-color-primary);
}

/* Add some responsive design */
@media (max-width: 768px) {
  .profiles {
    flex-direction: column;
  }

  .container {
    padding: 20px;
  }
}
</style>

<style>
.avatar-uploader .avatar {
  width: 178px;
  height: 178px;
  display: block;
}

.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.el-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
}

.demo-input-with-icon {
  width: 100%;
}

.input-group {
  margin-bottom: 1.5rem;
}

.label {
  display: block;
  margin-bottom: 1rem;
  color: var(--el-text-color-regular);
}

.input-container {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.responsive-input {
  width: 240px;
}

@media (max-width: 768px) {
  .input-container {
    flex-direction: column;
    gap: 1rem;
  }

  .responsive-input {
    width: 100%;
  }
}
</style>
