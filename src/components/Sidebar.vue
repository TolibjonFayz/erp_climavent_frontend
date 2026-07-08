<template>
  <!-- Mobil hamburger tugmasi: faqat mobilda, drawer yopiq bo'lganda -->
  <button
    v-if="isMobile && !isMobileOpen"
    class="mobile-toggle"
    @click="openMobile"
    :aria-label="$t('expandSidebar')"
  >
    <span></span>
    <span></span>
    <span></span>
  </button>

  <!-- Mobil overlay: drawer ochilganda orqa fonni qoraytiradi -->
  <transition name="overlay-fade">
    <div v-if="isMobile && isMobileOpen" class="sidebar-overlay" @click="closeMobile"></div>
  </transition>

  <aside
    class="sidebar"
    :class="{
      collapsed: showCollapsed,
      'is-mobile': isMobile,
      'mobile-open': isMobileOpen,
    }"
  >
    <div class="sidebar-header">
      <div class="logo" v-show="!showCollapsed">
        <div class="logo-icon">
          <img src="../assets/logo.png" alt="Logo img" />
        </div>
        <div class="logo-text">
          <h3>Climavent</h3>
          <span>{{ $t('sidebarLogo') }}</span>
        </div>
      </div>

      <button
        class="toggle-btn"
        @click="toggleCollapsed"
        :title="isCollapsed ? $t('expandSidebar') : $t('collapseSidebar')"
      >
        <!-- Mobilda yopish (X), desktopda collapse chevron -->
        <span v-if="isMobile" class="close-icon"></span>
        <i v-else class="toggle-icon" :class="{ rotated: isCollapsed }"></i>
      </button>
    </div>

    <nav class="sidebar-nav">
      <ul class="nav-list">
        <li
          v-for="menu in visibleMenus"
          :key="menu.key"
          class="nav-item"
          :class="{ active: props.activePath === menu.key }"
        >
          <a :href="menu.href" class="nav-link" :title="$t(menu.title)" @click="closeMobile">
            <i class="icon" :class="menu.icon"></i>
            <span class="nav-text">{{ $t(menu.text) }}</span>
          </a>
        </li>
      </ul>
    </nav>

    <!-- Foydalanuvchi profili -->
    <div class="user-profile" v-loading="loading" v-show="!showCollapsed">
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
  </aside>
</template>

<script setup lang="ts">
import { useUsersStore } from '@/stores/user'
import { onMounted, ref, computed } from 'vue'
import { useSidebar } from '@/composables/useSidebar'

const props = defineProps({
  activePath: {
    type: String,
    required: true,
  },
})

const usersStore = useUsersStore()
const loading = ref(false)

const { isCollapsed, isMobile, isMobileOpen, toggleCollapsed, openMobile, closeMobile } =
  useSidebar()

// Collapse ko'rinishini faqat desktopda qo'llaymiz (mobilda to'liq drawer)
const showCollapsed = computed(() => isCollapsed.value && !isMobile.value)

const menus = computed(() => [
  {
    key: 'mijozlar',
    href: '/',
    icon: 'places-icon',
    title: 'mijozlarHamkorlarTitle',
    text: 'mijozlarHamkorlarText',
    show: true,
  },
  {
    key: 'obyekt',
    href: '/obyekt',
    icon: 'home-icon',
    title: 'obyekt',
    text: 'obyekt',
    show: true,
  },
  {
    key: 'raqiblar',
    href: '/raqiblar',
    icon: 'oppenents-icon',
    title: 'raqib',
    text: 'raqibtext',
    show: true,
  },
  {
    key: 'davomat',
    href: '/davomat',
    icon: 'project-icon',
    title: 'davomat',
    text: 'davomat',
    show: true,
  },
  {
    key: 'tasks',
    href: '/tasks',
    icon: 'tasks-icon',
    title: 'tasks',
    text: 'tasks',
    show: true,
  },
  {
    key: 'settings',
    href: '/settings',
    icon: 'calendar-icon',
    title: 'settings',
    text: 'settings',
    show: true,
  },
  {
    key: 'admin',
    href: '/admin',
    icon: 'admin-icon',
    title: 'admin',
    text: 'admin',
    show: usersStore?.currentUser?.is_admin,
  },
  {
    key: 'boss',
    href: '/boss',
    icon: 'boss-icon',
    title: 'boss',
    text: 'boss',
    show: Number(usersStore?.currentUser?.id) === 16,
  },
])

const visibleMenus = computed(() => menus.value.filter((m) => m.show))

onMounted(async () => {
  loading.value = true
  const userId = localStorage.getItem('userid')
  await usersStore.getUserInfo(Number(userId))
  loading.value = false
})
</script>

<style lang="scss" scoped>
$expanded: 280px;
$collapsed: 82px;
$accent: #409eff;
$accent-dark: #2f7fe0;

