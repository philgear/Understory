import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientManagementService } from '../services/patient-management.service';

@Component({
  selector: 'app-patient-sidebar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.w-64]': '!isCollapsed()',
    '[class.w-16]': 'isCollapsed()',
    'class': 'bg-[#1C1C1C] text-white flex flex-col h-full shrink-0 transition-all duration-300 ease-in-out'
  },
  template: `
    <!-- Header -->
    <div class="h-14 border-b border-white/10 flex items-center shrink-0" [class.justify-between]="!isCollapsed()" [class.justify-center]="isCollapsed()">
      <div class="flex items-center gap-2 px-4" [class.opacity-0]="isCollapsed()" [class.w-0]="isCollapsed()" [class.h-0]="isCollapsed()">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12q-1.65 0-2.825-1.175T8 8q0-1.65 1.175-2.825T12 4q1.65 0 2.825 1.175T16 8q0 1.65-1.175 2.825T12 12m-8 8v-2.8q0-.85.438-1.562T5.6 14.55q1.55-.775 3.15-1.162T12 13q1.65 0 3.25.388t3.15 1.162q.725.375 1.163 1.088T20 17.2V20z"/></svg>
        <span class="text-[10px] font-bold uppercase tracking-widest">Patients</span>
      </div>
      <button (click)="isCollapsed.set(!isCollapsed())" class="h-14 w-16 flex items-center justify-center text-gray-400 hover:bg-white/5 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transition-transform duration-300" [class.rotate-180]="isCollapsed()" viewBox="0 0 24 24" fill="currentColor"><path d="M14 17.65 8.35 12 14 6.35l1.05 1.05L10.45 12l4.6 4.6z"/></svg>
      </button>
    </div>

    <!-- Patient List -->
    <div class="flex-1 overflow-y-auto px-3 py-4 space-y-2">
      <ul class="space-y-2">
        @for (patient of patientManagement.patients(); track patient.id) {
          <li>
            <button (click)="patientManagement.selectPatient(patient.id)" 
                    class="w-full flex items-center gap-3 text-left p-3 rounded-lg border transition-all duration-200 group relative overflow-hidden"
                    [class.bg-[#2C2C2C]]="patient.id !== patientManagement.selectedPatientId()"
                    [class.border-transparent]="patient.id !== patientManagement.selectedPatientId()"
                    [class.hover:bg-[#333333]]="patient.id !== patientManagement.selectedPatientId()"
                    [class.bg-[#1C1C1C]]="patient.id === patientManagement.selectedPatientId()"
                    [class.border-[#689F38]]="patient.id === patientManagement.selectedPatientId()"
                    [class.shadow-md]="patient.id === patientManagement.selectedPatientId()">
              
              <!-- Active Indicator Strip -->
              @if (patient.id === patientManagement.selectedPatientId()) {
                <div class="absolute left-0 top-0 bottom-0 w-1 bg-[#689F38]"></div>
              }

              <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 font-bold transition-transform group-hover:scale-105"
                   [class.bg-[#689F38]]="patient.id === patientManagement.selectedPatientId()"
                   [class.text-white]="patient.id === patientManagement.selectedPatientId()"
                   [class.bg-[#333333]]="patient.id !== patientManagement.selectedPatientId()"
                   [class.text-gray-400]="patient.id !== patientManagement.selectedPatientId()">
                {{ patient.name.charAt(0) }}
              </div>
              
              <div class="overflow-hidden transition-opacity duration-200" [class.opacity-0]="isCollapsed()" [class.w-0]="isCollapsed()">
                <p class="text-xs font-bold text-gray-200 truncate group-hover:text-white transition-colors">{{ patient.name }}</p>
                <div class="flex items-center gap-2 text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                    <span>{{ patient.age }} YRS</span>
                    <span class="w-0.5 h-0.5 bg-gray-600 rounded-full"></span>
                    <span>{{ patient.gender }}</span>
                </div>
              </div>
            </button>
          </li>
        }
      </ul>
    </div>

    <!-- Footer Action -->
    <div class="shrink-0 p-4 border-t border-white/5 bg-[#1C1C1C]">
      <button (click)="patientManagement.createNewPatient()" 
              class="w-full h-10 flex items-center gap-2 justify-center bg-[#2C2C2C] hover:bg-[#333333] border border-white/5 hover:border-white/10 rounded-lg transition-all group">
        <div class="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#689F38] group-hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z"/></svg>
        </div>
        <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors" 
              [class.opacity-0]="isCollapsed()" [class.absolute]="isCollapsed()" [class.pointer-events-none]="isCollapsed()">
              New Patient
        </span>
      </button>
    </div>
  `
})
export class PatientSidebarComponent {
  patientManagement = inject(PatientManagementService);
  isCollapsed = signal(false);
}
