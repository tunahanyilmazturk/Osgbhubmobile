import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { AssignmentRow } from '@/components/domain';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import {
  Chips,
  EmptyState,
  IconButton,
  IconTile,
  Pill,
  Row,
  ScreenHeader,
  useBottomPadding,
  useListLayout,
  type IconName,
} from '@/components/ui/kit';
import { useAppState } from '@/data/store';
import type { AssignmentStatus } from '@/data/types';
import { colors, spacing } from '@/theme';

type Tab = 'assignments' | 'catalog';
type StatusFilter = 'all' | AssignmentStatus;

export default function Trainings() {
  const s = useAppState();
  const [tab, setTab] = useState<Tab>('assignments');
  const [status, setStatus] = useState<StatusFilter>('all');
  const bottom = useBottomPadding(true);

  const assignments = useMemo(() => {
    // Devam eden → planlanan (yakın tarih önce) → tamamlanan (yeni önce)
    const order: Record<AssignmentStatus, number> = { in_progress: 0, planned: 1, completed: 2 };
    return [...s.assignments].sort((a, b) =>
      order[a.status] !== order[b.status]
        ? order[a.status] - order[b.status]
        : a.status === 'completed'
          ? b.date.localeCompare(a.date)
          : a.date.localeCompare(b.date),
    );
  }, [s.assignments]);

  const filtered = status === 'all' ? assignments : assignments.filter((a) => a.status === status);
  const count = (st: AssignmentStatus) => s.assignments.filter((a) => a.status === st).length;

  const header = (
    <View style={{ gap: spacing.md, marginBottom: spacing.xs }}>
      <SegmentedControl<Tab>
        value={tab}
        onChange={setTab}
        segments={[
          { value: 'assignments', label: 'Atamalar', icon: 'calendar-outline' },
          { value: 'catalog', label: 'Eğitim kataloğu', icon: 'library-outline' },
        ]}
      />
      {tab === 'assignments' && (
        <Chips<StatusFilter>
          value={status}
          onChange={setStatus}
          options={[
            { value: 'all', label: 'Tümü', count: s.assignments.length },
            { value: 'in_progress', label: 'Devam eden', count: count('in_progress') },
            { value: 'planned', label: 'Planlanan', count: count('planned') },
            { value: 'completed', label: 'Tamamlanan', count: count('completed') },
          ]}
        />
      )}
    </View>
  );

  const list = useListLayout();
  const listStyle = [list.contentContainerStyle, { paddingBottom: bottom }];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title="Eğitimler"
        subtitle={`${s.trainings.length} eğitim · ${s.assignments.length} atama`}
        back={false}
        large
        right={
          <IconButton
            icon="add"
            tone="amber"
            label="Eğitim ata"
            onPress={() => router.push('/assignment/new')}
          />
        }
      />
      {tab === 'assignments' ? (
        <FlatList
          key={list.key}
          numColumns={list.numColumns}
          columnWrapperStyle={list.columnWrapperStyle}
          data={filtered}
          keyExtractor={(a) => a.id}
          renderItem={({ item }) => (
            <View style={list.itemStyle}>
              <AssignmentRow a={item} />
            </View>
          )}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <EmptyState
              icon="calendar"
              title="Atama yok"
              text="Yeni eğitim atamak için + butonunu kullanın."
            />
          }
          contentContainerStyle={listStyle}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          key={list.key}
          numColumns={list.numColumns}
          columnWrapperStyle={list.columnWrapperStyle}
          data={s.trainings}
          keyExtractor={(t) => t.id}
          renderItem={({ item: t }) => {
            const n = s.assignments.filter((a) => a.trainingId === t.id).length;
            return (
              <View style={list.itemStyle}>
                <Row
                  onPress={() => router.push(`/training/${t.id}`)}
                  left={<IconTile icon={t.icon as IconName} tone="amber" size={44} />}
                  title={t.title}
                  subtitle={`${t.hours} saat · ${t.mode} · ${t.validityMonths / 12} yıl geçerli`}
                  meta={
                    <View
                      style={{ flexDirection: 'row', gap: spacing.sm, marginTop: 4, alignItems: 'center' }}
                    >
                      <Pill label={t.category} tone={t.category === 'Zorunlu' ? 'amber' : 'neutral'} />
                      <Text style={{ color: colors.textDim, fontSize: 12 }}>{n} atama</Text>
                    </View>
                  }
                />
              </View>
            );
          }}
          ListHeaderComponent={header}
          contentContainerStyle={listStyle}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
