import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MdcpDomainService,
  ISkSaiAssessment,
  IForm2603IndividualServicePlan,
  IClinicalMultidisciplinaryPlan,
  IIeee11073DeviceMetricSample,
  IEEE_11073_NOMENCLATURE,
  IDisciplineGoalMilestone,
  StateWaiverProgramKey,
  IStateWaiverProfile,
  STATE_WAIVER_PROFILES
} from '../../services/mdcp/mdcp-domain.service';
import {
  StateRegionalCrosswalkService,
  IStateWaiverCrosswalkEntry,
  ICmsRegionDefinition,
  CmsRegionNumber
} from '../../services/mdcp/state-regional-crosswalk.service';
import {
  EpsdtAdvocacyService,
  EpsdtDisputeCategory,
  EPSDT_DISPUTE_DEFINITIONS,
  IEpsdtAppealPackage
} from '../../services/mdcp/epsdt-advocacy.service';
import { PatientStateService } from '../../services/patient-state.service';
import { PatientManagementService } from '../../services/patient-management.service';
import { FhirExportStrategyService } from '../../services/export/fhir-export-strategy.service';
import { NavigationShellService } from '../../services/navigation-shell.service';
import {
  AeromedicalTransportService,
  IAeromedicalCorridor,
  IOxygenFlightRequirement,
  IAirAmbulanceBillingSummary
} from '../../services/mdcp/aeromedical-transport.service';
import {
  EdiClaimsGeneratorService,
  IEdiDocumentMetadata,
  IEdiParticipant
} from '../../services/mdcp/edi-claims-generator.service';
import {
  AviationWeatherClearanceService,
  IAeromedicalFlightClearance
} from '../../services/mdcp/aviation-weather-clearance.service';
import {
  SchoolIepTransitionService,
  ISchoolIepPackage
} from '../../services/mdcp/school-iep-transition.service';

export type MdcpTab = 'pediatric-waiver' | 'hospital-careplan' | 'ieee11073-telemetry' | 'ita-standards' | 'regional-crosswalk' | 'epsdt-appeal';

