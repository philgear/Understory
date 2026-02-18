import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { PatientStateService, BodyPartIssue } from '../services/patient-state.service';

@Component({
  selector: 'app-intake-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex flex-col bg-white">
      @if (selectedIssue(); as issue) {
        <!-- Header -->
        <div class="h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-slate-50">
          <span class="text-xs font-bold uppercase tracking-widest text-slate-500">Selection</span>
          <button (click)="close()" class="text-slate-400 hover:text-slate-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-8 space-y-10">
          
          <div>
            <h2 class="text-2xl font-light text-slate-900 mb-1">{{ issue.name }}</h2>
            <div class="h-1 w-8 bg-orange-500"></div>
          </div>

          <!-- Technical Slider -->
          <div class="space-y-4">
            <div class="flex justify-between items-end">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pain Level</label>
              <span class="text-3xl font-light text-slate-900">{{ issue.painLevel }}<span class="text-base text-slate-300">/10</span></span>
            </div>
            
            <div class="relative h-6 flex items-center">
              <input 
                type="range" 
                min="0" max="10" step="1" 
                [value]="issue.painLevel"
                (input)="updatePain($event, issue)"
                class="w-full h-1 bg-slate-200 rounded-none appearance-none cursor-pointer accent-slate-900 focus:outline-none focus:ring-0">
            </div>
          </div>

          <!-- Minimalist Text Area -->
          <div class="space-y-2">
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Symptoms & Notes</label>
            <textarea 
              rows="6"
              [value]="issue.description"
              (input)="updateDesc($event, issue)"
              class="w-full bg-slate-50 border border-slate-200 p-4 text-sm text-slate-800 focus:border-slate-900 focus:ring-0 rounded-none transition-colors placeholder-slate-400 resize-none"
              placeholder="Describe the condition..."
            ></textarea>
          </div>

          <!-- Functional Action -->
          <div class="pt-8 border-t border-slate-100">
             <button 
               (click)="deleteIssue(issue.id)" 
               class="text-xs font-bold text-red-600 hover:text-red-700 uppercase tracking-widest flex items-center gap-2">
               <span class="w-4 h-4 border border-red-600 flex items-center justify-center rounded-sm">×</span>
               Clear Entry
             </button>
          </div>

        </div>
      } @else {
        <div class="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-40">
           <div class="w-16 h-16 border border-slate-300 rounded-full flex items-center justify-center mb-4">
             <div class="w-1 h-1 bg-slate-400 rounded-full"></div>
           </div>
           <p class="text-xs font-bold uppercase tracking-widest text-slate-500">No Selection</p>
        </div>
      }
    </div>
  `
})
export class IntakeFormComponent {
  state = inject(PatientStateService);
  
  selectedIssue = computed(() => {
    const id = this.state.selectedPartId();
    if (!id) return null;
    return this.state.issues()[id] || null;
  });

  close() {
    this.state.selectPart(null);
  }

  updatePain(event: Event, issue: BodyPartIssue) {
    const val = parseInt((event.target as HTMLInputElement).value, 10);
    this.state.updateIssue(issue.id, { ...issue, painLevel: val });
  }

  updateDesc(event: Event, issue: BodyPartIssue) {
    const val = (event.target as HTMLTextAreaElement).value;
    this.state.updateIssue(issue.id, { ...issue, description: val });
  }

  deleteIssue(id: string) {
    this.state.removeIssue(id);
    this.state.selectPart(null);
  }
}