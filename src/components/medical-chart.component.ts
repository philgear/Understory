import { Component, ChangeDetectionStrategy, inject, computed, signal, viewChild, ElementRef, effect, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PatientStateService } from '../services/patient-state.service';
import { BioAdaptiveTypographyService } from '../services/bio-adaptive-typography.service';
import { PatientManagementService } from '../services/patient-management.service';
import { IPatientState, IPatient, HistoryEntry } from '../services/patient.types';
import { BodyViewerComponent } from './anatomy-3d/body-viewer.component';
import { PatientHistoryTimelineComponent } from './patient-history-timeline.component';
import { DictationService } from '../services/dictation.service';
import { PocketGullButtonComponent } from './shared/pocket-gull-button.component';
import { PocketGullCardComponent } from './shared/pocket-gull-card.component';
import { MedicalChartSummaryComponent } from './medical-summary.component';
import { DicomViewerComponent } from './dicom-viewer.component';
import { BiometricHistoryChartComponent } from './biometric-history-chart.component';
import { SentinelTriageComponent } from './sentinel-triage.component';
import { SentinelTelemetryPlotterComponent } from './sentinel-telemetry-plotter.component';
import { LongitudinalTrendSparklineComponent } from './shared/longitudinal-trend-sparkline.component';
import { GlobalHealthInitiativesService } from '../services/global-health-initiatives.service';
import { EnvironmentalExposomicsToxicologyComponent } from './environmental-exposomics-toxicology.component';
import { InstantBodyCarePlanSheetComponent } from './anatomy-3d/instant-body-care-plan-sheet.component';
import { PatientScansComponent } from './patient-scans.component';

