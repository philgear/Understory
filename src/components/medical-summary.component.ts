import { Component, ChangeDetectionStrategy, inject, computed, ViewChild, ElementRef, AfterViewInit, effect, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { PatientStateService, PatientState } from '../services/patient-state.service';
import { PatientManagementService, HistoryEntry, Patient } from '../services/patient-management.service';
import { ExportService } from '../services/export.service';
import { DictationService } from '../services/dictation.service';
import { marked } from 'marked';
import { UnderstoryButtonComponent } from './shared/understory-button.component';
import { UnderstoryInputComponent } from './shared/understory-input.component';
import { UnderstoryBadgeComponent } from './shared/understory-badge.component';

@Component({
  selector: 'app-medical-summary',
  standalone: true,
  imports: [CommonModule, UnderstoryButtonComponent, UnderstoryInputComponent, UnderstoryBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (patient(); as p) {
      <div class="p-4 sm:p-8 font-sans text-gray-800 h-full flex flex-col bg-white">

            <!-- Chart Header -->
            <div class="flex flex-col sm:flex-row justify-between items-start pb-6 border-b border-gray-100 gap-4 sm:gap-0">
              <div>
                <h1 class="text-3xl font-light text-[#1C1C1C] tracking-tight">{{ p.name }}</h1>
                <p class="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mt-2">{{ today | date:'fullDate' }}</p>
              </div>
              <div class="flex items-center gap-2">
                <!-- Export Menu -->
                <div class="relative">
                  <understory-button 
                    (click)="showExportMenu.set(!showExportMenu())"
                    variant="ghost"
                    size="sm"
                    icon="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    aria-label="Export patient data">
                    Export
                  </understory-button>
                  @if (showExportMenu()) {
                    <div class="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-xl ring-1 ring-black/5 py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                      <button (click)="exportNativeJson()" class="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                        <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>
                        Export as JSON
                      </button>
                      <button (click)="exportFhirBundle()" class="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                        <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
                        Export as FHIR
                      </button>
                    </div>
                  }
                </div>
                <understory-button 
                  (click)="openFinalizePreview()" 
                  variant="primary"
                  size="md">
                  Finalize & Archive
                </understory-button>
              </div>
            </div>

            <div class="mt-6 space-y-8">
                <!-- Current Visit / Chief Complaint -->
                <div class="mb-8 font-sans">
                  <div class="flex justify-between items-center mb-3">
                    <label class="block text-xs font-bold text-gray-500 uppercase tracking-[0.15em] flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                        Current Visit / Chief Complaint
                    </label>
                    <understory-button 
                      variant="ghost" 
                      size="xs" 
                      (click)="dictateVisitNote()" 
                      title="Dictate"
                      icon="M12 14q-1.25 0-2.125-.875T9 11V5q0-1.25.875-2.125T12 2q1.25 0 2.125.875T15 5v6q0 1.25-.875 2.125T12 14m-1 7v-3.075q-2.6-.35-4.3-2.325T5 11h2q0 2.075 1.463 3.537T12 16q2.075 0 3.538-1.463T17 11h2q0 2.225-1.7 4.2T13 17.925V21z">
                    </understory-button>
                  </div>
                  <div class="relative group">
                    <understory-input
                      type="textarea"
                      [value]="newVisitReason()"
                      (valueChange)="newVisitReason.set($event)"
                      [rows]="3"
                      placeholder="Enter reason for today's visit or primary health goal..."
                      class="w-full">
                    </understory-input>
                  </div>
                  <div class="flex items-center justify-end mt-3">
                    <understory-button 
                      (click)="saveNewVisit()" 
                      [disabled]="!newVisitReason().trim()"
                      size="sm">
                      Save Visit Note
                    </understory-button>
                  </div>
                </div>

                <!-- Vitals Grid -->
                <!-- Vitals & Biometrics -->
                <section>
                    <h2 class="text-xs font-bold text-gray-500 uppercase tracking-[0.15em] mb-6">Biometric Telemetry</h2>
                </section>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 border-b border-gray-100 pb-8">
                  <div class="flex flex-col gap-2 p-3 bg-white border border-gray-100 hover:border-gray-200 transition-colors">
                    <span class="text-xs font-bold text-gray-500 uppercase tracking-[0.15em]">BP</span>
                    <understory-input
                      id="vitals-bp"
                      variant="minimal"
                      placeholder="120/80"
                      [value]="state.vitals().bp"
                      (valueChange)="state.updateVital('bp', $event)">
                    </understory-input>
                  </div>
                  <div class="flex flex-col gap-2 p-3 bg-white border border-gray-100 hover:border-gray-200 transition-colors">
                    <span class="text-xs font-bold text-gray-500 uppercase tracking-[0.15em]">HR</span>
                    <div class="flex items-baseline gap-1">
                      <understory-input
                        id="vitals-hr"
                        variant="minimal"
                        placeholder="--"
                        [value]="state.vitals().hr"
                        (valueChange)="state.updateVital('hr', $event)"
                        class="flex-1 min-w-0">
                      </understory-input>
                      <span class="text-xs text-gray-500 font-bold tracking-tighter shrink-0 uppercase">BPM</span>
                    </div>
                  </div>
                  <div class="flex flex-col gap-2 p-3 bg-white border border-gray-100 hover:border-gray-200 transition-colors">
                    <span class="text-xs font-bold text-gray-500 uppercase tracking-[0.15em]">SpO2</span>
                    <div class="flex items-baseline gap-1">
                      <understory-input
                        id="vitals-spo2"
                        variant="minimal"
                        placeholder="--"
                        [value]="state.vitals().spO2"
                        (valueChange)="state.updateVital('spO2', $event)"
                        class="flex-1 min-w-0">
                      </understory-input>
                      <span class="text-xs text-gray-500 font-bold shrink-0">%</span>
                    </div>
                  </div>
                  <div class="flex flex-col gap-2 p-3 bg-white border border-gray-100 hover:border-gray-200 transition-colors">
                    <span class="text-xs font-bold text-gray-500 uppercase tracking-[0.15em]">Temp</span>
                    <div class="flex items-baseline gap-1">
                      <understory-input
                        id="vitals-temp"
                        variant="minimal"
                        placeholder="--"
                        [value]="state.vitals().temp"
                        (valueChange)="state.updateVital('temp', $event)"
                        class="flex-1 min-w-0">
                      </understory-input>
                      <span class="text-xs text-gray-500 font-bold shrink-0">°F</span>
                    </div>
                  </div>
                  <div class="flex flex-col gap-2 p-3 bg-white border border-gray-100 hover:border-gray-200 transition-colors">
                    <span class="text-xs font-bold text-gray-500 uppercase tracking-[0.15em]">Weight</span>
                    <div class="flex items-baseline gap-1">
                      <understory-input
                        id="vitals-weight"
                        variant="minimal"
                        placeholder="--"
                        [value]="state.vitals().weight"
                        (valueChange)="state.updateVital('weight', $event)"
                        class="flex-1 min-w-0">
                      </understory-input>
                      <span class="text-xs text-gray-500 font-bold shrink-0 uppercase tracking-tighter">LBS</span>
                    </div>
                  </div>
                  <div class="flex flex-col gap-2 p-3 bg-white border border-gray-100 hover:border-gray-200 transition-colors">
                    <span class="text-xs font-bold text-gray-500 uppercase tracking-[0.15em]">Height</span>
                    <div class="flex items-baseline gap-1">
                      <understory-input
                        id="vitals-height"
                        variant="minimal"
                        placeholder="--/--"
                        [value]="state.vitals().height"
                        (valueChange)="state.updateVital('height', $event)"
                        class="flex-1 min-w-0">
                      </understory-input>
                      <span class="text-xs text-gray-500 font-bold shrink-0 uppercase tracking-tighter">FT</span>
                    </div>
                  </div>
                </div>

                <!-- Patient Trends Chart -->
                <section>
                    <h2 class="text-xs font-bold text-gray-500 uppercase tracking-[0.15em] mb-6">Retrospective Data Visualization</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div class="w-full h-64 bg-white border border-gray-100 rounded p-6 flex flex-col">
                            <h3 class="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Pain Path / 0–10</h3>
                            <div class="relative flex-1 min-h-0"><canvas #painChart></canvas></div>
                        </div>
                        <div class="w-full h-64 bg-white border border-gray-100 rounded p-6 flex flex-col">
                            <h3 class="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Blood Pressure / Composite</h3>
                            <div class="relative flex-1 min-h-0"><canvas #bpChart></canvas></div>
                        </div>
                        <div class="w-full h-64 bg-white border border-gray-100 rounded p-6 flex flex-col">
                            <h3 class="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Pulse Rate / BPM</h3>
                            <div class="relative flex-1 min-h-0"><canvas #hrChart></canvas></div>
                        </div>
                        <div class="w-full h-64 bg-white border border-gray-100 rounded p-6 flex flex-col">
                            <h3 class="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Oxygen Saturation / %</h3>
                            <div class="relative flex-1 min-h-0"><canvas #spo2Chart></canvas></div>
                        </div>
                        <div class="w-full h-64 bg-white border border-gray-100 rounded p-6 flex flex-col md:col-span-2">
                            <h3 class="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Core Temperature / Trend</h3>
                            <div class="relative flex-1 min-h-0"><canvas #tempChart></canvas></div>
                        </div>
                    </div>
                </section>

                <!-- Pre-existing Conditions -->
                @if(p.preexistingConditions.length > 0) {
                  <section>
                      <h2 class="text-xs font-bold text-gray-500 uppercase tracking-[0.15em] mb-4">Historical Conditions</h2>
                      <div class="flex flex-wrap gap-2">
                          @for(condition of p.preexistingConditions; track condition) {
                            <understory-badge [label]="condition" severity="neutral"></understory-badge>
                          }
                      </div>
                  </section>
                }

                <!-- Draft Care Plan -->
                @if (state.draftCarePlanItems().length > 0) {
                  <section class="bg-gray-50 p-6 border border-gray-200 rounded">
                    <h2 class="text-xs font-bold text-gray-500 uppercase tracking-[0.15em] mb-4 flex justify-between items-center">
                      <understory-badge label="Care Recommendation Draft" severity="success" [hasIcon]="true">
                        <div badge-icon class="w-1.5 h-1.5 bg-[#689F38] rounded-full animate-pulse"></div>
                      </understory-badge>
                    </h2>
                    <ul class="space-y-3 text-[13px] text-[#1C1C1C]">
                      @for (item of state.draftCarePlanItems(); track $index) {
                        <li class="pl-0">
                          <div class="flex justify-between items-start gap-3 group">
                             <div class="w-1 h-4 bg-gray-200 mt-0.5 shrink-0 group-hover:bg-[#689F38] transition-colors"></div>
                            <span class="flex-1 font-medium">{{ item }}</span>
                            <understory-button 
                              (click)="removeDraftItem(item)" 
                              variant="ghost" 
                              size="xs" 
                              title="Remove"
                              icon="M18 6L6 18M6 6l12 12">
                            </understory-button>
                          </div>
                        </li>
                      }
                    </ul>
                    <div class="mt-6 pt-6 border-t border-gray-200 flex justify-end">
                       <understory-button 
                          (click)="finalizeDraftPlan()" 
                          variant="secondary" 
                          size="sm"
                          trailingIcon="M5 12l5 5l10-10">
                          Append to Active Strategics
                       </understory-button>
                    </div>
                  </section>
                }

                <!-- Active Care Plan -->
                @if (activeCarePlanHTML(); as html) {
                  <section>
                    <h2 class="text-xs font-bold text-gray-500 uppercase tracking-[0.15em] mb-4">Active Strategy Overview</h2>
                    <div class="p-8 bg-white border border-gray-100 rounded prose prose-sm max-w-none prose-p:text-[#1C1C1C] prose-p:font-light prose-headings:text-[11px] prose-headings:font-bold prose-headings:uppercase prose-headings:tracking-[0.1em] prose-headings:text-gray-500" [innerHTML]="html"></div>
                  </section>
                }
      </div>
    </div>
    } @else {
        <div class="p-8 text-center text-gray-500 h-full flex items-center justify-center">
            <p class="text-sm font-medium uppercase tracking-widest">No patient selected.</p>
        </div>
    }

    <!-- Preview & Print Modal -->
    @if (showPreviewModal()) {
      <div class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 no-print">
        <div class="bg-white w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-[#F9FAFB]">
            <div>
              <h2 class="text-lg font-bold text-[#1C1C1C]">Preview & Print Care Plan</h2>
              <p class="text-xs uppercase font-bold text-gray-500 tracking-wider mt-1">Review and edit finalized text before archiving</p>
            </div>
            <understory-button 
              variant="ghost" 
              size="sm" 
              (click)="closePreview()" 
              icon="M18 6L6 18M6 6l12 12">
            </understory-button>
          </div>
          <div class="flex-1 overflow-y-auto p-6 bg-white">
             <div class="mb-2 flex justify-between items-center">
                <label class="block text-xs font-bold text-[#689F38] uppercase tracking-[0.15em]">Final Care Plan Document</label>
             </div>
             <understory-input
               type="textarea"
               [rows]="16"
               [value]="previewText()"
               (valueChange)="previewText.set($event)"
               placeholder="No Active Care Plan recorded for this visit."
               class="w-full">
             </understory-input>
             <p class="text-xs text-gray-500 font-bold uppercase tracking-wider mt-3 pl-1">This text will be archived in the patient's chart as the final Care Plan for this visit.</p>
          </div>
          <div class="px-6 py-4 border-t border-gray-100 bg-[#F9FAFB] flex justify-between items-center">
            <understory-button 
              (click)="printReport()" 
              variant="secondary" 
              size="sm" 
              icon="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z">
              Print Plan
            </understory-button>
            <div class="flex items-center gap-3">
              <understory-button 
                (click)="closePreview()" 
                variant="ghost" 
                size="sm">
                Cancel
              </understory-button>
              <understory-button 
                (click)="confirmFinalize()" 
                variant="primary" 
                size="sm" 
                trailingIcon="M20 6L9 17l-5-5">
                Commit to Chart
              </understory-button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class MedicalChartSummaryComponent implements AfterViewInit {
  state = inject(PatientStateService);
  patientManager = inject(PatientManagementService);
  exportService = inject(ExportService);
  dictation = inject(DictationService);
  today = new Date();
  newVisitReason = signal('');
  showExportMenu = signal(false);

  showPreviewModal = signal(false);
  previewText = signal('');

  @ViewChild('painChart') painChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('bpChart') bpChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('hrChart') hrChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('spo2Chart') spo2ChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('tempChart') tempChartRef!: ElementRef<HTMLCanvasElement>;

  private charts: { [key: string]: any | null } = {
    pain: null,
    bp: null,
    hr: null,
    spo2: null,
    temp: null
  };

  patient = computed(() => {
    const id = this.patientManager.selectedPatientId();
    if (!id) return null;
    return this.patientManager.patients().find(p => p.id === id) ?? null;
  });

  vitals = this.state.vitals;

  bpData = computed(() => {
    const bpString = this.state.vitals().bp;
    if (!bpString || !bpString.includes('/')) return { systolic: 0, diastolic: 0, valid: false, systolicWidth: 0, diastolicWidth: 0 };

    const [systolic, diastolic] = bpString.split('/').map(s => parseInt(s.trim(), 10));
    const valid = !isNaN(systolic) && !isNaN(diastolic);

    // Max value on graph for scaling
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
    const plan = this.state.activeCarePlan();
    if (!plan) return null;
    try {
      return marked.parse(plan, { gfm: true, breaks: true }) as string;
    } catch (e) {
      console.error('Markdown parse error for care plan', e);
      return `<p>Error parsing care plan.</p>`;
    }
  });

  constructor() {
    effect(() => {
      // Re-render chart when patient, vitals, or issues change
      const p = this.patient();
      this.state.vitals();
      this.state.issues();
      if (p) {
        setTimeout(() => this.renderChart(), 0);
      }
    });
  }

  ngAfterViewInit() {
    this.renderChart();
  }

  private async renderChart() {
    const p = this.patient();
    if (!p) return;

    // Dynamically import Chart.js only when needed to optimize bundle size
    const { Chart, registerables } = await import('chart.js');
    Chart.register(...registerables);

    Object.values(this.charts).forEach(chart => {
      if (chart) chart.destroy();
    });

    const dates: string[] = [];
    const painLevels: number[] = [];
    const systolicLevels: (number | null)[] = [];
    const diastolicLevels: (number | null)[] = [];
    const hrLevels: (number | null)[] = [];
    const spo2Levels: (number | null)[] = [];
    const tempLevels: (number | null)[] = [];

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
            if (issue.painLevel > maxPain) {
              maxPain = issue.painLevel;
            }
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
        } else {
          systolicLevels.push(null);
          diastolicLevels.push(null);
          hrLevels.push(null);
          spo2Levels.push(null);
          tempLevels.push(null);
        }
      }
    });

    let currentMaxPain = 0;
    const currentIssues = this.state.issues();
    Object.values(currentIssues).flat().forEach(issue => {
      if (issue.painLevel > currentMaxPain) {
        currentMaxPain = issue.painLevel;
      }
    });

    dates.push('Current');
    painLevels.push(currentMaxPain);

    const [currSys, currDia] = parseBp(this.state.vitals().bp);
    systolicLevels.push(currSys);
    diastolicLevels.push(currDia);
    hrLevels.push(parseNum(this.state.vitals().hr));
    spo2Levels.push(parseNum(this.state.vitals().spO2));
    tempLevels.push(parseNum(this.state.vitals().temp));

    const createChart = (ref: ElementRef<HTMLCanvasElement>, label: string, data: (number | null)[], color: string, dataset2?: any, yOpts?: any) => {
      if (!ref || !ref.nativeElement) return null;

      // Destroy existing chart if present to prevent "Canvas is already in use" error
      const existingChart = Chart.getChart(ref.nativeElement);
      if (existingChart) {
        existingChart.destroy();
      }

      const ctx = ref.nativeElement.getContext('2d');
      if (!ctx) return null;

      const gradient = ctx.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, color + '40');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');

      const datasets: any[] = [{
        label,
        data,
        borderColor: color,
        backgroundColor: gradient,
        borderWidth: 3,
        pointBackgroundColor: '#fff',
        pointBorderColor: color,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4,
        spanGaps: true
      }];

      if (dataset2) {
        let grad2: string | CanvasGradient = 'transparent';
        if (dataset2.borderColor) {
          grad2 = ctx.createLinearGradient(0, 0, 0, 300);
          grad2.addColorStop(0, dataset2.borderColor + '40');
          grad2.addColorStop(1, 'rgba(255,255,255,0)');
        }
        datasets.push({
          ...dataset2,
          backgroundColor: grad2,
          borderWidth: 3,
          pointBackgroundColor: '#fff',
          pointBorderColor: dataset2.borderColor || color,
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4,
          spanGaps: true
        });
      }

      return new Chart(ctx, {
        type: 'line',
        data: { labels: dates, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: false,
              grid: {
                display: false
              },
              ticks: {
                font: {
                  family: 'Inter',
                  size: 9,
                  weight: 'bold'
                },
                color: '#9CA3AF'
              },
              border: {
                display: false
              },
              ...yOpts
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                font: {
                  family: 'Inter',
                  size: 9,
                  weight: 'bold'
                },
                color: '#9CA3AF',
                autoSkip: true,
                maxRotation: 0
              },
              border: {
                display: false
              }
            }
          },
          plugins: {
            legend: {
              display: !!dataset2,
              labels: {
                font: {
                  family: 'Inter',
                  size: 9,
                  weight: 'bold'
                },
                usePointStyle: true,
                boxWidth: 6,
                padding: 20
              }
            },
            tooltip: {
              backgroundColor: '#1C1C1C',
              titleFont: { family: 'Inter', size: 10, weight: 'bold' },
              bodyFont: { family: 'Inter', size: 12 },
              padding: 12,
              cornerRadius: 4,
              displayColors: false,
              callbacks: {
                label: (context) => `${context.dataset.label}: ${context.parsed.y}`
              }
            }
          }
        }
      });
    };

    setTimeout(() => {
      this.charts['pain'] = createChart(this.painChartRef, 'PAIN LEVEL', painLevels, '#689F38', undefined, { max: 10, beginAtZero: true, ticks: { stepSize: 2 } });
      this.charts['bp'] = createChart(this.bpChartRef, 'SYSTOLIC', systolicLevels, '#D0021B', {
        label: 'DIASTOLIC',
        data: diastolicLevels,
        borderColor: '#64748B'
      });
      this.charts['hr'] = createChart(this.hrChartRef, 'HEART RATE', hrLevels, '#94A3B8');
      this.charts['spo2'] = createChart(this.spo2ChartRef, 'OXYGEN SATURATION', spo2Levels, '#94A3B8');
      this.charts['temp'] = createChart(this.tempChartRef, 'CORE TEMPERATURE', tempLevels, '#94A3B8');
    }, 0);
  }

  finalizeChart() {
    const patientId = this.patientManager.selectedPatientId();
    if (!patientId) return;

    const chartState: PatientState = this.state.getCurrentState();

    const historyEntry: HistoryEntry = {
      type: 'ChartArchived',
      date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
      summary: 'Medical chart finalized and archived for this visit.',
      state: chartState,
    };

    this.patientManager.addHistoryEntry(patientId, historyEntry);
  }

  removeDraftItem(item: string) {
    this.state.removeDraftCarePlanItem(item);
  }

  finalizeDraftPlan() {
    const draftItems = this.state.draftCarePlanItems();
    if (draftItems.length === 0) return;

    const currentPlan = this.state.activeCarePlan() || '';

    const newContent = draftItems.map(item => `- ${item}`).join('\n');

    const updatedPlan = currentPlan
      ? `${currentPlan}\n\n### Added ${new Date().toLocaleDateString()}\n${newContent}`
      : `### Care Plan\n${newContent}`;

    this.state.updateActiveCarePlan(updatedPlan);
    this.state.clearDraftCarePlanItems();
  }
  updateVital(key: keyof PatientState['vitals'], event: any) {
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
    const visitState: PatientState = {
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

  exportFhirBundle() {
    const patient = this.patient();
    if (!patient) return;
    this.exportService.downloadAsFhirBundle(patient);
    this.showExportMenu.set(false);
  }

  openFinalizePreview() {
    let plan = this.state.activeCarePlan() || '';
    const draftItems = this.state.draftCarePlanItems();
    if (draftItems.length > 0) {
      const newContent = draftItems.map(item => `- ${item}`).join('\n');
      plan = plan ? `${plan}\n\n### Added ${new Date().toLocaleDateString()}\n${newContent}` : `### Care Plan\n${newContent}`;
    }
    this.previewText.set(plan || 'No Active Care Plan recorded for this visit.');
    this.showPreviewModal.set(true);
  }

  closePreview() {
    this.showPreviewModal.set(false);
  }

  updatePreviewText(event: Event) {
    this.previewText.set((event.target as HTMLTextAreaElement).value);
  }

  printReport() {
    window.print();
  }

  confirmFinalize() {
    this.state.updateActiveCarePlan(this.previewText());
    if (this.state.draftCarePlanItems().length > 0) {
      this.state.clearDraftCarePlanItems();
    }
    this.finalizeChart();
    this.closePreview();
  }
}