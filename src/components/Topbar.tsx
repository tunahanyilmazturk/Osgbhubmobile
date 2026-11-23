import { Ionicons } from '@expo/vector-icons';
import { router, usePathname, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Avatar, type IconName, type Tone } from '@/components/ui/kit';
import { MenuDivider, MenuItem, MenuTitle, Popover } from '@/components/ui/Popover';
import { EXPIRING_DAYS, actions, certHealth, latestCertificates, useAppState, type State } from '@/data/store';
import { daysUntil, normalize } from '@/lib/format';
import { useLayout } from '@/lib/responsive';
import { ROLE_LABELS, displayName, useSession } from '@/lib/session';
import { useTheme } from '@/lib/theme';
import { colors, font, radius, spacing } from '@/theme';

type Crumb = { label: string; href?: Href };

const ROOTS: Record<string, Crumb> = {
  dashboard: { label: 'Panel', href: '/dashboard' },
  firms: { label: 'Firmalar', href: '/firms' },
  firm: { label: 'Firmalar', href: '/firms' },
  participants: { label: 'Katılımcılar', href: '/participants' },
  participant: { label: 'Katılımcılar', href: '/participants' },
  team: { label: 'Ekip', href: '/team' },
  member: { label: 'Ekip', href: '/team' },
  trainings: { label: 'Eğitimler', href: '/trainings' },
  training: { label: 'Eğitimler', href: '/trainings' },
  assignment: { label: 'Eğitimler', href: '/trainings' },
  enrollment: { label: 'Eğitimler', href: '/trainings' },
  content: { label: 'Eğitimler', href: '/trainings' },
  certificates: { label: 'Sertifikalar', href: '/certificates' },
  certificate: { label: 'Sertifikalar', href: '/certificates' },
  approvals: { label: 'Sertifika onayları', href: '/approvals' },
  'e-signature': { label: 'E-imza', href: '/e-signature' },
  'isg-katip': { label: 'İSG-KATİP', href: '/isg-katip' },
  profile: { label: 'Profil' },
  more: { label: 'Menü' },
  'my-trainings': { label: 'Eğitimlerim', href: '/my-trainings' },
  course: { label: 'Eğitimlerim', href: '/my-trainings' },
  lesson: { label: 'Eğitimlerim', href: '/my-trainings' },
  exam: { label: 'Eğitimlerim', href: '/my-trainings' },
  'my-certificates': { label: 'Sertifikalarım', href: '/my-certificates' },
  'my-certificate': { label: 'Sertifikalarım', href: '/my-certificates' },
  account: { label: 'Hesabım' },
};

/** Adresten sayfa yolu (breadcrumb) üretir */
function crumbs(path: string, s: State): Crumb[] {
  const [root, a, b] = path.split('/').filter(Boolean);
  const base = ROOTS[root ?? 'dashboard'] ?? { label: 'Panel', href: '/dashboard' };
  const out: Crumb[] = [base];
  const firm = (id?: string) => s.firms.find((f) => f.id === id)?.name;
  const person = (id?: string) => s.participants.find((p) => p.id === id)?.name;
  const training = (id?: string) => s.trainings.find((t) => t.id === id)?.title;

  if (a === 'new') out.push({ label: 'Yeni' });
  else if (root === 'firm') {
    if (a === 'edit') out.push({ label: firm(b) ?? 'Firma', href: `/firm/${b}` }, { label: 'Düzenle' });
    else out.push({ label: firm(a) ?? 'Firma' });
  } else if (root === 'participant') {
    if (a === 'edit') out.push({ label: person(b) ?? 'Katılımcı', href: `/participant/${b}` }, { label: 'Düzenle' });
    else out.push({ label: person(a) ?? 'Katılımcı' });
  } else if (root === 'member' && a === 'edit') {
    out.push({ label: s.team.find((m) => m.id === b)?.name ?? 'Ekip üyesi' }, { label: 'Düzenle' });
  } else if (root === 'training' && a) out.push({ label: training(a) ?? 'Eğitim' });
  else if (root === 'content' && a) {
    out.push({ label: training(a) ?? 'Eğitim', href: `/training/${a}` }, { label: 'İçerik', href: `/content/${a}` });
    if (b === 'lesson') out.push({ label: 'Ders' });
    if (b === 'exam') out.push({ label: 'Sınav' });
  } else if (root === 'assignment' && a) {
    const asg = s.assignments.find((x) => x.id === a);
    out.push({ label: `${training(asg?.trainingId) ?? 'Atama'} · ${firm(asg?.firmId) ?? ''}` });
  } else if (root === 'enrollment' && a) {
    const e = s.enrollments.find((x) => x.id === a);
    out.push({ label: person(e?.participantId) ?? 'Katılımcı' });
  } else if ((root === 'certificate' || root === 'my-certificate') && a) {
    out.push({ label: s.certificates.find((c) => c.id === a)?.no ?? 'Sertifika' });
  } else if ((root === 'course' || root === 'lesson' || root === 'exam') && a) {
    const e = s.enrollments.find((x) => x.id === a);
    out.push({ label: training(e?.trainingId) ?? 'Eğitim', href: root === 'course' ? undefined : `/course/${a}` });
    if (root === 'lesson') out.push({ label: 'Ders' });
    if (root === 'exam') out.push({ label: b === 'pre' ? 'Ön sınav' : 'Final sınavı' });
  }
  return out;
}

