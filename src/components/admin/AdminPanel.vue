<template>
  <div class="admin-wrap">
    <header class="adm-header">
      <div class="adm-header__bg">
        <span class="orb orb-1"></span>
        <span class="orb orb-2"></span>
        <span class="orb orb-3"></span>
      </div>
      <div class="adm-header__inner">
        <div class="adm-header__left">
          <div class="adm-logo">
            <el-icon :size="26"><Grid /></el-icon>
          </div>
          <div>
            <h1 class="adm-title">Admin Panel</h1>
            <p class="adm-sub">Tizim boshqaruvchisining paneli · Barcha ma'lumotlar bir joyda</p>
          </div>
        </div>
        <div class="adm-header__right">
          <div class="adm-live-clock">
            <span class="clock-greeting">{{ greeting }}</span>
            <span class="clock-time">{{ liveTime }}</span>
            <span class="clock-date">{{ todayFormatted }}</span>
          </div>
          <div class="adm-header-status">
            <span class="status-dot"></span>
            <span class="status-text">Tizim ishlayapti</span>
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
            type="button"
            class="adm-nav__item"
            :class="{ 'is-active': activeTab === tab.name }"
            @click="activeTab = tab.name"
          >
            <span class="adm-nav__icon"
              ><el-icon><component :is="tab.icon" /></el-icon
            ></span>
            <span class="adm-nav__lbl">{{ tab.label }}</span>
            <span v-if="tab.name === 'audit' && auditLogs.length" class="nav-badge">
              {{ auditLogs.length > 99 ? '99+' : auditLogs.length }}
            </span>
          </button>
        </nav>
        <div class="adm-sidebar__footer">
          <div class="adm-user">
            <div class="adm-user__av">
              <el-icon><UserFilled /></el-icon>
            </div>
            <div>
              <span class="adm-user__name">Administrator</span>
              <span class="adm-user__role">Super Admin</span>
            </div>
          </div>
          <button class="adm-exit" type="button" @click="router.push('/')">
            <el-icon><Back /></el-icon>
            <span>Ilovaga qaytish</span>
          </button>
        </div>
      </aside>

      <!-- MAIN -->
      <main class="adm-main" v-loading="loading">
        <!-- ═══════ DASHBOARD ═══════ -->
        <div v-if="activeTab === 'dashboard'" class="adm-page">
          <div class="page-head">
            <span class="page-accent"></span>
            <h2 class="page-title">Dashboard</h2>
            <span class="page-date">{{ todayFormatted }}</span>
          </div>

          <div class="kpi-grid">
            <div class="kpi-card kpi-card--blue">
              <div class="kpi-card__top">
                <div class="kpi-icon">
                  <el-icon><User /></el-icon>
                </div>
                <span class="kpi-trend kpi-trend--up">
                  <el-icon><Top /></el-icon> +{{ newUsersThisMonth }}
                </span>
              </div>
              <div class="kpi-val">{{ usersStore.allUsers.length }}</div>
              <div class="kpi-lbl">Jami foydalanuvchilar</div>
              <div class="kpi-sub">{{ adminCount }} admin · {{ userCount }} oddiy</div>
              <div class="kpi-bar">
                <div class="kpi-bar__fill" :style="{ width: adminPercent + '%' }"></div>
              </div>
            </div>

            <div class="kpi-card kpi-card--green">
              <div class="kpi-card__top">
                <div class="kpi-icon">
                  <el-icon><UserFilled /></el-icon>
                </div>
                <span class="kpi-trend kpi-trend--up"
                  ><el-icon><Top /></el-icon> faol</span
                >
              </div>
              <div class="kpi-val">{{ partnersStore.allPartners.length }}</div>
              <div class="kpi-lbl">Jami hamkorlar</div>
              <div class="kpi-sub">{{ topPartnerType.label }} — ko'p</div>
              <div class="kpi-bar"><div class="kpi-bar__fill" :style="{ width: '72%' }"></div></div>
            </div>

            <div class="kpi-card kpi-card--orange">
              <div class="kpi-card__top">
                <div class="kpi-icon">
                  <el-icon><OfficeBuilding /></el-icon>
                </div>
                <span class="kpi-trend kpi-trend--up"
                  ><el-icon><Top /></el-icon> faol</span
                >
              </div>
              <div class="kpi-val">{{ comeandgoInsideStore.allComeAndGoInsides.length }}</div>
              <div class="kpi-lbl">Jami obyektlar</div>
              <div class="kpi-sub">So'nggi: {{ lastObjectDate }}</div>
              <div class="kpi-bar"><div class="kpi-bar__fill" :style="{ width: '58%' }"></div></div>
            </div>

            <div class="kpi-card kpi-card--purple">
              <div class="kpi-card__top">
                <div class="kpi-icon">
                  <el-icon><Document /></el-icon>
                </div>
                <span class="kpi-trend kpi-trend--neutral"
                  ><el-icon><Minus /></el-icon> log</span
                >
              </div>
              <div class="kpi-val">{{ auditLogs.length }}</div>
              <div class="kpi-lbl">Audit amallar</div>
              <div class="kpi-sub">{{ todayAuditCount }} ta bugun</div>
              <div class="kpi-bar">
                <div
                  class="kpi-bar__fill"
                  :style="{ width: Math.min(auditLogs.length * 2, 100) + '%' }"
                ></div>
              </div>
            </div>
          </div>

          <div class="dash-row">
            <div class="dash-card dash-card--wide">
              <div class="dash-card__head">
                <span class="dash-card__title">Hamkor turlari taqsimlashi</span>
              </div>
              <div class="chart-bars">
                <div v-for="type in partnerTypeStats" :key="type.value" class="chart-bar-row">
                  <span class="chart-bar-lbl">{{ type.label }}</span>
                  <div class="chart-bar-track">
                    <div
                      class="chart-bar-fill"
                      :style="{ width: type.percent + '%', background: type.color }"
                    ></div>
                  </div>
                  <span class="chart-bar-num">{{ type.count }}</span>
                </div>
              </div>
            </div>

            <div class="dash-card">
              <div class="dash-card__head">
                <span class="dash-card__title">🏆 Eng faol foydalanuvchilar</span>
                <el-tag size="small" type="info" effect="plain">Top 5</el-tag>
              </div>
              <div class="top-users">
                <div v-for="(u, idx) in visibleActiveUsers" :key="u.username" class="top-user-row">
                  <!-- Rank -->
                  <span class="top-user-rank">
                    {{ idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '#' + (idx + 1) }}
                  </span>

                  <!-- Avatar -->
                  <div
                    class="top-user-av"
                    :class="
                      idx === 0
                        ? 'av--gold'
                        : idx === 1
                          ? 'av--silver'
                          : idx === 2
                            ? 'av--bronze'
                            : ''
                    "
                  >
                    {{ u.firstname?.charAt(0) || u.username?.charAt(0) }}
                  </div>

                  <!-- Info -->
                  <div class="top-user-info">
                    <span class="top-user-name">{{ u.firstname }} {{ u.lastname }}</span>
                    <span class="top-user-un">@{{ u.username }}</span>

                    <!-- Mini progress bar -->
                    <div class="top-user-bar">
                      <div
                        class="top-user-bar__fill"
                        :style="{
                          width: topActiveUsers[0]?.total
                            ? (u.total / topActiveUsers[0].total) * 100 + '%'
                            : '0%',
                        }"
                      ></div>
                    </div>

                    <!-- Stats -->
                    <div class="top-user-stats">
                      <span class="tus-item tus-item--partner">
                        <el-icon><UserFilled /></el-icon> {{ u.partners || 0 }} hamkor
                      </span>
                      <span class="tus-divider">·</span>
                      <span class="tus-item tus-item--object">
                        <el-icon><OfficeBuilding /></el-icon> {{ u.objects || 0 }} obyekt
                      </span>
                    </div>
                  </div>

                  <!-- Total badge -->
                  <div class="top-user-total" :class="idx === 0 ? 'total--gold' : ''">
                    {{ u.total }}
                    <span>jami</span>
                  </div>
                </div>

                <div v-if="!topActiveUsers.length" class="empty-state">
                  <el-icon><InfoFilled /></el-icon> Ma'lumot yo'q
                </div>

                <button
                  v-if="topActiveUsers.length > 5"
                  class="show-all-btn"
                  @click="showAllActiveUsers = !showAllActiveUsers"
                >
                  <span v-if="!showAllActiveUsers">
                    <el-icon><ArrowDown /></el-icon>
                    Barchasini ko'rish · <b>{{ topActiveUsers.length }} ta</b> foydalanuvchi
                  </span>
                  <span v-else>
                    <el-icon><ArrowUp /></el-icon>
                    Yig'ish
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div class="dash-card dash-card--full">
            <div class="dash-card__head">
              <span class="dash-card__title">So'nggi amallar</span>
              <el-button size="small" text @click="activeTab = 'audit'">
                Hammasini ko'rish <el-icon><ArrowRight /></el-icon>
              </el-button>
            </div>
            <div class="activity-feed">
              <div
                v-for="log in recentAuditLogs"
                :key="log.id"
                class="activity-item"
                :class="'activity-item--' + log.type"
              >
                <div class="activity-dot"></div>
                <div class="activity-icon">
                  <el-icon><component :is="getAuditIcon(log.action)" /></el-icon>
                </div>
                <div class="activity-content">
                  <span class="activity-actor">{{ log.actor }}</span>
                  <span class="activity-msg">{{ log.message }}</span>
                </div>
                <span class="activity-time">{{ log.time }}</span>
              </div>
              <div v-if="!auditLogs.length" class="empty-state">
                <el-icon><Document /></el-icon> Hali hech qanday amal qayd etilmagan
              </div>
            </div>
          </div>
        </div>

        <!-- ═══════ FOYDALANUVCHILAR ═══════ -->
        <div v-if="activeTab === 'users'" class="adm-page">
          <div class="page-head">
            <span class="page-accent"></span>
            <h2 class="page-title">Barcha foydalanuvchilar</h2>
          </div>
          <div class="adm-toolbar">
            <el-input
              v-model="usersSearch"
              placeholder="Qidiruv (ism, username, telefon)..."
              :prefix-icon="Search"
              clearable
              class="adm-search"
            />
            <el-select
              v-model="usersRoleFilter"
              placeholder="Rol bo'yicha"
              clearable
              class="adm-select"
            >
              <el-option label="Admin" value="admin" />
              <el-option label="Foydalanuvchi" value="user" />
            </el-select>
            <el-select v-model="usersStatusFilter" placeholder="Holat" clearable class="adm-select">
              <el-option label="Faol" value="active" />
              <el-option label="Bloklangan" value="blocked" />
            </el-select>
            <button class="adm-reset-btn" @click="handleResetUsers">
              <el-icon><RefreshLeft /></el-icon> Tozalash
            </button>
          </div>
          <div class="tbl-wrap" v-loading="usersLoading">
            <el-table
              :data="filteredUsers"
              stripe
              border
              style="width: 100%"
              empty-text="Ma'lumot yo'q"
            >
              <el-table-column label="№" type="index" width="75" align="center" />
              <el-table-column prop="id" label="ID" width="75" />
              <el-table-column label="Foydalanuvchi" min-width="180">
                <template #default="{ row }">
                  <div class="user-cell">
                    <div class="user-cell__av" :class="row.is_admin ? 'av--admin' : 'av--user'">
                      {{ row.firstname?.charAt(0) || row.username?.charAt(0) || '?' }}
                    </div>
                    <div>
                      <div class="user-cell__name">{{ row.firstname }} {{ row.lastname }}</div>
                      <div class="user-cell__un">@{{ row.username }}</div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="phone_number" label="Telefon" min-width="130" />
              <el-table-column prop="email" label="Email" min-width="150" />
              <el-table-column label="Rol" width="150" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.is_admin ? 'success' : 'warning'" size="small">
                    {{ row.is_admin ? '👑 Admin' : '👤 User' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="Holat" width="150" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.is_blocked ? 'danger' : 'success'" size="small">
                    {{ row.is_blocked ? '🔴 Bloklangan' : '🟢 Faol' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="Amallar" width="150" align="center" fixed="right">
                <template #default="{ row }">
                  <div class="action-btns">
                    <el-tooltip content="Batafsil ko'rish" placement="top">
                      <button class="act-btn act-btn--view" @click="openUserDetail(row)">
                        <el-icon><View /></el-icon>
                      </button>
                    </el-tooltip>
                    <el-tooltip
                      :content="row.is_admin ? 'Admin rolini olib tashlash' : 'Admin qilish'"
                      placement="top"
                    >
                      <button
                        :class="
                          row.is_admin ? 'act-btn act-btn--demote' : 'act-btn act-btn--promote'
                        "
                        @click="toggleAdminRole(row)"
                      >
                        <el-icon><component :is="row.is_admin ? Minus : StarFilled" /></el-icon>
                      </button>
                    </el-tooltip>
                    <el-tooltip
                      :content="row.is_blocked ? 'Blokdan chiqarish' : 'Bloklash'"
                      placement="top"
                    >
                      <button
                        :class="
                          row.is_blocked ? 'act-btn act-btn--unblock' : 'act-btn act-btn--block'
                        "
                        @click="toggleBlockUser(row)"
                      >
                        <el-icon><component :is="row.is_blocked ? Unlock : Lock" /></el-icon>
                      </button>
                    </el-tooltip>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <!-- ═══════ HAMKORLAR ═══════ -->
        <div v-if="activeTab === 'partners'" class="adm-page">
          <div class="page-head">
            <span class="page-accent"></span>
            <h2 class="page-title">Hamkorlar va mijozlar</h2>
          </div>
          <div class="adm-toolbar">
            <el-input
              v-model="partnersSearch"
              placeholder="Qidiruv (nomi, telefon, INN)..."
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
              <el-option
                v-for="type in partnerTypes"
                :key="type.value"
                :label="type.label"
                :value="type.value"
              />
            </el-select>
            <el-select
              v-model="partnersUser"
              placeholder="Kim qo'shgan"
              clearable
              class="adm-select"
            >
              <el-option
                v-for="firstname in partnersUserList"
                :key="firstname"
                :label="firstname"
                :value="firstname"
              />
            </el-select>
            <button class="adm-reset-btn" @click="handleResetPartners">
              <el-icon><RefreshLeft /></el-icon> Tozalash
            </button>
          </div>
          <div class="tbl-wrap" v-loading="partnersLoading">
            <el-table
              :data="filteredPartners"
              stripe
              border
              style="width: 100%"
              empty-text="Hech narsa topilmadi 🔍"
            >
              <el-table-column label="№" type="index" width="75" align="center" />
              <el-table-column prop="id" label="ID" width="75" />
              <el-table-column label="Turi" min-width="150">
                <template #default="{ row }"
                  ><el-tag type="info">{{
                    getPartnerTypeLabel(row.partner_type)
                  }}</el-tag></template
                >
              </el-table-column>
              <el-table-column label="Kim qo'shgan" min-width="150">
                <template #default="{ row }"
                  ><el-tag>{{ row.user.firstname }}</el-tag></template
                >
              </el-table-column>
              <el-table-column prop="fullname" label="Nomi" min-width="150" />
              <el-table-column prop="phone_number" label="Telefon" min-width="150" />
              <el-table-column
                prop="additional_phone_number"
                label="Qo'shimcha tel"
                min-width="150"
              />
              <el-table-column label="Manzil" min-width="250">
                <template #default="{ row }"
                  ><el-tag
                    >{{ row.republic }} {{ row.viloyat }} {{ row.shahar_tuman }}</el-tag
                  ></template
                >
              </el-table-column>
              <el-table-column prop="mijozturi" label="Yuridik/Jismoniy" min-width="130" />
              <el-table-column prop="inn" label="INN" min-width="110" />
            </el-table>
          </div>
        </div>

        <!-- ═══════ OBYEKTLAR ═══════ -->
        <div v-if="activeTab === 'objects'" class="adm-page">
          <div class="page-head">
            <span class="page-accent"></span>
            <h2 class="page-title">Obyektlar</h2>
          </div>
          <div class="adm-toolbar">
            <el-input
              v-model="objectsSearch"
              placeholder="Qidiruv (firma nomi, manzil)..."
              :prefix-icon="Search"
              clearable
              class="adm-search"
            />
            <el-select
              v-model="objectsUser"
              placeholder="Kim qo'shgan"
              clearable
              class="adm-select"
            >
              <el-option
                v-for="firstname in objectsUserList"
                :key="firstname"
                :label="firstname"
                :value="firstname"
              />
            </el-select>
            <button class="adm-reset-btn" @click="handleResetObjects">
              <el-icon><RefreshLeft /></el-icon> Tozalash
            </button>
          </div>
          <div class="tbl-wrap" v-loading="objectsLoading">
            <el-table
              :data="filteredObjects"
              stripe
              border
              style="width: 100%"
              empty-text="Hech narsa topilmadi 🔍"
              :default-sort="{ prop: 'createdAt', order: 'descending' }"
            >
              <el-table-column label="№" type="index" width="75" align="center" />
              <el-table-column prop="id" label="ID" width="75" />
              <el-table-column prop="whereto" label="Qayerga" min-width="120" />
              <el-table-column label="Kim qo'shgan" min-width="130">
                <template #default="{ row }">{{
                  row.come_and_go_father?.user?.firstname
                }}</template>
              </el-table-column>
              <el-table-column label="Ketilgan vaqt" min-width="150">
                <template #default="{ row }">{{ formatDate(row.when_gone) }}</template>
              </el-table-column>
              <el-table-column label="Qaytilgan vaqt" min-width="150">
                <template #default="{ row }">{{ formatDate(row.when_came) }}</template>
              </el-table-column>
              <el-table-column prop="dogovor_or_kp" label="Dogovor / KP" min-width="130" />
              <el-table-column prop="locationname" label="Manzil" min-width="130" />
              <el-table-column prop="company_name" label="Firma nomi" min-width="140" />
              <el-table-column prop="createdAt" label="Kiritilgan vaqt" min-width="140" sortable>
                <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <!-- ═══════ KP ═══════ -->
        <div v-if="activeTab === 'kp'" class="adm-page">
          <div class="page-head">
            <span class="page-accent"></span>
            <h2 class="page-title">KP (Savdo takliflari)</h2>
          </div>
          <div class="adm-toolbar">
            <span class="kp-filtered-count">Topildi: {{ filteredKp.length }} ta</span>
            <button class="adm-reset-btn" @click="handleResetKp">
              <el-icon><RefreshLeft /></el-icon> Filtrlarni tozalash
            </button>
            <button
              class="adm-reset-btn"
              style="margin-left: auto"
              :disabled="exportKpLoading"
              @click="handleExportKp"
            >
              <el-icon v-if="!exportKpLoading"><Download /></el-icon>
              <el-icon v-else class="is-loading"><Loading /></el-icon>
              Excel'ga yuklab olish
            </button>
          </div>
          <div class="tbl-wrap" v-loading="kpLoading">
            <el-table
              :data="pagedKp"
              stripe
              border
              style="width: 100%"
              empty-text="Hech narsa topilmadi 🔍"
            >
              <el-table-column label="№" type="index" width="60" align="center" />
              <el-table-column prop="kp_number" label="Raqami" width="110">
                <template #header><input v-model="kpFilter.number" class="col-filter-admin" placeholder="Raqami" /></template>
                <template #default="{ row }">{{ row.kp_number ?? '—' }}</template>
              </el-table-column>
              <el-table-column label="Holat" width="130">
                <template #header>
                  <select v-model="kpFilter.status" class="col-filter-admin">
                    <option value="">Holat</option>
                    <option v-for="opt in kpStatusOptions" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>
                </template>
                <template #default="{ row }"
                  ><el-tag :type="kpStatusTagType(row.kp_status)">{{
                    kpStatusLabel(row.kp_status)
                  }}</el-tag></template
                >
              </el-table-column>
              <el-table-column prop="client_name" label="Mijoz" min-width="160">
                <template #header><input v-model="kpFilter.client" class="col-filter-admin" placeholder="Mijoz" /></template>
              </el-table-column>
              <el-table-column prop="manager_name" label="Menejer" min-width="150">
                <template #header><input v-model="kpFilter.manager" class="col-filter-admin" placeholder="Menejer" /></template>
              </el-table-column>
              <el-table-column prop="kp_date" label="Sana" width="120">
                <template #header><input v-model="kpFilter.date" class="col-filter-admin" placeholder="Sana" /></template>
              </el-table-column>
              <el-table-column label="Yopilgan sana" width="130">
                <template #header><input v-model="kpFilter.closedDate" class="col-filter-admin" placeholder="Yopilgan sana" /></template>
                <template #default="{ row }">{{ row.closed_date ?? '—' }}</template>
              </el-table-column>
              <el-table-column label="Summa" width="140">
                <template #header><input v-model="kpFilter.sum" class="col-filter-admin" placeholder="Summa" /></template>
                <template #default="{ row }">{{
                  new Intl.NumberFormat('uz-UZ').format(row.kp_sum ?? 0)
                }}</template>
              </el-table-column>
              <el-table-column label="Izoh" min-width="240" class-name="kp-wrap-col">
                <template #header>
                  <select v-model="kpFilter.comment" class="col-filter-admin">
                    <option value="">Izoh</option>
                    <option v-for="opt in KP_COMMENT_FILTER_OPTIONS" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                </template>
                <template #default="{ row }">{{ row.comment || '—' }}</template>
              </el-table-column>
              <el-table-column label="Admin izohi" min-width="200" class-name="kp-wrap-col">
                <template #header><input v-model="kpFilter.adminComment" class="col-filter-admin" placeholder="Admin izohi" /></template>
                <template #default="{ row }"
                  ><span class="kp-admin-comment">{{ row.admin_comment || '—' }}</span></template
                >
              </el-table-column>
              <el-table-column label="Kim kiritgan" min-width="150">
                <template #header><input v-model="kpFilter.creator" class="col-filter-admin" placeholder="Kim kiritgan" /></template>
                <template #default="{ row }">{{
                  row.creator ? `${row.creator.firstname} ${row.creator.lastname}` : '—'
                }}</template>
              </el-table-column>
              <el-table-column label="Amallar" width="140" fixed="right">
                <template #default="{ row }">
                  <el-button text size="small" :icon="Edit" @click="openKpEditDialog(row)"
                    >Tahrirlash</el-button
                  >
                  <el-button
                    text
                    size="small"
                    type="danger"
                    :icon="Delete"
                    @click="handleKpDelete(row)"
                    >O'chirish</el-button
                  >
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div class="kp-pagination-bar" v-if="filteredKp.length > kpPageSize">
            <el-pagination
              v-model:current-page="kpPage"
              v-model:page-size="kpPageSize"
              :page-sizes="[50, 100, 200, 500]"
              :total="filteredKp.length"
              layout="total, sizes, prev, pager, next, jumper"
              background
            />
          </div>
        </div>

        <!-- ═══════ AUDIT LOG ═══════ -->
        <div v-if="activeTab === 'audit'" class="adm-page">
          <div class="page-head">
            <span class="page-accent"></span>
            <h2 class="page-title">Audit Log</h2>
            <el-button
              size="small"
              type="danger"
              plain
              style="margin-left: auto"
              @click="clearAuditLogs"
            >
              <el-icon><Delete /></el-icon> Loglarni tozalash
            </el-button>
          </div>
          <div class="adm-toolbar">
            <el-input
              v-model="auditSearch"
              placeholder="Qidiruv (amal, foydalanuvchi)..."
              :prefix-icon="Search"
              clearable
              class="adm-search"
            />
            <el-select
              v-model="auditActionFilter"
              placeholder="Amal turi"
              clearable
              class="adm-select"
            >
              <el-option label="Rol o'zgartirildi" value="role" />
              <el-option label="Bloklash / Ochish" value="block" />
              <el-option label="Ko'rish" value="view" />
              <el-option label="Export" value="export" />
            </el-select>
            <button class="adm-reset-btn" @click="handleResetAudit">
              <el-icon><RefreshLeft /></el-icon> Tozalash
            </button>
          </div>

          <div class="audit-mini-stats">
            <div class="audit-ms-item">
              <span class="audit-ms-val">{{ auditStats?.total ?? 0 }}</span>
              <span class="audit-ms-lbl">Jami amallar</span>
            </div>
            <div class="audit-ms-item">
              <span class="audit-ms-val">{{ auditStats?.today ?? 0 }}</span>
              <span class="audit-ms-lbl">Bugun</span>
            </div>
            <div class="audit-ms-item">
              <span class="audit-ms-val">{{ auditStats?.role ?? 0 }}</span>
              <span class="audit-ms-lbl">Rol o'zgarishlari</span>
            </div>
            <div class="audit-ms-item">
              <span class="audit-ms-val">{{ auditStats?.block ?? 0 }}</span>
              <span class="audit-ms-lbl">Bloklash amallari</span>
            </div>
          </div>

          <div class="audit-timeline">
            <div
              v-for="log in filteredAuditLogs"
              :key="log.id"
              class="audit-entry"
              :class="'audit-entry--' + log.type"
            >
              <div class="audit-entry__line"></div>
              <div class="audit-entry__dot">
                <el-icon><component :is="getAuditIcon(log.action)" /></el-icon>
              </div>
              <div class="audit-entry__body">
                <div class="audit-entry__top">
                  <span class="audit-entry__actor"
                    ><el-icon><UserFilled /></el-icon> {{ log.actor }}</span
                  >
                  <span class="audit-entry__action-tag" :class="'tag--' + log.type">{{
                    getActionLabel(log.action)
                  }}</span>
                  <span class="audit-entry__time"
                    ><el-icon><Timer /></el-icon> {{ log.time }}</span
                  >
                </div>
                <div class="audit-entry__msg">{{ log.message }}</div>
                <div v-if="log.meta" class="audit-entry__meta">{{ log.meta }}</div>
              </div>
            </div>
            <div v-if="!filteredAuditLogs.length" class="empty-audit">
              <div class="empty-audit__icon">🔍</div>
              <div class="empty-audit__title">Hech qanday amal topilmadi</div>
              <div class="empty-audit__sub">
                Foydalanuvchilarga amallar bajaring — ular shu yerda ko'rinadi
              </div>
            </div>
          </div>
        </div>

        <!-- ═══════ SOZLAMALAR ═══════ -->
        <div v-if="activeTab === 'settings'" class="adm-page">
          <div class="page-head">
            <span class="page-accent"></span>
            <h2 class="page-title">Tizim sozlamalari</h2>
          </div>
          <div class="settings-grid">
            <div class="settings-card">
              <div class="sc-icon">
                <el-icon :size="22"><Download /></el-icon>
              </div>
              <h3 class="sc-title">Ma'lumotlarni eksport qilish</h3>
              <p class="sc-desc">Barcha ma'lumotlarni EXCEL formatida yuklab olish</p>
              <div class="sc-btns">
                <button
                  class="sc-btn"
                  :disabled="exportPartnersLoading || exportObjectsLoading"
                  @click="handleExportPartners"
                >
                  <el-icon v-if="!exportPartnersLoading"><User /></el-icon>
                  <el-icon v-else class="is-loading"><Loading /></el-icon>
                  Hamkorlar
                </button>
                <button
                  class="sc-btn"
                  :disabled="exportPartnersLoading || exportObjectsLoading"
                  @click="handleExportObjects"
                >
                  <el-icon v-if="!exportObjectsLoading"><OfficeBuilding /></el-icon>
                  <el-icon v-else class="is-loading"><Loading /></el-icon>
                  Obyektlar
                </button>
              </div>
            </div>
            <div class="settings-card">
              <div class="sc-icon sc-icon--purple">
                <el-icon :size="22"><Document /></el-icon>
              </div>
              <h3 class="sc-title">Audit logni eksport qilish</h3>
              <p class="sc-desc">Barcha audit amallarini EXCEL formatida yuklab olish</p>
              <div class="sc-btns">
                <button class="sc-btn" @click="handleExportAudit">
                  <el-icon><Document /></el-icon> Audit Log
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- ═══════ USER DETAIL DRAWER ═══════ -->
    <el-drawer
      v-model="userDetailVisible"
      direction="rtl"
      size="400px"
      :title="'Foydalanuvchi: ' + (selectedUser?.username || '')"
      destroy-on-close
    >
      <div v-if="selectedUser" class="user-drawer">
        <div class="user-drawer__avatar" :class="selectedUser.is_admin ? 'av--admin' : 'av--user'">
          <el-icon :size="30"><UserFilled /></el-icon>
        </div>
        <div class="user-drawer__name">
          {{ selectedUser.firstname }} {{ selectedUser.lastname }}
        </div>
        <div class="user-drawer__un">@{{ selectedUser.username }}</div>
        <div class="user-drawer__tags">
          <el-tag :type="selectedUser.is_admin ? 'success' : 'warning'">
            {{ selectedUser.is_admin ? '👑 Admin' : '👤 User' }}
          </el-tag>
          <el-tag :type="selectedUser.is_blocked ? 'danger' : 'success'">
            {{ selectedUser.is_blocked ? '🔴 Bloklangan' : '🟢 Faol' }}
          </el-tag>
        </div>

        <el-divider />

        <div class="user-drawer__fields">
          <div class="udf-row">
            <span class="udf-lbl"
              ><el-icon><Phone /></el-icon> Telefon</span
            >
            <span class="udf-val">{{ selectedUser.phone_number || '—' }}</span>
          </div>
          <div class="udf-row">
            <span class="udf-lbl"
              ><el-icon><Message /></el-icon> Email</span
            >
            <span class="udf-val">{{ selectedUser.email || '—' }}</span>
          </div>
          <div class="udf-row">
            <span class="udf-lbl"
              ><el-icon><Key /></el-icon> ID</span
            >
            <span class="udf-val">{{ selectedUser.id }}</span>
          </div>
          <div class="udf-row">
            <span class="udf-lbl"
              ><el-icon><UserFilled /></el-icon> Qo'shgan hamkorlar</span
            >
            <span class="udf-val">{{ getUserPartnerCount(selectedUser.username) }} ta</span>
          </div>
          <div class="udf-row">
            <span class="udf-lbl"
              ><el-icon><OfficeBuilding /></el-icon> Qo'shgan obyektlar</span
            >
            <span class="udf-val">{{ getUserObjectCount(selectedUser.username) }} ta</span>
          </div>
        </div>

        <el-divider />

        <div class="user-drawer__actions">
          <el-button
            :type="selectedUser.is_admin ? 'warning' : 'success'"
            style="width: 100%; margin-bottom: 10px"
            @click="toggleAdminRole(selectedUser, true)"
          >
            <el-icon><component :is="selectedUser.is_admin ? Minus : StarFilled" /></el-icon>
            {{ selectedUser.is_admin ? 'Admin rolini olib tashlash' : 'Admin qilish' }}
          </el-button>
          <el-button
            :type="selectedUser.is_blocked ? 'success' : 'danger'"
            style="width: 100%"
            @click="toggleBlockUser(selectedUser, true)"
          >
            <el-icon><component :is="selectedUser.is_blocked ? Unlock : Lock" /></el-icon>
            {{ selectedUser.is_blocked ? 'Blokdan chiqarish' : 'Bloklash' }}
          </el-button>
        </div>

        <el-divider content-position="left">
          <span style="font-size: 12px; color: #909399">Bu foydalanuvchiga tegishli amallar</span>
        </el-divider>
        <div class="user-audit-list">
          <div
            v-for="log in selectedUserLogs"
            :key="log.id"
            class="user-audit-item"
            :class="'audit-entry--' + log.type"
          >
            <el-icon style="margin-right: 8px; color: #409eff"
              ><component :is="getAuditIcon(log.action)"
            /></el-icon>
            <span>{{ log.message }}</span>
            <span class="user-audit-time">{{ log.time ?? log.created_at }}</span>
          </div>
          <div
            v-if="!selectedUserLogs.length"
            style="color: #909399; font-size: 13px; text-align: center; padding: 12px"
          >
            Bu foydalanuvchiga hech qanday amal bajarilamagan
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- ═══════ KP EDIT DIALOG ═══════ -->
    <el-dialog v-model="kpDialogVisible" title="KPni tahrirlash" width="720px" destroy-on-close>
      <el-form ref="kpFormRef" :model="kpForm" :rules="kpFormRules" label-position="top">
        <el-row :gutter="18">
          <el-col :span="12">
            <el-form-item label="Hujjat raqami" prop="kp_number">
              <el-input-number
                v-model="kpForm.kp_number"
                :min="1"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="KP holati" prop="kp_status">
              <el-select v-model="kpForm.kp_status" style="width: 100%">
                <el-option
                  v-for="opt in kpStatusOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Mijoz nomi" prop="client_name">
              <el-input v-model="kpForm.client_name" maxlength="120" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Menejer nomi" prop="manager_name">
              <el-input v-model="kpForm.manager_name" maxlength="120" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="KP sanasi" prop="kp_date">
              <el-date-picker
                v-model="kpForm.kp_date"
                type="date"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Yopilgan sana" prop="closed_date">
              <el-date-picker
                v-model="kpForm.closed_date"
                type="date"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Keyingi uchrashuv sanasi" prop="dogovor_next">
              <el-date-picker
                v-model="kpForm.dogovor_next"
                type="date"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Summa" prop="kp_sum">
              <el-input-number v-model="kpForm.kp_sum" :min="0" :step="100" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="Izoh" prop="commentSelect">
              <el-select v-model="kpForm.commentSelect" placeholder="Izoh sababini tanlang" filterable style="width: 100%">
                <el-option v-for="opt in KP_COMMENT_OPTIONS" :key="opt" :label="opt" :value="opt" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col v-if="kpForm.commentSelect === CONTRACT_NUMBER_OPTION" :span="24">
            <el-form-item label="Shartnoma raqami" prop="contractNumber">
              <el-input v-model="kpForm.contractNumber" placeholder="Shartnoma raqamini kiriting" maxlength="60" />
            </el-form-item>
          </el-col>
          <el-col v-if="kpForm.commentSelect === OTHER_COMMENT_OPTION" :span="24">
            <el-form-item label="Izohni yozing" prop="customComment">
              <el-input type="textarea" v-model="kpForm.customComment" rows="3" maxlength="400" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="Admin izohi (ichki, faqat adminlarga ko'rinadi)" prop="admin_comment">
              <el-input
                type="textarea"
                v-model="kpForm.admin_comment"
                rows="3"
                maxlength="400"
                show-word-limit
                class="admin-comment-textarea"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="kpDialogVisible = false">Bekor qilish</el-button>
        <el-button type="primary" :loading="kpLoading" @click="handleKpSubmit">Saqlash</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { useComeAndGoInsideStore } from '@/stores/comeandgoInside'
