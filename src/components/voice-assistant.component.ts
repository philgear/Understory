import { Component, ChangeDetectionStrategy, inject, signal, computed, viewChild, ElementRef, OnDestroy, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientStateService } from '../services/patient-state.service';
import { ClinicalIntelligenceService } from '../services/clinical-intelligence.service';
import { DictationService } from '../services/dictation.service';
import { PatientManagementService } from '../services/patient-management.service';
import { SafeHtmlPipe } from '../pipes/safe-html.pipe';
import { PocketGullButtonComponent } from './shared/pocket-gull-button.component';
import { PocketGullInputComponent } from './shared/pocket-gull-input.component';
import { MarkdownService } from '../services/markdown.service';
import { RichMediaService, RichMediaCard } from '../services/rich-media.service';
import { Medical3DViewerComponent } from './medical-3d-viewer.component';
import { ClinicalIcons } from '../assets/clinical-icons';

export interface ChatEntry {
    role: 'user' | 'model';
    text: string;
    htmlContent?: string;
    richCards?: RichMediaCard[];
}

@Component({
    selector: 'app-voice-assistant',
    imports: [CommonModule, FormsModule, PocketGullButtonComponent, PocketGullInputComponent, SafeHtmlPipe, Medical3DViewerComponent],
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
                        <span class="font-medium text-[#1C1C1C] tracking-[0.1em] sm:tracking-[0.15em] text-[10px] sm:text-sm uppercase truncate">Pocket Gull Intelligence</span>
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
                            


                            <!-- Regular Transcript -->
                            @for (entry of parsedTranscript(); track $index) {
                                <div class="group flex gap-[7px] items-start w-full animate-in fade-in slide-in-from-bottom-2 duration-300" [class.flex-row-reverse]="entry.role === 'user'">
                                    @if (entry.role === 'model') {
                                        <div class="shrink-0 w-[20px] h-[20px] rounded-full bg-[#1C1C1C] text-white flex items-center justify-center mt-[1px]">
                                            <svg viewBox="0 -960 960 960" fill="currentColor" width="11" height="11"><path d="M480-80q-139-35-229.5-159.5T160-516v-244l320-120 320 120v244q0 152-90.5 276.5T480-80Z"/></svg>
                                        </div>
                                    }
                                     @if (entry.role === 'model') {
                                         <div class="flex flex-col gap-2 w-full min-w-0 max-w-[calc(100%-30px)]">
                                             <!-- Model Bubble -->
                                             <div class="text-[14px] font-light tracking-wide leading-relaxed text-[#F9FAFB] bg-[#262626] border border-[#404040] rounded-[8px_8px_8px_2px] px-[16px] py-[12px] w-full break-words [&_p]:mb-3 [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:pl-5 [&_ol]:mb-3 [&_li]:mb-1 [&_strong]:font-medium [&_strong]:text-[#FFFFFF] [&_h2]:text-[10px] [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-widest [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-[#9CA3AF] [&_h3]:text-[10px] [&_h3]:font-bold [&_h3]:uppercase [&_h3]:tracking-widest [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-[#9CA3AF] [&_h4]:text-[10px] [&_h4]:font-bold [&_h4]:uppercase [&_h4]:tracking-widest [&_h4]:mt-4 [&_h4]:mb-2 [&_h4]:text-[#9CA3AF]" [innerHTML]="entry.htmlContent | safeHtml"></div>
                                             
                                             <!-- ─── Rich Media Cards ──────────────────────── -->
                                            @if (entry.richCards && entry.richCards.length > 0) {
                                                <div class="rm-panel">
                                                    @for (card of entry.richCards; track card.query) {

                                                        <!-- 3D Model -->
                                                        @if (card.kind === 'model-3d' && card.models?.length) {
                                                            <div class="rm-card rm-card--model">
                                                                <div class="rm-card-header">
                                                                    <svg viewBox="0 -960 960 960" fill="currentColor" width="12" height="12"><path d="M440-183v-274L200-596v274l240 139Zm80 0 240-139v-274L520-457v274Zm-40-343 237-137-237-137-237 137 237 137ZM160-252q-19-11-29.5-29T120-321v-318q0-22 10.5-40t29.5-29l280-161q19-11 40-11t40 11l280 161q19 11 29.5 29t10.5 40v318q0 22-10.5 40T800-252L520-91q-19 11-40 11t-40-11L160-252Z"/></svg>
                                                                    <span class="rm-card-title">{{ card.models[0].name }}</span>
                                                                    <span class="rm-card-badge">3D Model</span>
                                                                </div>
                                                                <div class="rm-model-frame-wrap">
                                                                    @defer (on viewport; prefetch on idle) {
                                                                        <app-medical-3d-viewer 
                                                                            [threejsId]="card.models[0].threejsId"
                                                                            [severity]="card.severity"
                                                                            [afflictionHighlight]="card.afflictionHighlight"
                                                                            [particles]="card.particles"
                                                                            class="rm-model-frame">
                                                                        </app-medical-3d-viewer>
                                                                    } @placeholder {
                                                                        <div class="h-[200px] w-full flex items-center justify-center bg-[#FDFDFD] border border-[#EEEEEE] rounded-sm">
                                                                            <div class="w-6 h-6 rounded-sm border-2 border-gray-300 border-t-black animate-spin"></div>
                                                                        </div>
                                                                    }
                                                                </div>
                                                                <div class="rm-card-footer">Interactive Volume · Procedural Generation</div>
                                                            </div>
                                                        }

                                                        <!-- Image Gallery -->
                                                        @if (card.kind === 'image-gallery') {
                                                            <div class="rm-card rm-card--gallery">
                                                                <div class="rm-card-header">
                                                                    <svg viewBox="0 -960 960 960" fill="currentColor" width="12" height="12"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-800v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm40-80h480L570-480 450-320l-90-120-120 160Z"/></svg>
                                                                    <span class="rm-card-title">Medical Illustrations: {{ card.query }}</span>
                                                                    <span class="rm-card-badge">Wikimedia</span>
                                                                </div>
                                                                @if (card.loading) {
                                                                    <div class="rm-loading">Searching Wikimedia Commons…</div>
                                                                } @else if (card.images?.length) {
                                                                    <div class="rm-gallery-strip">
                                                                        @for (img of card.images; track img.url) {
                                                                            <a [href]="img.descriptionUrl" target="_blank" rel="noopener" class="rm-gallery-item block">
                                                                                <img [src]="img.thumbUrl" [alt]="img.title" class="rm-gallery-img" loading="lazy">
                                                                                <span class="rm-gallery-caption">{{ img.title | slice:0:40 }}</span>
                                                                            </a>
                                                                        }
                                                                    </div>
                                                                } @else {
                                                                    <div class="rm-empty">No illustrations found for "{{ card.query }}"</div>
                                                                }
                                                                <div class="rm-card-footer">Public domain · <a [href]="'https://commons.wikimedia.org/w/index.php?search=' + card.query + '&title=Special:MediaSearch&go=Go&type=image'" target="_blank" rel="noopener" class="hover:underline hover:text-purple-600 transition-colors">Wikimedia Commons</a></div>
                                                            </div>
                                                        }

                                                        <!-- PubMed Citations -->
                                                        @if (card.kind === 'pubmed-refs') {
                                                            <div class="rm-card rm-card--pubmed">
                                                                <div class="rm-card-header">
                                                                    <svg viewBox="0 -960 960 960" fill="currentColor" width="12" height="12"><path d="M320-240h320v-80H320v80Zm0-160h320v-80H320v80ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z"/></svg>
                                                                    <span class="rm-card-title">Research: {{ card.query }}</span>
                                                                    <span class="rm-card-badge">PubMed</span>
                                                                </div>
                                                                @if (card.loading) {
                                                                    <div class="rm-loading">Searching PubMed…</div>
                                                                } @else if (card.citations?.length) {
                                                                    <div class="rm-citations">
                                                                        @for (cite of card.citations; track cite.pmid) {
                                                                            <a [href]="cite.url" target="_blank" rel="noopener" class="rm-citation block">
                                                                                <div class="rm-citation-title">{{ cite.title }}</div>
                                                                                <div class="rm-citation-meta">{{ cite.authors }} · <em>{{ cite.journal }}</em> · {{ cite.year }}</div>
                                                                                <div class="rm-citation-pmid">PMID {{ cite.pmid }} ↗</div>
                                                                            </a>
                                                                        }
                                                                    </div>
                                                                } @else {
                                                                    <div class="rm-empty">No results found</div>
                                                                }
                                                                <div class="rm-card-footer">NIH National Library of Medicine</div>
                                                            </div>
                                                        }

                                                        <!-- PHIL Image -->
                                                        @if (card.kind === 'phil-image' && card.philImages?.length) {
                                                            <div class="rm-card rm-card--phil">
                                                                <div class="rm-card-header">
                                                                    <svg viewBox="0 -960 960 960" fill="currentColor" width="12" height="12"><path d="M480-80q-139-35-229.5-159.5T160-516v-244l320-120 320 120v244q0 152-90.5 276.5T480-80Z"/></svg>
                                                                    <span class="rm-card-title">{{ card.philImages[0].title }}</span>
                                                                    <span class="rm-card-badge">CDC PHIL</span>
                                                                </div>
                                                                <div class="rm-gallery-strip">
                                                                    @for (img of card.philImages; track img.id) {
                                                                        <div class="rm-gallery-item block">
                                                                            <img [src]="img.thumbUrl" [alt]="img.title" class="rm-gallery-img" loading="lazy" (error)="img.thumbUrl = img.url">
                                                                            <span class="rm-gallery-caption">{{ img.credit }}</span>
                                                                        </div>
                                                                    }
                                                                </div>
                                                                <div class="rm-card-footer">Public domain · CDC Public Health Image Library</div>
                                                            </div>
                                                        }
                                                    }
                                                </div>
                                            }

                                            <div class="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <pocket-gull-button variant="ghost" size="xs" (click)="actionCopy(entry.text)" icon="M9 9h13v13H9V9zm-4 6H4v-9h9v1z" ariaLabel="Copy Message">Copy</pocket-gull-button>
                                                <pocket-gull-button variant="ghost" size="xs" (click)="actionDictate(entry.text)" icon="M11 5L6 9H2v6h4l5 4V5zm8.07-.07a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" ariaLabel="Speak Aloud">Speak</pocket-gull-button>
                                                <pocket-gull-button variant="ghost" size="xs" (click)="actionInsert(entry.text)" icon="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" ariaLabel="Insert into Clinical Notes">Insert</pocket-gull-button>
                                            </div>
                                        </div>
                                    } @else {
                                        <div class="flex flex-col gap-2 w-full min-w-0 max-w-[calc(100%-30px)]">
                                            <!-- User Bubble -->
                                            <div class="text-[11.5px] leading-[1.6] text-[#FFFFFF] bg-[#1C1C1C] border border-transparent rounded-[8px_8px_2px_8px] px-[10px] py-[6px] w-full break-words [&_strong]:text-white">
                                                <div [innerHTML]="(entry.htmlContent || entry.text) | safeHtml"></div>
                                            </div>
                                        </div>
                                    }
                                </div>
                            }

                            @if (agentState() === 'processing') {
                                <div class="group flex gap-[7px] items-start w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div class="shrink-0 w-[20px] h-[20px] rounded-full bg-[#1C1C1C] text-white flex items-center justify-center mt-[1px]">
                                        <svg viewBox="0 -960 960 960" fill="currentColor" width="11" height="11"><path d="M480-80q-139-35-229.5-159.5T160-516v-244l320-120 320 120v244q0 152-90.5 276.5T480-80Z"/></svg>
                                    </div>
                                    <div class="flex flex-col gap-2 w-full min-w-0 max-w-[calc(100%-30px)]">
                                        <div class="text-[11.5px] leading-[1.6] text-[#374151] bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px_8px_8px_2px] px-[10px] py-[6px] w-fit break-words">
                                            <div class="flex gap-[3px] items-center py-[2px]">
                                                <span class="inline-block w-[5px] h-[5px] bg-[#9CA3AF] rounded-full animate-[dot-pulse_1.2s_infinite_ease-in-out]"></span>
                                                <span class="inline-block w-[5px] h-[5px] bg-[#9CA3AF] rounded-full animate-[dot-pulse_1.2s_infinite_ease-in-out_0.2s]"></span>
                                                <span class="inline-block w-[5px] h-[5px] bg-[#9CA3AF] rounded-full animate-[dot-pulse_1.2s_infinite_ease-in-out_0.4s]"></span>
                                            </div>
                                        </div>
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
                            
                            @if (selectedFiles().length > 0) {
                                <div class="flex flex-wrap gap-2 mb-1 px-4">
                                    @for (file of selectedFiles(); track file.name) {
                                        <div class="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-100 shadow-sm">
                                            <span class="truncate max-w-[150px]" [title]="file.name">{{ file.name }}</span>
                                            <button type="button" class="mt-0.5 hover:text-red-500 transition-colors focus:outline-none" (click)="removeFile($index)">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                            </button>
                                        </div>
                                    }
                                </div>
                            }

                            <form (submit)="sendMessage($event)" class="w-full flex items-center gap-3 bg-white border border-gray-200 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] rounded-[2rem] p-2 pl-4 focus-within:border-gray-300 focus-within:shadow-[0_10px_40px_-5px_rgba(0,0,0,0.15)] transition-all duration-300 transform-gpu">
                                <button type="button" (click)="toggleListening()" [disabled]="agentState() !== 'idle' || !!permissionError()"
                                        title="Start/Stop Voice Capture"
                                        class="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center hover:bg-gray-50 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0">
                                    <div class="relative flex items-center justify-center">
                                        @if (agentState() === 'listening') {
                                            <span class="absolute inset-0 rounded-sm bg-red-500 animate-ping opacity-25"></span>
                                            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-red-600 relative z-10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                                        } @else {
                                            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                                        }
                                    </div>
                                </button>

                                <button type="button" class="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center hover:bg-gray-50 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0 text-gray-400 hover:text-blue-500" (click)="triggerFileInput()" [disabled]="agentState() !== 'idle'" title="Attach Files">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                                </button>
                                <input type="file" #fileInput (change)="onFileSelected($event)" multiple accept="image/*,video/*" class="hidden" style="display: none;">

                                <div class="flex-1 py-1">
                                    <pocket-gull-input
                                        #chatInput
                                        type="text"
                                        [value]="messageText()"
                                        (valueChange)="messageText.set($event)"
                                        placeholder="Ask Pocket Gull..."
                                        className="!border-transparent !bg-transparent !shadow-none !px-0 !py-2 text-base"
                                        [disabled]="agentState() !== 'idle'"
                                        (keydown)="handleKeydown($event)">
                                    </pocket-gull-input>
                                </div>

                                <button 
                                    type="submit" 
                                    [disabled]="!messageText().trim() || agentState() !== 'idle'"
                                    class="w-10 h-10 sm:w-12 sm:h-12 rounded-sm flex items-center justify-center bg-black text-white disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors shrink-0 shadow-sm mr-1">
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
    richMedia = inject(RichMediaService);

    panelMode = signal<'selection' | 'chat' | 'dictation'>('selection');

    transcriptContainer = viewChild<ElementRef<HTMLDivElement>>('transcriptContainer');
    fileInputRef = viewChild<ElementRef<HTMLInputElement>>('fileInput');
    chatInputRef = viewChild<any>('chatInput');

    // --- Chat State ---
    agentState = signal<'idle' | 'listening' | 'processing' | 'speaking' | 'typing'>('idle');
    isMuted = signal<boolean>(true);
    permissionError = signal<string | null>(null);
    messageText = signal('');
    typingIntroText = signal('');
    chatHistory = signal<ChatEntry[]>([]);
    selectedFiles = signal<File[]>([]);

    protected readonly ClinicalIcons = ClinicalIcons;

    private recognition: any;
    private preferredVoice = signal<SpeechSynthesisVoice | null>(null);

    // Derived signal for UI rendering
    parsedTranscript = computed(() => {
        return this.chatHistory();
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
            if (input && this.agentState() === 'idle') {
                this.messageText.set(input);
                this.state.liveAgentInput.set('');

                untracked(() => {
                    setTimeout(() => this.sendMessage(), 50);
                });
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

        this.chatHistory.set([]);
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
        const context = `You are a collaborative care plan co-pilot named "Cerebella". You are assisting a doctor in refining a strategy for their patient. You have already reviewed the finalized patient overview and the current recommendations. Your role is to help the doctor iterate on the care plan, explore functional protocols, structure follow-ups, or answer specific questions. Keep your answers brief, actionable, and focused on strategic holistic care. Be ready to elaborate when asked.

VISUAL GROUNDING: When the user asks for images, a 3D model, or research (e.g. "show me an image", "3D model of", "find research on"), respond with a \`\`\`rich-media\`\`\` JSON block BEFORE your prose explanation. Format:
\`\`\`rich-media
{ "cards": [{ "kind": "model-3d"|"image-gallery"|"pubmed-refs"|"phil-image", "query": "<anatomical or clinical term>", "severity": "green"|"yellow"|"red", "afflictionHighlight": "<anatomical part>", "particles": true|false }] }
\`\`\`
Only include a rich-media block when the user explicitly requests visual or research content.`;

        await this.intel.ai.startChat(rawPatientData, context);
        console.log("Chat session started.");

        setTimeout(() => this.chatInputRef()?.focus(), 100);

        this.agentState.set('idle');
        const greeting = await this.intel.getInitialGreeting();
        this._appendModel(greeting);
        this.speak(greeting);

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
        }, 100);
    }

    // --- Helpers ---
    private _appendUser(text: string, htmlContent?: string) {
        const html = htmlContent || `<p>${text}</p>`;
        this.chatHistory.update(h => [...h, { role: 'user', text, htmlContent: html }]);
        this.scrollToBottom();
    }

    private _appendModel(md: string) {
        let richCards: RichMediaCard[] | undefined;
        let cleanMd = md;

        const fencedRegex = /```(?:rich-media|json)?\s*(\{[\s\S]*?"cards"\s*:[\s\S]*?\})\s*```/i;
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
            }
        }

        if (jsonStr) {
            try {
                const parsed = JSON.parse(jsonStr.trim());
                const rawCards: Array<{ kind: string; query: string; severity?: string; afflictionHighlight?: string; particles?: boolean }> = parsed.cards ?? [];
                richCards = rawCards
                    .filter(c => ['model-3d', 'image-gallery', 'pubmed-refs', 'phil-image'].includes(c.kind))
                    .map(c => ({
                        kind: c.kind as any,
                        query: c.query,
                        severity: c.severity as any,
                        afflictionHighlight: c.afflictionHighlight,
                        particles: c.particles,
                        loading: true
                    }));
            } catch { /* malformed JSON — ignore block */ }
        }

        let htmlContent = cleanMd;
        const parser = this.markdownService.parser();
        if (parser) { try { htmlContent = (parser as any).parse(cleanMd); } catch { htmlContent = `<p>${cleanMd}</p>`; } }

        const entry: ChatEntry = { role: 'model', text: cleanMd, htmlContent, richCards };
        this.chatHistory.update(h => [...h, entry]);
        this.scrollToBottom();

        if (richCards && richCards.length > 0) {
            Promise.all(richCards.map(card => this.richMedia.resolveCard(card))).then(resolved => {
                this.chatHistory.update(h => {
                    const next = [...h];
                    const last = next[next.length - 1];
                    if (last && last.role === 'model') {
                        next[next.length - 1] = { ...last, richCards: resolved };
                    }
                    return next;
                });
                this.scrollToBottom();
            });
        }
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
                    this.messageText.set(final);
                    await this.sendMessage();
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
        const files = this.selectedFiles();
        if ((!message && files.length === 0) || this.agentState() !== 'idle') return;

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
            const responseText = await this.intel.ai.sendMessage(message, files);
            this._appendModel(responseText);
            this.speak(responseText);
        } catch (e: any) {
            this._appendModel(`Error: ${e?.message ?? e}`);
        } finally {
            if (this.agentState() === 'processing') {
                this.agentState.set('idle');
            }
            this.scrollToBottom();
        }
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
