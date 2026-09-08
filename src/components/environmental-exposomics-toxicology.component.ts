import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientStateService } from '../services/patient-state.service';
import { PatientManagementService } from '../services/patient-management.service';
import { GlobalHealthInitiativesService } from '../services/global-health-initiatives.service';

export type ToxidromeType = 'none' | 'cholinergic' | 'anticholinergic' | 'sympathomimetic' | 'opioid' | 'botanical_aconite';

export interface IToxidromeAssessment {
  type: ToxidromeType;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  immediateActions: string[];
  antidoteOrders: { drug: string; dose: string; route: string; endpoint: string }[];
  contraindications: string[];
  whoGuidelineRef: string;
}

export interface IPfasExposomeAssessment {
  estimatedSerumPfasNgMl: number;
  riskTier: 'CRITICAL (>40 ng/mL)' | 'HIGH (20-40 ng/mL)' | 'MODERATE (10-19 ng/mL)' | 'LOW (<10 ng/mL)';
  halfLifeYearsStandard: number;
  acceleratedHalfLifeYears: number;
  hepaticPhase2Protocols: string[];
  solubleBinderOrders: string[];
  monitoringSchedule: string;
}

@Component({
  selector: 'app-environmental-exposomics-toxicology',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-6 sm:p-8 shadow-xl font-sans space-y-6">
      
      <!-- Component Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div class="flex items-center gap-3">
            <span class="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-lg">
              🧪
            </span>
            <div>
              <h3 class="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 uppercase font-mono">
                Environmental Exposomics & Acute Toxicology Triage
              </h3>
              <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
                WHO / ATSDR Acute Poisoning Protocols • EPA / NIEHS PFAS Clearance & Phase II Hepatic Induction
              </p>
            </div>
          </div>
        </div>

        <!-- Tab Switcher -->
        <div class="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl font-mono text-xs">
          <button (click)="activeTab.set('toxicology')"
                  [class.bg-white]="activeTab() === 'toxicology'"
                  [class.dark:bg-zinc-700]="activeTab() === 'toxicology'"
                  [class.text-amber-600]="activeTab() === 'toxicology'"
                  [class.dark:text-amber-400]="activeTab() === 'toxicology'"
                  [class.shadow-sm]="activeTab() === 'toxicology'"
                  [class.text-zinc-600]="activeTab() !== 'toxicology'"
                  [class.dark:text-zinc-400]="activeTab() !== 'toxicology'"
                  class="px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer">
            🚨 Acute Toxidromes
          </button>

          <button (click)="activeTab.set('pfas_exposomics')"
                  [class.bg-white]="activeTab() === 'pfas_exposomics'"
                  [class.dark:bg-zinc-700]="activeTab() === 'pfas_exposomics'"
                  [class.text-sky-600]="activeTab() === 'pfas_exposomics'"
                  [class.dark:text-sky-400]="activeTab() === 'pfas_exposomics'"
                  [class.shadow-sm]="activeTab() === 'pfas_exposomics'"
                  [class.text-zinc-600]="activeTab() !== 'pfas_exposomics'"
                  [class.dark:text-zinc-400]="activeTab() !== 'pfas_exposomics'"
                  class="px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer">
            🌊 PFAS & Exposomics
          </button>
        </div>
      </div>

      <!-- Tab 1: Acute Toxicology Triage -->
      @if (activeTab() === 'toxicology') {
        <div class="space-y-5 animate-in fade-in duration-200">
          
          <!-- Rapid Toxidrome Selector Buttons -->
          <div class="space-y-2">
            <span class="text-xs font-bold font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Select Suspected Acute Toxic Exposure / Toxidrome:
            </span>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
              <button (click)="selectedToxidrome.set('cholinergic')"
                      [class.ring-2]="selectedToxidrome() === 'cholinergic'"
                      [class.ring-rose-500]="selectedToxidrome() === 'cholinergic'"
                      [class.bg-rose-50]="selectedToxidrome() === 'cholinergic'"
                      [class.dark:bg-rose-950/40]="selectedToxidrome() === 'cholinergic'"
                      class="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-left transition hover:border-rose-400 cursor-pointer">
                <span class="block font-bold text-rose-700 dark:text-rose-400">⚠️ Cholinergic</span>
                <span class="text-[10px] text-zinc-500 dark:text-zinc-400">Organophosphates / Carbamates</span>
              </button>

              <button (click)="selectedToxidrome.set('botanical_aconite')"
                      [class.ring-2]="selectedToxidrome() === 'botanical_aconite'"
                      [class.ring-amber-500]="selectedToxidrome() === 'botanical_aconite'"
                      [class.bg-amber-50]="selectedToxidrome() === 'botanical_aconite'"
                      [class.dark:bg-amber-950/40]="selectedToxidrome() === 'botanical_aconite'"
                      class="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-left transition hover:border-amber-400 cursor-pointer">
                <span class="block font-bold text-amber-700 dark:text-amber-400">🌿 Botanical Alkaloid</span>
                <span class="text-[10px] text-zinc-500 dark:text-zinc-400">Aconitum / Ephedra Toxicity</span>
              </button>

              <button (click)="selectedToxidrome.set('opioid')"
                      [class.ring-2]="selectedToxidrome() === 'opioid'"
                      [class.ring-indigo-500]="selectedToxidrome() === 'opioid'"
                      [class.bg-indigo-50]="selectedToxidrome() === 'opioid'"
                      [class.dark:bg-indigo-950/40]="selectedToxidrome() === 'opioid'"
                      class="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-left transition hover:border-indigo-400 cursor-pointer">
                <span class="block font-bold text-indigo-700 dark:text-indigo-400">🛑 Opioid Overdose</span>
                <span class="text-[10px] text-zinc-500 dark:text-zinc-400">Respiratory Depression / Miosis</span>
              </button>

              <button (click)="selectedToxidrome.set('anticholinergic')"
                      [class.ring-2]="selectedToxidrome() === 'anticholinergic'"
                      [class.ring-purple-500]="selectedToxidrome() === 'anticholinergic'"
                      [class.bg-purple-50]="selectedToxidrome() === 'anticholinergic'"
                      [class.dark:bg-purple-950/40]="selectedToxidrome() === 'anticholinergic'"
                      class="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-left transition hover:border-purple-400 cursor-pointer">
                <span class="block font-bold text-purple-700 dark:text-purple-400">👁️ Anticholinergic</span>
                <span class="text-[10px] text-zinc-500 dark:text-zinc-400">Datura / Atropine / TCAs</span>
              </button>
            </div>
          </div>

          <!-- Active Toxidrome Clinical Guidance Panel -->
          @let tox = toxidromeAssessment();
          <div class="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-4">
            
            <div class="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div class="flex items-center gap-2">
                <span class="text-xl">🚨</span>
                <h4 class="font-bold text-sm text-zinc-900 dark:text-zinc-100 font-mono">{{ tox.title }}</h4>
              </div>
              <span class="px-2.5 py-1 rounded-md text-[10px] font-bold font-mono uppercase bg-rose-600 text-white shadow-xs">
                SEVERITY: {{ tox.severity }}
              </span>
            </div>

            <!-- Priority Antidote Orders -->
            <div class="space-y-2">
              <span class="text-xs font-bold font-mono text-zinc-800 dark:text-zinc-200 uppercase tracking-wider block">
                💉 Guideline-Directed Antidote Orders (Weight Adjusted):
              </span>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                @for (antidote of tox.antidoteOrders; track antidote.drug) {
                  <div class="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono shadow-2xs space-y-1">
                    <div class="flex items-center justify-between">
                      <strong class="text-emerald-700 dark:text-emerald-400 font-bold">{{ antidote.drug }}</strong>
                      <span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">{{ antidote.route }}</span>
                    </div>
                    <div class="text-zinc-700 dark:text-zinc-300 font-bold">Dose: {{ antidote.dose }}</div>
                    <div class="text-[10.5px] text-zinc-500 dark:text-zinc-400">Endpoint: {{ antidote.endpoint }}</div>
                  </div>
                }
              </div>
            </div>

            <!-- Contraindications & Folk Remedy Warning -->
            <div class="p-3.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 text-xs space-y-1.5">
              <div class="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold font-mono">
                <span>⛔ CONTRAINDICATED ACTIONS & HAZARDS:</span>
              </div>
              <ul class="list-disc list-inside text-rose-900 dark:text-rose-200 text-[11px] space-y-1">
                @for (contra of tox.contraindications; track $index) {
                  <li>{{ contra }}</li>
                }
              </ul>
            </div>

            <!-- WHO Guideline Footer -->
            <div class="flex items-center justify-between pt-2 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800">
              <span>Standard: {{ tox.whoGuidelineRef }}</span>
              <span>Poison Center Handoff: Immediate EMS Dispatch Required</span>
            </div>

          </div>

        </div>
      }

      <!-- Tab 2: EPA / NIEHS PFAS & Exposomics Protocol -->
      @if (activeTab() === 'pfas_exposomics') {
        <div class="space-y-5 animate-in fade-in duration-200">
          
          @let pfas = pfasAssessment();
          <!-- Exposure Metrics Ribbon -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div class="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 space-y-1">
              <span class="text-[10px] uppercase font-bold text-sky-800 dark:text-sky-300">Estimated Serum PFAS Burden:</span>
              <div class="text-xl font-black text-sky-900 dark:text-sky-100">{{ pfas.estimatedSerumPfasNgMl }} ng/mL</div>
              <span class="text-[10px] text-sky-700 dark:text-sky-400 font-bold">{{ pfas.riskTier }}</span>
            </div>

            <div class="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-1">
              <span class="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300">Baseline Elimination Half-Life:</span>
              <div class="text-xl font-black text-amber-900 dark:text-amber-100">{{ pfas.halfLifeYearsStandard }} Years</div>
              <span class="text-[10px] text-amber-700 dark:text-amber-400">High tissue bioaccumulation</span>
            </div>

            <div class="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1">
              <span class="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">Target Accelerated Half-Life:</span>
              <div class="text-xl font-black text-emerald-900 dark:text-emerald-100">{{ pfas.acceleratedHalfLifeYears }} Years</div>
              <span class="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">~44% Elimination Acceleration</span>
            </div>
          </div>

          <!-- Multi-Phase Clearance Protocols -->
          <div class="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h4 class="font-bold text-sm text-zinc-900 dark:text-zinc-100 font-mono flex items-center gap-2">
              <span>🌿</span>
              <span>Evidence-Based Phase II Hepatic & Enterohepatic Clearance Protocol:</span>
            </h4>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <div class="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <span class="font-bold text-emerald-700 dark:text-emerald-400 uppercase text-[11px] block">
                  1. Hepatic Phase II Conjugation Induction:
                </span>
                <ul class="list-disc list-inside text-zinc-700 dark:text-zinc-300 text-[10.5px] space-y-1">
                  @for (proto of pfas.hepaticPhase2Protocols; track $index) {
                    <li>{{ proto }}</li>
                  }
                </ul>
              </div>

              <div class="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <span class="font-bold text-sky-700 dark:text-sky-400 uppercase text-[11px] block">
                  2. Enterohepatic Interception & Binders:
                </span>
                <ul class="list-disc list-inside text-zinc-700 dark:text-zinc-300 text-[10.5px] space-y-1">
                  @for (order of pfas.solubleBinderOrders; track $index) {
                    <li>{{ order }}</li>
                  }
                </ul>
              </div>
            </div>

            <!-- LC-MS/MS Monitoring Schedule -->
            <div class="p-3.5 rounded-xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/40 text-xs font-mono flex items-center justify-between">
              <div>
                <strong class="text-sky-900 dark:text-sky-200">🔬 Serial Diagnostic Monitoring:</strong>
                <span class="ml-2 text-zinc-700 dark:text-zinc-300 text-[11px]">{{ pfas.monitoringSchedule }}</span>
              </div>
              <span class="px-2 py-0.5 rounded bg-sky-200/80 dark:bg-sky-900 text-sky-900 dark:text-sky-200 text-[10px] font-bold">
                EPA Method 537.1
              </span>
            </div>

          </div>

        </div>
      }

    </div>
  `
})
export class EnvironmentalExposomicsToxicologyComponent {
  patientState = inject(PatientStateService);
  patientManager = inject(PatientManagementService);
  globalHealth = inject(GlobalHealthInitiativesService);

  activeTab = signal<'toxicology' | 'pfas_exposomics'>('toxicology');
  selectedToxidrome = signal<ToxidromeType>('cholinergic');

  readonly toxidromeAssessment = computed<IToxidromeAssessment>(() => {
    const type = this.selectedToxidrome();
    switch (type) {
      case 'cholinergic':
        return {
          type: 'cholinergic',
          title: 'Acute Cholinergic Toxidrome (Organophosphate / Carbamate Ingestion)',
          severity: 'CRITICAL',
          immediateActions: [
            'Immediate EMS transport with advanced airway readiness',
            'Decontaminate skin; remove all clothing in designated bio-hazard zone',
            'Administer high-flow supplemental O2 prior to Atropine to prevent ventricular fibrillation'
          ],
          antidoteOrders: [
            {
              drug: 'Atropine Sulfate',
              dose: '2 mg IV push every 3-5 min',
              route: 'IV',
              endpoint: 'Clearance of bronchial secretions & HR > 60 bpm'
            },
            {
              drug: 'Pralidoxime Chloride (2-PAM)',
              dose: '1 - 2 g in 100 mL NS over 15-30 min',
              route: 'IV Infusion',
              endpoint: 'Reversal of skeletal muscle fasciculations & neuromuscular blockade'
            }
          ],
          contraindications: [
            'Do NOT induce vomiting (severe aspiration risk)',
            'Do NOT give oral detox teas or charcoal until airway is secured via endotracheal tube',
            'Do NOT titrate Atropine solely to pupil dilation (secretions & lungs are the true endpoint)'
          ],
          whoGuidelineRef: 'WHO Guidelines on the Management of Poisoning (WHO-PMP-2024)'
        };

      case 'botanical_aconite':
        return {
          type: 'botanical_aconite',
          title: 'Acute Botanical Alkaloid Poisoning (Aconitum / Ephedra Overdose)',
          severity: 'CRITICAL',
          immediateActions: [
            'Continuous 12-lead ECG monitoring for polymorphic ventricular tachycardia',
            'Establish wide-bore IV access and prepare defibrillator',
            'Administer magnesium sulfate 2g IV if refractory ventricular arrhythmias arise'
          ],
          antidoteOrders: [
            {
              drug: 'Magnesium Sulfate',
              dose: '2 g in 50 mL D5W over 10 min',
              route: 'IV',
              endpoint: 'Suppression of polymorphic VT / Torsades de pointes'
            },
            {
              drug: 'Amiodarone HCl',
              dose: '150 mg IV over 10 min',
              route: 'IV',
              endpoint: 'Ventricular rhythm stabilization'
            }
          ],
          contraindications: [
            'Do NOT administer Class IA/IC antiarrhythmics (worsens sodium channel blockade)',
            'Do NOT delay emergency cardiac monitoring for unverified herbal teas'
          ],
          whoGuidelineRef: 'WHO Botanical Safety Monographs (Aconitum Carmichaeli)'
        };

      case 'opioid':
        return {
          type: 'opioid',
          title: 'Acute Opioid Overdose & Central Hypoventilation',
          severity: 'CRITICAL',
          immediateActions: [
            'Support ventilation with bag-valve-mask (BVM) with 100% O2',
            'Administer Naloxone and observe for spontaneous respiratory rate > 12 bpm'
          ],
          antidoteOrders: [
            {
              drug: 'Naloxone HCl',
              dose: '0.4 - 2 mg IV / IM / IN',
              route: 'IN / IV',
              endpoint: 'Spontaneous respiratory rate > 12/min without precipitating acute withdrawal storm'
            }
          ],
          contraindications: [
            'Do NOT give excessive initial doses in opioid-tolerant chronic patients (titrate to breathing, not consciousness)',
            'Do NOT discharge patient early after short-acting Naloxone if long-acting opioids were ingested'
          ],
          whoGuidelineRef: 'WHO Community Management of Opioid Overdose Guidelines'
        };

      case 'anticholinergic':
      default:
        return {
          type: 'anticholinergic',
          title: 'Anticholinergic Toxidrome (Datura / Bella Donna / TCA Poisoning)',
          severity: 'HIGH',
          immediateActions: [
            'Active cooling for severe hyperthermia (> 39.5°C)',
            'ECG monitoring for QRS widening (> 100ms)',
            'Administer Benzodiazepines for acute delirium and agitation'
          ],
          antidoteOrders: [
            {
              drug: 'Physostigmine Salicylate',
              dose: '0.5 - 2 mg slow IV over 5 min',
              route: 'IV',
              endpoint: 'Reversal of severe peripheral & central anticholinergic delirium (confirm normal ECG QTc first)'
            },
            {
              drug: 'Lorazepam',
              dose: '1 - 2 mg IV every 15 min PRN',
              route: 'IV',
              endpoint: 'Agitation control and seizure prevention'
            }
          ],
          contraindications: [
            'Do NOT give Physostigmine if QRS > 100ms on ECG (risk of asystole in TCA overdose)',
            'Do NOT use physical restraints without pharmacological sedation (risk of rhabdomyolysis)'
          ],
          whoGuidelineRef: 'ATSDR Medical Management Guidelines: Anticholinergics'
        };
    }
  });

  readonly pfasAssessment = computed<IPfasExposomeAssessment>(() => {
    return {
      estimatedSerumPfasNgMl: 34.5,
      riskTier: 'HIGH (20-40 ng/mL)',
      halfLifeYearsStandard: 4.8,
      acceleratedHalfLifeYears: 2.7,
      hepaticPhase2Protocols: [
        'Sulforaphane (100 µmol glucoraphanin daily) to upregulate GSTA1 & GSTM1 enzymes',
        'N-Acetylcysteine (NAC) 1,200 mg/d to replete intracellular glutathione pools',
        'Milk Thistle (standardized Silymarin 420 mg/d) for hepatocyte membrane stabilization'
      ],
      solubleBinderOrders: [
        'Modified Citrus Pectin (5g TID with 8oz water away from prescription medications)',
        'Psyllium Husk Soluble Fiber (7g daily) to intercept enterohepatic recycling',
        'Far-Infrared Hyperthermia (65°C for 20 min, 3x/week with electrolyte replenishment)'
      ],
      monitoringSchedule: 'Repeat Serum PFAS LC-MS/MS & Hepatic CMP panel at 6 and 12 months (EPA Method 537.1)'
    };
  });
}
