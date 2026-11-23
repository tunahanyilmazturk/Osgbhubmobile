import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Card, Checkbox, EmptyState, IconTile, Pill, Screen, ScreenHeader, SectionHeader } from '@/components/ui/kit';
import { DOC_LABEL, actions, useAppState, useLookups } from '@/data/store';
import { formatDate } from '@/lib/format';
import { displayName, useSession } from '@/lib/session';
import { colors, font, radius, spacing } from '@/theme';

type Tab = 'waiting' | 'signed';
type Method = 'mobile' | 'card';
type Phase = 'method' | 'pin' | 'signing' | 'done';

const PIN_LENGTH = 6;

export default function ESignature() {
  const s = useAppState();
  const L = useLookups();
  const { user } = useSession();
  const insets = useSafeAreaInsets();
  const me = user ? displayName(user.name) : 'Kullanıcı';

  const [tab, setTab] = useState<Tab>('waiting');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sheet, setSheet] = useState(false);
  const [phase, setPhase] = useState<Phase>('method');
  const [method, setMethod] = useState<Method>('mobile');
  const [pin, setPin] = useState('');
  const [signedCount, setSignedCount] = useState(0);

  // Bekleyen: onaylı sertifikalar eğitim oturumuna göre gruplanır + belgeler
  const items = useMemo(() => {
    const certGroups = new Map<string, string[]>();
    for (const c of s.certificates.filter((x) => x.status === 'approved')) {
      const key = `${c.firmId}:${c.trainingId}:${c.issueDate}`;
      certGroups.set(key, [...(certGroups.get(key) ?? []), c.id]);
    }
    const certItems = [...certGroups.entries()].map(([key, ids]) => {
      const [firmId, trainingId, date] = key.split(':');
      return {
        key: `cg:${key}`,
        kind: 'cert' as const,
        ids,
        title: `${L.training(trainingId)?.title} sertifikaları`,
        sub: `${L.firm(firmId)?.name} · ${ids.length} sertifika`,
        date,
      };
    });
    const docItems = s.documents
      .filter((d) => d.status === 'waiting')
      .map((d) => ({
        key: `d:${d.id}`,
        kind: 'doc' as const,
        ids: [d.id],
        title: d.title,
        sub: `${L.firm(d.firmId)?.name} · ${DOC_LABEL[d.type]}`,
        date: d.createdAt,
      }));
    return [...certItems, ...docItems];
  }, [s, L]);

  const signedHistory = useMemo(() => {
    const docs = s.documents
      .filter((d) => d.status === 'signed')
      .map((d) => ({ key: d.id, title: d.title, sub: L.firm(d.firmId)?.name ?? '', date: d.signedAt!, by: d.signedBy! }));
    // Son imzalanan sertifikaları oturum bazında göster
    const recent = new Map<string, { count: number; date: string; by: string; title: string; sub: string }>();
    for (const c of s.certificates) {
      if (c.status !== 'signed' || !c.signedAt) continue;
      const key = `${c.firmId}:${c.trainingId}:${c.signedAt}`;
      const prev = recent.get(key);
      recent.set(key, {
        count: (prev?.count ?? 0) + 1,
        date: c.signedAt,
        by: c.signedBy ?? '',
        title: `${L.training(c.trainingId)?.title} sertifikaları`,
        sub: L.firm(c.firmId)?.name ?? '',
      });
    }
    const certRows = [...recent.entries()].map(([key, v]) => ({
      key,
      title: v.title,
      sub: `${v.sub} · ${v.count} sertifika`,
      date: v.date,
      by: v.by,
    }));
    return [...docs, ...certRows].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15);
  }, [s, L]);

  const toggle = (key: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });

  const chosen = items.filter((i) => selected.has(i.key));
  const docCount = chosen.reduce((sum, i) => sum + i.ids.length, 0);

  const openSheet = () => {
    setPhase('method');
    setPin('');
    setSheet(true);
  };

  const press = (d: string) => {
    if (phase !== 'pin') return;
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    const next = (pin + d).slice(0, PIN_LENGTH);
    setPin(next);
    if (next.length === PIN_LENGTH) {
      setPhase('signing');
      setTimeout(() => {
        const certIds = chosen.filter((i) => i.kind === 'cert').flatMap((i) => i.ids);
        const docIds = chosen.filter((i) => i.kind === 'doc').flatMap((i) => i.ids);
        actions.sign(certIds, docIds, me);
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSignedCount(certIds.length + docIds.length);
        setSelected(new Set());
        setPhase('done');
      }, 1600);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Screen
        tabBar={selected.size > 0}
        header={<ScreenHeader title="E-imza" subtitle="5070 sayılı Kanun'a uygun nitelikli elektronik imza" />}
      >
        <SegmentedControl<Tab>
          value={tab}
          onChange={setTab}
          segments={[
            { value: 'waiting', label: `Bekleyen (${items.length})`, icon: 'hourglass-outline' },
            { value: 'signed', label: 'İmzalanan', icon: 'checkmark-done-outline' },
          ]}
        />

        {tab === 'waiting' ? (
          items.length === 0 ? (
            <EmptyState icon="finger-print" title="İmza bekleyen belge yok" text="Onaylanan sertifikalar ve belgeler burada listelenir." />
          ) : (
            <>
              <View style={styles.selectRow}>
                <Text style={styles.dim}>{items.length} kalem</Text>
                <Pressable
                  onPress={() =>
                    setSelected(selected.size === items.length ? new Set() : new Set(items.map((i) => i.key)))
                  }
                  hitSlop={8}
                >
                  <Text style={styles.link}>{selected.size === items.length ? 'Seçimi kaldır' : 'Tümünü seç'}</Text>
                </Pressable>
              </View>
              {items.map((i) => (
                <Pressable
                  key={i.key}
                  onPress={() => toggle(i.key)}
                  style={[styles.item, selected.has(i.key) && styles.itemOn]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected.has(i.key) }}
                >
                  <Checkbox checked={selected.has(i.key)} />
                  <IconTile icon={i.kind === 'cert' ? 'ribbon' : 'document-text'} tone="amber" size={40} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.title} numberOfLines={2}>
                      {i.title}
                    </Text>
                    <Text style={styles.dim} numberOfLines={1}>
                      {i.sub}
                    </Text>
                    <Text style={styles.dim}>{formatDate(i.date)}</Text>
                  </View>
                </Pressable>
              ))}
            </>
          )
        ) : (
          <>
            <SectionHeader title="Son imzalananlar" />
            {signedHistory.map((h) => (
              <Card key={h.key} style={styles.history}>
                <IconTile icon="checkmark-done" tone="success" size={38} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.title} numberOfLines={1}>
                    {h.title}
                  </Text>
                  <Text style={styles.dim} numberOfLines={1}>
                    {h.sub}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Pill label="İmzalı" tone="success" />
                  <Text style={styles.dim}>{formatDate(h.date)}</Text>
                </View>
              </Card>
            ))}
          </>
        )}
      </Screen>

      {selected.size > 0 && (
        <View style={[styles.bar, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={{ flex: 1, maxWidth: 560 }}>
            <Button title={`${docCount} belgeyi imzala`} icon="finger-print" onPress={openSheet} />
          </View>
        </View>
      )}

      <BottomSheet
        visible={sheet}
        onClose={() => phase !== 'signing' && setSheet(false)}
        title={phase === 'done' ? undefined : 'Elektronik imza'}
        subtitle={phase === 'method' ? `${docCount} belge imzalanacak` : undefined}
      >
        {phase === 'method' && (
          <View style={{ gap: spacing.sm }}>
            {(
              [
                { v: 'mobile', icon: 'phone-portrait', t: 'Mobil imza', d: 'Operatörünüze kayıtlı mobil imza ile' },
                { v: 'card', icon: 'card', t: 'E-imza kartı', d: 'NFC destekli akıllı kart ile' },
              ] as const
            ).map((m) => (
              <Pressable
                key={m.v}
                onPress={() => setMethod(m.v)}
                style={[styles.method, method === m.v && styles.itemOn]}
                accessibilityRole="radio"
                accessibilityState={{ checked: method === m.v }}
              >
                <IconTile icon={m.icon} tone={method === m.v ? 'amber' : 'neutral'} size={42} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{m.t}</Text>
                  <Text style={styles.dim}>{m.d}</Text>
                </View>
              </Pressable>
            ))}
            <View style={{ height: spacing.sm }} />
            <Button title="Devam et" icon="arrow-forward" onPress={() => setPhase('pin')} />
          </View>
        )}

        {(phase === 'pin' || phase === 'signing') && (
          <View style={{ alignItems: 'center', gap: spacing.lg }}>
            <Text style={styles.dim}>
              {method === 'mobile' ? 'Mobil imza PIN kodunuzu girin' : 'Kart PIN kodunuzu girin'}
            </Text>
            <View style={styles.dots} accessibilityLabel={`${pin.length} hane girildi`}>
              {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                <View key={i} style={[styles.dot, i < pin.length && styles.dotOn]} />
              ))}
            </View>
            {phase === 'signing' ? (
              <View style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl }}>
                <ActivityIndicator color={colors.amber} size="large" />
                <Text style={styles.title}>İmzalanıyor…</Text>
                <Text style={styles.dim}>Zaman damgası alınıyor</Text>
              </View>
            ) : (
              <View style={styles.pad}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k) =>
                  k === '' ? (
                    <View key="empty" style={styles.key} />
                  ) : (
                    <Pressable
                      key={k}
                      onPress={() => (k === '⌫' ? setPin((p) => p.slice(0, -1)) : press(k))}
                      style={({ pressed }) => [styles.key, styles.keyBtn, pressed && { backgroundColor: colors.surfaceHigh }]}
                      accessibilityRole="button"
                      accessibilityLabel={k === '⌫' ? 'Sil' : k}
                    >
                      {k === '⌫' ? (
                        <Ionicons name="backspace-outline" size={22} color={colors.text} />
                      ) : (
                        <Text style={styles.keyText}>{k}</Text>
                      )}
                    </Pressable>
                  ),
                )}
              </View>
            )}
          </View>
        )}

        {phase === 'done' && (
          <View style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg }}>
            <View style={styles.doneIcon}>
              <Ionicons name="checkmark" size={36} color={colors.onAmber} />
            </View>
            <Text style={styles.doneTitle}>{signedCount} belge imzalandı</Text>
            <Text style={[styles.dim, { textAlign: 'center' }]}>
              Sertifikalar artık geçerli. İmzalı belgeler ilgili firmalarla paylaşılabilir.
            </Text>
            <View style={{ alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.sm }}>
              <Button
                title="Sertifikaları görüntüle"
                icon="ribbon"
                onPress={() => {
                  setSheet(false);
                  router.push('/certificates');
                }}
              />
              <Button title="Kapat" variant="outline" onPress={() => setSheet(false)} />
            </View>
          </View>
        )}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  dim: { color: colors.textDim, fontSize: 12.5 },
  link: { color: colors.amber, fontSize: 13, fontWeight: font.semibold },
  title: { color: colors.text, fontSize: 14.5, fontWeight: font.semibold },
  selectRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.bgElevated,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  itemOn: { borderColor: colors.amber, backgroundColor: colors.highlight },
  history: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  bar: {
    position: 'absolute',
    justifyContent: 'center',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.barBg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  dots: { flexDirection: 'row', gap: spacing.md },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: colors.borderStrong },
  dotOn: { backgroundColor: colors.amber, borderColor: colors.amber },
  pad: { flexDirection: 'row', flexWrap: 'wrap', width: 276, justifyContent: 'space-between', rowGap: spacing.md },
  key: { width: 80, height: 60, alignItems: 'center', justifyContent: 'center' },
  keyBtn: { borderRadius: radius.lg, backgroundColor: colors.surface },
  keyText: { color: colors.white, fontSize: 24, fontWeight: font.semibold },
  doneIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneTitle: { color: colors.white, fontSize: 20, fontWeight: font.bold },
});
