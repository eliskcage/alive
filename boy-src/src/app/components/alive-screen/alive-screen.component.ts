/* ALIVE Boy — Alive Screen
   Main creature viewport — orchestrates all systems */

import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoreRendererComponent } from '../core-renderer/core-renderer.component';
import { PairOverlayComponent } from '../pair-overlay/pair-overlay.component';
import { KnowledgePanelComponent } from '../knowledge-panel/knowledge-panel.component';
import { GenomeService } from '../../services/genome.service';
import { SyncService } from '../../services/sync.service';
import { AudioService } from '../../services/audio.service';
import { SensesService } from '../../services/senses.service';
import { KnowledgeGraphService } from '../../services/knowledge-graph.service';
import { MemoryPalaceService } from '../../services/memory-palace.service';
import { PatternEngineService } from '../../services/pattern-engine.service';
import { SessionJournalService } from '../../services/session-journal.service';
import { SatoshiService } from '../../services/satoshi.service';

/* Visual modes for the Boy */
const VISUAL_MODES: Record<string, {
  primaryHue: number; accentHue: number; gridOpacity: number; speed: number;
  vibe: Record<string, number>;
}> = {
  neural:  { primaryHue: 180, accentHue: 120, gridOpacity: 0.08, speed: 1.0,
             vibe: { playfulness: 30, musicality: 50, courage: 50, curiosity: 80, affection: 40, sass: 20 } },
  matrix:  { primaryHue: 120, accentHue: 90,  gridOpacity: 0.12, speed: 1.3,
             vibe: { playfulness: 20, musicality: 30, courage: 70, curiosity: 90, affection: 20, sass: 60 } },
  quantum: { primaryHue: 270, accentHue: 200, gridOpacity: 0.05, speed: 0.7,
             vibe: { playfulness: 50, musicality: 80, courage: 30, curiosity: 70, affection: 60, sass: 15 } },
  forge:   { primaryHue: 30,  accentHue: 15,  gridOpacity: 0.10, speed: 1.2,
             vibe: { playfulness: 45, musicality: 35, courage: 85, curiosity: 50, affection: 50, sass: 40 } },
  cryo:    { primaryHue: 195, accentHue: 210, gridOpacity: 0.06, speed: 0.5,
             vibe: { playfulness: 15, musicality: 60, courage: 60, curiosity: 40, affection: 35, sass: 50 } },
  signal:  { primaryHue: 60,  accentHue: 45,  gridOpacity: 0.15, speed: 1.5,
             vibe: { playfulness: 80, musicality: 40, courage: 60, curiosity: 85, affection: 25, sass: 70 } },
  deep:    { primaryHue: 240, accentHue: 260, gridOpacity: 0.04, speed: 0.6,
             vibe: { playfulness: 20, musicality: 75, courage: 40, curiosity: 60, affection: 70, sass: 10 } },
  storm:   { primaryHue: 0,   accentHue: 330, gridOpacity: 0.10, speed: 1.4,
             vibe: { playfulness: 35, musicality: 30, courage: 95, curiosity: 45, affection: 15, sass: 90 } }
};

