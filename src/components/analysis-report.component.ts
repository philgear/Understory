import { Component, ChangeDetectionStrategy, inject, computed, ViewEncapsulation, signal, OnDestroy, effect, viewChild, ElementRef, untracked, afterNextRender, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService, TranscriptEntry, AnalysisLens } from '../services/gemini.service';
import { PatientStateService } from '../services/patient-state.service';
import { PatientManagementService, HistoryEntry } from '../services/patient-management.service';
import { marked } from 'marked';

declare var webkitSpeechRecognition: any;
type AgentState = 'idle' | 'listening' | 'processing' | 'speaking';
interface ReportSection {
  raw: string;
  heading: string;
  contentHtml: string;
}
interface ParsedTranscriptEntry extends TranscriptEntry {
  htmlContent?: string;
}

@Component({
  selector: 'app-analysis-report',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None, 
  host: {
    'class': 'block h-full flex flex-col overflow-hidden relative'
  },
  styles: [`
    /* Global Typography Styles for Report Content */
    .rams-typography h1, 
    .rams-typography h2, 
    .rams-typography h3 {
      font-family: 'Inter', sans-serif;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      font-weight: 700;
      color: #AAAAAA;
      margin-top: 2rem;
      margin-bottom: 0.75rem;
      border-bottom: 1px solid #EEEEEE;
      padding-bottom: 0.25rem;
    }
    
    .rams-typography h1:first-child,
    .rams-typography h2:first-child {
      margin-top: 0;
    }

    .rams-typography p,
    .rams-typography li {
      font-family: 'Cinzel', serif;
      font-size: 1rem;
      font-weight: 400;
      line-height: 1.7;
      margin-bottom: 1.25rem;
      color: #444444;
      cursor: pointer;
      border-radius: 3px;
      transition: background-color 0.2s ease-in-out;
    }
    .rams-typography p:hover,
    .rams-typography li:hover {
      background-color: #F1F8E9;
    }


    .rams-typography strong {
      font-weight: 600;
      color: #1C1C1C;
    }

    .rams-typography ul {
      list-style: none;
      padding-left: 0;
      margin-bottom: 1.5rem;
    }

    .rams-typography li {
      margin-bottom: 0.5rem;
      padding-left: 1.25rem;
      position: relative;
    }

    .rams-typography li::before {
      content: '';
      width: 4px;
      height: 4px;
      background: #689F38;
      position: absolute;
      left: 0;
      top: 0.8em;
    }
    
    .rams-typography blockquote {
      border-left: 2px solid #EEEEEE;
      padding-left: 1rem;
      font-style: italic;
      color: #777777;
      margin: 1.5rem 0;
    }
  `],
  template: `
    <!-- Report Header -->
    <div class="p-8 pb-4 flex justify-between items-end bg-white shrink-0 z-10 border-b border-[#EEEEEE] no-print">
      <div>
        <h2 class="text-sm font-bold text-[#1C1C1C] uppercase tracking-widest">
            AI-Powered Analysis
        </h2>
        <p class="text-xs text-gray-400 mt-1">
            Research & Live Consultation Module
        </p>
      </div>
      
      @if (!gemini.isLoading()) {
        <div class="flex items-center gap-2">
          <button (click)="printReport()" [disabled]="!hasAnyReport()"
            class="group flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold uppercase tracking-widest hover:bg-[#EEEEEE] hover:border-gray-400 disabled:opacity-20 disabled:hover:bg-transparent transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M18 7H6q-.825 0-1.412-.587T4 5q0-.825.588-1.413T6 3h12q.825 0 1.413.587T20 5q0 .825-.587 1.413T18 7M5 10h14q.425 0 .713.288T20 11v6q0 .425-.288.713T19 18h-2v3H7v-3H5q-.425 0-.712-.288T4 17v-6q0-.425.288-.712T5 10m2 8h8v-5H7z"/></svg>
            <span>Print</span>
          </button>
           @if (state.isLiveAgentActive()) {
              <button (click)="endLiveConsult()" class="group flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 text-xs font-bold uppercase tracking-widest hover:bg-red-50 disabled:opacity-20 transition-colors">
                 <span>End Consult</span>
              </button>
            } @else {
               <button (click)="startLiveConsult()" [disabled]="!state.hasIssues() || !hasAnyReport()"
                class="group flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold uppercase tracking-widest hover:bg-[#EEEEEE] hover:border-gray-400 disabled:opacity-20 disabled:hover:bg-transparent transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14q-1.25 0-2.125-.875T9 11V5q0-1.25.875-2.125T12 2q1.25 0 2.125.875T15 5v6q0 1.25-.875 2.125T12 14m-1 7v-3.075q-2.6-.35-4.3-2.325T5 11h2q0 2.075 1.463 3.537T12 16q2.075 0 3.538-1.463T17 11h2q0 2.225-1.7 4.2T13 17.925V21z"/></svg>
                <span>Live Consult</span>
              </button>
            }
          <button (click)="generate()" [disabled]="!state.hasIssues()"
            class="group flex items-center gap-2 px-4 py-2 bg-[#1C1C1C] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#558B2F] disabled:opacity-20 disabled:hover:bg-[#1C1C1C] transition-colors">
            @if (hasAnyReport()) { <span>Update</span> } @else { <span>Process</span> }
            <svg class="w-3 h-3 text-gray-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>
      }
    </div>

    <!-- Analysis Tabs -->
    @if (hasAnyReport()) {
      <div class="px-8 py-3 border-b border-[#EEEEEE] no-print bg-white/50 backdrop-blur-sm">
        <div class="flex items-center gap-1 border-b border-gray-200">
            <button (click)="changeLens('Standard')"
                    class="px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors"
                    [class.border-[#1C1C1C]]="activeLens() === 'Standard'"
                    [class.text-[#1C1C1C]]="activeLens() === 'Standard'"
                    [class.text-gray-500]="activeLens() !== 'Standard'"
                    [class.border-transparent]="activeLens() !== 'Standard'"
                    [class.hover:bg-gray-100]="activeLens() !== 'Standard'">
              Overview
            </button>
            <button (click)="changeLens('Differential Diagnosis')"
                    class="px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors"
                    [class.border-[#1C1C1C]]="activeLens() === 'Differential Diagnosis'"
                    [class.text-[#1C1C1C]]="activeLens() === 'Differential Diagnosis'"
                    [class.text-gray-500]="activeLens() !== 'Differential Diagnosis'"
                    [class.border-transparent]="activeLens() !== 'Differential Diagnosis'"
                    [class.hover:bg-gray-100]="activeLens() !== 'Differential Diagnosis'">
              Differential Diagnosis
            </button>
            <button (click)="changeLens('Key Questions')"
                    class="px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors"
                    [class.border-[#1C1C1C]]="activeLens() === 'Key Questions'"
                    [class.text-[#1C1C1C]]="activeLens() === 'Key Questions'"
                    [class.text-gray-500]="activeLens() !== 'Key Questions'"
                    [class.border-transparent]="activeLens() !== 'Key Questions'"
                    [class.hover:bg-gray-100]="activeLens() !== 'Key Questions'">
              Key Questions
            </button>
            <button (click)="changeLens('Lifestyle Factors')"
                    class="px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors"
                    [class.border-[#1C1C1C]]="activeLens() === 'Lifestyle Factors'"
                    [class.text-[#1C1C1C]]="activeLens() === 'Lifestyle Factors'"
                    [class.text-gray-500]="activeLens() !== 'Lifestyle Factors'"
                    [class.border-transparent]="activeLens() !== 'Lifestyle Factors'"
                    [class.hover:bg-gray-100]="activeLens() !== 'Lifestyle Factors'">
              Lifestyle Factors
            </button>
        </div>
      </div>
    }

    <!-- Content Area -->
    <div #contentArea
         (mouseover)="handleContentMouseOver($event)" 
         (mouseleave)="handleContentMouseLeave()"
         class="flex-1 overflow-y-auto p-8 min-h-0 relative">
        @if (gemini.isLoading()) {
          <div class="h-full flex flex-col items-center justify-center opacity-50 no-print">
            <div class="w-8 h-8 border-2 border-[#EEEEEE] border-t-[#1C1C1C] rounded-full animate-spin mb-4"></div>
            <p class="text-[10px] font-bold uppercase tracking-widest text-[#1C1C1C]">Processing Comprehensive Analysis</p>
          </div>
        }
        @if (gemini.error() && !hasAnyReport(); as error) {
          <div class="p-4 border border-red-200 bg-red-50 text-red-900 text-xs">
            <strong class="block uppercase tracking-wider mb-1">System Error</strong>
            {{ error }}
          </div>
        }
        
        <!-- AI Report Section -->
        @if (reportSections(); as sections) {
          <div class="rams-typography">
              @for(section of sections; track $index) {
                <div class="relative group/section">
                    <div [innerHTML]="section.heading"></div>
                     @if (state.isLiveAgentActive()) {
                        <button (click)="insertSectionIntoChat(section.raw)"
                                class="absolute -left-8 top-8 opacity-0 group-hover/section:opacity-100 transition-opacity text-gray-300 hover:text-[#689F38]"
                                title="Insert section into chat">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M10 9h4V6h3l-5-5-5 5h3zm-1 1H6V7l-5 5 5 5v-3h3zm11 3-5 5v-3h-4v3l-5-5 5-5v3h4z"/></svg>
                        </button>
                    }
                    <div [innerHTML]="section.contentHtml"></div>
                </div>
              }
          </div>
          <div class="mt-12 pt-4 border-t border-[#EEEEEE] text-[10px] text-gray-300 uppercase tracking-widest">
            AI Generated Content. Physician Review Required.
          </div>
        } @else if (!gemini.isLoading() && !hasAnyReport()) {
          <div class="h-40 border border-dashed border-gray-200 flex items-center justify-center no-print">
            <p class="text-xs text-gray-300 font-medium">Waiting for input data...</p>
          </div>
        }

        <!-- Interactive Toolbar -->
        @if (hoveredElement() && toolbarPosition(); as pos) {
          <div #toolbar 
                (mouseover)="onToolbarEnter()" 
                (mouseleave)="onToolbarLeave()"
                class="absolute flex flex-col items-center gap-1 bg-white border border-gray-200 rounded-md shadow-lg p-1 z-30 transition-all duration-150 ease-out"
                [style.top]="pos.top"
                [style.left]="pos.left">
              <button (click)="addToCarePlan()" title="Add to Care Plan Draft" class="w-7 h-7 flex items-center justify-center rounded-sm text-gray-500 hover:bg-gray-100 hover:text-green-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z"/></svg>
              </button>
              <button (click)="researchSelection()" title="Research Selection" class="w-7 h-7 flex items-center justify-center rounded-sm text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5A6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14"/></svg>
              </button>
              <button (click)="sendToSpark()" title="Send to Spark" class="w-7 h-7 flex items-center justify-center rounded-sm text-gray-500 hover:bg-gray-100 hover:text-purple-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3z"/></svg>
              </button>
              <div class="h-px w-full bg-gray-200 my-0.5"></div>
              <button (click)="dismissSelection()" title="Dismiss" class="w-7 h-7 flex items-center justify-center rounded-sm text-gray-500 hover:bg-gray-100 hover:text-red-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7c2.76 0 5 2.24 5 5s-2.24 5-5 5s-5-2.24-5-5s2.24-5 5-5m0-2C7 5 3.27 7.94 2 12c1.27 4.06 5 7 10 7s8.73-2.94 10-7c-1.27-4.06-5-7-10-7m0 9.5c.95 0 1.8-.32 2.48-1.02l-3.5-3.5C10.32 10.7 11.05 11.5 12 11.5m6.06-3.56L16.65 6.5l-2.83 2.83c-.42-.1-.86-.17-1.32-.17c-2.21 0-4 1.79-4 4c0 .46.07.9.17 1.32l-2.83 2.83l-1.41-1.41l10-10l1.41 1.41z"/></svg>
              </button>
          </div>
        }
    </div>

    <!-- Live Consult Section -->
    @if (state.isLiveAgentActive()) {
        <!-- Draggable Resizer -->
        <div (mousedown)="startDrag($event)" class="shrink-0 h-2 bg-gray-100 hover:bg-gray-200 transition-colors cursor-row-resize z-20 no-print"></div>

        <div class="shrink-0 bg-white z-10 no-print flex flex-col" [style.height.px]="chatHeight()">
            
            <!-- Transcript -->
            <div #transcriptContainer class="flex-1 overflow-y-auto p-8 space-y-6">
                 @for (entry of parsedTranscript(); track $index) {
                  <div class="flex gap-4 max-w-[85%]" [class.ml-auto]="entry.role === 'user'" [class.flex-row-reverse]="entry.role === 'user'">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                         [class.bg-[#F1F8E9]]="entry.role === 'model'"
                         [class.text-[#558B2F]]="entry.role === 'model'"
                         [class.bg-[#4527A0]]="entry.role === 'user'"
                         [class.text-white]="entry.role === 'user'">
                         {{ entry.role === 'model' ? 'AI' : 'DR' }}
                    </div>
                    @if (entry.role === 'model') {
                        <div class="p-4 rounded-lg bg-[#F8F8F8] text-[#1C1C1C] rams-typography" [innerHTML]="entry.htmlContent"></div>
                    } @else {
                        <div class="p-4 rounded-lg text-sm font-light leading-relaxed bg-[#4527A0] text-white/90">
                          <p>{{ entry.text }}</p>
                        </div>
                    }
                  </div>
                }
            </div>

            <!-- Controls -->
            <div class="shrink-0 p-6 border-t border-[#EEEEEE] flex flex-col items-center justify-center gap-4">
                @if (permissionError(); as error) {
                  <div class="p-2 mb-2 bg-red-50 border border-red-200 text-center max-w-md w-full">
                    <p class="font-bold text-red-700 text-xs">Microphone Access Issue</p>
                    <p class="text-xs text-red-600/80 mt-1">{{ error }}</p>
                  </div>
                }
                <form (submit)="sendMessage()" class="w-full max-w-2xl flex items-center gap-2">
                    <textarea
                      #chatInput
                      rows="1"
                      [value]="messageText()"
                      (input)="messageText.set($event.target.value)"
                      (keydown.enter)="sendMessage($event)"
                      placeholder="Ask a follow-up question..."
                      [disabled]="agentState() !== 'idle'"
                      class="flex-1 bg-white border border-[#EEEEEE] p-3 text-sm text-[#1C1C1C] focus:border-[#1C1C1C] focus:ring-0 transition-colors placeholder-gray-400 resize-none disabled:bg-gray-50"
                    ></textarea>

                    <button type="submit" [disabled]="!messageText().trim() || agentState() !== 'idle'"
                            class="w-12 h-12 flex items-center justify-center bg-[#1C1C1C] hover:bg-[#689F38] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-white shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20v-6l8-2-8-2V4l19 8z"/></svg>
                    </button>
                    <button type="button" (click)="toggleListening()" [disabled]="agentState() !== 'idle' || !!permissionError()"
                            class="w-12 h-12 flex items-center justify-center border border-[#EEEEEE] hover:border-[#1C1C1C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                            [class.bg-[#689F38]]="agentState() === 'listening'"
                            [class.border-[#689F38]]="agentState() === 'listening'">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5"
                             [class.text-white]="agentState() === 'listening'"
                             [class.text-gray-500]="agentState() === 'idle'"
                             viewBox="0 0 24 24" fill="currentColor"><path d="M12 14q-1.25 0-2.125-.875T9 11V5q0-1.25.875-2.125T12 2q1.25 0 2.125.875T15 5v6q0 1.25-.875 2.125T12 14m-1 7v-3.075q-2.6-.35-4.3-2.325T5 11h2q0 2.075 1.463 3.537T12 16q2.075 0 3.538-1.463T17 11h2q0 2.225-1.7 4.2T13 17.925V21z"/></svg>
                    </button>
                </form>
            </div>
        </div>
    }
  `
})
export class AnalysisReportComponent implements OnDestroy {
  gemini = inject(GeminiService);
  state = inject(PatientStateService);
  patientManager = inject(PatientManagementService);
  
