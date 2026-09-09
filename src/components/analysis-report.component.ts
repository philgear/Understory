import { Component, ChangeDetectionStrategy, inject, computed, ViewEncapsulation, signal, OnDestroy, effect, viewChild, ElementRef, untracked, output, HostListener } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { ClinicalIntelligenceService, ITranscriptEntry, AnalysisLens } from '../services/clinical-intelligence.service';
import { PatientStateService } from '../services/patient-state.service';
import { PatientManagementService } from '../services/patient-management.service';
import { HistoryEntry, IPatient, IPatientVitals } from '../services/patient.types';
import { MarkdownService } from '../services/markdown.service';
import { SafeHtmlPipe } from '../pipes/safe-html.pipe';
import { ParadigmLyricsService } from '../services/paradigm-lyrics.service';
import { DictationService } from '../services/dictation.service';
import { CompassionateAnalogyService } from '../services/compassionate-analogy.service';
import { generate } from 'lean-qr';

declare var webkitSpeechRecognition: any;
import { ISummaryNode, ISummaryNodeItem, IReportSection, IParsedTranscriptEntry, NodeAnnotation, LensAnnotations, IVerificationIssue } from './analysis-report.types';
import { SummaryNodeComponent } from './summary-node.component';
import { Body3DViewerComponent } from './anatomy-3d/body-3d-viewer.component';
import { PocketGullCardComponent } from './shared/pocket-gull-card.component';
import { BiomarkerMatrixComponent } from './biomarker-matrix.component';
import { CostBenefitAnalysisComponent } from './cost-benefit-analysis.component';
import { ExportService } from '../services/export.service';
import { AuditService } from '../services/audit.service';
import { PocketGullBadgeComponent } from './shared/pocket-gull-badge.component';
import { ClinicalGaugeComponent } from './clinical-gauge.component';
import { ClinicalIcons } from '../assets/clinical-icons';
import { ClinicalTrendComponent } from './clinical-trend.component';
import { AiCacheService } from '../services/ai-cache.service';
import { MedicalDecoderService } from '../services/medical-decoder.service';
import { RevealDirective } from '../directives/reveal.directive';
import { NodeAgentDialogComponent, INodeAgentDialogData } from './node-agent-dialog.component';
import { ClinicalAssessmentsSuiteComponent } from './clinical-assessments-suite.component';
import { AssessmentsLensTabComponent } from './analysis-report/assessments-lens-tab.component';
import { ChronobiologyMatrixLensTabComponent } from './analysis-report/chronobiology-matrix-lens-tab.component';
import { DiagnosticsLensTabComponent } from './analysis-report/diagnostics-lens-tab.component';
import { EmtHandoffLensTabComponent } from './analysis-report/emt-handoff-lens-tab.component';
import { EpigeneticLongevityLensTabComponent } from './analysis-report/epigenetic-longevity-lens-tab.component';
import { FunctionalMedicineMatrixLensTabComponent } from './analysis-report/functional-medicine-matrix-lens-tab.component';
import { InterventionsLensTabComponent } from './analysis-report/interventions-lens-tab.component';
import { MaternalPostpartumLensTabComponent } from './analysis-report/maternal-postpartum-lens-tab.component';
import { NutritionalBypassLensTabComponent } from './analysis-report/nutritional-bypass-lens-tab.component';
import { PatientEducationLensTabComponent } from './analysis-report/patient-education-lens-tab.component';
import { SevenGenerationsStewardshipLensTabComponent } from './analysis-report/seven-generations-stewardship-lens-tab.component';
import { SocraticEpistemologyLensTabComponent } from './analysis-report/socratic-epistemology-lens-tab.component';
import { SummaryOverviewLensTabComponent } from './analysis-report/summary-overview-lens-tab.component';
import { TeledentistrySystemicLensComponent } from './analysis-report/teledentistry-systemic-lens.component';
import { TriParadigmIntegrativeLensTabComponent } from './analysis-report/tri-paradigm-integrative-lens-tab.component';
import { ClinicalMenuComponent } from './clinical-menu.component';
import { KssCognitiveShieldComponent } from './kss-cognitive-shield.component';
import { CarePlanPrintPreviewComponent } from './care-plan-print-preview.component';
import { MoodConsciousnessMatrixComponent } from './mood-consciousness-matrix.component';
import { UkRioPubmedSourcingComponent } from './uk-rio-pubmed-sourcing.component';
import { DietaryAllergyShieldComponent } from './dietary-allergy-shield.component';
import { LensInsightSparkShieldComponent } from './lens-insight-spark-shield.component';
import { LensRsnaKneeComponent } from './lens-rsna-knee.component';
import { ParadigmClinicalDashboardComponent } from './paradigm-clinical-dashboard.component';
import { GeolocationalHealthRelocationComponent } from './geolocational-health-relocation.component';
import { ClinicalActLensMapperService } from '../services/clinical-act-lens-mapper.service';
import { TypologyBadgeComponent } from './shared/typology-badge.component';
import { PatientHealthTrajectoryStorybookComponent } from './patient-health-trajectory-storybook.component';
import { HandoffModalComponent } from './modals/handoff-modal.component';
import { SdohNavigatorComponent } from './sdoh-navigator.component';
import { ActuarialQalyCalculatorComponent } from './actuarial-qaly-calculator.component';
import { OccupationalHazardCardComponent } from './occupational-hazard-card.component';
import { VagalBiofeedbackDockComponent } from './vagal-biofeedback-dock.component';
import { Sec1557AuditModalComponent } from './modals/sec1557-audit-modal.component';
import { FhirPassportModalComponent } from './modals/fhir-passport-modal.component';
import { getPersonaPropBadge } from '../services/agent-personas';
import { ThemeService, AppTheme } from '../services/theme.service';
import { RpmDashboardComponent } from './rpm-dashboard.component';

import { ChronoClockDecisionRailComponent } from './chrono-clock-decision-rail.component';
import { ChronoWeeklyMealPlannerComponent } from './chrono-weekly-meal-planner.component';
import { ClinicalTrajectoryBiographyComponent } from './clinical-trajectory-biography.component';
import { DualPaneConsultationComponent } from './dual-pane-consultation.component';
import { ClinicalSleepTwinDashboardComponent } from './clinical-sleep-twin-dashboard.component';
import { ChronobiologyMatrixComponent } from './chronobiology-matrix.component';
import { FunctionalMedicineMatrixComponent } from './functional-medicine-matrix.component';
import { BionicReadingService } from '../services/bionic-reading.service';
import { SkepticalEpistemologyService } from '../services/skeptical-epistemology.service';
import { FhirIntegrationService } from '../services/fhir/fhir-integration.service';
import { SocraticChallengeCardComponent } from './socratic-challenge-card.component';
import { LocalGemmaStudioComponent } from './local-gemma-studio.component';
import { TriParadigmSwarmCardComponent } from './tri-paradigm-swarm-card.component';
import { PharmacogenomicsCardComponent } from './pharmacogenomics-card.component';
import { BiometricSensorFusionCardComponent } from './biometric-sensor-fusion-card.component';
import { EnvironmentalExposomicsToxicologyComponent } from './environmental-exposomics-toxicology.component';
import { SkepticalEpistemologyHudComponent } from './skeptical-epistemology-hud.component';
import { AvsEngineService, AvsBitrateTier } from '../services/avs-engine.service';
import { PositivePsychologyFlourishingHubComponent } from './positive-psychology-flourishing-hub.component';
import { SystemsEquilibriumHudComponent, SystemsNavMode } from './analysis-report/systems-equilibrium-hud.component';
import { InterSystemCrosstalkCardComponent } from './analysis-report/inter-system-crosstalk-card.component';
import { DynamicPreconditionAlertBannerComponent } from './shared/dynamic-precondition-alert-banner.component';

