import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientStateService, PatientVitals, PatientState } from '../services/patient-state.service';
import { PatientManagementService, Patient, HistoryEntry } from '../services/patient-management.service';
import { BodyViewerComponent } from './body-viewer.component';
import { PatientHistoryTimelineComponent } from './patient-history-timeline.component';

@Component({
  selector: 'app-medical-chart',
  standalone: true,
  imports: [CommonModule, BodyViewerComponent, PatientHistoryTimelineComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full flex flex-col gap-8 p-8">

       <!-- Review Mode Banner -->
      @if(isReviewMode() && state.viewingPastVisit(); as visit) {
          <div class="bg-yellow-50 border border-yellow-300 p-3 flex justify-between items-center text-sm rounded-md">
              <div class="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-yellow-600 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2m.53 15H11v-6h1.53zm-.01-7.5c-.55 0-1-.45-1-1s.45-1 1-1s1 .45 1 1s-.45 1-1 1"/></svg>
                  @if (visit.type === 'Visit' || visit.type === 'ChartArchived') {
                    <span class="font-medium text-yellow-800">Reviewing past entry from <strong class="font-bold">{{ visit.date }}</strong>. All fields are read-only.</span>
                  } @else {
                     <span class="font-medium text-yellow-800">Reviewing past AI Analysis from <strong class="font-bold">{{ visit.date }}</strong>.</span>
                  }
              </div>
              <button (click)="returnToCurrent()" class="px-3 py-1 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors">Return to Current State</button>
          </div>
      }
      
      <!-- Patient Header -->
      @if(selectedPatient(); as patient) {
        <div class="bg-white p-6 border border-[#EEEEEE] shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
          <div class="grid grid-cols-3 gap-6 items-start">
              <div>
                  <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Patient Name</label>
                  <input 
                      type="text" 
                      [value]="patient.name"
                      (input)="updateName($event)"
                      [disabled]="isReviewMode()"
                      placeholder="Enter patient name..."
                      class="w-full text-lg font-light text-[#1C1C1C] placeholder-gray-300 bg-transparent border-none focus:ring-0 p-0 disabled:text-gray-400"
                  />
              </div>
              <div>
                  <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Age</label>
                  <input 
                      type="number" 
                      [value]="patient.age || ''"
                      (input)="updateAge($event)"
                      [disabled]="isReviewMode()"
                      placeholder="0"
                      class="w-full text-lg font-light text-[#1C1C1C] placeholder-gray-300 bg-transparent border-none focus:ring-0 p-0 disabled:text-gray-400"
                  />
              </div>
              <div>
                  <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Gender</label>
                  <select
                      [value]="patient.gender"
                      (change)="updateGender($event)"
                      [disabled]="isReviewMode()"
                      class="w-full text-lg font-light text-[#1C1C1C] bg-transparent border-none focus:ring-0 p-0 -ml-1 appearance-none disabled:text-gray-400">
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                  </select>
              </div>
          </div>
        </div>
      }

      <!-- Vitals & Chief Complaint -->
      <div class="bg-white p-6 border border-[#EEEEEE] shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
          <div class="p-0">
                <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Chief Complaint / Patient Objective</label>
                <input 
                  type="text" 
                  [value]="state.patientGoals()"
                  (input)="updateGoals($event)"
                  [disabled]="isReviewMode()"
                  placeholder="Enter primary health goal or complaint..."
                  class="w-full text-xl font-light text-[#1C1C1C] placeholder-gray-300 bg-transparent border-none focus:ring-0 p-0 disabled:text-gray-400"
                />
              </div>

              <!-- Vitals Grid -->
              <div class="mt-6 pt-6 border-t border-[#EEEEEE] grid grid-cols-6 gap-6">
                <div class="flex flex-col gap-1">
                  <label class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">BP</label>
                  <input type="text" placeholder="120/80" [value]="state.vitals().bp" (input)="updateVital('bp', $event)" [disabled]="isReviewMode()"
                        class="w-full border-b border-[#EEEEEE] py-1 text-sm font-medium text-[#1C1C1C] placeholder-gray-300 focus:outline-none focus:border-[#689F38] transition-colors bg-transparent disabled:text-gray-400 disabled:border-gray-200">
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">HR</label>
                  <input type="text" placeholder="BPM" [value]="state.vitals().hr" (input)="updateVital('hr', $event)" [disabled]="isReviewMode()"
                        class="w-full border-b border-[#EEEEEE] py-1 text-sm font-medium text-[#1C1C1C] placeholder-gray-300 focus:outline-none focus:border-[#689F38] transition-colors bg-transparent disabled:text-gray-400 disabled:border-gray-200">
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">SpO2</label>
                  <input type="text" placeholder="%" [value]="state.vitals().spO2" (input)="updateVital('spO2', $event)" [disabled]="isReviewMode()"
                        class="w-full border-b border-[#EEEEEE] py-1 text-sm font-medium text-[#1C1C1C] placeholder-gray-300 focus:outline-none focus:border-[#689F38] transition-colors bg-transparent disabled:text-gray-400 disabled:border-gray-200">
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Temp</label>
                  <input type="text" placeholder="°F" [value]="state.vitals().temp" (input)="updateVital('temp', $event)" [disabled]="isReviewMode()"
                        class="w-full border-b border-[#EEEEEE] py-1 text-sm font-medium text-[#1C1C1C] placeholder-gray-300 focus:outline-none focus:border-[#689F38] transition-colors bg-transparent disabled:text-gray-400 disabled:border-gray-200">
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Wgt</label>
                  <input type="text" placeholder="lbs" [value]="state.vitals().weight" (input)="updateVital('weight', $event)" [disabled]="isReviewMode()"
                        class="w-full border-b border-[#EEEEEE] py-1 text-sm font-medium text-[#1C1C1C] placeholder-gray-300 focus:outline-none focus:border-[#689F38] transition-colors bg-transparent disabled:text-gray-400 disabled:border-gray-200">
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Hgt</label>
                  <input type="text" placeholder="ft/in" [value]="state.vitals().height" (input)="updateVital('height', $event)" [disabled]="isReviewMode()"
                        class="w-full border-b border-[#EEEEEE] py-1 text-sm font-medium text-[#1C1C1C] placeholder-gray-300 focus:outline-none focus:border-[#689F38] transition-colors bg-transparent disabled:text-gray-400 disabled:border-gray-200">
                </div>
              </div>
      </div>

      <!-- Body Viewer -->
      <div class="body-viewer-container h-[700px]">
        <app-body-viewer></app-body-viewer>
      </div>

      <!-- Patient History -->
      <div class="flex flex-col bg-white border border-[#EEEEEE] shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
        <div class="p-6 border-b border-[#EEEEEE] flex justify-between items-center">
          <div class="flex items-center gap-4 flex-wrap">
              <h3 class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Patient History</h3>
              @if(historyBodyParts().length > 0) {
                  <div class="h-4 w-px bg-gray-200"></div>
                  <div class="flex items-center gap-2">
                      <button (click)="historyFilter.set(null)"
                              class="px-2 py-0.5 text-[10px] font-bold rounded-full transition-colors hover:bg-gray-200"
                              [class.bg-[#1C1C1C]]="!historyFilter()"
                              [class.text-white]="!historyFilter()"
                              [class.bg-gray-100]="!!historyFilter()"
                              [class.text-gray-600]="!!historyFilter()">
                          All
                      </button>
                      @for(part of historyBodyParts(); track part.id) {
                          <button (click)="historyFilter.set(part.id)"
                                  class="px-2 py-0.5 text-[10px] font-bold rounded-full transition-colors hover:bg-gray-200"
                                  [class.bg-[#1C1C1C]]="historyFilter() === part.id"
                                  [class.text-white]="historyFilter() === part.id"
                                  [class.bg-gray-100]="historyFilter() !== part.id"
                                  [class.text-gray-600]="historyFilter() !== part.id">
                              {{ part.name }}
                          </button>
                      }
                  </div>
              }
          </div>
          <button (click)="isAddingVisit.set(true)" [disabled]="isAddingVisit() || isReviewMode()"
                  class="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-gray-800 disabled:opacity-40 transition-colors shrink-0">
            ADD VISIT
          </button>
        </div>
        
        <div class="p-6">
          @if(selectedPatient()?.history; as history) {
            <app-patient-history-timeline 
              [history]="filteredHistory()"
              [activeVisit]="state.viewingPastVisit()"
              (review)="reviewVisit($event)"
              (reviewAnalysis)="reviewAnalysis($event)"
              (reviewNote)="reviewNote($event)"
              (deleteNote)="deleteNote($event)"
              (openBookmark)="openBookmarkInResearchFrame($event)"
            ></app-patient-history-timeline>
          }

          @if (selectedPatient()?.history.length === 0 && !isAddingVisit()) {
            <div class="h-full flex items-center justify-center">
              <p class="text-xs text-gray-400">No past visits recorded.</p>
            </div>
          }
        </div>

        @if(isAddingVisit()) {
          <div class="p-6 border-t border-[#EEEEEE] bg-gray-50/50">
            <h4 class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">New Visit Note</h4>
            <textarea 
              #visitInput
              rows="3"
              [value]="newVisitReason()"
              (input)="newVisitReason.set(visitInput.value)"
              placeholder="Enter reason for today's visit..."
              class="w-full bg-white border border-[#EEEEEE] p-2 text-sm text-[#1C1C1C] focus:border-[#1C1C1C] focus:ring-0 transition-colors placeholder-gray-400 resize-none"
            ></textarea>
            <div class="flex items-center justify-end gap-2 mt-3">
              <button (click)="isAddingVisit.set(false)" class="px-3 py-1 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-sm transition-colors">Cancel</button>
              <button (click)="saveNewVisit()" [disabled]="!newVisitReason().trim()" class="px-3 py-1 text-xs font-bold text-white bg-[#1C1C1C] hover:bg-[#689F38] disabled:bg-gray-300 rounded-sm transition-colors">Save</button>
            </div>
          </div>
        }
      </div>

    </div>
  `
})
export class MedicalChartComponent {
  state = inject(PatientStateService);
  patientManager = inject(PatientManagementService);
  
  newVisitReason = signal('');
  isAddingVisit = signal(false);
  historyFilter = signal<string | null>(null);

  selectedPatient = computed(() => {
    const selectedId = this.patientManager.selectedPatientId();
    if (!selectedId) return null;
    return this.patientManager.patients().find(p => p.id === selectedId);
  });
  
  isReviewMode = computed(() => !!this.state.viewingPastVisit());

  historyBodyParts = computed(() => {
      const history = this.selectedPatient()?.history || [];
      const parts = new Map<string, string>(); // id -> name
      history.forEach(entry => {
        if (entry.type === 'NoteCreated') {
          const match = entry.summary.match(/Note for (.*?)(:|\s\()/);
          const name = match ? match[1] : entry.partId;
          if (!parts.has(entry.partId)) {
            parts.set(entry.partId, name);
          }
        } else if (entry.type === 'Visit' && entry.state?.issues) {
            Object.values(entry.state.issues).flat().forEach(issue => {
                if (!parts.has(issue.id)) {
                    parts.set(issue.id, issue.name);
                }
            });
        }
      });
      return Array.from(parts.entries()).map(([id, name]) => ({ id, name }));
  });

  filteredHistory = computed(() => {
      const history = this.selectedPatient()?.history || [];
      const filter = this.historyFilter();
      if (!filter) {
        return history;
      }
      return history.filter(entry => {
        switch (entry.type) {
            case 'NoteCreated':
                return entry.partId === filter;
            case 'Visit':
            case 'ChartArchived':
                return !!entry.state?.issues[filter];
            case 'AnalysisRun':
            case 'CarePlanUpdate':
            case 'BookmarkAdded':
                return true;
            default:
                return false;
        }
      });
  });

  updateGoals(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    this.state.updateGoals(val);
  }

  updateVital(field: keyof PatientVitals, e: Event) {
    const val = (e.target as HTMLInputElement).value;
    this.state.updateVital(field, val);
  }
  
  updateName(e: Event) {
    const patient = this.selectedPatient();
    if (!patient) return;
    const val = (e.target as HTMLInputElement).value;
    this.patientManager.updatePatientDetails(patient.id, { name: val });
  }

  updateAge(e: Event) {
      const patient = this.selectedPatient();
      if (!patient) return;
      const val = parseInt((e.target as HTMLInputElement).value, 10);
      this.patientManager.updatePatientDetails(patient.id, { age: val >= 0 ? val : 0 });
  }

  updateGender(e: Event) {
      const patient = this.selectedPatient();
      if (!patient) return;
      const val = (e.target as HTMLSelectElement).value as Patient['gender'];
      this.patientManager.updatePatientDetails(patient.id, { gender: val });
  }

  saveNewVisit() {
    const reason = this.newVisitReason().trim();
    const patient = this.selectedPatient();
    if (!reason || !patient) return;

    // Capture the state at the time of this visit
    const visitState: PatientState = {
      ...this.state.getCurrentState(),
      patientGoals: reason // The primary goal for this snapshot is the reason for the visit.
    };

    const newEntry: HistoryEntry = {
      type: 'Visit',
      date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
      summary: reason,
      state: visitState
    };

    // Add to history (this also updates the patient's lastVisit)
    this.patientManager.addHistoryEntry(patient.id, newEntry);
    
    // Update the patient's primary 'patientGoals' to reflect this latest visit
    this.patientManager.updatePatientDetails(patient.id, { patientGoals: reason });

    // Reset the form
    this.newVisitReason.set('');
    this.isAddingVisit.set(false);
  }
  
  reviewVisit(entry: HistoryEntry) {
    const patient = this.selectedPatient();
    if (!patient || (entry.type !== 'Visit' && entry.type !== 'ChartArchived')) return;
    this.patientManager.loadArchivedVisit(patient.id, entry);
  }

  reviewAnalysis(entry: HistoryEntry) {
    const patient = this.selectedPatient();
    if (!patient || entry.type !== 'AnalysisRun') return;
    this.patientManager.loadArchivedAnalysis(entry);
  }

  reviewNote(entry: HistoryEntry) {
    const patient = this.selectedPatient();
    if (!patient || entry.type !== 'NoteCreated') return;

    // Find the Visit/Chart entry that contains this note
    const history = patient.history || [];
    const parentVisit = history.find(h => 
        (h.type === 'Visit' || h.type === 'ChartArchived') && 
        h.state?.issues[entry.partId]?.some(note => note.noteId === entry.noteId)
    );

    if (parentVisit) {
        // Load that visit's state and select the note
        this.patientManager.loadArchivedVisit(
            patient.id, 
            parentVisit, 
            { partId: entry.partId, noteId: entry.noteId }
        );
    } else {
        // Fallback for current notes that might have a NoteCreated entry but aren't archived yet
        this.state.selectPart(entry.partId);
        this.state.selectNote(entry.noteId);
    }
  }

  deleteNote(entry: HistoryEntry) {
    if (entry.type !== 'NoteCreated') return;
    
    // Deselect if it's the currently viewed note
    if (this.state.selectedNoteId() === entry.noteId) {
        this.state.selectPart(null);
    }

    this.patientManager.deleteNoteAndHistory(entry);
  }

  returnToCurrent() {
    this.patientManager.reloadCurrentPatient();
  }

  openBookmarkInResearchFrame(url: string) {
    this.state.toggleResearchFrame(true);
    this.state.requestResearchUrl(url);
  }
}