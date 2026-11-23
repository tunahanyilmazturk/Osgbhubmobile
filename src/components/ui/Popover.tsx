import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type HostInstance,
} from 'react-native';

import type { IconName } from '@/components/ui/kit';
import { colors, font, radius, spacing } from '@/theme';

type Props = {
  /** Açma tetikleyicisi */
  trigger: (api: { open: () => void; isOpen: boolean }) => ReactNode;
  /** Panel içeriği; `close` ile kapatılır */
  children: (close: () => void) => ReactNode;
  width?: number;
  align?: 'left' | 'right';
  maxHeight?: number;
};

/** Tetikleyicinin altında açılan menü/panel (dışına dokununca kapanır) */
export function Popover({ trigger, children, width = 260, align = 'right', maxHeight = 420 }: Props) {
  const [anchor, setAnchor] = useState<HostInstance | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const win = useWindowDimensions();

  const open = () => {
    anchor?.measureInWindow((x, y, w, h) => {
      const left = Math.max(8, Math.min(align === 'right' ? x + w - width : x, win.width - width - 8));
      const below = y + h + 6;
      const top = below + maxHeight > win.height && y > maxHeight ? Math.max(8, y - maxHeight - 6) : below;
      setPos({ top, left });
    });
  };
  const close = () => setPos(null);

  return (
    <>
      <View ref={setAnchor} collapsable={false}>
        {trigger({ open, isOpen: !!pos })}
      </View>
      <Modal visible={!!pos} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Kapat" />
        {pos && (
          <View style={[styles.panel, { top: pos.top, left: pos.left, width, maxHeight }]}>
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              {children(close)}
            </ScrollView>
          </View>
        )}
      </Modal>
    </>
  );
}

/** Popover içinde menü satırı */
export function MenuItem({
  label,
  icon,
  onPress,
  active,
  danger,
  hint,
  right,
}: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  active?: boolean;
  danger?: boolean;
  hint?: string;
  right?: ReactNode;
}) {
  const [hover, setHover] = useState(false);
  const fg = danger ? colors.danger : active ? colors.amber : colors.text;
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={[styles.item, (hover || active) && { backgroundColor: colors.surface }]}
      accessibilityRole="menuitem"
      accessibilityState={{ selected: active }}
    >
      {icon && <Ionicons name={icon} size={17} color={danger ? colors.danger : active ? colors.amber : colors.textMuted} />}
      <View style={{ flex: 1 }}>
        <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
          {label}
        </Text>
        {!!hint && (
          <Text style={styles.hint} numberOfLines={2}>
            {hint}
          </Text>
        )}
      </View>
      {right}
      {active && <Ionicons name="checkmark" size={16} color={colors.amber} />}
    </Pressable>
  );
}

export function MenuTitle({ children }: { children: string }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function MenuDivider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    padding: 6,
    borderRadius: radius.md,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  label: { fontSize: 14, fontWeight: font.medium },
  hint: { color: colors.textDim, fontSize: 12, marginTop: 1 },
  title: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: font.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 4,
  },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
});
