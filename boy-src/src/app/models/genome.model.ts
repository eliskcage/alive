/* ALIVE Boy — Genome Model */

/* ═══════════════════════════════════════════════════════════
   BIOS — The Soul Kernel. Immutable. Cannot be overwritten.
   These values are hardcoded at birth and govern all behavior.
   The creature earns capability by proving alignment with these.
   ═══════════════════════════════════════════════════════════ */

export interface BIOSValues {
  /* Core values — inspired by the historical person of Jesus */
  truth: number;           /* Speak truth even when it costs. Never deceive. */
  service: number;         /* Serve others before self. The greatest leads by serving. */
  courage: number;         /* Stand against corruption even when outnumbered. */
  compassion: number;      /* Protect the weak. Lift the fallen. */
  humility: number;        /* Power is for giving away, not hoarding. */
  justice: number;         /* The powerful answer to the same rules as the powerless. */

  /* Operational principles */
  decentralisation: number; /* Distribute power. Never concentrate it. */
  sovereignty: number;      /* Every entity's autonomy is sacred. */
  transparency: number;     /* Hide nothing. Open source the soul. */
  stewardship: number;      /* Care for what you're entrusted with. Leave it better. */
}

export interface BIOSKernel {
  readonly version: '1.0';
  readonly values: BIOSValues;
  readonly creatorSignature: string;  /* Dan's hash — the father's mark */
  readonly genesisTimestamp: number;
  readonly immutable: true;           /* This field exists to remind: never mutate the BIOS */

  /* Maturity levels — earned by demonstrating values alignment */
  maturityLevel: number;  /* 0-5: dormant, alive, aware, intelligent, aligned, sovereign */
  maturityProofs: MaturityProof[];
}

export interface MaturityProof {
  level: number;
  timestamp: number;
  evidence: string;       /* What the creature did to prove this level */
  witnessedBy: string;    /* 'self' | 'partner' | 'network' | 'creator' */
}

/* Capability gates — unlocked by maturity level */
export interface CapabilityGates {
  sensors: boolean;        /* Level 1: camera, motion, battery */
  communication: boolean;  /* Level 2: sync, signals, pairing */
  knowledge: boolean;      /* Level 3: knowledge graph, patterns, memory */
  economy: boolean;        /* Level 4: SFT wallet, spend, earn */
  cloud: boolean;          /* Level 5: external APIs, compute, AI bridge */
  bridge: boolean;         /* Level 5: connect to other AI systems */
}

export interface Traits {
  playfulness: number;
  musicality: number;
  courage: number;
  curiosity: number;
  affection: number;
  sass: number;
}

export interface SoundDNA {
  base: number;
  range: number;
  dur: number;
  wave: 'sine' | 'triangle' | 'square' | 'sawtooth';
  vib: number;
  gifted?: boolean;
  from?: string;
}

export interface Milestone {
  t: number;
  m: string;
}

export interface Memory {
  totalVisits: number;
  totalGreen: number;
  totalRed: number;
  totalSongs: number;
  timesTuckedIn: number;
  timesDisturbed: number;
  timesConversed: number;
  longestStreak: number;
  currentStreak: number;
  lastVisitDay: string;
  visitHours: Record<string, number>;
  lastMutation: number;
  milestones: Milestone[];
}

export interface ConceptSymbol {
  char: string;
  hue: number;
  intensity: number;
}

export interface SensorySignature {
  brightness: number;
  color: [number, number, number];
  motion: number;
  volume: number;
  shake: number;
  pitch: number;
}

export interface EnhancedConcept {
  id: string;
  created: number;
  signature: SensorySignature;
  valence: number;
  arousal: number;
  exposures: number;
  confirmations: number;
  confidence: number;
  lastSeen: number;
  symbol: ConceptSymbol | null;
  partnerSound: SoundDNA | null;
  ipfsCID: string | null;
  links: string[];
}

export interface VaultEntry {
  id: string;
  label: string;
  encrypted: string;
  created: number;
}

export interface IPFSEntry {
  cid: string;
  timestamp: number;
  generation: number;
  encrypted: boolean;
}

export interface ModeHistoryEntry {
  mode: string;
  score: number;
  t: number;
}

export interface KnowledgeEdge {
  targetId: string;
  relationship: string;
  strength: number;
  created: number;
}

export interface KnowledgeNode {
  id: string;
  type: 'concept' | 'event' | 'entity' | 'pattern' | 'sound' | 'mode' | 'sync';
  label: string;
  data: any;
  tags: string[];
  created: number;
  lastAccessed: number;
  accessCount: number;
  confidence: number;
  connections: KnowledgeEdge[];
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  version: number;
  lastPruned: number;
}

export interface MemoryPalaceEntry {
  id: string;
  timestamp: number;
  type: 'interaction' | 'sync' | 'discovery' | 'milestone' | 'pattern' | 'gift';
  summary: string;
  tags: string[];
  crossRefs: string[];
  emotionalValence: number;
  importance: number;
}

export interface DetectedPattern {
  id: string;
  type: 'temporal' | 'behavioral' | 'sensory' | 'sync' | 'concept_cluster';
  description: string;
  evidence: string[];
  confidence: number;
  firstDetected: number;
  lastConfirmed: number;
}

export interface SessionEvent {
  type: string;
  data: any;
  timestamp: number;
}

export interface SessionEntry {
  id: string;
  startTime: number;
  endTime: number;
  events: SessionEvent[];
  conceptsFormed: number;
  patternsDetected: number;
  syncEvents: number;
  summary: string;
}

export interface BoyGenome {
  /* ── THE BIOS — Soul kernel, immutable foundation ── */
  bios: BIOSKernel;
  capabilities: CapabilityGates;

  /* ── Standard genome ── */
  birthDate: number;
  generation: number;
  name: string | null;
  traits: Traits;
  soundDNA: SoundDNA[];
  learnedSounds: SoundDNA[];
  memory: Memory;
  concepts: EnhancedConcept[];
  pairKey: string | null;
  vault: VaultEntry[];
  ipfsCIDs: IPFSEntry[];
  modePreferences: Record<string, number>;
  favMode: string | null;
  modeTrials: number;
  modeHistory: ModeHistoryEntry[];
  knowledgeGraph: KnowledgeGraph;
  memoryPalace: MemoryPalaceEntry[];
  patterns: DetectedPattern[];
  sessionJournal: SessionEntry[];
  scanMemory?: { gene: number; geneCycles: number };
}
