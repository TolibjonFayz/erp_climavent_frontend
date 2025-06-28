<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <div class="logo">
        <div class="logo-icon">
          <img src="../../assets/logo.png" alt="Logo img" />
        </div>
        <div class="logo-text">
          <h3>Climavent</h3>
          <span>Xodimlar uchun</span>
        </div>
      </div>
      <button class="back-btn">
        <i class="arrow-left"></i>
      </button>
    </div>

    <nav class="sidebar-nav">
      <ul class="nav-list">
        <li class="nav-item">
          <a href="#" class="nav-link">
            <i class="icon home-icon"></i>
            <span>Dashboard</span>
          </a>
        </li>

        <li class="nav-item active">
          <a href="#" class="nav-link">
            <i class="icon project-icon"></i>
            <span>Project</span>
            <i class="chevron-down"></i>
          </a>
        </li>

        <li class="nav-item">
          <a href="#" class="nav-link">
            <i class="icon client-icon"></i>
            <span>Client</span>
            <i class="chevron-down"></i>
          </a>
        </li>

        <li class="nav-item">
          <a href="#" class="nav-link">
            <i class="icon board-icon"></i>
            <span>Board</span>
          </a>
        </li>

        <li class="nav-item">
          <a href="#" class="nav-link">
            <i class="icon calendar-icon"></i>
            <span>Calendar</span>
          </a>
        </li>

        <li class="nav-item">
          <a href="#" class="nav-link">
            <i class="icon message-icon"></i>
            <span>Message</span>
          </a>
        </li>

        <li class="nav-item">
          <a href="#" class="nav-link">
            <i class="icon components-icon"></i>
            <span>Components</span>
            <i class="chevron-down"></i>
          </a>
        </li>
      </ul>
    </nav>

    <!-- Dark Mode Toggle -->
    <div class="sidebar-footer">
      <div class="darkmode-toggle">
        <i class="icon darkmode-icon"></i>
        <span>Darkmode</span>
        <div class="toggle-switch" :class="{ active: isDarkMode }" @click="toggleDarkMode">
          <div class="toggle-thumb"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProTendSidebar',
  data() {
    return {
      isDarkMode: false,
    }
  },
  methods: {
    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode
    },
  },
}
</script>

<style lang="scss" scoped>
.sidebar {
  width: 280px;
  height: 100vh;
  background: #f8f9fb;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 24px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e7eb;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
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

.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;

  &:hover {
    background: #f3f4f6;
  }
}

.arrow-left {
  width: 16px;
  height: 16px;
  border-left: 2px solid #6b7280;
  border-bottom: 2px solid #6b7280;
  transform: rotate(45deg);
}

.sidebar-nav {
  flex: 1;
  padding: 16px 0;
  overflow-y: auto;
}

.nav-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-item {
  margin: 0 16px 4px;

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

  &:hover:not(.active) {
    background: #f3f4f6;
    color: #374151;
  }

  span {
    flex: 1;
    font-size: 15px;
    font-weight: 500;
    margin-left: 12px;
  }
}

.icon {
  width: 20px;
  height: 20px;
  position: relative;
  color: #9ca3af;

  &.home-icon::before {
    content: '🏠';
    font-size: 16px;
  }

  &.project-icon::before {
    content: '⚡';
    font-size: 16px;
  }

  &.client-icon::before {
    content: '👤';
    font-size: 16px;
  }

  &.board-icon::before {
    content: '📋';
    font-size: 16px;
  }

  &.calendar-icon::before {
    content: '📅';
    font-size: 16px;
  }

  &.message-icon::before {
    content: '💬';
    font-size: 16px;
  }

  &.components-icon::before {
    content: '🧩';
    font-size: 16px;
  }

  &.darkmode-icon::before {
    content: '🌙';
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

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid #e5e7eb;
}

.darkmode-toggle {
  display: flex;
  align-items: center;
  gap: 12px;

  span {
    flex: 1;
    font-size: 15px;
    font-weight: 500;
    color: #6b7280;
  }
}

.toggle-switch {
  width: 44px;
  height: 24px;
  background: #e5e7eb;
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: background 0.3s ease;

  &.active {
    background: #409eff;

    .toggle-thumb {
      transform: translateX(20px);
    }
  }
}

.toggle-thumb {
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
