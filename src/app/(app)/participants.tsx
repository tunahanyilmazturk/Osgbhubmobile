import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { CredentialsSheet, type Credential } from '@/components/CredentialsSheet';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { HeaderAction } from '@/components/ui/forms';
import { Avatar, Chips, EmptyState, Pill, Row, ScreenHeader, SearchBar, useBottomPadding } from '@/components/ui/kit';
import { actions, certHealth, latestCertificates, useAppState } from '@/data/store';
import type { Participant } from '@/data/types';
import { formatDate, normalize } from '@/lib/format';
import { colors, font, spacing } from '@/theme';

type R = { p: Participant; firm: string; valid: number; expired: number };

export default function Participants() {
  const params = useLocalSearchParams<{ firmId?: string }>();
  const s = useAppState();
  const [q, setQ] = useState('');
  const [firmId, setFirmId] = useState(params.firmId ?? 'all');
  const [created, setCreated] = useState<Credential[]>([]);
  const bottom = useBottomPadding();

  const rows = useMemo<R[]>(() => {
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
    return normalize(`${r.p.name} ${r.p.title} ${r.p.department} ${r.firm} ${r.p.account?.email ?? ''}`).includes(normalize(q));
  });

  const certPills = (r: R) => (
    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
      <Pill label={`${r.valid} geçerli`} tone={r.valid ? 'success' : 'neutral'} icon="ribbon" />
      {r.expired > 0 && <Pill label={`${r.expired} dolmuş`} tone="danger" />}
    </View>
  );

  const columns: Column<R>[] = [
    {
      key: 'name',
      title: 'Ad soyad',
      flex: 2,
      minWidth: 220,
      sortValue: (r) => r.p.name,
      render: (r) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1, minWidth: 0 }}>
          <Avatar name={r.p.name} size={34} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: font.semibold }} numberOfLines={1}>
              {r.p.name}
            </Text>
            <Text style={{ color: colors.textDim, fontSize: 12 }} numberOfLines={1}>
              {r.p.title}
            </Text>
          </View>
        </View>
      ),
    },
    { key: 'firm', title: 'Firma', flex: 1.6, minWidth: 180, sortValue: (r) => r.firm, render: (r) => <Cell t={r.firm} /> },
    { key: 'dept', title: 'Bölüm', flex: 1, minWidth: 120, sortValue: (r) => r.p.department, render: (r) => <Cell t={r.p.department} dim /> },
    { key: 'certs', title: 'Sertifikalar', flex: 1.4, minWidth: 170, sortValue: (r) => r.valid - r.expired * 10, render: certPills },
    {
      key: 'account',
      title: 'Hesap',
      flex: 1,
      minWidth: 110,
      sortValue: (r) => (r.p.account ? 1 : 0),
      render: (r) => (r.p.account ? <Pill label="Aktif" tone="amber" icon="key" /> : <Pill label="Yok" />),
    },
    { key: 'start', title: 'İşe giriş', flex: 1, minWidth: 120, sortValue: (r) => r.p.startDate, render: (r) => <Cell t={formatDate(r.p.startDate)} dim /> },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title="Katılımcılar"
        subtitle={`${s.participants.length} firma personeli · ${s.participants.filter((p) => p.account).length} hesap`}
        right={
          <HeaderAction
            label="Yeni katılımcı"
            icon="person-add"
            onPress={() => router.push({ pathname: '/participant/new', params: firmId !== 'all' ? { firmId } : {} })}
          />
        }
      />
      <DataTable<R>
        id="participants"
        data={filtered}
        keyOf={(r) => r.p.id}
        columns={columns}
        defaultSort={{ key: 'name', dir: 'asc' }}
        itemLabel="katılımcı"
        resetKey={`${q}|${firmId}`}
        bottomPadding={bottom}
        onOpen={(r) => router.push(`/participant/${r.p.id}`)}
        renderCard={(r) => (
          <Row
            onPress={() => router.push(`/participant/${r.p.id}`)}
            left={<Avatar name={r.p.name} />}
            title={r.p.name}
            subtitle={`${r.p.title} · ${r.firm}`}
            meta={
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                {certPills(r)}
                {r.p.account && <Pill label="Hesap" tone="amber" icon="key" />}
              </View>
            }
          />
        )}
        bulkActions={[
          {
            label: 'Hesap oluştur',
            icon: 'key-outline',
            onPress: (ids, clear) => {
              const accs = actions.createAccounts(ids);
              clear();
              setCreated(accs.map((a) => ({ ...a, name: s.participants.find((x) => x.id === a.participantId)?.name ?? '' })));
            },
          },
        ]}
        onDelete={(ids) => actions.deleteParticipants(ids)}
        deleteMessage={(ids) => {
          const set = new Set(ids);
          const certs = s.certificates.filter((c) => set.has(c.participantId)).length;
          const enr = s.enrollments.filter((e) => set.has(e.participantId)).length;
          return `Katılımcılarla birlikte ${enr} online eğitim kaydı ve ${certs} sertifika kalıcı olarak silinecek.`;
        }}
        toolbar={
          <View style={{ gap: spacing.md }}>
            <SearchBar value={q} onChangeText={setQ} placeholder="İsim, görev, firma veya e-posta ara" />
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
          </View>
        }
        empty={<EmptyState icon="people" title="Kişi bulunamadı" text="Arama veya filtreyi değiştirin ya da yeni katılımcı ekleyin." />}
      />
      <CredentialsSheet
        visible={created.length > 0}
        accounts={created}
        title={created.length ? `${created.length} hesap oluşturuldu` : 'Hesap'}
        subtitle="Seçilenlerden hesabı olmayanlar için oluşturuldu. Bilgileri kopyalayıp paylaşın."
        onClose={() => setCreated([])}
      />
    </View>
  );
}

function Cell({ t, dim }: { t: string; dim?: boolean }) {
  return (
    <Text style={{ color: dim ? colors.textMuted : colors.text, fontSize: 13.5 }} numberOfLines={1}>
      {t}
    </Text>
  );
}
