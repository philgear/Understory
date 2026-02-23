import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientStateService, PatientState } from '../services/patient-state.service';
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
      

      <!-- Body Viewer Menu Header -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md">
        <div (click)="isViewerExpanded.set(!isViewerExpanded())" class="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors">
          <div class="flex items-center gap-2">
            <div class="w-1.5 h-4 bg-teal-600 rounded-full"></div>
            <span class="text-[10px] font-bold uppercase tracking-widest text-gray-500">3D Body Viewer</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-400 transition-transform duration-200" [class.rotate-180]="!isViewerExpanded()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </div>

        @if(isViewerExpanded()) {
          <div class="body-viewer-container h-[450px] xl:h-[550px] overflow-hidden bg-white shrink-0">
            @defer (on viewport) {
              <app-body-viewer></app-body-viewer>
            } @placeholder {
              <div class="h-full w-full flex items-center justify-center text-gray-400 bg-gray-50/50">
                <div class="flex flex-col items-center gap-3">
                  <div class="w-6 h-6 border-2 border-gray-200 border-t-[#689F38] rounded-full animate-spin"></div>
                  <span class="text-[10px] uppercase tracking-widest font-bold">Loading 3D Viewer...</span>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Patient History Card -->
      <div class="flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md">
        <div (click)="isHistoryExpanded.set(!isHistoryExpanded())" class="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors">
          <div class="flex items-center gap-4 flex-wrap">
              <div class="flex items-center gap-2">
                <div class="w-1 h-4 bg-[#1C1C1C]"></div>
                <h3 class="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">Patient History</h3>
              </div>
              
              @if(historyBodyParts().length > 0) {
                  <div class="h-4 w-px bg-gray-200"></div>
                  <div class="flex items-center gap-2">
                      <button (click)="$event.stopPropagation(); historyFilter.set(null)"
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
                          <button (click)="$event.stopPropagation(); historyFilter.set(part.id)"
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
          <div class="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-400 transition-transform duration-200" [class.rotate-180]="!isHistoryExpanded()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
        
        @if(isHistoryExpanded()) {
          <div class="flex flex-col min-h-0">
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

              @if (selectedPatient()?.history.length === 0) {
                <div class="h-32 flex flex-col items-center justify-center text-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 mb-2 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>
                  <p class="text-[10px] font-bold uppercase tracking-[0.15em]">No recorded activity</p>
                </div>
              }
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

  // --- Accordion State ---
  isViewerExpanded = signal(true);
  isHistoryExpanded = signal(true);

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
        case 'FinalizedCarePlan':
        case 'BookmarkAdded':
          return true;
        default:
          return false;
      }
    });
  });




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