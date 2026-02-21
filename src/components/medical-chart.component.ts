import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientStateService, PatientVitals, PatientState } from '../services/patient-state.service';
import { PatientManagementService, Patient, HistoryEntry } from '../services/patient-management.service';
import { BodyViewerComponent } from './body-viewer.component';
import { PatientHistoryTimelineComponent } from './patient-history-timeline.component';
import { DictationService } from '../services/dictation.service';

@Component({
  selector: 'app-medical-chart',
  standalone: true,
  imports: [CommonModule, BodyViewerComponent, PatientHistoryTimelineComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full flex flex-col gap-6 p-8 bg-[#F9FAFB]">
 
       <!-- Review Mode Banner -->
      @if(isReviewMode() && state.viewingPastVisit(); as visit) {
          <div class="bg-yellow-50 border border-yellow-200 p-4 flex justify-between items-center text-sm rounded-xl shadow-sm mb-2">
              <div class="flex items-center gap-3">
                  <div class="p-2 bg-yellow-100 rounded-full text-yellow-700">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                  </div>
                  @if (visit.type === 'Visit' || visit.type === 'ChartArchived') {
                    <span class="font-medium text-yellow-900">Reviewing past entry from <strong class="font-bold">{{ visit.date }}</strong>. All fields are read-only.</span>
                  } @else {
                     <span class="font-medium text-yellow-900">Reviewing past AI Analysis from <strong class="font-bold">{{ visit.date }}</strong>.</span>
                  }
              </div>
              <button (click)="returnToCurrent()" class="px-4 py-2 text-xs font-bold text-yellow-800 bg-white border border-yellow-200 rounded-lg hover:bg-yellow-50 transition-colors shadow-sm">
                Return to Current State
              </button>
          </div>
      }
      
      <!-- Patient Identity Card -->
      @if(selectedPatient(); as patient) {
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md">
          <!-- Card Header -->
          <div class="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <div class="flex items-center gap-2">
                <div class="w-1.5 h-4 bg-[#1C1C1C] rounded-full"></div>
                <span class="text-[10px] font-bold uppercase tracking-widest text-gray-500">Patient Identity</span>
            </div>
            <div class="flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded-full border border-blue-100">
                <div class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                <span class="text-[10px] font-medium text-blue-700 uppercase tracking-wide">Live Chart</span>
            </div>
          </div>

          <!-- Card Body -->
          <div class="p-6">
            <div class="grid grid-cols-12 gap-6 items-start">
                <div class="col-span-6">
                    <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                    <input 
                        type="text" 
                        [value]="patient.name"
                        (input)="updateName($event)"
                        [disabled]="isReviewMode()"
                        placeholder="Enter patient name..."
                        class="w-full text-lg font-medium text-[#1C1C1C] placeholder-gray-300 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:bg-white focus:border-[#1C1C1C] focus:ring-0 transition-all disabled:text-gray-400 disabled:bg-gray-100"
                    />
                </div>
                <div class="col-span-3">
                    <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Age</label>
                    <div class="relative">
                        <input 
                            type="number" 
                            [value]="patient.age || ''"
                            (input)="updateAge($event)"
                            [disabled]="isReviewMode()"
                            placeholder="0"
                            class="w-full text-lg font-medium text-[#1C1C1C] placeholder-gray-300 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:bg-white focus:border-[#1C1C1C] focus:ring-0 transition-all disabled:text-gray-400 disabled:bg-gray-100"
                        />
                        <span class="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">YRS</span>
                    </div>
                </div>
                <div class="col-span-3">
                    <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Gender</label>
                    <div class="relative">
                        <select
                            [value]="patient.gender"
                            (change)="updateGender($event)"
                            [disabled]="isReviewMode()"
                            class="w-full text-lg font-medium text-[#1C1C1C] bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:bg-white focus:border-[#1C1C1C] focus:ring-0 appearance-none disabled:text-gray-400 disabled:bg-gray-100 transition-all cursor-pointer">
                            <option>Male</option>
                            <option>Female</option>
                            <option>Other</option>
                        </select>
                        <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      }

      <!-- Vitals & Objectives Card -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md">
          <!-- Card Header -->
          <div class="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <div class="flex items-center gap-2">
                <div class="w-1.5 h-4 bg-[#689F38] rounded-full"></div>
                <span class="text-[10px] font-bold uppercase tracking-widest text-gray-500">Clinical Vitals</span>
            </div>
            <div class="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-full border border-gray-200">
                <div class="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                <span class="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Monitoring</span>
            </div>
          </div>

          <div class="p-6">
              <!-- Chief Complaint -->
              <div class="mb-8">
                <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                    Chief Complaint / Objective
                </label>
                <div class="relative group">
                  <input 
                    type="text" 
                    [value]="state.patientGoals()"
                    (input)="updateGoals($event)"
                    [disabled]="isReviewMode()"
                    placeholder="Enter primary health goal or complaint..."
                    class="w-full text-xl font-light text-[#1C1C1C] placeholder-gray-300 bg-transparent border-b border-gray-200 focus:border-[#689F38] focus:ring-0 p-2 pr-10 disabled:text-gray-400 transition-colors"
                  />
                  @if (!isReviewMode()) {
                    <button (click)="dictateGoals()" class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#689F38] transition-colors p-1 rounded-md hover:bg-gray-50" title="Dictate">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14q-1.25 0-2.125-.875T9 11V5q0-1.25.875-2.125T12 2q1.25 0 2.125.875T15 5v6q0 1.25-.875 2.125T12 14m-1 7v-3.075q-2.6-.35-4.3-2.325T5 11h2q0 2.075 1.463 3.537T12 16q2.075 0 3.538-1.463T17 11h2q0 2.225-1.7 4.2T13 17.925V21z"/></svg>
                    </button>
                  }
                </div>
              </div>

              <!-- Vitals Grid -->
              <div class="grid grid-cols-6 gap-4">
                <div class="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                  <label class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">BP</label>
                  <div class="flex items-baseline gap-1">
                      <input type="text" placeholder="120/80" [value]="state.vitals().bp" (input)="updateVital('bp', $event)" [disabled]="isReviewMode()"
                            class="w-full text-sm font-bold text-[#1C1C1C] placeholder-gray-300 bg-transparent border-none p-0 focus:ring-0 disabled:text-gray-400">
                  </div>
                </div>
                <div class="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                  <label class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">HR</label>
                  <div class="flex items-baseline gap-1">
                      <input type="text" placeholder="--" [value]="state.vitals().hr" (input)="updateVital('hr', $event)" [disabled]="isReviewMode()"
                            class="w-full text-sm font-bold text-[#1C1C1C] placeholder-gray-300 bg-transparent border-none p-0 focus:ring-0 disabled:text-gray-400">
                      <span class="text-[9px] text-gray-400 font-medium">BPM</span>
                  </div>
                </div>
                <div class="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                  <label class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">SpO2</label>
                  <div class="flex items-baseline gap-1">
                      <input type="text" placeholder="--" [value]="state.vitals().spO2" (input)="updateVital('spO2', $event)" [disabled]="isReviewMode()"
                            class="w-full text-sm font-bold text-[#1C1C1C] placeholder-gray-300 bg-transparent border-none p-0 focus:ring-0 disabled:text-gray-400">
                      <span class="text-[9px] text-gray-400 font-medium">%</span>
                  </div>
                </div>
                <div class="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                  <label class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Temp</label>
                  <div class="flex items-baseline gap-1">
                      <input type="text" placeholder="--" [value]="state.vitals().temp" (input)="updateVital('temp', $event)" [disabled]="isReviewMode()"
                            class="w-full text-sm font-bold text-[#1C1C1C] placeholder-gray-300 bg-transparent border-none p-0 focus:ring-0 disabled:text-gray-400">
                      <span class="text-[9px] text-gray-400 font-medium">°F</span>
                  </div>
                </div>
                <div class="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                  <label class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Weight</label>
                  <div class="flex items-baseline gap-1">
                      <input type="text" placeholder="--" [value]="state.vitals().weight" (input)="updateVital('weight', $event)" [disabled]="isReviewMode()"
                            class="w-full text-sm font-bold text-[#1C1C1C] placeholder-gray-300 bg-transparent border-none p-0 focus:ring-0 disabled:text-gray-400">
                      <span class="text-[9px] text-gray-400 font-medium">LBS</span>
                  </div>
                </div>
                <div class="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                  <label class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Height</label>
                  <div class="flex items-baseline gap-1">
                      <input type="text" placeholder="--/--" [value]="state.vitals().height" (input)="updateVital('height', $event)" [disabled]="isReviewMode()"
                            class="w-full text-sm font-bold text-[#1C1C1C] placeholder-gray-300 bg-transparent border-none p-0 focus:ring-0 disabled:text-gray-400">
                      <span class="text-[9px] text-gray-400 font-medium">FT</span>
                  </div>
                </div>
              </div>
      </div>
      </div>

      <!-- Body Viewer -->
      <div class="body-viewer-container h-[700px] rounded-xl shadow-sm border border-gray-200 overflow-hidden bg-white">
        <app-body-viewer></app-body-viewer>
      </div>

      <!-- Patient History Card -->
      <div class="flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md">
        <div class="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <div class="flex items-center gap-4 flex-wrap">
              <div class="flex items-center gap-2">
                <div class="w-1.5 h-4 bg-gray-400 rounded-full"></div>
                <h3 class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Patient History</h3>
              </div>
              
              @if(historyBodyParts().length > 0) {
                  <div class="h-4 w-px bg-gray-200"></div>
                  <div class="flex items-center gap-2">
                      <button (click)="historyFilter.set(null)"
                              class="px-3 py-1 text-[9px] font-bold rounded-md transition-all border"
                              [class.bg-[#1C1C1C]]="!historyFilter()"
                              [class.text-white]="!historyFilter()"
                              [class.border-[#1C1C1C]]="!historyFilter()"
                              [class.bg-white]="!!historyFilter()"
                              [class.text-gray-500]="!!historyFilter()"
                              [class.border-gray-200]="!!historyFilter()"
                              [class.hover:bg-gray-50]="!!historyFilter()">
                          ALL
                      </button>
                      @for(part of historyBodyParts(); track part.id) {
                          <button (click)="historyFilter.set(part.id)"
                                  class="px-3 py-1 text-[9px] font-bold rounded-md transition-all border"
                                  [class.bg-[#1C1C1C]]="historyFilter() === part.id"
                                  [class.text-white]="historyFilter() === part.id"
                                  [class.border-[#1C1C1C]]="historyFilter() === part.id"
                                  [class.bg-white]="historyFilter() !== part.id"
                                  [class.text-gray-500]="historyFilter() !== part.id"
                                  [class.border-gray-200]="historyFilter() !== part.id"
                                  [class.hover:bg-gray-50]="historyFilter() !== part.id">
                              {{ part.name }}
                          </button>
                      }
                  </div>
              }
          </div>
          <button (click)="isAddingVisit.set(true)" [disabled]="isAddingVisit() || isReviewMode()"
                  class="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#689F38] bg-green-50 hover:bg-green-100 border border-green-100 rounded-lg transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 5v14M5 12h14"/></svg>
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
            <div class="h-32 flex flex-col items-center justify-center text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 mb-2 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>
              <p class="text-xs font-medium">No past visits recorded.</p>
            </div>
          }
        </div>

        @if(isAddingVisit()) {
          <div class="p-6 border-t border-gray-100 bg-gray-50/50">
            <div class="flex justify-between items-center mb-3">
              <h4 class="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <div class="w-1.5 h-1.5 bg-[#689F38] rounded-full animate-pulse"></div>
                New Visit Note
              </h4>
              <button (click)="dictateVisitNote()" class="text-gray-400 hover:text-[#1C1C1C] transition-colors p-1 rounded-md hover:bg-gray-100" title="Dictate">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14q-1.25 0-2.125-.875T9 11V5q0-1.25.875-2.125T12 2q1.25 0 2.125.875T15 5v6q0 1.25-.875 2.125T12 14m-1 7v-3.075q-2.6-.35-4.3-2.325T5 11h2q0 2.075 1.463 3.537T12 16q2.075 0 3.538-1.463T17 11h2q0 2.225-1.7 4.2T13 17.925V21z"/></svg>
              </button>
            </div>
            <textarea 
              #visitInput
              rows="3"
              [value]="newVisitReason()"
              (input)="newVisitReason.set(visitInput.value)"
              placeholder="Enter reason for today's visit..."
              class="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm text-[#1C1C1C] focus:border-[#1C1C1C] focus:ring-0 transition-colors placeholder-gray-400 resize-none shadow-sm"
            ></textarea>
            <div class="flex items-center justify-end gap-2 mt-3">
              <button (click)="isAddingVisit.set(false)" class="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
              <button (click)="saveNewVisit()" [disabled]="!newVisitReason().trim()" class="px-4 py-2 text-xs font-bold text-white bg-[#1C1C1C] hover:bg-[#689F38] disabled:bg-gray-300 rounded-lg transition-colors shadow-sm">Save Visit</button>
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
  dictation = inject(DictationService);
  
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

  dictateGoals() {
    this.dictation.openDictationModal(this.state.patientGoals(), (text) => {
      this.state.updateGoals(text);
    });
  }

  dictateVisitNote() {
    this.dictation.openDictationModal(this.newVisitReason(), (text) => {
      this.newVisitReason.set(text);
    });
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