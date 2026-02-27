import { Component, ChangeDetectionStrategy, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalysisReportComponent } from './analysis-report.component';
import { IntakeFormComponent } from './intake-form.component';
import { PatientStateService } from '../services/patient-state.service';
import { AiCacheService } from '../services/ai-cache.service';
import { ClinicalIntelligenceService } from '../services/clinical-intelligence.service';
import { ExportService } from '../services/export.service';
import { ClinicalTrendComponent } from './clinical-trend.component';
import { UnderstoryButtonComponent } from './shared/understory-button.component';

@Component({
  selector: 'app-analysis-container',
  standalone: true,
  imports: [CommonModule, AnalysisReportComponent, IntakeFormComponent, ClinicalTrendComponent, UnderstoryButtonComponent],
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
        
        <!-- Top Toolbar -->
        <div class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <div class="flex items-center gap-4">
            <understory-button 
                    (click)="showHistory.set(!showHistory())" 
                    [variant]="showHistory() ? 'secondary' : 'ghost'" 
                    size="sm"
                    icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z">
               History
            </understory-button>
          </div>

          <!-- Export Actions -->
          <div class="flex items-center gap-2">
            @if (hasReport()) {
              <understory-button 
                (click)="exportPdf()" 
                variant="secondary" 
                size="sm" 
                icon="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z">
                PDF
              </understory-button>
              <understory-button 
                (click)="exportFhir()" 
                variant="secondary" 
                size="sm" 
                icon="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4">
                FHIR
              </understory-button>
            }
          </div>
        </div>

        <div class="flex-1 flex flex-col overflow-hidden p-6 gap-6">
          <div class="flex-1 min-h-0 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md">
            <div class="flex-1 overflow-y-auto relative">
                @if (state.selectedPartId() && !state.isLiveAgentActive()) {
                  <app-intake-form></app-intake-form>
                } @else {
                  <app-analysis-report></app-analysis-report>
                }
            </div>
          </div>
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
    const metrics = this.intelligence.analysisMetrics();
    this.export.downloadAsPdf({
      report: results,
      summary: results['Care Plan Overview'] // Use overview as summary
    }, 'Clinical User');
  }

  exportFhir() {
    const results = this.intelligence.analysisResults();
    this.export.downloadAsFhir({
      report: results,
      summary: results['Care Plan Overview']
    }, 'Clinical User');
  }
}
