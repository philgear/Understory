import { Component, ChangeDetectionStrategy, inject, computed, signal, viewChild, ElementRef, afterNextRender, effect, ChangeDetectorRef, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientDropdownComponent } from './components/patient-dropdown.component';
import { PatientStateService } from './services/patient-state.service';
import { ResearchFrameComponent } from './components/research-frame.component';
import { MedicalChartComponent } from './components/medical-chart.component';
import { VisitReviewComponent } from './components/visit-review.component';
import { AnalysisContainerComponent } from './components/analysis-container.component';
import { DictationModalComponent } from './components/dictation-modal.component';
import { MedicalChartSummaryComponent } from './components/medical-summary.component';
import { TaskFlowComponent } from './components/task-flow.component';
import { IntakeFormComponent } from './components/intake-form.component';
import { VoiceAssistantComponent } from './components/voice-assistant.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    PatientDropdownComponent,
    MedicalChartComponent,
    AnalysisContainerComponent,
    DictationModalComponent,
    MedicalChartSummaryComponent,
    TaskFlowComponent,
    ResearchFrameComponent,
    IntakeFormComponent,
    VoiceAssistantComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    
    <div class="h-screen w-full bg-[#EEEEEE] flex flex-col overflow-hidden font-sans selection:bg-green-100 selection:text-green-900 group/app">
      
      <app-dictation-modal></app-dictation-modal>

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
          <p class="text-gray-500 mb-8 max-w-sm text-sm">To access the practitioner dashboard and 3D visualization tools, please select a paid Gemini API key.</p>
          <button (click)="selectKey()" class="px-10 py-4 bg-[#1C1C1C] text-white text-xs font-bold uppercase tracking-widest hover:bg-black transition-all shadow-xl">
            Select API Key
          </button>
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" class="mt-6 text-[10px] text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors">
            Billing Documentation
          </a>
        </div>
      }

      <div class="flex-1 flex flex-col min-w-0 relative group/main"> <!-- Main Content -->
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
                        <path d="M251 270 C240 210 215 155 185 145 C185 145 230 200 251 270Z" fill="#76B362" />
                      </g>
                    </g>
                  </svg>
                  <span class="font-medium text-[#1C1C1C] tracking-[0.15em] text-sm">UNDERSTORY</span>
              </div>
            <div class="h-4 w-px bg-[#EEEEEE]"></div>
            <div class="text-xs text-gray-500 font-medium mr-4">INTAKE MODULE 01</div>

            <!-- System Status Indicator -->
            <div class="flex items-center gap-2 px-3 py-1.5 bg-gray-900/50 rounded-full border border-gray-800 hover:border-gray-700 transition-all cursor-help group relative no-print" title="System Diagnostic">
              <div class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
              <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">System Ready</span>
              
              <!-- Tooltip -->
              <div class="absolute top-full left-0 mt-2 w-64 bg-gray-900 border border-gray-800 p-4 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none text-left">
                 <div class="space-y-3">
                    <div class="flex justify-between items-center pb-2 border-b border-gray-800">
                       <span class="text-[10px] font-bold text-gray-300">CORE STATUS</span>
                       <span class="text-[10px] font-bold text-green-500 uppercase">Active</span>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                       <div class="space-y-1">
                          <p class="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">AI Node</p>
                          <p class="text-xs text-white">Stable</p>
                       </div>
                       <div class="space-y-1">
                          <p class="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">Relay</p>
                          <p class="text-xs text-white">84ms</p>
                       </div>
                       <div class="space-y-1">
                          <p class="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">Sync</p>
                          <p class="text-xs text-white">Verified</p>
                       </div>
                       <div class="space-y-1">
                          <p class="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">Datastore</p>
                          <p class="text-xs text-white">Healthy</p>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <app-patient-dropdown></app-patient-dropdown>
            
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
        <div #mainContainer class="flex-1 flex overflow-hidden relative bg-[#F9FAFB] p-6 gap-6">

          <!-- NEW Column: Intake Form (Left of 3D Body Viewer) -->
          @if (state.selectedPartId()) {
             <div class="w-[400px] shrink-0 flex flex-col h-full z-20 transition-all duration-300 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <app-intake-form class="flex-1 min-h-0 overflow-y-auto block layout-fix"></app-intake-form>
             </div>
          }
          
          <!-- Column 1: Patient Medical Chart -->
          <div class="relative h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
               [class.flex-1]="isAnalysisCollapsed()"
               [class.transition-all]="!isDragging()"
               [class.duration-500]="!isDragging()"
               [class.ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]]="!isDragging()"
               [style.width.px]="isChartCollapsed() ? 0 : (isAnalysisCollapsed() ? null : inputPanelWidth())"
               [class.hidden]="isChartCollapsed()">
               <div class="h-full w-full overflow-hidden">
                    @defer (on viewport) {
                      <app-medical-chart class="no-print h-full block overflow-y-auto" 
                           [style.width.px]="inputPanelWidth()">
                      </app-medical-chart>
                    } @placeholder {
                      <div class="h-full w-full flex items-center justify-center text-gray-400 bg-gray-50/50">
                        <div class="flex flex-col items-center gap-3">
                          <div class="w-6 h-6 border-2 border-gray-200 border-t-[#689F38] rounded-full animate-spin"></div>
                          <span class="text-[10px] uppercase tracking-widest font-bold">Loading Chart...</span>
                        </div>
                      </div>
                    }
                 </div>
            </div>

            <!-- RESIZER V -->
            <div title="Drag to resize, Double-click to maximize chart" class="w-2 shrink-0 flex items-center justify-center cursor-col-resize z-20 no-print group relative"
                 [class.hidden]="isChartCollapsed() || isAnalysisCollapsed()"
                 (mousedown)="startColumnDrag($event)"
                 (dblclick)="maximizeChart()">
                
                <!-- Full-width background bar -->
                <div class="absolute inset-y-0 left-1/2 -translate-x-1/2 w-4 bg-transparent group-hover:bg-gray-100 transition-colors rounded-full z-0"></div>
                <div class="absolute inset-0 bg-gray-100 group-hover:bg-gray-200 transition-colors rounded"></div>
                <!-- Handle -->
                <div class="h-12 w-1.5 rounded-full bg-gray-200 group-hover:bg-gray-300 transition-colors relative z-10"></div>

                <!-- Quick Actions (V4) -->
                <div class="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-3 bg-white shadow-xl border border-gray-200 rounded-full p-1.5 z-30">
                   
                   <!-- Panel Management -->
                   <div class="flex flex-col gap-1 border-b border-gray-100 pb-1.5 mb-0.5">
                      <button (click)="$event.stopPropagation(); toggleChart()" [class.bg-black]="!isChartCollapsed()" [class.text-white]="!isChartCollapsed()"
                              title="Toggle Medical Chart" class="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-black transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><polyline points="14 2 14 8 20 8"></polyline><path d="M16 13H8"></path><path d="M16 17H8"></path><path d="M10 9H8"></path><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path></svg>
                      </button>
                      <button (click)="$event.stopPropagation(); toggleAnalysis()" [class.bg-black]="!isAnalysisCollapsed()" [class.text-white]="!isAnalysisCollapsed()"
                              title="Toggle Analysis Panel" class="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-black transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      </button>
                      <button (click)="$event.stopPropagation(); maximizeChart()" class="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-black transition-colors" title="Maximize Chart">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="m15 18-6-6 6-6"></path></svg>
                      </button>
                   </div>

                   <!-- View Modes -->
                   <div class="flex flex-col gap-1 border-b border-gray-100 pb-1.5 mb-0.5">
                      <button (click)="$event.stopPropagation(); state.bodyViewerMode.set('3d')" [class.bg-black]="state.bodyViewerMode() === '3d'" [class.text-white]="state.bodyViewerMode() === '3d'"
                              title="3D View" class="p-2 rounded-full hover:bg-gray-100 transition-all flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                      </button>
                      <button (click)="$event.stopPropagation(); state.bodyViewerMode.set('2d')" [class.bg-black]="state.bodyViewerMode() === '2d'" [class.text-white]="state.bodyViewerMode() === '2d'"
                              title="2D View" class="p-2 rounded-full hover:bg-gray-100 transition-all flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                      </button>
                   </div>

                   <!-- Anatomy Layers -->
                   <div class="flex flex-col gap-1">
                      <button (click)="$event.stopPropagation(); state.isInternalView.set(false)" [class.bg-black]="!state.isInternalView()" [class.text-white]="!state.isInternalView()"
                              title="Surface View" class="p-2 rounded-full hover:bg-gray-100 transition-all flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      </button>
                      <button (click)="$event.stopPropagation(); state.isInternalView.set(true)" [class.bg-black]="state.isInternalView()" [class.text-white]="state.isInternalView()"
                              title="Skeletal View" class="p-2 rounded-full hover:bg-gray-100 transition-all flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M12 2v20"></path><path d="M7 7h10"></path><path d="M5 12h14"></path><path d="M7 17h10"></path></svg>
                      </button>
                   </div>
                </div>
            </div>

            <!-- Column 2 (Middle): Task Flow & Intake Bracket -->
            @if (state.selectedPartId() && !state.isLiveAgentActive()) {
               <div class="shrink-0 w-[400px] flex flex-col gap-6 h-full z-20 transition-all duration-300">
                  <div class="flex-1 min-h-0 overflow-hidden rounded-xl shadow-sm border border-gray-200">
                    <app-intake-form></app-intake-form>
                  </div>
                  <div class="flex-1 min-h-0 overflow-hidden rounded-xl shadow-sm border border-gray-200">
                    <app-task-flow></app-task-flow>
                  </div>
               </div>
            }

            <!-- Column 3 (Right Area): Split View -->
            <div class="flex-1 flex flex-col overflow-hidden relative gap-6" [class.hidden]="isAnalysisCollapsed()">
             
               <!-- NEW: Top Half (Current Right Column Content) -->
               <div class="flex-1 min-h-0 flex flex-col relative gap-6 overflow-hidden">
                 <!-- Top Section: Context Depending on Selection -->
                 <div class="shrink-0 overflow-hidden flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md"
                      [style.height.px]="topSectionHeight()">
                     <div class="flex-1 w-full h-full overflow-hidden">
                         <app-medical-summary class="block h-full overflow-y-auto"></app-medical-summary>
                     </div>
                 </div>

                 <!-- RESIZER H1 (Top-Middle) -->
                 <div title="Drag to resize top panel" class="shrink-0 h-4 flex items-center justify-center cursor-row-resize z-20 no-print group relative"
                      (mousedown)="startTopRowDrag($event)">
                   <div class="absolute inset-x-0 top-1/2 -translate-y-1/2 h-4 bg-transparent group-hover:bg-gray-100 transition-colors rounded-full z-0"></div>
                   <div class="absolute inset-0 bg-gray-100 group-hover:bg-gray-200 transition-colors rounded"></div>
                   <div class="w-12 h-1.5 rounded-full bg-gray-200 group-hover:bg-gray-300 transition-colors relative z-10"></div>
                   <div class="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 bg-white shadow-sm border border-gray-200 rounded-md p-1">
                      <button (click)="$event.stopPropagation(); maximizeSummary()" title="Maximize Summary" class="p-1 hover:bg-gray-100 rounded text-gray-500">
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3 h-3"><path d="M5 15l7-7 7 7"></path></svg>
                      </button>
                      <button (click)="$event.stopPropagation(); resetRowHeights()" title="Reset Layout" class="p-1 hover:bg-gray-100 rounded text-gray-500">
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3 h-3"><path d="M19 9l-7 7-7-7"></path></svg>
                      </button>
                   </div>
                 </div>

                 <!-- Bottom Section: Analysis Intake -->
                 <div class="flex-1 min-h-0 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md">
                    <div class="h-full w-full overflow-hidden">
                        <app-analysis-container></app-analysis-container>
                        <!-- We moved the intake form to Column 2 -->
                    </div>
                 </div>
               </div>

               @if (state.isLiveAgentActive()) {
                 <!-- RESIZER V2 (Content/Voice) -->
                 <div title="Drag to resize voice panel" class="shrink-0 h-4 flex items-center justify-center cursor-row-resize z-20 no-print group relative"
                      (mousedown)="startVoiceDrag($event)">
                   <div class="absolute inset-x-0 top-1/2 -translate-y-1/2 h-4 bg-transparent group-hover:bg-gray-100 transition-colors rounded-full z-0"></div>
                   <div class="absolute inset-0 bg-gray-100 group-hover:bg-gray-200 transition-colors rounded"></div>
                   <div class="w-12 h-1.5 rounded-full bg-gray-200 group-hover:bg-gray-300 transition-colors relative z-10"></div>
                 </div>

                 <!-- Bottom Half (Voice Assistant) -->
                 <div class="shrink-0 overflow-hidden flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md"
                      [style.height.px]="voiceHeight()">
                     <div class="flex-1 w-full h-full overflow-hidden">
                         <app-voice-assistant class="block h-full overflow-y-auto"></app-voice-assistant>
                     </div>
                 </div>
               }

            </div>

        </div>
        
        @if(state.isResearchFrameVisible()) {
            <app-research-frame></app-research-frame>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
  `]
})
export class AppComponent {
  state = inject(PatientStateService);
  today = new Date();
  hasApiKey = signal<boolean>(true);
  isChartCollapsed = signal<boolean>(false);
  isAnalysisCollapsed = signal<boolean>(false);

  // --- Resizable Panel State ---
  mainContainer = viewChild<ElementRef<HTMLDivElement>>('mainContainer');

  // Vertical Panel Resizing (Column)
  inputPanelWidth = signal<number>(0);
  isDraggingColumn = signal<boolean>(false);
  private initialColumnDragX = 0;
  private initialInputPanelWidth = 0;

  // Horizontal Panel Resizing (Top Row)
  topSectionHeight = signal<number>(0);
  isDraggingTopRow = signal<boolean>(false);
  private initialTopRowDragY = 0;
  private initialTopSectionHeight = 0;

  // Voice Panel Resizing (Top Row)
  voiceHeight = signal<number>(0);
  isDraggingVoice = signal<boolean>(false);
  private initialVoiceDragY = 0;
  private initialVoiceHeight = 0;

  isViewingVisitDetails = computed(() => {
    const pastVisit = this.state.viewingPastVisit();
    // Show details view only when a visit is being reviewed AND no specific part has been selected yet.
    return !!pastVisit && (pastVisit.type === 'Visit' || pastVisit.type === 'ChartArchived') && !this.state.selectedPartId();
  });

  isDragging = computed(() => this.isDraggingColumn() || this.isDraggingTopRow() || this.isDraggingVoice());

  private boundDoColumnDrag = this.doColumnDrag.bind(this);
  private boundStopColumnDrag = this.stopColumnDrag.bind(this);

  private boundDoTopRowDrag = this.doTopRowDrag.bind(this);
  private boundStopTopRowDrag = this.stopTopRowDrag.bind(this);
  private boundDoVoiceDrag = this.doVoiceDrag.bind(this);
  private boundStopVoiceDrag = this.stopVoiceDrag.bind(this);

  constructor() {
    afterNextRender(async () => {
      const containerEl = this.mainContainer()?.nativeElement;
      if (!containerEl) return;

      // Initialize Dimensions
      const containerWidth = containerEl.offsetWidth;
      const containerHeight = containerEl.offsetHeight;
      this.inputPanelWidth.set(containerWidth * 0.5);
      this.topSectionHeight.set(containerHeight * 0.4);
      this.voiceHeight.set(containerHeight * 0.2); // New default

      this.checkApiKey();
    });

    // Auto-expand analysis when a part is selected or clicked
    effect(() => {
      this.state.uiExpandTrigger(); // Listen to explicit selection actions
      const partId = this.state.selectedPartId();
      if (partId) {
        untracked(() => {
          this.isAnalysisCollapsed.set(false);
          this.isChartCollapsed.set(false);
        });
      }
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

  toggleChart() {
    this.isChartCollapsed.update(v => !v);
  }

  toggleAnalysis() {
    this.isAnalysisCollapsed.update(v => !v);
  }

  maximizeChart() {
    this.isChartCollapsed.set(false);
    this.isAnalysisCollapsed.set(true);
  }

  maximizeAnalysis() {
    this.isChartCollapsed.set(true);
    this.isAnalysisCollapsed.set(false);
  }

  // --- Column Resizing Logic ---
  startColumnDrag(event: MouseEvent): void {
    event.preventDefault();
    this.isDraggingColumn.set(true);
    this.initialColumnDragX = event.clientX;
    this.initialInputPanelWidth = this.inputPanelWidth();

    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', this.boundDoColumnDrag);
    document.addEventListener('mouseup', this.boundStopColumnDrag, { once: true });
  }

  private doColumnDrag(event: MouseEvent): void {
    if (!this.isDraggingColumn()) return;

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
    this.isDraggingColumn.set(false);
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', this.boundDoColumnDrag);

    // Snappy behavior: if released near the center (55%), snap to it
    const containerWidth = this.mainContainer()?.nativeElement.offsetWidth ?? window.innerWidth;
    const currentPercent = (this.inputPanelWidth() / containerWidth) * 100;

    if (Math.abs(currentPercent - 50) < 5) {
      this.inputPanelWidth.set(containerWidth * 0.50);
    }
  }

  // --- Top Row Resizing Logic ---
  startTopRowDrag(event: MouseEvent): void {
    event.preventDefault();
    this.isDraggingTopRow.set(true);
    this.initialTopRowDragY = event.clientY;
    this.initialTopSectionHeight = this.topSectionHeight();

    document.body.style.cursor = 'row-resize';
    document.addEventListener('mousemove', this.boundDoTopRowDrag);
    document.addEventListener('mouseup', this.boundStopTopRowDrag, { once: true });
  }

  private doTopRowDrag(event: MouseEvent): void {
    if (!this.isDraggingTopRow()) return;

    const deltaY = event.clientY - this.initialTopRowDragY;

    // Find right column parent height
    const containerEl = document.querySelector('.flex-col.gap-6') as HTMLElement;
    const containerHeight = containerEl ? containerEl.offsetHeight : (this.mainContainer()?.nativeElement.offsetHeight ?? window.innerHeight);

    const newHeight = this.initialTopSectionHeight + deltaY;
    const minTopHeight = 200;
    const minBottomHeight = 200;
    const resizerHeight = 8; // one resizer

    const maxTopHeight = containerHeight - minBottomHeight - resizerHeight;

    const computedNewHeight = Math.max(minTopHeight, Math.min(newHeight, maxTopHeight));
    this.topSectionHeight.set(computedNewHeight);
  }

  private stopTopRowDrag(): void {
    this.isDraggingTopRow.set(false);
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', this.boundDoTopRowDrag);
  }

  resetColumnWidth(): void {
    const containerWidth = this.mainContainer()?.nativeElement.offsetWidth ?? window.innerWidth;
    this.inputPanelWidth.set(containerWidth * 0.50);
  }

  resetRowHeights(): void {
    const containerHeight = this.mainContainer()?.nativeElement.offsetHeight ?? window.innerHeight;
    this.topSectionHeight.set(containerHeight * 0.40);
    this.voiceHeight.set(containerHeight * 0.20);
  }

  maximizeReport(): void {
    this.topSectionHeight.set(200);
  }

  maximizeSummary(): void {
    const containerHeight = this.mainContainer()?.nativeElement.offsetHeight ?? window.innerHeight;
    this.topSectionHeight.set(containerHeight - 300); // give mostly to summary
  }

  // --- Voice Panel Resizing Logic ---
  startVoiceDrag(event: MouseEvent): void {
    event.preventDefault();
    this.isDraggingVoice.set(true);
    this.initialVoiceDragY = event.clientY;
    this.initialVoiceHeight = this.voiceHeight();

    document.body.style.cursor = 'row-resize';
    document.addEventListener('mousemove', this.boundDoVoiceDrag);
    document.addEventListener('mouseup', this.boundStopVoiceDrag, { once: true });
  }

  private doVoiceDrag(event: MouseEvent): void {
    if (!this.isDraggingVoice()) return;

    // Since the panel is at the bottom, moving the mouse UP (negative deltaY) should INCREASE its height
    const deltaY = event.clientY - this.initialVoiceDragY;
    const newHeight = this.initialVoiceHeight - deltaY;

    const containerEl = document.querySelector('.flex-col.gap-6') as HTMLElement;
    const containerHeight = containerEl ? containerEl.offsetHeight : (this.mainContainer()?.nativeElement.offsetHeight ?? window.innerHeight);

    const minVoiceHeight = 100;
    const minOtherHeight = 300; // Leave space for summary and analysis
    const resizerHeight = 8;
    const maxVoiceHeight = containerHeight - minOtherHeight - resizerHeight;

    const computedNewHeight = Math.max(minVoiceHeight, Math.min(newHeight, maxVoiceHeight));
    this.voiceHeight.set(computedNewHeight);
  }

  private stopVoiceDrag(): void {
    this.isDraggingVoice.set(false);
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', this.boundDoVoiceDrag);
  }
}