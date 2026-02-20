<template>
  <div class="admin-wrap" v-loading="loading">
    <header class="adm-header">
      <div class="adm-header__bg">
        <span class="orb orb-1"></span>
        <span class="orb orb-2"></span>
        <span class="orb orb-3"></span>
      </div>
      <div class="adm-header__inner">
        <div class="adm-header__left">
          <div class="adm-logo"><i class="el-icon-management"></i></div>
          <div>
            <h1 class="adm-title">Admin Panel</h1>
            <p class="adm-sub">Tizim boshqaruvchisining paneli · Barcha ma'lumotlar bir joyda</p>
          </div>
        </div>
        <div class="adm-header__stats">
          <div class="stat-chip" style="animation-delay: 0.1s">
            <i class="el-icon-user chip-icon"></i>
            <span class="chip-val">{{ Math.round(uAnim) }}</span>
            <span class="chip-lbl">Foydalanuvchilar</span>
          </div>
          <div class="stat-chip" style="animation-delay: 0.2s">
            <i class="el-icon-office-building chip-icon"></i>
            <span class="chip-val">{{ Math.round(oAnim) }}</span>
            <span class="chip-lbl">Obyektlar</span>
          </div>
          <div class="stat-chip" style="animation-delay: 0.3s">
            <i class="el-icon-s-custom chip-icon"></i>
            <span class="chip-val">{{ Math.round(pAnim) }}</span>
            <span class="chip-lbl">Hamkorlar</span>
          </div>
        </div>
      </div>
    </header>

    <div class="adm-body">
      <!-- SIDEBAR -->
      <aside class="adm-sidebar">
        <nav class="adm-nav">
          <button
            v-for="tab in tabs"
            :key="tab.name"
            class="adm-nav__item"
            :class="{ 'is-active': activeTab === tab.name }"
            @click="activeTab = tab.name"
          >
            <span class="adm-nav__icon"><i :class="tab.icon"></i></span>
            <span class="adm-nav__lbl">{{ tab.label }}</span>
          </button>
        </nav>

        <div class="adm-sidebar__footer">
          <div class="adm-user">
            <div class="adm-user__av"><i class="el-icon-user-solid"></i></div>
            <div>
              <span class="adm-user__name">Administrator</span>
              <span class="adm-user__role">Super Admin</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- MAIN -->
      <main class="adm-main">
        <!-- Foydalanuvchilar -->
        <div v-if="activeTab === 'users'" class="adm-page">
          <div class="page-head">
            <span class="page-accent"></span>
            <h2 class="page-title">Barcha foydalanuvchilar</h2>
          </div>
          <div class="tbl-wrap" v-loading="usersLoading">
            <el-table :data="usersStore.allUsers" stripe border style="width: 100%">
              <el-table-column prop="id" label="ID" width="75" />
              <el-table-column prop="username" label="Foydalanuvchi nomi" min-width="120" />
              <el-table-column prop="firstname" label="Ismi" min-width="120" />
              <el-table-column prop="lastname" label="Familiyasi" min-width="120" />
              <el-table-column prop="phone_number" label="Telefon" min-width="120" />
              <el-table-column prop="email" label="Email" min-width="120" />
              <el-table-column label="Rol" width="250">
                <template #default="{ row }">
                  <el-tag :type="row.is_admin ? 'success' : 'warning'">
                    {{ row.is_admin ? 'Admin' : 'Foydalanuvchi' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <!-- Hamkorlar -->
        <div v-if="activeTab === 'partners'" class="adm-page">
          <div class="page-head">
            <span class="page-accent"></span>
            <h2 class="page-title">Hamkorlar va mijozlar</h2>
          </div>
          <div class="adm-toolbar">
            <el-input
              v-model="partnersSearch"
              placeholder="Qidiruv (nomi, telefon)..."
              :prefix-icon="Search"
              clearable
              class="adm-search"
            />
            <el-select
              v-model="partnersType"
              placeholder="Turi bo'yicha"
              clearable
              class="adm-select"
            >
              <el-option label="Doimiy mijoz" value="Doimiy mijoz" />
              <el-option label="Montajnik" value="Montajnik" />
              <el-option label="Quruvchi" value="Quruvchi" />
            </el-select>
            <el-button class="adm-reset-btn" @click="handleResetPartners">
              <i class="el-icon-refresh-left"></i> Tozalash
            </el-button>
          </div>
          <div class="tbl-wrap" v-loading="partnersLoading">
            <el-table :data="partnersStore.allPartners" stripe border style="width: 100%">
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="partner_type" label="Turi" min-width="120" />
              <el-table-column label="Kim qo'shgan" min-width="140">
                <template #default="{ row }"
                  ><el-tag>{{ row.user.firstname }}</el-tag></template
                >
              </el-table-column>
              <el-table-column label="Username" min-width="160">
                <template #default="{ row }"
                  ><el-tag>{{ row.user.username }}</el-tag></template
                >
              </el-table-column>
              <el-table-column prop="fullname" label="Nomi" min-width="130" />
              <el-table-column prop="phone_number" label="Telefon" min-width="150" />
              <el-table-column
                prop="additional_phone_number"
                label="Qo'shimcha tel"
                min-width="150"
              />
              <el-table-column label="Manzil" min-width="160">
                <template #default="{ row }">
                  <el-tag
                    >{{ row.user.republic }} {{ row.user.viloyat }}
                    {{ row.user.shahar_tuman }}</el-tag
                  >
                </template>
              </el-table-column>
              <el-table-column prop="mijozturi" label="Yuridik/Jismoniy" min-width="130" />
              <el-table-column prop="inn" label="INN" min-width="110" />
            </el-table>
          </div>
        </div>

        <!-- Obyektlar -->
        <div v-if="activeTab === 'objects'" class="adm-page">
          <div class="page-head">
            <span class="page-accent"></span>
            <h2 class="page-title">Obyektlar</h2>
          </div>
          <div class="adm-toolbar">
            <el-input
              v-model="objectsSearch"
              placeholder="Qidiruv (firma nomi)..."
              :prefix-icon="Search"
              clearable
              class="adm-search"
            />
            <el-button class="adm-reset-btn" @click="handleResetObjects">
              <i class="el-icon-refresh-left"></i> Tozalash
            </el-button>
          </div>
          <div class="tbl-wrap" v-loading="objectsLoading">
            <el-table
              :data="comeandgoInsideStore.allComeAndGoInsides"
              stripe
              border
              style="width: 100%"
            >
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="whereto" label="Qayerga" min-width="120" />
              <el-table-column prop="who" label="Kim qo'shgan" min-width="130">
                <template #default="{ row }">
                  {{ row.come_and_go_father?.user?.username }}
                </template>
              </el-table-column>
              <el-table-column prop="when_gone" label="Ketilgan vaqt" min-width="150">
                <template #default="{ row }">
                  {{ formatDate(row.when_gone) }}
                </template>
              </el-table-column>
              <el-table-column prop="when_came" label="Qaytilgan vaqt" min-width="150">
                <template #default="{ row }">
                  {{ formatDate(row.when_came) }}
                </template>
              </el-table-column>
              <el-table-column prop="dogovor_or_kp" label="Dogovor / KP" min-width="130" />
              <el-table-column prop="locationname" label="Manzil" min-width="130" />
              <el-table-column prop="company_name" label="Firma nomi" min-width="140" />
              <el-table-column prop="createdAt" label="Kiritilgan vaqt" min-width="140">
                <template #default="{ row }">
                  {{ formatDate(row.createdAt) }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <!-- Sozlamalar -->
        <div v-if="activeTab === 'settings'" class="adm-page">
          <div class="page-head">
            <span class="page-accent"></span>
            <h2 class="page-title">Tizim sozlamalari</h2>
          </div>
          <div class="settings-card">
            <div class="sc-icon"><i class="el-icon-download"></i></div>
            <h3 class="sc-title">Ma'lumotlarni eksport qilish</h3>
            <p class="sc-desc">Barcha ma'lumotlarni EXCEL formatida yuklab olish</p>
            <div class="sc-btns">
              <el-button class="sc-btn" @click="handleExportPartners">
                <i class="el-icon-user"></i> Hamkorlar
              </el-button>
              <el-button class="sc-btn" @click="handleExportObjects">
                <i class="el-icon-office-building"></i> Obyektlar
              </el-button>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { useComeAndGoInsideStore } from '@/stores/comeandgoInside'
import { usePartnersStore } from '@/stores/partners'
import { Search } from '@element-plus/icons-vue'
import { ref, computed, onMounted } from 'vue'
import { useUsersStore } from '@/stores/user'
import { useTransition } from '@vueuse/core'
import { ElMessage } from 'element-plus'
import router from '@/router'

const comeandgoInsideStore = useComeAndGoInsideStore()
const partnersStore = usePartnersStore()
const usersStore = useUsersStore()

const activeTab = ref('users')
const loading = ref(false)
const usersLoading = ref(false)
const partnersLoading = ref(false)
const objectsLoading = ref(false)

function formatDate(isoString) {
  if (!isoString) return 'Kiritilmagan'

  const date = new Date(isoString)

  const year = date.getFullYear()

  const months = [
    'yanvar',
    'fevral',
    'mart',
    'aprel',
    'may',
    'iyun',
    'iyul',
    'avgust',
    'sentabr',
    'oktabr',
    'noyabr',
    'dekabr',
  ]
  const month = months[date.getMonth()]
  const day = date.getDate()

  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year} / ${day}-${month} / ${hours}:${minutes}`
}

const tabs = [
  { name: 'users', label: 'Foydalanuvchilar', icon: 'el-icon-user' },
  { name: 'partners', label: 'Hamkorlar', icon: 'el-icon-s-custom' },
  { name: 'objects', label: 'Obyektlar', icon: 'el-icon-office-building' },
  { name: 'settings', label: 'Sozlamalar', icon: 'el-icon-setting' },
]

// Animated counters
const uSrc = ref(0),
  oSrc = ref(0),
  pSrc = ref(0)
const uAnim = useTransition(uSrc, { duration: 1400 })
const oAnim = useTransition(oSrc, { duration: 1400 })
const pAnim = useTransition(pSrc, { duration: 1400 })

const partnersSearch = ref('')
const partnersType = ref('')
const objectsSearch = ref('')

const objectsList = ref([
  {
    id: 1,
    where: 'Toshkent',
    who: 'Admin',
    gonetime: '2024-01-15 10:00',
    cametime: '2024-01-15 18:00',
    dogovororkp: 'Dogovor',
    address: 'Yunusabad',
    firmanomi: 'ABC Company',
    createdtime: '2024-01-15 09:00',
  },
])

const filteredObjects = computed(() =>
  objectsList.value.filter(
    (o) =>
      !objectsSearch.value || o.firmanomi.toLowerCase().includes(objectsSearch.value.toLowerCase()),
  ),
)

const handleExportPartners = () => ElMessage.success('Hamkorlar eksport qilindi!')
const handleExportObjects = () => ElMessage.success('Obyektlar eksport qilindi!')
const handleResetPartners = () => {
  partnersSearch.value = ''
  partnersType.value = ''
}
const handleResetObjects = () => {
  objectsSearch.value = ''
}

onMounted(async () => {
  try {
    loading.value = true
    await usersStore.getUserInfo(Number(localStorage.getItem('userid')))
    if (!usersStore.currentUser.is_admin) {
      router.push('/')
      return
    }
    await Promise.all([
      usersStore.getAllUsers(),
      partnersStore.getAllPartners(),
      comeandgoInsideStore.getAllComeAndGoInside(),
    ])
    uSrc.value = usersStore.allUsers.length
    pSrc.value = partnersStore.allPartners.length
    oSrc.value = comeandgoInsideStore.allComeAndGoInsides.length
  } catch (e) {
    ElMessage.error('Yuklashda xatolik: ' + e.message)
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');

// ─── Element Plus ko'k ranglar ────────────────────────────
$blue: #409eff; // El Plus primary
$blue-d: #337ecc; // El Plus primary-dark-2
$blue-l: #a0cfff; // El Plus primary-light-3
$blue-bg: #ecf5ff; // El Plus primary-light-9

$text-primary: #303133; // El Plus text primary
$text-regular: #606266; // El Plus text regular
$text-secondary: #909399; // El Plus text secondary

$border: #dcdfe6; // El Plus border
$bg-page: #f0f2f5; // sahifa foni — juda ochiq kulrang
$bg-white: #ffffff;

$sw: 220px; // sidebar width

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.admin-wrap {
  font-family: 'Plus Jakarta Sans', sans-serif;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: $bg-page;
}

.adm-header {
  position: relative;
  flex-shrink: 0;
  width: 100%;
  // Ochroq, El Plus ko'ki asosidagi gradient
  background: linear-gradient(115deg, #2a7ae2 0%, #409eff 55%, #66b1ff 100%);
  padding: 28px 40px 24px;
  color: #fff;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(64, 158, 255, 0.28);

  &__bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(60px);
      opacity: 0.18;
      animation: orbFloat 18s ease-in-out infinite;
    }
    .orb-1 {
      width: 340px;
      height: 340px;
      background: #a0cfff;
      top: -120px;
      right: -40px;
      animation-delay: 0s;
    }
    .orb-2 {
      width: 220px;
      height: 220px;
      background: #ecf5ff;
      bottom: -60px;
      left: 5%;
      animation-delay: -6s;
    }
    .orb-3 {
      width: 180px;
      height: 180px;
      background: #79bbff;
      top: 40%;
      left: 44%;
      animation-delay: -12s;
    }
  }

  &__inner {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 18px;
  }
  &__stats {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
}

.adm-logo {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(10px);
  border: 1.5px solid rgba(255, 255, 255, 0.38);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  flex-shrink: 0;
  animation: logoFloat 4s ease-in-out infinite;
}

.adm-title {
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -1px;
  color: #fff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.adm-sub {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.82);
  margin-top: 4px;
  font-weight: 400;
}

.stat-chip {
  background: rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 12px;
  padding: 13px 18px;
  min-width: 110px;
  text-align: center;
  animation: slideRight 0.5s ease-out both;
  transition: all 0.3s;
  cursor: default;

  &:hover {
    background: rgba(255, 255, 255, 0.32);
    transform: translateY(-4px);
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.12);
  }

  .chip-icon {
    display: block;
    font-size: 18px;
    opacity: 0.85;
    margin-bottom: 3px;
  }
  .chip-val {
    display: block;
    font-size: 24px;
    font-weight: 800;
    font-family: 'JetBrains Mono', monospace;
    margin: 3px 0;
  }
  .chip-lbl {
    display: block;
    font-size: 9px;
    opacity: 0.78;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
}

.adm-body {
  display: flex;
  flex: 1;
  width: 100%;
  min-height: 0;
  overflow: hidden;
}

.adm-sidebar {
  width: $sw;
  min-width: $sw;
  flex-shrink: 0;
  background: $bg-white;
  border-right: 1px solid $border;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 18px 11px 14px;
  box-shadow: 2px 0 8px rgba(64, 158, 255, 0.06);
}

.adm-nav {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;

  &__item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 12px;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    background: transparent;
    text-align: left;
    transition: background 0.18s;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%) scaleY(0);
      width: 3px;
      height: 50%;
      border-radius: 0 3px 3px 0;
      background: $blue;
      transition: transform 0.18s;
    }

    &:hover {
      background: $blue-bg;
      .adm-nav__icon {
        background: $blue-bg;
        color: $blue;
        border-color: $blue-l;
      }
      .adm-nav__lbl {
        color: $blue;
      }
    }

    &.is-active {
      background: $blue-bg;
      &::before {
        transform: translateY(-50%) scaleY(1);
      }
      .adm-nav__icon {
        background: $blue;
        color: #fff;
        box-shadow: 0 4px 12px rgba($blue, 0.32);
        border-color: $blue;
      }
      .adm-nav__lbl {
        color: $blue-d;
        font-weight: 700;
      }
    }
  }

  &__icon {
    width: 33px;
    height: 33px;
    border-radius: 8px;
    background: #f5f7fa;
    border: 1px solid $border;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    color: $text-secondary;
    flex-shrink: 0;
    transition: all 0.18s;
  }

  &__lbl {
    font-size: 13px;
    font-weight: 600;
    color: $text-regular;
    transition: color 0.18s;
    white-space: nowrap;
  }
}

.adm-sidebar__footer {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid $border;
}

.adm-user {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 10px 11px;
  border-radius: 10px;
  background: $blue-bg;
  border: 1px solid $blue-l;

  &__av {
    width: 33px;
    height: 33px;
    border-radius: 8px;
    background: linear-gradient(135deg, $blue-d, $blue);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: #fff;
    box-shadow: 0 3px 8px rgba($blue, 0.28);
    flex-shrink: 0;
  }
  &__name {
    display: block;
    font-size: 12px;
    font-weight: 700;
    color: $text-primary;
  }
  &__role {
    display: block;
    font-size: 10px;
    color: $blue;
    font-weight: 600;
  }
}

.adm-main {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: 30px 34px;
  background: $bg-page;
}

.adm-page {
  animation: fadeUp 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 22px;

  .page-accent {
    width: 4px;
    height: 26px;
    border-radius: 5px;
    flex-shrink: 0;
    background: linear-gradient(180deg, $blue-d, $blue);
    box-shadow: 0 3px 8px rgba($blue, 0.3);
  }
  .page-title {
    font-size: 21px;
    font-weight: 800;
    color: $text-primary;
    letter-spacing: -0.3px;
  }
}

.adm-toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 18px;
  flex-wrap: wrap;
  align-items: center;

  .adm-search {
    flex: 1;
    min-width: 230px;
    :deep(.el-input__wrapper) {
      background: $bg-white;
      border: 1.5px solid $border;
      border-radius: 10px;
      padding: 7px 12px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
      transition: all 0.2s;
      &:hover,
      &.is-focus {
        border-color: $blue;
        box-shadow: 0 3px 10px rgba($blue, 0.14);
      }
    }
  }

  .adm-select {
    min-width: 175px;
    :deep(.el-input__wrapper) {
      border-radius: 10px;
      background: $bg-white;
      border: 1.5px solid $border;
      transition: all 0.2s;
      &:hover {
        border-color: $blue;
      }
    }
  }

  .adm-reset-btn {
    background: $bg-white;
    border: 1.5px solid $border;
    color: $text-regular;
    border-radius: 10px;
    font-weight: 600;
    font-size: 13.5px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;
    &:hover {
      border-color: $blue;
      color: $blue;
      background: $blue-bg;
    }
  }
}

.tbl-wrap {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid $border;

  :deep(.el-table) {
    background: $bg-white;
    td {
      padding: 13px !important;
      border-color: #f0f2f5;
      color: $text-regular;
    }
    th {
      background: linear-gradient(180deg, #f5f7fa, #f0f2f5) !important;
      padding: 13px !important;
      font-weight: 700;
      color: $text-primary;
      border-color: $border;
      text-transform: uppercase;
      font-size: 10.5px;
      letter-spacing: 0.7px;
    }
    tbody tr {
      transition: background 0.12s;
      &:hover {
        background: $blue-bg !important;
      }
    }
  }

  .el-tag {
    border-radius: 6px;
    padding: 4px 10px;
    font-size: 12px;
    font-weight: 600;
    border: none;
  }
}

.settings-card {
  background: $bg-white;
  padding: 34px;
  border-radius: 16px;
  box-shadow: 0 2px 14px rgba(0, 0, 0, 0.05);
  border: 1px solid $border;
  max-width: 560px;
  position: relative;
  overflow: hidden;
  transition: all 0.28s;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, $blue-d, $blue, $blue-l);
  }
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 28px rgba($blue, 0.12);
    border-color: $blue-l;
  }

  .sc-icon {
    width: 50px;
    height: 50px;
    border-radius: 12px;
    background: linear-gradient(135deg, $blue-d, $blue);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    color: #fff;
    margin-bottom: 16px;
    box-shadow: 0 5px 14px rgba($blue, 0.28);
  }
  .sc-title {
    font-size: 18px;
    font-weight: 700;
    color: $text-primary;
    margin-bottom: 8px;
  }
  .sc-desc {
    font-size: 13.5px;
    color: $text-secondary;
    line-height: 1.6;
    margin-bottom: 22px;
  }
  .sc-btns {
    display: flex;
    gap: 11px;
    flex-wrap: wrap;
  }
  .sc-btn {
    flex: 1;
    min-width: 155px;
    background: $blue-bg;
    border: 1.5px solid $blue-l;
    color: $blue-d;
    padding: 12px 20px;
    border-radius: 10px;
    font-weight: 600;
    font-size: 13.5px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.22s;
    &:hover {
      background: $blue;
      color: #fff;
      border-color: $blue;
      transform: translateY(-2px);
      box-shadow: 0 6px 18px rgba($blue, 0.26);
    }
  }
}

@keyframes orbFloat {
  0%,
  100% {
    transform: translate(0, 0) rotate(0deg);
  }
  33% {
    transform: translate(-18px, -22px) rotate(5deg);
  }
  66% {
    transform: translate(10px, -8px) rotate(-4deg);
  }
}
@keyframes logoFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-7px);
  }
}
@keyframes slideRight {
  from {
    opacity: 0;
    transform: translateX(18px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1024px) {
  .adm-header {
    padding: 22px 24px 18px;
  }
  .adm-header__inner {
    flex-direction: column;
    align-items: flex-start;
  }
  .adm-header__stats {
    width: 100%;
    .stat-chip {
      flex: 1;
      min-width: 80px;
      padding: 11px;
    }
  }
  .adm-sidebar {
    width: 190px;
    min-width: 190px;
  }
  .adm-main {
    padding: 22px 20px;
  }
}

@media (max-width: 640px) {
  .admin-wrap {
    height: auto;
    overflow: auto;
  }
  .adm-body {
    flex-direction: column;
    overflow: visible;
    min-height: unset;
  }
  .adm-sidebar {
    width: 100%;
    min-width: unset;
    flex-shrink: 0;
    padding: 10px;
    overflow-x: auto;
    overflow-y: hidden;
    border-right: none;
    border-bottom: 1px solid $border;
    .adm-nav {
      flex-direction: row;
      flex: unset;
      gap: 6px;
      min-width: max-content;
    }
    .adm-nav__item {
      flex-direction: column;
      gap: 4px;
      padding: 8px 12px;
      min-width: 68px;
      &::before {
        display: none;
      }
      .adm-nav__lbl {
        font-size: 9.5px;
      }
    }
    .adm-sidebar__footer {
      display: none;
    }
  }
  .adm-main {
    overflow: visible;
    padding: 16px 12px;
  }
}
</style>