import { usePartnersStore } from '@/stores/partners'
import { useKPsStore } from '@/stores/kp'
import {
  KP_COMMENT_OPTIONS,
  KP_COMMENT_FILTER_OPTIONS,
  CONTRACT_NUMBER_OPTION,
  OTHER_COMMENT_OPTION,
  deriveCommentForm,
  resolveCommentValue,
  commentMatchesFilter,
} from '@/constants/kpComments'
import {
  Search,
  View,
  StarFilled,
  Minus,
  Lock,
  Unlock,
  RefreshLeft,
  ArrowRight,
  Download,
  User,
  OfficeBuilding,
  Setting,
  DataAnalysis,
  Document,
  UserFilled,
  Phone,
  Message,
  Key,
  Delete,
  Edit,
  Top,
  InfoFilled,
  Timer,
  Loading,
  Grid,
  ArrowDown,
  ArrowUp,
} from '@element-plus/icons-vue'
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useUsersStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuditLog } from '@/composables/useAuditLog'
import * as XLSX from 'xlsx'
import router from '@/router'

const comeandgoInsideStore = useComeAndGoInsideStore()
const partnersStore = usePartnersStore()
const usersStore = useUsersStore()
const kpStore = useKPsStore()

const {
  auditLogs: _auditLogs,
  stats: auditStats,
  fetchLogs,
  fetchStats,
  fetchByTarget,
  addAuditLog,
  clearAllLogs,
} = useAuditLog()
const auditLogs = computed(() => _auditLogs?.value ?? [])

