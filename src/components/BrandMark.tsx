import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, spacing } from '@/theme';

/** OSGB Hub logo + marka adı */
export function BrandMark() {
  return (
    <View style={styles.row}>
      <View style={styles.logoShadow}>
        <LinearGradient
          colors={[colors.amberLight, colors.amber, colors.amberDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logo}
        >
          <Ionicons name="shield-checkmark" size={28} color={colors.onAmber} />
        </LinearGradient>
      </View>
      <View>
        <Text style={styles.name}>
          OSGB<Text style={styles.hub}>Hub</Text>
        </Text>
        <Text style={styles.caption}>İSG YÖNETİM PLATFORMU</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  logoShadow: {
    borderRadius: radius.lg,
    shadowColor: colors.amber,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { color: colors.white, fontSize: 24, fontWeight: font.heavy, letterSpacing: -0.5 },
  hub: { color: colors.amber },
  caption: {
    color: colors.textDim,
    fontSize: 10.5,
    fontWeight: font.semibold,
    letterSpacing: 1.6,
    marginTop: 2,
  },
});