  // --- Analysis State ---
  activeLens = signal<AnalysisLens>('Standard');

  // --- Hover Toolbar State ---
  hoveredElement = signal<HTMLElement | null>(null);
  toolbarPosition = signal<{ top: string; left: string } | null>(null);
  private leaveTimeout: any;

  // --- Agent State ---
  agentState = signal<AgentState>('idle');
  permissionError = signal<string | null>(null);
  messageText = signal<string>('');
  
  private recognition: any;
  private preferredVoice = signal<SpeechSynthesisVoice | undefined>(undefined);
  private hasStartedChat = false;

  // --- Resizable Chat State ---
  chatHeight = signal<number>(256); // Default height (h-64 = 16rem = 256px)
  private boundDoDrag = this.doDrag.bind(this);
  private boundStopDrag = this.stopDrag.bind(this);
  private initialDragY: number = 0;
  private initialChatHeight: number = 0;
  
  // --- Auto-scroll State ---
  transcriptContainer = viewChild<ElementRef<HTMLDivElement>>('transcriptContainer');
  contentArea = viewChild<ElementRef<HTMLDivElement>>('contentArea');

  hasAnyReport = computed(() => Object.keys(this.gemini.analysisResults()).length > 0);
  activeReport = computed(() => this.gemini.analysisResults()[this.activeLens()]);
  
