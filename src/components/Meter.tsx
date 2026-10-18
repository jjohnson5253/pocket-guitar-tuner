import { StyleSheet, Text, View } from 'react-native';

export function Meter({ cents, inTune }: { cents: number | null; inTune: boolean }) {
  const position = 50 + Math.max(-50, Math.min(50, cents ?? 0));
  return <View accessibilityLabel={cents === null ? 'Waiting for a note' : `${Math.round(cents)} cents ${cents < 0 ? 'flat' : 'sharp'}`} style={styles.container}>
    <View style={styles.scale}>
      <View style={styles.zone} />
      {Array.from({ length: 21 }, (_, i) => <View key={i} style={[styles.tick, { height: i % 5 === 0 ? 27 : 13, backgroundColor: i === 10 ? '#C3EE92' : '#52645B' }]} />)}
      {cents !== null && <View style={[styles.needle, { left: `${position}%`, backgroundColor: inTune ? '#C3EE92' : '#F4C889' }]} />}
    </View>
    <View style={styles.labels}><Text style={styles.label}>−50</Text><Text style={styles.label}>0</Text><Text style={styles.label}>+50</Text></View>
    <View style={styles.labels}><Text style={styles.direction}>FLAT</Text><Text style={styles.direction}>CENTS</Text><Text style={styles.direction}>SHARP</Text></View>
  </View>;
}
const styles = StyleSheet.create({
  container: { width: '100%', paddingHorizontal: 12, marginTop: 20 },
  scale: { height: 44, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  zone: { position: 'absolute', left: '45%', width: '10%', height: 44, borderRadius: 10, backgroundColor: '#C3EE9215' },
  tick: { width: 2, borderRadius: 2 },
  needle: { position: 'absolute', top: 0, width: 4, marginLeft: -2, height: 44, borderRadius: 3 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  label: { fontSize: 12, color: '#A9B9AF', fontVariant: ['tabular-nums'] },
  direction: { color: '#A9B9AF', fontSize: 10, letterSpacing: 2 },
});
