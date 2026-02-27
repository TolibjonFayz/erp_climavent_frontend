<template>
  <div class="coming-soon-wrapper">
    <div class="blob blob-1"></div>
    <div class="blob blob-2"></div>
    <div class="blob blob-3"></div>
    <div class="grid-overlay"></div>

    <div class="content">
      <!-- Badge -->
      <div class="badge">
        <span class="badge-dot"></span>
        {{ $t('comingSoon') }}
      </div>

      <!-- Main heading -->
      <h1 class="heading">
        <span class="line-1">{{ $t('tez') }}</span>
        <span class="line-2">{{ $t('kunda') }}</span>
      </h1>

      <!-- Decorative line -->
      <div class="divider">
        <span class="divider-line"></span>
        <span class="divider-icon">◆</span>
        <span class="divider-line"></span>
      </div>

      <!-- Description -->
      <p class="description">
        {{ $t('yangiTajriba') }}<br />
        {{ $t('sahifamizTezOradaIshgaTushadi') }}
      </p>
    </div>
  </div>
</template>

<script setup></script>

<style scoped>
/* ─── Wrapper ────────────────────────────────────── */
.coming-soon-wrapper {
  position: relative;
  width: 100%;
  /* 100dvh — mobilda address bar ni hisobga oladi, oq joy qolmaydi */
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  overflow: hidden;
  font-family: 'Georgia', serif;
  box-sizing: border-box;
  padding: 24px 16px;
}

/* ─── Background blobs ──────────────────────────── */
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  pointer-events: none;
  animation: blobFloat 8s ease-in-out infinite alternate;
}
.blob-1 {
  width: 500px;
  height: 500px;
  background: rgba(64, 158, 255, 0.18);
  top: -100px;
  left: -100px;
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
  pointer-events: none;
  background-image:
    linear-gradient(rgba(64, 158, 255, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(64, 158, 255, 0.06) 1px, transparent 1px);
  background-size: 60px 60px;
}

/* ─── Content card ──────────────────────────────── */
.content {
  position: relative;
  z-index: 10;
  text-align: center;
  padding: 60px 48px;
  max-width: 560px;
  width: 100%;
  box-sizing: border-box;

  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(64, 158, 255, 0.18);
  border-radius: 24px;
  box-shadow:
    0 0 0 1px rgba(64, 158, 255, 0.06),
    0 24px 64px rgba(64, 158, 255, 0.1),
    0 4px 16px rgba(0, 0, 0, 0.06);

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
  font-size: clamp(48px, 10vw, 96px);
  font-weight: 400;
  letter-spacing: -0.02em;
  color: #4a6fa5;
  font-style: italic;
}
.line-2 {
  display: block;
  font-size: clamp(64px, 14vw, 128px);
  font-weight: 700;
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
  font-style: italic;
}

/* ─── Responsive ─────────────────────────────────── */
@media (max-width: 600px) {
  .coming-soon-wrapper {
    padding: 20px 14px;
    /* min-height HECH QACHON o'zgarmaydi, 100dvh qoladi */
  }

  .content {
    padding: 36px 22px;
    border-radius: 18px;
  }

  .blob-1 {
    width: 260px;
    height: 260px;
    top: -50px;
    left: -50px;
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
  .grid-overlay {
    background-size: 40px 40px;
  }

  .badge {
    font-size: 10px;
    padding: 5px 12px;
    margin-bottom: 22px;
    letter-spacing: 0.08em;
  }

  .line-1 {
    font-size: clamp(34px, 11vw, 52px);
  }
  .line-2 {
    font-size: clamp(46px, 16vw, 72px);
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

@media (max-width: 380px) {
  .content {
    padding: 28px 16px;
    border-radius: 14px;
  }
  .line-1 {
    font-size: 30px;
  }
  .line-2 {
    font-size: 40px;
  }
  .badge {
    font-size: 9px;
    padding: 4px 10px;
  }
}
</style>
