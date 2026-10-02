<template>
  <div class="admin-wrap">
    <header class="adm-header">
      <div class="adm-header__left">
        <div class="adm-logo">
          <el-icon :size="20"><Grid /></el-icon>
        </div>
        <div>
          <h1 class="adm-title">Admin panel</h1>
          <p class="adm-sub">Tizim boshqaruvchisining paneli · barcha ma'lumotlar bir joyda</p>
        </div>
      </div>
      <div class="adm-header__right">
        <span class="adm-clock">
          {{ greeting }} · <b>{{ liveTime }}</b> · {{ todayFormatted }}
        </span>
        <span class="adm-status"><span class="status-dot"></span>Tizim ishlayapti</span>
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
            <UiStat
              label="Jami foydalanuvchilar"
              :value="fmtNum(usersStore.allUsers.length)"
              :sub="`${adminCount} admin · ${userCount} oddiy · bu oy +${newUsersThisMonth}`"
            />
            <UiStat
              label="Jami hamkorlar"
              tone="good"
              :value="fmtNum(partnersStore.allPartners.length)"
              :sub="`Eng ko'p: ${topPartnerType.label}`"
            />
            <UiStat
              label="Jami obyektlar"
              :value="fmtNum(comeandgoInsideStore.allComeAndGoInsides.length)"
              :sub="`So'nggi: ${lastObjectDate}`"
            />
            <UiStat
              label="Audit amallar"
              tone="warn"
              :value="fmtNum(auditLogs.length)"
              :sub="`${todayAuditCount} ta bugun`"
            />
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
                <span class="dash-card__title">Eng faol foydalanuvchilar</span>
                <el-tag size="small" type="info" effect="plain">Top 5</el-tag>
              </div>
              <div class="top-users">
                <div v-for="(u, idx) in visibleActiveUsers" :key="u.username" class="top-user-row">
                  <!-- Rank -->
                  <span class="top-user-rank">
                    {{ idx + 1 }}
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
                    {{ row.is_admin ? 'Admin' : 'User' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="Holat" width="150" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.is_blocked ? 'danger' : 'success'" size="small">
                    {{ row.is_blocked ? 'Bloklangan' : 'Faol' }}
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
                      v-if="row.id !== usersStore.currentUser?.id"
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
                      v-if="row.id !== usersStore.currentUser?.id"
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

        <!-- ═══════ RUXSATLAR ═══════ -->
        <div v-if="activeTab === 'permissions'" class="adm-page">
          <div class="page-head">
            <span class="page-accent"></span>
            <h2 class="page-title">Sahifalarga ruxsatlar</h2>
          </div>
          <div class="adm-toolbar">
            <el-input
              v-model="usersSearch"
              placeholder="Foydalanuvchi qidiruv (ism, username)..."
              :prefix-icon="Search"
              clearable
              class="adm-search"
            />
          </div>
          <div class="tbl-wrap" v-loading="usersLoading">
            <el-table
              :data="filteredUsers"
              stripe
              border
              style="width: 100%"
              empty-text="Ma'lumot yo'q"
            >
              <el-table-column label="Foydalanuvchi" min-width="250" fixed="left">
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
              
              <el-table-column 
                v-for="page in permissionPages" 
                :key="page.key" 
                :label="page.title" 
                min-width="110" 
                align="center"
              >
                <template #default="{ row }">
                  <el-switch
                    :model-value="hasPermission(row, page.key)"
                    :loading="updatingPermissions[`${row.id}-${page.key}`]"
                    style="--el-switch-on-color: #15803d"
                    @change="(val) => handleTogglePermission(row, page.key, val)"
                  />
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
              empty-text="Hech narsa topilmadi"
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
              empty-text="Hech narsa topilmadi"
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

        <!-- ═══════ amoCRM ═══════ -->
        <div v-if="activeTab === 'amocrm'" class="adm-page">
          <div class="page-head">
            <span class="page-accent"></span>
            <h2 class="page-title">amoCRM</h2>
          </div>
          <AmoCrmStats />
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
              empty-text="Hech narsa topilmadi"
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
              <div class="empty-audit__icon"><el-icon><Search /></el-icon></div>
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
            {{ selectedUser.is_admin ? 'Admin' : 'User' }}
          </el-tag>
          <el-tag :type="selectedUser.is_blocked ? 'danger' : 'success'">
            {{ selectedUser.is_blocked ? 'Bloklangan' : 'Faol' }}
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

        <div class="user-drawer__actions" v-if="selectedUser.id !== usersStore.currentUser?.id">
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
import AmoCrmStats from '@/components/amocrm/AmoCrmStats.vue'
import UiStat from '@/components/ui/UiStat.vue'
import { fmtNum } from '@/utils/format'
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
  { name: 'permissions', label: 'Ruxsatlar', icon: Key },
  { name: 'partners', label: 'Hamkorlar', icon: UserFilled },
  { name: 'objects', label: 'Obyektlar', icon: OfficeBuilding },
  { name: 'kp', label: 'KP', icon: Document },
  { name: 'amocrm', label: 'amoCRM', icon: Phone },
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
  if (h >= 5 && h < 12) return 'Xayrli tong'
  if (h >= 12 && h < 17) return 'Xayrli kun'
  if (h >= 17 && h < 21) return 'Xayrli kech'
  return 'Xayrli tun'
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
    
    // Call API
    await usersStore.updateUser(user.id, { is_admin: newRole })

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
  } catch (err) {
    if (err !== 'cancel') {
      const msg = err?.response?.data?.message || err.message || "Xatolik yuz berdi";
      ElMessage.error(msg)
      console.error(err)
    }
  }
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
    
    // Call API
    await usersStore.updateUser(user.id, { is_blocked: newBlock })

    user.is_blocked = newBlock
    if (closeDrawer) userDetailVisible.value = false
    addAuditLog({
      action: newBlock ? 'block' : 'unblock',
      message: `"${user.firstname} ${user.lastname}" (@${user.username}) — ${newBlock ? 'Bloklandi' : 'Blok ochildi'}`,
      type: newBlock ? 'danger' : 'success',
      target_id: user.id,
    })
    ElMessage.success(`✅ ${newBlock ? 'Bloklash' : 'Blokdan chiqarish'} muvaffaqiyatli!`)
  } catch (err) {
    if (err !== 'cancel') {
      const msg = err?.response?.data?.message || err.message || "Xatolik yuz berdi";
      ElMessage.error(msg)
      console.error(err)
    }
  }
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