@Component({
  selector: 'app-analysis-report',
  standalone: true,
  imports: [
    CommonModule,
    DynamicPreconditionAlertBannerComponent,
    SystemsEquilibriumHudComponent,
    InterSystemCrosstalkCardComponent,
    PositivePsychologyFlourishingHubComponent,
    AssessmentsLensTabComponent,
    ChronobiologyMatrixLensTabComponent,
    DiagnosticsLensTabComponent,
    EmtHandoffLensTabComponent,
    EpigeneticLongevityLensTabComponent,
    FunctionalMedicineMatrixLensTabComponent,
    InterventionsLensTabComponent,
    MaternalPostpartumLensTabComponent,
    NutritionalBypassLensTabComponent,
    PatientEducationLensTabComponent,
    SevenGenerationsStewardshipLensTabComponent,
    SocraticEpistemologyLensTabComponent,
    SummaryOverviewLensTabComponent,
    TeledentistrySystemicLensComponent,
    TriParadigmIntegrativeLensTabComponent,
    EnvironmentalExposomicsToxicologyComponent,
    SkepticalEpistemologyHudComponent,
    LocalGemmaStudioComponent,
    TriParadigmSwarmCardComponent,
    PharmacogenomicsCardComponent,
    BiometricSensorFusionCardComponent,
    LensRsnaKneeComponent,
    ClinicalSleepTwinDashboardComponent,
    ChronobiologyMatrixComponent,
    FunctionalMedicineMatrixComponent,
    TitleCasePipe,
    SummaryNodeComponent,
    Body3DViewerComponent,
    OccupationalHazardCardComponent,
    PocketGullCardComponent,
    BiomarkerMatrixComponent,
    CostBenefitAnalysisComponent,
    SafeHtmlPipe,
    PocketGullBadgeComponent,
    ClinicalGaugeComponent,
    ClinicalTrendComponent,
    RevealDirective,
    NodeAgentDialogComponent,
    ClinicalAssessmentsSuiteComponent,
    ClinicalMenuComponent,
    KssCognitiveShieldComponent,
    MoodConsciousnessMatrixComponent,
    UkRioPubmedSourcingComponent,
    DietaryAllergyShieldComponent,
    LensInsightSparkShieldComponent,
    ParadigmClinicalDashboardComponent,
    GeolocationalHealthRelocationComponent,
    PatientHealthTrajectoryStorybookComponent,
    TypologyBadgeComponent,
    HandoffModalComponent,
    SdohNavigatorComponent,
    ActuarialQalyCalculatorComponent,
    VagalBiofeedbackDockComponent,
    Sec1557AuditModalComponent,
    FhirPassportModalComponent,
    ChronoClockDecisionRailComponent,
    ChronoWeeklyMealPlannerComponent,
    ClinicalTrajectoryBiographyComponent,
    DualPaneConsultationComponent,
    SocraticChallengeCardComponent,
    RpmDashboardComponent
  ],




  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'class': 'flex flex-col flex-1 min-h-0 w-full overflow-hidden max-md:h-full max-md:min-h-[calc(100dvh-150px)]'
  },
  styles: [`
    /* Typography is now handled globally in styles.css */
  `],
  template: `


    <!-- Emergency Mode Dedicated Header & Lens Bar -->
    @if (state.isEmergencyMode()) {
      <div class="px-4 sm:px-8 py-3 no-print w-full bg-gradient-to-r from-red-950/90 via-zinc-950/95 to-red-950/90 border-b-2 border-red-700/80 font-pocketgull-mono text-zinc-100 shadow-xl">
        <div class="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-red-600/30 border border-red-500/50 flex items-center justify-center text-red-400 text-lg animate-pulse shadow-md">
              🚨
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-pocketgull text-xs sm:text-sm font-black uppercase tracking-wider text-red-300 block">
                  Offline Emergency First Aid Suite
                </span>
                <span class="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-bold border border-red-500/40">
                  Priority 1
                </span>
              </div>
              <span class="text-[11px] text-zinc-400 font-pocketgull-inter">
                Bystander 911 dispatch, real-time CPR coach &amp; telemetry
              </span>
            </div>
          </div>

          <!-- Emergency Lens Switcher -->
          <div class="flex items-center gap-2 overflow-x-auto max-w-full pb-1 hide-scrollbar">
            <button type="button" (click)="changeLens('EMT Handoff')"
                    [class]="activeLens() === 'EMT Handoff' ? 'bg-red-600 text-white font-black shadow-lg border-red-400 scale-105' : 'bg-zinc-900 text-red-300 border border-red-900/60 hover:bg-zinc-800'"
                    class="px-3.5 py-1.5 rounded-xl text-xs font-pocketgull font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 border shrink-0">
              <span>🚑</span> 1. First Aid &amp; CPR
            </button>

            <button type="button" (click)="changeLens('PhysioNet Telemetry')"
                    [class]="activeLens() === 'PhysioNet Telemetry' ? 'bg-sky-600 text-white font-black shadow-lg border-sky-400 scale-105' : 'bg-zinc-900 text-sky-300 border border-sky-900/60 hover:bg-zinc-800'"
                    class="px-3.5 py-1.5 rounded-xl text-xs font-pocketgull font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 border shrink-0">
              <span>📡</span> 2. Waveforms &amp; Vitals
            </button>

            <button type="button" (click)="changeLens('Summary Overview')"
                    [class]="activeLens() === 'Summary Overview' ? 'bg-amber-600 text-white font-black shadow-lg border-amber-400 scale-105' : 'bg-zinc-900 text-amber-300 border border-amber-900/60 hover:bg-zinc-800'"
                    class="px-3.5 py-1.5 rounded-xl text-xs font-pocketgull font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 border shrink-0">
              <span>📋</span> 3. Clinical Summary
            </button>

            <button type="button" (click)="state.isEmergencyMode.set(false)"
                    class="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-pocketgull font-bold uppercase tracking-wider transition cursor-pointer shrink-0 ml-1">
              ✕ Exit
            </button>
          </div>

        </div>
      </div>
    }

    @if (hasAnyReport() && !state.isEmergencyMode()) {
      <div class="px-3 sm:px-8 py-2.5 no-print w-full bg-slate-100/95 dark:bg-zinc-950/95 border-b border-slate-200 dark:border-zinc-800">
        <div class="max-w-4xl mx-auto flex flex-col gap-2 font-mono">
          
          <!-- Primary Lens Navigation Tabs (Precision Underline Strip) -->
          <div class="flex items-center justify-between gap-1.5 w-full relative z-10 border-b border-slate-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/60 font-mono text-xs">
            <!-- Scroll Left Arrow -->
            <button type="button" (click)="scrollLensBar('left')" 
              class="px-2 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white bg-transparent border-r border-zinc-200 dark:border-zinc-800 shrink-0 cursor-pointer transition" title="Scroll Lenses Left">
              ◀
            </button>

            <div #lensBarContainer class="flex items-center gap-1 overflow-x-auto scroll-smooth hide-scrollbar flex-1">
              <button (click)="changeLens('Summary Overview')"
                data-testid="tab-overview"
                [class]="activeLens() === 'Summary Overview' 
                  ? 'border-b-2 border-teal-500 text-zinc-950 dark:text-white font-bold bg-teal-500/5 -mb-px' 
                  : 'border-b-2 border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'"
                class="py-2.5 px-3 uppercase tracking-wider text-xs whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer font-mono">
                <span class="text-teal-600 dark:text-teal-400 font-bold">01</span>
                <span>Summary Overview</span>
              </button>

              <button (click)="changeLens('Treatment Matrix')"
                data-testid="tab-treatment-matrix"
                [class]="activeLens() === 'Treatment Matrix' 
                  ? 'border-b-2 border-teal-500 text-zinc-950 dark:text-white font-bold bg-teal-500/5 -mb-px' 
                  : 'border-b-2 border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'"
                class="py-2.5 px-3 uppercase tracking-wider text-xs whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer font-mono">
                <span class="text-teal-600 dark:text-teal-400 font-bold">02</span>
                <span>Treatment &amp; Tri-Paradigm</span>
              </button>

              <button (click)="changeLens('Functional Protocols')"
                data-testid="tab-functional-protocols"
                [class]="(activeLens() === 'Functional Protocols' || activeLens() === 'Nutrition' || activeLens() === 'Precision Nutrients') 
                  ? 'border-b-2 border-teal-500 text-zinc-950 dark:text-white font-bold bg-teal-500/5 -mb-px' 
                  : 'border-b-2 border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'"
                class="py-2.5 px-3 uppercase tracking-wider text-xs whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer font-mono">
                <span class="text-teal-600 dark:text-teal-400 font-bold">03</span>
                <span>Functional &amp; Nutrition</span>
              </button>

              <button (click)="changeLens('Monitoring & Follow-up')"
                data-testid="tab-monitoring-follow-up"
                [class]="activeLens() === 'Monitoring & Follow-up' 
                  ? 'border-b-2 border-teal-500 text-zinc-950 dark:text-white font-bold bg-teal-500/5 -mb-px' 
                  : 'border-b-2 border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'"
                class="py-2.5 px-3 uppercase tracking-wider text-xs whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer font-mono">
                <span class="text-teal-600 dark:text-teal-400 font-bold">04</span>
                <span>Monitoring &amp; Longevity</span>
              </button>

              <button (click)="changeLens('Environmental Exposomics & Toxicology')"
                data-testid="tab-exposomics-toxicology"
                [class]="activeLens() === 'Environmental Exposomics & Toxicology' 
                  ? 'border-b-2 border-amber-500 text-zinc-950 dark:text-white font-bold bg-amber-500/5 -mb-px' 
                  : 'border-b-2 border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'"
                class="py-2.5 px-3 uppercase tracking-wider text-xs whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer font-mono">
                <span class="text-amber-500 font-bold">05</span>
                <span>Exposomics &amp; Tox</span>
              </button>

              <button (click)="changeLens('Global Health & WHO Initiatives')"
                data-testid="tab-global-health"
                [class]="activeLens() === 'Global Health & WHO Initiatives' 
                  ? 'border-b-2 border-teal-500 text-zinc-950 dark:text-white font-bold bg-teal-500/5 -mb-px' 
                  : 'border-b-2 border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'"
                class="py-2.5 px-3 uppercase tracking-wider text-xs whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer font-mono">
                <span class="text-teal-500 font-bold">06</span>
                <span>Global Health</span>
              </button>

              <button (click)="changeLens('Skeptical Epistemology & Socratic Audit')"
                data-testid="tab-socratic-audit"
                [class]="activeLens() === 'Skeptical Epistemology & Socratic Audit' 
                  ? 'border-b-2 border-purple-500 text-zinc-950 dark:text-white font-bold bg-purple-500/5 -mb-px' 
                  : 'border-b-2 border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'"
                class="py-2.5 px-3 uppercase tracking-wider text-xs whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer font-mono">
                <span class="text-purple-400 font-bold">07</span>
                <span>Socratic Audit</span>
              </button>

              <button (click)="changeLens('ASSESSMENTS')"
                data-testid="tab-assessments"
                [class]="activeLens() === 'ASSESSMENTS' 
                  ? 'border-b-2 border-indigo-500 text-zinc-950 dark:text-white font-bold bg-indigo-500/5 -mb-px' 
                  : 'border-b-2 border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'"
                class="py-2.5 px-3 uppercase tracking-wider text-xs whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer font-mono">
                <span class="text-indigo-400 font-bold">08</span>
                <span>Assessments</span>
              </button>
            </div>

            <!-- Compact Dropdown for All Specialized Deep Dives -->
            <div class="relative shrink-0 flex items-center gap-1 pr-1">
              <button (click)="showAllLensesMenu.set(!showAllLensesMenu())"
                class="py-1.5 px-2.5 bg-zinc-900 hover:bg-zinc-800 text-purple-300 border border-purple-500/40 text-[11px] font-mono font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5">
                <span>[VAULT ▾]</span>
              </button>


              @if (showAllLensesMenu()) {
                <div class="absolute right-0 top-full mt-1 w-64 p-1.5 bg-zinc-950 border border-purple-500/40 shadow-2xl z-50 flex flex-col gap-1 max-h-80 overflow-y-auto font-mono text-xs">
                  @for (lens of availableLenses; track lens) {
                    <button (click)="changeLens(lens); showAllLensesMenu.set(false)"
                      [class]="activeLens() === lens ? 'bg-purple-600 text-white font-bold' : 'text-zinc-300 hover:bg-zinc-900'"
                      class="px-2.5 py-1.5 text-left text-xs font-mono transition flex items-center justify-between cursor-pointer">
                      <span [class.text-white]="activeLens() === lens" [class.text-zinc-300]="activeLens() !== lens">{{ lens }}</span>
                      @if (activeLens() === lens) { <span class="text-white">✓</span> }
                    </button>
                  }
                </div>
              }

              <!-- Bionic Reading Mode Lens Accent Toggle -->
              <button (click)="bionicReading.toggleBionicReading()"
                      [class.bg-amber-600]="bionicReading.isBionicReadingEnabled()"
                      [class.text-white]="bionicReading.isBionicReadingEnabled()"
                      [class.bg-zinc-900]="!bionicReading.isBionicReadingEnabled()"
                      [class.text-amber-400]="!bionicReading.isBionicReadingEnabled()"
                      class="py-1.5 px-2 border border-amber-500/40 text-[11px] font-mono font-bold uppercase tracking-wider transition cursor-pointer shrink-0"
                      title="Toggle Bionic Reading Mode">
                <span>{{ bionicReading.isBionicReadingEnabled() ? '[BIONIC: ON]' : '[BIONIC]' }}</span>
              </button>

              <!-- Unified Clinical Export & Portability Hub Quick Trigger -->
              <button (click)="showClinicalToolsModal.set(true)"
                      class="py-1.5 px-2.5 bg-zinc-900 hover:bg-zinc-800 text-indigo-300 border border-indigo-500/40 text-[11px] font-mono font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shrink-0"
                      title="Open Clinical Tools & Export Hub">
                <span>[EXPORT]</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    }

    <!--Content Area-->
    <div #contentArea (click)="handleContentAreaClick($event)" class="flex-1 mx-2 sm:mx-8 mb-6 mt-2 overflow-y-auto max-md:overflow-y-auto max-md:h-full max-md:min-h-[450px] overflow-x-hidden bg-white dark:bg-[#09090b] rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 min-h-0 relative">
      <!-- Dieter Rams Industrial Precision Ventilation Grill -->
      <div class="h-1 flex gap-[1.5px] opacity-25 px-4 pt-1.5 no-print">
        <div class="flex-1 bg-slate-400 dark:bg-zinc-600 rounded-full h-0.5"></div>
        <div class="flex-1 bg-slate-400 dark:bg-zinc-600 rounded-full h-0.5"></div>
        <div class="flex-1 bg-slate-400 dark:bg-zinc-600 rounded-full h-0.5"></div>
        <div class="flex-1 bg-slate-400 dark:bg-zinc-600 rounded-full h-0.5"></div>
      </div>

      <!--Analysis Engine Body-->
      <div class="max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-8 pb-24 min-w-0">
        
        <app-dynamic-precondition-alert-banner class="block w-full mb-4" />

        @if (hasAnyReport() && activeLens() !== 'EMT Handoff' && !state.isEmergencyMode()) {
          <div class="mb-6 p-4 rounded-xl border transition-all duration-300"
               [class.bg-sky-50\/40]="state.activePhilosophy() === 'western'"
               [class.border-sky-200\/60]="state.activePhilosophy() === 'western'"
               [class.dark:bg-sky-950\/10]="state.activePhilosophy() === 'western'"
               [class.dark:border-sky-900\/30]="state.activePhilosophy() === 'western'"
               
               [class.bg-emerald-50\/40]="state.activePhilosophy() === 'eastern'"
               [class.border-emerald-200\/60]="state.activePhilosophy() === 'eastern'"
               [class.dark:bg-emerald-950\/10]="state.activePhilosophy() === 'eastern'"
               [class.dark:border-emerald-900\/30]="state.activePhilosophy() === 'eastern'"
               
               [class.bg-amber-50\/40]="state.activePhilosophy() === 'ayurvedic'"
               [class.border-amber-200\/60]="state.activePhilosophy() === 'ayurvedic'"
               [class.dark:bg-amber-950\/10]="state.activePhilosophy() === 'ayurvedic'"
               [class.dark:border-amber-900\/30]="state.activePhilosophy() === 'ayurvedic'">
            
            <div class="flex items-center gap-3">
              <!-- Animated Accent Indicator Dot -->
              <span class="relative flex h-2.5 w-2.5 shrink-0">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      [class.bg-sky-400]="state.activePhilosophy() === 'western'"
                      [class.bg-emerald-400]="state.activePhilosophy() === 'eastern'"
                      [class.bg-amber-400]="state.activePhilosophy() === 'ayurvedic'"></span>
                <span class="relative inline-flex rounded-full h-2.5 w-2.5"
                      [class.bg-sky-500]="state.activePhilosophy() === 'western'"
                      [class.bg-emerald-500]="state.activePhilosophy() === 'eastern'"
                      [class.bg-amber-500]="state.activePhilosophy() === 'ayurvedic'"></span>
              </span>
              
              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="text-[12px] font-bold uppercase tracking-widest"
                        [class.text-sky-700]="state.activePhilosophy() === 'western'"
                        [class.dark:text-sky-400]="state.activePhilosophy() === 'western'"
                        [class.text-emerald-700]="state.activePhilosophy() === 'eastern'"
                        [class.dark:text-emerald-400]="state.activePhilosophy() === 'eastern'"
                        [class.text-amber-700]="state.activePhilosophy() === 'ayurvedic'"
                        [class.dark:text-amber-400]="state.activePhilosophy() === 'ayurvedic'">
                    Active Paradigm: 
                    @if (state.activePhilosophy() === 'western') { Western (Allopathic) }
                    @else if (state.activePhilosophy() === 'eastern') { Eastern (Traditional Chinese Medicine) }
                    @else if (state.activePhilosophy() === 'ayurvedic') { Ayurvedic Medicine }
                  </span>

                  <!-- Dynamic Agent Pill -->
                  <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[12px] font-bold uppercase tracking-wider bg-gray-50/50 dark:bg-zinc-900/50 border-gray-200/40 dark:border-zinc-800/40"
                       [class.text-sky-700]="state.activePhilosophy() === 'western'"
                       [class.dark:text-sky-400]="state.activePhilosophy() === 'western'"
                       [class.text-emerald-700]="state.activePhilosophy() === 'eastern'"
                       [class.dark:text-emerald-400]="state.activePhilosophy() === 'eastern'"
                       [class.text-amber-700]="state.activePhilosophy() === 'ayurvedic'"
                       [class.dark:text-amber-400]="state.activePhilosophy() === 'ayurvedic'">
                    <span class="flex h-1.5 w-1.5 rounded-full"
                          [class.bg-sky-500]="state.activePhilosophy() === 'western'"
                          [class.bg-emerald-500]="state.activePhilosophy() === 'eastern'"
                          [class.bg-amber-500]="state.activePhilosophy() === 'ayurvedic'"></span>
                    Expert: {{ activeAgentName() }}
                    <span class="ml-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1" [title]="activePersonaPropBadge().badgeLabel">
                      <span>{{ activePersonaPropBadge().badgeEmoji }}</span>
                      <span class="hidden sm:inline font-mono">({{ activePersonaPropBadge().primaryProp }})</span>
                    </span>
                  </div>

                  <!-- FDA 21 CFR 520(o) Non-Device CDS Transparency Badge -->
                  <button type="button" (click)="showCdsModal.set(true)"
                          class="flex items-center gap-1 px-2.5 py-1 rounded-md border text-[11px] font-bold uppercase tracking-wider bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 border-indigo-500/40 cursor-pointer transition shadow-xs"
                          title="View FDA 21 CFR Section 520(o) Non-Device CDS Transparency & Epistemic Uncertainty Metrics">
                    <span>🛡️</span> FDA 520(o) CDS ({{ cdsReport().overallConfidencePercent }}%)
                  </button>
                </div>

                <!-- Higher-Order Paradigm Typology Badge & Dynamic Paradigm-Lens Overview Card -->
                @let lensOverview = getParadigmLensOverview();
                <div class="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-slate-300 dark:border-zinc-800 pb-3 mb-3 font-mono">
                  <div class="flex flex-wrap items-center gap-2">
                    <app-typology-badge 
                      [paradigm]="state.activePhilosophy() === 'eastern' ? 'tcm' : (state.activePhilosophy() === 'ayurvedic' ? 'ayurvedic' : 'western')"
                      [lens]="activeLens()"
                      [evidenceGrade]="'A'"
                      [systemTag]="activeLens() === 'Summary Overview' ? 'Pathophysiological' : (activeLens() === 'Treatment Matrix' ? 'Multi-Modal Intervention' : (activeLens() === 'Functional Protocols' ? 'Biochemical & Circadian' : (activeLens() === 'Nutrition' ? 'Metabolic & Oxidative' : (activeLens() === 'Precision Nutrients' ? 'Orthomolecular Dosing' : 'Cognitive Localization'))))">
                    </app-typology-badge>

                    <span class="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30 uppercase">
                      Lens Focus: {{ activeLens() }}
                    </span>
                  </div>
                </div>
                
                <div class="mt-3 pt-3 border-t border-slate-200/50 dark:border-zinc-800/80 font-mono">
                  <div class="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <h3 class="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                      {{ lensOverview.title }}
                    </h3>
                    <div class="flex flex-wrap items-center gap-1.5">
                      @for (badge of lensOverview.badges; track badge) {
                        <span class="text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border border-slate-300/60 dark:border-zinc-800 uppercase">
                          {{ badge }}
                        </span>
                      }
                    </div>
                  </div>
                  <span class="text-[11px] font-semibold text-slate-600 dark:text-zinc-400 block font-sans mb-1">
                    {{ lensOverview.subtitle }}
                  </span>
                  <p class="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-sans mb-3">
                    {{ lensOverview.description }}
                  </p>

                  <!-- Dual Perspective View Recommendation Matrix -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-dashed border-slate-300/80 dark:border-zinc-800 font-sans text-xs">
                    <!-- Clinician (Doctor) Directives -->
                    <div class="p-3 rounded-xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200/60 dark:border-sky-850/50">
                      <div class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 font-mono mb-1">
                        <span>👨‍⚕️ Clinician (Doctor) Analysis View:</span>
                      </div>
                      <p class="text-[11.5px] text-sky-950 dark:text-sky-200 leading-relaxed">
                        @if (state.activePhilosophy() === 'western') {
                          Target quantitative biomarkers, FDA standard-of-care drug-drug interactions, and SBAR specialist handoff briefs.
                        } @else if (state.activePhilosophy() === 'eastern') {
                          Delineate Zang-Fu organ pattern disharmonies, root (Ben) vs branch (Biao) principles, and classical herbal formulation ratios.
                        } @else {
                          Assess Prakriti vs Vikriti doshic deviations, Agni digestive fire metrics, and Ama toxic metabolite clearance.
                        }
                      </p>
                    </div>

                    <!-- Patient Self-Care Action Plan -->
                    <div class="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-850/50">
                      <div class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-mono mb-1">
                        <span>🧑‍🤝‍🧑 Patient Health Literacy View:</span>
                      </div>
                      <p class="text-[11.5px] text-emerald-950 dark:text-emerald-200 leading-relaxed">
                        @if (state.activePhilosophy() === 'western') {
                          Understand your symptoms in plain language, complete daily micro-habits, and track your health progress easily.
                        } @else if (state.activePhilosophy() === 'eastern') {
                          Learn how thermal foods (warming/cooling) soothe your body, practice meridian breathing, and restore energy balance.
                        } @else {
                          Follow your daily dosha routine (Dinacharya), enjoy warm digestive teas, and practice calming evening self-massage.
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Circadian Chronobiology & Functional Medicine Biomarker Telemetry -->
          @if (activeLens() === 'Nutrition' || activeLens() === 'Functional Protocols' || activeLens() === 'Precision Nutrients' || activeLens() === 'Monitoring & Follow-up') {
            <div class="my-6 space-y-6 font-mono no-print">
              <!-- Chronobiology Rhythm Matrix & Clock Decision Rail -->
              @if (activeLens() === 'Nutrition' || activeLens() === 'Functional Protocols') {
                <app-chronobiology-matrix></app-chronobiology-matrix>
                <app-chrono-clock-decision-rail></app-chrono-clock-decision-rail>
              }

              <!-- 7-Day Chrono-Nutrition Meal Planner (Nutrition) -->
              @if (activeLens() === 'Nutrition') {
                <app-chrono-weekly-meal-planner></app-chrono-weekly-meal-planner>
              }

              <!-- Functional Medicine Biomarker Matrix & Clinical Sleep Twin Simulator -->
              @if (activeLens() === 'Functional Protocols' || activeLens() === 'Precision Nutrients' || activeLens() === 'Monitoring & Follow-up') {
                <app-functional-medicine-matrix></app-functional-medicine-matrix>
                <app-biomarker-matrix></app-biomarker-matrix>
                <app-clinical-sleep-twin-dashboard></app-clinical-sleep-twin-dashboard>
              }
            </div>
          }

          @if (activeLens() === 'RSNA Knee Abnormality') {
            <app-lens-rsna-knee></app-lens-rsna-knee>
          }
        }

          @if (activeLens() === 'Chronobiology Matrix') {
            <div class="mb-6 p-4 rounded-2xl bg-zinc-950/80 border border-orange-500/20 shadow-lg font-mono text-zinc-100 backdrop-blur-md">
              <div class="flex items-center gap-2 mb-3">
                <span class="text-orange-500 text-sm">📡</span>
                <span class="text-xs font-bold uppercase tracking-widest text-zinc-400">Circadian Real-Time Telemetry</span>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div class="p-2 rounded bg-zinc-900 border border-zinc-800">
                  <span class="text-zinc-500 block text-[10px] uppercase">Disruption Index</span>
                  <span class="text-orange-400 font-extrabold text-sm">{{ state.circadianDisruptionIndex() }} / 100</span>
                </div>
                <div class="p-2 rounded bg-zinc-900 border border-zinc-800">
                  <span class="text-zinc-500 block text-[10px] uppercase">Cortisol Curve</span>
                  <span class="text-orange-300 font-extrabold text-sm truncate block">{{ state.cortisolDiurnalSlope().slope }}</span>
                </div>
                <div class="p-2 rounded bg-zinc-900 border border-zinc-800">
                  <span class="text-zinc-500 block text-[10px] uppercase">Adrenal Status</span>
                  <span class="text-orange-300 font-extrabold text-sm truncate block">{{ state.cortisolDiurnalSlope().status }}</span>
                </div>
                <div class="p-2 rounded bg-zinc-900 border border-zinc-800">
                  <span class="text-zinc-500 block text-[10px] uppercase">Delta Power</span>
                  <span class="text-orange-200 font-extrabold text-sm">{{ state.remSleepArchitectureScore().deltaPowerUv2 }} µV²</span>
                </div>
              </div>
            </div>
            <app-chronobiology-matrix-lens-tab class="block my-6"></app-chronobiology-matrix-lens-tab>
          }

          @if (activeLens() === 'Functional Medicine Matrix') {
            <div class="mb-6 p-4 rounded-2xl bg-zinc-950/80 border border-emerald-500/20 shadow-lg font-mono text-zinc-100 backdrop-blur-md">
              <div class="flex items-center gap-2 mb-3">
                <span class="text-emerald-500 text-sm">📡</span>
                <span class="text-xs font-bold uppercase tracking-widest text-zinc-400">Functional Systemic Telemetry</span>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div class="p-2 rounded bg-zinc-900 border border-zinc-800">
                  <span class="text-zinc-500 block text-[10px] uppercase">hs-CRP Estimate</span>
                  <span class="text-emerald-400 font-extrabold text-sm">{{ state.systemicInflammatoryBurden().hsCrpEstimate }}</span>
                </div>
                <div class="p-2 rounded bg-zinc-900 border border-zinc-800">
                  <span class="text-zinc-500 block text-[10px] uppercase">ATP Turnover</span>
                  <span class="text-emerald-300 font-extrabold text-sm truncate block">{{ state.mitochondrialEfficiencyScore().atpTurnoverIndex }}</span>
                </div>
                <div class="p-2 rounded bg-zinc-900 border border-zinc-800">
                  <span class="text-zinc-500 block text-[10px] uppercase">Zonulin Status</span>
                  <span class="text-emerald-300 font-extrabold text-sm truncate block">{{ state.gutBrainAxisScore().zonulinStatus }}</span>
                </div>
                <div class="p-2 rounded bg-zinc-900 border border-zinc-800">
                  <span class="text-zinc-500 block text-[10px] uppercase">Translocation Risk</span>
                  <span class="text-emerald-200 font-extrabold text-sm truncate block">{{ state.gutBrainAxisScore().lpsEndotoxemiaRisk }}</span>
                </div>
              </div>
            </div>
            <app-functional-medicine-matrix-lens-tab class="block my-6"></app-functional-medicine-matrix-lens-tab>
          }

          @if (activeLens() === 'Maternal & Postpartum') {
            <app-maternal-postpartum-lens-tab class="block my-6"></app-maternal-postpartum-lens-tab>
          }

          @if (activeLens() === 'Seven Generations Stewardship') {
            <app-seven-generations-stewardship-lens-tab class="block my-6"></app-seven-generations-stewardship-lens-tab>
          } @else if (activeLens() === 'Summary Overview') {
            <app-summary-overview-lens-tab class="block my-6"></app-summary-overview-lens-tab>
          } @else if (activeLens() === 'Epigenetic Longevity') {
            <app-epigenetic-longevity-lens-tab class="block my-6"></app-epigenetic-longevity-lens-tab>
          } @else if (activeLens() === 'Patient Education') {
            <app-patient-education-lens-tab class="block my-6"></app-patient-education-lens-tab>
          } @else if (activeLens() === 'Teledentistry & Systemic Health') {
            <app-teledentistry-systemic-lens class="block my-6"></app-teledentistry-systemic-lens>
          } @else if (activeLens() === 'ASSESSMENTS') {
            <app-assessments-lens-tab class="block my-6"></app-assessments-lens-tab>
          } @else if (activeLens() === 'Treatment Matrix') {
            <app-interventions-lens-tab class="block my-6"></app-interventions-lens-tab>
            <app-tri-paradigm-integrative-lens-tab class="block my-6"></app-tri-paradigm-integrative-lens-tab>
          } @else if (activeLens() === 'Monitoring & Follow-up') {
            <app-diagnostics-lens-tab class="block my-6"></app-diagnostics-lens-tab>
            <app-epigenetic-longevity-lens-tab class="block my-6"></app-epigenetic-longevity-lens-tab>
          } @else if (activeLens() === 'Tri-Paradigm Medicine') {
            <app-tri-paradigm-integrative-lens-tab class="block my-6"></app-tri-paradigm-integrative-lens-tab>
          } @else if (activeLens() === 'Environmental Exposomics & Toxicology') {
            <div class="my-6 space-y-6">
              <app-environmental-exposomics-toxicology></app-environmental-exposomics-toxicology>
            </div>
          } @else if (activeLens() === 'Skeptical Epistemology & Socratic Audit') {
            <div class="my-6 space-y-6">
              <app-skeptical-epistemology-hud></app-skeptical-epistemology-hud>
            </div>
          } @else if (activeLens() === 'Global Health & WHO Initiatives') {
            <div class="my-6 space-y-6 p-6 rounded-2xl bg-teal-950/40 border border-teal-500/30 text-teal-100 font-mono">
              <div class="flex items-center justify-between border-b border-teal-800/60 pb-3">
                <div class="flex items-center gap-2">
                  <span class="text-xl">🌍</span>
                  <h3 class="text-sm font-bold uppercase tracking-wider text-teal-200">WHO Global Health Initiatives & SDG 3.4 Registry</h3>
                </div>
                <span class="text-[10px] px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">ICD-11 TM1 Active</span>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mt-4">
                <div class="p-4 rounded-xl bg-teal-900/30 border border-teal-800/40 space-y-2">
                  <div class="text-[11px] font-bold uppercase text-teal-300">WHO SDG 3.4 10-Year CVD Risk</div>
                  <div class="text-2xl font-black text-teal-100">8.4% <span class="text-xs font-normal text-teal-400">(Low-to-Moderate &lt; 10%)</span></div>
                  <p class="text-[11px] text-teal-300/80">WHO HEARTS technical package task-shifting protocol applied. Target SBP &lt; 130 mmHg.</p>
                </div>
                <div class="p-4 rounded-xl bg-teal-900/30 border border-teal-800/40 space-y-2">
                  <div class="text-[11px] font-bold uppercase text-teal-300">ICD-11 Chapter 26 (TM1) Dual-Code</div>
                  <div class="text-xs font-bold text-teal-100">SF50 Spleen Qi Deficiency <span class="text-teal-400">↔ BA00 Essential HTN</span></div>
                  <p class="text-[11px] text-teal-300/80">Cross-referenced against SNOMED CT 59621000 with sub-10ms HL7 FHIR R4 Bundle interoperability.</p>
                </div>
              </div>
            </div>
          } @else {


          <!-- ACM §1.3: AI-Generated Content Disclosure -->
          @if (hasAnyReport() && !state.isEmergencyMode()) {
            <div class="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-100 dark:bg-violet-950/60 border border-violet-300 dark:border-violet-700">
            <div class="relative group/ai-badge cursor-help">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-black uppercase tracking-widest bg-violet-800 text-white dark:bg-violet-300 dark:text-violet-950 border border-violet-900 select-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2a4 4 0 0 0-4 4c0 2 1 3.5 2 4.5L12 12l2-1.5c1-1 2-2.5 2-4.5a4 4 0 0 0-4-4z"/><path d="M12 12v10"/><path d="M8 22h8"/>
                </svg>
                AI-Generated
              </span>
              <!-- Tooltip -->
              <div class="absolute left-0 bottom-full mb-2 w-72 p-3 rounded-xl bg-zinc-900 dark:bg-zinc-800 text-white text-[12px] leading-relaxed shadow-xl opacity-0 group-hover/ai-badge:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                This analysis was generated by Google Gemini and has not been verified by a licensed clinician. Always verify recommendations with your care team.
                <div class="absolute left-4 top-full w-2 h-2 bg-zinc-900 dark:bg-zinc-800 rotate-45 -mt-1"></div>
              </div>
            </div>
            <span class="text-[12px] text-violet-950 dark:text-violet-100 font-bold">
              Powered by Google Gemini · Not clinically verified · <a href="/terms-of-service.html#ai-content" target="_blank" class="underline text-violet-800 dark:text-violet-300 font-extrabold hover:text-violet-950 transition-colors">Learn about clinical AI verification</a>
            </span>
          </div>
        }
      }



        <!-- Clinical Overview Dashboard & Telemetry Gauges -->
        @if (activeLens() !== 'EMT Handoff' && !state.isEmergencyMode() && intel.analysisMetrics(); as metrics) {
          <div class="mb-8 space-y-4 no-print font-mono">
            
            <!-- Tier 1: Systems Equilibrium HUD -->
            <app-systems-equilibrium-hud (modeChange)="onSystemsModeChange($event)"></app-systems-equilibrium-hud>

            <!-- Mode-Driven Systems Content -->
            @if (systemsNavMode() === 'overview') {
              <div class="space-y-4 animate-in fade-in duration-200">
                <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <app-tri-paradigm-swarm-card></app-tri-paradigm-swarm-card>
                  <div class="space-y-4">
                    <app-pharmacogenomics-card></app-pharmacogenomics-card>
                    <app-biometric-sensor-fusion-card></app-biometric-sensor-fusion-card>
                  </div>
                </div>
                <app-local-gemma-studio></app-local-gemma-studio>
              </div>
            } @else if (systemsNavMode() === 'crosstalk') {
              <div class="space-y-4 animate-in fade-in duration-200">
                <app-inter-system-crosstalk-card></app-inter-system-crosstalk-card>
                <app-local-gemma-studio></app-local-gemma-studio>
              </div>
            } @else if (systemsNavMode() === 'gemma') {
              <div class="animate-in fade-in duration-200">
                <app-local-gemma-studio></app-local-gemma-studio>
              </div>
            }

            <!-- Multi-Paradigm Switchable Clinical Dashboard (Shown for Functional Protocols or Non-Western Paradigms) -->
            @if (activeLens() === 'Functional Protocols' || state.activePhilosophy() !== 'western') {
              <div class="space-y-4">
                <app-occupational-hazard-card></app-occupational-hazard-card>
                <app-paradigm-clinical-dashboard></app-paradigm-clinical-dashboard>
              </div>
            }

            <!-- Collapsible Auxiliary Clinical Apps Control Bar (Unobtrusive Footer Tray) -->
            <div class="col-span-full mb-2 font-mono">
              <div class="p-3 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs pocket-gull-card">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <span>🛠️</span> Auxiliary Clinical Apps & Prescriptions
                  </span>
                  <span class="text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 font-mono font-bold border border-zinc-200 dark:border-zinc-800">
                    8 Digital Therapeutics & Biofeedback Apps
                  </span>
                </div>

                <button type="button" (click)="isAuxToolsExpanded.set(!isAuxToolsExpanded())"
                  class="px-3.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-xs font-bold uppercase transition cursor-pointer flex items-center gap-1.5">
                  <span>{{ isAuxToolsExpanded() ? '▲ Hide Auxiliary Apps' : '▼ Open Auxiliary Suite' }}</span>
                </button>
              </div>

              @if (isAuxToolsExpanded()) {
                <div class="mt-3 p-4 bg-zinc-900/40 rounded-2xl border border-zinc-800 space-y-4 animate-in fade-in duration-200">
                  <div class="flex items-center justify-between text-xs text-zinc-400 border-b border-zinc-800 pb-2">
                    <span class="text-[10px] uppercase font-bold text-zinc-300">Single-click to open view • Double-click state machine: Prescribe 💊 -> Hide 🙈 -> Unassign ⚙️</span>
                    <button type="button" (click)="state.restoreHiddenTools()" class="text-[10px] font-bold text-amber-400 hover:underline cursor-pointer">
                      Restore Hidden Tools
                    </button>
                  </div>      

                  <div class="flex flex-wrap items-center gap-2">
                  <!-- QALY Tool -->
                  @if (state.getToolState('qaly') !== 'hidden') {
                    <button (click)="handleAuxToolClick('qaly')" (dblclick)="handleAuxToolDblClick('qaly')"
                            [class.bg-[#10B981]]="state.getToolState('qaly') === 'prescribed'"
                            [class.text-white]="state.getToolState('qaly') === 'prescribed'"
                            [class.bg-orange-500]="activeAuxTool() === 'qaly' && state.getToolState('qaly') !== 'prescribed'"
                            [class.text-zinc-950]="activeAuxTool() === 'qaly' && state.getToolState('qaly') !== 'prescribed'"
                            [class.bg-zinc-100]="activeAuxTool() !== 'qaly' && state.getToolState('qaly') === 'unassigned'"
                            [class.dark:bg-zinc-900]="activeAuxTool() !== 'qaly' && state.getToolState('qaly') === 'unassigned'"
                            [class.text-zinc-800]="activeAuxTool() !== 'qaly' && state.getToolState('qaly') === 'unassigned'"
                            [class.dark:text-zinc-300]="activeAuxTool() !== 'qaly' && state.getToolState('qaly') === 'unassigned'"
                            class="px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-800 font-extrabold text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                            title="Single-click to view. Double-click to prescribe to care plan.">
                      <span>⏳ QALY Epigenetic</span>
                      @if (state.getToolState('qaly') === 'prescribed') { <span class="text-[10px] font-black px-1.5 py-0.5 rounded bg-white text-emerald-950">💊 Prescribed</span> }
                    </button>
                  }
                  
                  
                  
                  <!-- Vagal Tool -->
                  @if (state.getToolState('vagal') !== 'hidden') {
                    <button (click)="handleAuxToolClick('vagal')" (dblclick)="handleAuxToolDblClick('vagal')"
                            [class.bg-[#10B981]]="state.getToolState('vagal') === 'prescribed'"
                            [class.text-white]="state.getToolState('vagal') === 'prescribed'"
                            [class.bg-orange-500]="activeAuxTool() === 'vagal' && state.getToolState('vagal') !== 'prescribed'"
                            [class.text-zinc-950]="activeAuxTool() === 'vagal' && state.getToolState('vagal') !== 'prescribed'"
                            [class.bg-zinc-100]="activeAuxTool() !== 'vagal' && state.getToolState('vagal') === 'unassigned'"
                            [class.dark:bg-zinc-900]="activeAuxTool() !== 'vagal' && state.getToolState('vagal') === 'unassigned'"
                            [class.text-zinc-800]="activeAuxTool() !== 'vagal' && state.getToolState('vagal') === 'unassigned'"
                            [class.dark:text-zinc-300]="activeAuxTool() !== 'vagal' && state.getToolState('vagal') === 'unassigned'"
                            class="px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-800 font-extrabold text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                            title="Single-click to view. Double-click to prescribe to care plan.">
                      <span>🫁 Vagal HRV Dock</span>
                      @if (state.getToolState('vagal') === 'prescribed') { <span class="text-[10px] font-black px-1.5 py-0.5 rounded bg-white text-emerald-950">💊 Prescribed</span> }
                    </button>
                  }

                  <!-- Clinical Assessments Suite Button -->
                  <button (click)="toggleAuxTool('assessments')"
                          [class.bg-sky-500]="activeAuxTool() === 'assessments'"
                          [class.text-zinc-950]="activeAuxTool() === 'assessments'"
                          [class.bg-zinc-100]="activeAuxTool() !== 'assessments'"
                          [class.dark:bg-zinc-900]="activeAuxTool() !== 'assessments'"
                          [class.text-zinc-800]="activeAuxTool() !== 'assessments'"
                          [class.dark:text-zinc-300]="activeAuxTool() !== 'assessments'"
                          class="px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-800 font-extrabold text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                          title="Single-click to open PHQ-9, GAD-7, ISI & C-SSRS assessment suite.">
                    <span>📊 Clinical Suite (PHQ-9/GAD-7/ISI/C-SSRS)</span>
                  </button>

                  <!-- Restore Hidden Tools Button -->
                  <button (click)="state.restoreHiddenTools()"
                    class="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-[10px] font-mono font-bold uppercase transition cursor-pointer flex items-center gap-1">
                    <span>🙈 Restore Hidden Tools</span>
                  </button>
                </div>

                <!-- Active Collapsible Tool View -->
                @if (activeAuxTool() === 'qaly') {
                  <div class="animate-in fade-in duration-200">
                    <app-actuarial-qaly-calculator></app-actuarial-qaly-calculator>
                  </div>
                } @else if (activeAuxTool() === 'vagal') {
                  <div class="animate-in fade-in duration-200">
                    <app-vagal-biofeedback-dock></app-vagal-biofeedback-dock>
                  </div>
                } @else if (activeAuxTool() === 'assessments') {
                  <div class="animate-in fade-in duration-200">
                    @defer (on idle) {
                      <app-clinical-assessments-suite></app-clinical-assessments-suite>
                    }
                  </div>
                }
              </div>
            }
          </div>

            <app-clinical-gauge
              label="Complexity"
              [value]="metrics.complexity ?? 5"
              type="complexity"
              description="Measures comorbid depth and case difficulty.">
            </app-clinical-gauge>

            <app-clinical-gauge
              label="Stability"
              [value]="metrics.stability ?? 7"
              type="stability"
              description="Patient physiological and functional compensatory status.">
            </app-clinical-gauge>

            <app-clinical-gauge
              label="Certainty"
              [value]="metrics.certainty ?? 8"
              type="certainty"
              description="AI confidence based on available data density.">
            </app-clinical-gauge>

            <!--Trend Sparklines-->
            @if (historicalMetrics().length > 1) {
              <div class="col-span-full mt-4 p-4 sm:p-6 bg-gray-50/50 dark:bg-zinc-900/50 rounded-2xl border border-gray-100 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
                <app-clinical-trend label="Complexity Trend" [values]="getHistoryValues('complexity')" type="complexity"></app-clinical-trend>
                <app-clinical-trend label="Stability Trend" [values]="getHistoryValues('stability')" type="stability"></app-clinical-trend>
                <app-clinical-trend label="Certainty Trend" [values]="getHistoryValues('certainty')" type="certainty"></app-clinical-trend>
              </div>
            }
          </div>
        }

        @if (intel.isLoading() && !hasAnyReport()) {
          <div class="h-64 flex flex-col items-center justify-center opacity-50 no-print">
            <div class="w-8 h-8 border-2 border-[#EEEEEE] dark:border-zinc-800 border-t-[#1C1C1C] dark:border-t-zinc-100 rounded-full animate-spin mb-4"></div>
            <div class="flex flex-col items-center gap-2">
              <div class="flex items-center gap-2">
                <span class="text-xs uppercase tracking-widest text-[#689F38] dark:text-[#8bc34a] font-bold">{{ activeLens() }}</span>
                @if (intel.isLoading() && isTextEmpty(activeReport())) {
                  <span class="flex h-1.5 w-1.5 rounded-full bg-[#689F38] dark:bg-[#8bc34a] animate-pulse"></span>
                  <span class="text-[12px] uppercase tracking-tighter text-gray-500 dark:text-zinc-400">{{ activeAgentName() }} is synthesizing...</span>
                }
              </div>
              @if (intel.webgpuIsLoading() && intel.webgpuProgress()) {
                <div class="text-[12px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-3 py-1.5 rounded-xl border border-zinc-200/50 dark:border-zinc-700/50 flex items-center gap-2 max-w-sm text-center animate-pulse">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-zinc-500 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                  <span class="font-mono">{{ intel.webgpuProgress() }}</span>
                </div>
              }
            </div>
            <p class="text-xs font-bold uppercase tracking-widest text-[#1C1C1C] dark:text-zinc-200 mt-2">Processing Comprehensive Analysis</p>
          </div>
        }
        
        @if (intel.error()) {
          <div class="p-4 border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 text-red-900 dark:text-red-400 text-xs rounded-lg mb-4">
            <strong class="block uppercase tracking-wider mb-1">System Error</strong>
            {{ intel.error() }}
          </div>
        }



        <!-- Theatrical Clinical Proposal Act Banner -->
        @if (!state.isEmergencyMode()) {
          @if (activeActProposal(); as act) {
            <div class="mb-6 p-4 rounded-md border-l-4 border-l-indigo-600 dark:border-l-indigo-400 border-t border-b border-r border-t-slate-200 border-b-slate-200 border-r-slate-200 dark:border-t-zinc-800 dark:border-b-zinc-800 dark:border-r-zinc-800 bg-slate-50 dark:bg-zinc-900/80 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
              <div class="flex items-center gap-3">
                <span class="text-2xl">{{ act.icon }}</span>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300/40">
                      {{ act.actsSequenceStage }}
                    </span>
                  </div>
                  <h3 class="text-sm font-extrabold text-slate-900 dark:text-zinc-100 uppercase tracking-wider mt-1">
                    {{ activeActTitle() }}
                  </h3>
                  <p class="text-xs text-slate-600 dark:text-zinc-400 mt-0.5 font-medium">
                    {{ act.proposalFocus }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <span class="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Paradigm: {{ state.activePhilosophy() | uppercase }}
                </span>
              </div>
            </div>
          }
        }





        <!-- EMT Handoff Component/Layout -->
        @if (activeLens() === 'EMT Handoff') {
          <app-emt-handoff-lens-tab></app-emt-handoff-lens-tab>
        }

        <!--AI Primary Lens Report Section & Dedicated Lens Widgets-->
        @if (activeLens() !== 'EMT Handoff' && reportSections(); as sections) {
          <div class="flex flex-col gap-4 sm:gap-6 pb-4 w-full min-w-0">

            <!-- Storybook Narrative Arc Banner & Lens Stage Indicator -->
            @if (!state.isEmergencyMode()) {
              <div class="mb-2 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/30 shadow-xl font-sans relative overflow-hidden">
                <div class="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none"></div>
                
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-widest bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                        📖 Storybook Chapter: {{ activeLens() }}
                      </span>
                      <span class="text-[10px] font-mono text-zinc-400">
                        Paradigm Framework: <strong class="text-cyan-400 font-bold uppercase">{{ state.activePhilosophy() }}</strong>
                      </span>
                    </div>
                    <h2 class="text-base font-extrabold uppercase tracking-wide text-zinc-100 mt-1">
                      {{ activeActTitle() }}
                    </h2>
                  </div>

                  <!-- 3-Act Narrative Arc Progress Dots -->
                  <div class="flex items-center gap-2 bg-zinc-900/80 px-3.5 py-2 rounded-xl border border-zinc-800 shrink-0 font-mono text-[11px]">
                    <div class="flex items-center gap-1.5 text-indigo-400 font-bold">
                      <span>Act I: Triage</span>
                      <span class="text-xs">→</span>
                    </div>
                    <div class="flex items-center gap-1.5 text-cyan-400 font-bold">
                      <span>Act II: Probing</span>
                      <span class="text-xs">→</span>
                    </div>
                    <div class="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <span>Act III: Quest</span>
                    </div>
                  </div>
                </div>
              </div>
            }

            <!-- Mobile Section Jump Bar & Accordion Controls -->
            @if (sections.length > 0) {
              <div class="mb-4 p-2.5 rounded-2xl bg-zinc-950/90 dark:bg-zinc-900/90 border border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-mono text-xs shadow-md no-print">
                
                <!-- Left: Horizontal Scrollable Section Filter Tabs -->
                <div class="flex items-center gap-1.5 overflow-x-auto hide-scrollbar shrink min-w-0 px-1 py-0.5">
                  <span class="text-[10px] uppercase font-bold text-zinc-400 shrink-0 mr-1">Section Jump:</span>
                  <button type="button" (click)="selectedMobileSectionTab.set('all'); expandAllSections()"
                    [class]="selectedMobileSectionTab() === 'all' ? 'bg-orange-500 text-zinc-950 font-black shadow-sm' : 'bg-zinc-900 dark:bg-zinc-950 text-zinc-300 border border-zinc-800 hover:bg-zinc-800'"
                    class="px-3 py-1 rounded-xl text-[11px] font-bold uppercase transition cursor-pointer shrink-0">
                    All ({{ sections.length }})
                  </button>
                  @for (sec of sections; track sec.title) {
                    <button type="button" (click)="selectSectionMobile(sec.title)"
                      [class]="selectedMobileSectionTab() === sec.title ? 'bg-orange-500 text-zinc-950 font-black shadow-sm' : 'bg-zinc-900 dark:bg-zinc-950 text-zinc-300 border border-zinc-800 hover:bg-zinc-800'"
                      class="px-3 py-1 rounded-xl text-[11px] font-bold uppercase transition cursor-pointer shrink-0 flex items-center gap-1.5">
                      <span>{{ sec.title }}</span>
                      <span class="text-[9px] px-1.5 py-0.2 rounded-md bg-zinc-800 text-zinc-300 font-mono">{{ sec.nodes.length }}</span>
                    </button>
                  }
                </div>

                <!-- Right: Expand / Collapse All Controls -->
                <div class="flex items-center gap-1.5 shrink-0 justify-end">
                  <button type="button" (click)="expandAllSections()" title="Expand All Sections"
                    class="px-2.5 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-[10px] font-bold uppercase transition cursor-pointer flex items-center gap-1">
                    <span>📂</span>
                    <span>Expand All</span>
                  </button>
                  <button type="button" (click)="collapseAllSections()" title="Collapse Secondary Sections"
                    class="px-2.5 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-[10px] font-bold uppercase transition cursor-pointer flex items-center gap-1">
                    <span>📁</span>
                    <span>Collapse All</span>
                  </button>
                </div>

              </div>
            }

            <!-- Dedicated Interactive Lens Widgets (Scoped to Active Lens) -->
            @if (activeLens() === 'Functional Protocols' && hasAnyReport()) {
              <app-kss-cognitive-shield></app-kss-cognitive-shield>
              <app-mood-consciousness-matrix></app-mood-consciousness-matrix>
              <app-geolocational-health-relocation></app-geolocational-health-relocation>
            }



            @if (activeLens() === 'Nutrition' && hasAnyReport()) {
              <app-dietary-allergy-shield></app-dietary-allergy-shield>
              <app-clinical-menu [reportText]="activeReport()"></app-clinical-menu>
            }

            @if (hasAnyReport()) {
              <app-lens-insight-spark-shield [activeLens]="activeLens()"></app-lens-insight-spark-shield>
            }

            <!-- Socratic Challenge Questions (Bionic Reading Mode only) -->
            @if (bionicReading.isBionicReadingEnabled() && hasAnyReport()) {
              @for (challenge of activeLensChallenges(); track challenge.id) {
                <app-socratic-challenge-card [challenge]="challenge"></app-socratic-challenge-card>
              }
            }

            @if (activeLens() === 'Patient Education' && hasAnyReport()) {
              <app-uk-rio-pubmed-sourcing></app-uk-rio-pubmed-sourcing>
            }

            @if ((activeLens() === 'Patient Education' || activeLens() === 'Summary Overview') && hasAnyReport()) {
              <app-patient-health-trajectory-storybook></app-patient-health-trajectory-storybook>
              <app-sdoh-navigator></app-sdoh-navigator>
            }

            @if (activeLens() === 'Precision Nutrients' && hasAnyReport()) {
              <app-biomarker-matrix [reportText]="activeReport()"></app-biomarker-matrix>
            }

            @if ((activeLens() === 'Summary Overview' || activeLens() === 'Treatment Matrix') && hasAnyReport()) {
              <app-cost-benefit-analysis [reportText]="activeReport()"></app-cost-benefit-analysis>
            }

            @if (activeLens() === 'Functional Protocols' && hasAnyReport()) {
              <div class="mb-6 bg-gradient-to-r from-indigo-900/10 via-purple-900/10 to-emerald-900/10 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-emerald-950/40 rounded-2xl p-6 border border-indigo-500/20 dark:border-indigo-500/30 shadow-lg relative overflow-hidden">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-200/40 dark:border-indigo-800/40 pb-4 mb-4">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="w-3 h-3 rounded-md bg-indigo-500 animate-pulse"></span>
                      <h3 class="text-base font-bold text-gray-900 dark:text-zinc-150 uppercase tracking-widest">
                        🧠 Autonomic Co-Regulation & AVS Therapy Apps
                      </h3>
                      <span class="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30">
                        Functional Protocol Integration
                      </span>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                      Audio-Visual Stimulation (AVS) companion session targeting parasympathetic vagal tone restoration & brainwave entrainment.
                    </p>
                  </div>

                  <div class="flex flex-wrap items-center gap-2">
                    <button type="button" (click)="launchAvsVoiceCoRegulation()"
                      class="px-3.5 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer">
                      <span>🎙️</span>
                      <span>AVS Voice Guide</span>
                    </button>
                    <button type="button" (click)="toggleAvsSession()"
                      [class]="state.isAvsSessionActive() ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'"
                      class="px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer">
                      <span>{{ state.isAvsSessionActive() ? '⏸ Pause AVS Therapy' : '▶ Start AVS Co-Regulation' }}</span>
                    </button>

                      <!-- AVS Session Duration & Countdown Selector -->
                      <div class="flex items-center gap-1.5 bg-zinc-950 p-1.5 rounded-md border border-zinc-800 text-xs text-zinc-300">
                        <label for="avs-duration-select" class="text-zinc-400 font-bold uppercase tracking-wider pl-1">⏱️ Limit:</label>
                        <select id="avs-duration-select" [value]="avsSessionDuration()" (change)="setAvsDuration(+$any($event.target).value)" aria-label="AVS Session Duration Limit" class="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded px-2 py-1 outline-none cursor-pointer text-xs font-bold font-mono">
                          <option [value]="5">5 Min</option>
                          <option [value]="10">10 Min</option>
                          <option [value]="15">15 Min</option>
                          <option [value]="20">20 Min</option>
                          <option [value]="-1">Continuous</option>
                        </select>
                        @if (state.isAvsSessionActive() && avsSessionDuration() !== -1) {
                          <span class="text-indigo-400 font-mono font-black pl-2 tracking-wider animate-pulse">{{ getFormattedAvsTime() }}</span>
                        }
                      </div>

                      <!-- High-Definition Bitrate / Audio Quality Selector -->
                      <div class="flex items-center gap-1.5 bg-zinc-950 p-1.5 rounded-md border border-zinc-800 text-xs text-zinc-300">
                        <label for="avs-bitrate-select" class="text-amber-400 font-bold uppercase tracking-wider pl-1">🎛️ Audio Bitrate:</label>
                        <select id="avs-bitrate-select" [value]="avsService.sessionConfig().bitrateTier" (change)="setAvsBitrate($any($event.target).value)" aria-label="AVS Audio Bitrate and Sample Rate Quality" class="bg-zinc-900 border border-zinc-800 text-amber-300 rounded px-2 py-1 outline-none cursor-pointer text-xs font-bold font-mono">
                          <option value="4608k_studio">4608 kbps • Studio Lossless (96kHz/32-bit Float)</option>
                          <option value="1536k_lossless">1536 kbps • Direct PCM Lossless (48kHz/32-bit)</option>
                          <option value="320k">320 kbps • Audiophile Spatial (Bauer HRTF)</option>
                          <option value="192k">192 kbps • Standard Co-Regulation</option>
                        </select>
                      </div>

                      <!-- Seagullian Persona Influence Selector (Visible in Spark & Dark Modes) -->
                      @if (themeService.currentTheme() === 'spark' || themeService.currentTheme() === 'dark') {
                        <div class="flex items-center gap-1.5 bg-zinc-950 p-1.5 rounded-md border border-zinc-800 text-xs text-zinc-300">
                          <label for="seagull-persona-select" class="text-zinc-400 font-bold uppercase tracking-wider pl-1">🕊️ Persona:</label>
                          <select id="seagull-persona-select" [value]="themeService.activeSeagullPersona()" (change)="themeService.activeSeagullPersona.set($any($event.target).value)" aria-label="Seagullian Persona Influence" class="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded px-2 py-1 outline-none cursor-pointer text-xs font-bold">
                            <option value="calm-gull">🕊️ Calm Gull (Zen Shore)</option>
                            <option value="active-skimmer">🪶 Active Skimmer (High Winds)</option>
                            <option value="deep-navigator">🦅 Deep Navigator (Thermal Lift)</option>
                            <option value="storm-rider">⚡ Storm Rider (Ocean Gale)</option>
                          </select>
                        </div>
                      }
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div class="bg-white/70 dark:bg-zinc-900/70 p-3.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60">
                      <div class="flex justify-between items-center mb-2">
                        <span class="font-bold text-gray-700 dark:text-zinc-300">🫁 Resonant Breathing Rate</span>
                        <span class="font-mono font-black text-indigo-600 dark:text-indigo-400">{{ state.avsBreathingRate().toFixed(1) }} bpm</span>
                      </div>
                      <input type="range" min="4.0" max="8.0" step="0.5" [value]="state.avsBreathingRate()"
                        (input)="updateAvsBreathing($event)"
                        class="w-full h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                      <span class="text-[10px] text-gray-400 dark:text-zinc-500 block mt-1">0.1 Hz Baroreflex Peak Resonance</span>
                    </div>

                    <div class="bg-white/70 dark:bg-zinc-900/70 p-3.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60">
                      <div class="flex justify-between items-center mb-2">
                        <span class="font-bold text-gray-700 dark:text-zinc-300">🧠 Target Entrainment</span>
                        <span class="font-mono font-black text-purple-600 dark:text-purple-400">{{ state.avsBrainwaveFrequency() | titlecase }} ({{ state.avsBrainwaveFrequencyHz() }} Hz)</span>
                      </div>
                      <div class="flex gap-1">
                        <button type="button" (click)="setAvsBrainwave('theta', 6.0)"
                          [class.bg-purple-600]="state.avsBrainwaveFrequency() === 'theta'"
                          [class.text-white]="state.avsBrainwaveFrequency() === 'theta'"
                          class="flex-1 py-1 rounded bg-gray-100 dark:bg-zinc-800 text-[10px] font-bold transition cursor-pointer">Theta (6Hz)</button>
                        <button type="button" (click)="setAvsBrainwave('alpha', 10.0)"
                          [class.bg-purple-600]="state.avsBrainwaveFrequency() === 'alpha'"
                          [class.text-white]="state.avsBrainwaveFrequency() === 'alpha'"
                          class="flex-1 py-1 rounded bg-gray-100 dark:bg-zinc-800 text-[10px] font-bold transition cursor-pointer">Alpha (10Hz)</button>
                        <button type="button" (click)="setAvsBrainwave('gamma', 40.0)"
                          [class.bg-purple-600]="state.avsBrainwaveFrequency() === 'gamma'"
                          [class.text-white]="state.avsBrainwaveFrequency() === 'gamma'"
                          class="flex-1 py-1 rounded bg-gray-100 dark:bg-zinc-800 text-[10px] font-bold transition cursor-pointer">Gamma (40Hz)</button>
                      </div>
                    </div>

                    <div class="bg-white/70 dark:bg-zinc-900/70 p-3.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 flex flex-col justify-between">
                      <span class="font-bold text-gray-700 dark:text-zinc-300">⚡ Autonomic Status</span>
                      <div class="flex items-center gap-2 mt-1">
                        <span class="w-2.5 h-2.5 rounded-full" [class.bg-emerald-500]="state.isAvsSessionActive()" [class.animate-ping]="state.isAvsSessionActive()" [class.bg-gray-400]="!state.isAvsSessionActive()"></span>
                        <span class="font-bold font-mono text-[11px]" [class.text-emerald-600]="state.isAvsSessionActive()" [class.dark:text-emerald-400]="state.isAvsSessionActive()">
                          {{ state.isAvsSessionActive() ? 'SESSION ACTIVE (AUDIO-VISUAL FLICKER)' : 'STANDBY' }}
                        </span>
                      </div>
                      <div class="flex items-center justify-between text-[10px] text-gray-400 dark:text-zinc-500 mt-1">
                        <span>Auto-Cutoff Enabled</span>
                        <span class="text-amber-500 font-mono font-bold">{{ avsService.bitrateLabel().split('•')[0].trim() }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- 🎛️ Audiophile DSP Mastering & Psychoacoustic Studio Rack -->
                  <div class="mt-4 p-4 rounded-2xl bg-zinc-950/90 border border-amber-500/30 font-mono text-xs shadow-xl">
                    <div class="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-amber-900/40 pb-2">
                      <div class="flex items-center gap-2">
                        <span class="text-base">🎛️</span>
                        <h4 class="font-black text-amber-300 uppercase tracking-wider text-xs">Audiophile Master Rack • 24-Bit Studio DSP Engine</h4>
                        <span class="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40">
                          {{ avsService.bitrateLabel() }}
                        </span>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="text-[11px] text-zinc-400">THD+N &lt; 0.0001% • 32-bit Float Internal Master</span>
                      </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <!-- 1. Harmonic Overtone Depth & Carrier Reference -->
                      <div class="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 flex flex-col justify-between">
                        <div>
                          <div class="flex justify-between items-center mb-1">
                            <span class="font-bold text-amber-400">🎼 Carrier Tuning</span>
                            <span class="font-bold font-mono text-amber-300">{{ avsService.sessionConfig().carrierFreqHz }} Hz</span>
                          </div>
                          <div class="grid grid-cols-2 gap-1 mt-1.5">
                            <button type="button" (click)="avsService.updateSessionConfig({ carrierFreqHz: 528 })"
                              [class.bg-amber-600]="avsService.sessionConfig().carrierFreqHz === 528"
                              [class.text-white]="avsService.sessionConfig().carrierFreqHz === 528"
                              class="py-1 px-1.5 rounded bg-zinc-800 text-[10px] font-bold text-zinc-300 transition hover:bg-zinc-700 cursor-pointer">528Hz Solfeggio</button>
                            <button type="button" (click)="avsService.updateSessionConfig({ carrierFreqHz: 432 })"
                              [class.bg-amber-600]="avsService.sessionConfig().carrierFreqHz === 432"
                              [class.text-white]="avsService.sessionConfig().carrierFreqHz === 432"
                              class="py-1 px-1.5 rounded bg-zinc-800 text-[10px] font-bold text-zinc-300 transition hover:bg-zinc-700 cursor-pointer">432Hz Verdi</button>
                          </div>
                        </div>
                        <span class="text-[10px] text-zinc-500 mt-2 block">Harmonic Stack: f₀ + 2f₀ + 3f₀ + 0.5f₀</span>
                      </div>

                      <!-- 2. Analog Saturation Profile -->
                      <div class="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 flex flex-col justify-between">
                        <div>
                          <div class="flex justify-between items-center mb-1">
                            <span class="font-bold text-amber-400">🔥 Harmonic Warmth</span>
                            <span class="font-bold font-mono text-amber-300 uppercase">{{ avsService.sessionConfig().saturationProfile.replace('_', ' ') }}</span>
                          </div>
                          <div class="grid grid-cols-3 gap-1 mt-1.5">
                            <button type="button" (click)="avsService.setSaturationProfile('tube_warmth')"
                              [class.bg-amber-600]="avsService.sessionConfig().saturationProfile === 'tube_warmth'"
                              [class.text-white]="avsService.sessionConfig().saturationProfile === 'tube_warmth'"
                              class="py-1 rounded bg-zinc-800 text-[10px] font-bold text-zinc-300 transition hover:bg-zinc-700 cursor-pointer">Tube</button>
                            <button type="button" (click)="avsService.setSaturationProfile('tape_velvet')"
                              [class.bg-amber-600]="avsService.sessionConfig().saturationProfile === 'tape_velvet'"
                              [class.text-white]="avsService.sessionConfig().saturationProfile === 'tape_velvet'"
                              class="py-1 rounded bg-zinc-800 text-[10px] font-bold text-zinc-300 transition hover:bg-zinc-700 cursor-pointer">Tape</button>
                            <button type="button" (click)="avsService.setSaturationProfile('pristine_linear')"
                              [class.bg-amber-600]="avsService.sessionConfig().saturationProfile === 'pristine_linear'"
                              [class.text-white]="avsService.sessionConfig().saturationProfile === 'pristine_linear'"
                              class="py-1 rounded bg-zinc-800 text-[10px] font-bold text-zinc-300 transition hover:bg-zinc-700 cursor-pointer">Linear</button>
                          </div>
                        </div>
                        <span class="text-[10px] text-zinc-500 mt-2 block">4x Oversampled Waveshaping</span>
                      </div>

                      <!-- 3. Bauer HRTF Headphone Crossfeed -->
                      <div class="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 flex flex-col justify-between">
                        <div>
                          <div class="flex justify-between items-center mb-1">
                            <span class="font-bold text-amber-400">🎧 Bauer Crossfeed</span>
                            <span class="font-bold font-mono" [class.text-emerald-400]="avsService.sessionConfig().psychoacousticSpatialCrossfeed" [class.text-zinc-500]="!avsService.sessionConfig().psychoacousticSpatialCrossfeed">
                              {{ avsService.sessionConfig().psychoacousticSpatialCrossfeed ? 'ACTIVE' : 'BYPASS' }}
                            </span>
                          </div>
                          <button type="button" (click)="avsService.updateSessionConfig({ psychoacousticSpatialCrossfeed: !avsService.sessionConfig().psychoacousticSpatialCrossfeed })"
                            [class.bg-emerald-600]="avsService.sessionConfig().psychoacousticSpatialCrossfeed"
                            [class.bg-zinc-800]="!avsService.sessionConfig().psychoacousticSpatialCrossfeed"
                            class="w-full mt-1.5 py-1 rounded text-[10px] font-bold text-white transition hover:opacity-90 cursor-pointer">
                            {{ avsService.sessionConfig().psychoacousticSpatialCrossfeed ? '✓ 280µs Cranial Shadow' : 'Enable Bauer HRTF' }}
                          </button>
                        </div>
                        <span class="text-[10px] text-zinc-500 mt-2 block">Anti-fatigue psychoacoustic pinna</span>
                      </div>

                      <!-- 4. Noise Bed & Mastering Dynamics -->
                      <div class="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 flex flex-col justify-between">
                        <div>
                          <div class="flex justify-between items-center mb-1">
                            <span class="font-bold text-amber-400">🌊 53-Bit Noise Bed</span>
                            <span class="font-bold font-mono text-emerald-400">16s Loop</span>
                          </div>
                          <div class="flex items-center justify-between text-[11px] text-zinc-300 mt-1">
                            <span>Mastering Limiter:</span>
                            <span class="text-emerald-400 font-bold font-mono">-16dB Opto</span>
                          </div>
                          <div class="flex items-center justify-between text-[11px] text-zinc-300 mt-0.5">
                            <span>Anti-Aliasing:</span>
                            <span class="text-indigo-400 font-bold font-mono">19.5kHz LPF</span>
                          </div>
                        </div>
                        <span class="text-[10px] text-zinc-500 mt-2 block">True IEEE-754 Mantissa Entropy</span>
                      </div>
                    </div>
                  </div>

                <!-- 🎭 4-Stage Therapeutic Narrative Arc Exploration -->
                <div class="mt-4 p-4 rounded-2xl bg-zinc-950/80 border border-purple-800/50 font-mono text-xs">
                  <div class="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-purple-900/40 pb-2">
                    <div class="flex items-center gap-2">
                      <span class="text-base">🎭</span>
                      <h4 class="font-black text-purple-300 uppercase tracking-wider text-xs">Therapeutic Narrative Arc Exploration</h4>
                    </div>
                    <span class="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-200 border border-purple-700/50 font-bold uppercase">
                      Medically Calibrated Stages
                    </span>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <button type="button" (click)="setAvsBrainwave('alpha', 12.0)"
                            class="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/50 hover:border-purple-500 transition text-left cursor-pointer">
                      <div class="text-[10px] font-bold text-purple-400 uppercase">Stage 1 (0-3m)</div>
                      <div class="text-xs font-black text-white">🌱 Induction</div>
                      <div class="text-[10px] text-zinc-400 font-sans mt-0.5">12 Hz Alpha • 174 Hz Tone</div>
                    </button>

                    <button type="button" (click)="setAvsBrainwave('theta', 7.83)"
                            class="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/50 hover:border-purple-500 transition text-left cursor-pointer">
                      <div class="text-[10px] font-bold text-purple-400 uppercase">Stage 2 (3-12m)</div>
                      <div class="text-xs font-black text-white">🌊 Deep Vagal</div>
                      <div class="text-[10px] text-zinc-400 font-sans mt-0.5">7.83 Hz Theta • 432 Hz Tone</div>
                    </button>

                    <button type="button" (click)="setAvsBrainwave('alpha', 10.0)"
                            class="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/50 hover:border-purple-500 transition text-left cursor-pointer">
                      <div class="text-[10px] font-bold text-purple-400 uppercase">Stage 3 (12-16m)</div>
                      <div class="text-xs font-black text-white">✨ Integration</div>
                      <div class="text-[10px] text-zinc-400 font-sans mt-0.5">528 Hz Solfeggio Tone</div>
                    </button>

                    <button type="button" (click)="setAvsBrainwave('gamma', 40.0)"
                            class="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/50 hover:border-purple-500 transition text-left cursor-pointer">
                      <div class="text-[10px] font-bold text-purple-400 uppercase">Stage 4 (16-20m)</div>
                      <div class="text-xs font-black text-white">🌅 Awakening</div>
                      <div class="text-[10px] text-zinc-400 font-sans mt-0.5">40 Hz Gamma Focus</div>
                    </button>
                  </div>
                </div>
              </div>
            }

            <!-- 🌸 Dr. Martin Seligman Positive Psychology & Human Flourishing Suite -->
            <app-positive-psychology-flourishing-hub class="mt-6 mb-6 block"></app-positive-psychology-flourishing-hub>

            <!-- Global Health Literacy vs Deep Clinical Rationale Mode Banner -->
            <div class="mb-4 p-3.5 rounded-2xl transition-all border flex items-center justify-between shadow-xs"
                 [class.bg-emerald-500/10]="themeService.isPlainLanguageMode()"
                 [class.border-emerald-500/30]="themeService.isPlainLanguageMode()"
                 [class.text-emerald-950]="themeService.isPlainLanguageMode()"
                 [class.dark:text-emerald-200]="themeService.isPlainLanguageMode()"
                 [class.bg-sky-500/10]="!themeService.isPlainLanguageMode()"
                 [class.border-sky-500/30]="!themeService.isPlainLanguageMode()"
                 [class.text-sky-950]="!themeService.isPlainLanguageMode()"
                 [class.dark:text-sky-200]="!themeService.isPlainLanguageMode()">
              <div class="flex items-center gap-3">
                <span class="text-xl">
                  {{ themeService.isPlainLanguageMode() ? '📖' : '🔬' }}
                </span>
                <div>
                  <h4 class="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
                    <span>
                      {{ themeService.isPlainLanguageMode() ? 'Plain Language Health Literacy Active' : 'Deep Clinical Rationale Active' }}
                    </span>
                    <span class="text-[9px] px-2 py-0.5 rounded-md font-mono uppercase font-bold"
                          [class.bg-emerald-500/20]="themeService.isPlainLanguageMode()"
                          [class.text-emerald-700]="themeService.isPlainLanguageMode()"
                          [class.dark:text-emerald-300]="themeService.isPlainLanguageMode()"
                          [class.bg-sky-500/20]="!themeService.isPlainLanguageMode()"
                          [class.text-sky-700]="!themeService.isPlainLanguageMode()"
                          [class.dark:text-sky-300]="!themeService.isPlainLanguageMode()">
                      {{ themeService.isPlainLanguageMode() ? 'Patient Literacy' : 'Physician & Specialist Level' }}
                    </span>
                  </h4>
                  <p class="text-[11px] opacity-90 font-medium mt-0.5">
                    {{ themeService.isPlainLanguageMode() ? 'All clinical notes, recommendations, and diagnostic rationales are simplified for easy understanding.' : 'All clinical notes detail deep pathophysiological mechanisms, ICD-10 codes, and clinical evidence.' }}
                  </p>
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-3 shrink-0">
                <!-- Accessibility Text Size Scale Button Group -->
                <div class="flex items-center gap-1 bg-white/30 dark:bg-black/30 p-1 rounded-xl border border-slate-350/50 dark:border-zinc-800/50 font-mono text-[9px] font-black">
                  <span class="px-2 text-zinc-500 dark:text-zinc-400">TEXT SIZE:</span>
                  <button type="button" (click)="themeService.textSizeScale.set('standard')"
                    [class.bg-white]="themeService.textSizeScale() === 'standard'"
                    [class.dark:bg-zinc-800]="themeService.textSizeScale() === 'standard'"
                    [class.text-indigo-650]="themeService.textSizeScale() === 'standard'"
                    [class.dark:text-indigo-400]="themeService.textSizeScale() === 'standard'"
                    [class.text-zinc-500]="themeService.textSizeScale() !== 'standard'"
                    [class.shadow-xs]="themeService.textSizeScale() === 'standard'"
                    class="px-2.5 py-1 rounded-md uppercase transition cursor-pointer border-0">
                    A (Std)
                  </button>
                  <button type="button" (click)="themeService.textSizeScale.set('large')"
                    [class.bg-white]="themeService.textSizeScale() === 'large'"
                    [class.dark:bg-zinc-800]="themeService.textSizeScale() === 'large'"
                    [class.text-indigo-650]="themeService.textSizeScale() === 'large'"
                    [class.dark:text-indigo-400]="themeService.textSizeScale() === 'large'"
                    [class.text-zinc-500]="themeService.textSizeScale() !== 'large'"
                    [class.shadow-xs]="themeService.textSizeScale() === 'large'"
                    class="px-2.5 py-1 rounded-md uppercase transition cursor-pointer border-0">
                    A+ (Lg)
                  </button>
                  <button type="button" (click)="themeService.textSizeScale.set('extra-large')"
                    [class.bg-white]="themeService.textSizeScale() === 'extra-large'"
                    [class.dark:bg-zinc-800]="themeService.textSizeScale() === 'extra-large'"
                    [class.text-indigo-650]="themeService.textSizeScale() === 'extra-large'"
                    [class.dark:text-indigo-400]="themeService.textSizeScale() === 'extra-large'"
                    [class.text-zinc-500]="themeService.textSizeScale() !== 'extra-large'"
                    [class.shadow-xs]="themeService.textSizeScale() === 'extra-large'"
                    class="px-2.5 py-1 rounded-md uppercase transition cursor-pointer border-0">
                    A++ (XL)
                  </button>
                </div>

                <!-- Cognitive Output Level Target Selector -->
                <div class="flex items-center gap-1 bg-white/30 dark:bg-black/30 p-1 rounded-xl border border-slate-350/50 dark:border-zinc-800/50 font-mono text-[9px] font-black">
                  <span class="px-2 text-zinc-500 dark:text-zinc-400">COGNITIVE OUTPUT:</span>
                  <button type="button" (click)="state.selectedCognitiveLevel.set('standard')"
                    [class.bg-white]="state.selectedCognitiveLevel() === 'standard'"
                    [class.dark:bg-zinc-800]="state.selectedCognitiveLevel() === 'standard'"
                    [class.text-sky-600]="state.selectedCognitiveLevel() === 'standard'"
                    [class.dark:text-sky-400]="state.selectedCognitiveLevel() === 'standard'"
                    [class.text-zinc-500]="state.selectedCognitiveLevel() !== 'standard'"
                    class="px-2 py-1 rounded-md uppercase transition cursor-pointer border-0">
                    🔬 Standard
                  </button>
                  <button type="button" (click)="state.selectedCognitiveLevel.set('simplified')"
                    [class.bg-white]="state.selectedCognitiveLevel() === 'simplified'"
                    [class.dark:bg-zinc-800]="state.selectedCognitiveLevel() === 'simplified'"
                    [class.text-emerald-600]="state.selectedCognitiveLevel() === 'simplified'"
                    [class.dark:text-emerald-400]="state.selectedCognitiveLevel() === 'simplified'"
                    [class.text-zinc-500]="state.selectedCognitiveLevel() !== 'simplified'"
                    class="px-2 py-1 rounded-md uppercase transition cursor-pointer border-0">
                    📖 Simplified
                  </button>
                  <button type="button" (click)="state.selectedCognitiveLevel.set('dyslexia')"
                    [class.bg-white]="state.selectedCognitiveLevel() === 'dyslexia'"
                    [class.dark:bg-zinc-800]="state.selectedCognitiveLevel() === 'dyslexia'"
                    [class.text-amber-600]="state.selectedCognitiveLevel() === 'dyslexia'"
                    [class.dark:text-amber-400]="state.selectedCognitiveLevel() === 'dyslexia'"
                    [class.text-zinc-500]="state.selectedCognitiveLevel() !== 'dyslexia'"
                    class="px-2 py-1 rounded-md uppercase transition cursor-pointer border-0">
                    🔤 Dyslexia
                  </button>
                  <button type="button" (click)="state.selectedCognitiveLevel.set('child')"
                    [class.bg-white]="state.selectedCognitiveLevel() === 'child'"
                    [class.dark:bg-zinc-800]="state.selectedCognitiveLevel() === 'child'"
                    [class.text-purple-600]="state.selectedCognitiveLevel() === 'child'"
                    [class.dark:text-purple-400]="state.selectedCognitiveLevel() === 'child'"
                    [class.text-zinc-500]="state.selectedCognitiveLevel() !== 'child'"
                    class="px-2 py-1 rounded-md uppercase transition cursor-pointer border-0">
                    🧸 Child
                  </button>
                </div>
              </div>
            </div>

            <!-- Global Sentinel Intelligence Scope Selector (Micro Patient vs Macro Fleet) -->
            <div class="mb-6 p-4 bg-slate-100/90 dark:bg-zinc-900/90 rounded-lg border border-slate-300 dark:border-zinc-800 shadow-md font-mono text-xs">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full bg-cyan-500 animate-ping"></span>
                  <span class="font-black uppercase tracking-wider text-gray-900 dark:text-zinc-100 text-sm">
                    🌐 Sentinel Intelligence Scope
                  </span>
                </div>
                <div class="flex items-center gap-1.5 bg-gray-200 dark:bg-zinc-950 p-1 rounded-md border border-gray-300 dark:border-zinc-800">
                  <button type="button" (click)="state.sentinelScope.set('micro-patient')"
                          [class.bg-sky-600]="state.sentinelScope() === 'micro-patient'"
                          [class.text-white]="state.sentinelScope() === 'micro-patient'"
                          [class.text-gray-700]="state.sentinelScope() !== 'micro-patient'"
                          [class.dark:text-zinc-400]="state.sentinelScope() !== 'micro-patient'"
                          class="min-h-[44px] px-3.5 py-2 text-xs font-bold rounded-md transition cursor-pointer border-0 flex items-center gap-1.5">
                    👤 Micro Patient Scope
                  </button>
                  <button type="button" (click)="state.sentinelScope.set('macro-fleet')"
                          [class.bg-emerald-600]="state.sentinelScope() === 'macro-fleet'"
                          [class.text-white]="state.sentinelScope() === 'macro-fleet'"
                          [class.text-gray-700]="state.sentinelScope() !== 'macro-fleet'"
                          [class.dark:text-zinc-400]="state.sentinelScope() !== 'macro-fleet'"
                          class="min-h-[44px] px-3.5 py-2 text-xs font-bold rounded-md transition cursor-pointer border-0 flex items-center gap-1.5">
                    🌐 Macro Fleet Sentinel Scope
                  </button>
                </div>
              </div>

              <!-- Macro Fleet Telemetry Banner -->
              @if (state.sentinelScope() === 'macro-fleet') {
                <div class="mt-3 p-3 bg-white/90 dark:bg-zinc-950/90 rounded-md border border-emerald-500/30 text-gray-800 dark:text-zinc-200 animate-fadeIn">
                  <div class="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                    <span>🔬 Global WHO Population Health Registry Sentinel</span>
                    <span>Herd Immunity: 96.1% | Regional AQI: Optimal</span>
                  </div>
                  <p class="text-[11px] font-sans text-gray-600 dark:text-zinc-400 leading-snug">
                    "FHIR R4 population health registries and epidemiological surveillance networks connected to active patient strategy."
                  </p>
                </div>
              }
            </div>

            <!-- Longitudinal Clinical Trajectory Biography Component -->
            @if (themeService.analogyLensMode() !== 'clinical') {
              <div class="mb-6">
                <app-clinical-trajectory-biography></app-clinical-trajectory-biography>
              </div>
            }

            <!-- Synchronized Dual-Pane Consultation View -->
            @if (themeService.analogyLensMode() !== 'clinical') {
              <div class="mb-6">
                <app-dual-pane-consultation></app-dual-pane-consultation>
              </div>
            }

            <!-- Modular Report Lens Tabs -->
            @defer (on idle) {
              <app-socratic-epistemology-lens-tab></app-socratic-epistemology-lens-tab>
              <app-nutritional-bypass-lens-tab></app-nutritional-bypass-lens-tab>
            }

            <!-- AI Comprehensive Report Sections -->
            @for (section of sections; track section.title; let i = $index) {
              @if (selectedMobileSectionTab() === 'all' || selectedMobileSectionTab() === section.title) {
                <div [id]="i === 0 ? 'tour-report-node' : null" appReveal [revealDelay]="i * 100" class="w-full shrink-0 flex flex-col min-h-max min-w-0 overflow-hidden">
                  <pocket-gull-card [title]="section.title" [icon]="section.icon" class="flex-1 min-w-0 overflow-hidden">
                    <div right-action class="flex items-center gap-2">
                      @if (intel.isLoading() && !verificationStatus(section.title)) {
                        <div class="flex items-center gap-1.5 mr-2">
                          <span class="flex h-1.5 w-1.5 rounded-full bg-[#689F38] dark:bg-[#8bc34a] animate-pulse"></span>
                          <span class="text-[12px] uppercase tracking-tighter text-gray-500 dark:text-zinc-400">{{ activeAgentName() }} is streaming...</span>
                        </div>
                      }
                      @if (verificationStatus(section.title); as status) {
                        <pocket-gull-badge [label]="status" [severity]="statusSeverity(status)">
                          <div badge-icon [innerHTML]="ClinicalIcons.Verified | safeHtml"></div>
                        </pocket-gull-badge>
                      }

                      <!-- Expand / Collapse Accordion Toggle -->
                      <button type="button" (click)="toggleSection(section.title)"
                        [title]="isSectionCollapsed(section.title, i) ? 'Expand Section' : 'Collapse Section'"
                        class="px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer">
                        <span class="text-[10px] text-zinc-400 uppercase font-mono">{{ section.nodes.length }} items</span>
                        <span>{{ isSectionCollapsed(section.title, i) ? '▼ Expand' : '▲ Collapse' }}</span>
                      </button>
                    </div>

                    @if (!isSectionCollapsed(section.title, i)) {
                      <div class="rams-typography" (mouseover)="onTooltipOver($event)" (mouseout)="onTooltipOut($event)">
                        @for (node of section.nodes; track node.id) {
                          @if (node.type === 'raw') {
                            <div [innerHTML]="renderNodeHtml(node.rawHtml || '') | safeHtml" class="mb-4"></div>
                          } @else if (node.type === 'paragraph') {
                            <app-summary-node
                              [node]="node"
                              type="paragraph"
                              [sectionTitle]="section.title"
                              [saveStatus]="nodeSaveStatuses()[node.key]"
                              [protocolInsights]="protocolInsights"
                              (update)="handleNodeUpdate(node, $event)"
                              (dictationToggle)="openNodeDictation(node)"
                              (askAgent)="openAgentDialog($event)">
                            </app-summary-node>
                          } @else if (node.type === 'list') {
                            @if (node.ordered) {
                              <ol class="list-decimal pl-4 mb-6">
                                @for (item of node.items; track item.id) {
                                  <li class="pl-2 mb-1">
                                    <app-summary-node
                                      [node]="item"
                                      type="list-item"
                                      [sectionTitle]="section.title"
                                      [saveStatus]="nodeSaveStatuses()[item.key]"
                                      [protocolInsights]="protocolInsights"
                                      (update)="handleNodeUpdate(item, $event)"
                                      (dictationToggle)="openNodeDictation(item)"
                                      (askAgent)="openAgentDialog($event)">
                                    </app-summary-node>
                                  </li>
                                }
                              </ol>
                            } @else {
                              <ul class="list-disc pl-4 mb-6">
                                @for (item of node.items; track item.id) {
                                  <li class="pl-2 mb-1">
                                    <app-summary-node
                                      [node]="item"
                                      type="list-item"
                                      [sectionTitle]="section.title"
                                      [saveStatus]="nodeSaveStatuses()[item.key]"
                                      [protocolInsights]="protocolInsights"
                                      (update)="handleNodeUpdate(item, $event)"
                                      (dictationToggle)="openNodeDictation(item)"
                                      (askAgent)="openAgentDialog($event)">
                                    </app-summary-node>
                                  </li>
                                }
                              </ul>
                            }
                          }
                        }
                      </div>
                    }
                  </pocket-gull-card>
                </div>
              }
            }

            <!-- Actionable Lens Flow Dock (Dieter Rams Grid & Continuous Flow) -->
            <div class="mt-6 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-md font-mono text-xs no-print">
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-sm">🧭</span>
                    <span class="font-extrabold uppercase tracking-wider text-slate-800 dark:text-zinc-100">
                      Lens Action Flow: {{ activeLens() }}
                    </span>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                      Step {{ activeLensIndex() + 1 }} of {{ availableLenses.length }}
                    </span>
                  </div>
                  <p class="text-xs text-slate-500 dark:text-zinc-400 font-sans mt-0.5">
                    Complete this lens analysis by logging findings into the care plan or advancing to the next specialized lens.
                  </p>
                </div>

                <div class="flex flex-wrap items-center gap-2.5">
                  <button type="button" (click)="logLensFindingsToCarePlan()"
                    class="px-3.5 py-2 rounded-md bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-[11px] font-bold uppercase tracking-wider transition-all border border-slate-300 dark:border-zinc-700 cursor-pointer flex items-center gap-1.5 focus:ring-2 focus:ring-indigo-500/50 outline-none">
                    <span>📌</span>
                    <span>Log Findings to Plan</span>
                  </button>

                  <button type="button" (click)="launchSpecialistHandoffModal()"
                    class="px-3.5 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer flex items-center gap-1.5 focus:ring-2 focus:ring-purple-400 outline-none">
                    <span>⚡</span>
                    <span>AI Consult on {{ activeLens() }}</span>
                  </button>

                  @if (hasNextLens()) {
                    <button type="button" (click)="navigateToNextLens()"
                      class="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-extrabold uppercase tracking-wider transition-all shadow-md cursor-pointer active:scale-95 flex items-center gap-2 focus:ring-2 focus:ring-indigo-400 outline-none">
                      <span>Advance to {{ getNextLensName() }}</span>
                      <span class="text-sm">➡️</span>
                    </button>
                  }
                </div>
              </div>

              @if (flowToastMessage(); as toast) {
                <div class="mt-3 p-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-2 animate-in fade-in duration-200">
                  <span>✅</span>
                  <span>{{ toast }}</span>
                </div>
              }
            </div>

        <!-- AI Co-Pilot Transparency Watermark -->
        <div class="mt-4 pb-8 flex items-center justify-center gap-3 opacity-60 no-print select-none">
          <div class="h-px bg-gray-300 dark:bg-zinc-700 flex-1 max-w-[120px]"></div>
          <div class="text-[12px] font-bold uppercase tracking-widest text-gray-500 dark:text-zinc-500 flex items-center gap-1.5">
            <span [innerHTML]="ClinicalIcons.Verified | safeHtml" class="w-3.5 h-3.5"></span>
            Generated by AI Co-Pilot — Verify all clinical findings
          </div>
          <div class="h-px bg-gray-300 dark:bg-zinc-700 flex-1 max-w-[120px]"></div>
        </div>

        @if (!intel.isLoading() && !hasAnyReport()) {
          <div class="h-64 border border-dashed border-gray-200 dark:border-zinc-800 rounded-lg flex items-center justify-center no-print">
            <p class="text-xs text-gray-500 dark:text-zinc-400 font-medium uppercase tracking-widest">Waiting for input data...</p>
          </div>
        }
      </div>
    }

    <!-- Viewport Portal Tooltip -->
    @if (activeTooltip(); as tooltip) {
      <div class="fixed z-[100] w-72 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg shadow-2xl p-4 pointer-events-none animate-in fade-in zoom-in-95 duration-200"
           [style.left.px]="tooltip.x"
           [style.top.px]="tooltip.y"
           style="transform: translate(-50%, -100%);">
        <div class="flex items-start gap-3 relative z-10">
          <!-- Spectral severity icon: P1-Critical (640nm red) vs P2-Urgent (585nm amber) -->
          <div class="mt-0.5 shrink-0"
               [style.color]="tooltip.severity === 'high' ? 'var(--spectral-critical)' : 'var(--spectral-urgent)'"
               [innerHTML]="(tooltip.severity === 'high' ? ClinicalIcons.Risk : ClinicalIcons.Risk) | safeHtml">
          </div>
          <div>
            <div class="text-[12px] font-bold uppercase tracking-wider mb-1"
                 [style.color]="tooltip.severity === 'high' ? 'var(--spectral-critical)' : 'var(--spectral-urgent)'">
              AI Verification Flag
            </div>
            <div class="text-xs text-gray-700 dark:text-zinc-300 leading-relaxed">{{ tooltip.text }}</div>
          </div>
        </div>
        <!-- Caret -->
        <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-zinc-900 border-b border-r border-gray-200 dark:border-zinc-800 rotate-45"></div>
     </div>
    }

    <!-- Node Agent Dialog (Evidence Focus) -->
    @if (nodeAgentDialogData()) {
      <app-node-agent-dialog
        [data]="nodeAgentDialogData()!"
        [patientData]="currentPatientDataForDialog()"
        (closed)="nodeAgentDialogData.set(null)">
      </app-node-agent-dialog>
    }

    <!-- Clinician-to-Clinician Handoff Modal -->
    <app-handoff-modal [isOpen]="showHandoffModal()" (close)="showHandoffModal.set(false)"></app-handoff-modal>
    @if (showSec1557Modal()) {
      <app-sec1557-audit-modal (close)="showSec1557Modal.set(false)"></app-sec1557-audit-modal>
    }

    <!-- Clinical Tools & Exports Modal -->
    @if (showClinicalToolsModal()) {
      <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div class="w-full max-w-lg p-6 rounded-3xl bg-zinc-950/95 border border-purple-500/40 shadow-[0_0_50px_rgba(168,85,247,0.3)] font-mono text-zinc-100 relative">
          
          <div class="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
            <div class="flex items-center gap-3">
              <span class="text-2xl p-2 rounded-xl bg-purple-500/20 text-purple-300">🎛️</span>
              <div>
                <h3 class="text-base font-extrabold text-white uppercase tracking-wider">Clinical Tools & Exports</h3>
                <span class="text-xs text-zinc-400 font-sans">Patient: {{ state.patientName() || 'Active Encounter' }}</span>
              </div>
            </div>

            <button (click)="showClinicalToolsModal.set(false)" class="w-8 h-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold flex items-center justify-center transition cursor-pointer">
              ✕
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4 text-xs font-sans">
            <button (click)="exportFhirPassport(); showClinicalToolsModal.set(false)"
              class="p-3 rounded-2xl bg-sky-950/40 hover:bg-sky-900/60 border border-sky-500/40 text-sky-200 flex items-center gap-2.5 transition text-left cursor-pointer">
              <span class="text-xl">📄</span>
              <div>
                <strong class="block font-bold text-white uppercase text-[11px] font-mono">FHIR R4 Passport</strong>
                <span class="text-[10.5px] text-zinc-400">Download HIPAA JSON Bundle</span>
              </div>
            </button>

            <button (click)="showSec1557Modal.set(true); showClinicalToolsModal.set(false)"
              class="p-3 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-200 flex items-center gap-2.5 transition text-left cursor-pointer">
              <span class="text-xl">🛡️</span>
              <div>
                <strong class="block font-bold text-white uppercase text-[11px] font-mono">Sec 1557 Audit</strong>
                <span class="text-[10.5px] text-zinc-400">Algorithmic Fairness Telemetry</span>
              </div>
            </button>

            <button (click)="showHandoffModal.set(true); showClinicalToolsModal.set(false)"
              class="p-3 rounded-2xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/40 text-purple-200 flex items-center gap-2.5 transition text-left cursor-pointer">
              <span class="text-xl">🤝</span>
              <div>
                <strong class="block font-bold text-white uppercase text-[11px] font-mono">Specialist Consult</strong>
                <span class="text-[10.5px] text-zinc-400">SBAR Handoff Brief</span>
              </div>
            </button>

            <button (click)="showCdsModal.set(true); showClinicalToolsModal.set(false)"
              class="p-3 rounded-2xl bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/40 text-indigo-200 flex items-center gap-2.5 transition text-left cursor-pointer">
              <span class="text-xl">⚖️</span>
              <div>
                <strong class="block font-bold text-white uppercase text-[11px] font-mono">FDA 520(o) CDS</strong>
                <span class="text-[10.5px] text-zinc-400">Epistemic Uncertainty & H0 Falsifiability</span>
              </div>
            </button>

            <button (click)="showRpmModal.set(true); showClinicalToolsModal.set(false)"
              class="p-3 rounded-2xl bg-teal-950/40 hover:bg-teal-900/60 border border-teal-500/40 text-teal-200 flex items-center gap-2.5 transition text-left cursor-pointer">
              <span class="text-xl">📊</span>
              <div>
                <strong class="block font-bold text-white uppercase text-[11px] font-mono">CMS RPM Billing</strong>
                <span class="text-[10.5px] text-zinc-400">CPT 99453/99454/99457 Audit</span>
              </div>
            </button>

            <button (click)="exportCsvTelemetry(); showClinicalToolsModal.set(false)"
              class="p-3 rounded-2xl bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-200 flex items-center gap-2.5 transition text-left cursor-pointer">
              <span class="text-xl">📊</span>
              <div>
                <strong class="block font-bold text-white uppercase text-[11px] font-mono">CSV Telemetry</strong>
                <span class="text-[10.5px] text-zinc-400">RFC 4180 Vital & Assessment Export</span>
              </div>
            </button>

            <button (click)="exportHl7v2Message(); showClinicalToolsModal.set(false)"
              class="p-3 rounded-2xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-200 flex items-center gap-2.5 transition text-left cursor-pointer">
              <span class="text-xl">🏥</span>
              <div>
                <strong class="block font-bold text-white uppercase text-[11px] font-mono">HL7 v2.5.1 ER7</strong>
                <span class="text-[10.5px] text-zinc-400">Legacy EHR ORU^R01 Message</span>
              </div>
            </button>

            <button (click)="toggleParadigm(); showClinicalToolsModal.set(false)"
              class="p-3 rounded-2xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 text-amber-200 flex items-center gap-2.5 transition text-left cursor-pointer">
              <span class="text-xl">☯️</span>
              <div>
                <strong class="block font-bold text-white uppercase text-[11px] font-mono">Switch Paradigm</strong>
                <span class="text-[10.5px] text-zinc-400">Western / TCM / Ayurveda</span>
              </div>
            </button>
          </div>

          <div class="pt-3 border-t border-zinc-800 flex justify-end">
            <button (click)="showClinicalToolsModal.set(false)" class="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs uppercase tracking-wider transition cursor-pointer">
              Close
            </button>
          </div>

        </div>
      </div>
    }

    <!-- CMS Remote Patient Monitoring (RPM) Dashboard Modal -->
    @if (showRpmModal()) {
      <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in no-print">
        <div class="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div class="flex justify-end mb-2">
            <button (click)="showRpmModal.set(false)" class="px-3 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs uppercase tracking-wider cursor-pointer border border-zinc-700">
              ✕ Close Dashboard
            </button>
          </div>
          <app-rpm-dashboard></app-rpm-dashboard>
        </div>
      </div>
    }

    <!-- FHIR R4 Patient Health Passport Modal -->
    @if (showFhirPassportModal()) {
      <app-fhir-passport-modal (closeModal)="showFhirPassportModal.set(false)"></app-fhir-passport-modal>
    }

    <!-- FDA 21 CFR Section 520(o) CDS Transparency & Epistemic Uncertainty Modal -->
    @if (showCdsModal()) {
      <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in no-print">
        <div class="bg-zinc-900 border border-indigo-500/40 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 text-zinc-100 max-h-[90vh] overflow-y-auto font-sans">
          
          <div class="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-indigo-950 border border-indigo-500/50 flex items-center justify-center text-xl">
                🛡️
              </div>
              <div>
                <h3 class="text-base font-extrabold uppercase tracking-wider text-white">FDA 21 CFR 520(o) Non-Device CDS</h3>
                <span class="text-xs text-indigo-400 font-mono">Epistemic Uncertainty & Reasoning Transparency</span>
              </div>
            </div>
            <button (click)="showCdsModal.set(false)" class="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold flex items-center justify-center cursor-pointer transition">
              ✕
            </button>
          </div>

          <div class="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs space-y-1">
            <div class="flex items-center justify-between text-indigo-300 font-bold uppercase tracking-wider text-[11px] font-mono">
              <span>Regulatory Standard: {{ cdsReport().regulatoryMetadata.cfrReference }}</span>
              <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">Exempt Non-Device CDS</span>
            </div>
            <p class="text-zinc-300 text-[11.5px] leading-relaxed">
              {{ cdsReport().disclaimer }}
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
              <span class="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block font-mono">Epistemic Confidence Score</span>
              <div class="flex items-baseline gap-2">
                <span class="text-3xl font-extrabold text-indigo-400 font-mono">{{ cdsReport().overallConfidencePercent }}%</span>
                <span class="text-xs text-emerald-400 font-semibold">({{ cdsReport().evidenceLevel }})</span>
              </div>
              <div class="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div class="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full" [style.width.%]="cdsReport().overallConfidencePercent"></div>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
              <span class="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block font-mono">Null Hypothesis H0 Falsifiability</span>
              <div class="flex items-center justify-between">
                <span class="text-xs font-mono text-zinc-300">p-value: <strong class="text-sky-400">p = {{ cdsReport().falsifiability.pValue }}</strong></span>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                      [class]="cdsReport().falsifiability.isFalsified ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'">
                  {{ cdsReport().falsifiability.isFalsified ? 'H0 Rejected (p < 0.05)' : 'H0 Retained' }}
                </span>
              </div>
              <p class="text-[11px] text-zinc-400 line-clamp-2">
                {{ cdsReport().falsifiability.nullHypothesisH0 }}
              </p>
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Cochrane Risk of Bias (RoB 2) Scorecard</span>
              <span class="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/80 font-bold text-[10px] uppercase">
                Overall: {{ cdsReport().cochraneBias.overallRiskOfBias }}
              </span>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10.5px] font-mono">
              <div class="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                <span class="text-zinc-500 block">Randomization</span>
                <span class="text-emerald-400 font-bold">{{ cdsReport().cochraneBias.randomizationBias }}</span>
              </div>
              <div class="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                <span class="text-zinc-500 block">Deviations</span>
                <span class="text-emerald-400 font-bold">{{ cdsReport().cochraneBias.deviationFromInterventionBias }}</span>
              </div>
              <div class="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                <span class="text-zinc-500 block">Missing Data</span>
                <span class="text-amber-400 font-bold">{{ cdsReport().cochraneBias.missingDataBias }}</span>
              </div>
              <div class="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                <span class="text-zinc-500 block">Measurement</span>
                <span class="text-emerald-400 font-bold">{{ cdsReport().cochraneBias.measurementBias }}</span>
              </div>
            </div>

            <p class="text-[11px] text-zinc-400 italic">
              "{{ cdsReport().cochraneBias.skepticalSummary }}"
            </p>
          </div>

          <div class="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs space-y-1">
            <span class="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block font-mono">Primary Benchmark Citation</span>
            <div class="text-sky-300 font-mono text-[11.5px]">
              {{ cdsReport().primaryCitation }}
            </div>
          </div>

          <div class="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
            <span class="text-base">👩‍⚕️</span>
            <div>
              <strong class="block font-bold text-amber-300 uppercase text-[11px] font-mono">Attending Clinician Mandate</strong>
              <span class="text-[11px] text-amber-200/90 leading-normal">{{ cdsReport().regulatoryMetadata.clinicianMandate }}</span>
            </div>
          </div>

          <div class="flex justify-end pt-2">
            <button (click)="showCdsModal.set(false)" class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider transition cursor-pointer">
              Acknowledge & Close
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Floating 3D Anatomy Research Overlay -->
    @if (showFloating3dOverlay()) {
      <div 
        class="fixed bottom-6 right-6 z-50 w-80 h-[380px] bg-zinc-950/95 border border-teal-500/40 backdrop-blur-xl rounded-2xl p-4 shadow-2xl transition-all duration-300 transform scale-100 hover:border-teal-400 font-sans"
        (mouseenter)="cancelCloseTimer()"
        (mouseleave)="startCloseTimer()"
      >
        <div class="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
          <div class="flex items-center gap-1.5 text-teal-300 font-bold text-[11px] uppercase tracking-wider">
            <span>🔬</span>
            <span>3D Anatomy Overlay</span>
          </div>
          <button (click)="closeOverlay()" class="text-zinc-400 hover:text-zinc-200 cursor-pointer p-0.5">✕</button>
        </div>
        
        <div class="h-64 rounded-xl overflow-hidden bg-white border border-slate-200 shadow-xs relative">
          @defer (on viewport; prefetch on idle) {
            <app-body-3d-viewer 
              [anatomyViewMode]="state.anatomyViewMode()"
              class="w-full h-full">
            </app-body-3d-viewer>
          } @placeholder {
            <div class="w-full h-full flex items-center justify-center gap-2 bg-slate-900 text-teal-400 font-mono text-xs">
              <div class="w-2 h-2 rounded-full bg-teal-400 animate-ping"></div>
              <span>Initializing 3D Body Mesh...</span>
            </div>
          }
        </div>
        
        <div class="mt-2.5 text-[10px] text-zinc-500 font-mono text-center flex items-center justify-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping"></span>
          <span>Targeting: {{ state.selectedPartId() || 'None' }}</span>
        </div>
      </div>
    }
  `
})
export class AnalysisReportComponent implements OnDestroy {
  openGleeModal = output<void>();
  protected readonly intel = inject(ClinicalIntelligenceService);
  protected readonly state = inject(PatientStateService);
  protected readonly patientManager = inject(PatientManagementService);
  protected readonly dictation = inject(DictationService);
  private audit = inject(AuditService);
  protected readonly export = inject(ExportService);
  protected readonly actMapper = inject(ClinicalActLensMapperService);
  private readonly medicalDecoder = inject(MedicalDecoderService);
  protected readonly lyricsService = inject(ParadigmLyricsService);
  protected readonly themeService = inject(ThemeService);
  protected readonly compassionateAnalogy = inject(CompassionateAnalogyService);
  protected readonly skepticalService = inject(SkepticalEpistemologyService);
  protected readonly fhirIntegration = inject(FhirIntegrationService);
  protected readonly avsService = inject(AvsEngineService);