// ─── State ────────────────────────────────────────────────
const activeTab = ref('dashboard')
const loading = ref(false)
const usersLoading = ref(false)
const partnersLoading = ref(false)
const objectsLoading = ref(false)
const kpLoading = ref(false)
const exportPartnersLoading = ref(false)
const exportObjectsLoading = ref(false)
const exportKpLoading = ref(false)
const userDetailVisible = ref(false)
const selectedUser = ref(null)
const selectedUserLogs = ref([])
const liveTime = ref('')

// ─── Filter state ─────────────────────────────────────────
const usersSearch = ref('')
const usersRoleFilter = ref('')
const usersStatusFilter = ref('')
const partnersSearch = ref('')
const partnersType = ref('')
const partnersUser = ref('')
const objectsSearch = ref('')
const objectsUser = ref('')
const kpFilter = reactive({
  number: '',
  status: '',
  client: '',
  manager: '',
  date: '',
  closedDate: '',
  sum: '',
  comment: '',
  adminComment: '',
  creator: '',
})
const kpPage = ref(1)
const kpPageSize = ref(50)
const showAllActiveUsers = ref(false)
const auditSearch = ref('')
const auditActionFilter = ref('')

// ─── Tabs ─────────────────────────────────────────────────
const tabs = [
  { name: 'dashboard', label: 'Dashboard', icon: DataAnalysis },
  { name: 'users', label: 'Foydalanuvchilar', icon: User },
  { name: 'partners', label: 'Hamkorlar', icon: UserFilled },
  { name: 'objects', label: 'Obyektlar', icon: OfficeBuilding },
  { name: 'kp', label: 'KP', icon: Document },
  { name: 'audit', label: 'Audit Log', icon: Document },
  { name: 'settings', label: 'Sozlamalar', icon: Setting },
]

