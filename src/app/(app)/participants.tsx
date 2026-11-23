import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { CredentialsSheet, type Credential } from '@/components/CredentialsSheet';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import {
  Avatar,
  Chips,
  EmptyState,
  IconButton,
  Pill,
  Row,
  ScreenHeader,
  SearchBar,
  useBottomPadding,
  useListLayout,
} from '@/components/ui/kit';
import { actions, certHealth, latestCertificates, useAppState } from '@/data/store';
import { normalize } from '@/lib/format';
import { colors, spacing } from '@/theme';

export default function Participants() {
  const params = useLocalSearchParams<{ firmId?: string }>();
  const s = useAppState();
  const [q, setQ] = useState('');
  const [firmId, setFirmId] = useState(params.firmId ?? 'all');
  const bottom = useBottomPadding();
  const [bulk, setBulk] = useState(false);
  const [created, setCreated] = useState<Credential[]>([]);
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

  const noAccount = filtered.filter((r) => !r.p.account);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title="Katılımcılar"
        subtitle={`${s.participants.length} firma personeli · ${s.participants.filter((p) => p.account).length} hesap`}
        right={
          <IconButton
            icon="person-add"
            tone="amber"
            label="Toplu hesap oluştur"
            onPress={() => setBulk(true)}
          />
        }
      />
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
                  {item.p.account && <Pill label="Hesap" tone="amber" icon="key" />}
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
      <BottomSheet
        visible={bulk}
        onClose={() => setBulk(false)}
        title="Toplu hesap oluştur"
        subtitle={
          noAccount.length
            ? `${firmId === 'all' ? 'Listedeki' : (s.firms.find((f) => f.id === firmId)?.name ?? '') + ' firmasındaki'} ${noAccount.length} kişinin giriş hesabı yok. Hepsi için e-posta ve geçici şifre oluşturulsun mu?`
            : 'Listedeki herkesin giriş hesabı var.'
        }
      >
        <View style={{ gap: spacing.sm }}>
          {noAccount.length > 0 && (
            <Button
              title={`${noAccount.length} hesap oluştur`}
              icon="person-add"
              onPress={() => {
                const accs = actions.createAccounts(noAccount.map((x) => x.p.id));
                setBulk(false);
                setCreated(
                  accs.map((a) => ({
                    ...a,
                    name: s.participants.find((x) => x.id === a.participantId)?.name ?? '',
                  })),
                );
              }}
            />
          )}
          <Button title="Vazgeç" variant="outline" onPress={() => setBulk(false)} />
        </View>
      </BottomSheet>
      <CredentialsSheet
        visible={created.length > 0}
        accounts={created}
        title={`${created.length} hesap oluşturuldu`}
        subtitle="Bilgileri kopyalayıp katılımcılarla paylaşın. İlk girişte şifrelerini değiştirmeleri istenir."
        onClose={() => setCreated([])}
      />
    </View>
  );
}
