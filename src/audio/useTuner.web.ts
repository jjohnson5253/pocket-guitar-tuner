import { useEffect, useRef, useState } from 'react';
import { Pitch, detectPitch } from './pitch';
import { CaptureSession } from './session';

export function useTuner() {
  const [pitch, setPitch] = useState<Pitch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const capture = useRef<{ media: MediaStream; context: AudioContext; timer: ReturnType<typeof setInterval> } | null>(null);
  const session = useRef(new CaptureSession());
  function stop() {
    session.current.cancel();
    const current = capture.current;
    capture.current = null;
    if (current) { clearInterval(current.timer); current.media.getTracks().forEach((track) => track.stop()); void current.context.close(); }
    setListening(false); setBusy(false); setPitch(null);
  }
  useEffect(() => {
    const background = () => { if (document.hidden) stop(); };
    document.addEventListener('visibilitychange', background);
    return () => { document.removeEventListener('visibilitychange', background); stop(); };
  }, []);
  async function start() {
    if (busy || capture.current) return;
    const generation = session.current.begin();
    setBusy(true); setError(null);
    let media: MediaStream | null = null;
    let context: AudioContext | null = null;
    try {
      media = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      if (!session.current.isCurrent(generation)) { media.getTracks().forEach(t => t.stop()); return; }
      context = new AudioContext();
      await context.resume();
      if (!session.current.isCurrent(generation)) { media.getTracks().forEach(t => t.stop()); await context.close(); return; }
      const analyser = context.createAnalyser(); analyser.fftSize = 4096;
      context.createMediaStreamSource(media).connect(analyser);
      const samples = new Float32Array(4096);
      const rate = context.sampleRate;
      let last = 0;
      const timer = setInterval(() => {
        analyser.getFloatTimeDomainData(samples);
        const next = detectPitch(samples, rate);
        if (next) { last = Date.now(); setPitch(next); }
        else if (Date.now() - last > 700) setPitch(null);
      }, 90);
      capture.current = { media, context, timer }; setListening(true);
    } catch {
      media?.getTracks().forEach(t => t.stop());
      if (context) void context.close();
      if (session.current.isCurrent(generation)) setError('Microphone access is unavailable. Allow it in your browser settings and try again.');
    } finally { if (session.current.isCurrent(generation)) setBusy(false); }
  }
  return { pitch, error, denied: false, busy, listening, start, stop };
}
