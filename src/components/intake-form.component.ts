import { Component, ChangeDetectionStrategy, inject, computed, signal, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientStateService, BodyPartIssue } from '../services/patient-state.service';
import { PatientManagementService, HistoryEntry } from '../services/patient-management.service';
import { SelectionHistoryComponent, SelectionHistoryItem } from './selection-history.component';
import { marked } from 'marked';


declare var webkitSpeechRecognition: any;

interface NoteTimelineItem extends BodyPartIssue {
  date: string;
  isCurrent: boolean;
}

@Component({
  selector: 'app-intake-form',
  standalone: true,
  imports: [CommonModule, SelectionHistoryComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex flex-col bg-white">
      @if (state.selectedPartId()) {
        <!-- Header -->
        <div class="h-14 border-b border-[#EEEEEE] flex items-center justify-between px-6 bg-white shrink-0">
          <span class="text-xs font-bold uppercase tracking-widest text-gray-500">Selection</span>
          <button (click)="close()" class="text-gray-400 hover:text-[#1C1C1C] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        @if (viewedNote(); as note) {
          <div class="flex-1 overflow-y-auto p-8 space-y-10">
            <div>
              <h2 class="text-2xl font-light text-[#1C1C1C] mb-1">{{ note.name }}</h2>
              <div class="h-1 w-8 bg-[#689F38]"></div>
            </div>

            <!-- Notes Timeline -->
            <div class="pt-8 border-t border-[#EEEEEE]">
                <div class="flex justify-between items-center mb-4">
                    <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Note History</label>
                    <button (click)="addNewNote()" [disabled]="!canAddNote()" class="text-xs font-bold text-gray-500 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      + Add Note to Current Visit
                    </button>
                </div>
                
                <div class="relative">
                    <!-- Vertical Timeline Line -->
                    <div class="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-200"></div>

                    @for (timelineNote of noteTimeline(); track timelineNote.noteId) {
                        <div class="relative pl-10" [class.pb-6]="!$last">
                            <!-- Node on the timeline -->
                            <div class="absolute left-3 top-2 -translate-x-1/2 w-4 h-4 rounded-full bg-white flex items-center justify-center border-2"
                                [class.border-[#689F38]]="timelineNote.isCurrent"
                                [class.border-gray-400]="!timelineNote.isCurrent">
                                @if (timelineNote.noteId === state.selectedNoteId()) {
                                    <div class="w-2 h-2 rounded-full"
                                        [class.bg-[#689F38]]="timelineNote.isCurrent"
                                        [class.bg-gray-400]="!timelineNote.isCurrent"></div>
                                }
                            </div>
                            
                            <!-- Data Card -->
                            <div class="w-full text-left p-2 rounded text-xs transition-colors border flex items-center gap-2"
                                    [class.bg-[#F1F8E9]]="timelineNote.noteId === state.selectedNoteId()"
                                    [class.border-[#689F38]]="timelineNote.noteId === state.selectedNoteId()"
                                    [class.border-gray-200]="timelineNote.noteId !== state.selectedNoteId()">
                                
                                <button (click)="selectNote(timelineNote.noteId)" class="flex-grow text-left group p-1">
                                    <p class="text-[10px] font-bold uppercase tracking-widest group-hover:text-black transition-colors"
                                       [class.text-[#689F38]]="timelineNote.isCurrent"
                                       [class.text-gray-500]="!timelineNote.isCurrent">
                                        {{ timelineNote.date }}
                                    </p>
                                    <div class="flex justify-between items-center mt-1">
                                        <p class="font-medium text-gray-800 truncate flex-1 pr-4">{{ timelineNote.description || 'New Note' }}</p>
                                        <span class="font-bold text-gray-500">{{ timelineNote.painLevel }}/10</span>
                                    </div>
                                </button>
                                
                                @if(timelineNote.isCurrent) {
                                    <div class="flex-shrink-0 flex items-center gap-1 border-l border-gray-200/60 pl-2">
                                        <button (click)="selectNote(timelineNote.noteId)" 
                                                class="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors"
                                                title="Edit Note">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M5 19h1.4l8.625-8.625-1.4-1.4L5 17.6zM19.3 8.925l-4.25-4.2L17.875 1.9q.575-.575 1.413-.575t1.412.575l1.4 1.4q.575.575.6 1.4t-.55 1.425zM3 21v-4.25l10.6-10.6l4.25 4.25L7.25 21z"/></svg>
                                        </button>
                                        <button (click)="deleteNote(timelineNote)"
                                                class="w-8 h-8 flex items-center justify-center rounded-md hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors"
                                                title="Delete Note">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M7 21q-.825 0-1.412-.587T5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.587 1.413T17 21zM17 6H7v13h10zM9 17h2V8H9zm4 0h2V8h-2zM7 6v13z"/></svg>
                                        </button>
                                    </div>
                                }
                            </div>
                        </div>
                    } @empty {
                        <div class="pl-10 text-xs text-gray-400">No notes for this body part.</div>
                    }
                </div>
            </div>
            
            <div class="pt-8 border-t border-[#EEEEEE] space-y-10">
              <!-- Technical Slider -->
              <div class="space-y-4">
                <div class="flex justify-between items-end">
                  <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pain Level</label>
                  <span class="text-3xl font-light text-[#1C1C1C]">{{ formState().painLevel }}<span class="text-base text-gray-300">/10</span></span>
                </div>
                
                <div class="relative h-6 flex items-center">
                  <input 
                    type="range" 
                    min="0" max="10" step="1" 
                    [value]="formState().painLevel"
                    (input)="updatePain($event)"
                    [disabled]="!note.isCurrent"
                    class="w-full h-1 bg-gray-200 rounded-none appearance-none accent-[#1C1C1C] focus:outline-none focus:ring-0"
                    [class.cursor-pointer]="note.isCurrent"
                    [class.cursor-not-allowed]="!note.isCurrent">
                </div>
              </div>

              <!-- Minimalist Text Area with Hot Mic -->
              <div class="space-y-2">
                <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Symptoms & Notes</label>
                <div class="relative">
                  <textarea 
                    #notesInput
                    rows="6"
                    [value]="formState().description"
                    (input)="updateDesc($event)"
                    [disabled]="!note.isCurrent"
                    class="w-full bg-[#F8F8F8] border border-[#EEEEEE] p-4 pr-12 text-sm text-[#1C1C1C] focus:border-[#1C1C1C] focus:ring-0 rounded-none transition-colors placeholder-gray-400 resize-none disabled:text-gray-500 disabled:bg-gray-100/50"
                    [placeholder]="dictationState() === 'listening' ? 'Listening for your notes...' : 'Describe the condition...'"
                  ></textarea>
                  @if (note.isCurrent) {
                    <div class="absolute bottom-3 right-3 flex items-center gap-2">
                      <button (click)="copyNotesToClipboard()" [disabled]="!formState().description"
                              class="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-gray-100 hover:bg-gray-200">
                          @if(justCopied()) {
                              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                          } @else {
                              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path d="M15 1H4q-.825 0-1.412.588T2 3v13h2V3h11zm3 4H8q-.825 0-1.412.588T6 7v13q0 .825.588 1.413T8 22h10q.825 0 1.413-.587T20 20V7q0-.825-.587-1.412T18 5m0 15H8V7h10z"/></svg>
                          }
                      </button>
                      <button (click)="toggleDictation(notesInput)" [disabled]="!!permissionError()"
                              class="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                              [class.bg-[#689F38]]="dictationState() === 'listening'"
                              [class.bg-gray-100]="dictationState() === 'idle'"
                              [class.hover:bg-gray-200]="dictationState() === 'idle'"
                              [class.animate-pulse]="dictationState() === 'listening'">
                          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" 
                              [class.text-white]="dictationState() === 'listening'"
                              [class.text-gray-500]="dictationState() === 'idle'"
                              viewBox="0 0 24 24" fill="currentColor"><path d="M12 14q-1.25 0-2.125-.875T9 11V5q0-1.25.875-2.125T12 2q1.25 0 2.125.875T15 5v6q0 1.25-.875 2.125T12 14m-1 7v-3.075q-2.6-.35-4.3-2.325T5 11h2q0 2.075 1.463 3.537T12 16q2.075 0 3.538-1.463T17 11h2q0 2.225-1.7 4.2T13 17.925V21z"/></svg>
                      </button>
                    </div>
                  }
                </div>
                @if(permissionError(); as error) {
                    <p class="text-[11px] text-red-600/90 mt-1">{{ error }}</p>
                }
              </div>
            </div>


            <!-- Footer Actions -->
            <div class="pt-8 border-t border-[#EEEEEE] flex justify-between items-center">
              <button 
                (click)="deleteNote(note)" 
                [disabled]="!note.isCurrent"
                class="text-xs font-bold text-red-600 hover:text-red-700 uppercase tracking-widest flex items-center gap-2 disabled:text-gray-300 disabled:cursor-not-allowed disabled:border-gray-300">
                <span class="w-4 h-4 border border-red-600 flex items-center justify-center rounded-sm group-disabled:border-gray-300">×</span>
                Delete Note
              </button>
              <div class="flex items-center gap-4">
                  <button (click)="updateEntry()"
                          [disabled]="!isDirty()"
                          class="px-4 py-2 bg-[#1C1C1C] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#689F38] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
                    Update Entry
                  </button>
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
           <div class="w-16 h-16 border border-gray-300 rounded-full flex items-center justify-center mb-4">
             <div class="w-1 h-1 bg-gray-400 rounded-full"></div>
           </div>
           <p class="text-xs font-bold uppercase tracking-widest text-gray-500">No Selection</p>
        </div>
      }
    </div>
  `
})
export class IntakeFormComponent implements OnDestroy {
  state = inject(PatientStateService);
  patientManager = inject(PatientManagementService);
  
  dictationState = signal<'idle' | 'listening'>('idle');
  permissionError = signal<string | null>(null);
  private recognition: any;
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
    this.initializeSpeechRecognition();
    
    // Sync local state when the selected issue changes from the global state
    effect(() => {
        const note = this.viewedNote();
        this.localPainLevel.set(note?.painLevel ?? 0);
        this.localDescription.set(note?.description ?? '');
    });
  }

  ngOnDestroy() {
    if (this.recognition && this.dictationState() === 'listening') {
      this.recognition.stop();
    }
  }

  private initializeSpeechRecognition() {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      this.permissionError.set("Voice dictation is not supported in this browser.");
      return;
    }

    this.recognition = new SpeechRecognitionAPI();
    this.recognition.continuous = false;
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = false;

    this.recognition.onstart = () => {
      this.permissionError.set(null);
      this.dictationState.set('listening');
    };

    this.recognition.onend = () => {
      this.dictationState.set('idle');
    };

    this.recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        this.permissionError.set('Microphone access denied. Please allow it in browser settings.');
      } else {
        this.permissionError.set(`Speech recognition error: ${event.error}`);
      }
      this.dictationState.set('idle');
    };

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      const existingText = this.localDescription() || '';
      const newText = existingText ? `${existingText} ${transcript}` : transcript;
      this.localDescription.set(newText);
    };
  }

  toggleDictation(notesInput: HTMLTextAreaElement) {
    if (!this.recognition) return;
    
    if (this.dictationState() === 'idle') {
      this.recognition.start();
      notesInput.focus();
    } else {
      this.recognition.stop();
    }
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