import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AssignmentRow, HazardPill, KATIP_STATUS } from '@/components/domain';
import {
  Avatar,
  Card,
  EmptyState,
  IconButton,
  InfoRow,
  MiniStat,
  Pill,
  ProgressBar,
  Row,
  Screen,
  ScreenHeader,
  SectionHeader,
} from '@/components/ui/kit';
import {
  ROLE_LABEL,
  certHealth,
  classAllowed,
  firmCompliance,
  latestCertificates,
  requiredMinutes,
  useAppState,
  useLookups,
} from '@/data/store';
import { formatDate, formatDateTime, formatNumber, remainingText } from '@/lib/format';
import { colors, font, spacing } from '@/theme';

export default function FirmDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useAppState();
  const L = useLookups();
  const firm = s.firms.find((f) => f.id === id);

  const data = useMemo(() => {
    if (!firm) return null;
    const people = s.participants.filter((p) => p.firmId === firm.id);
    const latest = latestCertificates(s.certificates.filter((c) => c.firmId === firm.id));
    const valid = latest.filter((c) => ['valid', 'expiring'].includes(certHealth(c))).length;
    const expired = latest.filter((c) => certHealth(c) === 'expired').length;
    const assignments = s.assignments
      .filter((a) => a.firmId === firm.id)
      .sort((a, b) => b.date.localeCompare(a.date));
    const staff = [
      { m: L.member(firm.specialistId), role: 'specialist' as const },
      { m: L.member(firm.physicianId), role: 'physician' as const },
      ...(firm.dspId ? [{ m: L.member(firm.dspId), role: 'dsp' as const }] : []),
    ];
    return { people, valid, expired, assignments, staff, compliance: firmCompliance(s, firm.id) };
  }, [s, firm, L]);

  if (!firm || !data) {
    return (
      <Screen header={<ScreenHeader title="Firma" />}>
        <EmptyState icon="business" title="Firma bulunamadı" />
      </Screen>
    );
  }

  const k = KATIP_STATUS[firm.katip.status];
  const contractDays = remainingText(firm.contractEnd);

  return (
    <Screen
      header={
        <ScreenHeader
          title={firm.name}
          subtitle={`${firm.sector} · ${firm.city}`}
          right={
            <IconButton
              icon="add"
              tone="amber"
              label="Bu firmaya eğitim ata"
              onPress={() => router.push({ pathname: '/assignment/new', params: { firmId: firm.id } })}
            />
          }
        />
      }
    >
      {/* Özet */}
      <Card style={{ gap: spacing.lg }}>
        <View style={styles.pills}>
          <HazardPill hazard={firm.hazard} />
          <Pill label={`${firm.employees} çalışan`} icon="people" />
        </View>
        <View style={{ flexDirection: 'row' }}>
          <MiniStat value={`%${data.compliance}`} label="Eğitim uyumu" tone={data.compliance >= 85 ? 'success' : data.compliance >= 65 ? 'amber' : 'danger'} />
          <MiniStat value={String(data.valid)} label="Geçerli sertifika" />
          <MiniStat value={String(data.expired)} label="Süresi dolan" tone={data.expired ? 'danger' : undefined} />
        </View>
        <ProgressBar
          value={data.compliance / 100}
          tone={data.compliance >= 85 ? 'success' : data.compliance >= 65 ? 'amber' : 'danger'}
          label="Eğitim uyumu"
        />
      </Card>

      {/* İSG-KATİP */}
      <SectionHeader title="İSG-KATİP" action="Senkronizasyon" onAction={() => router.push('/isg-katip')} />
      <Card style={{ gap: spacing.sm }}>
        <View style={styles.katipTop}>
          <Pill label={k.label} tone={k.tone} icon={k.icon} />
          <Text style={styles.dim}>Son: {formatDateTime(firm.katip.lastSync)}</Text>
        </View>
        {firm.katip.message && (
          <View style={[styles.katipMsg, firm.katip.status === 'error' && styles.katipMsgError]}>
            <Ionicons
              name={firm.katip.status === 'error' ? 'warning' : 'information-circle'}
              size={16}
              color={firm.katip.status === 'error' ? colors.danger : colors.amber}
            />
            <Text style={styles.katipMsgText}>{firm.katip.message}</Text>
          </View>
        )}
        <InfoRow icon="document-text-outline" label="Sözleşme no" value={firm.katip.contractNo} />
        <InfoRow icon="calendar-outline" label="Sözleşme bitişi" value={`${formatDate(firm.contractEnd)} (${contractDays})`} />
        <InfoRow icon="id-card-outline" label="SGK sicil" value={firm.sgkNo} />
      </Card>

      {/* Atanan ekip */}
      <SectionHeader title="Atanan ekip" />
      <View style={{ gap: spacing.sm }}>
        {data.staff.map(({ m, role }) => {
          if (!m) return null;
          const minutes = requiredMinutes(role, firm);
          const mismatch = role === 'specialist' && !classAllowed(m.certClass, firm.hazard);
          return (
            <Row
              key={m.id}
              onPress={() => router.push('/team')}
              left={<Avatar name={m.name} />}
              title={m.name}
              subtitle={`${ROLE_LABEL[role]}${m.certClass ? ` · ${m.certClass} sınıfı` : ''} · ${formatNumber(minutes)} dk/ay`}
              meta={mismatch ? <View style={{ marginTop: 4 }}><Pill label="Sınıf uyumsuz" tone="danger" icon="warning" /></View> : undefined}
            />
          );
        })}
      </View>

      {/* Eğitimler */}
      <SectionHeader
        title="Eğitimler"
        action="Eğitim ata"
        onAction={() => router.push({ pathname: '/assignment/new', params: { firmId: firm.id } })}
      />
      <View style={{ gap: spacing.sm }}>
        {data.assignments.length ? (
          data.assignments.map((a) => <AssignmentRow key={a.id} a={a} />)
        ) : (
          <Text style={styles.dim}>Bu firmaya henüz eğitim atanmadı.</Text>
        )}
      </View>

      {/* Personel */}
      <SectionHeader
        title={`Personel (${data.people.length})`}
        action="Tümü"
        onAction={() => router.push({ pathname: '/participants', params: { firmId: firm.id } })}
      />
      <Card style={{ padding: 0 }}>
        {data.people.slice(0, 5).map((p, i) => (
          <Pressable
            key={p.id}
            onPress={() => router.push(`/participant/${p.id}`)}
            style={[styles.person, i > 0 && styles.personBorder]}
          >
            <Avatar name={p.name} size={34} />
            <View style={{ flex: 1 }}>
              <Text style={styles.personName}>{p.name}</Text>
              <Text style={styles.dim}>
                {p.title} · {p.department}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
          </Pressable>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pills: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  katipTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  katipMsg: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.amberSoft,
    marginBottom: 4,
  },
  katipMsgError: { backgroundColor: colors.dangerSoft },
  katipMsgText: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 18 },
  dim: { color: colors.textDim, fontSize: 12.5 },
  person: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  personBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  personName: { color: colors.text, fontSize: 14.5, fontWeight: font.semibold },
});
