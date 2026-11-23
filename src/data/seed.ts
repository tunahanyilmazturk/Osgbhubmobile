/**
 * Örnek (demo) veri üreticisi. Deterministik: her açılışta aynı veri oluşur.
 * Backend bağlandığında bu dosya kaldırılacak.
 */
import { addMonths, daysFromNow, daysUntil } from '@/lib/format';

import type {
  Assignment,
  Certificate,
  Firm,
  KatipLog,
  Participant,
  SignDocument,
  TeamMember,
  Training,
} from './types';

// Basit deterministik rastgele sayı üreteci
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}
const rand = rng(42);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const between = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1));

export const team: TeamMember[] = [
  { id: 't1', name: 'Ahmet Yılmaz', role: 'specialist', certClass: 'A', certNo: 'İSG-A-21458', email: 'ahmet.yilmaz@osgbhub.com', phone: '0532 411 22 33' },
  { id: 't2', name: 'Elif Kaya', role: 'specialist', certClass: 'B', certNo: 'İSG-B-33190', email: 'elif.kaya@osgbhub.com', phone: '0533 284 51 06' },
  { id: 't3', name: 'Murat Demir', role: 'specialist', certClass: 'B', certNo: 'İSG-B-40277', email: 'murat.demir@osgbhub.com', phone: '0542 719 88 14' },
  { id: 't7', name: 'Kerem Güneş', role: 'specialist', certClass: 'A', certNo: 'İSG-A-19032', email: 'kerem.gunes@osgbhub.com', phone: '0544 302 67 90' },
  { id: 't4', name: 'Dr. Zeynep Arslan', role: 'physician', certNo: 'İH-55120', email: 'zeynep.arslan@osgbhub.com', phone: '0535 640 12 77' },
  { id: 't5', name: 'Dr. Can Öztürk', role: 'physician', certNo: 'İH-61844', email: 'can.ozturk@osgbhub.com', phone: '0536 918 45 23' },
  { id: 't6', name: 'Selin Aydın', role: 'dsp', certNo: 'DSP-08721', email: 'selin.aydin@osgbhub.com', phone: '0538 227 30 61' },
];

const nowIso = new Date().toISOString();
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

export const firms: Firm[] = [
  {
    id: 'f1', name: 'Demirtaş Metal A.Ş.', sector: 'Metal işleme', hazard: 'cok', city: 'Kocaeli', employees: 142,
    sgkNo: '4.2511.01.01.1144823.041.01-72', specialistId: 't1', physicianId: 't4', dspId: 't6',
    contractStart: daysFromNow(-280), contractEnd: daysFromNow(85),
    katip: { status: 'synced', contractNo: 'KTP-2026-104582', lastSync: hoursAgo(3) },
  },
  {
    id: 'f2', name: 'Akdeniz Gıda San.', sector: 'Gıda üretimi', hazard: 'tehlikeli', city: 'Antalya', employees: 86,
    sgkNo: '4.1081.01.01.1032661.007.01-15', specialistId: 't2', physicianId: 't5',
    contractStart: daysFromNow(-190), contractEnd: daysFromNow(175),
    katip: { status: 'synced', contractNo: 'KTP-2026-099117', lastSync: hoursAgo(3) },
  },
  {
    id: 'f3', name: 'Yıldız İnşaat Ltd.', sector: 'İnşaat', hazard: 'cok', city: 'İstanbul', employees: 214,
    sgkNo: '4.4120.01.01.1209874.034.01-48', specialistId: 't3', physicianId: 't4', dspId: 't6',
    contractStart: daysFromNow(-60), contractEnd: daysFromNow(305),
    katip: {
      status: 'error', contractNo: 'KTP-2026-118340', lastSync: hoursAgo(3),
      message: 'Çok tehlikeli işyerine B sınıfı uzman atanamaz. A sınıfı uzman atayın.',
    },
  },
  {
    id: 'f4', name: 'Özkan Tekstil', sector: 'Tekstil', hazard: 'tehlikeli', city: 'Bursa', employees: 63,
    sgkNo: '4.1392.01.01.1087312.016.01-91', specialistId: 't1', physicianId: 't4',
    contractStart: daysFromNow(-340), contractEnd: daysFromNow(24),
    katip: { status: 'synced', contractNo: 'KTP-2025-087450', lastSync: hoursAgo(3) },
  },
  {
    id: 'f5', name: 'Mavi Lojistik', sector: 'Depolama ve lojistik', hazard: 'tehlikeli', city: 'İzmir', employees: 48,
    sgkNo: '4.5210.01.01.1150933.035.01-27', specialistId: 't2', physicianId: 't5',
    contractStart: daysFromNow(-120), contractEnd: daysFromNow(245),
    katip: { status: 'synced', contractNo: 'KTP-2026-101276', lastSync: hoursAgo(3) },
  },
  {
    id: 'f6', name: 'Ege Plastik', sector: 'Plastik ürünler', hazard: 'tehlikeli', city: 'Manisa', employees: 37,
    sgkNo: '4.2229.01.01.1176540.045.01-63', specialistId: 't2', physicianId: 't5',
    contractStart: daysFromNow(-30), contractEnd: daysFromNow(335),
    katip: { status: 'pending', contractNo: 'KTP-2026-121904', lastSync: hoursAgo(3), message: 'Yeni sözleşme bildirimi gönderilmeyi bekliyor.' },
  },
  {
    id: 'f7', name: 'Kuzey Yazılım', sector: 'Bilişim', hazard: 'az', city: 'Ankara', employees: 25,
    sgkNo: '4.6201.01.01.1199027.006.01-34', specialistId: 't1', physicianId: 't5',
    contractStart: daysFromNow(-210), contractEnd: daysFromNow(155),
    katip: { status: 'synced', contractNo: 'KTP-2026-095503', lastSync: hoursAgo(3) },
  },
  {
    id: 'f8', name: 'Anadolu Otomotiv Yan San.', sector: 'Otomotiv yan sanayi', hazard: 'cok', city: 'Sakarya', employees: 178,
    sgkNo: '4.2932.01.01.1163319.054.01-80', specialistId: 't7', physicianId: 't5', dspId: 't6',
    contractStart: daysFromNow(-15), contractEnd: daysFromNow(350),
    katip: { status: 'pending', contractNo: 'KTP-2026-122518', lastSync: hoursAgo(3), message: 'DSP ataması bildirilmeyi bekliyor.' },
  },
];

