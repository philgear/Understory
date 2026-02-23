import { Component, ChangeDetectionStrategy, inject, signal, computed, viewChild, ElementRef, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientStateService } from '../services/patient-state.service';
import { GeminiService } from '../services/gemini.service';
import { DictationService } from '../services/dictation.service';
import { marked } from 'marked';

@Component({
    selector: 'app-voice-assistant',
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="h-full bg-white z-10 flex flex-col no-print border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            
            <!-- Panel Header / Tabs -->
            <div class="flex items-center justify-between px-6 py-2 border-b border-gray-100 bg-gray-50 h-14 shrink-0">
                <div class="flex items-center gap-4">
                    <button (click)="panelMode.set('selection')" 
                            class="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-800 transition-colors flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                        Home
                    </button>
                    @if (panelMode() !== 'selection') {
                        <span class="text-gray-300">/</span>
                        <span class="text-[10px] font-bold uppercase tracking-widest text-[#1C1C1C]">
                            {{ panelMode() === 'chat' ? 'Live Consult' : 'Dictation' }}
                        </span>
                    }
                </div>
                <button (click)="endLiveConsult()" class="text-gray-400 hover:text-red-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>

            <!-- MODE: SELECTION -->
            @if (panelMode() === 'selection') {
                <div class="flex-1 flex flex-col items-center justify-center gap-6 p-8 bg-gray-50/50 overflow-y-auto w-full">
                    <button (click)="activateChat()" class="group relative w-full max-w-[280px] bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-[#1C1C1C] transition-all p-6 flex flex-col items-center justify-center text-center gap-4">
                        <div class="w-16 h-16 rounded-full bg-[#F1F8E9] flex items-center justify-center text-[#558B2F] group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                        </div>
                        <div>
                            <h3 class="font-bold text-[#1C1C1C] uppercase tracking-wider text-sm mb-1">Live Consult</h3>
                            <p class="text-xs text-gray-500 leading-relaxed">Discuss patient data, ask questions, and explore diagnoses with AI.</p>
                        </div>
                    </button>

                    <button (click)="activateDictation()" class="group relative w-full max-w-[280px] bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-[#1C1C1C] transition-all p-6 flex flex-col items-center justify-center text-center gap-4">
                        <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                        </div>
                        <div>
                            <h3 class="font-bold text-[#1C1C1C] uppercase tracking-wider text-sm mb-1">Dictation Tool</h3>
                            <p class="text-xs text-gray-500 leading-relaxed">Transcribe voice notes to clipboard for use in reports or care plans.</p>
                        </div>
                    </button>
                </div>
            }

            <!-- MODE: CHAT -->
            @if (panelMode() === 'chat') {
                <!-- Transcript -->
                <div #transcriptContainer class="flex-1 overflow-y-auto p-8 space-y-6">
                     @for (entry of parsedTranscript(); track $index) {
                      <div class="flex gap-4 max-w-[85%]" [class.ml-auto]="entry.role === 'user'" [class.flex-row-reverse]="entry.role === 'user'">
                        <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                             [class.bg-[#F1F8E9]]="entry.role === 'model'"
                             [class.text-[#558B2F]]="entry.role === 'model'"
                             [class.bg-[#4527A0]]="entry.role === 'user'"
                             [class.text-white]="entry.role === 'user'">
                             {{ entry.role === 'model' ? 'AI' : 'DR' }}
                        </div>
                        @if (entry.role === 'model') {
                            <div class="p-4 rounded-lg bg-[#F8F8F8] text-[#1C1C1C] rams-typography text-sm" [innerHTML]="entry.htmlContent"></div>
                        } @else {
                            <div class="p-4 rounded-lg text-sm font-light leading-relaxed bg-[#4527A0] text-white/90">
                              <p>{{ entry.text }}</p>
                            </div>
                        }
                      </div>
                    }
                </div>

                <!-- Controls -->
                <div class="shrink-0 p-4 border-t border-[#EEEEEE] flex flex-col items-center justify-center gap-4 bg-white">
                    @if (permissionError(); as error) {
                      <div class="p-2 mb-2 bg-red-50 border border-red-200 text-center w-full">
                        <p class="font-bold text-red-700 text-xs">Microphone Access Issue</p>
                        <p class="text-xs text-red-600/80 mt-1">{{ error }}</p>
                      </div>
                    }
                    <form (submit)="sendMessage()" class="w-full flex items-center gap-2">
                        <textarea
                          #chatInput
                          rows="1"
                          [value]="messageText()"
                          (input)="messageText.set($event.target.value)"
                          (keydown.enter)="sendMessage($event)"
                          placeholder="Ask a follow-up question..."
                          [disabled]="agentState() !== 'idle'"
                          class="flex-1 bg-white border border-[#EEEEEE] p-3 text-sm text-[#1C1C1C] focus:border-[#1C1C1C] focus:ring-0 transition-colors placeholder-gray-400 resize-none disabled:bg-gray-50 rounded-lg"
                        ></textarea>

                        <button type="submit" [disabled]="!messageText().trim() || agentState() !== 'idle'"
                                class="w-12 h-12 flex items-center justify-center bg-[#1C1C1C] hover:bg-[#689F38] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-white shrink-0 rounded-lg shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20v-6l8-2-8-2V4l19 8z"/></svg>
                        </button>
                        <button type="button" (click)="toggleListening()" [disabled]="agentState() !== 'idle' || !!permissionError()"
                                class="w-12 h-12 flex items-center justify-center border border-[#EEEEEE] hover:border-[#1C1C1C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 rounded-lg shadow-sm"
                                [class.bg-[#689F38]]="agentState() === 'listening'"
                                [class.border-[#689F38]]="agentState() === 'listening'">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5"
                                 [class.text-white]="agentState() === 'listening'"
                                 [class.text-gray-500]="agentState() === 'idle'"
                                 viewBox="0 0 24 24" fill="currentColor"><path d="M12 14q-1.25 0-2.125-.875T9 11V5q0-1.25.875-2.125T12 2q1.25 0 2.125.875T15 5v6q0 1.25-.875 2.125T12 14m-1 7v-3.075q-2.6-.35-4.3-2.325T5 11h2q0 2.075 1.463 3.537T12 16q2.075 0 3.538-1.463T17 11h2q0 2.225-1.7 4.2T13 17.925V21z"/></svg>
                        </button>
                    </form>
                </div>
            }

            <!-- MODE: DICTATION -->
            @if (panelMode() === 'dictation') {
                <div class="flex-1 flex flex-col p-6 bg-gray-50/30 overflow-hidden w-full">
                    <div class="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm p-4 relative flex flex-col min-h-0">
                        <textarea 
                            [value]="dictationText()"
                            (input)="dictationText.set($event.target.value)"
                            class="flex-1 w-full resize-none outline-none text-sm leading-relaxed text-gray-800 placeholder-gray-300"
                            placeholder="Start dictating..."></textarea>
                        
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
                            <button (click)="toggleDictation()" 
                                    class="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg font-bold uppercase tracking-widest text-[10px] transition-all shadow-sm border border-transparent"
                                    [class.bg-red-50]="isDictating()"
                                    [class.text-red-700]="isDictating()"
                                    [class.border-red-200]="isDictating()"
                                    [class.hover:bg-red-100]="isDictating()"
                                    [class.bg-[#1C1C1C]]="!isDictating()"
                                    [class.text-white]="!isDictating()"
                                    [class.hover:bg-gray-800]="!isDictating()">
                                @if (isDictating()) {
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                                    <span>Pause</span>
                                } @else {
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                                    <span>Record</span>
                                }
                            </button>
                            <button (click)="clearDictation()" [disabled]="!dictationText()" class="px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-[10px] font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 uppercase tracking-widest disabled:opacity-30 disabled:hover:bg-white disabled:hover:border-gray-200 transition-colors shadow-sm">
                                Clear
                            </button>
                        </div>
                        <button (click)="copyDictation()" [disabled]="!dictationText()" class="w-full flex justify-center items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-100 hover:text-black hover:border-gray-400 disabled:opacity-30 transition-colors shadow-sm bg-white">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                            Copy Text
                        </button>
                    </div>
                </div>
            }
        </div>
  `
})
export class VoiceAssistantComponent implements OnDestroy {
    state = inject(PatientStateService);
    gemini = inject(GeminiService);
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
        return this.gemini.transcript().map(t => ({
            ...t,
            htmlContent: t.role === 'model' ? marked.parse(t.text, { async: false }) : t.text
        }));
    });

    // --- Dictation State ---
    dictationText = signal('');
    isDictating = signal(false);

    constructor() {
        effect(() => {
            const input = this.state.liveAgentInput();
            if (input) {
                this.messageText.set(input);
                // We don't want to clear it here if it causes infinite loops, 
                // but setting messageText is fine.
            }
        });

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
                    const responseText = await this.gemini.sendChatMessage(final);
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
        const responseText = await this.gemini.sendChatMessage(message);
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
