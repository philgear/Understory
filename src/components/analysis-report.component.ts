import { Component, ChangeDetectionStrategy, inject, computed, ViewEncapsulation, signal, OnDestroy, effect, viewChild, ElementRef, untracked, afterNextRender, Renderer2, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService, TranscriptEntry, AnalysisLens } from '../services/gemini.service';
import { PatientStateService } from '../services/patient-state.service';
import { PatientManagementService, HistoryEntry } from '../services/patient-management.service';
import { marked } from 'marked';
import { DictationService } from '../services/dictation.service';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

declare var webkitSpeechRecognition: any;
type AgentState = 'idle' | 'listening' | 'processing' | 'speaking';

export interface CarePlanNodeItem {
  id: string;
  html: string;
  bracketState: 'normal' | 'added' | 'removed';
  note: string;
  showNote: boolean;
  isDictating?: boolean;
  key: string;
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
  key: string;
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
      font-weight: 800;
      color: #000000;
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
      font-weight: 600;
      line-height: 1.5;
      color: #333333;
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
      font-weight: 800;
      color: #000000;
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
        <div class="flex items-center gap-3">
            <h2 class="text-sm font-bold text-[#1C1C1C] uppercase tracking-widest">
                Care Plan Recommendation Engine
            </h2>
            @if (hasAnyReport()) {
                <div class="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 rounded border border-gray-200 no-print">
                    <div class="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    <span class="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Last Refresh: {{ lastRefreshDate() | date:'shortTime' }}</span>
                </div>
            }
        </div>
        <p class="text-xs text-gray-500 mt-1">
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
            <svg class="w-3 h-3 text-gray-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
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
            <button (click)="changeLens('Functional Protocols')"
                    class="px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors"
                    [class.border-[#1C1C1C]]="activeLens() === 'Functional Protocols'"
                    [class.text-[#1C1C1C]]="activeLens() === 'Functional Protocols'"
                    [class.text-gray-500]="activeLens() !== 'Functional Protocols'"
                    [class.border-transparent]="activeLens() !== 'Functional Protocols'"
                    [class.hover:bg-gray-100]="activeLens() !== 'Functional Protocols'">
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
                                      class="absolute -left-8 top-8 opacity-0 group-hover/section:opacity-100 transition-opacity text-gray-300 hover:text-[#416B1F]"
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
                                    (dblclick)="handleNodeDoubleClick(node)"></p>
                                
                                <div class="absolute -left-10 top-0 opacity-0 group-hover/node:opacity-100 transition-opacity flex flex-col gap-1 z-10 no-print">
                                   <button (click)="toggleNodeBracket(node)" class="w-7 h-7 bg-white rounded-md shadow-sm border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#416B1F] hover:bg-gray-50 transition-colors" title="Finalize Action">
                                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                   </button>
                                   <button (click)="node.showNote = true" class="w-7 h-7 bg-white rounded-md shadow-sm border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#1C1C1C] hover:bg-gray-50 transition-colors" title="Add Note">
                                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                   </button>
                                   <button (click)="pasteToNode(node)" class="w-7 h-7 bg-white rounded-md shadow-sm border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#1C1C1C] hover:bg-gray-50 transition-colors" title="Paste Note">
                                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
                                   </button>
                                </div>

                                @if (node.showNote || node.note) {
                                  <div class="mt-2 relative no-print">
                                    <textarea 
                                      id="note-{{node.key}}"
                                      name="note-{{node.key}}"
                                      aria-label="Add observation note"
                                      [value]="node.note" 
                                      (input)="updateNodeNote(node, $event)" 
                                      rows="3" 
                                      class="w-full bg-[#F9FAFB] border border-gray-200 rounded-lg p-3 text-sm text-[#1C1C1C] focus:bg-white focus:border-[#689F38] focus:ring-1 focus:ring-[#689F38] transition-all placeholder-gray-400 resize-none font-sans" 
                                      placeholder="Add your integrative observation here..."></textarea>
                                    
                                    <!-- Clinical Suggestions -->
                                    <div class="flex flex-wrap gap-1.5 mt-2 mb-8">
                                      @for (sugg of protocolInsights; track sugg) {
                                        <button (click)="insertSuggestion(node, sugg)" class="px-2 py-1 bg-white border border-gray-100 rounded text-[9px] font-bold text-gray-500 uppercase tracking-tighter hover:border-[#689F38] hover:text-[#416B1F] transition-all">
                                          + {{ sugg }}
                                        </button>
                                      }
                                    </div>

                                        <div class="absolute bottom-2 left-3 flex items-center gap-1.5 no-print">
                                          @if (nodeSaveStatuses()[node.key]; as status) {
                                            <span class="text-[9px] font-bold uppercase tracking-widest transition-opacity duration-300"
                                                  [class.text-gray-500]="status === 'saving'"
                                                  [class.text-[#416B1F]]="status === 'saved'">
                                              {{ status === 'saving' ? 'Saving...' : 'Saved ✔' }}
                                            </span>
                                          }
                                        </div>

                                        <div class="absolute bottom-2 right-2 flex items-center gap-1.5">
                                          <button (click)="copyNote(node.note)" [disabled]="!node.note" class="w-6 h-6 rounded-md flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:text-[#1C1C1C] transition-colors disabled:opacity-50" title="Copy">
                                             <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                          </button>
                                          <button (click)="pasteToNode(node)" class="w-6 h-6 rounded-md flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:text-[#1C1C1C] transition-colors disabled:opacity-50" title="Paste">
                                             <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
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
                                      (dblclick)="handleNodeDoubleClick(item)">
                                    <span [innerHTML]="item.html" class="block"></span>

                                    <div class="absolute -left-10 top-0 opacity-0 group-hover/item:opacity-100 transition-opacity flex flex-col gap-1 z-10 no-print">
                                       <button (click)="toggleNodeBracket(item)" class="w-7 h-7 bg-white rounded-md shadow-sm border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#416B1F] hover:bg-gray-50 transition-colors" title="Finalize Action">
                                          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                       </button>
                                       <button (click)="item.showNote = true" class="w-7 h-7 bg-white rounded-md shadow-sm border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#1C1C1C] hover:bg-gray-50 transition-colors" title="Add Note">
                                          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                       </button>
                                       <button (click)="pasteToNode(item)" class="w-7 h-7 bg-white rounded-md shadow-sm border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#1C1C1C] hover:bg-gray-50 transition-colors" title="Paste Note">
                                          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
                                       </button>
                                    </div>

                                    @if (item.showNote || item.note) {
                                      <div class="mt-2 mb-4 relative ml-2 no-print">
                                        <textarea 
                                          id="intervention-note-{{item.key}}"
                                          name="intervention-note-{{item.key}}"
                                          aria-label="Add intervention clinical note"
                                          [value]="item.note" 
                                          (input)="updateNodeNote(item, $event)" 
                                          rows="2" 
                                          class="w-full bg-[#F9FAFB] border border-gray-200 rounded-lg p-3 text-sm text-[#1C1C1C] focus:bg-white focus:border-[#689F38] focus:ring-1 focus:ring-[#689F38] transition-all placeholder-gray-400 resize-none font-sans" 
                                          placeholder="Clinical note regarding this intervention..."></textarea>
                                        
                                        <!-- Clinical Suggestions -->
                                        <div class="flex flex-wrap gap-1.5 mt-2 mb-8">
                                          @for (sugg of protocolInsights; track sugg) {
                                            <button (click)="insertSuggestion(item, sugg)" class="px-2 py-1 bg-white border border-gray-100 rounded text-[9px] font-bold text-gray-500 uppercase tracking-tighter hover:border-[#689F38] hover:text-[#416B1F] transition-all">
                                              + {{ sugg }}
                                            </button>
                                          }
                                        </div>

                                        <div class="absolute bottom-2 left-3 flex items-center gap-1.5 no-print">
                                          @if (nodeSaveStatuses()[item.key]; as status) {
                                            <span class="text-[9px] font-bold uppercase tracking-widest transition-opacity duration-300"
                                                  [class.text-gray-500]="status === 'saving'"
                                                  [class.text-[#416B1F]]="status === 'saved'">
                                              {{ status === 'saving' ? 'Saving...' : 'Saved ✔' }}
                                            </span>
                                          }
                                        </div>

                                        <div class="absolute bottom-2 right-2 flex items-center gap-1.5">
                                          <button (click)="copyNote(item.note)" [disabled]="!item.note" class="w-6 h-6 rounded-md flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:text-[#1C1C1C] transition-colors disabled:opacity-50" title="Copy">
                                             <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                          </button>
                                          <button (click)="pasteToNode(item)" class="w-6 h-6 rounded-md flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:text-[#1C1C1C] transition-colors disabled:opacity-50" title="Paste">
                                             <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
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
                  <p class="text-xs text-gray-500 font-medium uppercase tracking-widest">Waiting for input data...</p>
                </div>
              }
         </div>
    </div>


  `
})
export class AnalysisReportComponent implements OnDestroy, AfterViewInit {
  gemini = inject(GeminiService);
  state = inject(PatientStateService);
  patientManager = inject(PatientManagementService);
  dictation = inject(DictationService);

  private resizeObserver: ResizeObserver | null = null;
  private carePlanObserver: MutationObserver | null = null;

  ngAfterViewInit() {
    this.setupCarePlanObserver();
  }

  private setupCarePlanObserver() {
    const el = this.contentArea()?.nativeElement;
    if (!el) return;

    this.carePlanObserver = new MutationObserver(() => {
      // Only auto-scroll if we are generating
      if (this.gemini.isLoading()) {
        el.scrollTop = el.scrollHeight;
      }
    });

    this.carePlanObserver.observe(el, { childList: true, subtree: true, characterData: true });
  }

  // --- Analysis State ---
  activeLens = signal<AnalysisLens>('Care Plan Overview');

  // --- Hover Toolbar State ---
  hoveredElement = signal<HTMLElement | null>(null);
  toolbarPosition = signal<{ top: string; left: string } | null>(null);
  private leaveTimeout: any;

  lastRefreshDate = signal<string | null>(null);

  protocolInsights = [
    'Follow up in 72 hours if no improvement.',
    'Monitor BP and heart rate twice daily.',
    'Continue current medication as prescribed.',
    'Schedule follow-up with specialist.',
    'Patient education provided regarding diet.',
    'Increase fluid intake to 2L/day.',
    'Watch for signs of infection.'
  ];

  hasAnyReport = computed(() => Object.keys(this.gemini.analysisResults()).length > 0);
  activeReport = computed(() => this.gemini.analysisResults()[this.activeLens()]);
  contentArea = viewChild<ElementRef<HTMLDivElement>>('contentArea');

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
          const key = (token as any).text || token.raw || `node-${globalNodeId}`;
          const annotation = (this.lensAnnotations()[this.activeLens()] || {})[key] || { note: '', bracketState: 'normal' };

          if (token.type === 'paragraph') {
            nodes.push({
              id: `node-${globalNodeId++}`,
              key,
              type: 'paragraph',
              rawHtml: marked.parseInline(token.text) as string,
              bracketState: annotation.bracketState,
              note: annotation.note,
              showNote: !!annotation.note
            });
          } else if (token.type === 'list') {
            nodes.push({
              id: `node-${globalNodeId++}`,
              key,
              type: 'list',
              ordered: token.ordered || false,
              items: token.items.map(item => {
                const itemKey = item.text;
                const itemAnnotation = (this.lensAnnotations()[this.activeLens()] || {})[itemKey] || { note: '', bracketState: 'normal' };
                return {
                  id: `item-${globalNodeId++}`,
                  key: itemKey,
                  html: marked.parseInline(item.text) as string,
                  bracketState: itemAnnotation.bracketState,
                  note: itemAnnotation.note,
                  showNote: !!itemAnnotation.note
                };
              }),
              bracketState: annotation.bracketState,
              note: annotation.note,
              showNote: !!annotation.note
            });
          } else {
            nodes.push({
              id: `node-${globalNodeId++}`,
              key,
              type: 'raw',
              rawHtml: marked.parse(token.raw) as string,
              bracketState: annotation.bracketState,
              note: annotation.note,
              showNote: !!annotation.note
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
      return [{ raw: raw, heading: '<h3>Error</h3>', nodes: [{ id: 'err', key: 'err', type: 'raw', rawHtml: '<p>Could not parse report.</p>', bracketState: 'normal', note: '', showNote: false }] }];
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

  readonly lensAnnotations = signal<Record<string, Record<string, { note: string, bracketState: 'normal' | 'added' | 'removed' }>>>({});

  // Track save status per node
  readonly nodeSaveStatuses = signal<Record<string, 'idle' | 'saving' | 'saved'>>({});

  private autoSaveSubject = new Subject<void>();

  constructor() {
    // Auto-scroll effect for transcript
    effect(() => {
      // This effect depends on the parsedTranscript signal.
      // It will run whenever the transcript changes.
      this.parsedTranscript();
    });

    // Removed the effect-based auto-scroll for care plan content area, handled in ngAfterViewInit instead

    // Auto-load annotations effect
    effect(() => {
      const patient = this.patientManager.selectedPatient();
      if (patient) {
        const latestAnalysis = patient.history.filter(e => e.type === 'AnalysisRun' || e.type === 'FinalizedCarePlan').pop();

        if (latestAnalysis) {
          untracked(() => {
            this.lastRefreshDate.set(latestAnalysis.date); // Use string date
          });
        }

        const latestFinalized = patient.history.find(e => e.type === 'FinalizedCarePlan');
        if (latestFinalized && latestFinalized.type === 'FinalizedCarePlan') {
          untracked(() => {
            this.lensAnnotations.set(latestFinalized.annotations || {});
          });
        } else {
          untracked(() => {
            this.lensAnnotations.set({});
          });
        }
      }
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

    // Auto-save debouncing
    this.autoSaveSubject.pipe(
      debounceTime(1000)
    ).subscribe(() => {
      this.persistToHistory();
    });
  }

  ngOnDestroy() {
    this.carePlanObserver?.disconnect();
    this.flushAutoSave();
  }

  private triggerAutoSave(nodeKey: string) {
    // Set individual node to saving
    this.nodeSaveStatuses.update(prev => ({ ...prev, [nodeKey]: 'saving' }));
    this.autoSaveSubject.next();
  }

  private flushAutoSave() {
    this.autoSaveSubject.next();
    this.persistToHistory();
  }

  private persistToHistory() {
    const patientId = this.patientManager.selectedPatientId();
    if (!patientId) return;

    const historyEntry: HistoryEntry = {
      type: 'FinalizedCarePlan',
      date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
      summary: 'Integrative Care Plan updated (auto-saved).',
      report: this.gemini.analysisResults(),
      annotations: this.lensAnnotations()
    };

    this.patientManager.addHistoryEntry(patientId, historyEntry);

    // Update all 'saving' statuses to 'saved'
    this.nodeSaveStatuses.update(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        if (next[key] === 'saving') next[key] = 'saved';
      });
      return next;
    });

    // Clear 'saved' status after a few seconds
    setTimeout(() => {
      this.nodeSaveStatuses.update(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          if (next[key] === 'saved') delete next[key];
        });
        return next;
      });
    }, 3000);
  }

  private renderInteractiveContent(markdown: string): string {
    return marked.parse(markdown) as string;
  }

  // --- NODE RENDERER ACTIONS ---
  handleNodeDoubleClick(node: CarePlanNode | CarePlanNodeItem) {
    // If note is not shown, show it
    if (!node.showNote) {
      node.showNote = true;
    } else {
      // If already shown, maybe toggle bracket instead or just focus
      // Let's keep bracket toggling as a fallback if the user wants it, 
      // but the priority now is "inserting a new note"
      // We'll toggle brackets with Alt+Click or separate buttons if needed, 
      // but for now let's make double-click show/focus note.
    }
    window.getSelection()?.removeAllRanges();
  }

  toggleNodeBracket(node: CarePlanNode | CarePlanNodeItem) {
    if (node.bracketState === 'normal') {
      node.bracketState = 'added';
    } else if (node.bracketState === 'added') {
      node.bracketState = 'removed';
    } else {
      node.bracketState = 'normal';
    }
    this.updateAnnotation(node.key, { bracketState: node.bracketState });
    this.syncNodeToTaskFlow(node);
    window.getSelection()?.removeAllRanges();
  }

  private syncNodeToTaskFlow(node: CarePlanNode | CarePlanNodeItem) {
    // If it's not bracketed 'added' and has no note, remove it.
    if (node.bracketState !== 'added' && !node.note) {
      this.state.removeClinicalNote(node.key);
      return;
    }

    // Strip HTML tags for clean display
    const rawText = ('html' in node) ? node.html : node.rawHtml;
    const cleanText = rawText ? rawText.replace(/<[^>]*>/g, '') : '';

    let fullText = cleanText;
    if (node.note) {
      fullText += `\n\nObservation: ${node.note}`;
    }

    // Remove existing to replace
    this.state.removeClinicalNote(node.key);

    this.state.addClinicalNote({
      id: node.key,
      text: fullText,
      sourceLens: this.activeLens(),
      date: new Date().toISOString()
    });
  }

  updateNodeNote(node: CarePlanNode | CarePlanNodeItem, event: Event) {
    node.note = (event.target as HTMLTextAreaElement).value;
    this.updateAnnotation(node.key, { note: node.note });
    this.syncNodeToTaskFlow(node);
  }

  copyNote(text: string) {
    if (text) {
      navigator.clipboard.writeText(text);
    }
  }

  async pasteToNode(node: CarePlanNode | CarePlanNodeItem) {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        node.note = (node.note || '') + (node.note ? ' ' : '') + text;
        node.showNote = true;
        this.updateAnnotation(node.key, { note: node.note });
        this.syncNodeToTaskFlow(node);
      }
    } catch (err) {
      console.error('Failed to read clipboard', err);
    }
  }

  insertSuggestion(node: CarePlanNode | CarePlanNodeItem, suggestion: string) {
    node.note = (node.note || '') + (node.note ? ' ' : '') + suggestion;
    node.showNote = true;
    this.updateAnnotation(node.key, { note: node.note });
    this.syncNodeToTaskFlow(node);
  }

  private updateAnnotation(key: string, data: Partial<{ note: string, bracketState: any }>) {
    this.lensAnnotations.update(all => {
      const currentLens = this.activeLens();
      const lensData = { ...(all[currentLens] || {}) };
      lensData[key] = { ...(lensData[key] || { note: '', bracketState: 'normal' }), ...data };
      return { ...all, [currentLens]: lensData };
    });
    this.triggerAutoSave(key);
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
        this.updateAnnotation(node.key, { note: node.note });
        if (isFinal) {
          this.syncNodeToTaskFlow(node);
        }
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
    this.flushAutoSave();
    this.activeLens.set(lens);
  }

  finalizeCarePlan() {
    const patientId = this.patientManager.selectedPatientId();
    if (!patientId) return;

    const historyEntry: HistoryEntry = {
      type: 'FinalizedCarePlan',
      date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
      summary: 'Integrative Care Plan finalized and saved to chart.',
      report: this.gemini.analysisResults(),
      annotations: this.lensAnnotations()
    };

    this.patientManager.addHistoryEntry(patientId, historyEntry);

    // Briefly change tab to show it's saved? 
    // For now we'll just log and rely on the history update
    console.log('Care plan finalized and saved to chart.');
  }

  printReport() { window.print(); }

  // --- Live Consult Actions ---

  openVoicePanel() {
    this.state.toggleLiveAgent(true);
  }

  endLiveConsult() {
    this.state.toggleLiveAgent(false);
  }

  insertSectionIntoChat(sectionMarkdown: string) {
    this.state.toggleLiveAgent(true); // Ensure panel is open
    // Need to wait for view to update if we just switched modes
    setTimeout(() => {
      this.state.liveAgentInput.set(`Regarding this section:\n\n> ${sectionMarkdown.replace(/\n/g, '\n> ')}\n\n`);
      const input = document.querySelector<HTMLTextAreaElement>('#chatInput');
      input?.focus();
    }, 100);
  }
}