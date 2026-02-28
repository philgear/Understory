import { Component, ChangeDetectionStrategy, inject, signal, computed, viewChild, ElementRef, OnDestroy, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientStateService } from '../services/patient-state.service';
import { ClinicalIntelligenceService } from '../services/clinical-intelligence.service';
import { DictationService } from '../services/dictation.service';
import { PatientManagementService } from '../services/patient-management.service';
import { UnderstoryButtonComponent } from './shared/understory-button.component';
import { UnderstoryInputComponent } from './shared/understory-input.component';
import { MarkdownService } from '../services/markdown.service';

@Component({
    selector: 'app-voice-assistant',
    imports: [CommonModule, UnderstoryButtonComponent, UnderstoryInputComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="h-full bg-white z-10 flex flex-col no-print w-full">
            
            <!-- Panel Header -->
            <div class="flex items-center justify-between px-4 sm:px-6 py-4 lg:px-12 h-16 shrink-0 z-20 relative bg-white border-b border-gray-100">
                <div class="flex items-center gap-2 sm:gap-4 min-w-0">
                    <div class="flex items-center gap-3">
                        <svg width="24" height="24" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                           <g transform="translate(0, -20)">
                             <rect x="166" y="275" width="180" height="10" rx="2" fill="#76B362" />
                             <g>
                               <path d="M251 270 C200 250 155 200 155 145 C155 180 185 240 251 270Z" fill="#76B362" />
                               <path d="M251 270 C240 210 215 155 185 145 C185 145 230 200 251 270Z" fill="#244626" />
                             </g>
                             <g transform="translate(512, 0) scale(-1, 1)">
                               <path d="M251 270 C200 250 155 200 155 145 C155 180 185 240 251 270Z" fill="#76B362" />
                             </g>
                           </g>
                        </svg>
                        <span class="font-medium text-[#1C1C1C] tracking-[0.1em] sm:tracking-[0.15em] text-[10px] sm:text-sm uppercase truncate">Understory Intelligence</span>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button
                        (click)="isMuted.set(!isMuted())"
                        class="text-gray-400 hover:text-black flex items-center justify-center transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
                        title="Toggle Sound">
                        @if (isMuted()) {
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                              <path stroke-linecap="round" stroke-linejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                            </svg>
                        } @else {
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                        }
                    </button>
                    <button
                        (click)="endLiveConsult()"
                        class="text-gray-400 hover:text-black flex items-center gap-1 sm:gap-2 transition-colors uppercase text-[10px] sm:text-xs font-bold tracking-wider sm:tracking-widest px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-100 shrink-0"
                        title="Close Voice Assistant">
                        <span class="hidden sm:inline">Close Session</span>
                        <span class="sm:hidden">Close</span>
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>

            <!-- MODE: SELECTION Placeholder (Removed, mostly skips strait to chat) -->
            @if (panelMode() === 'selection') {
                <div class="flex-1 flex flex-col items-center justify-center gap-6 p-8 bg-white w-full"></div>
            }

            <!-- MODE: CHAT -->
            @if (panelMode() === 'chat') {
                <div class="flex-1 flex flex-col items-center justify-center overflow-hidden bg-white w-full relative">
                    <!-- Transcript Center Column -->
                    <div #transcriptContainer class="flex-1 overflow-y-auto w-full scroll-smooth pt-8 lg:pt-16 pb-32 px-4 lg:px-8 bg-white">
                        <div class="max-w-3xl mx-auto space-y-12">
                            
                            <!-- Grand Intro Greeting -->
                            @if (agentState() === 'typing') {
                                <div class="flex flex-col items-center justify-center text-center mt-12 fade-in-up">
                                    <div class="w-20 h-20 rounded-full bg-green-50/50 border border-green-100 flex items-center justify-center mb-8 pulse-ring">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-green-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                                    </div>
                                    <h1 class="text-2xl sm:text-3xl lg:text-4xl font-light text-gray-900 leading-tight md:leading-snug max-w-2xl mx-auto tracking-tight">
                                        <span class="typing-text" [innerHTML]="typingIntroText()"></span><span class="animate-pulse text-green-500">_</span>
                                    </h1>
                                </div>
                            }

                            <!-- Regular Transcript -->
                            @for (entry of parsedTranscript(); track $index) {
                                <div class="group flex gap-3 sm:gap-5 w-full sm:max-w-[95%] animate-in fade-in slide-in-from-bottom-2 duration-300" [class.ml-auto]="entry.role === 'user'" [class.flex-row-reverse]="entry.role === 'user'">
                                    <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shrink-0 border"
                                         [class.bg-white]="entry.role === 'model'"
                                         [class.border-gray-200]="entry.role === 'model'"
                                         [class.text-[#416B1F]]="entry.role === 'model'"
                                         [class.bg-[#1C1C1C]]="entry.role === 'user'"
                                         [class.border-[#1C1C1C]]="entry.role === 'user'"
                                         [class.text-white]="entry.role === 'user'">
                                         {{ entry.role === 'model' ? 'AI' : 'DR' }}
                                    </div>
                                    @if (entry.role === 'model') {
                                        <div class="flex flex-col gap-2 w-full pt-1.5">
                                            <div class="text-[#1C1C1C] rams-typography text-lg leading-relaxed font-light" [innerHTML]="entry.htmlContent"></div>
                                            <div class="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <understory-button variant="ghost" size="xs" (click)="actionCopy(entry.text)" icon="M9 9h13v13H9V9zm-4 6H4v-9h9v1z" ariaLabel="Copy Message">Copy</understory-button>
                                                <understory-button variant="ghost" size="xs" (click)="actionDictate(entry.text)" icon="M11 5L6 9H2v6h4l5 4V5zm8.07-.07a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" ariaLabel="Speak Aloud">Speak</understory-button>
                                                <understory-button variant="ghost" size="xs" (click)="actionInsert(entry.text)" icon="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" ariaLabel="Insert into Clinical Notes">Insert</understory-button>
                                            </div>
                                        </div>
                                    } @else {
                                        <div class="px-6 py-4 rounded-3xl rounded-tr-sm text-base font-medium leading-relaxed bg-gray-100 text-gray-900 border border-transparent">
                                          <p>{{ entry.text }}</p>
                                        </div>
                                    }
                                </div>
                            }

                            @if (agentState() === 'processing') {
                                <div class="flex gap-5 max-w-[85%] animate-pulse">
                                    <div class="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-sm font-bold shrink-0 text-[#416B1F]">AI</div>
                                    <div class="pt-4 flex items-center gap-2">
                                       <span class="w-2 h-2 rounded-full bg-green-500 animate-bounce" style="animation-delay: 0ms"></span>
                                       <span class="w-2 h-2 rounded-full bg-green-500 animate-bounce" style="animation-delay: 150ms"></span>
                                       <span class="w-2 h-2 rounded-full bg-green-500 animate-bounce" style="animation-delay: 300ms"></span>
                                    </div>
                                </div>
                            }
                        </div>
                    </div>

                    <!-- Controls (Floating at bottom) -->
                    <div class="absolute bottom-0 inset-x-0 p-4 lg:p-8 bg-gradient-to-t from-white via-white/95 to-transparent flex justify-center z-10">
                        <div class="w-full max-w-3xl flex flex-col gap-3 relative">
                            @if (permissionError(); as error) {
                              <div class="p-3 bg-red-50 border border-red-100 rounded-lg text-center shadow-sm">
                                <div class="flex items-center justify-center gap-2 mb-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                  <p class="font-bold text-red-700 text-xs tracking-wide">Microphone Access Issue</p>
                                </div>
                                <p class="text-[11px] text-red-600/80">{{ error }}</p>
                              </div>
                            }
                            
                            <form (submit)="sendMessage($event)" class="w-full flex items-center gap-3 bg-white border border-gray-200 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] rounded-[2rem] p-2 pl-4 focus-within:border-gray-300 focus-within:shadow-[0_10px_40px_-5px_rgba(0,0,0,0.15)] transition-all duration-300 transform-gpu">
                                <button type="button" (click)="toggleListening()" [disabled]="agentState() !== 'idle' || !!permissionError()"
                                        title="Start/Stop Voice Capture"
                                        class="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center hover:bg-gray-50 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0">
                                    <div class="relative flex items-center justify-center">
                                        @if (agentState() === 'listening') {
                                            <span class="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25"></span>
                                            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-red-600 relative z-10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                                        } @else {
                                            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                                        }
                                    </div>
                                </button>

                                <div class="flex-1 py-1">
                                    <understory-input
                                        type="text"
                                        [value]="messageText()"
                                        (valueChange)="messageText.set($event)"
                                        placeholder="Ask Understory..."
                                        className="!border-transparent !bg-transparent !shadow-none !px-0 !py-2 text-base"
                                        [disabled]="agentState() !== 'idle'"
                                        (keydown)="handleKeydown($event)">
                                    </understory-input>
                                </div>

                                <button 
                                    type="submit" 
                                    [disabled]="!messageText().trim() || agentState() !== 'idle'"
                                    class="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-black text-white disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors shrink-0 shadow-sm mr-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 sm:w-5 sm:h-5 sm:-mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                </button>
                            </form>
                            <div class="text-center">
                                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Secure Live Clinical Inference</span>
                            </div>
                        </div>
                    </div>
                </div>
            }

            <!-- MODE: DICTATION (Removed for now, as it wasn't requested in redesign, but kept structure if needed later) -->
        </div>
  `
})
export class VoiceAssistantComponent implements OnDestroy {
    state = inject(PatientStateService);
    intel = inject(ClinicalIntelligenceService);
    dictation = inject(DictationService);
    patientMgmt = inject(PatientManagementService);
    markdownService = inject(MarkdownService);

    panelMode = signal<'selection' | 'chat' | 'dictation'>('selection');

    transcriptContainer = viewChild<ElementRef<HTMLDivElement>>('transcriptContainer');

    // --- Chat State ---
    agentState = signal<'idle' | 'listening' | 'processing' | 'speaking' | 'typing'>('idle');
    isMuted = signal<boolean>(true);
    permissionError = signal<string | null>(null);
    messageText = signal('');
    typingIntroText = signal('');

    private recognition: any;
    private preferredVoice = signal<SpeechSynthesisVoice | null>(null);

    // Parse markdown in transcript
    parsedTranscript = computed(() => {
        const parser = this.markdownService.parser();
        return this.intel.transcript().map(t => ({
            ...t,
            htmlContent: t.role === 'model' ? (parser ? parser.parse(t.text, { async: false }) : t.text) : t.text
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

        // Ensure we always scroll to bottom when transcript updates
        effect(() => {
            this.parsedTranscript();
            untracked(() => this.scrollToBottom());
        });

        effect(() => {
            const isActive = this.state.isLiveAgentActive();
            untracked(() => {
                if (isActive && this.panelMode() !== 'chat') {
                    // Auto-start chat when active
                    this.activateChat();
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

    async activateChat() {
        this.panelMode.set('chat');

        // Clear previous state for a fresh "grand introduction"
        this.intel.transcript.set([]);
        console.log("Activating chat...");

        // Initialize AI chat session
        const patient = this.patientMgmt.selectedPatient();
        const history = patient?.history || [];
        const patientData = this.state.getAllDataForPrompt(history);

        console.log("Starting chat session with patientData length:", patientData.length);
        await this.intel.startChatSession(patientData);
        console.log("Chat session started.");

        this.agentState.set('typing');
        console.log("Agent state set to typing, fetching greeting...");
        const greeting = await this.intel.getInitialGreeting();
        console.log("Greeting fetched:", greeting);

        // Remove the greeting from transcript so we can "type" it out
        this.intel.transcript.set([]);

        // Typing effect
        this.typingIntroText.set('');
        let i = 0;
        const typingSpeed = 30; // ms per char

        const typeWriter = () => {
            if (i < greeting.length) {
                this.typingIntroText.set(this.typingIntroText() + greeting.charAt(i));
                i++;
                setTimeout(typeWriter, typingSpeed);
            } else {
                this.agentState.set('idle');
                this.intel.transcript.set([{ role: 'model', text: greeting }]);
                this.typingIntroText.set('');
                this.speak(greeting);
            }
        };
        typeWriter();
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
                container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
            }
        }, 100); // Increased timeout slightly to ensure DOM update is fully complete before calculating height
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

    handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    async sendMessage(event?: Event) {
        event?.preventDefault();

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
        if (this.isMuted()) return;
        if (!('speechSynthesis' in window)) {
            console.error('Speech Synthesis not supported.');
            this.agentState.set('idle');
            return;
        }
        if (speechSynthesis.speaking) speechSynthesis.cancel();

        // Strip markdown characters like asterisks so the TTS engine doesn't read them aloud.
        // (Note: The Web Speech API does not reliably support SSML for mid-sentence tone/pitch changes across all browsers.)
        const cleanText = text.replace(/[*#]/g, '');

        const utterance = new SpeechSynthesisUtterance(cleanText);
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