// ─── Permissions ──────────────────────────────────────────
const permissionPages = [
  { key: 'customers', title: 'Mijozlar' },
  { key: 'sites', title: 'Obyektlar' },
  { key: 'competitors', title: 'Raqiblar' },
  { key: 'kp', title: 'KP' },
  { key: 'dogovor', title: 'Dogovor' },
  { key: 'loyiha', title: 'Loyiha' },
  { key: 'attendance', title: 'Davomat' },
  { key: 'tasks', title: 'Vazifalar' },
  { key: 'boss', title: 'Boss' },
]

const updatingPermissions = ref({})

const hasPermission = (user, pageKey) => {
  if (pageKey === 'boss') {
    if (user.permissions?.boss !== undefined) return user.permissions.boss;
    return Number(user.id) === 16;
  }
  return user.permissions?.[pageKey] !== false
}

const handleTogglePermission = async (user, pageKey, val) => {
  const currentPerms = user.permissions || {}
  const newPerms = { ...currentPerms, [pageKey]: val }
  
  updatingPermissions.value[`${user.id}-${pageKey}`] = true
  try {
    await usersStore.updateUser(user.id, { permissions: newPerms })
    ElMessage.success("Ruxsat saqlandi")
    user.permissions = newPerms 
  } catch (err) {
    ElMessage.error("Xatolik yuz berdi")
    // ui revert handled by user not being updated in store if it threw, 
    // but better to explicitly revert
  } finally {
    updatingPermissions.value[`${user.id}-${pageKey}`] = false
  }
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
/* Admin panel — umumiy klassik uslub (--ui-* tokenlar, main.css) */
.admin-wrap {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  color: var(--ui-ink-2);
  background: var(--ui-surface-2);
  box-sizing: border-box;

  h1,
  h2,
  h3,
  p {
    margin: 0;
  }
  button {
    font-family: inherit;
  }
}

// ── SARLAVHA ─────────────────────────────────────────────
.adm-header {
  display: flex;
  flex-shrink: 0;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 24px;
  min-height: 64px;
  padding: 10px 24px;
  background: var(--ui-surface);
  border-bottom: 1px solid var(--ui-line);

  &__left {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }
  &__right {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px 16px;
    font-size: 12px;
    color: var(--ui-muted);
  }
}
.adm-logo {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--ui-link);
  background: var(--ui-link-soft);
  border-radius: 8px;
}
.adm-title {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.25;
  color: var(--ui-ink);
}
.adm-sub {
  font-size: 12px;
  color: var(--ui-muted);
}
.adm-clock b {
  font-weight: 600;
  color: var(--ui-ink);
  font-variant-numeric: tabular-nums;
}
.adm-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  font-weight: 600;
  color: var(--ui-good);
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 999px;
}
.status-dot {
  width: 7px;
  height: 7px;
  background: var(--ui-good);
  border-radius: 50%;
}

