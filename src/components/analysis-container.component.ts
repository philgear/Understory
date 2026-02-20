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
      <div class="overflow-y-auto shrink-0" [style.height.px]="summaryHeight()">
        <app-medical-summary></app-medical-summary>
      </div>
      <div (mousedown)="startDrag($event)" 
           class="shrink-0 h-2 bg-gray-100 hover:bg-gray-200 transition-colors cursor-row-resize z-20 no-print">
      </div>
      <div class="flex-1 min-h-0">
        <app-analysis-report></app-analysis-report>
      </div>
    </div>
  `
})
export class AnalysisContainerComponent {
  summaryHeight = signal<number>(350); 
  
  private boundDoDrag = this.doDrag.bind(this);
  private boundStopDrag = this.stopDrag.bind(this);
  private initialDragY: number = 0;
  private initialSummaryHeight: number = 0;

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
