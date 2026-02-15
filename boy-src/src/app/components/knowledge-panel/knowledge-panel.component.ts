/* ALIVE Boy — Knowledge Panel
   Boy-unique: swipe-up translucent panel showing what the creature is thinking */

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KnowledgeGraphService } from '../../services/knowledge-graph.service';
import { MemoryPalaceService } from '../../services/memory-palace.service';
import { PatternEngineService } from '../../services/pattern-engine.service';
import { SessionJournalService } from '../../services/session-journal.service';

@Component({
  selector: 'boy-knowledge-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="knowledge-panel" [class.open]="open">
      <div class="panel-handle" (click)="open = !open">
        <div class="handle-bar"></div>
      </div>
      @if (open) {
        <div class="panel-content">
          <div class="panel-section">
            <div class="section-title">KNOWLEDGE ({{kg.getGraph().nodes.length}} nodes)</div>
            @for (hub of kg.getHubs(5); track hub.id) {
              <div class="kg-node">
                <span class="node-type">{{hub.type}}</span>
                <span class="node-label">{{hub.label}}</span>
                <span class="node-links">{{hub.connections.length}} links</span>
              </div>
            }
          </div>
          <div class="panel-section">
            <div class="section-title">PATTERNS ({{pe.getActive().length}} active)</div>
            @for (p of pe.getActive().slice(0, 3); track p.id) {
              <div class="pattern-item">
                <span class="pattern-type">{{p.type}}</span>
                <span class="pattern-desc">{{p.description}}</span>
              </div>
            }
          </div>
          <div class="panel-section">
            <div class="section-title">MEMORY ({{mp.getPalace().length}} entries)</div>
            @for (m of mp.getRecent(3); track m.id) {
              <div class="memory-item">
                <span class="memory-type">{{m.type}}</span>
                <span class="memory-desc">{{m.summary}}</span>
              </div>
            }
          </div>
          @if (sj.getCurrent()) {
            <div class="panel-section">
              <div class="section-title">SESSION</div>
              <div class="session-info">
                {{sj.getCurrent()!.events.length}} events |
                {{sj.getCurrent()!.conceptsFormed}} concepts |
                {{sj.getCurrent()!.syncEvents}} syncs
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .knowledge-panel {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      background: rgba(5,8,20,0.85);
      backdrop-filter: blur(8px);
      border-top: 1px solid rgba(0,212,255,0.15);
      transition: transform 0.3s ease;
      transform: translateY(calc(100% - 30px));
      z-index: 100;
      font-family: monospace;
      max-height: 50vh;
      overflow-y: auto;
    }
    .knowledge-panel.open {
      transform: translateY(0);
    }
    .panel-handle {
      display: flex; justify-content: center;
      padding: 10px;
      cursor: pointer;
    }
    .handle-bar {
      width: 40px; height: 3px;
      background: rgba(0,212,255,0.3);
      border-radius: 2px;
    }
    .panel-content {
      padding: 0 16px 16px;
    }
    .panel-section {
      margin-bottom: 12px;
    }
    .section-title {
      font-size: 10px;
      color: rgba(0,212,255,0.5);
      letter-spacing: 2px;
      margin-bottom: 6px;
      border-bottom: 1px solid rgba(0,212,255,0.1);
      padding-bottom: 4px;
    }
    .kg-node, .pattern-item, .memory-item {
      display: flex; gap: 6px; align-items: baseline;
      padding: 2px 0;
      font-size: 11px;
    }
    .node-type, .pattern-type, .memory-type {
      color: #ffc107;
      font-size: 9px;
      min-width: 50px;
    }
    .node-label, .pattern-desc, .memory-desc {
      color: rgba(224,240,255,0.7);
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .node-links {
      color: rgba(0,255,136,0.5);
      font-size: 9px;
    }
    .session-info {
      font-size: 11px;
      color: rgba(0,212,255,0.5);
    }
  `]
})
export class KnowledgePanelComponent {
  open = false;

  constructor(
    public kg: KnowledgeGraphService,
    public mp: MemoryPalaceService,
    public pe: PatternEngineService,
    public sj: SessionJournalService
  ) {}
}
