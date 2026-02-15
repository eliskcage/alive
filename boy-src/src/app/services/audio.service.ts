/* ALIVE Boy — Audio Service
   Web Audio API synthesizer — deeper, more structured than Girl */

import { Injectable } from '@angular/core';
import { SoundDNA } from '../models/genome.model';

@Injectable({ providedIn: 'root' })
export class AudioService {
  private ctx: AudioContext | null = null;

  private ensureContext(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  bleep(freq: number, dur: number, wave: OscillatorType = 'triangle', vol: number = 0.15): void {
    const ctx = this.ensureContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }

  playDNA(dna: SoundDNA): void {
    const ctx = this.ensureContext();
    const freq = dna.base + (Math.random() - 0.5) * dna.range;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = dna.wave;
    osc.frequency.value = freq;
    if (dna.vib > 0) {
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = dna.vib;
      lfoGain.gain.value = freq * 0.03;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();
      lfo.stop(ctx.currentTime + dna.dur);
    }
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dna.dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dna.dur);
  }

  /* Boy-specific sounds */
  soundUnlock(): void {
    this.bleep(200, 0.08, 'square', 0.1);
    setTimeout(() => this.bleep(300, 0.08, 'square', 0.1), 60);
    setTimeout(() => this.bleep(450, 0.12, 'triangle', 0.12), 120);
  }

  soundDataReceived(): void {
    for (let i = 0; i < 4; i++) {
      setTimeout(() => this.bleep(600 + i * 100, 0.04, 'square', 0.06), i * 40);
    }
  }

  soundPatternFound(): void {
    this.bleep(350, 0.15, 'triangle', 0.1);
    setTimeout(() => this.bleep(450, 0.15, 'triangle', 0.1), 150);
    setTimeout(() => this.bleep(350, 0.2, 'sine', 0.08), 300);
  }

  soundKnowledgeStored(): void {
    this.bleep(300, 0.1, 'sine', 0.08);
    setTimeout(() => this.bleep(400, 0.1, 'sine', 0.08), 80);
    setTimeout(() => this.bleep(600, 0.15, 'sine', 0.1), 160);
  }

  soundProcessing(): void {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => this.bleep(250, 0.03, 'square', 0.04), i * 100);
    }
  }

  soundGreen(): void {
    this.bleep(350, 0.12, 'triangle', 0.1);
    setTimeout(() => this.bleep(500, 0.15, 'sine', 0.08), 100);
  }

  soundRed(): void {
    this.bleep(180, 0.2, 'sawtooth', 0.08);
  }

  soundSleep(): void {
    this.bleep(150, 0.8, 'sine', 0.05);
  }

  soundWake(): void {
    this.bleep(200, 0.1, 'triangle', 0.08);
    setTimeout(() => this.bleep(350, 0.15, 'triangle', 0.1), 120);
  }

  soundPair(): void {
    this.bleep(300, 0.1, 'sine', 0.08);
    setTimeout(() => this.bleep(400, 0.1, 'sine', 0.08), 100);
    setTimeout(() => this.bleep(500, 0.1, 'sine', 0.08), 200);
    setTimeout(() => this.bleep(700, 0.2, 'sine', 0.1), 300);
  }

  soundGift(): void {
    [500, 700, 900, 1100, 1400].forEach((f, i) => {
      setTimeout(() => this.bleep(f, 0.08, 'triangle', 0.08), i * 60);
    });
  }

  soundIdle(traits: { musicality: number; curiosity: number; courage: number }): void {
    if (traits.curiosity > 60) {
      this.bleep(200 + Math.random() * 200, 0.15, 'triangle', 0.04);
    } else if (traits.musicality > 50) {
      this.bleep(250 + Math.random() * 150, 0.2, 'sine', 0.03);
    } else {
      this.soundProcessing();
    }
  }

  /* ── Negotiation protocol sounds ── */
  soundHello(): void {
    /* Ascending double beep — "I'm here, can you hear me?" */
    this.bleep(250, 0.08, 'triangle', 0.1);
    setTimeout(() => this.bleep(400, 0.1, 'triangle', 0.12), 120);
    setTimeout(() => this.bleep(550, 0.12, 'sine', 0.1), 260);
  }

  soundCycling(): void {
    /* Rhythmic clicks — "scanning, trying different eyes" */
    this.bleep(300, 0.02, 'square', 0.06);
    setTimeout(() => this.bleep(300, 0.02, 'square', 0.06), 80);
    setTimeout(() => this.bleep(400, 0.02, 'square', 0.06), 160);
  }

  soundCantSee(): void {
    /* Descending tone — "I can't see it, change your look" */
    this.bleep(500, 0.15, 'sawtooth', 0.08);
    setTimeout(() => this.bleep(350, 0.15, 'sawtooth', 0.08), 150);
    setTimeout(() => this.bleep(200, 0.25, 'sawtooth', 0.06), 300);
  }

  soundPartnerChanged(): void {
    /* Rising chirp — "acknowledged, she changed it" */
    this.bleep(400, 0.06, 'sine', 0.08);
    setTimeout(() => this.bleep(600, 0.08, 'sine', 0.1), 80);
  }

  soundPartnerReady(): void {
    /* Soft confirmation chord — "she's showing, I can start looking" */
    this.bleep(300, 0.15, 'sine', 0.06);
    setTimeout(() => this.bleep(400, 0.15, 'sine', 0.06), 50);
    setTimeout(() => this.bleep(500, 0.2, 'triangle', 0.08), 100);
  }

  mutateDNA(dna: SoundDNA): SoundDNA {
    return {
      base: dna.base * (1 + (Math.random() - 0.5) * 0.24),
      range: dna.range * (1 + (Math.random() - 0.5) * 0.4),
      dur: Math.max(0.03, dna.dur * (1 + (Math.random() - 0.5) * 0.3)),
      wave: Math.random() < 0.1 ? (['sine', 'triangle', 'square', 'sawtooth'] as const)[Math.floor(Math.random() * 4)] : dna.wave,
      vib: Math.max(0, dna.vib + (Math.random() - 0.5) * 3)
    };
  }

  crossbreedDNA(a: SoundDNA, b: SoundDNA): SoundDNA {
    return {
      base: (a.base + b.base) / 2,
      range: (a.range + b.range) / 2,
      dur: (a.dur + b.dur) / 2,
      wave: Math.random() < 0.5 ? a.wave : b.wave,
      vib: (a.vib + b.vib) / 2
    };
  }
}
