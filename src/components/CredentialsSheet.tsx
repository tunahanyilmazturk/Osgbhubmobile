import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { colors, font, radius, spacing } from '@/theme';

export type Credential = { name: string; email: string; password: string };

/** Katılımcı portalının adresi (giriş bilgisi mesajında kullanılır) */
export const PORTAL_URL = 'https://osgbhub.com';

export function credentialsText(list: Credential[]) {
  return list
    .map(
      (c) =>
        `${c.name}\nOSGB Hub online eğitim girişi: ${PORTAL_URL}\nGiriş türü: Katılımcı\nE-posta: ${c.email}\nGeçici şifre: ${c.password}`,
    )
    .join('\n\n');
}

/** Oluşturulan katılımcı hesaplarını gösterir ve panoya kopyalar */
export function CredentialsSheet({
  visible,
  accounts,
  title = 'Giriş bilgileri',
  subtitle,
  onClose,
}: {
  visible: boolean;
  accounts: Credential[];
  title?: string;
  subtitle?: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await Clipboard.setStringAsync(credentialsText(accounts));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} subtitle={subtitle}>
      <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ gap: spacing.sm }}>
        {accounts.map((a) => (
          <View key={a.email} style={styles.item}>
            <Text style={styles.name}>{a.name}</Text>
            <View style={styles.line}>
              <Ionicons name="mail-outline" size={14} color={colors.textDim} />
              <Text style={styles.value} selectable>
                {a.email}
              </Text>
            </View>
            <View style={styles.line}>
              <Ionicons name="key-outline" size={14} color={colors.textDim} />
              <Text style={[styles.value, styles.mono]} selectable>
                {a.password}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
        <Button
          title={copied ? 'Kopyalandı' : accounts.length > 1 ? 'Tümünü kopyala' : 'Bilgileri kopyala'}
          icon={copied ? 'checkmark' : 'copy-outline'}
          onPress={copy}
        />
        <Button title="Tamam" variant="outline" onPress={onClose} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  item: {
    gap: 4,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { color: colors.white, fontSize: 14.5, fontWeight: font.bold },
  line: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  value: { color: colors.text, fontSize: 13.5 },
  mono: { fontFamily: 'monospace', letterSpacing: 1, color: colors.amber, fontWeight: font.bold },
});
