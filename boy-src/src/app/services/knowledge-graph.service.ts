/* ALIVE Boy — Knowledge Graph Service
   Structured knowledge web — every data point becomes a connected node */

import { Injectable } from '@angular/core';
import { GenomeService } from './genome.service';
import { AudioService } from './audio.service';
import { KnowledgeNode, KnowledgeEdge } from '../models/genome.model';
import { PartnerData } from '../models/sync.model';

@Injectable({ providedIn: 'root' })
export class KnowledgeGraphService {
  private readonly MAX_NODES = 256;

  constructor(private genome: GenomeService, private audio: AudioService) {}

  addNode(type: KnowledgeNode['type'], label: string, data: any, tags: string[]): KnowledgeNode {
    const g = this.genome.get();
    const node: KnowledgeNode = {
      id: 'kn_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      type, label, data, tags,
      created: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 1,
      confidence: 0.5,
      connections: []
    };

    // Auto-link to similar nodes by tags
    for (const existing of g.knowledgeGraph.nodes) {
      const shared = tags.filter(t => existing.tags.includes(t));
      if (shared.length > 0) {
        const strength = Math.min(1, shared.length * 0.3);
        node.connections.push({
          targetId: existing.id,
          relationship: 'similar_to',
          strength,
          created: Date.now()
        });
        existing.connections.push({
          targetId: node.id,
          relationship: 'similar_to',
          strength,
          created: Date.now()
        });
      }
    }

    g.knowledgeGraph.nodes.push(node);
    if (g.knowledgeGraph.nodes.length > this.MAX_NODES) {
      this.prune();
    }
    g.knowledgeGraph.version++;
    this.genome.save();
    this.audio.soundKnowledgeStored();
    return node;
  }

  connect(sourceId: string, targetId: string, relationship: string, strength: number): void {
    const g = this.genome.get();
    const source = g.knowledgeGraph.nodes.find(n => n.id === sourceId);
    if (!source) return;
    const exists = source.connections.find(c => c.targetId === targetId && c.relationship === relationship);
    if (exists) {
      exists.strength = Math.min(1, exists.strength + strength * 0.2);
      return;
    }
    source.connections.push({ targetId, relationship, strength, created: Date.now() });
    this.genome.save();
  }

  search(query: string): KnowledgeNode[] {
    const q = query.toLowerCase();
    return this.genome.get().knowledgeGraph.nodes
      .filter(n =>
        n.label.toLowerCase().includes(q) ||
        n.tags.some(t => t.toLowerCase().includes(q)) ||
        n.type === q
      )
      .sort((a, b) => b.accessCount - a.accessCount);
  }

  getNeighborhood(nodeId: string, depth: number = 1): KnowledgeNode[] {
    const g = this.genome.get();
    const visited = new Set<string>();
    const result: KnowledgeNode[] = [];
    const queue: { id: string; d: number }[] = [{ id: nodeId, d: 0 }];

    while (queue.length > 0) {
      const { id, d } = queue.shift()!;
      if (visited.has(id) || d > depth) continue;
      visited.add(id);
      const node = g.knowledgeGraph.nodes.find(n => n.id === id);
      if (!node) continue;
      result.push(node);
      for (const conn of node.connections) {
        if (!visited.has(conn.targetId)) {
          queue.push({ id: conn.targetId, d: d + 1 });
        }
      }
    }
    return result;
  }

  getHubs(limit: number = 5): KnowledgeNode[] {
    return [...this.genome.get().knowledgeGraph.nodes]
      .sort((a, b) => b.connections.length - a.connections.length)
      .slice(0, limit);
  }

  ingestSyncData(data: PartnerData): void {
    if (!data) return;
    const syncNode = this.addNode('sync', 'sync_' + Date.now(), {
      partnerName: data.name,
      partnerAge: data.age,
      partnerGen: data.generation,
      timestamp: Date.now()
    }, ['sync', 'partner', 'communication']);

    if (data.sounds) {
      for (const s of data.sounds) {
        const soundNode = this.addNode('sound', `partner_sound_${Math.round(s.base)}Hz`, s,
          ['sound', 'partner', s.wave, s.base > 400 ? 'high' : 'low']);
        this.connect(syncNode.id, soundNode.id, 'contains', 0.8);
      }
    }

    if (data.modePrefs) {
      for (const mp of data.modePrefs) {
        const modeNode = this.addNode('mode', `partner_mode_${mp.mode}`, mp,
          ['mode', 'partner', mp.mode, mp.score > 70 ? 'preferred' : 'neutral']);
        this.connect(syncNode.id, modeNode.id, 'contains', 0.6);
      }
    }
  }

  prune(): void {
    const g = this.genome.get();
    const now = Date.now();
    const dayMs = 86400000;

    // Remove old, disconnected, low-confidence nodes
    g.knowledgeGraph.nodes = g.knowledgeGraph.nodes.filter(n => {
      const age = (now - n.lastAccessed) / dayMs;
      if (n.connections.length === 0 && n.confidence < 0.3 && age > 7) return false;
      if (n.accessCount <= 1 && age > 14) return false;
      return true;
    });

    // Clean dead references
    const alive = new Set(g.knowledgeGraph.nodes.map(n => n.id));
    for (const n of g.knowledgeGraph.nodes) {
      n.connections = n.connections.filter(c => alive.has(c.targetId));
    }

    g.knowledgeGraph.lastPruned = now;
    this.genome.save();
  }

  getGraph() { return this.genome.get().knowledgeGraph; }
}
