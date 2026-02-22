import { Component, ChangeDetectionStrategy, inject, computed, ViewEncapsulation, signal, OnDestroy, effect, viewChild, ElementRef, untracked, afterNextRender, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService, TranscriptEntry, AnalysisLens } from '../services/gemini.service';
import { PatientStateService } from '../services/patient-state.service';
import { PatientManagementService, HistoryEntry } from '../services/patient-management.service';
import { marked } from 'marked';
import { DictationService } from '../services/dictation.service';

declare var webkitSpeechRecognition: any;
type AgentState = 'idle' | 'listening' | 'processing' | 'speaking';

export interface CarePlanNodeItem {
  id: string;
  html: string;
  bracketState: 'normal' | 'added' | 'removed';
  note: string;
  showNote: boolean;
  isDictating?: boolean;
}

export interface CarePlanNode {
  id: string;
  type: 'raw' | 'paragraph' | 'list';
  rawHtml?: string;
  ordered?: boolean;
  items?: CarePlanNodeItem[];
  bracketState: 'normal' | 'added' | 'removed';
  note: string;
  showNote: boolean;
  isDictating?: boolean;
}

interface ReportSection {
  raw: string;
  heading: string;
  nodes: CarePlanNode[];
}

interface ParsedTranscriptEntry extends TranscriptEntry {
  htmlContent?: string;
}

