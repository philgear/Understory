import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MedicalChartSummaryComponent } from './medical-summary.component';
import { AnalysisReportComponent } from './analysis-report.component';

@Component({
  selector: 'app-analysis-container',
  standalone: true,
  imports: [CommonModule, MedicalChartSummaryComponent, AnalysisReportComponent],
  template: `
    <div class="flex flex-col h-full w-full overflow-hidden bg-[#F9FAFB] p-6 gap-6">

      <!-- Restore Bar (Top) - Only visible if Report is Maximized -->
      @if (layoutState() === 'reportMax') {
        <button (click)="setLayout('split')" 
                class="shrink-0 h-8 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors text-[10px] font-bold uppercase tracking-widest text-gray-500 z-30 mb-2">
           Show Medical Summary
        </button>
      }

      <!-- Summary Section -->
      <div class="overflow-hidden flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md" 
           [class.hidden]="layoutState() === 'reportMax'"
           [class.flex-1]="layoutState() === 'summaryMax'"
           [class.shrink-0]="layoutState() === 'split'"
           [style.height.px]="layoutState() === 'split' ? summaryHeight() : null">
        
        <!-- Card Header -->
        <div class="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
            <div class="flex items-center gap-2">
                <div class="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
                <span class="text-[10px] font-bold uppercase tracking-widest text-gray-500">Patient Overview</span>
            </div>
            <div class="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 rounded-full border border-indigo-100">
                <div class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                <span class="text-[10px] font-medium text-indigo-700 uppercase tracking-wide">Live Summary</span>
            </div>
        </div>

        <!-- Card Body -->
        <div class="flex-1 overflow-y-auto">
            <app-medical-summary></app-medical-summary>
        </div>
      </div>

      <!-- Divider (Split Mode Only) -->
      @if (layoutState() === 'split') {
          <div class="shrink-0 h-4 flex items-center justify-center cursor-row-resize z-20 no-print group relative"
               (mousedown)="startDrag($event)"
               (dblclick)="setLayout('reportMax')"
               title="Drag to resize, Double-click to maximize report">
               
               <!-- Handle -->
               <div class="w-12 h-1.5 rounded-full bg-gray-200 group-hover:bg-gray-300 transition-colors"></div>

               <!-- Quick Actions -->
               <div class="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 bg-white shadow-sm border border-gray-200 rounded-md p-1">
                  <button (click)="$event.stopPropagation(); setLayout('summaryMax')" class="p-1 hover:bg-gray-100 rounded text-gray-500" title="Maximize Summary">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 15l7-7 7 7"/></svg>
                  </button>
                  <button (click)="$event.stopPropagation(); setLayout('reportMax')" class="p-1 hover:bg-gray-100 rounded text-gray-500" title="Maximize Report">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 9l-7 7-7-7"/></svg>
                  </button>
               </div>
          </div>
      }

      <!-- Report Section -->
      <div class="flex-1 min-h-0 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md" [class.hidden]="layoutState() === 'summaryMax'">
        <!-- Card Header -->
        <div class="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
            <div class="flex items-center gap-2">
                <div class="w-1.5 h-4 bg-purple-500 rounded-full"></div>
                <span class="text-[10px] font-bold uppercase tracking-widest text-gray-500">AI-Powered Analysis</span>
            </div>
            <div class="flex items-center gap-1.5 px-2 py-1 bg-purple-50 rounded-full border border-purple-100">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6v6l4 2"/></svg>
                <span class="text-[10px] font-medium text-purple-700 uppercase tracking-wide">Analysis Engine</span>
            </div>
        </div>

        <!-- Card Body -->
        <div class="flex-1 overflow-y-auto">
            <app-analysis-report></app-analysis-report>
        </div>
      </div>

      <!-- Restore Bar (Bottom) - Only visible if Summary is Maximized -->
      @if (layoutState() === 'summaryMax') {
        <button (click)="setLayout('split')" 
                class="shrink-0 h-8 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors text-[10px] font-bold uppercase tracking-widest text-gray-500 z-30 mt-2">
           Show Analysis Report
        </button>
      }

    </div>
  `
})
export class AnalysisContainerComponent {
  summaryHeight = signal<number>(350);
  layoutState = signal<'split' | 'summaryMax' | 'reportMax'>('split');
  
  private boundDoDrag = this.doDrag.bind(this);
  private boundStopDrag = this.stopDrag.bind(this);
  private initialDragY: number = 0;
  private initialSummaryHeight: number = 0;

  setLayout(state: 'split' | 'summaryMax' | 'reportMax') {
    this.layoutState.set(state);
  }

  startDrag(event: MouseEvent): void {
    event.preventDefault();
    this.initialDragY = event.clientY;
    this.initialSummaryHeight = this.summaryHeight();
    document.body.style.cursor = 'row-resize';
    document.addEventListener('mousemove', this.boundDoDrag);
    document.addEventListener('mouseup', this.boundStopDrag, { once: true });
  }

  private doDrag(event: MouseEvent): void {
    const deltaY = event.clientY - this.initialDragY;
    const newHeight = this.initialSummaryHeight + deltaY;
    this.summaryHeight.set(Math.max(150, Math.min(newHeight, window.innerHeight - 200)));
  }

  private stopDrag(): void {
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', this.boundDoDrag);
  }
}
