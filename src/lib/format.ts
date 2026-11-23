const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
export const MONTHS_LONG = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
export const DAYS_LONG = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const DAYS_SHORT = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

const DAY = 86_400_000;

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Bugünden n gün sonrası (ISO tarih) */
export function daysFromNow(n: number) {
  return toISODate(new Date(startOfToday().getTime() + n * DAY));
}

export function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addMonths(iso: string, months: number) {
  const d = parseDate(iso);
  d.setMonth(d.getMonth() + months);
  return toISODate(d);
}

/** Bugünden itibaren kalan gün (geçmişse negatif) */
export function daysUntil(iso: string) {
  return Math.round((parseDate(iso).getTime() - startOfToday().getTime()) / DAY);
}

export function formatDate(iso: string) {
  const d = parseDate(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDayShort(iso: string) {
  const d = parseDate(iso);
  return { day: String(d.getDate()), month: MONTHS[d.getMonth()], weekday: DAYS_SHORT[d.getDay()] };
}

export function monthLabel(index: number) {
  return MONTHS[index];
}

export function relativeDays(iso: string) {
  const n = daysUntil(iso);
  if (n === 0) return 'Bugün';
  if (n === 1) return 'Yarın';
  if (n === -1) return 'Dün';
  if (n > 0) return `${n} gün sonra`;
  return `${-n} gün önce`;
}

export function remainingText(iso: string) {
  const n = daysUntil(iso);
  if (n < 0) return `${-n} gün geçti`;
  if (n === 0) return 'Bugün bitiyor';
  return `${n} gün kaldı`;
}

export function formatTime(isoDateTime: string) {
  const d = new Date(isoDateTime);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatDateTime(isoDateTime: string) {
  const d = new Date(isoDateTime);
  return `${formatDate(toISODate(d))} · ${formatTime(isoDateTime)}`;
}

export function initials(name: string) {
  const parts = name.replace(/^Dr\.\s*/, '').split(' ').filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toLocaleUpperCase('tr-TR');
}

export function formatNumber(n: number) {
  return n.toLocaleString('tr-TR');
}

/** Türkçe karakter duyarsız arama */
export function normalize(s: string) {
  return s
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}