@Component({
  selector: 'app-analysis-report',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'class': 'block h-full flex flex-col overflow-hidden relative'
  },
  styles: [`
    /* Premium Inter Typography Styles for Care Plan Content */
    .rams-typography h1 {
      font-family: 'Inter', sans-serif;
      font-size: 1.25rem;
      font-weight: 700;
      color: #111827;
      margin-top: 2.5rem;
      margin-bottom: 1.5rem;
      border-bottom: 2px solid #E5E7EB;
      padding-bottom: 0.75rem;
    }

    .rams-typography h2 {
      font-family: 'Inter', sans-serif;
      font-size: 1.125rem;
      font-weight: 700;
      color: #374151;
      margin-top: 2rem;
      margin-bottom: 1.25rem;
      border-bottom: 1px solid #E5E7EB;
      padding-bottom: 0.5rem;
    }

    .rams-typography h3 {
      font-family: 'Inter', sans-serif;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-weight: 700;
      color: #6B7280;
      margin-top: 2rem;
      margin-bottom: 1rem;
      border-bottom: 1px solid #E5E7EB;
      padding-bottom: 0.5rem;
    }

    .rams-typography h4,
    .rams-typography h5,
    .rams-typography h6 {
      font-family: 'Inter', sans-serif;
      font-size: 0.875rem;
      font-weight: 700;
      color: #1F2937;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
    }
    
    .rams-typography h1:first-child,
    .rams-typography h2:first-child,
    .rams-typography h3:first-child,
    .rams-typography h4:first-child {
      margin-top: 0;
    }

    .rams-typography p,
    .rams-typography li,
    .rams-typography td,
    .rams-typography th {
      font-family: 'Inter', sans-serif;
      font-size: 0.875rem;
      font-weight: 700;
      line-height: 1.5;
      color: #1C1C1C;
    }

    .rams-typography p {
      margin-bottom: 1.25rem;
      padding: 0.25rem 0;
      border-radius: 4px;
      transition: background-color 0.2s ease-in-out;
      cursor: pointer;
    }
    
    .rams-typography p:hover,
    .rams-typography li:hover {
      background-color: #F3F4F6; /* gray-100 */
    }

    .rams-typography strong {
      font-weight: 600;
      color: #111827; /* gray-900 */
    }

    .rams-typography ul {
      list-style: none;
      padding-left: 0;
      margin-bottom: 1.5rem;
    }

    .rams-typography li {
      margin-bottom: 0.5rem;
      padding: 0.25rem 0.25rem 0.25rem 1.5rem;
      position: relative;
      cursor: pointer;
      border-radius: 4px;
      transition: background-color 0.2s ease-in-out;
    }

    .rams-typography li::before {
      content: '';
      width: 5px;
      height: 5px;
      background: #4B5563; /* gray-600 */
      border-radius: 50%;
      position: absolute;
      left: 0.5rem;
      top: 1em;
    }
    
    .rams-typography blockquote {
      border-left: 3px solid #689F38; /* brand green */
      padding: 0.75rem 1.25rem;
      background-color: #F8FAF8;
      font-style: normal;
      font-weight: 500;
      color: #4B5563; /* gray-600 */
      margin: 1.5rem 0;
      border-radius: 0 4px 4px 0;
    }

    .rams-typography table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin: 1.5rem 0;
      border-radius: 8px;
      border: 1px solid #E5E7EB;
      overflow: hidden;
    }

    .rams-typography th {
      background-color: #F9FAFB;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.05em;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #E5E7EB;
      text-align: left;
    }

    .rams-typography td {
      padding: 0.875rem 1rem;
      border-bottom: 1px solid #F3F4F6;
    }

    .rams-typography tr:last-child td {
      border-bottom: none;
    }

    /* Task Bracketing Styles */
    .rams-typography .bracket-removed {
      opacity: 0.4 !important;
      text-decoration: line-through !important;
      background-color: transparent !important;
      border-left: 3px solid transparent !important;
    }
    
    .rams-typography .bracket-added {
      background-color: #E8F5E9 !important;
      border-left: 3px solid #689F38 !important;
    }
    
    /* Ensure padding is consistent despite border addition */
    .rams-typography p.bracket-added,
    .rams-typography p.bracket-removed {
       padding-left: 0.75rem;
    }
    .rams-typography li.bracket-added,
    .rams-typography li.bracket-removed {
       padding-left: 1.75rem;
    }
    
    .rams-typography .bracket-removed,
    .rams-typography .bracket-added {
      transition: all 0.2s ease-in-out;
    }
  `],
  template: `
    <!-- Report Header -->
    <div class="p-8 pb-4 flex justify-between items-end bg-white shrink-0 z-10 border-b border-[#EEEEEE] no-print">
      <div>
        <h2 class="text-sm font-bold text-[#1C1C1C] uppercase tracking-widest">
            Care Plan Recommendation Engine
        </h2>
        <p class="text-xs text-gray-400 mt-1">
            AI-Guided Strategy & Voice Assistant
        </p>
      </div>
      
      @if (!gemini.isLoading()) {
        <div class="flex items-center gap-2">
           @if (state.isLiveAgentActive()) {
              <button (click)="endLiveConsult()" class="group flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 text-xs font-bold uppercase tracking-widest hover:bg-red-50 disabled:opacity-20 transition-colors">
                 <span>Close Assistant</span>
              </button>
            } @else {
               <button (click)="openVoicePanel()" [disabled]="!state.hasIssues() || !hasAnyReport()"
                class="group flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold uppercase tracking-widest hover:bg-[#EEEEEE] hover:border-gray-400 disabled:opacity-20 disabled:hover:bg-transparent transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14q-1.25 0-2.125-.875T9 11V5q0-1.25.875-2.125T12 2q1.25 0 2.125.875T15 5v6q0 1.25-.875 2.125T12 14m-1 7v-3.075q-2.6-.35-4.3-2.325T5 11h2q0 2.075 1.463 3.537T12 16q2.075 0 3.538-1.463T17 11h2q0 2.225-1.7 4.2T13 17.925V21z"/></svg>
                <span>Voice Assistant</span>
              </button>
            }
          <button (click)="generate()" [disabled]="!state.hasIssues()"
            class="group flex items-center gap-2 px-4 py-2 bg-[#1C1C1C] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#558B2F] disabled:opacity-20 disabled:hover:bg-[#1C1C1C] transition-colors">
            @if (hasAnyReport()) { <span>Refresh Recommendations</span> } @else { <span>Generate Care Plan</span> }
            <svg class="w-3 h-3 text-gray-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>
      }
    </div>

    <!-- Analysis Tabs -->
    @if (hasAnyReport()) {
      <div class="px-8 py-3 border-b border-[#EEEEEE] no-print bg-white/50 backdrop-blur-sm">
        <div class="flex items-center gap-1 border-b border-gray-200">
            <button (click)="changeLens('Care Plan Overview')"
                    class="px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors"
                    [class.border-[#1C1C1C]]="activeLens() === 'Care Plan Overview'"
                    [class.text-[#1C1C1C]]="activeLens() === 'Care Plan Overview'"
                    [class.text-gray-500]="activeLens() !== 'Care Plan Overview'"
                    [class.border-transparent]="activeLens() !== 'Care Plan Overview'"
                    [class.hover:bg-gray-100]="activeLens() !== 'Care Plan Overview'">
              Overview
            </button>
            <button (click)="changeLens('Clinical Interventions')"
                    class="px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors"
                    [class.border-[#1C1C1C]]="activeLens() === 'Clinical Interventions'"
                    [class.text-[#1C1C1C]]="activeLens() === 'Clinical Interventions'"
                    [class.text-gray-500]="activeLens() !== 'Clinical Interventions'"
                    [class.border-transparent]="activeLens() !== 'Clinical Interventions'"
                    [class.hover:bg-gray-100]="activeLens() !== 'Clinical Interventions'">
              Interventions
            </button>
            <button (click)="changeLens('Monitoring & Follow-up')"
                    class="px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors"
                    [class.border-[#1C1C1C]]="activeLens() === 'Monitoring & Follow-up'"
                    [class.text-[#1C1C1C]]="activeLens() === 'Monitoring & Follow-up'"
                    [class.text-gray-500]="activeLens() !== 'Monitoring & Follow-up'"
                    [class.border-transparent]="activeLens() !== 'Monitoring & Follow-up'"
                    [class.hover:bg-gray-100]="activeLens() !== 'Monitoring & Follow-up'">
              Monitoring
            </button>
            <button (click)="changeLens('Patient Education')"
                    class="px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors"
                    [class.border-[#1C1C1C]]="activeLens() === 'Patient Education'"
                    [class.text-[#1C1C1C]]="activeLens() === 'Patient Education'"
                    [class.text-gray-500]="activeLens() !== 'Patient Education'"
                    [class.border-transparent]="activeLens() !== 'Patient Education'"
                    [class.hover:bg-gray-100]="activeLens() !== 'Patient Education'">
              Education
            </button>
        </div>
      </div>
    }

    <!-- Content Area -->
    <div #contentArea class="flex-1 overflow-y-auto p-8 min-h-0 relative bg-[#F9FAFB]">
         <!-- Analysis Engine Body -->
         <div class="p-6 min-h-full">
              @if (gemini.isLoading()) {
                <div class="h-64 flex flex-col items-center justify-center opacity-50 no-print">
                  <div class="w-8 h-8 border-2 border-[#EEEEEE] border-t-[#1C1C1C] rounded-full animate-spin mb-4"></div>
                  <p class="text-[10px] font-bold uppercase tracking-widest text-[#1C1C1C]">Processing Comprehensive Analysis</p>
                </div>
              }
              @if (gemini.error() && !hasAnyReport(); as error) {
                <div class="p-4 border border-red-200 bg-red-50 text-red-900 text-xs rounded-lg mb-4">
                  <strong class="block uppercase tracking-wider mb-1">System Error</strong>
                  {{ error }}
                </div>
              }
              
              <!-- AI Report Section -->
              @if (reportSections(); as sections) {
                <div class="rams-typography">
                    @for(section of sections; track $index) {
                      <div class="relative group/section">
                          <div [innerHTML]="section.heading"></div>
                           @if (state.isLiveAgentActive()) {
                              <button (click)="insertSectionIntoChat(section.raw)"
                                      class="absolute -left-8 top-8 opacity-0 group-hover/section:opacity-100 transition-opacity text-gray-300 hover:text-[#689F38]"
                                      title="Insert section into chat">
                                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M10 9h4V6h3l-5-5-5 5h3zm-1 1H6V7l-5 5 5 5v-3h3zm11 3-5 5v-3h-4v3l-5-5 5-5v3h4z"/></svg>
                              </button>
                          }
                          
                          @for(node of section.nodes; track node.id) {
                            @if (node.type === 'raw') {
                              <div [innerHTML]="node.rawHtml" class="mb-4"></div>
                            } @else if (node.type === 'paragraph') {
                              <div class="relative group/node mb-4">
                                <p [innerHTML]="node.rawHtml" 
                                   [class.bracket-removed]="node.bracketState === 'removed'"
                                   [class.bracket-added]="node.bracketState === 'added'"
                                   (dblclick)="toggleNodeBracket(node)"></p>
                                
                                <div class="absolute -left-10 top-0 opacity-0 group-hover/node:opacity-100 transition-opacity flex flex-col gap-1 z-10 no-print">
                                   <button (click)="node.showNote = true" class="w-7 h-7 bg-white rounded-md shadow-sm border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#689F38] hover:bg-gray-50 transition-colors" title="Add Note">
                                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                   </button>
                                </div>

                                @if (node.showNote || node.note) {
                                  <div class="mt-2 relative no-print">
                                    <textarea [value]="node.note" (input)="updateNodeNote(node, $event)" rows="3" class="w-full bg-[#F9FAFB] border border-gray-200 rounded-lg p-3 text-sm text-[#1C1C1C] focus:bg-white focus:border-[#689F38] focus:ring-1 focus:ring-[#689F38] transition-all placeholder-gray-400 resize-none font-sans" placeholder="Add your clinical note here..."></textarea>
                                    <div class="absolute bottom-2 right-2 flex items-center gap-1.5">
                                      <button (click)="copyNote(node.note)" [disabled]="!node.note" class="w-6 h-6 rounded-md flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:text-[#1C1C1C] transition-colors disabled:opacity-50">
                                         <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                      </button>
                                      <button (click)="openNodeDictation(node)" [disabled]="!!dictation.permissionError()"
                                              class="w-6 h-6 rounded-md flex items-center justify-center border transition-all shadow-sm"
                                              [class.bg-red-50]="node.isDictating" [class.border-red-200]="node.isDictating" [class.text-red-600]="node.isDictating" [class.animate-pulse]="node.isDictating"
                                              [class.bg-white]="!node.isDictating" [class.border-gray-200]="!node.isDictating" [class.text-gray-500]="!node.isDictating" [class.hover:bg-gray-50]="!node.isDictating"
                                              title="Dictate Note">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                                      </button>
                                    </div>
                                  </div>
                                }
                              </div>
                            } @else if (node.type === 'list') {
                              <ul [class.list-decimal]="node.ordered" [class.list-disc]="!node.ordered" class="pl-4 mb-6">
                                @for(item of node.items; track item.id) {
                                  <li class="relative group/item mb-2"
                                      [class.bracket-removed]="item.bracketState === 'removed'"
                                      [class.bracket-added]="item.bracketState === 'added'"
                                      (dblclick)="toggleNodeBracket(item)">
                                    <span [innerHTML]="item.html" class="block"></span>

                                    <div class="absolute -left-10 top-0 opacity-0 group-hover/item:opacity-100 transition-opacity flex flex-col gap-1 z-10 no-print">
                                       <button (click)="item.showNote = true" class="w-7 h-7 bg-white rounded-md shadow-sm border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#689F38] hover:bg-gray-50 transition-colors" title="Add Note">
                                          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                       </button>
                                    </div>

                                    @if (item.showNote || item.note) {
                                      <div class="mt-2 mb-4 relative ml-2 no-print">
                                        <textarea [value]="item.note" (input)="updateNodeNote(item, $event)" rows="2" class="w-full bg-[#F9FAFB] border border-gray-200 rounded-lg p-3 text-sm text-[#1C1C1C] focus:bg-white focus:border-[#689F38] focus:ring-1 focus:ring-[#689F38] transition-all placeholder-gray-400 resize-none font-sans" placeholder="Clinical note regarding this intervention..."></textarea>
                                        <div class="absolute bottom-2 right-2 flex items-center gap-1.5">
                                          <button (click)="copyNote(item.note)" [disabled]="!item.note" class="w-6 h-6 rounded-md flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:text-[#1C1C1C] transition-colors disabled:opacity-50">
                                             <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                          </button>
                                          <button (click)="openNodeDictation(item)" [disabled]="!!dictation.permissionError()"
                                                  class="w-6 h-6 rounded-md flex items-center justify-center border transition-all shadow-sm"
                                                  [class.bg-red-50]="item.isDictating" [class.border-red-200]="item.isDictating" [class.text-red-600]="item.isDictating" [class.animate-pulse]="item.isDictating"
                                                  [class.bg-white]="!item.isDictating" [class.border-gray-200]="!item.isDictating" [class.text-gray-500]="!item.isDictating" [class.hover:bg-gray-50]="!item.isDictating"
                                                  title="Dictate Note">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                                          </button>
                                        </div>
                                      </div>
                                    }
                                  </li>
                                }
                              </ul>
                            }
                          }
                      </div>
                    }
                </div>
                <div class="mt-12 pt-4 border-t border-[#EEEEEE] text-[10px] text-gray-300 uppercase tracking-widest no-print">
                  AI Generated Content. Physician Review Required.
                </div>
              } @else if (!gemini.isLoading() && !hasAnyReport()) {
                <div class="h-64 border border-dashed border-gray-200 rounded-lg flex items-center justify-center no-print">
                  <p class="text-xs text-gray-400 font-medium uppercase tracking-widest">Waiting for input data...</p>
                </div>
              }
         </div>
    </div>

    <!-- Live Consult / Voice Assistant Section -->
    @if (state.isLiveAgentActive()) {
        <!-- Draggable Resizer -->
        <div (mousedown)="startDrag($event)" class="shrink-0 h-2 bg-gray-100 hover:bg-gray-200 transition-colors cursor-row-resize z-20 no-print"></div>

        <div class="shrink-0 bg-white z-10 no-print flex flex-col" [style.height.px]="chatHeight()">
            
            <!-- Panel Header / Tabs -->
            <div class="flex items-center justify-between px-6 py-2 border-b border-gray-100 bg-gray-50">
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
                <div class="flex-1 flex items-center justify-center gap-8 p-8 bg-gray-50/50">
                    <button (click)="activateChat()" class="group relative w-64 h-48 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-[#1C1C1C] transition-all p-6 flex flex-col items-center justify-center text-center gap-4">
                        <div class="w-16 h-16 rounded-full bg-[#F1F8E9] flex items-center justify-center text-[#558B2F] group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                        </div>
                        <div>
                            <h3 class="font-bold text-[#1C1C1C] uppercase tracking-wider text-sm mb-1">Live Consult</h3>
                            <p class="text-xs text-gray-500 leading-relaxed">Discuss patient data, ask questions, and explore diagnoses with AI.</p>
                        </div>
                    </button>

                    <button (click)="activateDictation()" class="group relative w-64 h-48 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-[#1C1C1C] transition-all p-6 flex flex-col items-center justify-center text-center gap-4">
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
                            <div class="p-4 rounded-lg bg-[#F8F8F8] text-[#1C1C1C] rams-typography" [innerHTML]="entry.htmlContent"></div>
                        } @else {
                            <div class="p-4 rounded-lg text-sm font-light leading-relaxed bg-[#4527A0] text-white/90">
                              <p>{{ entry.text }}</p>
                            </div>
                        }
                      </div>
                    }
                </div>

                <!-- Controls -->
                <div class="shrink-0 p-6 border-t border-[#EEEEEE] flex flex-col items-center justify-center gap-4">
                    @if (permissionError(); as error) {
                      <div class="p-2 mb-2 bg-red-50 border border-red-200 text-center max-w-md w-full">
                        <p class="font-bold text-red-700 text-xs">Microphone Access Issue</p>
                        <p class="text-xs text-red-600/80 mt-1">{{ error }}</p>
                      </div>
                    }
                    <form (submit)="sendMessage()" class="w-full max-w-2xl flex items-center gap-2">
                        <textarea
                          #chatInput
                          rows="1"
                          [value]="messageText()"
                          (input)="messageText.set($event.target.value)"
                          (keydown.enter)="sendMessage($event)"
                          placeholder="Ask a follow-up question..."
                          [disabled]="agentState() !== 'idle'"
                          class="flex-1 bg-white border border-[#EEEEEE] p-3 text-sm text-[#1C1C1C] focus:border-[#1C1C1C] focus:ring-0 transition-colors placeholder-gray-400 resize-none disabled:bg-gray-50"
                        ></textarea>

                        <button type="submit" [disabled]="!messageText().trim() || agentState() !== 'idle'"
                                class="w-12 h-12 flex items-center justify-center bg-[#1C1C1C] hover:bg-[#689F38] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-white shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20v-6l8-2-8-2V4l19 8z"/></svg>
                        </button>
                        <button type="button" (click)="toggleListening()" [disabled]="agentState() !== 'idle' || !!permissionError()"
                                class="w-12 h-12 flex items-center justify-center border border-[#EEEEEE] hover:border-[#1C1C1C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
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
                <div class="flex-1 flex flex-col p-8 bg-gray-50/30">
                    <div class="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm p-6 relative flex flex-col">
                        <textarea 
                            [value]="dictationText()"
                            (input)="dictationText.set($event.target.value)"
                            class="flex-1 w-full resize-none outline-none text-lg leading-relaxed text-gray-800 placeholder-gray-300"
                            placeholder="Start dictating..."></textarea>
                        
                        @if (isDictating()) {
                            <div class="absolute bottom-6 right-6 flex gap-1">
                                <span class="w-2 h-2 bg-red-500 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
                                <span class="w-2 h-2 bg-red-500 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
                                <span class="w-2 h-2 bg-red-500 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
                            </div>
                        }
                    </div>
                    
                    <div class="shrink-0 pt-6 flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <button (click)="toggleDictation()" 
                                    class="flex items-center gap-3 px-6 py-3 rounded-full font-bold uppercase tracking-widest text-xs transition-all shadow-sm"
                                    [class.bg-red-600]="isDictating()"
                                    [class.text-white]="isDictating()"
                                    [class.hover:bg-red-700]="isDictating()"
                                    [class.bg-[#1C1C1C]]="!isDictating()"
                                    [class.text-white]="!isDictating()"
                                    [class.hover:bg-gray-800]="!isDictating()">
                                @if (isDictating()) {
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                                    <span>Pause Recording</span>
                                } @else {
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                                    <span>Start Recording</span>
                                }
                            </button>
                            <button (click)="clearDictation()" [disabled]="!dictationText()" class="text-xs font-bold text-gray-400 hover:text-red-500 uppercase tracking-wider disabled:opacity-30 transition-colors">
                                Clear
                            </button>
                        </div>
                        <button (click)="copyDictation()" [disabled]="!dictationText()" class="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-xs font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-100 hover:text-black disabled:opacity-30 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                            Copy Text
                        </button>
                    </div>
                </div>
            }
        </div>
    }
  `
})
export class AnalysisReportComponent implements OnDestroy {
  gemini = inject(GeminiService);
  state = inject(PatientStateService);
  patientManager = inject(PatientManagementService);
  dictation = inject(DictationService);

