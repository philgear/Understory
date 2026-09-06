import { Component, ChangeDetectionStrategy, inject, computed, signal, viewChild, ElementRef, afterNextRender, effect, ChangeDetectorRef, untracked, OnDestroy, NgZone, HostListener, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClinicalIcons } from './assets/clinical-icons';
import { PatientDropdownComponent } from './components/patient-dropdown.component';
import { PatientStateService, BODY_PART_NAMES } from './services/patient-state.service';
import { ResearchFrameComponent } from './components/research-frame.component';
import { MedicalChartComponent } from './components/medical-chart.component';
import { VisitReviewComponent } from './components/visit-review.component';
import { AnalysisContainerComponent } from './components/analysis-container.component';
import { DictationModalComponent } from './components/modals/dictation-modal.component';
import { TaskFlowComponent } from './components/task-flow.component';
import { IntakeFormComponent } from './components/intake-form.component';
import { VoiceAssistantComponent } from './components/voice-assistant.component';
import { getStoredApiKey, setStoredApiKey } from './services/secure-key';
import { SecureStorageService } from './services/secure-storage.service';
import { AI_CONFIG, IAiProviderConfig } from './services/ai-provider.types';
import { IntelligenceProviderToken } from './services/ai/intelligence.provider.token';
import { GeminiProvider } from './services/ai/gemini.provider';
import { ClinicalIntelligenceService, AnalysisLens } from './services/clinical-intelligence.service';
import { PatientManagementService } from './services/patient-management.service';
import { HistoryEntry, IPatient } from './services/patient.types';
import { ThemeService, AppTheme } from './services/theme.service';
import { NetworkStateService } from './services/network-state.service';
import { HardwareTelemetryService } from './services/hardware/hardware-telemetry.service';
import { ExportService } from './services/export.service';
import { RevealDirective } from './directives/reveal.directive';
import { DEMO_ANALYSIS_REPORT_WESTERN } from './demo-data';
import { p_charles_darwin } from './mock-patients/p_charles_darwin';
import { PatientDirectoryComponent } from './components/patient-directory.component';
import { FhirCallbackComponent } from './components/fhir-callback.component';
import { WalkthroughTourComponent } from './components/walkthrough-tour.component';
import { WalkthroughTourService } from './services/walkthrough-tour.service';
import { SecureSplashComponent } from './components/secure-splash.component';
import { SessionStateService } from './services/session-state.service';
import { RulesEngineService } from './services/rules-engine.service';
import { PocketGullInputComponent } from './components/shared/pocket-gull-input.component';
import { ClinicalCdsDisclaimerBannerComponent } from './components/clinical-cds-disclaimer-banner.component';

