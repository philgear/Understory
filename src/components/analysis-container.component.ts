import { Component, ChangeDetectionStrategy, signal, inject, computed, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalysisReportComponent } from './analysis-report.component';
import { PatientStateService } from '../services/patient-state.service';
import { AiCacheService } from '../services/ai-cache.service';
import { ClinicalIntelligenceService } from '../services/clinical-intelligence.service';
import { APP_VERSION } from '../version';
import { ExportService } from '../services/export.service';
import { NetworkStateService } from '../services/network-state.service';
import { PatientManagementService } from '../services/patient-management.service';
import { ClinicalIcons } from '../assets/clinical-icons';
import { GamificationService } from '../services/gamification.service';
import { GcpHealthcareApiService } from '../services/fhir/gcp-healthcare-api.service';

import { MyChartBriefModalComponent } from './modals/mychart-brief-modal.component';
import { FamilyTreePedigreeComponent } from './family-tree-pedigree.component';
import { PatientStoryModalComponent } from './modals/patient-story-modal.component';
import { DomainSuitesNavigatorComponent } from './suites/domain-suites-navigator.component';
import { ComponentDrilldownUnitComponent } from './component-drilldown-unit.component';
import { CounterfactualSimulatorComponent } from './counterfactual-simulator.component';
import { SoapNoteGeneratorComponent } from './soap-note-generator.component';
import { CohortTriageMatrixComponent } from './cohort-triage-matrix.component';
import { HipaaPdfExportComponent } from './hipaa-pdf-export.component';
import { ClinicalUxEvaluationHubComponent } from './clinical-ux-evaluation-hub.component';
import { EdgeMlHudComponent } from './edge-ml-hud/edge-ml-hud.component';
import { SteeepQualityHudComponent } from './steeep-quality-hud/steeep-quality-hud.component';
import { LensBiomolecularPhysicsComponent } from './turing/lens-biomolecular-physics.component';
import { LensPhysicalGenomicsComponent } from './turing/lens-physical-genomics.component';
import { HobbyDomainCompanionComponent } from './hobby-domain-companion.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-analysis-container',
  standalone: true,
  host: {
    'class': 'flex flex-col flex-1 min-h-0 h-full w-full overflow-hidden max-md:h-full max-md:min-h-[calc(100dvh-140px)]'
  },
  imports: [
    CommonModule, 
    CounterfactualSimulatorComponent, 
    SoapNoteGeneratorComponent, 
    CohortTriageMatrixComponent, 
    HipaaPdfExportComponent, 
    AnalysisReportComponent, 
    DomainSuitesNavigatorComponent, 
    ComponentDrilldownUnitComponent, 
    MyChartBriefModalComponent, 
    FamilyTreePedigreeComponent, 
    PatientStoryModalComponent, 
    ClinicalUxEvaluationHubComponent,
    EdgeMlHudComponent,
    SteeepQualityHudComponent,
    LensBiomolecularPhysicsComponent,
    LensPhysicalGenomicsComponent,
    HobbyDomainCompanionComponent
  ],
  template: `
    <div class="flex flex-col flex-1 h-full w-full overflow-hidden max-md:h-full max-md:min-h-[calc(100dvh-140px)] bg-[#F3F4F6] dark:bg-zinc-950">
      
      <!-- Interactive Component Drill-Down Modal -->
      <app-component-drilldown-unit />
      
      <!-- Main Content Container -->
      <div class="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden max-md:h-full max-md:min-h-[calc(100dvh-140px)]">
        
        <!-- Top Toolbar / Header -->
        @if (!state.isEmergencyMode()) {
          @let isWestern = state.activePhilosophy() === 'western';
          @let isEastern = state.activePhilosophy() === 'eastern';
          @let isAyurvedic = state.activePhilosophy() === 'ayurvedic';

          <div class="min-h-[48px] py-1.5 bg-zinc-950 border-b border-zinc-800 flex flex-wrap items-center justify-between px-3 sm:px-6 shrink-0 relative z-10 font-mono gap-2 text-zinc-100">
              
            <!-- Geographical Clinical Paradigm Selector (Precision Segmented Rail) -->
            <div class="flex items-center border border-zinc-800 bg-zinc-900 overflow-x-auto max-w-full font-mono divide-x divide-zinc-800">
              <span class="hidden md:inline text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500 px-2.5 py-1.5 select-none">
                PARADIGM:
              </span>

              <!-- Western Clinical (North America & Europe) -->
              <button (click)="selectPhilosophy('western')"
                title="Western Clinical Medicine (North America & Europe)"
                [class]="isWestern
                  ? 'flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold tracking-wider uppercase transition-all select-none cursor-pointer bg-amber-500 text-zinc-950'
                  : 'flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold tracking-wider uppercase transition-all select-none cursor-pointer bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'">
                <span>WESTERN</span>
              </button>

              <!-- Eastern TCM (East Asia Zang-Fu) -->
              <button (click)="selectPhilosophy('eastern')"
                title="Eastern TCM Medicine (East Asian Zang-Fu)"
                [class]="isEastern
                  ? 'flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold tracking-wider uppercase transition-all select-none cursor-pointer bg-amber-500 text-zinc-950'
                  : 'flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold tracking-wider uppercase transition-all select-none cursor-pointer bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'">
                <span>EASTERN</span>
              </button>

              <!-- Ayurvedic (South Asia Vedic) -->
              <button (click)="selectPhilosophy('ayurvedic')"
                title="Ayurvedic Medicine (South Asian Vedic Dosha)"
                [class]="isAyurvedic
                  ? 'flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold tracking-wider uppercase transition-all select-none cursor-pointer bg-amber-500 text-zinc-950'
                  : 'flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold tracking-wider uppercase transition-all select-none cursor-pointer bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'">
                <span>AYURVEDIC</span>
              </button>

              <!-- View Mode Switcher: Classic Lenses vs Functional Domain Suites -->
              <button type="button" (click)="viewMode.set(viewMode() === 'lenses' ? 'suites' : 'lenses')"
                title="Toggle between Classic Multi-Lens Report and Functional Domain Suites (Paradigm Diff Engine)"
                [class]="viewMode() === 'suites'
                  ? 'flex items-center gap-1 px-3 py-1.5 text-[11px] font-mono font-bold uppercase bg-teal-500 text-zinc-950 transition cursor-pointer'
                  : 'flex items-center gap-1 px-3 py-1.5 text-[11px] font-mono font-bold uppercase bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 transition cursor-pointer'">
                <span>{{ viewMode() === 'lenses' ? '🧬 DOMAIN SUITES' : '📄 LENSES' }}</span>
              </button>
            </div>

            <!-- Clinical Workflows & Studio Dropdown -->
            <div class="flex items-center gap-2 font-mono ml-auto">
              @if (justGenerated() && hasReport() && !intelligence.isLoading()) {
                <div class="hidden lg:flex items-center gap-1.5 px-2 py-1 bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold uppercase tracking-wider text-orange-400">
                   <span class="w-1.5 h-1.5 bg-orange-500 rounded-2xs"></span>
                   <span>[SYNCED]</span>
                </div>
              }

              <!-- Edge ML ONNX WebGPU Engine Button -->
              <button type="button" (click)="showEdgeAiModal.set(!showEdgeAiModal())"
                title="Open Edge ML &amp; ONNX WebGPU Continuous Risk Scoring Engine"
                [class]="showEdgeAiModal()
                  ? 'flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase border border-teal-400 bg-teal-500 text-zinc-950 transition cursor-pointer'
                  : 'flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase border border-teal-500/40 bg-teal-500/10 text-teal-300 hover:bg-teal-600 hover:text-white transition cursor-pointer'">
                <span>[⚡ EDGE AI]</span>
              </button>

              <!-- NAM STEEEP Quality Audit Button -->
              <button type="button" (click)="showSteeepModal.set(!showSteeepModal())"
                title="Open National Academy of Medicine (NAM) STEEEP 6-Axis Quality Radar"
                [class]="showSteeepModal()
                  ? 'flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase border border-amber-400 bg-amber-500 text-zinc-950 transition cursor-pointer'
                  : 'flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-600 hover:text-white transition cursor-pointer'">
                <span>[📊 STEEEP]</span>
              </button>

              <!-- Frontier Molecular Biophysics Button -->
              <button type="button" (click)="showBiophysicsModal.set(!showBiophysicsModal())"
                title="Open Frontier Molecular Biophysics & Chemical Systems Suite (LLPS, PROTAC, Quantum Cryptochrome, MOF)"
                [class]="showBiophysicsModal()
                  ? 'flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase border border-cyan-400 bg-cyan-500 text-zinc-950 transition cursor-pointer'
                  : 'flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-600 hover:text-white transition cursor-pointer'">
                <span>[⚛️ BIOPHYSICS]</span>
              </button>

              <!-- Physical Genomics & 3D Genome Engineering Button -->
              <button type="button" (click)="showGenomicsModal.set(!showGenomicsModal())"
                title="Open Physical Genomics & 3D Genome Engineering Suite (Loop Extrusion, Super-Enhancers, CRISPR R-Loop, Nucleosome Tweezers)"
                [class]="showGenomicsModal()
                  ? 'flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase border border-teal-400 bg-teal-500 text-zinc-950 transition cursor-pointer'
                  : 'flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase border border-teal-500/40 bg-teal-500/10 text-teal-300 hover:bg-teal-600 hover:text-white transition cursor-pointer'">
                <span>[🧬 GENOMICS]</span>
              </button>

              <!-- Ambient SOAP Note Generator Button -->
              <button type="button" (click)="showSoapModal.set(!showSoapModal())"
                title="Open Ambient Real-Time FHIR R4 SOAP Note Generator"
                [class]="showSoapModal()
                  ? 'flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase border border-purple-400 bg-purple-500 text-zinc-950 transition cursor-pointer'
                  : 'flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase border border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-600 hover:text-white transition cursor-pointer'">
                <span>[SOAP NOTE]</span>
              </button>

              <!-- What-If Sandbox Simulator Toggle Button -->
              <button type="button" (click)="showSimulatorModal.set(!showSimulatorModal())"
                title="Open Interactive What-If Counterfactual Health Simulator"
                [class]="showSimulatorModal()
                  ? 'flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase border border-emerald-400 bg-emerald-500 text-zinc-950 transition cursor-pointer'
                  : 'flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-600 hover:text-white transition cursor-pointer'">
                <span>[WHAT-IF]</span>
              </button>

              <!-- Clinical Studio Overflow Dropdown -->
              <div class="relative">
                <button type="button" (click)="showToolsMenu.set(!showToolsMenu())"
                  title="Clinical Studio &amp; Advanced Analysis Tools"
                  [class]="(showCohortMatrixModal() || showHipaaPdfModal() || showEdgeAiModal() || showSteeepModal() || showBiophysicsModal() || showToolsMenu())
                    ? 'flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase border border-zinc-600 bg-zinc-800 text-zinc-100 transition cursor-pointer'
                    : 'flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 transition cursor-pointer'">
                  <span>STUDIO ▾</span>
                </button>

                @if (showToolsMenu()) {
                  <div class="absolute right-0 top-full mt-1 w-56 p-1.5 bg-zinc-950 border border-zinc-800 shadow-2xl z-50 flex flex-col gap-1 text-xs font-mono">
                    <button (click)="showEdgeAiModal.set(!showEdgeAiModal()); showToolsMenu.set(false)"
                      class="w-full text-left px-3 py-2 text-teal-300 hover:bg-zinc-900 hover:text-white transition flex items-center justify-between cursor-pointer">
                      <span>⚡ Edge AI &amp; ONNX WebGPU</span>
                      @if (showEdgeAiModal()) { <span class="text-teal-400">✓</span> }
                    </button>
                    <button (click)="showSteeepModal.set(!showSteeepModal()); showToolsMenu.set(false)"
                      class="w-full text-left px-3 py-2 text-amber-300 hover:bg-zinc-900 hover:text-white transition flex items-center justify-between cursor-pointer">
                      <span>📊 NAM STEEEP Quality Radar</span>
                      @if (showSteeepModal()) { <span class="text-amber-400">✓</span> }
                    </button>
                    <button (click)="showBiophysicsModal.set(!showBiophysicsModal()); showToolsMenu.set(false)"
                      class="w-full text-left px-3 py-2 text-cyan-300 hover:bg-zinc-900 hover:text-white transition flex items-center justify-between cursor-pointer">
                      <span>⚛️ Molecular Biophysics</span>
                      @if (showBiophysicsModal()) { <span class="text-cyan-400">✓</span> }
                    </button>
                    <button (click)="showGenomicsModal.set(!showGenomicsModal()); showToolsMenu.set(false)"
                      class="w-full text-left px-3 py-2 text-teal-300 hover:bg-zinc-900 hover:text-white transition flex items-center justify-between cursor-pointer">
                      <span>🧬 Physical Genomics</span>
                      @if (showGenomicsModal()) { <span class="text-teal-400">✓</span> }
                    </button>
                    <button (click)="showCohortMatrixModal.set(!showCohortMatrixModal()); showToolsMenu.set(false)"
                      class="w-full text-left px-3 py-2 text-zinc-300 hover:bg-zinc-900 hover:text-white transition flex items-center justify-between cursor-pointer">
                      <span>📊 Cohort Matrix</span>
                      @if (showCohortMatrixModal()) { <span class="text-blue-400">✓</span> }
                    </button>
                    <button (click)="showHipaaPdfModal.set(!showHipaaPdfModal()); showToolsMenu.set(false)"
                      class="w-full text-left px-3 py-2 text-zinc-300 hover:bg-zinc-900 hover:text-white transition flex items-center justify-between cursor-pointer">
                      <span>📄 HIPAA PDF Audit</span>
                      @if (showHipaaPdfModal()) { <span class="text-amber-400">✓</span> }
                    </button>
                    <button (click)="showMyChartModal.set(true); showToolsMenu.set(false)"
                      class="w-full text-left px-3 py-2 text-zinc-300 hover:bg-zinc-900 hover:text-white transition flex items-center justify-between cursor-pointer">
                      <span>📋 Brief Care Card</span>
                    </button>
                    <button (click)="showPedigreeModal.set(true); showToolsMenu.set(false)"
                      class="w-full text-left px-3 py-2 text-zinc-300 hover:bg-zinc-900 hover:text-white transition flex items-center justify-between cursor-pointer">
                      <span>🌳 Pedigree Tree</span>
                    </button>
                    <button (click)="showStoryModal.set(true); showToolsMenu.set(false)"
                      class="w-full text-left px-3 py-2 text-zinc-300 hover:bg-zinc-900 hover:text-white transition flex items-center justify-between cursor-pointer">
                      <span>📖 Patient Story</span>
                    </button>
                    <button (click)="showEvaluationHubModal.set(true); showToolsMenu.set(false)"
                      class="w-full text-left px-3 py-2 text-indigo-300 hover:bg-zinc-900 hover:text-white transition flex items-center justify-between cursor-pointer">
                      <span>📐 NN/g Usability HUD</span>
                    </button>
                    <button (click)="showHobbyCompanionModal.set(!showHobbyCompanionModal()); showToolsMenu.set(false)"
                      class="w-full text-left px-3 py-2 text-amber-300 hover:bg-zinc-900 hover:text-white transition flex items-center justify-between cursor-pointer">
                      <span>🎨 SNO-10 Craft Confidant</span>
                      @if (showHobbyCompanionModal()) { <span class="text-amber-400">✓</span> }
                    </button>
                    <button (click)="syncGcpHealthcare(); showToolsMenu.set(false)"
                      class="w-full text-left px-3 py-2 text-zinc-300 hover:bg-zinc-900 hover:text-white transition flex items-center justify-between cursor-pointer">
                      <span>☁️ GCP Healthcare Sync</span>
                    </button>
                  </div>
                }
              </div>
            </div>
          </div>
        }

        <div class="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden relative">
          <div class="flex-1 min-h-0 min-w-0 h-full flex flex-col overflow-y-auto transition-all duration-300 p-4 sm:p-6">
            
            <!-- SNO-10 Craft & Passion Confidant Studio Panel -->
            @if (showHobbyCompanionModal()) {
              <div class="mb-4 w-full shrink-0">
                <app-hobby-domain-companion />
              </div>
            }

            <!-- Edge AI & ONNX WebGPU Continuous Risk Scoring Panel -->
            @if (showEdgeAiModal()) {
              <div class="mb-4 w-full shrink-0">
                <app-edge-ml-hud></app-edge-ml-hud>
              </div>
            }

            <!-- NAM STEEEP Quality Audit Panel -->
            @if (showSteeepModal()) {
              <div class="mb-4 w-full shrink-0">
                <app-steeep-quality-hud></app-steeep-quality-hud>
              </div>
            }

            <!-- Frontier Molecular Biophysics Suite Panel -->
            @if (showBiophysicsModal()) {
              <div class="mb-4 w-full shrink-0">
                <app-lens-biomolecular-physics />
              </div>
            }

            <!-- Physical Genomics & 3D Genome Engineering Suite Panel -->
            @if (showGenomicsModal()) {
              <div class="mb-4 w-full shrink-0">
                <app-lens-physical-genomics />
              </div>
            }

            <!-- Cohort Triage Matrix Panel -->
            @if (showCohortMatrixModal()) {
              <div class="mb-4 w-full shrink-0">
                <app-cohort-triage-matrix />
              </div>
            }

            <!-- HIPAA Audit PDF Export Panel -->
            @if (showHipaaPdfModal()) {
              <div class="mb-4 w-full shrink-0">
                <app-hipaa-pdf-export />
              </div>
            }

            <!-- Ambient Real-Time SOAP Note Generator Panel -->
            @if (showSoapModal()) {
              <div class="mb-4 w-full shrink-0">
                <app-soap-note-generator />
              </div>
            }

            <!-- What-If Counterfactual Sandbox Panel -->
            @if (showSimulatorModal()) {
              <div class="mb-4 w-full shrink-0">
                <app-counterfactual-simulator />
              </div>
            }

            <div class="flex-1 flex flex-col min-h-0 min-w-0 h-full overflow-y-auto relative" [class.slide-in-panel]="isSlidingIn()">
                @if (state.isEmergencyMode()) {
                  <app-analysis-report class="flex-1 flex flex-col min-h-0 h-full w-full overflow-hidden" #reportRef></app-analysis-report>
                } @else if (viewMode() === 'suites') {
                  <app-domain-suites-navigator class="w-full h-auto block overflow-visible" />
                } @else {
                  <app-analysis-report class="flex-1 flex flex-col min-h-0 h-full w-full overflow-hidden" #reportRef></app-analysis-report>
                }
            </div>
          </div>
          
          <!-- Interactive Report Footer: Lens Navigation + Refresh & Clear + Metadata -->
          @if (hasReport() && !state.isEmergencyMode()) {
            <div class="shrink-0 mt-4 pt-4 border-t border-slate-200 dark:border-zinc-800 flex flex-col gap-4 font-mono no-print">
              
              <!-- Lens Navigation & Action Controls Toolbar -->
              <div class="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-100/90 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 shadow-sm">
                
                <!-- Sequential Lens Stepper Buttons -->
                @if (viewMode() === 'lenses') {
                  <div class="flex items-center gap-2" id="tour-footer-lens-navigation">
                    <button type="button" (click)="reportRef?.navigateToPreviousLens()"
                      [disabled]="!reportRef?.hasPreviousLens()"
                      class="px-3 py-1.5 rounded-xl border text-xs font-bold uppercase transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700">
                      <span>← Previous Lens</span>
                    </button>

                    <span class="text-xs font-bold text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/50">
                      {{ reportRef?.activeLens() || 'Summary Overview' }}
                    </span>

                    <button type="button" (click)="reportRef?.navigateToNextLens()"
                      [disabled]="!reportRef?.hasNextLens()"
                      class="px-3 py-1.5 rounded-xl border text-xs font-bold uppercase transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-500 shadow-sm">
                      <span>Next Lens →</span>
                    </button>
                  </div>
                }

                <!-- Footer Refresh Analysis & PAIR Data Card Actions -->
                <div class="flex items-center gap-2">
                  <button id="tour-generate-btn" type="button" (click)="triggerAnalysisGenerate()"
                    [disabled]="intelligence.isLoading()"
                    class="px-4 py-2.5 rounded-xl border text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer bg-emerald-700 text-white border-emerald-800 hover:bg-emerald-600 disabled:opacity-50 shadow-md">
                    <span>🔄 Refresh Analysis</span>
                  </button>
                </div>

              </div>

              <!-- Metadata Grid & Isolated System Actions -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6 font-['Inter'] opacity-90 hover:opacity-100 transition-opacity border-t border-zinc-200/50 dark:border-zinc-800/60 pt-3">
                <div class="space-y-1">
                  <div class="text-[12px] font-bold uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-200">System Identification</div>
                  <div class="text-[12px] font-semibold text-zinc-800 dark:text-zinc-300 uppercase tracking-widest">Pocket Gull Analysis Engine v{{ appVersion }}</div>
                </div>
                <div class="space-y-1">
                  <div class="text-[12px] font-bold uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-200">Analysis Metadata</div>
                  <div class="text-[12px] font-semibold text-zinc-800 dark:text-zinc-300 uppercase tracking-widest">Generated: {{ intelligence.lastRefreshTime() | date:'yyyy.MM.dd HH:mm:ss' }}</div>
                </div>
                <div class="space-y-1 md:text-right flex flex-col items-start md:items-end justify-between">
                  <div>
                    <div class="text-[12px] font-bold uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-200">Regulatory Status</div>
                    <div class="text-[12px] font-semibold text-zinc-800 dark:text-zinc-300 uppercase tracking-widest">AI Generated Evidence. Physician Oversight Mandated.</div>
                  </div>

                  <!-- Isolated Clear Cache Button (Moved far down from Refresh Analysis) -->
                  <div class="flex items-center gap-3 mt-2">
                    <button type="button" (click)="showEvaluationHubModal.set(true)"
                      title="Inspect NN/g 10 Usability Heuristics, Shannon ID, and Differential Privacy Telemetry"
                      class="text-[10px] font-bold uppercase tracking-wider text-indigo-500 hover:text-indigo-400 opacity-75 hover:opacity-100 transition flex items-center gap-1 cursor-pointer">
                      <span>📐 NN/g Usability HUD</span>
                    </button>
                    <span class="text-zinc-500 text-[10px]">•</span>
                    <button type="button" (click)="intelligence.clearCache()"
                      title="Clear AI completion cache and force model re-inference"
                      class="text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-red-400 opacity-60 hover:opacity-100 transition flex items-center gap-1 cursor-pointer">
                      <span>🗑️ Clear AI Cache</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          }
        </div>
      </div>

    <!-- Epic MyChart Physician Brief & Longevity Lab Modal -->
    @if (showMyChartModal()) {
      <app-mychart-brief-modal (closeModal)="showMyChartModal.set(false)"></app-mychart-brief-modal>
    }

    <!-- Family Health Pedigree Tree & Risk Branch Pruning Modal -->
    @if (showPedigreeModal()) {
      <app-family-tree-pedigree (closeModal)="showPedigreeModal.set(false)"></app-family-tree-pedigree>
    }

    <!-- TED-Style Patient Hero Journey Story Reader Modal -->
    @if (showStoryModal()) {
      <app-patient-story-modal (closeModal)="showStoryModal.set(false)"></app-patient-story-modal>
    }

    <!-- NN/g Usability & Clinical Evaluation Hub Modal -->
    @if (showEvaluationHubModal()) {
      <app-clinical-ux-evaluation-hub (closed)="showEvaluationHubModal.set(false)"></app-clinical-ux-evaluation-hub>
    }
  `,
  styles: [`
    :host { display: block; height: 100%; width: 100%; }
    .animate-in { animation: slideIn 0.3s ease-out; }
    @keyframes slideIn {
      from { transform: translateX(-100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideInRight3D {
      0% {
        transform: translateX(100%) scale(0.96);
        opacity: 0;
        filter: blur(4px);
        box-shadow: -20px 0 60px rgba(0, 0, 0, 0.4);
      }
      70% {
        transform: translateX(-0.5%) scale(1.002);
        opacity: 1;
        filter: blur(0);
      }
      100% {
        transform: translateX(0) scale(1);
        opacity: 1;
        filter: blur(0);
        box-shadow: none;
      }
    }

    .slide-in-panel {
      animation: slideInRight3D 0.48s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      will-change: transform, opacity, filter;
    }
  `]
})
export class AnalysisContainerComponent {
  appVersion = APP_VERSION;
  @ViewChild(AnalysisReportComponent) reportRef?: AnalysisReportComponent;
  state = inject(PatientStateService);
  patientManagement = inject(PatientManagementService);
  cache = inject(AiCacheService);
  intelligence = inject(ClinicalIntelligenceService);
  game = inject(GamificationService);
  exportService = inject(ExportService);
  gcpHealthcare = inject(GcpHealthcareApiService);
  network = inject(NetworkStateService);
  ClinicalIcons = ClinicalIcons;