  // --- Analysis State ---
  activeLens = signal<AnalysisLens>('Care Plan Overview');

  // --- Hover Toolbar State ---
  hoveredElement = signal<HTMLElement | null>(null);
  toolbarPosition = signal<{ top: string; left: string } | null>(null);
  private leaveTimeout: any;

  // --- Agent State ---
  agentState = signal<AgentState>('idle');
  permissionError = signal<string | null>(null);
  messageText = signal<string>('');

  // --- Panel State ---
  panelMode = signal<'selection' | 'chat' | 'dictation'>('selection');

  private recognition: any;
  private preferredVoice = signal<SpeechSynthesisVoice | undefined>(undefined);
  private hasStartedChat = false;

  // --- Resizable Chat State ---
  chatHeight = signal<number>(350); // Increased default height
  private boundDoDrag = this.doDrag.bind(this);
  private boundStopDrag = this.stopDrag.bind(this);
  private initialDragY: number = 0;
  private initialChatHeight: number = 0;

  // --- Dictation State ---
  dictationText = signal('');
  isDictating = signal(false);

  // --- Auto-scroll State ---
  transcriptContainer = viewChild<ElementRef<HTMLDivElement>>('transcriptContainer');
  contentArea = viewChild<ElementRef<HTMLDivElement>>('contentArea');

