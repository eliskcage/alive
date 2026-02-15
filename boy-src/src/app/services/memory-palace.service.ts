/* ALIVE Boy — Memory Palace Service
   Structured, indexed memories with tags and cross-references */

import { Injectable } from '@angular/core';
import { GenomeService } from './genome.service';
import { MemoryPalaceEntry } from '../models/genome.model';
import { PartnerData } from '../models/sync.model';

@Injectable({ providedIn: 'root' })
export class MemoryPalaceService {
  private readonly MAX_MEMORIES = 200;

  constructor(private genome: GenomeService) {}

  record(type: MemoryPalaceEntry['type'], summary: string, tags: string[], importance: number = 0.5): MemoryPalaceEntry {
    const g = this.genome.get();
    const entry: MemoryPalaceEntry = {
      id: 'mem_' + Date.now().toString(36),
      timestamp: Date.now(),
      type, summary, tags,
      crossRefs: [],
      emotionalValence: 0,
      importance
    };

    // Auto cross-reference with recent similar memories
    const recent = g.memoryPalace.slice(-20);
    for (const r of recent) {
      const shared = tags.filter(t => r.tags.includes(t));
      if (shared.length > 0) {
        entry.crossRefs.push(r.id);
        if (entry.crossRefs.length >= 5) break;
      }
    }

    g.memoryPalace.push(entry);
    if (g.memoryPalace.length > this.MAX_MEMORIES) {
      this.decay();
    }
    this.genome.save();
    return entry;
  }

  recordSyncEvent(data: PartnerData): void {
    if (!data || data.empty) return;
    const tags = ['sync', 'partner'];
    if (data.name) tags.push(data.name);
    if (data.sounds && data.sounds.length > 0) tags.push('sounds');
    if (data.modePrefs) tags.push('modes');
    this.record('sync',
      `Synced with partner${data.name ? ' ' + data.name : ''} (gen ${data.generation || '?'})`,
      tags, 0.6);
  }

  recordInteraction(isPositive: boolean): void {
    this.record('interaction',
      isPositive ? 'Positive touch interaction' : 'Negative touch interaction',
      ['touch', isPositive ? 'positive' : 'negative'],
      0.3);
  }

  search(query: string): MemoryPalaceEntry[] {
    const q = query.toLowerCase();
    return this.genome.get().memoryPalace
      .filter(m =>
        m.summary.toLowerCase().includes(q) ||
        m.tags.some(t => t.toLowerCase().includes(q))
      )
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  getRecent(count: number = 10): MemoryPalaceEntry[] {
    return this.genome.get().memoryPalace.slice(-count);
  }

  getByType(type: MemoryPalaceEntry['type']): MemoryPalaceEntry[] {
    return this.genome.get().memoryPalace.filter(m => m.type === type);
  }

  private decay(): void {
    const g = this.genome.get();
    const now = Date.now();
    const dayMs = 86400000;

    // Decay importance
    for (const m of g.memoryPalace) {
      const age = (now - m.timestamp) / dayMs;
      if (age > 7) {
        m.importance *= 0.95;
      }
    }

    // Remove least important if over limit
    if (g.memoryPalace.length > this.MAX_MEMORIES) {
      g.memoryPalace.sort((a, b) => b.importance - a.importance);
      g.memoryPalace = g.memoryPalace.slice(0, this.MAX_MEMORIES);
      g.memoryPalace.sort((a, b) => a.timestamp - b.timestamp);
    }
    this.genome.save();
  }

  getPalace() { return this.genome.get().memoryPalace; }
}
