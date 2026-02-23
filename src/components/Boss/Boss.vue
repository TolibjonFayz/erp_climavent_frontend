<template>
  <!--
    Eslatma: Bu komponentning parent elementi (router-view yoki main content)
    quyidagi stillarga ega bo'lishi kerak:
      height: 100%;
      display: flex;
      flex: 1;
    Yoki layout da .main-content { flex: 1; overflow: hidden; }
  -->
  <div class="coming-soon-wrapper">
    <!-- Animated background blobs -->
    <div class="blob blob-1"></div>
    <div class="blob blob-2"></div>
    <div class="blob blob-3"></div>

    <!-- Grid overlay -->
    <div class="grid-overlay"></div>

    <div class="content">
      <!-- Badge -->
      <div class="badge">
        <span class="badge-dot"></span>
        Ishlab chiqilmoqda
      </div>

      <!-- Main heading -->
      <h1 class="heading">
        <span class="line-1">Tez</span>
        <span class="line-2">Kunda</span>
      </h1>

      <!-- Decorative line -->
      <div class="divider">
        <span class="divider-line"></span>
        <span class="divider-icon">◆</span>
        <span class="divider-line"></span>
      </div>

      <!-- Description -->
      <p class="description">
        Yangi tajriba sizni kutmoqda.<br />
        Sahifamiz tez orada ishga tushadi.
      </p>
    </div>
  </div>
</template>

<script setup></script>

<style scoped>
/* ─── Element Plus primary blue ─────────────────── */
:root {
  --el-blue: #409eff;
  --el-blue-light: #79bbff;
  --el-blue-dark: #337ecc;
  --el-blue-subtle: rgba(64, 158, 255, 0.08);
}

/* ─── Wrapper ────────────────────────────────────── */
.coming-soon-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  overflow: hidden;
  font-family: 'Georgia', serif;
  box-sizing: border-box;
}

/* ─── Background blobs ──────────────────────────── */
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  animation: blobFloat 8s ease-in-out infinite alternate;
}
.blob-1 {
  width: 500px;
  height: 500px;
  background: rgba(64, 158, 255, 0.18);
  top: -100px;
  left: -100px;
  animation-delay: 0s;
}
.blob-2 {
  width: 360px;
  height: 360px;
  background: rgba(121, 187, 255, 0.14);
  bottom: -60px;
  right: -60px;
  animation-delay: 2s;
}
.blob-3 {
  width: 240px;
  height: 240px;
  background: rgba(64, 158, 255, 0.1);
  top: 50%;
  left: 55%;
  animation-delay: 4s;
}
@keyframes blobFloat {
  from {
    transform: translate(0, 0) scale(1);
  }
  to {
    transform: translate(30px, 20px) scale(1.08);
  }
}

/* ─── Grid overlay ──────────────────────────────── */
.grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(64, 158, 255, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(64, 158, 255, 0.06) 1px, transparent 1px);
  background-size: 60px 60px;
}

/* ─── Content ───────────────────────────────────── */
.content {
  position: relative;
  z-index: 10;
  text-align: center;
  padding: 60px 40px;
  max-width: 560px;
  width: calc(100% - 48px);
  margin: 24px auto;

  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(64, 158, 255, 0.18);
  border-radius: 24px;
  box-shadow:
    0 0 0 1px rgba(64, 158, 255, 0.06),
    0 24px 64px rgba(64, 158, 255, 0.1),
    0 4px 16px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;

  animation: fadeUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ─── Badge ─────────────────────────────────────── */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(64, 158, 255, 0.08);
  border: 1px solid rgba(64, 158, 255, 0.25);
  color: #337ecc;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 6px 16px;
  border-radius: 999px;
  margin-bottom: 32px;
}
.badge-dot {
  width: 7px;
  height: 7px;
  background: #409eff;
  border-radius: 50%;
  animation: pulse 1.6s ease-in-out infinite;
}
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.3;
    transform: scale(0.75);
  }
}

/* ─── Heading ───────────────────────────────────── */
.heading {
  margin: 0 0 20px;
  line-height: 1;
}
.line-1 {
  display: block;
  font-size: clamp(56px, 10vw, 96px);
  font-weight: 400;
  letter-spacing: -0.02em;
  color: #4a6fa5;
  font-style: italic;
}
.line-2 {
  display: block;
  font-size: clamp(72px, 14vw, 128px);
  font-weight: 700;
  font-style: normal;
  letter-spacing: -0.04em;
  background: linear-gradient(135deg, #409eff 0%, #337ecc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ─── Divider ───────────────────────────────────── */
.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px auto 24px;
  max-width: 220px;
}
.divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(64, 158, 255, 0.35), transparent);
}
.divider-icon {
  color: #409eff;
  font-size: 10px;
  opacity: 0.6;
}

/* ─── Description ───────────────────────────────── */
.description {
  color: #7a9bbf;
  font-size: 15px;
  line-height: 1.8;
  margin: 0;
  font-family: 'Georgia', serif;
  font-style: italic;
}

/* ─── Responsive ─────────────────────────────────── */

/* Tablet (768px va kichik) */
@media (max-width: 768px) {
  .coming-soon-wrapper {
    padding: 0;
    min-height: 100%;
  }

  .content {
    padding: 40px 24px;
    border-radius: 20px;
    width: calc(100% - 32px);
    margin: 20px auto;
  }

  .blob-1 {
    width: 280px;
    height: 280px;
    top: -40px;
    left: -40px;
  }
  .blob-2 {
    width: 200px;
    height: 200px;
    bottom: -30px;
    right: -30px;
  }
  .blob-3 {
    display: none;
  }

  .badge {
    font-size: 10px;
    padding: 5px 12px;
    margin-bottom: 20px;
    letter-spacing: 0.08em;
  }

  .line-1 {
    font-size: clamp(32px, 10vw, 56px);
  }
  .line-2 {
    font-size: clamp(42px, 14vw, 76px);
  }

  .heading {
    margin: 0 0 14px;
  }

  .divider {
    margin: 14px auto 18px;
  }

  .description {
    font-size: 13px;
  }
}

/* Mobile (480px va kichik) */
@media (max-width: 480px) {
  .content {
    padding: 32px 18px;
    border-radius: 16px;
    width: calc(100% - 24px);
    margin: 16px auto;
  }

  .blob-1 {
    width: 200px;
    height: 200px;
  }
  .blob-2 {
    width: 160px;
    height: 160px;
  }

  .badge {
    font-size: 9px;
    padding: 4px 11px;
    margin-bottom: 16px;
  }

  .line-1 {
    font-size: clamp(28px, 11vw, 44px);
  }
  .line-2 {
    font-size: clamp(36px, 15vw, 60px);
  }

  .description {
    font-size: 12px;
    line-height: 1.7;
  }

  .grid-overlay {
    background-size: 40px 40px;
  }
}

/* Juda kichik ekranlar (360px va kichik) */
@media (max-width: 360px) {
  .content {
    padding: 26px 14px;
  }
  .line-1 {
    font-size: 26px;
  }
  .line-2 {
    font-size: 34px;
  }
}
</style>
