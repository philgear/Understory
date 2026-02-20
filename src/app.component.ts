import { Component, ChangeDetectionStrategy, inject, computed, signal, viewChild, ElementRef, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IntakeFormComponent } from './components/intake-form.component';
import { PatientSidebarComponent } from './components/patient-sidebar.component';
import { PatientStateService } from './services/patient-state.service';
import { ResearchFrameComponent } from './components/research-frame.component';
import { MedicalChartComponent } from './components/medical-chart.component';
import { VisitReviewComponent } from './components/visit-review.component';
import { AnalysisContainerComponent } from './components/analysis-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    IntakeFormComponent, 
    PatientSidebarComponent,
    ResearchFrameComponent,
    MedicalChartComponent,
    VisitReviewComponent,
    AnalysisContainerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-screen w-screen flex flex-row bg-white overflow-hidden selection:bg-green-100 selection:text-green-900">
      
      @if (!hasApiKey()) {
        <div class="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-8 text-center">
          <div class="mb-8">
            <svg width="64" height="64" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" class="mx-auto">
              <g transform="translate(0, -20)">
                <rect x="166" y="275" width="180" height="10" rx="2" fill="#76B362" />
                <path d="M251 270 C200 250 155 200 155 145 C155 180 185 240 251 270Z" fill="#76B362" />
                <path d="M251 270 C240 210 215 155 185 145 C185 145 230 200 251 270Z" fill="#244626" />
                <g transform="translate(512, 0) scale(-1, 1)">
                  <path d="M251 270 C200 250 155 200 155 145 C155 180 185 240 251 270Z" fill="#76B362" />
                  <path d="M251 270 C240 210 215 155 185 145 C185 145 230 200 251 270Z" fill="#244626" />
                </g>
              </g>
            </svg>
          </div>
          <h2 class="text-xl font-bold mb-2 uppercase tracking-[0.2em]">Understory</h2>
          <p class="text-gray-500 mb-8 max-w-sm text-sm">To access the clinical dashboard and 3D visualization tools, please select a paid Gemini API key.</p>
          <button (click)="selectKey()" class="px-10 py-4 bg-[#1C1C1C] text-white text-xs font-bold uppercase tracking-widest hover:bg-black transition-all shadow-xl">
            Select API Key
          </button>
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" class="mt-6 text-[10px] text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors">
            Billing Documentation
          </a>
        </div>
      }

      <div class="flex h-full transition-all duration-300 ease-in-out relative" 
           [style.width.px]="isSidebarCollapsed() ? 0 : 250"
           [class.border-r]="!isSidebarCollapsed()"
           [class.border-[#EEEEEE]]="!isSidebarCollapsed()">
        <div class="w-[250px] h-full overflow-hidden">
           <app-patient-sidebar class="no-print h-full block"></app-patient-sidebar>
        </div>
      </div>

      <!-- Sidebar Toggle Button -->
      <button (click)="toggleSidebar()" 
              class="absolute top-[calc(50%-3.5rem)] z-50 bg-white border border-[#EEEEEE] shadow-[2px_0_5px_rgba(0,0,0,0.05)] rounded-r-lg p-1 hover:bg-gray-50 transition-all duration-300 flex flex-col items-center justify-center h-20 w-8 gap-2 group"
              [style.left.px]="isSidebarCollapsed() ? 0 : 250"
              title="Toggle Patient List">
        <div class="text-gray-400 group-hover:text-[#1C1C1C] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-gray-300 group-hover:text-gray-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          @if (isSidebarCollapsed()) {
            <path d="M9 18l6-6-6-6"/>
          } @else {
            <path d="M15 18l-6-6 6-6"/>
          }
        </svg>
      </button>

      <div class="flex-1 flex flex-col min-w-0 relative"> <!-- Main Content -->
        <!-- Navbar: Pure utility, no decoration -->
        <nav class="h-14 border-b border-[#EEEEEE] flex items-center justify-between px-6 shrink-0 bg-white z-20 no-print">
          <div class="flex items-center gap-4">
              <div class="flex items-center gap-3">
                  <svg width="42" height="42" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g transform="translate(0, -20)">
                      <rect x="166" y="275" width="180" height="10" rx="2" fill="#76B362" />
                      <g>
                        <path d="M251 270 C200 250 155 200 155 145 C155 180 185 240 251 270Z" fill="#76B362" />
                        <path d="M251 270 C240 210 215 155 185 145 C185 145 230 200 251 270Z" fill="#244626" />
                      </g>
                      <g transform="translate(512, 0) scale(-1, 1)">
                        <path d="M251 270 C200 250 155 200 155 145 C155 180 185 240 251 270Z" fill="#76B362" />
                        <path d="M251 270 C240 210 215 155 185 145 C185 145 230 200 251 270Z" fill="#244626" />
                      </g>
                    </g>
                  </svg>
                  <span class="font-medium text-[#1C1C1C] tracking-[0.15em] text-sm">UNDERSTORY</span>
              </div>
            <div class="h-4 w-px bg-[#EEEEEE]"></div>
            <div class="text-xs text-gray-500 font-medium">INTAKE MODULE 01</div>
          </div>
          
          <div class="flex items-center gap-2">
            <button (click)="state.toggleResearchFrame()"
                    class="group flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold uppercase tracking-widest hover:bg-[#EEEEEE] hover:border-gray-400 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2m0 18c-2.29 0-4.43-.78-6.14-2.1C4.6 16.5 4 14.83 4 12c0-1.5.3-2.91.86-4.22L16.22 19.14A7.92 7.92 0 0 1 12 20m7.14-2.1C20.4 16.5 21 14.83 21 12c0-1.5-.3-2.91-.86-4.22L8.78 19.14C10.09 20.7 11.97 21.5 14 21.5c1.47 0 2.87-.42 4.14-1.14Z"/></svg>
              <span>Research</span>
            </button>
            <div class="flex items-center gap-6 text-xs font-medium text-gray-500 pl-4">
              <span>{{ today | date:'yyyy.MM.dd' }}</span>
              <span class="text-[#689F38]">REQ. DR. SMITH</span>
            </div>
          </div>
        </nav>

        <!-- Main Grid Layout -->
        <div #mainContainer class="flex-1 flex overflow-hidden">
          
          <!-- Column 1: Patient Medical Chart -->
          <div class="relative h-full transition-all duration-300 ease-in-out"
               [style.width.px]="isChartCollapsed() ? 0 : inputPanelWidth()"
               [class.border-r]="!isChartCollapsed()"
               [class.border-[#EEEEEE]]="!isChartCollapsed()">
               
               <div class="h-full w-full overflow-hidden">
                  <app-medical-chart class="no-print h-full block overflow-y-auto" 
                       [style.width.px]="inputPanelWidth()">
                  </app-medical-chart>
               </div>
          </div>

          <!-- Chart Toggle Button (Left side of resizer) -->
          <button (click)="toggleChart()" 
                  class="absolute top-[calc(50%+3.5rem)] z-50 bg-white border border-[#EEEEEE] shadow-[2px_0_5px_rgba(0,0,0,0.05)] rounded-r-lg p-1 hover:bg-gray-50 transition-all duration-300 flex flex-col items-center justify-center h-20 w-8 gap-2 group"
                  [style.left.px]="(isSidebarCollapsed() ? 0 : 250) + (isChartCollapsed() ? 0 : inputPanelWidth())"
                  title="Toggle Medical Chart">
            <div class="text-gray-400 group-hover:text-[#1C1C1C] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>
                </svg>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-gray-300 group-hover:text-gray-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              @if (isChartCollapsed()) {
                <path d="M9 18l6-6-6-6"/>
              } @else {
                <path d="M15 18l-6-6 6-6"/>
              }
            </svg>
          </button>

          <!-- RESIZER (Only visible if chart is open) -->
          @if (!isChartCollapsed()) {
            <div class="w-2 shrink-0 cursor-col-resize app-resizer hover:bg-blue-500/10 transition-colors"
                (mousedown)="startColumnDrag($event)"></div>
          }
          
          <!-- Column 2: Analysis (Report & Live Consult) / Intake Form -->
          <div class="flex-1 bg-white h-full overflow-hidden flex flex-col min-w-[320px]">
            @if (isViewingVisitDetails()) {
              <app-visit-review [visit]="state.viewingPastVisit()!"></app-visit-review>
            } @else if (state.selectedPartId() && !state.isLiveAgentActive()) {
              <app-intake-form></app-intake-form>
            } @else {
              <app-analysis-container></app-analysis-container>
            }
          </div>
        </div>
        
        @if(state.isResearchFrameVisible()) {
            <app-research-frame></app-research-frame>
        }
      </div>
    </div>
  `
})
export class AppComponent {
  state = inject(PatientStateService);
  today = new Date();
  hasApiKey = signal<boolean>(true);
  isSidebarCollapsed = signal<boolean>(false);
  isChartCollapsed = signal<boolean>(false);

  // --- Resizable Panel State ---
  mainContainer = viewChild<ElementRef<HTMLDivElement>>('mainContainer');
  inputPanelWidth = signal<number>(0);

  isViewingVisitDetails = computed(() => {
    const pastVisit = this.state.viewingPastVisit();
    // Show details view only when a visit is being reviewed AND no specific part has been selected yet.
    return !!pastVisit && (pastVisit.type === 'Visit' || pastVisit.type === 'ChartArchived') && !this.state.selectedPartId();
  });

  private isDragging = signal<boolean>(false);
  private boundDoColumnDrag = this.doColumnDrag.bind(this);
  private boundStopColumnDrag = this.stopColumnDrag.bind(this);
  private initialColumnDragX: number = 0;
  private initialInputPanelWidth: number = 0;

  constructor() {
    afterNextRender(async () => {
      const containerEl = this.mainContainer()?.nativeElement;
      if (!containerEl) return;
      
      // Initialize Column Widths
      const containerWidth = containerEl.offsetWidth;
      this.inputPanelWidth.set(containerWidth * 0.55);

      this.checkApiKey();
    });
  }

  async checkApiKey() {
    if (typeof window.aistudio?.hasSelectedApiKey === 'function') {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      this.hasApiKey.set(hasKey);
    }
  }

  async selectKey() {
    if (typeof window.aistudio?.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      this.hasApiKey.set(true);
    }
  }

  toggleSidebar() {
    this.isSidebarCollapsed.update(v => !v);
  }

  toggleChart() {
    this.isChartCollapsed.update(v => !v);
  }

  // --- Column Resizing Logic ---
  startColumnDrag(event: MouseEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
    this.initialColumnDragX = event.clientX;
    this.initialInputPanelWidth = this.inputPanelWidth();
    
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', this.boundDoColumnDrag);
    document.addEventListener('mouseup', this.boundStopColumnDrag, { once: true });
  }

  private doColumnDrag(event: MouseEvent): void {
    if (!this.isDragging()) return;

    const deltaX = event.clientX - this.initialColumnDragX;
    const containerWidth = this.mainContainer()?.nativeElement.offsetWidth ?? window.innerWidth;
    
    const newWidth = this.initialInputPanelWidth + deltaX;
    const minInputWidth = 400;
    const minAnalysisWidth = 320;
    const resizerWidth = 8;
    const maxInputWidth = containerWidth - minAnalysisWidth - resizerWidth;
    this.inputPanelWidth.set(Math.max(minInputWidth, Math.min(newWidth, maxInputWidth)));
  }

  private stopColumnDrag(): void {
    this.isDragging.set(false);
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', this.boundDoColumnDrag);
  }
}