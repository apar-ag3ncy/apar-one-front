import { useEffect, useRef, useState } from 'react';

const rootNotes = [55, 65.41, 49, 58.27, 73.42, 65.41, 55];

// User-triggered synthesis keeps the soundtrack local and allows each set to
// resolve into a different chord without downloading or looping a sound file.
export function useAmbience(stage: number, visible: boolean) {
  const rig = useRef<{ context: AudioContext; master: GainNode; voices: OscillatorNode[] } | null>(null);
  const [enabled, setEnabled] = useState(false);
  useEffect(() => () => { void rig.current?.context.close(); rig.current = null; }, []);
  useEffect(() => {
    const engine = rig.current;
    if (!engine) return;
    function update() {
      if (!engine) return;
      const now = engine.context.currentTime;
      engine.master.gain.setTargetAtTime(enabled && visible && !document.hidden ? .035 : 0, now, .15);
      engine.voices.forEach((voice, i) => voice.frequency.setTargetAtTime(rootNotes[stage]*[1,1.503,2.008][i], now, .5));
    }
    update(); document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, [stage, enabled, visible]);
  async function toggle() {
    try {
      if (!rig.current) {
        const context = new AudioContext();
        const master = context.createGain();
        master.gain.value = 0; master.connect(context.destination);
        const voices = [0, 1, 2].map(i => {
          const osc = context.createOscillator(); osc.type = i === 2 ? 'triangle' : 'sine';
          osc.frequency.value = rootNotes[stage]*[1,1.503,2.008][i]; osc.connect(master); osc.start();
          return osc;
        });
        rig.current = { context, master, voices };
      }
      await rig.current.context.resume(); setEnabled(value => !value);
    } catch { setEnabled(false); }
  }
  return { enabled, toggle };
}