@Component({
  selector: 'app-mdcp-governance-hub',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        class="w-full max-w-6xl h-[90vh] bg-[#0c0e12] border border-zinc-800/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mdcp-modal-title">

        <!-- HEADER -->
        <header class="flex items-center justify-between px-6 py-4 border-b border-zinc-800/70 bg-zinc-900/50">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold font-mono text-base shadow-inner">
              MDC
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 id="mdcp-modal-title" class="text-lg font-semibold tracking-tight text-zinc-100">
                  MDCP Strategic Clinical & Standards Governance Hub
                </h2>
                <span class="px-2 py-0.5 text-xs font-mono rounded-full bg-teal-950 text-teal-300 border border-teal-800/50">
                  4-Pillar Integration
                </span>
                <span class="px-2 py-0.5 text-xs font-mono rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/50 flex items-center gap-1.5 shadow-sm" title="Zero network egress required. All 57 jurisdictions, statutory citations, and appeal documents operate hermetically on-device.">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Offline Edge Ready (Zero Egress)</span>
                </span>
              </div>
              <p class="text-xs text-zinc-400">
                Medicaid 1915(c) Pediatric Waiver • Hospital Multidisciplinary Plans • ISO/IEEE 11073 Telemetry • U.S. ITA 15 U.S.C. § 4723
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button
              type="button"
              (click)="exportFhirBundle()"
              class="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-teal-400 min-h-[44px] touch-manipulation"
              title="Export Unified HL7 FHIR R4 MDCP Bundle">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              <span>Export FHIR R4 Bundle</span>
            </button>

            <button
              type="button"
              (click)="closeModal()"
              class="w-11 h-11 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-teal-400 touch-manipulation"
              aria-label="Close MDCP Hub">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </header>

        <!-- NAVIGATION TABS -->
        <nav class="flex border-b border-zinc-800/80 bg-zinc-950/70 px-6 gap-2 overflow-x-auto text-sm" aria-label="MDCP Domains">
          <button
            type="button"
            (click)="activeTab.set('pediatric-waiver')"
            [class.border-teal-400]="activeTab() === 'pediatric-waiver'"
            [class.text-teal-300]="activeTab() === 'pediatric-waiver'"
            [class.border-transparent]="activeTab() !== 'pediatric-waiver'"
            class="py-3 px-4 border-b-2 font-medium transition-colors hover:text-zinc-100 whitespace-nowrap min-h-[44px] flex items-center gap-2">
            <span>1. Pediatric Waiver (SK-SAI / Form 2603)</span>
            <span class="px-1.5 py-0.2 text-[10px] rounded bg-zinc-800 text-zinc-300 font-mono">
              {{ waiverPlan()?.medicalNecessityScore ?? '--' }}/100
            </span>
          </button>

          <button
            type="button"
            (click)="activeTab.set('hospital-careplan')"
            [class.border-teal-400]="activeTab() === 'hospital-careplan'"
            [class.text-teal-300]="activeTab() === 'hospital-careplan'"
            [class.border-transparent]="activeTab() !== 'hospital-careplan'"
            class="py-3 px-4 border-b-2 font-medium transition-colors hover:text-zinc-100 whitespace-nowrap min-h-[44px] flex items-center gap-2">
            <span>2. Hospital Multidisciplinary (MDCP)</span>
            <span class="px-1.5 py-0.2 text-[10px] rounded bg-emerald-950 text-emerald-300 font-mono">
              {{ achievedMilestonesCount() }}/{{ hospitalPlan()?.milestones?.length ?? 0 }} Goals
            </span>
          </button>

          <button
            type="button"
            (click)="activeTab.set('ieee11073-telemetry')"
            [class.border-teal-400]="activeTab() === 'ieee11073-telemetry'"
            [class.text-teal-300]="activeTab() === 'ieee11073-telemetry'"
            [class.border-transparent]="activeTab() !== 'ieee11073-telemetry'"
            class="py-3 px-4 border-b-2 font-medium transition-colors hover:text-zinc-100 whitespace-nowrap min-h-[44px] flex items-center gap-2">
            <span>3. IEEE 11073 Telemetry (MDC)</span>
            <span class="flex h-2 w-2 relative">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
          </button>

          <button
            type="button"
            (click)="activeTab.set('ita-standards')"
            [class.border-teal-400]="activeTab() === 'ita-standards'"
            [class.text-teal-300]="activeTab() === 'ita-standards'"
            [class.border-transparent]="activeTab() !== 'ita-standards'"
            class="py-3 px-4 border-b-2 font-medium transition-colors hover:text-zinc-100 whitespace-nowrap min-h-[44px] flex items-center gap-2">
            <span>4. ITA Trade & Standards (15 U.S.C. § 4723)</span>
            <span class="px-1.5 py-0.2 text-[10px] rounded bg-amber-950 text-amber-300 font-mono">
              Certified
            </span>
          </button>

          <button
            type="button"
            (click)="activeTab.set('regional-crosswalk')"
            [class.border-teal-400]="activeTab() === 'regional-crosswalk'"
            [class.text-teal-300]="activeTab() === 'regional-crosswalk'"
            [class.border-transparent]="activeTab() !== 'regional-crosswalk'"
            class="py-3 px-4 border-b-2 font-medium transition-colors hover:text-zinc-100 whitespace-nowrap min-h-[44px] flex items-center gap-2">
            <span>5. 50-State, Territories & Outlying Islands</span>
            <span class="px-1.5 py-0.2 text-[10px] rounded bg-teal-950 text-teal-300 font-mono">
              57 Jurisdictions
            </span>
          </button>

          <button
            type="button"
            (click)="activateEpsdtTab()"
            [class.border-teal-400]="activeTab() === 'epsdt-appeal'"
            [class.text-teal-300]="activeTab() === 'epsdt-appeal'"
            [class.border-transparent]="activeTab() !== 'epsdt-appeal'"
            class="py-3 px-4 border-b-2 font-medium transition-colors hover:text-zinc-100 whitespace-nowrap min-h-[44px] flex items-center gap-2">
            <span>6. EPSDT Federal Appeal & Orders</span>
            <span class="px-1.5 py-0.2 text-[10px] rounded bg-rose-950 text-rose-300 font-mono border border-rose-800/60">
              42 U.S.C. § 1396d(r)
            </span>
          </button>
        </nav>

        <!-- CONTENT AREA -->
        <main class="flex-1 overflow-y-auto p-6 space-y-6">

          <!-- TAB 1: PEDIATRIC WAIVER (Multi-State 1915(c) / TEFRA) -->
          @if (activeTab() === 'pediatric-waiver') {
            <section class="space-y-6" aria-labelledby="pediatric-waiver-heading">
              <!-- STATE WAIVER SELECTOR BAR -->
              <div class="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2.5">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-teal-400"></span>
                    <span class="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      State Medicaid 1915(c) & TEFRA Waiver Jurisdiction
                    </span>
                  </div>
                  <span class="text-xs font-mono text-teal-400/90">
                    {{ waiverPlan()?.stateProfile?.statutoryReference || 'Title XIX § 1915(c)' }}
                  </span>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  @for (key of stateProfileKeys; track key) {
                    @let profile = stateWaiverProfiles[key];
                    <button
                      type="button"
                      (click)="setStateWaiver(key)"
                      [class.bg-teal-600]="selectedStateWaiver() === key"
                      [class.text-white]="selectedStateWaiver() === key"
                      [class.border-teal-400]="selectedStateWaiver() === key"
                      [class.bg-zinc-800/80]="selectedStateWaiver() !== key"
                      [class.text-zinc-300]="selectedStateWaiver() !== key"
                      [class.border-zinc-700/60]="selectedStateWaiver() !== key"
                      class="px-3 py-1.5 rounded-lg border text-xs font-medium transition-all hover:border-teal-500 flex items-center gap-1.5 min-h-[44px] touch-manipulation focus-visible:ring-2 focus-visible:ring-teal-400">
                      <span class="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-black/30">
                        {{ profile.stateCode }}
                      </span>
                      <span>{{ profile.stateName }}</span>
                      <span class="text-[10px] text-zinc-400 font-mono hidden sm:inline">
                        ({{ profile.planFormIdentifier.split(' ')[0] }})
                      </span>
                    </button>
                  }
                  <button
                    type="button"
                    (click)="activeTab.set('regional-crosswalk')"
                    class="px-3 py-1.5 rounded-lg border border-teal-500/50 bg-teal-950/40 text-teal-300 hover:bg-teal-900/60 text-xs font-medium transition-all flex items-center gap-1.5 min-h-[44px] touch-manipulation focus-visible:ring-2 focus-visible:ring-teal-400">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                    </svg>
                    <span>All 50 States & 10 Regions →</span>
                  </button>
                </div>
              </div>

              <!-- PROGRAM HEADER & DIVERSION SCORE -->
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <div>
                  <h3 id="pediatric-waiver-heading" class="text-base font-semibold text-zinc-100 flex flex-wrap items-center gap-2">
                    {{ waiverPlan()?.stateProfile?.programTitle || 'Medicaid 1915(c) Pediatric Waiver' }}
                    <span class="px-2 py-0.5 text-xs font-mono rounded bg-teal-900/60 text-teal-300 border border-teal-700/50">
                      {{ waiverPlan()?.stateProfile?.assessmentInstrument || 'SK-SAI Standard' }}
                    </span>
                  </h3>
                  <p class="text-xs text-zinc-400 mt-1">
                    Administered by {{ waiverPlan()?.stateProfile?.administeringAgency }}. Authorizes institutional diversion, funding private duty nursing (\${{ waiverPlan()?.costNeutrality?.hourlyPdnRateUsd ?? 48.50 }}/hr), therapy, and adaptive home modifications.
                  </p>
                </div>

                <div class="flex items-center gap-3">
                  <div class="text-right">
                    <span class="text-xs text-zinc-400 block">De-institutionalization Index</span>
                    <span class="text-xl font-bold font-mono text-teal-400">
                      {{ waiverPlan()?.medicalNecessityScore ?? 0 }}%
                    </span>
                  </div>
                  <div class="px-3 py-1.5 rounded-lg bg-teal-950 text-teal-300 border border-teal-800 text-xs font-medium">
                    {{ waiverPlan()?.institutionalDiversionAttested ? 'DIVERSION CERTIFIED' : 'EVALUATION PENDING' }}
                  </div>
                </div>
              </div>

              <!-- TITLE XIX COST-NEUTRALITY FISCAL AUDIT -->
              <div class="p-4 rounded-xl bg-teal-950/20 border border-teal-800/40 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span class="text-[11px] text-zinc-400 uppercase tracking-wider block">Institutional LOC Ceiling</span>
                  <span class="text-lg font-bold font-mono text-zinc-200 tabular-nums">
                    \${{ (waiverPlan()?.costNeutrality?.institutionalCapAnnualUsd ?? 0) | number }}
                  </span>
                  <span class="text-[10px] text-zinc-500 block">Annual SNF / ICF cap</span>
                </div>
                <div>
                  <span class="text-[11px] text-zinc-400 uppercase tracking-wider block">Estimated Home Care Cost</span>
                  <span class="text-lg font-bold font-mono text-teal-300 tabular-nums">
                    \${{ (waiverPlan()?.costNeutrality?.estimatedAnnualHomeCostUsd ?? 0) | number }}
                  </span>
                  <span class="text-[10px] text-zinc-500 block">PDN + Respite + Aids</span>
                </div>
                <div>
                  <span class="text-[11px] text-zinc-400 uppercase tracking-wider block">Annual State Savings</span>
                  <span class="text-lg font-bold font-mono text-emerald-400 tabular-nums">
                    \${{ (waiverPlan()?.costNeutrality?.annualCostSavingsUsd ?? 0) | number }}
                  </span>
                  <span class="text-[10px] text-emerald-500 block font-mono">
                    {{ waiverPlan()?.costNeutrality?.costReductionPercent ?? 0 }}% reduction vs SNF
                  </span>
                </div>
                <div>
                  <span class="text-[11px] text-zinc-400 uppercase tracking-wider block">§ 1915(c) Cost-Neutrality</span>
                  <div class="mt-1 flex items-center gap-1.5">
                    <span class="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span class="text-xs font-bold font-mono text-emerald-300">
                      {{ waiverPlan()?.costNeutrality?.costNeutralityCertified ? 'CERTIFIED SOLVENT' : 'REVIEW REQUIRED' }}
                    </span>
                  </div>
                  <span class="text-[10px] text-zinc-400 block font-mono">
                    Rate: \${{ waiverPlan()?.costNeutrality?.hourlyPdnRateUsd ?? 48.50 }}/hr PDN
                  </span>
                </div>
              </div>

              <!-- AUTHORIZED SERVICES CARDS -->
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                  <span class="text-xs font-medium text-zinc-400">Private Duty Nursing (PDN)</span>
                  <div class="mt-2 flex items-baseline gap-2">
                    <span class="text-2xl font-bold font-mono text-zinc-100 tabular-nums">
                      {{ waiverPlan()?.authorizedServices?.privateDutyNursingHoursPerWeek ?? 0 }}
                    </span>
                    <span class="text-xs text-zinc-400">hours / week</span>
                  </div>
                  <p class="text-[11px] text-teal-400/80 mt-1">Licensed Pediatric Home RN/LVN</p>
                </div>

                <div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                  <span class="text-xs font-medium text-zinc-400">Annual Respite Care</span>
                  <div class="mt-2 flex items-baseline gap-2">
                    <span class="text-2xl font-bold font-mono text-zinc-100 tabular-nums">
                      {{ waiverPlan()?.authorizedServices?.respiteCareHoursPerYear ?? 0 }}
                    </span>
                    <span class="text-xs text-zinc-400">hours / year</span>
                  </div>
                  <p class="text-[11px] text-zinc-400 mt-1">Caregiver strain mitigation</p>
                </div>

                <div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                  <span class="text-xs font-medium text-zinc-400">PT / OT / SLP Combined</span>
                  <div class="mt-2 flex items-baseline gap-2">
                    <span class="text-2xl font-bold font-mono text-zinc-100 tabular-nums">
                      {{ (waiverPlan()?.authorizedServices?.physicalTherapyUnitsPerMonth ?? 0) + (waiverPlan()?.authorizedServices?.occupationalTherapyUnitsPerMonth ?? 0) }}
                    </span>
                    <span class="text-xs text-zinc-400">units / month</span>
                  </div>
                  <p class="text-[11px] text-zinc-400 mt-1">Home & school-based delivery</p>
                </div>

                <div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                  <span class="text-xs font-medium text-zinc-400">Adaptive Equipment Budget</span>
                  <div class="mt-2 flex items-baseline gap-2">
                    <span class="text-2xl font-bold font-mono text-zinc-100 tabular-nums">
                      \${{ (waiverPlan()?.authorizedServices?.adaptiveAidsAllocatedUsd ?? 0) | number }}
                    </span>
                  </div>
                  <p class="text-[11px] text-teal-400/80 mt-1">Vehicle lifts & sterile suction aids</p>
                </div>
              </div>

              <!-- FORM ATTESTATION & CLINICAL JUSTIFICATION -->
              <div class="p-5 rounded-xl bg-zinc-900/30 border border-zinc-800 space-y-4">
                <div class="flex items-center justify-between">
                  <h4 class="text-sm font-semibold text-zinc-200">
                    {{ waiverPlan()?.stateProfile?.planFormIdentifier || 'Form 2603 Individual Service Plan (ISP)' }} Attestation
                  </h4>
                  <span class="text-xs font-mono text-zinc-400">
                    Plan ID: {{ waiverPlan()?.planId }}
                  </span>
                </div>

                <blockquote class="p-3.5 rounded-lg bg-zinc-950/80 border-l-4 border-teal-500 text-xs text-zinc-300 leading-relaxed">
                  {{ waiverPlan()?.clinicalJustification }}
                </blockquote>

                <div class="flex flex-wrap items-center justify-between pt-2 border-t border-zinc-800/80 text-xs text-zinc-400 gap-2">
                  <div class="flex items-center gap-2">
                    <span class="text-zinc-500">Certified Physician:</span>
                    <span class="text-zinc-200 font-medium">{{ waiverPlan()?.attendingPhysicianAttestation?.physicianName }}</span>
                    <span class="font-mono text-zinc-400">(NPI: {{ waiverPlan()?.attendingPhysicianAttestation?.npi }})</span>
                  </div>
                  <div>
                    <span class="text-zinc-500">Attestation Date:</span>
                    <span class="text-zinc-200 font-mono ml-1">{{ waiverPlan()?.attendingPhysicianAttestation?.attestationDate }}</span>
                  </div>
                </div>
              </div>
            </section>
          }

          <!-- TAB 2: CLINICAL HOSPITAL CARE (MULTIDISCIPLINARY CARE PLAN) -->
          @if (activeTab() === 'hospital-careplan') {
            <section class="space-y-6" aria-labelledby="hospital-careplan-heading">
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <div>
                  <h3 id="hospital-careplan-heading" class="text-base font-semibold text-zinc-100 flex items-center gap-2">
                    Inpatient Multi-Disciplinary Care Plan (MDCP)
                    <span class="px-2 py-0.5 text-xs font-mono rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                      Acute Stepdown & Neuro-Rehab
                    </span>
                  </h3>
                  <p class="text-xs text-zinc-400 mt-1">
                    Synchronized clinical roadmap unifying attending physicians, bedside nursing, speech-language pathologists, occupational therapists, and clinical pharmacologists.
                  </p>
                </div>

                <div class="flex items-center gap-3">
                  <div class="text-right">
                    <span class="text-xs text-zinc-400 block">Caregiver Readiness</span>
                    <span class="text-xl font-bold font-mono text-emerald-400">
                      {{ hospitalPlan()?.caregiverReadinessScore ?? 0 }}%
                    </span>
                  </div>
                  <div class="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 text-xs font-medium">
                    Diet: {{ hospitalPlan()?.dysphagiaDietStage }}
                  </div>
                </div>
              </div>

              <!-- 3-ACT CAREGIVER PLAIN LANGUAGE ROADMAP -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-zinc-500"></span>
                    <h5 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Act 1: Where You've Been</h5>
                  </div>
                  <p class="text-xs text-zinc-400 leading-relaxed">
                    {{ hospitalPlan()?.caregiverPlainLanguageRoadmap?.act1WhereYouveBeen }}
                  </p>
                </div>

                <div class="p-4 rounded-xl bg-teal-950/20 border border-teal-800/40 space-y-2">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-teal-400"></span>
                    <h5 class="text-xs font-semibold text-teal-300 uppercase tracking-wider">Act 2: Where You Stand Today</h5>
                  </div>
                  <p class="text-xs text-zinc-300 leading-relaxed">
                    {{ hospitalPlan()?.caregiverPlainLanguageRoadmap?.act2WhereYouStandToday }}
                  </p>
                </div>

                <div class="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-2">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <h5 class="text-xs font-semibold text-emerald-300 uppercase tracking-wider">Act 3: Where You're Going</h5>
                  </div>
                  <p class="text-xs text-zinc-300 leading-relaxed">
                    {{ hospitalPlan()?.caregiverPlainLanguageRoadmap?.act3WhereYoureGoing }}
                  </p>
                </div>
              </div>

              <!-- INTERDISCIPLINARY MILESTONES TABLE -->
              <div class="p-5 rounded-xl bg-zinc-900/30 border border-zinc-800 space-y-3">
                <h4 class="text-sm font-semibold text-zinc-200">
                  Synchronized Interdisciplinary Milestones & Weaning Protocols
                </h4>

                <div class="overflow-x-auto">
                  <table class="w-full text-left text-xs">
                    <thead>
                      <tr class="border-b border-zinc-800 text-zinc-400">
                        <th class="pb-2 font-medium">Discipline</th>
                        <th class="pb-2 font-medium">Milestone Objective</th>
                        <th class="pb-2 font-medium">Clinical Threshold</th>
                        <th class="pb-2 font-medium">Target</th>
                        <th class="pb-2 font-medium">Status</th>
                        <th class="pb-2 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-zinc-800/60">
                      @for (m of hospitalPlan()?.milestones; track m.id) {
                        <tr>
                          <td class="py-3 font-mono text-[11px] text-teal-400">
                            {{ m.discipline.replace('_', ' ') }}
                          </td>
                          <td class="py-3 text-zinc-200 pr-2">
                            {{ m.milestoneTitle }}
                          </td>
                          <td class="py-3 text-zinc-400 text-[11px] pr-2">
                            {{ m.clinicalMetricThreshold }}
                          </td>
                          <td class="py-3 font-mono text-zinc-400 tabular-nums">
                            {{ m.targetDate }}
                          </td>
                          <td class="py-3">
                            <span 
                              [class.bg-emerald-950]="m.status === 'ACHIEVED'"
                              [class.text-emerald-300]="m.status === 'ACHIEVED'"
                              [class.border-emerald-800]="m.status === 'ACHIEVED'"
                              [class.bg-teal-950]="m.status === 'IN_PROGRESS'"
                              [class.text-teal-300]="m.status === 'IN_PROGRESS'"
                              [class.border-teal-800]="m.status === 'IN_PROGRESS'"
                              class="px-2 py-0.5 rounded text-[10px] font-mono border">
                              {{ m.status }}
                            </span>
                          </td>
                          <td class="py-3 text-right">
                            <button
                              type="button"
                              (click)="toggleMilestone(m)"
                              class="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] transition-colors focus-visible:ring-2 focus-visible:ring-teal-400">
                              {{ m.status === 'ACHIEVED' ? 'Reopen' : 'Mark Complete' }}
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- ADVERSE DRUG EVENT (ADE) RISK SHIELD -->
              @if (hospitalPlan()?.drugInteractions?.length) {
                <div class="p-4 rounded-xl bg-amber-950/20 border border-amber-800/50 space-y-2">
                  <div class="flex items-center gap-2 text-amber-300 text-xs font-semibold">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    <span>Clinical Pharmacology ADE Vigilance Alert</span>
                  </div>
                  @for (risk of hospitalPlan()?.drugInteractions; track risk.medicationA) {
                    <div class="text-xs text-zinc-300 flex flex-col md:flex-row md:items-center justify-between gap-2 pt-1">
                      <div>
                        <span class="font-medium text-amber-200">{{ risk.medicationA }}</span> + <span class="font-medium text-amber-200">{{ risk.medicationB }}</span>:
                        <span class="text-zinc-400 ml-1">{{ risk.mechanism }}</span>
                      </div>
                      <div class="text-zinc-400 font-mono text-[11px]">
                        Action: <span class="text-teal-300">{{ risk.actionTaken }}</span>
                      </div>
                    </div>
                  }
                </div>
              }
            </section>
          }

          <!-- TAB 3: MEDICAL DEVICE TELEMETRY (IEEE 11073 MDCP / MDC) -->
          @if (activeTab() === 'ieee11073-telemetry') {
            <section class="space-y-6" aria-labelledby="ieee-telemetry-heading">
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <div>
                  <h3 id="ieee-telemetry-heading" class="text-base font-semibold text-zinc-100 flex items-center gap-2">
                    ISO/IEEE 11073 Medical Device Communication Profiles (MDCP / MDC)
                    <span class="px-2 py-0.5 text-xs font-mono rounded bg-teal-900/60 text-teal-300 border border-teal-700/50">
                      RTMMS Semantic Dictionary
                    </span>
                  </h3>
                  <p class="text-xs text-zinc-400 mt-1">
                    Vendor-neutral biomedical telemetry interface standardizing physiological waveforms, vital parameters, and alert conditions for Epic/Cerner HIS and FHIR R4/R5 Observation integration.
                  </p>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    (click)="simulateIeeeStream()"
                    class="px-3 py-2 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors focus-visible:ring-2 focus-visible:ring-teal-400 min-h-[44px] touch-manipulation">
                    Refresh Telemetry
                  </button>
                </div>
              </div>

              <!-- LIVE TELEMETRY CARDS -->
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                @for (sample of deviceTelemetry(); track sample.mdcCode) {
                  <div 
                    [class.border-red-600]="sample.alarmState === 'HIGH_PHYSIOLOGICAL_ALARM'"
                    [class.bg-red-950/20]="sample.alarmState === 'HIGH_PHYSIOLOGICAL_ALARM'"
                    [class.border-zinc-800]="sample.alarmState !== 'HIGH_PHYSIOLOGICAL_ALARM'"
                    class="p-4 rounded-xl bg-zinc-900/40 border transition-all">
                    <div class="flex items-center justify-between">
                      <span class="text-[11px] font-mono text-teal-400 truncate" [title]="sample.mdcCode">
                        {{ sample.mdcCode }}
                      </span>
                      <span 
                        [class.text-red-400]="sample.alarmState === 'HIGH_PHYSIOLOGICAL_ALARM'"
                        [class.text-zinc-500]="sample.alarmState === 'NO_ALARM'"
                        class="text-[10px] font-mono uppercase">
                        {{ sample.alarmState === 'HIGH_PHYSIOLOGICAL_ALARM' ? 'ALARM' : 'NORMAL' }}
                      </span>
                    </div>

                    <div class="mt-2 flex items-baseline gap-2">
                      <span class="text-3xl font-bold font-mono text-zinc-100 tabular-nums">
                        {{ sample.metricValue }}
                      </span>
                      <span class="text-xs text-zinc-400 font-mono">{{ sample.unit }}</span>
                    </div>

                    <div class="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                      <span>{{ sample.sourceDeviceVendor.replace('_', ' ') }}</span>
                      <span class="text-emerald-400">{{ sample.qualityIndicator }}</span>
                    </div>
                  </div>
                }
              </div>

              <!-- ROSETTA TERMINOLOGY MAPPING (RTMMS) CROSSWALK -->
              <div class="p-5 rounded-xl bg-zinc-900/30 border border-zinc-800 space-y-3">
                <div class="flex items-center justify-between">
                  <h4 class="text-sm font-semibold text-zinc-200">
                    ISO/IEEE 11073-10101 to LOINC & FHIR Crosswalk
                  </h4>
                  <span class="text-xs font-mono text-zinc-500">IEEE RTMMS Compliant</span>
                </div>

                <div class="overflow-x-auto">
                  <table class="w-full text-left text-xs">
                    <thead>
                      <tr class="border-b border-zinc-800 text-zinc-400 font-medium">
                        <th class="pb-2">Physiological Parameter</th>
                        <th class="pb-2">MDC Code (ISO/IEEE)</th>
                        <th class="pb-2">CF Int Code</th>
                        <th class="pb-2">Local Term</th>
                        <th class="pb-2">MDC Unit</th>
                        <th class="pb-2">LOINC Map</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-zinc-800/60 font-mono text-[11px]">
                      @for (item of rtmmsList; track item.mdcCode) {
                        <tr>
                          <td class="py-2.5 font-sans text-zinc-200">{{ item.description }}</td>
                          <td class="py-2.5 text-teal-400">{{ item.mdcCode }}</td>
                          <td class="py-2.5 text-zinc-400 tabular-nums">{{ item.cfCode }}</td>
                          <td class="py-2.5 text-zinc-400">{{ item.systemLocalCode }}</td>
                          <td class="py-2.5 text-zinc-300">{{ item.unitCode }} ({{ item.defaultUnit }})</td>
                          <td class="py-2.5 text-amber-300">{{ item.loincMapping || '--' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          }

          <!-- TAB 4: ITA STANDARDS & TRADE HARMONIZATION (15 U.S.C. § 4723) -->
          @if (activeTab() === 'ita-standards') {
            <section class="space-y-6" aria-labelledby="ita-standards-heading">
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <div>
                  <h3 id="ita-standards-heading" class="text-base font-semibold text-zinc-100 flex items-center gap-2">
                    Market Development Cooperator Program (MDCP)
                    <span class="px-2 py-0.5 text-xs font-mono rounded bg-amber-950 text-amber-300 border border-amber-800/50">
                      U.S. International Trade Administration (15 U.S.C. § 4723)
                    </span>
                  </h3>
                  <p class="text-xs text-zinc-400 mt-1">
                    Federal co-investment agreement removing technical barriers to trade and harmonizing international digital health and medical device interoperability standards.
                  </p>
                </div>

                <div class="text-right">
                  <span class="text-xs text-zinc-400 block">Federal Co-Investment</span>
                  <span class="text-xl font-bold font-mono text-amber-400">
                    \${{ itaLedger().matchingGrantAllocatedUsd | number }} / \${{ itaLedger().matchingGrantCeilingUsd | number }}
                  </span>
                </div>
              </div>

              <!-- STANDARDS CONFORMITY PROFILES -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-4">
                  <h4 class="text-sm font-semibold text-zinc-200">
                    Interoperability & Pre-Market Regulatory Attestation
                  </h4>
                  <ul class="space-y-3 text-xs">
                    <li class="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
                      <span>HL7 FHIR R4 (US Core v6.1.0 & USCDI v3)</span>
                      <span class="text-emerald-400 font-mono text-[11px]">CONFORMANT</span>
                    </li>
                    <li class="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
                      <span>ISO/IEEE 11073 Service-Oriented Device Connectivity (SDC)</span>
                      <span class="text-emerald-400 font-mono text-[11px]">CONFORMANT</span>
                    </li>
                    <li class="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
                      <span>EU MDR 2017/745 SaMD Annex I/II Auditability</span>
                      <span class="text-emerald-400 font-mono text-[11px]">VERIFIED</span>
                    </li>
                    <li class="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
                      <span>Technical Non-Tariff Barriers Eliminated</span>
                      <span class="text-amber-400 font-mono text-[11px]">{{ itaLedger().technicalBarriersEliminatedCount }} Standards Tracked</span>
                    </li>
                  </ul>
                </div>

                <div class="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-4">
                  <h4 class="text-sm font-semibold text-zinc-200">
                    Five Eyes (FVEY) Data Sovereignty Interoperability
                  </h4>
                  <ul class="space-y-3 text-xs">
                    <li class="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
                      <span>United States (HIPAA / ONC HTI-1 / US Core)</span>
                      <span class="text-emerald-400 font-mono text-[11px]">ACTIVE</span>
                    </li>
                    <li class="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
                      <span>United Kingdom (NHS DTAC / DSPT / UK Core)</span>
                      <span class="text-emerald-400 font-mono text-[11px]">ACTIVE</span>
                    </li>
                    <li class="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
                      <span>Canada (PIPEDA / PHIPA / CA Baseline)</span>
                      <span class="text-emerald-400 font-mono text-[11px]">ACTIVE</span>
                    </li>
                    <li class="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
                      <span>Australia & New Zealand (TGA SaMD / AU Base / NZ Base)</span>
                      <span class="text-emerald-400 font-mono text-[11px]">ACTIVE</span>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- CRYPTOGRAPHIC INTEGRITY PROVENANCE -->
              <div class="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-semibold text-zinc-300">
                    FDA 21 CFR Part 11 & ITA Provenance Seal
                  </span>
                  <span class="text-[10px] font-mono text-zinc-500">SHA-256 Non-Repudiation Digest</span>
                </div>
                <div class="p-3 rounded bg-zinc-950 font-mono text-[11px] text-teal-400 break-all select-all">
                  {{ itaLedger().cryptographicIntegritySeal }}
                </div>
              </div>
            </section>
          }

          <!-- TAB 5: ALL 50 STATES & 10 CMS REGIONS CROSSWALK MATRIX -->
          @if (activeTab() === 'regional-crosswalk') {
            <section class="space-y-6" aria-labelledby="crosswalk-heading">
              <!-- HEADER & SUMMARY -->
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <div>
                  <h3 id="crosswalk-heading" class="text-base font-semibold text-zinc-100 flex flex-wrap items-center gap-2">
                    Nationwide Medicaid Pediatric Waiver & Regional Office Crosswalk
                    <span class="px-2 py-0.5 text-xs font-mono rounded bg-teal-900/60 text-teal-300 border border-teal-700/50">
                      Title XIX § 1915(c) / TEFRA § 134 / 1115 Demonstrations
                    </span>
                  </h3>
                  <p class="text-xs text-zinc-400 mt-1">
                    Statutory crosswalk covering all 10 CMS Federal Regions and 51 jurisdictions (50 States + DC), modeling institutional caps, PDN hourly rates, assessment instruments, and parental deeming exemptions.
                  </p>
                </div>

                <div class="flex items-center gap-2">
                  <span class="text-xs text-zinc-400 font-mono">Active Jurisdiction:</span>
                  <span class="px-3 py-1 rounded bg-teal-950 text-teal-300 border border-teal-800 text-xs font-bold font-mono">
                    {{ waiverPlan()?.stateProfile?.stateCode }} - {{ waiverPlan()?.stateProfile?.stateName }}
                  </span>
                </div>
              </div>

              <!-- NATIONAL BENCHMARK TELEMETRY CARDS -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div class="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800">
                  <span class="text-[11px] font-medium text-zinc-400 block">Total Jurisdictions</span>
                  <span class="text-xl font-bold font-mono text-zinc-100">
                    {{ crosswalk.nationalSummary().totalJurisdictions }} States & DC
                  </span>
                  <span class="text-[10px] text-teal-400 block font-mono">10 CMS Regional Offices</span>
                </div>

                <div class="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800">
                  <span class="text-[11px] font-medium text-zinc-400 block">Avg Institutional Cap</span>
                  <span class="text-xl font-bold font-mono text-teal-300 tabular-nums">
                    \${{ crosswalk.nationalSummary().averageInstitutionalCapUsd | number }}
                  </span>
                  <span class="text-[10px] text-zinc-500 block font-mono">Range: \${{ crosswalk.nationalSummary().lowestCapState.capUsd | number }} - \${{ crosswalk.nationalSummary().highestCapState.capUsd | number }}</span>
                </div>

                <div class="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800">
                  <span class="text-[11px] font-medium text-zinc-400 block">Median Hourly PDN Rate</span>
                  <span class="text-xl font-bold font-mono text-emerald-400 tabular-nums">
                    \${{ crosswalk.nationalSummary().medianHourlyPdnRateUsd | number }}/hr
                  </span>
                  <span class="text-[10px] text-emerald-500 block font-mono">Licensed Pediatric RN/LVN</span>
                </div>

                <div class="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800">
                  <span class="text-[11px] font-medium text-zinc-400 block">TEFRA § 134 Deeming Exemption</span>
                  <span class="text-xl font-bold font-mono text-amber-300 tabular-nums">
                    {{ crosswalk.nationalSummary().statesWithTefraOptionCount }}/{{ crosswalk.nationalSummary().totalJurisdictions }}
                  </span>
                  <span class="text-[10px] text-zinc-400 block font-mono">63% States Enacted</span>
                </div>
              </div>

              <!-- FILTER & SEARCH TOOLBAR -->
              <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
                <div class="flex flex-wrap items-center gap-2 flex-1">
                  <span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">CMS Region:</span>
                  <select
                    [ngModel]="selectedRegionFilter()"
                    (ngModelChange)="selectedRegionFilter.set($event)"
                    class="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-teal-400 min-h-[44px]">
                    <option value="ALL">All 10 CMS Regions (National Overview)</option>
                    @for (r of cmsRegionsList(); track r.regionNumber) {
                      <option [value]="r.regionNumber">
                        Region {{ r.regionNumber }} - {{ r.regionName.split('-')[1]?.trim() || r.regionName }} ({{ r.statesCovered.join(', ') }})
                      </option>
                    }
                  </select>
                </div>

                <div class="flex items-center gap-2 min-w-[260px]">
                  <div class="relative w-full">
                    <input
                      type="text"
                      [ngModel]="crosswalkSearchQuery()"
                      (ngModelChange)="crosswalkSearchQuery.set($event)"
                      placeholder="Search state, program, or statute..."
                      class="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-teal-400 min-h-[44px]"
                    />
                    <svg class="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                  </div>
                  @if (crosswalkSearchQuery() || selectedRegionFilter() !== 'ALL') {
                    <button
                      type="button"
                      (click)="resetFilters()"
                      class="px-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 rounded-lg min-h-[44px]">
                      Reset
                    </button>
                  }
                </div>
              </div>

              <!-- 51-JURISDICTION TABLE -->
              <div class="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/30">
                <div class="overflow-x-auto max-h-[460px]">
                  <table class="w-full text-left text-xs border-collapse">
                    <thead class="sticky top-0 bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-mono text-[11px] z-10">
                      <tr>
                        <th class="p-3">State / Code</th>
                        <th class="p-3">CMS Region</th>
                        <th class="p-3">Program Title & Authority</th>
                        <th class="p-3">Assessment Instrument</th>
                        <th class="p-3">Plan Form</th>
                        <th class="p-3 text-right">Institutional Cap</th>
                        <th class="p-3 text-right">PDN Rate</th>
                        <th class="p-3 text-center">TEFRA § 134</th>
                        <th class="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-zinc-800/60 font-mono text-zinc-300">
                      @for (item of filteredCrosswalkList(); track item.stateCode) {
                        <tr class="hover:bg-teal-950/20 transition-colors" [class.bg-teal-950/30]="selectedStateWaiver() === item.stateCode">
                          <td class="p-3 font-medium text-zinc-200 whitespace-nowrap">
                            <span class="inline-block font-bold text-teal-400 bg-black/40 px-1.5 py-0.5 rounded mr-1.5">
                              {{ item.stateCode }}
                            </span>
                            <span class="font-sans">{{ item.stateName }}</span>
                            @if (aeromedicalService.getCorridorForJurisdiction(item.stateCode)) {
                              <span class="ml-1.5 px-1.5 py-0.5 text-[9px] font-mono rounded bg-sky-950 text-sky-300 border border-sky-800" title="Emergency Aeromedical Evacuation Corridor Active">
                                ✈️ MEDEVAC
                              </span>
                            }
                          </td>
                          <td class="p-3 whitespace-nowrap text-zinc-400 text-[11px]">
                            R{{ item.cmsRegionNumber }}
                            <span class="text-[10px] text-zinc-500 font-sans hidden lg:inline">
                              ({{ item.cmsRegionName.split('-')[1]?.trim() }})
                            </span>
                          </td>
                          <td class="p-3 font-sans text-xs">
                            <div class="font-medium text-zinc-200">{{ item.programTitle }}</div>
                            <div class="text-[10px] text-zinc-500 font-mono">{{ item.waiverLegalAuthority }} • {{ item.statutoryReference }}</div>
                          </td>
                          <td class="p-3 font-sans text-zinc-300 text-xs">
                            {{ item.assessmentInstrument }}
                          </td>
                          <td class="p-3 text-zinc-400 text-xs">
                            {{ item.planFormIdentifier }}
                          </td>
                          <td class="p-3 text-right font-bold text-zinc-200 tabular-nums whitespace-nowrap">
                            \${{ item.institutionalCapAnnualUsd | number }}
                          </td>
                          <td class="p-3 text-right text-teal-400 tabular-nums whitespace-nowrap">
                            \${{ item.defaultHourlyPdnRateUsd | number }}/hr
                          </td>
                          <td class="p-3 text-center">
                            @if (item.tefraOptionEnacted) {
                              <span class="px-1.5 py-0.5 text-[10px] rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                                ACTIVE
                              </span>
                            } @else {
                              <span class="px-1.5 py-0.5 text-[10px] rounded bg-zinc-800 text-zinc-500">
                                WAIVER ONLY
                              </span>
                            }
                          </td>
                          <td class="p-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              (click)="selectAndActivateState(item.stateCode)"
                              [class.bg-teal-600]="selectedStateWaiver() === item.stateCode"
                              [class.text-white]="selectedStateWaiver() === item.stateCode"
                              [class.bg-zinc-800]="selectedStateWaiver() !== item.stateCode"
                              [class.text-zinc-300]="selectedStateWaiver() !== item.stateCode"
                              class="px-2.5 py-1 text-xs rounded hover:bg-teal-500 hover:text-white transition-colors min-h-[44px] touch-manipulation">
                              {{ selectedStateWaiver() === item.stateCode ? 'Active Plan' : 'Select State' }}
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          }

          <!-- TAB 6: EPSDT FEDERAL APPEAL & ORDER GENERATOR -->
          @if (activeTab() === 'epsdt-appeal') {
            <section class="space-y-6" aria-labelledby="epsdt-appeal-heading">
              <!-- HERO BANNER -->
              <div class="p-4 rounded-xl bg-gradient-to-r from-rose-950/40 via-zinc-900/60 to-zinc-900/40 border border-rose-900/40 space-y-2">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <span class="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></span>
                    <div>
                      <h3 id="epsdt-appeal-heading" class="text-base font-semibold text-zinc-100 flex items-center gap-2">
                        EPSDT Federal Appeal & Mandatory Treatment Engine
                        <span class="px-2 py-0.5 text-xs font-mono rounded bg-rose-950 text-rose-300 border border-rose-800/60">
                          42 U.S.C. § 1396d(r)(5)
                        </span>
                      </h3>
                      <p class="text-xs text-zinc-400">
                        Federal Preemption Over Waiver Waiting Lists • Mandatory In-Home Skilled Nursing • 72-Hr STAT Expedited Resolution
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center gap-2">
                    <span class="text-xs text-zinc-400">Target State:</span>
                    <span class="px-2.5 py-1 text-xs font-mono font-bold rounded bg-zinc-800 text-teal-300 border border-zinc-700">
                      {{ selectedStateWaiver() }} - {{ crosswalk.getStateEntry(selectedStateWaiver())?.stateName || selectedStateWaiver() }}
                    </span>
                    <button
                      type="button"
                      (click)="activeTab.set('regional-crosswalk')"
                      class="px-2 py-1 text-xs rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors min-h-[44px] flex items-center touch-manipulation">
                      Change State
                    </button>
                  </div>
                </div>

                <div class="flex flex-wrap items-center gap-4 text-xs text-zinc-400 pt-1 border-t border-zinc-800/60">
                  <span class="flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>Administering Agency: <strong class="text-zinc-200">{{ crosswalk.getStateEntry(selectedStateWaiver())?.administeringAgency || 'State Medicaid Agency' }}</strong></span>
                  </span>
                  <span class="flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    <span>Aid Paid Pending Deadline: <strong class="text-amber-300 font-mono">{{ epsdtPackage()?.aidPaidPendingDeadlineIso || '10 Days from Notice' }}</strong></span>
                  </span>
                  <span class="flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                    <span>Institutional Diversion Index: <strong class="text-teal-300 font-mono">75% (Diversion Certified)</strong></span>
                  </span>
                </div>
              </div>

              <!-- CONTROLS & DISPUTE CONFIGURATION -->
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- COL 1 & 2: DISPUTE & CLINICAL ORDERS -->
                <div class="lg:col-span-2 space-y-4">
                  <!-- DISPUTE CATEGORY SELECTOR -->
                  <div class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                    <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      Select Dispute Category & Procedural Pathway
                    </label>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      @for (cat of disputeCategories; track cat) {
                        @let def = disputeDefinitions[cat];
                        <button
                          type="button"
                          (click)="setDisputeCategory(cat)"
                          [class.border-teal-500]="epsdtDispute() === cat"
                          [class.bg-zinc-850]="epsdtDispute() === cat"
                          [class.border-zinc-800]="epsdtDispute() !== cat"
                          [class.bg-zinc-900/40]="epsdtDispute() !== cat"
                          class="p-3 text-left rounded-lg border transition-all hover:border-zinc-700 flex flex-col justify-between gap-1 min-h-[44px] touch-manipulation">
                          <div class="flex items-center justify-between gap-2">
                            <span class="text-xs font-bold text-zinc-200">{{ def.label }}</span>
                            <span class="w-2 h-2 rounded-full" [class.bg-teal-400]="epsdtDispute() === cat" [class.bg-zinc-600]="epsdtDispute() !== cat"></span>
                          </div>
                          <p class="text-[11px] text-zinc-400 line-clamp-2">{{ def.description }}</p>
                          <span class="text-[10px] font-mono text-zinc-500">{{ def.statutoryFocus }}</span>
                        </button>
                      }
                    </div>
                  </div>

                  <!-- CLINICAL DIRECTIVE FORM -->
                  <div class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                    <h4 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      Physician Prescription & Hearing Parameters
                    </h4>
                    
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-xs text-zinc-400 mb-1">
                          Prescribed Private Duty Nursing (Hours/Week):
                          <strong class="text-teal-300 font-mono text-sm ml-1">{{ epsdtPdnHours() }} hrs/wk</strong>
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="168"
                          step="2"
                          [ngModel]="epsdtPdnHours()"
                          (ngModelChange)="onPdnHoursChange($event)"
                          class="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-teal-500 min-h-[44px]">
                      </div>

                      @if (epsdtDispute() === 'nursing-hours-reduction') {
                        <div>
                          <label class="block text-xs text-zinc-400 mb-1">
                            Previously Authorized Hours (Aid Paid Pending):
                            <strong class="text-amber-300 font-mono text-sm ml-1">{{ epsdtPriorHours() }} hrs/wk</strong>
                          </label>
                          <input
                            type="range"
                            min="10"
                            max="168"
                            step="2"
                            [ngModel]="epsdtPriorHours()"
                            (ngModelChange)="onPriorHoursChange($event)"
                            class="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500 min-h-[44px]">
                        </div>
                      } @else {
                        <div>
                          <label class="block text-xs text-zinc-400 mb-1">Notice / Adverse Action Date:</label>
                          <input
                            type="date"
                            [ngModel]="epsdtNoticeDate()"
                            (ngModelChange)="onNoticeDateChange($event)"
                            class="w-full px-3 py-2 text-xs rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 focus:outline-none focus:border-teal-500 min-h-[44px]">
                        </div>
                      }
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-800/60">
                      <div>
                        <label class="block text-[11px] text-zinc-400 mb-1">Ordering Physician Name & Title</label>
                        <input
                          type="text"
                          [ngModel]="epsdtPhysicianName()"
                          (ngModelChange)="epsdtPhysicianName.set($event); generateEpsdtAppeal()"
                          class="w-full px-3 py-1.5 text-xs rounded bg-zinc-800 border border-zinc-700 text-zinc-200 focus:border-teal-500 min-h-[44px]">
                      </div>
                      <div>
                        <label class="block text-[11px] text-zinc-400 mb-1">Physician NPI (10-Digit Identifier)</label>
                        <input
                          type="text"
                          [ngModel]="epsdtPhysicianNpi()"
                          (ngModelChange)="epsdtPhysicianNpi.set($event); generateEpsdtAppeal()"
                          class="w-full px-3 py-1.5 text-xs rounded bg-zinc-800 border border-zinc-700 text-zinc-200 font-mono focus:border-teal-500 min-h-[44px]">
                      </div>
                      <div>
                        <label class="block text-[11px] text-zinc-400 mb-1">Clinical Subspecialty</label>
                        <input
                          type="text"
                          [ngModel]="epsdtPhysicianSpecialty()"
                          (ngModelChange)="epsdtPhysicianSpecialty.set($event); generateEpsdtAppeal()"
                          class="w-full px-3 py-1.5 text-xs rounded bg-zinc-800 border border-zinc-700 text-zinc-200 focus:border-teal-500 min-h-[44px]">
                      </div>
                      <div>
                        <label class="block text-[11px] text-zinc-400 mb-1">Hospital / Complex Care Center</label>
                        <input
                          type="text"
                          [ngModel]="epsdtClinicName()"
                          (ngModelChange)="epsdtClinicName.set($event); generateEpsdtAppeal()"
                          class="w-full px-3 py-1.5 text-xs rounded bg-zinc-800 border border-zinc-700 text-zinc-200 focus:border-teal-500 min-h-[44px]">
                      </div>
                    </div>

                    <div class="flex items-center gap-3 pt-2">
                      <label class="flex items-center gap-2 cursor-pointer min-h-[44px]">
                        <input
                          type="checkbox"
                          [checked]="epsdtIsStat()"
                          (change)="toggleStatExpedited()"
                          class="w-4 h-4 rounded text-rose-600 bg-zinc-800 border-zinc-700 focus:ring-rose-500">
                        <span class="text-xs font-semibold text-rose-300">
                          Demand STAT Expedited Resolution (42 C.F.R. § 438.410 — 72-Hour Turnaround)
                        </span>
                      </label>
                    </div>
                  </div>

                  <!-- VOICE-GUIDED CLINICAL AIRWAY EVENT DICTATION (Option 3) -->
                  <div class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <h4 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                        <span class="text-teal-400">🎙️</span>
                        Voice-Guided Clinical Dictation (Airway Events & Urgent Orders)
                      </h4>
                      <div class="flex items-center gap-2">
                        @if (isDictating()) {
                          <span class="flex items-center gap-1.5 text-[11px] font-mono text-rose-400">
                            <span class="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                            Dictating (Listening)...
                          </span>
                        } @else {
                          <span class="text-[11px] font-mono text-zinc-500">
                            {{ speechSupported() ? 'Web Speech API Active' : 'Clinical Chips Active' }}
                          </span>
                        }
                        <button
                          type="button"
                          (click)="toggleDictation()"
                          [class.bg-rose-600]="isDictating()"
                          [class.hover:bg-rose-500]="isDictating()"
                          [class.bg-teal-600]="!isDictating()"
                          [class.hover:bg-teal-500]="!isDictating()"
                          class="px-3 py-1.5 text-xs font-semibold rounded-lg text-white transition-colors flex items-center gap-1.5 min-h-[44px] touch-manipulation shadow-sm">
                          @if (isDictating()) {
                            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd"/>
                            </svg>
                            <span>Stop Dictating</span>
                          } @else {
                            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clip-rule="evenodd"/>
                            </svg>
                            <span>Dictate Airway Event</span>
                          }
                        </button>
                      </div>
                    </div>

                    <div>
                      <textarea
                        rows="2"
                        [ngModel]="dictatedText()"
                        (ngModelChange)="onDictatedTextChange($event)"
                        placeholder="Dictate or type patient-specific airway events (e.g. nocturnal desaturation to 78%, sterile catheter suctioning, mucus plug occlusion, decannulation)..."
                        class="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-teal-400 font-mono leading-relaxed resize-none"></textarea>
                    </div>

                    <!-- CLINICAL EVENT QUICK-INSERT CHIPS -->
                    <div class="space-y-1.5">
                      <span class="text-[10px] text-zinc-500 uppercase tracking-wider block">Clinical Event Presets (1-Click Clinical Insertion):</span>
                      <div class="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          (click)="applyPresetDictation('Patient experienced nocturnal desaturation to 78% due to acute mucus plug occlusion requiring sterile catheter suctioning.')"
                          class="px-2.5 py-1 text-[11px] rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors border border-zinc-700/60 min-h-[36px] text-left">
                          ⚡ Nocturnal Desat (78%) Mucus Plug
                        </button>
                        <button
                          type="button"
                          (click)="applyPresetDictation('Accidental partial decannulation occurred during night repositioning with acute cyanosis requiring emergency re-cannulation by skilled nurse.')"
                          class="px-2.5 py-1 text-[11px] rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors border border-zinc-700/60 min-h-[36px] text-left">
                          ⚡ Decannulation & Cyanosis
                        </button>
                        <button
                          type="button"
                          (click)="applyPresetDictation('Copious purulent tracheal secretions with SpO2 dropping to 82%, resolved with continuous in-line suctioning.')"
                          class="px-2.5 py-1 text-[11px] rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors border border-zinc-700/60 min-h-[36px] text-left">
                          ⚡ Copious Secretions / SpO2 82%
                        </button>
                        @if (dictatedText()) {
                          <button
                            type="button"
                            (click)="clearDictation()"
                            class="px-2 py-1 text-[11px] rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 min-h-[36px]">
                            ✕ Clear Dictation
                          </button>
                        }
                      </div>
                    </div>
                  </div>

                  <!-- AEROMEDICAL EVACUATION CORRIDOR HUD (Option 2) -->
                  @if (currentCorridor(); as corridor) {
                    <div class="p-4 rounded-xl bg-sky-950/20 border border-sky-800/50 space-y-4 animate-in fade-in">
                      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-sky-800/40 pb-2.5">
                        <div class="flex items-center gap-2">
                          <span class="text-base">✈️</span>
                          <div>
                            <h4 class="text-xs font-bold text-sky-200 uppercase tracking-wider">
                              Remote Island & Frontier Aeromedical Evacuation Corridor
                            </h4>
                            <span class="text-[11px] text-sky-400 font-mono">
                              {{ corridor.jurisdictionName }} ({{ corridor.jurisdictionCode }}) ➔ {{ corridor.destinationCityState }}
                            </span>
                          </div>
                        </div>
                        <div class="flex items-center gap-3">
                          <span class="px-2 py-0.5 text-[10px] font-mono rounded bg-sky-900/60 text-sky-200 border border-sky-700">
                            {{ corridor.preferredAircraft }}
                          </span>
                          <label class="flex items-center gap-1.5 cursor-pointer text-xs text-sky-300 min-h-[44px]">
                            <input
                              type="checkbox"
                              [checked]="includeAeromedicalInAppeal()"
                              (change)="toggleIncludeAeromedical()"
                              class="w-4 h-4 rounded text-sky-600 bg-zinc-800 border-zinc-700 focus:ring-sky-500">
                            <span>Include in Appeal Dossier</span>
                          </label>
                        </div>
                      </div>

                      <!-- CORRIDOR METRICS GRID -->
                      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div class="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800">
                          <span class="text-[10px] text-zinc-500 block uppercase font-mono">Air Distance</span>
                          <span class="font-bold font-mono text-sky-300 text-sm">
                            {{ corridor.distanceNauticalMiles | number }} NM
                          </span>
                          <span class="text-[10px] text-zinc-400 block font-mono">({{ corridor.distanceStatuteMiles | number }} mi)</span>
                        </div>

                        <div class="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800">
                          <span class="text-[10px] text-zinc-500 block uppercase font-mono">Est. Flight Duration</span>
                          <span class="font-bold font-mono text-amber-300 text-sm">
                            {{ corridor.estimatedFlightHours }} Hours
                          </span>
                          <span class="text-[10px] text-zinc-400 block font-mono">@ {{ corridor.cruiseSpeedKnots }} kts</span>
                        </div>

                        <div class="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800">
                          <span class="text-[10px] text-zinc-500 block uppercase font-mono">Origin Airfield</span>
                          <span class="font-bold font-mono text-zinc-200 text-xs truncate block" [title]="corridor.originFacility">
                            {{ corridor.originIcao }}
                          </span>
                          <span class="text-[10px] text-zinc-400 block truncate">{{ corridor.originFacility.split('/')[0] }}</span>
                        </div>

                        <div class="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800">
                          <span class="text-[10px] text-zinc-500 block uppercase font-mono">Tertiary PICU</span>
                          <span class="font-bold font-mono text-emerald-300 text-xs truncate block" [title]="corridor.destinationHospital">
                            {{ corridor.destinationIcao }}
                          </span>
                          <span class="text-[10px] text-emerald-400 block truncate">{{ corridor.destinationHospital.split('/')[0] }}</span>
                        </div>
                      </div>

                      <!-- IN-FLIGHT OXYGEN CALCULATION (FAA/DoD 2.0x Safety Margin) -->
                      <div class="p-3 rounded-lg bg-zinc-950/90 border border-sky-900/50 space-y-2">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                          <span class="text-xs font-semibold text-sky-300 flex items-center gap-1.5">
                            <span>🫁</span>
                            Aeronautical O₂ Tank Reserve (FAA/DoD 2.0x Safety Margin)
                          </span>
                          <div class="flex items-center gap-2">
                            <label class="text-[11px] text-zinc-400">Prescribed Flow:</label>
                            <div class="flex items-center gap-1">
                              <input
                                type="number"
                                min="0.5"
                                max="15"
                                step="0.5"
                                [ngModel]="o2FlowLpm()"
                                (ngModelChange)="onO2FlowChange($event)"
                                class="w-16 px-2 py-1 text-xs font-mono rounded bg-zinc-900 border border-zinc-700 text-teal-300 text-center min-h-[36px]">
                              <span class="text-xs text-zinc-400 font-mono">L/min</span>
                            </div>
                          </div>
                        </div>

                        @if (o2Calculation(); as o2) {
                          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                            <div class="p-2 rounded bg-zinc-900 border border-zinc-800">
                              <span class="text-[10px] text-zinc-500 block font-mono">Baseline Gas Demand:</span>
                              <span class="font-mono font-bold text-zinc-300">{{ o2.baselineOxygenLiters | number }} Liters</span>
                              <span class="text-[10px] text-zinc-500 block font-mono">{{ o2.flightDurationMinutes }} min flight</span>
                            </div>
                            <div class="p-2 rounded bg-zinc-900 border border-zinc-800">
                              <span class="text-[10px] text-zinc-500 block font-mono">Required O₂ (2.0x Margin):</span>
                              <span class="font-mono font-bold text-sky-300 text-sm">{{ o2.totalRequiredOxygenLiters | number }} Liters</span>
                              <span class="text-[10px] text-sky-500 block font-mono">100% Diversion Reserve</span>
                            </div>
                            <div class="p-2 rounded bg-zinc-900 border border-zinc-800">
                              <span class="text-[10px] text-zinc-500 block font-mono">Required Cylinders:</span>
                              <span class="font-mono font-bold text-emerald-400">{{ o2.standardECylinderCount }}x E-Tanks</span>
                              <span class="text-[10px] text-zinc-400 block font-mono">(or {{ o2.standardMCylinderCount }}x M-Tank)</span>
                            </div>
                          </div>
                        }
                      </div>

                      <!-- HCPCS BILLING & STATUTORY WAIVER -->
                      @if (billingSummary(); as bill) {
                        <div class="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                          <div class="space-y-1">
                            <span class="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
                              Emergency Air Ambulance Medicaid Codes (EMTALA / 42 C.F.R. § 440.170)
                            </span>
                            <div class="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                              <span class="px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-700">
                                Base: HCPCS {{ bill.baseHcpcsCode }} (\${{ bill.estimatedBaseAllowanceUsd | number }})
                              </span>
                              <span class="px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-700">
                                Mileage: HCPCS {{ bill.mileageHcpcsCode }} (\${{ bill.estimatedMileageAllowanceUsd | number }})
                              </span>
                              <span class="px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800 font-bold">
                                Est. Allowable: \${{ bill.estimatedTotalTransportUsd | number }}
                              </span>
                            </div>
                          </div>
                          <span class="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-2.5 py-1.5 rounded border border-emerald-800/80 whitespace-nowrap">
                            ✓ Prior-Approval Waived for STAT Emergency
                          </span>
                        </div>
                      }

                      <!-- LIVE AVIATION WEATHER & CABIN HYPOXIA CLEARANCE TELEMETRY (Option C) -->
                      @if (flightClearance(); as fc) {
                        <div class="p-3.5 rounded-lg bg-zinc-950/90 border border-sky-800/60 space-y-3">
                          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
                            <span class="text-xs font-bold text-sky-200 uppercase tracking-wider flex items-center gap-1.5">
                              <span>🌤️</span>
                              Aviation Weather Clearance & Hypoxia Dispatch Status
                            </span>
                            <span
                              [class.bg-emerald-950]="fc.clearanceStatus === 'CLEARED_FOR_DEPARTURE'"
                              [class.text-emerald-300]="fc.clearanceStatus === 'CLEARED_FOR_DEPARTURE'"
                              [class.border-emerald-800]="fc.clearanceStatus === 'CLEARED_FOR_DEPARTURE'"
                              [class.bg-amber-950]="fc.clearanceStatus === 'ADVISORY_CAUTION'"
                              [class.text-amber-300]="fc.clearanceStatus === 'ADVISORY_CAUTION'"
                              [class.border-amber-800]="fc.clearanceStatus === 'ADVISORY_CAUTION'"
                              class="px-2.5 py-1 text-[11px] font-mono font-bold rounded border">
                              {{ fc.clearanceStatus === 'CLEARED_FOR_DEPARTURE' ? '✈️ CLEARED FOR DEPARTURE' : '⚠️ ADVISORY CAUTION' }}
                            </span>
                          </div>

                          <!-- METAR REPORTS FOR ORIGIN & DESTINATION -->
                          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                            <div class="p-2.5 rounded bg-zinc-900/90 border border-zinc-800 space-y-1">
                              <div class="flex items-center justify-between text-[11px]">
                                <span class="font-bold text-teal-300">{{ fc.originWeather.icao }} (Origin)</span>
                                <span class="px-1.5 py-0.2 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800">
                                  {{ fc.originWeather.flightCategory }}
                                </span>
                              </div>
                              <p class="text-[10px] text-zinc-400 truncate">{{ fc.originWeather.name }}</p>
                              <div class="text-[11px] text-zinc-300">
                                Wind: {{ fc.originWeather.windDirectionDeg }}° @ {{ fc.originWeather.windSpeedKnots }} kts (X-Wind: {{ fc.originWeather.crosswindKnots }} kts)
                              </div>
                              <div class="text-[10px] text-zinc-500 truncate" [title]="fc.originWeather.rawMetar">
                                {{ fc.originWeather.rawMetar }}
                              </div>
                            </div>

                            <div class="p-2.5 rounded bg-zinc-900/90 border border-zinc-800 space-y-1">
                              <div class="flex items-center justify-between text-[11px]">
                                <span class="font-bold text-teal-300">{{ fc.destinationWeather.icao }} (Destination)</span>
                                <span class="px-1.5 py-0.2 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800">
                                  {{ fc.destinationWeather.flightCategory }}
                                </span>
                              </div>
                              <p class="text-[10px] text-zinc-400 truncate">{{ fc.destinationWeather.name }}</p>
                              <div class="text-[11px] text-zinc-300">
                                Wind: {{ fc.destinationWeather.windDirectionDeg }}° @ {{ fc.destinationWeather.windSpeedKnots }} kts (X-Wind: {{ fc.destinationWeather.crosswindKnots }} kts)
                              </div>
                              <div class="text-[10px] text-zinc-500 truncate" [title]="fc.destinationWeather.rawMetar">
                                {{ fc.destinationWeather.rawMetar }}
                              </div>
                            </div>
                          </div>

                          <!-- CABIN ALTITUDE HYPOXIA COMPENSATION DIRECTIVE -->
                          <div class="p-2.5 rounded bg-amber-950/30 border border-amber-800/40 text-xs space-y-1">
                            <div class="flex items-center justify-between">
                              <span class="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                                <span>🫁</span>
                                Pressurized Cabin Hypoxia Compensation (8,000 ft Cabin Equivalent)
                              </span>
                              <span class="text-[10px] font-mono text-amber-400">
                                Ambient PO₂: {{ fc.hypoxiaAssessment.cabinPressureMmHg }} mmHg (-{{ fc.hypoxiaAssessment.relativePo2ReductionPercent }}%)
                              </span>
                            </div>
                            <p class="text-[11px] text-amber-200/90 leading-relaxed">
                              {{ fc.hypoxiaAssessment.clinicalPhysiologyDirective }}
                            </p>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>

                <!-- COL 3: STATUTORY CASE LAW & SUMMARY HUD -->
                <div class="space-y-4">
                  <div class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                    <h4 class="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                      <span class="text-amber-400">⚖️</span>
                      Binding Federal Precedents
                    </h4>
                    <div class="space-y-2 text-xs">
                      <div class="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
                        <strong class="text-teal-300 block">O.B. v. Norwood, 838 F.3d 483</strong>
                        <p class="text-zinc-400 mt-1 text-[11px]">
                          7th Cir. federal injunction: States cannot cite nursing shortages or budget constraints to avoid providing in-home skilled care to children with tracheostomies.
                        </p>
                      </div>
                      <div class="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
                        <strong class="text-teal-300 block">Moore v. Reese, 637 F.3d 1220</strong>
                        <p class="text-zinc-400 mt-1 text-[11px]">
                          11th Cir. standard: The treating physician's assessment of medical necessity is entitled to primary deference against state administrative denials.
                        </p>
                      </div>
                      <div class="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
                        <strong class="text-teal-300 block">42 C.F.R. § 431.230 (Aid Paid Pending)</strong>
                        <p class="text-zinc-400 mt-1 text-[11px]">
                          If an appeal is filed within 10 days of notice, the state is legally prohibited from reducing nursing hours until the hearing decision is rendered.
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- ACTIONS CARD -->
                  <div class="p-4 rounded-xl bg-teal-950/20 border border-teal-800/40 space-y-3">
                    <h4 class="text-xs font-semibold text-teal-300 uppercase tracking-wider">
                      Legal Dossier Output Actions
                    </h4>
                    <div class="space-y-2">
                      <button
                        type="button"
                        (click)="copyActiveDocument()"
                        class="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors flex items-center justify-center gap-2 min-h-[44px] touch-manipulation">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                        </svg>
                        <span>Copy Active Document</span>
                      </button>

                      <button
                        type="button"
                        (click)="downloadAppealPackage()"
                        class="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors flex items-center justify-center gap-2 min-h-[44px] touch-manipulation">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                        </svg>
                        <span>Download Complete Dossier (.md)</span>
                      </button>

                      <button
                        type="button"
                        (click)="exportFhirEpsdtBundle()"
                        class="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-teal-800 hover:bg-teal-700 text-teal-100 transition-colors flex items-center justify-center gap-2 min-h-[44px] touch-manipulation shadow-sm"
                        title="Export HL7 FHIR R4 Bundle with ServiceRequest and DocumentReference">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        <span>Export FHIR R4 Appeal Bundle</span>
                      </button>

                      <button
                        type="button"
                        (click)="downloadSchoolIepPlan()"
                        class="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-indigo-900/60 hover:bg-indigo-800/80 text-indigo-200 transition-colors flex items-center justify-center gap-2 min-h-[44px] touch-manipulation border border-indigo-700/50"
                        title="Download School Nursing Care Plan and IDEA 504 Transition Plan">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                        </svg>
                        <span>Download School IEP Plan (.md)</span>
                      </button>

                      <button
                        type="button"
                        (click)="downloadEdi278()"
                        class="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-amber-950/60 hover:bg-amber-900/70 text-amber-200 transition-colors flex items-center justify-center gap-2 min-h-[44px] touch-manipulation border border-amber-700/50"
                        title="Download ASC X12N 005010X217 (EDI 278) Prior Authorization Transaction">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
                        </svg>
                        <span>Download EDI 278 Prior Auth (.x12)</span>
                      </button>

                      @if (currentCorridor()) {
                        <button
                          type="button"
                          (click)="downloadEdi837p()"
                          class="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-sky-950/60 hover:bg-sky-900/70 text-sky-200 transition-colors flex items-center justify-center gap-2 min-h-[44px] touch-manipulation border border-sky-700/50"
                          title="Download ASC X12N 005010X222A1 (EDI 837P) Air Ambulance Claim Transaction">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          <span>Download EDI 837P Claim (.x12)</span>
                        </button>
                      }
                    </div>

                    @if (copyNotification()) {
                      <div class="p-2 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs text-center animate-in fade-in">
                        {{ copyNotification() }}
                      </div>
                    }

                    <div class="pt-2 border-t border-zinc-800/60 text-[10px] font-mono text-zinc-500 truncate" title="SHA-256 Digest">
                      SHA-256: {{ epsdtPackage()?.cryptographicIntegrityDigest || 'Calculating...' }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- DOCUMENT VIEWER -->
              <div class="rounded-xl bg-zinc-900/60 border border-zinc-800 overflow-hidden space-y-0">
                <!-- SUB-DOC SELECTOR BAR -->
                <div class="flex flex-wrap items-center justify-between border-b border-zinc-800 bg-zinc-950/60 px-4 py-2 gap-2">
                  <div class="flex items-center gap-1 overflow-x-auto">
                    <button
                      type="button"
                      (click)="epsdtActiveDoc.set('physician-order')"
                      [class.bg-zinc-800]="epsdtActiveDoc() === 'physician-order'"
                      [class.text-teal-300]="epsdtActiveDoc() === 'physician-order'"
                      [class.text-zinc-400]="epsdtActiveDoc() !== 'physician-order'"
                      class="px-3 py-1.5 text-xs rounded font-medium hover:text-zinc-200 transition-colors min-h-[44px] flex items-center touch-manipulation whitespace-nowrap">
                      1. Physician Order
                    </button>
                    <button
                      type="button"
                      (click)="epsdtActiveDoc.set('fair-hearing')"
                      [class.bg-zinc-800]="epsdtActiveDoc() === 'fair-hearing'"
                      [class.text-teal-300]="epsdtActiveDoc() === 'fair-hearing'"
                      [class.text-zinc-400]="epsdtActiveDoc() !== 'fair-hearing'"
                      class="px-3 py-1.5 text-xs rounded font-medium hover:text-zinc-200 transition-colors min-h-[44px] flex items-center touch-manipulation whitespace-nowrap">
                      2. Fair Hearing & Aid Paid Pending
                    </button>
                    <button
                      type="button"
                      (click)="epsdtActiveDoc.set('legal-brief')"
                      [class.bg-zinc-800]="epsdtActiveDoc() === 'legal-brief'"
                      [class.text-teal-300]="epsdtActiveDoc() === 'legal-brief'"
                      [class.text-zinc-400]="epsdtActiveDoc() !== 'legal-brief'"
                      class="px-3 py-1.5 text-xs rounded font-medium hover:text-zinc-200 transition-colors min-h-[44px] flex items-center touch-manipulation whitespace-nowrap">
                      3. Bench Brief
                    </button>
                    <button
                      type="button"
                      (click)="epsdtActiveDoc.set('statutes')"
                      [class.bg-zinc-800]="epsdtActiveDoc() === 'statutes'"
                      [class.text-teal-300]="epsdtActiveDoc() === 'statutes'"
                      [class.text-zinc-400]="epsdtActiveDoc() !== 'statutes'"
                      class="px-3 py-1.5 text-xs rounded font-medium hover:text-zinc-200 transition-colors min-h-[44px] flex items-center touch-manipulation whitespace-nowrap">
                      4. Statutes
                    </button>
                    <button
                      type="button"
                      (click)="epsdtActiveDoc.set('school-iep')"
                      [class.bg-zinc-800]="epsdtActiveDoc() === 'school-iep'"
                      [class.text-indigo-300]="epsdtActiveDoc() === 'school-iep'"
                      [class.text-zinc-400]="epsdtActiveDoc() !== 'school-iep'"
                      class="px-3 py-1.5 text-xs rounded font-medium hover:text-zinc-200 transition-colors min-h-[44px] flex items-center touch-manipulation whitespace-nowrap">
                      5. School IEP Plan (IDEA § 504)
                    </button>
                    <button
                      type="button"
                      (click)="epsdtActiveDoc.set('edi-278')"
                      [class.bg-zinc-800]="epsdtActiveDoc() === 'edi-278'"
                      [class.text-amber-300]="epsdtActiveDoc() === 'edi-278'"
                      [class.text-zinc-400]="epsdtActiveDoc() !== 'edi-278'"
                      class="px-3 py-1.5 text-xs rounded font-medium hover:text-zinc-200 transition-colors min-h-[44px] flex items-center touch-manipulation whitespace-nowrap">
                      6. EDI 278 Prior Auth
                    </button>
                    @if (currentCorridor()) {
                      <button
                        type="button"
                        (click)="epsdtActiveDoc.set('edi-837p')"
                        [class.bg-zinc-800]="epsdtActiveDoc() === 'edi-837p'"
                        [class.text-sky-300]="epsdtActiveDoc() === 'edi-837p'"
                        [class.text-zinc-400]="epsdtActiveDoc() !== 'edi-837p'"
                        class="px-3 py-1.5 text-xs rounded font-medium hover:text-zinc-200 transition-colors min-h-[44px] flex items-center touch-manipulation whitespace-nowrap">
                        7. EDI 837P Air Claim
                      </button>
                    }
                  </div>

                  <span class="text-[11px] text-zinc-500 font-mono">
                    Jurisdiction: {{ selectedStateWaiver() }} • 42 U.S.C. § 1396d(r)(5)
                  </span>
                </div>

                <!-- PREVIEW CONTENT AREA -->
                <div class="p-5 bg-zinc-950/80 font-mono text-xs leading-relaxed text-zinc-300 max-h-[450px] overflow-y-auto whitespace-pre-wrap select-text">
                  @if (epsdtActiveDoc() === 'physician-order') {
                    {{ epsdtPackage()?.physicianLetterOfMedicalNecessity || 'Generating Physician Order...' }}
                  } @else if (epsdtActiveDoc() === 'fair-hearing') {
                    {{ epsdtPackage()?.fairHearingPetition || 'Generating Fair Hearing Petition...' }}
                  } @else if (epsdtActiveDoc() === 'legal-brief') {
                    {{ epsdtPackage()?.federalCaseLawBrief || 'Generating Federal Case Law Brief...' }}
                  } @else if (epsdtActiveDoc() === 'statutes') {
                    <div class="space-y-3 font-sans">
                      <h5 class="text-xs font-bold uppercase tracking-wider text-teal-300 font-mono">
                        Compulsory Statutory & Administrative Authorities
                      </h5>
                      <ul class="space-y-2 text-zinc-300">
                        @for (cite of epsdtPackage()?.statutoryCitations; track cite) {
                          <li class="p-2.5 rounded bg-zinc-900/60 border border-zinc-800 flex items-start gap-2">
                            <span class="text-teal-400 font-mono font-bold">§</span>
                            <span>{{ cite }}</span>
                          </li>
                        }
                      </ul>
                    </div>
                  } @else if (epsdtActiveDoc() === 'school-iep') {
                    {{ schoolIepPackage()?.fullDossierMarkdown || 'Generating School IEP / IDEA 504 Transition Plan...' }}
                  } @else if (epsdtActiveDoc() === 'edi-278') {
                    {{ edi278Document()?.rawEdiContent || 'Generating ASC X12N 005010X217 (EDI 278) Prior Authorization...' }}
                  } @else if (epsdtActiveDoc() === 'edi-837p') {
                    {{ edi837pDocument()?.rawEdiContent || 'Generating ASC X12N 005010X222A1 (EDI 837P) Air Ambulance Claim...' }}
                  }
                </div>
              </div>
            </section>
          }
        </main>

        <!-- FOOTER -->
        <footer class="px-6 py-3 border-t border-zinc-800/80 bg-zinc-900/40 flex flex-col md:flex-row items-center justify-between text-xs text-zinc-500 gap-2">
          <div>
            Pocket-Gull MDCP Core Engine • HIPAA §164.514 De-Identified • HL7 FHIR R4 Bundle Standard
          </div>
          <div class="flex items-center gap-4">
            <span class="font-mono text-zinc-400">Award: {{ itaLedger().awardIdentifier }}</span>
            <button
              type="button"
              (click)="closeModal()"
              class="text-zinc-400 hover:text-zinc-200 transition-colors underline min-h-[44px] flex items-center touch-manipulation">
              Return to Clinical Workspace
            </button>
          </div>
        </footer>

      </div>
    </div>
  `
})
export class MdcpGovernanceHubComponent {
  private mdcpService = inject(MdcpDomainService);
  private patientState = inject(PatientStateService);
  private patientMgmt = inject(PatientManagementService, { optional: true });
  private fhirExportStrategy = inject(FhirExportStrategyService);
  private navShell = inject(NavigationShellService);

  readonly activeTab = signal<MdcpTab>('pediatric-waiver');

  readonly waiverPlan = this.mdcpService.currentWaiverPlan;
  readonly hospitalPlan = this.mdcpService.currentHospitalPlan;
  readonly deviceTelemetry = this.mdcpService.liveDeviceTelemetry;
  readonly itaLedger = this.mdcpService.itaStandardsLedger;

  readonly selectedStateWaiver = this.mdcpService.selectedStateWaiver;
  readonly stateWaiverProfiles = STATE_WAIVER_PROFILES;
  readonly stateProfileKeys = Object.keys(STATE_WAIVER_PROFILES) as StateWaiverProgramKey[];

  readonly crosswalk = inject(StateRegionalCrosswalkService);
  readonly selectedRegionFilter = signal<CmsRegionNumber | 'ALL'>('ALL');
  readonly crosswalkSearchQuery = signal<string>('');

  readonly cmsRegionsList = computed(() => Object.values(this.crosswalk.cmsRegions()));
  readonly all50StatesList = computed(() => Object.values(this.crosswalk.allCrosswalkEntries()));

  readonly filteredCrosswalkList = computed(() => {
    const region = this.selectedRegionFilter();
    const query = this.crosswalkSearchQuery().trim().toLowerCase();

    let list = Object.values(this.crosswalk.allCrosswalkEntries());
    if (region !== 'ALL') {
      list = list.filter(item => item.cmsRegionNumber === Number(region));
    }
    if (query) {
      list = list.filter(item =>
        item.stateCode.toLowerCase().includes(query) ||
        item.stateName.toLowerCase().includes(query) ||
        item.programTitle.toLowerCase().includes(query) ||
        item.waiverLegalAuthority.toLowerCase().includes(query) ||
        item.assessmentInstrument.toLowerCase().includes(query) ||
        item.statutoryReference.toLowerCase().includes(query)
      );
    }
    return list;
  });

  readonly rtmmsList = Object.values(IEEE_11073_NOMENCLATURE);

  readonly achievedMilestonesCount = computed(() => {
    return this.hospitalPlan()?.milestones.filter(m => m.status === 'ACHIEVED').length ?? 0;
  });

  public setStateWaiver(key: StateWaiverProgramKey): void {
    this.mdcpService.setStateWaiverProgram(key);
  }

  public selectAndActivateState(stateCode: string): void {
    this.mdcpService.setStateByCode(stateCode);
    this.activeTab.set('pediatric-waiver');
  }

  public resetFilters(): void {
    this.selectedRegionFilter.set('ALL');
    this.crosswalkSearchQuery.set('');
  }

  public toggleMilestone(m: IDisciplineGoalMilestone): void {
    const newStatus = m.status === 'ACHIEVED' ? 'IN_PROGRESS' : 'ACHIEVED';
    this.mdcpService.updateMultidisciplinaryMilestone(m.id, newStatus);
  }

  public simulateIeeeStream(): void {
    this.mdcpService.generateSimulatedIeee11073Telemetry();
  }

  public exportFhirBundle(): void {
    const pt = this.patientMgmt?.selectedPatient();
    if (pt) {
      this.fhirExportStrategy.exportMdcpBundle(pt);
    }
  }

  // ---------------------------------------------------------------------------
  // TAB 6: EPSDT ADVOCACY & APPEAL ENGINE
  // ---------------------------------------------------------------------------
  readonly epsdtService = inject(EpsdtAdvocacyService);
  readonly aeromedicalService = inject(AeromedicalTransportService);
  readonly ediService = inject(EdiClaimsGeneratorService);
  readonly weatherService = inject(AviationWeatherClearanceService);
  readonly iepService = inject(SchoolIepTransitionService);

  readonly disputeDefinitions = EPSDT_DISPUTE_DEFINITIONS;
  readonly disputeCategories = Object.keys(EPSDT_DISPUTE_DEFINITIONS) as EpsdtDisputeCategory[];

  readonly epsdtDispute = signal<EpsdtDisputeCategory>('waiver-waitlist-bypass');
  readonly epsdtPdnHours = signal<number>(40);
  readonly epsdtPriorHours = signal<number>(40);
  readonly epsdtIsStat = signal<boolean>(true);
  readonly epsdtPhysicianName = signal<string>('Dr. Eleanor Vance, MD, FAAP');
  readonly epsdtPhysicianNpi = signal<string>('1982736450');
  readonly epsdtPhysicianSpecialty = signal<string>('Pediatric Pulmonology & Complex Care');
  readonly epsdtClinicName = signal<string>('Doernbecher / Seattle Children’s Complex Care Center');
  readonly epsdtNoticeDate = signal<string>(new Date().toISOString().split('T')[0]);
  readonly epsdtActiveDoc = signal<
    'physician-order' | 'fair-hearing' | 'legal-brief' | 'statutes' | 'school-iep' | 'edi-278' | 'edi-837p'
  >('physician-order');
  readonly epsdtPackage = signal<IEpsdtAppealPackage | null>(null);
  readonly copyNotification = signal<string | null>(null);

  readonly edi278Document = signal<IEdiDocumentMetadata | null>(null);
  readonly edi837pDocument = signal<IEdiDocumentMetadata | null>(null);
  readonly schoolIepPackage = signal<ISchoolIepPackage | null>(null);

  // ---------------------------------------------------------------------------
  // OPTION 2 & C: AEROMEDICAL CORRIDORS, WEATHER CLEARANCE & OXYGEN MATH
  // ---------------------------------------------------------------------------
  readonly currentCorridor = computed(() => this.aeromedicalService.getCorridorForJurisdiction(this.selectedStateWaiver()));
  readonly o2FlowLpm = signal<number>(2.0);
  readonly includeAeromedicalInAppeal = signal<boolean>(true);

  readonly flightClearance = computed(() => {
    const c = this.currentCorridor();
    if (!c) return null;
    return this.weatherService.evaluateFlightClearance(c, this.o2FlowLpm());
  });

  readonly o2Calculation = computed(() => {
    const c = this.currentCorridor();
    if (!c) return null;
    return this.aeromedicalService.calculateOxygenReserve(this.o2FlowLpm(), c.estimatedFlightHours);
  });

  readonly billingSummary = computed(() => {
    const c = this.currentCorridor();
    if (!c) return null;
    return this.aeromedicalService.calculateBillingSummary(c);
  });

  // ---------------------------------------------------------------------------
  // OPTION 3: VOICE-GUIDED CLINICAL DICTATION (Web Speech API)
  // ---------------------------------------------------------------------------
  readonly isDictating = signal<boolean>(false);
  readonly dictatedText = signal<string>('');
  readonly speechSupported = signal<boolean>(
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  );
  private speechRecognitionInstance: any = null;

  // ---------------------------------------------------------------------------
  // OPTION 4: ZERO-EGRESS OFFLINE EDGE CACHING
  // ---------------------------------------------------------------------------
  readonly isOfflineCached = signal<boolean>(true);
  readonly offlineCacheStats = signal<{ count: number; bytes: number } | null>(null);

  constructor() {
    const cacheResult = this.crosswalk.ensureOfflineCache();
    this.offlineCacheStats.set({ count: cacheResult.jurisdictionCount, bytes: cacheResult.bytesStored });
  }

  public activateEpsdtTab(): void {
    this.activeTab.set('epsdt-appeal');
    this.generateEpsdtAppeal();
  }

  public setDisputeCategory(cat: EpsdtDisputeCategory): void {
    this.epsdtDispute.set(cat);
    this.generateEpsdtAppeal();
  }

  public onPdnHoursChange(hours: number): void {
    this.epsdtPdnHours.set(Number(hours));
    this.generateEpsdtAppeal();
  }

  public onPriorHoursChange(hours: number): void {
    this.epsdtPriorHours.set(Number(hours));
    this.generateEpsdtAppeal();
  }

  public onNoticeDateChange(dateStr: string): void {
    this.epsdtNoticeDate.set(dateStr);
    this.generateEpsdtAppeal();
  }

  public toggleStatExpedited(): void {
    this.epsdtIsStat.update(v => !v);
    this.generateEpsdtAppeal();
  }

  public onDictatedTextChange(text: string): void {
    this.dictatedText.set(text);
    this.generateEpsdtAppeal();
  }

  public startDictation(): void {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.isDictating.set(false);
      return;
    }

    try {
      if (this.speechRecognitionInstance) {
        try { this.speechRecognitionInstance.abort(); } catch {}
      }
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        this.isDictating.set(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          const current = this.dictatedText().trim();
          const updated = current ? `${current} ${transcript}` : transcript;
          this.dictatedText.set(updated);
          this.generateEpsdtAppeal();
        }
      };

      recognition.onerror = () => {
        this.isDictating.set(false);
      };

      recognition.onend = () => {
        this.isDictating.set(false);
      };

      this.speechRecognitionInstance = recognition;
      recognition.start();
    } catch {
      this.isDictating.set(false);
    }
  }

  public stopDictation(): void {
    if (this.speechRecognitionInstance) {
      try {
        this.speechRecognitionInstance.stop();
      } catch {}
      this.speechRecognitionInstance = null;
    }
    this.isDictating.set(false);
  }

  public toggleDictation(): void {
    if (this.isDictating()) {
      this.stopDictation();
    } else {
      this.startDictation();
    }
  }

  public applyPresetDictation(phrase: string): void {
    const current = this.dictatedText().trim();
    const updated = current ? `${current} ${phrase}` : phrase;
    this.dictatedText.set(updated);
    this.generateEpsdtAppeal();
  }

  public clearDictation(): void {
    this.dictatedText.set('');
    this.generateEpsdtAppeal();
  }

  public onO2FlowChange(rate: number): void {
    this.o2FlowLpm.set(Number(rate));
    this.generateEpsdtAppeal();
  }

  public toggleIncludeAeromedical(): void {
    this.includeAeromedicalInAppeal.update(v => !v);
    this.generateEpsdtAppeal();
  }

  public async generateEpsdtAppeal(): Promise<void> {
    const currentState = this.selectedStateWaiver();
    const corridor = this.currentCorridor();
    let aeromedicalNote: string | undefined = undefined;

    if (corridor && this.includeAeromedicalInAppeal()) {
      const o2 = this.o2Calculation();
      aeromedicalNote = `${corridor.jurisdictionName} (${corridor.jurisdictionCode}) Emergency Air Transport Corridor to ${corridor.destinationHospital} (${corridor.destinationCityState}) - Distance: ${corridor.distanceNauticalMiles} NM (${corridor.distanceStatuteMiles} mi), Est. Flight Time: ${corridor.estimatedFlightHours} hrs on ${corridor.preferredAircraft}. Prescribed ${this.o2FlowLpm()} L/min requires ${o2?.totalRequiredOxygenLiters || 1800} L O2 (${o2?.standardECylinderCount || 3} E-Cylinders, FAA 2.0x safety factor). HCPCS Codes: A0430 (Base Air) + A0435 (${corridor.distanceStatuteMiles} air miles). EMTALA/EPSDT prior authorization emergency waiver applies.`;
    }

    const pkg = await this.epsdtService.generateAppealPackage({
      stateCode: currentState,
      disputeCategory: this.epsdtDispute(),
      orderedPdnHoursPerWeek: this.epsdtPdnHours(),
      priorAuthorizedHoursPerWeek: this.epsdtPriorHours(),
      physicianName: this.epsdtPhysicianName(),
      physicianNpi: this.epsdtPhysicianNpi(),
      physicianSpecialty: this.epsdtPhysicianSpecialty(),
      clinicOrHospitalName: this.epsdtClinicName(),
      isStatExpedited: this.epsdtIsStat(),
      denialNoticeDate: this.epsdtNoticeDate(),
      dictatedClinicalEvents: this.dictatedText().trim() || undefined,
      aeromedicalCorridorNote: aeromedicalNote
    });
    this.epsdtPackage.set(pkg);

    // Generate X12 EDI 278 Prior Authorization Request
    const rawPt = this.patientMgmt?.selectedPatient();
    const pt: Partial<IEdiParticipant> = {
      id: rawPt?.id || 'pat-pediatric-01',
      name: rawPt?.name || 'Jordan Rivera',
      dob: (rawPt as any)?.dob || '2019-04-12',
      gender: rawPt?.gender ? (rawPt.gender.startsWith('F') ? 'F' : rawPt.gender.startsWith('M') ? 'M' : 'U') : 'F'
    };

    const edi278 = this.ediService.generateEdi278PriorAuth(pkg, pt, {
      name: this.epsdtPhysicianName(),
      npi: this.epsdtPhysicianNpi()
    });
    this.edi278Document.set(edi278);

    // If active aeromedical corridor, generate X12 EDI 837P Air Ambulance Claim
    if (corridor) {
      const bill = this.billingSummary();
      if (bill) {
        const edi837 = this.ediService.generateEdi837pAirAmbulanceClaim(corridor, bill, pt);
        this.edi837pDocument.set(edi837);
      }
    } else {
      this.edi837pDocument.set(null);
    }

    // Generate School IEP / IDEA § 504 Nursing Care Plan
    const iep = await this.iepService.generateIepTransitionPackage({
      studentName: pt.name || 'Jordan Rivera',
      studentDob: pt.dob || '2019-04-12',
      gradeLevel: '2nd Grade',
      schoolDistrictName: `${pkg.stateName} Public Schools District 1`,
      schoolName: `${pkg.stateName} Complex Care Academy`,
      orderedPdnWeeklyHours: this.epsdtPdnHours(),
      dailySchoolHours: 6.5
    });
    this.schoolIepPackage.set(iep);
  }

  public copyActiveDocument(): void {
    const pkg = this.epsdtPackage();
    if (!pkg) return;

    let text = '';
    const active = this.epsdtActiveDoc();
    if (active === 'physician-order') text = pkg.physicianLetterOfMedicalNecessity;
    else if (active === 'fair-hearing') text = pkg.fairHearingPetition;
    else if (active === 'legal-brief') text = pkg.federalCaseLawBrief;
    else if (active === 'statutes') text = pkg.statutoryCitations.join('\n');
    else if (active === 'school-iep') text = this.schoolIepPackage()?.fullDossierMarkdown || '';
    else if (active === 'edi-278') text = this.edi278Document()?.rawEdiContent || '';
    else if (active === 'edi-837p') text = this.edi837pDocument()?.rawEdiContent || '';

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.copyNotification.set('Copied to clipboard successfully!');
        setTimeout(() => this.copyNotification.set(null), 3000);
      }).catch(() => {
        this.copyNotification.set('Selected document ready for copy.');
      });
    } else {
      this.copyNotification.set('Selected document ready for copy.');
    }
  }

  public downloadEdi278(): void {
    const doc = this.edi278Document();
    if (!doc) return;
    const blob = new Blob([doc.rawEdiContent], { type: 'application/octet-stream;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EPSDT_PriorAuth_278_${this.selectedStateWaiver()}_${doc.controlNumber}.x12`;
    a.click();
    URL.revokeObjectURL(url);
  }

  public downloadEdi837p(): void {
    const doc = this.edi837pDocument();
    if (!doc) return;
    const blob = new Blob([doc.rawEdiContent], { type: 'application/octet-stream;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AirAmbulance_Claim_837P_${this.selectedStateWaiver()}_${doc.controlNumber}.x12`;
    a.click();
    URL.revokeObjectURL(url);
  }

  public downloadSchoolIepPlan(): void {
    const iep = this.schoolIepPackage();
    if (!iep) return;
    const blob = new Blob([iep.fullDossierMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `School_IEP_504_CarePlan_${this.selectedStateWaiver()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  public downloadAppealPackage(): void {
    const pkg = this.epsdtPackage();
    if (!pkg) return;

    const fullDossier = `# EPSDT APPEAL & PHYSICIAN ORDER PACKAGE (${pkg.stateCode} - ${pkg.stateName})
Generated: ${pkg.generatedAtIso}
Authority: Title XIX 42 U.S.C. § 1396d(r)(5)
SHA-256 Non-Repudiation Seal: ${pkg.cryptographicIntegrityDigest}

---

## 1. PHYSICIAN ORDER & ATTESTATION OF MEDICAL NECESSITY
${pkg.physicianLetterOfMedicalNecessity}

---

## 2. ADMINISTRATIVE FAIR HEARING PETITION & AID PAID PENDING DEMAND
${pkg.fairHearingPetition}

---

## 3. FEDERAL CASE LAW BENCH BRIEF
${pkg.federalCaseLawBrief}

---

## 4. COMPULSORY STATUTORY CITATIONS
${pkg.statutoryCitations.map(c => '- ' + c).join('\n')}
`;

    const blob = new Blob([fullDossier], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EPSDT_Appeal_Package_${pkg.stateCode}_${pkg.disputeCategory}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  public exportFhirEpsdtBundle(): void {
    const pkg = this.epsdtPackage();
    const pt = this.patientMgmt?.selectedPatient() || { id: 'pat-pediatric-01', name: 'Jordan Rivera', age: 7, gender: 'Female' };
    if (pkg) {
      this.fhirExportStrategy.exportEpsdtAppealBundle(pt, pkg);
    }
  }

  public closeModal(): void {
    this.navShell.closeMdcpHub();
  }
}
