/* ALIVE Boy — Satoshi Encryption Service
   Exact byte-identical port of Girl's Vigenere cipher on ASCII 32-126 */

import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SatoshiService {
  private readonly MAX = 95;
  private readonly BASE = 32;

  charToVal(c: string): number {
    const code = c.charCodeAt(0);
    if (code < 32 || code > 126) return -1;
    return code - this.BASE + 1;
  }

  valToChar(v: number): string {
    if (v < 1 || v > this.MAX) return '?';
    return String.fromCharCode(v + this.BASE - 1);
  }

  encrypt(text: string, password: string): string {
    if (!password || !text) return text;
    const passVals = Array.from(password).map(c => {
      const pv = this.charToVal(c);
      return pv < 1 ? 1 : pv;
    });
    return Array.from(text).map((ch, i) => {
      const v = this.charToVal(ch);
      if (v < 1) return ch;
      const shifted = ((v - 1 + passVals[i % passVals.length]) % this.MAX) + 1;
      return this.valToChar(shifted);
    }).join('');
  }

  decrypt(text: string, password: string): string {
    if (!password || !text) return text;
    const passVals = Array.from(password).map(c => {
      const pv = this.charToVal(c);
      return pv < 1 ? 1 : pv;
    });
    return Array.from(text).map((ch, i) => {
      const v = this.charToVal(ch);
      if (v < 1) return ch;
      const shifted = ((v - 1 - passVals[i % passVals.length] + this.MAX * 2) % this.MAX) + 1;
      return this.valToChar(shifted);
    }).join('');
  }

  toPoints(text: string, cx: number, cy: number, maxR: number): { x: number; y: number }[] {
    if (!text) return [];
    const points: { x: number; y: number }[] = [];
    const len = text.length;
    for (let i = 0; i < len; i++) {
      const v = this.charToVal(text[i]);
      if (v < 1) continue;
      const angle = (i * 2 * Math.PI / len) + (v * 2 * Math.PI / this.MAX);
      const radius = (v / this.MAX) * maxR;
      points.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius
      });
    }
    return points;
  }

  /* Reverse: polygon points → passphrase */
  fromPoints(points: { x: number; y: number }[], cx: number, cy: number, maxR: number): string {
    if (!points || points.length < 1) return '';
    const len = points.length;
    const chars: { i: number; char: string }[] = [];
    for (const p of points) {
      const dx = p.x - cx;
      const dy = p.y - cy;
      const radius = Math.sqrt(dx * dx + dy * dy);
      const v = Math.round((radius / maxR) * this.MAX);
      if (v < 1 || v > this.MAX) continue;
      let angle = Math.atan2(dy, dx);
      if (angle < 0) angle += 2 * Math.PI;
      /* Solve for i: angle = (i * 2π / len) + (v * 2π / MAX) */
      let rawI = (angle - (v * 2 * Math.PI / this.MAX)) * len / (2 * Math.PI);
      /* Normalize to [0, len) */
      rawI = ((rawI % len) + len) % len;
      const i = Math.round(rawI);
      chars.push({ i: i % len, char: this.valToChar(v) });
    }
    /* Sort by position and build string */
    chars.sort((a, b) => a.i - b.i);
    return chars.map(c => c.char).join('');
  }

  /* Detect bright dot vertices from camera frame */
  detectPoints(imageData: ImageData, cx: number, cy: number, threshold = 220, minDist = 15, minCount = 2): { x: number; y: number }[] {
    const data = imageData.data;
    const w = imageData.width;
    const h = imageData.height;
    const bright: { x: number; y: number; b: number }[] = [];

    /* Find bright pixels */
    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        const idx = (y * w + x) * 4;
        const r = data[idx], g = data[idx + 1], b = data[idx + 2];
        const brightness = (r + g + b) / 3;
        if (brightness > threshold) {
          bright.push({ x, y, b: brightness });
        }
      }
    }

    /* Cluster nearby bright pixels into centroids */
    const clusters: { sx: number; sy: number; sb: number; count: number }[] = [];
    for (const p of bright) {
      let found = false;
      for (const c of clusters) {
        const dx = p.x - c.sx / c.count;
        const dy = p.y - c.sy / c.count;
        if (Math.sqrt(dx * dx + dy * dy) < minDist) {
          c.sx += p.x;
          c.sy += p.y;
          c.sb += p.b;
          c.count++;
          found = true;
          break;
        }
      }
      if (!found) {
        clusters.push({ sx: p.x, sy: p.y, sb: p.b, count: 1 });
      }
    }

    /* Filter: need at least 2 pixels per cluster, sort by brightness, take top 30 max */
    return clusters
      .filter(c => c.count >= minCount)
      .sort((a, b) => (b.sb / b.count) - (a.sb / a.count))
      .slice(0, 30)
      .map(c => ({ x: c.sx / c.count, y: c.sy / c.count }));
  }

  getColor(text: string): string {
    if (!text || text.length === 0) return '#00d4ff';
    const c = text[0];
    if (c >= 'A' && c <= 'Z') return '#ff00ff';
    if (c >= 'a' && c <= 'z') return '#00ffff';
    if (c >= '0' && c <= '9') return '#ffff00';
    return '#ff8800';
  }

  draw(ctx: CanvasRenderingContext2D, points: { x: number; y: number }[], color: string, w: number, h: number): void {
    ctx.clearRect(0, 0, w, h);
    if (points.length < 2) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.shadowBlur = 0;
    for (const p of points) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* Scan-friendly: bright dots on black with 4 cardinal reference markers */
  drawDots(ctx: CanvasRenderingContext2D, points: { x: number; y: number }[],
           w: number, h: number, cx?: number, cy?: number, maxR?: number,
           pheno?: { r: number; glow: number; bg: number; color: string }): void {
    const _cx = cx ?? w / 2;
    const _cy = cy ?? h / 2;
    const _maxR = maxR ?? Math.min(_cx, _cy) * 0.8;
    const dotR = pheno?.r ?? 4;
    const glow = pheno?.glow ?? 6;
    const bg = pheno?.bg ?? 0;
    const color = pheno?.color ?? '#ffffff';

    ctx.fillStyle = `rgb(${bg},${bg},${bg})`;
    ctx.fillRect(0, 0, w, h);

    /* Dim reference ring */
    ctx.strokeStyle = 'rgba(255,0,0,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(_cx, _cy, _maxR, 0, Math.PI * 2);
    ctx.stroke();

    /* 4 cardinal reference dots — RED, larger */
    const refs = [
      { x: _cx, y: _cy - _maxR },         /* top */
      { x: _cx + _maxR, y: _cy },         /* right */
      { x: _cx, y: _cy + _maxR },         /* bottom */
      { x: _cx - _maxR, y: _cy }          /* left */
    ];
    for (const r of refs) {
      ctx.fillStyle = '#ff0000';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    /* Data dots */
    if (points.length < 1) return;
    for (const p of points) {
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  /* Scanner: find 4 red reference dots, derive center + radius, then read data dots */
  detectWithFrame(imageData: ImageData, threshold = 220, minDist = 15, minCount = 2):
    { cx: number; cy: number; maxR: number; dataPoints: { x: number; y: number }[] } | null {
    const data = imageData.data;
    const w = imageData.width;
    const h = imageData.height;

    /* Separate red-dominant vs white/other bright pixels */
    const redPts: { x: number; y: number; b: number }[] = [];
    const dataPts: { x: number; y: number; b: number }[] = [];

    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        const idx = (y * w + x) * 4;
        const r = data[idx], g = data[idx + 1], b = data[idx + 2];
        const brightness = (r + g + b) / 3;
        if (brightness < threshold * 0.5) continue;
        /* Red-dominant: R is high, G and B are low */
        if (r > 120 && r > g * 2 && r > b * 2) {
          redPts.push({ x, y, b: r });
        } else if (brightness > threshold) {
          dataPts.push({ x, y, b: brightness });
        }
      }
    }

    /* Cluster red points into reference dots */
    const refClusters = this.clusterPoints(redPts, 20);
    if (refClusters.length < 3) return null;  /* Need at least 3 of 4 refs */

    /* Find center = average of reference dots */
    let scx = 0, scy = 0;
    for (const c of refClusters) { scx += c.x; scy += c.y; }
    const cx = scx / refClusters.length;
    const cy = scy / refClusters.length;

    /* maxR = average distance from center to reference dots */
    let totalR = 0;
    for (const c of refClusters) {
      totalR += Math.sqrt((c.x - cx) ** 2 + (c.y - cy) ** 2);
    }
    const maxR = totalR / refClusters.length;
    if (maxR < 10) return null;

    /* Cluster data points */
    const dataPoints = this.clusterPoints(dataPts, minDist)
      .filter(p => {
        /* Only keep points inside the reference ring */
        const d = Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2);
        return d < maxR * 1.1;
      });

    return { cx, cy, maxR, dataPoints };
  }

  private clusterPoints(pts: { x: number; y: number; b: number }[], minDist: number):
    { x: number; y: number }[] {
    const clusters: { sx: number; sy: number; sb: number; count: number }[] = [];
    for (const p of pts) {
      let found = false;
      for (const c of clusters) {
        const dx = p.x - c.sx / c.count;
        const dy = p.y - c.sy / c.count;
        if (Math.sqrt(dx * dx + dy * dy) < minDist) {
          c.sx += p.x; c.sy += p.y; c.sb += p.b; c.count++;
          found = true; break;
        }
      }
      if (!found) clusters.push({ sx: p.x, sy: p.y, sb: p.b, count: 1 });
    }
    return clusters
      .filter(c => c.count >= 2)
      .sort((a, b) => (b.sb / b.count) - (a.sb / a.count))
      .slice(0, 30)
      .map(c => ({ x: c.sx / c.count, y: c.sy / c.count }));
  }
}
