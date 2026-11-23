import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Avatar, Card, Checkbox, EmptyState, Screen, ScreenHeader } from '@/components/ui/kit';
import { actions, useAppState, useLookups } from '@/data/store';
import { formatDate } from '@/lib/format';
import { formatDuration } from '@/lib/useStudyTimer';
import { displayName, useSession } from '@/lib/session';
import { colors, font, radius, spacing } from '@/theme';

const REASONS = ['Yoklamada yok', 'Sınavdan geçemedi', 'Eksik eğitim saati', 'Hatalı kişi bilgisi'];

export default function Approvals() {
  const s = useAppState();
  const L = useLookups();
  const { user } = useSession();
  const insets = useSafeAreaInsets();
  const me = user ? displayName(user.name) : 'Kullanıcı';

  const pending = useMemo(() => s.certificates.filter((c) => c.status === 'pending'), [s.certificates]);
  const groups = useMemo(() => {
    const map = new Map<string, typeof pending>();
    for (const c of pending) {
      const key = `${c.firmId}:${c.trainingId}:${c.issueDate}`;
      map.set(key, [...(map.get(key) ?? []), c]);
    }
    return [...map.values()];
  }, [pending]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [lastApproved, setLastApproved] = useState(0);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const toggleGroup = (ids: string[]) =>
    setSelected((prev) => {
      const all = ids.every((id) => prev.has(id));
      const n = new Set(prev);
      ids.forEach((id) => (all ? n.delete(id) : n.add(id)));
      return n;
    });

  const approve = () => {
    const ids = [...selected].filter((id) => pending.some((c) => c.id === id));
    actions.approveCertificates(ids, me);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLastApproved(ids.length);
    setSelected(new Set());
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Screen
        tabBar={selected.size > 0}
        header={<ScreenHeader title="Sertifika onayları" subtitle={`${pending.length} sertifika onay bekliyor`} />}>
        {lastApproved > 0 && (
          <Card highlight style={styles.banner}>
            <Ionicons name="checkmark-circle" size={22} color={colors.amber} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>{lastApproved} sertifika onaylandı</Text>
              <Text style={styles.dim}>Geçerli olmaları için e-imza gerekiyor.</Text>
            </View>
            <Pressable onPress={() => router.push('/e-signature')} hitSlop={8}>
              <Text style={styles.link}>E-imza</Text>
            </Pressable>
          </Card>
        )}

        {groups.length === 0 ? (
          <EmptyState icon="checkmark-done" title="Onay bekleyen yok" text="Tamamlanan eğitimlerin sertifikaları burada listelenir." />
        ) : (
          groups.map((g) => {
            const first = g[0];
            const ids = g.map((c) => c.id);
            const allOn = ids.every((id) => selected.has(id));
            return (
              <Card key={ids[0]} style={{ padding: 0, overflow: 'hidden' }}>
                <Pressable
                  onPress={() => toggleGroup(ids)}
                  style={styles.groupHead}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: allOn }}
                >
                  <Checkbox checked={allOn} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.groupTitle}>{L.training(first.trainingId)?.title}</Text>
                    <Text style={styles.dim}>
                      {L.firm(first.firmId)?.name} · {formatDate(first.issueDate)} · {L.member(first.trainerId)?.name}
                    </Text>
                  </View>
                  <Text style={styles.count}>{g.length}</Text>
                </Pressable>
                {g.map((c) => {
                  const p = L.participant(c.participantId);
                  const en = c.enrollmentId ? s.enrollments.find((x) => x.id === c.enrollmentId) : undefined;
                  const final = en?.finalAttempts.find((x) => x.passed);
                  return (
                    <View key={c.id} style={styles.item}>
                      <Pressable
                        onPress={() => toggle(c.id)}
                        style={styles.itemMain}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: selected.has(c.id) }}
                      >
                        <Checkbox checked={selected.has(c.id)} />
                        <Avatar name={p?.name ?? '?'} size={32} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.name}>{p?.name}</Text>
                          <Text style={styles.dim}>
                            {en
                              ? `Online · Final %${final?.score ?? '-'}${en.preTest ? ` · Ön %${en.preTest.score}` : ''} · ${formatDuration(en.seconds)}`
                              : p?.title}
                          </Text>
                        </View>
                      </Pressable>
                      {en && (
                        <Pressable
                          onPress={() => router.push(`/enrollment/${en.id}`)}
                          hitSlop={6}
                          style={styles.review}
                          accessibilityRole="button"
                          accessibilityLabel={`${p?.name} eğitimini incele`}
                        >
                          <Ionicons name="eye-outline" size={14} color={colors.amber} />
                          <Text style={styles.reviewText}>İncele</Text>
                        </Pressable>
                      )}
                      <Pressable
                        onPress={() => setRejecting(c.id)}
                        hitSlop={8}
                        style={styles.reject}
                        accessibilityRole="button"
                        accessibilityLabel={`${p?.name} reddet`}
                      >
                        <Ionicons name="close" size={16} color={colors.danger} />
                      </Pressable>
                    </View>
                  );
                })}
              </Card>
            );
          })
        )}
      </Screen>

      {selected.size > 0 && (
        <View style={[styles.bar, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={{ flex: 1, maxWidth: 560 }}>
            <Button title={`${selected.size} sertifikayı onayla`} icon="checkmark-done" onPress={approve} />
          </View>
        </View>
      )}

      <BottomSheet
        visible={!!rejecting}
        onClose={() => setRejecting(null)}
        title="Sertifikayı reddet"
        subtitle={rejecting ? L.participant(s.certificates.find((c) => c.id === rejecting)?.participantId ?? '')?.name : ''}
      >
        <View style={{ gap: spacing.sm }}>
          {REASONS.map((r) => (
            <Pressable
              key={r}
              style={styles.reason}
              onPress={() => {
                if (rejecting) actions.rejectCertificate(rejecting, r);
                setSelected((prev) => {
                  const n = new Set(prev);
                  if (rejecting) n.delete(rejecting);
                  return n;
                });
                setRejecting(null);
              }}
            >
              <Ionicons name="ban" size={18} color={colors.danger} />
              <Text style={styles.reasonText}>{r}</Text>
            </Pressable>
          ))}
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  dim: { color: colors.textDim, fontSize: 12.5, marginTop: 1 },
  link: { color: colors.amber, fontSize: 13, fontWeight: font.semibold },
  banner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bannerTitle: { color: colors.white, fontSize: 15, fontWeight: font.bold },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  groupTitle: { color: colors.white, fontSize: 15, fontWeight: font.bold },
  count: { color: colors.amber, fontSize: 16, fontWeight: font.heavy },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingRight: spacing.md,
  },
  itemMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  name: { color: colors.text, fontSize: 14.5, fontWeight: font.semibold },
  review: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 32,
    paddingHorizontal: 10,
    marginRight: spacing.sm,
    borderRadius: 16,
    backgroundColor: colors.amberSoft,
  },
  reviewText: { color: colors.amber, fontSize: 12.5, fontWeight: font.semibold },
  reject: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    position: 'absolute',
    justifyContent: 'center',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: 'rgba(10,10,11,0.96)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  reason: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  reasonText: { color: colors.text, fontSize: 15, fontWeight: font.medium },
});
