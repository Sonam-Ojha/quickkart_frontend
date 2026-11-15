import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Audio plumbing ─────────────────────────────────────────────
// One shared context. Browsers keep it "suspended" after a page load until the
// first tap / key press on the page; unlockAudio() resumes it then.
let audioCtx: AudioContext | null = null;
const getAudio = () => {
  try {
    if (!audioCtx) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtx = new Ctx();
    }
    return audioCtx;
  } catch { return null; }
};
export const audioReady = () => getAudio()?.state === 'running';
export const unlockAudio = async () => {
  const ctx = getAudio();
  if (ctx && ctx.state !== 'running') { try { await ctx.resume(); } catch { /* still locked */ } }
  return audioReady();
};

// ── Tones (synthesised, nothing to download) ──────────────────
type Note = { f: number; at: number; dur: number; wave?: OscillatorType; gain?: number };
export interface Tone { id: string; name: string; hint: string; notes: Note[] }

export const TONES: Tone[] = [
  { id: 'chime', name: 'Chime', hint: 'Soft two-note ding',
    notes: [{ f: 880, at: 0, dur: 0.35 }, { f: 1175, at: 0.18, dur: 0.4 }] },
  { id: 'bell', name: 'Kitchen bell', hint: 'Bright counter bell',
    notes: [{ f: 1568, at: 0, dur: 0.9, wave: 'triangle' }, { f: 2093, at: 0, dur: 0.7, gain: 0.4 }, { f: 1568, at: 0.45, dur: 0.9, wave: 'triangle' }] },
  { id: 'ringtone', name: 'Phone ring', hint: 'Like a phone call — hard to miss',
    notes: Array.from({ length: 8 }, (_, i) => ({ f: i % 2 ? 640 : 800, at: i * 0.07, dur: 0.07, wave: 'square' as OscillatorType, gain: 0.18 }))
      .concat(Array.from({ length: 8 }, (_, i) => ({ f: i % 2 ? 640 : 800, at: 0.75 + i * 0.07, dur: 0.07, wave: 'square' as OscillatorType, gain: 0.18 }))) },
  { id: 'alarm', name: 'Alarm', hint: 'Loud and urgent beeps',
    notes: [0, 0.22, 0.44, 0.66].map(at => ({ f: 988, at, dur: 0.14, wave: 'square' as OscillatorType, gain: 0.22 })) },
  { id: 'melody', name: 'Melody', hint: 'Cheerful rising tune',
    notes: [523, 659, 784, 1047].map((f, i) => ({ f, at: i * 0.13, dur: 0.22, wave: 'triangle' as OscillatorType })) },
  { id: 'marimba', name: 'Marimba', hint: 'Warm wooden notes',
    notes: [784, 988, 784, 1175].map((f, i) => ({ f, at: i * 0.16, dur: 0.3 })) },
  { id: 'pop', name: 'Pop', hint: 'Short and quiet',
    notes: [{ f: 1320, at: 0, dur: 0.12 }, { f: 1760, at: 0.08, dur: 0.12 }] },
];
export const toneById = (id: string) => TONES.find(t => t.id === id) ?? TONES[0];

/** Play a tone at volume 0–1. Silently does nothing while audio is locked. */
export function playTone(id: string, volume = 0.8) {
  const ctx = getAudio();
  if (!ctx || ctx.state !== 'running' || volume <= 0) return;
  const master = ctx.createGain();
  master.gain.value = Math.min(1, volume);
  master.connect(ctx.destination);
  const start = ctx.currentTime + 0.02;
  for (const n of toneById(id).notes) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = n.wave ?? 'sine';
    o.frequency.value = n.f;
    const t = start + n.at, peak = (n.gain ?? 0.35);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + n.dur);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + n.dur + 0.05);
  }
}

// ── Settings (per browser) ────────────────────────────────────
export interface PartnerSoundSettings {
  soundOn: boolean;
  tone: string;
  volume: number;        // 0–1
  repeatSecs: number;    // 0 = ring once per new order
  popup: boolean;        // show the big new-order pop-up
  set: (p: Partial<Omit<PartnerSoundSettings, 'set'>>) => void;
}

export const usePartnerSettings = create<PartnerSoundSettings>()(
  persist(
    (set) => ({
      soundOn: false,
      tone: 'chime',
      volume: 0.8,
      repeatSecs: 4,
      popup: true,
      set: (p) => set(p),
    }),
    {
      name: 'qk-partner-settings',
      // Carry over the old on/off switch from before settings existed.
      merge: (persisted, current) => {
        let legacyOn = false;
        try { legacyOn = localStorage.getItem('qk-partner-sound') === 'on'; } catch { /* ignore */ }
        return { ...current, ...(persisted as object ?? {}), ...(persisted ? {} : { soundOn: legacyOn }) };
      },
    },
  ),
);

/** Ring with the restaurant's chosen tone and volume. */
export const ringNow = () => {
  const s = usePartnerSettings.getState();
  if (s.soundOn) playTone(s.tone, s.volume);
};
