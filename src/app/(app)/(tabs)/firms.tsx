import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { FirmRow, HazardPill, KATIP_STATUS } from '@/components/domain';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { HeaderAction } from '@/components/ui/forms';
import { Chips, EmptyState, Pill, ProgressBar, ScreenHeader, SearchBar, useBottomPadding } from '@/components/ui/kit';
import { actions, firmCompliance, useAppState } from '@/data/store';
import type { Firm, HazardClass } from '@/data/types';
import { daysUntil, formatDate, normalize, remainingText } from '@/lib/format';
import { colors, font, spacing } from '@/theme';

type Filter = 'all' | HazardClass | 'katip';
type Row = { firm: Firm; compliance: number };

const HAZARD_RANK: Record<HazardClass, number> = { az: 0, tehlikeli: 1, cok: 2 };

export default function Firms() {
  const s = useAppState();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const bottom = useBottomPadding(true);

  const rows = useMemo<Row[]>(() => s.firms.map((f) => ({ firm: f, compliance: firmCompliance(s, f.id) })), [s]);

  const filtered = rows.filter(({ firm }) => {
    if (filter === 'katip' && firm.katip.status === 'synced') return false;
    if (filter !== 'all' && filter !== 'katip' && firm.hazard !== filter) return false;
    if (!q) return true;
    return normalize(`${firm.name} ${firm.sector} ${firm.city}`).includes(normalize(q));
  });

  const count = (fn: (h: HazardClass) => boolean) => s.firms.filter((f) => fn(f.hazard)).length;

  const columns: Column<Row>[] = [
    {
      key: 'name',
      title: 'Firma',
      flex: 2.4,
      minWidth: 220,
      sortValue: (r) => r.firm.name,
      render: (r) => (
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: colors.text, fontSize: 14, fontWeight: font.semibold }} numberOfLines={1}>
            {r.firm.name}
          </Text>
          <Text style={{ color: colors.textDim, fontSize: 12 }} numberOfLines={1}>
            {r.firm.sector} · {r.firm.city}
          </Text>
        </View>
      ),
    },
    {
      key: 'hazard',
      title: 'Tehlike',
      flex: 1.2,
      minWidth: 130,
      sortValue: (r) => HAZARD_RANK[r.firm.hazard],
      render: (r) => <HazardPill hazard={r.firm.hazard} />,
    },
    {
      key: 'employees',
      title: 'Çalışan',
      flex: 0.8,
      minWidth: 90,
      align: 'right',
      sortValue: (r) => r.firm.employees,
      render: (r) => <Text style={{ color: colors.text, fontSize: 14, fontWeight: font.semibold }}>{r.firm.employees}</Text>,
    },
    {
      key: 'compliance',
      title: 'Eğitim uyumu',
      flex: 1.4,
      minWidth: 150,
      sortValue: (r) => r.compliance,
      render: (r) => (
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: colors.text, fontSize: 13, fontWeight: font.bold }}>%{r.compliance}</Text>
          <ProgressBar
            value={r.compliance / 100}
            tone={r.compliance >= 85 ? 'success' : r.compliance >= 65 ? 'amber' : 'danger'}
            height={4}
            label="Eğitim uyumu"
          />
        </View>
      ),
    },
    {
      key: 'katip',
      title: 'İSG-KATİP',
      flex: 1.3,
      minWidth: 150,
      sortValue: (r) => ({ error: 0, pending: 1, synced: 2 })[r.firm.katip.status],
      render: (r) => {
        const k = KATIP_STATUS[r.firm.katip.status];
        return <Pill label={k.label} tone={k.tone} icon={k.icon} />;
      },
    },
    {
      key: 'contract',
      title: 'Sözleşme bitişi',
      flex: 1.2,
      minWidth: 140,
      sortValue: (r) => r.firm.contractEnd,
      render: (r) => {
        const soon = daysUntil(r.firm.contractEnd) <= 30;
        return (
          <View>
            <Text style={{ color: colors.text, fontSize: 13 }}>{formatDate(r.firm.contractEnd)}</Text>
            <Text style={{ color: soon ? colors.amber : colors.textDim, fontSize: 11.5 }}>{remainingText(r.firm.contractEnd)}</Text>
          </View>
        );
      },
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title="Firmalar"
        subtitle={`${s.firms.length} aktif sözleşme`}
        back={false}
        large
        right={<HeaderAction label="Yeni firma" onPress={() => router.push('/firm/new')} />}
      />
      <DataTable<Row>
        id="firms"
        data={filtered}
        keyOf={(r) => r.firm.id}
        columns={columns}
        defaultSort={{ key: 'name', dir: 'asc' }}
        renderCard={(r) => <FirmRow firm={r.firm} compliance={r.compliance} />}
        onOpen={(r) => router.push(`/firm/${r.firm.id}`)}
        itemLabel="firma"
        resetKey={`${q}|${filter}`}
        bottomPadding={bottom}
        onDelete={(ids) => actions.deleteFirms(ids)}
        deleteMessage={(ids) => {
          const set = new Set(ids);
          const people = s.participants.filter((p) => set.has(p.firmId)).length;
          const asg = s.assignments.filter((a) => set.has(a.firmId)).length;
          const certs = s.certificates.filter((c) => set.has(c.firmId)).length;
          return `Firmalarla birlikte ${people} personel, ${asg} eğitim ataması ve ${certs} sertifika da kalıcı olarak silinecek.`;
        }}
        toolbar={
          <View style={{ gap: spacing.md }}>
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
        empty={<EmptyState icon="business" title="Firma bulunamadı" text="Arama veya filtreyi değiştirin ya da yeni firma ekleyin." />}
      />
    </View>
  );
}
