# OSGB Hub — Mobil

İş Sağlığı ve Güvenliği (OSGB) yönetim platformunun mobil uygulaması.
Tasarım dili: **siyah · amber · beyaz**, mobil öncelikli.

<img src="docs/login.png" width="300" alt="Giriş ekranı" />

## Teknoloji

- **Expo SDK 58** · React Native 0.88 · React 19.3
- **Expo Router** (dosya tabanlı yönlendirme, `src/app/`)
- **TypeScript 6** (strict)
- expo-linear-gradient, expo-haptics, @expo/vector-icons

## Başlatma

```bash
npm install
npx expo start      # QR kodu Expo Go ile okutun
npm run web         # tarayıcıda çalıştır
npm run typecheck
```

## Klasör yapısı

```
src/
  app/            # ekranlar (Expo Router)
    _layout.tsx
    index.tsx     # → /login yönlendirmesi
    login.tsx     # giriş ekranı
  components/     # paylaşılan bileşenler (BrandMark, ui/*)
  lib/auth.ts     # doğrulama + geçici (mock) giriş servisi
  theme/          # renk, boşluk, köşe yarıçapı token'ları
```

## Notlar

- Giriş şu an **mock** servistir (`src/lib/auth.ts`). Hata durumunu denemek için şifre olarak `hatali123` girin.
