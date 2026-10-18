export type Pitch = { frequency: number; confidence: number; level: number };

/** YIN cumulative mean normalized difference, with parabolic lag interpolation.
 * A full frame (at least two periods) is required. Silence/noise yields null.
 */
export function detectPitch(samples: Float32Array, sampleRate: number): Pitch | null {
  if (!Number.isFinite(sampleRate) || sampleRate < 4000 || samples.length < 1024) return null;
  const window = Math.floor(samples.length / 2);
  const maxLag = Math.min(window - 1, Math.ceil(sampleRate / 60));
  const minLag = Math.max(2, Math.floor(sampleRate / 400));
  if (maxLag <= minLag) return null;
  let sumSquares = 0;
  for (const value of samples) {
    if (!Number.isFinite(value)) return null;
    sumSquares += value * value;
  }
  const level = Math.sqrt(sumSquares / samples.length);
  if (level < 0.006) return null;
  const difference = new Float32Array(maxLag + 1);
  difference[0] = 1;
  let running = 0;
  for (let lag = 1; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < window; i++) {
      const delta = samples[i]! - samples[i + lag]!;
      sum += delta * delta;
    }
    running += sum;
    difference[lag] = running > 0 ? sum * lag / running : 1;
  }
  for (let lag = minLag; lag < maxLag - 1; lag++) {
    if (difference[lag]! >= 0.15) continue;
    while (lag < maxLag - 1 && difference[lag + 1]! < difference[lag]!) lag++;
    const left = difference[lag - 1]!;
    const center = difference[lag]!;
    const right = difference[lag + 1]!;
    const denominator = 2 * (2 * center - left - right);
    const offset = denominator === 0 ? 0 : (right - left) / denominator;
    const frequency = sampleRate / (lag + Math.max(-1, Math.min(1, offset)));
    return frequency >= 60 && frequency <= 400 ? { frequency, confidence: 1 - center, level } : null;
  }
  return null;
}

/** Accumulates hardware-sized chunks; never assumes the device's sample rate. */
export class PitchBuffer {
  private samples = new Float32Array(4096);
  private used = 0;
  private rate = 0;
  reset() { this.used = 0; this.rate = 0; }
  push(data: Float32Array, sampleRate: number, channels = 1): Pitch | null | undefined {
    if (!Number.isInteger(channels) || channels < 1 || !Number.isFinite(sampleRate) || sampleRate < 4000) return null;
    if (this.rate !== sampleRate) { this.used = 0; this.rate = sampleRate; }
    let result: Pitch | null | undefined;
    for (let i = 0; i < data.length; i += channels) {
      this.samples[this.used++] = data[i]!;
      if (this.used === this.samples.length) {
        result = detectPitch(this.samples, sampleRate);
        this.used = 0;
      }
    }
    return result;
  }
}
