import type { Ionicons } from '@expo/vector-icons';

/** Geçici panel verileri — backend bağlanınca API'den gelecek. */

type IconName = keyof typeof Ionicons.glyphMap;

export type Stat = {
  id: string;
  label: string;
  value: string;
  hint: string;
  icon: IconName;
  tone: 'amber' | 'danger' | 'neutral';
};

export const stats: Stat[] = [
  { id: 'firms', label: 'Aktif firma', value: '48', hint: '+3 bu ay', icon: 'business', tone: 'amber' },
  { id: 'visits', label: 'Bugünkü ziyaret', value: '6', hint: '2 tamamlandı', icon: 'calendar', tone: 'neutral' },
  { id: 'issues', label: 'Açık uygunsuzluk', value: '23', hint: '5 kritik', icon: 'warning', tone: 'danger' },
  { id: 'exams', label: 'Yaklaşan muayene', value: '14', hint: '7 gün içinde', icon: 'medkit', tone: 'neutral' },
];

export const compliance = {
  score: 87,
  change: '+4',
  breakdown: [
    { label: 'Risk değerlendirmesi', value: 94 },
    { label: 'Eğitimler', value: 82 },
    { label: 'Sağlık gözetimi', value: 79 },
  ],
};

export type Visit = {
  id: string;
  time: string;
  firm: string;
  task: string;
  icon: IconName;
  status: 'done' | 'next' | 'upcoming';
};

export const todayVisits: Visit[] = [
  { id: '1', time: '08:30', firm: 'Demirtaş Metal A.Ş.', task: 'Saha denetimi', icon: 'clipboard', status: 'done' },
  { id: '2', time: '10:00', firm: 'Akdeniz Gıda', task: 'Risk değerlendirmesi', icon: 'analytics', status: 'done' },
  { id: '3', time: '13:30', firm: 'Yıldız İnşaat', task: 'Temel İSG eğitimi', icon: 'school', status: 'next' },
  { id: '4', time: '16:00', firm: 'Özkan Tekstil', task: 'Periyodik muayene', icon: 'pulse', status: 'upcoming' },
];

export type Alert = {
  id: string;
  level: 'critical' | 'warning';
  firm: string;
  text: string;
  due: string;
};

export const alerts: Alert[] = [
  { id: 'a1', level: 'critical', firm: 'Yıldız İnşaat', text: 'İskele kontrol belgesinin süresi doldu', due: '2 gün geçti' },
  { id: 'a2', level: 'critical', firm: 'Akdeniz Gıda', text: '3 çalışanın periyodik muayenesi gecikti', due: '1 gün geçti' },
  { id: 'a3', level: 'warning', firm: 'Demirtaş Metal', text: 'Yangın tatbikatı planlanmalı', due: '5 gün kaldı' },
];

export type QuickAction = { id: string; label: string; icon: IconName };

export const quickActions: QuickAction[] = [
  { id: 'inspect', label: 'Denetim\nbaşlat', icon: 'scan' },
  { id: 'issue', label: 'Uygunsuzluk\nbildir', icon: 'alert-circle' },
  { id: 'training', label: 'Eğitim\nplanla', icon: 'school' },
  { id: 'report', label: 'Rapor\noluştur', icon: 'document-text' },
];
