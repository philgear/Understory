import { Component, ChangeDetectionStrategy, inject, computed, ElementRef, effect, signal, viewChild, untracked } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PatientStateService, IPatientState } from '../services/patient-state.service';
import { PatientManagementService, HistoryEntry, IPatient } from '../services/patient-management.service';
import { IDraftSummaryItem } from '../services/patient.types';
import { ExportService } from '../services/export.service';
import { ImportService } from '../services/import.service';
import { FhirIntegrationService } from '../services/fhir/fhir-integration.service';
import { DictationService } from '../services/dictation.service';
import { ClinicalIntelligenceService } from '../services/clinical-intelligence.service';
import { OrcidService } from '../services/orcid.service';
import { PythonBridgeService } from '../services/python-bridge.service';
import { ClinicalAssessmentsService } from '../services/clinical-assessments/clinical-assessments.service';
import { YbocsService } from '../services/ybocs/ybocs.service';
import { AcronymExpanderService } from '../services/acronym-expander.service';
import { marked } from 'marked';
import { PocketGullButtonComponent } from './shared/pocket-gull-button.component';
import { PocketGullInputComponent } from './shared/pocket-gull-input.component';
import { PocketGullBadgeComponent } from './shared/pocket-gull-badge.component';
import { MetricCardComponent } from './shared/metric-card.component';
import { ClinicalDataCardComponent } from './clinical-data-card.component';
import { SafeHtmlPipe } from '../pipes/safe-html.pipe';
import { DocDrillService } from '../services/doc-drill.service';