export const trainings: Training[] = [
  {
    id: 'tr1', title: 'Temel İş Sağlığı ve Güvenliği', category: 'Zorunlu', hours: 16, mode: 'Yüz yüze', validityMonths: 12, icon: 'shield-checkmark',
    topics: ['Çalışma mevzuatı ile ilgili bilgiler', 'Çalışanların yasal hak ve sorumlulukları', 'Meslek hastalıklarının sebepleri', 'Kimyasal, fiziksel ve ergonomik risk etmenleri', 'Kişisel koruyucu donanım kullanımı', 'Tahliye ve kurtarma'],
  },
  {
    id: 'tr2', title: 'Yangın Eğitimi ve Tatbikatı', category: 'Zorunlu', hours: 4, mode: 'Yüz yüze', validityMonths: 12, icon: 'flame',
    topics: ['Yangın sınıfları', 'Söndürücü çeşitleri ve kullanımı', 'Acil durum toplanma alanları', 'Uygulamalı tatbikat'],
  },
  {
    id: 'tr3', title: 'Temel İlk Yardım', category: 'Zorunlu', hours: 16, mode: 'Yüz yüze', validityMonths: 36, icon: 'medkit',
    topics: ['Hasta/yaralı değerlendirme', 'Temel yaşam desteği', 'Kanamalarda ilk yardım', 'Kırık, çıkık ve burkulmalar', 'Yanıklarda ilk yardım'],
  },
  {
    id: 'tr4', title: 'Yüksekte Çalışma', category: 'Mesleki', hours: 8, mode: 'Karma', validityMonths: 12, icon: 'trending-up',
    topics: ['Düşmeden korunma hiyerarşisi', 'Emniyet kemeri ve ankraj noktaları', 'İskele güvenliği', 'Kurtarma planı'],
  },
  {
    id: 'tr5', title: 'Kimyasal Maddelerle Çalışma', category: 'Mesleki', hours: 4, mode: 'Yüz yüze', validityMonths: 12, icon: 'flask',
    topics: ['GBF okuma', 'Etiketleme ve depolama', 'Maruziyet sınır değerleri', 'Döküntü müdahalesi'],
  },
  {
    id: 'tr6', title: 'Ergonomi ve Ofis Güvenliği', category: 'Genel', hours: 2, mode: 'Online', validityMonths: 36, icon: 'desktop',
    topics: ['Ekranlı araçlarla çalışma', 'Doğru oturuş', 'Göz sağlığı', 'Stres yönetimi'],
  },
];

