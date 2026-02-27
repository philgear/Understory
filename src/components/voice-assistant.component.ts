import { Component, ChangeDetectionStrategy, inject, signal, computed, viewChild, ElementRef, OnDestroy, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientStateService } from '../services/patient-state.service';
import { ClinicalIntelligenceService } from '../services/clinical-intelligence.service';
import { DictationService } from '../services/dictation.service';
import { marked } from 'marked';
import { UnderstoryButtonComponent } from './shared/understory-button.component';
import { UnderstoryInputComponent } from './shared/understory-input.component';

@Component({
    selector: 'app-voice-assistant',
    imports: [CommonModule, UnderstoryButtonComponent, UnderstoryInputComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="h-full bg-white z-10 flex flex-col no-print border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            
            <!-- Panel Header / Tabs -->
            <div class="flex items-center justify-between px-6 py-2 border-b border-gray-100 bg-white shadow-[0_4px_10px_-10px_rgba(0,0,0,0.1)] h-14 shrink-0 z-20 relative">
                <div class="flex items-center gap-4">
                    <understory-button
                        variant="ghost"
                        size="xs"
                        (click)="panelMode.set('selection')"
                        icon="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z">
                        Home
                    </understory-button>
                    @if (panelMode() !== 'selection') {
                        <span class="text-gray-300">/</span>
                        <div class="flex items-center gap-2">
                           @if (panelMode() === 'chat') {
                              <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                           }
                           <span class="text-xs font-bold uppercase tracking-widest text-[#1C1C1C]">
                               {{ panelMode() === 'chat' ? 'Live Consult' : 'Dictation' }}
                           </span>
                        </div>
                    }
                </div>
                <understory-button
                    variant="ghost"
                    size="sm"
                    (click)="endLiveConsult()"
                    icon="M18 6L6 18M6 6l12 12"
                    title="Close Voice Assistant">
                </understory-button>
            </div>

            <!-- MODE: SELECTION -->
            @if (panelMode() === 'selection') {
                <div class="flex-1 flex flex-col items-center justify-center gap-6 p-8 bg-[#F9FAFB] overflow-y-auto w-full">
                    <button (click)="activateChat()" class="group relative w-full max-w-[280px] bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-[0_8px_30px_-10px_rgba(0,0,0,0.1)] hover:border-blue-200 transition-all duration-300 p-6 flex flex-col items-center justify-center text-center gap-4 focus:outline-none">
                        <div class="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                        </div>
                        <div>
                            <h3 class="font-bold text-[#1C1C1C] text-sm mb-1.5">Live Consult</h3>
                            <p class="text-xs text-gray-500 leading-relaxed font-medium">Discuss patient data, ask questions, and explore diagnoses with AI.</p>
                        </div>
                        <div class="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <understory-button size="sm">Enter Lab</understory-button>
                        </div>
                    </button>

                    <button (click)="activateDictation()" class="group relative w-full max-w-[280px] bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-[0_8px_30px_-10px_rgba(0,0,0,0.1)] hover:border-emerald-200 transition-all duration-300 p-6 flex flex-col items-center justify-center text-center gap-4 focus:outline-none">
                        <div class="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                        </div>
                        <div>
                            <h3 class="font-bold text-[#1C1C1C] text-sm mb-1.5">Dictation Tool</h3>
                            <p class="text-xs text-gray-500 leading-relaxed font-medium">Transcribe voice notes to clipboard for use in reports or care plans.</p>
                        </div>
                        <div class="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <understory-button size="sm" variant="success">Start Recording</understory-button>
                        </div>
                    </button>
                </div>
            }

            <!-- MODE: CHAT -->
            @if (panelMode() === 'chat') {
                <!-- Transcript -->
                <div #transcriptContainer class="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-gray-50/50 to-white relative scroll-smooth">
                     @if (parsedTranscript().length === 0) {
                        <div class="h-full flex flex-col items-center justify-center text-center px-4 fade-in">
                            <div class="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 mb-4 shadow-sm border border-blue-100">
                                <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                            </div>
                            <h3 class="font-bold text-gray-800 text-sm mb-1">Live Consult Active</h3>
                            <p class="text-xs text-gray-500 max-w-[220px] leading-relaxed">I'm ready to discuss the patient's record. What would you like to know?</p>
                        </div>
                     }
                     @for (entry of parsedTranscript(); track $index) {
                      <div class="group flex gap-3 max-w-[90%]" [class.ml-auto]="entry.role === 'user'" [class.flex-row-reverse]="entry.role === 'user'">
                        <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm border"
                             [class.bg-white]="entry.role === 'model'"
                             [class.border-gray-200]="entry.role === 'model'"
                             [class.text-[#416B1F]]="entry.role === 'model'"
                             [class.bg-[#1C1C1C]]="entry.role === 'user'"
                             [class.border-[#1C1C1C]]="entry.role === 'user'"
                             [class.text-white]="entry.role === 'user'">
                             {{ entry.role === 'model' ? 'AI' : 'DR' }}
                        </div>
                        @if (entry.role === 'model') {
                            <div class="flex flex-col gap-1.5 w-full">
                                <div class="p-4 rounded-2xl rounded-tl-sm bg-white border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] text-[#1C1C1C] rams-typography text-sm leading-relaxed" [innerHTML]="entry.htmlContent"></div>
                                <div class="flex items-center gap-1.5 pl-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <understory-button variant="ghost" size="xs" (click)="actionCopy(entry.text)" icon="M9 9h13v13H9V9zm-4 6H4v-9h9v1z" ariaLabel="Copy Message"></understory-button>
                                    <understory-button variant="ghost" size="xs" (click)="actionDictate(entry.text)" icon="M11 5L6 9H2v6h4l5 4V5zm8.07-.07a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" ariaLabel="Speak Aloud"></understory-button>
                                    <understory-button variant="ghost" size="xs" (click)="actionInsert(entry.text)" icon="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" ariaLabel="Insert into Clinical Notes">
                                        Insert
                                    </understory-button>
                                </div>
                            </div>
                        } @else {
                            <div class="px-5 py-3.5 rounded-2xl rounded-tr-sm text-sm font-medium leading-relaxed bg-[#1C1C1C] text-white shadow-sm">
                              <p>{{ entry.text }}</p>
                            </div>
                        }
                      </div>
                    }
                    @if (agentState() === 'processing') {
                      <div class="flex gap-3 max-w-[85%] animate-pulse">
                        <div class="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold shrink-0 shadow-sm text-[#416B1F]">
                             AI
                        </div>
                        <div class="p-4 rounded-2xl rounded-tl-sm bg-white border border-gray-100 shadow-sm flex items-center gap-2 h-[52px]">
                           <span class="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style="animation-delay: 0ms"></span>
                           <span class="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style="animation-delay: 150ms"></span>
                           <span class="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style="animation-delay: 300ms"></span>
                        </div>
                      </div>
                    }
                </div>

                <!-- Controls -->
                <div class="shrink-0 p-4 border-t border-gray-100 bg-white shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.05)] flex flex-col gap-3 relative z-10 transition-all">
                    @if (permissionError(); as error) {
                      <div class="p-3 mb-1 bg-red-50 border border-red-100 rounded-lg text-center w-full shadow-sm">
                        <div class="flex items-center justify-center gap-2 mb-1">
                          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                          <p class="font-bold text-red-700 text-xs tracking-wide">Microphone Access Issue</p>
                        </div>
                        <p class="text-[11px] text-red-600/80">{{ error }}</p>
                      </div>
                    }
                    
                    <form (submit)="sendMessage($event)" class="w-full flex items-end gap-2 bg-[#F9FAFB] border border-gray-200 rounded-2xl p-2 focus-within:border-gray-300 focus-within:bg-white focus-within:shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300">
                        <button type="button" (click)="toggleListening()" [disabled]="agentState() !== 'idle' || !!permissionError()"
                                class="w-10 h-10 flex items-center justify-center hover:bg-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0">
                            <div class="relative flex items-center justify-center">
                                @if (agentState() === 'listening') {
                                    <span class="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25"></span>
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-red-600 relative z-10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                                } @else {
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                                }
                            </div>
                        </button>

                        <div class="flex-1">
                            <understory-input
                                type="textarea"
                                [value]="messageText()"
                                (valueChange)="messageText.set($event)"
                                [rows]="1"
                                placeholder="Ask a question..."
                                [disabled]="agentState() !== 'idle'">
                            </understory-input>
                        </div>

                        <understory-button 
                            type="submit" 
                            [disabled]="!messageText().trim() || agentState() !== 'idle'"
                            icon="M5 12h14M12 5l7 7-7 7"
                            variant="primary"
                            size="sm"
                            class="mb-1 mr-1">
                        </understory-button>
                    </form>
                    <div class="text-center mt-0.5">
                        <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">Medical Voice AI Assistant</span>
                    </div>
                </div>
            }

            <!-- MODE: DICTATION -->
            @if (panelMode() === 'dictation') {
                <div class="flex-1 flex flex-col p-6 bg-gray-50/30 overflow-hidden w-full">
                    <div class="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm p-4 relative flex flex-col min-h-0">
                        <understory-input
                            type="textarea"
                            [value]="dictationText()"
                            (valueChange)="dictationText.set($event)"
                            [rows]="10"
                            placeholder="Start dictating..."
                            className="flex-1 border-none shadow-none">
                        </understory-input>
                        
                        @if (isDictating()) {
                            <div class="absolute bottom-4 right-4 flex gap-1">
                                <span class="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
                                <span class="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
                                <span class="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
                            </div>
                        }
                    </div>
                    
                    <div class="shrink-0 pt-4 flex flex-col gap-3">
                        <div class="flex items-center gap-3">
                            <understory-button 
                                (click)="toggleDictation()" 
                                [variant]="isDictating() ? 'danger' : 'primary'"
                                className="flex-1"
                                [loading]="isDictating()"
                                [icon]="isDictating() ? 'M6 4h4v16H6V4zm8 0h4v16h-4V4z' : 'M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z'">
                                {{ isDictating() ? 'Pause' : 'Record' }}
                            </understory-button>
                            
                            <understory-button 
                                variant="secondary"
                                (click)="clearDictation()" 
                                [disabled]="!dictationText()">
                                Clear
                            </understory-button>
                        </div>
                        <understory-button 
                            variant="secondary"
                            className="w-full"
                            (click)="copyDictation()" 
                            [disabled]="!dictationText()"
                            icon="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z">
                            Copy Text
                        </understory-button>
                    </div>
                </div>
            }
        </div>
  `
})
export class VoiceAssistantComponent implements OnDestroy {
    state = inject(PatientStateService);
    intel = inject(ClinicalIntelligenceService);
    dictation = inject(DictationService);

    panelMode = signal<'selection' | 'chat' | 'dictation'>('selection');

    transcriptContainer = viewChild<ElementRef<HTMLDivElement>>('transcriptContainer');

    // --- Chat State ---
    agentState = signal<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
    permissionError = signal<string | null>(null);
    messageText = signal('');

    private recognition: any;
    private preferredVoice = signal<SpeechSynthesisVoice | null>(null);

    // Parse markdown in transcript
    parsedTranscript = computed(() => {
        return this.intel.transcript().map(t => ({
            ...t,
            htmlContent: t.role === 'model' ? marked.parse(t.text, { async: false }) : t.text
        }));
    });

    // --- Action Bar Logic ---
    actionCopy(text: string) {
        navigator.clipboard.writeText(text);
    }

    actionDictate(text: string) {
        this.speak(text);
    }

    actionInsert(text: string) {
        const cleanText = text.replace(/[*_~`#]/g, '');
        const newNote = {
            id: 'note_' + Date.now().toString(),
            text: cleanText,
            sourceLens: 'Overview',
            date: new Date().toISOString()
        };
        this.state.addClinicalNote(newNote);
    }

    // --- Dictation State ---
    dictationText = signal('');
    isDictating = signal(false);

    constructor() {
        effect(() => {
            const input = this.state.liveAgentInput();
            if (input) {
                this.messageText.set(input);
            }
        }, { allowSignalWrites: true });

        effect(() => {
            const isActive = this.state.isLiveAgentActive();
            untracked(() => {
                if (isActive && this.panelMode() !== 'chat') {
                    this.panelMode.set('chat');
                } else if (!isActive && this.panelMode() === 'chat') {
                    this.panelMode.set('selection');
                }
            });
        }, { allowSignalWrites: true });

        // Only init if in browser
        if (typeof window !== 'undefined') {
            this.initializeSpeechRecognition();

            // Load voices logic 
            this.loadVoices();
            if ('speechSynthesis' in window) {
                speechSynthesis.addEventListener('voiceschanged', () => this.loadVoices());
            }
        }
    }

    ngOnDestroy() {
        this.stopDictation();
        if (this.recognition) {
            this.recognition.onstart = null;
            this.recognition.onend = null;
            this.recognition.onerror = null;
            this.recognition.onresult = null;
        }
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            if (speechSynthesis.speaking) {
                speechSynthesis.cancel();
            }
        }
    }

    endLiveConsult() {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
        if (this.recognition) {
            this.recognition.stop();
        }
        this.agentState.set('idle');
        this.isDictating.set(false);
        this.state.isLiveAgentActive.set(false);
    }

    activateChat() {
        this.panelMode.set('chat');
    }

    activateDictation() {
        this.panelMode.set('dictation');
    }

    toggleDictation() {
        if (this.isDictating()) {
            this.stopDictation();
        } else {
            this.startDictation();
        }
    }

    startDictation() {
        if (!this.recognition) return;
        try {
            this.recognition.start();
            this.isDictating.set(true);
        } catch (e) {
            console.error('Failed to start dictation', e);
        }
    }

    stopDictation() {
        if (!this.recognition) return;
        this.recognition.stop();
        this.isDictating.set(false);
    }

    clearDictation() {
        this.dictationText.set('');
    }

    copyDictation() {
        navigator.clipboard.writeText(this.dictationText());
    }

    // --- Auto-scroll Handler ---
    private scrollToBottom(): void {
        setTimeout(() => {
            const container = this.transcriptContainer()?.nativeElement;
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        }, 0);
    }

    // --- Speech & Agent Logic ---
    private loadVoices() {
        const availableVoices = speechSynthesis.getVoices();
        if (availableVoices.length === 0) return;
        const professionalFemaleVoice = availableVoices.find(v => v.lang.startsWith('en') && v.name.includes('Google') && v.name.includes('Female')) || availableVoices.find(v => v.lang.startsWith('en') && (v.name.includes('Samantha') || v.name.includes('Victoria') || v.name.includes('Google'))) || availableVoices.find(v => v.lang.startsWith('en-US') && v.name.includes('Female')) || availableVoices.find(v => v.lang.startsWith('en-US') && !v.name.includes('Male'));
        this.preferredVoice.set(professionalFemaleVoice || availableVoices[0]);
    }

    private initializeSpeechRecognition() {
        const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) {
            this.permissionError.set("Speech Recognition API not supported in this browser.");
            return;
        }

        this.recognition = new SpeechRecognitionAPI();
        this.recognition.continuous = true;
        this.recognition.lang = 'en-US';
        this.recognition.interimResults = true;

        this.recognition.onstart = () => {
            this.permissionError.set(null);
            if (this.panelMode() === 'chat') {
                this.agentState.set('listening');
            } else if (this.panelMode() === 'dictation') {
                this.isDictating.set(true);
            }
        };

        this.recognition.onend = () => {
            if (this.panelMode() === 'chat') {
                if (this.agentState() === 'listening') this.agentState.set('idle');
            } else if (this.panelMode() === 'dictation') {
                // If we are still supposed to be dictating, try to restart
                if (this.isDictating()) {
                    try {
                        this.recognition.start();
                    } catch (e) { }
                }
            }
        };

        this.recognition.onerror = (event: any) => {
            if (event.error === 'not-allowed') {
                this.permissionError.set('Microphone permission was denied. Please allow microphone access in your browser settings.');
                this.isDictating.set(false);
                this.agentState.set('idle');
            } else if (event.error === 'no-speech') {
                // Ignore
            } else if (event.error === 'network') {
                this.permissionError.set('Network error. Please check your connection.');
                this.isDictating.set(false);
                this.agentState.set('idle');
            } else {
                console.error('Speech recognition error:', event.error);
                this.isDictating.set(false);
                this.agentState.set('idle');
            }
        };

        this.recognition.onresult = async (event: any) => {
            let final = '';
            let interim = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final += event.results[i][0].transcript;
                } else {
                    interim += event.results[i][0].transcript;
                }
            }

            if (this.panelMode() === 'chat') {
                if (final) {
                    this.recognition.stop();
                    this.agentState.set('processing');
                    const responseText = await this.intel.sendChatMessage(final);
                    this.speak(responseText);
                    this.scrollToBottom();
                }
            } else if (this.panelMode() === 'dictation') {
                if (final) {
                    const current = this.dictationText();
                    const needsSpace = current.length > 0 && !current.endsWith(' ');
                    this.dictationText.set(current + (needsSpace ? ' ' : '') + final);
                }
            }
        };
    }

    async sendMessage(event?: Event) {
        event?.preventDefault();
        if (event instanceof KeyboardEvent && event.shiftKey) {
            return;
        }

        const message = this.messageText().trim();
        if (!message || this.agentState() !== 'idle') return;

        this.messageText.set('');
        this.agentState.set('processing');
        this.scrollToBottom();
        const responseText = await this.intel.sendChatMessage(message);
        this.speak(responseText);
        this.scrollToBottom();
    }

    toggleListening() {
        if (!this.recognition || this.permissionError() || this.agentState() !== 'idle') return;
        if (this.agentState() === 'idle') {
            this.recognition.start();
        } else if (this.agentState() === 'listening') {
            this.recognition.stop();
        }
    }

    speak(text: string) {
        if (!('speechSynthesis' in window)) {
            console.error('Speech Synthesis not supported.');
            this.agentState.set('idle');
            return;
        }
        if (speechSynthesis.speaking) speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        if (this.preferredVoice()) { utterance.voice = this.preferredVoice()!; }
        utterance.pitch = 1.1;
        utterance.rate = 0.95;

        utterance.onstart = () => {
            this.agentState.set('speaking');
            this.scrollToBottom();
        };
        utterance.onend = () => this.agentState.set('idle');
        utterance.onerror = (e) => {
            if (e.error === 'interrupted') return;
            console.error('Speech synthesis error', e.error);
            this.agentState.set('idle');
        };
        speechSynthesis.speak(utterance);
    }
}
