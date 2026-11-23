import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar, Card, IconTile, Pill, ProgressBar, Row, type IconName, type Tone } from '@/components/ui/kit';
import {
  HAZARD_LABEL,
  certHealth,
  type CertHealth,
  useAppState,
  useLookups,
} from '@/data/store';
import type {
  Assignment,
  AssignmentStatus,
  Certificate,
  EnrollmentStatus,
  Firm,
  HazardClass,
  KatipStatus,
} from '@/data/types';
import { formatDate, formatDayShort, remainingText } from '@/lib/format';
import { colors, font, radius, spacing } from '@/theme';

/* ---------------- Durum sözlükleri ---------------- */

export const CERT_STATUS: Record<CertHealth, { label: string; tone: Tone; icon: IconName }> = {
  valid: { label: 'Geçerli', tone: 'success', icon: 'checkmark-circle' },
  expiring: { label: 'Süresi yaklaşıyor', tone: 'amber', icon: 'time' },
  expired: { label: 'Süresi doldu', tone: 'danger', icon: 'close-circle' },
  pending: { label: 'Onay bekliyor', tone: 'amber', icon: 'hourglass' },
  approved: { label: 'İmza bekliyor', tone: 'neutral', icon: 'create' },
  rejected: { label: 'Reddedildi', tone: 'danger', icon: 'ban' },
};

export const ASSIGNMENT_STATUS: Record<AssignmentStatus, { label: string; tone: Tone; icon: IconName }> = {
  planned: { label: 'Planlandı', tone: 'neutral', icon: 'calendar' },
  in_progress: { label: 'Devam ediyor', tone: 'amber', icon: 'play-circle' },
  completed: { label: 'Tamamlandı', tone: 'success', icon: 'checkmark-circle' },
};

export const ENROLLMENT_STATUS: Record<EnrollmentStatus, { label: string; tone: Tone; icon: IconName }> = {
  not_started: { label: 'Başlanmadı', tone: 'neutral', icon: 'ellipse-outline' },
  in_progress: { label: 'Devam ediyor', tone: 'amber', icon: 'play-circle' },
  completed: { label: 'Tamamlandı', tone: 'success', icon: 'checkmark-circle' },
  failed: { label: 'Hak doldu', tone: 'danger', icon: 'close-circle' },
};

export const KATIP_STATUS: Record<KatipStatus, { label: string; tone: Tone; icon: IconName }> = {
  synced: { label: 'Senkron', tone: 'success', icon: 'cloud-done' },
  pending: { label: 'Bildirim bekliyor', tone: 'amber', icon: 'cloud-upload' },
  error: { label: 'Hata', tone: 'danger', icon: 'cloud-offline' },
};

export const HAZARD_TONE: Record<HazardClass, Tone> = { az: 'neutral', tehlikeli: 'amber', cok: 'danger' };

export function HazardPill({ hazard }: { hazard: HazardClass }) {
  return <Pill label={HAZARD_LABEL[hazard]} tone={HAZARD_TONE[hazard]} />;
}

export function CertPill({ cert }: { cert: Certificate }) {
  const st = CERT_STATUS[certHealth(cert)];
  return <Pill label={st.label} tone={st.tone} icon={st.icon} />;
}

/* ---------------- Firma satırı ---------------- */

export function FirmRow({ firm, compliance }: { firm: Firm; compliance: number }) {
  const k = KATIP_STATUS[firm.katip.status];
  const tone: Tone = compliance >= 85 ? 'success' : compliance >= 65 ? 'amber' : 'danger';
  return (
    <Card onPress={() => router.push(`/firm/${firm.id}`)} style={{ gap: spacing.md }}>
      <View style={st.firmTop}>
        <IconTile icon="business" tone="amber" size={42} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={st.firmName} numberOfLines={1}>
            {firm.name}
          </Text>
          <Text style={st.firmMeta} numberOfLines={1}>
            {firm.sector} · {firm.city} · {firm.employees} çalışan
          </Text>
        </View>
        <Ionicons name={k.icon} size={18} color={k.tone === 'success' ? colors.success : k.tone === 'danger' ? colors.danger : colors.amber} accessibilityLabel={`İSG-KATİP: ${k.label}`} />
      </View>
      <View style={st.firmBottom}>
        <HazardPill hazard={firm.hazard} />
        <View style={{ flex: 1, gap: 4 }}>
          <View style={st.firmBarRow}>
            <Text style={st.firmBarLabel}>Eğitim uyumu</Text>
            <Text style={st.firmBarValue}>%{compliance}</Text>
          </View>
          <ProgressBar value={compliance / 100} tone={tone} height={5} label="Eğitim uyumu" />
        </View>
      </View>
    </Card>
  );
}