const FIRST = ['Ahmet', 'Mehmet', 'Ayşe', 'Fatma', 'Mustafa', 'Emine', 'Ali', 'Hatice', 'Hüseyin', 'Zeynep', 'İbrahim', 'Elif', 'Hasan', 'Merve', 'Yusuf', 'Büşra', 'Ömer', 'Esra', 'Burak', 'Seda', 'Kemal', 'Derya', 'Serkan', 'Gamze', 'Okan', 'Tuğba', 'Emre', 'Pınar', 'Volkan', 'Ebru'];
const LAST = ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Yıldırım', 'Öztürk', 'Aydın', 'Özdemir', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Kara', 'Koç', 'Kurt', 'Özkan', 'Şimşek'];
const ROLES: Record<string, { titles: string[]; departments: string[] }> = {
  f1: { titles: ['CNC operatörü', 'Kaynakçı', 'Bakım teknisyeni', 'Vardiya amiri', 'Kalite kontrol'], departments: ['Üretim', 'Bakım', 'Kalite'] },
  f2: { titles: ['Üretim operatörü', 'Paketleme', 'Gıda mühendisi', 'Depo sorumlusu'], departments: ['Üretim', 'Lojistik', 'Kalite'] },
  f3: { titles: ['Kalıpçı', 'Demirci', 'İskele kurulum', 'Şantiye şefi', 'Vinç operatörü'], departments: ['Şantiye', 'Teknik ofis'] },
  f4: { titles: ['Dokuma operatörü', 'Boyahane', 'Makine bakım', 'Kalite kontrol'], departments: ['Dokuma', 'Boyahane', 'Bakım'] },
  f5: { titles: ['Forklift operatörü', 'Depo elemanı', 'Sevkiyat sorumlusu'], departments: ['Depo', 'Sevkiyat'] },
  f6: { titles: ['Enjeksiyon operatörü', 'Kalıp ustası', 'Kalite kontrol'], departments: ['Üretim', 'Kalıphane'] },
  f7: { titles: ['Yazılım geliştirici', 'Proje yöneticisi', 'İdari personel'], departments: ['Yazılım', 'İdari işler'] },
  f8: { titles: ['Pres operatörü', 'Montaj', 'Boya operatörü', 'Bakım teknisyeni', 'Vardiya amiri'], departments: ['Pres', 'Montaj', 'Boyahane'] },
};
const PER_FIRM: Record<string, number> = { f1: 10, f2: 8, f3: 12, f4: 7, f5: 6, f6: 5, f7: 4, f8: 9 };

const usedNames = new Set<string>();
export const participants: Participant[] = [];
let pIndex = 1;
for (const firm of firms) {
  for (let i = 0; i < PER_FIRM[firm.id]; i++) {
    let name = '';
    do name = `${pick(FIRST)} ${pick(LAST)}`;
    while (usedNames.has(name));
    usedNames.add(name);
    participants.push({
      id: `p${pIndex++}`,
      name,
      firmId: firm.id,
      title: pick(ROLES[firm.id].titles),
      department: pick(ROLES[firm.id].departments),
      tcMasked: `${between(1, 9)}${between(10, 99)}******${between(10, 99)}`,
      startDate: daysFromNow(-between(60, 2400)),
    });
  }
}

// Geçmiş sertifikalar
export const certificates: Certificate[] = [];
let certNo = 4100;
const trainingById = Object.fromEntries(trainings.map((t) => [t.id, t]));
const firmById = Object.fromEntries(firms.map((f) => [f.id, f]));

function makeCert(p: Participant, trainingId: string, issueDate: string, extra: Partial<Certificate> = {}): Certificate {
  const t = trainingById[trainingId];
  const firm = firmById[p.firmId];
  return {
    id: `c${certNo}`,
    no: `OSGB-${issueDate.slice(0, 4)}-${certNo++}`,
    participantId: p.id,
    trainingId,
    firmId: p.firmId,
    trainerId: firm.specialistId,
    issueDate,
    expiryDate: addMonths(issueDate, t.validityMonths),
    status: 'signed',
    approvedBy: 'Ahmet Yılmaz',
    approvedAt: issueDate,
    signedBy: 'Ahmet Yılmaz',
    signedAt: issueDate,
    ...extra,
  };
}

const MAX_AGE: Record<string, number> = { f3: 640, f8: 560 };
for (const p of participants) {
  if (p.firmId === 'f6' || p.firmId === 'f5') continue; // atamalardan gelecek
  makeAndPush(p, 'tr1', -between(20, MAX_AGE[p.firmId] ?? 400));
  if (rand() < 0.65) makeAndPush(p, 'tr2', -between(15, 420));
  if (rand() < 0.35) makeAndPush(p, 'tr3', -between(30, 900));
  if (p.firmId === 'f3' && rand() < 0.6) makeAndPush(p, 'tr4', -between(30, 500));
  if (p.firmId === 'f7') makeAndPush(p, 'tr6', -between(5, 200));
}
function makeAndPush(p: Participant, trainingId: string, offset: number) {
  certificates.push(makeCert(p, trainingId, daysFromNow(offset)));
}

const hasValid = (pid: string, tid: string) =>
  certificates.some(
    (c) => c.participantId === pid && c.trainingId === tid && daysUntil(c.expiryDate) >= 0,
  );
