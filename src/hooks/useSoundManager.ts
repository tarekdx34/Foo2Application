import { useState, useEffect, useCallback } from 'react';

const MUTE_KEY = 'fooq_muted';

// ══════════════════════════════════════════════════════════════════════
// SINGLETON AUDIO ENGINE  (shared across all React components)
// ══════════════════════════════════════════════════════════════════════

let _ctx: AudioContext | null = null;
let _master: GainNode | null = null;
let _bgTimer: ReturnType<typeof setTimeout> | null = null;
let _bgPhase: string | null = null;

function audioCtx(): AudioContext {
  if (!_ctx) {
    _ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    _master = _ctx.createGain();
    try { _master.gain.value = localStorage.getItem(MUTE_KEY) === 'true' ? 0 : 1; }
    catch { _master.gain.value = 1; }
    _master.connect(_ctx.destination);
  }
  if (_ctx.state === 'suspended') _ctx.resume().catch(() => {});
  return _ctx;
}

function masterDest(): GainNode {
  audioCtx(); // ensure created
  return _master!;
}

// ══════════════════════════════════════════════════════════════════════
// FREQUENCY TABLE — Maqam Hijaz on D  (characteristic augmented 2nd)
// ══════════════════════════════════════════════════════════════════════

const D3 = 146.83, G3 = 196.00, A3 = 220.00, Bb3 = 233.08;
const D4 = 293.66, Eb4 = 311.13, FS4 = 369.99, G4 = 392.00;
const A4 = 440.00, Bb4 = 466.16, C5 = 523.25;
const D5 = 587.33;

// ══════════════════════════════════════════════════════════════════════
// MUSIC PATTERNS  [frequency_hz, duration_seconds]  (freq=0 → rest)
// All patterns have durations verified to sum to exact loop lengths.
// ══════════════════════════════════════════════════════════════════════

type Step = [number, number];

// HOME — 80 BPM, 12 s loop, gentle Hijaz melody
const HOME_MEL: Step[] = [
  [D4,.75],[FS4,.375],[G4,.375],
  [A4,.75],[G4,.375],[FS4,.375],
  [Eb4,.75],[D4,.375],[Eb4,.375],
  [FS4,1.5],
  [G4,.75],[A4,.375],[Bb4,.375],
  [A4,.75],[G4,.375],[FS4,.375],
  [Eb4,.375],[FS4,.375],[D4,.375],[C5,.375],
  [D5,1.5],
]; // Σ = 12.0 s

const HOME_BASS: Step[] = [
  [D3,.375],[0,.375],[G3,.375],[0,.375],
  [D3,.375],[0,.375],[A3,.375],[0,.375],
  [D3,.375],[0,.375],[G3,.375],[0,.375],
  [D3,.375],[0,.375],[A3,.375],[0,.375],
  [D3,.375],[0,.375],[G3,.375],[0,.375],
  [D3,.375],[0,.375],[A3,.375],[0,.375],
  [D3,.375],[0,.375],[G3,.375],[0,.375],
  [D3,.375],[0,.375],[A3,.375],[0,.375],
]; // Σ = 32 × 0.375 = 12.0 s

// SETTINGS — calm 12 s loop, sparse Hijaz, sine wave
const SET_MEL: Step[] = [
  [G4,1.0],[FS4,.5],[Eb4,.5],
  [D4,2.0],
  [A4,1.0],[G4,.5],[FS4,.5],
  [Eb4,.5],[D4,.5],[Eb4,1.0],
  [FS4,1.0],[G4,.5],[A4,.5],
  [D5,2.0],
]; // Σ = 12.0 s

const SET_BASS: Step[] = [
  [D3,2.0],[G3,2.0],[A3,2.0],[G3,2.0],
  [D3,2.0],[A3,2.0],
]; // Σ = 12.0 s

// GAME — 120 BPM, 8 s loop, energetic Hijaz riff + tabla rhythm
const GAME_MEL: Step[] = [
  [D4,.25],[FS4,.25],[G4,.25],[A4,.25],
  [Bb4,.5],[A4,.25],[G4,.25],
  [FS4,.5],[Eb4,.25],[D4,.25],
  [G4,1.0],
  [G4,.25],[A4,.25],[Bb4,.25],[C5,.25],
  [D5,.5],[C5,.25],[Bb4,.25],
  [A4,.5],[G4,.25],[FS4,.25],
  [D5,1.0],
]; // Σ = 8.0 s

