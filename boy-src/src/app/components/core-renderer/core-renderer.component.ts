/* ALIVE Boy — Core Renderer
   Canvas 2D — rotating wireframe icosahedron, neural network nodes, data streams */

import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, Input } from '@angular/core';

interface GridNode {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  hue: number;
  pulse: number;
  type: string;
}

interface GridEdge {
  a: number; b: number;
  alpha: number;
}

interface DataStream {
  y: number;
  speed: number;
  alpha: number;
  segments: { x: number; w: number; bright: number }[];
}

interface IcoVertex {
  x: number; y: number; z: number;
}

@Component({
  selector: 'boy-core-renderer',
  standalone: true,
  template: `<canvas #canvas></canvas>`,
  styles: [`
    canvas {
      position: fixed; inset: 0;
      width: 100%; height: 100%;
      background: #0a0e1a;
    }
  `]
})
export class CoreRendererComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() mood: 'neutral' | 'green' | 'red' = 'neutral';
  @Input() moodX = 0;
  @Input() moodY = 0;
  @Input() sleeping = false;
  @Input() primaryHue = 180;
  @Input() accentHue = 120;
  @Input() gridOpacity = 0.08;
  @Input() speedMod = 1.0;

  private ctx!: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private animFrame = 0;
  private nodes: GridNode[] = [];
  private edges: GridEdge[] = [];
  private streams: DataStream[] = [];
  private icoVerts: IcoVertex[] = [];
  private icoEdges: [number, number][] = [];
  private rotation = 0;
  private coreBreath = 0;
  private moodColor = { r: 0, g: 212, b: 255 };
  private targetColor = { r: 0, g: 212, b: 255 };
  private knowledgeFlashes: { x: number; y: number; age: number; color: string }[] = [];

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initIcosahedron();
    this.initNodes();
    this.initStreams();
    this.tick();
  }

  ngOnDestroy(): void {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
  }

  flashKnowledge(color: string = '#ffc107'): void {
    const cx = this.w / 2;
    const cy = this.h / 2;
    this.knowledgeFlashes.push({ x: cx, y: cy, age: 0, color });
  }

  private resize(): void {
    const canvas = this.canvasRef.nativeElement;
    const dpr = window.devicePixelRatio || 1;
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    canvas.width = this.w * dpr;
    canvas.height = this.h * dpr;
    canvas.style.width = this.w + 'px';
    canvas.style.height = this.h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private initIcosahedron(): void {
    const phi = (1 + Math.sqrt(5)) / 2;
    const raw: [number, number, number][] = [
      [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
      [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
      [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
    ];
    const len = Math.sqrt(1 + phi * phi);
    this.icoVerts = raw.map(([x, y, z]) => ({ x: x / len, y: y / len, z: z / len }));
    this.icoEdges = [
      [0, 11], [0, 5], [0, 1], [0, 7], [0, 10],
      [1, 5], [5, 11], [11, 10], [10, 7], [7, 1],
      [3, 9], [3, 4], [3, 2], [3, 6], [3, 8],
      [4, 9], [2, 4], [6, 2], [8, 6], [9, 8],
      [4, 5], [2, 11], [6, 10], [8, 7], [9, 1],
      [4, 11], [2, 10], [6, 7], [8, 1], [9, 5]
    ];
  }

  private initNodes(): void {
    this.nodes = [];
    this.edges = [];
    const count = 16;
    for (let i = 0; i < count; i++) {
      this.nodes.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: 3 + Math.random() * 5,
        hue: this.primaryHue + (Math.random() - 0.5) * 30,
        pulse: Math.random() * Math.PI * 2,
        type: ['concept', 'pattern', 'sync', 'event'][Math.floor(Math.random() * 4)]
      });
    }
    // Connect nearby nodes
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const dx = this.nodes[i].x - this.nodes[j].x;
        const dy = this.nodes[i].y - this.nodes[j].y;
        if (Math.sqrt(dx * dx + dy * dy) < Math.min(this.w, this.h) * 0.4) {
          this.edges.push({ a: i, b: j, alpha: 0.1 + Math.random() * 0.1 });
        }
      }
    }
  }

  private initStreams(): void {
    this.streams = [];
    for (let i = 0; i < 8; i++) {
      const segments: { x: number; w: number; bright: number }[] = [];
      for (let s = 0; s < 6; s++) {
        segments.push({
          x: Math.random() * this.w,
          w: 20 + Math.random() * 80,
          bright: 0.3 + Math.random() * 0.7
        });
      }
      this.streams.push({
        y: Math.random() * this.h,
        speed: 0.3 + Math.random() * 0.7,
        alpha: 0.03 + Math.random() * 0.05,
        segments
      });
    }
  }

  private tick = (): void => {
    this.ctx.clearRect(0, 0, this.w, this.h);
    this.ctx.fillStyle = '#0a0e1a';
    this.ctx.fillRect(0, 0, this.w, this.h);

    const sleepAlpha = this.sleeping ? 0.3 : 1.0;
    this.rotation += 0.003 * this.speedMod;
    this.coreBreath += 0.02;

    // Mood color lerp
    if (this.mood === 'green') {
      this.targetColor = { r: 0, g: 255, b: 136 };
    } else if (this.mood === 'red') {
      this.targetColor = { r: 255, g: 60, b: 60 };
    } else {
      this.targetColor = { r: 0, g: 212, b: 255 };
    }
    this.moodColor.r += (this.targetColor.r - this.moodColor.r) * 0.05;
    this.moodColor.g += (this.targetColor.g - this.moodColor.g) * 0.05;
    this.moodColor.b += (this.targetColor.b - this.moodColor.b) * 0.05;

    this.drawGrid(sleepAlpha);
    this.drawStreams(sleepAlpha);
    this.drawEdges(sleepAlpha);
    this.drawNodes(sleepAlpha);
    this.drawCore(sleepAlpha);
    this.drawFlashes();
    this.updateNodes();

    this.animFrame = requestAnimationFrame(this.tick);
  };

  private drawGrid(alpha: number): void {
    const ctx = this.ctx;
    ctx.strokeStyle = `rgba(0,212,255,${this.gridOpacity * alpha})`;
    ctx.lineWidth = 0.5;
    const gap = 60;
    for (let x = 0; x < this.w; x += gap) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.h); ctx.stroke();
    }
    for (let y = 0; y < this.h; y += gap) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.w, y); ctx.stroke();
    }
  }

  private drawStreams(alpha: number): void {
    const ctx = this.ctx;
    for (const s of this.streams) {
      for (const seg of s.segments) {
        seg.x += s.speed * this.speedMod;
        if (seg.x > this.w + 100) seg.x = -seg.w;
        ctx.fillStyle = `rgba(${Math.round(this.moodColor.r)},${Math.round(this.moodColor.g)},${Math.round(this.moodColor.b)},${s.alpha * seg.bright * alpha})`;
        ctx.fillRect(seg.x, s.y, seg.w, 1);
      }
    }
  }

  private drawEdges(alpha: number): void {
    const ctx = this.ctx;
    for (const e of this.edges) {
      const a = this.nodes[e.a];
      const b = this.nodes[e.b];
      if (!a || !b) continue;
      ctx.strokeStyle = `rgba(${Math.round(this.moodColor.r)},${Math.round(this.moodColor.g)},${Math.round(this.moodColor.b)},${e.alpha * alpha})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }

  private drawNodes(alpha: number): void {
    const ctx = this.ctx;
    for (const n of this.nodes) {
      n.pulse += 0.02;
      const pulseSize = n.size + Math.sin(n.pulse) * 1.5;
      const hsl = `hsla(${n.hue},80%,60%,${0.6 * alpha})`;
      ctx.fillStyle = hsl;
      ctx.shadowColor = hsl;
      ctx.shadowBlur = 6;

      // Diamond shape for Boy nodes
      ctx.beginPath();
      ctx.moveTo(n.x, n.y - pulseSize);
      ctx.lineTo(n.x + pulseSize * 0.7, n.y);
      ctx.lineTo(n.x, n.y + pulseSize);
      ctx.lineTo(n.x - pulseSize * 0.7, n.y);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  private updateNodes(): void {
    for (const n of this.nodes) {
      // Mood interaction
      if (this.mood === 'green' && this.moodX && this.moodY) {
        const dx = this.moodX - n.x;
        const dy = this.moodY - n.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 10 && dist < 300) {
          n.vx += (dx / dist) * 0.02;
          n.vy += (dy / dist) * 0.02;
        }
      } else if (this.mood === 'red' && this.moodX && this.moodY) {
        const dx = n.x - this.moodX;
        const dy = n.y - this.moodY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 10 && dist < 300) {
          n.vx += (dx / dist) * 0.03;
          n.vy += (dy / dist) * 0.03;
        }
      }

      n.x += n.vx * this.speedMod;
      n.y += n.vy * this.speedMod;
      n.vx *= 0.98;
      n.vy *= 0.98;

      // Wrap around
      if (n.x < -20) n.x = this.w + 20;
      if (n.x > this.w + 20) n.x = -20;
      if (n.y < -20) n.y = this.h + 20;
      if (n.y > this.h + 20) n.y = -20;
    }
  }

  private drawCore(alpha: number): void {
    const ctx = this.ctx;
    const cx = this.w / 2;
    const cy = this.h / 2;
    const baseR = 35 + Math.sin(this.coreBreath) * 5;

    // Glow
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 2.5);
    grd.addColorStop(0, `rgba(${Math.round(this.moodColor.r)},${Math.round(this.moodColor.g)},${Math.round(this.moodColor.b)},${0.12 * alpha})`);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(cx - baseR * 3, cy - baseR * 3, baseR * 6, baseR * 6);

    // Wireframe icosahedron
    const sinR = Math.sin(this.rotation);
    const cosR = Math.cos(this.rotation);
    const sinP = Math.sin(this.rotation * 0.7);
    const cosP = Math.cos(this.rotation * 0.7);

    const projected = this.icoVerts.map(v => {
      // Rotate Y
      let x = v.x * cosR + v.z * sinR;
      let z = -v.x * sinR + v.z * cosR;
      let y = v.y;
      // Rotate X
      const y2 = y * cosP - z * sinP;
      const z2 = y * sinP + z * cosP;
      return {
        x: cx + x * baseR,
        y: cy + y2 * baseR,
        z: z2
      };
    });

    ctx.strokeStyle = `rgba(${Math.round(this.moodColor.r)},${Math.round(this.moodColor.g)},${Math.round(this.moodColor.b)},${0.5 * alpha})`;
    ctx.lineWidth = 1;
    ctx.shadowColor = `rgb(${Math.round(this.moodColor.r)},${Math.round(this.moodColor.g)},${Math.round(this.moodColor.b)})`;
    ctx.shadowBlur = 8;
    for (const [a, b] of this.icoEdges) {
      const pa = projected[a];
      const pb = projected[b];
      const avgZ = (pa.z + pb.z) / 2;
      ctx.globalAlpha = Math.max(0.15, (avgZ + 1) / 2) * alpha;
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Vertex dots
    for (const p of projected) {
      const a2 = Math.max(0.2, (p.z + 1) / 2) * alpha;
      ctx.fillStyle = `rgba(${Math.round(this.moodColor.r)},${Math.round(this.moodColor.g)},${Math.round(this.moodColor.b)},${a2})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawFlashes(): void {
    const ctx = this.ctx;
    for (let i = this.knowledgeFlashes.length - 1; i >= 0; i--) {
      const f = this.knowledgeFlashes[i];
      f.age++;
      const maxAge = 40;
      if (f.age > maxAge) {
        this.knowledgeFlashes.splice(i, 1);
        continue;
      }
      const progress = f.age / maxAge;
      const radius = progress * Math.min(this.w, this.h) * 0.4;
      const alpha = (1 - progress) * 0.3;
      ctx.strokeStyle = f.color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(f.x, f.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}