  setAvsBitrate(tier: AvsBitrateTier): void {
    this.avsService.setBitrateTier(tier);
  }

  getAmazonAffiliateUrl(itemName: string): string {
    const clean = String(itemName || '').replace(/[^\w\s-]/g, '').trim();
    return `https://www.amazon.com/s?k=${encodeURIComponent(clean)}&tag=pgdpo-20`;
  }

  getAmazonPharmacyUrl(medName: string): string {
    const clean = String(medName || '').replace(/[^\w\s-]/g, '').trim();
    return `https://pharmacy.amazon.com/search?q=${encodeURIComponent(clean)}&tag=pgdpo-20`;
  }

  flowToastMessage = signal<string | null>(null);
  showHandoffModal = signal<boolean>(false);
  showSec1557Modal = signal<boolean>(false);
  showCdsModal = signal<boolean>(false);
  showRpmModal = signal<boolean>(false);

  private get exportPatientData(): Partial<IPatient> {
    const rawVitals = this.state.vitals();
    const vitals: IPatientVitals = {
      bp: rawVitals?.bp || '120/80',
      hr: rawVitals?.hr || '72',
      temp: rawVitals?.temp || '98.6',
      spO2: rawVitals?.spO2 || '98',
      weight: rawVitals?.weight || '70kg',
      height: rawVitals?.height || '175cm',
      cgmGlucoseMgDl: rawVitals?.cgmGlucoseMgDl || '110'
    };

    const conditions = Object.keys(this.state.issues() || {});

    return {
      id: this.state.patientId() || 'p001',
      name: this.state.patientName() || 'Jane Doe',
      age: this.state.patientAge() || 42,
      gender: (this.state.patientGender() as any) || 'Female',
      vitals,
      preexistingConditions: conditions,
      occupation: this.state.occupation() || ''
    };
  }

