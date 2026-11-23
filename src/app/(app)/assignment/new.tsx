import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CredentialsSheet } from '@/components/CredentialsSheet';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { TextField } from '@/components/ui/TextField';
import {
  Avatar,
  Card,
  Checkbox,
  IconTile,
  Pill,
  Screen,
  ScreenHeader,
  SectionHeader,
  type IconName,
} from '@/components/ui/kit';
import type { DeliveryMode } from '@/data/types';
import { ROLE_LABEL, actions, certHealth, latestCertificates, useAppState } from '@/data/store';
import { daysFromNow, formatDate, formatDayShort } from '@/lib/format';
import { colors, font, radius, spacing } from '@/theme';

const TIMES = ['09:00', '10:30', '13:30', '15:00'];
const DUE_OPTIONS = [7, 14, 30, 60];

export default function NewAssignment() {
  const params = useLocalSearchParams<{ firmId?: string; trainingId?: string }>();
  const s = useAppState();

  const [trainingId, setTrainingId] = useState(params.trainingId ?? s.trainings[0].id);
  const [firmId, setFirmId] = useState(params.firmId ?? '');
  const [trainerId, setTrainerId] = useState('');
  const [date, setDate] = useState(daysFromNow(3));
  const [time, setTime] = useState(TIMES[0]);
  const [location, setLocation] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<DeliveryMode>('online');
  const [dueDays, setDueDays] = useState(14);
  const [autoAccounts, setAutoAccounts] = useState(true);
  const [created, setCreated] = useState<{
    id: string;
    accounts: { email: string; password: string; name: string }[];
  } | null>(null);

  const firm = s.firms.find((f) => f.id === firmId);
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => daysFromNow(i)), []);

  const people = useMemo(() => {
    if (!firmId) return [];
    const latest = latestCertificates(
      s.certificates.filter((c) => c.firmId === firmId && c.trainingId === trainingId),
    );
    return s.participants
      .filter((p) => p.firmId === firmId)
      .map((p) => {
        const c = latest.find((x) => x.participantId === p.id);
        const h = c ? certHealth(c) : null;
        return { p, needs: !h || h === 'expired' || h === 'expiring' };
      });
  }, [s, firmId, trainingId]);

  const trainers = s.team.filter((m) => m.role !== 'dsp');

  const selectFirm = (id: string) => {
    setFirmId(id);
    const f = s.firms.find((x) => x.id === id);
    if (f && !trainerId) setTrainerId(f.specialistId);
    setSelected(new Set());
  };

  const toggle = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const submit = () => {
    if (!firmId) return setError('Firma seçin');
    if (!trainerId) return setError('Eğitmen seçin');
    if (!selected.size) return setError('En az bir katılımcı seçin');
    const training = s.trainings.find((x) => x.id === trainingId);
    if (
      delivery === 'online' &&
      !training?.content.lessons.length &&
      !training?.content.finalExam.questions.length
    ) {
      return setError('Bu eğitimin online içeriği yok. Önce içerik editöründen ders ve sınav ekleyin.');
    }
    setError(null);
    const online = delivery === 'online';
    const id = actions.createAssignment({
      delivery,
      trainingId,
      firmId,
      trainerId,
      date: online ? daysFromNow(0) : date,
      dueDate: online ? daysFromNow(dueDays) : undefined,
      time: online ? '' : time,
      location: online ? 'Online eğitim portalı' : location.trim() || 'Firma eğitim salonu',
      participantIds: [...selected],
    });
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Online eğitimde hesabı olmayanlara giriş hesabı aç ve bilgileri göster
    if (online && autoAccounts && withoutAccount.length) {
      const accs = actions.createAccounts(withoutAccount.map((x) => x.id));
      setCreated({
        id,
        accounts: accs.map((a) => ({
          ...a,
          name: s.participants.find((x) => x.id === a.participantId)?.name ?? '',
        })),
      });
      return;
    }
    router.replace(`/assignment/${id}`);
  };

  const withoutAccount = s.participants.filter((p) => selected.has(p.id) && !p.account);

  const needCount = people.filter((x) => x.needs).length;

  return (
    <Screen header={<ScreenHeader title="Eğitim ata" subtitle="Yeni eğitim oturumu planla" />}>
      {/* Teslim şekli */}
      <SegmentedControl<DeliveryMode>
        value={delivery}
        onChange={setDelivery}
        segments={[
          { value: 'online', label: 'Online eğitim', icon: 'laptop-outline' },
          { value: 'classroom', label: 'Yüz yüze', icon: 'people-outline' },
        ]}
      />
      <Text style={styles.dim}>
        {delivery === 'online'
          ? 'Katılımcılar kendi hesaplarıyla giriş yapıp ön sınav, dersler ve final sınavını tamamlar. Final geçilince sertifika onayınıza düşer.'
          : 'Eğitim belirlenen tarih ve yerde yapılır; yoklama ile tamamlanır.'}
      </Text>

      {/* 1. Eğitim */}
      <SectionHeader title="1. Eğitim" />
      <View style={{ gap: spacing.sm }}>
        {s.trainings.map((t) => {
          const active = t.id === trainingId;
          return (
            <Pressable
              key={t.id}
              onPress={() => {
                setTrainingId(t.id);
                setSelected(new Set());
              }}
              style={[styles.option, active && styles.optionActive]}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
            >
              <IconTile icon={t.icon as IconName} tone={active ? 'amber' : 'neutral'} size={36} />
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>{t.title}</Text>
                <Text style={styles.dim}>
                  {t.hours} saat · {t.content.lessons.length} ders · {t.content.finalExam.questions.length} soru
                </Text>
              </View>
              <View style={[styles.radio, active && styles.radioOn]}>
                {active && <View style={styles.radioDot} />}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* 2. Firma */}
      <SectionHeader title="2. Firma" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm }}
      >
        {s.firms.map((f) => {
          const active = f.id === firmId;
          return (
            <Pressable
              key={f.id}
              onPress={() => selectFirm(f.id)}
              style={[styles.firm, active && styles.optionActive]}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
            >
              <Ionicons name="business" size={18} color={active ? colors.amber : colors.textDim} />
              <Text style={styles.firmName} numberOfLines={2}>
                {f.name}
              </Text>
              <Text style={styles.dim}>{f.city}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* 3. Eğitmen */}
      <SectionHeader title="3. Eğitmen" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm }}
      >
        {trainers.map((m) => {
          const active = m.id === trainerId;
          return (
            <Pressable
              key={m.id}
              onPress={() => setTrainerId(m.id)}
              style={[styles.trainer, active && styles.optionActive]}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
            >
              <Avatar name={m.name} size={32} tone={active ? 'amber' : 'neutral'} />
              <View>
                <Text style={styles.optionTitle}>{m.name}</Text>
                <Text style={styles.dim}>{ROLE_LABEL[m.role]}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* 4. Tarih */}
      {delivery === 'online' ? (
        <>
          <SectionHeader title="4. Tamamlama süresi" />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {DUE_OPTIONS.map((d) => (
              <Pressable
                key={d}
                onPress={() => setDueDays(d)}
                style={[styles.time, d === dueDays && styles.dayActive]}
                accessibilityRole="radio"
                accessibilityState={{ checked: d === dueDays }}
              >
                <Text style={[styles.timeText, d === dueDays && { color: colors.onAmber }]}>{d} gün</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.dim}>Son tarih: {formatDate(daysFromNow(dueDays))}</Text>
        </>
      ) : (
        <>
          <SectionHeader title="4. Tarih ve yer" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            {days.map((d) => {
              const f = formatDayShort(d);
              const active = d === date;
              return (
                <Pressable
                  key={d}
                  onPress={() => setDate(d)}
                  style={[styles.day, active && styles.dayActive]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  accessibilityLabel={`${f.day} ${f.month} ${f.weekday}`}
                >
                  <Text style={[styles.dayWeek, active && { color: colors.onAmber }]}>{f.weekday}</Text>
                  <Text style={[styles.dayNum, active && { color: colors.onAmber }]}>{f.day}</Text>
                  <Text style={[styles.dayWeek, active && { color: colors.onAmber }]}>{f.month}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {TIMES.map((t) => (
              <Pressable
                key={t}
                onPress={() => setTime(t)}
                style={[styles.time, t === time && styles.dayActive]}
                accessibilityRole="radio"
                accessibilityState={{ checked: t === time }}
              >
                <Text style={[styles.timeText, t === time && { color: colors.onAmber }]}>{t}</Text>
              </Pressable>
            ))}
          </View>
          <TextField
            label="Eğitim yeri"
            icon="location-outline"
            placeholder={firm ? `${firm.name} eğitim salonu` : 'Eğitim salonu'}
            value={location}
            onChangeText={setLocation}
          />
        </>
      )}

      {/* 5. Katılımcılar */}
      <SectionHeader title={`5. Katılımcılar${selected.size ? ` (${selected.size})` : ''}`} />
      {!firmId ? (
        <Text style={styles.dim}>Personel listesi için önce firma seçin.</Text>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
            <Pressable
              style={styles.quick}
              onPress={() => setSelected(new Set(people.filter((x) => x.needs).map((x) => x.p.id)))}
            >
              <Ionicons name="alert-circle-outline" size={15} color={colors.amber} />
              <Text style={styles.quickText}>Sertifikası eksik olanlar ({needCount})</Text>
            </Pressable>
            <Pressable style={styles.quick} onPress={() => setSelected(new Set(people.map((x) => x.p.id)))}>
              <Ionicons name="checkmark-done" size={15} color={colors.amber} />
              <Text style={styles.quickText}>Tümü ({people.length})</Text>
            </Pressable>
          </View>
          <Card style={{ padding: 0 }}>
            {people.map(({ p, needs }, i) => (
              <Pressable
                key={p.id}
                onPress={() => toggle(p.id)}
                style={[styles.person, i > 0 && styles.border]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected.has(p.id) }}
              >
                <Checkbox checked={selected.has(p.id)} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>{p.name}</Text>
                  <Text style={styles.dim}>{p.title}</Text>
                </View>
                {delivery === 'online' && !p.account && <Pill label="Hesap yok" icon="person-outline" />}
                {needs ? <Pill label="Eksik" tone="amber" /> : <Pill label="Geçerli" tone="success" />}
              </Pressable>
            ))}
          </Card>
        </>
      )}

      {delivery === 'online' && withoutAccount.length > 0 && (
        <Pressable
          onPress={() => setAutoAccounts((x) => !x)}
          style={styles.accounts}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: autoAccounts }}
        >
          <Checkbox checked={autoAccounts} />
          <View style={{ flex: 1 }}>
            <Text style={styles.optionTitle}>{withoutAccount.length} katılımcıya giriş hesabı oluştur</Text>
            <Text style={styles.dim}>
              Seçilenlerden hesabı olmayanlar için e-posta ve geçici şifre üretilir.
            </Text>
          </View>
        </Pressable>
      )}

      {error && (
        <View style={styles.error}>
          <Ionicons name="warning-outline" size={18} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <Button
        title={`Eğitimi ata${selected.size ? ` · ${selected.size} kişi` : ''}`}
        icon="checkmark"
        onPress={submit}
      />
      <CredentialsSheet
        visible={!!created}
        accounts={created?.accounts ?? []}
        title="Eğitim atandı"
        subtitle="Aşağıdaki katılımcılar için giriş hesabı oluşturuldu. Bilgileri kopyalayıp paylaşın; ilk girişte şifrelerini değiştirmeleri istenir."
        onClose={() => {
          const id = created?.id;
          setCreated(null);
          if (id) router.replace(`/assignment/${id}`);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  dim: { color: colors.textDim, fontSize: 12.5 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.bgElevated,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  optionActive: { borderColor: colors.amber, backgroundColor: '#17140D' },
  optionTitle: { color: colors.text, fontSize: 14, fontWeight: font.semibold },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.amber },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.amber },
  firm: {
    width: 132,
    padding: spacing.md,
    gap: 6,
    borderRadius: radius.md,
    backgroundColor: colors.bgElevated,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  firmName: { color: colors.text, fontSize: 13.5, fontWeight: font.semibold, minHeight: 36 },
  trainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.bgElevated,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  day: {
    width: 56,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayActive: { backgroundColor: colors.amber, borderColor: colors.amber },
  dayWeek: { color: colors.textDim, fontSize: 11, fontWeight: font.semibold },
  dayNum: { color: colors.white, fontSize: 20, fontWeight: font.heavy },
  time: {
    flex: 1,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeText: { color: colors.text, fontSize: 14, fontWeight: font.semibold },
  quick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.amberSoft,
  },
  quickText: { color: colors.amber, fontSize: 12.5, fontWeight: font.semibold },
  person: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  border: { borderTopWidth: 1, borderTopColor: colors.border },
  accounts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.amberSoft,
    borderWidth: 1,
    borderColor: 'rgba(255,176,32,0.3)',
  },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.dangerSoft,
  },
  errorText: { color: colors.danger, fontSize: 13.5, fontWeight: font.medium },
});