type Notice = { icon: IconName; tone: Tone; title: string; hint: string; href: Href };

function notices(s: State, participantId?: string): Notice[] {
  if (participantId) {
    return s.enrollments
      .filter((e) => e.participantId === participantId && (e.status === 'not_started' || e.status === 'in_progress'))
      .map((e) => {
        const a = s.assignments.find((x) => x.id === e.assignmentId);
        const left = a?.dueDate ? daysUntil(a.dueDate) : undefined;
        return {
          icon: 'school' as IconName,
          tone: (left !== undefined && left <= 3 ? 'danger' : 'amber') as Tone,
          title: s.trainings.find((t) => t.id === e.trainingId)?.title ?? 'Eğitim',
          hint: left === undefined ? 'Devam ediyor' : left < 0 ? `${-left} gün gecikti` : `${left} gün kaldı`,
          href: `/course/${e.id}` as Href,
        };
      });
  }
  const out: Notice[] = [];
  const pending = s.certificates.filter((c) => c.status === 'pending').length;
  const toSign = s.certificates.filter((c) => c.status === 'approved').length + s.documents.filter((d) => d.status === 'waiting').length;
  const katip = s.firms.filter((f) => f.katip.status === 'error').length;
  const katipPending = s.firms.filter((f) => f.katip.status === 'pending').length;
  const expiring = latestCertificates(s.certificates).filter((c) => certHealth(c) === 'expiring').length;
  const contracts = s.firms.filter((f) => daysUntil(f.contractEnd) <= 30 && daysUntil(f.contractEnd) >= 0).length;
  const failed = s.enrollments.filter((e) => e.status === 'failed').length;
  if (pending) out.push({ icon: 'hourglass', tone: 'amber', title: `${pending} sertifika onay bekliyor`, hint: 'Tamamlanan eğitimler', href: '/approvals' });
  if (toSign) out.push({ icon: 'finger-print', tone: 'amber', title: `${toSign} belge imza bekliyor`, hint: 'E-imza kuyruğu', href: '/e-signature' });
  if (katip) out.push({ icon: 'cloud-offline', tone: 'danger', title: `${katip} İSG-KATİP hatası`, hint: 'Sözleşme uyumsuzluğu', href: '/isg-katip' });
  if (katipPending) out.push({ icon: 'cloud-upload', tone: 'amber', title: `${katipPending} bildirim gönderilmedi`, hint: 'İSG-KATİP senkronizasyonu', href: '/isg-katip' });
  if (failed) out.push({ icon: 'alert-circle', tone: 'danger', title: `${failed} katılımcının final hakkı doldu`, hint: 'Ek hak tanıyabilirsiniz', href: '/trainings' });
  if (expiring) out.push({ icon: 'time', tone: 'amber', title: `${expiring} sertifikanın süresi doluyor`, hint: `${EXPIRING_DAYS} gün içinde`, href: { pathname: '/certificates', params: { filter: 'expiring' } } });
  if (contracts) out.push({ icon: 'document-text', tone: 'amber', title: `${contracts} sözleşme bitiyor`, hint: '30 gün içinde', href: '/firms' });
  return out;
}