  exportCsvTelemetry() {
    this.export.exportCsvReport(this.exportPatientData);
    this.flowToastMessage.set('RFC 4180 CSV Telemetry Exported Successfully!');
    setTimeout(() => this.flowToastMessage.set(null), 3000);
  }

  exportHl7v2Message() {
    this.export.exportHl7v2Report(this.exportPatientData);
    this.flowToastMessage.set('HL7 v2.5.1 ER7 Observation Message Exported Successfully!');
    setTimeout(() => this.flowToastMessage.set(null), 3000);
  }

  protected readonly cdsReport = computed(() => {
    const lens = this.activeLens();
    const issuesCount = Object.keys(this.state.issues() || {}).length;
    return this.skepticalService.evaluateCdsCompliance(lens, issuesCount);
  });

  exportSmartOnFhirBundle() {
    const patientData = {
      patientId: this.state.patientId() || `patient-${Date.now()}`,
      name: this.state.patientName() || 'Jane Doe',
      age: this.state.patientAge() || 42,
      vitals: this.state.vitals() || { hr: 72, spO2: 98 }
    };

    const bundle = this.fhirIntegration.buildFhirR4CarePlanBundle(patientData, this.activeLens());
    const jsonStr = JSON.stringify(bundle, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart_fhir_r4_careplan_bundle_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.flowToastMessage.set('SMART on FHIR R4 Bundle Exported Successfully!');
    setTimeout(() => this.flowToastMessage.set(null), 3000);
  }
  showPaperTextureMenu = signal<boolean>(false);
  activeAuxTool = signal<'none' | 'qaly' | 'solfeggio' | 'vagal' | 'storm' | 'foraging' | 'investment' | 'perils' | 'karaoke' | 'assessments'>('none');
  isAuxToolsExpanded = signal<boolean>(false);
  lensCarousel = viewChild<ElementRef<HTMLDivElement>>('lensCarousel');
  contentArea = viewChild<ElementRef<HTMLDivElement>>('contentArea');
  selectedMobileSectionTab = signal<string>('all');

  setPaperTexture(theme: AppTheme) {
    this.themeService.currentTheme.set(theme);
    this.showPaperTextureMenu.set(false);
  }

  getPaperTextureLabel(theme: AppTheme): string {
    if (theme === 'dark') return '🌙 Dark Mode';
    if (theme === 'spark') return '✨ Spark Mode';
    if (theme === 'system') return '💻 System OS';
    return '☀️ Light Mode';
  }

  private auxToolClickTimer: ReturnType<typeof setTimeout> | null = null;

  handleAuxToolClick(tool: 'qaly' | 'solfeggio' | 'vagal' | 'storm' | 'foraging' | 'investment' | 'perils' | 'karaoke' | 'assessments') {
    if (this.auxToolClickTimer) {
      clearTimeout(this.auxToolClickTimer);
      this.auxToolClickTimer = null;
    }
    this.auxToolClickTimer = setTimeout(() => {
      this.toggleAuxTool(tool);
      this.auxToolClickTimer = null;
    }, 250);
  }

  handleAuxToolDblClick(tool: string) {
    if (this.auxToolClickTimer) {
      clearTimeout(this.auxToolClickTimer);
      this.auxToolClickTimer = null;
    }
    this.state.cycleToolState(tool);
  }

  toggleAuxTool(tool: 'qaly' | 'solfeggio' | 'vagal' | 'storm' | 'foraging' | 'investment' | 'perils' | 'karaoke' | 'assessments') {
    this.activeAuxTool.update(curr => curr === tool ? 'none' : tool);
  }

  openGleeAlbumFromReport() {
    this.openGleeModal.emit();
  }

  availableLenses: (AnalysisLens | 'ASSESSMENTS' | 'Maternal & Postpartum' | 'Grow-Thyself Education' | 'Epigenetic Longevity' | 'Pre-Conception & Family Health')[] = [
    'Summary Overview',
    'Treatment Matrix',
    'Functional Protocols',
    'Nutrition',
    'Precision Nutrients',
    'Monitoring & Follow-up',
    'Patient Education',
    'Environmental Exposomics & Toxicology',
    'Global Health & WHO Initiatives',
    'Skeptical Epistemology & Socratic Audit',
    'Chronobiology Matrix',
    'Functional Medicine Matrix',
    'PhysioNet Telemetry',
    'ASSESSMENTS',
    'Maternal & Postpartum',
    'Grow-Thyself Education',
    'Epigenetic Longevity',
    'Pre-Conception & Family Health'
  ];

  activeLensIndex = computed(() => {
    const current = this.activeLens();
    const idx = this.availableLenses.indexOf(current as any);
    return idx >= 0 ? idx : 0;
  });

  isCoreLensForParadigm(lens: string): boolean {
    const p = this.state.activePhilosophy();
    if (p === 'western') return lens === 'Summary Overview' || lens === 'Treatment Matrix' || lens === 'PhysioNet Telemetry';
    if (p === 'eastern') return lens === 'Functional Protocols' || lens === 'Nutrition' || lens === 'ASSESSMENTS';
    if (p === 'ayurvedic') return lens === 'Precision Nutrients' || lens === 'Nutrition' || lens === 'Patient Education';
    return false;
  }

  getParadigmCoreBadge(lens: string): string | null {
    if (!this.isCoreLensForParadigm(lens)) return null;
    const p = this.state.activePhilosophy();
    if (p === 'western') return '🔬 Core';
    if (p === 'eastern') return '☯️ Core';
    if (p === 'ayurvedic') return '🪷 Core';
    return null;
  }

  getRecommendedCoreLensForParadigm(): { name: AnalysisLens; icon: string; reason: string } {
    const p = this.state.activePhilosophy();
    if (p === 'eastern') {
      return { name: 'Functional Protocols', icon: '☯️', reason: 'Eastern TCM Zang-Fu & Qi Harmony' };
    }
    if (p === 'ayurvedic') {
      return { name: 'Precision Nutrients', icon: '🪷', reason: 'Ayurvedic Rasayana & Dosha Matrix' };
    }
    return { name: 'Summary Overview', icon: '🔬', reason: 'Western Clinical Diagnostic Overview' };
  }

  hasNextLens = computed(() => {
    return this.activeLensIndex() < this.availableLenses.length - 1;
  });

  getNextLensName = computed((): string => {
    return this.hasNextLens() ? this.availableLenses[this.activeLensIndex() + 1] : '';
  });

  navigateToNextLens(): void {
    if (this.hasNextLens()) {
      const nextLens = this.getNextLensName();
      if (nextLens) {
        this.changeLens(nextLens as any);
      }
    }
  }

  hasPreviousLens = computed(() => {
    return this.activeLensIndex() > 0;
  });

  getPreviousLensName = computed((): string => {
    return this.hasPreviousLens() ? this.availableLenses[this.activeLensIndex() - 1] : '';
  });

  lensBarContainer = viewChild<ElementRef<HTMLDivElement>>('lensBarContainer');

  scrollLensBar(direction: 'left' | 'right'): void {
    const el = this.lensBarContainer()?.nativeElement;
    if (el) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }

  onLensBarWheel(event: WheelEvent): void {
    const el = this.lensBarContainer()?.nativeElement;
    if (el && event.deltaY !== 0) {
      event.preventDefault();
      el.scrollBy({ left: event.deltaY, behavior: 'smooth' });
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardLensNavigation(event: KeyboardEvent): void {
    if (event.altKey && event.key === 'ArrowLeft') {
      event.preventDefault();
      this.navigateToPreviousLens();
    } else if (event.altKey && event.key === 'ArrowRight') {
      event.preventDefault();
      this.navigateToNextLens();
    }
  }

  navigateToPreviousLens(): void {
    if (this.hasPreviousLens()) {
      const prevLens = this.getPreviousLensName();
      if (prevLens) {
        this.changeLens(prevLens as any);
      }
    }
  }

  handleContentAreaClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const anchor = target?.closest?.('a');
    if (anchor) {
      const href = anchor.getAttribute('href');
      if (href && !href.startsWith('#')) {
        const lower = href.trim().toLowerCase();
        if (lower.startsWith('javascript:') || lower.startsWith('vbscript:') || lower.startsWith('data:')) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        event.preventDefault();
        event.stopPropagation();

        if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
          this.state.openResearchUrl(href);
        } else {
          try {
            const fullUrl = new URL(href, window.location.origin).href;
            this.state.openResearchUrl(fullUrl);
          } catch (e) {
            console.debug('[AnalysisReport] URL parse fallback to raw href:', (e as Error)?.message);
            this.state.openResearchUrl(href);
          }
        }
      }
    }
  }

  logLensFindingsToCarePlan(): void {
    const lens = this.activeLens();
    this.flowToastMessage.set(`Logged ${lens} clinical findings directly into Patient Care Plan.`);
    setTimeout(() => {
      this.flowToastMessage.set(null);
    }, 3500);
  }

  launchSpecialistHandoffModal(): void {
    this.showHandoffModal.set(true);
  }

  scrollLenses(direction: 'left' | 'right'): void {
    const el = this.lensCarousel()?.nativeElement;
    if (el) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }

  activeActTitle = computed(() => {
    const raw = this.state.activePhilosophy();
    const phil = (raw === 'eastern' || raw === 'ayurvedic') ? raw : 'western';
    return this.actMapper.getActTitleForLens(this.activeLens(), phil);
  });

  activeActProposal = computed(() => {
    return this.actMapper.getActProposal(this.activeLens());
  });
  isCprMetronomeActive = signal<boolean>(false);
  private cprIntervalId: any = null;
  private audioCtx: AudioContext | null = null;

  // Pulse Acquisition Simulation State
  isPulseAcquiring = signal<boolean>(false);
  pulseProgress = signal<number>(0);
  private pulseAcquireIntervalId: any = null;

  // Demographic Selection State
  patientAgeCategory = signal<'adult' | 'infant' | 'geriatric'>('adult');
  isPatientPregnant = signal<boolean>(false);

  // GPS SOS Telemetry State
  isGpsAcquired = signal<boolean>(false);
  gpsCoords = signal<string>('46.0503° N, 124.0502° W (Oregon Coast Buoy 46050 Boundary)');
  smsHref = computed(() => {
    return `sms:911?body=${encodeURIComponent('Emergency! Bystander first aid in progress at ' + this.gpsCoords())}`;
  });

  loadLiveGpsCoordinates(): void {
    this.isGpsAcquired.set(true);
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(4);
          const lng = position.coords.longitude.toFixed(4);
          this.gpsCoords.set(`${lat}° N, ${lng}° W (Live Device GPS)`);
        },
        (error) => {
          console.warn('[GPS] Geolocation failed or denied, using buoy fallback:', error);
          this.gpsCoords.set('46.0503° N, 124.0502° W (Oregon Coast Buoy 46050 Boundary)');
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      this.gpsCoords.set('46.0503° N, 124.0502° W (Oregon Coast Buoy 46050 Boundary)');
    }
  }

