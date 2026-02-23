import { Component, ChangeDetectionStrategy, inject, signal, computed, OnDestroy, effect, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientStateService, BodyPartIssue } from '../services/patient-state.service';
import { PatientManagementService } from '../services/patient-management.service';
import { Body3DViewerComponent } from './body-3d-viewer.component';

@Component({
  selector: 'app-body-viewer',
  standalone: true,
  imports: [CommonModule, Body3DViewerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `    
    <div class="flex flex-col items-center justify-center h-full w-full relative">
      
      <!-- Tooltip -->
      @if (tooltipVisible()) {
        <div class="absolute bg-[#1C1C1C] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm pointer-events-none shadow-lg z-50"
             [style.left.px]="tooltipX()"
             [style.top.px]="tooltipY()"
             [style.transform]="'translate(-50%, 0)'">
          {{ tooltipText() }}
        </div>
      }

      <!-- Main Viewer Area -->
      <div class="h-full w-full relative flex items-center justify-center overflow-hidden">
        @if (state.bodyViewerMode() === '3d') {
          <app-body-3d-viewer 
            class="w-full h-full"
            [isInternal]="state.isInternalView()"
            (partSelected)="onPartSelected($event)">
          </app-body-3d-viewer>
        } @else {
          <!-- 2D SVG Schematic -->
          <div class="h-full w-full flex items-center justify-center p-4">
            <svg viewBox="0 0 200 450" class="h-full w-auto relative z-10 drop-shadow-sm">
              <g [attr.transform]="bodyTransform()">
                @if (view() === 'front') {
                  <g id="static-anatomy-front">
                    <path class="skin-base" [attr.d]="fullBodySkinPathFront()" [class.opacity-20]="state.isInternalView()" />
                    <g class="skeleton-layer" [class.opacity-100]="state.isInternalView()" [class.opacity-40]="!state.isInternalView()">
                      <path class="skeleton-path" d="M100 18 C 90 18, 85 24, 85 38 V 48 H 115 V 38 C 115 24, 110 18, 100 18 Z M 95 54 C 92 58, 93 62, 98 62 H 102 C 107 62, 108 58, 105 54 Z" />
                      <path class="skeleton-path" d="M100 65 V 170 M 82 75 H 118 M 80 85 C 85 95, 85 115, 80 125 M 120 85 C 115 95, 115 115, 120 125 M 82 100 H 118 M 85 115 H 115" />
                    </g>
                    <g id="regions-2d-front">
                      <!-- Head -->
                      <path d="M100 18 C 88 18, 82 25, 82 40 V 65 H 118 V 40 C 118 25, 112 18, 100 18 Z" 
                            [class]="getPartClass('head')" 
                            (click)="select('head', 'Head & Neck')"
                            (mousemove)="showTooltip($event, 'Head & Neck')" 
                            (mouseleave)="hideTooltip()"/>
                    </g>
                  </g>
                }

                @if (view() === 'back') {
                  <g id="static-anatomy-back">
                    <path class="skin-base" [attr.d]="fullBodySkinPathBack()" [class.opacity-20]="state.isInternalView()" />
                    <g class="skeleton-layer" [class.opacity-100]="state.isInternalView()" [class.opacity-40]="!state.isInternalView()">
                      <path class="skeleton-path" d="M100 18 C 90 18, 85 24, 85 38 V 48 H 115 V 38 C 115 24, 110 18, 100 18 Z" />
                      <path class="skeleton-path" d="M100 65 V 170 M90 75 L80 85 L90 110 Z M110 75 L120 85 L110 110 Z" />
                    </g>
                    <g id="regions-2d-back">
                      <path d="M100 18 C 88 18, 82 25, 82 40 V 65 H 118 V 40 C 118 25, 112 18, 100 18 Z"
                            [class]="getPartClass('head')" 
                            (click)="select('head', 'Head & Neck (Back)')"
                            (mousemove)="showTooltip($event, 'Head & Neck (Back)')" 
                            (mouseleave)="hideTooltip()" />
                    </g>
                  </g>
                }
              </g>
            </svg>
          </div>

          <!-- 2D Direction Controls (Local to component as they only apply to 2D) -->
          <div class="absolute bottom-4 right-4 flex text-[8px] font-bold tracking-widest uppercase gap-1 z-20">
            <button (click)="view.set('front')" 
                    class="w-8 h-8 border transition-all flex items-center justify-center rounded-full shadow-sm"
                    [class.bg-black]="view() === 'front'"
                    [class.text-white]="view() === 'front'"
                    [class.bg-white]="view() !== 'front'"
                    [class.text-black]="view() !== 'front'">F</button>
            <button (click)="view.set('back')" 
                    class="w-8 h-8 border transition-all flex items-center justify-center rounded-full shadow-sm"
                    [class.bg-black]="view() === 'back'"
                    [class.text-white]="view() === 'back'"
                    [class.bg-white]="view() !== 'back'"
                    [class.text-black]="view() !== 'back'">B</button>
          </div>
        }
      </div>



      <!-- Manual Zoom/Reset Controls (Bottom Left) -->
      <div class="absolute bottom-4 left-4 flex flex-col gap-2 z-20 no-print">
         <button (click)="resetControls()" 
                 class="p-3 bg-white border border-[#EEEEEE] hover:bg-[#F8F8F8] rounded-full shadow-sm transition-all active:scale-95 text-gray-600 hover:text-black" 
                 title="Reset View">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        </button>
        @if (state.bodyViewerMode() === '3d') {
          <button (click)="zoomIn()" 
                  class="p-3 bg-white border border-[#EEEEEE] hover:bg-[#F8F8F8] rounded-full shadow-sm transition-all active:scale-95 text-gray-600 hover:text-black" 
                  title="Zoom In">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
          </button>
          <button (click)="zoomOut()" 
                  class="p-3 bg-white border border-[#EEEEEE] hover:bg-[#F8F8F8] rounded-full shadow-sm transition-all active:scale-95 text-gray-600 hover:text-black" 
                  title="Zoom Out">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg>
          </button>
        }
      </div>


    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; width: 100%; }
    .body-part { fill: transparent; stroke: transparent; cursor: pointer; transition: all 0.3s ease; outline: none; }
    .body-part:hover { fill: rgba(104, 159, 56, 0.1); stroke: rgba(104, 159, 56, 0.3); stroke-width: 1; }
    .body-part.selected { fill: rgba(104, 159, 56, 0.2); stroke: #689F38; stroke-width: 2; }
    .body-part.has-issue { fill: rgba(239, 68, 68, 0.1); stroke: rgba(239, 68, 68, 0.4); stroke-width: 1.5; stroke-dasharray: 4 2; }
    .body-part.has-issue.selected { fill: rgba(239, 68, 68, 0.2); stroke: #EF4444; stroke-width: 2.5; stroke-dasharray: none; }
    .skin-base { fill: #FDFDFD; stroke: #E0E0E0; stroke-width: 1; transition: opacity 0.5s ease; }
    .skeleton-layer { pointer-events: none; transition: opacity 0.5s ease; }
    .skeleton-path { fill: none; stroke: #EEEEEE; stroke-width: 1.5; stroke-linecap: round; }
    .skeleton-joint { fill: #EEEEEE; }
    .highlight-anim { animation: highlight-pulse 0.5s ease-out; }
    @keyframes highlight-pulse {
      0% { fill: rgba(104, 159, 56, 0); stroke-width: 1; }
      50% { fill: rgba(104, 159, 56, 0.4); stroke-width: 4; }
      100% { fill: rgba(104, 159, 56, 0.2); stroke-width: 2; }
    }
  `]
})
export class BodyViewerComponent implements OnDestroy {
  state = inject(PatientStateService);
  patientManagement = inject(PatientManagementService);

