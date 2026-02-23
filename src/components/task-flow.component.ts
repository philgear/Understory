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
          <span class="text-[10px] font-bold uppercase tracking-widest text-[#416B1F] block mb-1">
            Active Task
          </span>
          <h2 class="text-xl font-medium text-[#1C1C1C]">Clinical Tasks & Notes</h2>
        </div>
        <div class="flex flex-col items-end gap-2">
            <div class="flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded-full border border-green-100">
              <div class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <span class="text-[10px] font-medium text-green-700 uppercase tracking-wide">Live</span>
            </div>
            <div class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
               {{ clinicalNotes().length }} Notes • {{ checklist().length }} Tasks
            </div>
        </div>
      </div>

      <!-- Content / List -->
      <div class="flex-1 overflow-y-auto p-6 bg-[#F9FAFB]">
        @if (clinicalNotes().length === 0 && checklist().length === 0) {
          <div class="h-full flex flex-col items-center justify-center opacity-40">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mb-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <p class="text-[10px] font-bold uppercase tracking-widest text-[#1C1C1C] text-center max-w-xs leading-relaxed">
              No notes or tasks yet. <br/> Add items using the input below or from the Assessment Panel.
            </p>
          </div>
        } @else {
          <div class="flex flex-col gap-4">
            <!-- Checklist Section -->
            @if (checklist().length > 0) {
              <div class="mb-4">
                <h3 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Tasks</h3>
                <div class="flex flex-col gap-2">
                  @for (task of checklist(); track task.id) {
                    <div class="flex items-start gap-3 bg-white border border-gray-200 rounded-lg p-3 shadow-sm group hover:border-gray-300 transition-colors">
                      <input 
                        type="checkbox" 
                        [id]="'task-' + task.id"
                        [name]="'task-' + task.id"
                        [checked]="task.completed"
                        (change)="toggleTask(task.id)"
                        class="mt-1 w-4 h-4 text-[#416B1F] bg-gray-100 border-gray-300 rounded focus:ring-[#416B1F] flex-shrink-0 cursor-pointer"
                      >
                      <label [for]="'task-' + task.id" class="text-sm text-[#1C1C1C] flex-1 cursor-pointer" [class.line-through]="task.completed" [class.opacity-50]="task.completed">
                        {{ task.text }}
                      </label>
                      <button (click)="removeTask(task.id)" class="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" title="Remove Task">
                         <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Clinical Notes Section -->
            @if (clinicalNotes().length > 0) {
              <div>
                <h3 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Notes</h3>
                <div class="flex flex-col gap-4">
                  @for (note of clinicalNotes(); track note.id) {
                    <div class="bg-white border border-gray-200 rounded-lg p-5 shadow-sm group hover:border-[#689F38] transition-colors relative">
                      <div class="flex justify-between items-start mb-3">
                        <span class="text-[10px] font-bold uppercase tracking-widest text-[#416B1F] bg-[#F1F8E9] px-2 py-1 rounded inline-block">
                          {{ note.sourceLens }}
                        </span>
                        <button (click)="removeNote(note.id)" class="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Remove Note">
                           <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      </div>
                      <p class="text-sm text-[#1C1C1C] font-medium leading-relaxed mb-4 whitespace-pre-wrap">{{ note.text }}</p>
                      <div class="flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase tracking-widest pt-3 border-t border-gray-100">
                        <span>{{ note.date | date:'MMM d, y, h:mm a' }}</span>
                        <span class="text-[#1C1C1C] flex items-center gap-1">
                           <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                           LOGGED
                        </span>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Add Item Input -->
      <div class="p-4 bg-white border-t border-gray-100 shrink-0 flex flex-col gap-3">
        <label for="taskInputText" class="sr-only">New task or note</label>
        <textarea 
            id="taskInputText"
            name="taskInputText"
            #itemInput
            (keydown.enter)="handleEnter($event, itemInput)"
            placeholder="Type a clinical note or task... (Shift+Enter for new line)" 
            rows="1"
            class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#416B1F]/30 focus:border-[#416B1F] transition-all placeholder-gray-400 resize-none max-h-32"
            oninput="this.style.height = 'auto'; this.style.height = (this.scrollHeight < 128 ? this.scrollHeight : 128) + 'px'"
        ></textarea>
        <div class="flex justify-end gap-2">
            <button (click)="submitNote(itemInput)" class="px-4 py-1.5 text-[10px] font-bold text-gray-600 bg-gray-100 border border-gray-200 hover:bg-gray-200 rounded transition-colors uppercase tracking-widest flex items-center gap-1.5">
               <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
               Add Note
            </button>
            <button (click)="submitTask(itemInput)" class="px-4 py-1.5 text-[10px] font-bold text-white bg-[#1C1C1C] hover:bg-[#416B1F] rounded transition-colors uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
               <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
               Add Task
            </button>
        </div>
      </div>
    </div>
  `
})
export class TaskFlowComponent {
  state = inject(PatientStateService);

  clinicalNotes = computed(() => this.state.clinicalNotes() || []);
  checklist = computed(() => this.state.checklist() || []);

  removeNote(id: string) {
    this.state.removeClinicalNote(id);
  }

  handleEnter(event: KeyboardEvent, el: HTMLTextAreaElement) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent default newline
      // Default to adding a task if they just press Enter
      this.submitTask(el);
    }
  }

  submitNote(el: HTMLTextAreaElement) {
    const text = el.value;
    if (!text.trim()) return;
    this.state.addClinicalNote({
      id: `note_${Date.now()}`,
      text: text.trim(),
      date: new Date().toISOString(),
      sourceLens: 'Manual Entry'
    });
    this.resetInput(el);
  }

  submitTask(el: HTMLTextAreaElement) {
    const text = el.value;
    if (!text.trim()) return;
    this.state.addChecklistItem({
      id: `task_${Date.now()}`,
      text: text.trim(),
      completed: false
    });
    this.resetInput(el);
  }

  private resetInput(el: HTMLTextAreaElement) {
    el.value = '';
    el.style.height = 'auto'; // Reset auto-expanding height
  }

  toggleTask(id: string) {
    this.state.toggleChecklistItem(id);
  }

  removeTask(id: string) {
    this.state.removeChecklistItem(id);
  }
}
