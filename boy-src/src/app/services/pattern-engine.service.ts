/* ALIVE Boy — Pattern Engine Service
   Detects patterns across syncs, visits, concepts, and behavior */

import { Injectable } from '@angular/core';
import { GenomeService } from './genome.service';
import { AudioService } from './audio.service';
import { KnowledgeGraphService } from './knowledge-graph.service';
import { DetectedPattern } from '../models/genome.model';
import { PartnerData } from '../models/sync.model';

@Injectable({ providedIn: 'root' })
export class PatternEngineService {
  private readonly MAX_PATTERNS = 50;
  private syncHistory: PartnerData[] = [];

  constructor(
    private genome: GenomeService,
    private audio: AudioService,
    private kg: KnowledgeGraphService
  ) {}

  detectAll(): DetectedPattern[] {
    const found = [
      ...this.detectTemporalPatterns(),
      ...this.detectConceptClusters()
    ];
    if (found.length > 0) {
      this.audio.soundPatternFound();
    }
    return found;
  }

  detectTemporalPatterns(): DetectedPattern[] {
    const g = this.genome.get();
    const patterns: DetectedPattern[] = [];
    const hours = g.memory.visitHours;
    const entries = Object.entries(hours).sort((a, b) => b[1] - a[1]);

    if (entries.length >= 3 && entries[0][1] >= 3) {
      const peakHour = entries[0][0];
      const existing = g.patterns.find(p => p.type === 'temporal' && p.description.includes('hour ' + peakHour));
      if (!existing) {
        const p: DetectedPattern = {
          id: 'pat_' + Date.now().toString(36),
          type: 'temporal',
          description: `Owner visits most at hour ${peakHour} (${entries[0][1]} times)`,
          evidence: ['visitHours'],
          confidence: Math.min(1, entries[0][1] / 10),
          firstDetected: Date.now(),
          lastConfirmed: Date.now()
        };
        g.patterns.push(p);
        patterns.push(p);
        this.kg.addNode('pattern', p.description, p, ['pattern', 'temporal', 'schedule']);
      }
    }

    // Streak pattern
    if (g.memory.currentStreak >= 3) {
      const existing = g.patterns.find(p => p.type === 'behavioral' && p.description.includes('streak'));
      if (!existing) {
        const p: DetectedPattern = {
          id: 'pat_' + Date.now().toString(36),
          type: 'behavioral',
          description: `Owner on ${g.memory.currentStreak}-day visit streak`,
          evidence: ['currentStreak'],
          confidence: Math.min(1, g.memory.currentStreak / 7),
          firstDetected: Date.now(),
          lastConfirmed: Date.now()
        };
        g.patterns.push(p);
        patterns.push(p);
      } else {
        existing.lastConfirmed = Date.now();
        existing.confidence = Math.min(1, g.memory.currentStreak / 7);
        existing.description = `Owner on ${g.memory.currentStreak}-day visit streak`;
      }
    }

    if (g.patterns.length > this.MAX_PATTERNS) {
      g.patterns = g.patterns.slice(-this.MAX_PATTERNS);
    }
    this.genome.save();
    return patterns;
  }

  detectConceptClusters(): DetectedPattern[] {
    const g = this.genome.get();
    const patterns: DetectedPattern[] = [];
    const concepts = g.concepts.filter(c => c.confidence > 0.4);

    // Find concepts that co-occur within 30s windows
    for (let i = 0; i < concepts.length; i++) {
      for (let j = i + 1; j < concepts.length; j++) {
        const timeDiff = Math.abs(concepts[i].lastSeen - concepts[j].lastSeen);
        if (timeDiff < 30000 && concepts[i].exposures >= 2 && concepts[j].exposures >= 2) {
          const label = `Concepts ${concepts[i].id} and ${concepts[j].id} co-occur`;
          const existing = g.patterns.find(p => p.type === 'concept_cluster' && p.evidence.includes(concepts[i].id) && p.evidence.includes(concepts[j].id));
          if (!existing) {
            const p: DetectedPattern = {
              id: 'pat_' + Date.now().toString(36),
              type: 'concept_cluster',
              description: label,
              evidence: [concepts[i].id, concepts[j].id],
              confidence: 0.4,
              firstDetected: Date.now(),
              lastConfirmed: Date.now()
            };
            g.patterns.push(p);
            patterns.push(p);
          }
        }
      }
    }

    this.genome.save();
    return patterns;
  }

  analyzeSyncPattern(data: PartnerData): void {
    if (!data) return;
    this.syncHistory.push(data);
    if (this.syncHistory.length > 20) this.syncHistory = this.syncHistory.slice(-20);

    // Track partner trait changes over time
    if (this.syncHistory.length >= 3 && data.traits) {
      const keys = Object.keys(data.traits) as (keyof typeof data.traits)[];
      for (const k of keys) {
        const recent = this.syncHistory.slice(-3);
        const vals = recent.filter(s => s.traits).map(s => s.traits![k]!);
        if (vals.length >= 3) {
          const trend = vals[vals.length - 1] - vals[0];
          if (Math.abs(trend) > 5) {
            const dir = trend > 0 ? 'increasing' : 'decreasing';
            const desc = `Partner's ${k} is ${dir} (${trend > 0 ? '+' : ''}${trend.toFixed(1)})`;
            const g = this.genome.get();
            const existing = g.patterns.find(p => p.type === 'sync' && p.description.includes(k));
            if (!existing) {
              g.patterns.push({
                id: 'pat_' + Date.now().toString(36),
                type: 'sync',
                description: desc,
                evidence: ['syncHistory'],
                confidence: Math.min(1, Math.abs(trend) / 15),
                firstDetected: Date.now(),
                lastConfirmed: Date.now()
              });
              this.kg.addNode('pattern', desc, { trait: k, trend }, ['pattern', 'sync', 'partner', k]);
              this.genome.save();
            }
          }
        }
      }
    }
  }

  getActive(): DetectedPattern[] {
    const dayMs = 86400000;
    const now = Date.now();
    return this.genome.get().patterns
      .filter(p => (now - p.lastConfirmed) < dayMs * 7 && p.confidence > 0.3)
      .sort((a, b) => b.confidence - a.confidence);
  }

  getAll() { return this.genome.get().patterns; }
}
