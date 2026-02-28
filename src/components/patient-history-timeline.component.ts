import { Component, ChangeDetectionStrategy, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HistoryEntry, BodyPartIssue } from '../services/patient.types';

// --- Icon Definitions ---
const ICONS: Record<string, string> = {
  // Event Types
  VISIT: `<path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14zM7 10h5v5H7z"/>`,
  PATIENT_SUMMARY: `<path d="M7 15h7v2H7zm0-4h10v2H7zm0-4h10v2H7zm12-4h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2m-7-2c.55 0 1 .45 1 1s-.45 1-1 1s-1-.45-1-1s.45-1 1-1m7 18H5V5h14z"/>`,
  BOOKMARK: `<path d="m12 15.4 3.75 2.6-1-4.35L18 11l-4.45-.4L12 6.5 10.45 10.6 6 11l3.25 2.65-1 4.35z"/>`,
  NOTE: `<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83l3.75 3.75z"/>`,
  ANALYSIS: `<path d="M11 22h2v-2h-2zm-4-4h2v-2H7zm8 0h2v-2h-2zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8m-1-13h2v6h-2z"/>`,
  CHART_ARCHIVED: `<path d="M3 5v14h18V5zm16 12H5V7h14zM16 9H8v2h8zm-2 4h-4v2h4z"/>`,
  NOTE_DELETED: `<path d="M15 4V3H9v1H4v2h1v13c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V6h1V4zM7 18V6h10v12zm2-2h2V8H9zm4 0h2V8h-2z"/>`,
  // Body Parts
  HEAD: `<path d="M12 2C9.24 2 7 4.24 7 7s2.24 5 5 5s5-2.24 5-5S14.76 2 12 2m-1 13c-2.67 0-8 1.34-8 4v3h18v-3c0-2.66-5.33-4-8-4z"/>`,
  CHEST: `<path d="M12 4.5C7 4.5 2.73 7.62 1 12c1.73 4.38 6 7.5 11 7.5s9.27-3.12 11-7.5C21.27 7.62 17 4.5 12 4.5m0 11c-2.48 0-4.5-2.02-4.5-4.5S9.52 6.5 12 6.5s4.5 2.02 4.5 4.5s-2.02 4.5-4.5 4.5"/>`,
  ABDOMEN: `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8m-5.5-2.5l1.41-1.41L12 16.17l4.09-4.09L17.5 13.5L12 19z"/>`,
  LOWER_BACK: `<path d="M10 18h4v-2h-4zM4 6h16v2H4zm4 5h8v2H8zm-2 5h12v2H6z"/>`,
  SHOULDER: `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8"/>`,
  ARM: `<path d="M17 21c-2.76 0-5-2.24-5-5s2.24-5 5-5s5 2.24 5 5-2.24 5-5 5m-9-6c-1.66 0-3-1.34-3-3s1.34-3 3-3s3 1.34 3 3-1.34 3-3 3M5 1c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2s2-.9 2-2V3c0-1.1-.9-2-2-2z"/>`,
  HAND: `<path d="M10.5 16.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V11h-3zM18 11h-3v5.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5zM7.5 18H9v-7H6v5.5c0 .83.67 1.5 1.5 1.5M20 8h-6V4h-4v4H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2"/>`,
  THIGH: `<path d="M9.5 22c1.1 0 2-.9 2-2v-4.5c0-1.1-.9-2-2-2s-2 .9-2 2V20c0 1.1.9 2 2 2m5 0c1.1 0 2-.9 2-2v-4.5c0-1.1-.9-2-2-2s-2 .9-2 2V20c0 1.1.9 2 2 2m-5-10.5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2s-2 .9-2 2v4.5c0 1.1.9 2 2 2m5 0c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2s-2 .9-2 2v4.5c0 1.1.9 2 2 2z"/>`,
  SHIN: `<path d="M6 22h4v-7H6zm8 0h4v-7h-4zM6 13h4V6H6zm8 0h4V6h-4z"/>`,
  FOOT: `<path d="M20.41 6.41l-2.83-2.83c-.37-.37-.88-.58-1.41-.58H4C2.9 3 2 3.9 2 5v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8.83c0-.53-.21-1.04-.59-1.42M13 19h-2v-2h2zm0-4h-2v-2h2zm-4 4H7v-2h2zm0-4H7v-2h2zm4-2h2v2h-2zm4 2h-2v2h2zm-4-4h2v2h-2z"/>`
};