// ── TANA ─────────────────────────────────────────────────
.adm-body {
  display: flex;
  flex: 1;
  min-height: 0;
}
.adm-sidebar {
  display: flex;
  flex-direction: column;
  width: 220px;
  min-width: 220px;
  padding: 12px 10px;
  overflow-y: auto;
  background: var(--ui-surface);
  border-right: 1px solid var(--ui-line);
}
.adm-nav {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
}
.adm-nav__item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  font-size: 13px;
  font-weight: 500;
  text-align: left;
  color: var(--ui-ink-2);
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.12s;

  &:hover {
    background: var(--ui-surface-2);
  }
  &.is-active {
    font-weight: 600;
    color: var(--ui-link);
    background: var(--ui-link-soft);

    .adm-nav__icon {
      color: var(--ui-link);
    }
  }
}
.adm-nav__icon {
  display: flex;
  font-size: 16px;
  color: var(--ui-muted);
}
.adm-nav__lbl {
  flex: 1;
  white-space: nowrap;
}
.nav-badge {
  min-width: 20px;
  padding: 0 6px;
  font-size: 11px;
  font-weight: 600;
  line-height: 18px;
  text-align: center;
  color: var(--ui-muted);
  background: var(--ui-line-soft);
  border-radius: 999px;
}
.adm-sidebar__footer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--ui-line);
}
.adm-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 6px;

  > div:last-child {
    display: flex;
    flex-direction: column;
  }
}
.adm-user__av {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ui-link);
  background: var(--ui-link-soft);
  border-radius: 50%;
}
.adm-user__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--ui-ink);
}
.adm-user__role {
  font-size: 11px;
  color: var(--ui-muted);
}
.adm-exit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 10px;
  font-size: 13px;
  color: var(--ui-ink-2);
  background: var(--ui-surface);
  border: 1px solid var(--ui-line);
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    color: var(--ui-link);
    border-color: #bfdbfe;
  }
}
.adm-main {
  flex: 1;
  min-width: 0;
  padding: 20px 24px 32px;
  overflow-y: auto;
}
.adm-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 1440px;
  margin: 0 auto;
}

// ── SAHIFA SARLAVHASI ───────────────────────────────────
.page-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--ui-line);
}
.page-accent {
  display: none;
}
.page-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--ui-ink);
}
.page-date {
  margin-left: auto;
  font-size: 12px;
  color: var(--ui-muted);
}