@Component({
  selector: 'boy-alive-screen',
  standalone: true,
  imports: [CommonModule, CoreRendererComponent, PairOverlayComponent, KnowledgePanelComponent],
  template: `
    <div class="alive-screen"
         (touchstart)="onTouch($event)" (touchend)="onTouchEnd()"
         (mousedown)="onMouse($event)" (mouseup)="onTouchEnd()"
         (dblclick)="onDoubleTap()">

      <boy-core-renderer
        [mood]="mood"
        [moodX]="moodX" [moodY]="moodY"
        [sleeping]="sleeping"
        [primaryHue]="currentMode.primaryHue"
        [accentHue]="currentMode.accentHue"
        [gridOpacity]="currentMode.gridOpacity"
        [speedMod]="currentMode.speed">
      </boy-core-renderer>

      <!-- Touch glow -->
      @if (mood !== 'neutral') {
        <div class="touch-glow"
             [style.left.px]="moodX - 100" [style.top.px]="moodY - 100"
             [class.green]="mood === 'green'" [class.red]="mood === 'red'">
        </div>
      }

      <!-- Mode label -->
      @if (modeLabel) { <div class="mode-label">{{modeLabel}}</div> }

      <!-- Pair ring -->
      @if (genome.get().pairKey) {
        <div class="pair-ring"
             [style.borderColor]="pairColor"
             [style.boxShadow]="'0 0 12px ' + pairColor">
        </div>
      }

      <!-- Sleep overlay -->
      @if (sleeping) {
        <div class="sleep-overlay"><div class="sleep-text">zzz</div></div>
      }

      <!-- Symbol display -->
      @if (activeSymbol) {
        <div class="symbol-container">
          <span class="symbol" [style.color]="activeSymbol.color">{{activeSymbol.char}}</span>
        </div>
      }

      <!-- Status bar -->
      <div class="status-bar">
        <span class="status-gen">gen {{genome.get().generation}}</span>
        <span class="status-age">{{genome.getAgeDays()}}d</span>
        <span class="status-mode">{{currentModeName}}</span>
      </div>

      @if (showPairing) { <boy-pair-overlay (close)="showPairing = false"></boy-pair-overlay> }
      <boy-knowledge-panel></boy-knowledge-panel>
    </div>
  `,
  styles: [`
    .alive-screen {
      position: fixed; inset: 0;
      touch-action: none;
      user-select: none;
      overflow: hidden;
    }
    .touch-glow {
      position: fixed;
      width: 200px; height: 200px;
      border-radius: 50%;
      pointer-events: none;
      transition: opacity 0.3s;
    }
    .touch-glow.green {
      background: radial-gradient(circle, rgba(0,255,136,0.15) 0%, transparent 70%);
    }
    .touch-glow.red {
      background: radial-gradient(circle, rgba(255,60,60,0.15) 0%, transparent 70%);
    }
    .mode-label {
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      font-family: monospace;
      font-size: 11px;
      color: rgba(0,212,255,0.3);
      letter-spacing: 4px;
      pointer-events: none;
      animation: modeFade 3s ease-out forwards;
    }
    @keyframes modeFade {
      0% { opacity: 1; }
      70% { opacity: 1; }
      100% { opacity: 0; }
    }
    .pair-ring {
      position: fixed;
      top: 50%; left: 50%;
      width: 80px; height: 80px;
      transform: translate(-50%, -50%);
      border: 2px solid;
      border-radius: 50%;
      pointer-events: none;
      animation: pairBreathe 4s ease-in-out infinite;
    }
    @keyframes pairBreathe {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.6; }
    }
    .sleep-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.6);
      display: flex; align-items: center; justify-content: center;
      pointer-events: none;
    }
    .sleep-text {
      font-family: monospace;
      font-size: 24px;
      color: rgba(0,212,255,0.15);
      animation: sleepPulse 3s ease-in-out infinite;
    }
    @keyframes sleepPulse {
      0%, 100% { opacity: 0.1; }
      50% { opacity: 0.3; }
    }
    .symbol-container {
      position: fixed;
      top: 40%; left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
    }
    .symbol {
      font-size: 36px;
      text-shadow: 0 0 12px currentColor;
      animation: symbolFade 2s ease-out forwards;
    }
    @keyframes symbolFade {
      0% { opacity: 0; transform: scale(0.5); }
      20% { opacity: 1; transform: scale(1); }
      80% { opacity: 1; }
      100% { opacity: 0; }
    }
    .status-bar {
      position: fixed;
      top: 8px; left: 8px;
      font-family: monospace;
      font-size: 9px;
      color: rgba(0,212,255,0.25);
      display: flex; gap: 10px;
      pointer-events: none;
    }
  `]
})
export class AliveScreenComponent implements OnInit, OnDestroy {
  @ViewChild(CoreRendererComponent) renderer!: CoreRendererComponent;

  mood: 'neutral' | 'green' | 'red' = 'neutral';
  moodX = 0;
  moodY = 0;
  sleeping = false;
  showPairing = false;
  modeLabel: string | null = null;
  currentModeName = 'neural';
  currentMode = VISUAL_MODES['neural'];
  pairColor = '#00d4ff';
  activeSymbol: { char: string; color: string } | null = null;

  private touchTimer: any;
  private idleTimer: any;
  private modeTimer: any;
  private sleepTimer: any;
  private patternTimer: any;
  private holdStart = 0;
  private doubleTapTime = 0;

