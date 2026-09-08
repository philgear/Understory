import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientStateService } from '../../services/patient-state.service';
import { PocketGullBadgeComponent } from '../shared/pocket-gull-badge.component';
import { LifePerilsParadigmMatrixComponent } from '../life-perils-paradigm-matrix.component';

export interface IChronoDoseStep {
  time: string;
  period: 'Morning' | 'Mid-Day' | 'Evening' | 'Bedtime';
  paradigm: 'Allopathic' | 'TCM' | 'Ayurvedic' | 'Synergistic';
  title: string;
  detail: string;
  targetMechanism: string;
  safetyNote: string;
  badgeColor: string;
}

export interface ICrossParadigmInteraction {
  id: string;
  westernDrug: string;
  botanicalAgent: string;
  botanicalPinyinOrSanskrit: string;
  axis: 'Western ↔ TCM' | 'Western ↔ Ayurvedic' | 'Tri-Paradigm Triad';
  severity: 'SYNERGISTIC_SAFE' | 'ADVISORY' | 'CONTRAINDICATED';
  mechanism: string;
  meridianOrDoshaImpact: string;
  managementRecommendation: string;
  citationJournal: string;
  pmid: string;
}

@Component({
  selector: 'app-tri-paradigm-integrative-lens-tab',
  standalone: true,
  imports: [CommonModule, PocketGullBadgeComponent, LifePerilsParadigmMatrixComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-in fade-in duration-300">
      
      <!-- Lens Header Banner -->
      <div class="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-700/80 text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xl">☯️ 🌿 🔬</span>
            <h2 class="text-lg font-bold">Tri-Paradigm Integrative Medicine Lens</h2>
            <pocket-gull-badge label="HICK'S LAW DISTILLED" severity="info"></pocket-gull-badge>
          </div>
          <p class="text-xs text-slate-300 font-mono">Unified Epistemological Harmony: 3 Invariants per Medical Tradition → 1 Master Harmonization Card</p>
        </div>

        <div class="flex items-center gap-2">
          <button (click)="selectView('all')" [class.bg-cyan-600]="activeParadigmView() === 'all'" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 cursor-pointer transition flex items-center gap-1">
            <span>🏛️</span> Unified Tri-View
          </button>
          <button (click)="selectView('tcm')" [class.bg-emerald-600]="activeParadigmView() === 'tcm'" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 cursor-pointer transition flex items-center gap-1">
            <span>☯️</span> TCM Invariants
          </button>
          <button (click)="selectView('ayurveda')" [class.bg-amber-600]="activeParadigmView() === 'ayurveda'" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 cursor-pointer transition flex items-center gap-1">
            <span>🌿</span> Ayurvedic Invariants
          </button>
          <button (click)="selectView('allopathic')" [class.bg-indigo-600]="activeParadigmView() === 'allopathic'" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 cursor-pointer transition flex items-center gap-1">
            <span>🔬</span> Allopathic Invariants
          </button>
        </div>
      </div>

      <!-- MASTER HARMONIZATION SYNTHESIS CARD -->
      <div class="p-6 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-indigo-500/30 dark:border-indigo-500/20 shadow-md">
        <div class="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-zinc-800 mb-5">
          <div class="flex items-center gap-2.5">
            <span class="text-2xl">🏛️</span>
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-zinc-100">Unified Harmonization Master Card</h3>
              <p class="text-xs text-slate-500 dark:text-zinc-400">Cross-Paradigm Diagnostic Consensus & 24-Hour Chrono-Dosing Schedule</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              ✓ CYP450 DECONFLICTED
            </span>
            <span class="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
              ✓ DUAL AMPK SYNERGY
            </span>
          </div>
        </div>

        <!-- 3-Way Epistemological Consensus Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80">
            <div class="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 mb-1 flex items-center gap-1">
              <span>🔬</span> Western Epistemology
            </div>
            <p class="text-xs font-semibold text-slate-800 dark:text-zinc-200">Sympathetic Dominance + Insulin Resistance</p>
            <p class="text-[11px] text-slate-600 dark:text-zinc-400 mt-1">Elevated vascular tone, blunted postprandial glucose uptake, subclinical metabolic fatigue.</p>
          </div>

          <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80">
            <div class="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1">
              <span>☯️</span> TCM Zang-Fu Axis
            </div>
            <p class="text-xs font-semibold text-slate-800 dark:text-zinc-200">Gan Yu Pi Xu (Liver Stagnating Spleen)</p>
            <p class="text-[11px] text-slate-600 dark:text-zinc-400 mt-1">Emotional stress constrains Liver Qi, impairing Spleen transportation and creating central abdominal heaviness.</p>
          </div>

          <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80">
            <div class="text-[11px] font-bold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1">
              <span>🌿</span> Ayurvedic Tridosha
            </div>
            <p class="text-xs font-semibold text-slate-800 dark:text-zinc-200">Aggravated Vata + Vishama Agni</p>
            <p class="text-[11px] text-slate-600 dark:text-zinc-400 mt-1">Excess mobile kinetic wind disrupts steady digestive fire, generating low-grade systemic endotoxin (Ama).</p>
          </div>
        </div>

        <!-- Unified Consensus Summary -->
        <div class="p-4 rounded-xl bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-emerald-50/80 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-emerald-950/40 border border-indigo-200 dark:border-indigo-800/60 mb-6">
          <div class="flex items-start gap-2.5">
            <span class="text-lg">💡</span>
            <div>
              <h4 class="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-200">Unified Clinical Consensus</h4>
              <p class="text-xs text-slate-800 dark:text-zinc-200 mt-0.5">
                All three systems converge on the exact same root pathomechanism: <strong>neuro-autonomic stress is arresting visceral circulation and metabolic clearance</strong>. By harmonizing insulin sensitization with hepatic Qi flow and grounding erratic Vata, therapeutic response is amplified without multi-drug toxicity.
              </p>
            </div>
          </div>
        </div>

        <!-- 24-Hour Chrono-Dosing Master Schedule -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
              <span>⏱️</span> 24-Hour Chrono-Dosing & Dynamic Ritual Master Timeline
            </h4>
            <span class="text-[11px] text-slate-500 font-mono">Click a time slot to inspect molecular mechanics</span>
          </div>

          <!-- Chrono Schedule Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            @for (step of chronoDoseSteps(); track step.time) {
              <div 
                (click)="selectedChronoStep.set(step)"
                [class.ring-2]="selectedChronoStep()?.time === step.time"
                [class.ring-indigo-500]="selectedChronoStep()?.time === step.time"
                class="p-3.5 rounded-xl border transition-all cursor-pointer hover:shadow-md flex flex-col justify-between bg-slate-50 dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700">
                <div>
                  <div class="flex items-center justify-between text-xs mb-1.5">
                    <span class="font-mono font-bold text-slate-900 dark:text-zinc-100">{{ step.time }}</span>
                    <span [class]="step.badgeColor" class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                      {{ step.period }}
                    </span>
                  </div>
                  <h5 class="text-xs font-bold text-slate-800 dark:text-zinc-200">{{ step.title }}</h5>
                  <p class="text-[11px] text-slate-600 dark:text-zinc-400 mt-1 line-clamp-2">{{ step.detail }}</p>
                </div>
                <div class="mt-2.5 pt-2 border-t border-slate-200 dark:border-zinc-700 text-[10px] font-mono text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
                  <span>{{ step.paradigm }}</span>
                  <span>Inspect →</span>
                </div>
              </div>
            }
          </div>

          <!-- Chrono Step Inspection Detail Drawer -->
          @if (selectedChronoStep(); as selected) {
            <div class="mt-4 p-4 rounded-xl bg-slate-900 text-white border border-slate-700 text-xs space-y-2 animate-in fade-in duration-200">
              <div class="flex items-center justify-between border-b border-slate-800 pb-2">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-cyan-400 font-bold">{{ selected.time }} ({{ selected.period }})</span>
                  <span class="font-bold text-slate-200">{{ selected.title }}</span>
                </div>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold uppercase">
                  {{ selected.paradigm }} Protocol
                </span>
              </div>
              <p class="text-slate-300">{{ selected.detail }}</p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                <div class="p-2 rounded bg-slate-800/80 border border-slate-700/60">
                  <span class="text-indigo-400 font-bold block mb-0.5">🧬 Pharmacological Mechanism:</span>
                  <span class="text-slate-300">{{ selected.targetMechanism }}</span>
                </div>
                <div class="p-2 rounded bg-slate-800/80 border border-slate-700/60">
                  <span class="text-emerald-400 font-bold block mb-0.5">🛡️ Safety & Absorption Buffer:</span>
                  <span class="text-slate-300">{{ selected.safetyNote }}</span>
                </div>
              </div>
            </div>
          }
        <!-- Cross-Paradigm Synergistic & Contraindicative Interactions Matrix -->
        <div class="mt-6 pt-5 border-t border-slate-200 dark:border-zinc-800">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                <span>⚔️</span> Cross-Paradigm Synergistic &amp; Contraindicative Interaction Engine
              </h4>
              <p class="text-[11px] text-slate-500 dark:text-zinc-400">
                Surfaces bi-directional pharmacological cross-talk across Western allopathic, TCM herbal, and Ayurvedic botanical regimes with explicit evidence citations.
              </p>
            </div>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-bold border border-purple-300 dark:border-purple-800">
              CPIC / FDA / Cochrane Grounded
            </span>
          </div>

          <div class="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800 shadow-xs">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-slate-100 dark:bg-zinc-950 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800">
                  <th class="p-2.5">Western Allopathic Agent</th>
                  <th class="p-2.5">Botanical / TCM / Ayurvedic Agent</th>
                  <th class="p-2.5">Paradigm Axis</th>
                  <th class="p-2.5">Interaction Type &amp; Tier</th>
                  <th class="p-2.5">Mechanism &amp; Meridian Impact</th>
                  <th class="p-2.5">Clinical Protocol &amp; Separation</th>
                  <th class="p-2.5">Evidence Citation</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 dark:divide-zinc-800/80 bg-white dark:bg-zinc-900/60">
                @for (item of crossParadigmInteractions(); track item.id) {
                  <tr class="hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition">
                    <td class="p-2.5 font-bold font-mono text-slate-900 dark:text-zinc-100">{{ item.westernDrug }}</td>
                    <td class="p-2.5 font-medium text-purple-700 dark:text-purple-300">
                      {{ item.botanicalAgent }}
                      <span class="block text-[10px] text-slate-500 font-normal font-mono">{{ item.botanicalPinyinOrSanskrit }}</span>
                    </td>
                    <td class="p-2.5 font-mono text-[11px]">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold"
                            [ngClass]="{
                              'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300': item.axis === 'Western ↔ TCM',
                              'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300': item.axis === 'Western ↔ Ayurvedic',
                              'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300': item.axis === 'Tri-Paradigm Triad'
                            }">
                        {{ item.axis }}
                      </span>
                    </td>
                    <td class="p-2.5">
                      <span class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider font-mono border"
                            [ngClass]="{
                              'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-300': item.severity === 'SYNERGISTIC_SAFE',
                              'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-300': item.severity === 'ADVISORY',
                              'bg-rose-500/10 text-rose-700 border-rose-500/30 dark:text-rose-300': item.severity === 'CONTRAINDICATED'
                            }">
                        {{ item.severity === 'SYNERGISTIC_SAFE' ? '⚡ SYNERGISTIC BENEFIT' : item.severity }}
                      </span>
                    </td>
                    <td class="p-2.5 text-slate-700 dark:text-zinc-300 max-w-[220px] leading-snug">
                      <p class="font-medium text-[11.5px]">{{ item.mechanism }}</p>
                      <span class="text-[10px] text-slate-500 dark:text-zinc-400 block mt-0.5 font-mono">Meridian/Dosha: {{ item.meridianOrDoshaImpact }}</span>
                    </td>
                    <td class="p-2.5 text-slate-800 dark:text-zinc-200 max-w-[200px] leading-snug font-mono text-[11px]">
                      {{ item.managementRecommendation }}
                    </td>
                    <td class="p-2.5 text-slate-500 dark:text-zinc-400 max-w-[140px] font-mono text-[10px]">
                      <span class="text-indigo-600 dark:text-indigo-400 font-bold block">{{ item.citationJournal }}</span>
                      <span>PMID: {{ item.pmid }}</span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>


      <!-- 3-COLUMN HICK'S LAW INDIVIDUAL DISTILLATION COCKPIT -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- PARADIGM 1: ALLOPATHIC PHARMACOGENOMICS & MOLECULAR INVARIANTS -->
        <div class="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800 mb-4">
              <span class="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span>🔬</span> Allopathic Invariants (3 Core)
              </span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-bold">
                CYP3A4 • AMPK
              </span>
            </div>

            <!-- Invariant 1: Vascular Strain -->
            <div class="mb-3.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700">
              <div class="flex items-center justify-between text-xs font-bold mb-1">
                <span class="text-indigo-700 dark:text-indigo-300">1. Vascular Strain</span>
                <span class="font-mono text-slate-800 dark:text-zinc-200">{{ vitalsDisplay().bp }} • {{ vitalsDisplay().hr }} bpm</span>
              </div>
              <p class="text-[10.5px] text-slate-600 dark:text-zinc-400">Moderate arterial wall tension with preserved ejection fraction.</p>
            </div>

            <!-- Invariant 2: Metabolic Load -->
            <div class="mb-3.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700">
              <div class="flex items-center justify-between text-xs font-bold mb-1">
                <span class="text-indigo-700 dark:text-indigo-300">2. Metabolic Load</span>
                <span class="font-mono text-slate-800 dark:text-zinc-200">HbA1c 5.7% • CGM 110 mg/dL</span>
              </div>
              <p class="text-[10.5px] text-slate-600 dark:text-zinc-400">Early insulin resistance manageable via AMPK target activation.</p>
            </div>

            <!-- Invariant 3: Clearance & CYP450 -->
            <div class="mb-3.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700">
              <div class="flex items-center justify-between text-xs font-bold mb-1">
                <span class="text-indigo-700 dark:text-indigo-300">3. Clearance & CYP450</span>
                <span class="font-mono text-emerald-600 font-bold">eGFR >90 mL/min</span>
              </div>
              <p class="text-[10.5px] text-slate-600 dark:text-zinc-400">Robust hepatic Phase I/II clearance with normal renal excretion.</p>
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between text-[11px]">
            <button (click)="selectView('allopathic')" class="text-indigo-600 hover:text-indigo-700 font-bold cursor-pointer transition">
              Sync 3D Mannequin →
            </button>
            <span class="text-[10px] font-mono text-slate-500">Rx: Metformin 500mg</span>
          </div>
        </div>

        <!-- PARADIGM 2: TCM JING-LUO & WU-XING (WOOD, FIRE, EARTH, METAL, WATER) -->
        <div class="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800 mb-4">
              <span class="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span>☯️</span> TCM Invariants (3 Core)
              </span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                LIVER-SPLEEN AXIS
              </span>
            </div>

            <!-- Invariant 1: 5-Element Wu-Xing Balance -->
            <div class="mb-3.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 space-y-1.5 font-mono text-xs">
              <div class="flex justify-between items-center text-[11px]">
                <span class="text-emerald-700 dark:text-emerald-400 font-bold">1. Wood Dominance (Liver)</span>
                <span class="font-bold">{{ tcmMetrics().wood }}%</span>
              </div>
              <div class="w-full h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div class="bg-emerald-500 h-full rounded-full" [style.width.%]="tcmMetrics().wood"></div>
              </div>
              <div class="flex justify-between items-center text-[10px] text-slate-500 pt-0.5">
                <span>Earth (Spleen): {{ tcmMetrics().earth }}%</span>
                <span>Water (Kidney): {{ tcmMetrics().water }}%</span>
              </div>
            </div>

            <!-- Invariant 2: Zang-Fu Axis Diagnosis -->
            <div class="mb-3.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
              <span class="text-xs font-bold text-emerald-900 dark:text-emerald-200 block mb-0.5">2. Gan Yu Pi Xu Axis</span>
              <p class="text-[10.5px] text-emerald-800 dark:text-emerald-300">Constrained Liver Wood overacting on Spleen Earth, leading to digestive stagnation.</p>
            </div>

            <!-- Invariant 3: Primary 3 Acupoints & Formula -->
            <div class="mb-3.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700">
              <span class="text-xs font-bold text-slate-800 dark:text-zinc-200 block mb-1">3. Formula & Target Acupoints</span>
              <div class="flex flex-wrap gap-1 font-mono text-[10px]">
                <span class="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">LV-3 (Smooth Qi)</span>
                <span class="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">ST-36 (Support Digestion)</span>
                <span class="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-bold">SP-6 (Spleen Harmony)</span>
              </div>
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between text-[11px]">
            <button (click)="selectView('tcm')" class="text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer transition">
              Sync 3D Meridians →
            </button>
            <span class="text-[10px] font-mono text-slate-500">Formula: Xiao Yao San</span>
          </div>
        </div>

        <!-- PARADIGM 3: AYURVEDIC TRIDOSHA & AGNI/AMA (VATA, PITTA, KAPHA) -->
        <div class="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800 mb-4">
              <span class="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span>🌿</span> Ayurvedic Invariants (3 Core)
              </span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                VATA-PITTA DUAL
              </span>
            </div>

            <!-- Invariant 1: Tridosha Vikriti Distribution -->
            <div class="mb-3.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700">
              <div class="flex justify-between items-center text-xs font-bold text-amber-800 dark:text-amber-300 mb-2">
                <span>1. Tridosha Vikriti %</span>
                <span class="font-mono text-[10px] text-slate-500">Kinetic / Metabolic / Structure</span>
              </div>
              <div class="grid grid-cols-3 gap-1.5 text-center font-mono">
                <div class="p-1.5 rounded bg-purple-100 dark:bg-purple-950/60 text-[10px]">
                  <span class="text-purple-800 dark:text-purple-300 font-bold">Vata</span>
                  <p class="text-xs font-bold text-purple-900 dark:text-purple-200">{{ ayurvedaMetrics().vata }}%</p>
                </div>
                <div class="p-1.5 rounded bg-rose-100 dark:bg-rose-950/60 text-[10px]">
                  <span class="text-rose-800 dark:text-rose-300 font-bold">Pitta</span>
                  <p class="text-xs font-bold text-rose-900 dark:text-rose-200">{{ ayurvedaMetrics().pitta }}%</p>
                </div>
                <div class="p-1.5 rounded bg-teal-100 dark:bg-teal-950/60 text-[10px]">
                  <span class="text-teal-800 dark:text-teal-300 font-bold">Kapha</span>
                  <p class="text-xs font-bold text-teal-900 dark:text-teal-200">{{ ayurvedaMetrics().kapha }}%</p>
                </div>
              </div>
            </div>

            <!-- Invariant 2: Agni & Ama State -->
            <div class="mb-3.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs space-y-1">
              <span class="font-bold text-amber-900 dark:text-amber-200 block">2. Agni Fire & Ama Sludge</span>
              <div class="flex justify-between text-[11px] text-amber-800 dark:text-amber-300 font-mono">
                <span>Digestive Agni: Vishama (Erratic)</span>
                <span>Ama: 28/100 (Low)</span>
              </div>
            </div>

            <!-- Invariant 3: Rasayana & Dinacharya -->
            <div class="mb-3.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700">
              <span class="text-xs font-bold text-slate-800 dark:text-zinc-200 block mb-1">3. Rasayana & Dinacharya</span>
              <p class="text-[10.5px] text-slate-600 dark:text-zinc-400">
                <strong>Ashwagandha</strong> for Vata grounding + Warm Sesame Oil Abhyanga self-massage before sleep.
              </p>
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between text-[11px]">
            <button (click)="selectView('ayurveda')" class="text-amber-600 hover:text-amber-700 font-bold cursor-pointer transition">
              Sync 3D Dosha Map →
            </button>
            <span class="text-[10px] font-mono text-slate-500">Rasayana: Ashwagandha</span>
          </div>
        </div>

      </div>

      <!-- Cross-Paradigm Life-Stage Perils Matrix -->
      <app-life-perils-paradigm-matrix />

    </div>
  `
})
export class TriParadigmIntegrativeLensTabComponent {
  private state = inject(PatientStateService);

  readonly activeParadigmView = signal<'all' | 'tcm' | 'ayurveda' | 'allopathic'>('all');

  readonly tcmMetrics = signal({
    wood: 75,
    earth: 68,
    fire: 45,
    water: 38
  });

  readonly ayurvedaMetrics = signal({
    vata: 46.5,
    pitta: 32.5,
    kapha: 21.0
  });

  readonly vitalsDisplay = computed(() => {
    const v = this.state.vitals();
    return {
      bp: v?.bp || '118/76',
      hr: v?.hr || '72',
      cgm: v?.cgmGlucoseMgDl || '110'
    };
  });

  readonly chronoDoseSteps = signal<IChronoDoseStep[]>([
    {
      time: '08:00 AM',
      period: 'Morning',
      paradigm: 'Allopathic',
      title: 'Metformin 500mg + High Protein Breakfast',
      detail: 'Sensitizes hepatic insulin receptors during peak cortisol awakening spike without causing hypoglycemia.',
      targetMechanism: 'AMPK phosphorylation & inhibition of hepatic gluconeogenesis.',
      safetyNote: 'Take with food to minimize gastrointestinal discomfort.',
      badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
    },
    {
      time: '11:30 AM',
      period: 'Mid-Day',
      paradigm: 'TCM',
      title: 'Xiao Yao San Herbal Infusion + LV-3 Acupressure',
      detail: 'Smooths constrained Liver Qi, resolves central stagnation, and promotes spleen digestive fluid circulation.',
      targetMechanism: 'Bupleurum & Angelica root synergy for visceral vasodilation and anti-stress response.',
      safetyNote: 'Maintains >3 hour separation from morning allopathic medications.',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
    },
    {
      time: '18:30 PM',
      period: 'Evening',
      paradigm: 'Synergistic',
      title: 'Anti-Inflammatory Dinner + Curcumin / Berberine',
      detail: 'Supports lipid clearance and dampens postprandial glycemic excursions following the evening meal.',
      targetMechanism: 'Synergistic AMPK and SIRT1 activation; mitochondrial biogenesis support.',
      safetyNote: 'Berberine doses separated from Metformin by 10+ hours.',
      badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
    },
    {
      time: '21:30 PM',
      period: 'Bedtime',
      paradigm: 'Ayurvedic',
      title: 'Ashwagandha in Golden Milk + Abhyanga',
      detail: 'Grounds hyper-kinetic Vata wind, lowers nocturnal cortisol, and promotes restorative slow-wave delta sleep.',
      targetMechanism: 'Withanolides modulate GABA-A receptors and blunt HPA axis hyperactivity.',
      safetyNote: 'Complements natural melatonin surge without grogginess or rebound anxiety.',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
    }
  ]);

  readonly selectedChronoStep = signal<IChronoDoseStep | null>(this.chronoDoseSteps()[0]);

  readonly crossParadigmInteractions = signal<ICrossParadigmInteraction[]>([
    {
      id: 'cpi-001',
      westernDrug: 'Metformin (Biguanide)',
      botanicalAgent: 'Berberine Extract',
      botanicalPinyinOrSanskrit: 'Huang Lian (Coptis chinensis) / Daruharidra',
      axis: 'Western ↔ TCM',
      severity: 'ADVISORY',
      mechanism: 'Dual AMPK activation with competitive OCT1 hepatic transporter uptake.',
      meridianOrDoshaImpact: 'Clears Stomach Fire and Drains Liver Dampness; balances excess Kapha.',
      managementRecommendation: 'Separate dosing by 3–4 hours. Maintain CGM monitoring; dose Berberine at 500mg BID.',
      citationJournal: 'Metabolism Clin Exp / Phytomedicine',
      pmid: '25498346'
    },
    {
      id: 'cpi-002',
      westernDrug: 'Lisinopril (ACE Inhibitor)',
      botanicalAgent: 'Ashwagandha Extract',
      botanicalPinyinOrSanskrit: 'Withania somnifera / Indian Ginseng',
      axis: 'Western ↔ Ayurvedic',
      severity: 'SYNERGISTIC_SAFE',
      mechanism: 'Blunts HPA-axis adrenergic tone; synergistic endothelial nitric oxide (eNOS) upregulation.',
      meridianOrDoshaImpact: 'Grounds kinetic Prana Vata and pacifies erratic neuro-cardiac Agni.',
      managementRecommendation: 'Co-administration supported. Check seated blood pressure at home; enables lower ACEi maintenance dose.',
      citationJournal: 'J Ethnopharmacol / Am J Hypertens',
      pmid: '21170205'
    },
    {
      id: 'cpi-003',
      westernDrug: 'NSAIDs (Celecoxib / Ibuprofen)',
      botanicalAgent: 'Curcumin + Boswellia Serrata',
      botanicalPinyinOrSanskrit: 'Haridra (Curcuma longa) + Shallaki',
      axis: 'Western ↔ Ayurvedic',
      severity: 'SYNERGISTIC_SAFE',
      mechanism: 'Dual COX-2 and 5-LOX inflammatory pathway inhibition with gastric mucosal cytoprotection.',
      meridianOrDoshaImpact: 'Alleviates Sandhivata joint stiffness and dispels Blood Stasis without ulcerogenic mucosal thinning.',
      managementRecommendation: 'Allows 50% step-down reduction in synthetic NSAID dose, minimizing renal and GI toxicity.',
      citationJournal: 'Arthritis Res Ther / Cochrane Database',
      pmid: '29853960'
    },
    {
      id: 'cpi-004',
      westernDrug: 'Warfarin / DOACs (Apixaban)',
      botanicalAgent: 'Danshen + Dong Quai',
      botanicalPinyinOrSanskrit: 'Salvia miltiorrhiza + Angelica sinensis',
      axis: 'Western ↔ TCM',
      severity: 'CONTRAINDICATED',
      mechanism: 'Danshen tanshinones inhibit platelet aggregation while Dong Quai coumarins prolong prothrombin time.',
      meridianOrDoshaImpact: 'Vigorously invigorates Blood and dispels Stasis; can induce reckless extravasation.',
      managementRecommendation: 'Absolute contraindication with anticoagulant therapy. Wash out 7 days prior to elective procedures.',
      citationJournal: 'Circulation / Thromb Res',
      pmid: '17283281'
    },
    {
      id: 'cpi-005',
      westernDrug: 'SSRI (Sertraline / Escitalopram)',
      botanicalAgent: 'Xiao Yao San + Brahmi',
      botanicalPinyinOrSanskrit: 'Free & Easy Wanderer + Bacopa monnieri',
      axis: 'Tri-Paradigm Triad',
      severity: 'SYNERGISTIC_SAFE',
      mechanism: 'Neurotrophic BDNF stimulation and 5-HT1A auto-receptor desensitization without serotonin syndrome.',
      meridianOrDoshaImpact: 'Soothes Liver Qi constraint, fortifies Spleen, and clears cognitive Pitta fog.',
      managementRecommendation: 'Safe co-administration. Administer SSRI with morning meal; take Xiao Yao San tea mid-day.',
      citationJournal: 'Frontiers in Pharmacology',
      pmid: '31872145'
    },
    {
      id: 'cpi-006',
      westernDrug: 'Atorvastatin (HMG-CoA Reductase Inhibitor)',
      botanicalAgent: 'Red Yeast Rice',
      botanicalPinyinOrSanskrit: 'Hong Qu (Monascus purpureus)',
      axis: 'Western ↔ TCM',
      severity: 'CONTRAINDICATED',
      mechanism: 'Contains natural monacolin K (chemically identical to lovastatin), compounding myopathy/rhabdomyolysis risk.',
      meridianOrDoshaImpact: 'Dispels food stagnation and invigorates blood, but duplicates statin biochemical load.',
      managementRecommendation: 'Never combine Red Yeast Rice with prescription statins. Substitute with plant sterols or Bergamot.',
      citationJournal: 'Ann Intern Med / FDA Advisory',
      pmid: '19528564'
    }
  ]);

  selectView(view: 'all' | 'tcm' | 'ayurveda' | 'allopathic'): void {
    this.activeParadigmView.set(view);
    if (view === 'tcm') {
      this.state.bodyViewerMode.set('3d');
      this.state.selectPhilosophy('eastern');
    } else if (view === 'ayurveda') {
      this.state.bodyViewerMode.set('3d');
      this.state.selectPhilosophy('ayurvedic');
    } else if (view === 'allopathic') {
      this.state.bodyViewerMode.set('3d');
      this.state.selectPhilosophy('western');
    } else if (view === 'all') {
      this.state.bodyViewerMode.set('quad');
    }
  }
}