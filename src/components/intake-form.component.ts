import { Component, ChangeDetectionStrategy, inject, computed, signal, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientStateService, BodyPartIssue } from '../services/patient-state.service';
import { PatientManagementService, HistoryEntry } from '../services/patient-management.service';
import { marked } from 'marked';
import { DictationService } from '../services/dictation.service';


interface NoteTimelineItem extends BodyPartIssue {
  date: string;
  isCurrent: boolean;
}

@Component({
  selector: 'app-intake-form',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex flex-col bg-[#F9FAFB]">
      @if (state.selectedPartId()) {
        <!-- Global Header for the Panel -->
        <div class="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0 z-10">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-[#689F38]"></div>
            <span class="text-xs font-bold uppercase tracking-widest text-gray-500">Assessment Panel</span>
          </div>
          <button (click)="close()" class="text-gray-400 hover:text-[#1C1C1C] transition-colors p-1 rounded-md hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        @if (viewedNote(); as note) {
          <div class="flex-1 overflow-y-auto p-6">
            
            <!-- TASK BRACKET: Active Assessment Card -->
            <!-- This visual container 'brackets' the current task, separating it from history -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8 transition-all duration-300 hover:shadow-md">
              
              <!-- Bracket Header -->
              <div class="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex justify-between items-start">
                <div>
                  <span class="text-[10px] font-bold uppercase tracking-widest text-[#689F38] block mb-1">
                    {{ note.isCurrent ? 'Active Input' : 'Historical Record' }}
                  </span>
                  <h2 class="text-xl font-medium text-[#1C1C1C]">{{ note.name }}</h2>
                </div>
                @if (note.isCurrent) {
                    <div class="flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded-full border border-green-100">
                        <div class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        <span class="text-[10px] font-medium text-green-700 uppercase tracking-wide">Live</span>
                    </div>
                } @else {
                    <div class="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-full border border-gray-200">
                        <span class="text-[10px] font-medium text-gray-500 uppercase tracking-wide">{{ note.date }}</span>
                    </div>
                }
              </div>

              <!-- Bracket Body -->
              <div class="p-6 space-y-8">
                
                <!-- 1. Pain Level Section -->
                <div class="space-y-3">
                  <div class="flex justify-between items-end">
                    <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                        Pain Severity
                    </label>
                    <div class="flex items-baseline gap-1">
                        <span class="text-3xl font-light text-[#1C1C1C]">{{ formState().painLevel }}</span>
                        <span class="text-sm font-medium text-gray-400">/10</span>
                    </div>
                  </div>
                  
                  <div class="relative h-8 flex items-center group">
                    <!-- Track background -->
                    <div class="absolute w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 opacity-30"></div>
                    </div>
                    <!-- Active fill -->
                    <div class="absolute h-1.5 bg-gradient-to-r from-green-500 via-yellow-500 to-red-600 rounded-full transition-all duration-150 ease-out"
                         [style.width.%]="formState().painLevel * 10"></div>
                    
                    <input 
                      type="range" 
                      min="0" max="10" step="1" 
                      [value]="formState().painLevel"
                      (input)="updatePain($event)"
                      [disabled]="!note.isCurrent"
                      class="relative w-full h-8 opacity-0 z-10 cursor-pointer disabled:cursor-not-allowed">
                      
                    <!-- Custom Thumb (Visual only, follows input) -->
                    <div class="absolute h-5 w-5 bg-white border-2 border-[#1C1C1C] rounded-full shadow-sm pointer-events-none transition-all duration-150 ease-out flex items-center justify-center"
                         [style.left.%]="formState().painLevel * 10"
                         [style.transform]="'translateX(-50%)'">
                         <div class="w-1.5 h-1.5 bg-[#1C1C1C] rounded-full"></div>
                    </div>
                  </div>
                  <div class="flex justify-between text-[10px] text-gray-400 font-medium uppercase tracking-wider px-1">
                    <span>None</span>
                    <span>Moderate</span>
                    <span>Severe</span>
                  </div>
                </div>

                <!-- 2. Notes Section -->
                <div class="space-y-3">
                  <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Clinical Notes
                  </label>
                  <div class="relative group">
                    <textarea 
                      #notesInput
                      rows="5"
                      [value]="formState().description"
                      (input)="updateDesc($event)"
                      [disabled]="!note.isCurrent"
                      class="w-full bg-[#F8F9FA] border border-gray-200 rounded-lg p-4 pr-12 text-sm text-[#1C1C1C] focus:bg-white focus:border-[#689F38] focus:ring-1 focus:ring-[#689F38] transition-all placeholder-gray-400 resize-none disabled:text-gray-500 disabled:bg-gray-100"
                      [placeholder]="dictation.isListening() ? 'Listening for your notes...' : 'Describe symptoms, triggers, and observations...'"
                    ></textarea>
                    
                    <!-- Floating Actions inside Textarea -->
                    <div class="absolute bottom-3 right-3 flex items-center gap-1.5">
                      <button (click)="copyNotesToClipboard()" [disabled]="!formState().description"
                              class="w-7 h-7 rounded-md flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm"
                              title="Copy notes">
                          @if(justCopied()) {
                              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-green-600" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                          } @else {
                              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                          }
                      </button>
                      @if (note.isCurrent) {
                        <button (click)="openDictation()" [disabled]="!!dictation.permissionError()"
                                class="w-7 h-7 rounded-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                                [class.bg-red-50]="dictation.isListening()"
                                [class.border-red-200]="dictation.isListening()"
                                [class.border]="true"
                                [class.text-red-600]="dictation.isListening()"
                                [class.animate-pulse]="dictation.isListening()"
                                [class.bg-white]="!dictation.isListening()"
                                [class.border-gray-200]="!dictation.isListening()"
                                [class.text-gray-500]="!dictation.isListening()"
                                [class.hover:bg-gray-50]="!dictation.isListening()"
                                title="Dictate Notes">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                        </button>
                      }
                    </div>
                  </div>
                  @if(dictation.permissionError(); as error) {
                      <div class="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-md border border-red-100">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                        <p class="text-[11px] font-medium">{{ error }}</p>
                      </div>
                  }
                </div>
              </div>

              <!-- Bracket Footer -->
              <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                <button 
                  (click)="deleteNote(note)" 
                  [disabled]="!note.isCurrent"
                  class="text-xs font-bold text-gray-400 hover:text-red-600 uppercase tracking-widest flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  Delete
                </button>
                <button (click)="updateEntry()"
                        [disabled]="!isDirty()"
                        class="px-5 py-2.5 bg-[#1C1C1C] text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-[#689F38] hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed flex items-center gap-2">
                  <span>{{ isDirty() ? 'Save Changes' : 'Saved' }}</span>
                  @if (!isDirty()) {
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  }
                </button>
              </div>
            </div>

            <!-- CONTEXT: History Timeline -->
            <div class="pl-2">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>
                        History & Context
                    </h3>
                    <button (click)="addNewNote()" [disabled]="!canAddNote()" class="text-[10px] font-bold text-[#689F38] hover:text-[#558B2F] uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 5v14M5 12h14"/></svg>
                      New Note
                    </button>
                </div>
                
                <div class="relative pl-2">
                    <!-- Vertical Timeline Line -->
                    <div class="absolute left-[11px] top-2 bottom-2 w-px bg-gray-200"></div>

                    @for (timelineNote of noteTimeline(); track $index) {
                        <div class="relative pl-8 pb-6 group">
                            <!-- Node on the timeline -->
                            <div class="absolute left-[7px] top-2.5 w-2.5 h-2.5 rounded-full border-2 bg-white z-10 transition-colors"
                                [class.border-[#689F38]]="timelineNote.isCurrent"
                                [class.border-gray-300]]="!timelineNote.isCurrent"
                                [class.bg-[#689F38]]="timelineNote.noteId === state.selectedNoteId()">
                            </div>
                            
                            <!-- Data Card -->
                            <button (click)="selectNote(timelineNote.noteId)" 
                                    class="w-full text-left p-3 rounded-lg border transition-all duration-200 hover:shadow-md group-hover:border-gray-300"
                                    [class.bg-white]="timelineNote.noteId !== state.selectedNoteId()"
                                    [class.bg-[#F1F8E9]]="timelineNote.noteId === state.selectedNoteId()"
                                    [class.border-[#689F38]]="timelineNote.noteId === state.selectedNoteId()"
                                    [class.border-transparent]="timelineNote.noteId !== state.selectedNoteId()"
                                    [class.shadow-sm]="timelineNote.noteId !== state.selectedNoteId()">
                                
                                <div class="flex justify-between items-start mb-1">
                                    <span class="text-[10px] font-bold uppercase tracking-widest"
                                       [class.text-[#689F38]]="timelineNote.isCurrent"
                                       [class.text-gray-400]="!timelineNote.isCurrent">
                                        {{ timelineNote.date }}
                                    </span>
                                    <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                                        Pain: {{ timelineNote.painLevel }}
                                    </span>
                                </div>
                                <p class="text-xs font-medium text-gray-700 line-clamp-2 leading-relaxed">
                                    {{ timelineNote.description || 'No description provided.' }}
                                </p>
                            </button>
                        </div>
                    } @empty {
                        <div class="pl-8 text-xs text-gray-400 italic py-4">No prior history for this body part.</div>
                    }
                </div>
            </div>

          </div>
        } @else {
           <div class="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-40">
              <p class="text-xs font-bold uppercase tracking-widest text-gray-500">Select a note to edit.</p>
           </div>
        }

      } @else {
        <div class="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-40">
           <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
             <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
           </div>
           <p class="text-xs font-bold uppercase tracking-widest text-gray-400">Select a body part to begin assessment</p>
        </div>
      }
    </div>
  `
})
export class IntakeFormComponent implements OnDestroy {
  state = inject(PatientStateService);
  patientManager = inject(PatientManagementService);
  dictation = inject(DictationService);
  
  justCopied = signal(false);

  // --- Local State for the Form ---
  private localPainLevel = signal(0);
  private localDescription = signal('');

  noteTimeline = computed<NoteTimelineItem[]>(() => {
    const partId = this.state.selectedPartId();
    if (!partId) return [];
    
    const isReviewing = !!this.state.viewingPastVisit();
    const reviewDate = this.state.viewingPastVisit()?.date;

    const notesInScope = this.state.issues()[partId] || [];
    const history = this.selectedPatientHistory();

    const timelineItems: NoteTimelineItem[] = [];
    const processedNoteIds = new Set<string>();

    // 1. Add notes from the current scope (which could be the current visit or a reviewed visit)
    notesInScope.forEach(note => {
        if (processedNoteIds.has(note.noteId)) return;
        timelineItems.push({
            ...note,
            date: isReviewing ? reviewDate! : 'Current Visit',
            isCurrent: !isReviewing
        });
        processedNoteIds.add(note.noteId);
    });

    // 2. Add historical notes from other visits
    history.forEach(entry => {
      if (entry.type === 'Visit' || entry.type === 'ChartArchived') {
        const notesInVisit = entry.state?.issues[partId] || [];
        notesInVisit.forEach(note => {
          if (!processedNoteIds.has(note.noteId)) {
            timelineItems.push({
              ...note,
              date: entry.date,
              isCurrent: false
            });
            processedNoteIds.add(note.noteId);
          }
        });
      }
    });

    // 3. Sort: Current/reviewed notes first, then historical notes by date descending.
    timelineItems.sort((a, b) => {
        if (a.isCurrent && !b.isCurrent) return -1;
        if (!a.isCurrent && b.isCurrent) return 1;
        if (a.date === 'Current Visit') return -1;
        if (b.date === 'Current Visit') return 1;
        return b.date.localeCompare(a.date);
    });

    return timelineItems;
  });

  viewedNote = computed<NoteTimelineItem | null>(() => {
    const selectedNoteId = this.state.selectedNoteId();
    if (!selectedNoteId) return null;
    return this.noteTimeline().find(n => n.noteId === selectedNoteId) || null;
  });

  canAddNote = computed(() => !this.state.viewingPastVisit());

  // Public signal for template binding
  formState = computed(() => ({
    painLevel: this.localPainLevel(),
    description: this.localDescription()
  }));

  // Dirty checking to enable/disable the update button
  isDirty = computed(() => {
    const originalNote = this.viewedNote();
    if (!originalNote || !originalNote.isCurrent) return false;
    return this.localPainLevel() !== originalNote.painLevel || this.localDescription() !== originalNote.description;
  });

  otherActiveIssues = computed(() => {
    const allIssues = this.state.issues();
    const selectedId = this.state.selectedPartId();
    if (!selectedId) return [];
    return Object.values(allIssues).flat().filter(issue => issue.id !== selectedId && issue.painLevel > 0);
  });
  
  private selectedPatientHistory = computed(() => {
    const selectedId = this.patientManager.selectedPatientId();
    if (!selectedId) return [];
    return this.patientManager.patients().find(p => p.id === selectedId)?.history || [];
  });
  
  constructor() {
    // Sync local state when the selected issue changes from the global state
    effect(() => {
        const note = this.viewedNote();
        this.localPainLevel.set(note?.painLevel ?? 0);
        this.localDescription.set(note?.description ?? '');
    });
  }

  ngOnDestroy() {
    // No local cleanup needed for service-based dictation
  }

  openDictation() {
    this.dictation.openDictationModal(this.localDescription(), (text) => {
      // 0. Check for commands (Switch body part or New Note)
      const command = this.parseVoiceCommand(text);
      if (command) {
          if (command.action === 'switch_and_note' && command.partId) {
              this.switchPartAndCreateNote(command.partId, command.remaining);
          } else if (command.action === 'new_note') {
              const currentPartId = this.state.selectedPartId();
              if (currentPartId) {
                  this.switchPartAndCreateNote(currentPartId, command.remaining);
              }
          }
          return;
      }

      // 1. Parse for pain level
      const painMatch = text.match(/pain (?:level|score|is|rated)?\s*(\d+)/i) || text.match(/(\d+)\s*(?:\/|out of)\s*10/i);
      if (painMatch) {
        let level = parseInt(painMatch[1], 10);
        if (!isNaN(level)) {
            // Clamp between 0 and 10
            level = Math.max(0, Math.min(10, level));
            this.localPainLevel.set(level);
        }
      }

      // 2. Set description
      this.localDescription.set(text);
    });
  }

  private parseVoiceCommand(text: string): { action: 'switch_and_note' | 'new_note', partId?: string, remaining: string } | null {
      const lower = text.toLowerCase().trim();
      
      // Check for "new note" without a specific body part
      if (lower === 'new note' || (lower.startsWith('new note ') && !lower.startsWith('new note for '))) {
          let remaining = text.substring(8).trim();
          remaining = remaining.replace(/^[\.,\-\s]+/, '');
          if (remaining.length > 0) {
              remaining = remaining.charAt(0).toUpperCase() + remaining.slice(1);
          }
          return { action: 'new_note', remaining };
      }

      const prefixMatch = lower.match(/^(?:switch to|select|go to|new note for|note for)\s+/);
      
      if (prefixMatch) {
        const contentStart = prefixMatch[0].length;
        const content = lower.substring(contentStart);
        
        // Sort keys by length descending to match specific parts first (e.g. "right upper leg" before "right leg")
        const keys = Object.keys(BODY_PART_MAPPING).sort((a, b) => b.length - a.length);
        
        for (const key of keys) {
          if (content.startsWith(key)) {
            const partId = BODY_PART_MAPPING[key];
            // Get original text casing for the remaining part
            let remaining = text.substring(contentStart + key.length).trim();
            // Remove leading punctuation
            remaining = remaining.replace(/^[\.,\-\s]+/, '');
            // Capitalize first letter of remaining text
            if (remaining.length > 0) {
                remaining = remaining.charAt(0).toUpperCase() + remaining.slice(1);
            }
            return { action: 'switch_and_note', partId, remaining };
          }
        }
      }
      return null;
  }

  private switchPartAndCreateNote(partId: string, text: string) {
      // 1. Parse pain from the new text
      let painLevel = 0;
      const painMatch = text.match(/pain (?:level|score|is|rated)?\s*(\d+)/i) || text.match(/(\d+)\s*(?:\/|out of)\s*10/i);
      if (painMatch) {
        let level = parseInt(painMatch[1], 10);
        if (!isNaN(level)) {
            painLevel = Math.max(0, Math.min(10, level));
        }
      }

      // 2. Select the new part
      this.state.selectPart(partId);

      // 3. Create a new note immediately
      const partName = Object.keys(BODY_PART_MAPPING).find(key => BODY_PART_MAPPING[key] === partId)?.toUpperCase() || 'Selection';

      const newNoteId = `note_${Date.now()}`;
      const newNote: BodyPartIssue = {
          id: partId,
          noteId: newNoteId,
          name: partName, // This might be "right knee" etc.
          painLevel: painLevel,
          description: text,
          symptoms: []
      };

      // 4. Update state with the new note
      this.state.updateIssue(partId, newNote);
      
      // 5. Select the new note
      this.state.selectNote(newNoteId);
  }

  close() {
    this.state.selectPart(null);
  }
  
  updateEntry() {
    const note = this.viewedNote();
    if (!note || !note.isCurrent || !this.isDirty()) return;

    const patientId = this.patientManager.selectedPatientId();
    if (patientId) {
        const patient = this.patientManager.patients().find(p => p.id === patientId);
        const historyExists = patient?.history.some(h => 
            h.type === 'NoteCreated' && h.noteId === note.noteId
        );

        if (!historyExists) {
            const description = this.localDescription().trim();
            const pain = this.localPainLevel();
            let summary = `Note for ${note.name}`;
            if (description) {
                summary += `: "${description.substring(0, 40).replace(/\n/g, ' ')}..."`;
            }
            summary += ` (Pain: ${pain}/10)`;

            const historyEntry: HistoryEntry = {
                type: 'NoteCreated',
                date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
                summary: summary,
                partId: note.id,
                noteId: note.noteId,
            };
            this.patientManager.addHistoryEntry(patientId, historyEntry);
        }
    }

    this.state.updateIssue(note.id, {
      ...note,
      painLevel: this.localPainLevel(),
      description: this.localDescription()
    });
  }

  addNewNote() {
    if (!this.canAddNote()) return;
    const partId = this.state.selectedPartId();
    if (!partId) return;

    const partName = this.noteTimeline()[0]?.name || this.viewedNote()?.name || 'Selection';
    
    const newNoteId = `note_${Date.now()}`;
    const newNote: BodyPartIssue = {
      id: partId,
      noteId: newNoteId,
      name: partName,
      painLevel: 0,
      description: '',
      symptoms: []
    };
    this.state.updateIssue(partId, newNote);
    this.state.selectNote(newNoteId);
  }

  selectNote(noteId: string) {
    this.state.selectNote(noteId);
  }

  updatePain(event: Event) {
    const val = parseInt((event.target as HTMLInputElement).value, 10);
    this.localPainLevel.set(val);
  }

  updateDesc(event: Event) {
    const val = (event.target as HTMLTextAreaElement).value;
    this.localDescription.set(val);
  }

  deleteNote(noteToDelete: NoteTimelineItem) {
    if (!noteToDelete.isCurrent) return;

    // 1. Add deletion record to history
    const patientId = this.patientManager.selectedPatientId();
    if (patientId) {
        let summary = `Note deleted for ${noteToDelete.name} (Pain: ${noteToDelete.painLevel}/10).`;
        if (noteToDelete.description) {
            summary = `Note deleted for ${noteToDelete.name}: "${noteToDelete.description.substring(0, 30)}..." (Pain: ${noteToDelete.painLevel}/10).`;
        }
        const historyEntry: HistoryEntry = {
            type: 'NoteDeleted',
            date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
            summary: summary,
            partId: noteToDelete.id,
            noteId: noteToDelete.noteId,
        };
        this.patientManager.addHistoryEntry(patientId, historyEntry);
    }
    
    // 2. Remove from local state (this will trigger computed signal updates)
    this.state.removeIssueNote(noteToDelete.id, noteToDelete.noteId);

    // 3. Select next note or deselect part, using the now-updated timeline
    const timeline = this.noteTimeline();
    const currentNotesForPart = timeline.filter(n => n.id === noteToDelete.id && n.isCurrent);
    
    if (this.state.selectedNoteId() === noteToDelete.noteId) {
        if (currentNotesForPart.length > 0) {
            this.state.selectNote(currentNotesForPart[0].noteId);
        } else {
            const historicalNotesForPart = timeline.filter(n => n.id === noteToDelete.id);
            if (historicalNotesForPart.length > 0) {
                this.state.selectNote(historicalNotesForPart[0].noteId);
            } else {
                this.state.selectPart(null);
            }
        }
    }
  }
  
  copyNotesToClipboard() {
    const text = this.localDescription();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.justCopied.set(true);
      setTimeout(() => this.justCopied.set(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  }
}

const BODY_PART_MAPPING: Record<string, string> = {
    'head': 'head',
    'skull': 'head',
    'face': 'head',
    'neck': 'head',
    'chest': 'chest',
    'torso': 'chest',
    'stomach': 'abdomen',
    'abdomen': 'abdomen',
    'belly': 'abdomen',
    'hips': 'pelvis',
    'pelvis': 'pelvis',
    'groin': 'pelvis',
    'right shoulder': 'r_shoulder',
    'right arm': 'r_arm',
    'right bicep': 'r_arm',
    'right elbow': 'r_arm',
    'right forearm': 'r_arm',
    'right hand': 'r_hand',
    'right wrist': 'r_hand',
    'right fingers': 'r_fingers',
    'right thumb': 'r_fingers',
    'left shoulder': 'l_shoulder',
    'left arm': 'l_arm',
    'left bicep': 'l_arm',
    'left elbow': 'l_arm',
    'left forearm': 'l_arm',
    'left hand': 'l_hand',
    'left wrist': 'l_hand',
    'left fingers': 'l_fingers',
    'left thumb': 'l_fingers',
    'right thigh': 'r_thigh',
    'right upper leg': 'r_thigh',
    'right knee': 'r_shin',
    'right shin': 'r_shin',
    'right calf': 'r_shin',
    'right lower leg': 'r_shin',
    'right ankle': 'r_foot',
    'right foot': 'r_foot',
    'right toes': 'r_toes',
    'left thigh': 'l_thigh',
    'left upper leg': 'l_thigh',
    'left knee': 'l_shin',
    'left shin': 'l_shin',
    'left calf': 'l_shin',
    'left lower leg': 'l_shin',
    'left ankle': 'l_foot',
    'left foot': 'l_foot',
    'left toes': 'l_toes',
    'upper back': 'upper_back',
    'lower back': 'lower_back',
    'spine': 'upper_back',
    'back': 'upper_back',
    'glutes': 'glutes',
    'buttocks': 'glutes',
    'bottom': 'glutes'
};