// ── DASHBOARD ────────────────────────────────────────────
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.dash-row {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}
.dash-card {
  min-width: 0;
  background: var(--ui-surface);
  border: 1px solid var(--ui-line);
  border-radius: var(--ui-radius);
}
.dash-card__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--ui-line-soft);
}
.dash-card__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ui-ink);
}
.chart-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
}
.chart-bar-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}
.chart-bar-lbl {
  width: 190px;
  flex-shrink: 0;
  color: var(--ui-ink-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.chart-bar-track {
  flex: 1;
  height: 8px;
  overflow: hidden;
  background: var(--ui-line-soft);
  border-radius: 999px;
}
.chart-bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease;
}
.chart-bar-num {
  min-width: 36px;
  text-align: right;
  font-weight: 600;
  color: var(--ui-ink);
  font-variant-numeric: tabular-nums;
}

.top-users {
  display: flex;
  flex-direction: column;
  padding: 4px 16px 12px;
}
.top-user-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px dashed var(--ui-line);

  &:last-of-type {
    border-bottom: none;
  }
}
.top-user-rank {
  width: 22px;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  color: var(--ui-faint);
  font-variant-numeric: tabular-nums;
}
.top-user-av {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--ui-link);
  background: var(--ui-link-soft);
  border-radius: 50%;

  &.av--gold {
    color: #b45309;
    background: #fef3c7;
  }
  &.av--silver {
    color: #475569;
    background: #e2e8f0;
  }
  &.av--bronze {
    color: #9a3412;
    background: #ffedd5;
  }
}
.top-user-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.top-user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--ui-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.top-user-un {
  font-size: 11px;
  color: var(--ui-muted);
}
.top-user-bar {
  height: 4px;
  margin: 3px 0;
  overflow: hidden;
  background: var(--ui-line-soft);
  border-radius: 999px;

  &__fill {
    height: 100%;
    background: var(--ui-link);
    border-radius: 999px;
  }
}
.top-user-stats {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--ui-muted);
}
.tus-item {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.tus-divider {
  color: var(--ui-faint);
}
.top-user-total {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--ui-ink);
  font-variant-numeric: tabular-nums;

  span {
    font-size: 10px;
    font-weight: 500;
    color: var(--ui-muted);
  }
  &.total--gold {
    color: #b45309;
  }
}
.show-all-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 8px;
  padding: 8px;
  font-size: 12px;
  color: var(--ui-link);
  background: var(--ui-surface-2);
  border: 1px solid var(--ui-line);
  border-radius: 6px;
  cursor: pointer;

  span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  &:hover {
    background: var(--ui-link-soft);
  }
}
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 20px;
  font-size: 13px;
  color: var(--ui-faint);
}

.activity-feed {
  display: flex;
  flex-direction: column;
  padding: 4px 16px 8px;
}
.activity-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 0;
  font-size: 13px;
  border-bottom: 1px dashed var(--ui-line);

  &:last-of-type {
    border-bottom: none;
  }
}
.activity-dot {
  display: none;
}
.activity-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--ui-muted);
  background: var(--ui-line-soft);
  border-radius: 6px;
}
.activity-item--success .activity-icon {
  color: var(--ui-good);
  background: #f0fdf4;
}
.activity-item--warning .activity-icon {
  color: var(--ui-warn);
  background: #fffbeb;
}
.activity-item--danger .activity-icon {
  color: var(--ui-bad);
  background: #fef2f2;
}
.activity-content {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 4px;
  min-width: 0;
}
.activity-actor {
  font-weight: 600;
  color: var(--ui-ink);
}
.activity-msg {
  color: var(--ui-ink-2);
}
.activity-time {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--ui-faint);
  font-variant-numeric: tabular-nums;
}

// ── FILTRLAR ─────────────────────────────────────────────
.adm-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: var(--ui-surface-2);
  border: 1px solid var(--ui-line);
  border-radius: var(--ui-radius);
}
.adm-search {
  flex: 1 1 260px;
  max-width: 420px;
}
.adm-select {
  width: 180px;
}
.adm-reset-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  font-size: 13px;
  color: var(--ui-ink-2);
  background: var(--ui-surface);
  border: 1px solid var(--ui-line);
  border-radius: 6px;
  cursor: pointer;

  &:hover:not(:disabled) {
    color: var(--ui-link);
    border-color: #bfdbfe;
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
}
.kp-filtered-count {
  font-size: 13px;
  color: var(--ui-muted);
  white-space: nowrap;
}

