import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { usePageWidth, type IconName } from '@/components/ui/kit';
import { MenuItem, MenuTitle, Popover } from '@/components/ui/Popover';
import { useLayout } from '@/lib/responsive';
import { usePersistentState } from '@/lib/usePersistentState';
import { colors, font, radius, spacing } from '@/theme';

export type Column<T> = {
  key: string;
  title: string;
  /** Göreli genişlik (varsayılan 1) */
  flex?: number;
  /** Tablonun yatay kaydırma eşiği için en küçük genişlik (px) */
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  /** Verilirse sütun başlığına tıklayarak sıralanabilir */
  sortValue?: (row: T) => string | number | undefined | null;
  render: (row: T) => ReactNode;
};

export type BulkAction = {
  label: string;
  icon: IconName;
  onPress: (ids: string[], clear: () => void) => void;
};

type Sort = { key: string; dir: 'asc' | 'desc' } | null;

type Props<T> = {
  /** Görünüm ve sayfa boyutu tercihi için benzersiz ad */
  id: string;
  data: T[];
  keyOf: (row: T) => string;
  columns: Column<T>[];
  renderCard: (row: T) => ReactNode;
  onOpen?: (row: T) => void;
  /** Arama/filtre alanı */
  toolbar?: ReactNode;
  empty: ReactNode;
  /** Değişince 1. sayfaya dönülür (ör. arama metni + filtre) */
  resetKey?: string;
  defaultSort?: Sort;
  itemLabel?: string;
  bulkActions?: BulkAction[];
  /** Silme. Geri dönen metin (ör. silinemeyenler) bilgi olarak gösterilir. */
  onDelete?: (ids: string[]) => string | void;
  /** Silme onayı metni (bağlı kayıtlar vb.) */
  deleteMessage?: (ids: string[]) => string;
  bottomPadding: number;
};

const PAGE_SIZES = [10, 25, 50, 100];

function compare(a: unknown, b: unknown) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), 'tr', { sensitivity: 'base', numeric: true });
}

/** 1 … 4 5 [6] 7 8 … 20 */
function pageItems(page: number, count: number): (number | '…')[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const out: (number | '…')[] = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(count - 1, page + 1);
  if (from > 2) out.push('…');
  for (let i = from; i <= to; i++) out.push(i);
  if (to < count - 1) out.push('…');
  out.push(count);
  return out;
}