// ─── Hamkor turlari ───────────────────────────────────────
const partnerTypes = [
  { value: 'doimiymijoz', label: 'Doimiy mijoz' },
  { value: 'montajnik', label: 'Montaj guruhlar' },
  { value: 'quruvchi', label: 'Quruvchi' },
  { value: 'dokonbozor', label: "Do'kon / Bozor" },
  { value: 'proyektinstitut', label: 'Proyekt instituti' },
  { value: 'tenderfirmalar', label: 'Tender firmalar' },
  { value: 'uks', label: '"UKS" - Yagona buyurtmachi' },
  { value: 'boshqa', label: 'Boshqa' },
]
const partnerTypeColors = [
  '#409eff',
  '#67c23a',
  '#e6a23c',
  '#f56c6c',
  '#909399',
  '#9b59b6',
  '#1abc9c',
  '#e67e22',
]

function getPartnerTypeLabel(value) {
  return partnerTypes.find((t) => t.value === value)?.label ?? value ?? '—'
}

// ─── Date formatting ───
function formatDate(isoString) {
  if (!isoString) return 'Kiritilmagan'
  const d = new Date(isoString)
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
  return `${d.getFullYear()} / ${d.getDate()}-${months[d.getMonth()]} / ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// ─── Computed ─────────────────────────────────────────────
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return '🌅 Xayrli tong'
  if (h >= 12 && h < 17) return '☀️ Xayrli kun'
  if (h >= 17 && h < 21) return '🌆 Xayrli kech'
  return '🌙 Xayrli tun'
})

const todayFormatted = computed(() =>
  new Date().toLocaleDateString('uz-UZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),
)

const adminCount = computed(() => usersStore.allUsers.filter((u) => u.is_admin).length)
const userCount = computed(() => usersStore.allUsers.filter((u) => !u.is_admin).length)
const adminPercent = computed(() => {
  const total = usersStore.allUsers.length
  return total ? Math.round((adminCount.value / total) * 100) : 0
})
const newUsersThisMonth = computed(() => {
  const m = new Date().getMonth()
  return usersStore.allUsers.filter((u) => u.createdAt && new Date(u.createdAt).getMonth() === m)
    .length
})
const partnerTypeStats = computed(() => {
  const total = partnersStore.allPartners.length || 1
  return partnerTypes
    .map((type, idx) => ({
      ...type,
      count: partnersStore.allPartners.filter((p) => p.partner_type === type.value).length,
      percent: Math.round(
        (partnersStore.allPartners.filter((p) => p.partner_type === type.value).length / total) *
          100,
      ),
      color: partnerTypeColors[idx % partnerTypeColors.length],
    }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count)
})
const topPartnerType = computed(() => partnerTypeStats.value[0] || { label: '—' })
const lastObjectDate = computed(() => {
  const sorted = [...comeandgoInsideStore.allComeAndGoInsides].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  )
  return sorted[0] ? formatDate(sorted[0].createdAt).split(' / ')[0] : '—'
})

const topActiveUsers = computed(() => {
  // Build a map keyed by username
  const map = {}
  usersStore.allUsers.forEach((u) => {
    map[u.username] = { ...u, partners: 0, objects: 0 }
  })

  // Count partners per user
  partnersStore.allPartners.forEach((p) => {
    const un = p.user?.username
    if (!un) return
    if (!map[un]) map[un] = { ...p.user, partners: 0, objects: 0 }
    map[un].partners++
  })

  // Count objects per user
  comeandgoInsideStore.allComeAndGoInsides.forEach((o) => {
    const un = o.come_and_go_father?.user?.username
    if (!un) return
    if (!map[un]) map[un] = { ...o.come_and_go_father?.user, partners: 0, objects: 0 }
    map[un].objects++
  })

  return Object.values(map)
    .map((u) => ({ ...u, total: (u.partners || 0) + (u.objects || 0) }))
    .sort((a, b) => b.total - a.total)
})

const visibleActiveUsers = computed(() =>
  showAllActiveUsers.value ? topActiveUsers.value : topActiveUsers.value.slice(0, 5),
)

const recentAuditLogs = computed(() => auditLogs.value.slice(0, 8))
const todayAuditCount = computed(() => auditStats.value?.today ?? 0)

const filteredUsers = computed(() =>
  usersStore.allUsers.filter((u) => {
    const s = usersSearch.value.toLowerCase().trim()
    const matchSearch =
      !s ||
      ['firstname', 'lastname', 'username', 'phone_number'].some((k) =>
        (u[k] ?? '').toLowerCase().includes(s),
      )
    const matchRole =
      !usersRoleFilter.value || (usersRoleFilter.value === 'admin' ? u.is_admin : !u.is_admin)
    const matchStatus =
      !usersStatusFilter.value ||
      (usersStatusFilter.value === 'blocked' ? u.is_blocked : !u.is_blocked)
    return matchSearch && matchRole && matchStatus
  }),
)
const partnersUserList = computed(() => [
  ...new Set(partnersStore.allPartners.map((p) => p.user?.firstname).filter(Boolean)),
])
const objectsUserList = computed(() => [
  ...new Set(
    comeandgoInsideStore.allComeAndGoInsides
      .map((o) => o.come_and_go_father?.user?.firstname)
      .filter(Boolean),
  ),
])

const filteredPartners = computed(() =>
  partnersStore.allPartners.filter((p) => {
    const s = partnersSearch.value.toLowerCase().trim()
    const matchSearch =
      !s ||
      ['fullname', 'phone_number', 'additional_phone_number', 'inn'].some((k) =>
        (p[k] ?? '').toLowerCase().includes(s),
      )
    return (
      matchSearch &&
      (!partnersType.value || (p.partner_type ?? '').trim() === partnersType.value) &&
      (!partnersUser.value || p.user?.firstname === partnersUser.value)
    )
  }),
)
const filteredObjects = computed(() =>
  comeandgoInsideStore.allComeAndGoInsides.filter((o) => {
    const s = objectsSearch.value.toLowerCase().trim()
    const matchSearch =
      !s ||
      (o.company_name ?? '').toLowerCase().includes(s) ||
      (o.locationname ?? '').toLowerCase().includes(s)
    return (
      matchSearch &&
      (!objectsUser.value || o.come_and_go_father?.user?.firstname === objectsUser.value)
    )
  }),
)
const filteredAuditLogs = computed(() =>
  auditLogs.value.filter((l) => {
    const s = auditSearch.value.toLowerCase().trim()
    const actor = l.actor?.username ?? l.actor ?? ''
    return (
      (!s || l.message.toLowerCase().includes(s) || actor.toLowerCase().includes(s)) &&
      (!auditActionFilter.value || l.action === auditActionFilter.value)
    )
  }),
)
const kpColText = (value, filter) =>
  !filter.trim() || String(value ?? '').toLowerCase().includes(filter.trim().toLowerCase())

// Backend KP'larni createdAt bo'yicha (yangilari birinchi) qaytaradi — shu tartibni saqlaymiz
const filteredKp = computed(() =>
  (kpStore.allKPs || []).filter(
    (kp) =>
      kpColText(kp.kp_number, kpFilter.number) &&
      (!kpFilter.status || kp.kp_status === kpFilter.status) &&
      kpColText(kp.client_name, kpFilter.client) &&
      kpColText(kp.manager_name, kpFilter.manager) &&
      kpColText(kp.kp_date, kpFilter.date) &&
      kpColText(kp.closed_date, kpFilter.closedDate) &&
      kpColText(kp.kp_sum, kpFilter.sum) &&
      commentMatchesFilter(kp.comment, kpFilter.comment) &&
      kpColText(kp.admin_comment, kpFilter.adminComment) &&
      kpColText(kp.creator ? `${kp.creator.firstname} ${kp.creator.lastname}` : '', kpFilter.creator),
  ),
)
const pagedKp = computed(() => {
  const start = (kpPage.value - 1) * kpPageSize.value
  return filteredKp.value.slice(start, start + kpPageSize.value)
})
watch(
  () => ({ ...kpFilter }),
  () => {
    kpPage.value = 1
  },
)

// ─── Audit helpers ────────────────────────────────────────
function getAuditIcon(action) {
  return (
    { role: StarFilled, block: Lock, unblock: Unlock, view: View, export: Download, login: User }[
      action
    ] || Document
  )
}
function getActionLabel(action) {
  return (
    {
      role: "Rol o'zgartirildi",
      block: 'Bloklandi',
      unblock: 'Blok ochildi',
      view: "Ko'rildi",
      export: 'Export',
      login: 'Kirish',
    }[action] || action
  )
}

// ─── User actions ─────────────────────────────────────────
async function toggleAdminRole(user, closeDrawer = false) {
  const newRole = !user.is_admin
  try {
    await ElMessageBox.confirm(
      `"${user.firstname} ${user.lastname}" (@${user.username}) — ${newRole ? 'Admin qilish' : 'Admin rolini olib tashlash'}?`,
      'Tasdiqlash',
      { confirmButtonText: 'Ha', cancelButtonText: 'Bekor qilish', type: 'warning' },
    )
    user.is_admin = newRole
    if (closeDrawer) userDetailVisible.value = false
    addAuditLog({
      action: 'role',
      message: `"${user.firstname} ${user.lastname}" (@${user.username}) — ${newRole ? 'Admin qilindi' : 'Admin roli olib tashlandi'}`,
      type: newRole ? 'success' : 'warning',
      target_id: user.id,
    })
    ElMessage.success(
      `✅ ${newRole ? 'Admin qilish' : 'Admin rolini olib tashlash'} muvaffaqiyatli!`,
    )
  } catch {}
}

async function toggleBlockUser(user, closeDrawer = false) {
  const newBlock = !user.is_blocked
  try {
    await ElMessageBox.confirm(
      `"${user.firstname} ${user.lastname}" (@${user.username}) — ${newBlock ? 'Bloklash' : 'Blokdan chiqarish'}?`,
      'Tasdiqlash',
      {
        confirmButtonText: 'Ha',
        cancelButtonText: 'Bekor qilish',
        type: newBlock ? 'error' : 'warning',
      },
    )
    user.is_blocked = newBlock
    if (closeDrawer) userDetailVisible.value = false
    addAuditLog({
      action: newBlock ? 'block' : 'unblock',
      message: `"${user.firstname} ${user.lastname}" (@${user.username}) — ${newBlock ? 'Bloklandi' : 'Blok ochildi'}`,
      type: newBlock ? 'danger' : 'success',
      target_id: user.id,
    })
    ElMessage.success(`✅ ${newBlock ? 'Bloklash' : 'Blokdan chiqarish'} muvaffaqiyatli!`)
  } catch {}
}

async function openUserDetail(user) {
  selectedUser.value = user
  userDetailVisible.value = true
  selectedUserLogs.value = await fetchByTarget(user.username)
  addAuditLog({
    action: 'view',
    message: `"${user.firstname} ${user.lastname}" (@${user.username}) profili ko'rildi`,
    type: 'info',
    target_id: user.id,
  })
}

