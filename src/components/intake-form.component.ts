import { Component, ChangeDetectionStrategy, inject, computed, signal, OnDestroy, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownService } from '../services/markdown.service';
import { DictationService } from '../services/dictation.service';
import { ClinicalIntelligenceService } from '../services/clinical-intelligence.service';
import { PatientStateService } from '../services/patient-state.service';
import { PatientManagementService } from '../services/patient-management.service';
import { BodyPartIssue, BODY_PART_NAMES, BODY_PART_MAPPING, HistoryEntry } from '../services/patient.types';

import { UnderstoryButtonComponent } from './shared/understory-button.component';
import { UnderstoryInputComponent } from './shared/understory-input.component';
import { UnderstoryBadgeComponent } from './shared/understory-badge.component';

interface NoteTimelineItem extends BodyPartIssue {
  date: string;
  isCurrent: boolean;
}

@Component({
  selector: 'app-intake-form',
  imports: [CommonModule, UnderstoryButtonComponent, UnderstoryInputComponent, UnderstoryBadgeComponent],
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
          <understory-button 
            variant="ghost" 
            size="sm" 
            (click)="close()"
            ariaLabel="Close Assessment Panel"
            icon="M6 18L18 6M6 6l12 12">
          </understory-button>
        </div>

        <div class="flex-1 flex overflow-hidden">
          <div class="flex-1 overflow-y-auto p-6 bg-[#F9FAFB]">
            
            @if (viewedNote(); as note) {
              <!-- TASK BRACKET: Active Assessment Card -->
              <!-- This visual container 'brackets' the current task, separating it from history -->
              <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8 transition-all duration-300 hover:shadow-md">
              
              <!-- Bracket Header -->
              <div class="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex justify-between items-start">
                <div>
                  <span class="text-xs font-bold uppercase tracking-widest text-[#416B1F] block mb-1">
                    {{ note.isCurrent ? 'Active Input' : 'Historical Record' }}
                  </span>
                  <h2 class="text-xl font-medium text-[#1C1C1C]">{{ state.selectedPartName() }}</h2>
                </div>
                @if (note.isCurrent) {
                  <understory-badge label="Live" severity="success" [hasIcon]="true">
                    <div badge-icon class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  </understory-badge>
                } @else {
                  <understory-badge [label]="note.date" severity="neutral"></understory-badge>
                }
              </div>

              <!-- Bracket Body -->
              <div class="p-6 space-y-8">
                
                <!-- 1. Pain Level Section -->
                <div class="mb-8">
                  <div class="flex justify-between items-end mb-4">
                    <label for="painRange" class="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                        Pain Severity
                    </label>
                    <div class="flex items-baseline gap-1">
                        <span class="text-3xl font-light text-[#1C1C1C]">{{ formState().painLevel }}</span>
                        <span class="text-sm font-medium text-gray-500">/10</span>
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
                    
                    <label for="painRange" class="sr-only">Pain Level</label>
                    <input 
                      id="painRange"
                      name="painRange"
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
                  <div class="flex justify-between text-xs text-gray-500 font-medium uppercase tracking-wider px-1">
                    <span>None</span>
                    <span>Moderate</span>
                    <span>Severe</span>
                  </div>
                </div>

                <!-- 2. Notes Section -->
                <div class="space-y-3">
                    <understory-input
                      type="textarea"
                      label="Integrative Observations"
                      [value]="formState().description"
                      (valueChange)="updateDescManual($event)"
                      [disabled]="!note.isCurrent"
                      [breathing]="note.isCurrent"
                      [autofocus]="note.isCurrent"
                      [rows]="5"
                      [placeholder]="dictation.isListening() ? 'Listening for your notes...' : 'Describe symptoms, triggers, and observations...'"
                      icon="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z">
                      
                      <div class="flex items-center gap-1.5 mt-2 justify-end">
                        <understory-button
                          variant="secondary"
                          size="sm"
                          [disabled]="!formState().description"
                          (click)="copyNotesToClipboard()"
                          [icon]="justCopied() ? 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z' : 'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z'"
                          [title]="justCopied() ? 'Copied!' : 'Copy notes'">
                        </understory-button>

                        @if (note.isCurrent) {
                          <understory-button
                            [variant]="dictation.isListening() ? 'danger' : 'secondary'"
                            size="sm"
                            [disabled]="!!dictation.permissionError()"
                            (click)="openDictation()"
                            [loading]="dictation.isListening()"
                            icon="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"
                            title="Dictate Notes">
                          </understory-button>
                        }
                      </div>
                    </understory-input>
                  @if(dictation.permissionError(); as error) {
                      <div class="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-md border border-red-100">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                        <p class="text-[11px] font-medium">{{ error }}</p>
                      </div>
                  }
                </div>

                <!-- 3. Recommendations Section -->
                <div class="space-y-3">
                  <div class="flex justify-between items-center mb-1">
                    <label for="recommendation-input" class="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                      Recommendations
                    </label>
                    @if (formState().recommendation && note.isCurrent) {
                      <understory-button
                        variant="ghost"
                        size="xs"
                        (click)="addToPatientSummary()"
                        icon="M12 5v14M5 12h14">
                        Add to Patient Summary
                      </understory-button>
                    }
                  </div>
                  <understory-input
                    inputId="recommendation-input"
                    type="textarea"
                    [value]="formState().recommendation"
                    (valueChange)="updateRecManual($event)"
                    [disabled]="!note.isCurrent"
                    [rows]="3"
                    placeholder="Suggested treatments, referrals, or next steps...">
                    
                    <div class="flex items-center gap-1.5 mt-2 justify-end">
                      <understory-button
                        variant="secondary"
                        size="sm"
                        [disabled]="!formState().recommendation"
                        (click)="copyRecToClipboard()"
                        [icon]="justCopiedRec() ? 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z' : 'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z'"
                        [title]="justCopiedRec() ? 'Copied!' : 'Copy recommendation'">
                      </understory-button>
                      @if (note.isCurrent) {
                        <understory-button (click)="openRecDictation()" [disabled]="!!dictation.permissionError()"
                                variant="secondary"
                                size="sm"
                                [loading]="dictation.isListening()"
                                icon="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"
                                title="Dictate Recommendation">
                        </understory-button>
                      }
                    </div>
                  </understory-input>
                </div>
              </div>

              <!-- Bracket Footer -->
              <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                <understory-button 
                  variant="ghost" 
                  size="sm"
                  (click)="deleteNote(note)" 
                  [disabled]="!note.isCurrent"
                  icon="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2">
                  Delete
                </understory-button>
                <understory-button 
                  (click)="updateEntry()"
                  [disabled]="!isDirty()"
                  [trailingIcon]="!isDirty() ? 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z' : ''">
                  {{ isDirty() ? 'Save Changes' : 'Saved' }}
                </understory-button>
              </div>
            </div>

                <!-- AI INSIGHTS SECTION (Node Format Alignment) -->
                @if (aiInsights().length > 0) {
                  <div class="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div class="flex items-center gap-2 px-2">
                       <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v8l6-6M12 22v-8l-6 6M2 12h8l-6-6M22 12h-8l6 6"/></svg>
                       <span class="text-xs font-bold uppercase tracking-widest text-purple-600">AI Draft Insights</span>
                    </div>

                    <div class="space-y-px rams-typography">
                      @for (node of aiInsights(); track node.id) {
                        <div class="bg-purple-50/30 border border-purple-100/50 rounded-lg p-4 transition-all hover:bg-purple-50/50 group mb-3">
                           @if (node.type === 'paragraph') {
                             <div [innerHTML]="node.rawHtml"></div>
                           } @else if (node.type === 'list') {
                             <ul>
                               @for (item of node.items; track item.id) {
                                 <li [innerHTML]="item.html"></li>
                               }
                             </ul>
                           } @else if (node.type === 'raw') {
                             <div [innerHTML]="node.rawHtml"></div>
                           }
                           <div class="mt-3 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <understory-button 
                                variant="secondary" 
                                size="xs" 
                                (click)="adoptInsight(node, 'desc')"
                                icon="M5 12l5 5L20 7">
                                Adopt as Note
                              </understory-button>
                              <understory-button 
                                variant="secondary" 
                                size="xs" 
                                (click)="adoptInsight(node, 'rec')"
                                icon="M5 12l5 5L20 7">
                                Adopt as Recommendation
                              </understory-button>
                           </div>
                        </div>
                      }
                    </div>
                  </div>
                }

                <!-- CONTEXT: History Timeline -->
                <div class="mt-12 pl-2">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>
                            History & Context
                        </h3>
                        <understory-button 
                          variant="ghost" 
                          size="xs" 
                          (click)="addNewNote()" 
                          [disabled]="!canAddNote()"
                          icon="M12 5v14M5 12h14">
                          New Note
                        </understory-button>
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
                                    <span class="text-xs font-bold uppercase tracking-widest"
                                       [class.text-[#416B1F]]="timelineNote.isCurrent"
                                       [class.text-gray-500]="!timelineNote.isCurrent">
                                        {{ timelineNote.date }}
                                    </span>
                                    <span class="text-xs font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                                        Pain: {{ timelineNote.painLevel }}
                                    </span>
                                </div>
                                <p class="text-xs font-medium text-gray-700 line-clamp-2 leading-relaxed">
                                    {{ timelineNote.description || 'No description provided.' }}
                                </p>
                            </button>
                        </div>
                    } @empty {
                        <div class="pl-8 text-xs text-gray-500 italic py-4">No prior history for this body part.</div>
                    }
                </div>
            </div>

        } @else {
           <div class="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-40">
              <p class="text-xs font-bold uppercase tracking-widest text-gray-500">Select a note to edit.</p>
           </div>
        }
          </div>
        </div>

      } @else {
        <div class="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-40">
           <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
             <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
           </div>
           <p class="text-xs font-bold uppercase tracking-widest text-gray-500">Select a body part to begin assessment</p>
        </div>
      }
    </div>
  `
})
export class IntakeFormComponent implements OnDestroy {
  state = inject(PatientStateService);
  private patientManager = inject(PatientManagementService);
  dictation = inject(DictationService);

  justCopied = signal(false);
  justCopiedRec = signal(false);

  // --- Local State for the Form ---
  private localPainLevel = signal(0);
  private localDescription = signal('');
  private localRecommendation = signal('');

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
    description: this.localDescription(),
    recommendation: this.localRecommendation()
  }));

  // Dirty checking to enable/disable the update button
  isDirty = computed(() => {
    const originalNote = this.viewedNote();
    if (!originalNote || !originalNote.isCurrent) return false;
    return this.localPainLevel() !== originalNote.painLevel || this.localDescription() !== originalNote.description || this.localRecommendation() !== (originalNote.recommendation || '');
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

  private intel = inject(ClinicalIntelligenceService);
  private markdownService = inject(MarkdownService);

  aiInsights = computed(() => {
    const report = this.intel.analysisResults()['Care Plan Overview'];
    if (!report) return [];

    const partName = this.state.selectedPartId() ? this.state.selectedPartName() : '';
    if (!partName) return [];

    try {
      const parser = this.markdownService.parser();
      if (!parser) return [];
      const tokens = parser.lexer(report);
      const relevantNodes: any[] = [];
      const partWords = partName.toLowerCase().split(' ');

      tokens.forEach((token: any) => {
        const text = token.text || token.raw || '';
        const lowercaseText = text.toLowerCase();

        // Find if the body part name exists in this token
        if (partWords.some(word => lowercaseText.includes(word))) {
          if (token.type === 'paragraph') {
            relevantNodes.push({
              id: `ai-${Math.random()}`,
              type: 'paragraph',
              rawHtml: parser.parseInline(token.text)
            });
          } else if (token.type === 'list') {
            relevantNodes.push({
              id: `ai-${Math.random()}`,
              type: 'list',
              items: token.items.map((it: any) => ({
                id: `ai-item-${Math.random()}`,
                html: parser.parseInline(it.text)
              }))
            });
          } else if (token.type === 'table' || token.type === 'blockquote' || token.type === 'html') {
            relevantNodes.push({
              id: `ai-${Math.random()}`,
              type: 'raw',
              rawHtml: parser.parse(token.raw)
            });
          }
        }
      });
      return relevantNodes;
    } catch (e) {
      return [];
    }
  });

  constructor() {
    // Sync local state when the selected issue changes from the global state
    effect(() => {
      const note = this.viewedNote();
      // Use untracked for local signal writes to prevent infinite loops from local state changes.
      untracked(() => {
        this.localPainLevel.set(note?.painLevel ?? 0);
        this.localDescription.set(note?.description ?? '');
        this.localRecommendation.set(note?.recommendation ?? '');
      });
    });

    // Auto-select note when a part is selected (auto-create is moved to body-viewer where the click happens)
    effect(() => {
      const partId = this.state.selectedPartId();
      const currentNoteId = this.state.selectedNoteId();

      if (partId && !currentNoteId) {
        untracked(() => {
          const timeline = this.noteTimeline();
          const currentVisitNote = timeline.find(n => n.isCurrent);
          if (currentVisitNote) {
            this.state.selectNote(currentVisitNote.noteId);
          }
        });
      }
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
      this.updateDescManual(text);
    });
  }

  openRecDictation() {
    this.dictation.openDictationModal(this.localRecommendation(), (text) => {
      this.updateRecManual(text);
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
      symptoms: [],
      recommendation: ''
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
      this.patientManager.updateHistoryEntry(
        patientId,
        historyEntry,
        (e) => e.type === 'NoteCreated' && e.noteId === note.noteId
      );
    }

    this.state.updateIssue(note.id, {
      ...note,
      painLevel: this.localPainLevel(),
      description: this.localDescription(),
      recommendation: this.localRecommendation()
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
      symptoms: [],
      recommendation: ''
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
    const text = (event.target as HTMLTextAreaElement).value;
    this.updateDescManual(text);
  }

  updateDescManual(text: string) {
    this.localDescription.set(text);
    const currentNote = this.viewedNote();
    if (currentNote && currentNote.isCurrent) {
      this.state.updateIssue(currentNote.id, { ...currentNote, description: text });
    }
  }

  updateRec(event: Event) {
    const text = (event.target as HTMLTextAreaElement).value;
    this.updateRecManual(text);
  }

  updateRecManual(text: string) {
    this.localRecommendation.set(text);
    const currentNote = this.viewedNote();
    if (currentNote && currentNote.isCurrent) {
      this.state.updateIssue(currentNote.id, { ...currentNote, recommendation: text });
    }
  }

  addToPatientSummary() {
    const rec = this.localRecommendation().trim();
    const currentNote = this.viewedNote();
    if (rec && currentNote) {
      this.state.addDraftSummaryItem(currentNote.id, rec);
    }
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
    let text = this.localDescription();
    const rec = this.localRecommendation();
    if (rec) text = text ? `${text}\n\nRecommendation:\n${rec}` : `Recommendation:\n${rec}`;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.justCopied.set(true);
      setTimeout(() => this.justCopied.set(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  }

  copyRecToClipboard() {
    const text = this.localRecommendation();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.justCopiedRec.set(true);
      setTimeout(() => this.justCopiedRec.set(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  }

  adoptInsight(node: any, target: 'desc' | 'rec' = 'desc') {
    let text = '';
    if (node.type === 'paragraph') {
      text = node.rawHtml.replace(/<[^>]*>/g, '').trim();
    } else if (node.type === 'list') {
      text = node.items.map((it: any) => '• ' + it.html.replace(/<[^>]*>/g, '').trim()).join('\n');
    }

    if (target === 'desc') {
      const currentText = this.localDescription();
      this.localDescription.set(currentText ? currentText + '\n\n' + text : text);
    } else {
      const currentText = this.localRecommendation();
      this.localRecommendation.set(currentText ? currentText + '\n\n' + text : text);
    }
  }
}
