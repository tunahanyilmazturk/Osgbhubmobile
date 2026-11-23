import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { CertPill, CertificateRow } from '@/components/domain';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { HeaderAction } from '@/components/ui/forms';
import { Chips, EmptyState, ScreenHeader, SearchBar, useBottomPadding } from '@/components/ui/kit';
import { actions, certHealth, latestCertificates, useAppState, useLookups, type CertHealth } from '@/data/store';
import type { Certificate } from '@/data/types';
import { formatDate, normalize, remainingText } from '@/lib/format';
import { displayName, useSession } from '@/lib/session';
import { colors, font, spacing } from '@/theme';

type Filter = 'all' | CertHealth | 'process';
type R = { c: Certificate; h: CertHealth; person: string; training: string; firm: string };

const RANK: Record<CertHealth, number> = { pending: 0, approved: 1, expiring: 2, expired: 3, valid: 4, rejected: 5 };

export default function Certificates() {
  const params = useLocalSearchParams<{ filter?: Filter }>();
  const s = useAppState();
  const L = useLookups();
  const { user } = useSession();
  const [filter, setFilter] = useState<Filter>(params.filter ?? 'all');
  const [q, setQ] = useState('');
  const bottom = useBottomPadding();

  const all = useMemo<R[]>(
    () =>
      latestCertificates(s.certificates).map((c) => ({
        c,
        h: certHealth(c),
        person: L.participant(c.participantId)?.name ?? '',
        training: L.training(c.trainingId)?.title ?? '',
        firm: L.firm(c.firmId)?.name ?? '',
      })),
    [s.certificates, L],
  );

  const count = (f: Filter) =>
    f === 'all'
      ? all.length
      : f === 'process'
        ? all.filter((x) => x.h === 'pending' || x.h === 'approved').length
        : all.filter((x) => x.h === f).length;

  const filtered = all.filter((r) => {
    if (filter === 'process' && r.h !== 'pending' && r.h !== 'approved') return false;
    if (filter !== 'all' && filter !== 'process' && r.h !== filter) return false;
    if (!q) return true;
    return normalize(`${r.person} ${r.training} ${r.firm} ${r.c.no}`).includes(normalize(q));
  });

  const txt = (t: string, dim?: boolean) => (
    <Text style={{ color: dim ? colors.textMuted : colors.text, fontSize: 13.5 }} numberOfLines={1}>
      {t}
    </Text>
  );

  const columns: Column<R>[] = [
    {
      key: 'person',
      title: 'Katılımcı',
      flex: 1.6,
      minWidth: 180,
      sortValue: (r) => r.person,
      render: (r) => (
        <View style={{ minWidth: 0, flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 14, fontWeight: font.semibold }} numberOfLines={1}>
            {r.person}
          </Text>
          <Text style={{ color: colors.textDim, fontSize: 11.5 }}>{r.c.no}</Text>
        </View>
      ),
    },
    { key: 'training', title: 'Eğitim', flex: 1.8, minWidth: 200, sortValue: (r) => r.training, render: (r) => txt(r.training) },
    { key: 'firm', title: 'Firma', flex: 1.4, minWidth: 160, sortValue: (r) => r.firm, render: (r) => txt(r.firm, true) },
    { key: 'status', title: 'Durum', flex: 1.4, minWidth: 170, sortValue: (r) => RANK[r.h], render: (r) => <CertPill cert={r.c} /> },
    { key: 'issue', title: 'Düzenlenme', flex: 1, minWidth: 120, sortValue: (r) => r.c.issueDate, render: (r) => txt(formatDate(r.c.issueDate), true) },
    {
      key: 'expiry',
      title: 'Geçerlilik',
      flex: 1.1,
      minWidth: 130,
      sortValue: (r) => r.c.expiryDate,
      render: (r) => (
        <View>
          {txt(formatDate(r.c.expiryDate))}
          <Text style={{ color: r.h === 'expired' ? colors.danger : r.h === 'expiring' ? colors.amber : colors.textDim, fontSize: 11.5 }}>
            {remainingText(r.c.expiryDate)}
          </Text>
        </View>
      ),
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title="Sertifikalar"
        subtitle="Her personelin her eğitimdeki son sertifikası"
        right={<HeaderAction label="Yeni sertifika" onPress={() => router.push('/certificate/new')} />}
      />
      <DataTable<R>
        id="certificates"
        data={filtered}
        keyOf={(r) => r.c.id}
        columns={columns}
        defaultSort={{ key: 'status', dir: 'asc' }}
        itemLabel="sertifika"
        resetKey={`${q}|${filter}`}
        bottomPadding={bottom}
        onOpen={(r) => router.push(`/certificate/${r.c.id}`)}
        renderCard={(r) => <CertificateRow cert={r.c} />}
        bulkActions={[
          {
            label: 'Onayla',
            icon: 'checkmark-done',
            onPress: (ids, clear) => {
              actions.approveCertificates(ids, user ? displayName(user.name) : 'Kullanıcı');
              clear();
            },
          },
        ]}
        onDelete={(ids) => actions.deleteCertificates(ids)}
        deleteMessage={() => 'Seçilen sertifikalar kalıcı olarak silinecek. İmzalı sertifikaların silinmesi kayıtlarda boşluk yaratabilir.'}
        toolbar={
          <View style={{ gap: spacing.md }}>
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
          </View>
        }
        empty={<EmptyState icon="ribbon" title="Sertifika bulunamadı" />}
      />
    </View>
  );
}
