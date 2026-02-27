import { Component, ChangeDetectionStrategy, inject, computed, ViewEncapsulation, signal, OnDestroy, effect, viewChild, ElementRef, untracked, afterNextRender, Renderer2, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClinicalIntelligenceService, TranscriptEntry, AnalysisLens } from '../services/clinical-intelligence.service';
import { PatientStateService } from '../services/patient-state.service';
import { PatientManagementService, HistoryEntry } from '../services/patient-management.service';
import { marked } from 'marked';
import { DictationService } from '../services/dictation.service';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

declare var webkitSpeechRecognition: any;
import { CarePlanNode, CarePlanNodeItem, ReportSection, ParsedTranscriptEntry, NodeAnnotation, LensAnnotations, VerificationIssue } from './analysis-report.types';
import { CarePlanNodeComponent } from './care-plan-node.component';
import { UnderstoryCardComponent } from './shared/understory-card.component';
import { UnderstoryBadgeComponent } from './shared/understory-badge.component';
import { ClinicalGaugeComponent } from './clinical-gauge.component';
import { ClinicalIcons } from '../assets/clinical-icons';
import { ClinicalTrendComponent } from './clinical-trend.component';
import { AiCacheService } from '../services/ai-cache.service';
import { UnderstoryButtonComponent } from './shared/understory-button.component';