@Component({
  selector: 'app-medical-chart',
  standalone: true,
  imports: [
    CommonModule, 
    BodyViewerComponent, 
    PatientHistoryTimelineComponent, 
    PocketGullButtonComponent, 
    PocketGullCardComponent, 
    MedicalChartSummaryComponent, 
    DicomViewerComponent, 
    BiometricHistoryChartComponent,
    SentinelTriageComponent,
    SentinelTelemetryPlotterComponent,
    LongitudinalTrendSparklineComponent,
    EnvironmentalExposomicsToxicologyComponent,
    InstantBodyCarePlanSheetComponent,
    PatientScansComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full min-h-full flex flex-col gap-3 sm:gap-4 p-3 sm:p-6 bg-[#F9FAFB] dark:bg-transparent bio-adaptive-sloan" [style.--sloan-letter-spacing]="bioTypography.letterSpacingEm()">
 
       <!-- Review Mode Banner -->
      @if(isReviewMode() && state.viewingPastVisit(); as visit) {
          <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 p-4 flex justify-between items-center text-sm rounded-xl shadow-sm mb-2">
              <div class="flex items-center gap-3">
                  <div class="p-2 bg-yellow-100 dark:bg-yellow-800/40 rounded-sm text-yellow-700 dark:text-yellow-500">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                  </div>
                  @if (visit.type === 'Visit' || visit.type === 'ChartArchived') {
                    <span class="font-medium text-yellow-900 dark:text-yellow-100">Reviewing past entry from <strong class="font-bold">{{ visit.date }}</strong>. All fields are read-only.</span>
                  } @else {
                     <span class="font-medium text-yellow-900 dark:text-yellow-100">Reviewing past AI Analysis from <strong class="font-bold">{{ visit.date }}</strong>.</span>
                  }
              </div>
              <pocket-gull-button 
                (click)="returnToCurrent()" 
                variant="secondary" 
                size="sm">
                Return to Current State
              </pocket-gull-button>
          </div>
      }

      <!-- 🧭 Precision Workspace Navigator (Zero-Scroll Mode) -->
      <div class="flex items-center justify-between gap-1 border-b border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-950/40 px-1 mb-2 font-mono text-xs shrink-0 overflow-x-auto">
        <div class="flex items-center gap-4">
          <button type="button" (click)="activeWorkspaceTab.set('anatomy')"
            [class.border-teal-500]="activeWorkspaceTab() === 'anatomy'"
            [class.text-zinc-950]="activeWorkspaceTab() === 'anatomy'"
            [class.dark:text-white]="activeWorkspaceTab() === 'anatomy'"
            [class.font-bold]="activeWorkspaceTab() === 'anatomy'"
            [class.border-transparent]="activeWorkspaceTab() !== 'anatomy'"
            [class.text-zinc-500]="activeWorkspaceTab() !== 'anatomy'"
            [class.dark:text-zinc-400]="activeWorkspaceTab() !== 'anatomy'"
            class="flex items-center gap-1.5 py-2.5 border-b-2 uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap text-[11px] hover:text-zinc-800 dark:hover:text-zinc-200">
            <span class="text-teal-600 dark:text-teal-400 font-bold">01</span>
            <span>3D Anatomy</span>
          </button>

          <button type="button" (click)="activeWorkspaceTab.set('vitals')"
            [class.border-teal-500]="activeWorkspaceTab() === 'vitals'"
            [class.text-zinc-950]="activeWorkspaceTab() === 'vitals'"
            [class.dark:text-white]="activeWorkspaceTab() === 'vitals'"
            [class.font-bold]="activeWorkspaceTab() === 'vitals'"
            [class.border-transparent]="activeWorkspaceTab() !== 'vitals'"
            [class.text-zinc-500]="activeWorkspaceTab() !== 'vitals'"
            [class.dark:text-zinc-400]="activeWorkspaceTab() !== 'vitals'"
            class="flex items-center gap-1.5 py-2.5 border-b-2 uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap text-[11px] hover:text-zinc-800 dark:hover:text-zinc-200">
            <span class="text-teal-600 dark:text-teal-400 font-bold">02</span>
            <span>Vitals &amp; Bio</span>
          </button>

          <button type="button" (click)="activeWorkspaceTab.set('imaging')"
            [class.border-teal-500]="activeWorkspaceTab() === 'imaging'"
            [class.text-zinc-950]="activeWorkspaceTab() === 'imaging'"
            [class.dark:text-white]="activeWorkspaceTab() === 'imaging'"
            [class.font-bold]="activeWorkspaceTab() === 'imaging'"
            [class.border-transparent]="activeWorkspaceTab() !== 'imaging'"
            [class.text-zinc-500]="activeWorkspaceTab() !== 'imaging'"
            [class.dark:text-zinc-400]="activeWorkspaceTab() !== 'imaging'"
            class="flex items-center gap-1.5 py-2.5 border-b-2 uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap text-[11px] hover:text-zinc-800 dark:hover:text-zinc-200">
            <span class="text-teal-600 dark:text-teal-400 font-bold">03</span>
            <span>Imaging &amp; Tox</span>
          </button>

          <button type="button" (click)="activeWorkspaceTab.set('timeline')"
            [class.border-teal-500]="activeWorkspaceTab() === 'timeline'"
            [class.text-zinc-950]="activeWorkspaceTab() === 'timeline'"
            [class.dark:text-white]="activeWorkspaceTab() === 'timeline'"
            [class.font-bold]="activeWorkspaceTab() === 'timeline'"
            [class.border-transparent]="activeWorkspaceTab() !== 'timeline'"
            [class.text-zinc-500]="activeWorkspaceTab() !== 'timeline'"
            [class.dark:text-zinc-400]="activeWorkspaceTab() !== 'timeline'"
            class="flex items-center gap-1.5 py-2.5 border-b-2 uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap text-[11px] hover:text-zinc-800 dark:hover:text-zinc-200">
            <span class="text-teal-600 dark:text-teal-400 font-bold">04</span>
            <span>History</span>
          </button>
        </div>

        <!-- Multi-Panel All Toggle -->
        <button type="button" (click)="activeWorkspaceTab.set(activeWorkspaceTab() === 'all' ? 'anatomy' : 'all')"
          [class.text-emerald-600]="activeWorkspaceTab() === 'all'"
          [class.dark:text-emerald-400]="activeWorkspaceTab() === 'all'"
          [class.border-emerald-500]="activeWorkspaceTab() === 'all'"
          [class.bg-emerald-500/10]="activeWorkspaceTab() === 'all'"
          class="hidden sm:flex items-center gap-1 px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider border border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition cursor-pointer shrink-0">
          <span>{{ activeWorkspaceTab() === 'all' ? '[ MULTI-PANEL ]' : '[ ALL PANELS ]' }}</span>
        </button>
      </div>

      <!-- 👁️ Bio-Adaptive Sloan 5:1 Phoropter & Bedside Thermal Action Bar -->
      <div class="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 backdrop-blur-sm text-xs font-mono mb-2">
        <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <div class="flex items-center gap-1 text-[11px] font-bold text-teal-600 dark:text-teal-400 mr-1">
            <span class="pg-icon pg-icon-eye text-sm leading-none"></span>
            <span class="tracking-wider uppercase">Sloan 5:1 Lens:</span>
          </div>

          <!-- Phoropter Mode Pills -->
          <button type="button" (click)="bioTypography.setPhoropterMode('STANDARD_20_20')"
            [class.bg-teal-500]="bioTypography.phoropterMode() === 'STANDARD_20_20'"
            [class.text-white]="bioTypography.phoropterMode() === 'STANDARD_20_20'"
            [class.border-teal-500]="bioTypography.phoropterMode() === 'STANDARD_20_20'"
            [class.bg-white]="bioTypography.phoropterMode() !== 'STANDARD_20_20'"
            [class.dark:bg-zinc-800]="bioTypography.phoropterMode() !== 'STANDARD_20_20'"
            [class.text-zinc-600]="bioTypography.phoropterMode() !== 'STANDARD_20_20'"
            [class.dark:text-zinc-400]="bioTypography.phoropterMode() !== 'STANDARD_20_20'"
            class="px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold uppercase transition cursor-pointer hover:border-teal-500">
            20/20 Std
          </button>

          <button type="button" (click)="bioTypography.setPhoropterMode('AUTO_DISTANCE')"
            [class.bg-teal-500]="bioTypography.phoropterMode() === 'AUTO_DISTANCE'"
            [class.text-white]="bioTypography.phoropterMode() === 'AUTO_DISTANCE'"
            [class.border-teal-500]="bioTypography.phoropterMode() === 'AUTO_DISTANCE'"
            [class.bg-white]="bioTypography.phoropterMode() !== 'AUTO_DISTANCE'"
            [class.dark:bg-zinc-800]="bioTypography.phoropterMode() !== 'AUTO_DISTANCE'"
            [class.text-zinc-600]="bioTypography.phoropterMode() !== 'AUTO_DISTANCE'"
            [class.dark:text-zinc-400]="bioTypography.phoropterMode() !== 'AUTO_DISTANCE'"
            class="px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold uppercase transition cursor-pointer hover:border-teal-500">
            📱 Distance ({{ bioTypography.distanceCm() }}cm)
          </button>

          <button type="button" (click)="bioTypography.setPhoropterMode('MESOPIC_ICU')"
            [class.bg-teal-500]="bioTypography.phoropterMode() === 'MESOPIC_ICU'"
            [class.text-white]="bioTypography.phoropterMode() === 'MESOPIC_ICU'"
            [class.border-teal-500]="bioTypography.phoropterMode() === 'MESOPIC_ICU'"
            [class.bg-white]="bioTypography.phoropterMode() !== 'MESOPIC_ICU'"
            [class.dark:bg-zinc-800]="bioTypography.phoropterMode() !== 'MESOPIC_ICU'"
            [class.text-zinc-600]="bioTypography.phoropterMode() !== 'MESOPIC_ICU'"
            [class.dark:text-zinc-400]="bioTypography.phoropterMode() !== 'MESOPIC_ICU'"
            class="px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold uppercase transition cursor-pointer hover:border-teal-500">
            🌙 ICU Mesopic
          </button>

          <button type="button" (click)="bioTypography.setPhoropterMode('STAT_TRAUMA')"
            [class.bg-red-500]="bioTypography.phoropterMode() === 'STAT_TRAUMA'"
            [class.text-white]="bioTypography.phoropterMode() === 'STAT_TRAUMA'"
            [class.border-red-500]="bioTypography.phoropterMode() === 'STAT_TRAUMA'"
            [class.bg-white]="bioTypography.phoropterMode() !== 'STAT_TRAUMA'"
            [class.dark:bg-zinc-800]="bioTypography.phoropterMode() !== 'STAT_TRAUMA'"
            [class.text-zinc-600]="bioTypography.phoropterMode() !== 'STAT_TRAUMA'"
            [class.dark:text-zinc-400]="bioTypography.phoropterMode() !== 'STAT_TRAUMA'"
            class="px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold uppercase transition cursor-pointer hover:border-red-500">
            ⚡ STAT Trauma
          </button>

          <button type="button" (click)="bioTypography.setPhoropterMode('LOW_VISION')"
            [class.bg-amber-500]="bioTypography.phoropterMode() === 'LOW_VISION'"
            [class.text-white]="bioTypography.phoropterMode() === 'LOW_VISION'"
            [class.border-amber-500]="bioTypography.phoropterMode() === 'LOW_VISION'"
            [class.bg-white]="bioTypography.phoropterMode() !== 'LOW_VISION'"
            [class.dark:bg-zinc-800]="bioTypography.phoropterMode() !== 'LOW_VISION'"
            [class.text-zinc-600]="bioTypography.phoropterMode() !== 'LOW_VISION'"
            [class.dark:text-zinc-400]="bioTypography.phoropterMode() !== 'LOW_VISION'"
            class="px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold uppercase transition cursor-pointer hover:border-amber-500">
            👓 Low Vision
          </button>
        </div>

        <!-- Live Telemetry Readout & 203 DPI Thermal Print Trigger -->
        <div class="flex items-center gap-2">
          <div class="hidden md:flex items-center gap-2 text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
            <span>DILATION: <strong class="text-teal-600 dark:text-teal-400 font-bold">{{ bioTypography.sloanDilationFactor().toFixed(2) }}x</strong></span>
            <span>•</span>
            <span>5.0' ARC</span>
          </div>

          <button type="button" (click)="printBedsideThermalTicket()"
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm transition cursor-pointer">
            <span class="pg-icon pg-icon-print text-xs leading-none"></span>
            <span>Print 203 DPI</span>
          </button>

          <button type="button" (click)="bioTypography.downloadZplPayload()" title="Download Zebra ZPL II payload"
            class="px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:border-teal-500 text-zinc-700 dark:text-zinc-300 font-bold text-[10px] uppercase tracking-wider transition cursor-pointer">
            💾 ZPL
          </button>
        </div>
      </div>

      <!-- Hidden Bedside 203 DPI Printable Thermal Label Container -->
      <div class="printable-thermal-label hidden print:block font-mono" style="font-family: 'PocketGull Bold', 'PocketGull', monospace;">
        <div style="font-size: 11px; font-weight: 800; border-bottom: 2px solid #000; padding-bottom: 3px; display: flex; justify-content: space-between;">
          <span>POCKETGULL HEALTH • 203 DPI</span>
          <span>STAT eMAR</span>
        </div>
        <div style="font-size: 10px; font-weight: 700; margin-top: 4px;">
          PATIENT: {{ bioTypography.thermalLabelPayload().patientName }} ({{ bioTypography.thermalLabelPayload().bed }})
        </div>
        <div style="background: #000; color: #fff; padding: 3px 6px; font-size: 12px; font-weight: 800; margin: 4px 0;">
          {{ bioTypography.thermalLabelPayload().primaryRx }}
        </div>
        <div style="font-size: 10px; font-variant-numeric: slashed-zero tabular-nums;">
          {{ bioTypography.thermalLabelPayload().dosageSchedule }}<br>
          {{ bioTypography.thermalLabelPayload().allergyAlert }}
        </div>
        <div style="font-size: 9px; border-top: 1px solid #000; margin-top: 4px; padding-top: 2px; display: flex; justify-content: space-between;">
          <span>MRN: {{ bioTypography.thermalLabelPayload().mrn }} [{{ bioTypography.thermalLabelPayload().brailleMrn }}]</span>
          <span>{{ bioTypography.thermalLabelPayload().sloanApertureStatus }}</span>
        </div>
      </div>

      <!-- 🧬 SECTION 1: 3D ANATOMY & SUMMARY -->
      @if (activeWorkspaceTab() === 'anatomy' || activeWorkspaceTab() === 'all') {
        <!-- 3D Body Viewer Card -->
        <pocket-gull-card 
          id="tour-body-chart"
          title="3D Body Viewer" 
          [icon]="viewerIcon"
          [noPadding]="true">
          
          <div right-action (click)="isViewerExpanded.set(!isViewerExpanded())" class="cursor-pointer hover:bg-black/5 p-1 rounded-md transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-500 transition-transform duration-200" [class.rotate-180]="!isViewerExpanded()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </div>

          @if(isViewerExpanded()) {
            <div class="body-viewer-container min-h-[500px] sm:min-h-[540px] xl:min-h-[580px] overflow-hidden bg-white dark:bg-black/20 shrink-0 flex flex-col">
              <app-body-viewer class="shrink-0 flex-1 flex flex-col"></app-body-viewer>
            </div>
          }
        </pocket-gull-card>

        <!-- Instant Body Care Plan Sheet (Bottom-sheet drawer overlay) -->
        <app-instant-body-care-plan-sheet />

        <!-- Medical Summary Card -->
        <pocket-gull-card 
          title="Medical Summary" 
          [icon]="summaryIcon"
          [noPadding]="true">
          
          <div right-action (click)="isSummaryExpanded.set(!isSummaryExpanded())" class="cursor-pointer hover:bg-black/5 p-1 rounded-md transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-500 transition-transform duration-200" [class.rotate-180]="!isSummaryExpanded()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </div>

          @if(isSummaryExpanded()) {
            <div class="bg-white dark:bg-zinc-900 shrink-0 min-h-0 min-w-0 border-b border-gray-100 dark:border-zinc-800 last:border-0 p-0">
               <app-medical-summary class="block"></app-medical-summary>
            </div>
          }
        </pocket-gull-card>
      }

      <!-- 📈 SECTION 2: VITALS & BIO -->
      @if (activeWorkspaceTab() === 'vitals' || activeWorkspaceTab() === 'all') {
        <!-- Sentinel Outbreak & Telemetry Plotter Section -->
        @if (isSentinel()) {
          <app-sentinel-triage class="block w-full"></app-sentinel-triage>
          <app-sentinel-telemetry-plotter class="block w-full"></app-sentinel-telemetry-plotter>
        }

        <!-- Multi-Paradigm Longitudinal Vitals & WHO SDG 3.4 Card -->
        <pocket-gull-card 
          title="Multi-Paradigm Longitudinal Vitals &amp; WHO SDG 3.4" 
          [icon]="sparklineIcon"
          [noPadding]="false">
          
          <div right-action (click)="isSparklinesExpanded.set(!isSparklinesExpanded())" class="cursor-pointer hover:bg-black/5 p-1 rounded-md transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-500 transition-transform duration-200" [class.rotate-180]="!isSparklinesExpanded()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </div>

          @if(isSparklinesExpanded()) {
            <div class="space-y-4 pt-1">
              
              <!-- WHO 10-Year CVD Risk & ICD-11 Dual-Codes Bar -->
              @if(whoRisk(); as risk) {
                <div class="px-3 py-2 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 border-l-4 border-l-sky-500 flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono">
                  <div class="flex items-center gap-2">
                    <span class="inline-block w-1.5 h-1.5 bg-sky-500 rounded-2xs"></span>
                    <span class="font-bold text-zinc-800 dark:text-zinc-200 text-[11px] uppercase tracking-wider">
                      WHO SDG 3.4 CVD TELEMETRY:
                    </span>
                    <span class="font-black tracking-tight" [ngClass]="risk.color">
                      [{{ risk.riskScorePercent }}% ▪ {{ risk.riskTier }}]
                    </span>
                  </div>

                  <!-- ICD-11 Dual-Codes Tags -->
                  <div class="flex items-center gap-1.5 flex-wrap">
                    @for (code of whoIcd11Codes(); track $index) {
                      <span class="px-1.5 py-0.5 text-[10px] font-mono font-bold border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sky-700 dark:text-sky-300">
                        {{ code.icd11Tm1Code }}
                      </span>
                    }
                  </div>
                </div>
              }

              <!-- 4 Multi-Paradigm Sparklines Grid -->
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <app-longitudinal-trend-sparkline
                  metricTitle="HRV rMSSD"
                  unit="ms"
                  paradigm="western"
                  [dataPoints]="[
                    { date: 'May 1', value: 38 },
                    { date: 'Jun 1', value: 41 },
                    { date: 'Jul 1', value: 40 },
                    { date: 'Jul 15', value: 44 },
                    { date: 'Aug 1', value: 48 },
                    { date: 'Aug 15', value: 52 },
                    { date: 'Aug 21', value: 55 }
                  ]"
                  [targetRange]="{ min: 45, max: 65 }">
                </app-longitudinal-trend-sparkline>

                <app-longitudinal-trend-sparkline
                  metricTitle="Spleen Qi Index"
                  unit="pts"
                  paradigm="tcm"
                  [dataPoints]="[
                    { date: 'May 1', value: 60 },
                    { date: 'Jun 1', value: 62 },
                    { date: 'Jul 1', value: 65 },
                    { date: 'Jul 15', value: 68 },
                    { date: 'Aug 1', value: 72 },
                    { date: 'Aug 15', value: 74 },
                    { date: 'Aug 21', value: 78 }
                  ]"
                  [targetRange]="{ min: 70, max: 90 }">
                </app-longitudinal-trend-sparkline>

                <app-longitudinal-trend-sparkline
                  metricTitle="Vata Stability"
                  unit="pts"
                  paradigm="ayurveda"
                  [dataPoints]="[
                    { date: 'May 1', value: 40 },
                    { date: 'Jun 1', value: 45 },
                    { date: 'Jul 1', value: 52 },
                    { date: 'Jul 15', value: 58 },
                    { date: 'Aug 1', value: 64 },
                    { date: 'Aug 15', value: 70 },
                    { date: 'Aug 21', value: 75 }
                  ]"
                  [targetRange]="{ min: 65, max: 85 }">
                </app-longitudinal-trend-sparkline>

                <app-longitudinal-trend-sparkline
                  metricTitle="Somatic Strain"
                  unit="pts"
                  paradigm="osteopathic"
                  [dataPoints]="[
                    { date: 'May 1', value: 75 },
                    { date: 'Jun 1', value: 70 },
                    { date: 'Jul 1', value: 68 },
                    { date: 'Jul 15', value: 62 },
                    { date: 'Aug 1', value: 55 },
                    { date: 'Aug 15', value: 48 },
                    { date: 'Aug 21', value: 42 }
                  ]"
                  [targetRange]="{ min: 20, max: 45 }">
                </app-longitudinal-trend-sparkline>
              </div>

            </div>
          }
        </pocket-gull-card>

        <!-- Biometric Trends Card -->
        <pocket-gull-card 
          title="Biometric Trends" 
          [icon]="biometricIcon"
          [noPadding]="true">
          
          <div right-action (click)="isBiometricExpanded.set(!isBiometricExpanded())" class="cursor-pointer hover:bg-black/5 p-1 rounded-md transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-500 transition-transform duration-200" [class.rotate-180]="!isBiometricExpanded()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </div>

          @if(isBiometricExpanded()) {
            <div class="h-[250px] overflow-hidden bg-white dark:bg-black/20 shrink-0 p-4">
               <app-biometric-history-chart></app-biometric-history-chart>
            </div>
          }
        </pocket-gull-card>
      }

      <!-- 🩻 SECTION 3: IMAGING & EXPOSOMICS -->
      @if (activeWorkspaceTab() === 'imaging' || activeWorkspaceTab() === 'all') {
        <!-- Patient Scans Card -->
        <pocket-gull-card 
          title="DICOM Viewer" 
          [icon]="scansIcon"
          [noPadding]="true">
          
          <div right-action (click)="isScansExpanded.set(!isScansExpanded())" class="cursor-pointer hover:bg-black/5 p-1 rounded-md transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-500 transition-transform duration-200" [class.rotate-180]="!isScansExpanded()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </div>

          @if(isScansExpanded()) {
            <div class="p-6 bg-[#F9FAFB]/50 dark:bg-zinc-900/50 min-h-0 space-y-6">
              <app-dicom-viewer class="shrink-0"></app-dicom-viewer>
              <div class="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <h4 class="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Diagnostic Scans &amp; Modalities</h4>
                <app-patient-scans [scans]="patientScans()"></app-patient-scans>
              </div>
            </div>
          }
        </pocket-gull-card>

        <!-- Environmental Exposomics & Acute Toxicology Card -->
        <pocket-gull-card 
          title="Environmental Exposomics &amp; Acute Toxicology" 
          [icon]="toxicologyIcon"
          [noPadding]="false">
          
          <div right-action (click)="isToxicologyExpanded.set(!isToxicologyExpanded())" class="cursor-pointer hover:bg-black/5 p-1 rounded-md transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-500 transition-transform duration-200" [class.rotate-180]="!isToxicologyExpanded()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </div>

          @if(isToxicologyExpanded()) {
            <div class="pt-2">
              <app-environmental-exposomics-toxicology></app-environmental-exposomics-toxicology>
            </div>
          }
        </pocket-gull-card>
      }

      <!-- ⏳ SECTION 4: HISTORY & TIMELINE -->
      @if (activeWorkspaceTab() === 'timeline' || activeWorkspaceTab() === 'all') {
        <!-- Patient History Card -->
        <pocket-gull-card 
          title="Patient History" 
          [icon]="historyIcon"
          [noPadding]="true">
          
          <div right-action class="flex items-center gap-2">
                @if(historyBodyParts().length > 0) {
                    <div class="flex items-center gap-1 overflow-x-auto max-w-[280px] sm:max-w-none hide-scrollbar">
                        <button type="button" 
                          (click)="$event.stopPropagation(); historyFilter.set(null)"
                          [class.bg-emerald-600]="!historyFilter()"
                          [class.text-white]="!historyFilter()"
                          [class.bg-zinc-100]="historyFilter()"
                          [class.dark:bg-zinc-800]="historyFilter()"
                          [class.text-zinc-700]="historyFilter()"
                          [class.dark:text-zinc-300]="historyFilter()"
                          class="px-2 py-1 rounded-md text-[10px] font-mono font-bold uppercase transition cursor-pointer">
                          ALL
                        </button>
                        @for(part of historyBodyParts(); track part.id) {
                            <button type="button" 
                              (click)="$event.stopPropagation(); historyFilter.set(part.id)"
                              [class.bg-emerald-600]="historyFilter() === part.id"
                              [class.text-white]="historyFilter() === part.id"
                              [class.bg-zinc-100]="historyFilter() !== part.id"
                              [class.dark:bg-zinc-800]="historyFilter() !== part.id"
                              [class.text-zinc-700]="historyFilter() !== part.id"
                              [class.dark:text-zinc-300]="historyFilter() !== part.id"
                              class="px-2 py-1 rounded-md text-[10px] font-mono font-bold uppercase transition cursor-pointer whitespace-nowrap">
                              {{ part.name }}
                            </button>
                        }
                    </div>
                }
                <div (click)="isHistoryExpanded.set(!isHistoryExpanded())" class="cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 p-1 rounded-md transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-500 transition-transform duration-200" [class.rotate-180]="!isHistoryExpanded()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </div>
          </div>
          
          @if(isHistoryExpanded()) {
            <div class="flex flex-col min-h-0">
              <div #historyContainer class="p-6 scroll-smooth">
                @if(selectedPatient()?.history; as history) {
                  <app-patient-history-timeline 
                    [history]="filteredHistory()"
                    [activeVisit]="state.viewingPastVisit()"
                    (review)="reviewVisit($event)"
                    (reviewAnalysis)="reviewAnalysis($event)"
                    (reviewNote)="reviewNote($event)"
                    (deleteNote)="deleteNote($event)"
                    (openBookmark)="openBookmarkInResearchFrame($event)"
                  ></app-patient-history-timeline>
                }

                @if ((selectedPatient()?.history?.length ?? 0) === 0) {
                  <div class="h-32 flex flex-col items-center justify-center text-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 mb-2 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>
                    <p class="text-xs font-bold uppercase tracking-[0.15em]">No recorded activity</p>
                  </div>
                }
              </div>
            </div>
          }
        </pocket-gull-card>
      }

    </div>
  `
})
export class MedicalChartComponent {
  state = inject(PatientStateService);
  patientManager = inject(PatientManagementService);
  dictation = inject(DictationService);
  globalHealth = inject(GlobalHealthInitiativesService);
  bioTypography = inject(BioAdaptiveTypographyService);

  historyContainer = viewChild<ElementRef<HTMLDivElement>>('historyContainer');

  el = inject(ElementRef, { optional: true });
  platformId = inject(PLATFORM_ID, { optional: true });

  // --- Active Workspace Tab for Zero-Scroll Mode ---
  activeWorkspaceTab = signal<'anatomy' | 'vitals' | 'imaging' | 'timeline' | 'all'>('anatomy');

  viewerIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-5.25v9" />
    </svg>
  `;
  sparklineIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  `;
  biometricIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M3 12h2l2-7 3 14 3-10 2 3h6" />
    </svg>
  `;
  historyIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  `;
  summaryIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  `;
  scansIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  `;
  toxicologyIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.942A4.5 4.5 0 0115.89 16.5H8.11a4.5 4.5 0 01-2.34-.658L4.2 14.9" />
    </svg>
  `;

  // --- Accordion State ---
  isViewerExpanded = signal(true);
  isSparklinesExpanded = signal(true);
  isBiometricExpanded = signal(true);
  isToxicologyExpanded = signal(true);
  isSummaryExpanded = signal(true);
  isHistoryExpanded = signal(true);
  isScansExpanded = signal(true);

  historyFilter = signal<string | null>(null);

  selectedPatient = computed(() => {
    const selectedId = this.patientManager.selectedPatientId();
    if (!selectedId) return null;
    return this.patientManager.patients().find(p => p.id === selectedId);
  });

  whoRisk = computed(() => {
    const patient = this.selectedPatient();
    return patient ? this.globalHealth.calculateWhoCvdRisk(patient) : null;
  });

  whoIcd11Codes = computed(() => {
    const patient = this.selectedPatient();
    if (!patient) return [];
    const conditions = patient.preexistingConditions || [];
    const issueDescriptions = Object.values(patient.issues || {}).flat().map(i => i.description || '');
    return this.globalHealth.mapToWhoIcd11Chapter26([...conditions, ...issueDescriptions]);
  });

  patientScans = computed(() => this.selectedPatient()?.scans || []);

  isReviewMode = computed(() => !!this.state.viewingPastVisit());

  isSentinel = computed(() => {
    const patient = this.selectedPatient();
    return !!patient && (patient.name.toLowerCase().includes('sentinel') || ['p004', 'p005', 'p006', 'p007'].includes(patient.id));
  });

  historyBodyParts = computed(() => {
    const history = this.selectedPatient()?.history || [];
    const parts = new Map<string, string>(); // id -> name
    history.forEach(entry => {
      if (entry.type === 'NoteCreated') {
        const match = entry.summary.match(/Note for (.*?)(:|\s\()/);
        const name = match ? match[1] : entry.partId;
        if (!parts.has(entry.partId)) {
          parts.set(entry.partId, name);
        }
      } else if (entry.type === 'Visit' && entry.state?.issues) {
        Object.values(entry.state.issues).flat().forEach(issue => {
          if (!parts.has(issue.id)) {
            parts.set(issue.id, issue.name);
          }
        });
      }
    });
    return Array.from(parts.entries()).map(([id, name]) => ({ id, name }));
  });

  filteredHistory = computed(() => {
    const history = this.selectedPatient()?.history || [];
    const filter = this.historyFilter();
    if (!filter) {
      return history;
    }
    return history.filter(entry => {
      switch (entry.type) {
        case 'NoteCreated':
          return entry.partId === filter;
        case 'Visit':
        case 'ChartArchived':
          return !!entry.state?.issues[filter];
        case 'AnalysisRun':
        case 'PatientSummaryUpdate':
        case 'FinalizedPatientSummary':
        case 'BookmarkAdded':
          return true;
        default:
          return false;
      }
    });
  });




  reviewVisit(entry: HistoryEntry) {
    const patient = this.selectedPatient();
    if (!patient || (entry.type !== 'Visit' && entry.type !== 'ChartArchived')) return;
    this.patientManager.loadArchivedVisit(patient.id, entry);
  }

  reviewAnalysis(entry: HistoryEntry) {
    const patient = this.selectedPatient();
    if (!patient || entry.type !== 'AnalysisRun') return;
    this.patientManager.loadArchivedAnalysis(entry);
  }

  reviewNote(entry: HistoryEntry) {
    const patient = this.selectedPatient();
    if (!patient || entry.type !== 'NoteCreated') return;

    // Find the Visit/Chart entry that contains this note
    const history = patient.history || [];
    const parentVisit = history.find(h =>
      (h.type === 'Visit' || h.type === 'ChartArchived') &&
      h.state?.issues[entry.partId]?.some(note => note.noteId === entry.noteId)
    );

    if (parentVisit) {
      // Load that visit's state and select the note
      this.patientManager.loadArchivedVisit(
        patient.id,
        parentVisit,
        { partId: entry.partId, noteId: entry.noteId }
      );
    } else {
      // Fallback for current notes that might have a NoteCreated entry but aren't archived yet
      this.state.selectPart(entry.partId);
      this.state.selectNote(entry.noteId);
    }
  }

  deleteNote(entry: HistoryEntry) {
    if (entry.type !== 'NoteCreated') return;

    // Deselect if it's the currently viewed note
    if (this.state.selectedNoteId() === entry.noteId) {
      this.state.selectPart(null);
    }

    this.patientManager.deleteNoteAndHistory(entry);
  }

  returnToCurrent() {
    this.patientManager.reloadCurrentPatient();
  }

  openBookmarkInResearchFrame(url: string) {
    this.state.toggleResearchFrame(true);
    this.state.requestResearchUrl(url);
  }

  printBedsideThermalTicket(): void {
    if (typeof document !== 'undefined') {
      document.body.classList.add('printing-thermal');
      this.bioTypography.printBedsideThermalLabel();
      setTimeout(() => {
        document.body.classList.remove('printing-thermal');
      }, 1000);
    }
  }
}