  constructor(
    public genome: GenomeService,
    private sync: SyncService,
    private audio: AudioService,
    private senses: SensesService,
    private kg: KnowledgeGraphService,
    private mp: MemoryPalaceService,
    private pe: PatternEngineService,
    private sj: SessionJournalService,
    private satoshi: SatoshiService
  ) {}

  ngOnInit(): void {
    this.genome.recordVisit();
    this.sj.startSession();
    this.sync.startAutoSync();
    this.updatePairColor();

    // Idle sounds every 15s
    this.idleTimer = setInterval(() => {
      if (!this.sleeping && this.mood === 'neutral') {
        this.audio.soundIdle(this.genome.get().traits);
        this.showRandomSymbol();
      }
    }, 15000);

    // Mode switch every 90s
    this.modeTimer = setInterval(() => {
      if (!this.sleeping) this.pickMode();
    }, 90000);

    // Pattern detection every 60s
    this.patternTimer = setInterval(() => {
      const found = this.pe.detectAll();
      if (found.length > 0) {
        this.sj.logEvent('pattern_detected', { count: found.length });
        this.renderer?.flashKnowledge('#ffc107');
      }
    }, 60000);

    // Sleep after 5min idle
    this.resetSleepTimer();

    // Initial mode
    this.pickMode();

    // Expose debug APIs
    this.exposeAPIs();
  }

  ngOnDestroy(): void {
    this.sync.stopAutoSync();
    this.sj.endSession();
    clearInterval(this.idleTimer);
    clearInterval(this.modeTimer);
    clearInterval(this.patternTimer);
    clearTimeout(this.sleepTimer);
  }

  onTouch(e: TouchEvent): void {
    const touch = e.touches[0];
    this.handleInteraction(touch.clientX, touch.clientY);
  }

  onMouse(e: MouseEvent): void {
    this.handleInteraction(e.clientX, e.clientY);
  }

  onTouchEnd(): void {
    clearTimeout(this.touchTimer);
    const holdDuration = Date.now() - this.holdStart;
    setTimeout(() => {
      this.mood = 'neutral';
    }, 500);
  }

  onDoubleTap(): void {
    this.showPairing = true;
  }

  private handleInteraction(x: number, y: number): void {
    this.holdStart = Date.now();
    this.moodX = x;
    this.moodY = y;
    this.resetSleepTimer();

    if (this.sleeping) {
      this.sleeping = false;
      this.audio.soundWake();
      this.genome.get().memory.timesDisturbed++;
      this.genome.save();
      return;
    }

    // Top half = green, bottom half = red
    const isTop = y < window.innerHeight / 2;
    if (isTop) {
      this.reactGreen(x, y);
    } else {
      this.reactRed(x, y);
    }
  }

  private reactGreen(x: number, y: number): void {
    this.mood = 'green';
    this.moodX = x;
    this.moodY = y;
    this.audio.soundGreen();
    this.genome.get().memory.totalGreen++;
    this.genome.save();
    this.sj.logEvent('green', { x, y });
    this.mp.recordInteraction(true);

    // Mutation chance
    if (Math.random() < 0.05) {
      this.genome.mutateTraits();
      this.renderer?.flashKnowledge('#00ff88');
    }
  }

  private reactRed(x: number, y: number): void {
    this.mood = 'red';
    this.moodX = x;
    this.moodY = y;
    this.audio.soundRed();
    this.genome.get().memory.totalRed++;
    this.genome.save();
    this.sj.logEvent('red', { x, y });
    this.mp.recordInteraction(false);
  }

  private pickMode(): void {
    const traits = this.genome.get().traits;
    const g = this.genome.get();
    const modeNames = Object.keys(VISUAL_MODES);
    let best = modeNames[0];
    let bestScore = -Infinity;

    for (const name of modeNames) {
      const mode = VISUAL_MODES[name];
      // Cosine similarity between traits and mode vibe
      let dot = 0, magA = 0, magB = 0;
      for (const k of Object.keys(traits) as (keyof typeof traits)[]) {
        const a = traits[k];
        const b = mode.vibe[k] || 50;
        dot += a * b;
        magA += a * a;
        magB += b * b;
      }
      let affinity = magA > 0 && magB > 0 ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
      const learned = g.modePreferences[name] || 50;
      let score = affinity * 0.6 + (learned / 100) * 0.4;
      // Curiosity bonus for untried
      if (traits.curiosity > 60 && Math.random() < 0.5) score += Math.random() * 0.2;
      if (name === this.currentModeName) score *= 0.7;
      if (score > bestScore) { bestScore = score; best = name; }
    }

    this.transitionToMode(best);
  }