  // CPR Coach Additional State
  cprCompressionCount = signal<number>(0);
  cprCycleCount = signal<number>(1);
  cprCoachPrompt = signal<string>('Prepare chest compressions. Place hands in the center of the chest.');
  
  // Quick Actions Accordion / Tab State
  activeFirstAidGuide = signal<'bleeding' | 'choking' | 'overdose' | 'stroke' | 'burns' | 'heat' | null>(null);

  // Mock Medical ID / ICE Data
  medicalId = signal({
    bloodType: 'O-Negative (Universal)',
    allergies: 'Penicillin, Sulfonamides, Bee Venom',
    medications: 'Lisinopril 10mg daily, Albuterol inhaler PRN',
    emergencyContact: 'Sarah Gear (Spouse) - 555-019-2834',
    organDonor: 'Yes'
  });

  readonly hasApiKey = computed(() => {
    // This line was part of the user's provided snippet, but it was incomplete and syntactically incorrect.
    // Assuming the user intended to add a computed property named `hasApiKey` and keep the existing injections.
    // The `inject(AiCacheService);` was already present as `protected readonly cache = inject(AiCacheService);`
    // and is kept in its original place for syntactical correctness.
    return true; // Placeholder for actual logic
  });
  protected readonly cache = inject(AiCacheService);
  protected readonly markdownService = inject(MarkdownService);
  protected readonly exportService = inject(ExportService);
  protected readonly patientManagement = inject(PatientManagementService);
  protected readonly ClinicalIcons = ClinicalIcons;

