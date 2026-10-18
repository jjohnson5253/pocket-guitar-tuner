import { useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Meter } from './src/components/Meter';
import { useTuner } from './src/audio/useTuner';
import { centsBetween, frequencyFor, nearestString, stringsFor, Tuning, tuningAdvice } from './src/tuning';

export default function App() { return <SafeAreaProvider><Tuner /></SafeAreaProvider>; }
function Tuner() {
  const [tuning, setTuning] = useState<Tuning>('Standard');
  const [selected, setSelected] = useState<number | null>(null);
  const [reference, setReference] = useState(440);
  const [help, setHelp] = useState(false);
  const tuner = useTuner();
  const strings = stringsFor(tuning);
  const target = selected !== null ? strings[selected]! : tuner.pitch ? nearestString(tuner.pitch.frequency, strings, reference) : null;
  const cents = tuner.pitch && target ? centsBetween(tuner.pitch.frequency, frequencyFor(target.midi, reference)) : null;
  const inTune = cents !== null && Math.abs(cents) <= 5;
  const status = cents !== null ? tuningAdvice(cents) : tuner.listening ? 'Pluck one string' : 'Ready when you are';
  const selectTuning = (next: Tuning) => { setTuning(next); setSelected(null); };
  return <SafeAreaView style={s.safe}>
    <StatusBar style="light" />
    <ScrollView contentContainerStyle={s.page}>
      <View style={s.header}>
        <View style={{ flex: 1 }}><Text style={s.eyebrow}>A LITTLE LESS FRICTION.</Text><Text style={s.title}>A little more music.</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={help ? 'Close tuning help' : 'Open tuning help'} onPress={() => setHelp(!help)} style={s.helpButton}><Text style={s.helpIcon}>?</Text></Pressable>
      </View>
      <View style={s.brandRow}><View style={s.brandMark}><Text style={s.brandSymbol}>♮</Text></View><Text style={s.brand}>POCKET GUITAR TUNER</Text><View style={s.offline}><Text style={s.offlineText}>ON DEVICE</Text></View></View>
      {help && <View style={s.helpCard}><Text style={s.helpTitle}>One string at a time.</Text><Text style={s.helpText}>Place your phone near your guitar. Tap Start tuning and allow the microphone. Pluck an open string gently and let it ring. Mute the other strings.</Text><Text style={s.helpText}>Tune up when flat, down when sharp. Green means you are within 5 cents. Auto finds the closest guitar string; tap a string to lock it. Standard is E A D G B E, from thickest to thinnest. Drop D lowers only the thickest string.</Text><Text style={s.helpText}>No account, ads, or recordings. Your microphone audio stays on your device.</Text></View>}
      <View style={s.segment}>
        {(['Standard', 'Drop D'] as const).map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: tuning === item }} onPress={() => selectTuning(item)} style={[s.segmentButton, tuning === item && s.segmentActive]}><Text style={[s.segmentText, tuning === item && s.segmentTextActive]}>{item}</Text></Pressable>)}
      </View>
      <View style={s.tunerCard}>
        <View style={s.cardTop}><Text style={s.smallLabel}>{selected === null ? 'AUTO DETECT' : `STRING ${target?.number} · LOCKED`}</Text><View style={s.live}><View style={[s.dot, { backgroundColor: tuner.listening ? '#C3EE92' : '#74877B' }]} /><Text style={s.smallLabel}>{tuner.listening ? 'LISTENING' : 'MIC OFF'}</Text></View></View>
        <View style={s.noteRow}><Text style={[s.note, inTune && s.green]}>{target?.note ?? '—'}</Text>{target && <Text style={s.octave}>{target.octave}</Text>}</View>
        <Text style={[s.status, inTune && s.green]} accessibilityLiveRegion="polite">{status}</Text>
        <Text style={s.frequency}>{tuner.pitch ? `${tuner.pitch.frequency.toFixed(1)} Hz` : target ? `Target ${frequencyFor(target.midi, reference).toFixed(1)} Hz` : 'Six strings. One good sound.'}{cents !== null ? `   ·   ${cents > 0 ? '+' : ''}${Math.round(cents)} cents` : ''}</Text>
        <Meter cents={cents} inTune={inTune} />
      </View>
      <View style={s.stringHeader}><Text style={s.smallLabel}>THICKEST → THINNEST</Text><Pressable accessibilityRole="button" accessibilityState={{ selected: selected === null }} onPress={() => setSelected(null)} style={[s.auto, selected === null && s.autoSelected]}><Text style={s.autoText}>Auto {selected === null ? '✓' : ''}</Text></Pressable></View>
      <View style={s.strings}>{strings.map((string, index) => {
        const active = selected === index || (selected === null && target?.number === string.number);
        return <Pressable key={string.number} accessibilityRole="button" accessibilityLabel={`Lock string ${string.number}, ${string.note}${string.octave}`} accessibilityState={{ selected: active }} onPress={() => setSelected(selected === index ? null : index)} style={[s.string, active && s.stringActive]}><Text style={[s.stringNumber, active && s.dark]}>{string.number}</Text><Text style={[s.stringNote, active && s.dark]}>{string.note}</Text><Text style={[s.stringNumber, active && s.dark]}>{string.octave}</Text></Pressable>;
      })}</View>
      {tuner.error && <View accessibilityRole="alert" style={s.error}><Text style={s.errorText}>{tuner.error}</Text>{tuner.denied && Platform.OS !== 'web' && <Pressable accessibilityRole="button" onPress={() => { void Linking.openSettings(); }} style={s.settingsButton}><Text style={s.errorText}>Open Settings →</Text></Pressable>}</View>}
      <Pressable accessibilityRole="button" onPress={() => tuner.busy || tuner.listening ? tuner.stop() : void tuner.start()} style={({ pressed }) => [s.start, tuner.listening && s.stop, (pressed || tuner.busy) && { opacity: 0.7 }]}><Text style={[s.startText, tuner.listening && { color: '#EDF3E8' }]}>{tuner.busy ? 'Cancel microphone request' : tuner.listening ? 'Pause tuning' : 'Start tuning'} {tuner.busy ? '' : tuner.listening ? 'Ⅱ' : '↗'}</Text></Pressable>
      <View style={s.calibration}><Text style={s.footerText}>REFERENCE PITCH</Text><View style={s.referenceControls}><Pressable accessibilityRole="button" accessibilityLabel="Lower reference pitch" disabled={reference <= 430} accessibilityState={{ disabled: reference <= 430 }} onPress={() => setReference(x => Math.max(430, x - 1))} style={s.referenceButton}><Text style={s.referenceText}>−</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Reference A4 is ${reference} hertz. Reset to 440`} onPress={() => setReference(440)} style={s.referenceValue}><Text style={s.referenceText}>A4 · {reference} Hz</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Raise reference pitch" disabled={reference >= 450} accessibilityState={{ disabled: reference >= 450 }} onPress={() => setReference(x => Math.min(450, x + 1))} style={s.referenceButton}><Text style={s.referenceText}>+</Text></Pressable></View></View>
      <Text style={s.footer}>Made for the moment before you play.</Text>
    </ScrollView>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111B18' },
  page: { width: '100%', maxWidth: 600, alignSelf: 'center', padding: 20, paddingBottom: 28 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18, marginTop: 4 },
  eyebrow: { fontSize: 10, letterSpacing: 2, color: '#A9B9AF', marginBottom: 8 },
  title: { fontSize: 25, fontWeight: '500', color: '#EDF3E8', letterSpacing: -0.8 },
  helpButton: { height: 44, width: 44, borderRadius: 22, borderColor: '#405148', borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  helpIcon: { color: '#C3EE92', fontSize: 18 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 16, flexWrap: 'wrap' },
  brandMark: { width: 26, height: 26, borderRadius: 8, backgroundColor: '#C3EE92', alignItems: 'center', justifyContent: 'center' },
  brandSymbol: { color: '#152017', fontSize: 24, lineHeight: 28 },
  brand: { color: '#D9E4D9', letterSpacing: 1.4, fontSize: 10, fontWeight: '700', flex: 1 },
  offline: { borderRadius: 5, paddingHorizontal: 6, paddingVertical: 5, borderWidth: 1, borderColor: '#405148' },
  offlineText: { color: '#A9B9AF', fontSize: 8, letterSpacing: 1 },
  segment: { backgroundColor: '#1C2923', borderRadius: 14, padding: 5, flexDirection: 'row', marginBottom: 14 },
  segmentButton: { flex: 1, minHeight: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  segmentActive: { backgroundColor: '#35483B' },
  segmentText: { color: '#A9B9AF', fontSize: 14, fontWeight: '500' },
  segmentTextActive: { color: '#EDF3E8' },
  tunerCard: { backgroundColor: '#1C2923', borderRadius: 28, padding: 20, borderWidth: 1, borderColor: '#34463A', alignItems: 'center' },
  cardTop: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  smallLabel: { fontSize: 9, letterSpacing: 1.5, color: '#A9B9AF' },
  live: { flexDirection: 'row', alignItems: 'center', gap: 7 }, dot: { width: 6, height: 6, borderRadius: 3 },
  noteRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 8, height: 110 },
  note: { color: '#EDF3E8', fontSize: 96, fontWeight: '300', letterSpacing: -6, lineHeight: 110 },
  octave: { color: '#A9B9AF', fontSize: 28, marginLeft: 5 },
  status: { color: '#EDF3E8', fontSize: 21, fontWeight: '500', marginTop: 4 }, green: { color: '#C3EE92' },
  frequency: { color: '#A9B9AF', fontSize: 12, marginTop: 10, fontVariant: ['tabular-nums'] },
  stringHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 8 },
  auto: { minHeight: 44, paddingHorizontal: 15, justifyContent: 'center', borderRadius: 22 }, autoSelected: { backgroundColor: '#293C2D' }, autoText: { color: '#C3EE92', fontSize: 12 },
  strings: { flexDirection: 'row', gap: 7 },
  string: { flex: 1, minHeight: 76, borderRadius: 16, backgroundColor: '#1C2923', borderWidth: 1, borderColor: '#34463A', alignItems: 'center', justifyContent: 'center', gap: 4 },
  stringActive: { backgroundColor: '#C3EE92', borderColor: '#C3EE92' }, stringNumber: { fontSize: 10, color: '#A9B9AF' }, stringNote: { fontSize: 25, color: '#EDF3E8', fontWeight: '500' }, dark: { color: '#17251B' },
  start: { backgroundColor: '#C3EE92', borderRadius: 16, alignItems: 'center', justifyContent: 'center', minHeight: 58, padding: 14, marginTop: 18 },
  stop: { backgroundColor: '#35483B', borderWidth: 1, borderColor: '#63765E' }, startText: { fontSize: 16, color: '#17251B', fontWeight: '600' },
  calibration: { marginTop: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 },
  footerText: { color: '#A9B9AF', fontSize: 9, letterSpacing: 1.5 }, referenceControls: { flexDirection: 'row', alignItems: 'center' }, referenceButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, referenceValue: { minHeight: 44, justifyContent: 'center' }, referenceText: { color: '#D9E4D9', fontSize: 12, fontVariant: ['tabular-nums'] },
  footer: { color: '#A9B9AF', fontSize: 11, textAlign: 'center', marginTop: 20 },
  helpCard: { padding: 18, borderWidth: 1, borderColor: '#405148', borderRadius: 16, marginBottom: 20, gap: 10 }, helpTitle: { color: '#C3EE92', fontSize: 18 }, helpText: { color: '#D9E4D9', fontSize: 13, lineHeight: 21 },
  error: { padding: 16, backgroundColor: '#44372A', borderRadius: 14, marginTop: 18 }, errorText: { color: '#FFE0BA', fontSize: 13, lineHeight: 20 }, settingsButton: { minHeight: 44, justifyContent: 'center' },
});