/* ---------------- Atama satırı ---------------- */

export function AssignmentRow({ a }: { a: Assignment }) {
  const L = useLookups();
  const t = L.training(a.trainingId);
  const firm = L.firm(a.firmId);
  const trainer = L.member(a.trainerId);
  const s = useAppState();
  const online = a.delivery === 'online';
  const status = ASSIGNMENT_STATUS[a.status];
  // Online eğitimde tarih kutusu son tarihi gösterir
  const d = formatDayShort(online && a.dueDate ? a.dueDate : a.date);
  const active = a.status === 'in_progress';
  const done = online ? s.enrollments.filter((e) => e.assignmentId === a.id && e.status === 'completed').length : 0;
  return (
    <Card onPress={() => router.push(`/assignment/${a.id}`)} highlight={active} style={st.assign}>
      <View style={[st.date, active && { backgroundColor: colors.amber, borderColor: colors.amber }]}>
        <Text style={[st.dateDay, active && { color: colors.onAmber }]}>{d.day}</Text>
        <Text style={[st.dateMonth, active && { color: colors.onAmber }]}>{d.month}</Text>
        {online && <Text style={[st.dateHint, active && { color: colors.onAmber }]}>son</Text>}
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={st.assignTitle} numberOfLines={1}>
          {t?.title}
        </Text>
        <Text style={st.assignMeta} numberOfLines={1}>
          {firm?.name}
        </Text>
        <View style={st.assignFoot}>
          {online ? <Pill label="Online" tone="amber" icon="laptop-outline" /> : <Pill label={status.label} tone={status.tone} icon={status.icon} />}
          <Text style={st.assignMeta}>
            {online
              ? `${done}/${a.participantIds.length} tamamladı`
              : `${a.time} · ${a.participantIds.length} kişi · ${trainer?.name.split(' ')[0]}`}
          </Text>
        </View>
      </View>
    </Card>
  );
}

/* ---------------- Sertifika satırı ---------------- */

export function CertificateRow({ cert, showFirm = true }: { cert: Certificate; showFirm?: boolean }) {
  const L = useLookups();
  const p = L.participant(cert.participantId);
  const t = L.training(cert.trainingId);
  const firm = L.firm(cert.firmId);
  const health = certHealth(cert);
  const dateText =
    health === 'valid' || health === 'expiring' || health === 'expired'
      ? remainingText(cert.expiryDate)
      : formatDate(cert.issueDate);
  return (
    <Row
      onPress={() => router.push(`/certificate/${cert.id}`)}
      left={<Avatar name={p?.name ?? '?'} />}
      title={p?.name ?? ''}
      subtitle={`${t?.title}${showFirm ? ` · ${firm?.name}` : ''}`}
      meta={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 3 }}>
          <CertPill cert={cert} />
          <Text style={st.certDate}>{dateText}</Text>
        </View>
      }
    />
  );
}

const st = StyleSheet.create({
  firmTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  firmName: { color: colors.text, fontSize: 15.5, fontWeight: font.semibold },
  firmMeta: { color: colors.textDim, fontSize: 12.5 },
  firmBottom: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  firmBarRow: { flexDirection: 'row', justifyContent: 'space-between' },
  firmBarLabel: { color: colors.textDim, fontSize: 11.5, fontWeight: font.medium },
  firmBarValue: { color: colors.text, fontSize: 11.5, fontWeight: font.bold, fontVariant: ['tabular-nums'] },

  assign: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md + 2 },
  date: {
    width: 54,
    height: 60,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDay: { color: colors.white, fontSize: 20, fontWeight: font.heavy, lineHeight: 22, fontVariant: ['tabular-nums'] },
  dateHint: { color: colors.textDim, fontSize: 9, fontWeight: font.bold, textTransform: 'uppercase', marginTop: -1 },
  dateMonth: { color: colors.textMuted, fontSize: 11, fontWeight: font.semibold, textTransform: 'uppercase' },
  assignTitle: { color: colors.text, fontSize: 15, fontWeight: font.semibold },
  assignMeta: { color: colors.textDim, fontSize: 12.5 },
  assignFoot: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },

  certDate: { color: colors.textDim, fontSize: 11.5, fontWeight: font.medium },
});
