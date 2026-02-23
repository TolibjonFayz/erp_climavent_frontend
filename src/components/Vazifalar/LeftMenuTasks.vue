<template>
  <div class="sidebar" :class="{ collapsed: isCollapsed }">
    <div class="sidebar-header">
      <div class="logo" v-show="!isCollapsed">
        <div class="logo-icon">
          <img src="../../assets/logo.png" alt="Logo img" />
        </div>
        <div class="logo-text">
          <h3>Climavent</h3>
          <span>{{ $t('sidebarLogo') }}</span>
        </div>
      </div>
      <button
        class="toggle-btn"
        @click="toggleSidebar"
        :title="isCollapsed ? $t('expandSidebar') : $t('collapseSidebar')"
      >
        <i class="toggle-icon" :class="{ rotated: isCollapsed }"></i>
      </button>
    </div>

    <nav class="sidebar-nav">
      <ul class="nav-list">
        <li class="nav-item">
          <a href="/" class="nav-link" :title="$t('mijozlarHamkorlarTitle')">
            <i class="icon places-icon"></i>
            <span class="nav-text">{{ $t('mijozlarHamkorlarText') }}</span>
          </a>
        </li>

        <li class="nav-item">
          <a href="/obyekt" class="nav-link" :title="$t('obyekt')">
            <i class="icon home-icon"></i>
            <span class="nav-text">{{ $t('obyekt') }}</span>
          </a>
        </li>

        <li class="nav-item">
          <a href="/raqiblar" class="nav-link" :title="$t('raqib')">
            <i class="icon oppenents-icon"></i>
            <span class="nav-text">{{ $t('raqibtext') }}</span>
          </a>
        </li>

        <li class="nav-item">
          <a href="/davomat" class="nav-link" :title="$t('davomat')">
            <i class="icon project-icon"></i>
            <span class="nav-text">{{ $t('davomat') }}</span>
          </a>
        </li>

        <li class="nav-item active">
          <a href="/tasks" class="nav-link" :title="$t('tasks')">
            <i class="icon tasks-icon"></i>
            <span class="nav-text">{{ $t('tasks') }}</span>
          </a>
        </li>

        <li class="nav-item">
          <a href="/settings" class="nav-link" :title="$t('settings')">
            <i class="icon calendar-icon"></i>
            <span class="nav-text">{{ $t('settings') }}</span>
          </a>
        </li>

        <li class="nav-item" v-if="usersStore?.currentUser?.is_admin">
          <a href="/admin" class="nav-link" :title="isCollapsed ? $t('admin') : ''">
            <i class="icon admin-icon"></i>
            <span class="nav-text">{{ $t('admin') }}</span>
          </a>
        </li>

        <li class="nav-item" v-if="usersStore?.currentUser?.is_admin">
          <a href="/boss" class="nav-link" :title="isCollapsed ? $t('boss') : ''">
            <i class="icon boss-icon"></i>
            <span class="nav-text">{{ $t('boss') }}</span>
          </a>
        </li>
      </ul>
    </nav>

    <!-- User Profile Section -->
    <div class="user-profile" v-loading="loading" v-show="!isCollapsed">
      <div class="user-avatar">
        <img
          v-if="usersStore?.currentUser?.profile_image == 'profile.jpg'"
          src="/user.png"
          alt="User profile"
        />
        <img v-else :src="usersStore?.currentUser?.profile_image" alt="User profile" />
        <div class="status-dot"></div>
      </div>
      <div class="user-info">
        <h4>{{ usersStore?.currentUser?.firstname }} {{ usersStore?.currentUser?.lastname }}</h4>
        <p>{{ usersStore?.currentUser?.username }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUsersStore } from '@/stores/user'
import { onMounted, ref, onUnmounted } from 'vue'

const usersStore = useUsersStore()
const loading = ref(false)
const isCollapsed = ref(false)

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
  localStorage.setItem('sidebarCollapsed', String(isCollapsed.value))
}

const handleResize = () => {
  if (window.innerWidth < 768) {
    isCollapsed.value = true
  }
}

