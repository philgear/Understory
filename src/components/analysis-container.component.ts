import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MedicalChartSummaryComponent } from './medical-summary.component';
import { AnalysisReportComponent } from './analysis-report.component';
import { IntakeFormComponent } from './intake-form.component';
import { PatientStateService } from '../services/patient-state.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-analysis-container',
  standalone: true,
  imports: [CommonModule, AnalysisReportComponent],
  template: `
    <div class="flex flex-col h-full w-full overflow-hidden bg-[#F9FAFB] p-6">
      <!-- Card Body -->
      <div class="flex-1 min-h-0 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md">
        <div class="flex-1 overflow-y-auto">
            @if (state.selectedPartId() && !state.isLiveAgentActive()) {
              <app-intake-form></app-intake-form>
            } @else {
              <app-analysis-report></app-analysis-report>
            }
        </div>
      </div>
    </div>
  `
})
export class AnalysisContainerComponent {
  state = inject(PatientStateService);
}
