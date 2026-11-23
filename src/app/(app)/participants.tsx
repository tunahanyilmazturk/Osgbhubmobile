import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import {
  Avatar,
  Chips,
  EmptyState,
  Pill,
  Row,
  ScreenHeader,
  SearchBar,
  useBottomPadding,
  useListLayout,
} from '@/components/ui/kit';
import { certHealth, latestCertificates, useAppState } from '@/data/store';
import { normalize } from '@/lib/format';
import { colors, spacing } from '@/theme';

export default function Participants() {
  const params = useLocalSearchParams<{ firmId?: string }>();
  const s = useAppState();
  const [q, setQ] = useState('');
  const [firmId, setFirmId] = useState(params.firmId ?? 'all');
  const bottom = useBottomPadding();
  const list = useListLayout(spacing.sm);

  const rows = useMemo(() => {
    const latest = latestCertificates(s.certificates);
    const firmName = new Map(s.firms.map((f) => [f.id, f.name]));
    return s.participants.map((p) => {
      const mine = latest.filter((c) => c.participantId === p.id).map(certHealth);
      return {
        p,
        firm: firmName.get(p.firmId) ?? '',
        valid: mine.filter((h) => h === 'valid' || h === 'expiring').length,
        expired: mine.filter((h) => h === 'expired').length,
      };
    });
  }, [s]);

  const filtered = rows.filter((r) => {
    if (firmId !== 'all' && r.p.firmId !== firmId) return false;
    if (!q) return true;
    return normalize(`${r.p.name} ${r.p.title} ${r.p.department} ${r.firm}`).includes(normalize(q));
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Katılımcılar" subtitle={`${s.participants.length} firma personeli`} />
      <FlatList
        key={list.key}
        numColumns={list.numColumns}
        columnWrapperStyle={list.columnWrapperStyle}
        data={filtered}
        keyExtractor={(r) => r.p.id}
        renderItem={({ item }) => (
          <View style={list.itemStyle}>
            <Row
              onPress={() => router.push(`/participant/${item.p.id}`)}
              left={<Avatar name={item.p.name} />}
              title={item.p.name}
              subtitle={`${item.p.title} · ${item.firm}`}
              meta={
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                  <Pill
                    label={`${item.valid} geçerli`}
                    tone={item.valid ? 'success' : 'neutral'}
                    icon="ribbon"
                  />
                  {item.expired > 0 && <Pill label={`${item.expired} süresi dolmuş`} tone="danger" />}
                </View>
              }
            />
          </View>
        )}
        ListHeaderComponent={
          <View style={{ gap: spacing.md, marginBottom: spacing.xs }}>
            <SearchBar value={q} onChangeText={setQ} placeholder="İsim, görev veya firma ara" />
            <Chips
              value={firmId}
              onChange={setFirmId}
              options={[
                { value: 'all', label: 'Tüm firmalar', count: s.participants.length },
                ...s.firms.map((f) => ({
                  value: f.id,
                  label: f.name.split(' ')[0],
                  count: s.participants.filter((p) => p.firmId === f.id).length,
                })),
              ]}
            />
            <Text style={{ color: colors.textDim, fontSize: 12.5 }}>{filtered.length} kişi</Text>
          </View>
        }
        ListEmptyComponent={<EmptyState icon="people" title="Kişi bulunamadı" />}
        contentContainerStyle={[list.contentContainerStyle, { paddingBottom: bottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
