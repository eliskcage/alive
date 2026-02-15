/* ALIVE Boy — Pair Overlay
   Tabbed: TUNNEL | VAULT | IPFS — same functionality as Girl v2.9 */

import { Component, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GenomeService } from '../../services/genome.service';
import { SatoshiService } from '../../services/satoshi.service';
import { SyncService } from '../../services/sync.service';
import { AudioService } from '../../services/audio.service';

@Component({
  selector: 'boy-pair-overlay',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pair-overlay" (click)="$event.stopPropagation()">
      <div class="pair-tabs">
        <button [class.active]="activeTab === 'tunnel'" (click)="showTab('tunnel')">TUNNEL</button>
        <button [class.active]="activeTab === 'vault'" (click)="showTab('vault')">VAULT</button>
        <button [class.active]="activeTab === 'ipfs'" (click)="showTab('ipfs')">IPFS</button>
      </div>

      <!-- TUNNEL TAB -->
      @if (activeTab === 'tunnel') {
        <div class="tab-content">
          @if (!scanning && !showing && !diagMode) {
            <canvas #pairCanvas width="140" height="140" class="pair-canvas"></canvas>
            <input class="pair-input" [(ngModel)]="passphrase" (input)="drawKey()"
                   placeholder="passphrase" type="text" autocomplete="off" spellcheck="false">
            <div class="pair-actions">
              @if (!isPaired) { <button class="pair-btn" (click)="doPair()">PAIR</button> }
              @if (isPaired) { <button class="pair-btn unpair" (click)="doUnpair()">UNPAIR</button> }
              @if (isPaired) { <button class="pair-btn show-btn" (click)="showForScan()">SHOW</button> }
              <button class="pair-btn scan-btn" (click)="startScan()">SCAN</button>
              <button class="pair-btn diag-btn" (click)="startDiag()">DIAG</button>
            </div>
          }
          @if (showing) {
            <canvas #showCanvas width="300" height="300" class="show-canvas"
                    (pointerdown)="showEvolveStart()" (pointerup)="showEvolveStop()"
                    (pointerleave)="showEvolveStop()"></canvas>
            <div class="scan-status">{{showStatus}}</div>
            <button class="pair-btn unpair" (click)="stopShow()">DONE</button>
          }
          @if (scanning) {
            @if (negoState === 'calling' || negoState === 'waiting') {
              <div class="nego-status">
                <div class="nego-pulse"></div>
                <div class="nego-text">{{negoLog}}</div>
              </div>
            } @else {
              <div class="scan-zone">
                <video #scanVideo autoplay playsinline class="scan-video"></video>
                <canvas #scanCanvas class="scan-overlay"></canvas>
              </div>
              <div class="evo-status">
                <span class="evo-gen">GEN {{evoGen}}</span>
                <span class="evo-params">T:{{scanThreshold}} D:{{scanMinDist}} R:{{scanDotReq}}</span>
              </div>
            }
            <div class="scan-status">{{scanStatus}}</div>
            <button class="pair-btn unpair" (click)="stopScan()">STOP</button>
          }
          @if (diagMode) {
            <div class="scan-zone diag-zone">
              <video #diagVideo autoplay playsinline class="scan-video"></video>
              <canvas #diagCanvas class="scan-overlay"></canvas>
            </div>
            <div class="diag-readout">
              <div class="diag-row"><span class="diag-label">REFS</span><span class="diag-val" [style.color]="diagRefs > 2 ? '#00ff88' : '#ff3c3c'">{{diagRefs}}</span></div>
              <div class="diag-row"><span class="diag-label">DATA</span><span class="diag-val">{{diagDataPts}}</span></div>
              <div class="diag-row"><span class="diag-label">BRT</span><span class="diag-val">{{diagBrightness}}</span></div>
              <div class="diag-row"><span class="diag-label">HUM</span><span class="diag-val" style="color:#ffc107">{{diagHumHz}}Hz</span></div>
            </div>
            <div class="diag-bar-container">
              <div class="diag-bar" [style.width.%]="diagBarWidth" [style.background]="diagBarColor"></div>
            </div>
            <div class="scan-status">{{diagStatus}}</div>
            <button class="pair-btn unpair" (click)="stopDiag()">STOP</button>
          }
          @if (isPaired) { <div class="pair-status">paired: {{genome.get().pairKey}}</div> }
        </div>
      }

      <!-- VAULT TAB -->
      @if (activeTab === 'vault') {
        <div class="tab-content">
          <div class="vault-add">
            <input class="vault-label-input" [(ngModel)]="vaultLabel" placeholder="label">
            <input class="vault-value-input" [(ngModel)]="vaultValue" placeholder="value">
            <button class="vault-add-btn" (click)="vaultAdd()">+</button>
          </div>
          <div class="vault-list">
            @for (entry of genome.get().vault; track entry.id) {
              <div class="vault-item">
                <span class="vault-item-label" (click)="vaultReveal(entry.id)">{{entry.label}}</span>
                @if (revealedId === entry.id) { <span class="vault-item-value">{{revealedValue}}</span> }
                <button class="vault-del" (click)="vaultDelete(entry.id)">x</button>
              </div>
            }
          </div>
          @if (!isPaired) { <div class="pair-status">pair first to use vault</div> }
        </div>
      }

      <!-- IPFS TAB -->
      @if (activeTab === 'ipfs') {
        <div class="tab-content">
          <button class="pair-btn" (click)="ipfsSave()">SAVE MIND</button>
          <button class="pair-btn" (click)="ipfsLoad()">LOAD MIND</button>
          <div class="ipfs-cid-list">
            @for (entry of genome.get().ipfsCIDs; track entry.cid) {
              <div class="ipfs-cid">{{entry.cid.substring(0,16)}}... (gen {{entry.generation}})</div>
            }
          </div>
          <div class="pair-status">{{ipfsStatus}}</div>
        </div>
      }

      <button class="pair-close" (click)="close.emit()">X</button>
    </div>
  `,
  styles: [`
    .pair-overlay {
      position: fixed; inset: 0;
      background: rgba(5,8,15,0.95);
      backdrop-filter: blur(10px);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      z-index: 900;
      font-family: monospace;
      color: #e0f0ff;
    }
    .pair-tabs {
      display: flex; gap: 2px; margin-bottom: 20px;
    }
    .pair-tabs button {
      background: rgba(0,212,255,0.08);
      border: 1px solid rgba(0,212,255,0.2);
      color: rgba(0,212,255,0.5);
      font-family: monospace;
      font-size: 11px;
      padding: 6px 16px;
      cursor: pointer;
      letter-spacing: 2px;
    }
    .pair-tabs button.active {
      background: rgba(0,212,255,0.15);
      color: #00d4ff;
      border-color: rgba(0,212,255,0.5);
    }
    .tab-content {
      display: flex; flex-direction: column;
      align-items: center; gap: 12px;
      min-height: 200px;
    }
    .pair-canvas {
      border: 1px solid rgba(0,212,255,0.15);
      border-radius: 4px;
    }
    .pair-input, .vault-label-input, .vault-value-input {
      background: rgba(0,212,255,0.06);
      border: 1px solid rgba(0,212,255,0.2);
      color: #00d4ff;
      font-family: monospace;
      font-size: 14px;
      padding: 8px 12px;
      text-align: center;
      outline: none;
      width: 200px;
    }
    .pair-btn {
      background: rgba(0,255,136,0.1);
      border: 1px solid rgba(0,255,136,0.3);
      color: #00ff88;
      font-family: monospace;
      font-size: 12px;
      padding: 8px 24px;
      cursor: pointer;
      letter-spacing: 2px;
    }
    .pair-btn.unpair {
      background: rgba(255,60,60,0.1);
      border-color: rgba(255,60,60,0.3);
      color: #ff3c3c;
    }
    .pair-actions { display: flex; gap: 8px; }
    .pair-status {
      font-size: 10px;
      color: rgba(0,212,255,0.4);
    }
    .pair-close {
      position: absolute; top: 20px; right: 20px;
      background: none; border: none;
      color: rgba(0,212,255,0.4);
      font-family: monospace;
      font-size: 18px;
      cursor: pointer;
    }
    .vault-add {
      display: flex; gap: 4px; align-items: center;
    }
    .vault-label-input { width: 80px; font-size: 12px; }
    .vault-value-input { width: 140px; font-size: 12px; }
    .vault-add-btn {
      background: rgba(0,255,136,0.15);
      border: 1px solid rgba(0,255,136,0.3);
      color: #00ff88;
      font-family: monospace;
      font-size: 16px;
      width: 30px; height: 30px;
      cursor: pointer;
    }
    .vault-list {
      width: 260px;
      max-height: 200px;
      overflow-y: auto;
    }
    .vault-item {
      display: flex; align-items: center; gap: 6px;
      padding: 4px 0;
      border-bottom: 1px solid rgba(0,212,255,0.08);
    }
    .vault-item-label {
      color: #00d4ff;
      cursor: pointer;
      font-size: 12px;
      flex: 1;
    }
    .vault-item-value {
      color: #00ff88;
      font-size: 10px;
      max-width: 140px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .vault-del {
      background: none; border: none;
      color: rgba(255,60,60,0.5);
      font-family: monospace;
      cursor: pointer;
    }
    .ipfs-cid-list {
      width: 260px;
      max-height: 150px;
      overflow-y: auto;
    }
    .ipfs-cid {
      font-size: 10px;
      color: rgba(0,212,255,0.5);
      padding: 3px 0;
      border-bottom: 1px solid rgba(0,212,255,0.05);
    }
    .diag-btn {
      background: rgba(255,193,7,0.1) !important;
      border-color: rgba(255,193,7,0.3) !important;
      color: #ffc107 !important;
    }
    .diag-zone {
      width: 240px; height: 240px;
    }
    .diag-readout {
      display: flex; gap: 16px; margin-top: 6px;
    }
    .diag-row {
      display: flex; flex-direction: column; align-items: center; gap: 2px;
    }
    .diag-label {
      font-size: 8px; color: rgba(0,212,255,0.4); letter-spacing: 2px;
    }
    .diag-val {
      font-size: 16px; color: #00d4ff; font-weight: bold;
    }
    .diag-bar-container {
      width: 240px; height: 6px;
      background: rgba(0,212,255,0.1);
      border-radius: 3px; overflow: hidden;
      margin-top: 4px;
    }
    .diag-bar {
      height: 100%; border-radius: 3px;
      transition: width 0.15s, background 0.15s;
    }
    .scan-btn, .show-btn {
      background: rgba(0,212,255,0.1) !important;
      border-color: rgba(0,212,255,0.3) !important;
      color: #00d4ff !important;
    }
    .show-canvas {
      border: 1px solid rgba(0,212,255,0.15);
      border-radius: 4px;
      background: #000;
    }
    .scan-zone {
      position: relative;
      width: 200px; height: 200px;
      border: 1px solid rgba(0,212,255,0.3);
      border-radius: 8px;
      overflow: hidden;
    }
    .scan-video {
      width: 100%; height: 100%;
      object-fit: cover;
    }
    .scan-overlay {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      pointer-events: none;
    }
    .scan-crosshair {
      position: absolute;
      top: 50%; left: 50%;
      width: 40px; height: 40px;
      transform: translate(-50%, -50%);
      border: 1px solid rgba(0,255,136,0.4);
      border-radius: 50%;
      box-shadow: 0 0 12px rgba(0,255,136,0.2);
      pointer-events: none;
    }
    .evo-status {
      display: flex; align-items: center; gap: 12px;
      margin-top: 4px;
    }
    .evo-gen {
      font-size: 11px; color: #00ff88;
      letter-spacing: 2px; font-weight: bold;
    }
    .evo-params {
      font-size: 9px; color: rgba(0,212,255,0.4);
      letter-spacing: 1px;
    }
    .nego-status {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      height: 200px; gap: 20px;
    }
    .nego-pulse {
      width: 60px; height: 60px;
      border: 2px solid rgba(0,255,136,0.4);
      border-radius: 50%;
      animation: negoPulse 1.5s ease-in-out infinite;
    }
    @keyframes negoPulse {
      0%, 100% { transform: scale(1); opacity: 0.6; box-shadow: 0 0 10px rgba(0,255,136,0.2); }
      50% { transform: scale(1.3); opacity: 0.2; box-shadow: 0 0 30px rgba(0,255,136,0.4); }
    }
    .nego-text {
      font-size: 11px; color: rgba(0,255,136,0.6);
      text-align: center; letter-spacing: 1px;
      max-width: 220px; line-height: 1.4;
    }
    .scan-status {
      font-size: 10px;
      color: rgba(0,212,255,0.5);
      text-align: center;
    }
  `]
})
export class PairOverlayComponent implements AfterViewInit, OnDestroy {
  @Output() close = new EventEmitter<void>();
  @ViewChild('pairCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('scanVideo') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('scanCanvas') scanCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('showCanvas') showCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('diagVideo') diagVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('diagCanvas') diagCanvasRef!: ElementRef<HTMLCanvasElement>;

  activeTab = 'tunnel';
  passphrase = '';
  vaultLabel = '';
  vaultValue = '';
  revealedId = '';
  revealedValue = '';
  ipfsStatus = '';
  scanning = false;
  showing = false;
  scanStatus = 'point at satoshi shape...';
  showStatus = 'hold to evolve';
  scanThreshold = 250;
  scanMinDist = 10;
  scanDotReq = 2;
  evoGen = 0;
  negoState = '';  /* '', 'calling', 'waiting', 'scanning', 'asking', 'done' */
  negoLog = '';
  diagMode = false;
  diagRefs = 0;
  diagDataPts = 0;
  diagBrightness = 0;
  diagHumHz = 0;
  diagBarWidth = 0;
  diagBarColor = '#00d4ff';
  diagStatus = 'opening eyes...';
  private diagStream: MediaStream | null = null;
  private diagFrame: any = null;
  private diagOsc: OscillatorNode | null = null;
  private diagGain: GainNode | null = null;
  private diagSignalTimer: any = null;
  private revealTimer: any;
  private scanStream: MediaStream | null = null;
  private scanFrame: any = null;
  private scanAttempts = 0;
  private showEvolveTimer: any = null;
  private showGen = 0;
  private pollTimer: any = null;
  private geneCycleCount = 0; /* how many full gene cycles without match */
  /* Evolution phenotypes for display */
  private readonly showPhenos = [
    { r: 3, glow: 4, bg: 0, color: '#ffffff' },
    { r: 5, glow: 8, bg: 0, color: '#ffffff' },
    { r: 4, glow: 0, bg: 0, color: '#00ff88' },
    { r: 6, glow: 10, bg: 10, color: '#ffffff' },
    { r: 2, glow: 2, bg: 0, color: '#00d4ff' },
    { r: 4, glow: 6, bg: 5, color: '#ffff00' },
    { r: 7, glow: 12, bg: 0, color: '#ffffff' },
    { r: 3, glow: 0, bg: 15, color: '#ffffff' },
    { r: 5, glow: 4, bg: 0, color: '#ff00ff' },
    { r: 4, glow: 8, bg: 0, color: '#00ffaa' },
  ];
  /* Evolution genomes for scanner */
  private readonly scanGenes = [
    { t: 250, d: 10, req: 2 }, { t: 240, d: 12, req: 2 }, { t: 230, d: 15, req: 2 },
    { t: 220, d: 15, req: 2 }, { t: 210, d: 12, req: 2 }, { t: 200, d: 10, req: 2 },
    { t: 190, d: 15, req: 1 }, { t: 180, d: 18, req: 2 }, { t: 170, d: 20, req: 2 },
    { t: 160, d: 12, req: 1 }, { t: 150, d: 15, req: 1 }, { t: 140, d: 20, req: 2 },
    { t: 245, d: 8, req: 2 },  { t: 235, d: 10, req: 1 }, { t: 225, d: 18, req: 2 },
    { t: 215, d: 20, req: 1 }, { t: 205, d: 8, req: 2 },  { t: 195, d: 12, req: 2 },
    { t: 185, d: 15, req: 1 }, { t: 130, d: 20, req: 2 }, { t: 120, d: 25, req: 3 },
    { t: 110, d: 25, req: 3 }, { t: 100, d: 30, req: 3 },
  ];

  get isPaired(): boolean { return !!this.genome.get().pairKey; }

  constructor(
    public genome: GenomeService,
    private satoshi: SatoshiService,
    private sync: SyncService,
    private audio: AudioService
  ) {}

  ngAfterViewInit(): void {
    if (this.isPaired) {
      this.passphrase = this.genome.get().pairKey!;
      setTimeout(() => this.drawKey(), 100);
    }
  }

  showTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'tunnel') setTimeout(() => this.drawKey(), 50);
  }

  drawKey(): void {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;
    const points = this.satoshi.toPoints(this.passphrase, 70, 70, 55);
    const color = this.satoshi.getColor(this.passphrase);
    this.satoshi.draw(ctx, points, color, 140, 140);
  }

  doPair(): void {
    if (!this.passphrase) return;
    const g = this.genome.get();
    g.pairKey = this.passphrase;
    this.genome.save();
    this.audio.soundPair();
  }

  doUnpair(): void {
    const g = this.genome.get();
    g.pairKey = null;
    this.passphrase = '';
    this.genome.save();
    if (this.canvasRef) {
      const ctx = this.canvasRef.nativeElement.getContext('2d')!;
      ctx.clearRect(0, 0, 140, 140);
    }
  }

  vaultAdd(): void {
    if (!this.vaultLabel || !this.vaultValue || !this.isPaired) return;
    const g = this.genome.get();
    g.vault.push({
      id: 'v_' + Date.now().toString(36),
      label: this.vaultLabel,
      encrypted: this.satoshi.encrypt(this.vaultValue, g.pairKey!),
      created: Date.now()
    });
    this.genome.save();
    this.vaultLabel = '';
    this.vaultValue = '';
    this.audio.soundKnowledgeStored();
  }

  vaultReveal(id: string): void {
    if (!this.isPaired) return;
    if (this.revealedId === id) { this.revealedId = ''; return; }
    const entry = this.genome.get().vault.find(v => v.id === id);
    if (!entry) return;
    this.revealedId = id;
    this.revealedValue = this.satoshi.decrypt(entry.encrypted, this.genome.get().pairKey!);
    if (this.revealTimer) clearTimeout(this.revealTimer);
    this.revealTimer = setTimeout(() => { this.revealedId = ''; this.revealedValue = ''; }, 5000);
  }

  vaultDelete(id: string): void {
    const g = this.genome.get();
    g.vault = g.vault.filter(v => v.id !== id);
    this.genome.save();
  }

  async ipfsSave(): Promise<void> {
    const g = this.genome.get();
    const jwt = this.getPinataKey();
    if (!jwt) { this.ipfsStatus = 'add pinata key to vault first'; return; }
    this.ipfsStatus = 'saving mind...';

    const mind = {
      version: 1,
      type: 'alive_mind_snapshot',
      timestamp: Date.now(),
      creature: {
        name: g.name, birthDate: g.birthDate, generation: g.generation,
        age: this.genome.getAgeDays(),
        traits: g.traits, soundDNA: g.soundDNA, learnedSounds: g.learnedSounds,
        modePreferences: g.modePreferences, favMode: g.favMode,
        concepts: g.concepts.map(c => ({
          id: c.id, signature: c.signature, valence: c.valence,
          confidence: c.confidence, symbol: c.symbol, exposures: c.exposures
        })),
        memory: {
          totalVisits: g.memory.totalVisits, totalGreen: g.memory.totalGreen,
          totalRed: g.memory.totalRed, totalSongs: g.memory.totalSongs,
          longestStreak: g.memory.longestStreak, milestones: g.memory.milestones
        },
        knowledgeGraph: { nodeCount: g.knowledgeGraph.nodes.length, version: g.knowledgeGraph.version },
        patterns: g.patterns.length,
        memoryPalace: g.memoryPalace.length
      },
      meta: {
        pairId: g.pairKey ? this.satoshi.getColor(g.pairKey) : null,
        source: 'alive-boy-v1.0'
      }
    };

    let payload: any = mind;
    if (g.pairKey) {
      payload = {
        encrypted: true,
        data: this.satoshi.encrypt(JSON.stringify(mind), g.pairKey),
        color: this.satoshi.getColor(g.pairKey),
        timestamp: Date.now()
      };
    }

    try {
      const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + jwt
        },
        body: JSON.stringify({
          pinataContent: payload,
          pinataMetadata: { name: `alive-boy-gen${g.generation}-${Date.now()}` }
        })
      });
      const result = await res.json();
      if (result.IpfsHash) {
        g.ipfsCIDs.push({
          cid: result.IpfsHash,
          timestamp: Date.now(),
          generation: g.generation,
          encrypted: !!g.pairKey
        });
        if (g.ipfsCIDs.length > 64) g.ipfsCIDs = g.ipfsCIDs.slice(-64);
        this.genome.save();
        this.ipfsStatus = 'saved: ' + result.IpfsHash.substring(0, 16) + '...';
        this.audio.soundKnowledgeStored();
      } else {
        this.ipfsStatus = 'error: ' + (result.error || 'unknown');
      }
    } catch (e: any) {
      this.ipfsStatus = 'network error';
    }
  }

  async ipfsLoad(): Promise<void> {
    const cid = prompt('Enter IPFS CID:');
    if (!cid) return;
    this.ipfsStatus = 'loading...';
    try {
      const res = await fetch('https://gateway.pinata.cloud/ipfs/' + cid);
      const data = await res.json();
      if (data.encrypted && this.genome.get().pairKey) {
        const json = this.satoshi.decrypt(data.data, this.genome.get().pairKey!);
        const mind = JSON.parse(json);
        this.ipfsStatus = 'loaded: ' + (mind.creature?.name || 'unnamed') + ' gen ' + (mind.creature?.generation || '?');
      } else if (!data.encrypted) {
        this.ipfsStatus = 'loaded: ' + (data.creature?.name || 'unnamed') + ' gen ' + (data.creature?.generation || '?');
      } else {
        this.ipfsStatus = 'encrypted — need pair key';
      }
    } catch {
      this.ipfsStatus = 'load failed';
    }
  }

  showForScan(): void {
    if (!this.isPaired) return;
    this.showing = true;
    this.showGen = 0;
    this.showStatus = 'hold to evolve';
    setTimeout(() => this.drawShowDots(this.showPhenos[0]), 50);
  }

  stopShow(): void {
    this.showEvolveStop();
    this.showing = false;
  }

  showEvolveStart(): void {
    if (this.showEvolveTimer) return;
    this.showStatus = 'evolving...';
    this.showEvolveTimer = setInterval(() => {
      this.showGen = (this.showGen + 1) % this.showPhenos.length;
      this.showStatus = 'GEN ' + this.showGen + ' — evolving...';
      this.drawShowDots(this.showPhenos[this.showGen]);
    }, 600);
  }

  showEvolveStop(): void {
    if (this.showEvolveTimer) {
      clearInterval(this.showEvolveTimer);
      this.showEvolveTimer = null;
      this.showStatus = 'locked GEN ' + this.showGen;
    }
  }

  private drawShowDots(pheno: { r: number; glow: number; bg: number; color: string }): void {
    if (!this.showCanvasRef) return;
    const canvas = this.showCanvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;
    const key = this.genome.get().pairKey!;
    const points = this.satoshi.toPoints(key, 150, 150, 120);
    this.satoshi.drawDots(ctx, points, 300, 300, 150, 150, 120, pheno);
  }

  ngOnDestroy(): void {
    this.stopScan();
    this.stopDiag();
    this.showEvolveStop();
  }

  async startScan(): Promise<void> {
    this.scanning = true;
    this.scanAttempts = 0;
    this.evoGen = 0;
    this.geneCycleCount = 0;
    this.applyGene(0);

    /* Phase 1: Send HELLO signal — "I'm here, can you hear me?" */
    this.negoState = 'calling';
    this.negoLog = 'calling out...';
    this.scanStatus = 'signaling partner...';
    this.audio.soundHello();
    await this.sync.sendSignal('HELLO');

    /* Phase 2: Poll for READY — "waiting for her to respond" */
    this.negoState = 'waiting';
    this.negoLog = 'waiting for response...';
    this.scanStatus = 'listening...';
    this.startNegoPoll();
  }

  stopScan(): void {
    this.scanning = false;
    this.negoState = '';
    if (this.scanFrame) { cancelAnimationFrame(this.scanFrame); this.scanFrame = null; }
    if (this.scanStream) { this.scanStream.getTracks().forEach(t => t.stop()); this.scanStream = null; }
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
  }

  private startNegoPoll(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
    let pollCount = 0;
    this.pollTimer = setInterval(async () => {
      if (!this.scanning) { clearInterval(this.pollTimer); return; }
      pollCount++;
      const sig = await this.sync.pollSignal();

      if (sig) {
        switch (sig.sig) {
          case 'READY':
            /* She's showing her shape — start camera */
            this.audio.soundPartnerReady();
            this.negoState = 'scanning';
            this.negoLog = '';
            this.scanStatus = 'she\'s ready — opening eyes...';
            clearInterval(this.pollTimer);
            this.pollTimer = null;
            setTimeout(() => this.startCamera(), 300);
            break;

          case 'CHANGED':
            /* She changed her display — restart gene cycle */
            this.audio.soundPartnerChanged();
            this.evoGen = 0;
            this.scanAttempts = 0;
            this.geneCycleCount = 0;
            this.applyGene(0);
            this.scanStatus = 'she changed — retrying...';
            this.sync.sendSignal('CYCLING');
            this.audio.soundCycling();
            break;
        }
      }

      /* Re-send HELLO every 10 polls if still waiting */
      if (this.negoState === 'waiting' && pollCount % 10 === 0) {
        this.audio.soundHello();
        await this.sync.sendSignal('HELLO');
        this.negoLog = 'calling again...';
      }

      /* Timeout after 60 polls (~2 min) — fall back to direct scan */
      if (this.negoState === 'waiting' && pollCount >= 60) {
        this.negoState = 'scanning';
        this.negoLog = '';
        this.scanStatus = 'no response — scanning anyway...';
        clearInterval(this.pollTimer);
        this.pollTimer = null;
        this.startCamera();
      }
    }, 2000);
  }

  private async startCamera(): Promise<void> {
    try {
      this.scanStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 320, height: 320 }
      });
      this.sync.sendSignal('CYCLING');
      this.audio.soundCycling();
      setTimeout(() => {
        if (this.videoRef && this.scanStream) {
          const video = this.videoRef.nativeElement;
          video.srcObject = this.scanStream;
          video.onloadedmetadata = () => {
            this.scanStatus = 'evolving eyes...';
            /* Start polling for signals during scan too */
            this.startScanPoll();
            this.scanLoop();
          };
        }
      }, 100);
    } catch (e: any) {
      this.scanStatus = 'camera: ' + (e.message || String(e));
      this.scanning = false;
    }
  }

  /* Poll during active scanning for CHANGED signals */
  private startScanPoll(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = setInterval(async () => {
      if (!this.scanning) { clearInterval(this.pollTimer); return; }
      const sig = await this.sync.pollSignal();
      if (sig && sig.sig === 'CHANGED') {
        this.audio.soundPartnerChanged();
        this.evoGen = 0;
        this.scanAttempts = 0;
        this.geneCycleCount = 0;
        this.applyGene(0);
        this.scanStatus = 'she changed — gen 0...';
        this.sync.sendSignal('CYCLING');
        this.audio.soundCycling();
      }
    }, 3000);
  }

  private applyGene(idx: number): void {
    const gene = this.scanGenes[idx % this.scanGenes.length];
    this.scanThreshold = gene.t;
    this.scanMinDist = gene.d;
    this.scanDotReq = gene.req;
  }

  private scanLoop(): void {
    if (!this.scanning || !this.videoRef || !this.scanCanvasRef) return;
    const video = this.videoRef.nativeElement;
    const canvas = this.scanCanvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;
    canvas.width = video.videoWidth || 200;
    canvas.height = video.videoHeight || 200;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const framed = this.satoshi.detectWithFrame(imageData, this.scanThreshold, this.scanMinDist, this.scanDotReq);

    this.scanAttempts++;

    /* Evolve every 20 frames */
    if (this.scanAttempts % 20 === 0) {
      this.evoGen++;
      this.applyGene(this.evoGen);

      /* Full gene cycle completed — ask her to change display */
      if (this.evoGen % this.scanGenes.length === 0) {
        this.geneCycleCount++;
        this.audio.soundCantSee();
        this.scanStatus = 'can\'t see — asking her to change...';
        this.sync.sendSignal('CANT_SEE', { cyclesDone: this.geneCycleCount });
      }
    }

    if (framed && framed.dataPoints.length >= 2) {
      const recovered = this.satoshi.fromPoints(framed.dataPoints, framed.cx, framed.cy, framed.maxR);
      if (recovered && recovered.length >= 2) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const color = this.satoshi.getColor(recovered);
        this.satoshi.draw(ctx, framed.dataPoints, color, canvas.width, canvas.height);

        this.passphrase = recovered;
        const g = this.genome.get();
        g.pairKey = recovered;
        /* Store winning combo for next time */
        g.scanMemory = { gene: this.evoGen % this.scanGenes.length, geneCycles: this.geneCycleCount };
        this.genome.save();
        this.audio.soundPair();
        this.scanStatus = 'PAIRED at gen ' + this.evoGen + '!';
        this.sync.sendSignal('PAIRED', { gen: this.evoGen });
        this.negoState = 'done';
        setTimeout(() => this.stopScan(), 1200);
        return;
      }
      this.scanStatus = 'gen ' + this.evoGen + ' — frame:' + framed.dataPoints.length + ' pts';
    } else {
      this.scanStatus = 'gen ' + this.evoGen + ' — seeking frame...';
    }

    this.scanFrame = requestAnimationFrame(() => this.scanLoop());
  }

  /* ═══ DIAGNOSTIC MODE — He sees, he hums ═══ */

  async startDiag(): Promise<void> {
    this.diagMode = true;
    this.diagStatus = 'opening eyes...';
    this.diagRefs = 0;
    this.diagDataPts = 0;
    this.diagBrightness = 0;
    this.diagHumHz = 0;

    /* Create continuous hum oscillator */
    const ctx = this.audio['ensureContext']();
    this.diagOsc = ctx.createOscillator();
    this.diagGain = ctx.createGain();
    this.diagOsc.type = 'sine';
    this.diagOsc.frequency.value = 100;
    this.diagGain.gain.value = 0;
    this.diagOsc.connect(this.diagGain);
    this.diagGain.connect(ctx.destination);
    this.diagOsc.start();

    /* Signal Girl we're in DIAG mode */
    this.sync.sendSignal('DIAG_START');

    /* Send diagnostic data to Girl every 3s */
    this.diagSignalTimer = setInterval(() => {
      this.sync.sendSignal('DIAG_DATA', {
        refs: this.diagRefs,
        data: this.diagDataPts,
        brt: this.diagBrightness,
        hz: this.diagHumHz
      });
    }, 3000);

    try {
      this.diagStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 320, height: 320 }
      });
      setTimeout(() => {
        if (this.diagVideoRef && this.diagStream) {
          const video = this.diagVideoRef.nativeElement;
          video.srcObject = this.diagStream;
          video.onloadedmetadata = () => {
            this.diagStatus = 'seeing...';
            this.diagLoop();
          };
        }
      }, 100);
    } catch (e: any) {
      this.diagStatus = 'camera: ' + (e.message || String(e));
      this.stopDiag();
    }
  }

  stopDiag(): void {
    this.diagMode = false;
    if (this.diagFrame) { cancelAnimationFrame(this.diagFrame); this.diagFrame = null; }
    if (this.diagStream) { this.diagStream.getTracks().forEach(t => t.stop()); this.diagStream = null; }
    if (this.diagOsc) { try { this.diagOsc.stop(); } catch {} this.diagOsc = null; }
    if (this.diagGain) { this.diagGain = null; }
    if (this.diagSignalTimer) { clearInterval(this.diagSignalTimer); this.diagSignalTimer = null; }
    this.sync.sendSignal('DIAG_STOP');
  }

  private diagLoop(): void {
    if (!this.diagMode || !this.diagVideoRef || !this.diagCanvasRef) return;
    const video = this.diagVideoRef.nativeElement;
    const canvas = this.diagCanvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;
    canvas.width = video.videoWidth || 240;
    canvas.height = video.videoHeight || 240;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    /* Scan for everything at a generous threshold */
    const framed = this.satoshi.detectWithFrame(imageData, 180, 15, 1);

    /* Draw diagnostic overlay */
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 0.6;

    if (framed) {
      this.diagRefs = 0;
      /* Count and mark reference dots (red circles) */
      /* We can approximate by re-scanning for red clusters */
      const data = imageData.data;
      const w = imageData.width, h = imageData.height;
      let redCount = 0;
      let totalBrt = 0;
      let brtSamples = 0;

      /* Simplified: count dominant colors across the image */
      for (let y = 0; y < h; y += 4) {
        for (let x = 0; x < w; x += 4) {
          const idx = (y * w + x) * 4;
          const r = data[idx], g = data[idx + 1], b = data[idx + 2];
          const brt = (r + g + b) / 3;
          if (brt > 80) { totalBrt += brt; brtSamples++; }
          if (r > 120 && r > g * 2 && r > b * 2) redCount++;
        }
      }

      this.diagRefs = Math.min(4, Math.round(redCount / 8)); /* approximate ref dot count */
      this.diagDataPts = framed.dataPoints.length;
      this.diagBrightness = brtSamples > 0 ? Math.round(totalBrt / brtSamples) : 0;

      /* Draw detected data points as green circles */
      for (const p of framed.dataPoints) {
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      /* Draw center cross */
      ctx.strokeStyle = 'rgba(255,193,7,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(framed.cx - 15, framed.cy);
      ctx.lineTo(framed.cx + 15, framed.cy);
      ctx.moveTo(framed.cx, framed.cy - 15);
      ctx.lineTo(framed.cx, framed.cy + 15);
      ctx.stroke();

      /* Draw reference ring */
      ctx.strokeStyle = 'rgba(255,0,0,0.4)';
      ctx.beginPath();
      ctx.arc(framed.cx, framed.cy, framed.maxR, 0, Math.PI * 2);
      ctx.stroke();

      /* Map to hum frequency:
         - Base: 100Hz (nothing) to 800Hz (lots of clear data)
         - refs contribute 0-200Hz
         - data points contribute 0-400Hz
         - brightness modulates +-100Hz */
      const refHz = Math.min(this.diagRefs, 4) * 50;  /* 0-200 */
      const dataHz = Math.min(this.diagDataPts, 20) * 20;  /* 0-400 */
      const brtMod = ((this.diagBrightness - 128) / 128) * 100; /* -100 to +100 */
      const targetHz = 100 + refHz + dataHz + brtMod;
      this.diagHumHz = Math.round(Math.max(80, Math.min(900, targetHz)));

      /* Update hum bar */
      this.diagBarWidth = Math.min(100, (this.diagHumHz / 900) * 100);
      this.diagBarColor = this.diagRefs >= 3 ? '#00ff88' : this.diagRefs >= 1 ? '#ffc107' : '#ff3c3c';

      /* Status */
      if (this.diagRefs >= 3 && this.diagDataPts >= 2) {
        this.diagStatus = 'clear signal — ' + this.diagDataPts + ' data dots';
      } else if (this.diagRefs >= 1) {
        this.diagStatus = 'partial frame — ' + this.diagRefs + ' refs';
      } else {
        this.diagStatus = 'no frame detected';
      }

    } else {
      this.diagRefs = 0;
      this.diagDataPts = 0;
      this.diagBrightness = 0;
      this.diagHumHz = 80;
      this.diagBarWidth = 5;
      this.diagBarColor = '#ff3c3c';
      this.diagStatus = 'nothing visible';
    }

    ctx.globalAlpha = 1;

    /* Update continuous hum */
    if (this.diagOsc && this.diagGain) {
      const actx = this.diagOsc.context as AudioContext;
      this.diagOsc.frequency.linearRampToValueAtTime(this.diagHumHz, actx.currentTime + 0.1);
      /* Volume based on data quality: silent when nothing, louder with more data */
      const vol = this.diagDataPts > 0 ? Math.min(0.15, 0.03 + this.diagDataPts * 0.008) : 0.01;
      this.diagGain.gain.linearRampToValueAtTime(vol, actx.currentTime + 0.1);
    }

    this.diagFrame = requestAnimationFrame(() => this.diagLoop());
  }

  private getPinataKey(): string | null {
    const g = this.genome.get();
    if (!g.pairKey) return null;
    const entry = g.vault.find(v => v.label.toLowerCase() === 'pinata' || v.label.toLowerCase() === 'ipfs');
    if (!entry) return null;
    return this.satoshi.decrypt(entry.encrypted, g.pairKey);
  }
}
