import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';

import { FirmRow } from '@/components/domain';
import { Chips, EmptyState, ScreenHeader, SearchBar, useBottomPadding, useListLayout } from '@/components/ui/kit';
import { firmCompliance, useAppState } from '@/data/store';
import type { HazardClass } from '@/data/types';
import { normalize } from '@/lib/format';
import { colors, spacing } from '@/theme';

type Filter = 'all' | HazardClass | 'katip';

export default function Firms() {
  const s = useAppState();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const bottom = useBottomPadding(true);
  const list = useListLayout();

  const rows = useMemo(
    () => s.firms.map((f) => ({ firm: f, compliance: firmCompliance(s, f.id) })),
    [s],
  );

  const filtered = rows.filter(({ firm }) => {
    if (filter === 'katip' && firm.katip.status === 'synced') return false;
    if (filter !== 'all' && filter !== 'katip' && firm.hazard !== filter) return false;
    if (!q) return true;
    const n = normalize(q);
    return normalize(`${firm.name} ${firm.sector} ${firm.city}`).includes(n);
  });

  const count = (fn: (h: HazardClass) => boolean) => s.firms.filter((f) => fn(f.hazard)).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Firmalar" subtitle={`${s.firms.length} aktif sözleşme`} back={false} large />
      <FlatList
        key={list.key}
        numColumns={list.numColumns}
        columnWrapperStyle={list.columnWrapperStyle}
        data={filtered}
        keyExtractor={(r) => r.firm.id}
        renderItem={({ item }) => (
          <View style={list.itemStyle}>
            <FirmRow firm={item.firm} compliance={item.compliance} />
          </View>
        )}
        contentContainerStyle={[list.contentContainerStyle, { paddingBottom: bottom }]}
        ListHeaderComponent={
          <View style={{ gap: spacing.md, marginBottom: spacing.xs }}>
            <SearchBar value={q} onChangeText={setQ} placeholder="Firma, sektör veya şehir ara" />
            <Chips<Filter>
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: 'Tümü', count: s.firms.length },
                { value: 'cok', label: 'Çok tehlikeli', count: count((h) => h === 'cok') },
                { value: 'tehlikeli', label: 'Tehlikeli', count: count((h) => h === 'tehlikeli') },
                { value: 'az', label: 'Az tehlikeli', count: count((h) => h === 'az') },
                { value: 'katip', label: 'KATİP sorunu', count: s.firms.filter((f) => f.katip.status !== 'synced').length },
              ]}
            />
          </View>
        }
        ListEmptyComponent={<EmptyState icon="business" title="Firma bulunamadı" text="Arama veya filtreyi değiştirin." />}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}
