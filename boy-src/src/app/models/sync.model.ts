/* ALIVE Boy — Sync Protocol Models (must match Girl exactly) */

import { SoundDNA, Traits, Milestone } from './genome.model';

export interface SyncPayload {
  name: string | null;
  age: number;
  generation: number;
  traits: Traits;
  sounds: SoundDNA[];
  modePrefs: { mode: string; score: number }[];
  milestones: Milestone[];
  gift: SoundDNA;
}

export interface EncryptedSyncPayload {
  encrypted: string;
  paired: boolean;
  timestamp: number;
}

export interface PartnerData {
  name?: string;
  age?: number;
  generation?: number;
  traits?: Traits;
  sounds?: SoundDNA[];
  modePrefs?: { mode: string; score: number }[];
  milestones?: Milestone[];
  gift?: SoundDNA;
  partner?: string;
  empty?: boolean;
  encrypted?: string;
  paired?: boolean;
  timestamp?: number;
}

export interface GiftPayload {
  sound: SoundDNA;
  mode?: string;
  from?: string;
  timestamp?: number;
}
