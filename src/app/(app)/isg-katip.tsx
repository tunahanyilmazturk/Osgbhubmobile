import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { HazardPill, KATIP_STATUS } from '@/components/domain';
import { Button } from '@/components/ui/Button';
import { Card, MiniStat, Pill, Screen, ScreenHeader, SectionHeader } from '@/components/ui/kit';
import { actions, classAllowed, memberLoad, useAppState, useLookups } from '@/data/store';
import { formatDateTime, formatTime } from '@/lib/format';
import { colors, font, radius, spacing } from '@/theme';

export default function IsgKatip() {
  const s = useAppState();
  const L = useLookups();

  const stats = useMemo(() => {
    const by = (st: string) => s.firms.filter((f) => f.katip.status === st).length;
    const last = s.firms.reduce((m, f) => (f.katip.lastSync > m ? f.katip.lastSync : m), '');
    return { synced: by('synced'), pending: by('pending'), error: by('error'), last };
  }, [s.firms]);

  // Firmalar: hata → bekleyen → senkron
  const firms = useMemo(() => {
    const rank = { error: 0, pending: 1, synced: 2 } as const;
    return [...s.firms].sort((a, b) => rank[a.katip.status] - rank[b.katip.status]);
  }, [s.firms]);

  /** Sınıf uyumsuzluğunda önerilecek en az yüklü uygun uzman */
  const suggestion = (hazard: (typeof s.firms)[number]['hazard']) =>
    s.team
      .filter((m) => m.role === 'specialist' && classAllowed(m.certClass, hazard))
      .map((m) => ({ m, ratio: memberLoad(s, m).ratio }))
      .sort((a, b) => a.ratio - b.ratio)[0];

  return (
    <Screen header={<ScreenHeader title="İSG-KATİP" subtitle="ÇSGB İSG Kayıt, Takip ve İzleme" />}>
      {/* Bağlantı kartı */}
      <Card style={{ gap: spacing.lg }}>
        <View style={styles.conn}>
          <View style={styles.connIcon}>
            <Ionicons name="git-network" size={22} color={colors.amber} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>OSGB yetki hesabı</Text>
            <Text style={styles.dim}>
              {s.katipSyncing ? 'Senkronize ediliyor…' : `Son senkronizasyon: ${formatDateTime(stats.last)}`}
            </Text>
          </View>
          <Pill label="Bağlı" tone="success" icon="link" />
        </View>
        <View style={{ flexDirection: 'row' }}>
          <MiniStat value={String(stats.synced)} label="Senkron" tone="success" />
          <MiniStat value={String(stats.pending)} label="Bildirim bekliyor" tone={stats.pending ? 'amber' : undefined} />
          <MiniStat value={String(stats.error)} label="Hata" tone={stats.error ? 'danger' : undefined} />
        </View>
        {s.katipSyncing ? (
          <View style={styles.syncing}>
            <ActivityIndicator color={colors.amber} />
            <Text style={styles.syncingText}>Sözleşmeler ve atamalar doğrulanıyor…</Text>
          </View>
        ) : (
          <Button title="Şimdi senkronize et" icon="sync" onPress={() => actions.syncKatip()} />
        )}
      </Card>

      {/* Firmalar */}
      <SectionHeader title="Sözleşmeler" />
      {firms.map((f) => {
        const k = KATIP_STATUS[f.katip.status];
        const spec = L.member(f.specialistId);
        const mismatch = spec && !classAllowed(spec.certClass, f.hazard);
        const sug = mismatch ? suggestion(f.hazard) : undefined;
        return (
          <Card key={f.id} style={{ gap: spacing.md }} highlight={f.katip.status === 'error'}>
            <Pressable onPress={() => router.push(`/firm/${f.id}`)} style={styles.firmTop}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.title} numberOfLines={1}>
                  {f.name}
                </Text>
                <Text style={styles.dim}>{f.katip.contractNo}</Text>
              </View>
              <Pill label={k.label} tone={k.tone} icon={k.icon} />
            </Pressable>
            <View style={styles.meta}>
              <HazardPill hazard={f.hazard} />
              <Text style={styles.dim}>
                Uzman: {spec?.name} ({spec?.certClass}) · Hekim: {L.member(f.physicianId)?.name.replace('Dr. ', '')}
              </Text>
            </View>
            {f.katip.message && (
              <View style={[styles.msg, f.katip.status === 'error' && { backgroundColor: colors.dangerSoft }]}>
                <Ionicons
                  name={f.katip.status === 'error' ? 'warning' : 'information-circle'}
                  size={16}
                  color={f.katip.status === 'error' ? colors.danger : colors.amber}
                />
                <Text style={styles.msgText}>{f.katip.message}</Text>
              </View>
            )}
            {sug && (
              <Button
                title={`${sug.m.name} (${sug.m.certClass}) ata`}
                icon="swap-horizontal"
                variant="outline"
                onPress={() => actions.reassignSpecialist(f.id, sug.m.id)}
              />
            )}
          </Card>
        );
      })}

      {/* Günlük */}
      <SectionHeader title="İşlem günlüğü" />
      <Card style={{ gap: spacing.md }}>
        {s.katipLogs.map((l) => (
          <View key={l.id} style={styles.log}>
            <View
              style={[
                styles.logDot,
                { backgroundColor: l.tone === 'success' ? colors.success : l.tone === 'danger' ? colors.danger : colors.textDim },
              ]}
            />
            <Text style={styles.logText}>{l.text}</Text>
            <Text style={styles.dim}>{formatTime(l.at)}</Text>
          </View>
        ))}
      </Card>

      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={16} color={colors.textDim} />
        <Text style={[styles.dim, { flex: 1, lineHeight: 18 }]}>
          Demo modu: senkronizasyon simüle edilir. Canlı bağlantı için OSGB’nin İSG-KATİP web servis yetkisi ve
          sunucu tarafı entegrasyon gerekir.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 15, fontWeight: font.semibold },
  dim: { color: colors.textDim, fontSize: 12.5 },
  conn: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  connIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.amberSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncing: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.amberSoft,
  },
  syncingText: { color: colors.amber, fontSize: 14, fontWeight: font.semibold },
  firmTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  meta: { gap: 6 },
  msg: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.amberSoft,
  },
  msgText: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 18 },
  log: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  logDot: { width: 8, height: 8, borderRadius: 4 },
  logText: { flex: 1, color: colors.text, fontSize: 13.5 },
  note: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: 4 },
});