  reportSections = computed<ReportSection[] | null>(() => {
    const raw = this.activeReport();
    if (!raw) return null;
    try {
      const sections: ReportSection[] = [];
      // Split by lines that start with a markdown heading
      const parts = raw.split(/\n(?=#{1,3}\s)/);
      for (const part of parts) {
        // Find the first line, which is the heading
        const lines = part.split('\n');
        const headingMarkdown = lines[0];
        const contentMarkdown = lines.slice(1).join('\n');
        
        sections.push({
          raw: part,
          heading: marked.parse(headingMarkdown) as string,
          contentHtml: this.renderInteractiveContent(contentMarkdown),
        });
      }
      return sections;
    } catch (e) {
        console.error('Markdown parse error', e);
        return [{ raw: raw, heading: '<h3>Error</h3>', contentHtml: `<p>Could not parse report.</p>` }];
    }
  });

  parsedTranscript = computed<ParsedTranscriptEntry[]>(() => {
    const transcript = this.gemini.transcript();
    try {
        return transcript.map(entry => {
            if (entry.role === 'model') {
                return { ...entry, htmlContent: this.renderInteractiveContent(entry.text) };
            }
            return entry;
        });
    } catch (e) {
        console.error('Transcript parse error', e);
        return transcript;
    }
  });
  
  constructor() {
    this.initializeSpeechRecognition();
    this.loadVoices();
    speechSynthesis.onvoiceschanged = () => this.loadVoices();
    
    // Auto-scroll effect
    effect(() => {
      // This effect depends on the parsedTranscript signal.
      // It will run whenever the transcript changes.
      this.parsedTranscript(); 
      this.scrollToBottom();
    });

    // New effect to handle analysis updates requested from other components
    effect(() => {
      const requestCount = this.state.analysisUpdateRequest();
      if (requestCount > 0) {
        untracked(() => {
          this.generate();
        });
      }
    });
  }

  ngOnDestroy() {
    if (speechSynthesis.speaking) speechSynthesis.cancel();
    if (this.recognition && this.agentState() === 'listening') this.recognition.stop();
  }

  private renderInteractiveContent(markdown: string): string {
    return marked.parse(markdown) as string;
  }

  // --- NEW HOVER & TOOLBAR LOGIC ---
  handleContentMouseOver(event: MouseEvent) {
    clearTimeout(this.leaveTimeout);
    const target = event.target as HTMLElement;
    const element = target.closest<HTMLElement>('p, li');
    
    if (element && element.innerText.trim()) {
        const container = (event.currentTarget as HTMLElement);
        if (this.hoveredElement() !== element) {
            this.hoveredElement.set(element);
            const rect = element.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const toolbarWidth = 32; // w-7 is 28px + padding

            this.toolbarPosition.set({
                top: `${rect.bottom - containerRect.top + container.scrollTop + 5}px`,
                left: `${rect.right - containerRect.left - toolbarWidth}px`
            });
        }
    }
  }

  handleContentMouseLeave() {
    this.leaveTimeout = setTimeout(() => {
      this.hoveredElement.set(null);
    }, 200);
  }

  onToolbarEnter() {
    clearTimeout(this.leaveTimeout);
  }

  onToolbarLeave() {
    this.leaveTimeout = setTimeout(() => {
      this.hoveredElement.set(null);
    }, 200);
  }
  
  // --- TOOLBAR ACTIONS ---
  addToCarePlan() {
    const element = this.hoveredElement();
    if (element && element.innerText.trim()) {
      this.state.addDraftCarePlanItem(element.innerText.trim());
      // Visual feedback
      element.style.transition = 'background-color 0.5s ease';
      element.style.backgroundColor = '#DCEDC8';
      setTimeout(() => {
        element.style.backgroundColor = '';
      }, 500);
    }
  }
  
  researchSelection() {
    const element = this.hoveredElement();
    if (element && element.innerText.trim()) {
        this.state.requestResearchSearch(element.innerText.trim());
    }
  }
  
  sendToSpark() {
    const element = this.hoveredElement();
    if (element && element.innerText.trim()) {
        const text = element.innerText.trim();
        const url = `https://spark.philgear.dev/#/care?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    }
  }
  
  dismissSelection() {
    const element = this.hoveredElement();
    if (element) {
      element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      element.style.opacity = '0.3';
      element.style.textDecoration = 'line-through';
      element.style.pointerEvents = 'none';
    }
  }

  // --- Report Actions ---
  async generate() {
    const reportData = await this.gemini.generateComprehensiveReport(this.state.getAllDataForPrompt());

    const patientId = this.patientManager.selectedPatientId();
    if (patientId && Object.keys(reportData).length > 0) {
        const historyEntry: HistoryEntry = {
            type: 'AnalysisRun',
            date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
            summary: 'Comprehensive AI analysis generated.',
            report: reportData
        };
        this.patientManager.addHistoryEntry(patientId, historyEntry);
        this.activeLens.set('Standard');
    }
  }

  changeLens(lens: AnalysisLens) {
    this.activeLens.set(lens);
  }

  printReport() { window.print(); }

  // --- Live Consult Actions ---
  startLiveConsult() { 
    this.state.toggleLiveAgent(true);
    if (!this.hasStartedChat) {
      this.gemini.startChatSession(this.state.getAllDataForPrompt());
      this.gemini.getInitialGreeting().then(greeting => {
          this.speak(greeting);
      });
      this.hasStartedChat = true;
    }
  }
  endLiveConsult() { this.state.toggleLiveAgent(false); }

  insertSectionIntoChat(sectionMarkdown: string) {
    this.messageText.set(`Regarding this section:\n\n> ${sectionMarkdown.replace(/\n/g, '\n> ')}\n\n`);
    const input = document.querySelector<HTMLTextAreaElement>('#chatInput');
    input?.focus();
  }
  
  // --- Drag/Resize Handlers ---
  startDrag(event: MouseEvent): void {
    event.preventDefault();
    this.initialDragY = event.clientY;
    this.initialChatHeight = this.chatHeight();
    document.addEventListener('mousemove', this.boundDoDrag);
    document.addEventListener('mouseup', this.boundStopDrag);
  }

  private doDrag(event: MouseEvent): void {
    const deltaY = event.clientY - this.initialDragY;
    const newHeight = this.initialChatHeight - deltaY;
    const maxHeight = window.innerHeight * 0.8;
    this.chatHeight.set(Math.max(120, Math.min(newHeight, maxHeight)));
  }

  private stopDrag(): void {
    document.removeEventListener('mousemove', this.boundDoDrag);
    document.removeEventListener('mouseup', this.boundStopDrag);
  }

  // --- Auto-scroll Handler ---
  private scrollToBottom(): void {
    // Use a timeout to allow Angular to render the new transcript item in the DOM
    setTimeout(() => {
      const container = this.transcriptContainer()?.nativeElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 0);
  }
  
  // --- Speech & Agent Logic ---
  private loadVoices() {
    const availableVoices = speechSynthesis.getVoices();
    if (availableVoices.length === 0) return;
    const professionalFemaleVoice = availableVoices.find(v => v.lang.startsWith('en') && v.name.includes('Google') && v.name.includes('Female')) || availableVoices.find(v => v.lang.startsWith('en') && (v.name.includes('Samantha') || v.name.includes('Victoria') || v.name.includes('Google'))) || availableVoices.find(v => v.lang.startsWith('en-US') && v.name.includes('Female')) || availableVoices.find(v => v.lang.startsWith('en-US') && !v.name.includes('Male'));
    this.preferredVoice.set(professionalFemaleVoice);
  }
  
  private initializeSpeechRecognition() {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      this.permissionError.set("Speech Recognition API not supported in this browser.");
      return;
    }
    
    this.recognition = new SpeechRecognitionAPI();
    this.recognition.continuous = false;
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = false;

    this.recognition.onstart = () => { this.permissionError.set(null); this.agentState.set('listening'); };
    this.recognition.onend = () => { if (this.agentState() === 'listening') this.agentState.set('idle'); };
    this.recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        this.permissionError.set('Microphone permission was denied. Please allow microphone access in your browser settings.');
      } else if (event.error === 'no-speech') {
        // Ignore no-speech errors, just reset state.
      } else if (event.error === 'network') {
         this.permissionError.set('Network error. Please check your connection.');
      } else {
         this.permissionError.set(`Speech recognition error: ${event.error}`);
      }
      this.agentState.set('idle');
    };
    this.recognition.onresult = async (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      this.agentState.set('processing');
      const responseText = await this.gemini.sendChatMessage(transcript);
      this.speak(responseText);
    };
  }
  
  async sendMessage(event?: Event) {
    event?.preventDefault();
    if (event instanceof KeyboardEvent && event.shiftKey) {
        return; // Allow newline on Shift+Enter
    }

    const message = this.messageText().trim();
    if (!message || this.agentState() !== 'idle') return;

    this.messageText.set('');
    this.agentState.set('processing');
    const responseText = await this.gemini.sendChatMessage(message);
    this.speak(responseText);
  }

  toggleListening() {
    if (!this.recognition || this.permissionError() || this.agentState() !== 'idle') return;
    if (this.agentState() === 'idle') {
      this.recognition.start();
    } else if (this.agentState() === 'listening') {
      this.recognition.stop();
    }
  }

  speak(text: string) {
    if (!('speechSynthesis' in window)) {
      console.error('Speech Synthesis not supported.');
      this.agentState.set('idle');
      return;
    }
    if (speechSynthesis.speaking) speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.preferredVoice()) { utterance.voice = this.preferredVoice()!; }
    utterance.pitch = 1.1;
    utterance.rate = 0.95;
    
    utterance.onstart = () => this.agentState.set('speaking');
    utterance.onend = () => this.agentState.set('idle');
    utterance.onerror = (e) => {
      if (e.error === 'interrupted') return; 
      console.error('Speech synthesis error', e.error);
      this.agentState.set('idle');
    };
    speechSynthesis.speak(utterance);
  }
}