function getUserPartnerCount(username) {
  return partnersStore.allPartners.filter((p) => p.user?.username === username).length
}
function getUserObjectCount(username) {
  return comeandgoInsideStore.allComeAndGoInsides.filter(
    (o) => o.come_and_go_father?.user?.username === username,
  ).length
}

// ─── Audit ───────────────────────────────────────────────
async function clearAuditLogs() {
  try {
    await ElMessageBox.confirm(
      "Barcha audit loglarni o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.",
      'Ogohlantirish',
      { confirmButtonText: "Ha, o'chirish", cancelButtonText: 'Bekor qilish', type: 'warning' },
    )
    await clearAllLogs()
    await fetchStats()
    ElMessage.success('Loglar tozalandi')
  } catch {}
}

// ─── Reset handlers ───────────────────────────────────────
const handleResetUsers = () => {
  usersSearch.value = ''
  usersRoleFilter.value = ''
  usersStatusFilter.value = ''
}
const handleResetPartners = () => {
  partnersSearch.value = ''
  partnersType.value = ''
  partnersUser.value = ''
}
const handleResetObjects = () => {
  objectsSearch.value = ''
  objectsUser.value = ''
}
const handleResetKp = () => {
  Object.keys(kpFilter).forEach((key) => {
    kpFilter[key] = ''
  })
  kpPage.value = 1
}
const handleResetAudit = () => {
  auditSearch.value = ''
  auditActionFilter.value = ''
}

