/* ALIVE Boy — Session Journal Service
   Tracks everything per visit, generates summaries */

import { Injectable } from '@angular/core';
import { GenomeService } from './genome.service';
import { SessionEntry, SessionEvent } from '../models/genome.model';

@Injectable({ providedIn: 'root' })
export class SessionJournalService {
  private current: SessionEntry | null = null;
  private readonly MAX_SESSIONS = 30;

  constructor(private genome: GenomeService) {}

  startSession(): void {
    this.current = {
      id: 'sess_' + Date.now().toString(36),
      startTime: Date.now(),
      endTime: 0,
      events: [],
      conceptsFormed: 0,
      patternsDetected: 0,
      syncEvents: 0,
      summary: ''
    };
  }

  logEvent(type: string, data: any = {}): void {
    if (!this.current) return;
    this.current.events.push({ type, data, timestamp: Date.now() });
    if (type === 'concept_formed') this.current.conceptsFormed++;
    if (type === 'pattern_detected') this.current.patternsDetected++;
    if (type === 'sync') this.current.syncEvents++;
  }

  endSession(): void {
    if (!this.current) return;
    this.current.endTime = Date.now();
    this.current.summary = this.generateSummary();
    const g = this.genome.get();
    g.sessionJournal.push(this.current);
    if (g.sessionJournal.length > this.MAX_SESSIONS) {
      g.sessionJournal = g.sessionJournal.slice(-this.MAX_SESSIONS);
    }
    this.genome.save();
    this.current = null;
  }

  private generateSummary(): string {
    if (!this.current) return '';
    const dur = Math.round((this.current.endTime - this.current.startTime) / 60000);
    const parts = [`${dur}min session`];
    if (this.current.events.length > 0) parts.push(`${this.current.events.length} events`);
    if (this.current.conceptsFormed > 0) parts.push(`${this.current.conceptsFormed} concepts`);
    if (this.current.patternsDetected > 0) parts.push(`${this.current.patternsDetected} patterns`);
    if (this.current.syncEvents > 0) parts.push(`${this.current.syncEvents} syncs`);

    const greens = this.current.events.filter(e => e.type === 'green').length;
    const reds = this.current.events.filter(e => e.type === 'red').length;
    if (greens > reds * 2) parts.push('positive session');
    else if (reds > greens * 2) parts.push('negative session');

    return parts.join(', ');
  }

  getCurrent(): SessionEntry | null { return this.current; }

  getJournal(): SessionEntry[] { return this.genome.get().sessionJournal; }

  getRecent(count: number = 5): SessionEntry[] {
    return this.genome.get().sessionJournal.slice(-count);
  }
}