@Component({
  selector: 'app-medical-summary',
  standalone: true,
  imports: [
    CommonModule, 
    PocketGullButtonComponent, 
    PocketGullInputComponent, 
    PocketGullBadgeComponent, 
    MetricCardComponent, 
    ClinicalDataCardComponent, 
    SafeHtmlPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    /* Tighter margin collapsing inside strategy prose to prevent padding blowouts */
    .prose :where(p):first-child { margin-top: 0; }
    .prose :where(p):last-child { margin-bottom: 0; }
    .prose :where(ul):last-child { margin-bottom: 0; }
    .prose :where(h2, h3):first-child { margin-top: 0; }
  `],
  template: `
    @if (patient(); as p) {
      <div class="p-4 sm:p-8 font-sans text-gray-800 dark:text-zinc-200 h-full flex flex-col bg-white dark:bg-[#09090b]">

            <!-- Chart Header -->
            <div class="flex flex-col sm:flex-row justify-between items-start pb-6 border-b border-gray-100 dark:border-zinc-800 gap-4 sm:gap-0">
              <div>
                <h1 class="text-3xl font-light text-[#1C1C1C] dark:text-zinc-100 tracking-tight">{{ p.name }}</h1>
                <p class="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-zinc-400 mt-2">{{ today | date:'fullDate' }}</p>
              </div>
              
              <!-- EHR Interoperability Panel -->
              <div class="flex items-center gap-2 mt-2">
                <pocket-gull-button 
                  variant="secondary" 
                  size="xs" 
                  (click)="exportToEpic()" 
                  icon="M12 4v16m8-8H4"
                  title="Export to Epic">
                  Export to Epic
                </pocket-gull-button>
                <pocket-gull-button 
                  variant="secondary" 
                  size="xs" 
                  (click)="exportToCerner()" 
                  icon="M12 4v16m8-8H4"
                  title="Export to Cerner">
                  Export to Cerner
                </pocket-gull-button>
              </div>
            </div>
            
            <!-- Transient SMART on FHIR Success Notification -->
            @if (showEpicSuccess()) {
              <div class="mb-6 bg-green-50/50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/50 rounded-lg p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div>
                    <h3 class="text-xs font-bold uppercase tracking-[0.1em] text-green-800 dark:text-green-300">Epic MyChart Connected</h3>
                    <p class="text-[12px] text-green-600 dark:text-green-500/80">SMART on FHIR token securely established.</p>
                  </div>
                </div>
                <pocket-gull-button variant="ghost" size="xs" (click)="showEpicSuccess.set(false)" icon="M6 18L18 6M6 6l12 12"></pocket-gull-button>
              </div>
            }

            <div class="mt-6 space-y-8">
                <!-- Current Visit / Chief Complaint -->
                <div class="mb-8 font-sans">
                  <div class="flex justify-between items-center mb-3">
                    <h2 class="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-[0.15em] flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                        Current Visit / Chief Complaint
                    </h2>
                    <pocket-gull-button 
                      variant="ghost" 
                      size="xs" 
                      (click)="dictateVisitNote()" 
                      title="Dictate"
                      ariaLabel="Dictate Visit Note"
                      icon="M12 14q-1.25 0-2.125-.875T9 11V5q0-1.25.875-2.125T12 2q1.25 0 2.125.875T15 5v6q0 1.25-.875 2.125T12 14m-1 7v-3.075q-2.6-.35-4.3-2.325T5 11h2q0 2.075 1.463 3.537T12 16q2.075 0 3.538-1.463T17 11h2q0 2.225-1.7 4.2T13 17.925V21z">
                    </pocket-gull-button>
                  </div>
                  <div class="relative group">
                    <pocket-gull-input
                      type="textarea"
                      [value]="newVisitReason()"
                      (valueChange)="newVisitReason.set($event)"
                      [rows]="3"
                      placeholder="Enter reason for today's visit or primary health goal..."
                      class="w-full">
                    </pocket-gull-input>
                  </div>
                  <div class="flex items-center justify-end mt-3">
                    <pocket-gull-button 
                      (click)="saveNewVisit()" 
                      [disabled]="!newVisitReason().trim()"
                      size="sm">
                      Save Visit Note
                    </pocket-gull-button>
                  </div>
                </div>

                <!-- PAIR Healthsheets & AI Dataset Transparency Accordion (arXiv:2202.13028) -->
                <section class="mb-8 bg-zinc-950 rounded-2xl border border-indigo-500/30 p-4 transition-all shadow-lg font-mono">
                  <button type="button" (click)="showHealthsheet.set(!showHealthsheet())" 
                    class="w-full flex items-center justify-between gap-2 text-left cursor-pointer group">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
                        🏷️ PAIR Data Cards & Healthsheet Transparency
                      </span>
                      <span class="text-[10px] px-2 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 font-mono">
                        arXiv:2202.13028
                      </span>
                    </div>

                    <div class="flex items-center gap-1 text-zinc-400 group-hover:text-zinc-200 text-xs font-bold transition">
                      <span>{{ showHealthsheet() ? 'Hide Healthsheet' : 'Inspect Dataset Lineage' }}</span>
                      <span [class.rotate-180]="showHealthsheet()" class="inline-block transition-transform duration-200 text-sm">▼</span>
                    </div>
                  </button>

                  @if (showHealthsheet()) {
                    <div class="mt-4 pt-4 border-t border-zinc-800">
                      <app-clinical-data-card></app-clinical-data-card>
                    </div>
                  }
                </section>

                <!-- Live Biometric Telemetry Dashboard (Collapsible Caret Accordion) -->
                <section class="mb-8 bg-white dark:bg-zinc-900/60 rounded-xl border border-gray-200 dark:border-zinc-800 p-4 transition-all">
                  <button type="button" (click)="toggleBiometrics()" 
                    class="w-full flex items-center justify-between gap-2 text-left cursor-pointer group">
                    <div class="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-[0.15em]">Live Biometric Telemetry</span>
                        <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                          {{ isBiometricsExpanded() ? 'EXPANDED' : 'COLLAPSED' }}
                        </span>
                      </div>
                      @if (!isBiometricsExpanded()) {
                        <span class="text-xs font-mono text-slate-600 dark:text-zinc-400 truncate">
                          BP {{ state.vitals().bp || '120/80' }} • HR {{ state.vitals().hr || '72' }} bpm • SpO2 {{ state.vitals().spO2 || '98%' }}
                        </span>
                      }
                    </div>

                    <div class="flex items-center gap-1 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-zinc-200 text-xs font-bold transition">
                      <span>{{ isBiometricsExpanded() ? 'Hide Readouts' : 'Expand Biometrics' }}</span>
                      <span [class.rotate-180]="isBiometricsExpanded()" class="inline-block transition-transform duration-200 text-sm">▼</span>
                    </div>
                  </button>

                  @if (isBiometricsExpanded()) {
                    <div class="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800 grid grid-cols-2 md:grid-cols-4 gap-4 animate-in">
                    <div class="cursor-pointer transition hover:scale-[1.02]" (click)="docDrill.openDrill('Mean Arterial Pressure (MAP)', { category: 'VITALS' })" title="Click to drill down on Blood Pressure with Doc Drill">
                      <app-metric-card
                        title="Blood Pressure"
                        [value]="state.vitals().bp || '--'"
                        unit="mmHg"
                        [status]="state.vitals().bp === '120/80' ? 'normal' : 'warning'"
                        trendDirection="stable"
                      ></app-metric-card>
                    </div>
                    
                    <div class="cursor-pointer transition hover:scale-[1.02]" (click)="docDrill.openDrill('Heart Rate Variability (rMSSD & SDNN)', { category: 'AUTONOMIC TONE' })" title="Click to drill down on Heart Rate & HRV with Doc Drill">
                      <app-metric-card
                        title="Heart Rate"
                        [value]="state.vitals().hr || '--'"
                        unit="bpm"
                        [status]="parseVitalNum(state.vitals().hr) > 100 ? 'warning' : 'normal'"
                        trendDirection="up"
                        trendText="+2.5%"
                      ></app-metric-card>
                    </div>
                    
                    <div class="cursor-pointer transition hover:scale-[1.02]" (click)="docDrill.openDrill('SpO2', { category: 'PULMONOLOGY' })" title="Click to drill down on SpO2 with Doc Drill">
                      <app-metric-card
                        title="SpO2"
                        [value]="state.vitals().spO2 || '--'"
                        unit="%"
                        [status]="parseVitalNum(state.vitals().spO2) < 95 ? 'critical' : 'normal'"
                        trendDirection="stable"
                      ></app-metric-card>
                    </div>
                    
                    <div class="cursor-pointer transition hover:scale-[1.02]" (click)="docDrill.openDrill('Body Temperature Homeostasis', { category: 'HOMEOSTASIS' })" title="Click to drill down on Temperature with Doc Drill">
                      <app-metric-card
                        title="Temperature"
                        [value]="state.vitals().temp || '--'"
                        unit="°F"
                        status="normal"
                        trendDirection="stable"
                      ></app-metric-card>
                    </div>
                  </div>
                }
              </section>

                <!-- Real-time Clinical Triage Risk Score Card with 3D Double-Click Flip State Machine -->
                @if (pythonBridge.riskScore(); as risk) {
                  <div class="relative perspective-1000 group cursor-pointer select-none mb-8"
                       (dblclick)="toggleTriageFlip($event)"
                       title="Double-click or click badge to flip over for Plain-Language Patient Summary & Action Steps">
                    
                    <div [class.rotate-y-180]="isTriageFlipped()"
                         class="relative w-full transition-transform duration-500 transform-style-3d">

                      <!-- FRONT FACE: Clinical Triage Risk Telemetry -->
                      <section class="p-5 bg-gradient-to-r from-gray-50 to-white dark:from-zinc-900/50 dark:to-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md backface-hidden">
                        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <div class="flex items-center gap-2 mb-1">
                              <h2 class="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-[0.15em]">Clinical Triage Risk</h2>
                              <button type="button" (click)="toggleTriageFlip($event)"
                                      class="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 cursor-pointer transition">
                                dblclick 🔄 flip
                              </button>
                            </div>
                            <div class="flex items-center gap-2">
                              <span class="text-3xl font-light tracking-tight text-gray-900 dark:text-zinc-100">
                                {{ ((risk.risk_score ?? 0) * 100) | number:'1.0-1' }}%
                              </span>
                              <span class="text-xs text-gray-400 dark:text-zinc-500 font-medium">score</span>
                            </div>
                          </div>

                          <div class="flex flex-col items-end gap-1.5">
                            @if (risk.risk_level === 'low') {
                              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                                Low Risk
                              </span>
                            } @else if (risk.risk_level === 'moderate') {
                              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30">
                                <span class="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
                                Moderate Risk
                              </span>
                            } @else if (risk.risk_level === 'high') {
                              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30">
                                <span class="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5"></span>
                                High Risk
                              </span>
                            } @else if (risk.risk_level === 'critical') {
                              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-100 dark:border-red-900/30 animate-pulse">
                                <span class="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 animate-ping"></span>
                                Critical Risk
                              </span>
                            }
                            
                            <span class="text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-widest">
                              Confidence: {{ (risk.confidence * 100) | number:'1.0-0' }}%
                            </span>
                          </div>
                        </div>

                        @if (risk.contributing_factors && risk.contributing_factors.length > 0) {
                          <div class="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800/80">
                            <h3 class="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Contributing Factors</h3>
                            <ul class="space-y-1">
                              @for (factor of risk.contributing_factors; track factor) {
                                <li class="flex items-start gap-2 text-xs font-light text-gray-600 dark:text-zinc-300">
                                  <span class="text-gray-400 dark:text-zinc-600 mt-0.5">•</span>
                                  <span>{{ factor }}</span>
                                </li>
                              }
                            </ul>
                          </div>
                        }

                        <div class="mt-3 text-[9px] font-bold uppercase tracking-widest text-gray-400/80 dark:text-zinc-600 flex justify-between items-center">
                          <span>Source: {{ risk.note || 'Clinical Intelligence Classifier' }}</span>
                        </div>
                      </section>

                      <!-- BACK FACE: Plain-Language Patient Summary & Action Steps -->
                      <section class="p-5 bg-emerald-950 text-white border border-emerald-500/40 rounded-xl shadow-2xl absolute inset-0 rotate-y-180 backface-hidden backdrop-blur-xl font-sans text-xs flex flex-col justify-between">
                        <div>
                          <div class="flex items-center justify-between border-b border-emerald-800 pb-2 mb-3 font-mono text-xs">
                            <div class="flex items-center gap-2 text-emerald-300 font-bold uppercase tracking-wider">
                              <span>💡</span>
                              <span>Plain-Language Health Summary</span>
                            </div>
                            <button type="button" (click)="toggleTriageFlip($event)"
                                    class="text-[10px] text-emerald-400 hover:text-emerald-200 font-mono cursor-pointer">
                              dblclick 🔄 flip back
                            </button>
                          </div>

                          <div class="space-y-3">
                            <div>
                              <span class="font-bold text-emerald-300 font-mono text-[10px] uppercase block mb-1">What Your Score Means:</span>
                              <p class="text-emerald-100 leading-relaxed">
                                Your overall stability is monitored by AI. Your risk rating is <strong>{{ (risk.risk_score * 100) | number:'1.0-1' }}%</strong> ({{ risk.risk_level | uppercase }}), which means your vitals and symptoms are tracking predictably.
                              </p>
                            </div>

                            <div>
                              <span class="font-bold text-amber-300 font-mono text-[10px] uppercase block mb-1">1 Recommended Daily Focus:</span>
                              <p class="text-emerald-100 leading-relaxed italic">
                                Prioritize 7-8 hours of restful sleep and 15 minutes of outdoor sunlight exposure to support vagal tone.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div class="pt-2 border-t border-emerald-900 font-mono text-[10px] text-emerald-400 flex justify-between items-center">
                          <span>Patient Literacy Shield Active</span>
                          <span>Double-click to return to clinical risk metrics</span>
                        </div>
                      </section>

                    </div>
                  </div>
                }

                <!-- Clinical Assessments & Screener Trajectory Card -->
                <section class="mb-8 p-5 bg-white dark:bg-zinc-900/80 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-xs transition-all hover:shadow-md">
                  <!-- Card Header -->
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-zinc-800 pb-4 mb-4">
                    <div class="flex items-center gap-2.5">
                      <div class="w-7 h-7 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                        📊
                      </div>
                      <div>
                        <h2 class="text-xs font-bold text-gray-800 dark:text-zinc-200 uppercase tracking-[0.15em]">
                          Clinical Assessments & Screener Trajectory
                        </h2>
                        <p class="text-[11px] text-gray-500 dark:text-zinc-400">
                          Standardized clinical metrics: GAD-7, PHQ-9, Y-BOCS OCD, and KSS Clinician Readiness
                        </p>
                      </div>
                    </div>

                    <!-- Quick Status Pill -->
                    <div class="flex items-center gap-2">
                      <span class="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        4 Active Screeners
                      </span>
                    </div>
                  </div>

                  <!-- Screener Cards Grid -->
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                    <!-- 1. GAD-7 (Anxiety) -->
                    <div class="p-4 rounded-xl bg-gray-50/70 dark:bg-zinc-950/60 border border-gray-200/80 dark:border-zinc-800 flex flex-col justify-between transition hover:border-emerald-300 dark:hover:border-emerald-700">
                      <div>
                        <div class="flex justify-between items-center mb-2">
                          <span class="text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 flex items-center gap-1.5">
                            <span>🌿</span> GAD-7 (Anxiety)
                          </span>
                          <span class="text-[10px] font-mono font-bold text-gray-400 dark:text-zinc-500">Max 21</span>
                        </div>
                        <div class="flex items-baseline gap-2 mb-2">
                          <span class="text-2xl font-black text-gray-900 dark:text-zinc-100 font-mono">
                            {{ clinicalAssessments.gad7Score() }}
                          </span>
                          <span class="text-xs font-medium text-gray-400 dark:text-zinc-500">/ 21</span>
                        </div>
                      </div>
                      <div>
                        <span class="inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold border w-full justify-center text-center"
                          [class]="clinicalAssessments.gad7Tier().colorClass">
                          {{ clinicalAssessments.gad7Tier().label }}
                        </span>
                      </div>
                    </div>

                    <!-- 2. PHQ-9 (Depression) -->
                    <div class="p-4 rounded-xl bg-gray-50/70 dark:bg-zinc-950/60 border border-gray-200/80 dark:border-zinc-800 flex flex-col justify-between transition hover:border-sky-300 dark:hover:border-sky-700">
                      <div>
                        <div class="flex justify-between items-center mb-2">
                          <span class="text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 flex items-center gap-1.5">
                            <span>🧠</span> PHQ-9 (Depression)
                          </span>
                          <span class="text-[10px] font-mono font-bold text-gray-400 dark:text-zinc-500">Max 27</span>
                        </div>
                        <div class="flex items-baseline gap-2 mb-2">
                          <span class="text-2xl font-black text-gray-900 dark:text-zinc-100 font-mono">
                            {{ clinicalAssessments.phq9Score() }}
                          </span>
                          <span class="text-xs font-medium text-gray-400 dark:text-zinc-500">/ 27</span>
                        </div>
                      </div>
                      <div>
                        <span class="inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold border w-full justify-center text-center"
                          [class]="clinicalAssessments.phq9Tier().colorClass">
                          {{ clinicalAssessments.phq9Tier().label }}
                        </span>
                      </div>
                    </div>

                    <!-- 3. Y-BOCS (OCD Severity) -->
                    <div class="p-4 rounded-xl bg-gray-50/70 dark:bg-zinc-950/60 border border-gray-200/80 dark:border-zinc-800 flex flex-col justify-between transition hover:border-indigo-300 dark:hover:border-indigo-700">
                      <div>
                        <div class="flex justify-between items-center mb-2">
                          <span class="text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 flex items-center gap-1.5">
                            <span>🌀</span> Y-BOCS (OCD)
                          </span>
                          <span class="text-[10px] font-mono font-bold text-gray-400 dark:text-zinc-500">Max 40</span>
                        </div>
                        <div class="flex items-baseline gap-2 mb-1">
                          <span class="text-2xl font-black text-gray-900 dark:text-zinc-100 font-mono">
                            {{ ybocsService.totalScore() }}
                          </span>
                          <span class="text-xs font-medium text-gray-400 dark:text-zinc-500">/ 40</span>
                        </div>
                        <div class="text-[10px] font-mono text-gray-500 dark:text-zinc-400 mb-2 flex justify-between">
                          <span>Obs: {{ ybocsService.obsessionSubtotal() }}/20</span>
                          <span>Comp: {{ ybocsService.compulsiveSubtotal() }}/20</span>
                        </div>
                      </div>
                      <div>
                        <span class="inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold border w-full justify-center text-center"
                          [class]="ybocsService.severityDetails().color">
                          {{ ybocsService.severityDetails().name }}
                        </span>
                      </div>
                    </div>

                    <!-- 4. KSS Readiness (Clinician & Patient Sleepiness) -->
                    <div class="p-4 rounded-xl bg-gray-50/70 dark:bg-zinc-950/60 border border-gray-200/80 dark:border-zinc-800 flex flex-col justify-between transition hover:border-amber-300 dark:hover:border-amber-700">
                      <div>
                        <div class="flex justify-between items-center mb-2">
                          <span class="text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 flex items-center gap-1.5">
                            <span>😴</span> KSS Readiness
                          </span>
                          <span class="text-[10px] font-mono font-bold text-gray-400 dark:text-zinc-500">1 – 9</span>
                        </div>
                        <div class="flex items-baseline gap-2 mb-2">
                          <span class="text-2xl font-black font-mono"
                            [class.text-emerald-600]="acronymService.currentKssScore() <= 4"
                            [class.text-amber-600]="acronymService.currentKssScore() >= 5 && acronymService.currentKssScore() <= 6"
                            [class.text-red-600]="acronymService.currentKssScore() >= 7">
                            {{ acronymService.currentKssScore() }}
                          </span>
                          <span class="text-xs font-medium text-gray-400 dark:text-zinc-500">/ 9</span>
                        </div>
                      </div>
                      <div>
                        <span class="inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold border w-full justify-center text-center font-mono"
                          [class.bg-emerald-50]="acronymService.currentKssScore() <= 4"
                          [class.text-emerald-700]="acronymService.currentKssScore() <= 4"
                          [class.border-emerald-200]="acronymService.currentKssScore() <= 4"
                          [class.dark:bg-emerald-950/40]="acronymService.currentKssScore() <= 4"
                          [class.dark:text-emerald-300]="acronymService.currentKssScore() <= 4"
                          [class.bg-amber-50]="acronymService.currentKssScore() >= 5 && acronymService.currentKssScore() <= 6"
                          [class.text-amber-700]="acronymService.currentKssScore() >= 5 && acronymService.currentKssScore() <= 6"
                          [class.border-amber-200]="acronymService.currentKssScore() >= 5 && acronymService.currentKssScore() <= 6"
                          [class.dark:bg-amber-950/40]="acronymService.currentKssScore() >= 5 && acronymService.currentKssScore() <= 6"
                          [class.dark:text-amber-300]="acronymService.currentKssScore() >= 5 && acronymService.currentKssScore() <= 6"
                          [class.bg-red-50]="acronymService.currentKssScore() >= 7"
                          [class.text-red-700]="acronymService.currentKssScore() >= 7"
                          [class.border-red-200]="acronymService.currentKssScore() >= 7"
                          [class.dark:bg-red-950/40]="acronymService.currentKssScore() >= 7"
                          [class.dark:text-red-300]="acronymService.currentKssScore() >= 7">
                          {{ acronymService.currentKssScore() <= 4 ? 'Alert Mode' : acronymService.currentKssScore() <= 6 ? 'Moderate Fatigue' : 'High Fatigue (Safety Shield)' }}
                        </span>
                      </div>
                    </div>

                  </div>

                  <!-- Auxiliary Screener Trajectory Summary Line -->
                  <div class="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-gray-500 dark:text-zinc-400">
                    <div class="flex flex-wrap items-center gap-4">
                      <span>🌙 ISI Insomnia: <strong class="text-gray-800 dark:text-zinc-200">{{ clinicalAssessments.isiScore() }}/28</strong> ({{ clinicalAssessments.isiTier().label }})</span>
                      <span>🚨 C-SSRS Safety: <strong class="text-gray-800 dark:text-zinc-200">{{ clinicalAssessments.cssrsScore() }}/6</strong> ({{ clinicalAssessments.cssrsTier().label }})</span>
                      <span>🌱 Grow-Thyself: <strong class="text-gray-800 dark:text-zinc-200">{{ clinicalAssessments.growThyselfScore() }}/100</strong></span>
                    </div>
                  </div>
                </section>
                <!-- IVitals & Biometrics -->
                <section>
                    <h2 class="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-[0.15em] mb-6">Biometric Telemetry</h2>
                </section>
                <div class="flex flex-col gap-3 mb-8 border-b border-gray-100 dark:border-zinc-800 pb-8">
                  <div class="flex items-center gap-3">
                    <div class="w-24 shrink-0">
                        <span class="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-[0.15em]">BP</span>
                    </div>
                    <div class="flex-1 w-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-lg pr-4">
                      <pocket-gull-input
                        id="vitals-bp"
                        variant="minimal"
                        placeholder="120/80"
                        [value]="state.vitals().bp"
                        (valueChange)="state.updateVital('bp', $event)"
                        class="w-full">
                      </pocket-gull-input>
                    </div>
                  </div>

                  <div class="flex items-center gap-3">
                    <div class="w-24 shrink-0">
                        <span class="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-[0.15em]">HR</span>
                    </div>
                    <div class="flex-1 w-full flex items-center bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-lg pr-4">
                      <pocket-gull-input
                        id="vitals-hr"
                        variant="minimal"
                        placeholder="--"
                        [value]="state.vitals().hr"
                        (valueChange)="state.updateVital('hr', $event)"
                        class="w-full min-w-0">
                      </pocket-gull-input>
                      <span class="text-xs text-gray-400 dark:text-zinc-500 font-bold tracking-tighter shrink-0 uppercase pl-2">BPM</span>
                    </div>
                  </div>

                  <div class="flex items-center gap-3">
                    <div class="w-24 shrink-0">
                        <span class="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-[0.15em]">SpO2</span>
                    </div>
                    <div class="flex-1 w-full flex items-center bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-lg pr-4">
                      <pocket-gull-input
                        id="vitals-spo2"
                        variant="minimal"
                        placeholder="--"
                        [value]="state.vitals().spO2"
                        (valueChange)="state.updateVital('spO2', $event)"
                        class="w-full min-w-0">
                      </pocket-gull-input>
                      <span class="text-xs text-gray-400 dark:text-zinc-500 font-bold tracking-tighter shrink-0 uppercase pl-2">%</span>
                    </div>
                  </div>

                  <div class="flex items-center gap-3">
                    <div class="w-24 shrink-0">
                        <span class="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-[0.15em]">Temp</span>
                    </div>
                    <div class="flex-1 w-full flex items-center bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-lg pr-4">
                      <pocket-gull-input
                        id="vitals-temp"
                        variant="minimal"
                        placeholder="--"
                        [value]="state.vitals().temp"
                        (valueChange)="state.updateVital('temp', $event)"
                        class="w-full min-w-0">
                      </pocket-gull-input>
                      <span class="text-xs text-gray-400 dark:text-zinc-500 font-bold tracking-tighter shrink-0 uppercase pl-2">°F</span>
                    </div>
                  </div>

                  <div class="flex items-center gap-3">
                    <div class="w-24 shrink-0">
                        <span class="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-[0.15em]">Weight</span>
                    </div>
                    <div class="flex-1 w-full flex items-center bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-lg pr-4">
                      <pocket-gull-input
                        id="vitals-weight"
                        variant="minimal"
                        placeholder="--"
                        [value]="state.vitals().weight"
                        (valueChange)="state.updateVital('weight', $event)"
                        class="w-full min-w-0">
                      </pocket-gull-input>
                      <span class="text-xs text-gray-400 dark:text-zinc-500 font-bold tracking-tighter shrink-0 uppercase pl-2">LBS</span>
                    </div>
                  </div>

                  <div class="flex items-center gap-3">
                    <div class="w-24 shrink-0">
                        <span class="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-[0.15em]">Height</span>
                    </div>
                    <div class="flex-1 w-full flex items-center bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-lg pr-4">
                      <pocket-gull-input
                        id="vitals-height"
                        variant="minimal"
                        placeholder="--"
                        [value]="state.vitals().height"
                        (valueChange)="state.updateVital('height', $event)"
                        class="w-full min-w-0">
                      </pocket-gull-input>
                      <span class="text-xs text-gray-400 dark:text-zinc-500 font-bold tracking-tighter shrink-0 uppercase pl-2">IN</span>
                    </div>
                  </div>

                  <div class="flex items-center gap-3">
                    <div class="w-24 shrink-0">
                        <span class="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-[0.15em] leading-normal">Vit C</span>
                    </div>
                    <div class="flex-1 w-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-lg pr-4">
                      <pocket-gull-input
                        id="vitals-vitC"
                        variant="minimal"
                        placeholder="--"
                        [value]="state.vitals().vitC || ''"
                        (valueChange)="state.updateVital('vitC', $event)"
                        class="flex-1 min-w-0">
                      </pocket-gull-input>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="w-24 shrink-0">
                        <span class="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-[0.15em] leading-normal">Vit D3</span>
                    </div>
                    <div class="flex-1 w-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-lg pr-4">
                      <pocket-gull-input
                        id="vitals-vitD3"
                        variant="minimal"
                        placeholder="--"
                        [value]="state.vitals().vitD3 || ''"
                        (valueChange)="state.updateVital('vitD3', $event)"
                        class="w-full min-w-0">
                      </pocket-gull-input>
                    </div>
                  </div>

                  <div class="flex items-center gap-3">
                    <div class="w-24 shrink-0">
                        <span class="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-[0.15em] leading-normal">Magnesium</span>
                    </div>
                    <div class="flex-1 w-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-lg pr-4">
                      <pocket-gull-input
                        id="vitals-magnesium"
                        variant="minimal"
                        placeholder="--"
                        [value]="state.vitals().magnesium || ''"
                        (valueChange)="state.updateVital('magnesium', $event)"
                        class="w-full min-w-0">
                      </pocket-gull-input>
                    </div>
                  </div>

                  <div class="flex items-center gap-3">
                    <div class="w-24 shrink-0">
                        <span class="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-[0.15em] leading-normal">Zinc</span>
                    </div>
                    <div class="flex-1 w-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-lg pr-4">
                      <pocket-gull-input
                        id="vitals-zinc"
                        variant="minimal"
                        placeholder="--"
                        [value]="state.vitals().zinc || ''"
                        (valueChange)="state.updateVital('zinc', $event)"
                        class="w-full min-w-0">
                      </pocket-gull-input>
                    </div>
                  </div>

                  <div class="flex items-center gap-3">
                    <div class="w-24 shrink-0">
                        <span class="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-[0.15em] leading-normal">Vit B12</span>
                    </div>
                    <div class="flex-1 w-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-lg pr-4">
                      <pocket-gull-input
                        id="vitals-b12"
                        variant="minimal"
                        placeholder="--"
                        [value]="state.vitals().b12 || ''"
                        (valueChange)="state.updateVital('b12', $event)"
                        class="w-full min-w-0">
                      </pocket-gull-input>
                    </div>
                  </div>
                </div>

                <!-- Dynamic Nutrients Grid -->
                <section>
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-[0.15em]">Dynamic Nutrient Panel</h2>
                        <pocket-gull-button 
                            variant="ghost" 
                            size="xs" 
                            (click)="state.addDynamicNutrient()" 
                            icon="M12 4v16m8-8H4">
                            Add Nutrient
                        </pocket-gull-button>
                    </div>
                    
                    @if (state.dynamicNutrients().length > 0) {
                        <div class="flex flex-col gap-3 mb-8 border-b border-gray-100 dark:border-zinc-800 pb-8">
                            @for (nutrient of state.dynamicNutrients(); track nutrient.id) {
                                <div class="flex items-center gap-3">
                                    <div class="flex-1">
                                        <pocket-gull-input
                                            [value]="nutrient.name"
                                            (valueChange)="state.updateDynamicNutrient(nutrient.id, 'name', $event)"
                                            placeholder="Nutrient Name (e.g. Glutathione)"
                                            class="w-full">
                                        </pocket-gull-input>
                                    </div>
                                    <div class="w-32">
                                        <pocket-gull-input
                                            [value]="nutrient.value"
                                            (valueChange)="state.updateDynamicNutrient(nutrient.id, 'value', $event)"
                                            placeholder="Value"
                                            class="w-full">
                                        </pocket-gull-input>
                                    </div>
                                    <pocket-gull-button 
                                        variant="ghost" 
                                        size="sm" 
                                        (click)="state.removeDynamicNutrient(nutrient.id)" 
                                        icon="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        ariaLabel="Remove Nutrient">
                                    </pocket-gull-button>
                                </div>
                            }
                        </div>
                    } @else {
                        <div class="mb-8 border-b border-gray-100 dark:border-zinc-800 pb-8 text-center text-sm font-light text-gray-500 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-900/50 rounded-lg p-6 border border-dashed">
                            No dynamic nutrients recorded. Click "Add Nutrient" to begin tracking specialized compounds.
                        </div>
                    }
                </section>

                <!-- Active Medications Grid -->
                <section>
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-[0.15em]">Active Medications</h2>
                        <pocket-gull-button 
                            variant="ghost" 
                            size="xs" 
                            (click)="state.addMedication()" 
                            icon="M12 4v16m8-8H4">
                            Add Medication
                        </pocket-gull-button>
                    </div>
                    
                    @if (state.medications().length > 0) {
                        <div class="flex flex-col gap-3 mb-8 border-b border-gray-100 dark:border-zinc-800 pb-8">
                            @for (med of state.medications(); track med.id) {
                                <div class="flex items-center gap-3">
                                    <div class="flex-1">
                                        <pocket-gull-input
                                            [value]="med.name"
                                            (valueChange)="state.updateMedication(med.id, 'name', $event)"
                                            placeholder="Medication Name"
                                            class="w-full">
                                        </pocket-gull-input>
                                    </div>
                                    <div class="w-32">
                                        <pocket-gull-input
                                            [value]="med.value"
                                            (valueChange)="state.updateMedication(med.id, 'value', $event)"
                                            placeholder="Dosage"
                                            class="w-full">
                                        </pocket-gull-input>
                                    </div>
                                    <pocket-gull-button 
                                        variant="ghost" 
                                        size="sm" 
                                        (click)="state.removeMedication(med.id)" 
                                        icon="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        ariaLabel="Remove">
                                    </pocket-gull-button>
                                </div>
                            }
                        </div>
                    } @else {
                        <div class="mb-8 border-b border-gray-100 dark:border-zinc-800 pb-8 text-center text-sm font-light text-gray-500 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-900/50 rounded-lg p-6 border border-dashed">
                            No active medications recorded. Click "Add Medication" to begin tracking.
                        </div>
                    }
                </section>
                
                <!-- Oxidative Stress Panel Grid -->
                <section>
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-[0.15em]">Oxidative Stress Panel</h2>
                        <pocket-gull-button 
                            variant="ghost" 
                            size="xs" 
                            (click)="state.addOxidativeStressMarker()" 
                            icon="M12 4v16m8-8H4">
                            Add Marker
                        </pocket-gull-button>
                    </div>
                    
                    @if (state.oxidativeStressMarkers().length > 0) {
                        <div class="flex flex-col gap-3 mb-8 border-b border-gray-100 dark:border-zinc-800 pb-8">
                            @for (marker of state.oxidativeStressMarkers(); track marker.id) {
                                <div class="flex items-center gap-3">
                                    <div class="flex-1">
                                        <pocket-gull-input
                                            [value]="marker.name"
                                            (valueChange)="state.updateOxidativeStressMarker(marker.id, 'name', $event)"
                                            placeholder="Marker (e.g. MDA, Isoprostanes)"
                                            class="w-full">
                                        </pocket-gull-input>
                                    </div>
                                    <div class="w-32">
                                        <pocket-gull-input
                                            [value]="marker.value"
                                            (valueChange)="state.updateOxidativeStressMarker(marker.id, 'value', $event)"
                                            placeholder="Value"
                                            class="w-full">
                                        </pocket-gull-input>
                                    </div>
                                    <pocket-gull-button 
                                        variant="ghost" 
                                        size="sm" 
                                        (click)="state.removeOxidativeStressMarker(marker.id)" 
                                        icon="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        ariaLabel="Remove">
                                    </pocket-gull-button>
                                </div>
                            }
                        </div>
                    } @else {
                        <div class="mb-8 border-b border-gray-100 dark:border-zinc-800 pb-8 text-center text-sm font-light text-gray-500 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-900/50 rounded-lg p-6 border border-dashed">
                            No oxidative stress markers recorded. Click "Add Marker" to begin tracking.
                        </div>
                    }
                </section>
                
                <!-- Antioxidant Sources Grid -->
                <section>
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-[0.15em]">Antioxidant Sources Panel</h2>
                        <pocket-gull-button 
                            variant="ghost" 
                            size="xs" 
                            (click)="state.addAntioxidantSource()" 
                            icon="M12 4v16m8-8H4">
                            Add Source
                        </pocket-gull-button>
                    </div>
                    
                    @if (state.antioxidantSources().length > 0) {
                        <div class="flex flex-col gap-3 mb-8 border-b border-gray-100 dark:border-zinc-800 pb-8">
                            @for (source of state.antioxidantSources(); track source.id) {
                                <div class="flex items-center gap-3">
                                    <div class="flex-1">
                                        <pocket-gull-input
                                            [value]="source.name"
                                            (valueChange)="state.updateAntioxidantSource(source.id, 'name', $event)"
                                            placeholder="Source (e.g. Glutathione, NAC)"
                                            class="w-full">
                                        </pocket-gull-input>
                                    </div>
                                    <div class="w-32">
                                        <pocket-gull-input
                                            [value]="source.value"
                                            (valueChange)="state.updateAntioxidantSource(source.id, 'value', $event)"
                                            placeholder="Value"
                                            class="w-full">
                                        </pocket-gull-input>
                                    </div>
                                    <pocket-gull-button 
                                        variant="ghost" 
                                        size="sm" 
                                        (click)="state.removeAntioxidantSource(source.id)" 
                                        icon="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        ariaLabel="Remove">
                                    </pocket-gull-button>
                                </div>
                            }
                        </div>
                    } @else {
                        <div class="mb-8 border-b border-gray-100 dark:border-zinc-800 pb-8 text-center text-sm font-light text-gray-500 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-900/50 rounded-lg p-6 border border-dashed">
                            No antioxidant sources recorded. Click "Add Source" to begin tracking.
                        </div>
                    }
                </section>

                <!-- Expansive Custom Patient Data Fields & Notes -->
                <section class="mb-8">
                  <div class="flex justify-between items-center mb-4">
                    <div>
                      <h2 class="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-[0.15em]">Expansive Custom Patient Data Fields</h2>
                      <p class="text-[11px] text-gray-400 dark:text-zinc-500">Add custom biomarkers, goals, dietary preferences, or clinical notes</p>
                    </div>
                    <pocket-gull-button 
                      variant="ghost" 
                      size="xs" 
                      (click)="addCustomField()" 
                      icon="M12 4v16m8-8H4">
                      Add Custom Field
                    </pocket-gull-button>
                  </div>

                  <div *ngIf="customFields().length > 0; else noCustomFields" class="flex flex-col gap-3 mb-8 border-b border-gray-100 dark:border-zinc-800 pb-8">
                    <div *ngFor="let field of customFields(); let i = index" class="flex items-center gap-3">
                      <div class="w-1/3">
                        <pocket-gull-input
                          [value]="field.key"
                          (valueChange)="updateCustomField(i, 'key', $event)"
                          placeholder="Label (e.g. NMN Dose, Goal)"
                          class="w-full">
                        </pocket-gull-input>
                      </div>
                      <div class="flex-1">
                        <pocket-gull-input
                          [value]="field.value"
                          (valueChange)="updateCustomField(i, 'value', $event)"
                          placeholder="Value / Readout"
                          class="w-full">
                        </pocket-gull-input>
                      </div>
                      <pocket-gull-button 
                        variant="ghost" 
                        size="sm" 
                        (click)="removeCustomField(i)" 
                        icon="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        ariaLabel="Remove Custom Field">
                      </pocket-gull-button>
                    </div>
                  </div>

                  <ng-template #noCustomFields>
                    <div class="mb-8 border-b border-gray-100 dark:border-zinc-800 pb-8 text-center text-xs font-light text-gray-500 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-900/50 rounded-lg p-4 border border-dashed">
                      No custom fields added yet. Click "Add Custom Field" to record tailored biomarkers, supplements, or clinical notes.
                    </div>
                  </ng-template>
                </section>

                <!-- Patient Trends Chart: Unified Visualization Hub -->
                @defer (on viewport) {
                  <section class="space-y-4">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                      <div>
                        <h2 class="text-xs font-bold text-gray-700 dark:text-zinc-200 uppercase tracking-[0.15em] flex items-center gap-2">
                          <span>📊 Retrospective Data Visualization Hub</span>
                          <span class="text-[10px] bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-extrabold px-2 py-0.5 rounded-full border border-indigo-300 dark:border-indigo-800">Unified Footprint</span>
                        </h2>
                        <p class="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5 font-medium">Demographic & condition-calibrated target bands with multi-metric overlays</p>
                      </div>

                      <!-- Visualization Controls: Type Switcher & Baselines -->
                      <div class="flex flex-wrap items-center gap-2 font-mono text-xs">
                        <!-- Chart Type Toggle -->
                        <div class="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl border border-gray-200 dark:border-zinc-700">
                          <button type="button" (click)="chartType.set('line')"
                            [class]="chartType() === 'line' ? 'bg-white dark:bg-zinc-950 text-indigo-600 dark:text-indigo-400 font-extrabold shadow-sm' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900'"
                            class="px-2.5 py-1 rounded-lg transition cursor-pointer text-[11px]">
                            📈 Line Trend
                          </button>
                          <button type="button" (click)="chartType.set('bar')"
                            [class]="chartType() === 'bar' ? 'bg-white dark:bg-zinc-950 text-indigo-600 dark:text-indigo-400 font-extrabold shadow-sm' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900'"
                            class="px-2.5 py-1 rounded-lg transition cursor-pointer text-[11px]">
                            📊 Histogram
                          </button>
                          <button type="button" (click)="chartType.set('radar')"
                            [class]="chartType() === 'radar' ? 'bg-white dark:bg-zinc-950 text-indigo-600 dark:text-indigo-400 font-extrabold shadow-sm' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900'"
                            class="px-2.5 py-1 rounded-lg transition cursor-pointer text-[11px]">
                            🎯 Radar Map
                          </button>
                        </div>

                        <!-- Baseline Overlays -->
                        <div class="flex items-center gap-1 bg-gray-50 dark:bg-zinc-950 p-1 rounded-xl border border-gray-200 dark:border-zinc-800 text-[10px]">
                          <label class="flex items-center gap-1 cursor-pointer px-2 py-0.5 rounded-lg transition"
                                 [class.bg-blue-100]="showCDCBaseline()" [class.dark:bg-blue-950]="showCDCBaseline()" [class.text-blue-700]="showCDCBaseline()" [class.dark:text-blue-300]="showCDCBaseline()">
                            <input type="checkbox" [checked]="showCDCBaseline()" (change)="showCDCBaseline.set(!showCDCBaseline())" class="w-3 h-3 accent-[#4285F4]">
                            CDC
                          </label>
                          <label class="flex items-center gap-1 cursor-pointer px-2 py-0.5 rounded-lg transition"
                                 [class.bg-green-100]="showWHOBaseline()" [class.dark:bg-green-950]="showWHOBaseline()" [class.text-green-700]="showWHOBaseline()" [class.dark:text-green-300]="showWHOBaseline()">
                            <input type="checkbox" [checked]="showWHOBaseline()" (change)="showWHOBaseline.set(!showWHOBaseline())" class="w-3 h-3 accent-[#689F38]">
                            WHO
                          </label>
                          <label class="flex items-center gap-1 cursor-pointer px-2 py-0.5 rounded-lg transition"
                                 [class.bg-red-100]="showBQBaseline()" [class.dark:bg-red-950]="showBQBaseline()" [class.text-red-700]="showBQBaseline()" [class.dark:text-red-300]="showBQBaseline()">
                            <input type="checkbox" [checked]="showBQBaseline()" (change)="showBQBaseline.set(!showBQBaseline())" class="w-3 h-3 accent-[#EA4335]">
                            BigQuery OMOP
                          </label>
                        </div>
                      </div>
                    </div>

                    <!-- Datapoint Perspective Filter Pills -->
                    <div class="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-1 text-xs font-mono">
                      <span class="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mr-1 flex-shrink-0">Datapoint Perspective:</span>
                      
                      <button (click)="activeMetric.set('all')"
                        [class]="activeMetric() === 'all' ? 'bg-indigo-600 text-white font-extrabold shadow-sm' : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800'"
                        class="px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap">
                        🌐 Combined Overlay
                      </button>
                      <button (click)="activeMetric.set('pain')"
                        [class]="activeMetric() === 'pain' ? 'bg-red-500 text-white font-extrabold shadow-sm' : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800'"
                        class="px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap">
                        ⚡ Pain Path (0-10)
                      </button>
                      <button (click)="activeMetric.set('bp')"
                        [class]="activeMetric() === 'bp' ? 'bg-purple-600 text-white font-extrabold shadow-sm' : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800'"
                        class="px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap">
                        ❤️ Blood Pressure
                      </button>
                      <button (click)="activeMetric.set('hr')"
                        [class]="activeMetric() === 'hr' ? 'bg-emerald-600 text-white font-extrabold shadow-sm' : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800'"
                        class="px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap">
                        💓 Pulse Rate
                      </button>
                      <button (click)="activeMetric.set('spo2')"
                        [class]="activeMetric() === 'spo2' ? 'bg-cyan-600 text-white font-extrabold shadow-sm' : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800'"
                        class="px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap">
                        🫁 Oxygen Sat (SpO2)
                      </button>
                      <button (click)="activeMetric.set('temp')"
                        [class]="activeMetric() === 'temp' ? 'bg-amber-600 text-white font-extrabold shadow-sm' : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800'"
                        class="px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap">
                        🌡️ Temperature
                      </button>
                      <button (click)="activeMetric.set('nutrients')"
                        [class]="activeMetric() === 'nutrients' ? 'bg-teal-600 text-white font-extrabold shadow-sm' : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800'"
                        class="px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-1">
                        🧪 Micronutrients ▾
                      </button>
                    </div>

                    @if (activeMetric() === 'nutrients') {
                      <div class="flex items-center gap-1.5 p-2 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/50 dark:border-teal-800/40 text-xs font-mono">
                        <span class="text-[10px] font-bold uppercase text-teal-700 dark:text-teal-400 mr-1">Nutrient Focus:</span>
                        <button type="button" (click)="activeNutrient.set('vitD3')" [class.bg-teal-600]="activeNutrient() === 'vitD3'" [class.text-white]="activeNutrient() === 'vitD3'" class="px-2.5 py-1 rounded-lg border border-teal-500/30 text-zinc-700 dark:text-zinc-300 transition cursor-pointer">Vit D3</button>
                        <button type="button" (click)="activeNutrient.set('vitC')" [class.bg-teal-600]="activeNutrient() === 'vitC'" [class.text-white]="activeNutrient() === 'vitC'" class="px-2.5 py-1 rounded-lg border border-teal-500/30 text-zinc-700 dark:text-zinc-300 transition cursor-pointer">Vit C</button>
                        <button type="button" (click)="activeNutrient.set('magnesium')" [class.bg-teal-600]="activeNutrient() === 'magnesium'" [class.text-white]="activeNutrient() === 'magnesium'" class="px-2.5 py-1 rounded-lg border border-teal-500/30 text-zinc-700 dark:text-zinc-300 transition cursor-pointer">Magnesium</button>
                        <button type="button" (click)="activeNutrient.set('zinc')" [class.bg-teal-600]="activeNutrient() === 'zinc'" [class.text-white]="activeNutrient() === 'zinc'" class="px-2.5 py-1 rounded-lg border border-teal-500/30 text-zinc-700 dark:text-zinc-300 transition cursor-pointer">Zinc</button>
                        <button type="button" (click)="activeNutrient.set('b12')" [class.bg-teal-600]="activeNutrient() === 'b12'" [class.text-white]="activeNutrient() === 'b12'" class="px-2.5 py-1 rounded-lg border border-teal-500/30 text-zinc-700 dark:text-zinc-300 transition cursor-pointer">Vit B12</button>
                      </div>
                    }

                    <!-- Demographic & Condition Healthy Targets Summary Banner -->
                    <div class="flex items-center justify-between px-3 py-2 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 text-[11px]">
                      <div class="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
                        <span>🎯 Demographic Target:</span>
                        <span class="font-mono text-emerald-700 dark:text-emerald-400">{{ getDemographicTargetDescription() }}</span>
                      </div>
                      <span class="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">Healthy Zone Active</span>
                    </div>

                    <!-- Single Canvas Container with Constant Dimensions (h-72 sm:h-80) -->
                    <div class="w-full h-72 sm:h-80 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-3 sm:p-4 flex flex-col shadow-sm relative overflow-hidden">
                      <div class="relative flex-1 min-h-0 w-full h-full">
                        <canvas #unifiedChart></canvas>
                      </div>
                    </div>
                  </section>
                } @placeholder {
                  <section>
                    <h2 class="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-[0.15em] mb-6">Retrospective Data Visualization</h2>
                    <div class="h-64 w-full flex items-center justify-center bg-gray-50/50 dark:bg-zinc-900 border border-dashed border-gray-200 dark:border-zinc-800 rounded">
                      <span class="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-zinc-400">Scroll to load charts</span>
                    </div>
                  </section>
                }

                <!-- Paradigm Diagnostic Exploration Card -->
                <section class="p-5 bg-gradient-to-br from-indigo-50/60 via-purple-50/40 to-slate-50 dark:from-zinc-900 dark:via-zinc-900/90 dark:to-zinc-950 border border-indigo-100 dark:border-zinc-800 rounded-xl shadow-xs space-y-4">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-indigo-600 text-white shadow-2xs">
                        {{ state.activePhilosophy() | uppercase }} DIAGNOSTIC EXPLORATION MATRIX
                      </span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="text-[11px] font-semibold text-gray-500 dark:text-zinc-400">Si Zhen / Ashtavidha Channel Active</span>
                    </div>
                  </div>

                  @if (state.activePhilosophy() === 'eastern') {
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div class="p-3 bg-white/80 dark:bg-zinc-800/80 backdrop-blur rounded-lg border border-emerald-200/60 dark:border-emerald-900/40">
                        <div class="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Tongue Inspection (Wang)</div>
                        <div class="text-xs font-bold text-slate-900 dark:text-zinc-100 mt-1 capitalize">{{ state.tcmIntake().tongueColor }} Body</div>
                        <div class="text-[11px] font-medium text-slate-600 dark:text-zinc-400 mt-0.5 capitalize">{{ state.tcmIntake().tongueCoating }} Coating</div>
                      </div>
                      <div class="p-3 bg-white/80 dark:bg-zinc-800/80 backdrop-blur rounded-lg border border-sky-200/60 dark:border-sky-900/40">
                        <div class="text-[10px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider">Radial Pulse Quality (Qie)</div>
                        <div class="text-xs font-bold text-slate-900 dark:text-zinc-100 mt-1 capitalize">{{ state.tcmIntake().pulseQuality }} Waveform</div>
                        <div class="text-[11px] font-medium text-slate-600 dark:text-zinc-400 mt-0.5">Cun / Guan / Chi Position Sync</div>
                      </div>
                      <div class="p-3 bg-white/80 dark:bg-zinc-800/80 backdrop-blur rounded-lg border border-purple-200/60 dark:border-purple-900/40">
                        <div class="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">Thermal & Organ Preference</div>
                        <div class="text-xs font-bold text-slate-900 dark:text-zinc-100 mt-1 capitalize">{{ state.tcmIntake().thermalPreference }}</div>
                        <div class="text-[11px] font-medium text-slate-600 dark:text-zinc-400 mt-0.5">Shi Wen 10-Questions Vector</div>
                      </div>
                    </div>
                  } @else if (state.activePhilosophy() === 'ayurvedic') {
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div class="p-3 bg-white/80 dark:bg-zinc-800/80 backdrop-blur rounded-lg border border-cyan-200/60 dark:border-cyan-900/40">
                        <div class="text-[10px] font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">Tridosha Vikriti Imbalance</div>
                        <div class="text-xs font-bold text-slate-900 dark:text-zinc-100 mt-1">
                          V: {{ state.ayurvedicIntake().vikritiVata }} | P: {{ state.ayurvedicIntake().vikritiPitta }} | K: {{ state.ayurvedicIntake().vikritiKapha }}
                        </div>
                        <div class="text-[11px] font-medium text-slate-600 dark:text-zinc-400 mt-0.5">Active Doshic Aggravation</div>
                      </div>
                      <div class="p-3 bg-white/80 dark:bg-zinc-800/80 backdrop-blur rounded-lg border border-amber-200/60 dark:border-amber-900/40">
                        <div class="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Agni Metabolic Fire</div>
                        <div class="text-xs font-bold text-slate-900 dark:text-zinc-100 mt-1 capitalize">{{ state.ayurvedicIntake().agniType }}</div>
                        <div class="text-[11px] font-medium text-slate-600 dark:text-zinc-400 mt-0.5">Digestive Fire Status</div>
                      </div>
                      <div class="p-3 bg-white/80 dark:bg-zinc-800/80 backdrop-blur rounded-lg border border-rose-200/60 dark:border-rose-900/40">
                        <div class="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Ama Toxicity Score</div>
                        <div class="text-xs font-bold text-slate-900 dark:text-zinc-100 mt-1">{{ state.ayurvedicIntake().amaScore }}/10 Toxicity</div>
                        <div class="text-[11px] font-medium text-slate-600 dark:text-zinc-400 mt-0.5">Undigested Toxin Load</div>
                      </div>
                    </div>
                  } @else {
                    <div class="p-3 bg-white/80 dark:bg-zinc-800/80 backdrop-blur rounded-lg border border-slate-200/60 dark:border-zinc-700/60 flex items-center justify-between">
                      <div class="text-xs font-semibold text-slate-700 dark:text-zinc-300">Western ICD-10 & Pathophysiology Protocol Active</div>
                      <span class="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Allopathic Mode</span>
                    </div>
                  }
                </section>

                <!-- Active Anatomical Hotspots -->
                @if (activeIssues().length > 0) {
                  <section>
                      <h2 class="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-[0.15em] mb-4">Active Anatomical Hotspots</h2>
                      <div class="grid grid-cols-1 gap-3">
                          @for (issue of activeIssues(); track issue.noteId) {
                            <div class="p-4 bg-gray-50 dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div>
                                <h3 class="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-zinc-200">{{ issue.name }}</h3>
                                <p class="text-xs text-gray-500 dark:text-zinc-400 mt-1" *ngIf="issue.description">{{ issue.description }}</p>
                              </div>
                              <div class="flex items-center gap-2 flex-wrap">
                                <pocket-gull-badge [label]="'Pain: ' + issue.painLevel + '/10'" severity="neutral"></pocket-gull-badge>
                                @if (state.activePhilosophy() === 'eastern' && issue.tcmPattern) {
                                  <pocket-gull-badge [label]="'TCM: ' + issue.tcmPattern" severity="success"></pocket-gull-badge>
                                } @else if (state.activePhilosophy() === 'ayurvedic' && issue.ayurvedicImbalance) {
                                  <pocket-gull-badge [label]="'Ayurvedic: ' + issue.ayurvedicImbalance" severity="warning"></pocket-gull-badge>
                                }
                              </div>
                            </div>
                          }
                      </div>
                  </section>
                }

                <!-- Pre-existing Conditions -->
                @if(p.preexistingConditions.length > 0) {
                  <section>
                      <h2 class="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-[0.15em] mb-4">Historical Conditions</h2>
                      <div class="flex flex-wrap gap-2">
                          @for(condition of p.preexistingConditions; track condition) {
                            <pocket-gull-badge [label]="condition" severity="neutral"></pocket-gull-badge>
                          }
                      </div>
                  </section>
                }

                <!-- Draft Care Plan -->
                @if (state.draftSummaryItems().length > 0) {
                  <section class="bg-gray-50 dark:bg-zinc-900 p-4 sm:p-6 border border-gray-200 dark:border-zinc-800 rounded">
                    <h2 class="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-[0.15em] mb-4 flex justify-between items-center">
                      <pocket-gull-badge label="Care Recommendation Draft" severity="success" [hasIcon]="true">
                        <div badge-icon class="w-1.5 h-1.5 bg-[#689F38] rounded-full animate-pulse"></div>
                      </pocket-gull-badge>
                    </h2>
                    <ul class="space-y-3 text-[13px] text-[#1C1C1C] dark:text-zinc-100">
                      @for (item of state.draftSummaryItems(); track $index) {
                        <li class="pl-0">
                          <div class="flex justify-between items-start gap-3 group">
                             <div class="w-1 h-4 bg-gray-200 dark:bg-zinc-700 mt-0.5 shrink-0 group-hover:bg-[#689F38] transition-colors"></div>
                            <span class="flex-1 font-medium">{{ item.text }}</span>
                            <pocket-gull-button 
                              (click)="removeDraftItem(item)" 
                              variant="ghost" 
                              size="xs" 
                              title="Remove"
                              ariaLabel="Remove Draft Item"
                              icon="M18 6L6 18M6 6l12 12">
                            </pocket-gull-button>
                          </div>
                        </li>
                      }
                    </ul>
                    <div class="mt-6 pt-6 border-t border-gray-200 dark:border-zinc-800 flex justify-end">
                       <pocket-gull-button 
                          (click)="finalizeDraftPlan()" 
                          variant="secondary" 
                          size="sm"
                          trailingIcon="M5 12l5 5l10-10">
                          Append to Active Strategics
                       </pocket-gull-button>
                    </div>
                  </section>
                }

                <!-- Active Care Plan -->
                @if (activeCarePlanHTML(); as html) {
                  <section>
                    <h2 class="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-[0.15em] mb-4">Active Strategy Overview</h2>
                    <div class="p-4 sm:p-8 bg-white dark:bg-[#09090b] border border-gray-100 dark:border-zinc-800 rounded prose dark:prose-invert prose-sm max-w-none prose-p:text-[#1C1C1C] dark:prose-p:text-zinc-100 prose-p:font-light prose-headings:text-[12px] prose-headings:font-bold prose-headings:uppercase prose-headings:tracking-[0.1em] prose-headings:text-gray-500 dark:prose-headings:text-zinc-400" [innerHTML]="html | safeHtml"></div>
                  </section>
                }
      </div>
    </div>
    } @else {
        <div class="p-8 text-center text-gray-500 dark:text-zinc-400 h-full flex items-center justify-center">
            <p class="text-sm font-medium uppercase tracking-widest">No patient selected.</p>
        </div>
    }


  `
})
export class MedicalChartSummaryComponent {
  state = inject(PatientStateService);
  patientManager = inject(PatientManagementService);
  exportService = inject(ExportService);
  fhirAuth = inject(FhirIntegrationService);
  dictation = inject(DictationService);
  clinicalAI = inject(ClinicalIntelligenceService);
  orcidService = inject(OrcidService);
  pythonBridge = inject(PythonBridgeService);
  clinicalAssessments = inject(ClinicalAssessmentsService);
  ybocsService = inject(YbocsService);
  acronymService = inject(AcronymExpanderService);
  readonly docDrill = inject(DocDrillService);
  http = inject(HttpClient);
  
  today = new Date();
  newVisitReason = signal('');
  showExportMenu = signal(false);
  showEpicSuccess = signal(false);
  isExporting = signal(false);

  // Mobile Biometric Accordion Signal & Healthsheet Signal
  isBiometricsExpanded = signal<boolean>(false);
  showHealthsheet = signal<boolean>(false);
  readonly isTriageFlipped = signal<boolean>(false);
  private lastTriageFlipTime = 0;

  toggleTriageFlip(event?: Event) {
    if (event) event.stopPropagation();
    const now = Date.now();
    if (now - this.lastTriageFlipTime < 200) return;
    this.lastTriageFlipTime = now;
    this.isTriageFlipped.update(v => !v);
  }

  toggleBiometrics() {
    this.isBiometricsExpanded.update(v => !v);
  }

  // Expansive Custom Patient Fields Signal & Methods
  customFields = signal<{ key: string; value: string }[]>([
    { key: 'Custom Supplementation', value: 'NMN 500mg daily + Trans-Resveratrol' },
    { key: 'Personal Healthspan Goal', value: 'Achieve 10,000 steps & 6.0 bpm Vagal Resonant Breathing' }
  ]);

  addCustomField() {
    this.customFields.update(list => [...list, { key: '', value: '' }]);
  }

  updateCustomField(index: number, prop: 'key' | 'value', val: string) {
    this.customFields.update(list => {
      const copy = [...list];
      if (copy[index]) {
        copy[index][prop] = val;
      }
      return copy;
    });
  }

  removeCustomField(index: number) {
    this.customFields.update(list => list.filter((_, i) => i !== index));
  }

  // BigQuery Healthcare Baseline Overlays
  baselines = signal<any>(null);
  showCDCBaseline = signal(false);
  showWHOBaseline = signal(false);
  showBQBaseline = signal(true);

  parseVitalNum(val: string | undefined): number {
    if (!val) return 0;
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  }

  async ngOnInit() {
    try {
      const data = await firstValueFrom(this.http.get('/api/health/baselines'));
      this.baselines.set(data);
    } catch (e) {
      console.debug('[MedicalSummary] Baseline fetch skipped:', (e as Error)?.message);
    }
  }

  async connectOrcid(id: string) {
    if (!id.trim()) return;
    await this.orcidService.connectOrcid(id);
  }

  async exportToBigQuery() {
    const p = this.patient();
    if (!p) return;
    this.isExporting.set(true);
    try {
      await this.exportService.exportToBigQuery(p);
      this.showEpicSuccess.set(true); // Reusing the success toast to signal export completion as a generic notification for now
      setTimeout(() => this.showEpicSuccess.set(false), 3000);
    } catch (e) {
      console.error('Failed to export to BigQuery', e);
      alert('BigQuery export failed. Please check the console.');
    } finally {
      this.isExporting.set(false);
    }
  }



  activeMetric = signal<'all' | 'pain' | 'bp' | 'hr' | 'spo2' | 'temp' | 'nutrients'>('all');
  activeNutrient = signal<'vitD3' | 'vitC' | 'magnesium' | 'zinc' | 'b12'>('vitD3');
  chartType = signal<'line' | 'bar' | 'radar'>('line');
  unifiedChartRef = viewChild<ElementRef<HTMLCanvasElement>>('unifiedChart');
  private unifiedChartInstance: any = null;

  getDemographicTargetDescription(): string {
    const p = this.patient();
    const metric = this.activeMetric();
    const nut = this.activeNutrient();
    const isGeriatric = p?.age && p.age >= 65;
    const isInfant = p?.age && p.age <= 2;
    const precond = p?.preexistingConditions?.join(', ') || 'General Health';

    if (metric === 'pain') return 'Target Pain Index: 0–2 / 10 (Controlled / Mild)';
    if (metric === 'bp') return isGeriatric ? 'Target BP: <130/80 mmHg (ACC/AHA Senior Baseline)' : 'Target BP: <120/80 mmHg (Adult Clinical Standard)';
    if (metric === 'hr') return isInfant ? 'Target Pulse: 100–160 BPM (Pediatric Range)' : (isGeriatric ? 'Target Pulse: 55–85 BPM' : 'Target Pulse: 60–90 BPM');
    if (metric === 'spo2') return 'Target SpO2: 95% – 100% Normal Ambient Air';
    if (metric === 'temp') return 'Target Core Temp: 97.8°F – 99.1°F Afebril';
    if (metric === 'nutrients') {
      if (nut === 'vitD3') return 'Target Vit D3: 40–70 ng/mL (Bone & Immune Optimization)';
      if (nut === 'vitC') return 'Target Vit C: 0.8–2.0 mg/dL (Antioxidant Reserve)';
      if (nut === 'magnesium') return 'Target Magnesium: 1.8–2.6 mg/dL (Neuromuscular Tone)';
      if (nut === 'zinc') return 'Target Zinc: 70–120 mcg/dL (Enzyme Cofactor)';
      return 'Target Vit B12: 400–900 pg/mL (Neuro-Metabolic Support)';
    }
    return `Multi-System Composite Target Range (Calibrated for Age ${p?.age || 35} & ${precond})`;
  }

  patient = computed(() => {
    const id = this.patientManager.selectedPatientId();
    if (!id) return null;
    return this.patientManager.patients().find(p => p.id === id) ?? null;
  });

  activeIssues = computed(() => {
    const issues = this.state.issues();
    return Object.values(issues).flat();
  });

  vitals = this.state.vitals;

  bpData = computed(() => {
    const bpString = this.state.vitals().bp;
    if (!bpString || !bpString.includes('/')) return { systolic: 0, diastolic: 0, valid: false, systolicWidth: 0, diastolicWidth: 0 };

    const [systolic, diastolic] = bpString.split('/').map(s => parseInt(s.trim(), 10));
    const valid = !isNaN(systolic) && !isNaN(diastolic);

    const maxSystolic = 200;
    const maxDiastolic = 150;

    return {
      systolic,
      diastolic,
      valid,
      systolicWidth: (systolic / maxSystolic) * 100,
      diastolicWidth: (diastolic / maxDiastolic) * 100
    };
  });

  activeCarePlanHTML = computed(() => {
    const plan = this.state.activePatientSummary();
    if (!plan) return null;
    try {
      return marked.parse(plan, { gfm: true, breaks: true }) as string;
    } catch (e) {
      console.error('Markdown parse error for care plan', e);
      return `<p>Error parsing care plan.</p>`;
    }
  });

  private chartRenderTimeout?: ReturnType<typeof setTimeout>;

  constructor() {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('epic_connected') === 'true') {
        this.showEpicSuccess.set(true);
        window.history.replaceState({}, document.title, window.location.pathname);
        setTimeout(() => this.showEpicSuccess.set(false), 5000);
      }
    }

    effect(() => {
      const p = this.patient();
      this.state.vitals();
      this.state.issues();
      this.showCDCBaseline();
      this.showWHOBaseline();
      this.showBQBaseline();
      this.baselines();
      this.activeMetric();
      this.activeNutrient();
      this.chartType();
      const ref = this.unifiedChartRef();

      if (p && ref) {
        untracked(() => {
          if (this.chartRenderTimeout) {
            clearTimeout(this.chartRenderTimeout);
          }
          this.chartRenderTimeout = setTimeout(() => this.renderChart(), 200);
        });
      }
    });
  }

  private async renderChart() {
    const p = this.patient();
    const ref = this.unifiedChartRef();
    if (!p || !ref || !ref.nativeElement) return;

    const { Chart, registerables } = await import('chart.js');
    Chart.register(...registerables);

    if (this.unifiedChartInstance) {
      this.unifiedChartInstance.destroy();
      this.unifiedChartInstance = null;
    }

    const existingChart = Chart.getChart(ref.nativeElement);
    if (existingChart) {
      existingChart.destroy();
    }

    const ctx = ref.nativeElement.getContext('2d');
    if (!ctx) return;

    const dates: string[] = [];
    const painLevels: number[] = [];
    const systolicLevels: (number | null)[] = [];
    const diastolicLevels: (number | null)[] = [];
    const hrLevels: (number | null)[] = [];
    const spo2Levels: (number | null)[] = [];
    const tempLevels: (number | null)[] = [];
    const vitCLevels: (number | null)[] = [];
    const vitD3Levels: (number | null)[] = [];
    const magnesiumLevels: (number | null)[] = [];
    const zincLevels: (number | null)[] = [];
    const b12Levels: (number | null)[] = [];

    const parseBp = (bp: string | undefined): [number | null, number | null] => {
      if (!bp || !bp.includes('/')) return [null, null];
      const parts = bp.split('/');
      return [parseInt(parts[0], 10) || null, parseInt(parts[1], 10) || null];
    };

    const parseNum = (val: string | undefined): number | null => {
      if (!val) return null;
      const num = parseFloat(val);
      return isNaN(num) ? null : num;
    };

    const sortedHistory = [...p.history].sort((a, b) => a.date.localeCompare(b.date));

    sortedHistory.forEach(entry => {
      if (entry.type === 'Visit' || entry.type === 'ChartArchived') {
        let maxPain = 0;
        if (entry.state && entry.state.issues) {
          Object.values(entry.state.issues).flat().forEach(issue => {
            if (issue.painLevel > maxPain) maxPain = issue.painLevel;
          });
        }
        dates.push(entry.date);
        painLevels.push(maxPain);

        if (entry.state && entry.state.vitals) {
          const [sys, dia] = parseBp(entry.state.vitals.bp);
          systolicLevels.push(sys);
          diastolicLevels.push(dia);
          hrLevels.push(parseNum(entry.state.vitals.hr));
          spo2Levels.push(parseNum(entry.state.vitals.spO2));
          tempLevels.push(parseNum(entry.state.vitals.temp));
          vitCLevels.push(parseNum(entry.state.vitals.vitC));
          vitD3Levels.push(parseNum(entry.state.vitals.vitD3));
          magnesiumLevels.push(parseNum(entry.state.vitals.magnesium));
          zincLevels.push(parseNum(entry.state.vitals.zinc));
          b12Levels.push(parseNum(entry.state.vitals.b12));
        } else {
          systolicLevels.push(null);
          diastolicLevels.push(null);
          hrLevels.push(null);
          spo2Levels.push(null);
          tempLevels.push(null);
          vitCLevels.push(null);
          vitD3Levels.push(null);
          magnesiumLevels.push(null);
          zincLevels.push(null);
          b12Levels.push(null);
        }
      }
    });

    let currentMaxPain = 0;
    const currentIssues = this.state.issues();
    Object.values(currentIssues).flat().forEach(issue => {
      if (issue.painLevel > currentMaxPain) currentMaxPain = issue.painLevel;
    });

    dates.push('Current');
    painLevels.push(currentMaxPain);

    const [currSys, currDia] = parseBp(this.state.vitals().bp);
    systolicLevels.push(currSys);
    diastolicLevels.push(currDia);
    hrLevels.push(parseNum(this.state.vitals().hr));
    spo2Levels.push(parseNum(this.state.vitals().spO2));
    tempLevels.push(parseNum(this.state.vitals().temp));
    vitCLevels.push(parseNum(this.state.vitals().vitC));
    vitD3Levels.push(parseNum(this.state.vitals().vitD3));
    magnesiumLevels.push(parseNum(this.state.vitals().magnesium));
    zincLevels.push(parseNum(this.state.vitals().zinc));
    b12Levels.push(parseNum(this.state.vitals().b12));

    const selectedType = this.chartType();
    const metric = this.activeMetric();
    const nutrient = this.activeNutrient();

    // 1. Radar Chart Mode
    if (selectedType === 'radar') {
      const radarLabels = ['Pain Path (x10)', 'Systolic BP', 'Pulse (BPM)', 'SpO2 (%)', 'Vit D3 (ng/mL)', 'Vit C (mg/dL)', 'Magnesium (mg/dL)'];
      const lastIdx = dates.length - 1;

      const currentValues = [
        (painLevels[lastIdx] || 0) * 10,
        systolicLevels[lastIdx] || 120,
        hrLevels[lastIdx] || 72,
        spo2Levels[lastIdx] || 98,
        (vitD3Levels[lastIdx] || 45),
        (vitCLevels[lastIdx] || 1.2) * 40,
        (magnesiumLevels[lastIdx] || 2.1) * 35
      ];

      const baselineTargetValues = [20, 120, 70, 99, 50, 50, 75]; // Demographic target values

      this.unifiedChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
          labels: radarLabels,
          datasets: [
            {
              label: 'Patient Current Biometrics',
              data: currentValues,
              borderColor: '#8b5cf6',
              backgroundColor: 'rgba(139, 92, 246, 0.25)',
              borderWidth: 3,
              pointBackgroundColor: '#8b5cf6'
            },
            {
              label: 'Demographic Target Zone',
              data: baselineTargetValues,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              borderWidth: 2,
              borderDash: [4, 4],
              pointRadius: 0
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              angleLines: { color: 'rgba(156, 163, 175, 0.2)' },
              grid: { color: 'rgba(156, 163, 175, 0.2)' },
              pointLabels: { font: { family: 'Inter', size: 10, weight: 'bold' }, color: '#9CA3AF' },
              ticks: { display: false }
            }
          },
          plugins: {
            legend: { position: 'top', labels: { font: { family: 'Inter', size: 11 }, usePointStyle: true } }
          }
        }
      });
      return;
    }

    // 2. Line or Bar Chart Mode
    const datasets: any[] = [];
    const isBar = selectedType === 'bar';

    const buildGradient = (hex: string) => {
      const g = ctx.createLinearGradient(0, 0, 0, 300);
      g.addColorStop(0, hex + '50');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      return g;
    };

    if (metric === 'all') {
      datasets.push(
        { label: 'Pain (0-10)', data: painLevels, borderColor: '#ef4444', backgroundColor: buildGradient('#ef4444'), borderWidth: 2, tension: 0.3, type: selectedType },
        { label: 'Systolic BP', data: systolicLevels, borderColor: '#6366f1', backgroundColor: buildGradient('#6366f1'), borderWidth: 2, tension: 0.3, type: selectedType },
        { label: 'Diastolic BP', data: diastolicLevels, borderColor: '#a855f7', backgroundColor: buildGradient('#a855f7'), borderWidth: 2, tension: 0.3, type: selectedType },
        { label: 'Pulse BPM', data: hrLevels, borderColor: '#10b981', backgroundColor: buildGradient('#10b981'), borderWidth: 2, tension: 0.3, type: selectedType },
        { label: 'SpO2 %', data: spo2Levels, borderColor: '#06b6d4', backgroundColor: buildGradient('#06b6d4'), borderWidth: 2, tension: 0.3, type: selectedType },
        { label: 'Temp °F', data: tempLevels, borderColor: '#f59e0b', backgroundColor: buildGradient('#f59e0b'), borderWidth: 2, tension: 0.3, type: selectedType }
      );
    } else if (metric === 'pain') {
      datasets.push({ label: 'Pain Level (0-10)', data: painLevels, borderColor: '#ef4444', backgroundColor: buildGradient('#ef4444'), borderWidth: 3, tension: 0.3, fill: !isBar, type: selectedType });
    } else if (metric === 'bp') {
      datasets.push(
        { label: 'Systolic BP (mmHg)', data: systolicLevels, borderColor: '#6366f1', backgroundColor: buildGradient('#6366f1'), borderWidth: 3, tension: 0.3, fill: !isBar, type: selectedType },
        { label: 'Diastolic BP (mmHg)', data: diastolicLevels, borderColor: '#a855f7', backgroundColor: buildGradient('#a855f7'), borderWidth: 3, tension: 0.3, fill: !isBar, type: selectedType }
      );
    } else if (metric === 'hr') {
      datasets.push({ label: 'Pulse Rate (BPM)', data: hrLevels, borderColor: '#10b981', backgroundColor: buildGradient('#10b981'), borderWidth: 3, tension: 0.3, fill: !isBar, type: selectedType });
    } else if (metric === 'spo2') {
      datasets.push({ label: 'Oxygen Saturation (%)', data: spo2Levels, borderColor: '#06b6d4', backgroundColor: buildGradient('#06b6d4'), borderWidth: 3, tension: 0.3, fill: !isBar, type: selectedType });
    } else if (metric === 'temp') {
      datasets.push({ label: 'Core Temperature (°F)', data: tempLevels, borderColor: '#f59e0b', backgroundColor: buildGradient('#f59e0b'), borderWidth: 3, tension: 0.3, fill: !isBar, type: selectedType });
    } else if (metric === 'nutrients') {
      const map: Record<string, { label: string; data: (number | null)[]; color: string }> = {
        vitD3: { label: 'Vitamin D3 (ng/mL)', data: vitD3Levels, color: '#0d9488' },
        vitC: { label: 'Vitamin C (mg/dL)', data: vitCLevels, color: '#14b8a6' },
        magnesium: { label: 'Magnesium (mg/dL)', data: magnesiumLevels, color: '#2dd4bf' },
        zinc: { label: 'Zinc (mcg/dL)', data: zincLevels, color: '#5eead4' },
        b12: { label: 'Vitamin B12 (pg/mL)', data: b12Levels, color: '#0f766e' }
      };
      const sel = map[nutrient] || map['vitD3'];
      datasets.push({ label: sel.label, data: sel.data, borderColor: sel.color, backgroundColor: buildGradient(sel.color), borderWidth: 3, tension: 0.3, fill: !isBar, type: selectedType });
    }

    // Append Baseline Overlays
    const pushBaseline = (src: string, color: string, value: number) => {
      datasets.push({
        label: `${src} Baseline (${value})`,
        data: Array(dates.length).fill(value),
        borderColor: color,
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 0,
        fill: false
      });
    };

    if (this.showCDCBaseline()) pushBaseline('CDC Target', '#4285F4', metric === 'bp' ? 120 : (metric === 'hr' ? 72 : (metric === 'spo2' ? 98 : 80)));
    if (this.showWHOBaseline()) pushBaseline('WHO Norm', '#689F38', metric === 'bp' ? 118 : (metric === 'hr' ? 70 : (metric === 'spo2' ? 97 : 75)));
    if (this.showBQBaseline()) pushBaseline('BigQuery OMOP', '#EA4335', metric === 'bp' ? 122 : (metric === 'hr' ? 74 : (metric === 'spo2' ? 98.5 : 82)));

    this.unifiedChartInstance = new Chart(ctx, {
      type: selectedType as any,
      data: { labels: dates, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: false,
            grid: { color: 'rgba(156, 163, 175, 0.1)' },
            ticks: { font: { family: 'Inter', size: 10, weight: 'bold' }, color: '#9CA3AF' }
          },
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Inter', size: 10, weight: 'bold' }, color: '#9CA3AF' }
          }
        },
        plugins: {
          legend: { position: 'top', labels: { font: { family: 'Inter', size: 11 }, usePointStyle: true } }
        }
      }
    });
  }



  removeDraftItem(item: IDraftSummaryItem) {
    this.state.removeDraftSummaryItem(item.id);
  }

  get hasDraftItems() {
    const draftItems = this.state.draftSummaryItems();
    return draftItems && draftItems.length > 0;
  }

  updateVital(key: keyof IPatientState['vitals'], event: any) {
    this.state.updateVital(key, event.target.value);
  }

  dictateVisitNote() {
    this.dictation.openDictationModal(this.newVisitReason(), (result: string) => {
      this.newVisitReason.set(result);
    });
  }

  saveNewVisit() {
    const reason = this.newVisitReason().trim();
    const patient = this.patient();
    if (!reason || !patient) return;

    // Capture the state at the time of this visit
    const visitState: IPatientState = {
      ...this.state.getCurrentState(),
      patientGoals: reason // The primary goal for this snapshot is the reason for the visit.
    };

    const newEntry: HistoryEntry = {
      type: 'Visit',
      date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
      summary: reason,
      state: visitState
    };

    // Add to history (this also updates the patient's lastVisit)
    this.patientManager.addHistoryEntry(patient.id, newEntry);

    // Update the patient's primary 'patientGoals' to reflect this latest visit
    this.patientManager.updatePatientDetails(patient.id, { patientGoals: reason });

    // Reset the form
    this.newVisitReason.set('');
  }

  exportNativeJson() {
    const patient = this.patient();
    if (!patient) return;
    this.exportService.downloadAsNativeJson(patient);
    this.showExportMenu.set(false);
  }

  connectToEpic() {
    this.fhirAuth.authorize();
  }

  exportFhirBundle() {
    const patient = this.patient();
    if (!patient) return;
    this.exportService.downloadAsFhirBundle(patient);
    this.showExportMenu.set(false);
  }

  exportToEpic() {
    const patient = this.patient();
    if (!patient) return;
    this.exportService.exportToEHR(patient, 'Epic');
    this.showEpicSuccess.set(true);
    setTimeout(() => this.showEpicSuccess.set(false), 3000);
  }

  exportToCerner() {
    const patient = this.patient();
    if (!patient) return;
    this.exportService.exportToEHR(patient, 'Cerner');
    this.showEpicSuccess.set(true);
    setTimeout(() => this.showEpicSuccess.set(false), 3000);
  }

  discardDrafts() {
    const draftItems = this.state.draftSummaryItems();

    if (draftItems && draftItems.length > 0) {
      if (confirm('Discard your draft modifications and revert to the saved Patient Summary?')) {
        this.state.clearDraftSummaryItems();
      }
    }
  }

  finalizeDraftPlan() {
    let plan = this.state.activePatientSummary() || '';
    const draftItems = this.state.draftSummaryItems();
    if (draftItems.length > 0) {
      const newContent = draftItems.map(item => `- ${item.text}`).join('\n');
      plan = plan ? `${plan}\n\n### Added ${new Date().toLocaleDateString()}\n${newContent}` : `### Patient Summary\n${newContent}`;
      this.state.updateActivePatientSummary(plan);
      this.state.clearDraftSummaryItems();
    }
  }
}