import { initializeWebMCPPolyfill } from '@mcp-b/webmcp-polyfill';
import { WebMcpRegistrationService } from './services/webmcp-registration.service';
import { PetAuditoryService } from './services/pet-auditory.service';
import { StressInterventionService } from './services/stress-intervention.service';
import { CollaborationService } from './services/collaboration.service';
import { CollaborationDockComponent } from './components/collaboration-dock.component';
import { GamificationService } from './services/gamification.service';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { FitbitService } from './services/hardware/fitbit.service';
import { ConsentService } from './services/consent.service';
import { ConsentModalComponent } from './components/modals/consent-modal.component';
import { ResearchTabComponent } from './components/research-tab.component';
import { ZamecznikCanvasComponent } from './components/shared/zamecznik-canvas.component';
import { CompanionSyncModalComponent } from './components/modals/companion-sync-modal.component';
import { GlossaryModalComponent } from './components/modals/glossary-modal.component';
import { PocketgullTypefaceSiteComponent } from './components/shared/pocketgull-typeface-site.component';
import { DocsStudyComponent } from './components/docs-study.component';
import { NavigationShellService } from './services/navigation-shell.service';
import { BillingDashboardComponent } from './components/billing-dashboard.component';
import { ApiPricingComponent } from './components/api-pricing.component';
import { PatientPortalComponent } from './components/patient-portal.component';
import { ClinicianOnboardingComponent } from './components/clinician-onboarding.component';
import { GoogleHealthConsentModalComponent } from './components/modals/google-health-consent-modal.component';
import { SupportTicketModalComponent } from './components/modals/support-ticket-modal.component';
import { MainHeaderNavComponent } from './components/main-header-nav.component';
import { IntakeToolbarComponent } from './components/intake-toolbar.component';
import { OnboardingTourOverlayComponent } from './components/onboarding-tour-overlay.component';
import { SereneIntakeComponent } from './components/synthesis/serene-intake.component';
import { EncryptedVaultModalComponent } from './components/shared/encrypted-vault-modal.component';
import { SmartFhirSyncModalComponent } from './components/shared/smart-fhir-sync-modal.component';
import { GlobalHealthInitiativesModalComponent } from './components/shared/global-health-initiatives-modal.component';
import { ArticlesReaderComponent } from './components/articles-reader.component';
import { VertexModelGardenPortalComponent } from './components/vertex-model-garden-portal.component';
import { TalentHrPortalComponent } from './components/talent-hr-portal.component';
import { OsceCaseSimulatorComponent } from './components/osce-case-simulator.component';
import { PatentClaimsHudModalComponent } from './components/modals/patent-claims-hud-modal.component';
import { UsageLicensingPaywallModalComponent } from './components/modals/usage-licensing-paywall-modal.component';
import { NantucketTickCaseStudyComponent } from './components/case-studies/nantucket-tick-case-study.component';
import { CommunityTestimonialModalComponent } from './components/modals/community-testimonial-modal.component';
import { SmartHealthPassModalComponent } from './components/smart-health-pass-modal.component';
import { AmbientLivingSpaceDashboardComponent } from './components/ambient-living-space-dashboard.component';
import { HumanDignityPactComponent } from './components/human-dignity-pact.component';
import { DoctorShiftSalesDemoComponent } from './components/doctor-shift-sales-demo.component';
import { GreenRoomLoungeComponent } from './components/green-room-lounge.component';
import { BarrowsClinicalInquiryHubComponent } from './components/barrows-clinical-inquiry-hub.component';
import { PasskeyStepUpModalComponent } from './components/modals/passkey-step-up-modal.component';
import { InstitutionalComplianceModalComponent } from './components/modals/institutional-compliance-modal.component';
import { CmsRpmSuperbillModalComponent } from './components/modals/cms-rpm-superbill-modal.component';
import { ClinicalTrajectoryReaderModalComponent } from './components/modals/clinical-trajectory-reader-modal.component';
import { AustereResearchHudComponent } from './components/austere-research-hud/austere-research-hud.component';
import { AppLicensingGuardService } from './services/app-licensing-guard.service';
import { DocDrillDrawerComponent } from './components/shared/doc-drill-drawer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  host: {
    'ngSkipHydration': 'true'
  },
  imports: [
    CommonModule,
    FormsModule,
    PocketgullTypefaceSiteComponent,
    BarrowsClinicalInquiryHubComponent,
    PasskeyStepUpModalComponent,
    InstitutionalComplianceModalComponent,
    MedicalChartComponent,
    AnalysisContainerComponent,
    DictationModalComponent,
    TaskFlowComponent,
    ResearchFrameComponent,
    ResearchTabComponent,
    IntakeFormComponent,
    VoiceAssistantComponent,
    RevealDirective,
    WalkthroughTourComponent,
    SecureSplashComponent,
    PatientDirectoryComponent,
    FhirCallbackComponent,
    PocketGullInputComponent,
    ConsentModalComponent,
    ZamecznikCanvasComponent,
    CompanionSyncModalComponent,
    GlossaryModalComponent,
    ClinicalCdsDisclaimerBannerComponent,
    DocsStudyComponent,
    BillingDashboardComponent,
    PatientPortalComponent,
    ClinicianOnboardingComponent,
    GoogleHealthConsentModalComponent,
    MainHeaderNavComponent,
    IntakeToolbarComponent,
    OnboardingTourOverlayComponent,
    SupportTicketModalComponent,
    ApiPricingComponent,
    SereneIntakeComponent,
    EncryptedVaultModalComponent,
    SmartFhirSyncModalComponent,
    GlobalHealthInitiativesModalComponent,
    ArticlesReaderComponent,
    VertexModelGardenPortalComponent,
    TalentHrPortalComponent,
    OsceCaseSimulatorComponent,
    PatentClaimsHudModalComponent,
    UsageLicensingPaywallModalComponent,
    NantucketTickCaseStudyComponent,
    CommunityTestimonialModalComponent,
    SmartHealthPassModalComponent,
    AmbientLivingSpaceDashboardComponent,
    HumanDignityPactComponent,
    DoctorShiftSalesDemoComponent,
    GreenRoomLoungeComponent,
    CmsRpmSuperbillModalComponent,
    ClinicalTrajectoryReaderModalComponent,
    AustereResearchHudComponent,
    DocDrillDrawerComponent
  ],
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `

    <app-onboarding-tour-overlay></app-onboarding-tour-overlay>

    <!-- ACM §1.6: First-run informed consent -->
    @if (!showSplash() && !consentService.hasConsented()) {
      <app-consent-modal></app-consent-modal>
    }

    @if (showBillingDashboard()) {
      <app-billing-dashboard (close)="showBillingDashboard.set(false)"></app-billing-dashboard>
    }

    @if (showApiPricing()) {
      <app-api-pricing (close)="showApiPricing.set(false)"></app-api-pricing>
    }

    @if (showPatientPortal()) {
      <app-patient-portal (close)="showPatientPortal.set(false)"></app-patient-portal>
    }

    @if (showClinicianOnboarding()) {
      <app-clinician-onboarding (close)="showClinicianOnboarding.set(false)"></app-clinician-onboarding>
    }

    @if (showGlossaryModal()) {
      <app-glossary-modal (close)="showGlossaryModal.set(false)"></app-glossary-modal>
    }

    @if (showFhirCallback()) {
      <app-fhir-callback></app-fhir-callback>
    } @else {
    <div class="min-h-[100dvh] md:h-[100dvh] w-full bg-[#EEEEEE] dark:bg-zinc-950 text-[#1C1C1C] dark:text-zinc-100 flex flex-col md:overflow-hidden font-sans selection:bg-green-100 selection:text-green-900 group/app">
      
      @if (isDirectoryOpen() || !patientMgmt.selectedPatientId()) {
         @defer (on immediate) {
           <app-patient-directory></app-patient-directory>
         }
      }

      <!-- Companion Sync Modal -->
      @if (showCompanionSyncModal()) {
        <app-companion-sync-modal (closeModal)="showCompanionSyncModal.set(false)"></app-companion-sync-modal>
      }

      <!-- Support Ticket Modal Portal -->
      @if (showSupportTicketModal()) {
        <app-support-ticket-modal (closed)="showSupportTicketModal.set(false)"></app-support-ticket-modal>
      }

      <!-- Zero-Knowledge Encrypted Vault Modal, SMART on FHIR Modal & Global Health Modal -->
      <app-encrypted-vault-modal #vaultModal></app-encrypted-vault-modal>
      <app-smart-fhir-sync-modal #fhirModal></app-smart-fhir-sync-modal>
      <app-global-health-initiatives-modal #globalHealthModal></app-global-health-initiatives-modal>

      <!-- Dr. Howard Barrows Clinical Inquiry & Problem-Based Reasoning Workbench Modal -->
      @if (navShell.showBarrowsWorkbenchModal()) {
        <div class="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto" role="dialog" aria-modal="true" aria-label="Clinical Reasoning Workbench">
          <div class="relative w-full max-w-5xl my-auto">
            <button
              type="button"
              (click)="navShell.closeBarrowsWorkbench()"
              class="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-9 h-9 rounded-full bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-700 flex items-center justify-center text-sm font-bold shadow-2xl z-10 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400"
              aria-label="Close Clinical Workbench">
              ✕
            </button>
            <app-barrows-clinical-inquiry-hub></app-barrows-clinical-inquiry-hub>
          </div>
        </div>
      }

      <!-- NIST SP 800-63B FIDO2 Passkey Step-Up Challenge Modal -->
      <app-passkey-step-up-modal></app-passkey-step-up-modal>

      <!-- Institutional Statutory Compliance Certificate Modal (HIPAA, FDA, NIST, MSA) -->
      @if (navShell.showComplianceCertificateModal()) {
        <app-institutional-compliance-modal
          (close)="navShell.closeComplianceCertificate()">
        </app-institutional-compliance-modal>
      }

      <!-- CMS Remote Patient Monitoring (RPM) Superbill Modal (CPT 99453 / 99454) -->
      @if (navShell.showCmsSuperbillModal()) {
        <app-cms-rpm-superbill-modal
          (close)="navShell.closeCmsSuperbill()">
        </app-cms-rpm-superbill-modal>
      }

      <!-- High-Velocity Trajectory & Bionic Speed Reader Modal -->
      @if (navShell.showTrajectoryReaderModal()) {
        <app-clinical-trajectory-reader-modal
          (close)="navShell.closeTrajectoryReader()">
        </app-clinical-trajectory-reader-modal>
      }

      @defer (on idle) {
        <app-dictation-modal></app-dictation-modal>
      }
      @defer (on idle) {
        <app-walkthrough-tour></app-walkthrough-tour>
      }
      
      @if (showSplash()) {
        <app-secure-splash
          [apiKeyError]="apiKeyError()"
          [hasApiKey]="hasApiKey()"
          (submitKey)="apiKeyInput.set($event); submitApiKey()"
          (loadDemo)="loadDemoMode()"
          (unlockSession)="handleUnlockSession()"
          (selectAiStudio)="selectKey()"
          (emergencyBypass)="handleEmergencyBypass()">
        </app-secure-splash>
      } @else {
        @if (state.isEmergencyMode()) {
          <main class="flex-1 flex flex-col min-w-0 min-h-0 relative bg-zinc-950 text-zinc-100 overflow-hidden font-pocketgull-inter">
            <!-- 🚨 Emergency Mode Top Critical Command Bar -->
            <div class="px-4 py-2.5 bg-gradient-to-r from-red-950 via-zinc-950 to-red-950 border-b-2 border-red-600/80 shadow-2xl flex flex-wrap items-center justify-between gap-3 shrink-0 no-print z-30 font-pocketgull-mono">
              
              <!-- Left: Pulsing Beacon & Mode Title -->
              <div class="flex items-center gap-3">
                <div class="relative flex h-3.5 w-3.5 shrink-0">
                  <span class="absolute inline-flex h-full w-full rounded-full opacity-75 bg-red-500 animate-ping"></span>
                  <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-600 shadow-[0_0_12px_rgba(239,68,68,0.9)]"></span>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-pocketgull-mono text-sm sm:text-base font-black tracking-wider text-red-100 uppercase">
                      CODE BLUE • EMERGENCY TRIAGE ACTIVE
                    </span>
                    <span class="hidden sm:inline px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 text-[10px] font-bold border border-red-500/40">
                      OFFLINE FIRST AID
                    </span>
                  </div>
                  <span class="text-[11px] text-zinc-400 font-sans block">
                    Zero-latency bystander CPR, EMT handoff telemetry &amp; rapid emergency guides
                  </span>
                </div>
              </div>

              <!-- Right: Direct 911 Dialer & Exit Control -->
              <div class="flex items-center gap-2.5 ml-auto">
                <a href="tel:911" class="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-pocketgull font-bold text-xs uppercase tracking-wider transition shadow-lg flex items-center gap-1.5 active:scale-95 border border-red-400 no-underline cursor-pointer">
                  <span class="animate-bounce">📞</span> CALL 911
                </a>
                <button type="button" (click)="state.isEmergencyMode.set(false); session.isLocked.set(true)" 
                        class="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 font-pocketgull font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer">
                  <span>✕</span> Exit Emergency Mode
                </button>
              </div>

            </div>

            <!-- Main Analysis Container in Emergency Mode -->
            <app-analysis-container class="flex flex-col flex-1 min-h-0 h-full w-full overflow-hidden"></app-analysis-container>
          </main>
        } @else {
          <main class="flex-1 flex flex-col min-w-0 min-h-0 relative group/main"> <!-- Main Content -->
        <!-- Offline Banner -->
        @if (!network.isOnline()) {
          <!-- Spectral P1-Critical (640nm red) offline banner -->
          <div class="border-b px-4 py-2 flex items-center justify-between gap-4 no-print shrink-0"
               style="background-color: var(--spectral-critical-bg); border-color: var(--spectral-critical-border);">
            <div class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 shrink-0" style="color: var(--spectral-critical);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l22 22"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.58 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
              <p class="text-xs font-medium" style="color: var(--spectral-critical);">You are currently offline. Certain AI features and cloud sync may be disabled.</p>
            </div>
            @if (network.forceOffline()) {
                <button (click)="network.toggleForceOffline()" class="text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors rounded px-2 py-1"
                        style="color: var(--spectral-critical); border: 1px solid var(--spectral-critical-border); background: white;">Reconnect</button>
            }
          </div>
        }

        <!-- ═══ Google Health Informed Consent Modal ═══════════════════════════════ -->
        @if (fitbit.showConsentModal()) {
          <app-google-health-consent-modal></app-google-health-consent-modal>
        }

        <!-- Fitbit Health Syncing Toast -->
        @if (isGHealthSyncing()) {
          <div class="border-b px-6 py-3 flex items-center justify-between no-print shrink-0 bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50 animate-pulse">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" class="opacity-25"></circle>
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" class="opacity-75"></path>
                </svg>
              </div>
              <div>
                <h3 class="text-xs font-bold uppercase tracking-[0.1em] text-blue-800 dark:text-blue-300">Synchronizing Fitbit Health Data</h3>
                <p class="text-[12px] text-blue-600 dark:text-blue-400/80">Transferring and transforming patient records, vital logs, and Fitbit metrics between PocketGull and Google Cloud Healthcare FHIR Store...</p>
              </div>
            </div>
          </div>
        }

        <!-- Fitbit Health Sync Success Toast -->
        @if (showGHealthSuccess()) {
          <div class="border-b px-6 py-3 flex items-center justify-between no-print shrink-0 bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800/50 animate-in fade-in slide-in-from-top-2 duration-300">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <h3 class="text-xs font-bold uppercase tracking-[0.1em] text-green-800 dark:text-green-300">Fitbit Health Sync Successful</h3>
                <p class="text-[12px] text-green-600 dark:text-green-500/80">Patient demographics, historical conditions, and Fitbit vital logs successfully synchronized with Google Cloud Healthcare FHIR Store.</p>
              </div>
            </div>
            <button (click)="showGHealthSuccess.set(false)" class="p-1 hover:bg-green-100 dark:hover:bg-green-900/40 rounded transition-colors text-green-700 dark:text-green-400">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        }

        <!-- Google Health Sync Error Toast -->
        @if (showGHealthError(); as errorMsg) {
          <div class="border-b px-6 py-3 flex items-center justify-between no-print shrink-0 bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50 animate-in fade-in slide-in-from-top-2 duration-300">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <div>
                <h3 class="text-xs font-bold uppercase tracking-[0.1em] text-red-800 dark:text-red-300">Google Health Sync Failed</h3>
                <p class="text-[12px] text-red-600 dark:text-red-500/80">{{ errorMsg }}</p>
              </div>
            </div>
            <button (click)="showGHealthError.set(null)" class="p-1 hover:bg-red-100 dark:hover:bg-red-900/40 rounded transition-colors text-red-700 dark:text-red-400">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        }

        <!-- AWS HealthLake Syncing Toast -->
        @if (isAwsSyncing()) {
          <div class="border-b px-6 py-3 flex items-center justify-between no-print shrink-0 bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50 animate-pulse">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" class="opacity-25"></circle>
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" class="opacity-75"></path>
                </svg>
              </div>
              <div>
                <h3 class="text-xs font-bold uppercase tracking-[0.1em] text-amber-800 dark:text-amber-300">Synchronizing to AWS HealthLake</h3>
                <p class="text-[12px] text-amber-600 dark:text-amber-400/80">Transforming medical data to FHIR resources and uploading to AWS HealthLake...</p>
              </div>
            </div>
          </div>
        }

        <!-- AWS HealthLake Sync Success Toast -->
        @if (showAwsSuccess()) {
          <div class="border-b px-6 py-3 flex items-center justify-between no-print shrink-0 bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800/50 animate-in fade-in slide-in-from-top-2 duration-300">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <h3 class="text-xs font-bold uppercase tracking-[0.1em] text-green-800 dark:text-green-300">AWS HealthLake Sync Successful</h3>
                <p class="text-[12px] text-green-600 dark:text-green-500/80">Patient demographics, historical conditions, and vital logs successfully archived in AWS HealthLake FHIR Store.</p>
              </div>
            </div>
            <button (click)="showAwsSuccess.set(false)" class="p-1 hover:bg-green-100 dark:hover:bg-green-900/40 rounded transition-colors text-green-700 dark:text-green-400">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        }

        <!-- AWS HealthLake Sync Error Toast -->
        @if (showAwsError(); as errorMsg) {
          <div class="border-b px-6 py-3 flex items-center justify-between no-print shrink-0 bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50 animate-in fade-in slide-in-from-top-2 duration-300">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <div>
                <h3 class="text-xs font-bold uppercase tracking-[0.1em] text-red-800 dark:text-red-300">AWS HealthLake Sync Failed</h3>
                <p class="text-[12px] text-red-600 dark:text-red-500/80">{{ errorMsg }}</p>
              </div>
            </div>
            <button (click)="showAwsError.set(null)" class="p-1 hover:bg-red-100 dark:hover:bg-red-900/40 rounded transition-colors text-red-700 dark:text-red-400">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        }

        <!-- Spectral P2-Urgent (585nm amber) demo mode banner -->
        @if (isDemoMode()) {
          <div class="border-b px-4 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 no-print shrink-0"
               style="background-color: var(--spectral-urgent-bg); border-color: var(--spectral-urgent-border);">
            <div class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 shrink-0" style="color: var(--spectral-urgent);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p class="text-xs font-medium" style="color: var(--spectral-urgent);">Demo Mode <span class="hidden sm:inline">— Showing pre-sampled patient data. AI analysis generation requires an API key.</span></p>
            </div>
            <div class="flex items-center gap-3">
              <button (click)="exitDemoMode()" class="text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors cursor-pointer" style="color: var(--spectral-urgent);">Enter API Key →</button>
            </div>
          </div>
        }

        <app-main-header-nav
          (openTuringSuite)="navShell.selectTab('analysis')"
          (openBarrowsWorkbench)="navShell.openBarrowsWorkbench()"
          (openSocraticIntake)="state.toggleSocraticIntake(true)"
          (openModelGarden)="showModelGardenModal.set(true)"
          (openTalentHrPortal)="showTalentHrPortalModal.set(true)"
          (openCompanionSync)="showCompanionSyncModal.set(true)"
          (openBioNetworkQr)="showCompanionSyncModal.set(true)"
          (openBillingDashboard)="showBillingDashboard.set(true)"
          (openApiPricing)="showApiPricing.set(true)"
          (openPatientPortal)="showPatientPortal.set(true)"
          (openClinicianOnboarding)="showClinicianOnboarding.set(true)"
          (openTypefaceSite)="showTypefaceSite.set(true)"
          (openDocsStudy)="showDocsStudy.set(true)"
          (openSupportTicket)="showSupportTicketModal.set(true)"
          (openComplianceCertificate)="navShell.openComplianceCertificate()"
          (openEncryptedVault)="vaultModal.open()"
          (openSmartFhirSync)="fhirModal.open()"
          (openGlobalHealth)="globalHealthModal.open()"
          (openArticles)="showArticlesModal.set(true)"
          (openPatentClaims)="showPatentClaimsModal.set(true)"
          (openSmartHealthPass)="showSmartHealthPassModal.set(true)"
          (openAmbientLivingSpace)="showAmbientLivingSpaceModal.set(true)"
          (openHumanDignityPact)="showHumanDignityPactModal.set(true)"
          (openDoctorShiftDemo)="showDoctorShiftSalesDemoModal.set(true)"
          (openGreenRoom)="showGreenRoomLoungeModal.set(true)"
          (openAustereHud)="showAustereHudModal.set(true)"
          (triggerSomaticGrounding)="triggerSomaticGrounding()">
        </app-main-header-nav>

        <app-intake-toolbar
          [hasReport]="hasReport()"
          (openLicensingModal)="showLicensingModal.set(true)"
          (openSocraticIntake)="state.toggleSocraticIntake(true)"
          (exportPdf)="exportPdf()"
          (exportJson)="exportJson()"
          (exportFhir)="exportFhir()"
          (exportFhirR4Bundle)="exportFhirR4Bundle()"
          (exportLaafHapticFhir)="exportLaafHapticFhir()"
          (connectEpic)="connectEpic()"
          (connectAwsHealth)="connectAwsHealth()"
          (connectAppleHealth)="connectAppleHealth()"
          (uploadData)="uploadData()"
          (finalizeRecord)="finalizeRecord()">
        </app-intake-toolbar>

        <!-- Main Grid Layout -->
        <div #mainContainer class="flex-1 flex flex-col md:flex-row max-md:overflow-visible overflow-y-auto md:overflow-hidden relative bg-[#F9FAFB] dark:bg-[#09090b] p-2 md:p-6 gap-3 md:gap-6 min-h-0">

            <!-- Mobile Header: Back Button & View Tabs -->
            @if (!state.isLiveAgentActive() && !state.isSparkModeActive()) {
              <div class="w-full gap-2 shrink-0 z-20 hidden max-md:flex max-md:flex-col mb-3 no-print">
                @if (state.selectedPartId()) {
                  <button (click)="goBackToChart()" class="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-black dark:hover:text-white self-start px-2 py-1.5 -ml-2 transition-colors min-h-[44px]">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    <span>Back to Full Chart</span>
                  </button>
                }
                <div class="flex p-1.5 bg-gray-200 dark:bg-zinc-800 rounded-[10px] w-full border border-gray-300 dark:border-zinc-700/60 shadow-sm">
                  <button (click)="mobileActiveTab.set('chart')" 
                          class="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest rounded-md transition-all shadow-sm min-h-[44px] flex items-center justify-center gap-1.5"
                          [class.bg-white]="mobileActiveTab() === 'chart'" [class.dark:bg-[#09090b]]="mobileActiveTab() === 'chart'" [class.text-black]="mobileActiveTab() === 'chart'" [class.dark:text-white]="mobileActiveTab() === 'chart'"
                          [class.text-gray-700]="mobileActiveTab() !== 'chart'" [class.dark:text-zinc-300]="mobileActiveTab() !== 'chart'">
                    🩺 Chart
                  </button>
                  <button (click)="mobileActiveTab.set('analysis')"
                          class="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest rounded-md transition-all shadow-sm min-h-[44px] flex items-center justify-center gap-1.5"
                          [class.bg-white]="mobileActiveTab() === 'analysis'" [class.dark:bg-[#09090b]]="mobileActiveTab() === 'analysis'" [class.text-black]="mobileActiveTab() === 'analysis'" [class.dark:text-white]="mobileActiveTab() === 'analysis'"
                          [class.text-gray-700]="mobileActiveTab() !== 'analysis'" [class.dark:text-zinc-300]="mobileActiveTab() !== 'analysis'">
                    📊 Analysis
                  </button>
                  @if (state.selectedPartId()) {
                    <button (click)="mobileActiveTab.set('tasks')"
                            class="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest rounded-md transition-all shadow-sm min-h-[44px] flex items-center justify-center gap-1.5"
                            [class.bg-white]="mobileActiveTab() === 'tasks'" [class.dark:bg-[#09090b]]="mobileActiveTab() === 'tasks'" [class.text-black]="mobileActiveTab() === 'tasks'" [class.dark:text-white]="mobileActiveTab() === 'tasks'"
                            [class.text-gray-700]="mobileActiveTab() !== 'tasks'" [class.dark:text-zinc-300]="mobileActiveTab() !== 'tasks'">
                      📋 Tasks
                    </button>
                  }
                </div>
              </div>
            }

          <!-- Column 1: IPatient Medical Chart -->
           <div class="relative w-full md:h-full bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 md:overflow-hidden flex flex-col md:block flex-shrink-0"
                id="tour-body-chart"
               [class.md:flex-1]="isAnalysisCollapsed() || inputPanelWidth() === undefined || state.isSparkModeActive()"
               [class.transition-all]="!isDragging()"
               [class.duration-500]="!isDragging()"
               [class.ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]]="!isDragging()"
               [style.--panel-width.px]="isChartCollapsed() ? 0 : (isAnalysisCollapsed() ? null : inputPanelWidth())"
               [class.md:w-[var(--panel-width)]]="!isAnalysisCollapsed() && inputPanelWidth() !== undefined && !state.isSparkModeActive()"
               [class.hidden]="isChartCollapsed()"
               [class.max-md:hidden]="mobileActiveTab() !== 'chart' && !state.isSparkModeActive()">
               <div class="md:h-full w-full md:overflow-hidden flex-1 flex flex-col min-h-0">
                  <app-medical-chart class="no-print md:h-full block md:overflow-y-auto w-full max-md:overflow-visible"></app-medical-chart>
               </div>
            </div>

            <!-- RESIZER V -->
            <div title="Drag to resize, Double-click to maximize chart" class="hidden md:flex w-2 shrink-0 items-center justify-center cursor-col-resize z-20 no-print group"
                 [class.relative]="!isChartCollapsed() && !isAnalysisCollapsed()"
                 [class.absolute]="isChartCollapsed() || isAnalysisCollapsed()"
                 [class.h-full]="isChartCollapsed() || isAnalysisCollapsed()"
                 [class.left-0]="isChartCollapsed()"
                 [class.right-0]="isAnalysisCollapsed()"
                 [class.top-0]="isChartCollapsed() || isAnalysisCollapsed()"
                 (mousedown)="startColumnDrag($event)"
                 (dblclick)="maximizeChart()">
                
                <!-- Full-width background bar -->
                <div class="absolute inset-y-0 w-4 bg-transparent group-hover:bg-gray-100/50 dark:group-hover:bg-zinc-800/50 transition-colors rounded-full z-0"
                     [class.left-1/2]="!isChartCollapsed() && !isAnalysisCollapsed()"
                     [class.-translate-x-1/2]="!isChartCollapsed() && !isAnalysisCollapsed()"
                     [class.left-0]="isChartCollapsed()"
                     [class.right-0]="isAnalysisCollapsed()"></div>
                <div class="absolute inset-0 bg-gray-100/50 dark:bg-zinc-800/50 group-hover:bg-gray-200 dark:group-hover:bg-zinc-700 transition-colors rounded"></div>
                <!-- Handle -->
                <div class="h-12 w-1.5 rounded-full bg-gray-200 dark:bg-zinc-700 group-hover:bg-gray-300 dark:group-hover:bg-zinc-600 transition-colors relative z-10"></div>

                <!-- Quick Actions (V4) -->
                <div class="absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-3 bg-white dark:bg-zinc-900 shadow-xl border border-gray-200 dark:border-zinc-800 rounded-full p-1.5 z-30"
                     [class.left-1/2]="!isChartCollapsed() && !isAnalysisCollapsed()"
                     [class.-translate-x-1/2]="!isChartCollapsed() && !isAnalysisCollapsed()"
                     [class.left-0]="isChartCollapsed()"
                     [class.translate-x-2]="isChartCollapsed()"
                     [class.right-0]="isAnalysisCollapsed()"
                     [class.-translate-x-2]="isAnalysisCollapsed()">
                   
                   <!-- Panel Management -->
                   <div class="flex flex-col gap-1 border-b border-gray-100 dark:border-zinc-800 pb-1.5 mb-0.5">
                      <button (click)="$event.stopPropagation(); maximizeChart()" [class.bg-black]="!isChartCollapsed() && isAnalysisCollapsed()" [class.dark:bg-white]="!isChartCollapsed() && isAnalysisCollapsed()" [class.text-white]="!isChartCollapsed() && isAnalysisCollapsed()" [class.dark:text-black]="!isChartCollapsed() && isAnalysisCollapsed()"
                              title="Maximize Medical Chart" class="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><polyline points="14 2 14 8 20 8"></polyline><path d="M16 13H8"></path><path d="M16 17H8"></path><path d="M10 9H8"></path><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path></svg>
                      </button>
                      <button (click)="$event.stopPropagation(); maximizeAnalysis()" [class.bg-black]="isChartCollapsed() && !isAnalysisCollapsed()" [class.dark:bg-white]="isChartCollapsed() && !isAnalysisCollapsed()" [class.text-white]="isChartCollapsed() && !isAnalysisCollapsed()" [class.dark:text-black]="isChartCollapsed() && !isAnalysisCollapsed()"
                              title="Maximize Analysis Panel" class="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      </button>
                      <button (click)="$event.stopPropagation(); showSplitView()" [class.bg-black]="!isChartCollapsed() && !isAnalysisCollapsed()" [class.dark:bg-white]="!isChartCollapsed() && !isAnalysisCollapsed()" [class.text-white]="!isChartCollapsed() && !isAnalysisCollapsed()" [class.dark:text-black]="!isChartCollapsed() && !isAnalysisCollapsed()" class="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors" title="Split View">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><rect x="2" y="3" width="20" height="18" rx="2" ry="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line></svg>
                      </button>
                   </div>

                   
                </div>
            </div>

            <!-- Column 2 (Middle): Task Flow & Intake Bracket -->
            @if (state.selectedPartId() && !state.isLiveAgentActive() && !state.isSparkModeActive()) {
               <div class="shrink-0 w-full md:w-[400px] flex flex-col gap-3 md:gap-6 h-full z-20 transition-all duration-300"
                    [class.max-md:hidden]="mobileActiveTab() !== 'tasks'"
                    [class.tab-fade-enter]="mobileActiveTab() === 'tasks'">
                  <div id="tour-intake-form" class="flex-1 min-h-0 overflow-hidden rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    @defer {
                      <app-intake-form appReveal></app-intake-form>
                    } @placeholder {
                      <div class="h-full flex items-center justify-center text-zinc-400 text-xs uppercase tracking-widest font-bold border-2 border-dashed border-zinc-200 dark:border-zinc-800 m-4 rounded-xl">Loading Intake...</div>
                    }
                  </div>
                  <div class="flex-1 min-h-0 overflow-hidden rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    @defer {
                      <app-task-flow appReveal [revealDelay]="100"></app-task-flow>
                    } @placeholder {
                      <div class="h-full flex items-center justify-center text-zinc-400 text-xs uppercase tracking-widest font-bold border-2 border-dashed border-zinc-200 dark:border-zinc-800 m-4 rounded-xl">Loading Tasks...</div>
                    }
                  </div>
               </div>
            }

            <div class="flex-1 md:flex-[1.5] flex md:overflow-hidden relative gap-3 md:gap-6 flex-col min-h-0 w-full max-md:min-h-[calc(100dvh-130px)]"
                 [class.hidden]="isAnalysisCollapsed()"
                 [class.max-md:hidden]="mobileActiveTab() !== 'analysis'"
                 [class.tab-fade-enter]="mobileActiveTab() === 'analysis'">
             
                 <!-- Section 1: Analysis Intake Container -->
                 <div class="overflow-hidden flex flex-col bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 transition-shadow duration-300 hover:shadow-md flex-1 md:min-h-0 min-h-[50dvh] max-md:min-h-[calc(100dvh-140px)] max-md:h-full"
                      [class.rounded-none]="isChartCollapsed()"
                      [class.border-y-0]="isChartCollapsed()"
                      [class.border-r-0]="isChartCollapsed()"
                      [class.shadow-none]="isChartCollapsed()"
                      [class.bg-[#F9FAFB]]="isChartCollapsed()"
                      [class.dark:bg-[#09090b]]="isChartCollapsed()">
                     @defer (on immediate) {
                       <app-analysis-container class="flex flex-col flex-1 min-h-0 min-w-0 h-full w-full overflow-hidden max-md:h-full max-md:min-h-[calc(100dvh-140px)]" appReveal [revealDelay]="100"></app-analysis-container>
                     } @placeholder {
                       <div class="h-full flex items-center justify-center text-zinc-400 text-xs uppercase tracking-widest font-bold border-2 border-dashed border-zinc-200 dark:border-zinc-800 m-4 rounded-xl">Loading Core AI Synthesis...</div>
                     }
                 </div>
                 


                 @if (intelligence.researchHits()) {
                   <div class="overflow-hidden flex flex-col bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 transition-shadow duration-300 hover:shadow-md h-[300px] shrink-0">
                     <app-research-tab class="block h-full" [hits]="intelligence.researchHits()"></app-research-tab>
                   </div>
                 }
              </div>
            </div>
          </main>
        }

            <!-- Pocket: Floating Voice Assistant -->
            @if (state.isLiveAgentActive()) {
              <!-- Background backdrop blur -->
              <div class="fixed inset-0 z-[99] bg-black/10 dark:bg-black/30 backdrop-blur-[2px] animate-in fade-in" (click)="state.toggleLiveAgent(false)"></div>
              
              <!-- Animation Styles for Folding -->
              <style>
                @keyframes origami-unfold {
                    0% { transform: scaleY(0.1) rotateX(80deg) rotateZ(-10deg); opacity: 0; }
                    60% { transform: scaleY(1.1) rotateX(-15deg) rotateZ(5deg); opacity: 1; }
                    100% { transform: scaleY(1) rotateX(0deg) rotateZ(0deg); opacity: 1; }
                }
                @keyframes fly-out-pocket {
                    0% { transform: translateY(100px) scale(0.2) rotate(-20deg); opacity: 0; }
                    60% { transform: translateY(-15px) scale(1.1) rotate(10deg); opacity: 1; }
                    100% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
                }
                .origami-fold {
                    animation: origami-unfold 0.85s cubic-bezier(0.34, 1.56, 0.64, 1) both;
                    transform-style: preserve-3d;
                }
                .fly-out {
                    animation: fly-out-pocket 1s cubic-bezier(0.34, 1.56, 0.64, 1) both;
                }
                .fold-1 { animation-delay: 150ms; }
                .fold-2 { animation-delay: 300ms; }
                .fold-3 { animation-delay: 450ms; }
                .fold-4 { animation-delay: 600ms; }
              </style>

              <!-- The Pocket Container -->
              <div id="tour-voice-agent-window" class="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100%-2rem)] sm:w-[420px] h-[650px] max-h-[calc(100dvh-4rem)] z-[100] flex flex-col transition-all duration-500 animate-in slide-in-from-bottom-10 fade-in pointer-events-none">
                 
                 <!-- Perched Origami Seagull -->
                 <div class="relative w-full h-24 pointer-events-auto flex justify-center items-end pb-0 translate-y-[4px] z-[101]" style="perspective: 1000px;">
                    <svg class="w-28 h-28 drop-shadow-[0_10px_10px_rgba(20,50,90,0.3)] fly-out" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                        <g fill-rule="evenodd" stroke="#1E3A5F" stroke-width="2.5" stroke-linejoin="round">
                            <!-- Right Wing (Back) -->
                            <polygon points="107,95 140,50 115,85" fill="#C5D9ED" class="origami-fold fold-4 origin-[60%_45%]" />
                            <polygon points="140,50 115,85 130,100" fill="#E6F0FA" class="origami-fold fold-3 origin-[60%_45%]" />

                            <!-- Left Wing (Front raised) -->
                            <polygon points="40,35 60,65 30,55" fill="#FFFFFF" class="origami-fold fold-4 origin-[35%_35%]" />
                            <polygon points="40,35 85,60 60,65" fill="#FFFFFF" class="origami-fold fold-3 origin-[40%_35%]" />
                            <polygon points="85,60 107,95 60,65" fill="#DAE8F5" class="origami-fold fold-2 origin-[40%_35%]" />
                            <polygon points="60,65 107,95 90,115" fill="#FFFFFF" class="origami-fold fold-1 origin-[50%_50%]" />

                            <!-- Tail -->
                            <polygon points="45,130 65,110 55,145" fill="#FFFFFF" class="origami-fold fold-4 origin-[30%_65%]" />
                            <polygon points="65,110 55,145 90,115" fill="#E6F0FA" class="origami-fold fold-3 origin-[35%_65%]" />

                            <!-- Body -->
                            <polygon points="65,110 90,115 107,95" fill="#FFFFFF" class="origami-fold origin-[50%_60%]" />
                            <polygon points="90,115 107,95 125,105" fill="#FFFFFF" class="origami-fold origin-[50%_60%]" />
                            <polygon points="90,115 125,105 120,130" fill="#C5D9ED" class="origami-fold origin-[55%_60%]" />

                            <!-- Head/Beak -->
                            <polygon points="107,95 122,90 125,105" fill="#FFFFFF" class="origami-fold fold-1 origin-[60%_50%]" />
                            <polygon points="122,90 135,93 125,105" fill="#FFFFFF" class="origami-fold fold-2 origin-[60%_50%]" />
                            <polygon points="125,105 135,93 140,110" fill="#E6F0FA" class="origami-fold fold-2 origin-[60%_50%]" />
                            <polygon points="135,93 150,100 133,102" fill="#E6F0FA" class="origami-fold fold-3 origin-[65%_50%]" />
                        </g>
                    </svg>
                 </div>
                 
                 <!-- The Pocket Window styled like the Origami Theme -->
                 <div class="flex-1 w-full bg-gradient-to-br from-[#E1EAF4] to-[#C9DEEE] dark:from-[#0F172A] dark:to-[#1E293B] rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(30,58,95,0.4)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] border-[3px] border-white dark:border-[#334155] overflow-hidden pointer-events-auto flex flex-col relative ring-1 ring-[#1E3A5F]/10 dark:ring-black/50">
                    <!-- Embedded Voice Assistant logic takes over inner bounds transparently -->
                    @defer (on immediate) {
                      <app-voice-assistant id="tour-voice-assistant" class="block h-full w-full mix-blend-normal bg-white/70 dark:bg-black/50 backdrop-blur-md"></app-voice-assistant>
                    }
                 </div>
               </div>
             }
          }
        </div>

        <!-- Institutional, Careers & Clinical Transparency Footer -->
        <footer class="border-t border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md px-4 sm:px-8 py-3.5 no-print text-xs text-zinc-500 dark:text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 z-10 shadow-xs">
          <div class="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs">
            <span class="font-pocketgull-brand font-bold text-xs text-zinc-900 dark:text-zinc-100">PocketGull</span>
            <span class="text-zinc-400 dark:text-zinc-600 hidden sm:inline">•</span>
            <span class="text-zinc-500 dark:text-zinc-400 hidden sm:inline">Copyright © 2026 Applied Clinical AI Consortium • Global Health Equity &amp; HIPAA Safe Harbor</span>
          </div>
          <div class="flex flex-wrap items-center justify-center gap-3 sm:gap-5 font-semibold text-[11px] sm:text-xs">
            <button type="button" (click)="showPatentClaimsModal.set(true)" class="text-teal-600 dark:text-teal-400 hover:underline transition cursor-pointer flex items-center gap-1 font-mono text-[11px] font-bold">
              <span>⚖️ IP &amp; 200 Claims</span>
            </button>
            <button type="button" (click)="showOsceSimulatorModal.set(true)" class="hover:text-teal-600 dark:hover:text-teal-400 transition cursor-pointer flex items-center gap-1">
              <span>🎓 Case Simulator</span>
            </button>
            <button type="button" (click)="showTalentHrPortalModal.set(true)" class="hover:text-teal-600 dark:hover:text-teal-400 transition cursor-pointer flex items-center gap-1">
              <span>🤝 Join Team &amp; Fellowships</span>
            </button>
            <button type="button" (click)="showModelGardenModal.set(true)" class="hover:text-teal-600 dark:hover:text-teal-400 transition cursor-pointer flex items-center gap-1">
              <span>🌿 Vertex Model Garden</span>
            </button>
            <button type="button" (click)="showBillingDashboard.set(true)" class="hover:text-teal-600 dark:hover:text-teal-400 transition cursor-pointer flex items-center gap-1">
              <span>💳 Subscriptions</span>
            </button>
            <button type="button" (click)="showApiPricing.set(true)" class="hover:text-teal-600 dark:hover:text-teal-400 transition cursor-pointer flex items-center gap-1">
              <span>⚡ API Pricing</span>
            </button>
            <button type="button" (click)="showArticlesModal.set(true)" class="hover:text-teal-600 dark:hover:text-teal-400 transition cursor-pointer flex items-center gap-1">
              <span>📰 Articles</span>
            </button>
            <button type="button" (click)="showDocsStudy.set(true)" class="hover:text-teal-600 dark:hover:text-teal-400 transition cursor-pointer flex items-center gap-1">
              <span>📚 Docs</span>
            </button>
          </div>
        </footer>
      }
        
        @if(state.isResearchFrameVisible()) {
            @defer (on immediate) {
              <app-research-frame></app-research-frame>
            }
        }


    <!-- SMART Health Card & Cryptographic Pass Modal -->
    @if (showSmartHealthPassModal()) {
      <app-smart-health-pass-modal (closeModal)="showSmartHealthPassModal.set(false)"></app-smart-health-pass-modal>
    }

    <!-- Living Room Ambient Health Studio Modal -->
    @if (showAmbientLivingSpaceModal()) {
      <app-ambient-living-space-dashboard></app-ambient-living-space-dashboard>
    }

    <!-- Human Dignity Charter & Autonomy Pact Modal -->
    @if (showHumanDignityPactModal()) {
      <app-human-dignity-pact (closeModal)="showHumanDignityPactModal.set(false)"></app-human-dignity-pact>
    }

    <!-- Patent & IP Claims Registry Modal -->
    @if (showPatentClaimsModal()) {
      <app-patent-claims-hud-modal (close)="showPatentClaimsModal.set(false)"></app-patent-claims-hud-modal>
    }

    <!-- Usage & Licensing Paywall Modal -->
    @if (showLicensingModal()) {
      <app-usage-licensing-paywall-modal 
        (close)="showLicensingModal.set(false)"
        (openCaseStudy)="showLicensingModal.set(false); showNantucketCaseStudy.set(true)">
      </app-usage-licensing-paywall-modal>
    }

    <!-- Nantucket Island Tick Case Study Modal -->
    @if (showNantucketCaseStudy()) {
      <div class="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
        <app-nantucket-tick-case-study 
          (close)="showNantucketCaseStudy.set(false)">
        </app-nantucket-tick-case-study>
      </div>
    }

    <!-- Community Testimonials & Quotes Modal -->
    @if (showTestimonialsModal()) {
      <app-community-testimonial-modal (close)="showTestimonialsModal.set(false)"></app-community-testimonial-modal>
    }

    <!-- Socratic Patient Intake Studio Modal -->
    @if (state.isSocraticIntakeVisible()) {
      <div class="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-300 no-print" role="dialog" aria-modal="true" aria-labelledby="socratic-intake-modal-title">
        <div class="relative w-full max-w-7xl max-h-[92vh] bg-white dark:bg-zinc-950 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-y-auto flex flex-col">
          <div class="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
            <div class="flex items-center gap-3">
              <span class="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-lg">✨</span>
              <div>
                <h2 id="socratic-intake-modal-title" class="text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Socratic Patient Intake Studio</h2>
                <p class="text-xs text-zinc-500 dark:text-zinc-400">Calgary-Cambridge FIFE Model & SNOMED-CT Clinical Extraction</p>
              </div>
            </div>
            <button (click)="state.toggleSocraticIntake(false)" 
                    aria-label="Close Socratic Intake"
                    class="px-3.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-rose-500 hover:text-white rounded-full transition-colors font-bold text-xs cursor-pointer">
              ✕ Close Studio
            </button>
          </div>
          <div class="p-4 sm:p-6">
            <app-serene-intake></app-serene-intake>
          </div>
        </div>
      </div>
    }

    <!-- PocketGull Typeface Specimen Suite Modal Site -->
    @if (showTypefaceSite()) {
      <div class="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-300">
        <div class="relative w-full max-w-7xl max-h-[90vh] bg-white dark:bg-zinc-950 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-y-auto">
          <button (click)="showTypefaceSite.set(false)" class="absolute top-6 right-6 z-[10000] px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-amber-500 hover:text-zinc-950 rounded-full transition-colors font-bold text-xs">
            ✕ Close Specimen
          </button>
          <app-pocketgull-typeface-site />
        </div>
      </div>
    }

    <!-- Native Angular Documentation Suite -->
    @if (showDocsStudy()) {
      <app-docs-study></app-docs-study>
    }

    <!-- Universal Doc Drill & Evidence Focus Socratic Drawer -->
    <app-doc-drill-drawer />


    <!-- Vertex AI Model Garden & Developer API Portal Modal Site -->
    @if (showModelGardenModal()) {
      <div class="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-300 no-print" role="dialog" aria-modal="true" aria-labelledby="model-garden-title">
        <div class="relative w-full max-w-7xl max-h-[92vh] bg-zinc-950 rounded-3xl shadow-2xl border border-teal-900/50 overflow-y-auto flex flex-col">
          <div class="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800">
            <div class="flex items-center gap-3">
              <span class="p-2 rounded-xl bg-teal-950/60 text-teal-400 text-lg border border-teal-500/30">🌿</span>
              <div>
                <h2 id="model-garden-title" class="text-sm font-bold uppercase tracking-widest text-zinc-100">PocketGull Vertex AI Model Garden & Developer Hub</h2>
                <p class="text-xs text-zinc-400">Enterprise Specialty Model Registry • Calibrated Probabilities • 1-Click Cloud Deployment</p>
              </div>
            </div>
            <button (click)="showModelGardenModal.set(false)" 
                    aria-label="Close Model Garden"
                    class="px-3.5 py-1.5 bg-zinc-800 hover:bg-rose-600 text-zinc-200 hover:text-white rounded-full transition-colors font-bold text-xs cursor-pointer border border-zinc-700">
              ✕ Close Garden
            </button>
          </div>
          <div class="p-4 sm:p-6">
            <app-vertex-model-garden-portal />
          </div>
        </div>
      </div>
    }

    <!-- Human Resources & Domain Specialist Agent-Wrangling Portal Modal Site -->
    @if (showTalentHrPortalModal()) {
      <div class="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-300 no-print" role="dialog" aria-modal="true" aria-labelledby="talent-portal-title">
        <div class="relative w-full max-w-7xl max-h-[92vh] bg-zinc-950 rounded-3xl shadow-2xl border border-teal-900/50 overflow-y-auto flex flex-col">
          <div class="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800">
            <div class="flex items-center gap-3">
              <span class="p-2 rounded-xl bg-teal-950/60 text-teal-400 text-lg border border-teal-500/30">🤝</span>
              <div>
                <h2 id="talent-portal-title" class="text-sm font-bold uppercase tracking-widest text-zinc-100">PocketGull Human Resources &amp; Domain Specialist Network</h2>
                <p class="text-xs text-zinc-400">Join the Team • Steer &amp; Wrangle Autonomous Clinical Agents • Regenerative Fellowships</p>
              </div>
            </div>
            <button (click)="showTalentHrPortalModal.set(false)" 
                    aria-label="Close Talent Portal"
                    class="px-3.5 py-1.5 bg-zinc-800 hover:bg-rose-600 text-zinc-200 hover:text-white rounded-full transition-colors font-bold text-xs cursor-pointer border border-zinc-700">
              ✕ Close Portal
            </button>
          </div>
          <div class="p-4 sm:p-6">
            <app-talent-hr-portal />
          </div>
        </div>
      </div>
    }

    <!-- Socratic Clinical Case Simulator & OSCE Flight Arena Modal -->
    @if (showOsceSimulatorModal()) {
      <div class="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-300 no-print" role="dialog" aria-modal="true" aria-labelledby="osce-modal-title">
        <div class="relative w-full max-w-7xl max-h-[92vh] bg-zinc-950 rounded-3xl shadow-2xl border border-teal-900/50 overflow-y-auto flex flex-col">
          <div class="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800">
            <div class="flex items-center gap-3">
              <span class="p-2 rounded-xl bg-teal-950/60 text-teal-400 text-lg border border-teal-500/30">🎓</span>
              <div>
                <h2 id="osce-modal-title" class="text-sm font-bold uppercase tracking-widest text-zinc-100">PocketGull Socratic Clinical Case Simulator</h2>
                <p class="text-xs text-zinc-400">Diagnostic Flight Simulator • Socratic Preceptor Guidance • Board Exam Evaluator</p>
              </div>
            </div>
            <button (click)="showOsceSimulatorModal.set(false)" 
                    aria-label="Close Case Simulator"
                    class="px-3.5 py-1.5 bg-zinc-800 hover:bg-rose-600 text-zinc-200 hover:text-white rounded-full transition-colors font-bold text-xs cursor-pointer border border-zinc-700">
              ✕ Close Simulator
            </button>
          </div>
          <div class="p-4 sm:p-6">
            <app-osce-case-simulator />
          </div>
        </div>
      </div>
    }

    <!-- WordPress Articles & 6th Grade / Bionic Knowledge Hub Modal -->
    @if (showArticlesModal()) {
      <div class="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 no-print animate-in fade-in duration-200">
        <div class="bg-zinc-950 text-zinc-100 w-full max-w-6xl max-h-[92dvh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-zinc-800 relative">
          <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/70 font-mono">
            <div class="flex items-center gap-2">
              <span class="text-xl">📰</span>
              <h2 class="text-sm font-bold uppercase tracking-wider text-white">Pocket-Gull Articles & Everyday Knowledge Hub</h2>
            </div>
            <button (click)="showArticlesModal.set(false)" class="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold transition cursor-pointer border border-zinc-700">
              ✕ Close
            </button>
          </div>
          <div class="flex-1 overflow-y-auto p-4 sm:p-6">
            <app-articles-reader />
          </div>
        </div>
      </div>
    }

    <!-- Preview & Print Modal (Dieter Rams Style) -->
    @if (showPreviewModal()) {
      <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 no-print">
        <div class="bg-[#f9f9f9] dark:bg-[#111111] w-full max-w-5xl max-h-[90dvh] rounded-[2px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-[0.98] duration-300 border border-gray-300 dark:border-zinc-800 relative print-medical-chart">
          
          <!-- Classic Dieter Rams Grill -->
          <div class="absolute top-0 left-0 right-0 h-1 flex gap-0.5 px-6 opacity-40">
             <div class="flex-1 bg-gray-400 dark:bg-zinc-600"></div><div class="flex-1 bg-gray-400 dark:bg-zinc-600"></div><div class="flex-1 bg-gray-400 dark:bg-zinc-600"></div><div class="flex-1 bg-gray-400 dark:bg-zinc-600"></div>
          </div>

          <!-- Header -->
          <div class="px-8 pt-6 pb-4 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-start bg-transparent">
            <div>
              <div class="flex items-center gap-3 mb-1">
                 <div class="w-2 h-2 rounded-full bg-[#ff4500] animate-pulse shadow-[0_0_8px_rgba(255,69,0,0.6)]"></div>
                 <h2 class="text-[12px] font-bold text-[#1C1C1C] dark:text-zinc-100 uppercase tracking-[0.2em] font-mono">Care Plan Archiver</h2>
              </div>
              <p class="text-[12px] uppercase font-bold text-gray-500 dark:text-zinc-400 tracking-[0.2em] ml-5">Review • Adjust • Finalize</p>
            </div>
            <button 
              (click)="closePreview()" 
              class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors text-gray-500"
              aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- Content Body -->
          <div class="flex-1 overflow-y-auto p-4 sm:p-8 bg-transparent relative">
              <div class="mb-8 flex flex-col gap-6 border-b border-gray-300 dark:border-zinc-700 pb-6">
                <!-- Cognitive level -->
                <div class="flex flex-col gap-3">
                  <div class="flex flex-col gap-1.5">
                    <h3 class="text-[12px] font-bold text-[#1C1C1C] dark:text-zinc-100 uppercase tracking-[0.3em]">Cognitive Output Level</h3>
                    <p class="text-[12px] text-gray-500 dark:text-zinc-400 uppercase tracking-widest font-mono">Select target patient comprehension</p>
                  </div>
                  
                  <div class="flex flex-wrap gap-1">
                    <!-- Dieter Rams Tabs -->
                    <button (click)="selectCognitiveLevel('standard')" [disabled]="isTranslating()"
                      class="px-4 py-2 border border-gray-300 dark:border-zinc-700 text-[12px] uppercase tracking-[0.2em] font-bold transition-all hover:bg-gray-100 dark:hover:bg-zinc-900"
                      [ngClass]="selectedCognitiveLevel() === 'standard' ? 'bg-[#1C1C1C] text-white dark:bg-white dark:text-[#111111] border-transparent shadow-sm' : 'bg-transparent text-gray-500'">
                      Standard
                    </button>
                    <button (click)="selectCognitiveLevel('dyslexia')" [disabled]="isTranslating()"
                      class="px-4 py-2 border border-gray-300 dark:border-zinc-700 text-[12px] uppercase tracking-[0.2em] font-bold transition-all hover:bg-gray-100 dark:hover:bg-zinc-900"
                      [ngClass]="selectedCognitiveLevel() === 'dyslexia' ? 'bg-[#ff4500] text-white border-transparent shadow-sm' : 'bg-transparent text-gray-500'">
                      Cognition (Dyslexia-Friendly)
                    </button>
                    <button (click)="selectCognitiveLevel('child')" [disabled]="isTranslating()"
                      class="px-4 py-2 border border-gray-300 dark:border-zinc-700 text-[12px] uppercase tracking-[0.2em] font-bold transition-all hover:bg-gray-100 dark:hover:bg-zinc-900"
                      [ngClass]="selectedCognitiveLevel() === 'child' ? 'bg-[#ff4500] text-white border-transparent shadow-sm' : 'bg-transparent text-gray-500'">
                      Pediatric (Child)
                    </button>
                  </div>
                </div>

                <!-- Language Translation -->
                <div class="flex flex-col gap-3">
                  <div class="flex flex-col gap-1.5">
                    <h3 class="text-[12px] font-bold text-[#1C1C1C] dark:text-zinc-100 uppercase tracking-[0.3em]">Language Translation</h3>
                    <p class="text-[12px] text-gray-500 dark:text-zinc-400 uppercase tracking-widest font-mono">Select target translation language</p>
                  </div>

                  <div class="flex flex-wrap gap-1 items-center">
                    <button (click)="selectLanguage('english')" [disabled]="isTranslating()"
                      class="px-4 py-2 border border-gray-300 dark:border-zinc-700 text-[12px] uppercase tracking-[0.2em] font-bold transition-all hover:bg-gray-100 dark:hover:bg-zinc-900"
                      [ngClass]="selectedLanguage() === 'english' && !showCustomLanguageInput() ? 'bg-[#1C1C1C] text-white dark:bg-white dark:text-[#111111] border-transparent shadow-sm' : 'bg-transparent text-gray-500'">
                      English
                    </button>
                    <button (click)="selectLanguage('spanish')" [disabled]="isTranslating()"
                      class="px-4 py-2 border border-gray-300 dark:border-zinc-700 text-[12px] uppercase tracking-[0.2em] font-bold transition-all hover:bg-gray-100 dark:hover:bg-zinc-900"
                      [ngClass]="selectedLanguage() === 'spanish' && !showCustomLanguageInput() ? 'bg-[#ff4500] text-white border-transparent shadow-sm' : 'bg-transparent text-gray-500'">
                      Spanish
                    </button>
                    <button (click)="selectLanguage('german')" [disabled]="isTranslating()"
                      class="px-4 py-2 border border-gray-300 dark:border-zinc-700 text-[12px] uppercase tracking-[0.2em] font-bold transition-all hover:bg-gray-100 dark:hover:bg-zinc-900"
                      [ngClass]="selectedLanguage() === 'german' && !showCustomLanguageInput() ? 'bg-[#ff4500] text-white border-transparent shadow-sm' : 'bg-transparent text-gray-500'">
                      German
                    </button>
                    <button (click)="selectLanguage('french')" [disabled]="isTranslating()"
                      class="px-4 py-2 border border-gray-300 dark:border-zinc-700 text-[12px] uppercase tracking-[0.2em] font-bold transition-all hover:bg-gray-100 dark:hover:bg-zinc-900"
                      [ngClass]="selectedLanguage() === 'french' && !showCustomLanguageInput() ? 'bg-[#ff4500] text-white border-transparent shadow-sm' : 'bg-transparent text-gray-500'">
                      French
                    </button>
                    <button (click)="selectLanguage('japanese')" [disabled]="isTranslating()"
                      class="px-4 py-2 border border-gray-300 dark:border-zinc-700 text-[12px] uppercase tracking-[0.2em] font-bold transition-all hover:bg-gray-100 dark:hover:bg-zinc-900"
                      [ngClass]="selectedLanguage() === 'japanese' && !showCustomLanguageInput() ? 'bg-[#ff4500] text-white border-transparent shadow-sm' : 'bg-transparent text-gray-500'">
                      Japanese
                    </button>
                    <button (click)="selectLanguage('hindi')" [disabled]="isTranslating()"
                      class="px-4 py-2 border border-gray-300 dark:border-zinc-700 text-[12px] uppercase tracking-[0.2em] font-bold transition-all hover:bg-gray-100 dark:hover:bg-zinc-900"
                      [ngClass]="selectedLanguage() === 'hindi' && !showCustomLanguageInput() ? 'bg-[#ff4500] text-white border-transparent shadow-sm' : 'bg-transparent text-gray-500'">
                      Hindi
                    </button>
                    <button (click)="toggleCustomLanguageInput()" [disabled]="isTranslating()"
                      class="px-4 py-2 border border-gray-300 dark:border-zinc-700 text-[12px] uppercase tracking-[0.2em] font-bold transition-all hover:bg-gray-100 dark:hover:bg-zinc-900"
                      [ngClass]="showCustomLanguageInput() ? 'bg-[#ff4500] text-white border-transparent shadow-sm' : 'bg-transparent text-gray-500'">
                      Other...
                    </button>
                  </div>

                  <!-- Custom Language Input Field -->
                  @if (showCustomLanguageInput()) {
                    <div class="mt-2 flex gap-2 max-w-xs animate-in fade-in slide-in-from-top-1 duration-200">
                      <input type="text" 
                             [value]="customLanguage()" 
                             (input)="onCustomLanguageChange($event)"
                             placeholder="Enter language (e.g. Italian)"
                             class="flex-1 px-3 py-1.5 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[12px] text-gray-800 dark:text-gray-100 uppercase tracking-wider font-semibold rounded-none focus:outline-none focus:border-[#ff4500]" />
                      <button (click)="applyCustomLanguage()" 
                              [disabled]="isTranslating() || !customLanguage().trim()"
                              class="px-4 py-1.5 bg-[#1C1C1C] dark:bg-white text-white dark:text-[#111111] text-[12px] uppercase tracking-wider font-bold hover:bg-[#ff4500] dark:hover:bg-[#ff4500] dark:hover:text-white transition-all">
                        Apply
                      </button>
                    </div>
                  }
                </div>

                <!-- Animal Comfort Protocols & Service Animal Healing Suite -->
                <div class="mt-6 p-6 border-2 border-amber-500/30 dark:border-amber-500/40 rounded-md bg-amber-50/20 dark:bg-amber-950/15 shadow-sm text-center flex flex-col items-center max-w-2xl mx-auto w-full">
                  
                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-2xl animate-bounce">🐕</span>
                    <span class="font-mono text-[10px] font-extrabold uppercase tracking-widest text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800">
                      Service Animal & Pet Co-Regulation
                    </span>
                  </div>

                  <h3 class="text-sm font-extrabold text-slate-900 dark:text-zinc-100 uppercase tracking-wider mb-2">
                    Is a service dog, therapy animal, or comforting companion in the room helping you heal right now?
                  </h3>

                  <p class="text-xs text-slate-600 dark:text-zinc-400 max-w-lg leading-relaxed mb-4 font-medium">
                    Auditory purring, canine baroreflex frequency entrainment, cetacean acoustic bio-waves, and soothing avian bio-sonics can actively synchronize with your companion animal to lower stress, calm heart rate variability, and accelerate healing.
                  </p>

                  <div class="flex flex-wrap items-center justify-center gap-3 w-full">
                    <button (click)="petAuditory.playCanineHeartbeat()" 
                      [ngClass]="petAuditory.currentMode === 'canine' ? 'bg-amber-600 text-white border-amber-700 shadow-md scale-105' : 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 border-slate-300 dark:border-zinc-700 hover:border-amber-500'"
                      class="min-h-[48px] px-5 py-2.5 text-[12px] uppercase tracking-wider font-extrabold rounded-md border transition-all flex items-center gap-2.5 cursor-pointer">
                      <span>🐕</span>
                      <span>Canine Service Comfort</span>
                    </button>
                    <button (click)="petAuditory.playFelinePurr()"
                      [ngClass]="petAuditory.currentMode === 'feline' ? 'bg-emerald-600 text-white border-emerald-700 shadow-md scale-105' : 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 border-slate-300 dark:border-zinc-700 hover:border-emerald-500'"
                      class="min-h-[48px] px-5 py-2.5 text-[12px] uppercase tracking-wider font-extrabold rounded-md border transition-all flex items-center gap-2.5 cursor-pointer">
                      <span>🐈</span>
                      <span>Feline Purr Therapy</span>
                    </button>
                    <button (click)="petAuditory.playCetaceanTherapy()"
                      [ngClass]="petAuditory.currentMode === 'cetacean' ? 'bg-sky-600 text-white border-sky-700 shadow-md scale-105' : 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 border-slate-300 dark:border-zinc-700 hover:border-sky-500'"
                      class="min-h-[48px] px-5 py-2.5 text-[12px] uppercase tracking-wider font-extrabold rounded-md border transition-all flex items-center gap-2.5 cursor-pointer">
                      <span>🐬</span>
                      <span>Cetacean Acoustic Bio-Waves</span>
                    </button>
                    <button (click)="petAuditory.playAvianTherapy()"
                      [ngClass]="petAuditory.currentMode === 'avian' ? 'bg-indigo-600 text-white border-indigo-700 shadow-md scale-105' : 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 border-slate-300 dark:border-zinc-700 hover:border-indigo-500'"
                      class="min-h-[48px] px-5 py-2.5 text-[12px] uppercase tracking-wider font-extrabold rounded-md border transition-all flex items-center gap-2.5 cursor-pointer">
                      <span>🦜</span>
                      <span>Avian Dawn Chorus</span>
                    </button>
                    @if(petAuditory.isCurrentlyPlaying) {
                      <button (click)="petAuditory.stop()" class="min-h-[48px] px-5 py-2.5 text-[12px] uppercase tracking-wider font-extrabold rounded-md border border-red-500/80 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-all flex items-center gap-2 cursor-pointer">
                        <span>⏹</span>
                        <span>Pause Animal Audio</span>
                      </button>
                    }
                  </div>
                </div>

              </div>

              <!-- PRINT STRATEGY OPTIONS -->
              @if (selectedReadingLevel() !== 'standard') {
                <div class="mb-8 animate-in fade-in slide-in-from-top-2 duration-500">
                  <div class="flex flex-wrap items-center gap-6 p-4 bg-white/50 dark:bg-[#1C1C1C]/50 border border-gray-300 dark:border-zinc-700 rounded-[2px]">
                    <div class="flex items-center gap-3">
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" [checked]="includeAnalysisInPrint()" (change)="toggleAnalysisInPrint()" class="sr-only peer">
                        <div class="w-8 h-4 bg-gray-300 peer-focus:outline-none rounded-none peer dark:bg-zinc-800 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-400 after:border after:rounded-none after:h-3 after:w-3.5 after:transition-all dark:border-zinc-600 peer-checked:bg-[#1C1C1C] dark:peer-checked:bg-white"></div>
                      </label>
                      <span class="text-[12px] font-bold text-[#1C1C1C] dark:text-zinc-300 uppercase tracking-widest font-mono">Include AI Analysis</span>
                    </div>

                    <div class="flex items-center gap-3">
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" [checked]="includeOriginalInPrint()" (change)="toggleOriginalInPrint()" class="sr-only peer">
                        <div class="w-8 h-4 bg-gray-300 peer-focus:outline-none rounded-none peer dark:bg-zinc-800 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-400 after:border after:rounded-none after:h-3 after:w-3.5 after:transition-all dark:border-zinc-600 peer-checked:bg-[#1C1C1C] dark:peer-checked:bg-white"></div>
                      </label>
                      <span class="text-[12px] font-bold text-[#1C1C1C] dark:text-zinc-300 uppercase tracking-widest font-mono">Include Original</span>
                    </div>
                  </div>
                </div>
              }
             
              <div class="relative grid gap-8 transition-all duration-300" [class.grid-cols-1]="selectedReadingLevel() === 'standard'" [class.sm:grid-cols-2]="selectedReadingLevel() !== 'standard'">
               
               <!-- Original English -->
               @if (selectedReadingLevel() !== 'standard') {
                 <div class="flex flex-col gap-2 animate-in fade-in slide-in-from-left-4 duration-300">
                    <label class="text-[12px] font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-[0.2em] font-mono border-b border-gray-300 dark:border-zinc-700 pb-1">Original Active Plan</label>
                    <pocket-gull-input
                      type="textarea"
                      [rows]="20"
                      [value]="originalPreviewText()"
                      (valueChange)="originalPreviewText.set($event)"
                      [disabled]="isTranslating()"
                      placeholder="No Active Care Plan recorded for this visit."
                      class="w-full shadow-inner opacity-70 hover:opacity-100 transition-opacity">
                    </pocket-gull-input>
                 </div>
               } @else {
                 <div class="flex flex-col gap-2 relative">
                    <label class="text-[12px] font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-[0.2em] font-mono border-b border-gray-300 dark:border-zinc-700 pb-1">Original Active Care Plan</label>
                    <pocket-gull-input
                      type="textarea"
                      [rows]="20"
                      [value]="originalPreviewText()"
                      [disabled]="true"
                      placeholder="No Active Care Plan recorded for this visit."
                      class="w-full h-full opacity-60 pointer-events-none">
                    </pocket-gull-input>
                 </div>
               }

               <!-- Translated Plan -->
               <div class="flex flex-col gap-2 relative">
                  @if (selectedReadingLevel() !== 'standard') {
                     <label class="text-[12px] font-bold text-[#ff4500] uppercase tracking-[0.2em] font-mono border-b border-[#ff4500] pb-1 animate-in fade-in duration-300 flex justify-between items-center">
                       <span>Translated / Adjusted Plan</span>
                       <span class="w-1.5 h-1.5 bg-[#ff4500] rounded-full inline-block animate-pulse"></span>
                     </label>
                  }
                  <pocket-gull-input
                    type="textarea"
                    [rows]="20"
                    [value]="previewText()"
                    (valueChange)="previewText.set($event)"
                    [disabled]="isTranslating()"
                    placeholder="No Active Care Plan recorded for this visit."
                    class="w-full bg-white dark:bg-[#09090b] shadow-lg"
                    [class.dyslexia-textarea]="selectedReadingLevel() === 'dyslexia'">
                  </pocket-gull-input>
               </div>
               
               @if (isTranslating()) {
                 <div class="absolute inset-x-0 inset-y-8 bg-white/80 dark:bg-[#111111]/80 backdrop-blur-[2px] flex flex-col items-center justify-center z-10 rounded-sm">
                    <div class="w-8 h-8 border-[3px] border-gray-200 border-t-[#ff4500] rounded-full animate-spin shadow-lg"></div>
                    <p class="mt-4 text-[12px] font-bold text-[#ff4500] uppercase tracking-[0.3em] font-mono animate-pulse">Processing Translation</p>
                 </div>
               }
               @if (translationError()) {
                  <div class="absolute bottom-4 left-4 right-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-[12px] font-bold text-red-600 dark:text-red-400 uppercase tracking-[0.1em] font-mono shadow-md flex items-center gap-2 z-20">
                    <div class="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                    System Error: {{ translationError() }}
                  </div>
               }
             </div>
             
             <!-- TRANSLATION ANALYSIS UI -->
             @if (selectedReadingLevel() !== 'standard') {
               <div class="mt-8 pt-6 border-t border-gray-300 dark:border-zinc-700 animate-in fade-in duration-500">
                  <div class="flex flex-col gap-3 mb-2">
                    <div class="flex justify-between items-end border-b border-gray-200 dark:border-zinc-800 pb-2">
                      <h4 class="text-[12px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-[0.3em] font-mono">Structural Analysis</h4>
                      <button 
                        (click)="analyzeCurrentTranslation()" 
                        [disabled]="isAnalyzingTranslation() || isTranslating()"
                        class="px-4 py-1.5 border border-gray-300 dark:border-zinc-700 text-[12px] uppercase tracking-[0.2em] font-bold transition-all text-[#1C1C1C] dark:text-zinc-100 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                        @if (isAnalyzingTranslation()) {
                          <div class="w-2.5 h-2.5 border-2 border-gray-400 border-t-[#1C1C1C] rounded-full animate-spin"></div>
                          Analyzing...
                        } @else {
                          Analyze Translation Matrix
                        }
                      </button>
                    </div>
                    @if (translationAnalysis()) {
                      <div class="p-4 sm:p-6 bg-white dark:bg-[#09090b] shadow-inner border border-gray-200 dark:border-zinc-800 text-[12px] leading-relaxed text-gray-800 dark:text-zinc-300 font-mono animate-in slide-in-from-top-4 duration-500 whitespace-pre-wrap">
                         {{ translationAnalysis() }}
                      </div>
                    }
                  </div>
               </div>
             }
             
             <div class="mt-8 flex justify-center opacity-40">
                <p class="text-[12px] font-mono uppercase tracking-[0.4em]">Final Output Target: Medical Chart Archive</p>
             </div>
          </div>
          
          <!-- Footer -->
          <div class="px-8 py-5 border-t border-gray-300 dark:border-zinc-800 bg-gray-50/50 dark:bg-[#09090b]/50 flex justify-between items-center mt-auto">
            <div class="flex items-center gap-3">
              <button 
                (click)="printReport()" 
                class="px-5 py-2.5 border border-[#1C1C1C] dark:border-zinc-600 text-[#1C1C1C] dark:text-zinc-100 bg-transparent text-[12px] font-bold uppercase tracking-[0.2em] transition-all hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-2 rounded-[2px]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"/></svg>
                Print Document
              </button>
              <button 
                (click)="exportLaafHapticFhir()" 
                title="Export FHIR R4 Bundle containing LAAF Vagal & 40Hz Gamma Haptic Schedules"
                class="px-4 py-2.5 border border-sky-500/50 text-sky-700 dark:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 text-[12px] font-extrabold uppercase tracking-[0.15em] transition-all flex items-center gap-1.5 rounded-[2px] cursor-pointer">
                <span>⚡ Export LAAF Haptic FHIR</span>
              </button>
            </div>
            <div class="flex items-center gap-4">
              <button 
                (click)="closePreview()" 
                class="px-4 py-2 text-gray-500 hover:text-[#1C1C1C] dark:hover:text-white text-[12px] font-bold uppercase tracking-[0.2em] transition-colors">
                Cancel
              </button>
              <button 
                (click)="confirmFinalize()" 
                class="px-8 py-3 bg-[#1C1C1C] dark:bg-white text-white dark:text-[#111111] text-[12px] font-bold uppercase tracking-[0.3em] font-mono hover:bg-black dark:hover:bg-gray-200 transition-all flex items-center gap-2 rounded-[2px] shadow-md active:translate-y-[1px]">
                Commit to Chart
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    }
    @if (showDoctorShiftSalesDemoModal()) {
      <app-doctor-shift-sales-demo (closeModal)="showDoctorShiftSalesDemoModal.set(false)"></app-doctor-shift-sales-demo>
    }
    @if (showGreenRoomLoungeModal()) {
      <app-green-room-lounge (closeModal)="showGreenRoomLoungeModal.set(false)"></app-green-room-lounge>
    }
    @if (showAmbientLivingSpaceModal()) {
      <app-ambient-living-space-dashboard (closeModal)="showAmbientLivingSpaceModal.set(false)"></app-ambient-living-space-dashboard>
    }
    @if (showHumanDignityPactModal()) {
      <app-human-dignity-pact (closeModal)="showHumanDignityPactModal.set(false)"></app-human-dignity-pact>
    }
    @if (showAustereHudModal() || navShell.showAustereHudModal()) {
      <div class="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200 no-print" role="dialog" aria-modal="true" aria-labelledby="austere-modal-title">
        <app-austere-research-hud (close)="showAustereHudModal.set(false); navShell.closeAustereHud()"></app-austere-research-hud>
      </div>
    }
    <app-clinical-cds-disclaimer-banner></app-clinical-cds-disclaimer-banner>
    <app-zamecznik-canvas></app-zamecznik-canvas>
  `,
  styles: [`
    :host { display: block; min-height: 100%; }
    @keyframes intro-fullscreen {
      0% { opacity: 0; transform: translateY(20px); }
      100% { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class AppComponent implements OnDestroy {
  private secureStorage = inject(SecureStorageService);
  showTypefaceSite = signal(false);
  showDocsStudy = signal(false);
  showBillingDashboard = signal(false);
  showApiPricing = signal(false);
  showPatientPortal = signal(false);
  showClinicianOnboarding = signal(false);
  showModelGardenModal = signal(false);
  showTalentHrPortalModal = signal(false);
  showOsceSimulatorModal = signal(false);
  showSmartHealthPassModal = signal(false);
  showAmbientLivingSpaceModal = signal(false);
  showHumanDignityPactModal = signal(false);
  showDoctorShiftSalesDemoModal = signal(false);
  showGreenRoomLoungeModal = signal(false);
  showAustereHudModal = signal(false);
  readonly showGlossaryModal = signal<boolean>(false);
  private _translateTimer: ReturnType<typeof setTimeout> | null = null;
  readonly zamecznikCanvas = viewChild(ZamecznikCanvasComponent);

  @HostListener('window:close-docs-study')
  onCloseDocsStudy() {
    this.showDocsStudy.set(false);
  }

  triggerSomaticGrounding(): void {
    this.zamecznikCanvas()?.open();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('somatic-grounding-activate'));
    }
  }

  private debouncedTranslate(text: string, level: string) {
    if (this._translateTimer) {
      clearTimeout(this._translateTimer);
    }
    if (level === 'standard') return;
    const target = level as 'simplified' | 'dyslexia' | 'child';
    this._translateTimer = setTimeout(async () => {
      this.isTranslating.set(true);
      try {
        const translated = await this.clinicalIntelligence.translateReadingLevel(text, target);
        this.previewText.set(translated);
        await this.analyzeCurrentTranslation();
      } catch (error) {
        console.error("Auto-translation failed", error);
        this.translationError.set("Failed to translate plan. Please retry.");
      } finally {
        this.isTranslating.set(false);
      }
    }, 300);
  }

  public navShell = inject(NavigationShellService);
  public tour = inject(WalkthroughTourService);
  public readonly petAuditory = inject(PetAuditoryService);
  private readonly stressIntervention = inject(StressInterventionService);
  public readonly collaboration = inject(CollaborationService);
  patientDropdown = viewChild(PatientDropdownComponent);
  state = inject(PatientStateService);
  public theme = inject(ThemeService);
  public game = inject(GamificationService);
  private ngZone = inject(NgZone);


  public patientMgmt = inject(PatientManagementService);
  private clinicalIntelligence = inject(ClinicalIntelligenceService);
  network = inject(NetworkStateService);
  consentService = inject(ConsentService);
  hardware = inject(HardwareTelemetryService);
  readonly rules = inject(RulesEngineService);
  private aiConfig = inject(AI_CONFIG, { optional: true });
  today = new Date();
  hasApiKey = signal<boolean>(!!this.aiConfig?.apiKey);
  showSplash = computed(() => {
    const locked = this.session.isLocked();
    const emergency = this.state.isEmergencyMode();
    return locked && !emergency;
  });
  isDemoMode = this.state.isDemoMode;
  readonly showCompanionSyncModal = signal<boolean>(false);
  readonly showSupportTicketModal = signal<boolean>(false);
  readonly showArticlesModal = signal<boolean>(false);
  readonly showPatentClaimsModal = signal<boolean>(false);
  readonly showLicensingModal = signal<boolean>(false);
  readonly showNantucketCaseStudy = signal<boolean>(false);
  readonly showTestimonialsModal = signal<boolean>(false);
  licensing = inject(AppLicensingGuardService);
  readonly showHeaderThemeMenu = signal<boolean>(false);
  apiKeyInput = signal<string>('');
  showPassword = signal<boolean>(false);
  apiKeyError = signal<string | null>(null);
  isChartCollapsed = signal<boolean>(false);
  isAnalysisCollapsed = signal<boolean>(false);
  showFhirCallback = signal<boolean>(false);
  showAnalysisPdf = signal<boolean>(false);

  export = inject(ExportService);
  showExportMenu = signal(false);
  isSimplifying = signal(false);
  isSimplifyingChild = signal(false);

  // Google Health (GCP Healthcare FHIR Store) Sync State
  isGHealthSyncing = signal<boolean>(false);
  showGHealthSuccess = signal<boolean>(false);
  showGHealthError = signal<string | null>(null);

  // AWS HealthLake Sync State
  isAwsSyncing = signal<boolean>(false);
  showAwsSuccess = signal<boolean>(false);
  showAwsError = signal<string | null>(null);



  // Finalize & Archive State
  showPreviewModal = signal(false);
  previewText = signal('');
  originalPreviewText = signal('');
  selectedReadingLevel = signal<string>('standard');
  selectedCognitiveLevel = signal<'standard' | 'simplified' | 'dyslexia' | 'child'>('standard');
  selectedLanguage = signal<string>('english');
  customLanguage = signal<string>('');
  showCustomLanguageInput = signal<boolean>(false);
  isTranslating = signal<boolean>(false);
  translationAnalysis = signal<string>('');
  isAnalyzingTranslation = signal(false);
  translationError = signal<string | null>(null);
  includeAnalysisInPrint = signal<boolean>(true);
  includeOriginalInPrint = signal<boolean>(true);

  // Navbar Dropdown States
  exportMenuOpen = signal(false);
  connectMenuOpen = signal(false);
  isDirectoryOpen = signal(false);

  hasReport = computed(() => Object.keys(this.clinicalIntelligence.analysisResults()).length > 0);

  exportPdf() {
    const results = this.clinicalIntelligence.analysisResults();
    const patient = this.patientMgmt.selectedPatient();
    const patientName = patient?.name || 'Clinical User';

    this.export.downloadAsPdf({
      report: results,
      summary: results['Summary Overview'] || 'No summary available.'
    }, patientName);
  }

  async exportSimplifiedPdf() {
    this.isSimplifying.set(true);
    this.rules.setContext('dyslexia_mode', true);
    try {
      const results = this.clinicalIntelligence.analysisResults();
      const patient = this.patientMgmt.selectedPatient();
      const patientName = patient?.name || 'Clinical User';

      const originalSummary = results['Summary Overview'] || 'No summary available.';
      const simplifiedSummary = await this.clinicalIntelligence.translateReadingLevel(originalSummary, 'dyslexia');

      this.export.downloadAsPdf({
        report: results,
        summary: simplifiedSummary
      }, patientName + ' (Cognition)');
    } catch (e) {
      console.error("Failed to generate simplified PDF", e);
      alert("Failed to generated simplified export. " + (e as Error).message);
    } finally {
      this.rules.setContext('dyslexia_mode', false);
      this.isSimplifying.set(false);
    }
  }

  async exportChildPdf() {
    this.isSimplifyingChild.set(true);
    this.rules.setContext('pediatric_mode', true);
    try {
      const results = this.clinicalIntelligence.analysisResults();
      const patient = this.patientMgmt.selectedPatient();
      const patientName = patient?.name || 'Clinical User';

      const originalSummary = results['Summary Overview'] || 'No summary available.';
      const simplifiedSummary = await this.clinicalIntelligence.translateReadingLevel(originalSummary, 'child');

      this.export.downloadAsPdf({
        report: results,
        summary: simplifiedSummary
      }, patientName + ' (Pediatric Overview)');
    } catch (e) {
      console.error("Failed to generate child PDF", e);
      alert("Failed to generated child export. " + (e as Error).message);
    } finally {
      this.rules.setContext('pediatric_mode', false);
      this.isSimplifyingChild.set(false);
    }
  }

  exportFhir() {
    const patient = this.patientMgmt.selectedPatient();
    if (patient) {
      this.export.downloadAsFhirBundle(patient);
    } else {
      // Fallback
      const results = this.clinicalIntelligence.analysisResults();
      this.export.downloadAsFhir({
        report: results,
        summary: results['Summary Overview']
      }, 'Clinical User');
    }
  }

  exportFhirR4Bundle() {
    const patient = this.patientMgmt.selectedPatient();
    if (patient) {
      this.export.downloadFhirR4Bundle(patient);
    }
  }

  exportLaafHapticFhir() {
    const patient = this.patientMgmt.selectedPatient();
    this.export.downloadLaafHapticScheduleBundle(patient);
    this.exportMenuOpen.set(false);
  }

  exportJson() {
    const patient = this.patientMgmt.selectedPatient();
    if (patient) {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(patient, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", patient.id + ".json");
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    }
  }

  connectEpic() {
    alert("Epic Integration placeholder: Connecting to Epic MyChart...");
  }

  async connectGoogleHealth() {
    const patient = this.patientMgmt.selectedPatient();
    if (!patient) {
      alert("No patient selected to sync to Google Health FHIR Store.");
      return;
    }

    this.isGHealthSyncing.set(true);
    this.showGHealthSuccess.set(false);
    this.showGHealthError.set(null);

    try {
      const response = await fetch('/api/healthcare/fhir/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(patient)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Sync failed with status code ${response.status}`);
      }

      const result = await response.json();
      console.log('[Google Health Sync] Success:', result);
      this.showGHealthSuccess.set(true);
      setTimeout(() => this.showGHealthSuccess.set(false), 5000);
    } catch (e: any) {
      console.error('[Google Health Sync] Error:', e);
      this.showGHealthError.set(e.message || 'An error occurred during synchronization.');
      setTimeout(() => this.showGHealthError.set(null), 8000);
    } finally {
      this.isGHealthSyncing.set(false);
    }
  }

  async importGoogleHealth() {
    const patient = this.patientMgmt.selectedPatient();
    if (!patient) {
      alert("No patient selected to import data from Google Health.");
      return;
    }

    this.isGHealthSyncing.set(true);
    this.showGHealthSuccess.set(false);
    this.showGHealthError.set(null);

    try {
      let response = await fetch(`/api/healthcare/fhir/import/${patient.id}`, {
        method: 'GET'
      });

      if (!response.ok && response.status === 404) {
        console.log('[Google Health Import] IPatient not found in FHIR Store. Auto-provisioning patient record first...');
        // Auto-provision (export) local patient details
        const exportRes = await fetch('/api/healthcare/fhir/export', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(patient)
        });
        if (!exportRes.ok) {
          const exportErr = await exportRes.json().catch(() => ({}));
          throw new Error(exportErr.error || `Auto-provisioning failed with status ${exportRes.status}`);
        }
        
        // Retry the import
        response = await fetch(`/api/healthcare/fhir/import/${patient.id}`, {
          method: 'GET'
        });
      }

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Import failed with status code ${response.status}`);
      }

      const result = await response.json();
      console.log('[Google Health Import] Success:', result);
      
      // Update our local patient state registry
      this.patientMgmt.importPatient(result.patient);
      
      this.showGHealthSuccess.set(true);
      setTimeout(() => this.showGHealthSuccess.set(false), 5000);
    } catch (e: any) {
      console.error('[Google Health Import] Error:', e);
      this.showGHealthError.set(e.message || 'An error occurred during import.');
      setTimeout(() => this.showGHealthError.set(null), 8000);
    } finally {
      this.isGHealthSyncing.set(false);
    }
  }

  async connectAwsHealth() {
    const patient = this.patientMgmt.selectedPatient();
    if (!patient) {
      alert("No patient selected to sync to AWS HealthLake FHIR Store.");
      return;
    }

    this.isAwsSyncing.set(true);
    this.showAwsSuccess.set(false);
    this.showAwsError.set(null);

    try {
      const response = await fetch('/api/aws/healthlake/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(patient)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Sync failed with status code ${response.status}`);
      }

      const result = await response.json();
      console.log('[AWS HealthLake Sync] Success:', result);
      this.showAwsSuccess.set(true);
      setTimeout(() => this.showAwsSuccess.set(false), 5000);
    } catch (e: any) {
      console.error('[AWS HealthLake Sync] Error:', e);
      this.showAwsError.set(e.message || 'An error occurred during synchronization.');
    } finally {
      this.isAwsSyncing.set(false);
    }
  }

  @HostListener('window:close-docs-study')
  handleCloseDocsStudy() {
    this.showDocsStudy.set(false);
  }




  connectAppleHealth() {
    alert("Apple HealthKit: Awaiting sync from iOS Companion App...");
  }

  uploadData() {
    const dropdown = this.patientDropdown();
    if (dropdown) {
      dropdown.triggerImport();
    } else {
      const fileInput = document.querySelector('app-patient-dropdown input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
        fileInput.click();
      } else {
        alert("Upload data modal placeholder");
      }
    }
  }

  openFinalizePreview() {
    let plan = this.state.activePatientSummary();
    if (!plan) {
      const results = this.clinicalIntelligence.analysisResults();
      const annotations = this.state.lensAnnotations();
      
      if (Object.keys(results).length > 0) {
        plan = Object.entries(results).map(([lens, text]) => {
          let updatedText = text;
          const lensAnnots = annotations[lens];
          if (lensAnnots) {
            for (const [nodeKey, ann] of Object.entries(lensAnnots)) {
              if (ann.bracketState === 'removed') {
                updatedText = updatedText.replace(nodeKey, `~~${nodeKey}~~`);
              } else if (ann.modifiedText) {
                updatedText = updatedText.replace(nodeKey, ann.modifiedText);
              }
            }
          }
          return updatedText;
        }).join('\n\n');
      } else {
        plan = '';
      }
    }

    const draftItems = this.state.draftSummaryItems();
    if (draftItems.length > 0) {
      const newContent = draftItems.map(item => `- ${item.text}`).join('\n');
      plan = plan ? `${plan}\n\n### ${ClinicalIcons.Suggestion} Draft Notes\n${newContent}` : `### ${ClinicalIcons.Suggestion} Draft Notes\n${newContent}`;
    }

    const checklist = this.state.checklist();
    if (checklist.length > 0) {
      const clContent = checklist.map(item => `- [${item.completed ? 'x' : ' '}] ${item.text}`).join('\n');
      plan = plan ? `${plan}\n\n### ${ClinicalIcons.Assessment} Care Plan Instructions\n${clContent}` : `### ${ClinicalIcons.Assessment} Care Plan Instructions\n${clContent}`;
    }

    const dynamicNutrients = this.state.dynamicNutrients();
    if (dynamicNutrients.length > 0) {
      const tnContent = dynamicNutrients.map(item => `- **${item.name}**: ${item.value}`).join('\n');
      plan = plan ? `${plan}\n\n### ${ClinicalIcons.Risk} Targeted Nutrients\n${tnContent}` : `### ${ClinicalIcons.Risk} Targeted Nutrients\n${tnContent}`;
    }

    const oxStress = this.state.oxidativeStressMarkers();
    if (oxStress.length > 0) {
      const oxContent = oxStress.map(item => `- **${item.name}**: ${item.value}`).join('\n');
      plan = plan ? `${plan}\n\n### ${ClinicalIcons.EvidenceFocus} Oxidative Stress Markers\n${oxContent}` : `### ${ClinicalIcons.EvidenceFocus} Oxidative Stress Markers\n${oxContent}`;
    }

    const antiox = this.state.antioxidantSources();
    if (antiox.length > 0) {
      const antioxContent = antiox.map(item => `- **${item.name}**: ${item.value}`).join('\n');
      plan = plan ? `${plan}\n\n### ${ClinicalIcons.FollowUp} Antioxidant Sources\n${antioxContent}` : `### ${ClinicalIcons.FollowUp} Antioxidant Sources\n${antioxContent}`;
    }

    const meds = this.state.medications();
    if (meds.length > 0) {
      const medsContent = meds.map(item => `- **${item.name}**: ${item.value}`).join('\n');
      plan = plan ? `${plan}\n\n### ${ClinicalIcons.Medication} Medications\n${medsContent}` : `### ${ClinicalIcons.Medication} Medications\n${medsContent}`;
    }
    
    const finalText = plan || 'No Active Patient Summary recorded for this visit.';
    this.previewText.set(finalText);
    this.originalPreviewText.set(finalText);
    this.selectedReadingLevel.set('standard');
    this.selectedCognitiveLevel.set('standard');
    this.selectedLanguage.set('english');
    this.customLanguage.set('');
    this.showCustomLanguageInput.set(false);
    this.showPreviewModal.set(true);
  }

  closePreview() {
    this.showPreviewModal.set(false);
  }

  selectCognitiveLevel(level: 'standard' | 'simplified' | 'dyslexia' | 'child') {
    this.selectedCognitiveLevel.set(level);
    this.state.selectedCognitiveLevel.set(level);
    this.updateReadingLevelAndTranslate();
  }

  selectLanguage(lang: string) {
    this.selectedLanguage.set(lang);
    this.showCustomLanguageInput.set(false);
    this.updateReadingLevelAndTranslate();
  }

  toggleCustomLanguageInput() {
    this.showCustomLanguageInput.update(v => !v);
    if (!this.showCustomLanguageInput()) {
      // Revert to English if closed
      this.selectedLanguage.set('english');
      this.updateReadingLevelAndTranslate();
    }
  }

  onCustomLanguageChange(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.customLanguage.set(val);
  }

  applyCustomLanguage() {
    if (this.customLanguage().trim()) {
      this.updateReadingLevelAndTranslate();
    }
  }

  async updateReadingLevelAndTranslate() {
    const cog = this.selectedCognitiveLevel();
    const lang = this.showCustomLanguageInput() ? this.customLanguage() : this.selectedLanguage();
    
    let displayLevel = '';
    if (cog === 'standard' && lang.toLowerCase() === 'english') {
      displayLevel = 'standard';
    } else {
      displayLevel = `${cog} in ${lang}`;
    }
    this.selectedReadingLevel.set(displayLevel);

    this.translationAnalysis.set('');
    this.translationError.set(null);

    if (cog === 'standard' && lang.toLowerCase() === 'english') {
      this.previewText.set(this.originalPreviewText());
      return;
    }

    this.isTranslating.set(true);
    try {
      const translated = await this.clinicalIntelligence.translateReadingLevel(
        this.originalPreviewText(),
        undefined,
        cog,
        lang
      );
      this.previewText.set(translated);
      await this.analyzeCurrentTranslation();
    } catch (error) {
      console.warn("API Translation unavailable, generating deterministic cognitive transformation fallback", error);
      const fallback = this.generateCognitiveFallback(this.originalPreviewText(), cog, lang);
      this.previewText.set(fallback);
      this.translationAnalysis.set(`Cognitive Level: [${cog.toUpperCase()}] • Target Language: [${lang.toUpperCase()}] (Deterministic Local Adapter)`);
    } finally {
      this.isTranslating.set(false);
    }
  }

  private generateCognitiveFallback(text: string, cog: 'standard' | 'simplified' | 'dyslexia' | 'child', lang: string): string {
    const header = `--- CLINICAL CARE PLAN [COGNITIVE FORMAT: ${cog.toUpperCase()} | LANG: ${lang.toUpperCase()}] ---\n\n`;
    let body = text;

    if (cog === 'dyslexia') {
      body = body.split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => `• **${line.substring(0, Math.min(line.length, 30))}** ${line.substring(Math.min(line.length, 30))}`)
        .join('\n\n');
    } else if (cog === 'child') {
      body = `🌟 **Your Health Adventure Plan** 🌟\n\n` + 
        body.replace(/patient/gi, 'hero')
            .replace(/symptoms/gi, 'body signals')
            .replace(/medication/gi, 'superpower helper drops')
            .replace(/vitals/gi, 'heart & energy scores');
    } else if (cog === 'simplified') {
      body = body.replace(/radiculopathy/gi, 'nerve pain')
        .replace(/hypertension/gi, 'high blood pressure')
        .replace(/inflammation/gi, 'swelling & soreness');
    }

    return header + body;
  }

  async changeReadingLevel(levelOrEvent: string | Event) {
    // Keep for backward compatibility with old selectors or external events
    let level = 'standard';
    if (typeof levelOrEvent === 'string') {
      level = levelOrEvent;
    } else {
      level = (levelOrEvent.target as HTMLSelectElement).value;
    }

    if (['simplified', 'dyslexia', 'child'].includes(level)) {
      this.selectedCognitiveLevel.set(level as any);
    } else if (level !== 'standard') {
      this.selectedLanguage.set(level);
    } else {
      this.selectedCognitiveLevel.set('standard');
      this.selectedLanguage.set('english');
    }
    await this.updateReadingLevelAndTranslate();
  }

  toggleAnalysisInPrint() {
    this.includeAnalysisInPrint.update(v => !v);
  }

  toggleOriginalInPrint() {
    this.includeOriginalInPrint.update(v => !v);
  }

  async analyzeCurrentTranslation() {
    if (!this.previewText() || !this.originalPreviewText()) return;
    this.isAnalyzingTranslation.set(true);
    this.translationAnalysis.set('');
    try {
      const analysis = await this.clinicalIntelligence.analyzeTranslation(
        this.originalPreviewText(),
        this.previewText()
      );
      this.translationAnalysis.set(analysis);
    } catch (e) {
      console.error("Translation analysis failed", e);
      this.translationAnalysis.set("Analysis failed. Please try again.");
    } finally {
      this.isAnalyzingTranslation.set(false);
    }
  }


  printReport() {
    const p = this.patientMgmt.selectedPatient();
    const vitals = this.state.vitals();
    let textToPrint = this.previewText();
    const level = this.selectedReadingLevel();

    if (level !== 'standard') {
      const levelNames: Record<string, string> = {
        'simplified': 'Simplified (6th Grade)',
        'dyslexia': 'Cognition (Dyslexia-Friendly)',
        'child': 'Child (Pediatric)',
        'hindi': 'Hindi Translation'
      };
      
      const translationMatrix = {
        levelName: levelNames[level] || level.toUpperCase(),
        translatedPlanMarkdown: this.previewText(),
        originalPlanMarkdown: this.includeOriginalInPrint() ? this.originalPreviewText() : null,
        analysisMarkdown: this.includeAnalysisInPrint() ? this.translationAnalysis() : null
      };

      this.export.downloadCarePlanPdf(
        '',
        p?.name ?? 'Patient',
        {
          bp: vitals.bp || undefined,
          hr: vitals.hr || undefined,
          temp: vitals.temp || undefined,
          spO2: vitals.spO2 || undefined,
          weight: vitals.weight || undefined,
        },
        p?.preexistingConditions ?? [],
        translationMatrix
      );
    } else {
      this.export.downloadCarePlanPdf(
        textToPrint,
        p?.name ?? 'Patient',
        {
          bp: vitals.bp || undefined,
          hr: vitals.hr || undefined,
          temp: vitals.temp || undefined,
          spO2: vitals.spO2 || undefined,
          weight: vitals.weight || undefined,
        },
        p?.preexistingConditions ?? []
      );
    }
  }

  confirmFinalize() {
    this.state.updateActivePatientSummary(this.originalPreviewText());
    if (this.state.draftSummaryItems().length > 0) {
      this.state.clearDraftSummaryItems();
    }
    this.finalizeChart();
    this.game.completeQuest('finalize_plan');
    this.closePreview();
  }

  finalizeChart() {
    const patientId = this.patientMgmt.selectedPatientId();
    if (!patientId) return;

    const chartState = this.state.getCurrentState();

    const historyEntry = {
      type: 'ChartArchived' as const,
      date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
      summary: 'Medical chart finalized and archived for this visit.',
      state: chartState,
      finalText: this.originalPreviewText(),
      translatedText: this.selectedReadingLevel() !== 'standard' ? this.previewText() : undefined,
      readingLevel: this.selectedReadingLevel()
    };

    this.patientMgmt.addHistoryEntry(patientId, historyEntry);
  }

  finalizeRecord() {
    this.openFinalizePreview();
  }

  cycleTheme() {
    const themes: AppTheme[] = ['light', 'dark', 'system', 'spark', 'papercraft', 'hemp', 'rice', 'construction', 'white-marble', 'black-marble', 'papyrus', 'pool', 'mandala', 'curie', 'cern'];
    const current = this.theme.currentTheme();
    const nextIdx = (themes.indexOf(current) + 1) % themes.length;
    this.theme.setTheme(themes[nextIdx]);
  }

  isSyncing = signal<boolean>(false);

  async syncToMobile() {
    this.isSyncing.set(true);
    try {
      await this.patientMgmt.syncToCloud();
      // Optional: Show a brief success message or handle it centrally
    } catch (e) {
      console.error('Failed to sync to mobile', e);
    } finally {
      this.isSyncing.set(false);
    }
  }

  // --- Resizable Panel State ---
  mainContainer = viewChild<ElementRef<HTMLDivElement>>('mainContainer');

  // Vertical Panel Resizing (Column)
  inputPanelWidth = signal<number | undefined>(undefined);
  isDraggingColumn = signal<boolean>(false);
  private initialColumnDragX = 0;
  private initialInputPanelWidth = 0;

  // New Voice Column Resizing
  voiceColWidth = signal<number | undefined>(undefined);
  isDraggingVoiceCol = signal<boolean>(false);
  private initialVoiceDragX = 0;
  private initialVoiceWidth = 0;

  private lastContainerHeight = 0;
  private lastContainerWidth = 0;
  private boundOnWindowResize: (() => void) | null = null;
  private resizeDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  isMobile = signal<boolean>(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  mobileActiveTab = signal<'chart' | 'tasks' | 'analysis'>('chart');

  goBackToChart(): void {
    this.state.selectPart(null);
    this.mobileActiveTab.set('chart');
  }

  isViewingVisitDetails = computed(() => {
    const pastVisit = this.state.viewingPastVisit();
    // Show details view only when a visit is being reviewed AND no specific part has been selected yet.
    return pastVisit && (pastVisit.type === 'Visit' || pastVisit.type === 'ChartArchived') && !this.state.selectedPartId();
  });

  isDragging = computed(() => this.isDraggingColumn());

  private boundDoColumnDrag = this.doColumnDrag.bind(this);
  private boundStopColumnDrag = this.stopColumnDrag.bind(this);

  private boundDoVoiceColDrag = this.doVoiceColDrag.bind(this);
  private boundStopVoiceColDrag = this.stopVoiceColDrag.bind(this);

  readonly session = inject(SessionStateService);
  readonly fitbit = inject(FitbitService);
  readonly intelligence = inject(ClinicalIntelligenceService);
  readonly webMcp = inject(WebMcpRegistrationService);

  constructor() {
    if (typeof window !== 'undefined') {
      (window as any).__openZamecznikCanvas = () => {
        this.triggerSomaticGrounding();
      };
    }

    effect(() => {
      const text = this.originalPreviewText();
      const level = this.selectedReadingLevel();
      if (level !== 'standard') {
        untracked(() => {
          this.debouncedTranslate(text, level);
        });
      }
    });

    effect(() => {
      const text = this.originalPreviewText();
      untracked(() => {
        this.state.activePatientSummary.set(text || null);
      });
    });

    const swUpdate = inject(SwUpdate, { optional: true });
    if (swUpdate && swUpdate.isEnabled) {
      swUpdate.versionUpdates.subscribe((evt: VersionEvent) => {
        if (evt.type === 'VERSION_READY') {
          if (confirm('A new version of Pocket-Gull is available! Would you like to reload now to apply the update?')) {
            window.location.reload();
          }
        }
      });
    }

    afterNextRender(async () => {
      if (typeof window === 'undefined') return;

      if (window.location.pathname === '/fhir-callback') {
        this.showFhirCallback.set(true);
        return;
      }

      // Handle Fitbit OAuth redirect (?fitbit=connected|denied|error)
      this.fitbit.handleOAuthRedirect();
      // Check initial Fitbit connection status for current patient
      this.fitbit.checkStatus().catch(() => {});

      // Check URL query parameters for deep-linked case studies (e.g. ?case=nantucket or ?caseStudy=nantucket-tick-radar)
      this.handleCaseStudyDeepLink();

      this.isMobile.set(window.innerWidth < 768);

      // 1. Check API key status from the server
      try {
        const configRes = await fetch('/api/config');
        if (configRes.ok) {
          const config = await configRes.json();
          if (config?.hasKey) {
            this.hasApiKey.set(true);
          }
        }
      } catch (_e) { /* network offline */ }

      // 2. Check for stored API key via SecureStorageService (manual entry / offline fallback)
      if (!this.hasApiKey()) {
        try {
          const storedKey = getStoredApiKey(this.secureStorage);
          if (storedKey) {
            this.hasApiKey.set(true);
          }
        } catch (e) { /* ignore */ }
      }

      // 3. Also check AI Studio key selection (dev environment)
      await this.checkApiKey();

      // Initialize WebMCP Polyfill and register tools via WebMcpRegistrationService
      this.webMcp.registerTools({
        onNavigateToBodyPart: () => {
          this.mobileActiveTab.set('analysis');
        },
        onAddBookmark: (bmk: any) => {
          this.patientMgmt.addBookmark(bmk);
        }
      });

      // Set up window resize listener for responsive layout
      this.boundOnWindowResize = this.onWindowResize.bind(this);
      window.addEventListener('resize', this.boundOnWindowResize);
    });

    // Auto-expand analysis when a part is selected or clicked
    effect(() => {
      this.state.uiExpandTrigger(); // Listen to explicit selection actions
      const partId = this.state.selectedPartId();
      if (partId) {
        untracked(() => {
          this.isAnalysisCollapsed.set(false);
          this.isChartCollapsed.set(false);
          this.mobileActiveTab.set('analysis');
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.webMcp.unregisterTools();

    if (typeof window !== 'undefined' && this.boundOnWindowResize) {
      window.removeEventListener('resize', this.boundOnWindowResize);
    }
    if (this.resizeDebounceTimer) {
      clearTimeout(this.resizeDebounceTimer);
    }
    if (this._translateTimer) {
      clearTimeout(this._translateTimer);
    }
  }

  private onWindowResize(): void {
    if (this.resizeDebounceTimer) {
      clearTimeout(this.resizeDebounceTimer);
    }
    this.resizeDebounceTimer = setTimeout(() => {
      if (typeof window === 'undefined') return;
      this.isMobile.set(window.innerWidth < 768);

      // If window resizes, revert panels back to their flexible, percentage-based dimensions
      this.inputPanelWidth.set(undefined);
      this.voiceColWidth.set(undefined);
    }, 150);
  }

  async checkApiKey() {
    if (typeof window.aistudio?.hasSelectedApiKey === 'function') {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (hasKey) this.hasApiKey.set(true);
    }
  }

  async selectKey() {
    if (typeof window.aistudio?.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      this.hasApiKey.set(true);
    }
  }

  submitApiKey() {
    const key = this.apiKeyInput().trim();
    if (!key) return;
    if (!key.startsWith('AI') || key.length < 20) {
      this.apiKeyError.set('This does not look like a valid Gemini API key. Keys typically start with "AI".');
      return;
    }
    try {
      setStoredApiKey(key, this.secureStorage);
    } catch (e) { /* ignore */ }
    this.apiKeyError.set(null);
    this.isDemoMode.set(false);
    this.state.isDemoMode.set(false);
    // Force GeminiProvider to reinitialise with the new key on next call
    this.hasApiKey.set(true);
  }

  handleUnlockSession() {
    this.isDemoMode.set(false);
    this.state.isDemoMode.set(false);
    this.hasApiKey.set(true);
    this.session.isLocked.set(false);
  }

  loadDemoMode() {
    this.isDemoMode.set(true);
    this.state.isDemoMode.set(true);
    this.hasApiKey.set(true);
    // Load demo patient (Charles Darwin – p_charles_darwin)
    this.patientMgmt.selectPatient('p_charles_darwin');
    // Inject pre-baked analysis outputs (no API call) synchronously
    this.state.activePhilosophy.set('western');
    const darwinAnalysis = p_charles_darwin.history.find((h: HistoryEntry) => h.type === 'AnalysisRun');
    const darwinReport = darwinAnalysis && 'report' in darwinAnalysis ? darwinAnalysis.report : {};
    this.clinicalIntelligence.loadArchivedAnalysis(darwinReport as Partial<Record<AnalysisLens, string>>);
    this.clinicalIntelligence.lastActivePhilosophy.set('western');
    this.clinicalIntelligence.lastPatientData.set(this.state.getAllDataForPrompt());
  }

  handleCaseStudyDeepLink(): void {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const caseParam = (params.get('case') || params.get('caseStudy') || '').toLowerCase();

      if (caseParam === 'nantucket' || caseParam === 'nantucket-tick-radar') {
        // Unlock session & enter demo/cockpit mode
        this.session.isLocked.set(false);
        this.state.isDemoMode.set(true);
        this.isDemoMode.set(true);
        this.hasApiKey.set(true);

        // Populate patient state with Nantucket Landscaper presentation
        this.state.occupation.set('Conservation Landscaper (Nantucket)');
        this.state.reasonForVisit.set(
          '42-year-old Nantucket conservation landscaper presenting with 8-day history of fatigue, migrating arthralgias in knees and neck, expanding atypical annular plaque on posterior thigh, night sweats, and resting tachycardia after clearing brush in Polpis.'
        );

        this.state.vitals.set({
          hr: '92',
          bp: '118/72',
          spO2: '98',
          temp: '38.2',
          weight: '78 kg',
          height: '178 cm',
          cgmGlucoseMgDl: '95',
          vitC: 'Normal',
          vitD3: '28 ng/mL',
          magnesium: '2.1 mg/dL',
          zinc: '85 ug/dL',
          b12: '450 pg/mL'
        });

        this.state.issues.set({
          thigh_left: [{
            id: 'thigh_left',
            noteId: 'note_nantucket_thigh',
            name: 'Left Thigh (Posterior)',
            painLevel: 4,
            description: '6cm expanding erythematous lesion without central clearing (atypical Lyme rash vs tick co-infection)',
            symptoms: ['Expanding Erythema Migrans Plaque', 'Pruritus', 'Fever'],
            recommendation: 'CDC Two-Tier Serology & Thin Blood Smear for Babesia microti tetrads'
          }],
          knee_left: [{
            id: 'knee_left',
            noteId: 'note_nantucket_knee',
            name: 'Left Knee Joint',
            painLevel: 5,
            description: 'Migrating arthralgia with mild joint effusion',
            symptoms: ['Migrating Joint Pain', 'Effusion', 'Stiffness'],
            recommendation: 'Weight-bearing joint rest, Doxycycline 100mg BID + Atovaquone 750mg BID'
          }]
        });

        // Trigger UI to focus on Left Thigh
        this.state.selectedPartId.set('thigh_left');
        this.isAnalysisCollapsed.set(false);
        this.isChartCollapsed.set(false);

        // Open the rich Nantucket Case Study modal for full clinical brief unless explicitly suppressed
        if (params.get('modal') !== 'false') {
          this.showNantucketCaseStudy.set(true);
        }
      }
    } catch (err) {
      console.warn('[AppComponent] URL case study deep link inspection failed:', err);
    }
  }

  handleEmergencyBypass() {
    this.state.isEmergencyMode.set(true);
    this.state.clearState();

    const emergencyPatient: IPatient = {
      id: 'emergency_casualty',
      name: 'Emergency Patient',
      age: 30,
      gender: 'Other',
      lastVisit: new Date().toISOString(),
      preexistingConditions: [],
      history: [],
      bookmarks: [],
      issues: {},
      patientGoals: 'Immediate trauma and emergency life support bypass mode.',
      dietaryProtocol: '',
      vitals: {
        bp: '', hr: '', temp: '', spO2: '', weight: '', height: '',
        vitC: '', vitD3: '', magnesium: '', zinc: '', b12: ''
      },
      dynamicNutrients: [],
      oxidativeStressMarkers: [],
      antioxidantSources: [],
      medications: [],
      clinicalNotes: [],
      checklist: [],
      shoppingList: []
    };

    const currentPatients = this.patientMgmt.patients();
    if (!currentPatients.some(p => p.id === 'emergency_casualty')) {
      const patientsSignal = this.patientMgmt.patients;
      if (typeof (patientsSignal as any).update === 'function') {
        (patientsSignal as any).update((list: IPatient[]) => [...list, emergencyPatient]);
      }
    }

    this.patientMgmt.selectedPatientId.set('emergency_casualty');
    this.state.loadState(emergencyPatient);
    this.session.isLocked.set(false);
  }

  exitDemoMode() {
    this.isDemoMode.set(false);
    this.hasApiKey.set(false);
    this.apiKeyInput.set('');
  }

  toggleChart() {
    this.isChartCollapsed.update(v => !v);
  }

  toggleAnalysis() {
    this.isAnalysisCollapsed.update(v => !v);
  }

  maximizeChart() {
    this.isChartCollapsed.set(false);
    this.isAnalysisCollapsed.set(true);
  }

  maximizeAnalysis() {
    this.isChartCollapsed.set(true);
    this.isAnalysisCollapsed.set(false);
  }

  showSplitView() {
    this.isChartCollapsed.set(false);
    this.isAnalysisCollapsed.set(false);
    this.inputPanelWidth.set(window.innerWidth / 2);
  }

  // --- Column Resizing Logic ---
  startColumnDrag(event: MouseEvent): void {
    event.preventDefault();
    this.isDraggingColumn.set(true);
    this.initialColumnDragX = event.clientX;

    if (this.inputPanelWidth() === undefined) {
      const handleEl = event.currentTarget as HTMLElement;
      const panelEl = handleEl?.previousElementSibling as HTMLElement;
      if (panelEl) {
        this.initialInputPanelWidth = panelEl.offsetWidth;
        this.inputPanelWidth.set(this.initialInputPanelWidth);
      } else {
        this.initialInputPanelWidth = window.innerWidth / 2;
        this.inputPanelWidth.set(this.initialInputPanelWidth);
      }
    } else {
      this.initialInputPanelWidth = this.inputPanelWidth()!;
    }

    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', this.boundDoColumnDrag);
    document.addEventListener('mouseup', this.boundStopColumnDrag, { once: true });
  }

  private doColumnDrag(event: MouseEvent): void {
    if (!this.isDraggingColumn()) return;

    const deltaX = event.clientX - this.initialColumnDragX;
    const containerWidth = this.mainContainer()?.nativeElement.offsetWidth ?? window.innerWidth;

    const newWidth = this.initialInputPanelWidth + deltaX;
    const minInputWidth = 400;
    const minAnalysisWidth = 320;
    const resizerWidth = 8;
    const maxInputWidth = containerWidth - minAnalysisWidth - resizerWidth;
    this.inputPanelWidth.set(Math.max(minInputWidth, Math.min(newWidth, maxInputWidth)));
  }

  private stopColumnDrag(): void {
    this.isDraggingColumn.set(false);
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', this.boundDoColumnDrag);

    // Snappy behavior: if released near the center (55%), snap to it
    const containerWidth = this.mainContainer()?.nativeElement.offsetWidth ?? window.innerWidth;
    const width = this.inputPanelWidth();
    if (width !== undefined) {
      const currentPercent = (width / containerWidth) * 100;

      if (Math.abs(currentPercent - 50) < 5) {
        this.inputPanelWidth.set(containerWidth * 0.50);
      }
    }
  }

  resetColumnWidth(): void {
    this.inputPanelWidth.set(undefined);
  }

  // --- Voice Column Resizing Logic ---
  startVoiceColDrag(event: MouseEvent): void {
    event.preventDefault();
    this.isDraggingVoiceCol.set(true);
    this.initialVoiceDragX = event.clientX;

    if (this.voiceColWidth() === undefined) {
      const panelEl = (event.target as HTMLElement).nextElementSibling as HTMLElement;
      this.initialVoiceWidth = panelEl.offsetWidth;
      this.voiceColWidth.set(this.initialVoiceWidth);
    } else {
      this.initialVoiceWidth = this.voiceColWidth()!;
    }

    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', this.boundDoVoiceColDrag);
    document.addEventListener('mouseup', this.boundStopVoiceColDrag, { once: true });
  }

  private doVoiceColDrag(event: MouseEvent): void {
    if (!this.isDraggingVoiceCol()) return;

    // We drag FROM the left side of the right column, so pulling Left (negative delta) INCREASES width
    const deltaX = event.clientX - this.initialVoiceDragX;
    const newWidth = this.initialVoiceWidth - deltaX;

    const minWidth = 300;
    const maxWidth = 800;

    const computedNewWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
    this.voiceColWidth.set(computedNewWidth);
  }

  private stopVoiceColDrag(): void {
    this.isDraggingVoiceCol.set(false);
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', this.boundDoVoiceColDrag);
  }
}