// ─── KP actions ───────────────────────────────────────────
const kpStatusOptions = [
  { value: 'Open', label: 'Ochilgan' },
  { value: 'Negotiation', label: 'Muzokaralar' },
  { value: 'Closed', label: 'Yopilgan' },
]
function kpStatusLabel(status) {
  return kpStatusOptions.find((o) => o.value === status)?.label || status || '—'
}
function kpStatusTagType(status) {
  return { Open: 'success', Negotiation: 'warning', Closed: 'info' }[status] || 'info'
}

const kpDialogVisible = ref(false)
const kpFormRef = ref(null)
const editingKpRow = ref(null)
const kpForm = reactive({
  kp_number: null,
  kp_status: 'Open',
  client_name: '',
  kp_date: '',
  manager_name: '',
  kp_sum: null,
  dogovor_next: '',
  closed_date: '',
  commentSelect: '',
  contractNumber: '',
  customComment: '',
  admin_comment: '',
})
const kpFormRules = {
  kp_status: [{ required: true, message: "KP holatini tanlang", trigger: 'change' }],
  client_name: [{ required: true, message: 'Mijoz nomini kiriting', trigger: 'blur' }],
  kp_date: [{ required: true, message: 'KP sanasini tanlang', trigger: 'change' }],
  manager_name: [{ required: true, message: 'Menejer nomini kiriting', trigger: 'blur' }],
  kp_sum: [{ required: true, message: 'Summa qiymatini kiriting', trigger: 'change' }],
}

function openKpEditDialog(row) {
  editingKpRow.value = row
  Object.assign(kpForm, {
    kp_number: row.kp_number ?? null,
    kp_status: row.kp_status || 'Open',
    client_name: row.client_name || '',
    kp_date: row.kp_date || '',
    manager_name: row.manager_name || '',
    kp_sum: row.kp_sum ?? null,
    dogovor_next: row.dogovor_next || '',
    closed_date: row.closed_date || '',
    ...deriveCommentForm(row.comment),
    admin_comment: row.admin_comment || '',
  })
  kpDialogVisible.value = true
}

async function handleKpSubmit() {
  if (!kpFormRef.value) return
  try {
    await kpFormRef.value.validate()
  } catch {
    return
  }
  try {
    kpLoading.value = true
    await kpStore.updateKP(editingKpRow.value.id, {
      kp_number: kpForm.kp_number || undefined,
      kp_status: kpForm.kp_status,
      client_name: kpForm.client_name.trim(),
      kp_date: kpForm.kp_date,
      manager_name: kpForm.manager_name.trim(),
      kp_sum: kpForm.kp_sum,
      dogovor_next: kpForm.dogovor_next || undefined,
      closed_date: kpForm.closed_date || undefined,
      comment:
        resolveCommentValue({
          commentSelect: kpForm.commentSelect,
          contractNumber: kpForm.contractNumber,
          customComment: kpForm.customComment,
        }) || undefined,
      admin_comment: kpForm.admin_comment?.trim() || undefined,
    })
    await kpStore.getAllKPs()
    addAuditLog({
      action: 'role',
      message: `KP #${editingKpRow.value.id} (${kpForm.client_name}) tahrirlandi`,
      type: 'info',
      target_id: editingKpRow.value.id,
    })
    ElMessage.success('✅ KP muvaffaqiyatli yangilandi!')
    kpDialogVisible.value = false
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || e?.message || 'KP yangilashda xatolik')
  } finally {
    kpLoading.value = false
  }
}

async function handleKpDelete(row) {
  try {
    await ElMessageBox.confirm(
      `"${row.client_name}" (#${row.kp_number ?? row.id}) — KP yozuvini o'chirmoqchimisiz?`,
      'Tasdiqlash',
      { confirmButtonText: 'Ha', cancelButtonText: 'Bekor qilish', type: 'warning' },
    )
    kpLoading.value = true
    await kpStore.deleteKP(row.id)
    await kpStore.getAllKPs()
    addAuditLog({
      action: 'role',
      message: `KP #${row.id} (${row.client_name}) o'chirildi`,
      type: 'warning',
      target_id: row.id,
    })
    ElMessage.success("✅ KP muvaffaqiyatli o'chirildi!")
  } catch (e) {
    if (e === 'cancel' || e === 'close') return
    ElMessage.error(e?.response?.data?.message || e?.message || "KP o'chirishda xatolik")
  } finally {
    kpLoading.value = false
  }
}

const handleExportKp = async () => {
  try {
    exportKpLoading.value = true
    const data = kpStore.allKPs.map((k, i) => ({
      '№': i + 1,
      ID: k.id,
      Raqami: k.kp_number ?? '—',
      Holat: kpStatusLabel(k.kp_status),
      Mijoz: k.client_name ?? '—',
      Menejer: k.manager_name ?? '—',
      Sana: k.kp_date ?? '—',
      'Yopilgan sana': k.closed_date ?? '—',
      'Keyingi sana': k.dogovor_next ?? '—',
      Summa: k.kp_sum ?? 0,
      Izoh: k.comment ?? '—',
      'Admin izohi': k.admin_comment ?? '—',
      "Kim kiritgan": k.creator ? `${k.creator.firstname} ${k.creator.lastname}` : '—',
      'Kiritilgan vaqt': formatDate(k.createdAt),
    }))
    if (!data.length) {
      ElMessage.warning("Eksport qilish uchun ma'lumot yo'q!")
      return
    }
    const ws = XLSX.utils.json_to_sheet(data)
    ws['!cols'] = calcColWidths(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'KP')
    XLSX.writeFile(wb, `KP_${new Date().toLocaleDateString('uz-UZ').replace(/\//g, '-')}.xlsx`)
    addAuditLog({
      action: 'export',
      message: `KP ma'lumotlari export qilindi (${data.length} ta yozuv)`,
      type: 'info',
    })
    ElMessage.success('✅ KP muvaffaqiyatli eksport qilindi!')
  } catch (e) {
    ElMessage.error('Eksport xatoligi: ' + e.message)
  } finally {
    exportKpLoading.value = false
  }
}

// ─── Excel export ─────────────────────────────────────────
function calcColWidths(data) {
  if (!data.length) return []
  return Object.keys(data[0]).map((key) => ({
    wch: Math.max(key.length, ...data.map((row) => String(row[key] ?? '').length)) + 3,
  }))
}

