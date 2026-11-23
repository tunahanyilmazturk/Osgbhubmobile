import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { CertificateRow } from '@/components/domain';
import { Chips, EmptyState, ScreenHeader, SearchBar, useBottomPadding } from '@/components/ui/kit';
import { certHealth, latestCertificates, useAppState, useLookups, type CertHealth } from '@/data/store';
import { normalize } from '@/lib/format';
import { colors, spacing } from '@/theme';

type Filter = 'all' | CertHealth | 'process';

export default function Certificates() {
  const params = useLocalSearchParams<{ filter?: Filter }>();
  const s = useAppState();
  const L = useLookups();
  const [filter, setFilter] = useState<Filter>(params.filter ?? 'all');
  const [q, setQ] = useState('');
  const bottom = useBottomPadding();

  const all = useMemo(() => {
    // Süreçtekiler + her kişi/eğitim için son sertifika
    const latest = latestCertificates(s.certificates);
    return latest
      .map((c) => ({ c, h: certHealth(c) }))
      .sort((a, b) => {
        const rank: Record<CertHealth, number> = { pending: 0, approved: 1, expiring: 2, expired: 3, valid: 4, rejected: 5 };
        return rank[a.h] - rank[b.h] || a.c.expiryDate.localeCompare(b.c.expiryDate);
      });
  }, [s.certificates]);

  const count = (f: Filter) =>
    f === 'all' ? all.length : f === 'process' ? all.filter((x) => x.h === 'pending' || x.h === 'approved').length : all.filter((x) => x.h === f).length;

  const filtered = all.filter(({ c, h }) => {
    if (filter === 'process' && h !== 'pending' && h !== 'approved') return false;
    if (filter !== 'all' && filter !== 'process' && h !== filter) return false;
    if (!q) return true;
    const p = L.participant(c.participantId);
    const t = L.training(c.trainingId);
    const f = L.firm(c.firmId);
    return normalize(`${p?.name} ${t?.title} ${f?.name} ${c.no}`).includes(normalize(q));
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Sertifikalar" subtitle="Her personelin her eğitimdeki son sertifikası" />
      <FlatList
        data={filtered}
        keyExtractor={(x) => x.c.id}
        renderItem={({ item }) => <CertificateRow cert={item.c} />}
        ListHeaderComponent={
          <View style={{ gap: spacing.md, marginBottom: spacing.xs }}>
            <SearchBar value={q} onChangeText={setQ} placeholder="Kişi, eğitim, firma veya sertifika no" />
            <Chips<Filter>
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: 'Tümü', count: count('all') },
                { value: 'valid', label: 'Geçerli', count: count('valid') },
                { value: 'expiring', label: 'Yaklaşan', count: count('expiring') },
                { value: 'expired', label: 'Süresi dolmuş', count: count('expired') },
                { value: 'process', label: 'Onay/İmza sürecinde', count: count('process') },
              ]}
            />
            <Text style={{ color: colors.textDim, fontSize: 12.5 }}>{filtered.length} sertifika</Text>
          </View>
        }
        ListEmptyComponent={<EmptyState icon="ribbon" title="Sertifika bulunamadı" />}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: bottom,
          gap: spacing.sm,
          width: '100%',
          maxWidth: 640,
          alignSelf: 'center',
        }}
        initialNumToRender={12}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
