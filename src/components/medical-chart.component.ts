import { Component, ChangeDetectionStrategy, inject, computed, signal, viewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientStateService } from '../services/patient-state.service';
import { PatientManagementService } from '../services/patient-management.service';
import { PatientState, Patient, HistoryEntry } from '../services/patient.types';
import { BodyViewerComponent } from './body-viewer.component';
import { PatientHistoryTimelineComponent } from './patient-history-timeline.component';
import { DictationService } from '../services/dictation.service';
import { UnderstoryButtonComponent } from './shared/understory-button.component';
import { UnderstoryCardComponent } from './shared/understory-card.component';

@Component({
  selector: 'app-medical-chart',
  standalone: true,
  imports: [CommonModule, BodyViewerComponent, PatientHistoryTimelineComponent, UnderstoryButtonComponent, UnderstoryCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full min-h-full flex flex-col gap-4 sm:gap-6 p-4 sm:p-8 bg-[#F9FAFB]">
 
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
              <understory-button 
                (click)="returnToCurrent()" 
                variant="secondary" 
                size="sm">
                Return to Current State
              </understory-button>
          </div>
      }
      

      <!-- 3D Body Viewer Card -->
      <understory-card 
        title="3D Body Viewer" 
        [icon]="viewerIcon"
        [noPadding]="true">
        
        <div right-action (click)="isViewerExpanded.set(!isViewerExpanded())" class="cursor-pointer hover:bg-black/5 p-1 rounded-md transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-500 transition-transform duration-200" [class.rotate-180]="!isViewerExpanded()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </div>

        @if(isViewerExpanded()) {
          <div class="body-viewer-container h-[450px] xl:h-[550px] overflow-hidden bg-white shrink-0">
            @defer (on viewport) {
              <app-body-viewer></app-body-viewer>
            } @placeholder {
              <div class="h-full w-full flex items-center justify-center text-gray-500 bg-gray-50/50">
                <div class="flex flex-col items-center gap-3">
                  <div class="w-6 h-6 border-2 border-gray-200 border-t-[#689F38] rounded-full animate-spin"></div>
                  <span class="text-xs uppercase tracking-widest font-bold">Loading 3D Viewer...</span>
                </div>
              </div>
            }
          </div>
        }
      </understory-card>

      <!-- Patient History Card -->
      <understory-card 
        title="Patient History" 
        [icon]="historyIcon"
        [noPadding]="true">
        
        <div right-action class="flex items-center gap-4">
              @if(historyBodyParts().length > 0) {
                  <div class="flex items-center gap-2">
                      <understory-button 
                        (click)="$event.stopPropagation(); historyFilter.set(null)"
                        [variant]="!historyFilter() ? 'primary' : 'secondary'"
                        size="xs">
                        ALL
                      </understory-button>
                      @for(part of historyBodyParts(); track part.id) {
                          <understory-button 
                            (click)="$event.stopPropagation(); historyFilter.set(part.id)"
                            [variant]="historyFilter() === part.id ? 'primary' : 'secondary'"
                            size="xs">
                            {{ part.name }}
                          </understory-button>
                      }
                  </div>
              }
              <div (click)="isHistoryExpanded.set(!isHistoryExpanded())" class="cursor-pointer hover:bg-black/5 p-1 rounded-md transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-500 transition-transform duration-200" [class.rotate-180]="!isHistoryExpanded()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </div>
        </div>
        
        @if(isHistoryExpanded()) {
          <div class="flex flex-col min-h-0">
            <div #historyContainer class="p-6 overflow-y-auto max-h-[500px] scroll-smooth">
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
                  <p class="text-xs font-bold uppercase tracking-[0.15em]">No recorded activity</p>
                </div>
              }
            </div>
          </div>
        }
      </understory-card>

    </div>
  `
})
export class MedicalChartComponent {
  state = inject(PatientStateService);
  patientManager = inject(PatientManagementService);
  dictation = inject(DictationService);

  historyContainer = viewChild<ElementRef<HTMLDivElement>>('historyContainer');

  el = inject(ElementRef);

  constructor() {
    effect(() => {
      // depend on history to trigger scroll
      const history = this.filteredHistory();
      if (history) {
        setTimeout(() => {
          // Scroll the inner container
          const histEl = this.historyContainer()?.nativeElement;
          if (histEl && typeof histEl.scrollTo === 'function') {
            histEl.scrollTo({ top: histEl.scrollHeight, behavior: 'smooth' });
          }
          // Scroll the host container, which has overflow-y-auto applied from app.component.ts
          const mainEl = this.el.nativeElement as HTMLElement;
          if (mainEl && typeof mainEl.scrollTo === 'function') {
            mainEl.scrollTo({ top: mainEl.scrollHeight, behavior: 'smooth' });
          }
        }, 100);
      }
    });
  }

  viewerIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-5.25v9" />
    </svg>
  `;
  historyIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  `;

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
        case 'PatientSummaryUpdate':
        case 'FinalizedPatientSummary':
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