/** Bilgisayar/tablet üst barı */
export function Topbar({ variant = 'staff' }: { variant?: 'staff' | 'participant' }) {
  const s = useAppState();
  const pathname = usePathname();
  const { user, signOut } = useSession();
  const { mode, toggle, switchable } = useTheme();
  const { isDesktop } = useLayout();
  const [q, setQ] = useState('');
  const [focus, setFocus] = useState(false);

  const path = useMemo(() => crumbs(pathname, s), [pathname, s]);
  const list = useMemo(() => notices(s, variant === 'participant' ? user?.participantId : undefined), [s, variant, user?.participantId]);

  const results = useMemo(() => {
    if (q.trim().length < 2 || variant === 'participant') return [];
    const n = normalize(q);
    const out: { icon: IconName; label: string; hint: string; href: Href }[] = [];
    s.firms.filter((f) => normalize(`${f.name} ${f.city} ${f.sector}`).includes(n)).slice(0, 4).forEach((f) => out.push({ icon: 'business', label: f.name, hint: `Firma · ${f.city}`, href: `/firm/${f.id}` }));
    s.participants.filter((p) => normalize(`${p.name} ${p.account?.email ?? ''}`).includes(n)).slice(0, 5).forEach((p) => out.push({ icon: 'person', label: p.name, hint: `Katılımcı · ${s.firms.find((f) => f.id === p.firmId)?.name ?? ''}`, href: `/participant/${p.id}` }));
    s.trainings.filter((t) => normalize(t.title).includes(n)).slice(0, 3).forEach((t) => out.push({ icon: 'school', label: t.title, hint: 'Eğitim', href: `/training/${t.id}` }));
    s.team.filter((m) => normalize(m.name).includes(n)).slice(0, 3).forEach((m) => out.push({ icon: 'people-circle', label: m.name, hint: 'Ekip', href: `/member/edit/${m.id}` }));
    s.certificates.filter((c) => normalize(c.no).includes(n)).slice(0, 3).forEach((c) => out.push({ icon: 'ribbon', label: c.no, hint: 'Sertifika', href: `/certificate/${c.id}` }));
    return out;
  }, [q, s, variant]);

  const go = (href: Href) => {
    setQ('');
    setFocus(false);
    router.push(href);
  };

  return (
    <View style={styles.bar}>
      {/* Sayfa yolu */}
      <View style={styles.crumbs} accessibilityRole="header">
        {path.map((c, i) => (
          <View key={`${c.label}${i}`} style={styles.crumbRow}>
            {i > 0 && <Ionicons name="chevron-forward" size={13} color={colors.textDim} />}
            {c.href && i < path.length - 1 ? (
              <Pressable onPress={() => router.navigate(c.href!)} hitSlop={4} accessibilityRole="link">
                <Text style={styles.crumbLink} numberOfLines={1}>
                  {c.label}
                </Text>
              </Pressable>
            ) : (
              <Text style={[styles.crumb, i === path.length - 1 && styles.crumbLast]} numberOfLines={1}>
                {c.label}
              </Text>
            )}
          </View>
        ))}
      </View>

      {/* Genel arama */}
      {variant === 'staff' && (
        <View style={[styles.searchWrap, !isDesktop && { width: 220 }]}>
          <View style={[styles.search, focus && { borderColor: colors.amber }]}>
            <Ionicons name="search" size={16} color={colors.textDim} />
            <TextInput
              value={q}
              onChangeText={setQ}
              onFocus={() => setFocus(true)}
              onBlur={() => setTimeout(() => setFocus(false), 200)}
              onSubmitEditing={() => results[0] && go(results[0].href)}
              placeholder="Firma, kişi, eğitim, sertifika no…"
              placeholderTextColor={colors.textDim}
              style={styles.searchInput}
              accessibilityLabel="Genel arama"
            />
            {!!q && (
              <Pressable onPress={() => setQ('')} hitSlop={8} accessibilityLabel="Aramayı temizle">
                <Ionicons name="close-circle" size={16} color={colors.textDim} />
              </Pressable>
            )}
          </View>
          {focus && q.trim().length >= 2 && (
            <View style={styles.results}>
              {results.length === 0 ? (
                <Text style={styles.noResult}>“{q}” için sonuç yok</Text>
              ) : (
                results.map((r, i) => (
                  <MenuItem key={`${r.label}${i}`} label={r.label} hint={r.hint} icon={r.icon} onPress={() => go(r.href)} />
                ))
              )}
            </View>
          )}
        </View>
      )}

      <View style={styles.right}>
        {/* Yeni oluştur */}
        {variant === 'staff' && (
          <Popover
            width={250}
            trigger={({ open }) => (
              <Pressable onPress={open} style={styles.newBtn} accessibilityRole="button" accessibilityLabel="Yeni oluştur">
                <Ionicons name="add" size={18} color={colors.onAmber} />
                {isDesktop && <Text style={styles.newText}>Yeni</Text>}
                {isDesktop && <Ionicons name="chevron-down" size={14} color={colors.onAmber} />}
              </Pressable>
            )}
          >
            {(close) => {
              const item = (label: string, icon: IconName, onPress: () => void) => (
                <MenuItem
                  label={label}
                  icon={icon}
                  onPress={() => {
                    close();
                    onPress();
                  }}
                />
              );
              return (
                <>
                  <MenuTitle>Yeni oluştur</MenuTitle>
                  {item('Firma', 'business-outline', () => router.push('/firm/new'))}
                  {item('Katılımcı', 'person-add-outline', () => router.push('/participant/new'))}
                  {item('Ekip üyesi', 'people-circle-outline', () => router.push('/member/new'))}
                  <MenuDivider />
                  {item('Eğitim ataması', 'calendar-outline', () => router.push('/assignment/new'))}
                  {item('Yeni eğitim (içerik)', 'library-outline', () => router.push(`/content/${actions.createTraining()}`))}
                  {item('Harici sertifika', 'ribbon-outline', () => router.push('/certificate/new'))}
                </>
              );
            }}
          </Popover>
        )}

        {/* Tema */}
        {switchable && (
          <Pressable
            onPress={toggle}
            style={styles.iconBtn}
            accessibilityRole="switch"
            accessibilityState={{ checked: mode === 'light' }}
            accessibilityLabel={mode === 'dark' ? 'Aydınlık temaya geç' : 'Karanlık temaya geç'}
          >
            <Ionicons name={mode === 'dark' ? 'sunny-outline' : 'moon-outline'} size={18} color={colors.text} />
          </Pressable>
        )}

        {/* Bildirimler */}
        <Popover
          width={330}
          trigger={({ open }) => (
            <Pressable onPress={open} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel={`Bildirimler, ${list.length}`}>
              <Ionicons name="notifications-outline" size={18} color={colors.text} />
              {list.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{list.length}</Text>
                </View>
              )}
            </Pressable>
          )}
        >
          {(close) => (
            <>
              <MenuTitle>{variant === 'staff' ? 'Bildirimler' : 'Tamamlanacak eğitimler'}</MenuTitle>
              {list.length === 0 ? (
                <Text style={styles.noResult}>Yeni bildirim yok</Text>
              ) : (
                list.map((n, i) => (
                  <MenuItem
                    key={i}
                    label={n.title}
                    hint={n.hint}
                    icon={n.icon}
                    danger={n.tone === 'danger'}
                    onPress={() => {
                      close();
                      router.push(n.href);
                    }}
                  />
                ))
              )}
            </>
          )}
        </Popover>

        {/* Kullanıcı */}
        <Popover
          width={240}
          trigger={({ open }) => (
            <Pressable onPress={open} style={styles.userBtn} accessibilityRole="button" accessibilityLabel="Kullanıcı menüsü">
              <Avatar name={user ? (variant === 'staff' ? displayName(user.name) : user.name) : '?'} size={32} tone="amber" />
              {isDesktop && (
                <View>
                  <Text style={styles.userName} numberOfLines={1}>
                    {user ? displayName(user.name) : ''}
                  </Text>
                  <Text style={styles.userRole}>{user ? ROLE_LABELS[user.role] : ''}</Text>
                </View>
              )}
              <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
            </Pressable>
          )}
        >
          {(close) => (
            <>
              <MenuTitle>{user?.email ?? ''}</MenuTitle>
              <MenuItem
                label={variant === 'staff' ? 'Profil' : 'Hesabım'}
                icon="person-outline"
                onPress={() => {
                  close();
                  router.push(variant === 'staff' ? '/profile' : '/account');
                }}
              />
              {switchable && (
                <MenuItem
                  label={mode === 'dark' ? 'Aydınlık tema' : 'Karanlık tema'}
                  icon={mode === 'dark' ? 'sunny-outline' : 'moon-outline'}
                  onPress={toggle}
                />
              )}
              <MenuDivider />
              <MenuItem
                label="Çıkış yap"
                icon="log-out-outline"
                danger
                onPress={() => {
                  close();
                  signOut();
                }}
              />
            </>
          )}
        </Popover>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    zIndex: 30,
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xxxl,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  crumbs: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' },
  crumbRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, minWidth: 0 },
  crumb: { color: colors.textMuted, fontSize: 13.5, fontWeight: font.medium },
  crumbLast: { color: colors.white, fontWeight: font.semibold },
  crumbLink: { color: colors.textMuted, fontSize: 13.5, fontWeight: font.medium },
  searchWrap: { width: 340, position: 'relative' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 38,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
  searchInput: { flex: 1, minWidth: 0, height: '100%', color: colors.text, fontSize: 14, outlineStyle: 'none' } as object,
  results: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    padding: 6,
    borderRadius: radius.md,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  noResult: { color: colors.textDim, fontSize: 13, padding: spacing.md },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.amber,
  },
  newText: { color: colors.onAmber, fontSize: 14, fontWeight: font.bold },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.onDanger, fontSize: 9.5, fontWeight: font.heavy },
  userBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 42,
    paddingLeft: 4,
    paddingRight: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
  userName: { color: colors.text, fontSize: 13, fontWeight: font.semibold, maxWidth: 120 },
  userRole: { color: colors.textDim, fontSize: 11 },
});