export function DataTable<T>({
  id,
  data,
  keyOf,
  columns,
  renderCard,
  onOpen,
  toolbar,
  empty,
  resetKey,
  defaultSort = null,
  itemLabel = 'kayıt',
  bulkActions = [],
  onDelete,
  deleteMessage,
  bottomPadding,
}: Props<T>) {
  const { isWide, isDesktop, columns: cardCols } = useLayout();
  const maxWidth = usePageWidth('wide');
  const [view, setView] = usePersistentState<'table' | 'cards'>(`view:${id}`, isWide ? 'table' : 'cards');
  const [pageSize, setPageSize] = usePersistentState(`pageSize:${id}`, isDesktop ? 25 : 10);
  const [sort, setSort] = useState<Sort>(defaultSort);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selecting, setSelecting] = useState(false);
  const [confirm, setConfirm] = useState<string[] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [width, setWidth] = useState(0);
  const [jump, setJump] = useState('');

  // Filtre değişince ilk sayfaya dön ve seçimi temizle (render sırasında türetilen state)
  const [lastReset, setLastReset] = useState(resetKey);
  if (lastReset !== resetKey) {
    setLastReset(resetKey);
    setPage(1);
    setSelected(new Set());
  }

  const sorted = useMemo(() => {
    if (!sort) return data;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return data;
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...data].sort((a, b) => compare(col.sortValue!(a), col.sortValue!(b)) * dir);
  }, [data, sort, columns]);

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const rows = sorted.slice(start, start + pageSize);
  const pageIds = rows.map(keyOf);

  // Silinen/filtrelenen kayıtlar seçimden düşsün
  const allIds = useMemo(() => new Set(data.map(keyOf)), [data, keyOf]);
  const sel = [...selected].filter((x) => allIds.has(x));
  const pageAll = pageIds.length > 0 && pageIds.every((x) => selected.has(x));
  const pageSome = !pageAll && pageIds.some((x) => selected.has(x));
  const selectable = !!onDelete || bulkActions.length > 0;
  const inSelectMode = selecting || sel.length > 0;

  const toggle = (k: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });
  const togglePage = () =>
    setSelected((prev) => {
      const n = new Set(prev);
      pageIds.forEach((k) => (pageAll ? n.delete(k) : n.add(k)));
      return n;
    });
  const clear = () => {
    setSelected(new Set());
    setSelecting(false);
  };

  const cycleSort = (key: string) =>
    setSort((s) => (s?.key !== key ? { key, dir: 'asc' } : s.dir === 'asc' ? { key, dir: 'desc' } : null));

  const sortable = columns.filter((c) => c.sortValue);
  const sortCol = sortable.find((c) => c.key === sort?.key);

  // Dar ekranda tablo yatay kaydırılır
  const minTable = 44 + columns.reduce((sum, c) => sum + (c.minWidth ?? 120), 0);
  const scrollTable = width > 0 && width < minTable;

  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, []);

  const flash = (msg: string) => {
    setNotice(msg);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => {
      noticeTimer.current = null;
      setNotice(null);
    }, 5000);
  };

  /* ---------------- Tablo ---------------- */
  const table = (
    <View style={[styles.table, scrollTable && { width: minTable }]}>
      <View style={[styles.tr, styles.thead]}>
        {selectable && (
          <Pressable onPress={togglePage} style={styles.checkCell} accessibilityRole="checkbox" accessibilityLabel="Bu sayfadakilerin tümünü seç" accessibilityState={{ checked: pageAll ? true : pageSome ? 'mixed' : false }}>
            <Check state={pageAll ? 'on' : pageSome ? 'some' : 'off'} />
          </Pressable>
        )}
        {columns.map((c) => {
          const active = sort?.key === c.key;
          const inner = (
            <>
              <Text style={[styles.th, active && { color: colors.amber }]} numberOfLines={1}>
                {c.title}
              </Text>
              {c.sortValue && (
                <Ionicons
                  name={active ? (sort!.dir === 'asc' ? 'arrow-up' : 'arrow-down') : 'swap-vertical'}
                  size={13}
                  color={active ? colors.amber : colors.textDim}
                />
              )}
            </>
          );
          const cellStyle = [styles.thCell, { flex: c.flex ?? 1, minWidth: scrollTable ? c.minWidth ?? 120 : 0 }, align(c.align)];
          return c.sortValue ? (
            <Pressable
              key={c.key}
              onPress={() => cycleSort(c.key)}
              style={cellStyle}
              accessibilityRole="button"
              accessibilityLabel={`${c.title} sütununa göre sırala`}
            >
              {inner}
            </Pressable>
          ) : (
            <View key={c.key} style={cellStyle}>
              {inner}
            </View>
          );
        })}
      </View>
      {rows.map((r, i) => {
        const k = keyOf(r);
        return (
          <TableRow
            key={k}
            last={i === rows.length - 1}
            selected={selected.has(k)}
            onPress={onOpen ? () => onOpen(r) : undefined}
          >
            {selectable && (
              <Pressable onPress={() => toggle(k)} style={styles.checkCell} accessibilityRole="checkbox" accessibilityState={{ checked: selected.has(k) }}>
                <Check state={selected.has(k) ? 'on' : 'off'} />
              </Pressable>
            )}
            {columns.map((c) => (
              <View key={c.key} style={[styles.td, { flex: c.flex ?? 1, minWidth: scrollTable ? c.minWidth ?? 120 : 0 }, align(c.align)]}>
                {c.render(r)}
              </View>
            ))}
          </TableRow>
        );
      })}
    </View>
  );

  /* ---------------- Kartlar ---------------- */
  const chunks: T[][] = [];
  for (let i = 0; i < rows.length; i += cardCols) chunks.push(rows.slice(i, i + cardCols));
  const cards = (
    <View style={{ gap: spacing.md }}>
      {chunks.map((chunk, ci) => (
        <View key={ci} style={{ flexDirection: 'row', gap: spacing.md }}>
          {chunk.map((r) => {
            const k = keyOf(r);
            const on = selected.has(k);
            return (
              <View key={k} style={{ flex: 1, minWidth: 0 }}>
                {renderCard(r)}
                {selectable && inSelectMode && (
                  <Pressable
                    onPress={() => toggle(k)}
                    style={[styles.cardOverlay, on && styles.cardOverlayOn]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                  >
                    <View style={styles.cardCheck}>
                      <Check state={on ? 'on' : 'off'} />
                    </View>
                  </Pressable>
                )}
              </View>
            );
          })}
          {Array.from({ length: cardCols - chunk.length }).map((_, i) => (
            <View key={`pad${i}`} style={{ flex: 1 }} />
          ))}
        </View>
      ))}
    </View>
  );

  return (
    <>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: isDesktop ? spacing.xxxl : spacing.xl, paddingBottom: bottomPadding }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: '100%', maxWidth, alignSelf: 'center', gap: spacing.md }}>
          {toolbar}

          {/* Kontroller */}
          <View style={styles.controls}>
            {sel.length > 0 ? (
              <View style={styles.selBar}>
                <Text style={styles.selText}>{sel.length} seçili</Text>
                {pageAll && total > pageIds.length && sel.length < total && (
                  <Pressable onPress={() => setSelected(new Set(sorted.map(keyOf)))} hitSlop={6}>
                    <Text style={styles.link}>Tüm {total} kaydı seç</Text>
                  </Pressable>
                )}
                <Pressable onPress={clear} hitSlop={6}>
                  <Text style={styles.linkDim}>Seçimi temizle</Text>
                </Pressable>
                <View style={styles.bulk}>
                  {bulkActions.map((a) => (
                    <Pressable key={a.label} onPress={() => a.onPress(sel, clear)} style={styles.bulkBtn} accessibilityRole="button">
                      <Ionicons name={a.icon} size={15} color={colors.amber} />
                      <Text style={styles.bulkText}>{a.label}</Text>
                    </Pressable>
                  ))}
                  {onDelete && (
                    <Pressable onPress={() => setConfirm(sel)} style={[styles.bulkBtn, styles.bulkDanger]} accessibilityRole="button">
                      <Ionicons name="trash-outline" size={15} color={colors.danger} />
                      <Text style={[styles.bulkText, { color: colors.danger }]}>Sil</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ) : (
              <Text style={styles.count}>
                {total} {itemLabel}
                {total > pageSize ? ` · ${start + 1}–${Math.min(start + pageSize, total)} gösteriliyor` : ''}
              </Text>
            )}

            <View style={styles.controlsRight}>
              {view === 'cards' && selectable && sel.length === 0 && (
                <Pressable onPress={() => setSelecting((x) => !x)} style={[styles.ctrlBtn, selecting && styles.ctrlOn]} accessibilityRole="button">
                  <Ionicons name="checkbox-outline" size={16} color={selecting ? colors.onAmber : colors.textMuted} />
                  <Text style={[styles.ctrlText, selecting && { color: colors.onAmber }]}>{selecting ? 'Bitti' : 'Seç'}</Text>
                </Pressable>
              )}
              {sortable.length > 0 && (
                <Popover
                  width={240}
                  trigger={({ open }) => (
                    <Pressable onPress={open} style={styles.ctrlBtn} accessibilityRole="button" accessibilityLabel="Sırala">
                      <Ionicons name="swap-vertical" size={16} color={sort ? colors.amber : colors.textMuted} />
                      {isWide && (
                        <Text style={styles.ctrlText} numberOfLines={1}>
                          {sortCol ? `${sortCol.title} ${sort!.dir === 'asc' ? '↑' : '↓'}` : 'Sırala'}
                        </Text>
                      )}
                    </Pressable>
                  )}
                >
                  {(close) => (
                    <>
                      <MenuTitle>Sırala</MenuTitle>
                      {sortable.map((c) => (
                        <MenuItem
                          key={c.key}
                          label={c.title}
                          icon={sort?.key === c.key ? (sort.dir === 'asc' ? 'arrow-up' : 'arrow-down') : 'swap-vertical'}
                          active={sort?.key === c.key}
                          hint={sort?.key === c.key ? (sort.dir === 'asc' ? 'Artan — tekrar dokun: azalan' : 'Azalan') : undefined}
                          onPress={() => {
                            cycleSort(c.key);
                            if (sort?.key === c.key && sort.dir === 'desc') close();
                          }}
                        />
                      ))}
                      {sort && <MenuItem label="Sıralamayı kaldır" icon="close" onPress={() => (setSort(null), close())} />}
                    </>
                  )}
                </Popover>
              )}
              <View style={styles.viewToggle} accessibilityRole="tablist">
                {(['table', 'cards'] as const).map((v) => (
                  <Pressable
                    key={v}
                    onPress={() => setView(v)}
                    style={[styles.viewBtn, view === v && styles.viewBtnOn]}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: view === v }}
                    accessibilityLabel={v === 'table' ? 'Liste görünümü' : 'Kart görünümü'}
                  >
                    <Ionicons name={v === 'table' ? 'list' : 'grid'} size={16} color={view === v ? colors.onAmber : colors.textMuted} />
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {!!notice && (
            <View style={styles.notice}>
              <Ionicons name="information-circle" size={16} color={colors.amber} />
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          )}

          {/* Liste */}
          <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
            {total === 0 ? (
              empty
            ) : view === 'table' ? (
              scrollTable ? (
                <ScrollView horizontal showsHorizontalScrollIndicator>
                  {table}
                </ScrollView>
              ) : (
                table
              )
            ) : (
              cards
            )}
          </View>

          {/* Sayfalama */}
          {total > 0 && (
            <View style={[styles.pager, !isWide && { flexDirection: 'column', alignItems: 'stretch' }]}>
              <View style={styles.pagerLeft}>
                <Text style={styles.count}>
                  {start + 1}–{Math.min(start + pageSize, total)} / {total}
                </Text>
                <Popover
                  width={160}
                  align="left"
                  trigger={({ open }) => (
                    <Pressable onPress={open} style={styles.sizeBtn} accessibilityRole="button" accessibilityLabel="Sayfa başına kayıt">
                      <Text style={styles.ctrlText}>{pageSize} / sayfa</Text>
                      <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
                    </Pressable>
                  )}
                >
                  {(close) =>
                    PAGE_SIZES.map((n) => (
                      <MenuItem
                        key={n}
                        label={`${n} kayıt`}
                        active={n === pageSize}
                        onPress={() => {
                          setPageSize(n);
                          setPage(1);
                          close();
                        }}
                      />
                    ))
                  }
                </Popover>
              </View>

              {pageCount > 1 && (
                <View style={styles.pages}>
                  <PageBtn icon="play-skip-back" label="İlk sayfa" disabled={current === 1} onPress={() => setPage(1)} />
                  <PageBtn icon="chevron-back" label="Önceki sayfa" disabled={current === 1} onPress={() => setPage(current - 1)} />
                  {pageItems(current, pageCount).map((p, i) =>
                    p === '…' ? (
                      <Text key={`e${i}`} style={styles.ellipsis}>
                        …
                      </Text>
                    ) : (
                      <PageBtn key={p} text={String(p)} active={p === current} label={`Sayfa ${p}`} onPress={() => setPage(p)} />
                    ),
                  )}
                  <PageBtn icon="chevron-forward" label="Sonraki sayfa" disabled={current === pageCount} onPress={() => setPage(current + 1)} />
                  <PageBtn icon="play-skip-forward" label="Son sayfa" disabled={current === pageCount} onPress={() => setPage(pageCount)} />
                  {isDesktop && pageCount > 7 && (
                    <TextInput
                      value={jump}
                      onChangeText={(v) => setJump(v.replace(/\D/g, ''))}
                      onSubmitEditing={() => {
                        const n = parseInt(jump, 10);
                        if (n >= 1 && n <= pageCount) setPage(n);
                        setJump('');
                      }}
                      placeholder="Git"
                      placeholderTextColor={colors.textDim}
                      keyboardType="number-pad"
                      style={styles.jump}
                      accessibilityLabel="Sayfaya git"
                    />
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <BottomSheet
        visible={!!confirm}
        onClose={() => setConfirm(null)}
        title={`${confirm?.length ?? 0} ${itemLabel} silinsin mi?`}
        subtitle={confirm ? (deleteMessage?.(confirm) ?? 'Bu işlem geri alınamaz.') : undefined}
      >
        <View style={{ gap: spacing.sm }}>
          <Button
            title="Kalıcı olarak sil"
            icon="trash-outline"
            onPress={() => {
              const msg = onDelete?.(confirm ?? []);
              setConfirm(null);
              clear();
              if (msg) flash(msg);
            }}
          />
          <Button title="Vazgeç" variant="outline" onPress={() => setConfirm(null)} />
        </View>
      </BottomSheet>
    </>
  );
}

function align(a?: 'left' | 'right' | 'center') {
  return a === 'right' ? { justifyContent: 'flex-end' as const } : a === 'center' ? { justifyContent: 'center' as const } : null;
}

function TableRow({
  children,
  onPress,
  selected,
  last,
}: {
  children: ReactNode;
  onPress?: () => void;
  selected: boolean;
  last: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={[
        styles.tr,
        !last && styles.trBorder,
        hover && { backgroundColor: colors.surface },
        selected && styles.trSelected,
      ]}
    >
      {children}
    </Pressable>
  );
}

function Check({ state }: { state: 'on' | 'off' | 'some' }) {
  return (
    <View style={[styles.check, state !== 'off' && styles.checkOn]}>
      {state === 'on' && <Ionicons name="checkmark" size={13} color={colors.onAmber} />}
      {state === 'some' && <Ionicons name="remove" size={13} color={colors.onAmber} />}
    </View>
  );
}

function PageBtn({
  text,
  icon,
  label,
  onPress,
  disabled,
  active,
}: {
  text?: string;
  icon?: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.pageBtn, active && styles.pageBtnOn, disabled && { opacity: 0.35 }]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active, disabled }}
    >
      {icon ? (
        <Ionicons name={icon} size={14} color={colors.textMuted} />
      ) : (
        <Text style={[styles.pageText, active && { color: colors.onAmber }]}>{text}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, flexWrap: 'wrap', minHeight: 36 },
  controlsRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginLeft: 'auto' },
  count: { color: colors.textDim, fontSize: 12.5, fontWeight: font.medium },
  selBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap', flexShrink: 1 },
  selText: { color: colors.text, fontSize: 13.5, fontWeight: font.bold },
  link: { color: colors.amber, fontSize: 13, fontWeight: font.semibold },
  linkDim: { color: colors.textMuted, fontSize: 13, fontWeight: font.medium },
  bulk: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  bulkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.amberSoft,
  },
  bulkDanger: { backgroundColor: colors.dangerSoft },
  bulkText: { color: colors.amber, fontSize: 13, fontWeight: font.semibold },
  ctrlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
  ctrlOn: { backgroundColor: colors.amber, borderColor: colors.amber },
  ctrlText: { color: colors.textMuted, fontSize: 12.5, fontWeight: font.semibold, maxWidth: 160 },
  viewToggle: {
    flexDirection: 'row',
    padding: 3,
    gap: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
  viewBtn: { width: 30, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  viewBtnOn: { backgroundColor: colors.amber },
  notice: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', padding: spacing.md, borderRadius: radius.sm, backgroundColor: colors.amberSoft },
  noticeText: { flex: 1, color: colors.text, fontSize: 13 },

  table: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  tr: { flexDirection: 'row', alignItems: 'center', minHeight: 56, borderLeftWidth: 3, borderLeftColor: 'transparent' },
  trSelected: { backgroundColor: colors.highlight, borderLeftColor: colors.amber },
  trBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  thead: { minHeight: 44, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  thCell: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing.md, height: 44 },
  th: { color: colors.textMuted, fontSize: 11.5, fontWeight: font.bold, letterSpacing: 0.5, textTransform: 'uppercase', flexShrink: 1 },
  td: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 10, minHeight: 56 },
  checkCell: { width: 44, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  check: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgElevated,
  },
  checkOn: { backgroundColor: colors.amber, borderColor: colors.amber },

  cardOverlay: { ...StyleSheet.absoluteFill, borderRadius: radius.lg, borderWidth: 2, borderColor: 'transparent' },
  cardOverlayOn: { borderColor: colors.amber, backgroundColor: colors.amberSoft },
  cardCheck: { position: 'absolute', top: 10, right: 10 },

  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingTop: spacing.xs },
  pagerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
  pages: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  pageBtn: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageBtnOn: { backgroundColor: colors.amber, borderColor: colors.amber },
  pageText: { color: colors.text, fontSize: 13, fontWeight: font.semibold },
  ellipsis: { color: colors.textDim, paddingHorizontal: 4 },
  jump: {
    width: 56,
    height: 34,
    marginLeft: 6,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
    color: colors.text,
    fontSize: 13,
    textAlign: 'center',
    outlineStyle: 'none',
  } as object,
});