@Component({
  selector: 'app-analysis-report',
  standalone: true,
  imports: [CommonModule, CarePlanNodeComponent, UnderstoryCardComponent, UnderstoryBadgeComponent, ClinicalGaugeComponent, ClinicalTrendComponent, UnderstoryButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'class': 'block h-full flex flex-col overflow-hidden relative'
  },
  styles: [`
    /* Premium Inter Typography Styles for Care Plan Content */
    .rams-typography h1 {
      font-family: 'Inter', sans-serif;
      font-size: 1.25rem;
      font-weight: 700;
      color: #111827;
      margin-top: 2.5rem;
      margin-bottom: 1.5rem;
      border-bottom: 2px solid #E5E7EB;
      padding-bottom: 0.75rem;
    }

    .rams-typography h2 {
      font-family: 'Inter', sans-serif;
      font-size: 1.125rem;
      font-weight: 700;
      color: #374151;
      margin-top: 2rem;
      margin-bottom: 1.25rem;
      border-bottom: 1px solid #E5E7EB;
      padding-bottom: 0.5rem;
    }

    .rams-typography h3 {
      font-family: 'Inter', sans-serif;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-weight: 700;
      color: #6B7280;
      margin-top: 2rem;
      margin-bottom: 1rem;
      border-bottom: 1px solid #E5E7EB;
      padding-bottom: 0.5rem;
    }

    .rams-typography h4,
    .rams-typography h5,
    .rams-typography h6 {
      font-family: 'Inter', sans-serif;
      font-size: 0.875rem;
      font-weight: 800;
      color: #000000;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
    }
    
    .rams-typography h1:first-child,
    .rams-typography h2:first-child,
    .rams-typography h3:first-child,
    .rams-typography h4:first-child {
      margin-top: 0;
    }

    .rams-typography p,
    .rams-typography li,
    .rams-typography td,
    .rams-typography th {
      font-family: 'Inter', sans-serif;
      font-size: 0.875rem;
      font-weight: 600;
      line-height: 1.5;
      color: #333333;
    }

    .rams-typography p {
      margin-bottom: 1.25rem;
      padding: 0.25rem 0;
      border-radius: 4px;
      transition: background-color 0.2s ease-in-out;
      cursor: pointer;
    }
    
    .rams-typography p:hover,
    .rams-typography li:hover {
      background-color: #F3F4F6; /* gray-100 */
    }

    .verification-claim {
      transition: all 0.2s ease-in-out;
      border-radius: 2px;
    }
    
    .verification-claim:hover {
      filter: brightness(0.95);
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }

    .bg-amber-100 { background-color: #fef3c7; }
    .border-amber-200 { border-color: #fde68a; }
    .bg-red-100 { background-color: #fee2e2; }
    .border-red-200 { border-color: #fecaca; }

    .rams-typography strong {
      font-weight: 800;
      color: #000000;
    }

    .rams-typography ul {
      list-style: none;
      padding-left: 0;
      margin-bottom: 1.5rem;
    }

    .rams-typography li {
      margin-bottom: 0.5rem;
      padding: 0.25rem 0.25rem 0.25rem 1.5rem;
      position: relative;
      cursor: pointer;
      border-radius: 4px;
      transition: background-color 0.2s ease-in-out;
    }

    .rams-typography li::before {
      content: '';
      width: 5px;
      height: 5px;
      background: #4B5563; /* gray-600 */
      border-radius: 50%;
      position: absolute;
      left: 0.5rem;
      top: 1em;
    }
    
    .rams-typography blockquote {
      border-left: 3px solid #689F38; /* brand green */
      padding: 0.75rem 1.25rem;
      background-color: #F8FAF8;
      font-style: normal;
      font-weight: 500;
      color: #4B5563; /* gray-600 */
      margin: 1.5rem 0;
      border-radius: 0 4px 4px 0;
    }

    .rams-typography table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin: 1.5rem 0;
      border-radius: 8px;
      border: 1px solid #E5E7EB;
      overflow: hidden;
    }

    .rams-typography th {
      background-color: #F9FAFB;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.05em;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #E5E7EB;
      text-align: left;
    }

    .rams-typography td {
      padding: 0.875rem 1rem;
      border-bottom: 1px solid #F3F4F6;
    }

    .rams-typography tr:last-child td {
      border-bottom: none;
    }

    .rams-typography tr:nth-child(even) td {
      background-color: #FAFBFC;
    }

    .rams-typography hr {
      border: none;
      height: 1px;
      background: linear-gradient(to right, transparent, #D1D5DB, transparent);
      margin: 2rem 0;
    }

    /* Task Bracketing Styles */
    .rams-typography .bracket-removed {
      opacity: 0.4 !important;
      text-decoration: line-through !important;
      background-color: transparent !important;
      border-left: 3px solid transparent !important;
    }
    
    .rams-typography .bracket-added {
      background-color: #E8F5E9 !important;
      border-left: 3px solid #689F38 !important;
    }
    
    /* Ensure padding is consistent despite border addition */
    .rams-typography p.bracket-added,
    .rams-typography p.bracket-removed {
       padding-left: 0.75rem;
    }
    .rams-typography li.bracket-added,
    .rams-typography li.bracket-removed {
       padding-left: 1.75rem;
    }
    
    .rams-typography .bracket-removed,
    .rams-typography .bracket-added {
      transition: all 0.2s ease-in-out;
    }
  `],
  template: `
    <!-- Report Header -->
    <div class="p-8 pb-4 flex justify-between items-end bg-white shrink-0 z-10 border-b border-[#EEEEEE] no-print">
      <div class="flex-1"></div>
      
      @if (!intel.isLoading()) {
         <div class="flex items-center gap-2">
           @if (state.isLiveAgentActive()) {
              <understory-button variant="danger" size="sm" (click)="endLiveConsult()">
                 Close Assistant
              </understory-button>
            } @else {
               <understory-button [disabled]="!state.hasIssues() || !hasAnyReport()" 
                                 (click)="openVoicePanel()" 
                                 variant="secondary"
                                 size="sm"
                                 icon="M12 14q-1.25 0-2.125-.875T9 11V5q0-1.25.875-2.125T12 2q1.25 0 2.125.875T15 5v6q0 1.25-.875 2.125T12 14m-1 7v-3.075q-2.6-.35-4.3-2.325T5 11h2q0 2.075 1.463 3.537T12 16q2.075 0 3.538-1.463T17 11h2q0 2.225-1.7 4.2T13 17.925V21z">
                Voice Assistant
              </understory-button>
            }
            <understory-button (click)="intel.clearCache()" 
                              variant="ghost"
                              size="sm"
                              ariaLabel="Clear AI Cache"
                              [icon]="ClinicalIcons.Clear">
            </understory-button>
            <understory-button (click)="generate()" [disabled]="!state.hasIssues()"
                              variant="primary"
                              size="sm"
                              [icon]="hasAnyReport() ? 'M17.65 6.35A7.95 7.95 0 0 0 12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.66-.67 3.17-1.76 4.24l1.42 1.42A9.92 9.92 0 0 0 22 12c0-2.76-1.12-5.26-2.35-7.65z' : 'M14 5l7 7m0 0l-7 7m7-7H3'">
              {{ hasAnyReport() ? 'Refresh Recommendations' : 'Generate Care Plan' }}
            </understory-button>
        </div>
      }
    </div>

    <!-- Analysis Tabs -->
    @if (hasAnyReport()) {
      <div class="px-8 py-3 border-b border-[#EEEEEE] no-print bg-white/50 backdrop-blur-sm">
        <div class="flex items-center gap-1 border-b border-gray-200">
            <understory-button (click)="changeLens('Care Plan Overview')"
                    variant="ghost"
                    size="sm"
                    [class.border-b-2]="activeLens() === 'Care Plan Overview'"
                    [class.border-[#1C1C1C]]="activeLens() === 'Care Plan Overview'"
                    [class.text-[#1C1C1C]]="activeLens() === 'Care Plan Overview'"
                    class="rounded-none px-4 -mb-px shadow-none">
              Overview
            </understory-button>
            <understory-button (click)="changeLens('Functional Protocols')"
                    variant="ghost"
                    size="sm"
                    [class.border-b-2]="activeLens() === 'Functional Protocols'"
                    [class.border-[#1C1C1C]]="activeLens() === 'Functional Protocols'"
                    [class.text-[#1C1C1C]]="activeLens() === 'Functional Protocols'"
                    class="rounded-none px-4 -mb-px shadow-none">
              Interventions
            </understory-button>
            <understory-button (click)="changeLens('Monitoring & Follow-up')"
                    variant="ghost"
                    size="sm"
                    [class.border-b-2]="activeLens() === 'Monitoring & Follow-up'"
                    [class.border-[#1C1C1C]]="activeLens() === 'Monitoring & Follow-up'"
                    [class.text-[#1C1C1C]]="activeLens() === 'Monitoring & Follow-up'"
                    class="rounded-none px-4 -mb-px shadow-none">
              Monitoring
            </understory-button>
            <understory-button (click)="changeLens('Patient Education')"
                    variant="ghost"
                    size="sm"
                    [class.border-b-2]="activeLens() === 'Patient Education'"
                    [class.border-[#1C1C1C]]="activeLens() === 'Patient Education'"
                    [class.text-[#1C1C1C]]="activeLens() === 'Patient Education'"
                    class="rounded-none px-4 -mb-px shadow-none">
              Education
            </understory-button>
        </div>
      </div>
    }

    <!-- Content Area -->
    <div #contentArea class="flex-1 overflow-y-auto p-8 min-h-0 relative bg-[#F9FAFB]">
         <!-- Analysis Engine Body -->
         <div class="max-w-4xl mx-auto p-6 min-h-full">
              <!-- Clinical Overview Dashboard -->
              @if (intel.analysisMetrics(); as metrics) {
                <div class="mb-10 grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
                  <div class="col-span-full mb-2">
                    <h2 class="text-xs font-bold text-[#1C1C1C] uppercase tracking-widest border-b border-gray-100 pb-2">Clinical Overview Dashboard</h2>
                  </div>
                  
                  <app-clinical-gauge 
                    label="Complexity" 
                    [value]="metrics.complexity" 
                    type="complexity"
                    description="Measures comorbid depth and case difficulty.">
                  </app-clinical-gauge>

                  <app-clinical-gauge 
                    label="Stability" 
                    [value]="metrics.stability" 
                    type="stability"
                    description="Patient physiological and functional compensatory status.">
                  </app-clinical-gauge>

                  <app-clinical-gauge 
                    label="Certainty" 
                    [value]="metrics.certainty" 
                    type="certainty"
                    description="AI confidence based on available data density.">
                  </app-clinical-gauge>

                  <!-- Trend Sparklines -->
                  @if (historicalMetrics().length > 1) {
                    <div class="col-span-full mt-4 p-6 bg-gray-50/50 rounded-2xl border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-8">
                       <app-clinical-trend label="Complexity Trend" [values]="getHistoryValues('complexity')" type="complexity"></app-clinical-trend>
                       <app-clinical-trend label="Stability Trend" [values]="getHistoryValues('stability')" type="stability"></app-clinical-trend>
                       <app-clinical-trend label="Certainty Trend" [values]="getHistoryValues('certainty')" type="certainty"></app-clinical-trend>
                    </div>
                  }
                </div>
              }

              @if (intel.isLoading() && !hasAnyReport()) {
                <div class="h-64 flex flex-col items-center justify-center opacity-50 no-print">
                  <div class="w-8 h-8 border-2 border-[#EEEEEE] border-t-[#1C1C1C] rounded-full animate-spin mb-4"></div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs uppercase tracking-widest text-[#689F38] font-bold">{{ activeLens() }}</span>
                    @if (intel.isLoading() && isTextEmpty(activeReport())) {
                      <span class="flex h-1.5 w-1.5 rounded-full bg-[#689F38] animate-pulse"></span>
                      <span class="text-[8px] uppercase tracking-tighter text-gray-400">Generating...</span>
                    }
                  </div>
                  <p class="text-xs font-bold uppercase tracking-widest text-[#1C1C1C]">Processing Comprehensive Analysis</p>
                </div>
              }
              @if (intel.error() && !hasAnyReport(); as error) {
                <div class="p-4 border border-red-200 bg-red-50 text-red-900 text-xs rounded-lg mb-4">
                  <strong class="block uppercase tracking-wider mb-1">System Error</strong>
                  {{ error }}
                </div>
              }
              
              <!-- AI Report Section -->
              @if (reportSections(); as sections) {
                <div class="space-y-6">
                    @for(section of sections; track $index) {
                      <understory-card [title]="section.title" [icon]="section.icon">
                        <div right-action class="flex items-center gap-2">
                          @if (intel.isLoading() && !verificationStatus(section.title)) {
                            <div class="flex items-center gap-1.5 mr-2">
                              <span class="flex h-1.5 w-1.5 rounded-full bg-[#689F38] animate-pulse"></span>
                              <span class="text-[8px] uppercase tracking-tighter text-gray-400">Streaming Section...</span>
                            </div>
                          }
                          @if (verificationStatus(section.title); as status) {
                            <understory-badge [label]="status" [severity]="statusSeverity(status)">
                              <div badge-icon [innerHTML]="ClinicalIcons.Verified"></div>
                            </understory-badge>
                          }
                        </div>
                        
                        <div class="rams-typography">
                            @for(node of section.nodes; track node.id) {
                              @if (node.type === 'raw') {
                                <div [innerHTML]="node.rawHtml" class="mb-4"></div>
                              } @else if (node.type === 'paragraph') {
                                <app-care-plan-node 
                                  [node]="node" 
                                  type="paragraph"
                                  [saveStatus]="nodeSaveStatuses()[node.key]"
                                  [protocolInsights]="protocolInsights"
                                  (update)="handleNodeUpdate(node, $event)"
                                  (dictationToggle)="openNodeDictation(node)">
                                </app-care-plan-node>
                              } @else if (node.type === 'list') {
                                <ul [class.list-decimal]="node.ordered" [class.list-disc]="!node.ordered" class="pl-4 mb-6">
                                  @for(item of node.items; track item.id) {
                                    <app-care-plan-node 
                                      [node]="item" 
                                      type="list-item"
                                      [saveStatus]="nodeSaveStatuses()[item.key]"
                                      [protocolInsights]="protocolInsights"
                                      (update)="handleNodeUpdate(item, $event)"
                                      (dictationToggle)="openNodeDictation(item)">
                                    </app-care-plan-node>
                                  }
                                </ul>
                              }
                            }
                        </div>
                      </understory-card>
                    }
                </div>
                <!-- Redesigned Minimalist Footer (Dieter Rams inspired) -->
                <div class="mt-20 pt-12 border-t border-black/10 grid grid-cols-1 md:grid-cols-3 gap-12 font-['Inter'] no-print mb-8">
                  <div class="space-y-1">
                    <div class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#000000]">System Identification</div>
                    <div class="text-[10px] font-medium text-black/60 uppercase tracking-widest">Understory Analysis Engine v2.4.0</div>
                  </div>
                  <div class="space-y-1">
                    <div class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#000000]">Analysis Metadata</div>
                    <div class="text-[10px] font-medium text-black/60 uppercase tracking-widest">Generated: {{ lastRefreshDate() | date:'yyyy.MM.dd HH:mm:ss' }}</div>
                  </div>
                  <div class="space-y-1 md:text-right">
                    <div class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#000000]">Regulatory Status</div>
                    <div class="text-[10px] font-medium text-black/60 uppercase tracking-widest">AI Generated Evidence. Physician Oversight Mandated.</div>
                  </div>
                </div>
              } @else if (!intel.isLoading() && !hasAnyReport()) {
                <div class="h-64 border border-dashed border-gray-200 rounded-lg flex items-center justify-center no-print">
                  <p class="text-xs text-gray-500 font-medium uppercase tracking-widest">Waiting for input data...</p>
                </div>
              }
         </div>
    </div>


  `
})
export class AnalysisReportComponent implements OnDestroy, AfterViewInit {
  protected readonly intel = inject(ClinicalIntelligenceService);
  protected readonly state = inject(PatientStateService);
  protected readonly patientManager = inject(PatientManagementService);
  protected readonly dictation = inject(DictationService);
  protected readonly cache = inject(AiCacheService);
  protected readonly ClinicalIcons = ClinicalIcons;

