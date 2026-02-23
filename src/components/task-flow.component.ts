import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { PatientStateService } from '../services/patient-state.service';

@Component({
  selector: 'app-task-flow',
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full w-full flex flex-col overflow-hidden relative bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md">
      <!-- Bracket Header -->
      <div class="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex justify-between items-start shrink-0">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-widest text-[#689F38] block mb-1">
            Active Task
          </span>
          <h2 class="text-xl font-medium text-[#1C1C1C]">Clinical Tasks & Notes</h2>
        </div>
        <div class="flex flex-col items-end gap-2">
            <div class="flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded-full border border-green-100">
              <div class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <span class="text-[10px] font-medium text-green-700 uppercase tracking-wide">Live</span>
            </div>
            <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
               {{ clinicalNotes().length }} Items
            </div>
        </div>
      </div>

      <!-- Content / List -->
      <div class="flex-1 overflow-y-auto p-6 bg-[#F9FAFB]">
        @if (clinicalNotes().length === 0) {
          <div class="h-full flex flex-col items-center justify-center opacity-40">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mb-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <p class="text-[10px] font-bold uppercase tracking-widest text-[#1C1C1C] text-center max-w-xs leading-relaxed">
              No notes or tasks yet. <br/> Add notes from the Recommendation Engine below.
            </p>
          </div>
        } @else {
          <div class="flex flex-col gap-4">
            @for (note of clinicalNotes(); track note.id) {
              <div class="bg-white border border-gray-200 rounded-lg p-5 shadow-sm group hover:border-[#689F38] transition-colors relative">
                <div class="flex justify-between items-start mb-3">
                  <span class="text-[10px] font-bold uppercase tracking-widest text-[#689F38] bg-[#F1F8E9] px-2 py-1 rounded inline-block">
                    {{ note.sourceLens }}
                  </span>
                  <button (click)="removeNote(note.id)" class="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Remove Note">
                     <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
                <p class="text-sm text-[#1C1C1C] font-medium leading-relaxed mb-4 whitespace-pre-wrap">{{ note.text }}</p>
                <div class="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest pt-3 border-t border-gray-100">
                  <span>{{ note.date | date:'MMM d, y, h:mm a' }}</span>
                  <span class="text-[#1C1C1C] flex items-center gap-1">
                     <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                     LOGGED
                  </span>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class TaskFlowComponent {
  state = inject(PatientStateService);

  clinicalNotes = computed(() => this.state.clinicalNotes() || []);

  removeNote(id: string) {
    this.state.removeClinicalNote(id);
  }
}
