import { Component, ChangeDetectionStrategy, inject, signal, computed, effect, viewChild, ElementRef, OnDestroy, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { fromEvent, Subscription } from 'rxjs';
import { PatientManagementService } from '../services/patient-management.service';
import { PatientStateService } from '../services/patient-state.service';
import { GeminiService } from '../services/gemini.service';

@Component({
  selector: 'app-research-frame',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="absolute flex flex-col bg-white shadow-2xl border border-gray-300 rounded-lg overflow-hidden z-40"
         [style.left.px]="position().x"
         [style.top.px]="position().y"
         [style.width.px]="size().width"
         [style.height.px]="size().height">
      
      <!-- Header / Drag Handle -->
      <div (mousedown)="startDrag($event)" class="h-10 px-4 flex items-center justify-between bg-gray-100 border-b border-gray-200 shrink-0 cursor-move select-none">
        <h3 class="text-xs font-bold uppercase tracking-widest text-gray-600">Research Frame</h3>
        <button (click)="close()" class="p-1 rounded-full text-gray-400 hover:bg-gray-300 hover:text-gray-800 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 10.586 16.95 5.636a1 1 0 1 1 1.414 1.414L13.414 12l4.95 4.95a1 1 0 0 1-1.414 1.414L12 13.414l-4.95 4.95a1 1 0 0 1-1.414-1.414L10.586 12 5.636 7.05a1 1 0 0 1 1.414-1.414L12 10.586z"/></svg>
        </button>
      </div>

      <!-- Toolbar -->
      <div class="p-3 border-b border-gray-200 bg-gray-50/50 shrink-0">
        <div class="flex items-center gap-2">
          <!-- Search Engine Toggle -->
          <div class="flex items-center bg-gray-200 rounded-md p-0.5">
            <button (click)="searchEngine.set('google')"
                    class="px-2 py-0.5 text-[11px] font-bold rounded-md transition-colors"
                    [class.bg-white]="searchEngine() === 'google'"
                    [class.text-gray-800]="searchEngine() === 'google'"
                    [class.text-gray-500]="searchEngine() !== 'google'">
              Google
            </button>
            <button (click)="searchEngine.set('pubmed')"
                    class="px-2 py-0.5 text-[11px] font-bold rounded-md transition-colors"
                    [class.bg-white]="searchEngine() === 'pubmed'"
                    [class.text-gray-800]="searchEngine() === 'pubmed'"
                    [class.text-gray-500]="searchEngine() !== 'pubmed'">
              PubMed
            </button>
          </div>
          <!-- Search Input -->
          <input 
            type="text"
            #searchInput
            [value]="searchText()"
            (input)="searchText.set(searchInput.value)"
            (keydown.enter)="search()"
            class="flex-1 w-full text-xs bg-white border border-gray-200 focus:border-gray-400 focus:ring-0 transition-colors px-2 py-1"
            placeholder="Research patient complaint...">
          <!-- Actions -->
          <button (click)="search()" class="p-2 text-gray-400 hover:text-gray-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5A6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14"/></svg>
          </button>
          <button (click)="addBookmark()" title="Bookmark current page" class="p-2 text-gray-400 hover:text-yellow-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="m12 15.4 3.75 2.6-1-4.35L18 11l-4.45-.4L12 6.5 10.45 10.6 6 11l3.25 2.65-1 4.35z"/></svg>
          </button>
        </div>
      </div>

      <!-- Bookmarks Bar -->
      @if (bookmarks().length > 0) {
        <div class="p-2 border-b border-gray-200 bg-gray-50/50 shrink-0 flex items-center gap-2 flex-wrap">
          @for(bookmark of bookmarks(); track bookmark.url) {
            <div class="group flex items-center">
                <button (click)="loadUrl(bookmark.url)" 
                        class="pl-2 pr-1 py-0.5 text-[11px] text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-l-md transition-colors max-w-48 truncate">
                  {{ bookmark.title }}
                </button>
                <button (click)="removeBookmark(bookmark.url)"
                        class="px-1 py-0.5 text-blue-500 bg-blue-100 hover:bg-red-100 hover:text-red-600 rounded-r-md transition-colors opacity-50 group-hover:opacity-100">
                    ×
                </button>
            </div>
          }
        </div>
      }

      <!-- IFrame Content -->
      <div class="flex-1 bg-gray-200">
        @if (sanitizedUrl(); as url) {
          <iframe #iframeEl [src]="url" class="w-full h-full border-none"></iframe>
        } @else {
          <div class="w-full h-full flex items-center justify-center text-center text-gray-400 p-4">
             <p class="text-xs">Search results and bookmarked pages will appear here.</p>
          </div>
        }
      </div>

      <!-- Resize Handle -->
      <div (mousedown)="startResize($event)" class="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize text-gray-300 hover:text-gray-600 transition-colors flex items-end justify-end p-0.5">
          <svg width="100%" height="100%" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 0 L10 10 L0 10" stroke="currentColor" stroke-width="2"/>
          </svg>
      </div>
    </div>
  `
})
export class ResearchFrameComponent {
  private sanitizer: DomSanitizer = inject(DomSanitizer);
  patientManager = inject(PatientManagementService);
  patientState = inject(PatientStateService);
  
  searchEngine = signal<'google' | 'pubmed'>('google');
  searchText = signal<string>('');
  
  private currentUrl = signal<string | null>(null);
  sanitizedUrl = signal<SafeResourceUrl | null>(null);

  // --- Window State ---
  position = signal({ x: 150, y: 100 });
  size = signal({ width: 800, height: 600 });
  
  private dragging = false;
  private resizing = false;
  private initialMousePos = { x: 0, y: 0 };
  private initialPosition = { x: 0, y: 0 };
  private initialSize = { width: 0, height: 0 };

  private boundDoDrag = this.doDrag.bind(this);
  private boundStopDrag = this.stopDrag.bind(this);
  private boundDoResize = this.doResize.bind(this);
  private boundStopResize = this.stopResize.bind(this);

  selectedPatient = computed(() => {
    const id = this.patientManager.selectedPatientId();
    if (!id) return null;
    return this.patientManager.patients().find(p => p.id === id);
  });
  
  bookmarks = computed(() => this.selectedPatient()?.bookmarks || []);

  constructor() {
    // When the patient changes, reset state for the research frame
    effect(() => {
      const goals = this.patientState.patientGoals();
      // Only set search text if it's different, to avoid overriding user typing
      untracked(() => {
        if (this.searchText() !== goals) {
          this.searchText.set(goals);
        }
      });
    });
    
    // Effect to handle requests to load a specific URL from outside (e.g., history)
    effect(() => {
      const url = this.patientState.requestedResearchUrl();
      if (url) {
        this.loadUrl(url);
        // Reset the signal after consuming it
        this.patientState.requestedResearchUrl.set(null);
      }
    });

    // Effect to handle search requests from outside (e.g., analysis report)
    effect(() => {
        const query = this.patientState.requestedResearchQuery();
        if (query) {
            this.searchText.set(query);
            this.search();
            this.patientState.requestedResearchQuery.set(null);
        }
    });
    
    // Load default page if no other request is pending at initialization
    if (!this.patientState.requestedResearchUrl() && !this.patientState.requestedResearchQuery()) {
        this.loadUrl('https://spark.philgear.dev/#/care');
    }
  }

  // --- Window Actions ---
  close() {
    this.patientState.toggleResearchFrame(false);
  }

  startDrag(event: MouseEvent) {
    event.preventDefault();
    this.dragging = true;
    this.initialMousePos = { x: event.clientX, y: event.clientY };
    this.initialPosition = this.position();
    document.addEventListener('mousemove', this.boundDoDrag);
    document.addEventListener('mouseup', this.boundStopDrag, { once: true });
  }

  private doDrag(event: MouseEvent) {
    if (!this.dragging) return;
    const deltaX = event.clientX - this.initialMousePos.x;
    const deltaY = event.clientY - this.initialMousePos.y;
    this.position.set({
      x: this.initialPosition.x + deltaX,
      y: this.initialPosition.y + deltaY,
    });
  }

  private stopDrag() {
    this.dragging = false;
    document.removeEventListener('mousemove', this.boundDoDrag);
  }
  
  startResize(event: MouseEvent) {
    event.preventDefault();
    this.resizing = true;
    this.initialMousePos = { x: event.clientX, y: event.clientY };
    this.initialSize = this.size();
    document.addEventListener('mousemove', this.boundDoResize);
    document.addEventListener('mouseup', this.boundStopResize, { once: true });
  }
  
  private doResize(event: MouseEvent) {
    if (!this.resizing) return;
    const deltaX = event.clientX - this.initialMousePos.x;
    const deltaY = event.clientY - this.initialMousePos.y;
    this.size.set({
      width: Math.max(400, this.initialSize.width + deltaX),
      height: Math.max(300, this.initialSize.height + deltaY),
    });
  }

  private stopResize() {
    this.resizing = false;
    document.removeEventListener('mousemove', this.boundDoResize);
  }

  // --- Browser Actions ---
  search() {
    const query = this.searchText().trim();
    if (!query) return;

    let url: string;
    if (this.searchEngine() === 'google') {
      // NOTE: Using DuckDuckGo to avoid iframe blocking issues from Google, while providing a "Google-like" web search experience.
      url = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&ia=web`;
    } else {
      url = `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(query)}`;
    }
    this.loadUrl(url);
  }

  loadUrl(url: string) {
    this.currentUrl.set(url);
    this.sanitizedUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
  }

  addBookmark() {
    const url = this.currentUrl();
    if (!url) return;
    
    try {
      const urlObject = new URL(url);
      let title = urlObject.hostname.replace(/^www\./, '');
      const path = urlObject.pathname.substring(1).split('/')[0];
      if (path) title += `/${path}`;
      
      const existing = this.bookmarks().find(b => b.url === url);
      if (existing) return;

      this.patientManager.addBookmark({ title, url });
    } catch(e) {
      console.error("Invalid URL for bookmark", e);
    }
  }

  removeBookmark(url: string) {
    this.patientManager.removeBookmark(url);
  }
}