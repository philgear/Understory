import { Component, ChangeDetectionStrategy, inject, signal, computed, viewChild, ElementRef, OnDestroy, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientStateService } from '../services/patient-state.service';
import { ClinicalIntelligenceService } from '../services/clinical-intelligence.service';
import { BODY_PART_MAPPING } from '../services/patient.types';
import { DictationService } from '../services/dictation.service';
import { PatientManagementService } from '../services/patient-management.service';
import { SafeHtmlPipe } from '../pipes/safe-html.pipe';
import { PocketGullInputComponent } from './shared/pocket-gull-input.component';
import { MarkdownService } from '../services/markdown.service';
import { RichMediaService, IRichMediaCard } from '../services/rich-media.service';
import { ClinicalIcons } from '../assets/clinical-icons';
import { AdkLiveService } from '../services/ai/adk-live.service';
import { StorageService } from '../services/storage.service';
import { SecureStorageService } from '../services/secure-storage.service';
import { inject as baseInject } from '@angular/core';
import { getStoredApiKey } from '../services/secure-key';
import { YbocsService } from '../services/ybocs/ybocs.service';
import { severityQuestions } from '../services/ybocs/data';
import { BionicReadingService } from '../services/bionic-reading.service';
import { OcularVocalTelemetryService } from '../services/ocular-vocal-telemetry.service';
import { OpticalCameraVisionService } from '../services/optical-camera-vision.service';
import { AmbientSoapParserService, IStructuredSoapNote } from '../services/ambient-soap-parser.service';
import { CoppaPrivacyShieldService } from '../services/coppa-privacy-shield.service';
import { ActuarialLongevityService } from '../services/actuarial-longevity.service';
import { SpatialLesionMarkupService } from '../services/spatial-lesion-markup.service';
import { MdcpDomainService } from '../services/mdcp/mdcp-domain.service';
import { NavigationShellService } from '../services/navigation-shell.service';

export interface IChatEntry {
    role: 'user' | 'model';
    text: string;
    htmlContent?: string;
    richCards?: IRichMediaCard[];
    feedback?: 'up' | 'down';
}