  hasAnyReport = computed(() => Object.keys(this.gemini.analysisResults()).length > 0);
  activeReport = computed(() => this.gemini.analysisResults()[this.activeLens()]);

  reportSections = computed<ReportSection[] | null>(() => {
    const raw = this.activeReport();
    if (!raw) return null;
    try {
      const sections: ReportSection[] = [];
      let globalNodeId = 0;
      const parts = raw.split(/\n(?=#{1,3}\s)/);
      for (const part of parts) {
        if (!part.trim()) continue;
        const lines = part.split('\n');
        const headingMarkdown = lines.find(l => l.trim().startsWith('#')) || lines[0] || '';
        const contentMarkdown = part === headingMarkdown ? '' : part.substring(part.indexOf(headingMarkdown) + headingMarkdown.length);

        const tokens = marked.lexer(contentMarkdown);
        const nodes: CarePlanNode[] = [];

        for (const token of tokens) {
          if (token.type === 'paragraph') {
            nodes.push({
              id: `node-${globalNodeId++}`,
              type: 'paragraph',
              rawHtml: marked.parseInline(token.text) as string,
              bracketState: 'normal', note: '', showNote: false
            });
          } else if (token.type === 'list') {
            nodes.push({
              id: `node-${globalNodeId++}`,
              type: 'list',
              ordered: token.ordered || false,
              items: token.items.map(item => ({
                id: `item-${globalNodeId++}`,
                html: marked.parseInline(item.text) as string,
                bracketState: 'normal', note: '', showNote: false
              })),
              bracketState: 'normal', note: '', showNote: false
            });
          } else {
            nodes.push({
              id: `node-${globalNodeId++}`,
              type: 'raw',
              rawHtml: marked.parse(token.raw) as string,
              bracketState: 'normal', note: '', showNote: false
            });
          }
        }

        sections.push({
          raw: part,
          heading: marked.parse(headingMarkdown) as string,
          nodes
        });
      }
      return sections;
    } catch (e) {
      console.error('Markdown parse error', e);
      return [{ raw: raw, heading: '<h3>Error</h3>', nodes: [{ id: 'err', type: 'raw', rawHtml: '<p>Could not parse report.</p>', bracketState: 'normal', note: '', showNote: false }] }];
    }
  });

  parsedTranscript = computed<ParsedTranscriptEntry[]>(() => {
    const transcript = this.gemini.transcript();
    try {
      return transcript.map(entry => {
        if (entry.role === 'model') {
          return { ...entry, htmlContent: this.renderInteractiveContent(entry.text) };
        }
        return entry;
      });
    } catch (e) {
      console.error('Transcript parse error', e);
      return transcript;
    }
  });

  constructor() {
    this.initializeSpeechRecognition();
    this.loadVoices();
    speechSynthesis.onvoiceschanged = () => this.loadVoices();

    // Auto-scroll effect
    effect(() => {
      // This effect depends on the parsedTranscript signal.
      // It will run whenever the transcript changes.
      this.parsedTranscript();
      this.scrollToBottom();
    });

    // New effect to handle analysis updates requested from other components
    effect(() => {
      const requestCount = this.state.analysisUpdateRequest();
      if (requestCount > 0) {
        untracked(() => {
          this.generate();
        });
      }
    });
  }

  ngOnDestroy() {
    if (speechSynthesis.speaking) speechSynthesis.cancel();
    if (this.recognition && this.agentState() === 'listening') this.recognition.stop();
  }

  private renderInteractiveContent(markdown: string): string {
    return marked.parse(markdown) as string;
  }

  // --- NODE RENDERER ACTIONS ---
  toggleNodeBracket(node: CarePlanNode | CarePlanNodeItem) {
    if (node.bracketState === 'normal') {
      node.bracketState = 'removed';
    } else if (node.bracketState === 'removed') {
      node.bracketState = 'added';
    } else {
      node.bracketState = 'normal';
    }
    window.getSelection()?.removeAllRanges();
  }

  updateNodeNote(node: CarePlanNode | CarePlanNodeItem, event: Event) {
    node.note = (event.target as HTMLTextAreaElement).value;
  }

  copyNote(text: string) {
    if (text) {
      navigator.clipboard.writeText(text);
    }
  }

  activeDictationNode = signal<CarePlanNode | CarePlanNodeItem | null>(null);

  openNodeDictation(node: CarePlanNode | CarePlanNodeItem) {
    if (this.dictation.isListening() && this.activeDictationNode() === node) {
      this.dictation.stopRecognition();
      node.isDictating = false;
      this.activeDictationNode.set(null);
      return;
    }

    if (this.dictation.isListening()) {
      this.dictation.stopRecognition();
      const prev = this.activeDictationNode();
      if (prev) prev.isDictating = false;
    }

    node.isDictating = true;
    this.activeDictationNode.set(node);

    const initialText = node.note || '';
    let baseText = initialText ? initialText + (initialText.endsWith(' ') ? '' : ' ') : '';

    this.dictation.registerResultHandler((text, isFinal) => {
      if (this.activeDictationNode() === node) {
        node.note = baseText + text;
      }
    });

    this.dictation.startRecognition();
  }

  // --- Report Actions ---
  async generate() {
    const patientId = this.patientManager.selectedPatientId();
    const patient = patientId ? this.patientManager.patients().find(p => p.id === patientId) : null;
    const history = patient?.history || [];

    const reportData = await this.gemini.generateComprehensiveReport(this.state.getAllDataForPrompt(history));

    if (patientId && Object.keys(reportData).length > 0) {
      const historyEntry: HistoryEntry = {
        type: 'AnalysisRun',
        date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
        summary: 'Comprehensive AI analysis generated.',
        report: reportData
      };
      this.patientManager.addHistoryEntry(patientId, historyEntry);
      this.activeLens.set('Care Plan Overview');
    }
  }

  changeLens(lens: AnalysisLens) {
    this.activeLens.set(lens);
  }

  printReport() { window.print(); }

  // --- Live Consult Actions ---
  openVoicePanel() {
    this.state.toggleLiveAgent(true);
    // If we haven't started a chat yet, show the selection screen.
    // If we have, we probably want to return to where we were (or default to chat).
    if (!this.hasStartedChat) {
      this.panelMode.set('selection');
    } else {
      this.panelMode.set('chat');
    }
  }

  activateChat() {
    this.panelMode.set('chat');
    if (!this.hasStartedChat) {
      const patientId = this.patientManager.selectedPatientId();
      const patient = patientId ? this.patientManager.patients().find(p => p.id === patientId) : null;
      const history = patient?.history || [];

      this.gemini.startChatSession(this.state.getAllDataForPrompt(history));
      this.gemini.getInitialGreeting().then(greeting => {
        this.speak(greeting);
      });
      this.hasStartedChat = true;
    }
  }

  activateDictation() {
    this.panelMode.set('dictation');
  }

  endLiveConsult() {
    this.state.toggleLiveAgent(false);
    this.stopDictation(); // Ensure dictation stops if panel closes
  }

  // --- Dictation Logic (Embedded) ---
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

  insertSectionIntoChat(sectionMarkdown: string) {
    this.openVoicePanel(); // Ensure panel is open
    this.activateChat();   // Ensure we are in chat mode
    this.messageText.set(`Regarding this section:\n\n> ${sectionMarkdown.replace(/\n/g, '\n> ')}\n\n`);
    // Need to wait for view to update if we just switched modes
    setTimeout(() => {
      const input = document.querySelector<HTMLTextAreaElement>('#chatInput');
      input?.focus();
    }, 100);
  }

  // --- Drag/Resize Handlers ---
  startDrag(event: MouseEvent): void {
    event.preventDefault();
    this.initialDragY = event.clientY;
    this.initialChatHeight = this.chatHeight();
    document.addEventListener('mousemove', this.boundDoDrag);
    document.addEventListener('mouseup', this.boundStopDrag);
  }

  private doDrag(event: MouseEvent): void {
    const deltaY = event.clientY - this.initialDragY;
    const newHeight = this.initialChatHeight - deltaY;
    const maxHeight = window.innerHeight * 0.8;
    this.chatHeight.set(Math.max(120, Math.min(newHeight, maxHeight)));
  }

  private stopDrag(): void {
    document.removeEventListener('mousemove', this.boundDoDrag);
    document.removeEventListener('mouseup', this.boundStopDrag);
  }

  // --- Auto-scroll Handler ---
  private scrollToBottom(): void {
    // Use a timeout to allow Angular to render the new transcript item in the DOM
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
    this.preferredVoice.set(professionalFemaleVoice);
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
        // If we are still supposed to be dictating, try to restart (handling timeouts)
        if (this.isDictating()) {
          try {
            this.recognition.start();
          } catch (e) {
            // If start fails (e.g. already started), just ignore
          }
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        this.permissionError.set('Microphone permission was denied. Please allow microphone access in your browser settings.');
        this.isDictating.set(false);
        this.agentState.set('idle');
      } else if (event.error === 'no-speech') {
        // Ignore no-speech errors, let onend handle restart if needed
      } else if (event.error === 'network') {
        this.permissionError.set('Network error. Please check your connection.');
        this.isDictating.set(false);
        this.agentState.set('idle');
      } else {
        // For other errors, stop to prevent infinite loops
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
          this.recognition.stop(); // Stop listening to process
          this.agentState.set('processing');
          const responseText = await this.gemini.sendChatMessage(final);
          this.speak(responseText);
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
      return; // Allow newline on Shift+Enter
    }

    const message = this.messageText().trim();
    if (!message || this.agentState() !== 'idle') return;

    this.messageText.set('');
    this.agentState.set('processing');
    const responseText = await this.gemini.sendChatMessage(message);
    this.speak(responseText);
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

    utterance.onstart = () => this.agentState.set('speaking');
    utterance.onend = () => this.agentState.set('idle');
    utterance.onerror = (e) => {
      if (e.error === 'interrupted') return;
      console.error('Speech synthesis error', e.error);
      this.agentState.set('idle');
    };
    speechSynthesis.speak(utterance);
  }
}