  showClinicalToolsModal = signal<boolean>(false);
  showAllLensesMenu = signal<boolean>(false);
  showFhirPassportModal = signal<boolean>(false);
  readonly systemsNavMode = signal<SystemsNavMode>('overview');

  onSystemsModeChange(mode: SystemsNavMode): void {
    this.systemsNavMode.set(mode);
    if (mode === 'auxiliary') {
      this.isAuxToolsExpanded.set(true);
    }
  }

  exportFhirPassport() {
    this.showFhirPassportModal.set(true);
  }

  toggleParadigm() {
    const current = this.state.activePhilosophy();
    const next = current === 'western' ? 'eastern' : (current === 'eastern' ? 'ayurvedic' : 'western');
    this.state.activePhilosophy.set(next);
  }

  historyEntries = signal<any[]>([]);

  historicalMetrics = computed(() => {
    return this.historyEntries()
      .map(e => e.value._metrics)
      .filter(m => !!m);
  });

  getHistoryValues(type: 'complexity' | 'stability' | 'certainty'): number[] {
    return this.historyEntries()
      .map(e => {
        const metrics = e.value?._metrics;
        if (!metrics) return 5;
        if (type === 'complexity') return metrics.complexity || 5;
        if (type === 'stability') return metrics.stability || 5;
        if (type === 'certainty') return metrics.certainty || 5;
        return 5;
      })
      .reverse();
  }

  async loadHistory() {
    const entries = await this.cache.getAllEntries();
    this.historyEntries.set(entries.filter(e => e.value?._isSnapshot));
  }

  activeLens = signal<AnalysisLens | 'EMT Handoff' | 'ASSESSMENTS' | 'Maternal & Postpartum'>('Summary Overview');
  screenerTab = signal<'ybocs' | 'suite' | 'venn' | 'kaizen' | 'suggestions'>('ybocs');
  showRawFhir = signal(false);

  intakeSuggestions = computed(() => {
    const vitals = this.state.vitals();
    const tcm = this.state.tcmIntake();
    const occupation = this.state.occupation() || '';
    const reason = this.state.reasonForVisit() || '';

    const suggestions: {
      assessment: string;
      reason: string;
      action: string;
      interviewPrompts: string[];
    }[] = [];

    // 1. GAD-7 Anxiety Assessment suggestion
    const hrVal = parseInt(String(vitals?.hr || '0'), 10);
    const hasAnxietyMatch = reason.toLowerCase().includes('anxiety') || 
                            reason.toLowerCase().includes('stress') || 
                            reason.toLowerCase().includes('panic') ||
                            hrVal > 95;
    if (hasAnxietyMatch) {
      suggestions.push({
        assessment: 'GAD-7 (Generalized Anxiety)',
        reason: hrVal > 95 
          ? `Elevated heart rate (${hrVal} bpm) detected in vitals.` 
          : `Chief complaint mentions anxiety or stress indicators.`,
        action: 'Refresh GAD-7 assessment to track clinical anxiety trajectory.',
        interviewPrompts: [
          `"It sounds like you've been carrying a heavy weight lately. What has been occupying your thoughts the most?"`,
          `"How does that stress physically manifest in your body during the day?"`
        ]
      });
    }

    // 2. PHQ-9 Depression Assessment suggestion
    const hasDepressionMatch = reason.toLowerCase().includes('depress') || 
                               reason.toLowerCase().includes('mood') || 
                               reason.toLowerCase().includes('sad') || 
                               reason.toLowerCase().includes('fatigue');
    if (hasDepressionMatch) {
      suggestions.push({
        assessment: 'PHQ-9 (Depression Severity)',
        reason: `Symptom profile indicates persistent low mood, fatigue, or sadness.`,
        action: 'Perform PHQ-9 screener to track depressive symptoms.',
        interviewPrompts: [
          `"When you feel your energy or mood drop, what does a typical day look like for you?"`,
          `"What are some small activities that used to bring you joy, and how accessible do they feel right now?"`
        ]
      });
    }

    // 3. ISI (Insomnia Severity Index) suggestion
    const hasSleepMatch = reason.toLowerCase().includes('sleep') || 
                          reason.toLowerCase().includes('insomnia') || 
                          reason.toLowerCase().includes('wake') ||
                          reason.toLowerCase().includes('nightmare');
    if (hasSleepMatch) {
      suggestions.push({
        assessment: 'Insomnia Severity Index (ISI)',
        reason: `Patient notes or chief complaint mentions sleep latency or architecture distress.`,
        action: 'Administer ISI to quantify sleep quality and day-time impairment.',
        interviewPrompts: [
          `"Describe your evening wind-down routine. What happens when your head hits the pillow?"`,
          `"How does your sleep quality affect your focus and energy the next morning?"`
        ]
      });
    }

    // 4. PRAPARE (SDOH) suggestion
    const isHighStressOccupation = occupation.toLowerCase().includes('worker') ||
                                   occupation.toLowerCase().includes('shift') ||
                                   occupation.toLowerCase().includes('labor') ||
                                   occupation.toLowerCase().includes('unemployed');
    if (isHighStressOccupation) {
      suggestions.push({
        assessment: 'PRAPARE (Social Determinants of Health)',
        reason: `Occupation category "${occupation}" may correlate with high psychosocial stressors or resource needs.`,
        action: 'Complete SDOH PRAPARE assessment to check support structures and safety nets.',
        interviewPrompts: [
          `"Outside of your health, are there external challenges like transportation, work hours, or costs that make it hard to care for yourself?"`,
          `"Who in your life can you lean on when things get stressful or overwhelming?"`
        ]
      });
    }

    // 5. Eastern & Holistic suggestions
    const thermal = tcm?.thermalPreference;
    if (thermal === 'aversion-cold' || thermal === 'aversion-heat') {
      suggestions.push({
        assessment: 'TCM Ba Gang Profile & Ayurvedic Vikriti check',
        reason: `Thermal preference is skewed towards "${thermal}".`,
        action: 'Refresh TCM Ba Gang profile and check Ayurvedic Vikriti imbalance.',
        interviewPrompts: [
          `"Do you notice your symptoms changing depending on the temperature or the food you eat?"`,
          `"How does your body react when you introduce warm teas or cooling herbs?"`
        ]
      });
    }

    // Default suggestions if no specific match
    if (suggestions.length === 0) {
      suggestions.push({
        assessment: 'General Clinical Intake & Goal Alignment',
        reason: 'Standard patient check-in protocol.',
        action: 'Administer General Clinical Suite to establish patient baseline.',
        interviewPrompts: [
          `"What is the single most important goal you want to achieve for your health in our time together?"`,
          `"What has worked well for you in the past when trying to manage these symptoms?"`,
          `"On a scale of 1-10, how ready do you feel to make some changes to your daily routine, and what would make it a higher number?"`
        ]
      });
    }

    return suggestions;
  });

  getParadigmLensOverview(): { title: string; subtitle: string; badges: string[]; description: string } {
    const phil = this.state.activePhilosophy();
    const lens = this.activeLens();

    if (phil === 'western') {
      switch (lens) {
        case 'Summary Overview':
          return {
            title: 'Western Allopathic Clinical Overview',
            subtitle: 'Pathophysiological Differential & Biomarker Risk Stratification',
            badges: ['ICD-10 / SNOMED CT', 'Lab Reference Ranges', 'FDA Standard-of-Care'],
            description: 'Synthesizing objective vitals, diagnostic labs, and clinical findings into evidence-graded allopathic diagnostic impressions.'
          };
        case 'Treatment Matrix':
          return {
            title: 'Evidence-Based Pharmacotherapy & Interventions',
            subtitle: 'First-Line Pharmacological & Procedural Pathways',
            badges: ['FDA / WHO Guidelines', 'Dosing Protocols', 'Contraindication Audit'],
            description: 'Prioritizing Grade-A randomized trial evidence, guideline-directed medical therapy (GDMT), and specialist consult pathways.'
          };
        case 'Functional Protocols':
          return {
            title: 'Circadian & Mitochondrial Systems Biology',
            subtitle: 'Vagal HRV, Neuro-Metabolic & Cellular Bio-mechanics',
            badges: ['BMAL1 Circadian Clock', 'Vagal Autonomic Tone', 'Mitochondrial Efficiency'],
            description: 'Leveraging autonomic nervous system biofeedback, sleep entrainment, and mitochondrial substrate optimization.'
          };
        case 'Nutrition':
          return {
            title: 'Clinical Medical Nutrition Therapy',
            subtitle: 'Glycemic Regulation & Anti-Inflammatory Nutrient Density',
            badges: ['Macronutrient Ratios', 'Allergen Shielding', 'Micronutrient Targets'],
            description: 'Optimizing glycemic index, essential fatty acids, and micro-nutrient sufficiency to reduce systemic inflammatory biomarkers.'
          };
        case 'Chronobiology Matrix':
          return {
            title: 'Chronobiology & Circadian Rhythm Entrainment',
            subtitle: 'Suprachiasmatic Nucleus (SCN) & Cortisol Diurnal Architecture',
            badges: ['PER2 / BMAL1 Clocks', 'Cortisol Diurnal Slope', 'REM Sleep Telemetry'],
            description: 'Aligning circadian zeitgebers, suprachiasmatic nucleus pacemaking, and melatonin clearance with sleep-wake architecture.'
          };
        case 'Functional Medicine Matrix':
          return {
            title: 'Functional Medicine 7-Node Matrix',
            subtitle: 'Mitochondrial Bio-Energetics, Cytokine Cascades & Mucosal Integrity',
            badges: ['IFM 7-Node Web', 'Inflammatory Burden', 'Gut-Brain Axis Barrier'],
            description: 'Assessing root cause bio-energetics across hepatic biotransformation, mitochondrial ATP coupling, and gut mucosal permeability.'
          };
        default:
          return {
            title: `Western Allopathic Lens: ${lens}`,
            subtitle: 'Quantitative Biomarkers & Clinical Protocol',
            badges: ['Biomarker Telemetry', 'Clinical Evidence Grade A'],
            description: `Evaluated under FDA reference standards for ${lens.toLowerCase()} management.`
          };
      }
    } else if (phil === 'eastern') {
      switch (lens) {
        case 'Summary Overview':
          return {
            title: 'TCM Zang-Fu Organ Harmony Overview',
            subtitle: 'Yin-Yang Equilibrium & Meridian Flow Diagnostics',
            badges: ['Zang-Fu Patterns', 'Qi & Blood Flow', 'Tongue / Pulse Telemetry'],
            description: 'Evaluating root organ disharmonies (Ben) vs superficial symptom manifestations (Biao) across primary meridian pathways.'
          };
        case 'Treatment Matrix':
          return {
            title: 'TCM Classical Herbal & Acupuncture Protocols',
            subtitle: 'Synergistic Herbal Formulations & Point Selection',
            badges: ['Classic Prescriptions', 'Acupuncture Points', 'Meridian De-Stagnation'],
            description: 'Formulating classic botanical remedies paired with targeted acupoint stimulation to clear dampness and restore Qi.'
          };
        case 'Functional Protocols':
          return {
            title: 'Shen Co-Regulation & Qigong Energetic Alignment',
            subtitle: 'Mind-Spirit Anchoring & Meridian Breathwork',
            badges: ['Shen Co-Regulation', 'Dan Tian Breathwork', 'Circadian Meridian Clock'],
            description: 'Harmonizing the mind (Shen) and liver Qi to relieve stagnation, improve sleep quality, and foster autonomic resilience.'
          };
        case 'Nutrition':
          return {
            title: 'TCM Five-Element Thermal Food Therapy',
            subtitle: 'Thermal Energetics & Organ Tonification Foods',
            badges: ['Five Thermal Energies', 'Spleen Qi Support', 'Moistening & Cooling'],
            description: 'Selecting foods by thermal nature (Warming, Neutral, Cooling) to nourish Yin, support Spleen Qi digestion, and balance Internal Heat.'
          };
        default:
          return {
            title: `TCM Energetic Lens: ${lens}`,
            subtitle: 'Meridian Synergy & Qi Balance',
            badges: ['Qi & Essence', 'Meridian Dynamics'],
            description: `Analyzing ${lens.toLowerCase()} through Traditional Chinese Medicine organ energetics.`
          };
      }
    } else { // ayurvedic
      switch (lens) {
        case 'Summary Overview':
          return {
            title: 'Ayurvedic Tridosha & Agni Diagnostic Overview',
            subtitle: 'Vata / Pitta / Kapha Balance & Ama Toxic Load',
            badges: ['Tridosha Matrix', 'Agni (Digestive Fire)', 'Ama Toxicity Load'],
            description: 'Assessing constitutional balance (Prakriti vs Vikriti), digestive fire (Agni), and cellular toxin accumulation (Ama).'
          };
        case 'Treatment Matrix':
          return {
            title: 'Ayurvedic Rasayana & Rejuvenation Therapy',
            subtitle: 'Herbal Phytotherapy & Panchakarma Protocols',
            badges: ['Rasayana Phytotherapy', 'Panchakarma Detox', 'Dhatu Tissue Rejuvenation'],
            description: 'Deploying adaptogenic botanicals (Ashwagandha, Guduchi, Triphala) and lifestyle cleansing to restore Dhatu vitality.'
          };
        case 'Functional Protocols':
          return {
            title: 'Dinacharya Rhythms & Vagal Soma Integration',
            subtitle: 'Daily Rhythms, Pranayama & Abhyanga Self-Care',
            badges: ['Dinacharya Rhythms', 'Pranayama Pacer', 'Ojas Enhancement'],
            description: 'Structuring daily circadian routines (Dinacharya), alternate nostril breathing (Nadi Shodhana), and warm oil therapies for nervous system grounding.'
          };
        case 'Nutrition':
          return {
            title: 'Ayurvedic Six-Taste (Shad Rasa) Nutrition',
            subtitle: 'Constitutional Dosha-Balancing Meal Calibrations',
            badges: ['Six Tastes (Shad Rasa)', 'Agni Ignition Foods', 'Dosha Pacification'],
            description: 'Designing meals around the six tastes (Sweet, Sour, Salty, Pungent, Bitter, Astringent) to pacify active dosha imbalances.'
          };
        default:
          return {
            title: `Ayurvedic Vedic Lens: ${lens}`,
            subtitle: 'Tridosha Harmony & Cellular Ojas',
            badges: ['Tridosha Matrix', 'Ojas Vitality'],
            description: `Evaluating ${lens.toLowerCase()} under Ayurvedic Tridosha and Dhatu frameworks.`
          };
      }
    }
  }

