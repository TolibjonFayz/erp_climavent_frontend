# Climavent ERP — mobil ilova (Android / iOS)

Ilova shu loyihaning ichida: API, store va utillar sayt bilan umumiy (`src/api`, `src/stores`, `src/utils`),
telefon uchun ekranlar alohida — `src/mobile/`. Native qobiq — [Capacitor 8](https://capacitorjs.com).

| Bo'lim | Ilovada |
| --- | --- |
| Mijozlar | ro'yxat, qidiruv, guruh/viloyat filtri, kartochka (qo'ng'iroq, izoh, 1 kunlik tahrir), yangi mijoz |
| Obyektlar | ro'yxat, yangi tashrif (GPS, xarita, Google/Yandex havola, 5 tagacha qo'shimcha obyekt, kamera/galereya), tashrif sahifasi, media ko'rish/yuklash |
| Vazifalar | bosqichlar, tezkor filtrlar, tasdiq so'rash/tasdiqlash/rad etish, admin: yaratish/tahrir/o'chirish, hisobot |
| Davomat | oylik kalendar (kamera + obyektlar asosida taklif), kun tafsiloti, admin: tahrir va oyni tasdiqlash |
| Boss | KPI, e'lonlar, reyting va maqsadlar, admin huquqi, grafiklar |
| amoCRM | davr/menejer filtri, qo'ng'iroqlar, menejerlar, sdelkalar, xorijiy; ro'yxatlar va suhbat yozuvlari |
| KP, Dogovor, Loyiha, Raqiblar, Admin | hozircha saytda (`.env.mobile` → `VITE_WEB_URL` berilsa Menyu'da havola chiqadi) |

## Ishlab chiqish

```bash
npm run dev:mobile        # http://localhost:5185 — brauzerda telefon ko'rinishida oching
npm run build:mobile      # dist-mobile/
npm run cap:sync          # build + Android/iOS loyihalariga ko'chirish
```

API manzili `.env.mobile` da (prod). Mapbox tokeni `.env.mobile.local` da (git'ga kirmaydi) — yangi kompyuterda `.env` dagi `VITE_MAPBOX_TOKEN` ni shu faylga ko'chiring. Sayt build'iga (`npm run build`) ta'sir qilmaydi.

## Android

Talab: Android Studio (JDK 21 ichida bor), Android SDK 36.

```bash
npm run cap:sync
cd android && ./gradlew assembleDebug        # app/build/outputs/apk/debug/app-debug.apk
```

Yoki `npm run cap:android` — Android Studio'da ochadi (Run ▶ telefon/emulyatorda).

**Play Market uchun** (bir martalik): imzo kaliti yarating va uni xavfsiz joyda saqlang —
yo'qolsa ilovani yangilab bo'lmaydi:

```bash
keytool -genkey -v -keystore climavent-erp.jks -alias climavent -keyalg RSA -keysize 2048 -validity 10000
```

So'ng Android Studio → Build → Generate Signed App Bundle (`.aab`) → Play Console'ga yuklash
(Google Play Developer hisobi — bir martalik $25).

Har yangi versiyada `android/app/build.gradle` dagi `versionCode` ni +1, `versionName` ni
va `vite.mobile.config.js` dagi `MOBILE_VERSION` ni yangilang.

## iOS (iPhone)

iOS ilovani faqat **macOS + Xcode** da yig'ish mumkin (Apple qoidasi). Loyiha tayyor: `ios/`.

1. Mac'da: `npm ci && npm run cap:sync && npx cap open ios`
2. Xcode → Signing & Capabilities → Team (Apple Developer hisobi, yiliga $99)
3. Product → Archive → App Store Connect / TestFlight

Mac bo'lmasa — Codemagic yoki GitHub Actions (macOS runner) orqali bulutda yig'ish mumkin.

## Ruxsatlar

- Joylashuv — obyekt manzilini belgilash (`ACCESS_FINE_LOCATION`, `NSLocationWhenInUseUsageDescription`)
- Kamera, mikrofon — obyektdan rasm/video (`CAMERA`, `RECORD_AUDIO`, `NSCameraUsageDescription`, `NSMicrophoneUsageDescription`)
- Galereya — `NSPhotoLibraryUsageDescription`

## Ikonka va splash

Manba: `resources/` (Climavent logotipidan). Qayta generatsiya:

```bash
npx @capacitor/assets generate --iconBackgroundColor '#ffffff' --splashBackgroundColor '#ffffff'
```
