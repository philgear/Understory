import { Component, ChangeDetectionStrategy, inject, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientStateService } from '../services/patient-state.service';
import { HistoryEntry, BodyPartIssue } from '../services/patient-management.service';

interface NotesByPart {
  partId: string;
  partName: string;
  notes: BodyPartIssue[];
}

@Component({
  selector: 'app-visit-review',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex flex-col bg-white">
      <!-- Header -->
      <div class="h-14 border-b border-[#EEEEEE] flex items-center justify-between px-6 bg-white shrink-0">
        <div class="flex flex-col">
           <span class="text-xs font-bold uppercase tracking-widest text-gray-500">Visit Review</span>
           <span class="text-xs text-gray-400">Read-only view of notes from {{ visit().date }}</span>
        </div>
        <button (click)="close()" class="text-gray-400 hover:text-[#1C1C1C] transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-8 space-y-8">
        <div>
          <h2 class="text-2xl font-light text-[#1C1C1C] mb-1">Visit Summary</h2>
          <p class="text-sm text-gray-600 italic">"{{ visit().summary }}"</p>
        </div>

        <div class="pt-8 border-t border-[#EEEEEE] space-y-6">
            @for (part of notesByPart(); track part.partId) {
                <div>
                    <h3 class="text-sm font-bold text-[#1C1C1C] mb-3">{{ part.partName }}</h3>
                    <div class="space-y-2">
                        @for(note of part.notes; track note.noteId) {
                            <button (click)="selectNote(note)"
                                    class="w-full text-left p-3 rounded text-xs transition-colors border border-gray-200 hover:bg-gray-100 hover:border-gray-300">
                                <div class="flex justify-between items-center">
                                    <p class="font-medium text-gray-800 flex-1 pr-4">{{ note.description || 'No description provided.' }}</p>
                                    <span class="font-bold text-gray-500">{{ note.painLevel }}/10</span>
                                </div>
                            </button>
                        }
                    </div>
                </div>
            } @empty {
                <div class="text-center text-xs text-gray-400 py-8">
                    <p>No specific notes were recorded for this visit.</p>
                </div>
            }
        </div>
      </div>
    </div>
  `
})
export class VisitReviewComponent {
  state = inject(PatientStateService);
  visit = input.required<HistoryEntry & { type: 'Visit' }>();

  notesByPart = computed<NotesByPart[]>(() => {
    const issues = this.visit().state?.issues;
    if (!issues) return [];
    
    // Using a map to preserve order and group correctly
    const grouped = new Map<string, NotesByPart>();

    for (const partId in issues) {
      const notesForPart = issues[partId];
      if (notesForPart && notesForPart.length > 0) {
        let entry = grouped.get(partId);
        if (!entry) {
          entry = {
            partId: partId,
            partName: notesForPart[0].name,
            notes: []
          };
          grouped.set(partId, entry);
        }
        entry.notes.push(...notesForPart);
      }
    }
    return Array.from(grouped.values());
  });

  selectNote(note: BodyPartIssue) {
    // This will trigger the app component to switch to the intake form
    this.state.selectPart(note.id);
    this.state.selectNote(note.noteId);
  }

  close() {
    // Clearing the past visit state will exit review mode entirely
    this.state.setViewingPastVisit(null);
  }
}
