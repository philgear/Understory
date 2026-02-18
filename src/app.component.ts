import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BodyViewerComponent } from './components/body-viewer.component';
import { IntakeFormComponent } from './components/intake-form.component';
import { AnalysisReportComponent } from './components/analysis-report.component';
import { PatientStateService, PatientVitals } from './services/patient-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, BodyViewerComponent, IntakeFormComponent, AnalysisReportComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-screen w-screen flex flex-col bg-white overflow-hidden selection:bg-orange-100 selection:text-orange-900">
      
      <!-- Navbar: Pure utility, no decoration -->
      <nav class="h-14 border-b border-slate-200 flex items-center justify-between px-6 shrink-0 bg-white z-20">
        <div class="flex items-center gap-4">
          <div class="font-semibold text-slate-900 tracking-tight text-sm">
            INTEGRATIVE<span class="text-slate-400 font-light">CARE</span>
          </div>
          <div class="h-4 w-px bg-slate-200"></div>
          <div class="text-xs text-slate-500 font-medium">INTAKE MODULE 01</div>
        </div>
        
        <div class="flex items-center gap-6 text-xs font-medium text-slate-500">
           <span>{{ today | date:'yyyy.MM.dd' }}</span>
           <span class="text-orange-600">REQ. DR. SMITH</span>
        </div>
      </nav>

      <!-- Main Grid Layout -->
      <div class="flex-1 flex overflow-hidden">
        
        <!-- Column 1: Patient Input (Vitals, Goals, Body) -->
        <div class="flex-[3] flex flex-col border-r border-slate-200 min-w-0 bg-slate-50/30">
          
          <!-- Top Section: Inputs -->
          <div class="bg-white border-b border-slate-100 flex flex-col shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] z-10">
            
            <!-- Patient Objective -->
            <div class="p-8 pb-6">
              <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Patient Objective</label>
              <input 
                type="text" 
                (input)="updateGoals($event)"
                placeholder="Enter primary health goal or complaint..."
                class="w-full text-xl font-light text-slate-800 placeholder-slate-300 bg-transparent border-none focus:ring-0 p-0"
              />
            </div>

            <!-- Vitals Grid -->
            <div class="px-8 pb-8 grid grid-cols-6 gap-6">
              
              <!-- BP -->
              <div class="flex flex-col gap-1">
                <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">BP</label>
                <input type="text" placeholder="120/80" (input)="updateVital('bp', $event)"
                       class="w-full border-b border-slate-200 py-1 text-sm font-medium text-slate-700 placeholder-slate-300 focus:outline-none focus:border-orange-500 transition-colors bg-transparent">
              </div>

              <!-- HR -->
              <div class="flex flex-col gap-1">
                <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">HR</label>
                <input type="text" placeholder="BPM" (input)="updateVital('hr', $event)"
                       class="w-full border-b border-slate-200 py-1 text-sm font-medium text-slate-700 placeholder-slate-300 focus:outline-none focus:border-orange-500 transition-colors bg-transparent">
              </div>

              <!-- SpO2 -->
              <div class="flex flex-col gap-1">
                <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">SpO2</label>
                <input type="text" placeholder="%" (input)="updateVital('spO2', $event)"
                       class="w-full border-b border-slate-200 py-1 text-sm font-medium text-slate-700 placeholder-slate-300 focus:outline-none focus:border-orange-500 transition-colors bg-transparent">
              </div>

              <!-- Temp -->
              <div class="flex flex-col gap-1">
                <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Temp</label>
                <input type="text" placeholder="°F" (input)="updateVital('temp', $event)"
                       class="w-full border-b border-slate-200 py-1 text-sm font-medium text-slate-700 placeholder-slate-300 focus:outline-none focus:border-orange-500 transition-colors bg-transparent">
              </div>

              <!-- Weight -->
              <div class="flex flex-col gap-1">
                <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Wgt</label>
                <input type="text" placeholder="lbs" (input)="updateVital('weight', $event)"
                       class="w-full border-b border-slate-200 py-1 text-sm font-medium text-slate-700 placeholder-slate-300 focus:outline-none focus:border-orange-500 transition-colors bg-transparent">
              </div>
              
               <!-- Height -->
              <div class="flex flex-col gap-1">
                <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Hgt</label>
                <input type="text" placeholder="ft/in" (input)="updateVital('height', $event)"
                       class="w-full border-b border-slate-200 py-1 text-sm font-medium text-slate-700 placeholder-slate-300 focus:outline-none focus:border-orange-500 transition-colors bg-transparent">
              </div>

            </div>
          </div>

          <!-- Interactive Body Map -->
          <div class="flex-1 relative overflow-hidden flex items-center justify-center p-4">
             <app-body-viewer></app-body-viewer>
          </div>
        </div>

        <!-- Column 2: Analysis (Report) -->
        <div class="flex-[2] bg-white h-full overflow-hidden flex flex-col min-w-[320px]">
           <app-analysis-report></app-analysis-report>
        </div>

        <!-- Drawer: Contextual Input -->
        @if (state.selectedPartId()) {
          <div class="w-[360px] border-l border-slate-200 bg-white z-30 shadow-2xl shadow-slate-200/50">
            <app-intake-form></app-intake-form>
          </div>
        }
      </div>
    </div>
  `
})
export class AppComponent {
  state = inject(PatientStateService);
  today = new Date();

  updateGoals(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    this.state.updateGoals(val);
  }

  updateVital(field: keyof PatientVitals, e: Event) {
    const val = (e.target as HTMLInputElement).value;
    this.state.updateVital(field, val);
  }
}