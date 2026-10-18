import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { AudioModule, setAudioModeAsync, useAudioStream } from 'expo-audio';
import { Pitch, PitchBuffer } from './pitch';
import { CaptureSession } from './session';

export function useTuner() {
  const [pitch, setPitch] = useState<Pitch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);
  const buffer = useRef(new PitchBuffer());
  const session = useRef(new CaptureSession());
  const lastPitch = useRef(0);
  const active = useRef(false);
  const { stream, isStreaming } = useAudioStream({ sampleRate: 22050, channels: 1, encoding: 'float32', onBuffer: (chunk) => {
    if (!active.current) return;
    const result = buffer.current.push(new Float32Array(chunk.data), chunk.sampleRate, chunk.channels);
    if (result) { lastPitch.current = Date.now(); setPitch(result); }
  } });
  const stop = useCallback(() => {
    session.current.cancel();
    active.current = false;
    stream.stop();
    buffer.current.reset();
    setPitch(null);
    setBusy(false);
    void setAudioModeAsync({ allowsRecording: false }).catch(() => {});
  }, [stream]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => { if (state === 'background' || (state === 'inactive' && active.current)) stop(); });
    const timer = setInterval(() => { if (Date.now() - lastPitch.current > 700) setPitch(null); }, 200);
    return () => { sub.remove(); clearInterval(timer); session.current.cancel(); active.current = false; stream.stop(); };
  }, [stream, stop]);
  async function start() {
    if (busy || active.current) return;
    const generation = session.current.begin();
    setBusy(true); setError(null); setDenied(false); buffer.current.reset();
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!session.current.isCurrent(generation)) return;
      if (!permission.granted) { setDenied(true); setError('Allow microphone access in Settings to tune your guitar.'); return; }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true, shouldPlayInBackground: false });
      if (!session.current.isCurrent(generation)) return;
      await stream.start();
      if (!session.current.isCurrent(generation) || AppState.currentState !== 'active') { stream.stop(); return; }
      active.current = true;
    } catch {
      if (session.current.isCurrent(generation)) { stream.stop(); setError('The microphone is unavailable. Close other audio apps and try again.'); }
    } finally { if (session.current.isCurrent(generation)) setBusy(false); }
  }
  return { pitch, error, denied, busy, listening: isStreaming, start, stop };
}