// ── JADVALLAR ────────────────────────────────────────────
.tbl-wrap {
  overflow: hidden;
  background: var(--ui-surface);
  border: 1px solid var(--ui-line);
  border-radius: var(--ui-radius);

  :deep(.el-table) {
    --el-table-border-color: var(--ui-line-soft);

    th.el-table__cell {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--ui-muted);
      background: var(--ui-surface-2) !important;
    }
    td.el-table__cell {
      color: var(--ui-ink-2);
    }
    .kp-wrap-col .cell {
      white-space: normal;
      word-break: break-word;
      line-height: 1.5;
    }
  }
}
.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.user-cell__av {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  border-radius: 50%;
}
.av--admin {
  color: var(--ui-good);
  background: #f0fdf4;
}
.av--user {
  color: var(--ui-link);
  background: var(--ui-link-soft);
}
.user-cell__name {
  font-weight: 600;
  color: var(--ui-ink);
}
.user-cell__un {
  font-size: 12px;
  color: var(--ui-muted);
}
.action-btns {
  display: inline-flex;
  gap: 4px;
}
.act-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ui-muted);
  background: var(--ui-surface);
  border: 1px solid var(--ui-line);
  border-radius: 6px;
  cursor: pointer;
  transition:
    color 0.12s,
    border-color 0.12s;

  &--view:hover,
  &--promote:hover,
  &--unblock:hover {
    color: var(--ui-link);
    border-color: #bfdbfe;
  }
  &--promote {
    color: #b45309;
  }
  &--unblock {
    color: var(--ui-good);
  }
  &--demote,
  &--block {
    &:hover {
      color: var(--ui-bad);
      border-color: #fecaca;
    }
  }
}

// ── AUDIT ────────────────────────────────────────────────
.audit-mini-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.audit-ms-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
  background: var(--ui-surface);
  border: 1px solid var(--ui-line);
  border-radius: var(--ui-radius);
}
.audit-ms-val {
  font-size: 22px;
  font-weight: 700;
  color: var(--ui-ink);
  font-variant-numeric: tabular-nums;
}
.audit-ms-lbl {
  font-size: 12px;
  color: var(--ui-muted);
}
.audit-timeline {
  background: var(--ui-surface);
  border: 1px solid var(--ui-line);
  border-radius: var(--ui-radius);
}
.audit-entry {
  position: relative;
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--ui-line-soft);

  &:last-of-type {
    border-bottom: none;
  }
}
.audit-entry__line {
  display: none;
}
.audit-entry__dot {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--ui-muted);
  background: var(--ui-line-soft);
  border-radius: 6px;
}
.audit-entry--success .audit-entry__dot {
  color: var(--ui-good);
  background: #f0fdf4;
}
.audit-entry--warning .audit-entry__dot {
  color: var(--ui-warn);
  background: #fffbeb;
}
.audit-entry--danger .audit-entry__dot {
  color: var(--ui-bad);
  background: #fef2f2;
}
.audit-entry__body {
  flex: 1;
  min-width: 0;
}
.audit-entry__top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 12px;
  margin-bottom: 4px;
}
.audit-entry__actor,
.audit-entry__time {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}
.audit-entry__actor {
  font-weight: 600;
  color: var(--ui-ink);
}
.audit-entry__time {
  margin-left: auto;
  color: var(--ui-faint);
  font-variant-numeric: tabular-nums;
}
.audit-entry__action-tag {
  padding: 0 8px;
  font-size: 11px;
  font-weight: 600;
  line-height: 20px;
  color: var(--ui-muted);
  background: var(--ui-line-soft);
  border-radius: 999px;

  &.tag--success {
    color: var(--ui-good);
    background: #f0fdf4;
  }
  &.tag--warning {
    color: var(--ui-warn);
    background: #fffbeb;
  }
  &.tag--danger {
    color: var(--ui-bad);
    background: #fef2f2;
  }
  &.tag--info {
    color: var(--ui-link);
    background: var(--ui-link-soft);
  }
}
.audit-entry__msg {
  font-size: 13px;
  color: var(--ui-ink-2);
}
.audit-entry__meta {
  margin-top: 4px;
  font-size: 12px;
  color: var(--ui-muted);
}
.empty-audit {
  padding: 40px 16px;
  text-align: center;

  &__icon {
    font-size: 26px;
    color: var(--ui-faint);
  }
  &__title {
    margin-top: 6px;
    font-size: 14px;
    font-weight: 600;
    color: var(--ui-ink);
  }
  &__sub {
    margin-top: 4px;
    font-size: 13px;
    color: var(--ui-muted);
  }
}