onMounted(async () => {
  loading.value = true
  const userId = localStorage.getItem('userid')
  await usersStore.getUserInfo(Number(userId))

  // Restore sidebar state
  const saved = localStorage.getItem('sidebarCollapsed')
  if (saved !== null) {
    isCollapsed.value = saved === 'true'
  }

  // Auto-collapse on small screens
  handleResize()
  window.addEventListener('resize', handleResize)

  loading.value = false
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
.sidebar {
  width: 310px;
  height: 100vh;
  background: #f8f9fb;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;

  &.collapsed {
    width: 80px;

    .logo-text {
      display: none;
    }

    .nav-text {
      display: none;
    }

    .user-info {
      display: none;
    }

    .toggle-icon {
      transform: rotate(180deg);
    }
  }
}

.sidebar-header {
  padding: 24px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e7eb;
  transition: padding 0.3s ease;

  .sidebar.collapsed & {
    padding: 16px 10px;
    justify-content: center;
  }
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  transition: opacity 0.3s ease;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #409eff 0%, #409eff 100%);
  border-radius: 12px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  img {
    width: 28px;
    height: 28px;
    object-fit: contain;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
    background: white;
    z-index: 1;
  }

  &::after {
    content: '';
    position: absolute;
    top: 8px;
    left: 8px;
    width: 24px;
    height: 24px;
    background: white;
    border-radius: 6px;
    opacity: 0.9;
    z-index: 0;
  }
}

.logo-text {
  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
    line-height: 1.2;
  }

  span {
    font-size: 13px;
    color: #6b7280;
    line-height: 1.2;
  }
}

.toggle-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;

  &:hover {
    background: #f3f4f6;
  }
}

.toggle-icon {
  width: 16px;
  height: 16px;
  border-right: 2px solid #6b7280;
  border-bottom: 2px solid #6b7280;
  transform: rotate(-45deg);
  transition: transform 0.3s ease;
}

.sidebar-nav {
  flex: 1;
  padding: 16px 0;
  overflow-y: auto;
  transition: padding 0.3s ease;
}

.nav-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-item {
  margin: 0 16px 4px;
  transition: margin 0.3s ease;

  .sidebar.collapsed & {
    margin: 0 8px 4px;
  }

  &.active {
    .nav-link {
      background: #409eff;
      color: white;

      .icon {
        color: white;
      }

      .chevron-down {
        border-color: white;
      }
    }
  }
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  text-decoration: none;
  color: #6b7280;
  border-radius: 12px;
  transition: all 0.2s ease;
  position: relative;

  &:hover:not(.active) {
    background: #f3f4f6;
    color: #374151;
  }

  .nav-text {
    flex: 1;
    font-size: 15px;
    font-weight: 500;
    margin-left: 12px;
    transition: display 0.3s ease;
  }
}

.icon {
  width: 20px;
  height: 20px;
  position: relative;
  color: #9ca3af;
  font-style: normal;
  flex-shrink: 0;

  &.home-icon::before {
    content: '📍';
    font-size: 16px;
  }

  &.project-icon::before {
    content: '⚡';
    font-size: 16px;
  }

  &.tasks-icon::before {
    content: '✅';
    font-size: 16px;
  }

  &.oppenents-icon::before {
    content: '⚔️';
    font-size: 16px;
  }

  &.places-icon::before {
    content: '🏬';
    font-size: 16px;
  }

  &.calendar-icon::before {
    content: '⚙️';
    font-size: 16px;
  }

  &.admin-icon::before {
    content: '🧠';
    font-size: 16px;
  }

  &.boss-icon::before {
    content: '🦾';
    font-size: 16px;
  }
}

.chevron-down {
  width: 8px;
  height: 8px;
  border-right: 2px solid #9ca3af;
  border-bottom: 2px solid #9ca3af;
  transform: rotate(45deg);
  margin-left: auto;
}

/* User Profile Section */
.user-profile {
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  background: white;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    background: #f9fafb;
  }
}

.user-avatar {
  position: relative;
  flex-shrink: 0;

  img {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #e5e7eb;
  }

  .status-dot {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 10px;
    height: 10px;
    background: #10b981;
    border: 2px solid white;
    border-radius: 50%;
  }
}

.user-info {
  flex: 1;
  min-width: 0;

  h4 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: #1f2937;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  p {
    margin: 2px 0 0;
    font-size: 13px;
    color: #6b7280;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

// Scrollbar styling
.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;

  &:hover {
    background: #9ca3af;
  }
}
</style>
