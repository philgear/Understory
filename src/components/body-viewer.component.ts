import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientStateService } from '../services/patient-state.service';

@Component({
  selector: 'app-body-viewer',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center h-full w-full relative">
      
      <!-- Minimalist View Toggle -->
      <div class="absolute top-0 right-4 flex text-[10px] font-bold tracking-widest uppercase gap-4">
        <button 
          (click)="view.set('front')" 
          class="pb-1 border-b-2 transition-colors"
          [class.border-slate-900]="view() === 'front'"
          [class.text-slate-900]="view() === 'front'"
          [class.border-transparent]="view() !== 'front'"
          [class.text-slate-400]="view() !== 'front'">
          Front
        </button>
        <button 
          (click)="view.set('back')" 
          class="pb-1 border-b-2 transition-colors"
          [class.border-slate-900]="view() === 'back'"
          [class.text-slate-900]="view() === 'back'"
          [class.border-transparent]="view() !== 'back'"
          [class.text-slate-400]="view() !== 'back'">
          Back
        </button>
      </div>

      <!-- SVG Body -->
      <svg viewBox="0 0 200 450" class="h-[85%] w-auto">
        <g>
        @if (view() === 'front') {
            <!-- Head -->
            <path id="head" d="M100,20 C85,20 80,40 80,55 C80,75 120,75 120,55 C120,40 115,20 100,20 Z" 
                  [class]="getPartClass('head')" (click)="select('head', 'Head & Neck')"/>
            
            <!-- Torso (Chest) -->
            <path id="chest" d="M80,55 L120,55 L125,120 L75,120 Z" 
                  [class]="getPartClass('chest')" (click)="select('chest', 'Chest & Upper Torso')"/>
            
            <!-- Abdomen -->
            <path id="abdomen" d="M75,120 L125,120 L120,170 L80,170 Z" 
                  [class]="getPartClass('abdomen')" (click)="select('abdomen', 'Abdomen & Stomach')"/>
            
            <!-- Pelvis -->
            <path id="pelvis" d="M80,170 L120,170 L115,200 L85,200 Z" 
                  [class]="getPartClass('pelvis')" (click)="select('pelvis', 'Pelvis & Hips')"/>

            <!-- Left Arm (Viewer's Left, Patient's Right) -->
            <path id="r_shoulder" d="M75,120 L80,55 L50,70 L55,110 Z" 
                   [class]="getPartClass('r_shoulder')" (click)="select('r_shoulder', 'Right Shoulder')"/>
            <path id="r_arm" d="M55,110 L50,70 L30,150 L45,160 Z" 
                  [class]="getPartClass('r_arm')" (click)="select('r_arm', 'Right Arm')"/>
            <path id="r_hand" d="M45,160 L30,150 L25,180 L40,185 Z" 
                  [class]="getPartClass('r_hand')" (click)="select('r_hand', 'Right Hand')"/>

            <!-- Right Arm (Viewer's Right, Patient's Left) -->
            <path id="l_shoulder" d="M125,120 L120,55 L150,70 L145,110 Z" 
                  [class]="getPartClass('l_shoulder')" (click)="select('l_shoulder', 'Left Shoulder')"/>
            <path id="l_arm" d="M145,110 L150,70 L170,150 L155,160 Z" 
                  [class]="getPartClass('l_arm')" (click)="select('l_arm', 'Left Arm')"/>
            <path id="l_hand" d="M155,160 L170,150 L175,180 L160,185 Z" 
                  [class]="getPartClass('l_hand')" (click)="select('l_hand', 'Left Hand')"/>

            <!-- Left Leg (Viewer's Left, Patient's Right) -->
            <path id="r_thigh" d="M85,200 L100,200 L95,300 L75,290 Z" 
                  [class]="getPartClass('r_thigh')" (click)="select('r_thigh', 'Right Thigh')"/>
            <path id="r_shin" d="M75,290 L95,300 L90,400 L70,390 Z" 
                  [class]="getPartClass('r_shin')" (click)="select('r_shin', 'Right Lower Leg')"/>
            <path id="r_foot" d="M70,390 L90,400 L85,420 L60,420 Z" 
                  [class]="getPartClass('r_foot')" (click)="select('r_foot', 'Right Foot')"/>

            <!-- Right Leg (Viewer's Right, Patient's Left) -->
            <path id="l_thigh" d="M100,200 L115,200 L125,290 L105,300 Z" 
                  [class]="getPartClass('l_thigh')" (click)="select('l_thigh', 'Left Thigh')"/>
            <path id="l_shin" d="M125,290 L105,300 L110,390 L130,400 Z" 
                  [class]="getPartClass('l_shin')" (click)="select('l_shin', 'Left Lower Leg')"/>
            <path id="l_foot" d="M130,400 L110,390 L115,420 L140,420 Z" 
                  [class]="getPartClass('l_foot')" (click)="select('l_foot', 'Left Foot')"/>
        }

        @if (view() === 'back') {
            <!-- Head Back -->
            <path id="head_back" d="M100,20 C85,20 80,40 80,55 C80,75 120,75 120,55 C120,40 115,20 100,20 Z" 
                  [class]="getPartClass('head')" (click)="select('head', 'Head & Neck (Back)')"/>
            
            <!-- Upper Back -->
            <path id="upper_back" d="M80,55 L120,55 L125,110 L75,110 Z" 
                  [class]="getPartClass('upper_back')" (click)="select('upper_back', 'Upper Back')"/>
            
            <!-- Lower Back -->
            <path id="lower_back" d="M75,110 L125,110 L120,170 L80,170 Z" 
                  [class]="getPartClass('lower_back')" (click)="select('lower_back', 'Lower Back')"/>
            
            <!-- Glutes -->
            <path id="glutes" d="M80,170 L120,170 L125,210 L75,210 Z" 
                  [class]="getPartClass('glutes')" (click)="select('glutes', 'Glutes & Hips')"/>

            <!-- Arms Back (Left = Patient Left on back view) -->
            <path id="l_shoulder_back" d="M75,110 L80,55 L50,70 L55,110 Z" 
                   [class]="getPartClass('l_shoulder')" (click)="select('l_shoulder', 'Left Shoulder (Back)')"/>
            <path id="l_arm_back" d="M55,110 L50,70 L30,150 L45,160 Z" 
                  [class]="getPartClass('l_arm')" (click)="select('l_arm', 'Left Arm (Back)')"/>
            
             <!-- Arms Back (Right) -->
            <path id="r_shoulder_back" d="M125,110 L120,55 L150,70 L145,110 Z" 
                  [class]="getPartClass('r_shoulder')" (click)="select('r_shoulder', 'Right Shoulder (Back)')"/>
            <path id="r_arm_back" d="M145,110 L150,70 L170,150 L155,160 Z" 
                  [class]="getPartClass('r_arm')" (click)="select('r_arm', 'Right Arm (Back)')"/>

            <!-- Legs Back -->
            <path id="l_thigh_back" d="M85,210 L100,210 L95,300 L75,290 Z" 
                  [class]="getPartClass('l_thigh')" (click)="select('l_thigh', 'Left Thigh (Back)')"/>
             <path id="l_shin_back" d="M75,290 L95,300 L90,400 L70,390 Z" 
                  [class]="getPartClass('l_shin')" (click)="select('l_shin', 'Left Calves')"/>

            <path id="r_thigh_back" d="M100,210 L115,210 L125,290 L105,300 Z" 
                  [class]="getPartClass('r_thigh')" (click)="select('r_thigh', 'Right Thigh (Back)')"/>
            <path id="r_shin_back" d="M125,290 L105,300 L110,390 L130,400 Z" 
                  [class]="getPartClass('r_shin')" (click)="select('r_shin', 'Right Calves')"/>
        }
        </g>
      </svg>
      
    </div>
  `
})
export class BodyViewerComponent {
  state = inject(PatientStateService);
  view = signal<'front' | 'back'>('front');
  
  // Local state to track the item currently animating before official selection
  tempSelectedId = signal<string | null>(null);

  select(id: string, name: string) {
    if (this.state.selectedPartId() === id) return;

    // 1. Trigger instant visual feedback (Flash)
    this.tempSelectedId.set(id);

    // 2. Wait for animation to register before showing the form (UI pacing)
    setTimeout(() => {
      this.state.selectPart(id);
      
      if (!this.state.issues()[id]) {
        this.state.updateIssue(id, {
          id,
          name,
          painLevel: 0,
          description: '',
          symptoms: []
        });
      }
      
      // Handover style control to the global selected state
      this.tempSelectedId.set(null);
    }, 450); // Matches the flash-active animation peak/duration
  }

  getPartClass(id: string): string {
    const isSelected = this.state.selectedPartId() === id;
    const isAnimating = this.tempSelectedId() === id;
    const hasIssue = this.state.hasIssue(id) && this.state.issues()[id].painLevel > 0;
    
    let classes = 'body-part';
    
    if (isAnimating) {
        classes += ' highlight-anim';
    } else if (isSelected) {
        classes += ' selected';
    } 
    
    if (hasIssue) {
        classes += ' has-issue';
    }
    
    return classes;
  }
}