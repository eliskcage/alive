/* ALIVE Boy — Sync Service
   Push/pull/gift/collect matching Girl's protocol exactly */

import { Injectable } from '@angular/core';
import { GenomeService } from './genome.service';
import { SatoshiService } from './satoshi.service';
import { AudioService } from './audio.service';
import { SyncPayload, PartnerData, GiftPayload } from '../models/sync.model';

@Injectable({ providedIn: 'root' })
export class SyncService {
  private readonly SYNC_URL = '/alive/sync.php';
  private readonly SYNC_TYPE = 'boy';
  private syncInterval: any = null;
  private giftInterval: any = null;

  constructor(
    private genome: GenomeService,
    private satoshi: SatoshiService,
    private audio: AudioService
  ) {}

  startAutoSync(): void {
    setTimeout(() => this.pull(), 5000);
    this.syncInterval = setInterval(() => {
      this.push();
      this.pull();
    }, 120000);
    this.giftInterval = setInterval(() => {
      const g = this.genome.get();
      if (g.generation > 3 && g.learnedSounds.length >= 2) {
        this.collectGifts();
      }
    }, 600000);
  }

  stopAutoSync(): void {
    if (this.syncInterval) clearInterval(this.syncInterval);
    if (this.giftInterval) clearInterval(this.giftInterval);
  }

  packageForSync(): SyncPayload {
    const g = this.genome.get();
    const bestSounds = g.learnedSounds.slice(-5);
    const sorted = Object.keys(g.modePreferences)
      .sort((a, b) => g.modePreferences[b] - g.modePreferences[a]);
    const topModes = sorted.slice(0, 3).map(m => ({
      mode: m, score: g.modePreferences[m]
    }));
    return {
      name: g.name,
      age: this.genome.getAgeDays(),
      generation: g.generation,
      traits: g.traits,
      sounds: bestSounds,
      modePrefs: topModes,
      milestones: g.memory.milestones.slice(-5),
      gift: bestSounds.length > 0 ? bestSounds[bestSounds.length - 1] : g.soundDNA[0]
    };
  }

  push(): void {
    const g = this.genome.get();
    let body: any;
    if (g.pairKey) {
      const data = this.packageForSync();
      const json = JSON.stringify(data);
      const encrypted = this.satoshi.encrypt(json, g.pairKey);
      body = { encrypted, paired: true, timestamp: Date.now() };
    } else {
      body = this.packageForSync();
    }
    fetch(this.SYNC_URL + '?action=push&type=' + this.SYNC_TYPE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).catch(() => {});
  }

  pull(): Promise<PartnerData | null> {
    return fetch(this.SYNC_URL + '?action=pull&type=' + this.SYNC_TYPE)
      .then(r => r.json())
      .then((data: PartnerData) => {
        if (data.empty) return null;
        let partnerData: PartnerData;
        if (data.paired && data.encrypted && this.genome.get().pairKey) {
          try {
            const json = this.satoshi.decrypt(data.encrypted, this.genome.get().pairKey!);
            partnerData = JSON.parse(json);
          } catch { return null; }
        } else {
          partnerData = data;
        }
        this.absorbPartnerData(partnerData);
        this.audio.soundDataReceived();
        return partnerData;
      })
      .catch(() => null);
  }

  absorbPartnerData(data: PartnerData): void {
    const g = this.genome.get();

    /* Adopt sounds — mutate 5% to make own */
    if (data.sounds && data.sounds.length > 0) {
      for (const s of data.sounds) {
        if (g.learnedSounds.length >= 16) break;
        const isDuplicate = g.learnedSounds.some(ls =>
          Math.abs(ls.base - s.base) < 50
        );
        if (!isDuplicate) {
          const mutated = this.audio.mutateDNA(s);
          mutated.from = 'partner';
          g.learnedSounds.push(mutated);
        }
      }
    }

    /* Blend mode preferences — 80/20 split */
    if (data.modePrefs) {
      for (const mp of data.modePrefs) {
        if (mp.score > 70) {
          const current = g.modePreferences[mp.mode] || 50;
          g.modePreferences[mp.mode] = current * 0.8 + mp.score * 0.2;
        }
      }
    }

    /* Trait influence — 5% from partner */
    if (data.traits) {
      const keys = Object.keys(data.traits) as (keyof typeof data.traits)[];
      for (const k of keys) {
        if (g.traits[k] !== undefined && data.traits[k] !== undefined) {
          g.traits[k] = g.traits[k] * 0.95 + data.traits[k]! * 0.05;
        }
      }
    }

    this.genome.save();
  }

  sendGift(): void {
    const g = this.genome.get();
    const bestSound = g.learnedSounds.length > 0
      ? g.learnedSounds[g.learnedSounds.length - 1]
      : g.soundDNA[0];
    const gift: GiftPayload = {
      sound: bestSound,
      mode: g.favMode || undefined
    };
    fetch(this.SYNC_URL + '?action=gift&type=' + this.SYNC_TYPE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gift)
    }).catch(() => {});
  }

  collectGifts(): void {
    fetch(this.SYNC_URL + '?action=collect&type=' + this.SYNC_TYPE)
      .then(r => r.json())
      .then((gifts: GiftPayload[]) => {
        if (!gifts || gifts.length === 0) return;
        for (const gift of gifts) {
          this.receiveGift(gift);
        }
      })
      .catch(() => {});
  }

  private receiveGift(gift: GiftPayload): void {
    const g = this.genome.get();
    if (gift.sound && g.learnedSounds.length < 16) {
      const mutated = this.audio.mutateDNA(gift.sound);
      mutated.gifted = true;
      mutated.from = gift.from || 'partner';
      g.learnedSounds.push(mutated);
      this.audio.soundGift();
    }
    if (gift.mode) {
      g.modePreferences[gift.mode] = (g.modePreferences[gift.mode] || 50) + 15;
    }
    this.genome.save();
  }

  /* ── Signal channel for pairing negotiation ── */
  sendSignal(sig: string, data?: any): Promise<boolean> {
    return fetch(this.SYNC_URL + '?action=signal&type=' + this.SYNC_TYPE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sig, data: data || null })
    }).then(r => r.json()).then(r => !!r.ok).catch(() => false);
  }

  pollSignal(): Promise<{ sig: string; data?: any; from: string } | null> {
    return fetch(this.SYNC_URL + '?action=poll&type=' + this.SYNC_TYPE)
      .then(r => r.json())
      .then(r => r.empty ? null : r)
      .catch(() => null);
  }

  getStatus(): Promise<any> {
    return fetch(this.SYNC_URL + '?action=status').then(r => r.json()).catch(() => null);
  }
}