  historyEntries = signal<any[]>([]);

  historicalMetrics = computed(() => {
    return this.historyEntries()
      .map(e => e.value._metrics)
      .filter(m => !!m);
  });

  getHistoryValues(type: 'complexity' | 'stability' | 'certainty'): number[] {
    return this.historyEntries()
      .map(e => e.value?._metrics?.[type] || 5)
      .reverse();
  }

  async loadHistory() {
    const entries = await this.cache.getAllEntries();
    this.historyEntries.set(entries.filter(e => e.value?._isSnapshot));
  }

  private resizeObserver: ResizeObserver | null = null;
  private carePlanObserver: MutationObserver | null = null;

  ngAfterViewInit() {
    this.setupCarePlanObserver();
  }

  private setupCarePlanObserver() {
    const el = this.contentArea()?.nativeElement;
    if (!el) return;

    this.carePlanObserver = new MutationObserver(() => {
      // Only auto-scroll if we are generating
      if (this.intel.isLoading()) {
        el.scrollTop = el.scrollHeight;
      }
    });

    this.carePlanObserver.observe(el, { childList: true, subtree: true, characterData: true });
  }

  // --- Analysis State ---
  activeLens = signal<AnalysisLens>('Care Plan Overview');

  // --- Hover Toolbar State ---
  hoveredElement = signal<HTMLElement | null>(null);
  toolbarPosition = signal<{ top: string; left: string } | null>(null);
  private leaveTimeout: any;