@Component({
  selector: 'app-patient-history-timeline',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
   <div class="relative font-sans">
      <!-- The vertical line running through all entries -->
      <div class="absolute left-3 top-2 h-full w-px bg-gray-100"></div>

      @for (entry of history(); track (entry.date + entry.summary + $index); let isLast = $last) {
        <div class="relative pl-10" [class.pb-6]="!isLast">
          
          <!-- Icon Node on the timeline -->
          <div class="absolute left-3 top-2 -translate-x-1/2 w-6 h-6 rounded-full bg-white flex items-center justify-center border"
               [class.border-gray-300]="entry.type === 'Visit' || entry.type === 'ChartArchived'"
               [class.border-gray-200]="entry.type !== 'Visit' && entry.type !== 'ChartArchived'">
            <span class="inline-flex items-center justify-center w-3.5 h-3.5"
                 [class.text-[#1C1C1C]]="entry.type === 'Visit' || entry.type === 'ChartArchived'"
                 [class.text-blue-500]="entry.type === 'PatientSummaryUpdate' || entry.type === 'FinalizedPatientSummary'"
                 [class.text-yellow-500]="entry.type === 'BookmarkAdded'"
                 [class.text-purple-500]="entry.type === 'NoteCreated'"
                 [class.text-red-500]="entry.type === 'NoteDeleted'"
                 [class.text-green-500]="entry.type === 'AnalysisRun'"
                 [innerHTML]="getSafeIconHtml(entry)">
            </span>
          </div>

          <!-- Data Card -->
          <div class="relative top-[-3px]">
            @switch (entry.type) {
              @case ('Visit') {
                <button (click)="review.emit(entry)"
                        class="w-full text-left p-4 rounded transition-colors duration-200 border-l-4"
                        [class.bg-white]="activeVisit() === entry"
                        [class.border-l-[#1C1C1C]]="activeVisit() === entry"
                        [class.bg-white]="activeVisit() !== entry"
                        [class.hover:bg-gray-50]="activeVisit() !== entry"
                        [class.border-l-gray-100]="activeVisit() !== entry"
                        [class.border-y]="true"
                        [class.border-r]="true"
                        [class.border-gray-100]="true">
                  <div class="flex justify-between items-start gap-4">
                    <div class="flex-1">
                      <p class="text-xs font-bold text-gray-500 uppercase tracking-[0.15em]">{{ entry.date }}</p>
                      <p class="text-sm text-[#1C1C1C] mt-1 leading-relaxed font-light">{{ entry.summary }}</p>
                    </div>
                  </div>
                </button>
              }
              @case ('ChartArchived') {
                <button (click)="review.emit(entry)"
                        class="w-full text-left p-4 rounded transition-colors duration-200 border-l-4"
                        [class.bg-white]="activeVisit() === entry"
                        [class.border-l-[#1C1C1C]]="activeVisit() === entry"
                        [class.bg-white]="activeVisit() !== entry"
                        [class.hover:bg-gray-50]="activeVisit() !== entry"
                        [class.border-l-gray-100]="activeVisit() !== entry"
                        [class.border-y]="true"
                        [class.border-r]="true"
                        [class.border-gray-100]="true">
                    <p class="text-xs font-bold text-gray-500 uppercase tracking-[0.15em]">{{ entry.date }}</p>
                    <p class="text-sm text-[#1C1C1C] mt-1 leading-relaxed font-light">{{ entry.summary }}</p>
                </button>
              }
              @case ('PatientSummaryUpdate') {
                <div class="p-4 bg-white border border-gray-100 border-l-4 border-l-blue-400 rounded">
                  <div>
                    <p class="text-xs font-bold text-blue-500 uppercase tracking-[0.15em]">{{ entry.date }}</p>
                    <p class="text-sm text-gray-800 mt-1 leading-relaxed whitespace-pre-wrap font-mono text-[11px] opacity-80">{{ entry.summary }}</p>
                  </div>
                </div>
              }
              @case ('BookmarkAdded') {
                 <div class="p-4 bg-white border border-gray-100 border-l-4 border-l-yellow-400 rounded flex gap-3 items-start">
                  <div class="flex-1">
                    <p class="text-xs font-bold text-yellow-700 uppercase tracking-[0.15em]">{{ entry.date }}</p>
                    <p class="text-sm text-gray-800 mt-1 leading-relaxed truncate font-light">Bookmarked: "{{ entry.summary }}"</p>
                    <button (click)="openBookmark.emit(entry.bookmark.url)" 
                            class="mt-3 text-xs font-bold text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1 rounded hover:bg-gray-100 hover:border-gray-200 transition-all uppercase tracking-widest">
                      Open
                    </button>
                  </div>
                </div>
              }
              @case ('NoteCreated') {
                <div class="group relative p-4 bg-white border border-gray-100 border-l-4 border-l-purple-400 rounded transition-colors hover:bg-gray-50/50">
                  <button (click)="reviewNote.emit(entry)" class="w-full text-left">
                    <p class="text-xs font-bold text-purple-500 uppercase tracking-[0.15em]">{{ entry.date }}</p>
                    <p class="text-sm text-gray-800 mt-1 leading-relaxed font-light">{{ entry.summary }}</p>
                  </button>
                  <button (click)="deleteNote.emit(entry)"
                          class="absolute top-2 right-2 p-1 rounded-full text-gray-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete this note entry">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 10.586 16.95 5.636a1 1 0 1 1 1.414 1.414L13.414 12l4.95 4.95a1 1 0 0 1-1.414 1.414L12 13.414l-4.95 4.95a1 1 0 0 1-1.414-1.414L10.586 12 5.636 7.05a1 1 0 0 1 1.414-1.414L12 10.586z"/></svg>
                  </button>
                </div>
              }
               @case ('NoteDeleted') {
                <div class="p-4 bg-white border border-gray-100 border-l-4 border-l-red-400 rounded">
                  <p class="text-xs font-bold text-red-500 uppercase tracking-[0.15em]">{{ entry.date }}</p>
                  <p class="text-sm text-gray-500 mt-1 leading-relaxed italic font-light">{{ entry.summary }}</p>
                </div>
              }
              @case ('AnalysisRun') {
                <button (click)="reviewAnalysis.emit(entry)"
                        class="w-full text-left p-4 rounded transition-colors duration-200 border-l-4"
                        [class.bg-white]="activeVisit() === entry"
                        [class.border-l-[#1C1C1C]]="activeVisit() === entry"
                        [class.bg-white]="activeVisit() !== entry"
                        [class.hover:bg-gray-50]="activeVisit() !== entry"
                        [class.border-l-green-400]="activeVisit() !== entry"
                        [class.border-y]="true"
                        [class.border-r]="true"
                        [class.border-gray-100]="true">
                  <div>
                    <div class="flex items-center gap-2 mb-1.5">
                        <span class="px-1.5 py-0.5 rounded text-[8px] font-bold bg-green-50 text-green-700 uppercase tracking-[0.1em] border border-green-100">AI Report</span>
                        <p class="text-xs font-bold text-gray-500 uppercase tracking-[0.15em]">{{ entry.date }}</p>
                    </div>
                    <p class="text-sm text-gray-800 mt-1 leading-relaxed font-light">{{ entry.summary }}</p>
                  </div>
                </button>
              }
              @case ('FinalizedPatientSummary') {
                <button (click)="reviewAnalysis.emit(entry)"
                        class="w-full text-left p-4 rounded transition-colors duration-200 border-l-4"
                        [class.bg-white]="activeVisit() === entry"
                        [class.border-l-[#1C1C1C]]="activeVisit() === entry"
                        [class.bg-white]="activeVisit() !== entry"
                        [class.hover:bg-gray-50]="activeVisit() !== entry"
                        [class.border-l-blue-400]="activeVisit() !== entry"
                        [class.border-y]="true"
                        [class.border-r]="true"
                        [class.border-gray-100]="true">
                  <div>
                    <div class="flex items-center gap-2 mb-1.5">
                        <span class="px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-50 text-blue-600 uppercase tracking-[0.1em] border border-blue-100">Patient Summary</span>
                        <p class="text-xs font-bold text-gray-500 uppercase tracking-[0.15em]">{{ entry.date }}</p>
                    </div>
                    <p class="text-sm text-[#1C1C1C] mt-1 leading-relaxed font-bold">{{ entry.summary }}</p>
                  </div>
                </button>
              }
            }
          </div>
        </div>
      }
   </div>
  `
})
export class PatientHistoryTimelineComponent {
  history = input.required<HistoryEntry[]>();
  activeVisit = input<HistoryEntry | null>(null);

  review = output<HistoryEntry>();
  reviewAnalysis = output<HistoryEntry>();
  reviewNote = output<HistoryEntry>();
  deleteNote = output<HistoryEntry>();
  openBookmark = output<string>();

  private sanitizer: DomSanitizer = inject(DomSanitizer);

  getSafeIconHtml(entry: HistoryEntry): SafeHtml {
    const svgPathString = this.getIconSvgPath(entry);
    const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-full h-full">${svgPathString}</svg>`;
    return this.sanitizer.bypassSecurityTrustHtml(fullSvg);
  }

  private getIconSvgPath(entry: HistoryEntry): string {
    switch (entry.type) {
      case 'PatientSummaryUpdate':
        return ICONS['PATIENT_SUMMARY'];
      case 'BookmarkAdded':
        return ICONS['BOOKMARK'];
      case 'NoteCreated':
        return ICONS['NOTE'];
      case 'NoteDeleted':
        return ICONS['NOTE_DELETED'];
      case 'AnalysisRun':
        return ICONS['ANALYSIS'];
      case 'ChartArchived':
        return ICONS['CHART_ARCHIVED'];
      case 'FinalizedPatientSummary':
        return ICONS['PATIENT_SUMMARY'];
      case 'Visit':
        const issues = entry.state?.issues ?? {};
        // FIX: The original logic was incorrect as it treated an array of issues as a single object.
        // This flattens all issues from the visit into a single array and finds the one with the max pain level.
        const allIssues = Object.values(issues).flat();
        if (allIssues.length === 0) {
          return ICONS['VISIT'];
        }

        // Find issue with highest pain level
        const primaryIssue = allIssues.reduce((max, current) =>
          current.painLevel > max.painLevel ? current : max
        );

        const id = primaryIssue.id.split('_')[0]; // e.g., 'r_shoulder' -> 'r'
        switch (id) {
          case 'head': return ICONS['HEAD'];
          case 'chest': return ICONS['CHEST'];
          case 'abdomen': return ICONS['ABDOMEN'];
          case 'lower': return ICONS['LOWER_BACK'];
          case 'r':
          case 'l':
            const part = primaryIssue.id.split('_')[1];
            switch (part) {
              case 'shoulder': return ICONS['SHOULDER'];
              case 'arm': return ICONS['ARM'];
              case 'hand': return ICONS['HAND'];
              case 'thigh': return ICONS['THIGH'];
              case 'shin': return ICONS['SHIN'];
              case 'foot': return ICONS['FOOT'];
              default: return ICONS['VISIT'];
            }
          default:
            return ICONS['VISIT'];
        }
      default:
        return '';
    }
  }
}