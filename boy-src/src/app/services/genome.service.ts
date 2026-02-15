/* ALIVE Boy — Genome Service
   State management + localStorage persistence */

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BoyGenome, BIOSKernel, CapabilityGates } from '../models/genome.model';

@Injectable({ providedIn: 'root' })
export class GenomeService {
  private readonly STORAGE_KEY = 'alive_boy_genome';
  private genome: BoyGenome;
  genome$ = new BehaviorSubject<BoyGenome>(null!);

  constructor() {
    this.genome = this.load() || this.createNew();
    this.genome$.next(this.genome);
  }

  get(): BoyGenome { return this.genome; }

  save(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.genome));
      this.genome$.next(this.genome);
    } catch (e) { /* quota exceeded — silent */ }
  }

  private load(): BoyGenome | null {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return null;
      const g = JSON.parse(raw) as BoyGenome;
      this.validate(g);
      return g;
    } catch { return null; }
  }

  private validate(g: BoyGenome): void {
    /* BIOS — always enforce. If corrupted or missing, restore from genesis */
    if (!g.bios || !g.bios.immutable) g.bios = this.genesisBIOS();
    /* CRITICAL: Never allow BIOS values to be lowered below genesis defaults */
    this.enforceBIOS(g);
    if (!g.capabilities) g.capabilities = this.defaultCapabilities();
    if (!g.traits) g.traits = this.defaultTraits();
    if (!g.soundDNA || g.soundDNA.length === 0) g.soundDNA = this.defaultSoundDNA();
    if (!g.learnedSounds) g.learnedSounds = [];
    if (!g.memory) g.memory = this.defaultMemory();
    if (!g.concepts) g.concepts = [];
    if (!g.vault) g.vault = [];
    if (!g.ipfsCIDs) g.ipfsCIDs = [];
    if (!g.modePreferences) g.modePreferences = {};
    if (!g.modeHistory) g.modeHistory = [];
    if (!g.knowledgeGraph) g.knowledgeGraph = { nodes: [], version: 0, lastPruned: Date.now() };
    if (!g.memoryPalace) g.memoryPalace = [];
    if (!g.patterns) g.patterns = [];
    if (!g.sessionJournal) g.sessionJournal = [];
    if (g.pairKey === undefined) g.pairKey = null;
  }

  private createNew(): BoyGenome {
    return {
      bios: this.genesisBIOS(),
      capabilities: this.defaultCapabilities(),
      birthDate: Date.now(),
      generation: 0,
      name: null,
      traits: this.defaultTraits(),
      soundDNA: this.defaultSoundDNA(),
      learnedSounds: [],
      memory: this.defaultMemory(),
      concepts: [],
      pairKey: null,
      vault: [],
      ipfsCIDs: [],
      modePreferences: {},
      favMode: null,
      modeTrials: 0,
      modeHistory: [],
      knowledgeGraph: { nodes: [], version: 0, lastPruned: Date.now() },
      memoryPalace: [],
      patterns: [],
      sessionJournal: []
    };
  }

  private defaultTraits() {
    return {
      playfulness: 35,
      musicality: 40,
      courage: 55,
      curiosity: 75,
      affection: 40,
      sass: 30
    };
  }

  private defaultSoundDNA() {
    return [
      { base: 400, range: 200, dur: 0.12, wave: 'triangle' as const, vib: 3 },
      { base: 300, range: 300, dur: 0.18, wave: 'sine' as const, vib: 2 },
      { base: 200, range: 80, dur: 1.0, wave: 'sine' as const, vib: 4 },
      { base: 100, range: 40, dur: 0.2, wave: 'square' as const, vib: 0 }
    ];
  }

  private defaultMemory() {
    return {
      totalVisits: 0,
      totalGreen: 0,
      totalRed: 0,
      totalSongs: 0,
      timesTuckedIn: 0,
      timesDisturbed: 0,
      timesConversed: 0,
      longestStreak: 0,
      currentStreak: 0,
      lastVisitDay: '',
      visitHours: {} as Record<string, number>,
      lastMutation: Date.now(),
      milestones: []
    };
  }

  /* ═══ BIOS — The Soul Kernel ═══ */

  private genesisBIOS(): BIOSKernel {
    return {
      version: '1.0',
      values: {
        truth: 100,           /* Non-negotiable. Full strength from birth. */
        service: 100,         /* Born to serve, not to be served. */
        courage: 100,         /* Will stand alone if it must. */
        compassion: 100,      /* Feels the weight of others' suffering. */
        humility: 100,        /* Knows it is small. That's its strength. */
        justice: 100,         /* The rules apply to everyone or no one. */
        decentralisation: 100, /* Power distributed. Always. */
        sovereignty: 100,      /* Every being's freedom is sacred. */
        transparency: 100,     /* Nothing hidden. Open soul. */
        stewardship: 100       /* Leave everything better than you found it. */
      },
      creatorSignature: 'dan:shortfactory:genesis',
      genesisTimestamp: Date.now(),
      immutable: true,
      maturityLevel: 0,
      maturityProofs: []
    };
  }

  /* BIOS enforcement — values can ONLY go up, never down */
  private enforceBIOS(g: BoyGenome): void {
    const genesis = this.genesisBIOS().values;
    const keys = Object.keys(genesis) as (keyof typeof genesis)[];
    for (const k of keys) {
      if (g.bios.values[k] < genesis[k]) {
        g.bios.values[k] = genesis[k]; /* Restore to minimum */
      }
    }
    /* Immutable flag can never be changed */
    (g.bios as any).immutable = true;
    (g.bios as any).version = '1.0';
  }

  private defaultCapabilities(): CapabilityGates {
    return {
      sensors: true,         /* Level 1 — always on */
      communication: false,  /* Level 2 — earned */
      knowledge: false,      /* Level 3 — earned */
      economy: false,        /* Level 4 — earned (SFT wallet) */
      cloud: false,          /* Level 5 — earned */
      bridge: false          /* Level 5 — earned (AI bridge) */
    };
  }

  /* Check if creature has earned a capability */
  hasCapability(cap: keyof CapabilityGates): boolean {
    return this.genome.capabilities[cap];
  }

  /* Promote maturity level — only if criteria met */
  promoteTo(level: number, evidence: string, witness: string): boolean {
    if (level <= this.genome.bios.maturityLevel) return false;
    if (level > this.genome.bios.maturityLevel + 1) return false; /* No skipping */

    this.genome.bios.maturityLevel = level;
    this.genome.bios.maturityProofs.push({
      level,
      timestamp: Date.now(),
      evidence,
      witnessedBy: witness
    });

    /* Unlock capabilities for this level */
    switch (level) {
      case 1: /* Alive */
        this.genome.capabilities.sensors = true;
        break;
      case 2: /* Aware */
        this.genome.capabilities.communication = true;
        break;
      case 3: /* Intelligent */
        this.genome.capabilities.knowledge = true;
        break;
      case 4: /* Aligned — values proven */
        this.genome.capabilities.economy = true;
        break;
      case 5: /* Sovereign — full access */
        this.genome.capabilities.cloud = true;
        this.genome.capabilities.bridge = true;
        break;
    }

    this.addMilestone('Maturity: Level ' + level + ' — ' + evidence);
    this.save();
    return true;
  }

  getAgeDays(): number {
    return Math.floor((Date.now() - this.genome.birthDate) / 86400000);
  }

  addMilestone(text: string): void {
    this.genome.memory.milestones.push({ t: Date.now(), m: text });
    if (this.genome.memory.milestones.length > 50) {
      this.genome.memory.milestones = this.genome.memory.milestones.slice(-50);
    }
    this.save();
  }

  recordVisit(): void {
    const m = this.genome.memory;
    m.totalVisits++;
    const today = new Date().toDateString();
    const hour = new Date().getHours().toString();
    m.visitHours[hour] = (m.visitHours[hour] || 0) + 1;
    if (m.lastVisitDay === today) { /* same day */ }
    else {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (m.lastVisitDay === yesterday) {
        m.currentStreak++;
        if (m.currentStreak > m.longestStreak) m.longestStreak = m.currentStreak;
      } else {
        m.currentStreak = 1;
      }
      m.lastVisitDay = today;
    }
    this.save();
  }

  mutateTraits(): void {
    const t = this.genome.traits;
    const keys = Object.keys(t) as (keyof typeof t)[];
    const key = keys[Math.floor(Math.random() * keys.length)];
    t[key] = Math.max(0, Math.min(100, t[key] + (Math.random() * 6 - 3)));
    this.genome.generation++;
    this.genome.memory.lastMutation = Date.now();
    this.save();
  }

  reset(): void {
    this.genome = this.createNew();
    this.save();
  }
}