  view = signal<'front' | 'back' | 'side_right' | 'side_left'>('front');

  tempSelectedId = signal<string | null>(null);
  tooltipText = signal<string>('');
  tooltipVisible = signal<boolean>(false);
  tooltipX = signal<number>(0);
  tooltipY = signal<number>(0);
  manualZoom = signal(1);



  selectedPatient = computed(() => {
    const id = this.patientManagement.selectedPatientId();
    if (!id) return null;
    return this.patientManagement.patients().find(p => p.id === id);
  });

  ngOnDestroy() { }

  private parseHeightInInches(heightStr: string): number | null {
    if (!heightStr) return null;
    const match = heightStr.match(/(\d+)'(\d+)/);
    if (match) {
      const feet = parseInt(match[1], 10) || 0;
      const inches = parseInt(match[2], 10) || 0;
      const total = feet * 12 + inches;
      return total > 0 ? total : null;
    }
    return null;
  }

  bodyTransform = computed(() => {
    const patient = this.selectedPatient();
    const vitals = this.state.vitals();
    let scaleX = 1;
    let scaleY = 1;
    if (patient && vitals.height && vitals.weight) {
      const heightInInches = this.parseHeightInInches(vitals.height);
      const weightInLbs = parseInt(vitals.weight, 10);
      if (heightInInches && !isNaN(weightInLbs)) {
        const baseHeightInches = 68;
        const baseBmi = 22;
        const bmi = (weightInLbs / (heightInInches * heightInInches)) * 703;
        scaleY = heightInInches / baseHeightInches;
        scaleX = 1 + ((bmi - baseBmi) / baseBmi) * 0.4;
        scaleY = Math.max(0.85, Math.min(scaleY, 1.15));
        scaleX = Math.max(0.8, Math.min(scaleX, 1.2));
      }
    }
    const finalScaleX = scaleX * this.manualZoom();
    const finalScaleY = scaleY * this.manualZoom();
    const cx = 100;
    const cy = 225;
    return `translate(${cx}, ${cy}) scale(${finalScaleX}, ${finalScaleY}) translate(${- cx}, ${- cy})`;
  });

  fullBodySkinPathFront = computed(() => "M82 40 C 82 25 88 18 100 18 S 118 25 118 40 V 65 L 122 70 L 132 110 L 148 158 L 160 180 L 165 190 L 155 195 L 150 185 L 138 160 L 122 115 L 122 125 L 118 170 L 115 205 L 122 295 L 127 395 L 135 420 L 140 430 H 120 L 115 420 L 110 400 L 105 300 H 115 H 100 H 85 H 95 L 90 400 L 85 420 L 80 430 H 60 L 65 420 L 73 395 L 78 295 L 85 205 L 82 170 L 78 125 L 78 115 L 62 160 L 50 185 L 45 195 L 35 190 L 40 180 L 52 158 L 68 110 L 78 70 L 82 65 Z");
  fullBodySkinPathBack = computed(() => "M82 40 C 82 25 88 18 100 18 S 118 25 118 40 V 65 L 122 70 L 132 110 L 148 158 L 160 180 L 165 190 L 155 195 L 150 185 L 138 160 L 122 115 L 120 120 L 115 170 L 120 205 L 122 295 L 127 395 L 135 420 L 140 430 H 120 L 115 420 L 110 400 L 105 300 H 115 H 100 H 85 H 95 L 90 400 L 85 420 L 80 430 H 60 L 65 420 L 73 395 L 78 295 L 80 205 L 85 170 L 80 120 L 78 115 L 62 160 L 50 185 L 45 195 L 35 190 L 40 180 L 52 158 L 68 110 L 78 70 L 82 65 Z");

  select(id: string, name: string) {
    this.tempSelectedId.set(id);

    // Provide a small animation window for the flash, but update the actual state immediately
    // so the UI can react without a race condition.
    this.state.selectPart(id);
    const issuesForPart = this.state.issues()[id];

    if (issuesForPart && issuesForPart.length > 0) {
      this.state.selectNote(issuesForPart[0].noteId);
    } else if (!this.state.viewingPastVisit()) {
      // Create a new note only if we are taking notes for current visit
      const newNoteId = `note_${Date.now()}`;
      const newNote: BodyPartIssue = {
        id,
        noteId: newNoteId,
        name,
        painLevel: 0,
        description: '',
        symptoms: []
      };
      this.state.updateIssue(id, newNote);
      this.state.selectNote(newNoteId);
    }

    // Temporary highlight flash effect
    setTimeout(() => {
      this.tempSelectedId.set(null);
    }, 500);
  }

  getPartClass(id: string): string {
    const isSelected = this.state.selectedPartId() === id;
    const isAnimating = this.tempSelectedId() === id;
    const hasIssue = this.state.hasPainfulIssue(id);
    let classes = 'body-part';
    if (isAnimating) { classes += ' highlight-anim'; }
    else if (isSelected) { classes += ' selected'; }
    if (hasIssue) { classes += ' has-issue'; }
    return classes;
  }

  showTooltip(event: MouseEvent, name: string) {
    const hostRect = (event.currentTarget as SVGElement).closest('div')!.getBoundingClientRect();
    this.tooltipText.set(name);
    this.tooltipVisible.set(true);
    this.tooltipX.set(event.clientX - hostRect.left);
    this.tooltipY.set(event.clientY - hostRect.top + 20);
  }

  hideTooltip() {
    this.tooltipVisible.set(false);
  }

  zoomIn() { this.manualZoom.update(z => parseFloat((z + 0.1).toFixed(2))); }
  zoomOut() { this.manualZoom.update(z => parseFloat(Math.max(z - 0.1, 0.5).toFixed(2))); }
  resetControls() { this.manualZoom.set(1); }

  onPartSelected(event: { id: string, name: string }) {
    this.select(event.id, event.name);
  }
}
