import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { IconName } from '@/components/ui/kit';
import { colors, font, spacing } from '@/theme';

/* ------------------------------------------------------------------ */
/* Tek serili çubuk grafik — dokununca değer gösterir                  */
/* ------------------------------------------------------------------ */

type BarDatum = { label: string; value: number; detail?: string };

export function BarChart({
  data,
  height = 150,
  unit = '',
}: {
  data: BarDatum[];
  height?: number;
  unit?: string;
}) {
  const [selected, setSelected] = useState(data.length - 1);
  const max = Math.max(1, ...data.map((d) => d.value));
  // Okunaklı üst sınır (5'in katı)
  const top = Math.max(5, Math.ceil(max / 5) * 5);
  const sel = data[selected];

  return (
    <View style={{ gap: spacing.md }}>
      <View style={ch.readout} accessibilityLiveRegion="polite">
        <Text style={ch.readoutValue}>
          {sel?.value}
          <Text style={ch.readoutUnit}> {unit}</Text>
        </Text>
        <Text style={ch.readoutLabel}>{sel?.detail ?? sel?.label}</Text>
      </View>

      <View style={{ height, flexDirection: 'row' }}>
        {/* Eksen etiketleri */}
        <View style={ch.axis}>
          <Text style={ch.axisText}>{top}</Text>
          <Text style={ch.axisText}>{(top / 2).toLocaleString('tr-TR')}</Text>
          <Text style={ch.axisText}>0</Text>
        </View>

        <View style={{ flex: 1 }}>
          {/* Izgara çizgileri */}
          <View style={[ch.grid, { top: 0 }]} />
          <View style={[ch.grid, { top: height / 2 }]} />
          <View style={[ch.grid, ch.baseline, { top: height - 1 }]} />

          <View style={ch.bars}>
            {data.map((d, i) => {
              const h = Math.max(2, (d.value / top) * (height - 1));
              const active = i === selected;
              return (
                <Pressable
                  key={d.label}
                  onPress={() => setSelected(i)}
                  style={ch.col}
                  accessibilityRole="button"
                  accessibilityLabel={`${d.detail ?? d.label}: ${d.value} ${unit}`}
                  accessibilityState={{ selected: active }}
                >
                  <View
                    style={[
                      ch.bar,
                      { height: h, backgroundColor: active ? colors.amber : 'rgba(255,176,32,0.35)' },
                    ]}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', paddingLeft: 28 }}>
        {data.map((d, i) => (
          <Text
            key={d.label}
            style={[ch.xLabel, i === selected && { color: colors.text, fontWeight: font.bold }]}
          >
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Durum dağılımı — segmentli çubuk + etiketli lejant                  */
/* ------------------------------------------------------------------ */

export type Segment = { key: string; label: string; value: number; color: string; icon: IconName };

export function StatusDistribution({ segments }: { segments: Segment[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const visible = segments.filter((x) => x.value > 0);
  return (
    <View style={{ gap: spacing.lg }}>
      <View
        style={ch.stack}
        accessibilityRole="image"
        accessibilityLabel={segments.map((s) => `${s.label} ${s.value}`).join(', ')}
      >
        {visible.map((x, i) => (
          <View
            key={x.key}
            style={{
              flex: x.value,
              backgroundColor: x.color,
              borderTopLeftRadius: i === 0 ? 4 : 0,
              borderBottomLeftRadius: i === 0 ? 4 : 0,
              borderTopRightRadius: i === visible.length - 1 ? 4 : 0,
              borderBottomRightRadius: i === visible.length - 1 ? 4 : 0,
            }}
          />
        ))}
      </View>
      <View style={{ gap: spacing.sm + 2 }}>
        {segments.map((x) => (
          <View key={x.key} style={ch.legendRow}>
            <View style={[ch.legendSwatch, { backgroundColor: x.color }]} />
            <Ionicons name={x.icon} size={14} color={colors.textMuted} />
            <Text style={ch.legendLabel}>{x.label}</Text>
            <Text style={ch.legendValue}>{x.value}</Text>
            <Text style={ch.legendPct}>%{Math.round((x.value / total) * 100)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const ch = StyleSheet.create({
  readout: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  readoutValue: { color: colors.white, fontSize: 26, fontWeight: font.heavy, letterSpacing: -0.6 },
  readoutUnit: { color: colors.textMuted, fontSize: 13, fontWeight: font.semibold },
  readoutLabel: { color: colors.textDim, fontSize: 12.5, fontWeight: font.medium },

  axis: { width: 28, justifyContent: 'space-between', paddingBottom: 0, marginTop: -6, marginBottom: -6 },
  axisText: { color: colors.textDim, fontSize: 10, fontWeight: font.medium },
  grid: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.border, opacity: 0.6 },
  baseline: { opacity: 1, backgroundColor: colors.borderStrong },
  bars: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'flex-end' },
  col: { flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 1 },
  bar: { width: '62%', maxWidth: 34, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  xLabel: { flex: 1, textAlign: 'center', color: colors.textDim, fontSize: 11, fontWeight: font.medium },

  stack: { flexDirection: 'row', height: 12, gap: 2 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  legendSwatch: { width: 10, height: 10, borderRadius: 3 },
  legendLabel: { flex: 1, color: colors.text, fontSize: 13.5, fontWeight: font.medium },
  legendValue: { color: colors.text, fontSize: 13.5, fontWeight: font.bold, minWidth: 28, textAlign: 'right' },
  legendPct: { color: colors.textDim, fontSize: 12, fontWeight: font.medium, width: 38, textAlign: 'right' },
});
