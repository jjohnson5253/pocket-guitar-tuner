import { describe, expect, it } from 'vitest';
import { detectPitch, PitchBuffer } from '../src/audio/pitch';
import { centsBetween, frequencyFor, nearestString, stringsFor, tuningAdvice } from '../src/tuning';
import { CaptureSession } from '../src/audio/session';
const tone = (frequency: number, rate = 44100, harmonic = false) => Float32Array.from({ length: 4096 }, (_, i) => {
  const phase = 2 * Math.PI * frequency * i / rate;
  return 0.2 * Math.sin(phase) + (harmonic ? 0.28 * Math.sin(2 * phase) + 0.1 * Math.sin(3 * phase) : 0);
});
describe('pitch detection', () => {
  for (const rate of [16000, 22050, 44100, 48000]) for (const tuning of ['Standard', 'Drop D'] as const) {
    for (const string of stringsFor(tuning)) it(`detects ${tuning} ${string.note}${string.octave} at ${rate} Hz`, () => {
      const target = frequencyFor(string.midi);
      expect(Math.abs(centsBetween(detectPitch(tone(target, rate, true), rate)!.frequency, target))).toBeLessThan(2);
    });
  }
  it('measures flat and sharp notes', () => {
    for (const cents of [-35, 27]) {
      const frequency = 110 * 2 ** (cents / 1200);
      expect(centsBetween(detectPitch(tone(frequency), 44100)!.frequency, 110)).toBeCloseTo(cents, 0);
    }
  });
  it('rejects silence, DC, weak signals, invalid samples, and short frames', () => {
    expect(detectPitch(new Float32Array(4096), 44100)).toBeNull();
    expect(detectPitch(new Float32Array(4096).fill(0.3), 44100)).toBeNull();
    expect(detectPitch(tone(110).map(x => x * 0.001), 44100)).toBeNull();
    expect(detectPitch(new Float32Array(4096).fill(NaN), 44100)).toBeNull();
    expect(detectPitch(tone(110), NaN)).toBeNull();
    expect(detectPitch(new Float32Array(12), 44100)).toBeNull();
  });
  it('rejects deterministic broadband noise', () => {
    let seed = 42;
    const noise = Float32Array.from({ length: 4096 }, () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return seed / 2147483648 * 0.3; });
    expect(detectPitch(noise, 44100)).toBeNull();
  });
  it('accumulates small buffers and discards old audio after rate changes', () => {
    const buffer = new PitchBuffer(); const samples = tone(110);
    expect(buffer.push(samples.slice(0, 2048), 44100)).toBeUndefined();
    expect(buffer.push(samples.slice(2048), 44100)?.frequency).toBeCloseTo(110, 0);
    buffer.push(samples.slice(0, 2048), 44100);
    expect(buffer.push(samples.slice(0, 2048), 48000)).toBeUndefined();
    buffer.reset(); expect(buffer.push(samples.slice(0, 2048), 48000)).toBeUndefined();
  });
  it('reads interleaved stereo without doubling the pitch', () => {
    const samples = tone(110); const stereo = new Float32Array(8192);
    samples.forEach((v, i) => { stereo[i * 2] = v; stereo[i * 2 + 1] = v; });
    expect(new PitchBuffer().push(stereo, 44100, 2)?.frequency).toBeCloseTo(110, 0);
  });
});
describe('tuning', () => {
  it('matches guitar strings and calibration', () => {
    expect(frequencyFor(69, 442)).toBe(442);
    expect(nearestString(82.41, stringsFor('Standard'))?.number).toBe(6);
    expect(nearestString(329.63, stringsFor('Standard'))?.number).toBe(1);
    expect(nearestString(73.42, stringsFor('Drop D'))?.note).toBe('D');
    expect(nearestString(NaN, stringsFor('Standard'))).toBeNull();
    expect(nearestString(0, stringsFor('Standard'))).toBeNull();
    expect(stringsFor('Drop D').slice(1)).toEqual(stringsFor('Standard').slice(1));
  });
  it('gives useful tuning directions', () => {
    expect(tuningAdvice(-6)).toBe('Tune up'); expect(tuningAdvice(6)).toBe('Tune down');
    expect(tuningAdvice(5)).toBe('In tune'); expect(tuningAdvice(-5)).toBe('In tune');
  });
  it('invalidates microphone starts after stop and when superseded', () => {
    const session = new CaptureSession(); const first = session.begin();
    expect(session.isCurrent(first)).toBe(true); session.cancel();
    expect(session.isCurrent(first)).toBe(false); const next = session.begin();
    expect(session.isCurrent(next)).toBe(true); session.begin(); expect(session.isCurrent(next)).toBe(false);
  });
});