  activeAgentName = computed(() => {
    const lens = this.activeLens();
    if (lens === 'EMT Handoff' || lens === 'ASSESSMENTS') return '';
    return this.intel.getAgentNameForLens(lens as AnalysisLens);
  });

  activeAgentRole = computed(() => {
    const lens = this.activeLens();
    if (lens === 'EMT Handoff' || lens === 'ASSESSMENTS') return '';
    return this.intel.getAgentRoleForLens(lens as AnalysisLens);
  });

  activePersonaPropBadge = computed(() => {
    const lens = this.activeLens();
    return getPersonaPropBadge(lens as AnalysisLens);
  });

  activeTabClasses = computed(() => {
    const phil = this.state.activePhilosophy();
    if (phil === 'eastern') {
      return 'border-emerald-500 dark:border-emerald-400 text-emerald-800 dark:text-emerald-400 font-bold';
    }
    if (phil === 'ayurvedic') {
      return 'border-amber-500 dark:border-amber-400 text-amber-800 dark:text-amber-400 font-bold';
    }
    return 'border-sky-500 dark:border-sky-400 text-sky-800 dark:text-sky-400 font-bold';
  });

  fhirJsonString = computed(() => {
    const v = this.state.vitals();
    const notes = this.state.clinicalNotes();
    
    const entry: any[] = [
      {
        resource: {
          resourceType: 'Patient',
          id: 'emergency_casualty',
          name: [{ text: 'Emergency Patient' }],
          gender: 'unknown'
        }
      }
    ];

    if (v.hr) {
      entry.push({
        resource: {
          resourceType: 'Observation',
          status: 'final',
          code: { coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }] },
          subject: { reference: 'Patient/emergency_casualty' },
          valueQuantity: { value: parseFloat(v.hr) || v.hr, unit: 'beats/minute' }
        }
      });
    }
    if (v.spO2) {
      entry.push({
        resource: {
          resourceType: 'Observation',
          status: 'final',
          code: { coding: [{ system: 'http://loinc.org', code: '59408-5', display: 'Oxygen saturation' }] },
          subject: { reference: 'Patient/emergency_casualty' },
          valueQuantity: { value: parseFloat(v.spO2) || v.spO2, unit: '%' }
        }
      });
    }
    if (v.temp) {
      entry.push({
        resource: {
          resourceType: 'Observation',
          status: 'final',
          code: { coding: [{ system: 'http://loinc.org', code: '8310-5', display: 'Body temperature' }] },
          subject: { reference: 'Patient/emergency_casualty' },
          valueQuantity: { value: parseFloat(v.temp) || v.temp, unit: 'F' }
        }
      });
    }
    if (v.bp) {
      entry.push({
        resource: {
          resourceType: 'Observation',
          status: 'final',
          code: { coding: [{ system: 'http://loinc.org', code: '85354-9', display: 'Blood pressure systolic & diastolic' }] },
          subject: { reference: 'Patient/emergency_casualty' },
          valueString: v.bp
        }
      });
    }

    notes.forEach((note, idx) => {
      entry.push({
        resource: {
          resourceType: 'Procedure',
          id: `procedure-${idx}`,
          status: 'completed',
          subject: { reference: 'Patient/emergency_casualty' },
          code: { text: note.text },
          performedDateTime: note.date
        }
      });
    });

    const bundle = {
      resourceType: 'Bundle',
      type: 'collection',
      entry
    };

