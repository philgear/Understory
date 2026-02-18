import { Component, ChangeDetectionStrategy, inject, computed, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService } from '../services/gemini.service';
import { PatientStateService } from '../services/patient-state.service';
import { marked } from 'marked';

@Component({
  selector: 'app-analysis-report',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None, 
  styles: [`
    :host {
      display: block;
      height: 100%;
      overflow: hidden; /* Ensure host doesn't spill over */
    }

    .rams-typography h1, 
    .rams-typography h2, 
    .rams-typography h3 {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      font-weight: 700;
      color: #94a3b8;
      margin-top: 2rem;
      margin-bottom: 0.75rem;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 0.25rem;
    }
    
    .rams-typography h1:first-child,
    .rams-typography h2:first-child {
      margin-top: 0;
    }

    .rams-typography p {
      font-size: 0.875rem;
      font-weight: 300;
      line-height: 1.7;
      margin-bottom: 1.25rem;
      color: #334155;
    }

    .rams-typography strong {
      font-weight: 600;
      color: #0f172a;
    }

    .rams-typography ul {
      list-style: none;
      padding-left: 0;
      margin-bottom: 1.5rem;
    }

    .rams-typography li {
      font-size: 0.875rem;
      font-weight: 300;
      line-height: 1.6;
      margin-bottom: 0.5rem;
      padding-left: 1.25rem;
      position: relative;
      color: #334155;
    }

    /* Geometric square bullet */
    .rams-typography li::before {
      content: '';
      width: 4px;
      height: 4px;
      background: #f97316; /* Orange accent */
      position: absolute;
      left: 0;
      top: 0.6em;
    }
    
    .rams-typography blockquote {
      border-left: 2px solid #cbd5e1;
      padding-left: 1rem;
      font-style: italic;
      color: #64748b;
      margin: 1.5rem 0;
    }
  `],
  template: `
    <div class="h-full flex flex-col">
      <!-- Report Header -->
      <div class="p-8 pb-4 flex justify-between items-end bg-white shrink-0">
        <div>
          <h2 class="text-sm font-bold text-slate-900 uppercase tracking-widest">Integrative Analysis</h2>
          <p class="text-xs text-slate-400 mt-1">Research Generation Protocol</p>
        </div>
        
        @if (!gemini.isLoading()) {
          <button 
            (click)="generate()" 
            [disabled]="!state.hasIssues()"
            class="group flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-orange-600 disabled:opacity-20 disabled:hover:bg-slate-900 transition-colors">
            @if (gemini.analysisResult()) {
              <span>Update</span>
            } @else {
              <span>Process</span>
            }
            <svg class="w-3 h-3 text-slate-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        }
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-8 pt-4">
        
        @if (gemini.isLoading()) {
          <div class="h-full flex flex-col items-center justify-center opacity-50">
            <div class="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-4"></div>
            <p class="text-[10px] font-bold uppercase tracking-widest text-slate-900">Processing Data</p>
          </div>
        }

        @if (gemini.error(); as error) {
           <div class="p-4 border border-red-200 bg-red-50 text-red-900 text-xs">
             <strong class="block uppercase tracking-wider mb-1">System Error</strong>
             {{ error }}
           </div>
        }

        @if (parsedContent(); as content) {
           <div class="rams-typography" [innerHTML]="content"></div>
           
           <div class="mt-12 pt-4 border-t border-slate-100 text-[10px] text-slate-300 uppercase tracking-widest">
             AI Generated Content. Physician Review Required.
           </div>
        } @else if (!gemini.isLoading()) {
          <div class="h-40 border border-dashed border-slate-200 flex items-center justify-center">
             <p class="text-xs text-slate-300 font-medium">Waiting for input data...</p>
          </div>
        }
      </div>
    </div>
  `
})
export class AnalysisReportComponent {
  gemini = inject(GeminiService);
  state = inject(PatientStateService);

  parsedContent = computed(() => {
    const raw = this.gemini.analysisResult();
    if (!raw) return null;
    try {
        return marked.parse(raw) as string;
    } catch (e) {
        console.error('Markdown parse error', e);
        return raw; // Fallback to raw text
    }
  });

  generate() {
    this.gemini.generateResearch(this.state.getAllDataForPrompt());
  }
}