.sidebar {
  width: $expanded;
  height: 100vh;
  background: #ffffff;
  border-right: 1px solid #eef0f4;
  box-shadow: 2px 0 12px rgba(17, 24, 39, 0.04);
  display: flex;
  flex-direction: column;
  transition:
    width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;

  &.collapsed {
    width: $collapsed;

    .logo-text,
    .nav-text,
    .user-info {
      display: none;
    }

    .nav-link {
      justify-content: center;
      padding: 12px;
    }

    .toggle-icon {
      transform: rotate(135deg);
    }
  }
}

/* Mobil drawer rejimi: ekrandan tashqarida turadi, ochilganda sirg'alib chiqadi */
.sidebar.is-mobile {
  width: 84vw;
  max-width: 320px;
  transform: translateX(-105%);
  box-shadow: 4px 0 24px rgba(17, 24, 39, 0.18);

  &.mobile-open {
    transform: translateX(0);
  }
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(2px);
  z-index: 999;
}

.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.3s ease;
}
.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}

/* Mobil hamburger tugmasi (drawer yopiqligida) */
.mobile-toggle {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 998;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 4px 14px rgba(17, 24, 39, 0.12);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;

  span {
    display: block;
    width: 20px;
    height: 2px;
    border-radius: 2px;
    background: #374151;
  }
}

.sidebar-header {
  padding: 22px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #eef0f4;
  transition: padding 0.3s ease;

  .sidebar.collapsed & {
    padding: 18px 0;
    justify-content: center;
  }
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #5eb0ff 0%, $accent 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.28);

  img {
    width: 26px;
    height: 26px;
    object-fit: contain;
    border-radius: 6px;
    background: white;
  }
}

.logo-text {
  min-width: 0;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #111827;
    line-height: 1.2;
  }

  span {
    font-size: 12.5px;
    color: #6b7280;
    line-height: 1.2;
  }
}

.toggle-btn {
  background: #f3f5f9;
  border: none;
  cursor: pointer;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s ease;

  &:hover {
    background: #e6ebf3;
  }
}

.toggle-icon {
  width: 9px;
  height: 9px;
  border-left: 2px solid #6b7280;
  border-bottom: 2px solid #6b7280;
  transform: rotate(45deg);
  margin-left: 3px;
  transition: transform 0.3s ease;
}

.close-icon {
  position: relative;
  width: 16px;
  height: 16px;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    width: 16px;
    height: 2px;
    background: #6b7280;
    border-radius: 2px;
  }
  &::before {
    transform: rotate(45deg);
  }
  &::after {
    transform: rotate(-45deg);
  }
}

.sidebar-nav {
  flex: 1;
  padding: 14px 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.nav-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-item {
  margin: 0 14px 6px;

  .sidebar.collapsed & {
    margin: 0 12px 6px;
  }
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  text-decoration: none;
  color: #4b5563;
  border-radius: 12px;
  transition:
    background 0.2s ease,
    color 0.2s ease;
  position: relative;

  &:hover {
    background: #eef5ff;
    color: #1f2937;
  }

  .nav-text {
    flex: 1;
    min-width: 0;
    font-size: 14.5px;
    font-weight: 500;
    margin-left: 12px;
    white-space: normal;
    line-height: 1.25;
    word-break: break-word;
  }
}

.nav-item.active .nav-link {
  background: linear-gradient(135deg, $accent 0%, $accent-dark 100%);
  color: #fff;
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.35);

  .icon {
    filter: none;
  }
}

.icon {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-style: normal;
  flex-shrink: 0;

  &.home-icon::before {
    content: '📍';
  }
  &.project-icon::before {
    content: '⚡';
  }
  &.tasks-icon::before {
    content: '✅';
  }
  &.oppenents-icon::before {
    content: '⚔️';
  }
  &.places-icon::before {
    content: '🏬';
  }
  &.calendar-icon::before {
    content: '⚙️';
  }
  &.admin-icon::before {
    content: '🧠';
  }
  &.boss-icon::before {
    content: '🦾';
  }

  &::before {
    font-size: 17px;
    line-height: 1;
  }
}

/* Foydalanuvchi profili */
.user-profile {
  padding: 14px 18px;
  margin: 0 12px 12px;
  border-radius: 14px;
  background: #f7f9fc;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: background 0.2s ease;
  cursor: pointer;

  &:hover {
    background: #eef2f8;
  }
}

.user-avatar {
  position: relative;
  flex-shrink: 0;

  img {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #fff;
    box-shadow: 0 2px 6px rgba(17, 24, 39, 0.1);
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
    font-size: 14.5px;
    font-weight: 600;
    color: #111827;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  p {
    margin: 2px 0 0;
    font-size: 12.5px;
    color: #6b7280;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

/* Scrollbar */
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
