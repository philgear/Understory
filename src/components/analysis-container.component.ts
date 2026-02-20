import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MedicalChartSummaryComponent } from './medical-summary.component';
import { AnalysisReportComponent } from './analysis-report.component';

@Component({
  selector: 'app-analysis-container',
  standalone: true,
  imports: [CommonModule, MedicalChartSummaryComponent, AnalysisReportComponent],
  template: `
    <div class="flex flex-col h-full w-full overflow-hidden">

      <!-- Restore Bar (Top) - Only visible if Report is Maximized -->
      @if (layoutState() === 'reportMax') {
        <button (click)="setLayout('split')" 
                class="shrink-0 h-6 bg-gray-50 border-b border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors text-[10px] font-bold uppercase tracking-widest text-gray-500 z-30">
           Show Medical Summary
        </button>
      }

      <!-- Summary Section -->
      <div class="overflow-y-auto bg-white" 
           [class.hidden]="layoutState() === 'reportMax'"
           [class.flex-1]="layoutState() === 'summaryMax'"
           [class.shrink-0]="layoutState() === 'split'"
           [style.height.px]="layoutState() === 'split' ? summaryHeight() : null">
        <app-medical-summary></app-medical-summary>
      </div>

      <!-- Divider (Split Mode Only) -->
      @if (layoutState() === 'split') {
          <div class="shrink-0 h-3 bg-gray-50 hover:bg-gray-100 border-y border-gray-200 cursor-row-resize z-20 no-print flex items-center justify-center group relative transition-colors"
               (mousedown)="startDrag($event)"
               (dblclick)="setLayout('reportMax')"
               title="Drag to resize, Double-click to maximize report">
               
               <!-- Handle -->
               <div class="w-8 h-1 rounded-full bg-gray-300 group-hover:bg-gray-400 transition-colors"></div>

               <!-- Quick Actions -->
               <div class="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button (click)="$event.stopPropagation(); setLayout('summaryMax')" class="p-0.5 hover:bg-gray-200 rounded text-gray-500" title="Maximize Summary">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 15l7-7 7 7"/></svg>
                  </button>
                  <button (click)="$event.stopPropagation(); setLayout('reportMax')" class="p-0.5 hover:bg-gray-200 rounded text-gray-500" title="Maximize Report">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 9l-7 7-7-7"/></svg>
                  </button>
               </div>
          </div>
      }

      <!-- Report Section -->
      <div class="flex-1 min-h-0 bg-white" [class.hidden]="layoutState() === 'summaryMax'">
        <app-analysis-report></app-analysis-report>
      </div>

      <!-- Restore Bar (Bottom) - Only visible if Summary is Maximized -->
      @if (layoutState() === 'summaryMax') {
        <button (click)="setLayout('split')" 
                class="shrink-0 h-6 bg-gray-50 border-t border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors text-[10px] font-bold uppercase tracking-widest text-gray-500 z-30">
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