const GAME_BASS: Step[] = [
  [D3,.25],[0,.25],[D3,.25],[0,.25],
  [G3,.25],[0,.25],[A3,.25],[0,.25],
  [D3,.25],[0,.25],[D3,.25],[0,.25],
  [G3,.5],[A3,.5],
  [D3,.25],[0,.25],[D3,.25],[0,.25],
  [G3,.25],[0,.25],[A3,.25],[0,.25],
  [Bb3,.25],[0,.25],[A3,.25],[0,.25],
  [G3,.5],[D3,.5],
]; // Σ = 8.0 s  (Bb4*.5 ≈ Bb3 = 233 Hz)

// ══════════════════════════════════════════════════════════════════════
// AUDIO PRIMITIVES
// ══════════════════════════════════════════════════════════════════════

function schedulePattern(
  steps: Step[],
  startTime: number,
  wave: OscillatorType,
  volume: number,
): void {
  const ctx = audioCtx();
  const dest = masterDest();
  let t = startTime;
  for (const [f, dur] of steps) {
    if (f > 0) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g);
      g.connect(dest);
      osc.type = wave;
      osc.frequency.setValueAtTime(f, t);
      const attack = Math.min(0.012, dur * 0.12);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(volume, t + attack);
      g.gain.setValueAtTime(volume, t + dur * 0.62);
      g.gain.linearRampToValueAtTime(0, t + dur * 0.93);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    }
    t += dur;
  }
}

function drumHit(startTime: number, freq: number, vol: number): void {
  const ctx = audioCtx();
  const dest = masterDest();
  const sr = ctx.sampleRate;
  const len = Math.ceil(sr * 0.1);
  const buf = ctx.createBuffer(1, len, sr);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filt = ctx.createBiquadFilter();
  filt.type = 'bandpass';
  filt.frequency.value = freq;
  filt.Q.value = 3.5;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, startTime);
  g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);
  src.connect(filt);
  filt.connect(g);
  g.connect(dest);
  src.start(startTime);
}

function scheduleGameDrums(startTime: number, durationS: number): void {
  const step = 0.25; // 16th note @ 120 BPM
  const n = Math.floor(durationS / step);
  for (let i = 0; i < n; i++) {
    const t = startTime + i * step;
    if      (i % 16 === 0) drumHit(t, 155, 0.52); // strong dha
    else if (i % 8  === 0) drumHit(t, 155, 0.30); // mid dha
    else if (i % 4  === 0) drumHit(t, 520, 0.16); // tin (high)
  }
}

// ══════════════════════════════════════════════════════════════════════
// BACKGROUND MUSIC — look-ahead loop scheduler (no drift)
// ══════════════════════════════════════════════════════════════════════

function stopBg(): void {
  if (_bgTimer) clearTimeout(_bgTimer);
  _bgTimer = null;
  _bgPhase = null;
}

function startBg(phase: 'home' | 'settings' | 'game'): void {
  stopBg();
  _bgPhase = phase;

  const loop = (targetStart: number) => {
    if (_bgPhase !== phase) return;
    const ctx = audioCtx();
    // If we fell behind (e.g. tab was backgrounded), catch up gracefully
    const startTime = Math.max(targetStart, ctx.currentTime + 0.05);

    let mel: Step[], bass: Step[];
    let melVol: number, bassVol: number, melWave: OscillatorType;
    let withDrums = false;

    if (phase === 'home') {
      mel = HOME_MEL; bass = HOME_BASS;
      melVol = 0.22; bassVol = 0.13; melWave = 'triangle';
    } else if (phase === 'settings') {
      mel = SET_MEL; bass = SET_BASS;
      melVol = 0.15; bassVol = 0.09; melWave = 'sine';
    } else {
      mel = GAME_MEL; bass = GAME_BASS;
      melVol = 0.22; bassVol = 0.14; melWave = 'triangle';
      withDrums = true;
    }

    const loopDur = mel.reduce((s, [, d]) => s + d, 0);
    schedulePattern(mel, startTime, melWave, melVol);
    schedulePattern(bass, startTime, 'sine', bassVol);
    if (withDrums) scheduleGameDrums(startTime, loopDur);

    const loopEnd = startTime + loopDur;
    const now = audioCtx().currentTime;
    // Re-schedule 180 ms before the loop ends so notes are ready
    _bgTimer = setTimeout(() => loop(loopEnd), Math.max(100, (loopEnd - now - 0.18) * 1000));
  };

  loop(audioCtx().currentTime + 0.05);
}

