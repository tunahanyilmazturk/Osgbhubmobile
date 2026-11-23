import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { HazardPill } from '@/components/domain';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { HeaderAction } from '@/components/ui/forms';
import {
  Avatar,
  Card,
  Chips,
  EmptyState,
  Pill,
  ProgressBar,
  ScreenHeader,
  useBottomPadding,
} from '@/components/ui/kit';
import {
  FULL_TIME_MINUTES,
  ROLE_LABEL,
  actions,
  classAllowed,
  memberFirms,
  memberLoad,
  requiredMinutes,
  useAppState,
} from '@/data/store';
import type { Firm, TeamMember, TeamRole } from '@/data/types';
import { formatNumber } from '@/lib/format';
import { colors, font, spacing } from '@/theme';

type Filter = 'all' | TeamRole;

type TeamRow = {
  m: TeamMember;
  firms: Firm[];
  minutes: number;
  ratio: number;
  mismatch: Firm[];
};

export default function Team() {
  const s = useAppState();
  const [filter, setFilter] = useState<Filter>('all');
  const bottom = useBottomPadding();

  const rows = useMemo<TeamRow[]>(
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

  const columns: Column<TeamRow>[] = [
    {
      key: 'name',
      title: 'Ad soyad',
      flex: 2,
      minWidth: 220,
      sortValue: (r) => r.m.name.replace(/^Dr\.\s*/, ''),
      render: (r) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1, minWidth: 0 }}>
          <Avatar name={r.m.name} size={34} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.cellTitle} numberOfLines={1}>
              {r.m.name}
            </Text>
            <Text style={styles.dim} numberOfLines={1}>
              {r.m.certNo}
            </Text>
          </View>
        </View>
      ),
    },
    {
      key: 'role',
      title: 'Görev',
      flex: 1.4,
      minWidth: 170,
      sortValue: (r) => ROLE_LABEL[r.m.role],
      render: (r) => (
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          <Pill label={ROLE_LABEL[r.m.role]} tone="amber" />
          {r.m.certClass && <Pill label={r.m.certClass} />}
          {r.mismatch.length > 0 && <Pill label="Uyumsuz" tone="danger" icon="warning" />}
        </View>
      ),
    },
    {
      key: 'firms',
      title: 'Firma',
      flex: 0.7,
      minWidth: 80,
      align: 'right',
      sortValue: (r) => r.firms.length,
      render: (r) => <Text style={styles.cellTitle}>{r.firms.length}</Text>,
    },
    {
      key: 'load',
      title: 'Doluluk',
      flex: 1.5,
      minWidth: 170,
      sortValue: (r) => r.ratio,
      render: (r) => (
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[styles.pct, r.ratio > 1 && { color: colors.danger }]}>
            %{Math.round(r.ratio * 100)} <Text style={styles.dim}>· {formatNumber(r.minutes)} dk</Text>
          </Text>
          <ProgressBar
            value={r.ratio}
            tone={r.ratio > 1 ? 'danger' : r.ratio > 0.85 ? 'amber' : 'success'}
            height={4}
            label="Doluluk"
          />
        </View>
      ),
    },
    {
      key: 'contact',
      title: 'İletişim',
      flex: 1.6,
      minWidth: 200,
      sortValue: (r) => r.m.email,
      render: (r) => (
        <View style={{ minWidth: 0, flex: 1 }}>
          <Text style={styles.cellText} numberOfLines={1}>
            {r.m.email}
          </Text>
          <Text style={styles.dim}>{r.m.phone}</Text>
        </View>
      ),
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title="Ekip"
        subtitle={`${s.team.length} İSG profesyoneli`}
        right={
          <HeaderAction
            label="Yeni ekip üyesi"
            icon="person-add"
            onPress={() => router.push('/member/new')}
          />
        }
      />
      <DataTable<TeamRow>
        id="team"
        data={filtered}
        keyOf={(r) => r.m.id}
        columns={columns}
        defaultSort={{ key: 'name', dir: 'asc' }}
        itemLabel="kişi"
        resetKey={filter}
        bottomPadding={bottom}
        onOpen={(r) => router.push(`/member/edit/${r.m.id}`)}
        renderCard={(r) => <TeamCard row={r} />}
        onDelete={(ids) => {
          const res = actions.deleteMembers(ids);
          if (res.blocked.length) {
            return `${res.deleted} kişi silindi. Silinemeyenler: ${res.blocked.map((b) => `${b.name} (${b.reason})`).join(', ')}. Önce firmalara başka kişi atayın.`;
          }
        }}
        deleteMessage={(ids) => {
          const busy = rows.filter((r) => ids.includes(r.m.id) && r.firms.length).length;
          return busy
            ? `Seçilenlerden ${busy} kişi firmalara atanmış; bunlar silinmeyecek. Diğerleri kalıcı olarak silinecek.`
            : 'Seçilen ekip üyeleri kalıcı olarak silinecek.';
        }}
        toolbar={
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
        }
        empty={<EmptyState icon="people-circle" title="Kimse yok" text="Yeni ekip üyesi ekleyin." />}
      />
    </View>
  );
}

function TeamCard({ row }: { row: TeamRow }) {
  const [expanded, setExpanded] = useState(false);
  const { m, firms, minutes, ratio, mismatch } = row;
  const tone = ratio > 1 ? 'danger' : ratio > 0.85 ? 'amber' : 'success';
  return (
    <Card style={{ gap: spacing.md }}>
      <Pressable
        onPress={() => setExpanded((x) => !x)}
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
            <Pressable style={styles.contactBtn} onPress={() => router.push(`/member/edit/${m.id}`)}>
              <Ionicons name="create-outline" size={16} color={colors.amber} />
              <Text style={styles.contactText}>Düzenle</Text>
            </Pressable>
            <Pressable
              style={styles.contactBtn}
              onPress={() => Linking.openURL(`tel:${m.phone.replace(/\s/g, '')}`)}
            >
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
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { color: colors.white, fontSize: 16, fontWeight: font.bold },
  dim: { color: colors.textDim, fontSize: 12.5 },
  loadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pct: { color: colors.text, fontSize: 13, fontWeight: font.bold },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  cellTitle: { color: colors.text, fontSize: 14, fontWeight: font.semibold },
  cellText: { color: colors.text, fontSize: 13 },
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
