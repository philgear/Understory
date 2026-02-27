import { Component, ChangeDetectionStrategy, inject, signal, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientManagementService } from '../services/patient-management.service';
import { ExportService } from '../services/export.service';
import { UnderstoryButtonComponent } from './shared/understory-button.component';

@Component({
  selector: 'app-patient-dropdown',
  standalone: true,
  imports: [CommonModule, UnderstoryButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative inline-block text-left z-50">
      <div>
      <div>
        <understory-button 
          type="button" 
          (click)="toggleDropdown()" 
          variant="secondary" 
          size="sm"
          [trailingIcon]="isOpen() ? 'M19 15l-7-7-7 7' : 'M5 9l7 7 7-7'">
          {{ currentPatientName() }}
        </understory-button>
      </div>
      </div>

      @if (isOpen()) {
        <div class="origin-top-right absolute right-0 mt-2 w-72 rounded-sm shadow-xl bg-white ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden flex flex-col max-h-[60vh]">
          
          <div class="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center justify-between shrink-0">
             <span class="text-xs font-bold uppercase tracking-widest text-gray-500">Active Roster</span>
             <span class="text-xs font-bold text-gray-500">{{ patientManagement.patients().length }}</span>
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
                  <div class="text-xs text-gray-500 font-medium uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                     <span class="whitespace-nowrap">{{ patient.age }} YRS</span>
                     <span class="w-1 h-1 bg-gray-300 rounded-full shrink-0"></span>
                     <span class="truncate">{{ patient.gender }}</span>
                  </div>
                </div>
              </button>
            }
          </div>
          
          <div class="border-t border-gray-100 bg-white shrink-0 p-2 flex flex-col gap-1">
             <understory-button 
               (click)="createNewPatient()" 
               variant="ghost" 
               size="sm" 
               class="w-full"
               icon="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z">
                New Patient
             </understory-button>
             <understory-button 
               (click)="triggerImport()" 
               variant="ghost" 
               size="sm" 
               class="w-full"
               icon="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12">
                Import Patient
             </understory-button>
          </div>
        </div>
      }

      <!-- Hidden file input for import -->
      <input #fileInput type="file" accept=".json" class="hidden" (change)="onFileSelected($event)" />

      <!-- Import status toast -->
      @if (importStatus()) {
        <div class="absolute right-0 mt-2 w-72 p-3 rounded-lg shadow-lg text-sm font-medium z-50 animate-in fade-in slide-in-from-top duration-200"
             [class.bg-green-50]="importStatus()!.type === 'success'"
             [class.text-green-800]="importStatus()!.type === 'success'"
             [class.border-green-200]="importStatus()!.type === 'success'"
             [class.bg-red-50]="importStatus()!.type === 'error'"
             [class.text-red-800]="importStatus()!.type === 'error'"
             [class.border-red-200]="importStatus()!.type === 'error'"
             class="border">
          {{ importStatus()!.message }}
        </div>
      }
    </div>
  `
})
export class PatientDropdownComponent {
  patientManagement = inject(PatientManagementService);
  exportService = inject(ExportService);
  elementRef = inject(ElementRef);
  isOpen = signal(false);
  importStatus = signal<{ type: 'success' | 'error'; message: string } | null>(null);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

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

  triggerImport() {
    this.fileInput.nativeElement.value = ''; // Reset so same file can be re-selected
    this.fileInput.nativeElement.click();
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const patient = await this.exportService.importFromFile(file);
      this.patientManagement.importPatient(patient);
      this.isOpen.set(false);
      this.showStatus('success', `Imported "${patient.name}" successfully.`);
    } catch (err: any) {
      this.showStatus('error', err.message || 'Failed to import patient file.');
    }
  }

  private showStatus(type: 'success' | 'error', message: string) {
    this.importStatus.set({ type, message });
    setTimeout(() => this.importStatus.set(null), 3000);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (this.isOpen() && !this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }
}