const handleExportPartners = async () => {
  try {
    exportPartnersLoading.value = true
    const data = partnersStore.allPartners.map((p, i) => ({
      '№': i + 1,
      ID: p.id,
      Turi: getPartnerTypeLabel(p.partner_type),
      "Kim qo'shgan (Ism)": p.user?.firstname ?? '—',
      "Kim qo'shgan (Username)": p.user?.username ?? '—',
      "To'liq nomi": p.fullname ?? '—',
      Telefon: p.phone_number ?? '—',
      "Qo'shimcha telefon": p.additional_phone_number ?? '—',
      Respublika: p.republic ?? '—',
      Viloyat: p.viloyat ?? '—',
      'Shahar/Tuman': p.shahar_tuman ?? '—',
      'Yuridik/Jismoniy': p.mijozturi ?? '—',
      INN: p.inn ?? '—',
    }))
    if (!data.length) {
      ElMessage.warning("Eksport qilish uchun ma'lumot yo'q!")
      return
    }
    const ws = XLSX.utils.json_to_sheet(data)
    ws['!cols'] = calcColWidths(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Hamkorlar')
    XLSX.writeFile(
      wb,
      `Hamkorlar_${new Date().toLocaleDateString('uz-UZ').replace(/\//g, '-')}.xlsx`,
    )
    addAuditLog({
      action: 'export',
      message: `Hamkorlar ma'lumotlari export qilindi (${data.length} ta yozuv)`,
      type: 'info',
    })
    ElMessage.success('✅ Hamkorlar muvaffaqiyatli eksport qilindi!')
  } catch (e) {
    ElMessage.error('Eksport xatoligi: ' + e.message)
  } finally {
    exportPartnersLoading.value = false
  }
}

const handleExportObjects = async () => {
  try {
    exportObjectsLoading.value = true
    const data = comeandgoInsideStore.allComeAndGoInsides.map((o, i) => ({
      '№': i + 1,
      ID: o.id,
      Qayerga: o.whereto ?? '—',
      "Kim qo'shgan": o.come_and_go_father?.user?.username ?? '—',
      'Ketilgan vaqt': formatDate(o.when_gone),
      'Qaytilgan vaqt': formatDate(o.when_came),
      'Dogovor / KP': o.dogovor_or_kp ?? '—',
      Manzil: o.locationname ?? '—',
      'Firma nomi': o.company_name ?? '—',
      'Kiritilgan vaqt': formatDate(o.createdAt),
    }))
    if (!data.length) {
      ElMessage.warning("Eksport qilish uchun ma'lumot yo'q!")
      return
    }
    const ws = XLSX.utils.json_to_sheet(data)
    ws['!cols'] = calcColWidths(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Obyektlar')
    XLSX.writeFile(
      wb,
      `Obyektlar_${new Date().toLocaleDateString('uz-UZ').replace(/\//g, '-')}.xlsx`,
    )
    addAuditLog({
      action: 'export',
      message: `Obyektlar ma'lumotlari export qilindi (${data.length} ta yozuv)`,
      type: 'info',
    })
    ElMessage.success('✅ Obyektlar muvaffaqiyatli eksport qilindi!')
  } catch (e) {
    ElMessage.error('Eksport xatoligi: ' + e.message)
  } finally {
    exportObjectsLoading.value = false
  }
}

const handleExportAudit = () => {
  try {
    const data = auditLogs.value.map((l, i) => ({
      '№': i + 1,
      Vaqt: l.time,
      Amal: getActionLabel(l.action),
      Xabar: l.message,
      Bajardi: l.actor,
    }))
    if (!data.length) {
      ElMessage.warning("Eksport qilish uchun log yo'q!")
      return
    }
    const ws = XLSX.utils.json_to_sheet(data)
    ws['!cols'] = calcColWidths(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'AuditLog')
    XLSX.writeFile(
      wb,
      `AuditLog_${new Date().toLocaleDateString('uz-UZ').replace(/\//g, '-')}.xlsx`,
    )
    ElMessage.success('✅ Audit log eksport qilindi!')
  } catch (e) {
    ElMessage.error('Eksport xatoligi: ' + e.message)
  }
}

// ─── onMounted ────────────────────────────────────────────
onMounted(async () => {
  loading.value = true
  try {
    await usersStore.getUserInfo(Number(localStorage.getItem('userid')))
    if (!usersStore.currentUser?.is_admin) {
      router.push('/')
      return
    }
  } catch (e) {
    ElMessage.error("Foydalanuvchi ma'lumotini yuklashda xatolik")
    loading.value = false
    return
  }

  await Promise.allSettled([
    usersStore.getAllUsers(),
    partnersStore.getAllPartners(),
    comeandgoInsideStore.getAllComeAndGoInside(),
    kpStore.getAllKPs(),
  ])

  loading.value = false

  fetchLogs({ limit: 100 }).catch(console.error)
  fetchStats().catch(console.error)

  const tick = () => {
    liveTime.value = new Date().toLocaleTimeString('uz-UZ', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }
  tick()
  setInterval(tick, 1000)
})
</script>

<style lang="scss" scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');

$blue: #409eff;
$blue-d: #337ecc;
$blue-l: #a0cfff;
$blue-bg: #ecf5ff;
$text-primary: #303133;
$text-regular: #606266;
$text-secondary: #909399;
$border: #dcdfe6;
$bg-page: #f0f2f5;
$bg-white: #ffffff;
$sw: 220px;

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

// ── HEADER ────────────────────────────────────────────────
.adm-header {
  position: relative;
  flex-shrink: 0;
  width: 100%;
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
  &__right {
    display: flex;
    align-items: center;
    gap: 20px;
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
  animation: logoFloat 4s ease-in-out infinite;
}
.adm-title {
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -1px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}
.adm-sub {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.82);
  margin-top: 4px;
}

.adm-live-clock {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 14px;
  padding: 12px 20px;
  .clock-greeting {
    font-size: 11px;
    font-weight: 600;
    opacity: 0.85;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .clock-time {
    font-size: 28px;
    font-weight: 800;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 2px;
    line-height: 1;
  }
  .clock-date {
    font-size: 11px;
    opacity: 0.75;
    font-weight: 500;
  }
}

.adm-header-status {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(103, 194, 58, 0.5);
  border-radius: 20px;
  padding: 8px 16px;
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #67c23a;
    box-shadow: 0 0 0 3px rgba(103, 194, 58, 0.3);
    animation: pulse 2s ease-in-out infinite;
  }
  .status-text {
    font-size: 12px;
    font-weight: 600;
    opacity: 0.9;
  }
}

// ── LAYOUT ────────────────────────────────────────────────
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

.nav-badge {
  margin-left: auto;
  background: #f56c6c;
  color: #fff;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  min-width: 18px;
  text-align: center;
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
.adm-exit {
  margin-top: 10px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 11px;
  border: 1px solid $blue-l;
  border-radius: 10px;
  background: transparent;
  color: $blue;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease;

  &:hover {
    background: $blue;
    color: #fff;
  }
}

.adm-main {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  overflow-x: hidden;
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
  .page-date {
    margin-left: auto;
    font-size: 12px;
    color: $text-secondary;
    font-weight: 500;
  }
}

// ── TOOLBAR ───────────────────────────────────────────────
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
    min-width: 155px;
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
    cursor: pointer;
    &:hover {
      border-color: $blue;
      color: $blue;
      background: $blue-bg;
    }
  }
}

// ── TABLE ─────────────────────────────────────────────────
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
    .kp-wrap-col .cell {
      white-space: normal;
      word-break: break-word;
      line-height: 1.6;
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

.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  &__av {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
    &.av--admin {
      background: linear-gradient(135deg, #67c23a, #95d475);
    }
    &.av--user {
      background: linear-gradient(135deg, $blue-d, $blue);
    }
  }
  &__name {
    font-size: 13px;
    font-weight: 600;
    color: $text-primary;
    line-height: 1.3;
  }
  &__un {
    font-size: 11px;
    color: $text-secondary;
  }
}

.action-btns {
  display: flex;
  gap: 6px;
  justify-content: center;
}
.act-btn {
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1.5px solid;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.18s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  outline: none;
  font-size: 14px;
  &--view {
    color: $blue;
    border-color: $blue-l;
    background: $blue-bg;
    &:hover {
      background: $blue;
      color: #fff;
      border-color: $blue;
    }
  }
  &--promote {
    color: #67c23a;
    border-color: #b3e19d;
    background: #f0f9eb;
    &:hover {
      background: #67c23a;
      color: #fff;
      border-color: #67c23a;
    }
  }
  &--demote {
    color: #e6a23c;
    border-color: #f5dab1;
    background: #fdf6ec;
    &:hover {
      background: #e6a23c;
      color: #fff;
      border-color: #e6a23c;
    }
  }
  &--block {
    color: #f56c6c;
    border-color: #fbc4c4;
    background: #fef0f0;
    &:hover {
      background: #f56c6c;
      color: #fff;
      border-color: #f56c6c;
    }
  }
  &--unblock {
    color: #67c23a;
    border-color: #b3e19d;
    background: #f0f9eb;
    &:hover {
      background: #67c23a;
      color: #fff;
      border-color: #67c23a;
    }
  }
}

// ── KPI ───────────────────────────────────────────────────
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 22px;
  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}
.kpi-card {
  background: $bg-white;
  border-radius: 14px;
  padding: 22px 20px;
  border: 1px solid $border;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.25s;
  position: relative;
  overflow: hidden;
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
  }
  &--blue::before {
    background: linear-gradient(90deg, $blue-d, $blue);
  }
  &--green::before {
    background: linear-gradient(90deg, #3d9970, #67c23a);
  }
  &--orange::before {
    background: linear-gradient(90deg, #d68910, #e6a23c);
  }
  &--purple::before {
    background: linear-gradient(90deg, #7d3c98, #9b59b6);
  }
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 26px rgba(0, 0, 0, 0.1);
  }
  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }
}
.kpi-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  .kpi-card--blue & {
    background: $blue-bg;
    color: $blue;
  }
  .kpi-card--green & {
    background: #f0f9eb;
    color: #67c23a;
  }
  .kpi-card--orange & {
    background: #fdf6ec;
    color: #e6a23c;
  }
  .kpi-card--purple & {
    background: #f3e8fb;
    color: #9b59b6;
  }
}
.kpi-trend {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 20px;
  &--up {
    background: #f0f9eb;
    color: #67c23a;
  }
  &--neutral {
    background: #f5f7fa;
    color: $text-secondary;
  }
}
.kpi-val {
  font-size: 36px;
  font-weight: 800;
  font-family: 'JetBrains Mono', monospace;
  color: $text-primary;
  line-height: 1;
  margin-bottom: 6px;
}
.kpi-lbl {
  font-size: 13px;
  font-weight: 600;
  color: $text-regular;
  margin-bottom: 4px;
}
.kpi-sub {
  font-size: 11px;
  color: $text-secondary;
  margin-bottom: 12px;
}
.kpi-bar {
  height: 4px;
  background: #f0f2f5;
  border-radius: 4px;
  overflow: hidden;
  &__fill {
    height: 100%;
    border-radius: 4px;
    transition: width 1s ease;
    .kpi-card--blue & {
      background: $blue;
    }
    .kpi-card--green & {
      background: #67c23a;
    }
    .kpi-card--orange & {
      background: #e6a23c;
    }
    .kpi-card--purple & {
      background: #9b59b6;
    }
  }
}

// ── CHARTS ────────────────────────────────────────────────
.dash-row {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 16px;
  margin-bottom: 18px;
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}
.dash-card {
  background: $bg-white;
  border-radius: 14px;
  padding: 22px;
  border: 1px solid $border;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  &--full {
    width: 100%;
  }
  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18px;
  }
  &__title {
    font-size: 14px;
    font-weight: 700;
    color: $text-primary;
  }
}
.chart-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.chart-bar-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.chart-bar-lbl {
  font-size: 12px;
  color: $text-regular;
  font-weight: 500;
  width: 130px;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.chart-bar-track {
  flex: 1;
  height: 8px;
  background: #f0f2f5;
  border-radius: 4px;
  overflow: hidden;
}
.chart-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.chart-bar-num {
  font-size: 12px;
  font-weight: 700;
  color: $text-primary;
  font-family: 'JetBrains Mono', monospace;
  width: 28px;
  text-align: right;
  flex-shrink: 0;
}

.top-users {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.top-user-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid $border;
  background: $bg-white;
  transition: all 0.2s;
  &:hover {
    background: $blue-bg;
    border-color: $blue-l;
    transform: translateX(3px);
  }
}
.top-user-rank {
  font-size: 18px;
  width: 26px;
  flex-shrink: 0;
  text-align: center;
}
.top-user-av {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, $blue-d, $blue);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  flex-shrink: 0;
  text-transform: uppercase;
  box-shadow: 0 3px 8px rgba($blue, 0.28);

  &.av--gold {
    background: linear-gradient(135deg, #f39c12, #f1c40f);
    box-shadow: 0 3px 10px rgba(#f1c40f, 0.45);
  }
  &.av--silver {
    background: linear-gradient(135deg, #7f8c8d, #bdc3c7);
    box-shadow: 0 3px 10px rgba(#bdc3c7, 0.45);
  }
  &.av--bronze {
    background: linear-gradient(135deg, #c0392b, #e67e22);
    box-shadow: 0 3px 10px rgba(#e67e22, 0.35);
  }
}
.top-user-info {
  flex: 1;
  min-width: 0;
}
.top-user-name {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: $text-primary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.top-user-un {
  display: block;
  font-size: 11px;
  color: $text-secondary;
  margin-bottom: 5px;
}
.top-user-bar {
  height: 3px;
  background: #f0f2f5;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 5px;
  &__fill {
    height: 100%;
    border-radius: 3px;
    background: linear-gradient(90deg, $blue-d, $blue);
    transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
}
.top-user-stats {
  display: flex;
  align-items: center;
  gap: 5px;
}
.tus-item {
  font-size: 10.5px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 3px;
  &--partner {
    color: $blue;
  }
  &--object {
    color: #e6a23c;
  }
}
.tus-divider {
  color: $border;
  font-size: 12px;
}
.top-user-total {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 42px;
  padding: 6px 10px;
  border-radius: 8px;
  background: $blue-bg;
  border: 1.5px solid $blue-l;
  font-size: 18px;
  font-weight: 800;
  font-family: 'JetBrains Mono', monospace;
  color: $blue-d;
  line-height: 1;
  span {
    font-size: 9px;
    font-weight: 600;
    color: $text-secondary;
    font-family: 'Plus Jakarta Sans', sans-serif;
    margin-top: 2px;
    text-transform: uppercase;
  }
  &.total--gold {
    background: #fefce8;
    border-color: #f1c40f;
    color: #d97706;
  }
}

.show-all-btn {
  width: 100%;
  margin-top: 4px;
  padding: 10px;
  border: 1.5px dashed $blue-l;
  border-radius: 10px;
  background: transparent;
  color: $blue;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  span {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &:hover {
    background: $blue-bg;
    border-style: solid;
    border-color: $blue;
    transform: translateY(-1px);
  }
}

.activity-feed {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  transition: background 0.15s;
  &:hover {
    background: $blue-bg;
  }
  &--danger .activity-icon {
    color: #f56c6c;
    background: #fef0f0;
  }
  &--success .activity-icon {
    color: #67c23a;
    background: #f0f9eb;
  }
  &--warning .activity-icon {
    color: #e6a23c;
    background: #fdf6ec;
  }
  &--info .activity-icon {
    color: $blue;
    background: $blue-bg;
  }
}
.activity-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #dcdfe6;
  flex-shrink: 0;
  .activity-item--success & {
    background: #67c23a;
  }
  .activity-item--danger & {
    background: #f56c6c;
  }
  .activity-item--warning & {
    background: #e6a23c;
  }
  .activity-item--info & {
    background: $blue;
  }
}
.activity-icon {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
}
.activity-content {
  flex: 1;
  min-width: 0;
}
.activity-actor {
  font-weight: 700;
  font-size: 13px;
  color: $text-primary;
  margin-right: 6px;
}
.activity-msg {
  font-size: 13px;
  color: $text-regular;
}
.activity-time {
  font-size: 11px;
  color: $text-secondary;
  flex-shrink: 0;
  white-space: nowrap;
}
.empty-state {
  text-align: center;
  padding: 24px;
  color: $text-secondary;
  font-size: 13px;
}

// ── AUDIT LOG ─────────────────────────────────────────────
.audit-mini-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 22px;
  flex-wrap: wrap;
}
.audit-ms-item {
  background: $bg-white;
  border: 1px solid $border;
  border-radius: 10px;
  padding: 14px 20px;
  min-width: 120px;
  text-align: center;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
}
.audit-ms-val {
  display: block;
  font-size: 26px;
  font-weight: 800;
  font-family: 'JetBrains Mono', monospace;
  color: $text-primary;
}
.audit-ms-lbl {
  display: block;
  font-size: 11px;
  color: $text-secondary;
  font-weight: 600;
  margin-top: 3px;
}

.audit-timeline {
  display: flex;
  flex-direction: column;
}
.audit-entry {
  display: flex;
  align-items: flex-start;
  position: relative;
  padding-left: 48px;
  padding-bottom: 20px;
  &__line {
    position: absolute;
    left: 20px;
    top: 28px;
    bottom: 0;
    width: 2px;
    background: $border;
  }
  &:last-child .audit-entry__line {
    display: none;
  }
  &__dot {
    position: absolute;
    left: 8px;
    top: 0;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    background: #f5f7fa;
    border: 2px solid $border;
    color: $text-secondary;
    flex-shrink: 0;
    .audit-entry--success & {
      background: #f0f9eb;
      border-color: #b3e19d;
      color: #67c23a;
    }
    .audit-entry--danger & {
      background: #fef0f0;
      border-color: #fbc4c4;
      color: #f56c6c;
    }
    .audit-entry--warning & {
      background: #fdf6ec;
      border-color: #f5dab1;
      color: #e6a23c;
    }
    .audit-entry--info & {
      background: $blue-bg;
      border-color: $blue-l;
      color: $blue;
    }
  }
  &__body {
    flex: 1;
    background: $bg-white;
    border: 1px solid $border;
    border-radius: 10px;
    padding: 12px 16px;
    box-shadow: 0 1px 5px rgba(0, 0, 0, 0.04);
  }
  &__top {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 6px;
  }
  &__actor {
    font-size: 13px;
    font-weight: 700;
    color: $text-primary;
  }
  &__action-tag {
    font-size: 10px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 20px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    &.tag--success {
      background: #f0f9eb;
      color: #67c23a;
    }
    &.tag--danger {
      background: #fef0f0;
      color: #f56c6c;
    }
    &.tag--warning {
      background: #fdf6ec;
      color: #e6a23c;
    }
    &.tag--info {
      background: $blue-bg;
      color: $blue;
    }
  }
  &__time {
    margin-left: auto;
    font-size: 11px;
    color: $text-secondary;
    white-space: nowrap;
  }
  &__msg {
    font-size: 13px;
    color: $text-regular;
  }
  &__meta {
    font-size: 11px;
    color: $text-secondary;
    margin-top: 4px;
    background: #f5f7fa;
    padding: 4px 8px;
    border-radius: 5px;
  }
}

.empty-audit {
  text-align: center;
  padding: 50px 20px;
  background: $bg-white;
  border-radius: 14px;
  border: 1px solid $border;
  &__icon {
    font-size: 42px;
    margin-bottom: 12px;
  }
  &__title {
    font-size: 16px;
    font-weight: 700;
    color: $text-primary;
    margin-bottom: 8px;
  }
  &__sub {
    font-size: 13px;
    color: $text-secondary;
  }
}

// ── USER DRAWER ───────────────────────────────────────────
.user-drawer {
  padding: 10px;
  text-align: center;
  &__avatar {
    width: 70px;
    height: 70px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    margin: 0 auto 12px;
    &.av--admin {
      background: linear-gradient(135deg, #67c23a, #95d475);
    }
    &.av--user {
      background: linear-gradient(135deg, $blue-d, $blue);
    }
  }
  &__name {
    font-size: 18px;
    font-weight: 800;
    color: $text-primary;
  }
  &__un {
    font-size: 13px;
    color: $text-secondary;
    margin-bottom: 10px;
  }
  &__tags {
    display: flex;
    gap: 8px;
    justify-content: center;
    margin-bottom: 4px;
  }
  &__fields {
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  &__actions {
    text-align: left;
  }
}
.udf-row {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  &:nth-child(odd) {
    background: $bg-page;
  }
}
.udf-lbl {
  font-size: 12px;
  color: $text-secondary;
  font-weight: 600;
  min-width: 160px;
  display: flex;
  align-items: center;
  gap: 5px;
}
.udf-val {
  font-size: 13px;
  font-weight: 600;
  color: $text-primary;
}

.user-audit-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 240px;
  overflow-y: auto;
}
.user-audit-item {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 12px;
  color: $text-regular;
  border: 1px solid $border;
}
.user-audit-time {
  margin-left: auto;
  font-size: 10px;
  color: $text-secondary;
  white-space: nowrap;
  padding-left: 8px;
}

// ── SETTINGS ─────────────────────────────────────────────
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 18px;
}
.settings-card {
  background: $bg-white;
  padding: 34px;
  border-radius: 16px;
  box-shadow: 0 2px 14px rgba(0, 0, 0, 0.05);
  border: 1px solid $border;
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
    color: #fff;
    margin-bottom: 16px;
    box-shadow: 0 5px 14px rgba($blue, 0.28);
    &--purple {
      background: linear-gradient(135deg, #7d3c98, #9b59b6);
      box-shadow: 0 5px 14px rgba(#9b59b6, 0.28);
    }
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
    min-width: 135px;
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
    cursor: pointer;
    &:hover:not(:disabled) {
      background: $blue;
      color: #fff;
      border-color: $blue;
      transform: translateY(-2px);
      box-shadow: 0 6px 18px rgba($blue, 0.26);
    }
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .is-loading {
      animation: rotating 2s linear infinite;
    }
  }
}

// ── ANIMATIONS ────────────────────────────────────────────
@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
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
@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 0 0 3px rgba(103, 194, 58, 0.3);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(103, 194, 58, 0.1);
  }
}

// ── RESPONSIVE ────────────────────────────────────────────
@media (max-width: 1024px) {
  .adm-header {
    padding: 22px 24px 18px;
  }
  .adm-header__inner {
    flex-direction: column;
    align-items: flex-start;
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
    overflow-x: hidden;
    overflow-y: visible;
    padding: 16px 12px;
  }
  .kpi-grid {
    grid-template-columns: 1fr 1fr;
  }
  .dash-row {
    grid-template-columns: 1fr;
  }
}

.kp-admin-comment {
  color: #b45309;
  font-style: italic;
}
.admin-comment-textarea :deep(.el-textarea__inner) {
  border-color: #f59e0b;
  background: #fffaf0;
}
.kp-filtered-count {
  font-size: 13px;
  color: #6b7280;
  white-space: nowrap;
}
.col-filter-admin {
  width: 100%;
  box-sizing: border-box;
  padding: 5px 7px;
  font-size: 12px;
  font-weight: 400;
  text-transform: none;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: white;
  color: #374151;

  &:focus {
    outline: none;
    border-color: #409eff;
  }
}
.kp-pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}
</style>
