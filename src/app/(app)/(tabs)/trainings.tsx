import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { ASSIGNMENT_STATUS, AssignmentRow } from '@/components/domain';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { HeaderAction } from '@/components/ui/forms';
import {
  Chips,
  EmptyState,
  IconTile,
  Pill,
  Row,
  ScreenHeader,
  SearchBar,
  useBottomPadding,
  type IconName,
} from '@/components/ui/kit';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { actions, useAppState, useLookups } from '@/data/store';
import type { Assignment, AssignmentStatus, Training } from '@/data/types';
import { formatDate, normalize } from '@/lib/format';
import { usePersistentState } from '@/lib/usePersistentState';
import { colors, font, spacing } from '@/theme';

type Tab = 'assignments' | 'catalog';
type StatusFilter = 'all' | AssignmentStatus | 'online';
type ARow = { a: Assignment; training: string; firm: string; done: number };
type TRow = { t: Training; assignments: number };

const STATUS_RANK: Record<AssignmentStatus, number> = { in_progress: 0, planned: 1, completed: 2 };

export default function Trainings() {
  const s = useAppState();
  const L = useLookups();
  const [tab, setTab] = usePersistentState<Tab>('trainings-tab', 'assignments');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [q, setQ] = useState('');
  const bottom = useBottomPadding(true);

  const aRows = useMemo<ARow[]>(
    () =>
      s.assignments.map((a) => ({
        a,
        training: L.training(a.trainingId)?.title ?? '',
        firm: L.firm(a.firmId)?.name ?? '',
        done: s.enrollments.filter((e) => e.assignmentId === a.id && e.status === 'completed').length,
      })),
    [s, L],
  );
  const tRows = useMemo<TRow[]>(
    () => s.trainings.map((t) => ({ t, assignments: s.assignments.filter((a) => a.trainingId === t.id).length })),
    [s],
  );

  const count = (st: StatusFilter) =>
    st === 'online'
      ? s.assignments.filter((a) => a.delivery === 'online').length
      : s.assignments.filter((a) => a.status === st).length;

  const aFiltered = aRows.filter((r) => {
    if (status === 'online' && r.a.delivery !== 'online') return false;
    if (status !== 'all' && status !== 'online' && r.a.status !== status) return false;
    return !q || normalize(`${r.training} ${r.firm} ${r.a.location}`).includes(normalize(q));
  });
  const tFiltered = tRows.filter((r) => !q || normalize(`${r.t.title} ${r.t.category}`).includes(normalize(q)));

  const txt = (t: string, dim?: boolean) => (
    <Text style={{ color: dim ? colors.textMuted : colors.text, fontSize: 13.5 }} numberOfLines={1}>
      {t}
    </Text>
  );

  const aColumns: Column<ARow>[] = [
    {
      key: 'training',
      title: 'Eğitim',
      flex: 2,
      minWidth: 220,
      sortValue: (r) => r.training,
      render: (r) => (
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: colors.text, fontSize: 14, fontWeight: font.semibold }} numberOfLines={1}>
            {r.training}
          </Text>
          <Text style={{ color: colors.textDim, fontSize: 12 }} numberOfLines={1}>
            {r.firm}
          </Text>
        </View>
      ),
    },
    {
      key: 'delivery',
      title: 'Tür',
      flex: 0.9,
      minWidth: 110,
      sortValue: (r) => r.a.delivery,
      render: (r) =>
        r.a.delivery === 'online' ? (
          <Pill label="Online" tone="amber" icon="laptop-outline" />
        ) : (
          <Pill label="Yüz yüze" icon="people-outline" />
        ),
    },
    {
      key: 'date',
      title: 'Tarih / son tarih',
      flex: 1.1,
      minWidth: 140,
      sortValue: (r) => (r.a.delivery === 'online' ? r.a.dueDate : r.a.date),
      render: (r) =>
        txt(
          r.a.delivery === 'online'
            ? `${formatDate(r.a.dueDate ?? r.a.date)} (son)`
            : `${formatDate(r.a.date)} · ${r.a.time}`,
          true,
        ),
    },
    {
      key: 'people',
      title: 'Katılımcı',
      flex: 0.9,
      minWidth: 110,
      align: 'right',
      sortValue: (r) => r.a.participantIds.length,
      render: (r) =>
        txt(r.a.delivery === 'online' ? `${r.done}/${r.a.participantIds.length}` : String(r.a.participantIds.length)),
    },
    {
      key: 'status',
      title: 'Durum',
      flex: 1.1,
      minWidth: 140,
      sortValue: (r) => STATUS_RANK[r.a.status],
      render: (r) => {
        const st = ASSIGNMENT_STATUS[r.a.status];
        return <Pill label={st.label} tone={st.tone} icon={st.icon} />;
      },
    },
  ];

  const tColumns: Column<TRow>[] = [
    {
      key: 'title',
      title: 'Eğitim',
      flex: 2.2,
      minWidth: 240,
      sortValue: (r) => r.t.title,
      render: (r) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1, minWidth: 0 }}>
          <IconTile icon={(r.t.icon as IconName) ?? 'school'} tone="amber" size={34} />
          <Text style={{ flex: 1, color: colors.text, fontSize: 14, fontWeight: font.semibold }} numberOfLines={1}>
            {r.t.title}
          </Text>
        </View>
      ),
    },
    {
      key: 'category',
      title: 'Kategori',
      flex: 1,
      minWidth: 110,
      sortValue: (r) => r.t.category,
      render: (r) => <Pill label={r.t.category} tone={r.t.category === 'Zorunlu' ? 'amber' : 'neutral'} />,
    },
    {
      key: 'hours',
      title: 'Süre',
      flex: 0.7,
      minWidth: 80,
      align: 'right',
      sortValue: (r) => r.t.hours,
      render: (r) => txt(`${r.t.hours} sa`),
    },
    {
      key: 'lessons',
      title: 'Ders',
      flex: 0.7,
      minWidth: 80,
      align: 'right',
      sortValue: (r) => r.t.content.lessons.length,
      render: (r) => txt(String(r.t.content.lessons.length)),
    },
    {
      key: 'questions',
      title: 'Soru',
      flex: 0.7,
      minWidth: 80,
      align: 'right',
      sortValue: (r) => r.t.content.finalExam.questions.length,
      render: (r) => txt(String(r.t.content.finalExam.questions.length)),
    },
    {
      key: 'validity',
      title: 'Geçerlilik',
      flex: 0.9,
      minWidth: 100,
      align: 'right',
      sortValue: (r) => r.t.validityMonths,
      render: (r) => txt(`${r.t.validityMonths} ay`, true),
    },
    {
      key: 'assignments',
      title: 'Atama',
      flex: 0.8,
      minWidth: 90,
      align: 'right',
      sortValue: (r) => r.assignments,
      render: (r) => txt(String(r.assignments)),
    },
  ];

  const header = (
    <View style={{ gap: spacing.md }}>
      <SegmentedControl<Tab>
        value={tab}
        onChange={(t) => {
          setTab(t);
          setQ('');
        }}
        segments={[
          { value: 'assignments', label: 'Atamalar', icon: 'calendar-outline' },
          { value: 'catalog', label: 'Eğitim kataloğu', icon: 'library-outline' },
        ]}
      />
      <SearchBar
        value={q}
        onChangeText={setQ}
        placeholder={tab === 'assignments' ? 'Eğitim, firma veya yer ara' : 'Eğitim ara'}
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
            { value: 'online', label: 'Online', count: count('online') },
          ]}
        />
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title="Eğitimler"
        subtitle={`${s.trainings.length} eğitim · ${s.assignments.length} atama`}
        back={false}
        large
        right={
          tab === 'assignments' ? (
            <HeaderAction label="Eğitim ata" onPress={() => router.push('/assignment/new')} />
          ) : (
            <HeaderAction label="Yeni eğitim" onPress={() => router.push(`/content/${actions.createTraining()}`)} />
          )
        }
      />
      {tab === 'assignments' ? (
        <DataTable<ARow>
          key="assignments"
          id="assignments"
          data={aFiltered}
          keyOf={(r) => r.a.id}
          columns={aColumns}
          defaultSort={{ key: 'status', dir: 'asc' }}
          itemLabel="atama"
          resetKey={`${q}|${status}`}
          bottomPadding={bottom}
          onOpen={(r) => router.push(`/assignment/${r.a.id}`)}
          renderCard={(r) => <AssignmentRow a={r.a} />}
          onDelete={(ids) => actions.deleteAssignments(ids)}
          deleteMessage={(ids) => {
            const enr = s.enrollments.filter((e) => ids.includes(e.assignmentId)).length;
            return `Atamalar${enr ? ` ve ${enr} online eğitim kaydı` : ''} silinecek. Daha önce düzenlenmiş sertifikalar korunur.`;
          }}
          toolbar={header}
          empty={<EmptyState icon="calendar" title="Atama yok" text="Yeni eğitim atamak için “Eğitim ata” butonunu kullanın." />}
        />
      ) : (
        <DataTable<TRow>
          key="catalog"
          id="catalog"
          data={tFiltered}
          keyOf={(r) => r.t.id}
          columns={tColumns}
          defaultSort={{ key: 'title', dir: 'asc' }}
          itemLabel="eğitim"
          resetKey={q}
          bottomPadding={bottom}
          onOpen={(r) => router.push(`/training/${r.t.id}`)}
          renderCard={(r) => (
            <Row
              onPress={() => router.push(`/training/${r.t.id}`)}
              left={<IconTile icon={(r.t.icon as IconName) ?? 'school'} tone="amber" size={44} />}
              title={r.t.title}
              subtitle={`${r.t.hours} saat · ${r.t.content.lessons.length} ders · ${r.t.content.finalExam.questions.length} soru`}
              meta={
                <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: 4, alignItems: 'center' }}>
                  <Pill label={r.t.category} tone={r.t.category === 'Zorunlu' ? 'amber' : 'neutral'} />
                  <Text style={{ color: colors.textDim, fontSize: 12 }}>{r.assignments} atama</Text>
                </View>
              }
            />
          )}
          onDelete={(ids) => {
            const res = actions.deleteTrainings(ids);
            if (res.blocked.length) {
              return `${res.deleted} eğitim silindi. Kullanımda olduğu için silinemeyenler: ${res.blocked
                .map((b) => `${b.name} (${b.reason})`)
                .join(', ')}.`;
            }
          }}
          deleteMessage={() =>
            'Ataması ya da sertifikası olan eğitimler silinmez; diğerleri içerikleriyle birlikte kalıcı olarak silinir.'
          }
          toolbar={header}
          empty={<EmptyState icon="library" title="Eğitim bulunamadı" />}
        />
      )}
    </View>
  );
}