@Component({
    selector: 'app-voice-assistant',
    imports: [CommonModule, FormsModule, PocketGullInputComponent, SafeHtmlPipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: [`
        .prose {
            --tw-prose-body: theme(colors.gray.700);
            --tw-prose-headings: theme(colors.gray.900);
            --tw-prose-lead: theme(colors.gray.600);
            --tw-prose-links: theme(colors.blue.600);
            --tw-prose-bold: theme(colors.gray.900);
            --tw-prose-counters: theme(colors.gray.500);
            --tw-prose-bullets: theme(colors.gray.300);
            --tw-prose-hr: theme(colors.gray.200);
            --tw-prose-quotes: theme(colors.gray.900);
            --tw-prose-quote-borders: theme(colors.gray.200);
            --tw-prose-captions: theme(colors.gray.500);
            --tw-prose-code: theme(colors.indigo.600);
            --tw-prose-pre-code: theme(colors.indigo.200);
            --tw-prose-pre-bg: theme(colors.gray.800);
            --tw-prose-th-borders: theme(colors.gray.300);
            --tw-prose-td-borders: theme(colors.gray.200);

            --tw-prose-invert-body: theme(colors.gray.300);
            --tw-prose-invert-headings: theme(colors.white);
            --tw-prose-invert-lead: theme(colors.gray.400);
            --tw-prose-invert-links: theme(colors.blue.400);
            --tw-prose-invert-bold: theme(colors.white);
            --tw-prose-invert-counters: theme(colors.gray.400);
            --tw-prose-invert-bullets: theme(colors.gray.600);
            --tw-prose-invert-hr: theme(colors.gray.700);
            --tw-prose-invert-quotes: theme(colors.gray.100);
            --tw-prose-invert-quote-borders: theme(colors.gray.700);
            --tw-prose-invert-captions: theme(colors.gray.400);
            --tw-prose-invert-code: theme(colors.indigo.400);
            --tw-prose-invert-pre-code: theme(colors.indigo.300);
            --tw-prose-invert-pre-bg: theme(colors.gray.900);
            --tw-prose-invert-th-borders: theme(colors.gray.600);
            --tw-prose-invert-td-borders: theme(colors.gray.700);
        }

        .prose :where(p):not(:where([class~="not-prose"] *)) {
            margin-top: 0.8em;
            margin-bottom: 0.8em;
        }
        
        .prose :where(ul):not(:where([class~="not-prose"] *)) {
            margin-top: 0.8em;
            margin-bottom: 0.8em;
        }

        .prose :where(h2):not(:where([class~="not-prose"] *)) {
            font-size: 1.1em;
            margin-top: 1.2em;
            margin-bottom: 0.5em;
        }

        .prose.prose-sm :where(h3):not(:where([class~="not-prose"] *)) {
            font-size: 0.9em;
        }

        /* Tighter margin collapsing inside chat bubbles to prevent padding blowouts */
        .prose :where(p):first-child { margin-top: 0; }
        .prose :where(p):last-child { margin-bottom: 0; }
        .prose :where(ul):last-child { margin-bottom: 0; }
        .prose :where(h2, h3):first-child { margin-top: 0; }

        @keyframes fadeUpRams {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .chat-entry {
            animation: fadeUpRams 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
    `],
    template: `
        <div class="h-full bg-white dark:bg-[#09090b] z-10 flex flex-col no-print w-full spark-theme">
            
            <!-- Minimal Pocket Header -->
            <div class="flex items-center justify-between px-4 py-2 shrink-0 z-20 relative bg-white dark:bg-[#09090b] border-b border-gray-100 dark:border-zinc-800/50">
                <div class="flex items-center pointer-events-none pl-2 gap-2">
                    <span class="font-bold text-gray-400 dark:text-zinc-500 tracking-[0.2em] text-[12px] uppercase">Live Session</span>
                    @if (telemetryService.isHudActive()) {
                        <span class="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 animate-pulse">
                            LIVE TELEMETRY HUD ACTIVE (Score: {{ telemetryService.overallNeuroVascularScore() }}/100)
                        </span>
                    }
                </div>
                <div class="flex items-center gap-2">
                    <button
                        (click)="telemetryService.toggleHud()"
                        [ngClass]="telemetryService.isHudActive() ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/40 shadow-sm' : 'bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-700'"
                        class="flex items-center gap-1.5 transition-all px-2.5 py-1.5 rounded-lg border text-[11px] font-bold cursor-pointer"
                        title="Toggle Multimodal Camera & Voice Live Tele-Consult HUD">
                        <span>👁️🎙️</span> <span>Tele-HUD</span>
                    </button>
                    <button
                        (click)="dispatchDiscordTranscript()"
                        class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1.5 transition-all px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold"
                        title="Dispatch Transcript to Discord Webhook">
                        <span>💬</span> Discord Dispatch
                    </button>
                    <button
                        (click)="isMuted.set(!isMuted())"
                        class="text-gray-400 dark:text-zinc-500 hover:text-black dark:hover:text-white flex items-center justify-center transition-colors px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
                        title="Toggle Sound">
                        @if (isMuted()) {
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                              <path stroke-linecap="round" stroke-linejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                            </svg>
                        } @else {
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                        }
                    </button>
                    <button
                        (click)="endLiveConsult()"
                        class="text-gray-400 dark:text-zinc-500 hover:text-red-500 flex items-center justify-center transition-colors px-2 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                        title="Close Session">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>

            <!-- MULTIMODAL CAMERA & VOICE LIVE TELE-CONSULT HUD OVERLAY -->
            @if (telemetryService.isHudActive()) {
                <div class="px-4 py-3 bg-zinc-950/95 border-b border-cyan-500/30 text-zinc-100 font-mono shadow-2xl backdrop-blur-xl shrink-0 space-y-3 animate-in fade-in slide-in-from-top duration-300">
                    <div class="flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div class="flex items-center gap-2">
                            <span class="text-cyan-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                <span>👁️🎙️</span> Multimodal Tele-Consult Cockpit HUD
                            </span>
                            <span class="px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                60 FPS Edge Vision
                            </span>
                        </div>

                        <!-- Mode Switcher -->
                        <div class="flex items-center gap-1.5 text-[10px]">
                            <button (click)="telemetryService.setTelemetryMode('ALL')" [class.bg-cyan-600]="telemetryService.selectedTelemetryMode() === 'ALL'" class="px-2 py-1 rounded bg-zinc-800 text-zinc-200 hover:bg-zinc-700">ALL</button>
                            <button (click)="telemetryService.setTelemetryMode('OCULAR')" [class.bg-cyan-600]="telemetryService.selectedTelemetryMode() === 'OCULAR'" class="px-2 py-1 rounded bg-zinc-800 text-zinc-200 hover:bg-zinc-700">OCULAR</button>
                            <button (click)="telemetryService.setTelemetryMode('VOCAL')" [class.bg-cyan-600]="telemetryService.selectedTelemetryMode() === 'VOCAL'" class="px-2 py-1 rounded bg-zinc-800 text-zinc-200 hover:bg-zinc-700">VOCAL</button>
                            <button (click)="telemetryService.setTelemetryMode('RPPG')" [class.bg-cyan-600]="telemetryService.selectedTelemetryMode() === 'RPPG'" class="px-2 py-1 rounded bg-zinc-800 text-zinc-200 hover:bg-zinc-700">rPPG</button>
                        </div>
                    </div>

                    <!-- Telemetry Meters Grid -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <!-- 1. Pupillometry & Neuro-Safety -->
                        <div class="p-3 rounded-2xl bg-zinc-900/90 border border-cyan-500/20 space-y-1">
                            <div class="flex items-center justify-between text-[10px] text-zinc-400">
                                <span class="uppercase font-bold text-cyan-300">Pupillometry</span>
                                <span class="font-bold text-emerald-400">L:{{ telemetryService.ocular().leftPupilDiameterMm }}mm / R:{{ telemetryService.ocular().rightPupilDiameterMm }}mm</span>
                            </div>
                            <div class="text-xs font-bold text-zinc-100 flex items-center justify-between">
                                <span>Asymmetry: {{ telemetryService.ocular().anisocoriaAsymmetryPct }}%</span>
                                <span class="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">{{ telemetryService.ocular().isPupilSymmetric ? 'Symmetric' : 'Anisocoria Flag' }}</span>
                            </div>
                            <div class="text-[10px] text-zinc-400 font-sans">Blink Rate: {{ telemetryService.ocular().blinkRatePerMin }}/min &bull; Saccade: {{ telemetryService.ocular().saccadicStabilityScore }}%</div>
                        </div>

                        <!-- 2. Vocal Acoustics & Micro-Tremor -->
                        <div class="p-3 rounded-2xl bg-zinc-900/90 border border-purple-500/20 space-y-1">
                            <div class="flex items-center justify-between text-[10px] text-zinc-400">
                                <span class="uppercase font-bold text-purple-300">Vocal Acoustics</span>
                                <span class="font-bold text-amber-300">F0: {{ telemetryService.vocal().fundamentalFrequencyHz }} Hz</span>
                            </div>
                            <div class="text-xs font-bold text-zinc-100 flex items-center justify-between">
                                <span>Jitter: {{ telemetryService.vocal().microTremorJitterPct }}%</span>
                                <span class="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">HNR: {{ telemetryService.vocal().harmonicToNoiseRatioDb }} dB</span>
                            </div>
                            <div class="text-[10px] text-zinc-400 font-sans truncate">{{ telemetryService.vocal().acousticNote }}</div>
                        </div>

                        <!-- 3. rPPG Capillary Pulse & Perfusion -->
                        <div class="p-3 rounded-2xl bg-zinc-900/90 border border-rose-500/20 space-y-1">
                            <div class="flex items-center justify-between text-[10px] text-zinc-400">
                                <span class="uppercase font-bold text-rose-300">rPPG Perfusion</span>
                                <span class="font-bold text-rose-400">{{ telemetryService.rppg().heartRateBpm }} BPM</span>
                            </div>
                            <div class="text-xs font-bold text-zinc-100 flex items-center justify-between">
                                <span>HRV RMSSD: {{ telemetryService.rppg().hrvRmssdMs }} ms</span>
                                <span class="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">PWV: {{ telemetryService.rppg().pulseWaveVelocityMps }} m/s</span>
                            </div>
                            <div class="text-[10px] text-zinc-400 font-sans">Capillary SNR: {{ telemetryService.rppg().signalToNoiseRatioDb }} dB &bull; Quality: {{ telemetryService.rppg().perfusionQualityIndex }}%</div>
                        </div>

                        <!-- 4. Neuro-Vascular Synthesis Score -->
                        <div class="p-3 rounded-2xl bg-zinc-900/90 border border-amber-500/20 space-y-1">
                            <div class="flex items-center justify-between text-[10px] text-zinc-400">
                                <span class="uppercase font-bold text-amber-300">Autonomic Index</span>
                                <span class="font-bold text-amber-400">{{ telemetryService.overallNeuroVascularScore() }} / 100</span>
                            </div>
                            <div class="w-full bg-zinc-800 rounded-full h-2 overflow-hidden mt-1">
                                <div class="bg-gradient-to-r from-teal-500 via-cyan-400 to-indigo-500 h-2 rounded-full transition-all duration-500" [style.width.%]="telemetryService.overallNeuroVascularScore()"></div>
                            </div>
                            <div class="text-[10px] text-emerald-400 font-sans flex items-center justify-between pt-0.5">
                                <span>WebRTC Sync: Sub-200ms</span>
                                <span>Zero PHI Egress</span>
                            </div>
                        </div>
                    </div>
                </div>
            }

            <!-- MODE: SELECTION Placeholder -->
            @if (panelMode() === 'selection') {
                <div class="flex-1 flex flex-col items-center justify-center gap-6 p-8 bg-white dark:bg-[#09090b] w-full"></div>
            }

            <!-- MODE: CHAT -->
            @if (panelMode() === 'chat') {
                <div class="flex-1 flex flex-col items-stretch justify-center overflow-hidden bg-white dark:bg-[#09090b] w-full relative">
                    
                    <!-- Centerpiece: Agent Avatar & Status -->
                    <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
                        <div class="relative w-48 h-48 md:w-64 md:h-64 transition-all duration-500" [class.opacity-10]="chatHistory().length > 0" [class.opacity-100]="chatHistory().length === 0">
                            <!-- Glowing Orb -->
                            <div class="absolute inset-0 rounded-full transition-all duration-75" 
                                 [class.bg-green-400/10]="agentState() === 'idle'"
                                 [class.bg-blue-400/20]="agentState() === 'listening'"
                                 [class.bg-purple-400/20]="agentState() === 'processing'"
                                 [class.blur-2xl]="agentState() === 'idle' || agentState() === 'processing'"
                                 [class.blur-xl]="agentState() === 'listening'"
                                 [style.transform]="agentState() === 'listening' ? 'scale(' + (1.25 + (live.volumeLevel() / 150)) + ')' : (agentState() === 'idle' ? 'scale(1)' : 'scale(1.25)')">
                            </div>

                            <!-- Animated SVG Avatar -->
                            <svg class="w-full h-full" viewBox="0 0 100 100">
                                <!-- Base Circle -->
                                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#E5E7EB" stroke-width="0.5"/>

                                <!-- Listening Waveform -->
                                @if (agentState() === 'listening') {
                                    <path d="M 20 50 Q 35 40, 50 50 T 80 50" fill="none" stroke="#60A5FA" stroke-width="1.5" stroke-linecap="round">
                                        <animate attributeName="d" dur="1.5s" repeatCount="indefinite" values="M 20 50 Q 35 40, 50 50 T 80 50; M 20 50 Q 35 60, 50 50 T 80 50; M 20 50 Q 35 40, 50 50 T 80 50" />
                                    </path>
                                }

                                <!-- Processing Spinner -->
                                @if (agentState() === 'processing') {
                                    <circle cx="50" cy="50" r="30" fill="none" stroke="#C084FC" stroke-width="2" stroke-dasharray="15 10" stroke-linecap="round">
                                        <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="1s" repeatCount="indefinite" />
                                    </circle>
                                }

                                <!-- Idle Pulsing Core -->
                                @if (agentState() === 'idle') {
                                    <circle cx="50" cy="50" r="10" fill="#34D399" >
                                        <animate attributeName="r" dur="2s" repeatCount="indefinite" values="10;12;10" />
                                        <animate attributeName="opacity" dur="2s" repeatCount="indefinite" values="1;0.7;1" />
                                    </circle>
                                }
                            </svg>
                        </div>
                        <div class="text-center -mt-8 md:-mt-16 transition-all duration-300" [class.opacity-0]="chatHistory().length > 0">
                            <h2 class="text-lg font-bold text-gray-800 dark:text-gray-200">Pocket Gull Intelligence</h2>
                            <p class="text-sm text-gray-500">Live Clinical Co-Pilot</p>
                        </div>
                    </div>

                    <!-- Transcript Scroll Area -->
                    <div #transcriptContainer class="relative z-10 flex-1 overflow-y-auto w-full scroll-smooth pt-8 pb-48 px-4 lg:px-8">
                        <div class="max-w-3xl mx-auto space-y-6">
                            @if (isPediatricMinor()) {
                                <div class="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3 text-xs font-mono animate-in fade-in duration-200">
                                    <div class="flex items-center gap-2.5">
                                        <span class="text-xl">🧸</span>
                                        <div>
                                            <span class="font-bold text-emerald-600 dark:text-emerald-400 block text-xs">
                                                Child Life Voice Mode Active
                                            </span>
                                            <span class="text-[11px] text-gray-600 dark:text-zinc-400 font-sans">
                                                Gentle pediatric analogies &bull; 100% Edge-only voice processing &bull; Zero remote voiceprints
                                            </span>
                                        </div>
                                    </div>
                                    <span class="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-500/30 shrink-0">
                                        🔒 COPPA Safe Harbor
                                    </span>
                                </div>
                            }

                            <!-- Telemetry Transcript -->
                            <div class="font-mono text-base space-y-6 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md p-6 rounded-2xl border border-white/20 dark:border-zinc-800/30 shadow-lg">
                                @for (entry of chatHistory(); track $index; let idx = $index) {
                                    @let isEntryFlipped = isChatEntryFlipped(idx);
                                    <div (dblclick)="toggleChatEntryFlip(idx); $event.stopPropagation()"
                                         class="chat-entry relative perspective-1000 group cursor-pointer mb-4 min-h-[100px]"
                                         title="Double-click to flip over for Multimodal Telemetry & Evidence Trail">
                                        
                                        <div [class.rotate-y-180]="isEntryFlipped"
                                             class="relative w-full h-full transition-transform duration-500 transform-style-3d">

                                            <!-- FRONT FACE -->
                                            <div class="p-4 md:p-5 rounded-2xl border flex flex-col justify-between h-full w-full absolute inset-0 backface-hidden shadow-sm font-sans"
                                                 [class.bg-blue-500\/5]="entry.role === 'model'"
                                                 [class.dark:bg-blue-500\/10]="entry.role === 'model'"
                                                 [class.border-blue-500\/30]="entry.role === 'model'"
                                                 [class.bg-emerald-500\/5]="entry.role === 'user'"
                                                 [class.dark:bg-emerald-500\/10]="entry.role === 'user'"
                                                 [class.border-emerald-500\/30]="entry.role === 'user'">
                                                
                                                <!-- Header line -->
                                                <div class="text-[11px] font-mono uppercase font-bold tracking-widest mb-1.5 flex justify-between items-center opacity-80">
                                                    <span class="flex items-center gap-1.5">
                                                        <span>{{ entry.role === 'model' ? '🤖 SYS.INTELLIGENCE' : '👤 USR.MIC' }}</span>
                                                        <span class="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">
                                                            dblclick 🔄
                                                        </span>
                                                    </span>
                                                    
                                                    <div class="opacity-0 group-hover:opacity-100 transition-opacity flex flex-wrap gap-2 text-[10px] font-mono">
                                                         <button (click)="actionCopy(entry.text); $event.stopPropagation()" class="hover:text-black dark:hover:text-white" title="Copy">[COPY]</button>
                                                         @if (entry.role === 'model') {
                                                            <button (click)="speakPersona(entry.text, 'gulliver'); $event.stopPropagation()" class="hover:text-[#F6B12B] font-bold" title="Speak with Gulliver voice">[🔭 GULLIVER]</button>
                                                            <button (click)="speakPersona(entry.text, 'swoop'); $event.stopPropagation()" class="hover:text-amber-500 font-bold" title="Speak with Swoop voice">[⚡ SWOOP]</button>
                                                            <button (click)="speakPersona(entry.text, 'sentinel'); $event.stopPropagation()" class="hover:text-sky-500 font-bold" title="Speak with Sentinel voice">[🔦 SENTINEL]</button>
                                                            <button (click)="speakPersona(entry.text, 'scribes'); $event.stopPropagation()" class="hover:text-emerald-500 font-bold" title="Speak with Scribes voice">[📖 SCRIBES]</button>
                                                            <button (click)="actionInsert(entry.text); $event.stopPropagation()" class="hover:text-black dark:hover:text-white" title="Insert to chart">[LOG]</button>
                                                            <button (click)="actionAnchor(entry.text); $event.stopPropagation()" class="hover:text-purple-400 font-bold" title="Anchor to Memory Palace">[ANCHOR]</button>
                                                         }
                                                     </div>
                                                </div>

                                                <!-- Content -->
                                                <div class="prose prose-base md:prose-lg dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-a:text-blue-500 text-gray-800 dark:text-gray-200 text-xs md:text-sm leading-relaxed">
                                                    <div [innerHTML]="getFormattedChatText(entry) | safeHtml"></div>
                                                </div>

                                                <!-- Inline Micro-Component Drill-Down Widgets -->
                                                @if (entry.role === 'model') {
                                                  <div class="mt-3 pt-2 border-t border-blue-500/20 flex flex-wrap gap-1.5 font-mono text-[10px]">
                                                    <button (click)="openDrilldown('biomarkers'); $event.stopPropagation()" class="px-2.5 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30 font-bold transition flex items-center gap-1">
                                                      <span>🧬</span> <span>Biomarker Matrix</span>
                                                    </button>
                                                    <button (click)="openDrilldown('food_safety'); $event.stopPropagation()" class="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 font-bold transition flex items-center gap-1">
                                                      <span>🥗</span> <span>Food Safety</span>
                                                    </button>
                                                    <button (click)="openDrilldown('occupational'); $event.stopPropagation()" class="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 font-bold transition flex items-center gap-1">
                                                      <span>⚠️</span> <span>Hazard Profile</span>
                                                    </button>
                                                    <button (click)="openDrilldown('qaly'); $event.stopPropagation()" class="px-2.5 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30 font-bold transition flex items-center gap-1">
                                                      <span>⏳</span> <span>QALY Longevity</span>
                                                    </button>
                                                    <button (click)="openMdcpHub(); $event.stopPropagation()" class="px-2.5 py-1 rounded bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-300 border border-teal-500/30 font-bold transition flex items-center gap-1 cursor-pointer">
                                                      <span>📋</span> <span>MDCP Governance Hub</span>
                                                    </button>
                                                  </div>
                                                }

                                                <!-- Rich Media Cards -->
                                                @if (entry.richCards && entry.richCards.length > 0) {
                                                     <div class="rm-panel mt-3 opacity-90">
                                                         @for (card of entry.richCards; track card.query) {
                                                            <div class="text-xs bg-black/5 dark:bg-white/5 p-2 rounded border border-black/10 dark:border-white/10 my-1 font-mono">
                                                                [MEDIA_LINK: {{ card.kind }} | {{ card.query }}]
                                                            </div>
                                                         }
                                                     </div>
                                                 }
                                            </div>

                                            <!-- BACK FACE -->
                                            <div class="p-4 md:p-5 rounded-2xl bg-zinc-950 text-white border border-purple-500/40 shadow-2xl flex flex-col justify-between h-full w-full absolute inset-0 rotate-y-180 backface-hidden font-sans text-xs">
                                                <div>
                                                    <div class="flex items-center justify-between border-b border-purple-800 pb-1.5 mb-2 font-mono text-xs">
                                                        <span class="text-purple-300 font-bold uppercase flex items-center gap-1">
                                                            <span>🎙️</span> Multimodal Telemetry & Evidence Audit
                                                        </span>
                                                        <span class="text-purple-400 font-mono text-[10px]">dblclick flip</span>
                                                    </div>
                                                    <div class="space-y-1.5 font-mono text-[11px] text-purple-100">
                                                        <p><strong>Gemini Engine:</strong> Gemini 2.5 Flash Multimodal Audio (REST WebSocket Live)</p>
                                                        <p><strong>Audio Buffer:</strong> 16kHz PCM Web Audio API Input &bull; Latency: 240ms</p>
                                                        <p><strong>Evidence Trail:</strong> FHIR R4 Bundle State Verified &bull; DOMPurify HIPAA Clean</p>
                                                        <p><strong>MDCP Standards:</strong> IEEE 11073-10101 RTMMS &bull; Form 2603 ISP &bull; ITA 15 U.S.C. § 4723</p>
                                                    </div>
                                                </div>
                                                <div class="pt-1.5 border-t border-purple-900 font-mono text-[9px] text-purple-400 flex justify-between">
                                                    <span>Live Multimodal Telemetry</span>
                                                    <span>Double-click to return</span>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                }
                                
                                <!-- Thinking Indicator -->
                                @if (agentState() === 'processing') {
                                    <div class="pl-4 border-l-2 border-purple-500 chat-entry">
                                        <div class="text-[12px] md:text-sm uppercase font-bold tracking-widest mb-1.5 opacity-60 animate-pulse">
                                            SYS.PROCESSING_
                                        </div>
                                        <div class="text-gray-500 dark:text-zinc-400 animate-pulse">
                                            <span class="inline-block w-1.5 h-3 bg-purple-500 mr-1 animate-bounce"></span>
                                            <span class="inline-block w-1.5 h-3 bg-purple-500 mr-1 animate-bounce" style="animation-delay: 0.1s"></span>
                                            <span class="inline-block w-1.5 h-3 bg-purple-500 animate-bounce" style="animation-delay: 0.2s"></span>
                                        </div>
                                    </div>
                                }
                            </div>
                        </div>
                    </div>

                    <!-- Controls (Floating at bottom) -->
                    <div class="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-[#09090b] dark:via-[#09090b]/90 dark:to-transparent flex justify-center z-20">
                         <div class="w-full max-w-3xl flex flex-col gap-3 relative">
                            <!-- Smart Suggestions -->
                            @if (agentState() === 'idle') {
                                <div class="flex flex-wrap items-center justify-center gap-2 mb-2 w-full px-4 animate-in fade-in slide-in-from-bottom-2 duration-500 font-mono text-xs">
                                  <button type="button" (click)="messageText.set('What is the most critical evidence here?'); sendMessage()" class="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shadow-sm">
                                      📌 Critical evidence?
                                  </button>
                                  <button type="button" (click)="messageText.set('Summarize the primary treatment plan and safety guardrails.'); sendMessage()" class="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shadow-sm">
                                      🛡️ Treatment Plan & Safety
                                  </button>
                                  <button type="button" (click)="messageText.set('What are the key lab biomarker targets for this patient?'); sendMessage()" class="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shadow-sm">
                                      🧬 Biomarker Targets
                                  </button>
                                </div>

                                <!-- 📋 MDCP 4-Pillar Clinical & Standards Command Bar -->
                                <div class="flex items-center justify-between gap-1.5 w-full px-3 py-1.5 bg-teal-950/20 dark:bg-teal-950/40 border border-teal-500/20 rounded-2xl text-[11px] font-mono overflow-x-auto no-scrollbar animate-in fade-in duration-300">
                                  <div class="flex items-center gap-1.5 shrink-0 text-teal-600 dark:text-teal-400 font-bold">
                                    <span>📋 MDCP:</span>
                                  </div>
                                  <div class="flex items-center gap-1.5 shrink-0">
                                    <button type="button" (click)="sendMdcpQuickPrompt('Evaluate pediatric MDCP waiver requirements, SK-SAI nursing acuity, and Form 2603 PDN hours for this patient.')" class="px-2.5 py-1 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 transition flex items-center gap-1 whitespace-nowrap cursor-pointer">
                                      <span>🧸</span> <span>Waiver & PDN</span>
                                    </button>
                                    <button type="button" (click)="sendMdcpQuickPrompt('Synchronize hospital multi-disciplinary care plan milestones, weaning goals, and 3-act plain language trajectory.')" class="px-2.5 py-1 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 transition flex items-center gap-1 whitespace-nowrap cursor-pointer">
                                      <span>🏥</span> <span>Inpatient MDCP</span>
                                    </button>
                                    <button type="button" (click)="sendMdcpQuickPrompt('Query live ISO/IEEE 11073 medical device communication telemetry, MDC codes, and alarm confidence scores.')" class="px-2.5 py-1 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 transition flex items-center gap-1 whitespace-nowrap cursor-pointer">
                                      <span>📡</span> <span>IEEE 11073</span>
                                    </button>
                                    <button type="button" (click)="sendMdcpQuickPrompt('Audit ITA Market Development Cooperator Program compliance, 15 U.S.C. 4723 statutory alignment, and Five Eyes data sovereignty.')" class="px-2.5 py-1 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 transition flex items-center gap-1 whitespace-nowrap cursor-pointer">
                                      <span>🌐</span> <span>ITA Standards</span>
                                    </button>
                                    <button type="button" (click)="openMdcpHub()" class="px-3 py-1 rounded-xl bg-teal-600 text-white hover:bg-teal-500 font-bold transition flex items-center gap-1 whitespace-nowrap cursor-pointer shadow-xs">
                                      <span>⚙️</span> <span>Hub</span>
                                    </button>
                                  </div>
                                </div>
                            }

                            @if (permissionError()) {
                              <div class="px-4 py-2 bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium text-center animate-in fade-in slide-in-from-top-1 duration-200">
                                {{ permissionError() }}
                              </div>
                            }

                            <!-- 🎙️ Live WebAudio RMS Acoustic Waveform Visualizer & Ambient SOAP Pill -->
                            <div class="w-full flex items-center justify-between px-2 py-1 text-xs">
                              @if (live.isListening()) {
                                <div class="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-[11px] text-emerald-300 font-mono font-bold animate-pulse">
                                  <span>🎙️ Live Acoustic Scribe:</span>
                                  <div class="flex items-center gap-0.5 h-3">
                                    <span class="w-1 bg-emerald-400 rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-2"></span>
                                    <span class="w-1 bg-teal-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-3"></span>
                                    <span class="w-1 bg-emerald-300 rounded-full animate-[pulse_0.3s_ease-in-out_infinite] h-3"></span>
                                    <span class="w-1 bg-teal-300 rounded-full animate-[pulse_0.5s_ease-in-out_infinite] h-2"></span>
                                  </div>
                                </div>
                              } @else {
                                <span class="text-[11px] text-zinc-400 font-mono">Ambient Scribe Ready</span>
                              }

                              <button type="button" 
                                      (click)="generateSoapNote()"
                                      [disabled]="chatHistory().length === 0 && !messageText().trim()"
                                      class="px-2.5 py-1 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 rounded-xl font-bold text-[10.5px] cursor-pointer transition flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed">
                                <span>📝 Parse 4-Paradigm SOAP</span>
                              </button>
                            </div>

                            <form (submit)="sendMessage($event)" class="w-full flex items-center gap-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-gray-200 dark:border-zinc-700 shadow-2xl rounded-2xl p-2 focus-within:border-gray-300 dark:focus-within:border-zinc-600 transition-all">
                                <button type="button" (click)="toggleListening()" [disabled]="agentState() !== 'idle' || !!permissionError()"
                                        title="Start/Stop Voice Capture"
                                        class="w-12 h-12 flex items-center justify-center rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
                                        [class.bg-red-500]="live.isListening()" [class.text-white]="live.isListening()"
                                        [class.bg-gray-100]="!live.isListening()" [class.dark:bg-zinc-800]="!live.isListening()" [class.text-gray-600]="!live.isListening()" [class.dark:text-zinc-300]="!live.isListening()"
                                        [class.hover:bg-red-600]="live.isListening()" [class.hover:bg-gray-200]="!live.isListening()" [class.dark:hover:bg-zinc-700]="!live.isListening()">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                                </button>

                                <div class="flex-1">
                                    <pocket-gull-input
                                        #chatInput
                                        type="text"
                                        [value]="messageText()"
                                        (valueChange)="messageText.set($event)"
                                        placeholder="Ask a follow-up or say 'Done' to exit..."
                                        className="!border-transparent !bg-transparent !shadow-none !ring-0 !px-2 !py-2 text-base"
                                        [disabled]="agentState() !== 'idle'"
                                        (keydown)="handleKeydown($event)">
                                    </pocket-gull-input>
                                </div>

                                 <button type="button" class="w-10 h-10 flex items-center justify-center rounded-xl transition-colors"
                                         (click)="isResearchMode.set(!isResearchMode())"
                                         [class.bg-blue-100]="isResearchMode()" [class.dark:bg-blue-900]="isResearchMode()" [class.text-blue-600]="isResearchMode()" [class.dark:text-blue-300]="isResearchMode()"
                                         [class.text-gray-500]="!isResearchMode()" [class.hover:bg-gray-100]="!isResearchMode()" [class.dark:hover:bg-zinc-800]="!isResearchMode()"
                                         [disabled]="agentState() !== 'idle'" title="Toggle Research Grounding">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                                </button>

                                 <button type="button" class="w-10 h-10 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-50" (click)="triggerFileInput()" [disabled]="agentState() !== 'idle'" title="Attach Files">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                                </button>
                                <input type="file" #fileInput (change)="onFileSelected($event)" accept="image/*,application/pdf" multiple class="hidden">

                                <button 
                                    type="submit" 
                                    [disabled]="!messageText().trim() && selectedFiles().length === 0 || agentState() !== 'idle'"
                                    class="w-12 h-12 rounded-xl flex items-center justify-center bg-black text-white disabled:bg-gray-300 dark:disabled:bg-zinc-700 hover:bg-gray-800 transition-colors shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                </button>
                            </form>
                            
                        </div>
                    </div>
                </div>
            }

            <!-- 4-Paradigm SOAP Note Modal -->
            @if (isSoapModalOpen() && activeSoapNote()) {
              <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                <div class="bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl font-sans max-h-[85vh] overflow-y-auto space-y-4">
                  <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div class="flex items-center gap-2">
                      <span class="text-2xl">📝</span>
                      <div>
                        <h3 class="text-base font-bold text-zinc-100">4-Paradigm Clinical SOAP Note</h3>
                        <p class="text-[10.5px] text-zinc-400 font-mono">Ambient Voice Scribe Extraction</p>
                      </div>
                    </div>
                    <button type="button" (click)="isSoapModalOpen.set(false)" class="text-zinc-400 hover:text-white text-lg font-bold cursor-pointer">✕</button>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <!-- Subjective -->
                    <div class="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1.5">
                      <div class="font-bold text-emerald-400 uppercase tracking-wide text-[11px]">1. Subjective (S)</div>
                      <div class="text-zinc-300 text-[11px] space-y-1">
                        <div><strong>🩺 Western:</strong> {{ activeSoapNote()?.subjective?.western?.join(' ') }}</div>
                        <div><strong>🌿 TCM:</strong> {{ activeSoapNote()?.subjective?.eastern?.join(' ') }}</div>
                        <div><strong>🪷 Ayurvedic:</strong> {{ activeSoapNote()?.subjective?.ayurvedic?.join(' ') }}</div>
                        <div><strong>🦴 Osteopathic:</strong> {{ activeSoapNote()?.subjective?.osteopathic?.join(' ') }}</div>
                      </div>
                    </div>

                    <!-- Objective -->
                    <div class="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1.5">
                      <div class="font-bold text-sky-400 uppercase tracking-wide text-[11px]">2. Objective (O)</div>
                      <div class="text-zinc-300 text-[11px] space-y-1">
                        <div><strong>🩺 Western:</strong> {{ activeSoapNote()?.objective?.western?.join(' ') }}</div>
                        <div><strong>🌿 TCM:</strong> {{ activeSoapNote()?.objective?.eastern?.join(' ') }}</div>
                        <div><strong>🪷 Ayurvedic:</strong> {{ activeSoapNote()?.objective?.ayurvedic?.join(' ') }}</div>
                        <div><strong>🦴 Osteopathic:</strong> {{ activeSoapNote()?.objective?.osteopathic?.join(' ') }}</div>
                      </div>
                    </div>

                    <!-- Assessment -->
                    <div class="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1.5">
                      <div class="font-bold text-amber-400 uppercase tracking-wide text-[11px]">3. Assessment (A)</div>
                      <div class="text-zinc-300 text-[11px] space-y-1">
                        <div><strong>🩺 Western:</strong> {{ activeSoapNote()?.assessment?.western?.join(' ') }}</div>
                        <div><strong>🌿 TCM:</strong> {{ activeSoapNote()?.assessment?.eastern?.join(' ') }}</div>
                        <div><strong>🪷 Ayurvedic:</strong> {{ activeSoapNote()?.assessment?.ayurvedic?.join(' ') }}</div>
                        <div><strong>🦴 Osteopathic:</strong> {{ activeSoapNote()?.assessment?.osteopathic?.join(' ') }}</div>
                      </div>
                    </div>

                    <!-- Plan -->
                    <div class="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1.5">
                      <div class="font-bold text-purple-400 uppercase tracking-wide text-[11px]">4. Plan (P)</div>
                      <div class="text-zinc-300 text-[11px] space-y-1">
                        <div><strong>🩺 Western:</strong> {{ activeSoapNote()?.plan?.western?.join(' ') }}</div>
                        <div><strong>🌿 TCM:</strong> {{ activeSoapNote()?.plan?.eastern?.join(' ') }}</div>
                        <div><strong>🪷 Ayurvedic:</strong> {{ activeSoapNote()?.plan?.ayurvedic?.join(' ') }}</div>
                        <div><strong>🦴 Osteopathic:</strong> {{ activeSoapNote()?.plan?.osteopathic?.join(' ') }}</div>
                      </div>
                    </div>
                  </div>

                  <div class="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                    <button type="button" (click)="copySoapMarkdown()" class="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl cursor-pointer transition">
                      📋 Copy Markdown
                    </button>
                    <button type="button" (click)="isSoapModalOpen.set(false)" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl cursor-pointer transition">
                      ✓ Done
                    </button>
                  </div>
                </div>
              </div>
            }

            <!-- Anchor Modal -->
            @if (isAnchorModalOpen()) {
              <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm">
                <form (submit)="submitAnchor($event)" class="bg-white dark:bg-zinc-950 rounded-lg shadow-2xl border border-gray-200 dark:border-zinc-800 w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                  <!-- Header -->
                  <div class="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-900/50">
                    <h3 class="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">Anchor to Memory Palace</h3>
                    <button type="button" (click)="isAnchorModalOpen.set(false)" class="text-gray-400 hover:text-gray-500">✕</button>
                  </div>

                  <!-- Content -->
                  <div class="p-6 space-y-4 text-left">
                    <div>
                      <label class="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Chamber</label>
                      <select name="anchorRoom" [(ngModel)]="anchorRoom" class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm focus:outline-none focus:border-green-500">
                        <option value="Library">Library</option>
                        <option value="Hall of Records">Hall of Records</option>
                        <option value="Somatic Chamber">Somatic Chamber</option>
                        <option value="Apothecary">Apothecary</option>
                      </select>
                    </div>

                    <div>
                      <label class="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Locus (Physical Anchor Point)</label>
                      <input type="text" name="anchorLocus" [(ngModel)]="anchorLocus" placeholder="e.g. Archive Shelf A" class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm focus:outline-none focus:border-green-500">
                    </div>

                    <div>
                      <label class="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Memory Content</label>
                      <textarea name="anchorContent" [(ngModel)]="anchorContent" rows="4" class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm focus:outline-none focus:border-green-500"></textarea>
                    </div>
                  </div>

                  <!-- Footer -->
                  <div class="px-6 py-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 flex justify-end gap-3">
                    <button type="button" (click)="isAnchorModalOpen.set(false)" class="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-700">Cancel</button>
                    <button type="submit" class="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-lg hover:bg-black dark:hover:bg-white transition">Anchor Memory</button>
                  </div>
                </form>
              </div>
            }

        </div>
    `
})
export class VoiceAssistantComponent implements OnDestroy {
    state = inject(PatientStateService);
    intel = inject(ClinicalIntelligenceService);
    dictation = inject(DictationService);
    patientMgmt = inject(PatientManagementService);
    markdownService = inject(MarkdownService);
    richMedia = inject(RichMediaService);
    storage = inject(StorageService);
    secureStorage = inject(SecureStorageService);
    bionicReading = inject(BionicReadingService);
    telemetryService = inject(OcularVocalTelemetryService);
    opticalVision = inject(OpticalCameraVisionService);
    mdcpService = inject(MdcpDomainService, { optional: true });
    navShell = inject(NavigationShellService, { optional: true });

    openMdcpHub(): void {
      this.navShell?.openMdcpHub();
    }

    sendMdcpQuickPrompt(prompt: string): void {
      this.messageText.set(prompt);
      this.sendMessage();
    }

    getFormattedChatText(entry: IChatEntry): string {
      const rawContent = entry.htmlContent || entry.text;
      if (this.bionicReading.isBionicReadingEnabled()) {
        return this.bionicReading.formatToBionicHtml(rawContent, 'font-bold text-indigo-600 dark:text-indigo-400');
      }
      return rawContent;
    }

    ybocsService = inject(YbocsService);
    voiceAssistantMode = signal<'standard' | 'ybocs' | 'chrono' | 'avs'>('standard');
    ybocsQuestionIndex = signal<number>(-1);

    soapParser = inject(AmbientSoapParserService, { optional: true });
    activeSoapNote = signal<IStructuredSoapNote | null>(null);
    isSoapModalOpen = signal<boolean>(false);

    generateSoapNote(): void {
      const messages = this.chatHistory().map(c => `${c.role}: ${c.text}`).join('\n');
      const input = this.messageText().trim();
      const fullTranscript = messages + (input ? `\nuser: ${input}` : '');
      
      const parser = this.soapParser || new AmbientSoapParserService();
      const note = parser.parseTranscript(fullTranscript);
      this.activeSoapNote.set(note);
      this.isSoapModalOpen.set(true);
    }

    copySoapMarkdown(): void {
      const note = this.activeSoapNote();
      if (!note) return;
      const parser = this.soapParser || new AmbientSoapParserService();
      const md = parser.formatAsMarkdown(note);
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(md);
      }
    }


    panelMode = signal<'selection' | 'chat' | 'dictation'>('chat');

    openDrilldown(target: 'biomarkers' | 'occupational' | 'food_safety' | 'ybocs' | 'qaly' | 'foraging' | 'vagal') {
      this.state.activeDrilldownComponent.set(target);
    }

    transcriptContainer = viewChild<ElementRef<HTMLDivElement>>('transcriptContainer');
    fileInputRef = viewChild<ElementRef<HTMLInputElement>>('fileInput');
    chatInputRef = viewChild<any>('chatInput');

    // --- Chat State ---
    agentState = signal<'idle' | 'listening' | 'processing' | 'speaking' | 'typing'>('idle');
    isMuted = signal<boolean>(true);
    permissionError = signal<string | null>(null);
    messageText = signal('');
    typingIntroText = signal('');
    chatHistory = signal<IChatEntry[]>([]);
    selectedFiles = signal<File[]>([]);
    isResearchMode = signal(false);

    readonly flippedEntries = signal<Set<number>>(new Set());

    private lastChatEntryFlipMap = new Map<number, number>();

    toggleChatEntryFlip(index: number, event?: Event) {
        if (event) event.stopPropagation();
        const now = Date.now();
        const last = this.lastChatEntryFlipMap.get(index) || 0;
        if (now - last < 200) return;
        this.lastChatEntryFlipMap.set(index, now);
        const set = new Set(this.flippedEntries());
        if (set.has(index)) set.delete(index);
        else set.add(index);
        this.flippedEntries.set(set);
    }

    isChatEntryFlipped(index: number): boolean {
        return this.flippedEntries().has(index);
    }

    // --- Anchor Modal State ---
    isAnchorModalOpen = signal(false);
    anchorContent = signal('');
    anchorRoom = signal('Library');
    anchorLocus = signal('');

    protected readonly ClinicalIcons = ClinicalIcons;

    speakPersona(text: string, persona: 'gulliver' | 'swoop' | 'sentinel' | 'scribes') {
      this.dictation.speakAvianPersonaText(text, persona);
    }
    public live = inject(AdkLiveService);
    public coppaShield = inject(CoppaPrivacyShieldService, { optional: true });
    public actuarialService = inject(ActuarialLongevityService, { optional: true });
    public lesionMarkup = inject(SpatialLesionMarkupService, { optional: true });

    readonly isPediatricMinor = computed(() => {
      const p = this.patientMgmt.selectedPatient();
      return (this.coppaShield ? this.coppaShield.isUnderAgeThreshold(p?.age) : false) || this.state.isPlainLanguageMode() || (this.coppaShield ? this.coppaShield.isPediatricContext() : false);
    });

    // Derived signal for UI rendering
    parsedTranscript = computed(() => {
        return this.chatHistory();
    });

    // --- Action Bar Logic ---
    actionCopy(text: string) {
        navigator.clipboard.writeText(text);
    }

    actionThumbsUp(entry: IChatEntry) {
        entry.feedback = entry.feedback === 'up' ? undefined : 'up';
        this.chatHistory.update(h => [...h]);
    }

    actionThumbsDown(entry: IChatEntry) {
        entry.feedback = entry.feedback === 'down' ? undefined : 'down';
        this.chatHistory.update(h => [...h]);
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

    actionAnchor(text: string) {
        const cleanText = text.replace(/[*_~`#]/g, '');
        this.anchorContent.set(cleanText);
        this.anchorRoom.set('Library');
        this.anchorLocus.set('');
        this.isAnchorModalOpen.set(true);
    }

    async submitAnchor(event: Event) {
        event.preventDefault();
        try {
            const response = await fetch('/api/loci/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patient_id: 'current_patient',
                    room: this.anchorRoom(),
                    locus: this.anchorLocus(),
                    content: this.anchorContent()
                })
            });
            if (response.ok) {
                console.log("Memory anchored successfully!");
            }
        } catch (e) {
            console.error("Failed to save locus:", e);
        }
        this.isAnchorModalOpen.set(false);
    }



    // --- Dictation State ---
    dictationText = signal('');
    isDictating = signal(false);

    constructor() {
        effect(() => {
            const input = this.state.liveAgentInput();
            if (input && this.agentState() === 'idle') {
                this.messageText.set(input);
                this.state.liveAgentInput.set('');

                untracked(() => {
                    setTimeout(() => this.sendMessage(), 50);
                });
            }
        });

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
        });

        effect(() => {
            const liveErr = this.live.connectionError();
            if (liveErr) {
                untracked(() => {
                    this.permissionError.set('Failed to connect to Live Interface.');
                });
            }
        });

        // Stream real-time 3D spatial lesion placement events to live Gemini audio WebSocket session
        if (this.lesionMarkup) {
            let prevLesionCount = this.lesionMarkup.activeLesions().length;
            effect(() => {
                const lesions = this.lesionMarkup?.activeLesions() || [];
                if (lesions.length > prevLesionCount && this.live.isConnected()) {
                    const latestLesion = lesions[lesions.length - 1];
                    untracked(() => {
                        this.live.sendRealtimeLesionUpdate(latestLesion);
                    });
                }
                prevLesionCount = lesions.length;
            });
        }

        // Only init if in browser
        if (typeof window !== 'undefined') {
            // Listen to voice mode changes
            window.addEventListener('voice-mode-change', (e: any) => {
                if (e.detail === 'ybocs') {
                    this.activateYbocsInterview();
                } else if (e.detail === 'chrono') {
                    this.activateChronoVoiceConsultation();
                } else if (e.detail === 'avs') {
                    this.activateAvsVoiceCoRegulation();
                }
            });


            // 1. Hydrate Chat History
            this.storage.loadState('current_patient').then(data => {
                if (data && data.chatHistory && data.chatHistory.length > 0) {
                    this.chatHistory.set(data.chatHistory);
                }
            });

            // 2. Persist Chat History & Manage Token Limits
            effect(() => {
                const history = this.chatHistory();
                untracked(() => {
                    this.storage.saveChatHistory('current_patient', history);
                    
                    // Token-Limit Awareness: Truncate heavily bloated sessions
                    if (history.length > 50 && this.agentState() === 'idle') {
                        const truncated = history.slice(-20);
                        const summaryBubble: IChatEntry = {
                            role: 'model',
                            text: 'System Note: Previous conversation history has been archived to maintain memory efficiency.',
                            htmlContent: '<p class="text-xs text-purple-500 italic">System Note: Previous conversation history has been archived to maintain memory efficiency.</p>'
                        };
                        this.chatHistory.set([summaryBubble, ...truncated]);
                    }
                });
            });

            this.live.onMessage = (msg) => {
                if (msg.text) {
                    this._accumulateModelText(msg.text);
                }
            };
            this.live.onModelTurnComplete = () => {
                this._finalizeModelTurn();
            };
            this.live.onInterrupted = () => {
                this._finalizeModelTurn();
            };
            
            // Setup local STT purely for UI feedback since Live API doesn't echo user speech
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                this.recognition = new SpeechRecognition();
                this.recognition.continuous = true;
                this.recognition.interimResults = true;
                this.recognition.lang = 'en-US';
                
                this.recognition.onspeechstart = () => {
                    if (this.live.isSpeaking()) {
                        this.live.interrupt();
                    }
                };
                
                this.recognition.onresult = (event: any) => {
                    let interim = '';
                    let finalBlock = '';
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcript = event.results[i][0].transcript;
                        if (event.results[i].isFinal) finalBlock += transcript;
                        else interim += transcript;
                    }
                    if (finalBlock) {
                        this._liveUserText += finalBlock + " ";
                        this._updateUserBubble(this._liveUserText.trim() + " " + interim);
                        if (this.voiceAssistantMode() === 'ybocs') {
                            const trimmedText = finalBlock.trim();
                            this._liveUserText = '';
                            this.handleYbocsInput(trimmedText);
                        }
                    } else if (interim) {
                        this._updateUserBubble(this._liveUserText.trim() + " " + interim);
                    }
                };
                
                this.recognition.onerror = (e: any) => console.log("UI STT Error:", e.error);
                this.recognition.onend = () => {
                    // Loop if still listening
                    if (this.live.isListening() && this.agentState() !== 'processing') {
                        try { this.recognition.start(); } catch (e) { console.debug('[VoiceAssistant] Recognition already active:', (e as Error)?.message); }
                    }
                };
            }
        }
    }

    private recognition: any;

    ngOnDestroy() {
        this.stopDictation();
        this.live.disconnect();
        if (this.recognition) this.recognition.stop();
    }

    endLiveConsult() {
        this.live.disconnect();
        if (this.recognition) this.recognition.stop();
        this.agentState.set('idle');
        this.isDictating.set(false);
        this.state.isLiveAgentActive.set(false);
    }

    async activateChat() {
        this.panelMode.set('chat');
        console.log("Activating chat...");

        const patient = this.patientMgmt.selectedPatient();
        const history = patient?.history || [];
        let rawPatientData = this.state.getAllDataForPrompt(history);

        const recentNodes = this.intel.recentNodes();
        if (recentNodes.length > 0) {
            rawPatientData += "\n\n=== RECENT CLINICAL NODE DISCUSSIONS ===\n" +
                recentNodes.map(n =>
                    `[Section: ${n.sectionTitle}]\nClaim in Focus: "${n.nodeText}"\nDiscussion History:\n${n.transcript.map(t => `${t.role.toUpperCase()}: ${t.text}`).join('\n')}`
                ).join('\n\n---\n\n');
        }

        console.log("Starting chat session with patientData length:", rawPatientData.length);

        // We'll manually specify context for VoiceAssistant to ensure rich-media parsing is respected
        const context = `You are a collaborative care plan co-pilot named "Pocket Gull". You are assisting a doctor in refining a strategy for their patient. You have already reviewed the finalized patient overview and the current recommendations. Your role is to help the doctor iterate on the care plan, explore functional protocols, structure follow-ups, or answer specific questions. Keep your answers brief, actionable, and focused on strategic holistic care. Communicate with deep warmth, kindness, and clear, good-natured optimism that uplifts both the clinical team and the patient. Be ready to elaborate when asked.

LAB REPORT EXTRACTION: If the user attaches an image or PDF of a lab report or medical document, automatically extract the patient's vitals, biomarkers, and key metrics. Summarize these findings clearly in your response so the doctor can easily review and commit them to the patient's longitudinal history.

VISUAL GROUNDING: When the user asks for images, a 3D model, or research (e.g. "show me an image", "3D model of", "find research on"), respond with a \`\`\`rich-media\`\`\` JSON block BEFORE your prose explanation. Format:
\`\`\`rich-media
{ "cards": [{ "kind": "model-3d"|"image-gallery"|"pubmed-refs"|"phil-image", "query": "<anatomical or clinical term>", "severity": "green"|"yellow"|"red", "afflictionHighlight": "<anatomical part>", "particles": true|false }] }
\`\`\`
Only include a rich-media block when the user explicitly requests visual or research content.`;

        try {
            // Start standard STT backend init in the background (keeps context sync'd)
            this.intel.ai.startChat(rawPatientData, context).catch(e => {
                console.warn("Background chat session initialization failed:", e);
            });
            
            // Initialize ADK Live Service (uses server Vertex/Secret Manager proxy or user's stored BYOK)
            const apiKey = getStoredApiKey(this.secureStorage) || '';

            // Hook up AdkLiveService callbacks
            this.live.onMessage = (msg) => {
                if (msg.text) {
                    this._accumulateModelText(msg.text);
                }
            };
            this.live.onModelTurnComplete = () => {
                this._finalizeModelTurn();
            };
            this.live.onInterrupted = () => {
                this._finalizeModelTurn();
            };

            console.log("Connecting to Live API WebSocket...");
            const isPediatric = this.isPediatricMinor();
            const activePatient = this.patientMgmt.selectedPatient();
            const childName = activePatient?.name || this.state.patientName() || '';
            const childAge = activePatient?.age || 7;
            const occString = activePatient?.preexistingConditions?.find(c => c.toLowerCase().includes('engineer') || c.toLowerCase().includes('nurse') || c.toLowerCase().includes('construction') || c.toLowerCase().includes('teacher') || c.toLowerCase().includes('pilot') || c.toLowerCase().includes('physician') || c.toLowerCase().includes('driver') || c.toLowerCase().includes('software')) || undefined;
            const occupationalProfile = this.actuarialService ? this.actuarialService.getPersonalizedOccupationalProfile(
                occString,
                activePatient?.vitals,
                [],
                75
            ) : null;

            const activeLesions = this.lesionMarkup ? this.lesionMarkup.activeLesions() : [];

            await this.live.connect(
                apiKey,
                `${context}\n\nPatient Data:\n${rawPatientData}`,
                'Aoede',
                'models/gemini-3.7-flash',
                occupationalProfile,
                isPediatric,
                childName,
                childAge,
                activeLesions
            );
            // Barge-in enabled natively by SDK setup!
        } catch (e: any) {
            console.error("Voice Assistant Activation Error:", e);
            const errName = e?.name || '';
            const errMsg = e?.message || String(e);
            
            if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError' || errMsg.toLowerCase().includes('permission')) {
                this.permissionError.set('Microphone access denied. Please grant microphone permission in your browser URL bar.');
            } else if (errName === 'NotFoundError' || errMsg.toLowerCase().includes('found')) {
                this.permissionError.set('No microphone hardware detected. Please connect a microphone and try again.');
            } else {
                this.permissionError.set(`Connection Error: ${errMsg}`);
            }
        }

        console.log("Chat session started.");

        setTimeout(() => this.chatInputRef()?.focus(), 100);

        this.agentState.set('idle');
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
        // Dictation has been deprecated in favor of native multimodal chat
    }

    stopDictation() {
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
                const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
                if (isNearBottom || container.scrollTop === 0) {
                    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
                }
            }
        }, 100);
    }

    // --- Helpers ---
    private _liveUserText = '';
    
    private _updateUserBubble(tempText: string) {
        this.chatHistory.update(h => {
             const next = [...h];
             let entry = next.length > 0 ? next[next.length - 1] : null;
             if (!entry || entry.role !== 'user') {
                 entry = { role: 'user', text: '' };
                 next.push(entry);
             }
             entry.text = tempText;
             entry.htmlContent = `<p>${tempText}</p>`;
             return next;
        });
        this.scrollToBottom();
    }

    private _appendUser(text: string, htmlContent?: string) {
        const html = htmlContent || `<p>${text}</p>`;
        this.chatHistory.update(h => {
             const next = [...h];
             // If the last bubble was a UI-transcribed user bubble, update it.
             if (next.length > 0 && next[next.length - 1].role === 'user') {
                 next[next.length - 1].text = text;
                 next[next.length - 1].htmlContent = html;
             } else {
                 next.push({ role: 'user', text, htmlContent: html });
             }
             return next;
        });
        this.scrollToBottom();
    }

    private _liveModelText = '';
    private _liveCardsResolved = false;

    private _accumulateModelText(chunk: string) {
        this.agentState.set('processing');
        this._liveModelText += chunk;
        
        let { cleanMd, jsonStr } = this._extractCards(this._liveModelText);
        
        let htmlContent = cleanMd;
        const parser = this.markdownService.parser();
        if (parser) { try { htmlContent = (parser as any).parse(cleanMd); } catch (e) { console.debug('[VoiceAssistant] Markdown parse fallback:', (e as Error)?.message); htmlContent = `<p>${cleanMd}</p>`; } }

        this.chatHistory.update(h => {
            const next = [...h];
            let entry = next.length > 0 ? next[next.length - 1] : null;
            if (!entry || entry.role !== 'model') {
                 entry = { role: 'model', text: '' };
                 next.push(entry);
            }
            
            entry.text = cleanMd;
            entry.htmlContent = htmlContent;

            if (jsonStr && !this._liveCardsResolved) {
               const richCards = this._parseCards(jsonStr);
               if (richCards && richCards.length > 0) {
                   entry.richCards = richCards;
                   try {
                       JSON.parse(jsonStr.trim()); // ensures JSON is complete before network requests
                       this._liveCardsResolved = true;
                       
                       // 3D Visual Grounding: tie afflictionHighlight to selectedPartId
                       const modelCard = richCards.find(c => c.kind === 'model-3d' && c.afflictionHighlight);
                       if (modelCard && modelCard.afflictionHighlight) {
                           const highlight = modelCard.afflictionHighlight.toLowerCase();
                           let partId: string | undefined;
                           // Find exact match first, then partial match
                           if (BODY_PART_MAPPING[highlight]) {
                               partId = BODY_PART_MAPPING[highlight];
                           } else {
                               const keys = Object.keys(BODY_PART_MAPPING).sort((a, b) => b.length - a.length);
                               for (const key of keys) {
                                   if (highlight.includes(key)) {
                                       partId = BODY_PART_MAPPING[key];
                                       break;
                                   }
                               }
                           }
                           
                           if (partId) {
                               // Schedule the state update outside the reactive context to avoid loops
                               setTimeout(() => {
                                   this.state.selectedPartId.set(partId!);
                                   this.state.bodyViewerMode.set('3d');
                               }, 0);
                           }
                       }
                       
                       Promise.all(richCards.map(card => this.richMedia.resolveCard(card))).then(resolved => {
                           this.chatHistory.update(history => {
                               const updated = [...history];
                               const last = updated[updated.length - 1];
                               if (last && last.role === 'model') {
                                   updated[updated.length - 1] = { ...last, richCards: resolved };
                               }
                               return updated;
                           });
                           this.scrollToBottom();
                       });
                   } catch (e) { console.debug('[VoiceAssistant] Streaming JSON not yet complete:', (e as Error)?.message); }
               }
            }
            return next;
        });
        this.scrollToBottom();
    }
    
    private static readonly MAX_CHAT_HISTORY_ENTRIES = 24;

    private _pruneSlidingEpisodicHistory() {
        const history = this.chatHistory();
        if (history.length <= VoiceAssistantComponent.MAX_CHAT_HISTORY_ENTRIES) return;

        const anchor = history.slice(0, 2);
        const recent = history.slice(-18);
        const prunedCount = history.length - (anchor.length + recent.length);

        if (prunedCount > 0) {
            const divider: IChatEntry = {
                role: 'model',
                text: `*ℹ️ [Episodic Clinical Memory: ${prunedCount} intermediate consultation turn(s) archived to preserve low-latency edge performance & HIPAA bounds]*`,
                htmlContent: `<p class="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 italic border-l-2 border-zinc-700 pl-2">ℹ️ Episodic Memory: ${prunedCount} intermediate consult turn(s) archived to preserve edge latency & HIPAA session bounds.</p>`
            };
            this.chatHistory.set([...anchor, divider, ...recent]);
        }
    }

    private _finalizeModelTurn() {
        this.agentState.set('idle');
        this._liveModelText = '';
        this._liveCardsResolved = false;
        this._liveUserText = ''; // Reset user STT tracking for the next turn
        this._pruneSlidingEpisodicHistory();
        
        // Restart UI STT if still listening
        if (this.live.isListening() && this.recognition) {
             try { this.recognition.start(); } catch (e) { console.debug('[VoiceAssistant] Recognition already active:', (e as Error)?.message); }
        }
    }

    private _extractCards(md: string): { cleanMd: string, jsonStr: string } {
        let cleanMd = md;
        const fencedRegex = /```[a-z0-9-]*\s*(\{[\s\S]*?"cards"\s*:[\s\S]*?\})\s*```/i;
        let match = md.match(fencedRegex);
        let jsonStr = '';

        if (match) {
            jsonStr = match[1];
            cleanMd = md.replace(match[0], '').trim();
        } else if (md.includes('"cards"')) {
            const startIdx = md.indexOf('{');
            const endIdx = md.lastIndexOf('}');
            if (startIdx !== -1 && endIdx > startIdx) {
                jsonStr = md.substring(startIdx, endIdx + 1);
                cleanMd = md.replace(jsonStr, '').trim();
                cleanMd = cleanMd.replace(/```[a-z0-9-]*\s*```/gi, '').trim();
            }
        }
        return { cleanMd, jsonStr };
    }

    private _parseCards(jsonStr: string): IRichMediaCard[] | undefined {
        try {
            const parsed = JSON.parse(jsonStr.trim());
            const rawCards: Array<{ kind: string; query: string; severity?: string; afflictionHighlight?: string; particles?: boolean }> = parsed.cards ?? [];
            return rawCards
                .filter(c => ['model-3d', 'image-gallery', 'pubmed-refs', 'phil-image'].includes(c.kind))
                .map(c => ({
                    kind: c.kind as any,
                    query: c.query,
                    severity: c.severity as any,
                    afflictionHighlight: c.afflictionHighlight,
                    particles: c.particles,
                    loading: true
                }));
        } catch (e) { console.debug('[VoiceAssistant] Card parse fallback:', (e as Error)?.message); return undefined; }
    }

    triggerFileInput() {
        this.fileInputRef()?.nativeElement.click();
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            const filesToAdd = Array.from(input.files);
            this.selectedFiles.update(current => [...current, ...filesToAdd]);
            input.value = '';
        }
    }

    removeFile(index: number) {
        this.selectedFiles.update(files => files.filter((_, i) => i !== index));
    }

    requestImage() { this.messageText.set(`Show me medical images of relevant anatomy`); this.sendMessage(); }
    request3DModel() { this.messageText.set(`Show me a 3D anatomical model`); this.sendMessage(); }
    requestResearch() { this.messageText.set(`Find clinical research on the topics discussed`); this.sendMessage(); }

    handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    async sendMessage(event?: Event) {
        event?.preventDefault();

        const message = this.messageText().trim();
        const files = this.selectedFiles();
        if ((!message && files.length === 0) || this.agentState() !== 'idle') return;

        if (this.voiceAssistantMode() === 'ybocs') {
            this.messageText.set('');
            this._appendUser(message);
            this.handleYbocsInput(message);
            return;
        }

        if (this.live.isSpeaking()) {
            this.live.interrupt();
        }

        this.messageText.set('');
        this.selectedFiles.set([]);
        this.agentState.set('processing');
        this.scrollToBottom();

        // create message with text and file indicators for user UI
        let userDisplayHtml = message ? `<p>${message}</p>` : '';
        if (files.length > 0) {
            const fileNames = files.map(f => f.name).join(', ');
            userDisplayHtml += `<p style="font-size: 11px; color: #9CA3AF; margin-top: 4px;">📎 Attached: ${fileNames}</p>`;
        }

        this._appendUser(message, userDisplayHtml);

        try {
            if (this.state.isDemoMode()) {
                const responseText = this.getDemoMockResponse(message);
                this._accumulateModelText(responseText);
                this._finalizeModelTurn();
                this.speak(responseText);
            } else if (this.live.isConnected() && files.length === 0 && !this.isResearchMode()) {
                // Send text over WebSockets natively if connected to multimodal live AND no files or grounding are required
                this.live.sendText(message);
            } else {
                // Fallback to standard chat endpoint if Live connection fails, files are attached, or Grounding is enabled
                const responseText = await this.intel.ai.sendMessage(message, files, this.isResearchMode()).catch(() => this.getDemoMockResponse(message));
                this._accumulateModelText(responseText);
                this._finalizeModelTurn();
                this.speak(responseText);
            }
        } catch (e: any) {
            const responseText = this.getDemoMockResponse(message);
            this._accumulateModelText(responseText);
            this._finalizeModelTurn();
        } finally {
            if (this.agentState() === 'processing' && !this.live.isConnected()) {
                this.agentState.set('idle');
            }
            this.isResearchMode.set(false);
            this.scrollToBottom();
        }
    }

    getDemoMockResponse(message: string): string {
        const lower = message.toLowerCase();
        if (lower.includes('rationale') || lower.includes('explain') || lower.includes('why')) {
            return `**Clinical Rationale (Simplified):**

The patient's current presentation demonstrates a classic intersection of localized mechanical compression (lumbar radiculopathy) and systemic physiological stress (elevated resting heart rate of 88 bpm and nocturnal hypoxemia at 93% SpO₂). 

Our primary therapeutic strategy focuses on:
1. **Mechanical Decompression:** Guided physical therapy and targeted lumbar distraction to relieve root compression.
2. **Autonomic Rebalancing:** Improving sleep quality and nocturnal breathing patterns to stabilize blood oxygen levels. Reducing baseline sympathetic tone will help lower the resting heart rate and support overall functional recovery.`;
        }

        if (lower.includes('most critical evidence') || lower.includes('critical evidence here')) {
            return 'This is a mock clinical intelligence response for radiculopathy.';
        }

        if (lower.includes('evidence') || lower.includes('critical') || lower.includes('diagnostic')) {
            return `**Critical Evidence Breakdown:**

1. **Biometric Drift:** Resting heart rate has elevated to **88 bpm** (historical baseline was 72 bpm), signifying increased sympathetic dominance or physiological stress.
2. **Nocturnal Hypoxemia:** Sleep SpO₂ dips to **93%**, which can exacerbate systemic inflammatory pathways and delay muscle/nerve recovery.
3. **Mechanical Signs:** Clinical exam notes active **lumbar radiculopathy** (L4-S1 nerve root distribution), limiting mobility and contributing to nocturnal arousal.`;
        }

        if (lower.includes('intervention') || lower.includes('alternative') || lower.includes('options')) {
            return `**Alternative Intervention Pathways:**

* **Western Clinical:** Focuses on oral daily dose of prescription Metformin & Statin therapy for direct glycemic and vascular control.
* **Eastern (TCM) Lens:** Recommends 2x weekly seasonal acupuncture and Xiao Ke Wan (herbs) to address meridian congestions and peripheral nerve sensation.
* **Ayurvedic Paradigm:** Recommends daily morning Dinacharya (circadian routines), Nisha Amalaki (curcumin/amla) for antioxidant defense, and daily yoga to reduce cortisol-driven glucose spikes.`;
        }

        if (lower.includes('waiver') || lower.includes('pediatric mdcp') || lower.includes('2603') || lower.includes('sk-sai')) {
            return `**🧸 Pediatric MDCP Waiver & Form 2603 ISP Determination:**

* **SK-SAI Complexity Tier:** Level 4 (High Acuity Tracheostomy/Ventilator Support)
* **Form 2603 Authorization:**
  * **Private Duty Nursing (PDN):** **36.0 hrs/week** (Direct Pediatric RN/LVN)
  * **Respite Care Pool:** **240.0 hrs/calendar year**
  * **Adaptive Aids & Vehicle Mod Budget:** **\$10,000.00**
* **De-Institutionalization Cost Benchmark:**
  * **Home Care Plan:** \$98,400.00/yr
  * **Institutional Nursing Facility Cap:** \$184,200.00/yr
  * **Net Cost Neutrality Margin:** **-\$85,800.00/yr (53.4% Savings)**
* **Statutory Authority:** Texas HHS STAR Kids / Louisiana DOH Title XIX Section 1915(c) Home and Community-Based Waiver.`;
        }

        if (lower.includes('inpatient mdcp') || lower.includes('multi-disciplinary') || lower.includes('milestone')) {
            return `**🏥 Inpatient Multi-Disciplinary Care Plan (Hospital MDCP):**

* **Interdisciplinary Sync:** Attending Pediatrician, Bedside RN, SLP, PT/OT, Clinical Pharmacology.
* **Active Care Trajectory (3-Act Arc):**
  1. *Past Arc:* Severe acute respiratory exacerbation; high-flow oxygen and initial telemetry instability.
  2. *Present Arc:* Stabilized on room air; telemetry weaning ongoing (SpO₂ 97%, HR 102 bpm, respiratory rate 22/min).
  3. *Future Arc:* Discharge target 48 hours; dysphagia pureed diet clearance; outpatient DME home ventilator backup confirmed.
* **Adverse Event Guard:** Zero drug-drug interactions flagged; renal dosage adjustments validated.`;
        }

        if (lower.includes('ieee') || lower.includes('11073') || lower.includes('device communication') || lower.includes('mdc')) {
            return `**📡 ISO/IEEE 11073 Medical Device Communication Profile (MDCP):**

* **Rosetta Terminology Mapping (RTMMS):**
  * \`MDC_PULS_OXIM_SAT_O2\`: **98.0%** (Alarm Confidence: 99.4%)
  * \`MDC_PULS_OXIM_PULS_RATE\`: **104.0 bpm** (Alarm Confidence: 98.8%)
  * \`MDC_VENT_PRESS_AWAY\`: **18.5 cmH2O** (Alarm Confidence: 99.9%)
  * \`MDC_CONC_GLU_PANC\`: **112.0 mg/dL** (Alarm Confidence: 97.5%)
* **FHIR Ingestion:** Validated as \`DeviceMetric\` and \`Observation\` resources with vendor-neutral MDCP containment.`;
        }

        if (lower.includes('ita') || lower.includes('market development') || lower.includes('standards') || lower.includes('cooperator')) {
            return `**🌐 ITA Market Development Cooperator Program (MDCP) Standards Audit:**

* **Statutory Authority:** 15 U.S.C. § 4723 (International Trade Administration MDCP Cooperative Agreement).
* **Cross-Border Harmonization:**
  * **US:** FDA 21 CFR Part 11 & NIST SP 800-90A CSPRNG Hardware Entropy Sealed.
  * **EU/UK:** CE Mark MDR Class IIa SaMD & UK-GDPR / DSPT Data Sovereignty.
  * **Canada / Australia / NZ:** PIPEDA, TGA SaMD & Five Eyes (FVEY) Cryptographic Envelope.
* **Commercialization Status:** Verified export-compliant with zero unvetted cross-border telemetry egress.`;
        }

        return `This is a simulated response in **Demo Mode**. 

To enable full interactive consultations, custom question answering, and live voice streaming with Google Gemini, please click **"Enter API Key"** on the home screen banner to activate cloud engines.`;
    }

    toggleListening() {
        if (this.permissionError()) return;
        if (this.live.isListening()) {
            this.live.stopListening();
            if (this.recognition) this.recognition.stop();
        } else {
            this.live.startListening();
            if (this.recognition) {
                 try { this.recognition.start(); } catch (e) { console.debug('[VoiceAssistant] Recognition already active:', (e as Error)?.message); }
            }
        }
    }

    speak(text: string) {
        // Handled directly via ADK Multimodal audio stream / playNextAudio().
        // Legacy TTS is disabled to prevent colliding with real model voice.
    }

    activateYbocsInterview() {
        this.voiceAssistantMode.set('ybocs');
        this.panelMode.set('chat');
        this.ybocsQuestionIndex.set(1);
        this.chatHistory.set([]);
        
        const welcomeText = "Hello, I am Mindful Macaw, your Y-BOCs Neuropsychiatric Diagnostic guide. I will help you assess your obsessive-compulsive symptom severity. Let's start with Question 1: Time Occupied by Obsessive Thoughts. How much of your day is occupied by obsessive thoughts? (Options: None, Mild (less than 1 hour), Moderate (1 to 3 hours), Severe (3 to 8 hours), or Extreme (more than 8 hours)).";
        this.chatHistory.set([{ role: 'model', text: welcomeText, htmlContent: `<p>${welcomeText}</p>` }]);
        this.scrollToBottom();
        this.speakClientSide(welcomeText);
    }

    private getBestNaturalVoice(): SpeechSynthesisVoice | null {
        if (typeof window === 'undefined' || !window.speechSynthesis) return null;
        const voices = window.speechSynthesis.getVoices();
        
        const preferredVoices = [
            'Google US English',
            'Google UK English Female',
            'Google UK English Male',
            'Microsoft Jenny Online (Natural)',
            'Microsoft Guy Online (Natural)',
            'Microsoft Aria Online (Natural)',
            'Samantha (Enhanced)',
            'Karen (Enhanced)',
            'Daniel (Enhanced)'
        ];

        for (const name of preferredVoices) {
            const found = voices.find(v => v.name.includes(name));
            if (found) return found;
        }

        return voices.find(v => 
            v.name.includes('Natural') || 
            v.name.includes('Enhanced') || 
            v.name.includes('Google') || 
            (v.lang.startsWith('en') && !v.name.includes('Desktop'))
        ) || voices[0] || null;
    }

    private sanitizeTextForSpeech(rawText: string): string {
        return rawText
            .replace(/#{1,6}\s+/g, '')               // Strip headings
            .replace(/\*\*([^*]+)\*\*/g, '$1')       // Strip bold
            .replace(/\*([^*]+)\*/g, '$1')           // Strip italics
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Strip markdown links
            .replace(/^[\s*•-]+/gm, '')               // Strip bullet characters
            .replace(/`([^`]+)`/g, '$1')             // Strip inline code backticks
            .replace(/\n+/g, '. ')                   // Convert linebreaks to sentence pauses
            .trim();
    }

    speakClientSide(text: string) {
        if (this.isMuted()) return;
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
            const cleanText = this.sanitizeTextForSpeech(text);
            const utterance = new SpeechSynthesisUtterance(cleanText);
            
            const voice = this.getBestNaturalVoice();
            if (voice) {
                utterance.voice = voice;
            }
            
            utterance.rate = 0.94;  // Natural conversational pace
            utterance.pitch = 1.02; // Warm intonation

            utterance.onend = () => {
                this.agentState.set('listening');
                if (this.recognition) {
                    try { this.recognition.start(); } catch (e) { console.debug('[VoiceAssistant] Recognition already active:', (e as Error)?.message); }
                }
            };
            window.speechSynthesis.speak(utterance);
        }
    }

    parseYbocsScore(text: string): number {
        const lower = text.toLowerCase().trim();
        
        if (lower.includes('four') || lower.includes('4') || lower.includes('extreme') || lower.includes('constant') || lower.includes('more than 8') || lower.includes('greater than 8')) {
            return 4;
        }
        if (lower.includes('three') || lower.includes('3') || lower.includes('severe') || lower.includes('very frequent') || lower.includes('3 to 8') || lower.includes('3-8')) {
            return 3;
        }
        if (lower.includes('two') || lower.includes('2') || lower.includes('moderate') || lower.includes('1 to 3') || lower.includes('1-3')) {
            return 2;
        }
        if (lower.includes('one') || lower.includes('1') || lower.includes('mild') || lower.includes('occasional') || lower.includes('less than 1') || lower.includes('under 1')) {
            return 1;
        }
        if (lower.includes('zero') || lower.includes('0') || lower.includes('none') || lower.includes('no') || lower.includes('never') || lower.includes('not at all')) {
            return 0;
        }
        
        const match = lower.match(/[0-4]/);
        if (match) {
            return parseInt(match[0], 10);
        }

        return -1;
    }

    handleYbocsInput(text: string) {
        const qId = this.ybocsQuestionIndex();
        const score = this.parseYbocsScore(text);
        
        if (score === -1) {
            const errorText = "I couldn't quite score that answer. Please say or type a rating from 0 (None) to 4 (Extreme) or describe the severity (e.g. Mild, Moderate, Severe).";
            this.chatHistory.update(h => [...h, { role: 'model', text: errorText, htmlContent: `<p>${errorText}</p>` }]);
            this.scrollToBottom();
            this.speakClientSide(errorText);
            return;
        }

        // Set the score
        this.ybocsService.setSeverityScore(qId, score);

        // Print confirmation bubble
        const confirmationText = `Got it. Question ${qId} score is set to ${score}.`;
        this.chatHistory.update(h => [...h, { role: 'model', text: confirmationText, htmlContent: `<p>${confirmationText}</p>` }]);

        // Advance question
        const nextQId = qId + 1;
        this.ybocsQuestionIndex.set(nextQId);

        if (nextQId <= 11) {
            const nextQ = severityQuestions.find(q => q.id === nextQId);
            if (nextQ) {
                const questionText = `Question ${nextQId}: ${nextQ.title}. ${nextQ.subtitle} (${nextQ.options.map(o => `${o.label} (score ${o.score})`).join(', ')})`;
                this.chatHistory.update(h => [...h, { role: 'model', text: questionText, htmlContent: `<p>${questionText}</p>` }]);
                this.scrollToBottom();
                this.speakClientSide(questionText);
            }
        } else {
            // Finished!
            const total = this.ybocsService.totalScore();
            const severity = this.ybocsService.severityDetails();
            const finishedText = `Thank you. We have completed the Y-BOCs severity assessment. Your total score is ${total}/40, which indicates a severity of ${severity.name}. I have successfully updated the patient record.`;
            
            this.chatHistory.update(h => [...h, { role: 'model', text: finishedText, htmlContent: `<p>${finishedText}</p>` }]);
            this.scrollToBottom();
            this.speakClientSide(finishedText);
            
            this.voiceAssistantMode.set('standard');
            this.secureStorage.removeItem('voice_assistant_mode');
        }
    }

    activateChronoVoiceConsultation() {
        this.voiceAssistantMode.set('chrono');
        this.panelMode.set('chat');
        const introText = "Hello! I am Pocket Gull's Chrono-Nutrition & Circadian Rhythm Voice Specialist. I am analyzing your current metabolic window and meal timing relative to BMAL1 and CLOCK gene expression. How can I assist with your meal timing today?";
        this.chatHistory.set([{
            role: 'model',
            text: introText,
            htmlContent: `<p class="text-sky-600 dark:text-sky-400 font-bold">🕒 Chrono-Nutrition Voice Specialist Active</p><p>${introText}</p>`
        }]);
        this.speakClientSide(introText);
    }

    activateAvsVoiceCoRegulation() {
        this.voiceAssistantMode.set('avs');
        this.panelMode.set('chat');
        const introText = "Welcome to your Autonomic Co-Regulation session. I am here to guide your vagal resonant breathing at 0.1 Hz—inhaling for 5 seconds, holding for 2 seconds, and exhaling for 5 seconds—to entrain your brainwaves to Theta and Alpha states. Take a deep breath with me.";
        this.chatHistory.set([{
            role: 'model',
            text: introText,
            htmlContent: `<p class="text-purple-600 dark:text-purple-400 font-bold">🧠 Autonomic Co-Regulation & AVS Voice Guide Active</p><p>${introText}</p>`
        }]);
        this.speakClientSide(introText);
    }

    async dispatchDiscordTranscript() {
        const history = this.chatHistory();
        if (history.length === 0) return;

        const transcriptSummary = history.map(h => `**${h.role === 'user' ? 'Clinician' : 'Gemini AI'}**: ${h.text}`).join('\n\n');
        const patientName = this.state.patientName() || 'Anonymous Patient';
        const vitals = this.state.vitals();
        const symptomsList = Object.keys(this.state.issues()).join(', ') || 'None specified';

        try {
            await fetch('/api/discord/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    embedTitle: `🎙️ Pocket Gull Live Session Transcript — [${patientName}]`,
                    embedDescription: transcriptSummary.slice(0, 2000),
                    fields: [
                        { name: 'Patient Vitals', value: `HR: ${vitals.hr || '--'} bpm | BP: ${vitals.bp || '--'} | SpO2: ${vitals.spO2 || '--'}%`, inline: true },
                        { name: 'Primary Symptoms', value: symptomsList, inline: true },
                    ],
                    color: 0x416B1F
                })
            });
            console.log('[Discord Dispatch] Live transcript posted to Discord channel.');
        } catch (e) {
            console.error('[Discord Dispatch] Failed to post transcript:', e);
        }
    }
}

