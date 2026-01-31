<template>
  <div class="admin-container" v-loading="loading">
    <!-- Header with Gradient Background -->
    <div class="admin-header-wrapper">
      <div class="admin-header-bg">
        <div class="floating-orb orb-1"></div>
        <div class="floating-orb orb-2"></div>
        <div class="floating-orb orb-3"></div>
      </div>
      <div class="admin-header">
        <div class="header-content">
          <div class="header-icon">
            <div class="icon-circle">
              <i class="el-icon-management"></i>
            </div>
          </div>
          <div class="header-text">
            <h1 class="admin-title">Admin Panel</h1>
            <p class="admin-subtitle">
              Tizim boshqaruvchisining paneli • Barcha ma'lumotlar bir joyda
            </p>
          </div>
        </div>
        <div class="header-stats">
          <div class="stat-badge" style="animation-delay: 0.1s">
            <div class="stat-icon">
              <i class="el-icon-user"></i>
            </div>
            <span class="badge-value">{{ totalPartners }}</span>
            <span class="badge-label">Hamkorlar</span>
          </div>
          <div class="stat-badge" style="animation-delay: 0.2s">
            <div class="stat-icon">
              <i class="el-icon-office-building"></i>
            </div>
            <span class="badge-value">{{ totalObjects }}</span>
            <span class="badge-label">Obyektlar</span>
          </div>
          <div class="stat-badge" style="animation-delay: 0.3s">
            <div class="stat-icon">
              <i class="el-icon-s-custom"></i>
            </div>
            <span class="badge-value">{{ totalUsers }}</span>
            <span class="badge-label">Foydalanuvchilar</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs Navigation -->
    <el-tabs v-model="activeTab" class="admin-tabs">
      <el-tab-pane name="users">
        <template #label>
          <span class="tab-label">
            <i class="el-icon-user"></i>
            Foydalanuvchilar
          </span>
        </template>
        <div class="tab-content">
          <div class="section-header">
            <div class="section-title-wrapper">
              <div class="title-accent"></div>
              <h2>Barcha foydalanuvchilar</h2>
            </div>
          </div>

          <div class="table-container" v-loading="usersLoading">
            <el-table :data="filteredUsersList" stripe border style="width: 100%">
              <el-table-column prop="id" label="ID" width="75" />
              <el-table-column prop="username" label="Foydalanuvchi nomi" min-width="150" />
              <el-table-column prop="first_name" label="Ismi" min-width="150" />
              <el-table-column prop="last_name" label="Familiyasi" min-width="150" />
              <el-table-column prop="phone" label="Telefon" min-width="200" />
              <el-table-column prop="email" label="Email" min-width="200" />
              <el-table-column prop="role" label="Rol" width="120">
                <template #default="{ row }">
                  <el-tag :type="row.role === 'admin' ? 'danger' : 'success'">
                    {{ row.role }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane name="partners">
        <template #label>
          <span class="tab-label">
            <i class="el-icon-data-analysis"></i>
            Hamkorlar
          </span>
        </template>
        <div class="tab-content">
          <div class="section-header">
            <div class="section-title-wrapper">
              <div class="title-accent"></div>
              <h2>Hamkorlar va mijozlar</h2>
            </div>
          </div>

          <div class="toolbar">
            <el-input
              v-model="partnersSearchQuery"
              placeholder="Qidiruv (nomi, telefon, email)..."
              :prefix-icon="Search"
              clearable
              class="search-input"
            />
            <el-select
              v-model="partnersFilterType"
              placeholder="Turi bo'yicha filter"
              clearable
              class="filter-select"
            >
              <el-option label="Doimiy mijoz" value="Doimiy mijoz" />
              <el-option label="Montajnik" value="Montajnik" />
              <el-option label="Quruvchi" value="Quruvchi" />
            </el-select>
            <el-button @click="handleResetPartnersFilter" class="reset-btn">
              <i class="el-icon-refresh-left"></i>
              Tozalash
            </el-button>
          </div>

          <div class="table-container" v-loading="partnersLoading">
            <el-table :data="filteredPartnersList" stripe border style="width: 100%">
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="type" label="Turi" min-width="130">
                <template #default="{ row }">
                  <el-tag>{{ row.type }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="who" label="Kim qo'shgan" min-width="130" />
              <el-table-column prop="name" label="Nomi" min-width="130" />
              <el-table-column prop="phone" label="Telefon" min-width="130" />
              <el-table-column prop="addphone" label="Qo'shimcha telefon" min-width="130" />
              <el-table-column prop="address" label="Manzil" min-width="130" />
              <el-table-column prop="yorjshaxs" label="Yuridik / Jismoniy" min-width="100" />
              <el-table-column prop="inn" label="Inn" min-width="100" />
            </el-table>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane name="objects">
        <template #label>
          <span class="tab-label">
            <i class="el-icon-data-analysis"></i>
            Obyektlar
          </span>
        </template>
        <div class="tab-content">
          <div class="section-header">
            <div class="section-title-wrapper">
              <div class="title-accent"></div>
              <h2>Obyektlar</h2>
            </div>
          </div>

          <div class="toolbar">
            <el-input
              v-model="objectsSearchQuery"
              placeholder="Qidiruv (firma)..."
              :prefix-icon="Search"
              clearable
              class="search-input"
            />
            <el-button @click="handleResetObjectsFilter" class="reset-btn">
              <i class="el-icon-refresh-left"></i>
              Tozalash
            </el-button>
          </div>

          <div class="table-container" v-loading="objectsLoading">
            <el-table :data="filteredObjectsList" stripe border style="width: 100%">
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="where" label="Qayerga" min-width="130">
                <template #default="{ row }">
                  <el-tag>{{ row.where }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="who" label="Kim qo'shgan" min-width="130" />
              <el-table-column prop="gonetime" label="Ketilgan vaqt" min-width="130" />
              <el-table-column prop="cametime" label="Qaytilgan vaqt" min-width="130" />
              <el-table-column prop="dogovororkp" label="Dogovor yoki KP" min-width="130" />
              <el-table-column prop="address" label="Manzil" min-width="130" />
              <el-table-column prop="firmanomi" label="Firma nomi" min-width="130" />
              <el-table-column
                prop="createdtime"
                label="Ma'lumotlar kiritilgan vaqt"
                min-width="130"
              />
            </el-table>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane name="settings">
        <template #label>
          <span class="tab-label">
            <i class="el-icon-setting"></i>
            Sozlamalar
          </span>
        </template>
        <div class="tab-content">
          <div class="settings-section">
            <div class="section-title-wrapper">
              <div class="title-accent"></div>
              <h2 class="section-title">Tizim sozlamalari</h2>
            </div>

            <!-- Export Data -->
            <div class="settings-card">
              <div class="card-icon">
                <i class="el-icon-download"></i>
              </div>
              <h3>Ma'lumotlarni eksport qilish</h3>
              <p class="setting-description">Barcha ma'lumotlarni EXCEL formatida yuklab olish</p>
              <div class="export-buttons">
                <el-button @click="handleExportPartners" class="export-btn">
                  <i class="el-icon-user"></i>
                  Hamkorlar
                </el-button>
                <el-button @click="handleExportObjects" class="export-btn">
                  <i class="el-icon-office-building"></i>
                  Obyektlar
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { Search } from '@element-plus/icons-vue'
import { ref, computed, onMounted } from 'vue'
import { useUsersStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const usersStore = useUsersStore()
const activeTab = ref('users')
const loading = ref(false)
const usersLoading = ref(false)
const partnersLoading = ref(false)
const objectsLoading = ref(false)

const partnersSearchQuery = ref('')
const partnersFilterType = ref('')
const objectsSearchQuery = ref('')

const usersList = ref([
  {
    id: 1,
    username: 'admin',
    first_name: 'Admin',
    last_name: 'User',
    email: 'admin@climavent.com',
    phone: '+998901234567',
    role: 'admin',
  },
  {
    id: 2,
    username: 'john_doe',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@climavent.com',
    phone: '+998901234568',
    role: 'user',
  },
  {
    id: 3,
    username: 'jane_smith',
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane@climavent.com',
    phone: '+998901234569',
    role: 'user',
  },
])

const partnersList = ref([
  {
    id: 1,
    name: 'Toshkent Qurilish',
    phone: '+998901234567',
    addphone: '+998901234567',
    type: 'Quruvchi',
    address: 'Toshkent, Yunusabad tumani',
    who: 'Admin',
    yorjshaxs: 'Yuridik',
    inn: '123456789',
  },
  {
    id: 2,
    name: 'Samarqand Montaj',
    phone: '+998902345678',
    addphone: '+998902345678',
    type: 'Montajnik',
    address: "Samarqand, Registon ko'chasi",
    who: 'Admin',
    yorjshaxs: 'Yuridik',
    inn: '987654321',
  },
  {
    id: 3,
    name: 'Bukhoro Mijoz',
    phone: '+998903456789',
    addphone: '+998903456789',
    type: 'Doimiy mijoz',
    address: "Buxoro, Ark ko'chasi",
    who: 'Admin',
    yorjshaxs: 'Jismoniy',
    inn: '456789123',
  },
])

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

// Statistics computed values
const totalUsers = computed(() => usersList.value.length)
const totalPartners = computed(() => partnersList.value.length)
const totalObjects = computed(() => objectsList.value.length)

// Filtered Users
const filteredUsersList = computed(() => {
  return usersList.value
})

// Filtered Partners
const filteredPartnersList = computed(() => {
  return partnersList.value.filter((partner) => {
    const matchesSearch =
      !partnersSearchQuery.value ||
      partner.name.toLowerCase().includes(partnersSearchQuery.value.toLowerCase()) ||
      partner.phone.includes(partnersSearchQuery.value)

    const matchesType = !partnersFilterType.value || partner.type === partnersFilterType.value

    return matchesSearch && matchesType
  })
})

// Filtered Objects
const filteredObjectsList = computed(() => {
  return objectsList.value.filter((object) => {
    const matchesSearch =
      !objectsSearchQuery.value ||
      object.firmanomi.toLowerCase().includes(objectsSearchQuery.value.toLowerCase())

    return matchesSearch
  })
})

// Load all data
const loadAllData = async () => {
  try {
    loading.value = true
    await new Promise((resolve) => setTimeout(resolve, 500))
  } catch (error) {
    ElMessage.error("Ma'lumotlarni yuklash xatosi: " + error.message)
  } finally {
    loading.value = false
  }
}

// Filter reset handlers
const handleResetPartnersFilter = () => {
  partnersSearchQuery.value = ''
  partnersFilterType.value = ''
}

const handleResetObjectsFilter = () => {
  objectsSearchQuery.value = ''
}

// Export handlers
const handleExportPartners = () => {
  ElMessage.success('Hamkorlar eksport qilindi!')
}

const handleExportObjects = () => {
  ElMessage.success('Obyektlar eksport qilindi!')
}

// Mount
onMounted(async () => {
  await usersStore.getUserInfo(Number(localStorage.getItem('userid')))
  loadAllData()
})
</script>

<style lang="scss" scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');

.admin-container {
  padding: 0;
  background:
    radial-gradient(circle at 20% 50%, rgba(64, 158, 255, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(103, 194, 58, 0.03) 0%, transparent 50%),
    linear-gradient(135deg, #f8f9fb 0%, #e8ecf1 100%);
  min-height: 100vh;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: 'Outfit', sans-serif;
  position: relative;

  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image:
      linear-gradient(rgba(64, 158, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(64, 158, 255, 0.03) 1px, transparent 1px);
    background-size: 60px 60px;
    pointer-events: none;
    z-index: 0;
  }

  // Header Wrapper with Gradient
  .admin-header-wrapper {
    position: relative;
    background: linear-gradient(135deg, #409eff 0%, #3a8ee6 50%, #3680d9 100%);
    padding: 60px 40px 50px;
    color: white;
    overflow: hidden;
    flex-shrink: 0;
    box-shadow: 0 10px 40px rgba(64, 158, 255, 0.2);

    .admin-header-bg {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      overflow: hidden;

      .floating-orb {
        position: absolute;
        border-radius: 50%;
        filter: blur(60px);
        opacity: 0.3;
        animation: float 20s infinite ease-in-out;

        &.orb-1 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.6) 0%, transparent 70%);
          top: -100px;
          right: -100px;
          animation-delay: 0s;
        }

        &.orb-2 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.5) 0%, transparent 70%);
          bottom: -50px;
          left: 10%;
          animation-delay: -7s;
        }

        &.orb-3 {
          width: 250px;
          height: 250px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 70%);
          top: 50%;
          left: 50%;
          animation-delay: -14s;
        }
      }
    }

    .admin-header {
      position: relative;
      z-index: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-content {
        display: flex;
        align-items: center;
        gap: 24px;

        .header-icon {
          .icon-circle {
            width: 72px;
            height: 72px;
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(10px);
            border: 2px solid rgba(255, 255, 255, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
            animation: float 3s infinite ease-in-out;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          }
        }

        .header-text {
          .admin-title {
            font-size: 42px;
            font-weight: 800;
            margin: 0;
            letter-spacing: -1.5px;
            background: linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .admin-subtitle {
            font-size: 15px;
            margin: 10px 0 0 0;
            opacity: 0.85;
            font-weight: 400;
            letter-spacing: 0.5px;
          }
        }
      }

      .header-stats {
        display: flex;
        gap: 16px;

        .stat-badge {
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(20px);
          padding: 20px 24px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          text-align: center;
          min-width: 140px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          animation: slideInFromRight 0.6s ease-out both;
          position: relative;
          overflow: hidden;

          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
            transition: left 0.5s;
          }

          &:hover {
            transform: translateY(-4px);
            background: rgba(255, 255, 255, 0.18);
            border-color: rgba(255, 255, 255, 0.3);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);

            &::before {
              left: 100%;
            }
          }

          .stat-icon {
            font-size: 24px;
            margin-bottom: 8px;
            opacity: 0.9;
          }

          .badge-value {
            display: block;
            font-size: 32px;
            font-weight: 800;
            font-family: 'Space Mono', monospace;
            margin: 8px 0;
          }

          .badge-label {
            display: block;
            font-size: 11px;
            opacity: 0.8;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
        }
      }
    }
  }

  // Tabs
  .admin-tabs {
    margin: 30px;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
    flex: 1;
    display: flex;
    flex-direction: column;
    background: white;
    position: relative;
    z-index: 1;

    :deep(.el-tabs__header) {
      background: white;
      border-bottom: 2px solid #f1f3f9;
      padding: 0 30px;
      margin: 0;
      flex-shrink: 0;
    }

    :deep(.el-tabs__nav-wrap::after) {
      display: none;
    }

    :deep(.el-tabs__active-bar) {
      background: linear-gradient(90deg, #409eff 0%, #3a8ee6 100%);
      height: 3px;
      border-radius: 3px 3px 0 0;
    }

    :deep(.el-tabs__item) {
      color: #64748b;
      font-weight: 600;
      padding: 0 28px;
      font-size: 15px;
      transition: all 0.3s;

      &:hover {
        color: #409eff;
      }

      &.is-active {
        color: #409eff;
      }
    }

    :deep(.el-tabs__content) {
      background: white;
      padding: 36px;
      border-radius: 0 0 20px 20px;
      flex: 1;
      overflow-y: auto;
    }

    .tab-label {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 15px;

      i {
        font-size: 18px;
      }
    }
  }

  .tab-content {
    animation: fadeSlideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    width: 100%;
  }

  // Section Headers
  .section-header {
    margin-bottom: 30px;

    .section-title-wrapper {
      display: flex;
      align-items: center;
      gap: 16px;

      .title-accent {
        width: 5px;
        height: 36px;
        background: linear-gradient(180deg, #409eff 0%, #3a8ee6 100%);
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
      }

      h2 {
        margin: 0;
        font-size: 28px;
        font-weight: 700;
        color: #1e293b;
        letter-spacing: -0.5px;
      }
    }
  }

  // Toolbar
  .toolbar {
    display: flex;
    gap: 14px;
    margin-bottom: 28px;
    flex-wrap: wrap;
    align-items: center;

    .search-input {
      flex: 1;
      min-width: 280px;

      :deep(.el-input__wrapper) {
        background: #f8f9fb;
        border: 2px solid transparent;
        border-radius: 12px;
        padding: 8px 16px;
        transition: all 0.3s;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

        &:hover {
          border-color: #409eff;
          background: white;
        }

        &.is-focus {
          border-color: #409eff;
          background: white;
          box-shadow: 0 4px 16px rgba(64, 158, 255, 0.15);
        }
      }
    }

    .filter-select {
      min-width: 200px;

      :deep(.el-input__wrapper) {
        border-radius: 12px;
        background: #f8f9fb;
        border: 2px solid transparent;
        transition: all 0.3s;

        &:hover {
          border-color: #409eff;
          background: white;
        }
      }
    }

    .reset-btn {
      background: white;
      border: 2px solid #e2e8f0;
      color: #64748b;
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: 600;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      gap: 8px;

      &:hover {
        border-color: #409eff;
        color: #409eff;
        background: #ecf5ff;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
      }

      i {
        font-size: 16px;
      }
    }
  }

  // Table Container
  .table-container {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
    border: 1px solid #f1f3f9;

    :deep(.el-table) {
      background: white;

      td {
        padding: 18px 16px !important;
        border-color: #f1f3f9;
      }

      th {
        background: linear-gradient(180deg, #f8f9fb 0%, #f1f3f9 100%) !important;
        padding: 18px 16px !important;
        font-weight: 700;
        color: #1e293b;
        border-color: #e2e8f0;
        text-transform: uppercase;
        font-size: 12px;
        letter-spacing: 0.5px;

        .cell {
          display: flex;
          align-items: center;
          gap: 6px;
        }
      }

      tbody tr {
        transition: all 0.2s;

        &:hover {
          background: #f8f9fb !important;
          transform: scale(1.001);
        }
      }
    }

    .el-tag {
      border-radius: 8px;
      padding: 6px 14px;
      font-size: 13px;
      font-weight: 600;
      border: none;
    }
  }

  // Settings Section
  .settings-section {
    display: grid;
    gap: 32px;

    .section-title-wrapper {
      display: flex;
      align-items: center;
      gap: 16px;

      .title-accent {
        width: 5px;
        height: 32px;
        background: linear-gradient(180deg, #409eff 0%, #3a8ee6 100%);
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
      }

      .section-title {
        margin: 0;
        font-size: 28px;
        font-weight: 700;
        color: #1e293b;
        letter-spacing: -0.5px;
      }
    }

    .settings-card {
      background: linear-gradient(135deg, #ffffff 0%, #f8f9fb 100%);
      padding: 36px;
      border-radius: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
      border: 2px solid #f1f3f9;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 4px;
        background: linear-gradient(90deg, #409eff 0%, #3a8ee6 50%, #10b981 100%);
      }

      &:hover {
        box-shadow: 0 12px 48px rgba(0, 0, 0, 0.1);
        transform: translateY(-4px);
      }

      .card-icon {
        width: 64px;
        height: 64px;
        border-radius: 16px;
        background: linear-gradient(135deg, #409eff 0%, #3a8ee6 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        color: white;
        margin-bottom: 24px;
        box-shadow: 0 8px 24px rgba(64, 158, 255, 0.3);
      }

      h3 {
        margin: 0 0 12px 0;
        font-size: 22px;
        font-weight: 700;
        color: #1e293b;
      }

      .setting-description {
        margin: 0 0 28px 0;
        color: #64748b;
        font-size: 15px;
        line-height: 1.6;
      }

      .export-buttons {
        display: flex;
        gap: 14px;
        flex-wrap: wrap;

        .export-btn {
          flex: 1;
          min-width: 180px;
          background: white;
          border: 2px solid #e2e8f0;
          color: #1e293b;
          padding: 16px 28px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 15px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;

          i {
            font-size: 18px;
          }

          &:hover {
            background: linear-gradient(135deg, #409eff 0%, #3a8ee6 100%);
            color: white;
            border-color: transparent;
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(64, 158, 255, 0.3);
          }
        }
      }
    }
  }
}

// Animations
@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInFromRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  25% {
    transform: translateY(-20px) rotate(5deg);
  }
  50% {
    transform: translateY(0) rotate(0deg);
  }
  75% {
    transform: translateY(-10px) rotate(-5deg);
  }
}

// Responsive Design
@media (max-width: 1024px) {
  .admin-container {
    .admin-header-wrapper {
      padding: 40px 30px;

      .admin-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 24px;

        .header-stats {
          width: 100%;
          gap: 12px;

          .stat-badge {
            flex: 1;
            min-width: auto;
          }
        }
      }
    }

    .admin-tabs {
      margin: 20px;
    }
  }
}

@media (max-width: 768px) {
  .admin-container {
    .admin-header-wrapper {
      padding: 30px 20px;

      .admin-header {
        .header-content {
          gap: 16px;

          .header-icon .icon-circle {
            width: 56px;
            height: 56px;
            font-size: 28px;
          }

          .header-text {
            .admin-title {
              font-size: 28px;
            }
          }
        }

        .header-stats {
          width: 100%;
          flex-wrap: wrap;
        }
      }
    }

    .admin-tabs {
      margin: 15px;
      :deep(.el-tabs__item) {
        padding: 0 14px;
        font-size: 13px;
      }
    }

    .settings-section {
      gap: 20px;

      .settings-card {
        padding: 24px;

        .export-buttons .export-btn {
          min-width: 100%;
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .admin-container {
    .admin-header-wrapper {
      padding: 24px 16px;

      .admin-header {
        .header-content {
          .header-text .admin-title {
            font-size: 24px;
          }
        }

        .header-stats {
          .stat-badge {
            padding: 16px;

            .badge-value {
              font-size: 24px;
            }

            .badge-label {
              font-size: 10px;
            }
          }
        }
      }
    }

    .admin-tabs {
      margin: 12px;
      :deep(.el-tabs__item) {
        padding: 0 10px;
        font-size: 12px;
      }
    }
  }
}
</style>