const firmPeople = (fid: string) => participants.filter((p) => p.firmId === fid);

export const assignments: Assignment[] = [
  {
    id: 'a1', trainingId: 'tr1', firmId: 'f3', trainerId: 't1', date: daysFromNow(2), time: '09:00', location: 'Şantiye eğitim konteyneri',
    participantIds: firmPeople('f3').filter((p) => !hasValid(p.id, 'tr1')).map((p) => p.id), status: 'planned',
  },
  {
    id: 'a2', trainingId: 'tr4', firmId: 'f3', trainerId: 't3', date: daysFromNow(5), time: '13:30', location: 'Blok B iskele alanı',
    participantIds: firmPeople('f3').slice(0, 6).map((p) => p.id), status: 'planned',
  },
  {
    id: 'a3', trainingId: 'tr2', firmId: 'f1', trainerId: 't1', date: daysFromNow(0), time: '14:00', location: 'Fabrika toplantı salonu',
    participantIds: firmPeople('f1').slice(0, 8).map((p) => p.id), status: 'in_progress',
  },
  {
    id: 'a4', trainingId: 'tr3', firmId: 'f2', trainerId: 't4', date: daysFromNow(9), time: '10:00', location: 'Yemekhane',
    participantIds: firmPeople('f2').slice(0, 5).map((p) => p.id), status: 'planned',
  },
  {
    id: 'a5', trainingId: 'tr5', firmId: 'f6', trainerId: 't2', date: daysFromNow(-3), time: '09:30', location: 'Üretim holü',
    participantIds: firmPeople('f6').map((p) => p.id), status: 'completed',
  },
  {
    id: 'a6', trainingId: 'tr1', firmId: 'f5', trainerId: 't2', date: daysFromNow(-6), time: '09:00', location: 'Depo eğitim odası',
    participantIds: firmPeople('f5').map((p) => p.id), status: 'completed',
  },
  {
    id: 'a7', trainingId: 'tr6', firmId: 'f7', trainerId: 't1', date: daysFromNow(-20), time: '15:00', location: 'Online (Teams)',
    participantIds: firmPeople('f7').map((p) => p.id), status: 'completed',
  },
  {
    id: 'a8', trainingId: 'tr1', firmId: 'f8', trainerId: 't7', date: daysFromNow(12), time: '09:00', location: 'Fabrika konferans salonu',
    participantIds: firmPeople('f8').filter((p) => !hasValid(p.id, 'tr1')).map((p) => p.id), status: 'planned',
  },
];

// Tamamlanan atamalardan gelen sertifikalar: a5 → onay bekliyor, a6 → imza bekliyor
for (const p of firmPeople('f6')) {
  certificates.push(
    makeCert(p, 'tr5', daysFromNow(-3), {
      assignmentId: 'a5', trainerId: 't2', status: 'pending',
      approvedBy: undefined, approvedAt: undefined, signedBy: undefined, signedAt: undefined,
    }),
  );
}
for (const p of firmPeople('f5')) {
  certificates.push(
    makeCert(p, 'tr1', daysFromNow(-6), {
      assignmentId: 'a6', trainerId: 't2', status: 'approved', approvedBy: 'Ahmet Yılmaz', approvedAt: daysFromNow(-1),
      signedBy: undefined, signedAt: undefined,
    }),
  );
}

export const documents: SignDocument[] = [
  { id: 'd1', type: 'attendance', title: 'Eğitim katılım tutanağı — Kimyasal Maddeler', firmId: 'f6', createdAt: daysFromNow(-3), status: 'waiting' },
  { id: 'd2', type: 'risk_report', title: 'Risk değerlendirme raporu 2026/2', firmId: 'f3', createdAt: daysFromNow(-2), status: 'waiting' },
  { id: 'd3', type: 'annual_plan', title: 'Yıllık eğitim planı 2027', firmId: 'f1', createdAt: daysFromNow(-1), status: 'waiting' },
  { id: 'd4', type: 'emergency_plan', title: 'Acil durum eylem planı', firmId: 'f2', createdAt: daysFromNow(-12), status: 'signed', signedAt: daysFromNow(-11), signedBy: 'Ahmet Yılmaz' },
];

export const katipLogs: KatipLog[] = [
  { id: 'l1', at: hoursAgo(3), text: '6 sözleşme başarıyla doğrulandı', tone: 'success' },
  { id: 'l2', at: hoursAgo(3), text: 'Yıldız İnşaat: uzman sınıfı uyumsuz', tone: 'danger' },
  { id: 'l3', at: hoursAgo(27), text: 'Ege Plastik sözleşmesi oluşturuldu', tone: 'neutral' },
];

export const seedNow = nowIso;
