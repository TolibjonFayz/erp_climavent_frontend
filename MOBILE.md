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
| KP | ro'yxat (holat/izoh filtri, summalar), batafsil, yaratish/tahrir (2 kunlik oyna), Excel import |
| Dogovor | ro'yxat, shartnoma sahifasi (rekvizitlar, spetsifikatsiya + NDS), yaratish/tahrir, Excel import |
| Loyiha | ro'yxat, loyiha sahifasi, arxiv/ishchi fayl (yuklash, ko'rish, nomlash, almashtirish), yaratish/tahrir |
| Admin | umumiy ko'rsatkichlar, xodimlar (admin/blok/bo'lim ruxsatlari), barcha hamkorlar va obyektlar, audit |
| Eksport / PDF | KP, Dogovor, Loyiha, Vazifalar hisoboti, Admin ro'yxatlari — Excel (telefonda "Ulashish" oynasi); shartnoma — Android chop etish oynasi ("PDF sifatida saqlash") |
| Bildirishnoma | yangi vazifa, tasdiq so'rovi, tasdiqlandi/rad etildi, Boss e'loni (Android — FCM, iPhone — APNs) |
| Yangilanish | Admin panel → "Ilova versiyalari" ga APK yuklanadi, xodimlar ilovasi o'zi taklif qiladi |
| Hali saytda | Raqiblar (saytda ham "tez orada") |

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
cd android && ./gradlew assembleRelease      # app/build/outputs/apk/release/app-release.apk
```

**Imzo kaliti** — `D:\Tolibjon\Programming\Climavent\climavent-erp-keys\` (repodan tashqarida,
`MUHIM-O'QING.txt` ga qarang). `android/keystore.properties` shu kalitga ishora qiladi va git'ga
kirmaydi. Kalit yo'qolsa, o'rnatilgan ilovalarni yangilab bo'lmaydi — zaxira qiling.

### Yangi versiya chiqarish

1. `android/app/build.gradle`: `versionCode` +1, `versionName` (masalan `1.0.1`);
   `vite.mobile.config.js` → `MOBILE_VERSION` ham shu.
2. `npm run cap:sync && cd android && ./gradlew assembleRelease`
3. Ilovada: Menyu → Admin panel → **Ilova versiyalari** → APK, versiya, kod va "nima yangi".
4. Xodimlar ilovani ochganda "Yangi versiya" oynasi chiqadi → yuklab o'rnatadi.

Birinchi o'rnatishda telefon "noma'lum manbadan o'rnatish"ga ruxsat so'raydi (bir marta).

## Push-bildirishnomalar

Backend (`erp_climavent_backend/src/devices`) — yangi vazifa, tasdiq so'rovi, tasdiqlash/rad etish,
Boss e'loni. Sozlanmagan bo'lsa hech narsa buzilmaydi, faqat yuborilmaydi.

**Android (Firebase):**
1. Firebase console → loyiha → *Add app → Android*, package `uz.climavent.erp`.
2. `google-services.json` ni `android/app/` ga qo'ying (git'ga kiradi — maxfiy emas) va qayta build.
   Shu fayl bo'lsagina ilova bildirishnomaga ruxsat so'raydi.
3. Railway → ERP backend → `FIREBASE_SERVICE_ACCOUNT` = servis hisobi JSON
   (Project settings → Service accounts → Generate new private key).

**iPhone (APNs, Firebase kerak emas):** Apple Developer → Keys → "Apple Push Notifications service"
kaliti (.p8). Railway'ga: `APNS_KEY` (fayl mazmuni), `APNS_KEY_ID`, `APNS_TEAM_ID`,
`APNS_BUNDLE_ID=uz.climavent.erp`.

Tekshirish: ilovada Profil → **Bildirishnomani sinash**; serverda `GET /api/devices/status`.

## iOS (iPhone)

iOS ilovani faqat macOS'da yig'ish mumkin. Mac'siz — **Codemagic** (bulutda, `codemagic.yaml` tayyor):

1. Apple Developer hisobi ($99/yil) va App Store Connect'da ilova (bundle `uz.climavent.erp`).
2. codemagic.io → repo'ni ulash → Team settings → *App Store Connect API key* integratsiyasi
   nomi `climavent_asc`; environment group `climavent_erp`: `VITE_MAPBOX_TOKEN`, `APP_STORE_APPLE_ID`.
3. `git tag ios-v1.0.0 && git push --tags` → build TestFlight'ga tushadi.
4. Xodimlar **TestFlight** ilovasi orqali o'rnatadi (yangilanishlar ham shu yerdan).

Mac bo'lsa: `npm ci && npm run cap:sync && npx cap open ios` → Xcode → Signing → Archive.

## Ruxsatlar

- Joylashuv — obyekt manzilini belgilash (`ACCESS_FINE_LOCATION`, `NSLocationWhenInUseUsageDescription`)
- Kamera, mikrofon — obyektdan rasm/video (`CAMERA`, `RECORD_AUDIO`, `NSCameraUsageDescription`, `NSMicrophoneUsageDescription`)
- Galereya — `NSPhotoLibraryUsageDescription`

## Ikonka va splash

Manba: `resources/` (Climavent logotipidan). Qayta generatsiya:

```bash
npx @capacitor/assets generate --iconBackgroundColor '#ffffff' --splashBackgroundColor '#ffffff'
```