  lastRefreshDate = signal<string | null>(null);

  protocolInsights = [
    'Follow up in 72 hours if no improvement.',
    'Monitor BP and heart rate twice daily.',
    'Continue current medication as prescribed.',
    'Schedule follow-up with specialist.',
    'Patient education provided regarding diet.',
    'Increase fluid intake to 2L/day.',
    'Watch for signs of infection.'
  ];

  hasAnyReport = computed(() => Object.keys(this.intel.analysisResults()).length > 0);
  activeReport = computed(() => this.intel.analysisResults()[this.activeLens()]);
  contentArea = viewChild<ElementRef<HTMLDivElement>>('contentArea');

  isSectionEmpty(section: any): boolean {
    return !section.nodes || section.nodes.length === 0;
  }

  isTextEmpty(text: string | undefined): boolean {
    return !text || text.trim().length === 0;
  }

  verificationStatus(sectionTitle: string): string | null {
    const res = this.intel.verificationResults()[this.activeLens()];
    return res?.status || null;
  }

  statusSeverity(status: string): any {
    switch (status) {
      case 'verified': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'neutral';
    }
  }

  reportSections = computed<ReportSection[] | null>(() => {
    const raw = this.activeReport();
    if (!raw) return null;
    try {
      const sections: ReportSection[] = [];
      let globalNodeId = 0;
      const parts = raw.split(/\n(?=#{1,3}\s)/);
      for (const part of parts) {
        if (!part.trim()) continue;
        const lines = part.split('\n');
        const headingMarkdown = lines.find(l => l.trim().startsWith('#')) || lines[0] || '';
        const title = headingMarkdown.replace(/^#+\s*/, '').trim();
        const icon = this.getIconForSection(title);
        const contentMarkdown = part === headingMarkdown ? '' : part.substring(part.indexOf(headingMarkdown) + headingMarkdown.length);

        const verification = (this.intel.verificationResults()[this.activeLens()] || { status: 'verified', issues: [] });
        const tokens = marked.lexer(contentMarkdown);
        const nodes: CarePlanNode[] = [];

        for (const token of tokens) {
          const key = (token as any).text || token.raw || `node-${globalNodeId}`;
          const annotation = (this.lensAnnotations()[this.activeLens()] || {})[key] || { note: '', bracketState: 'normal' };
          // const annotation = (this.lensAnnotations()[this.activeLens()] || {})[key] || { note: '', bracketState: 'normal' };

          // Extract suggestions and proposals
          const extractMetadata = (text: string) => {
            const suggestions: string[] = [];
            let proposedText: string | undefined;

            const suggMatches = text.matchAll(/\[\[suggestion:\s*(.*?)\]\]/g);
            for (const match of suggMatches) suggestions.push(match[1]);

            const propMatch = text.match(/\[\[proposed:\s*(.*?)\]\]/);
            if (propMatch) proposedText = propMatch[1];

            const cleanedText = text
              .replace(/\[\[suggestion:.*?\]\]/g, '')
              .replace(/\[\[proposed:.*?\]\]/g, '')
              .trim();

            return { suggestions, proposedText, cleanedText };
          };

          const applyHighlights = (html: string, issues: VerificationIssue[]) => {
            let highlightedHtml = html;
            for (const issue of issues) {
              if (issue.claim && highlightedHtml.includes(issue.claim)) {
                const colorClass = issue.severity === 'high' ? 'bg-red-100 border-red-200' : 'bg-amber-100 border-amber-200';
                const highlightSpan = `<span class="verification-claim px-0.5 border-b-2 border-dotted cursor-help ${colorClass}" title="${issue.message}">${issue.claim}</span>`;
                highlightedHtml = highlightedHtml.replace(issue.claim, highlightSpan);
              }
            }
            return highlightedHtml;
          };

          if (token.type === 'paragraph') {
            const { suggestions, proposedText, cleanedText } = extractMetadata(token.text);
            const annotation = (this.lensAnnotations()[this.activeLens()] || {})[key] || { note: '', bracketState: 'normal' };
            const content = annotation.modifiedText || cleanedText;

            nodes.push({
              id: `node-${globalNodeId++}`,
              key,
              type: 'paragraph',
              rawHtml: applyHighlights(marked.parseInline(content) as string, verification.issues),
              bracketState: annotation.bracketState,
              note: annotation.note,
              showNote: !!annotation.note,
              suggestions,
              proposedText,
              verificationStatus: verification.status as any,
              verificationIssues: verification.issues
            });
          } else if (token.type === 'list') {
            nodes.push({
              id: `node-${globalNodeId++}`,
              key,
              type: 'list',
              ordered: token.ordered || false,
              items: token.items.map(item => {
                const itemKey = item.text;
                const itemAnnotation = (this.lensAnnotations()[this.activeLens()] || {})[itemKey] || { note: '', bracketState: 'normal' };
                const { suggestions, proposedText, cleanedText } = extractMetadata(item.text);
                const content = itemAnnotation.modifiedText || cleanedText;

                return {
                  id: `item-${globalNodeId++}`,
                  key: itemKey,
                  html: applyHighlights(marked.parseInline(content) as string, verification.issues),
                  bracketState: itemAnnotation.bracketState,
                  note: itemAnnotation.note,
                  showNote: !!itemAnnotation.note,
                  suggestions,
                  proposedText
                };
              }),
              bracketState: annotation.bracketState,
              note: annotation.note,
              showNote: !!annotation.note
            });
          } else {
            nodes.push({
              id: `node-${globalNodeId++}`,
              key,
              type: 'raw',
              rawHtml: marked.parse(token.raw) as string,
              bracketState: annotation.bracketState,
              note: annotation.note,
              showNote: !!annotation.note
            });
          }
        }

        sections.push({
          raw: part,
          heading: marked.parse(headingMarkdown) as string,
          title,
          icon,
          nodes
        });
      }
      return sections;
    } catch (e) {
      console.error('Markdown parse error', e);
      return [{ raw: raw, heading: '<h3>Error</h3>', title: 'Error', icon: ClinicalIcons.Risk, nodes: [{ id: 'err', key: 'err', type: 'raw', rawHtml: '<p>Could not parse report.</p>', bracketState: 'normal', note: '', showNote: false }] }];
    }
  });

  private getIconForSection(title: string): string {
    const lower = title.toLowerCase();
    if (lower.includes('assessment') || lower.includes('overview')) return ClinicalIcons.Assessment;
    if (lower.includes('protocol') || lower.includes('intervention')) return ClinicalIcons.Medication;
    if (lower.includes('monitor') || lower.includes('cadence')) return ClinicalIcons.FollowUp;
    if (lower.includes('education') || lower.includes('resource')) return ClinicalIcons.Education;
    return ClinicalIcons.Assessment;
  }

  parsedTranscript = computed<ParsedTranscriptEntry[]>(() => {
    const transcript = this.intel.transcript();
    try {
      return transcript.map(entry => {
        const parsed: ParsedTranscriptEntry = { ...entry };
        if (entry.role === 'model') {
          parsed.htmlContent = this.renderInteractiveContent(entry.text);
        }
        return parsed;
      });
    } catch (e) {
      console.error('Transcript parse error', e);
      return transcript.map(entry => ({ ...entry }));
    }
  });

  readonly lensAnnotations = signal<LensAnnotations>({});

  // Track save status per node
  readonly nodeSaveStatuses = signal<Record<string, 'idle' | 'saving' | 'saved'>>({});

  private autoSaveSubject = new Subject<void>();

  constructor() {
    // Auto-scroll effect for transcript
    effect(() => {
      // This effect depends on the parsedTranscript signal.
      // It will run whenever the transcript changes.
      this.parsedTranscript();
    });

    // Removed the effect-based auto-scroll for care plan content area, handled in ngAfterViewInit instead

    // Auto-load annotations effect
    effect(() => {
      const patient = this.patientManager.selectedPatient();
      if (patient) {
        const latestAnalysis = patient.history.filter(e => e.type === 'AnalysisRun' || e.type === 'FinalizedCarePlan').pop();

        if (latestAnalysis) {
          untracked(() => {
            this.lastRefreshDate.set(latestAnalysis.date); // Use string date
          });
        }

        const latestFinalized = patient.history.find(e => e.type === 'FinalizedCarePlan');
        if (latestFinalized && latestFinalized.type === 'FinalizedCarePlan') {
          untracked(() => {
            this.lensAnnotations.set(latestFinalized.annotations || {});
          });
        } else {
          untracked(() => {
            this.lensAnnotations.set({});
          });
        }
      }
    });

    // New effect to handle analysis updates requested from other components
    effect(() => {
      const requestCount = this.state.analysisUpdateRequest();
      if (requestCount > 0) {
        untracked(() => {
          this.generate();
          this.loadHistory();
        });
      }
    });

    this.loadHistory();

    // Auto-save debouncing
    this.autoSaveSubject.pipe(
      debounceTime(1000)
    ).subscribe(() => {
      this.persistToHistory();
    });
  }

  ngOnDestroy() {
    this.carePlanObserver?.disconnect();
    this.flushAutoSave();
  }

  private triggerAutoSave(nodeKey: string) {
    // Set individual node to saving
    this.nodeSaveStatuses.update(prev => ({ ...prev, [nodeKey]: 'saving' }));
    this.autoSaveSubject.next();
  }

  private flushAutoSave() {
    this.autoSaveSubject.next();
    this.persistToHistory();
  }

  private persistToHistory() {
    const patientId = this.patientManager.selectedPatientId();
    if (!patientId) return;

    const historyEntry: HistoryEntry = {
      type: 'FinalizedCarePlan',
      date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
      summary: 'Integrative Care Plan updated (auto-saved).',
      report: this.intel.analysisResults(),
      annotations: this.lensAnnotations()
    };

    this.patientManager.updateHistoryEntry(patientId, historyEntry, (h) =>
      h.type === 'FinalizedCarePlan' && h.date === historyEntry.date
    );

    // Update all 'saving' statuses to 'saved'
    this.nodeSaveStatuses.update(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        if (next[key] === 'saving') next[key] = 'saved';
      });
      return next;
    });

    // Clear 'saved' status after a few seconds
    setTimeout(() => {
      this.nodeSaveStatuses.update(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          if (next[key] === 'saved') delete next[key];
        });
        return next;
      });
    }, 3000);
  }

  private renderInteractiveContent(markdown: string): string {
    return marked.parse(markdown) as string;
  }

  handleNodeUpdate(node: CarePlanNode | CarePlanNodeItem, event: any) {
    if (event.note !== undefined) {
      this.updateAnnotation(node.key, { note: event.note });
      node.note = event.note; // Update local node state
      node.showNote = !!event.note; // Update local node state
    }
    if (event.bracketState !== undefined) {
      this.updateAnnotation(node.key, { bracketState: event.bracketState });
      node.bracketState = event.bracketState; // Update local node state
    }
    if (event.acceptedProposal !== undefined) {
      this.updateAnnotation(node.key, { modifiedText: event.acceptedProposal });
      // The `reportSections` computed will re-render with `modifiedText`
    }

    // Trigger auto-save or sync
    if (event.bracketState !== undefined || event.note !== undefined || event.acceptedProposal !== undefined) {
      this.syncNodeToTaskFlow(node);
    }
  }


  private syncNodeToTaskFlow(node: CarePlanNode | CarePlanNodeItem) {
    if (node.bracketState === 'added' || node.note) {
      this.state.addClinicalNote({
        id: node.id,
        text: node.note || (node as any).rawHtml || (node as any).html,
        sourceLens: this.activeLens(),
        date: new Date().toISOString().split('T')[0].replace(/-/g, '.')
      });
    } else {
      this.state.removeClinicalNote(node.id);
    }
  }


  private updateAnnotation(key: string, data: Partial<NodeAnnotation>) {
    this.lensAnnotations.update(all => {
      const currentLens = this.activeLens();
      const lensData = { ...(all[currentLens] || {}) };
      lensData[key] = { ...(lensData[key] || { note: '', bracketState: 'normal' }), ...data };
      return { ...all, [currentLens]: lensData };
    });
    this.triggerAutoSave(key);
  }

  activeDictationNode = signal<CarePlanNode | CarePlanNodeItem | null>(null);

  openNodeDictation(node: CarePlanNode | CarePlanNodeItem) {
    if (this.dictation.isListening() && this.activeDictationNode() === node) {
      this.dictation.stopRecognition();
      node.isDictating = false;
      this.activeDictationNode.set(null);
      return;
    }

    if (this.dictation.isListening()) {
      this.dictation.stopRecognition();
      const prev = this.activeDictationNode();
      if (prev) prev.isDictating = false;
    }

    node.isDictating = true;
    this.activeDictationNode.set(node);

    const initialText = node.note || '';
    let baseText = initialText ? initialText + (initialText.endsWith(' ') ? '' : ' ') : '';

    this.dictation.registerResultHandler((text, isFinal) => {
      if (this.activeDictationNode() === node) {
        node.note = baseText + text;
        this.updateAnnotation(node.key, { note: node.note });
        if (isFinal) {
          this.syncNodeToTaskFlow(node);
        }
      }
    });

    this.dictation.startRecognition();
  }

  // --- Report Actions ---
  async generate() {
    const patientId = this.patientManager.selectedPatientId();
    const patient = patientId ? this.patientManager.patients().find(p => p.id === patientId) : null;
    const history = patient?.history || [];

    const reportData = await this.intel.generateComprehensiveReport(this.state.getAllDataForPrompt(history));

    if (patientId && Object.keys(reportData).length > 0) {
      const historyEntry: HistoryEntry = {
        type: 'AnalysisRun',
        date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
        summary: 'Comprehensive AI analysis generated.',
        report: reportData
      };
      this.patientManager.addHistoryEntry(patientId, historyEntry);
      this.activeLens.set('Care Plan Overview');
    }
  }

  changeLens(lens: AnalysisLens) {
    this.flushAutoSave();
    this.activeLens.set(lens);
  }

  finalizeCarePlan() {
    const patientId = this.patientManager.selectedPatientId();
    if (!patientId) return;

    const historyEntry: HistoryEntry = {
      type: 'FinalizedCarePlan',
      date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
      summary: 'Integrative Care Plan finalized and saved to chart.',
      report: this.intel.analysisResults(),
      annotations: this.lensAnnotations()
    };

    this.patientManager.addHistoryEntry(patientId, historyEntry);

    // Briefly change tab to show it's saved? 
    // For now we'll just log and rely on the history update
    console.log('Care plan finalized and saved to chart.');
  }

  printReport() { window.print(); }

  // --- Live Consult Actions ---

  openVoicePanel() {
    this.state.toggleLiveAgent(true);
  }

  endLiveConsult() {
    this.state.toggleLiveAgent(false);
  }

  insertSectionIntoChat(sectionMarkdown: string) {
    this.state.toggleLiveAgent(true); // Ensure panel is open
    // Need to wait for view to update if we just switched modes
    setTimeout(() => {
      this.state.liveAgentInput.set(`Regarding this section:\n\n> ${sectionMarkdown.replace(/\n/g, '\n> ')}\n\n`);
      const input = document.querySelector<HTMLTextAreaElement>('#chatInput');
      input?.focus();
    }, 100);
  }
}