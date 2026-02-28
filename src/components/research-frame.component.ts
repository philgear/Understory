import { Component, ChangeDetectionStrategy, inject, signal, computed, effect, viewChild, ElementRef, OnDestroy, untracked, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { fromEvent, Subscription } from 'rxjs';
import { PatientManagementService } from '../services/patient-management.service';
import { PatientStateService } from '../services/patient-state.service';
import { Bookmark } from '../services/patient.types';
import { UnderstoryButtonComponent } from './shared/understory-button.component';
import { UnderstoryInputComponent } from './shared/understory-input.component';

export interface PubMedSearchResult {
  id: string;
  title: string;
  authors: string;
  source: string;
  pubdate: string;
  doi: string;
}

@Component({
  selector: 'app-research-frame',
  standalone: true,
  imports: [CommonModule, UnderstoryButtonComponent, UnderstoryInputComponent],
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
        <understory-button variant="ghost" size="sm" (click)="close()" icon="M12 10.586 16.95 5.636a1 1 0 1 1 1.414 1.414L13.414 12l4.95 4.95a1 1 0 0 1-1.414 1.414L12 13.414l-4.95 4.95a1 1 0 0 1-1.414-1.414L10.586 12 5.636 7.05a1 1 0 0 1 1.414-1.414L12 10.586z" title="Close Research Window" ariaLabel="Close Research Window">
        </understory-button>
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
          <div class="flex-1">
              <understory-input 
                [value]="searchText()"
                (valueChange)="searchText.set($event)"
                (keydown.enter)="search()"
                placeholder="Research patient complaint...">
              </understory-input>
          </div>
          <!-- Actions -->
          <understory-button variant="ghost" size="sm" (click)="search()" icon="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5A6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14" title="Execute Search" ariaLabel="Execute Search">
          </understory-button>
          <understory-button variant="ghost" size="sm" (click)="addBookmark()" icon="m12 15.4 3.75 2.6-1-4.35L18 11l-4.45-.4L12 6.5 10.45 10.6 6 11l3.25 2.65-1 4.35z" title="Bookmark current page" ariaLabel="Bookmark current page">
          </understory-button>
          <understory-button variant="ghost" size="sm" (click)="showCitationForm.set(!showCitationForm())" [class.text-blue-600]="showCitationForm()" icon="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" title="Citation Metadata" ariaLabel="Citation Metadata">
          </understory-button>
        </div>

        <!-- Citation Metadata Form -->
        @if (showCitationForm()) {
          <div class="mt-3 p-3 bg-white border border-blue-100 rounded-md shadow-inner space-y-2 animate-in fade-in slide-in-from-top-1">
            <h4 class="text-[10px] font-bold text-blue-800 uppercase tracking-tighter mb-1">Citation Metadata (UKRIO Style)</h4>
            <div class="grid grid-cols-2 gap-2">
              <understory-input [value]="authors()" (valueChange)="authors.set($event)" placeholder="Authors (e.g. Smith et al.)" size="sm"></understory-input>
              <understory-input [value]="doi()" (valueChange)="doi.set($event)" placeholder="DOI (e.g. 10.1038/s41586-021-03503-x)" size="sm"></understory-input>
            </div>
            <div class="flex items-center gap-4">
              <label class="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" [checked]="isPeerReviewed()" (change)="isPeerReviewed.set(!isPeerReviewed())" class="w-3 h-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                <span class="text-[11px] text-gray-600">Peer Reviewed</span>
              </label>
              <label class="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" [checked]="autoCite()" (change)="autoCite.set(!autoCite())" class="w-3 h-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                <span class="text-[11px] text-gray-600">Include in Summary References</span>
              </label>
            </div>
          </div>
        }
      </div>

      <!-- Bookmarks Bar -->
      @if (bookmarks().length > 0) {
        <div class="p-2 border-b border-gray-200 bg-gray-50/50 shrink-0 flex items-center gap-2 flex-wrap">
          @for(bookmark of bookmarks(); track bookmark.url) {
            <div class="group flex items-center">
                <button (click)="loadUrl(bookmark.url)" 
                        class="pl-2 pr-1 py-0.5 text-[11px] font-medium rounded-l-md transition-colors max-w-48 truncate flex items-center gap-1.5"
                        [class.bg-blue-600]="bookmark.cited"
                        [class.text-white]="bookmark.cited"
                        [class.bg-blue-100]="!bookmark.cited"
                        [class.text-blue-700]="!bookmark.cited"
                        [class.hover:bg-blue-200]="!bookmark.cited">
                  @if (bookmark.isPeerReviewed) {
                    <svg class="w-3 h-3 opacity-80" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
                  }
                  {{ bookmark.title }}
                </button>
                <button (click)="toggleCite(bookmark)"
                        class="px-1.5 py-0.5 text-[10px] uppercase font-black transition-colors border-r border-gray-200/20"
                        [class.bg-blue-700]="bookmark.cited"
                        [class.text-white]="bookmark.cited"
                        [class.bg-blue-50]="!bookmark.cited"
                        [class.text-blue-400]="!bookmark.cited"
                        [title]="bookmark.cited ? 'Remove from summary references' : 'Include in summary references'">
                    {{ bookmark.cited ? 'CITED' : 'CITE' }}
                </button>
                <button (click)="removeBookmark(bookmark.url)"
                        class="px-1 py-0.5 text-blue-500 bg-blue-100 hover:bg-red-100 hover:text-red-600 rounded-r-md transition-colors opacity-50 group-hover:opacity-100">
                    ×
                </button>
            </div>
          }
        </div>
      }

      <!-- IFrame / Native Content -->
      <div class="flex-1 bg-gray-200 overflow-y-auto">
        @if (searchEngine() === 'pubmed' && (pubmedResults() !== null || isLoadingPubmed())) {
          <div class="p-4 space-y-4 max-w-3xl mx-auto">
            @if (isLoadingPubmed()) {
              <div class="flex items-center justify-center p-8 text-gray-500">
                <p class="text-sm font-medium animate-pulse">Searching PubMed natively...</p>
              </div>
            } @else if (pubmedResults()?.length === 0) {
              <div class="flex items-center justify-center p-8 text-gray-500">
                <p class="text-sm">No results found on PubMed.</p>
              </div>
            } @else {
              @for (res of pubmedResults(); track res.id) {
                <div class="bg-white p-4 rounded-md shadow-sm border border-gray-200">
                  <h4 class="font-bold text-blue-800 text-sm leading-snug mb-1" [innerHTML]="res.title"></h4>
                  <p class="text-xs text-gray-600 mb-1 font-medium">{{ res.authors }}</p>
                  <div class="text-[11px] text-gray-500 flex items-center gap-2 mb-3">
                    <span class="font-bold">{{ res.source }}</span> • <span>{{ res.pubdate }}</span>
                    @if (res.doi) {
                      <span>• DOI: {{ res.doi }}</span>
                    }
                  </div>
                  <div class="flex items-center gap-2">
                    <understory-button variant="primary" size="sm" (click)="addPubmedBookmark(res)" icon="m12 15.4 3.75 2.6-1-4.35L18 11l-4.45-.4L12 6.5 10.45 10.6 6 11l3.25 2.65-1 4.35z">
                      Bookmark & Cite
                    </understory-button>
                    <a [href]="'https://pubmed.ncbi.nlm.nih.gov/' + res.id + '/'" target="_blank" class="text-xs font-semibold text-gray-600 hover:text-blue-600 transition-colors inline-block px-2 py-1 bg-gray-100 hover:bg-blue-50 rounded">
                      Open in PubMed
                    </a>
                  </div>
                </div>
              }
            }
          </div>
        } @else if (sanitizedUrl(); as url) {
          <iframe #iframeEl [src]="url" class="w-full h-full border-none bg-white"></iframe>
        } @else {
          <div class="w-full h-full flex items-center justify-center text-center text-gray-500 p-4">
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
  @ViewChild('iframeEl') iframeEl?: ElementRef<HTMLIFrameElement>;

  @HostListener('window:message', ['$event'])
  onMessage(event: MessageEvent) {
    if (event.data && event.data.type === 'OPEN_LINK') {
      this.loadUrl(event.data.url);
    } else if (event.data && event.data.type === 'BOOKMARK_RESULT') {
      this.addGseBookmark(event.data.title, event.data.url);
    }
  }
  private sanitizer: DomSanitizer = inject(DomSanitizer);
  patientManager = inject(PatientManagementService);
  patientState = inject(PatientStateService);

  searchEngine = signal<'google' | 'pubmed'>('google');
  searchText = signal<string>('');

  private currentUrl = signal<string | null>(null);
  sanitizedUrl = signal<SafeResourceUrl | null>(null);

  pubmedResults = signal<PubMedSearchResult[] | null>(null);
  isLoadingPubmed = signal(false);

  // --- Citation Signals ---
  showCitationForm = signal(false);
  authors = signal('');
  doi = signal('');
  isPeerReviewed = signal(false);
  autoCite = signal(true);

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
    // Update size based on window
    if (typeof window !== 'undefined') {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.position.set({ x: w * 0.45, y: 100 });
    }

    // --- Special Reference Trigger ---
    // Automically load reference info for Head & Neck when selected
    effect(() => {
      const partId = this.patientState.selectedPartId();
      const isVisible = this.patientState.isResearchFrameVisible();

      // We only auto-trigger if the frame is NOT already visible or if it's head
      // to avoid annoying the user if they've closed it.
      // But for head/neck, the user specifically requested it.
      if (partId === 'head') {
        untracked(() => {
          this.searchText.set('Head and Neck Clinical Anatomy');
          // Using a reliable scientific search result or landing page
          this.loadUrl('https://www.ncbi.nlm.nih.gov/pmc/?term=head+and+neck+anatomy');
          if (!isVisible) {
            this.patientState.toggleResearchFrame(true);
          }
        });
      }
    });

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
        untracked(() => {
          // Reset the signal after consuming it
          this.patientState.requestedResearchUrl.set(null);
        });
      }
    });

    // Effect to handle search requests from outside (e.g., analysis report)
    effect(() => {
      const query = this.patientState.requestedResearchQuery();
      if (query) {
        untracked(() => {
          this.searchText.set(query);
          this.search();
          this.patientState.requestedResearchQuery.set(null);
        });
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

    if (this.searchEngine() === 'google') {
      // Use local wrapper for Google Custom Search Engine
      const url = `/search.html`;
      this.loadUrl(url);

      // Post the query after iframe loads (give it a moment to render)
      setTimeout(() => {
        if (this.iframeEl?.nativeElement?.contentWindow) {
          this.iframeEl.nativeElement.contentWindow.postMessage({
            type: 'EXECUTE_SEARCH',
            query: query
          }, '*');
        }
      }, 500);
    } else {
      this.searchPubmed(query);
    }
  }

  loadUrl(url: string) {
    this.currentUrl.set(url);
    this.sanitizedUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
    this.pubmedResults.set(null); // Clear pubmed native results if loading arbitrary URL
  }

  async searchPubmed(query: string) {
    this.isLoadingPubmed.set(true);
    this.pubmedResults.set(null);
    this.sanitizedUrl.set(null); // Clear iframe 

    try {
      const eSearchUrl = `/api/pubmed/search?term=${encodeURIComponent(query)}`;
      const searchRes = await fetch(eSearchUrl);
      const searchData = await searchRes.json();
      const ids = searchData.esearchresult?.idlist || [];

      if (ids.length === 0) {
        this.pubmedResults.set([]);
        return;
      }

      const eSummaryUrl = `/api/pubmed/summary?id=${ids.join(',')}`;
      const summaryRes = await fetch(eSummaryUrl);
      const summaryData = await summaryRes.json();

      const results: PubMedSearchResult[] = ids.map((id: string) => {
        const item = summaryData.result[id];
        let authorsStr = '';
        if (item.authors && Array.isArray(item.authors)) {
          authorsStr = item.authors.map((a: any) => a.name).join(', ');
        }
        let doiStr = '';
        if (item.articleids && Array.isArray(item.articleids)) {
          const doiObj = item.articleids.find((a: any) => a.idtype === 'doi');
          if (doiObj) doiStr = doiObj.value;
        }

        return {
          id: item.uid,
          title: item.title,
          authors: authorsStr,
          source: item.source,
          pubdate: item.pubdate,
          doi: doiStr
        };
      });

      this.pubmedResults.set(results);

    } catch (e) {
      console.error("Error fetching PubMed results", e);
      this.pubmedResults.set([]);
    } finally {
      this.isLoadingPubmed.set(false);
    }
  }

  addPubmedBookmark(result: PubMedSearchResult) {
    const url = `https://pubmed.ncbi.nlm.nih.gov/${result.id}/`;

    const existing = this.bookmarks().find(b => b.url === url);
    if (existing) return;

    // Remove any trailing period from title for cleaner bookmark
    const cleanTitle = result.title.replace(/\.$/, '');

    this.patientManager.addBookmark({
      title: cleanTitle || `PMID: ${result.id}`,
      url,
      authors: result.authors || undefined,
      doi: result.doi || undefined,
      isPeerReviewed: true, // PubMed is predominantly peer-reviewed literature
      cited: this.autoCite()
    });
  }

  addGseBookmark(title: string, url: string) {
    const existing = this.bookmarks().find(b => b.url === url);
    if (existing) return;

    this.patientManager.addBookmark({
      title: title || new URL(url).hostname.replace(/^www\./, ''),
      url,
      isPeerReviewed: false,
      cited: this.autoCite()
    });
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

      this.patientManager.addBookmark({
        title,
        url,
        authors: this.authors() || undefined,
        doi: this.doi() || undefined,
        isPeerReviewed: this.isPeerReviewed(),
        cited: this.autoCite()
      });

      // Clear metadata after adding
      this.authors.set('');
      this.doi.set('');
      this.isPeerReviewed.set(false);
      this.showCitationForm.set(false);
    } catch (e) {
      console.error("Invalid URL for bookmark", e);
    }
  }

  toggleCite(bookmark: Bookmark) {
    // Note: We need a way to update an existing bookmark.
    // Adding it again with same URL but different 'cited' flag in PatientManagementService
    this.patientManager.updateBookmark(bookmark.url, { cited: !bookmark.cited });
  }

  removeBookmark(url: string) {
    this.patientManager.removeBookmark(url);
  }
}