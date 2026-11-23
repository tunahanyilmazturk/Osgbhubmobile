# OSGB Hub — Mobil

İş Sağlığı ve Güvenliği (OSGB) yönetim platformunun mobil uygulaması.
Tasarım dili: **siyah · amber · beyaz**, mobil öncelikli.

<img src="docs/login.png" width="200" alt="Giriş" /> <img src="docs/dashboard.png" width="200" alt="Panel" /> <img src="docs/certificate.png" width="200" alt="Sertifika" /> <img src="docs/isg-katip.png" width="200" alt="İSG-KATİP" />

## Modüller

| Modül | Ne yapar |
|---|---|
| **Panel** | Genel uyum skoru, bekleyen işler, KPI'lar, aylık sertifika grafiği, sertifika durum dağılımı, yaklaşan eğitimler, riskli firmalar, ekip çalışma süresi |
| **Firmalar** | Tehlike sınıfı / KATİP filtresi, eğitim uyumu, firma detayı (ekip, sözleşme, personel, eğitimler) |
| **Ekip** | İSG uzmanı (A/B/C), işyeri hekimi, DSP; İSG-KATİP asgari süreye göre kapasite, sınıf uyumsuzluğu uyarısı |
| **Eğitimler** | Eğitim kataloğu (konu, süre, geçerlilik) ve atamalar |
| **Eğitim atamaları** | Eğitim → firma → eğitmen → tarih → katılımcı; "sertifikası eksik olanlar" kısayolu; yoklama ve tamamlama |
| **Katılımcılar** | Firma personeli, arama, kişi bazında sertifika geçmişi |
| **Sertifikalar** | Geçerli / yaklaşan / süresi dolmuş / süreçte filtreleri, sertifika görseli ve süreç zaman çizelgesi |
| **Sertifika onayları** | Eğitim oturumu bazında toplu onay, gerekçeli ret |
| **E-imza** | Onaylı sertifikalar ve belgeler için toplu imza (mobil imza / e-imza kartı + PIN) |
| **İSG-KATİP** | Sözleşme senkron durumu, hata açıklaması, uygun uzman atama önerisi, işlem günlüğü |

**İş akışı:** Eğitim ata → eğitimi başlat → yoklama ile tamamla → sertifikalar onaya düşer → onayla → e-imza → geçerli sertifika.

## Teknoloji

- **Expo SDK 58** · React Native 0.88 · React 19.3 · TypeScript 6 (strict)
- **Expo Router**: dosya tabanlı yönlendirme, `Stack.Protected` ile oturum koruması
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
  app/
    _layout.tsx          # oturuma göre korumalı yönlendirme
    login.tsx
    (app)/
      (tabs)/            # dashboard, firms, trainings, more
      firm/[id].tsx  training/[id].tsx  participant/[id].tsx  certificate/[id].tsx
      assignment/[id].tsx  assignment/new.tsx
      team.tsx  participants.tsx  certificates.tsx  approvals.tsx
      e-signature.tsx  isg-katip.tsx  profile.tsx
  components/            # TabBar, QuickActionsSheet, charts, domain, ui/*
  data/
    types.ts             # veri modeli
    seed.ts              # deterministik demo verisi
    store.ts             # paylaşılan durum, iş akışı aksiyonları, hesaplamalar
  lib/                   # auth (mock), session, format
  theme/                 # renk, boşluk, köşe token'ları
```

## Notlar

- **Demo modu:** tüm veriler `src/data/seed.ts` içinde üretilir ve bellekte tutulur; uygulama kapanınca sıfırlanır.
- Giriş mock'tur; hata durumunu denemek için şifre olarak `hatali123` girin.
- **E-imza** ve **İSG-KATİP** şu an simülasyondur. Canlıya geçmek için sunucu tarafında
  e-imza sağlayıcısı (mobil imza / NES) entegrasyonu ve OSGB'nin İSG-KATİP web servis yetkisi gerekir.
- İSG-KATİP süre hesapları çalışan başına aylık asgari dakikalara göre yapılır
  (uzman: 10/20/40, hekim: 5/10/15, DSP: çok tehlikelide 10 dk).