// ── SOZLAMALAR ───────────────────────────────────────────
.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.settings-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  background: var(--ui-surface);
  border: 1px solid var(--ui-line);
  border-radius: var(--ui-radius);
}
.sc-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
  color: var(--ui-link);
  background: var(--ui-link-soft);
  border-radius: 8px;

  &--purple {
    color: #6d28d9;
    background: #f5f3ff;
  }
}
.sc-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ui-ink);
}
.sc-desc {
  font-size: 13px;
  color: var(--ui-muted);
}
.sc-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.sc-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 14px;
  font-size: 13px;
  color: var(--ui-ink-2);
  background: var(--ui-surface);
  border: 1px solid var(--ui-line);
  border-radius: 6px;
  cursor: pointer;

  &:hover:not(:disabled) {
    color: var(--ui-link);
    border-color: #bfdbfe;
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
}

// ── FOYDALANUVCHI DRAWER ─────────────────────────────────
.user-drawer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;

  &__avatar {
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }
  &__name {
    font-size: 17px;
    font-weight: 700;
    color: var(--ui-ink);
  }
  &__un {
    font-size: 13px;
    color: var(--ui-muted);
  }
  &__tags {
    display: flex;
    gap: 6px;
    margin-top: 4px;
  }
  &__fields {
    width: 100%;
    text-align: left;
  }
  &__actions {
    width: 100%;
  }
  :deep(.el-divider) {
    margin: 16px 0;
  }
}
.udf-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 0;
  font-size: 13px;
  border-bottom: 1px dashed var(--ui-line);

  &:last-child {
    border-bottom: none;
  }
}
.udf-lbl {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ui-muted);
}
.udf-val {
  font-weight: 600;
  color: var(--ui-ink);
}
.user-audit-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  text-align: left;
}
.user-audit-item {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  padding: 8px 10px;
  font-size: 12px;
  color: var(--ui-ink-2);
  background: var(--ui-surface-2);
  border: 1px solid var(--ui-line-soft);
  border-radius: 6px;
}
.user-audit-time {
  margin-left: auto;
  font-size: 11px;
  color: var(--ui-faint);
}

// ── KP ───────────────────────────────────────────────────
.kp-admin-comment {
  font-style: italic;
  color: var(--ui-warn);
}
.admin-comment-textarea :deep(.el-textarea__inner) {
  background: #fffbeb;
  border-color: #fcd34d;
}
.col-filter-admin {
  width: 100%;
  box-sizing: border-box;
  padding: 4px 7px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  color: var(--ui-ink-2);
  background: var(--ui-surface);
  border: 1px solid var(--ui-line);
  border-radius: 6px;

  &:focus {
    outline: none;
    border-color: var(--ui-link);
  }
}
.kp-pagination-bar {
  display: flex;
  justify-content: flex-end;
}

// ── MOSLASHUVCHAN ────────────────────────────────────────
@media (max-width: 1200px) {
  .kpi-grid,
  .audit-mini-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .dash-row {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (max-width: 1024px) {
  .adm-sidebar {
    width: 190px;
    min-width: 190px;
  }
  .adm-main {
    padding: 16px;
  }
  .chart-bar-lbl {
    width: 130px;
  }
}
@media (max-width: 640px) {
  .admin-wrap {
    height: auto;
    overflow: visible;
  }
  .adm-header {
    padding: 10px 12px;
  }
  .adm-body {
    flex-direction: column;
  }
  .adm-sidebar {
    width: 100%;
    min-width: 0;
    padding: 8px;
    overflow-x: auto;
    overflow-y: hidden;
    border-right: none;
    border-bottom: 1px solid var(--ui-line);

    .adm-nav {
      flex-direction: row;
      min-width: max-content;
    }
    .adm-sidebar__footer {
      display: none;
    }
  }
  .adm-main {
    padding: 12px;
    overflow: visible;
  }
  .settings-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .adm-select {
    width: 100%;
  }
}
</style>