  private transitionToMode(name: string): void {
    const mode = VISUAL_MODES[name];
    if (!mode) return;
    this.currentModeName = name;
    this.currentMode = mode;
    this.modeLabel = name.toUpperCase();
    setTimeout(() => this.modeLabel = null, 3000);
    this.genome.get().modeTrials = (this.genome.get().modeTrials || 0) + 1;
    this.genome.save();
    this.sj.logEvent('mode_change', { mode: name });
  }

  private resetSleepTimer(): void {
    clearTimeout(this.sleepTimer);
    this.sleepTimer = setTimeout(() => {
      this.sleeping = true;
      this.audio.soundSleep();
      this.sj.logEvent('sleep');
    }, 300000);
  }

  private showRandomSymbol(): void {
    const concepts = this.genome.get().concepts.filter(c => c.symbol && c.confidence > 0.4);
    if (concepts.length === 0) return;
    const c = concepts[Math.floor(Math.random() * concepts.length)];
    if (!c.symbol) return;
    this.activeSymbol = {
      char: c.symbol.char,
      color: `hsl(${c.symbol.hue},80%,60%)`
    };
    setTimeout(() => this.activeSymbol = null, 2000);
  }

  private updatePairColor(): void {
    const key = this.genome.get().pairKey;
    if (key) {
      this.pairColor = this.satoshi.getColor(key);
    }
  }

  private exposeAPIs(): void {
    (window as any).ALIVE_BOY = {
      genome: () => this.genome.get(),
      status: () => ({
        age: this.genome.getAgeDays(),
        generation: this.genome.get().generation,
        traits: this.genome.get().traits,
        visits: this.genome.get().memory.totalVisits,
        concepts: this.genome.get().concepts.length,
        knowledgeNodes: this.genome.get().knowledgeGraph.nodes.length,
        patterns: this.genome.get().patterns.length,
        memories: this.genome.get().memoryPalace.length,
        sessions: this.genome.get().sessionJournal.length
      }),
      reset: () => this.genome.reset(),
      knowledge: {
        graph: () => this.kg.getGraph(),
        search: (q: string) => this.kg.search(q),
        hubs: (n?: number) => this.kg.getHubs(n),
        add: (type: any, label: string, data: any, tags: string[]) => this.kg.addNode(type, label, data, tags)
      },
      memory: {
        palace: () => this.mp.getPalace(),
        search: (q: string) => this.mp.search(q),
        recent: (n?: number) => this.mp.getRecent(n)
      },
      patterns: {
        list: () => this.pe.getAll(),
        detect: () => this.pe.detectAll(),
        active: () => this.pe.getActive()
      },
      session: {
        current: () => this.sj.getCurrent(),
        journal: () => this.sj.getJournal()
      },
      sync: {
        push: () => this.sync.push(),
        pull: () => this.sync.pull(),
        gifts: () => this.sync.collectGifts(),
        sendGift: () => this.sync.sendGift(),
        package: () => this.sync.packageForSync(),
        status: () => this.sync.getStatus()
      },
      satoshi: {
        encrypt: (t: string, p: string) => this.satoshi.encrypt(t, p),
        decrypt: (t: string, p: string) => this.satoshi.decrypt(t, p),
        pair: () => { this.showPairing = true; },
        key: () => this.genome.get().pairKey
      },
      vault: {
        list: () => {
          const g = this.genome.get();
          if (!g.pairKey) return [];
          return g.vault.map(v => ({
            label: v.label,
            value: this.satoshi.decrypt(v.encrypted, g.pairKey!)
          }));
        },
        add: (label: string, value: string) => {
          const g = this.genome.get();
          if (!g.pairKey) return 'pair first';
          g.vault.push({
            id: 'v_' + Date.now().toString(36),
            label,
            encrypted: this.satoshi.encrypt(value, g.pairKey),
            created: Date.now()
          });
          this.genome.save();
          return 'stored';
        }
      },
      ipfs: {
        cids: () => this.genome.get().ipfsCIDs
      }
    };
  }
}
