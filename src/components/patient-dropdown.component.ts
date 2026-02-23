import { Component, ChangeDetectionStrategy, inject, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientManagementService } from '../services/patient-management.service';

@Component({
    selector: 'app-patient-dropdown',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="relative inline-block text-left z-50">
      <div>
        <button type="button" (click)="toggleDropdown()" class="group flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold uppercase tracking-widest hover:bg-[#EEEEEE] hover:border-gray-400 transition-colors">
          <span>{{ currentPatientName() }}</span>
          <svg class="-mr-1 ml-2 h-4 w-4 transition-transform" [class.rotate-180]="isOpen()" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>

      @if (isOpen()) {
        <div class="origin-top-right absolute right-0 mt-2 w-72 rounded-sm shadow-xl bg-white ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden flex flex-col max-h-[60vh]">
          
          <div class="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center justify-between shrink-0">
             <span class="text-[10px] font-bold uppercase tracking-widest text-gray-500">Active Roster</span>
             <span class="text-[10px] font-bold text-gray-400">{{ patientManagement.patients().length }}</span>
          </div>

          <div class="py-1 overflow-y-auto flex-1">
            @for (patient of patientManagement.patients(); track patient.id) {
              <button (click)="selectPatient(patient.id)" class="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-[#F8F9FA] hover:text-gray-900 flex items-center gap-3 transition-colors relative border-l-4" [class.bg-blue-50]="patient.id === patientManagement.selectedPatientId()" [class.border-[#689F38]]="patient.id === patientManagement.selectedPatientId()" [class.border-transparent]="patient.id !== patientManagement.selectedPatientId()">
                
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 font-bold shadow-sm"
                     [class.bg-[#689F38]]="patient.id === patientManagement.selectedPatientId()"
                     [class.text-white]="patient.id === patientManagement.selectedPatientId()"
                     [class.bg-gray-200]="patient.id !== patientManagement.selectedPatientId()"
                     [class.text-gray-600]="patient.id !== patientManagement.selectedPatientId()">
                  {{ patient.name.charAt(0) }}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="font-bold text-gray-900 text-sm truncate">{{ patient.name }}</div>
                  <div class="text-[10px] text-gray-500 font-medium uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                     <span class="whitespace-nowrap">{{ patient.age }} YRS</span>
                     <span class="w-1 h-1 bg-gray-300 rounded-full shrink-0"></span>
                     <span class="truncate">{{ patient.gender }}</span>
                  </div>
                </div>
              </button>
            }
          </div>
          
          <div class="border-t border-gray-100 bg-white shrink-0">
             <button (click)="createNewPatient()" class="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-[#689F38] hover:bg-[#F1F8E9] hover:text-[#558B2F] transition-colors flex items-center gap-2 justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z"/></svg>
                New Patient
             </button>
          </div>
        </div>
      }
    </div>
  `
})
export class PatientDropdownComponent {
    patientManagement = inject(PatientManagementService);
    elementRef = inject(ElementRef);
    isOpen = signal(false);

    currentPatientName() {
        const activeId = this.patientManagement.selectedPatientId();
        if (!activeId) return 'Select Patient';
        const patient = this.patientManagement.patients().find(p => p.id === activeId);
        return patient ? patient.name : 'Select Patient';
    }

    toggleDropdown() {
        this.isOpen.update(v => !v);
    }

    selectPatient(id: string) {
        this.patientManagement.selectPatient(id);
        this.isOpen.set(false);
    }

    createNewPatient() {
        this.patientManagement.createNewPatient();
        this.isOpen.set(false);
    }

    @HostListener('document:click', ['$event'])
    onClickOutside(event: Event) {
        if (this.isOpen() && !this.elementRef.nativeElement.contains(event.target)) {
            this.isOpen.set(false);
        }
    }
}
