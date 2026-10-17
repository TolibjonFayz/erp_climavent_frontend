<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showConfirmDialog } from 'vant'
import { useUsersStore } from '@/stores/user'
import MPage from '../../components/MPage.vue'
import { clearSession, useSession } from '../../session'
import { openExternal } from '../../native'
import { setLanguage } from '../../i18n'
import { avatarColor, initials } from '../../utils'

const { t, locale } = useI18n()
const router = useRouter()
const usersStore = useUsersStore()
const { user, can, isAdmin, fullName } = useSession()

const WEB_URL = (import.meta.env.VITE_WEB_URL || '').replace(/\/$/, '')
const APP_VERSION = __APP_VERSION__

const manage = computed(() =>
  [
    can('boss') && { key: 'boss', icon: 'chart-trending-o', title: t('m.bossPanel'), sub: t('m.bossPanelSub'), to: { name: 'boss' }, color: '#7c3aed' },
    can('amocrm') && { key: 'amo', icon: 'phone-circle-o', title: t('m.amoStats'), sub: t('m.amoStatsSub'), to: { name: 'amocrm' }, color: '#0d9488' },
  ].filter(Boolean),
)

// Ilovada hali yo'q bo'limlar — saytda ochiladi
const webSections = computed(() =>
  WEB_URL
    ? [
        can('kp') && { key: 'kp', icon: 'description-o', title: t('m.webKp'), path: '/kp' },
        can('dogovor') && { key: 'dogovor', icon: 'records-o', title: t('m.webDogovor'), path: '/dogovor' },
        can('loyiha') && { key: 'loyiha', icon: 'cluster-o', title: t('m.webLoyiha'), path: '/loyiha' },
        can('competitors') && { key: 'comp', icon: 'shop-o', title: t('m.webCompetitors'), path: '/competitors' },
        isAdmin.value && { key: 'admin', icon: 'setting-o', title: t('m.webAdmin'), path: '/admin' },
      ].filter(Boolean)
    : [],
)

async function logout() {
  try {
    await showConfirmDialog({
      message: t('m.logoutConfirm'),
      confirmButtonText: t('logout'),
      cancelButtonText: t('cancel'),
    })
  } catch {
    return
  }
  clearSession()
  usersStore.currentUser = null
  router.replace({ name: 'login' })
}
</script>

<template>
  <MPage :title="$t('m.tabMore')" large tabbar>
    <button type="button" class="mv-profile" @click="router.push({ name: 'profile' })">
      <img v-if="user?.profile_image" :src="user.profile_image" class="mv-profile__img" alt="" />
      <span v-else class="m-avatar mv-profile__img" :style="{ background: avatarColor(fullName) }">
        {{ initials(fullName) }}
      </span>
      <span class="mv-profile__text">
        <b>{{ fullName || user?.username }}</b>
        <small>@{{ user?.username }}<template v-if="isAdmin"> · {{ $t('m.admin') }}</template></small>
      </span>
      <van-icon name="arrow" class="mv-arrow" />
    </button>

    <template v-if="manage.length">
      <div class="m-section"><span class="m-section__title">{{ $t('m.management') }}</span></div>
      <div class="mv-tiles">
        <button v-for="m in manage" :key="m.key" type="button" class="mv-tile" @click="router.push(m.to)">
          <span class="mv-tile__icon" :style="{ background: m.color }"><van-icon :name="m.icon" /></span>
          <b>{{ m.title }}</b>
          <small>{{ m.sub }}</small>
        </button>
      </div>
    </template>

    <template v-if="webSections.length">
      <div class="m-section"><span class="m-section__title">{{ $t('m.onWebsite') }}</span></div>
      <van-cell-group inset>
        <van-cell
          v-for="s in webSections"
          :key="s.key"
          :title="s.title"
          :icon="s.icon"
          is-link
          @click="openExternal(WEB_URL + s.path)"
        >
          <template #right-icon><van-icon name="share-o" class="mv-ext" /></template>
        </van-cell>
      </van-cell-group>
    </template>

    <div class="m-section"><span class="m-section__title">{{ $t('settings') }}</span></div>
    <van-cell-group inset>
      <van-cell :title="$t('m.language')" icon="flag-o">
        <template #value>
          <div class="mv-lang">
            <button
              v-for="l in ['uz', 'ru']"
              :key="l"
              type="button"
              :class="{ 'is-active': locale === l }"
              @click="setLanguage(l)"
            >
              {{ l === 'uz' ? "O'zbekcha" : 'Русский' }}
            </button>
          </div>
        </template>
      </van-cell>
      <van-cell :title="$t('m.profile')" icon="user-o" is-link :to="{ name: 'profile' }" />
    </van-cell-group>

    <van-cell-group inset class="mv-logout">
      <van-cell :title="$t('logout')" icon="revoke" clickable @click="logout" />
    </van-cell-group>

    <p class="mv-version">Climavent ERP · v{{ APP_VERSION }}</p>
  </MPage>
</template>

<style scoped>
.mv-profile {
  display: flex;
  align-items: center;
  gap: 14px;
  width: calc(100% - 24px);
  margin: 14px 12px 0;
  padding: 14px;
  border: 0;
  border-radius: var(--m-radius);
  background: var(--m-surface);
  box-shadow: var(--m-shadow);
  text-align: left;
}

.mv-profile__img {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  font-size: 20px;
}

.mv-profile__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.mv-profile__text b {
  font-size: 17px;
}

.mv-profile__text small {
  font-size: 13px;
  color: var(--m-muted);
}

.mv-arrow {
  color: var(--m-faint);
}

.mv-tiles {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding: 0 12px;
}

.mv-tile {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 14px;
  border: 0;
  border-radius: var(--m-radius);
  background: var(--m-surface);
  box-shadow: var(--m-shadow);
  text-align: left;
}

.mv-tile:active {
  background: var(--m-surface-2);
}

.mv-tile__icon {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 20px;
  margin-bottom: 6px;
}

.mv-tile b {
  font-size: 15px;
}

.mv-tile small {
  font-size: 12px;
  color: var(--m-muted);
  line-height: 1.35;
}

.mv-ext {
  color: var(--m-faint);
  font-size: 16px;
  align-self: center;
}

.mv-lang {
  display: inline-flex;
  padding: 3px;
  border-radius: 9px;
  background: var(--m-line-soft);
}

.mv-lang button {
  border: 0;
  background: none;
  padding: 5px 10px;
  border-radius: 7px;
  font-size: 13px;
  color: var(--m-muted);
}

.mv-lang button.is-active {
  background: var(--m-surface);
  color: var(--m-ink);
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.mv-logout {
  margin-top: 16px !important;
}

.mv-logout :deep(.van-cell__title),
.mv-logout :deep(.van-icon) {
  color: var(--m-bad);
}

.mv-version {
  margin-top: 20px;
  text-align: center;
  font-size: 12px;
  color: var(--m-faint);
}
</style>
