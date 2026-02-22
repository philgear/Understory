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
        <div class="shrink-0 h-4 flex items-center justify-center z-20 no-print mb-2 group relative">
          <!-- Hidden Handle Line (for visual consistency) -->
          <div class="w-12 h-1.5 rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors cursor-pointer" (click)="setLayout('split')"></div>
          
          <!-- Persistent Icon Action -->
          <div class="absolute top-1/2 -translate-y-1/2 flex gap-2 bg-white shadow-sm border border-gray-200 rounded-md p-1">
            <button (click)="setLayout('split')" class="p-1 hover:bg-gray-100 rounded text-gray-500" title="Restore Split View">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 15l7-7 7 7"/></svg>
            </button>
          </div>
        </div>
      }

      <!-- Summary Section -->
      <div class="overflow-hidden flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md" 
           [class.hidden]="layoutState() === 'reportMax'"
           [class.flex-1]="layoutState() === 'summaryMax'"
           [class.shrink-0]="layoutState() === 'split'"
           [style.height.px]="layoutState() === 'split' ? summaryHeight() : null">
        


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


        <!-- Card Body -->
        <div class="flex-1 overflow-y-auto">
            <app-analysis-report></app-analysis-report>
        </div>
      </div>

      <!-- Restore Bar (Bottom) - Only visible if Summary is Maximized -->
      @if (layoutState() === 'summaryMax') {
        <div class="shrink-0 h-4 flex items-center justify-center z-20 no-print mt-2 group relative">
          <!-- Hidden Handle Line (for visual consistency) -->
          <div class="w-12 h-1.5 rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors cursor-pointer" (click)="setLayout('split')"></div>
          
          <!-- Persistent Icon Action -->
          <div class="absolute top-1/2 -translate-y-1/2 flex gap-2 bg-white shadow-sm border border-gray-200 rounded-md p-1">
            <button (click)="setLayout('split')" class="p-1 hover:bg-gray-100 rounded text-gray-500" title="Restore Split View">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 9l-7 7-7-7"/></svg>
            </button>
          </div>
        </div>
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