  isSlidingIn = signal(true);
  viewMode = signal<'lenses' | 'suites'>('lenses');
  showSimulatorModal = signal(false);
  showSoapModal = signal(false);
  showEdgeAiModal = signal(false);
  showSteeepModal = signal(false);
  showBiophysicsModal = signal(false);
  showGenomicsModal = signal(false);
  showCohortMatrixModal = signal(false);
  showHipaaPdfModal = signal(false);
  showEvaluationHubModal = signal(false);
  showHobbyCompanionModal = signal(false);
  showMyChartModal = signal(false);
  showPedigreeModal = signal(false);
  showStoryModal = signal(false);
  showToolsMenu = signal(false);
  justGenerated = signal(false);

  constructor() {
    // Re-trigger 3D slide-in animation whenever a patient is selected or analysis completes
    effect(() => {
      const pId = this.patientManagement.selectedPatientId();
      const lastRefresh = this.intelligence.lastRefreshTime();
      if (pId || lastRefresh) {
        this.triggerSlideIn();
      }
    });
  }

  triggerSlideIn() {
    this.isSlidingIn.set(false);
    setTimeout(() => {
      this.isSlidingIn.set(true);
    }, 20);
  }

  async syncGcpHealthcare() {
    const res = await this.gcpHealthcare.syncToGcpHealthcareApi();
    alert(res.message);
  }

  exportPdf() {
    const reportText = Object.values(this.intelligence.analysisResults()).filter(Boolean).join('\n\n');
    this.exportService.exportPdfReport(
      reportText || 'Sample Patient Care Plan',
      this.state.patientName() || 'Patient'
    );
  }

  exportFhir() {
    const patientName = this.state.patientName() || 'Patient';
    const bundle = this.exportService.buildFhirR4Bundle({
      id: 'p001',
      name: patientName,
      issues: this.state.issues()
    });
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fhir_bundle_${patientName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
 
  triggerAnalysisGenerate() {
    this.justGenerated.set(true);
    this.game.completeQuest('generate_care_plan');
    this.triggerSlideIn();

    if (this.reportRef) {
      this.reportRef.generate();
    }
  }

  selectPhilosophy(philosophy: 'western' | 'eastern' | 'ayurvedic') {
    this.state.selectPhilosophy(philosophy);
    this.triggerSlideIn();
  }

  hasReport = computed(() => Object.keys(this.intelligence.analysisResults()).length > 0);
}