// ══════════════════════════════════════════════════════════════════════
// EXPORTED SOUND EFFECTS  (all ≤ 1 second)
// ══════════════════════════════════════════════════════════════════════

export function playCorrect(): void {
  const ctx = audioCtx();
  const now = ctx.currentTime;
  // Ascending Hijaz arpeggio: D4→F#4→A4→D5
  ([[ D4, .10], [FS4, .10], [A4, .10], [D5, .32]] as Step[])
    .forEach(([f, d], i) => schedulePattern([[f, d]], now + i * 0.09, 'triangle', 0.36));
}

export function playWrong(): void {
  const ctx = audioCtx();
  const now = ctx.currentTime;
  // Descending dissonant drop
  ([[Bb4, .13], [FS4, .13], [Eb4, .28]] as Step[])
    .forEach(([f, d], i) => schedulePattern([[f, d]], now + i * 0.11, 'sawtooth', 0.28));
}

export function playCardFlip(): void {
  const ctx = audioCtx();
  const dest = masterDest();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.connect(g); g.connect(dest);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(900, now);
  osc.frequency.exponentialRampToValueAtTime(220, now + 0.18);
  g.gain.setValueAtTime(0.22, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.20);
  osc.start(now); osc.stop(now + 0.22);
}

export function playTimerTick(): void {
  schedulePattern([[880, 0.055]], audioCtx().currentTime, 'square', 0.10);
}

export function playTimerUrgent(): void {
  const now = audioCtx().currentTime;
  schedulePattern([[1047, 0.07]], now,        'square', 0.28);
  schedulePattern([[1047, 0.07]], now + 0.13, 'square', 0.28);
}

export function playWinner(): void {
  const ctx = audioCtx();
  const now = ctx.currentTime;
  // Quick ascending + resolve in Hijaz (0.96 s)
  const fanfare: Step[] = [
    [D4,.07],[FS4,.07],[A4,.07],[D5,.07],
    [D5,.06],[A4,.06],[FS4,.06],[D4,.06],
    [D5,.48],
  ];
  schedulePattern(fanfare, now, 'triangle', 0.40);
  schedulePattern([[D3, .96]], now, 'sine', 0.18); // bass root
  for (let i = 0; i < 8; i++) {
    drumHit(now + i * 0.12, i % 2 === 0 ? 155 : 520, 0.45);
  }
}

export function playButtonClick(): void {
  schedulePattern([[G4, 0.065]], audioCtx().currentTime, 'sine', 0.17);
}

// ══════════════════════════════════════════════════════════════════════
// REACT HOOK
// ══════════════════════════════════════════════════════════════════════

export type SoundPhase = 'home' | 'settings' | 'game';

export function useSoundManager() {
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try { return localStorage.getItem(MUTE_KEY) === 'true'; } catch { return false; }
  });

  // Keep master gain in sync with mute state
  useEffect(() => {
    if (_master && _ctx) {
      _master.gain.setTargetAtTime(isMuted ? 0 : 1, _ctx.currentTime, 0.08);
    }
    try { localStorage.setItem(MUTE_KEY, String(isMuted)); } catch {}
  }, [isMuted]);

  // Resume AudioContext on first user gesture (required on iOS / strict browsers)
  useEffect(() => {
    const resume = () => { _ctx?.resume().catch(() => {}); };
    document.addEventListener('touchstart', resume, { once: true, passive: true });
    document.addEventListener('click',      resume, { once: true });
    return () => {
      document.removeEventListener('touchstart', resume);
      document.removeEventListener('click',      resume);
    };
  }, []);

  const playBackgroundMusic = useCallback((phase: SoundPhase) => {
    startBg(phase);
  }, []);

  const stopBackgroundMusic = useCallback(() => {
    stopBg();
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      if (_master && _ctx) {
        _master.gain.setTargetAtTime(next ? 0 : 1, _ctx.currentTime, 0.08);
      }
      try { localStorage.setItem(MUTE_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  return {
    isMuted,
    toggleMute,
    playBackgroundMusic,
    stopBackgroundMusic,
    playCorrect,
    playWrong,
    playCardFlip,
    playTimerTick,
    playTimerUrgent,
    playWinner,
    playButtonClick,
  };
}