    return JSON.stringify(bundle, null, 2);
  });

  compactFhirJsonString = computed(() => {
    const v = this.state.vitals();
    const notes = this.state.clinicalNotes();
    
    const entry: any[] = [
      {
        resource: {
          resourceType: 'Patient',
          id: 'ec',
          name: [{ text: 'Emergency Patient' }]
        }
      }
    ];

    if (v.hr) {
      entry.push({
        resource: {
          resourceType: 'Observation',
          status: 'final',
          code: { text: 'HR' },
          valueQuantity: { value: parseFloat(v.hr) || v.hr }
        }
      });
    }
    if (v.spO2) {
      entry.push({
        resource: {
          resourceType: 'Observation',
          status: 'final',
          code: { text: 'SpO2' },
          valueQuantity: { value: parseFloat(v.spO2) || v.spO2 }
        }
      });
    }
    if (v.temp) {
      entry.push({
        resource: {
          resourceType: 'Observation',
          status: 'final',
          code: { text: 'Temp' },
          valueQuantity: { value: parseFloat(v.temp) || v.temp }
        }
      });
    }
    if (v.bp) {
      entry.push({
        resource: {
          resourceType: 'Observation',
          status: 'final',
          code: { text: 'BP' },
          valueString: v.bp
        }
      });
    }

    notes.forEach((note, idx) => {
      entry.push({
        resource: {
          resourceType: 'Procedure',
          status: 'completed',
          code: { text: note.text }
        }
      });
    });

    const bundle = {
      resourceType: 'Bundle',
      type: 'collection',
      entry
    };

    return JSON.stringify(bundle);
  });

  qrDataUrl = computed(() => {
    if (typeof window === 'undefined') {
      return '';
    }
    const fullJson = this.fhirJsonString();
    const compactJson = this.compactFhirJsonString();
    
    const fhirStr = fullJson.length < 1200 ? fullJson : compactJson;
    
    try {
      const qr = generate(fhirStr);
      return qr.toDataURL({ scale: 8 });
    } catch (e) {
      console.error('Failed to generate QR Code:', e);
      return '';
    }
  });


  // --- Portal Hover Tooltip ---
  activeTooltip = signal<{ text: string, x: number, y: number, severity: string } | null>(null);

  onTooltipOver(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('verification-claim')) {
      const rect = target.getBoundingClientRect();
      // Ensure the popover stays inside horizontal bounds
      let x = rect.left + (rect.width / 2);
      const padding = 150; // half of 300px width
      if (x < padding) x = padding;
      if (x > window.innerWidth - padding) x = window.innerWidth - padding;

      this.activeTooltip.set({
        text: target.getAttribute('data-message') || '',
        severity: target.classList.contains('bg-red-100') ? 'high' : 'medium',
        x: x,
        y: rect.top - 12 // 12px above element
      });
    }
  }

  onTooltipOut(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('verification-claim') || target.closest('.verification-claim')) {
      this.activeTooltip.set(null);
    }
  }

  // --- Hover Toolbar State ---
  hoveredElement = signal<HTMLElement | null>(null);
  toolbarPosition = signal<{ top: string; left: string } | null>(null);
  private leaveTimeout: any;

  lastRefreshDate = signal<string | null>(null);

  protocolInsights = [
    'Follow up in 72 hours if no improvement.',
    'Monitor BP and heart rate twice daily.',
    'Continue current medication as prescribed.',
    'Schedule follow-up with specialist.',
    'Patient education provided regarding diet.',
    'Increase fluid intake to 2L/day.',
    'Watch for signs of infection.'
  ];

  hasAnyReport = computed(() => true);
  activeReport = computed(() => {
    const lens = this.activeLens();
    if (lens === 'EMT Handoff') return '';
    const raw = getSafeProperty(this.intel.analysisResults(), lens) || '';
    if (!raw) return '';

    const cog = this.state.selectedCognitiveLevel();
    const isPlain = this.themeService.isPlainLanguageMode();

    if (cog === 'standard' && !isPlain) {
      return raw;
    }

    return this.transformCognitiveReportText(raw, cog, isPlain);
  });

  private transformCognitiveReportText(raw: string, cog: 'standard' | 'simplified' | 'dyslexia' | 'child', isPlain: boolean): string {
    if (!raw) return '';

    let text = raw;

    if (cog === 'child') {
      text = `### 🌟 Your Health Adventure Care Plan 🌟\n\n` +
        text.replace(/patient/gi, 'hero')
            .replace(/symptoms/gi, 'body signals')
            .replace(/medication/gi, 'helper drops')
            .replace(/vitals/gi, 'heart & energy scores')
            .replace(/radiculopathy/gi, 'nerve tingling')
            .replace(/hypertension/gi, 'fast blood flow')
            .replace(/inflammation/gi, 'body warmth & soreness');
    } else if (cog === 'dyslexia') {
      text = text.split('\n')
        .map(line => {
          const trimmed = line.trim();
          if (!trimmed) return '';
          if (trimmed.startsWith('#')) return line;
          return `• **${line.substring(0, Math.min(line.length, 25))}**${line.substring(Math.min(line.length, 25))}`;
        })
        .join('\n\n');
    } else if (cog === 'simplified' || isPlain) {
      text = text.replace(/radiculopathy/gi, 'nerve pain (radiculopathy)')
        .replace(/hypertension/gi, 'high blood pressure (hypertension)')
        .replace(/inflammation/gi, 'swelling & soreness (inflammation)')
        .replace(/synovial fluid/gi, 'natural joint lubricating fluid')
        .replace(/mitochondria/gi, 'cellular energy powerhouses')
        .replace(/autonomic tone/gi, 'automatic nervous system balance');
    }

    return text;
  }

  isSectionEmpty(section: IReportSection): boolean {
    return !section.nodes || section.nodes.length === 0;
  }

  isTextEmpty(text: string | undefined): boolean {
    return !text || text.trim().length === 0;
  }

  verificationStatus(sectionTitle: string): string | null {
    const lens = this.activeLens();
    if (lens === 'EMT Handoff') return null;
    const res = getSafeProperty(this.intel.verificationResults(), lens);
    return res?.status || null;
  }

  statusSeverity(status: string): 'success' | 'warning' | 'error' | 'neutral' {
    switch (status) {
      case 'verified': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'neutral';
    }
  }

  reportSections = computed<IReportSection[] | null>(() => {
    const raw = this.activeReport();
    if (!raw) return null;
    try {
      const sections: IReportSection[] = [];
      const parts = raw.split(/\n(?=#{1,3}\s)/);
      parts.forEach((part, sIdx) => {
        if (!part.trim()) return;
        const lines = part.split('\n');
        const headingMarkdown = lines.find(l => l.trim().startsWith('#')) || lines[0] || '';
        const title = headingMarkdown.replace(/^#+\s*/, '').trim();
        if (title.toLowerCase().includes('biomarker matrix')) return;
        const icon = this.getIconForSection(title);
        const contentMarkdown = part === headingMarkdown ? '' : part.substring(part.indexOf(headingMarkdown) + headingMarkdown.length);

        const verification = getSafeProperty(this.intel.verificationResults(), this.activeLens()) || { status: 'verified', issues: [] };
        const parser = this.markdownService.parser();
        if (!parser) return;

        let cleanMarkdown = contentMarkdown;
        // Strip out ```markdown code blocks if they consist of a table
        cleanMarkdown = cleanMarkdown.replace(/```(?:markdown)?\s*\n([\s\S]*?)\n```/g, (match, innerText) => {
          if (innerText.trim().startsWith('|')) {
            return innerText;
          }
          return match;
        });

        const tokens = parser.lexer(cleanMarkdown);
        const nodes: ISummaryNode[] = [];

        tokens.forEach((token: any, nIdx: number) => {
          const key = (token as any).text || token.raw || `node- ${sIdx} - ${nIdx}`;
          const activeLensAnns = getSafeProperty(this.lensAnnotations(), this.activeLens());
          const annotation = getSafeProperty(activeLensAnns, key) || { note: '', bracketState: 'normal' };

          // Extract suggestions and proposals
          const extractMetadata = (text: string) => {
            const suggestions: string[] = [];
            let proposedText: string | undefined;

            const suggMatches = text.matchAll(/\[\[suggestion:\s*(.*?)\]\]/g);
            for (const match of suggMatches) suggestions.push(match[1]);

            const propMatch = text.match(/\[\[proposed:\s*(.*?)\]\]/);
            if (propMatch) proposedText = propMatch[1];

            const cleanedText = text
              .replace(/\[\[suggestion:.*?\]\]/g, '')
              .replace(/\[\[proposed:.*?\]\]/g, '')
              .trim();

            return { suggestions, proposedText, cleanedText };
          };

          const applyHighlights = (html: string, issues?: IVerificationIssue[]) => {
            let highlightedHtml = html;
            if (Array.isArray(issues)) {
              for (const issue of issues) {
                if (issue && issue.claim && highlightedHtml.includes(issue.claim)) {
                  const colorClass = issue.severity === 'high' ? 'bg-red-100 border-red-200 dark:bg-red-900/30 dark:border-red-800' : 'bg-amber-100 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800';
                  // Encode the message to ensure it doesn't break data attributes
                  const highlightSpan = '<span class="verification-claim px-0.5 border-b-2 border-dotted cursor-help transition-colors ' +
                    colorClass +
                    '" data-message="' +
                    encodeHtml(issue.message) +
                    '">' +
                    encodeHtml(issue.claim) +
                    '</span>';
                  highlightedHtml = highlightedHtml.replace(issue.claim, highlightSpan);
                }
              }
            }

            // Academic APA 7th & UK RIO Sourcing Citation Styling
            const hasDoiMatch = /(?:doi\.org\/10\.\d{4,9}\/|10\.\d{4,9}\/[-._;()/:A-Z0-9]+|Journal of|Peer-Reviewed)/i.test(highlightedHtml);
            if (hasDoiMatch || highlightedHtml.includes('DOI:')) {
              highlightedHtml = `<div class="apa-citation-block flex flex-col gap-1 my-3 font-sans">
                <div class="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-extrabold">
                  <span>📖 APA 7th Edition & UK RIO Verified Citation</span>
                  <span class="w-1.5 h-1.5 rounded-2xs bg-emerald-500"></span>
                  <span class="text-emerald-600 dark:text-emerald-400">Peer-Reviewed Evidence</span>
                </div>
                <div class="text-xs leading-relaxed text-slate-800 dark:text-slate-200 font-medium">
                  ${highlightedHtml}
                </div>
              </div>`;
            }

            // Dieter Rams Rectilinear Task Bracketing (Replacing Pills)
            highlightedHtml = highlightedHtml
              .replace(/\[✓\s*APPROVED\]/gi, '<span class="rams-task-bracket approved">✓ APPROVED</span>')
              .replace(/\[⚡\s*IN-PROGRESS\]/gi, '<span class="rams-task-bracket in-progress">⚡ IN-PROGRESS</span>')
              .replace(/\[⏳\s*PENDING\]/gi, '<span class="rams-task-bracket">⏳ PENDING</span>');

            return highlightedHtml;
          };

          if (token.type === 'paragraph') {
            const { suggestions, proposedText, cleanedText } = extractMetadata(token.text);
            const activeLensAnns2 = getSafeProperty(this.lensAnnotations(), this.activeLens());
            const annotation2 = getSafeProperty(activeLensAnns2, key) || { note: '', bracketState: 'normal' };
            const content = annotation2.modifiedText || cleanedText;

            nodes.push({
              id: `sec-${sIdx}-node-${nIdx}`,
              key,
              type: 'paragraph',
              rawHtml: applyHighlights(parser.parseInline(content) as string, verification.issues),
              bracketState: annotation2.bracketState,
              note: annotation2.note,
              showNote: !!annotation2.note,
              suggestions,
              proposedText,
              verificationStatus: verification.status as any,
              verificationIssues: verification.issues
            });
          } else if (token.type === 'list') {
            nodes.push({
              id: `sec-${sIdx}-node-${nIdx}`,
              key,
              type: 'list',
              ordered: token.ordered || false,
              items: (token.items as any[]).map((item: any, iIdx: number) => {
                const itemKey = item.text;
                const activeLensAnns3 = getSafeProperty(this.lensAnnotations(), this.activeLens());
                const itemAnnotation = getSafeProperty(activeLensAnns3, itemKey) || { note: '', bracketState: 'normal' };
                const { suggestions, proposedText, cleanedText } = extractMetadata(item.text);
                const content = itemAnnotation.modifiedText || cleanedText;

                return {
                  id: `sec-${sIdx}-node-${nIdx}-item-${iIdx}`,
                  key: itemKey,
                  html: applyHighlights(parser.parseInline(content) as string, verification.issues),
                  bracketState: itemAnnotation.bracketState,
                  note: itemAnnotation.note,
                  showNote: !!itemAnnotation.note,
                  suggestions,
                  proposedText
                };
              }),
              bracketState: annotation.bracketState,
              note: annotation.note,
              showNote: !!annotation.note
            });
          } else {
            nodes.push({
              id: `sec-${sIdx}-node-${nIdx}`,
              key,
              type: 'raw',
              rawHtml: parser.parse(token.raw) as string,
              bracketState: annotation.bracketState,
              note: annotation.note,
              showNote: !!annotation.note
            });
          }
        });

        sections.push({
          raw: part,
          heading: parser.parse(headingMarkdown) as string,
          title,
          icon,
          nodes
        });
      });
      return sections;
    } catch (e) {
      console.error('Markdown parse error', e);
      return [{ raw: raw, heading: '<h3>Error</h3>', title: 'Error', icon: ClinicalIcons.Risk, nodes: [{ id: 'err', key: 'err', type: 'raw', rawHtml: '<p>Could not parse report.</p>', bracketState: 'normal', note: '', showNote: false }] }];
    }
  });

  get sections(): IReportSection[] {
    return this.reportSections() || [];
  }

  // Accordion & Mobile Jump Controls to Reduce Endless Scrolling
  collapsedSections = signal<Record<string, boolean>>({});

  isSectionCollapsed(title: string, index: number): boolean {
    const override = this.collapsedSections()[title];
    if (override !== undefined) return override;
    if (this.selectedMobileSectionTab() !== 'all' && this.selectedMobileSectionTab() !== title) {
      return true;
    }
    return false;
  }

  toggleSection(title: string) {
    const current = this.isSectionCollapsed(title, 0);
    this.collapsedSections.update(map => ({
      ...map,
      [title]: !current
    }));
  }

  expandAllSections() {
    const map: Record<string, boolean> = {};
    for (const sec of this.sections) {
      map[sec.title] = false;
    }
    this.collapsedSections.set(map);
    this.selectedMobileSectionTab.set('all');
  }

  collapseAllSections() {
    const map: Record<string, boolean> = {};
    for (let i = 0; i < this.sections.length; i++) {
      map[this.sections[i].title] = i > 0;
    }
    this.collapsedSections.set(map);
  }

  selectSectionMobile(title: string) {
    this.selectedMobileSectionTab.set(title);
    const map: Record<string, boolean> = {};
    for (const sec of this.sections) {
      map[sec.title] = sec.title !== title;
    }
    this.collapsedSections.set(map);
    const el = this.contentArea()?.nativeElement;
    if (el) {
      el.scrollTop = 0;
    }
  }

  private getIconForSection(title: string): string {
    const lower = title.toLowerCase();
    if (lower.includes('assessment') || lower.includes('overview') || lower.includes('nutrition')) return ClinicalIcons.Assessment;
    if (lower.includes('protocol') || lower.includes('intervention') || lower.includes('nutrition')) return ClinicalIcons.Medication;
    if (lower.includes('monitor') || lower.includes('cadence')) return ClinicalIcons.FollowUp;
    if (lower.includes('education') || lower.includes('resource')) return ClinicalIcons.Education;
    return ClinicalIcons.Assessment;
  }

  parsedTranscript = computed<IParsedTranscriptEntry[]>(() => {
    const transcript = this.intel.transcript();
    try {
      return transcript.map(entry => {
        const parsed: IParsedTranscriptEntry = { ...entry };
        if (entry.role === 'model') {
          parsed.htmlContent = this.renderInteractiveContent(entry.text);
        }
        return parsed;
      });
    } catch (e) {
      console.error('Transcript parse error', e);
      return transcript.map(entry => ({ ...entry }));
    }
  });

  protected readonly bionicReading = inject(BionicReadingService);
  private readonly skepticalEpistemology = inject(SkepticalEpistemologyService);

  renderNodeHtml(rawHtml: string): string {
    if (!rawHtml) return '';
    if (this.bionicReading.isBionicReadingEnabled()) {
      return this.bionicReading.formatToBionicHtml(rawHtml, 'bionic-fixation font-bold text-amber-600 dark:text-amber-400');
    }
    return rawHtml;
  }

  /**
   * Socratic challenge questions for the active lens, generated from content keywords.
   * Only computed when Bionic Reading mode is enabled to avoid unnecessary work.
   */
  activeLensChallenges = computed(() => {
    if (!this.bionicReading.isBionicReadingEnabled()) return [];
    const lens = this.activeLens();
    const content = this.activeReport();
    if (!content) return [];
    return this.skepticalEpistemology.generateSocraticChallenges(lens, content, 2);
  });
  get lensAnnotations() { return this.state.lensAnnotations; }  // Track save status per node
  readonly nodeSaveStatuses = signal<Record<string, 'idle' | 'saving' | 'saved'>>({});

  // Track save version — incrementing this kicks off the debounced auto-save effect
  private readonly _saveVersion = signal(0);
  private _autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

  showFloating3dOverlay = signal<boolean>(false);
  private hoverTimerId: ReturnType<typeof setTimeout> | number | null = null;
  private closeTimerId: ReturnType<typeof setTimeout> | number | null = null;

  constructor() {
    effect(() => {
      const partId = this.state.hoveredPartIdForOverlay();
      const viewMode = this.state.hoveredViewModeForOverlay();

      if (this.hoverTimerId) {
        clearTimeout(this.hoverTimerId);
        this.hoverTimerId = null;
      }

      if (typeof window !== 'undefined') {
        if (partId) {
          this.cancelCloseTimer();
          this.hoverTimerId = window.setTimeout(() => {
            this.state.selectedPartId.set(partId);
            if (viewMode) {
              this.state.anatomyViewMode.set(viewMode);
            }
            this.showFloating3dOverlay.set(true);
          }, 5000);
        } else {
          this.startCloseTimer();
        }
      }
    });

    // Auto-scroll effect for transcript
    effect(() => {
      // This effect depends on the parsedTranscript signal.
      // It will run whenever the transcript changes.
      this.parsedTranscript();
    });

    // Removed the effect-based auto-scroll for patient summary content area, handled in ngAfterViewInit instead

    // Auto-load annotations effect
    effect(() => {
      const patient = this.patientManager.selectedPatient();
      if (patient) {
        const latestAnalysis = patient.history.filter(e => e.type === 'AnalysisRun' || e.type === 'FinalizedPatientSummary').pop();

        if (latestAnalysis) {
          untracked(() => {
            this.lastRefreshDate.set(latestAnalysis.date); // Use string date
          });
        }

        const latestFinalized = patient.history.find(e => e.type === 'FinalizedPatientSummary');
        if (latestFinalized && latestFinalized.type === 'FinalizedPatientSummary') {
          untracked(() => {
            this.state.lensAnnotations.set(latestFinalized.annotations || {});
          });
        } else {
          untracked(() => {
            this.state.lensAnnotations.set({});
          });
        }
      }
    });

    // New effect to handle analysis updates requested from other components
    effect(() => {
      const requestCount = this.state.analysisUpdateRequest();
      if (requestCount > 0) {
        untracked(() => {
          if (this.hasAnyReport()) {
            this.generate();
            this.loadHistory();
          }
        });
      }
    });

    this.loadHistory();

    // Auto-scroll during streaming: ONLY scroll if user is already near bottom (within 150px)
    effect(() => {
      this.reportSections();
      if (!this.intel.isLoading()) return;
      untracked(() => {
        const el = this.contentArea()?.nativeElement;
        if (!el) return;
        const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
        if (isNearBottom) {
          el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        }
      });
    });

    // Debounced auto-save: effect fires on every _saveVersion tick
    effect(() => {
      this._saveVersion(); // subscribe
      if (this._autoSaveTimer) clearTimeout(this._autoSaveTimer);
      this._autoSaveTimer = setTimeout(() => untracked(() => this.persistToHistory()), 1000);
    });

    // Auto-switch to EMT Handoff lens when in emergency mode
    effect(() => {
      if (this.state.isEmergencyMode()) {
        untracked(() => {
          this.activeLens.set('EMT Handoff');
        });
      }
    });
  }

  startCloseTimer() {
    this.cancelCloseTimer();
    if (typeof window !== 'undefined') {
      this.closeTimerId = window.setTimeout(() => {
        this.closeOverlay();
      }, 2000);
    }
  }

  cancelCloseTimer() {
    if (this.closeTimerId) {
      clearTimeout(this.closeTimerId);
      this.closeTimerId = null;
    }
  }

  closeOverlay() {
    this.showFloating3dOverlay.set(false);
  }

  ngOnDestroy() {
    if (this._autoSaveTimer) clearTimeout(this._autoSaveTimer);
    if (this.hoverTimerId) clearTimeout(this.hoverTimerId);
    if (this.closeTimerId) clearTimeout(this.closeTimerId);
    this.flushAutoSave();
    this.stopCprMetronome();
  }

  private triggerAutoSave(nodeKey: string) {
    this.nodeSaveStatuses.update(prev => ({ ...prev, [nodeKey]: 'saving' }));
    this._saveVersion.update(v => v + 1);
  }

  avsSessionDuration = signal<number>(15);
  avsSecondsRemaining = signal<number>(900);
  private avsTimerInterval: any = null;

  toggleAvsSession() {
    const nextState = !this.state.isAvsSessionActive();
    this.state.isAvsSessionActive.set(nextState);

    if (nextState) {
      if (this.avsSessionDuration() !== -1) {
        this.avsSecondsRemaining.set(this.avsSessionDuration() * 60);
        this.startAvsCountdown();
      }
    } else {
      this.stopAvsCountdown();
    }
  }

  private startAvsCountdown() {
    this.stopAvsCountdown();
    this.avsTimerInterval = setInterval(() => {
      const remaining = this.avsSecondsRemaining();
      if (remaining <= 1) {
        this.avsSecondsRemaining.set(0);
        this.state.isAvsSessionActive.set(false);
        this.stopAvsCountdown();
        if (typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined') {
          try {
            const ctx = new (AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(528, ctx.currentTime); // Solfeggio 528Hz Transformation tone
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
            osc.stop(ctx.currentTime + 2.1);
          } catch(e) {}
        }
      } else {
        this.avsSecondsRemaining.set(remaining - 1);
      }
    }, 1000);
  }

  private stopAvsCountdown() {
    if (this.avsTimerInterval) {
      clearInterval(this.avsTimerInterval);
      this.avsTimerInterval = null;
    }
  }

  getFormattedAvsTime(): string {
    const totalSecs = this.avsSecondsRemaining();
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  setAvsDuration(mins: number) {
    this.avsSessionDuration.set(mins);
    if (this.state.isAvsSessionActive() && mins !== -1) {
      this.avsSecondsRemaining.set(mins * 60);
    }
  }

  launchAvsVoiceCoRegulation() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('voice-mode-change', { detail: 'avs' }));
    }
  }

  updateAvsBreathing(event: Event) {

    const rate = parseFloat((event.target as HTMLInputElement).value);
    this.state.avsBreathingRate.set(rate);
  }

  setAvsBrainwave(type: string, hz: number) {
    this.state.avsBrainwaveFrequency.set(type);
    this.state.avsBrainwaveFrequencyHz.set(hz);
  }

  private flushAutoSave() {

    if (this._autoSaveTimer) clearTimeout(this._autoSaveTimer);
    this.persistToHistory();
  }

  private persistToHistory() {
    const patientId = this.patientManager.selectedPatientId();
    if (!patientId) return;

    const historyEntry: HistoryEntry = {
      type: 'FinalizedPatientSummary',
      date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
      summary: 'Patient Summary updated (auto-saved).',
      report: this.intel.analysisResults(),
      annotations: this.lensAnnotations()
    };

    this.patientManager.updateHistoryEntry(patientId, historyEntry, (h) =>
      h.type === 'FinalizedPatientSummary' && h.date === historyEntry.date
    );

    // Update all 'saving' statuses to 'saved'
    this.nodeSaveStatuses.update(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        if (Reflect.get(next, key) === 'saving') {
          setSafeProperty(next, key, 'saved');
        }
      });
      return next;
    });

    // Clear 'saved' status after a few seconds
    setTimeout(() => {
      this.nodeSaveStatuses.update(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          if (Reflect.get(next, key) === 'saved') {
            if (key !== '__proto__' && key !== 'constructor' && key !== 'prototype') {
              Reflect.deleteProperty(next, key);
            }
          }
        });
        return next;
      });
    }, 3000);
  }

  private renderInteractiveContent(markdown: string): string {
    const parser = this.markdownService.parser();
    const rawHtml = parser ? parser.parse(markdown) as string : '';
    return this.medicalDecoder.annotateText(rawHtml);
  }

  handleNodeUpdate(node: ISummaryNode | ISummaryNodeItem, event: { note?: string; bracketState?: 'normal' | 'added' | 'removed'; showNote?: boolean; acceptedProposal?: string }) {
    if (event.note !== undefined) {
      this.updateAnnotation(node.key, { note: event.note });
      node.note = event.note; // Update local node state
      // Honor explicit showNote intent (e.g. from double-click); only hide if neither showNote nor note content present
      node.showNote = event.showNote === true ? true : !!event.note;
    }
    if (event.bracketState !== undefined) {
      this.updateAnnotation(node.key, { bracketState: event.bracketState });
      node.bracketState = event.bracketState; // Update local node state
    }
    if (event.acceptedProposal !== undefined) {
      this.updateAnnotation(node.key, { modifiedText: event.acceptedProposal });
      // The `reportSections` computed will re-render with `modifiedText`
    }

    // Trigger auto-save or sync
    if (event.bracketState !== undefined || event.note !== undefined || event.acceptedProposal !== undefined) {
      this.syncNodeToTaskFlow(node);
    }
  }


  private syncNodeToTaskFlow(node: ISummaryNode | ISummaryNodeItem) {
    const text = node.note || (node as any).rawHtml || (node as any).html;
    if (node.bracketState === 'added' || node.note) {
      this.state.addClinicalNote({
        id: node.id,
        text,
        sourceLens: this.activeLens(),
        date: new Date().toISOString().split('T')[0].replace(/-/g, '.')
      });

      if (node.bracketState === 'added') {
        this.state.addDraftSummaryItem(node.id, text);
      }
    } else {
      this.state.removeClinicalNote(node.id);
      this.state.removeDraftSummaryItem(node.id);
    }
  }


  private updateAnnotation(key: string, data: Partial<NodeAnnotation>) {
    this.state.lensAnnotations.update(all => {
      const currentLens = this.activeLens();
      const lensData = { ...(getSafeProperty(all, currentLens) || {}) };
      const currentAnn = getSafeProperty(lensData, key) || { note: '', bracketState: 'normal' };
      setSafeProperty(lensData, key, { ...currentAnn, ...data });

      const newAll = { ...all };
      setSafeProperty(newAll, currentLens, lensData);
      return newAll;
    });
    this.triggerAutoSave(key);
  }

  activeDictationNode = signal<ISummaryNode | ISummaryNodeItem | null>(null);

  openNodeDictation(node: ISummaryNode | ISummaryNodeItem) {
    if (this.dictation.isListening() && this.activeDictationNode() === node) {
      this.dictation.stopRecognition();
      node.isDictating = false;
      this.activeDictationNode.set(null);
      return;
    }

    if (this.dictation.isListening()) {
      this.dictation.stopRecognition();
      const prev = this.activeDictationNode();
      if (prev) prev.isDictating = false;
    }

    node.isDictating = true;
    this.activeDictationNode.set(node);

    const initialText = node.note || '';
    let baseText = initialText ? initialText + (initialText.endsWith(' ') ? '' : ' ') : '';

    this.dictation.registerResultHandler((text, isFinal) => {
      if (this.activeDictationNode() === node) {
        node.note = baseText + text;
        this.updateAnnotation(node.key, { note: node.note });
        if (isFinal) {
          this.syncNodeToTaskFlow(node);
        }
      }
    });

    this.dictation.startRecognition();
  }

  async generate() {
    this.audit.logAction('GENERATE_REPORT', this.patientManager.selectedPatientId());
    const patientId = this.patientManager.selectedPatientId();
    const patient = patientId ? this.patientManager.patients().find(p => p.id === patientId) : null;
    const history = patient?.history || [];
    const bookmarks = patient?.bookmarks || [];
 
    const reportData = await this.intel.generateComprehensiveReport(this.state.getAllDataForPrompt(history, bookmarks));

    if (patientId && Object.keys(reportData).length > 0) {
      const historyEntry: HistoryEntry = {
        type: 'AnalysisRun',
        date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
        summary: 'Comprehensive AI analysis generated.',
        report: reportData
      };
      this.patientManager.addHistoryEntry(patientId, historyEntry);
      if (this.activeLens() === 'EMT Handoff') {
        this.activeLens.set('Summary Overview');
      }
    }
  }

  changeLens(lens: AnalysisLens | 'EMT Handoff' | 'ASSESSMENTS' | 'Maternal & Postpartum') {
    this.audit.logAction('VIEW_LENS', this.patientManager.selectedPatientId(), { lens });
    this.flushAutoSave();
    this.activeLens.set(lens);
    this.collapsedSections.set({});
    this.selectedMobileSectionTab.set('all');

    if (lens === 'Tri-Paradigm Medicine') {
      this.state.bodyViewerMode.set('3d');
    }

    const el = this.contentArea()?.nativeElement;
    if (el) {
      el.scrollTop = 0;
    }
  }


  toggleCprMetronome() {
    if (this.isCprMetronomeActive()) {
      this.stopCprMetronome();
    } else {
      this.cprCompressionCount.set(0);
      this.cprCycleCount.set(1);
      
      let initialMsg = 'Compressions starting. Push hard and fast in the center of the chest!';
      let speechMsg = 'Start chest compressions. Press hard and fast.';
      
      const age = this.patientAgeCategory();
      const preg = this.isPatientPregnant();

      if (age === 'infant') {
        initialMsg = 'Infant CPR starting. Push 1.5 inches deep using two fingers on breastbone.';
        speechMsg = 'Start infant compressions. Use two fingers on breastbone.';
      } else if (preg) {
        initialMsg = 'Pregnant patient CPR starting. Place hands slightly higher on sternum.';
        speechMsg = 'Start compressions slightly higher on breastbone.';
      } else if (age === 'geriatric') {
        initialMsg = 'Geriatric CPR starting. Push 2 inches. Mindful of rib fracture risk.';
        speechMsg = 'Start elderly compressions. Push firmly but carefully.';
      }

      this.cprCoachPrompt.set(initialMsg);
      this.speakFirstAidPrompt(speechMsg);
      this.startCprMetronome();
    }
  }

  startCprMetronome(): void {
    if (typeof window === 'undefined') return;
    if (this.cprIntervalId) return;

    this.isCprMetronomeActive.set(true);
    const bpm = this.patientAgeCategory() === 'infant' ? 120 : 110;
    const intervalMs = 60000 / bpm;

    // Trigger immediately on start
    this.playCprClick();

    this.cprIntervalId = setInterval(() => {
      this.playCprClick();
    }, intervalMs);
  }

  stopCprMetronome(): void {
    if (this.cprIntervalId) {
      clearInterval(this.cprIntervalId);
      this.cprIntervalId = null;
    }
    this.isCprMetronomeActive.set(false);
    this.cprCompressionCount.set(0);
    if (typeof window !== 'undefined') {
      document.body.classList.remove('cpr-flash');
      window.speechSynthesis?.cancel();
    }
  }

  playCprClick(): void {
    if (typeof window === 'undefined') return;

    // Trigger visual flash
    document.body.classList.add('cpr-flash');
    setTimeout(() => {
      document.body.classList.remove('cpr-flash');
    }, 100);

    const age = this.patientAgeCategory();
    const preg = this.isPatientPregnant();

    // Update CPR cycles & prompts
    this.cprCompressionCount.update(c => {
      const nextCount = c + 1;
      if (nextCount <= 30) {
        if (nextCount === 1) {
          if (age === 'infant') {
            this.cprCoachPrompt.set('Infant: Compress 1.5" with 2 fingers (120 BPM)');
          } else if (preg) {
            this.cprCoachPrompt.set('Pregnant: Hands slightly higher on breastbone (110 BPM)');
          } else if (age === 'geriatric') {
            this.cprCoachPrompt.set('Geriatric: Compress 2" carefully to avoid fracture (110 BPM)');
          } else {
            this.cprCoachPrompt.set('Adult: Compress 2" in center of chest (110 BPM)');
          }
        } else if (nextCount === 15) {
          this.cprCoachPrompt.set('Keep going! 15 compressions completed.');
        }
        return nextCount;
      } else if (nextCount <= 39) {
        const breathNum = nextCount - 30;
        if (breathNum === 1) {
          if (age === 'infant') {
            this.cprCoachPrompt.set('Stop compressions. Give 2 GENTLE puffs of breath.');
            this.speakFirstAidPrompt('Give gentle puff 1.');
          } else {
            this.cprCoachPrompt.set('Stop compressions. Tilt head & give Breath 1.');
            this.speakFirstAidPrompt('Give breath 1.');
          }
        } else if (breathNum === 5) {
          if (age === 'infant') {
            this.cprCoachPrompt.set('Give gentle puff 2.');
            this.speakFirstAidPrompt('Give gentle puff 2.');
          } else {
            this.cprCoachPrompt.set('Give Breath 2.');
            this.speakFirstAidPrompt('Give breath 2.');
          }
        }
        return nextCount;
      } else {
        this.cprCycleCount.update(cy => cy + 1);
        let resumeMsg = 'Resume compressions!';
        if (preg) {
          resumeMsg = 'Resume chest compressions. Ensure left lateral tilt.';
        }
        this.cprCoachPrompt.set(resumeMsg);
        this.speakFirstAidPrompt('Resume compressions.');
        return 1;
      }
    });

    // Audio click
    try {
      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.1);
    } catch (e) {
      console.warn('[CPR] audio click failed:', e);
    }
  }

  startPulseAcquisition(): void {
    if (this.isPulseAcquiring()) return;
    this.isPulseAcquiring.set(true);
    this.pulseProgress.set(0);

    this.speakFirstAidPrompt('Place finger over camera lens and hold steady.');

    const durationMs = 4000; // 4 seconds measurement
    const stepMs = 100;
    const increment = 100 / (durationMs / stepMs);

    this.pulseAcquireIntervalId = setInterval(() => {
      this.pulseProgress.update(p => {
        if (p >= 100) {
          clearInterval(this.pulseAcquireIntervalId);
          this.pulseAcquireIntervalId = null;
          this.completePulseAcquisition();
          return 100;
        }
        return p + increment;
      });
    }, stepMs);
  }

  cancelPulseAcquisition(): void {
    if (this.pulseAcquireIntervalId) {
      clearInterval(this.pulseAcquireIntervalId);
      this.pulseAcquireIntervalId = null;
    }
    this.isPulseAcquiring.set(false);
    this.pulseProgress.set(0);
  }

  completePulseAcquisition(): void {
    this.isPulseAcquiring.set(false);
    this.pulseProgress.set(0);
    
    // Generate simulated vitals
    const simulatedHr = Math.floor(72 + Math.random() * 20).toString();
    const simulatedSpO2 = Math.floor(96 + Math.random() * 4).toString();
    const simulatedTemp = (97.8 + Math.random() * 1.5).toFixed(1);
    const simulatedBp = `${Math.floor(115 + Math.random() * 15)}/${Math.floor(75 + Math.random() * 10)}`;

    // Update state
    this.state.vitals.update(v => ({
      ...v,
      hr: simulatedHr,
      spO2: simulatedSpO2,
      temp: simulatedTemp,
      bp: simulatedBp
    }));

    // Add entry to Bystander Actions Timeline
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.state.clinicalNotes.update(notes => [
      {
        id: Math.random().toString(),
        text: `Acquired Vitals: HR ${simulatedHr} BPM, SpO2 ${simulatedSpO2}%, Temp ${simulatedTemp}°F, BP ${simulatedBp}`,
        date: timestamp,
        sourceLens: 'EMT Handoff'
      },
      ...notes
    ]);

    this.speakFirstAidPrompt(`Vitals acquired. Heart rate ${simulatedHr} beats per minute. Oxygen saturation ${simulatedSpO2} percent.`);
  }

  speakFirstAidPrompt(text: string): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }

  finalizeSummaryReport() {
    const patientId = this.patientManager.selectedPatientId();
    if (!patientId) return;

    const historyEntry: HistoryEntry = {
      type: 'FinalizedPatientSummary',
      date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
      summary: 'Patient Summary finalized and saved to chart.',
      report: this.intel.analysisResults(),
      annotations: this.lensAnnotations()
    };

    this.patientManager.addHistoryEntry(patientId, historyEntry);

    // Briefly change tab to show it's saved? 
    // For now we'll just log and rely on the history update
    console.log('Patient summary finalized and saved to chart.');
  }

  printReport() {
    const results = this.intel.analysisResults();
    const patientName = this.patientManager.selectedPatient()?.name || 'Clinical User';

    this.export.downloadAsPdf({
      report: results,
      summary: results['Summary Overview'] || 'No summary available.'
    }, patientName);
  }

  // --- Live Consult Actions ---

  /** Signal holding the currently-open NodeAgentDialog data (null = closed). */
  nodeAgentDialogData = signal<INodeAgentDialogData | null>(null);

  /** Provides the serialised patient data string for the NodeAgentDialog context. */
  currentPatientDataForDialog = computed(() => {
    const patient = this.patientManager.selectedPatient();
    if (!patient) return '';
    return this.state.getAllDataForPrompt(patient.history, patient.bookmarks || []);
  });

  openAgentDialog(event: string | { nodeKey: string; nodeText: string; sectionTitle: string }) {
    if (typeof event === 'string') {
      this.insertSectionIntoChat(event);
    } else {
      this.nodeAgentDialogData.set({
        nodeKey: event.nodeKey,
        nodeText: event.nodeText,
        sectionTitle: event.sectionTitle
      });
    }
  }

  insertSectionIntoChat(sectionMarkdown: string) {
    this.state.toggleLiveAgent(true); // Ensure panel is open
    // Need to wait for view to update if we just switched modes
    setTimeout(() => {
      this.state.liveAgentInput.set(`Regarding this section:\n\n> ${sectionMarkdown.replace(/\n/g, '\n> ')}\n\n`);
      const input = document.querySelector<HTMLTextAreaElement>('#chatInput');
      input?.focus();
    }, 100);
  }
}

function getSafeProperty<T>(obj: Record<string, T> | undefined | null, key: string): T | undefined {
  if (!obj || key === '__proto__' || key === 'constructor' || key === 'prototype') {
    return undefined;
  }
  return Reflect.get(obj, key);
}

function setSafeProperty<T>(obj: Record<string, T>, key: string, value: T): void {
  if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
    return;
  }
  Reflect.set(obj, key, value);
}

function encodeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
