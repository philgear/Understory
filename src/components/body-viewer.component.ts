import { Component, ChangeDetectionStrategy, inject, signal, computed, OnDestroy, effect, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientStateService, BodyPartIssue } from '../services/patient-state.service';
import { PatientManagementService, HistoryEntry } from '../services/patient-management.service';
import { VeoService } from '../services/veo.service';

@Component({
  selector: 'app-body-viewer',
  standalone: true,
  imports: [CommonModule],
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

      <!-- Minimalist View Toggle -->
      <div class="absolute top-4 right-4 flex text-[10px] font-bold tracking-widest uppercase gap-2 z-20">
        <button 
          (click)="manualRotation.set(0)" 
          class="px-3 py-2 border-b-2 transition-colors text-gray-500 hover:text-black"
          [class.border-black]="view() === 'front'"
          [class.text-black]="view() === 'front'"
          [class.border-transparent]="view() !== 'front'">
          Front
        </button>
        <button 
          (click)="manualRotation.set(180)" 
          class="px-3 py-2 border-b-2 transition-colors text-gray-500 hover:text-black"
          [class.border-black]="view() === 'back'"
          [class.text-black]="view() === 'back'"
          [class.border-transparent]="view() !== 'back'">
          Back
        </button>
        <button 
          (click)="manualRotation.set(90)" 
          class="px-3 py-2 border-b-2 transition-colors text-gray-500 hover:text-black"
          [class.border-black]="view() === 'side_right' || view() === 'side_left'"
          [class.text-black]="view() === 'side_right' || view() === 'side_left'"
          [class.border-transparent]="view() !== 'side_right' && view() !== 'side_left'">
          Side
        </button>
        <div class="w-px h-6 bg-gray-300 self-center mx-2"></div>
        <button 
          (click)="toggleInternalView()" 
          class="px-3 py-2 border-b-2 transition-colors text-gray-500 hover:text-black"
          [class.border-black]="isInternalView()"
          [class.text-black]="isInternalView()"
          [class.border-transparent]="!isInternalView()">
          {{ isInternalView() ? 'Internal' : 'External' }}
        </button>
      </div>

      <!-- Veo Generation Overlay -->
      @if (veo.state().isGenerating) {
        <div class="absolute inset-0 bg-white/80 backdrop-blur-sm z-40 flex flex-col items-center justify-center p-8 text-center">
          <div class="w-12 h-12 border-4 border-[#689F38] border-t-transparent rounded-full animate-spin mb-4"></div>
          <h3 class="text-sm font-bold uppercase tracking-widest mb-2">Generating 3D Rotation</h3>
          <p class="text-xs text-gray-500 max-w-xs">{{ veo.state().progress }}</p>
        </div>
      }

      <!-- SVG Body or Veo Video -->
      <div class="h-[85%] w-auto relative flex items-center justify-center">
        @if (veo.state().videoUrl) {
          <div class="relative h-full w-auto flex flex-col items-center">
            <video #veoVideo [src]="veo.state().videoUrl" class="h-full w-auto object-contain" loop muted playsinline></video>
            <div class="absolute bottom-[-40px] w-full px-4 flex flex-col items-center gap-2">
               <input type="range" min="0" max="360" [value]="normalizedRotation()" (input)="onRotationSliderInput($event)" 
                      class="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#689F38]">
               <span class="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Scrub to Rotate</span>
            </div>
            <button (click)="veo.reset()" class="absolute top-0 right-[-40px] p-2 text-gray-400 hover:text-red-500 transition-colors" title="Close 3D View">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        } @else {
          <svg viewBox="0 0 200 450" class="h-full w-auto relative z-10"
               (mousedown)="startDragRotation($event)"
               [class.cursor-grab]="!isDraggingRotation()"
               [class.cursor-grabbing]="isDraggingRotation()">
            <g [attr.transform]="bodyTransform()">
            @if (view() === 'front') {
              <g id="static-anatomy-front">
                <!-- Layer 2: Skin/Base -->
                <path class="skin-base" [attr.d]="fullBodySkinPathFront()" [class.opacity-20]="isInternalView()" />
                <!-- Layer 1: Skeleton -->
                <g class="skeleton-layer" [class.opacity-100]="isInternalView()" [class.opacity-40]="!isInternalView()">
                  <path class="skeleton-path" d="M100 18 C 90 18, 85 24, 85 38 V 48 H 115 V 38 C 115 24, 110 18, 100 18 Z M 95 54 C 92 58, 93 62, 98 62 H 102 C 107 62, 108 58, 105 54 Z" />
                  <path class="skeleton-path" d="M100 65 V 170 M 82 75 H 118 M 80 85 C 85 95, 85 115, 80 125 M 120 85 C 115 95, 115 115, 120 125 M 82 100 H 118 M 85 115 H 115" />
                  <path class="skeleton-path" d="M85 170 C 80 180, 80 195, 90 200 H 110 C 120 195, 120 180, 115 170 Z M 95 180 a 5 5 0 0 0 10 0 a 5 5 0 0 0 -10 0" />
                  <path class="skeleton-path" d="M78 78 L 65 110 L 58 155 M 122 78 L 135 110 L 142 155" />
                  <path class="skeleton-path" d="M58 155 L 50 178 M 142 155 L 150 178" />
                  <path class="skeleton-path" d="M92 202 L 82 295 M 108 202 L 118 295 M 82 295 L 77 395 M 118 295 L 123 395" />
                  <path class="skeleton-path" d="M77 395 L 72 415 M 123 395 L 128 415" />
                  <circle class="skeleton-joint" cx="78" cy="78" r="5" /> <circle class="skeleton-joint" cx="122" cy="78" r="5" />
                  <circle class="skeleton-joint" cx="65" cy="110" r="4" /> <circle class="skeleton-joint" cx="135" cy="110" r="4" />
                  <circle class="skeleton-joint" cx="58" cy="155" r="4" /> <circle class="skeleton-joint" cx="142" cy="155" r="4" />
                  <circle class="skeleton-joint" cx="92" cy="202" r="6" /> <circle class="skeleton-joint" cx="108" cy="202" r="6" />
                  <circle class="skeleton-joint" cx="82" cy="295" r="5" /> <circle class="skeleton-joint" cx="118" cy="295" r="5" />
                  <circle class="skeleton-joint" cx="77" cy="395" r="4" /> <circle class="skeleton-joint" cx="123" cy="395" r="4" />
                </g>
              </g>
          <g id="interactive-regions-front">
            <!-- Head -->
            <path id="head" d="M100 18 C 88 18, 82 25, 82 40 V 65 H 118 V 40 C 118 25, 112 18, 100 18 Z" 
                  tabindex="0" [attr.aria-label]="'Head & Neck'"
                  [class]="getPartClass('head')" (click)="select('head', 'Head & Neck')" (keydown.enter)="select('head', 'Head & Neck')"
                  (mousemove)="showTooltip($event, 'Head & Neck')" (mouseleave)="hideTooltip()"/>
            
            <!-- Torso (Chest) -->
            <path id="chest" [attr.d]="chestPath()"
                  tabindex="0" [attr.aria-label]="'Chest & Upper Torso'"
                  [class]="getPartClass('chest')" (click)="select('chest', 'Chest & Upper Torso')" (keydown.enter)="select('chest', 'Chest & Upper Torso')"
                  (mousemove)="showTooltip($event, 'Chest & Upper Torso')" (mouseleave)="hideTooltip()"/>
            
            <!-- Abdomen -->
            <path id="abdomen" d="M78 125 H 122 L 118 170 H 82 Z" 
                  tabindex="0" [attr.aria-label]="'Abdomen & Stomach'"
                  [class]="getPartClass('abdomen')" (click)="select('abdomen', 'Abdomen & Stomach')" (keydown.enter)="select('abdomen', 'Abdomen & Stomach')"
                  (mousemove)="showTooltip($event, 'Abdomen & Stomach')" (mouseleave)="hideTooltip()"/>
            
            <!-- Pelvis -->
            <path id="pelvis" [attr.d]="pelvisPath()"
                  tabindex="0" [attr.aria-label]="'Pelvis & Hips'"
                  [class]="getPartClass('pelvis')" (click)="select('pelvis', 'Pelvis & Hips')" (keydown.enter)="select('pelvis', 'Pelvis & Hips')"
                  (mousemove)="showTooltip($event, 'Pelvis & Hips')" (mouseleave)="hideTooltip()"/>

            <!-- Left Arm (Viewer's Left, Patient's Right) -->
            <path id="r_shoulder" [attr.d]="rShoulderPath()"
                   tabindex="0" [attr.aria-label]="'Right Shoulder'"
                   [class]="getPartClass('r_shoulder')" (click)="select('r_shoulder', 'Right Shoulder')" (keydown.enter)="select('r_shoulder', 'Right Shoulder')"
                   (mousemove)="showTooltip($event, 'Right Shoulder')" (mouseleave)="hideTooltip()"/>
            <path id="r_arm" d="M68 110 L 52 158 L 62 160 L 78 115 Z" 
                  tabindex="0" [attr.aria-label]="'Right Arm'"
                  [class]="getPartClass('r_arm')" (click)="select('r_arm', 'Right Arm')" (keydown.enter)="select('r_arm', 'Right Arm')"
                  (mousemove)="showTooltip($event, 'Right Arm')" (mouseleave)="hideTooltip()"/>
            <path id="r_hand" d="M52 158 L 40 180 L 50 185 L 62 160 Z" 
                  tabindex="0" [attr.aria-label]="'Right Hand & Wrist'"
                  [class]="getPartClass('r_hand')" (click)="select('r_hand', 'Right Hand & Wrist')" (keydown.enter)="select('r_hand', 'Right Hand & Wrist')"
                  (mousemove)="showTooltip($event, 'Right Hand & Wrist')" (mouseleave)="hideTooltip()"/>
            <g id="r_fingers" tabindex="0" [attr.aria-label]="'Right Fingers'"
               (click)="select('r_fingers', 'Right Fingers')" (keydown.enter)="select('r_fingers', 'Right Fingers')"
               (mousemove)="showTooltip($event, 'Right Fingers')" (mouseleave)="hideTooltip()">
                <path d="M40 180 L 35 190 L 45 195 L 50 185 Z" [class]="getPartClass('r_fingers')" />
            </g>

            <!-- Right Arm (Viewer's Right, Patient's Left) -->
            <path id="l_shoulder" [attr.d]="lShoulderPath()" 
                  tabindex="0" [attr.aria-label]="'Left Shoulder'"
                  [class]="getPartClass('l_shoulder')" (click)="select('l_shoulder', 'Left Shoulder')" (keydown.enter)="select('l_shoulder', 'Left Shoulder')"
                  (mousemove)="showTooltip($event, 'Left Shoulder')" (mouseleave)="hideTooltip()"/>
            <path id="l_arm" d="M132 110 L 148 158 L 138 160 L 122 115 Z" 
                  tabindex="0" [attr.aria-label]="'Left Arm'"
                  [class]="getPartClass('l_arm')" (click)="select('l_arm', 'Left Arm')" (keydown.enter)="select('l_arm', 'Left Arm')"
                  (mousemove)="showTooltip($event, 'Left Arm')" (mouseleave)="hideTooltip()"/>
            <path id="l_hand" d="M148 158 L 160 180 L 150 185 L 138 160 Z" 
                  tabindex="0" [attr.aria-label]="'Left Hand & Wrist'"
                  [class]="getPartClass('l_hand')" (click)="select('l_hand', 'Left Hand & Wrist')" (keydown.enter)="select('l_hand', 'Left Hand & Wrist')"
                  (mousemove)="showTooltip($event, 'Left Hand & Wrist')" (mouseleave)="hideTooltip()"/>
            <g id="l_fingers" tabindex="0" [attr.aria-label]="'Left Fingers'"
               (click)="select('l_fingers', 'Left Fingers')" (keydown.enter)="select('l_fingers', 'Left Fingers')"
               (mousemove)="showTooltip($event, 'Left Fingers')" (mouseleave)="hideTooltip()">
              <path d="M160 180 L 165 190 L 155 195 L 150 185 Z" [class]="getPartClass('l_fingers')" />
            </g>

            <!-- Left Leg (Viewer's Left, Patient's Right) -->
            <path id="r_thigh" d="M85 205 L 100 205 L 95 300 L 78 295 Z" 
                  tabindex="0" [attr.aria-label]="'Right Thigh'"
                  [class]="getPartClass('r_thigh')" (click)="select('r_thigh', 'Right Thigh')" (keydown.enter)="select('r_thigh', 'Right Thigh')"
                  (mousemove)="showTooltip($event, 'Right Thigh')" (mouseleave)="hideTooltip()"/>
            <path id="r_shin" d="M78 295 L 95 300 L 90 400 L 73 395 Z" 
                  tabindex="0" [attr.aria-label]="'Right Lower Leg'"
                  [class]="getPartClass('r_shin')" (click)="select('r_shin', 'Right Lower Leg')" (keydown.enter)="select('r_shin', 'Right Lower Leg')"
                  (mousemove)="showTooltip($event, 'Right Lower Leg')" (mouseleave)="hideTooltip()"/>
            <path id="r_foot" d="M73 395 L 90 400 L 85 420 L 65 420 Z" 
                  tabindex="0" [attr.aria-label]="'Right Foot'"
                  [class]="getPartClass('r_foot')" (click)="select('r_foot', 'Right Foot')" (keydown.enter)="select('r_foot', 'Right Foot')"
                  (mousemove)="showTooltip($event, 'Right Foot')" (mouseleave)="hideTooltip()"/>
            <g id="r_toes" tabindex="0" [attr.aria-label]="'Right Toes'"
               (click)="select('r_toes', 'Right Toes')" (keydown.enter)="select('r_toes', 'Right Toes')"
               (mousemove)="showTooltip($event, 'Right Toes')" (mouseleave)="hideTooltip()">
                <path d="M65 420 L 85 420 L 80 430 L 60 430 Z" [class]="getPartClass('r_toes')" />
            </g>

            <!-- Right Leg (Viewer's Right, Patient's Left) -->
            <path id="l_thigh" d="M100 205 L 115 205 L 122 295 L 105 300 Z" 
                  tabindex="0" [attr.aria-label]="'Left Thigh'"
                  [class]="getPartClass('l_thigh')" (click)="select('l_thigh', 'Left Thigh')" (keydown.enter)="select('l_thigh', 'Left Thigh')"
                  (mousemove)="showTooltip($event, 'Left Thigh')" (mouseleave)="hideTooltip()"/>
            <path id="l_shin" d="M122 295 L 105 300 L 110 400 L 127 395 Z" 
                  tabindex="0" [attr.aria-label]="'Left Lower Leg'"
                  [class]="getPartClass('l_shin')" (click)="select('l_shin', 'Left Lower Leg')" (keydown.enter)="select('l_shin', 'Left Lower Leg')"
                  (mousemove)="showTooltip($event, 'Left Lower Leg')" (mouseleave)="hideTooltip()"/>
            <path id="l_foot" d="M127 395 L 110 400 L 115 420 L 135 420 Z" 
                  tabindex="0" [attr.aria-label]="'Left Foot'"
                  [class]="getPartClass('l_foot')" (click)="select('l_foot', 'Left Foot')" (keydown.enter)="select('l_foot', 'Left Foot')"
                  (mousemove)="showTooltip($event, 'Left Foot')" (mouseleave)="hideTooltip()"/>
            <g id="l_toes" tabindex="0" [attr.aria-label]="'Left Toes'"
               (click)="select('l_toes', 'Left Toes')" (keydown.enter)="select('l_toes', 'Left Toes')"
               (mousemove)="showTooltip($event, 'Left Toes')" (mouseleave)="hideTooltip()">
                <path d="M135 420 L 115 420 L 120 430 L 140 430 Z" [class]="getPartClass('l_toes')" />
            </g>
          </g>
        }

        @if (view() === 'back') {
          <g id="static-anatomy-back">
            <!-- Layer 2: Skin/Base -->
            <path class="skin-base" [attr.d]="fullBodySkinPathBack()" />
            <!-- Layer 1: Skeleton -->
             <g class="skeleton-layer">
               <path class="skeleton-path" d="M100 18 C 90 18, 85 24, 85 38 V 48 H 115 V 38 C 115 24, 110 18, 100 18 Z" />
               <path class="skeleton-path" d="M100 65 V 170 M90 75 L80 85 L90 110 Z M110 75 L120 85 L110 110 Z" />
               <path class="skeleton-path" d="M78 78 L 65 110 L 58 155 M 122 78 L 135 110 L 142 155" />
               <path class="skeleton-path" d="M58 155 L 50 178 M 142 155 L 150 178" />
               <path class="skeleton-path" d="M85 170 C 80 180, 80 195, 90 200 H 110 C 120 195, 120 180, 115 170 Z M 95 180 a 5 5 0 0 0 10 0 a 5 5 0 0 0 -10 0" />
               <path class="skeleton-path" d="M92 202 L 82 295 M 108 202 L 118 295 M 82 295 L 77 395 M 118 295 L 123 395" />
               <path class="skeleton-path" d="M77 395 L 72 415 M 123 395 L 128 415" />
               <circle class="skeleton-joint" cx="78" cy="78" r="5" /> <circle class="skeleton-joint" cx="122" cy="78" r="5" />
               <circle class="skeleton-joint" cx="65" cy="110" r="4" /> <circle class="skeleton-joint" cx="135" cy="110" r="4" />
               <circle class="skeleton-joint" cx="58" cy="155" r="4" /> <circle class="skeleton-joint" cx="142" cy="155" r="4" />
               <circle class="skeleton-joint" cx="92" cy="202" r="6" /> <circle class="skeleton-joint" cx="108" cy="202" r="6" />
               <circle class="skeleton-joint" cx="82" cy="295" r="5" /> <circle class="skeleton-joint" cx="118" cy="295" r="5" />
               <circle class="skeleton-joint" cx="77" cy="395" r="4" /> <circle class="skeleton-joint" cx="123" cy="395" r="4" />
            </g>
          </g>
          <g id="interactive-regions-back">
            <!-- Head Back -->
            <path id="head_back" d="M100 18 C 88 18, 82 25, 82 40 V 65 H 118 V 40 C 118 25, 112 18, 100 18 Z" 
                  tabindex="0" [attr.aria-label]="'Head & Neck (Back)'"
                  [class]="getPartClass('head')" (click)="select('head', 'Head & Neck (Back)')" (keydown.enter)="select('head', 'Head & Neck (Back)')"
                  (mousemove)="showTooltip($event, 'Head & Neck (Back)')" (mouseleave)="hideTooltip()"/>
            
            <!-- Upper Back -->
            <path id="upper_back" [attr.d]="upperBackPath()" 
                  tabindex="0" [attr.aria-label]="'Upper Back'"
                  [class]="getPartClass('upper_back')" (click)="select('upper_back', 'Upper Back')" (keydown.enter)="select('upper_back', 'Upper Back')"
                  (mousemove)="showTooltip($event, 'Upper Back')" (mouseleave)="hideTooltip()"/>
            
            <!-- Lower Back -->
            <path id="lower_back" d="M80 120 H 120 L 115 170 H 85 Z" 
                  tabindex="0" [attr.aria-label]="'Lower Back'"
                  [class]="getPartClass('lower_back')" (click)="select('lower_back', 'Lower Back')" (keydown.enter)="select('lower_back', 'Lower Back')"
                  (mousemove)="showTooltip($event, 'Lower Back')" (mouseleave)="hideTooltip()"/>
            
            <!-- Glutes -->
            <path id="glutes" [attr.d]="glutesPath()" 
                  tabindex="0" [attr.aria-label]="'Glutes & Hips'"
                  [class]="getPartClass('glutes')" (click)="select('glutes', 'Glutes & Hips')" (keydown.enter)="select('glutes', 'Glutes & Hips')"
                  (mousemove)="showTooltip($event, 'Glutes & Hips')" (mouseleave)="hideTooltip()"/>

            <!-- Arms Back (Left = Patient Left on back view) -->
            <path id="l_shoulder_back" [attr.d]="lShoulderBackPath()" 
                   tabindex="0" [attr.aria-label]="'Left Shoulder (Back)'"
                   [class]="getPartClass('l_shoulder')" (click)="select('l_shoulder', 'Left Shoulder (Back)')" (keydown.enter)="select('l_shoulder', 'Left Shoulder (Back)')"
                   (mousemove)="showTooltip($event, 'Left Shoulder (Back)')" (mouseleave)="hideTooltip()"/>
            <path id="l_arm_back" d="M68 110 L 52 158 L 62 160 L 78 115 Z" 
                  tabindex="0" [attr.aria-label]="'Left Arm (Back)'"
                  [class]="getPartClass('l_arm')" (click)="select('l_arm', 'Left Arm (Back)')" (keydown.enter)="select('l_arm', 'Left Arm (Back)')"
                  (mousemove)="showTooltip($event, 'Left Arm (Back)')" (mouseleave)="hideTooltip()"/>
            <path id="l_hand_back" d="M52 158 L 40 180 L 50 185 L 62 160 Z" 
                  tabindex="0" [attr.aria-label]="'Left Hand & Wrist (Back)'"
                  [class]="getPartClass('l_hand')" (click)="select('l_hand', 'Left Hand & Wrist (Back)')" (keydown.enter)="select('l_hand', 'Left Hand & Wrist (Back)')"
                  (mousemove)="showTooltip($event, 'Left Hand & Wrist (Back)')" (mouseleave)="hideTooltip()"/>
            <g id="l_fingers_back" tabindex="0" [attr.aria-label]="'Left Fingers (Back)'"
               (click)="select('l_fingers', 'Left Fingers (Back)')" (keydown.enter)="select('l_fingers', 'Left Fingers (Back)')"
               (mousemove)="showTooltip($event, 'Left Fingers (Back)')" (mouseleave)="hideTooltip()">
                <path d="M40 180 L 35 190 L 45 195 L 50 185 Z" [class]="getPartClass('l_fingers')" />
            </g>
            
             <!-- Arms Back (Right) -->
            <path id="r_shoulder_back" [attr.d]="rShoulderBackPath()" 
                  tabindex="0" [attr.aria-label]="'Right Shoulder (Back)'"
                  [class]="getPartClass('r_shoulder')" (click)="select('r_shoulder', 'Right Shoulder (Back)')" (keydown.enter)="select('r_shoulder', 'Right Shoulder (Back)')"
                  (mousemove)="showTooltip($event, 'Right Shoulder (Back)')" (mouseleave)="hideTooltip()"/>
            <path id="r_arm_back" d="M132 110 L 148 158 L 138 160 L 122 115 Z" 
                  tabindex="0" [attr.aria-label]="'Right Arm (Back)'"
                  [class]="getPartClass('r_arm')" (click)="select('r_arm', 'Right Arm (Back)')" (keydown.enter)="select('r_arm', 'Right Arm (Back)')"
                  (mousemove)="showTooltip($event, 'Right Arm (Back)')" (mouseleave)="hideTooltip()"/>
            <path id="r_hand_back" d="M148 158 L 160 180 L 150 185 L 138 160 Z" 
                  tabindex="0" [attr.aria-label]="'Right Hand & Wrist (Back)'"
                  [class]="getPartClass('r_hand')" (click)="select('r_hand', 'Right Hand & Wrist (Back)')" (keydown.enter)="select('r_hand', 'Right Hand & Wrist (Back)')"
                  (mousemove)="showTooltip($event, 'Right Hand & Wrist (Back)')" (mouseleave)="hideTooltip()"/>
            <g id="r_fingers_back" tabindex="0" [attr.aria-label]="'Right Fingers (Back)'"
               (click)="select('r_fingers', 'Right Fingers (Back)')" (keydown.enter)="select('r_fingers', 'Right Fingers (Back)')"
               (mousemove)="showTooltip($event, 'Right Fingers (Back)')" (mouseleave)="hideTooltip()">
                <path d="M160 180 L 165 190 L 155 195 L 150 185 Z" [class]="getPartClass('r_fingers')" />
            </g>

            <!-- Legs Back -->
            <path id="l_thigh_back" d="M85 205 L 100 205 L 95 300 L 78 295 Z" 
                  tabindex="0" [attr.aria-label]="'Left Thigh (Back)'"
                  [class]="getPartClass('l_thigh')" (click)="select('l_thigh', 'Left Thigh (Back)')" (keydown.enter)="select('l_thigh', 'Left Thigh (Back)')"
                  (mousemove)="showTooltip($event, 'Left Thigh (Back)')" (mouseleave)="hideTooltip()"/>
            <path id="l_shin_back" d="M78 295 L 95 300 L 90 400 L 73 395 Z" 
                  tabindex="0" [attr.aria-label]="'Left Calves'"
                  [class]="getPartClass('l_shin')" (click)="select('l_shin', 'Left Calves')" (keydown.enter)="select('l_shin', 'Left Calves')"
                  (mousemove)="showTooltip($event, 'Left Calves')" (mouseleave)="hideTooltip()"/>
            <path id="l_foot_back" d="M73 395 L 90 400 L 85 420 L 65 420 Z" 
                  tabindex="0" [attr.aria-label]="'Left Foot (Back)'"
                  [class]="getPartClass('l_foot')" (click)="select('l_foot', 'Left Foot (Back)')" (keydown.enter)="select('l_foot', 'Left Foot (Back)')"
                  (mousemove)="showTooltip($event, 'Left Foot (Back)')" (mouseleave)="hideTooltip()"/>
            <g id="l_toes_back" tabindex="0" [attr.aria-label]="'Left Toes (Back)'"
               (click)="select('l_toes', 'Left Toes (Back)')" (keydown.enter)="select('l_toes', 'Left Toes (Back)')"
               (mousemove)="showTooltip($event, 'Left Toes (Back)')" (mouseleave)="hideTooltip()">
                <path d="M65 420 L 85 420 L 80 430 L 60 430 Z" [class]="getPartClass('l_toes')" />
            </g>

            <path id="r_thigh_back" d="M100 205 L 115 205 L 122 295 L 105 300 Z" 
                  tabindex="0" [attr.aria-label]="'Right Thigh (Back)'"
                  [class]="getPartClass('r_thigh')" (click)="select('r_thigh', 'Right Thigh (Back)')" (keydown.enter)="select('r_thigh', 'Right Thigh (Back)')"
                  (mousemove)="showTooltip($event, 'Right Thigh (Back)')" (mouseleave)="hideTooltip()"/>
            <path id="r_shin_back" d="M122 295 L 105 300 L 110 400 L 127 395 Z" 
                  tabindex="0" [attr.aria-label]="'Right Calves'"
                  [class]="getPartClass('r_shin')" (click)="select('r_shin', 'Right Calves')" (keydown.enter)="select('r_shin', 'Right Calves')"
                  (mousemove)="showTooltip($event, 'Right Calves')" (mouseleave)="hideTooltip()"/>
            <path id="r_foot_back" d="M127 395 L 110 400 L 115 420 L 135 420 Z" 
                  tabindex="0" [attr.aria-label]="'Right Foot (Back)'"
                  [class]="getPartClass('r_foot')" (click)="select('r_foot', 'Right Foot (Back)')" (keydown.enter)="select('r_foot', 'Right Foot (Back)')"
                  (mousemove)="showTooltip($event, 'Right Foot (Back)')" (mouseleave)="hideTooltip()"/>
            <g id="r_toes_back" tabindex="0" [attr.aria-label]="'Right Toes (Back)'"
               (click)="select('r_toes', 'Right Toes (Back)')" (keydown.enter)="select('r_toes', 'Right Toes (Back)')"
               (mousemove)="showTooltip($event, 'Right Toes (Back)')" (mouseleave)="hideTooltip()">
                <path d="M135 420 L 115 420 L 120 430 L 140 430 Z" [class]="getPartClass('r_toes')" />
            </g>
          </g>
        }
        @if (view() === 'side_right') {
          <g id="static-anatomy-side-right">
            <!-- Layer 2: Skin/Base -->
            <path class="skin-base" [attr.d]="fullBodySkinPathSide()" />
            <!-- Layer 1: Skeleton -->
            <g class="skeleton-layer">
                <path class="skeleton-path" d="M100 18 C 108 22, 110 35, 100 50 L 96 65 M 98 40 C 96 35, 96 30, 98 28" />
                <path class="skeleton-path" d="M98 65 C 95 100, 100 140, 98 170" />
                <path class="skeleton-path" d="M98 75 C 85 80, 85 110, 98 120" />
                <path class="skeleton-path" d="M98 170 C 90 175, 95 195, 105 200 L 100 175 Z" />
                <path class="skeleton-path" d="M95 78 L 88 110 L 85 155 M 85 155 L 82 178" />
                <path class="skeleton-path" d="M100 202 L 98 295 L 95 395 M 95 395 L 90 415" />
                <circle class="skeleton-joint" cx="95" cy="78" r="5" />
                <circle class="skeleton-joint" cx="88" cy="110" r="4" />
                <circle class="skeleton-joint" cx="85" cy="155" r="4" />
                <circle class="skeleton-joint" cx="100" cy="202" r="6" />
                <circle class="skeleton-joint" cx="98" cy="295" r="5" />
                <circle class="skeleton-joint" cx="95" cy="395" r="4" />
            </g>
          </g>
          <g id="interactive-regions-side-right">
              <path id="head_side" d="M100 18 C 118 25, 118 50, 100 65 L 92 62 V 40 C 92 25, 95 18, 100 18 Z"
                  tabindex="0" aria-label="Head & Neck (Side)"
                  [class]="getPartClass('head')" (click)="select('head', 'Head & Neck (Side)')" (keydown.enter)="select('head', 'Head & Neck (Side)')"
                  (mousemove)="showTooltip($event, 'Head & Neck (Side)')" (mouseleave)="hideTooltip()"/>
              
              <path id="chest_side" [attr.d]="chestSidePath()"
                  tabindex="0" aria-label="Chest (Side)"
                  [class]="getPartClass('chest')" (click)="select('chest', 'Chest (Side)')" (keydown.enter)="select('chest', 'Chest (Side)')"
                  (mousemove)="showTooltip($event, 'Chest (Side)')" (mouseleave)="hideTooltip()"/>
                  
              <path id="abdomen_side" [attr.d]="abdomenSidePath()"
                  tabindex="0" aria-label="Abdomen (Side)"
                  [class]="getPartClass('abdomen')" (click)="select('abdomen', 'Abdomen (Side)')" (keydown.enter)="select('abdomen', 'Abdomen (Side)')"
                  (mousemove)="showTooltip($event, 'Abdomen (Side)')" (mouseleave)="hideTooltip()"/>
                  
              <path id="glutes_side" [attr.d]="glutesSidePath()"
                  tabindex="0" aria-label="Glutes (Side)"
                  [class]="getPartClass('glutes')" (click)="select('glutes', 'Glutes (Side)')" (keydown.enter)="select('glutes', 'Glutes (Side)')"
                  (mousemove)="showTooltip($event, 'Glutes (Side)')" (mouseleave)="hideTooltip()"/>

              <path id="r_shoulder_side" d="M100 65 L 90 70 L 85 110 L 95 115 Z"
                  tabindex="0" aria-label="Right Shoulder (Side)"
                  [class]="getPartClass('r_shoulder')" (click)="select('r_shoulder', 'Right Shoulder (Side)')" (keydown.enter)="select('r_shoulder', 'Right Shoulder (Side)')"
                  (mousemove)="showTooltip($event, 'Right Shoulder (Side)')" (mouseleave)="hideTooltip()"/>
                  
              <path id="r_arm_side" d="M95 115 L 85 110 L 80 158 L 90 160 Z"
                  tabindex="0" aria-label="Right Arm (Side)"
                  [class]="getPartClass('r_arm')" (click)="select('r_arm', 'Right Arm (Side)')" (keydown.enter)="select('r_arm', 'Right Arm (Side)')"
                  (mousemove)="showTooltip($event, 'Right Arm (Side)')" (mouseleave)="hideTooltip()"/>
                  
              <path id="r_hand_side" d="M80 158 L 75 180 L 85 185 L 90 160 Z"
                  tabindex="0" aria-label="Right Hand (Side)"
                  [class]="getPartClass('r_hand')" (click)="select('r_hand', 'Right Hand (Side)')" (keydown.enter)="select('r_hand', 'Right Hand (Side)')"
                  (mousemove)="showTooltip($event, 'Right Hand (Side)')" (mouseleave)="hideTooltip()"/>
                  
              <g id="r_fingers_side" tabindex="0" aria-label="Right Fingers (Side)"
                  (click)="select('r_fingers', 'Right Fingers (Side)')" (keydown.enter)="select('r_fingers', 'Right Fingers (Side)')"
                  (mousemove)="showTooltip($event, 'Right Fingers (Side)')" (mouseleave)="hideTooltip()">
                  <path d="M75 180 L 70 190 L 80 195 L 85 185 Z" [class]="getPartClass('r_fingers')" />
              </g>

              <path id="r_thigh_side" d="M100 205 L 85 200 L 80 295 L 95 300 Z"
                  tabindex="0" aria-label="Right Thigh (Side)"
                  [class]="getPartClass('r_thigh')" (click)="select('r_thigh', 'Right Thigh (Side)')" (keydown.enter)="select('r_thigh', 'Right Thigh (Side)')"
                  (mousemove)="showTooltip($event, 'Right Thigh (Side)')" (mouseleave)="hideTooltip()"/>
                  
              <path id="r_shin_side" d="M80 295 L 95 300 L 90 395 L 75 390 Z"
                  tabindex="0" aria-label="Right Lower Leg (Side)"
                  [class]="getPartClass('r_shin')" (click)="select('r_shin', 'Right Lower Leg (Side)')" (keydown.enter)="select('r_shin', 'Right Lower Leg (Side)')"
                  (mousemove)="showTooltip($event, 'Right Lower Leg (Side)')" (mouseleave)="hideTooltip()"/>
                  
              <path id="r_foot_side" d="M75 390 L 90 395 L 105 420 L 70 420 Z"
                  tabindex="0" aria-label="Right Foot (Side)"
                  [class]="getPartClass('r_foot')" (click)="select('r_foot', 'Right Foot (Side)')" (keydown.enter)="select('r_foot', 'Right Foot (Side)')"
                  (mousemove)="showTooltip($event, 'Right Foot (Side)')" (mouseleave)="hideTooltip()"/>
                  
              <g id="r_toes_side" tabindex="0" aria-label="Right Toes (Side)"
                  (click)="select('r_toes', 'Right Toes (Side)')" (keydown.enter)="select('r_toes', 'Right Toes (Side)')"
                  (mousemove)="showTooltip($event, 'Right Toes (Side)')" (mouseleave)="hideTooltip()">
                  <path d="M105 420 L 115 420 L 110 430 L 100 430 Z" [class]="getPartClass('r_toes')" />
              </g>
          </g>
        }
        @if (view() === 'side_left') {
          <g transform="scale(-1, 1) translate(-200, 0)">
            <g id="static-anatomy-side-left">
              <!-- Layer 2: Skin/Base -->
              <path class="skin-base" [attr.d]="fullBodySkinPathSide()" />
              <!-- Layer 1: Skeleton -->
              <g class="skeleton-layer">
                  <path class="skeleton-path" d="M100 18 C 108 22, 110 35, 100 50 L 96 65 M 98 40 C 96 35, 96 30, 98 28" />
                  <path class="skeleton-path" d="M98 65 C 95 100, 100 140, 98 170" />
                  <path class="skeleton-path" d="M98 75 C 85 80, 85 110, 98 120" />
                  <path class="skeleton-path" d="M98 170 C 90 175, 95 195, 105 200 L 100 175 Z" />
                  <path class="skeleton-path" d="M95 78 L 88 110 L 85 155 M 85 155 L 82 178" />
                  <path class="skeleton-path" d="M100 202 L 98 295 L 95 395 M 95 395 L 90 415" />
                  <circle class="skeleton-joint" cx="95" cy="78" r="5" />
                  <circle class="skeleton-joint" cx="88" cy="110" r="4" />
                  <circle class="skeleton-joint" cx="85" cy="155" r="4" />
                  <circle class="skeleton-joint" cx="100" cy="202" r="6" />
                  <circle class="skeleton-joint" cx="98" cy="295" r="5" />
                  <circle class="skeleton-joint" cx="95" cy="395" r="4" />
              </g>
            </g>
            <g id="interactive-regions-side-left">
                <path id="head_side" d="M100 18 C 118 25, 118 50, 100 65 L 92 62 V 40 C 92 25, 95 18, 100 18 Z"
                    tabindex="0" aria-label="Head & Neck (Side)"
                    [class]="getPartClass('head')" (click)="select('head', 'Head & Neck (Side)')" (keydown.enter)="select('head', 'Head & Neck (Side)')"
                    (mousemove)="showTooltip($event, 'Head & Neck (Side)')" (mouseleave)="hideTooltip()"/>
                
                <path id="chest_side" [attr.d]="chestSidePath()"
                    tabindex="0" aria-label="Chest (Side)"
                    [class]="getPartClass('chest')" (click)="select('chest', 'Chest (Side)')" (keydown.enter)="select('chest', 'Chest (Side)')"
                    (mousemove)="showTooltip($event, 'Chest (Side)')" (mouseleave)="hideTooltip()"/>
                    
                <path id="abdomen_side" [attr.d]="abdomenSidePath()"
                    tabindex="0" aria-label="Abdomen (Side)"
                    [class]="getPartClass('abdomen')" (click)="select('abdomen', 'Abdomen (Side)')" (keydown.enter)="select('abdomen', 'Abdomen (Side)')"
                    (mousemove)="showTooltip($event, 'Abdomen (Side)')" (mouseleave)="hideTooltip()"/>
                    
                <path id="glutes_side" [attr.d]="glutesSidePath()"
                    tabindex="0" aria-label="Glutes (Side)"
                    [class]="getPartClass('glutes')" (click)="select('glutes', 'Glutes (Side)')" (keydown.enter)="select('glutes', 'Glutes (Side)')"
                    (mousemove)="showTooltip($event, 'Glutes (Side)')" (mouseleave)="hideTooltip()"/>

                <path id="l_shoulder_side" d="M100 65 L 90 70 L 85 110 L 95 115 Z"
                    tabindex="0" aria-label="Left Shoulder (Side)"
                    [class]="getPartClass('l_shoulder')" (click)="select('l_shoulder', 'Left Shoulder (Side)')" (keydown.enter)="select('l_shoulder', 'Left Shoulder (Side)')"
                    (mousemove)="showTooltip($event, 'Left Shoulder (Side)')" (mouseleave)="hideTooltip()"/>
                    
                <path id="l_arm_side" d="M95 115 L 85 110 L 80 158 L 90 160 Z"
                    tabindex="0" aria-label="Left Arm (Side)"
                    [class]="getPartClass('l_arm')" (click)="select('l_arm', 'Left Arm (Side)')" (keydown.enter)="select('l_arm', 'Left Arm (Side)')"
                    (mousemove)="showTooltip($event, 'Left Arm (Side)')" (mouseleave)="hideTooltip()"/>
                    
                <path id="l_hand_side" d="M80 158 L 75 180 L 85 185 L 90 160 Z"
                    tabindex="0" aria-label="Left Hand (Side)"
                    [class]="getPartClass('l_hand')" (click)="select('l_hand', 'Left Hand (Side)')" (keydown.enter)="select('l_hand', 'Left Hand (Side)')"
                    (mousemove)="showTooltip($event, 'Left Hand (Side)')" (mouseleave)="hideTooltip()"/>
                    
                <g id="l_fingers_side" tabindex="0" aria-label="Left Fingers (Side)"
                    (click)="select('l_fingers', 'Left Fingers (Side)')" (keydown.enter)="select('l_fingers', 'Left Fingers (Side)')"
                    (mousemove)="showTooltip($event, 'Left Fingers (Side)')" (mouseleave)="hideTooltip()">
                    <path d="M75 180 L 70 190 L 80 195 L 85 185 Z" [class]="getPartClass('l_fingers')" />
                </g>

                <path id="l_thigh_side" d="M100 205 L 85 200 L 80 295 L 95 300 Z"
                    tabindex="0" aria-label="Left Thigh (Side)"
                    [class]="getPartClass('l_thigh')" (click)="select('l_thigh', 'Left Thigh (Side)')" (keydown.enter)="select('l_thigh', 'Left Thigh (Side)')"
                    (mousemove)="showTooltip($event, 'Left Thigh (Side)')" (mouseleave)="hideTooltip()"/>
                    
                <path id="l_shin_side" d="M80 295 L 95 300 L 90 395 L 75 390 Z"
                    tabindex="0" aria-label="Left Lower Leg (Side)"
                    [class]="getPartClass('l_shin')" (click)="select('l_shin', 'Left Lower Leg (Side)')" (keydown.enter)="select('l_shin', 'Left Lower Leg (Side)')"
                    (mousemove)="showTooltip($event, 'Left Lower Leg (Side)')" (mouseleave)="hideTooltip()"/>
                    
                <path id="l_foot_side" d="M75 390 L 90 395 L 105 420 L 70 420 Z"
                    tabindex="0" aria-label="Left Foot (Side)"
                    [class]="getPartClass('l_foot')" (click)="select('l_foot', 'Left Foot (Side)')" (keydown.enter)="select('l_foot', 'Left Foot (Side)')"
                    (mousemove)="showTooltip($event, 'Left Foot (Side)')" (mouseleave)="hideTooltip()"/>
                    
                <g id="l_toes_side" tabindex="0" aria-label="Left Toes (Side)"
                    (click)="select('l_toes', 'Left Toes (Side)')" (keydown.enter)="select('l_toes', 'Left Toes (Side)')"
                    (mousemove)="showTooltip($event, 'Left Toes (Side)')" (mouseleave)="hideTooltip()">
                    <path d="M105 420 L 115 420 L 110 430 L 100 430 Z" [class]="getPartClass('l_toes')" />
                </g>
            </g>
          </g>
        }
        </g>
      </svg>
      }
    </div>
      
      <!-- Manual Controls -->
      <div class="absolute bottom-4 left-4 flex flex-col gap-2 z-20 no-print">
        <button (click)="zoomIn()" class="p-3 bg-white border border-[#EEEEEE] hover:bg-[#F8F8F8] rounded-full shadow-sm transition-all active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
        </button>
        <button (click)="zoomOut()" class="p-3 bg-white border border-[#EEEEEE] hover:bg-[#F8F8F8] rounded-full shadow-sm transition-all active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg>
        </button>
        <button (click)="resetControls()" class="p-3 bg-white border border-[#EEEEEE] hover:bg-[#F8F8F8] rounded-full shadow-sm transition-all active:scale-95" title="Reset View">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        </button>
      </div>

      <!-- Veo Generation Trigger -->
      <div class="absolute bottom-4 right-4 flex flex-col items-end gap-2 z-20 no-print">
        @if (veo.state().error) {
          <div class="bg-red-50 text-red-600 text-[10px] p-2 border border-red-100 rounded mb-2 max-w-[200px]">
            {{ veo.state().error }}
          </div>
        }
        <button (click)="generate3DRotation()" 
                [disabled]="veo.state().isGenerating"
                class="flex items-center gap-2 px-4 py-2 bg-[#1C1C1C] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z"/></svg>
          <span>{{ veo.state().videoUrl ? 'Regenerate 3D' : 'Generate 3D Rotation' }}</span>
        </button>
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
  veo = inject(VeoService);

  view = signal<'front' | 'back' | 'side_right' | 'side_left'>('front');
  isInternalView = signal<boolean>(false);
  
  tempSelectedId = signal<string | null>(null);
  tooltipText = signal<string>('');
  tooltipVisible = signal<boolean>(false);
  tooltipX = signal<number>(0);
  tooltipY = signal<number>(0);
  manualRotation = signal(0);
  manualZoom = signal(1);

  normalizedRotation = computed(() => (this.manualRotation() % 360 + 360) % 360);

  // Drag-to-rotate state
  isDraggingRotation = signal(false);
  private hasDragged = signal(false);
  private initialDragX = signal(0);
  private initialRotation = signal(0);
  
  // Bound event listeners for document to handle dragging outside the component
  private boundDoDragRotation = this.doDragRotation.bind(this);
  private boundStopDragRotation = this.stopDragRotation.bind(this);
  
  veoVideo = viewChild<ElementRef<HTMLVideoElement>>('veoVideo');

  constructor() {
    effect(() => {
      const rotation = this.normalizedRotation();

      if (rotation > 45 && rotation <= 135) {
        this.view.set('side_right');
      } else if (rotation > 135 && rotation <= 225) {
        this.view.set('back');
      } else if (rotation > 225 && rotation <= 315) {
        this.view.set('side_left');
      } else { // Covers 315-360 and 0-45
        this.view.set('front');
      }
    });

    // Scrub video based on rotation
    effect(() => {
      const video = this.veoVideo()?.nativeElement;
      if (video && video.duration) {
        const rotation = this.normalizedRotation();
        video.currentTime = (rotation / 360) * video.duration;
      }
    });
  }

  selectedPatient = computed(() => {
    const id = this.patientManagement.selectedPatientId();
    if (!id) return null;
    return this.patientManagement.patients().find(p => p.id === id);
  });

  ngOnDestroy() {
    // Ensure listeners are cleaned up if the component is destroyed mid-drag
    document.removeEventListener('mousemove', this.boundDoDragRotation);
    document.removeEventListener('mouseup', this.boundStopDragRotation);
  }
  
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
    return `translate(${cx}, ${cy}) scale(${finalScaleX}, ${finalScaleY}) translate(${-cx}, ${-cy})`;
  });

  fullBodySkinPathFront = computed(() => "M82 40 C 82 25 88 18 100 18 S 118 25 118 40 V 65 L 122 70 L 132 110 L 148 158 L 160 180 L 165 190 L 155 195 L 150 185 L 138 160 L 122 115 L 122 125 L 118 170 L 115 205 L 122 295 L 127 395 L 135 420 L 140 430 H 120 L 115 420 L 110 400 L 105 300 H 115 H 100 H 85 H 95 L 90 400 L 85 420 L 80 430 H 60 L 65 420 L 73 395 L 78 295 L 85 205 L 82 170 L 78 125 L 78 115 L 62 160 L 50 185 L 45 195 L 35 190 L 40 180 L 52 158 L 68 110 L 78 70 L 82 65 Z");
  fullBodySkinPathBack = computed(() => "M82 40 C 82 25 88 18 100 18 S 118 25 118 40 V 65 L 122 70 L 132 110 L 148 158 L 160 180 L 165 190 L 155 195 L 150 185 L 138 160 L 122 115 L 120 120 L 115 170 L 120 205 L 122 295 L 127 395 L 135 420 L 140 430 H 120 L 115 420 L 110 400 L 105 300 H 115 H 100 H 85 H 95 L 90 400 L 85 420 L 80 430 H 60 L 65 420 L 73 395 L 78 295 L 80 205 L 85 170 L 80 120 L 78 115 L 62 160 L 50 185 L 45 195 L 35 190 L 40 180 L 52 158 L 68 110 L 78 70 L 82 65 Z");
  fullBodySkinPathSide = computed(() => {
    const g = this.selectedPatient()?.gender;
    if (g === 'Male') return "M100 18 C 118 25, 118 50, 100 65 L 105 95 L 105 120 L 100 170 L 95 205 L 80 295 L 75 390 L 70 420 H 115 L 105 420 L 90 395 L 95 300 L 100 205 L 88 200 L 90 170 L 90 125 L 90 70 L 85 110 L 80 158 L 75 180 L 70 190 L 80 195 L 85 185 L 90 160 L 95 115 L 92 62 V 40 C 92 25, 95 18, 100 18 Z";
    if (g === 'Female') return "M100 18 C 118 25, 118 50, 100 65 L 112 95 C 115 105, 108 120, 105 125 L 108 120 L 102 170 C 105 185, 95 210, 85 205 L 80 295 L 75 390 L 70 420 H 115 L 105 420 L 90 395 L 95 300 L 85 205 L 88 190 L 90 170 L 90 125 L 90 70 L 85 110 L 80 158 L 75 180 L 70 190 L 80 195 L 85 185 L 90 160 L 95 115 L 92 62 V 40 C 92 25, 95 18, 100 18 Z";
    return "M100 18 C 118 25, 118 50, 100 65 L 108 95 L 106 120 L 101 170 L 98 205 L 80 295 L 75 390 L 70 420 H 115 L 105 420 L 90 395 L 95 300 L 98 205 L 86 200 L 90 170 L 90 125 L 90 70 L 85 110 L 80 158 L 75 180 L 70 190 L 80 195 L 85 185 L 90 160 L 95 115 L 92 62 V 40 C 92 25, 95 18, 100 18 Z";
  });

  chestPath = computed(() => { const g = this.selectedPatient()?.gender; if (g === 'Male') return "M78 65 L122 65 C 125 90, 125 110, 122 125 L78 125 C 75 110, 75 90, 78 65 Z"; if (g === 'Female') return "M82 65 L118 65 C 122 90, 122 110, 118 125 L82 125 C 78 110, 78 90, 82 65 Z"; return "M80 65 L120 65 C 123 90, 123 110, 120 125 L80 125 C 77 110, 77 90, 80 65 Z"; });
  pelvisPath = computed(() => { const g = this.selectedPatient()?.gender; if (g === 'Male') return "M82 170 H 118 L 115 205 H 85 Z"; if (g === 'Female') return "M80 170 H 120 L 120 205 H 80 Z"; return "M82 170 H 118 L 118 205 H 82 Z"; });
  rShoulderPath = computed(() => { const g = this.selectedPatient()?.gender; if (g === 'Male') return "M78 65 L 78 115 L 68 110 L 78 78 Z"; if (g === 'Female') return "M82 65 L 78 115 L 68 110 L 78 78 Z"; return "M80 65 L 78 115 L 68 110 L 78 78 Z"; });
  lShoulderPath = computed(() => { const g = this.selectedPatient()?.gender; if (g === 'Male') return "M122 65 L122 115 L 132 110 L 122 78 Z"; if (g === 'Female') return "M118 65 L122 115 L 132 110 L 122 78 Z"; return "M120 65 L122 115 L 132 110 L 122 78 Z"; });
  upperBackPath = computed(() => { const g = this.selectedPatient()?.gender; if (g === 'Male') return "M78 65 L122 65 L120 120 L80 120 Z"; if (g === 'Female') return "M82 65 L118 65 L120 120 L80 120 Z"; return "M80 65 L120 65 L120 120 L80 120 Z"; });
  glutesPath = computed(() => { const g = this.selectedPatient()?.gender; if (g === 'Male') return "M85 170 H 115 L 110 205 H 90 Z"; if (g === 'Female') return "M80 170 H 120 L 120 205 H 80 Z"; return "M82 170 H 118 L 115 205 H 85 Z"; });
  lShoulderBackPath = computed(() => { const g = this.selectedPatient()?.gender; if (g === 'Male') return "M78 65 L 78 115 L 68 110 L 78 78 Z"; if (g === 'Female') return "M82 65 L 78 115 L 68 110 L 78 78 Z"; return "M80 65 L 78 115 L 68 110 L 78 78 Z"; });
  rShoulderBackPath = computed(() => { const g = this.selectedPatient()?.gender; if (g === 'Male') return "M122 65 L122 115 L 132 110 L 122 78 Z"; if (g === 'Female') return "M118 65 L122 115 L 132 110 L 122 78 Z"; return "M120 65 L122 115 L 132 110 L 122 78 Z"; });
  
  // --- Side View Paths ---
  chestSidePath = computed(() => {
    const g = this.selectedPatient()?.gender;
    if (g === 'Male') return "M92 65 L 105 95 L 90 125 L 90 70 Z";
    if (g === 'Female') return "M92 65 L 112 95 C 115 105, 100 120, 90 125 L 90 70 Z";
    return "M92 65 L 108 95 L 90 125 L 90 70 Z";
  });
  abdomenSidePath = computed(() => {
    const g = this.selectedPatient()?.gender;
    if (g === 'Male') return "M90 125 L 105 120 L 100 170 L 90 170 Z";
    if (g === 'Female') return "M90 125 L 108 120 L 102 170 L 90 170 Z";
    return "M90 125 L 106 120 L 101 170 L 90 170 Z";
  });
  glutesSidePath = computed(() => {
    const g = this.selectedPatient()?.gender;
    if (g === 'Male') return "M90 170 L 100 170 L 95 205 L 88 200 Z";
    if (g === 'Female') return "M90 170 L 102 170 C 105 185, 95 210, 85 205 L 88 190 Z";
    return "M90 170 L 101 170 L 98 205 L 86 200 Z";
  });

  select(id: string, name: string) {
    if (this.hasDragged()) return; // It was a drag, not a click, so bail.
    if (this.state.selectedPartId() === id) return;
    this.tempSelectedId.set(id);

    setTimeout(() => {
      this.state.selectPart(id);
      const issuesForPart = this.state.issues()[id];

      if (issuesForPart && issuesForPart.length > 0) {
        this.state.selectNote(issuesForPart[0].noteId);
      } else {
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
      this.tempSelectedId.set(null);
    }, 250);
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

  showTooltip(event: MouseEvent, name:string) {
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
  rotateLeft() { this.manualRotation.update(r => r - 15); }
  rotateRight() { this.manualRotation.update(r => r + 15); }
  resetControls() { this.manualRotation.set(0); this.manualZoom.set(1); }

  async generate3DRotation() {
    const hasKey = await this.veo.hasApiKey();
    if (!hasKey) {
      await this.veo.selectApiKey();
      // Guidelines say to assume success and proceed
    }

    const gender = this.selectedPatient()?.gender || 'Male';
    const type = this.isInternalView() ? 'Internal' : 'External';
    await this.veo.generateBodyRotation(gender as any, type);
  }

  onRotationSliderInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.manualRotation.set(parseInt(val, 10));
  }

  toggleInternalView() {
    this.isInternalView.update(v => !v);
  }
  
  // --- Drag-to-Rotate Handlers ---
  startDragRotation(event: MouseEvent) {
    if (event.button !== 0) return; // Only drag with the primary mouse button
    event.preventDefault(); // Prevent text selection
    
    this.isDraggingRotation.set(true);
    this.hasDragged.set(false); // Reset drag flag on new mousedown
    this.initialDragX.set(event.clientX);
    this.initialRotation.set(this.manualRotation());

    document.addEventListener('mousemove', this.boundDoDragRotation);
    document.addEventListener('mouseup', this.boundStopDragRotation, { once: true });
  }

  private doDragRotation(event: MouseEvent) {
    if (!this.isDraggingRotation()) return;

    const deltaX = event.clientX - this.initialDragX();
    
    // Set hasDragged flag only after moving a certain threshold to distinguish from a click
    if (!this.hasDragged() && Math.abs(deltaX) > 5) {
      this.hasDragged.set(true);
    }
    
    const rotationSensitivity = 0.5; // Degrees per pixel
    const newRotation = this.initialRotation() + (deltaX * rotationSensitivity);
    this.manualRotation.set(newRotation);
  }

  private stopDragRotation() {
    this.isDraggingRotation.set(false);
    document.removeEventListener('mousemove', this.boundDoDragRotation);
  }
}
