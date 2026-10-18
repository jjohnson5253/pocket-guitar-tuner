export type GuitarString = { note: string; octave: number; midi: number; number: number };
export type Tuning = 'Standard' | 'Drop D';
export const STRINGS: GuitarString[] = [
  { note: 'E', octave: 2, midi: 40, number: 6 },
  { note: 'A', octave: 2, midi: 45, number: 5 },
  { note: 'D', octave: 3, midi: 50, number: 4 },
  { note: 'G', octave: 3, midi: 55, number: 3 },
  { note: 'B', octave: 3, midi: 59, number: 2 },
  { note: 'E', octave: 4, midi: 64, number: 1 },
];
export const stringsFor = (tuning: Tuning): GuitarString[] =>
  tuning === 'Drop D' ? [{ note: 'D', octave: 2, midi: 38, number: 6 }, ...STRINGS.slice(1)] : STRINGS;
export const frequencyFor = (midi: number, reference = 440): number => reference * 2 ** ((midi - 69) / 12);
export const centsBetween = (frequency: number, target: number): number => 1200 * Math.log2(frequency / target);
export function nearestString(frequency: number, strings: GuitarString[], reference = 440): GuitarString | null {
  if (!Number.isFinite(frequency) || frequency <= 0) return null;
  return strings.reduce<GuitarString | null>((best, string) =>
    !best || Math.abs(centsBetween(frequency, frequencyFor(string.midi, reference))) <
      Math.abs(centsBetween(frequency, frequencyFor(best.midi, reference))) ? string : best, null);
}
export const tuningAdvice = (cents: number): string => Math.abs(cents) <= 5 ? 'In tune' : cents < 0 ? 'Tune up' : 'Tune down';
