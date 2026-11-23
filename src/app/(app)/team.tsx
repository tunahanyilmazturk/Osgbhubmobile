import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { HazardPill } from '@/components/domain';
import {
  Avatar,
  Card,
  Chips,
  Pill,
  ProgressBar,
  Screen,
  ScreenHeader,
} from '@/components/ui/kit';
import {
  FULL_TIME_MINUTES,
  ROLE_LABEL,
  classAllowed,
  memberFirms,
  memberLoad,
  requiredMinutes,
  useAppState,
} from '@/data/store';
import type { TeamRole } from '@/data/types';
import { formatNumber } from '@/lib/format';
import { colors, font, spacing } from '@/theme';

type Filter = 'all' | TeamRole;

export default function Team() {
  const s = useAppState();
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      s.team.map((m) => {
        const firms = memberFirms(s, m);
        return {
          m,
          firms,
          ...memberLoad(s, m),
          mismatch: firms.filter((f) => m.role === 'specialist' && !classAllowed(m.certClass, f.hazard)),
        };
      }),
    [s],
  );

  const filtered = filter === 'all' ? rows : rows.filter((r) => r.m.role === filter);
  const count = (r: TeamRole) => s.team.filter((m) => m.role === r).length;

  return (
    <Screen header={<ScreenHeader title="Ekip" subtitle={`${s.team.length} İSG profesyoneli`} />}>
      <Chips<Filter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'Tümü', count: s.team.length },
          { value: 'specialist', label: 'İSG uzmanı', count: count('specialist') },
          { value: 'physician', label: 'İşyeri hekimi', count: count('physician') },
          { value: 'dsp', label: 'DSP', count: count('dsp') },
        ]}
      />

      {filtered.map(({ m, firms, minutes, ratio, mismatch }) => {
        const expanded = open === m.id;
        const tone = ratio > 1 ? 'danger' : ratio > 0.85 ? 'amber' : 'success';
        return (
          <Card key={m.id} style={{ gap: spacing.md }}>
            <Pressable
              onPress={() => setOpen(expanded ? null : m.id)}
              style={styles.top}
              accessibilityRole="button"
              accessibilityState={{ expanded }}
            >
              <Avatar name={m.name} size={46} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.name}>{m.name}</Text>
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  <Pill label={ROLE_LABEL[m.role]} tone="amber" />
                  {m.certClass && <Pill label={`${m.certClass} sınıfı`} />}
                  {mismatch.length > 0 && <Pill label="Sınıf uyumsuz" tone="danger" icon="warning" />}
                </View>
              </View>
              <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textDim} />
            </Pressable>

            <View style={{ gap: 6 }}>
              <View style={styles.loadRow}>
                <Text style={styles.dim}>
                  {firms.length} firma · {formatNumber(minutes)} / {formatNumber(FULL_TIME_MINUTES)} dk
                </Text>
                <Text style={[styles.pct, ratio > 1 && { color: colors.danger }]}>%{Math.round(ratio * 100)}</Text>
              </View>
              <ProgressBar value={ratio} tone={tone} label={`${m.name} çalışma süresi`} />
            </View>

            {expanded && (
              <View style={{ gap: spacing.sm }}>
                <View style={styles.divider} />
                <Text style={styles.label}>Belge no: {m.certNo}</Text>
                {firms.map((f) => (
                  <Pressable key={f.id} onPress={() => router.push(`/firm/${f.id}`)} style={styles.firm}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.firmName}>{f.name}</Text>
                      <Text style={styles.dim}>
                        {f.employees} çalışan · {formatNumber(requiredMinutes(m.role, f))} dk/ay
                      </Text>
                    </View>
                    <HazardPill hazard={f.hazard} />
                  </Pressable>
                ))}
                {mismatch.map((f) => (
                  <View key={f.id} style={styles.warn}>
                    <Ionicons name="warning" size={16} color={colors.danger} />
                    <Text style={styles.warnText}>
                      {f.name} çok tehlikeli sınıfta; {m.certClass} sınıfı uzman atanamaz.
                    </Text>
                  </View>
                ))}
                <View style={styles.contact}>
                  <Pressable style={styles.contactBtn} onPress={() => Linking.openURL(`tel:${m.phone.replace(/\s/g, '')}`)}>
                    <Ionicons name="call" size={16} color={colors.amber} />
                    <Text style={styles.contactText}>Ara</Text>
                  </Pressable>
                  <Pressable style={styles.contactBtn} onPress={() => Linking.openURL(`mailto:${m.email}`)}>
                    <Ionicons name="mail" size={16} color={colors.amber} />
                    <Text style={styles.contactText}>E-posta</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { color: colors.white, fontSize: 16, fontWeight: font.bold },
  dim: { color: colors.textDim, fontSize: 12.5 },
  loadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pct: { color: colors.text, fontSize: 13, fontWeight: font.bold },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  label: { color: colors.textMuted, fontSize: 12.5, fontWeight: font.medium },
  firm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  firmName: { color: colors.text, fontSize: 14, fontWeight: font.semibold },
  warn: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.dangerSoft,
  },
  warnText: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 18 },
  contact: { flexDirection: 'row', gap: spacing.sm, marginTop: 4 },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.amberSoft,
  },
  contactText: { color: colors.amber, fontSize: 14, fontWeight: font.semibold },
});
