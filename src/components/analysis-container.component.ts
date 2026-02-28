import { Component, ChangeDetectionStrategy, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalysisReportComponent } from './analysis-report.component';
import { PatientStateService } from '../services/patient-state.service';
import { AiCacheService } from '../services/ai-cache.service';
import { ClinicalIntelligenceService } from '../services/clinical-intelligence.service';
import { ExportService } from '../services/export.service';
import { ClinicalTrendComponent } from './clinical-trend.component';
import { UnderstoryButtonComponent } from './shared/understory-button.component';
import { PatientManagementService } from '../services/patient-management.service';

@Component({
  selector: 'app-analysis-container',
  standalone: true,
  imports: [CommonModule, AnalysisReportComponent, ClinicalTrendComponent, UnderstoryButtonComponent],
  template: `
    <div class="flex h-full w-full overflow-hidden bg-[#F3F4F6]">
      
      <!-- History Sidebar (Continuity) -->
      @if (showHistory()) {
        <div class="w-80 border-r border-gray-200 bg-white/80 backdrop-blur-xl flex flex-col shrink-0 animate-in slide-in-from-left duration-300">
          <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-white/50">
            <h2 class="text-xs font-bold text-gray-800 uppercase tracking-widest">Clinical History</h2>
            <button (click)="showHistory.set(false)" class="text-gray-400 hover:text-gray-600">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <div class="flex-1 overflow-y-auto p-4 space-y-4">
             <!-- Trends Section -->
             @if (historicalMetrics().length > 1) {
               <div class="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                 <h3 class="text-xs font-bold text-gray-400 uppercase tracking-tighter mb-4">Longitudinal Trends</h3>
                 <app-clinical-trend label="Complexity" [values]="getHistoryValues('complexity')" type="complexity"></app-clinical-trend>
                 <app-clinical-trend label="Stability" [values]="getHistoryValues('stability')" type="stability"></app-clinical-trend>
                 <app-clinical-trend label="Certainty" [values]="getHistoryValues('certainty')" type="certainty"></app-clinical-trend>
               </div>
             }

             <!-- History List -->
             @for (entry of historyEntries(); track entry.key) {
               <div (click)="loadHistory(entry)" 
                    class="group p-4 rounded-xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm cursor-pointer transition-all">
                 <div class="flex justify-between items-start mb-1">
                   <span class="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                     SNAPSHOT
                   </span>
                   <span class="text-xs text-gray-400 font-medium">
                     {{ entry.lastUsed | date:'short' }}
                   </span>
                 </div>
                 <p class="text-xs font-semibold text-gray-800 line-clamp-2">
                   {{ entry.value.report['Care Plan Overview']?.substring(0, 100) }}...
                 </p>
               </div>
             } @empty {
               <div class="h-64 flex items-center justify-center text-gray-400 text-xs text-center border-2 border-dashed border-gray-100 rounded-xl m-2">
                 No historical<br>snapshots found.
               </div>
             }
          </div>
        </div>
      }

      <!-- Main Content Container -->
      <div class="flex-1 flex flex-col min-w-0">
        
        <!-- Top Toolbar / Header -->
        <div class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 relative z-10">
          <div class="flex items-center gap-6">
            <understory-button 
                    (click)="showHistory.set(!showHistory())" 
                    [variant]="showHistory() ? 'secondary' : 'ghost'" 
                    size="sm"
                    icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z">
               Clinical History
            </understory-button>
            
            <div class="h-6 w-px bg-gray-200 hidden sm:block"></div>
            
            <div class="hidden sm:block">
              <h1 class="text-sm font-bold text-gray-900 leading-tight">AI Clinical Synthesis</h1>
              <p class="text-[10px] uppercase font-medium tracking-widest text-gray-500">Understory Intelligence v2.4</p>
            </div>
          </div>

          <!-- Export Actions & Status -->
          <div class="flex items-center gap-4">
            @if (hasReport()) {
              <div class="hidden md:flex items-center gap-2 mr-2">
                 <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Analysis Complete</span>
              </div>
              
              <div class="flex gap-2">
                <understory-button 
                  (click)="exportPdf()" 
                  variant="secondary" 
                  size="sm" 
                  icon="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z">
                  Export PDF
                </understory-button>
                <understory-button 
                  (click)="exportFhir()" 
                  variant="secondary" 
                  size="sm" 
                  icon="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4">
                  Export FHIR
                </understory-button>
              </div>
            } @else {
               <div class="hidden md:flex items-center gap-2 mr-2">
                 <div class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                 <span class="text-[10px] font-bold uppercase tracking-wider text-blue-700">Awaiting Data</span>
              </div>
            }
          </div>
        </div>

        <div class="flex-1 flex flex-col overflow-hidden p-6 gap-6 relative">
          <div class="flex-1 min-h-0 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md">
            <div class="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                <app-analysis-report></app-analysis-report>
            </div>
          </div>
          
          <!-- Redesigned Minimalist Footer (Dieter Rams inspired) -->
          @if (hasReport()) {
            <div class="shrink-0 mt-2 pt-6 border-t border-black/10 grid grid-cols-1 md:grid-cols-3 gap-6 font-['Inter'] no-print opacity-80 hover:opacity-100 transition-opacity">
              <div class="space-y-1">
                <div class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#000000]">System Identification</div>
                <div class="text-[10px] font-medium text-black/60 uppercase tracking-widest">Understory Analysis Engine v2.4.0</div>
              </div>
              <div class="space-y-1">
                <div class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#000000]">Analysis Metadata</div>
                <div class="text-[10px] font-medium text-black/60 uppercase tracking-widest">Generated: {{ intelligence.lastRefreshTime() | date:'yyyy.MM.dd HH:mm:ss' }}</div>
              </div>
              <div class="space-y-1 md:text-right">
                <div class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#000000]">Regulatory Status</div>
                <div class="text-[10px] font-medium text-black/60 uppercase tracking-widest">AI Generated Evidence. Physician Oversight Mandated.</div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; width: 100%; }
    .animate-in { animation: slideIn 0.3s ease-out; }
    @keyframes slideIn {
      from { transform: translateX(-100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class AnalysisContainerComponent implements OnInit {
  state = inject(PatientStateService);
  cache = inject(AiCacheService);
  intelligence = inject(ClinicalIntelligenceService);
  export = inject(ExportService);
  patientMgmt = inject(PatientManagementService);

  showHistory = signal(false);
  historyEntries = signal<any[]>([]);

  ngOnInit() {
    this.refreshHistory();
  }

  async refreshHistory() {
    const entries = await this.cache.getAllEntries();
    // Filter for master snapshots
    this.historyEntries.set(entries.filter(e => e.value?._isSnapshot));
  }

  hasReport = computed(() => Object.keys(this.intelligence.analysisResults()).length > 0);

  historicalMetrics = computed(() => {
    return this.historyEntries()
      .map(e => e.value._metrics)
      .filter(m => !!m);
  });

  getHistoryValues(type: 'complexity' | 'stability' | 'certainty'): number[] {
    return this.historyEntries()
      .map(e => e.value?._metrics?.[type] || 5)
      .reverse(); // Newest last for chart
  }

  loadHistory(entry: any) {
    if (entry.value.report) {
      this.intelligence.loadArchivedAnalysis(entry.value.report);
    }
    if (entry.value._metrics) {
      this.intelligence.analysisMetrics.set(entry.value._metrics);
    }
    this.showHistory.set(false);
  }

  exportPdf() {
    const results = this.intelligence.analysisResults();
    const patient = this.patientMgmt.selectedPatient();
    const patientName = patient?.name || 'Clinical User';

    this.export.downloadAsPdf({
      report: results,
      summary: results['Care Plan Overview'] || 'No summary available.'
    }, patientName);
  }

  exportFhir() {
    const patient = this.patientMgmt.selectedPatient();
    if (patient) {
      this.export.downloadAsFhirBundle(patient);
    } else {
      // Fallback to simple diagnostic report if no patient is selected (unlikely)
      const results = this.intelligence.analysisResults();
      this.export.downloadAsFhir({
        report: results,
        summary: results['Care Plan Overview']
      }, 'Clinical User');
    }
  }
}
