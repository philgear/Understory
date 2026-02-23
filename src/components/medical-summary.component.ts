import { Component, ChangeDetectionStrategy, inject, computed, ViewChild, ElementRef, AfterViewInit, effect, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { PatientStateService, PatientState } from '../services/patient-state.service';
import { PatientManagementService, HistoryEntry, Patient } from '../services/patient-management.service';
import { DictationService } from '../services/dictation.service';
import { marked } from 'marked';

@Component({
  selector: 'app-medical-summary',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (patient(); as p) {
      <div class="p-8 font-sans text-gray-800 h-full flex flex-col bg-white">

            <!-- Chart Header -->
            <div class="flex justify-between items-start pb-6 border-b border-gray-100">
              <div>
                <h1 class="text-3xl font-light text-[#1C1C1C] tracking-tight">{{ p.name }}</h1>
                <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mt-2">{{ today | date:'fullDate' }}</p>
              </div>
              <button (click)="finalizeChart()" 
                      class="px-5 py-2.5 bg-[#1C1C1C] text-white text-[10px] font-bold uppercase tracking-[0.15em] rounded hover:bg-[#689F38] transition-all shadow-sm active:scale-95">
                Finalize & Archive
              </button>
            </div>

            <div class="mt-6 space-y-8">
                <!-- Current Visit / Chief Complaint -->
                <div class="mb-8 font-sans">
                  <div class="flex justify-between items-center mb-3">
                    <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                        Current Visit / Chief Complaint
                    </label>
                    <button (click)="dictateVisitNote()" class="text-gray-400 hover:text-[#689F38] transition-colors p-1 rounded-md hover:bg-gray-50" title="Dictate">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14q-1.25 0-2.125-.875T9 11V5q0-1.25.875-2.125T12 2q1.25 0 2.125.875T15 5v6q0 1.25-.875 2.125T12 14m-1 7v-3.075q-2.6-.35-4.3-2.325T5 11h2q0 2.075 1.463 3.537T12 16q2.075 0 3.538-1.463T17 11h2q0 2.225-1.7 4.2T13 17.925V21z"/></svg>
                    </button>
                  </div>
                  <div class="relative group">
                    <textarea 
                      #visitInput
                      rows="3"
                      [value]="newVisitReason()"
                      (input)="newVisitReason.set(visitInput.value)"
                      placeholder="Enter reason for today's visit or primary health goal..."
                      class="w-full bg-[#F8F9FA] border border-gray-200 rounded-lg p-3 text-sm text-[#1C1C1C] focus:bg-white focus:border-[#689F38] focus:ring-1 focus:ring-[#1C1C1C] transition-all placeholder-gray-400 resize-none shadow-sm"
                    ></textarea>
                  </div>
                  <div class="flex items-center justify-end mt-3">
                    <button (click)="saveNewVisit()" [disabled]="!newVisitReason().trim()" class="px-4 py-2 text-xs font-bold text-white bg-[#1C1C1C] hover:bg-[#689F38] disabled:bg-gray-300 rounded-lg transition-colors shadow-sm">Save Visit Note</button>
                  </div>
                </div>

                <!-- Vitals Grid -->
                <!-- Vitals & Biometrics -->
                <section>
                    <h2 class="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-6">Biometric Telemetry</h2>
                    <div class="grid grid-cols-2 gap-12 mb-6">
                        <!-- BP Chart -->
                        @if (bpData().valid) {
                          <div class="space-y-3">
                              <div class="text-sm">
                                  <div class="flex justify-between items-baseline mb-1">
                                      <span class="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Systolic</span>
                                      <span class="text-sm font-medium tracking-tight text-[#1C1C1C]">{{ bpData().systolic }} <span class="text-[10px] text-gray-400">mmHg</span></span>
                                  </div>
                                  <div class="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                      <div class="h-full bg-[#689F38] transition-all duration-700 ease-out" [style.width.%]="bpData().systolicWidth"></div>
                                  </div>
                              </div>
                              <div class="text-sm">
                                  <div class="flex justify-between items-baseline mb-1">
                                      <span class="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Diastolic</span>
                                      <span class="text-sm font-medium tracking-tight text-[#1C1C1C]">{{ bpData().diastolic }} <span class="text-[10px] text-gray-400">mmHg</span></span>
                                  </div>
                                  <div class="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                      <div class="h-full bg-[#689F38] transition-all duration-700 ease-out" [style.width.%]="bpData().diastolicWidth"></div>
                                  </div>
                              </div>
                          </div>
                        }
                    </div>
                </section>
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 border-b border-gray-100 pb-8">
                  <div class="flex flex-col gap-2 p-3 bg-white border border-gray-100 hover:border-gray-200 transition-colors">
                    <label class="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em]">BP</label>
                    <div class="flex items-baseline gap-1">
                        <input type="text" placeholder="120/80" [value]="state.vitals().bp" (input)="updateVital('bp', $event)"
                              class="flex-1 min-w-0 text-sm font-bold text-[#1C1C1C] placeholder-gray-200 bg-transparent border-none p-0 focus:ring-0">
                    </div>
                  </div>
                  <div class="flex flex-col gap-2 p-3 bg-white border border-gray-100 hover:border-gray-200 transition-colors">
                    <label class="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em]">HR</label>
                    <div class="flex items-baseline gap-1">
                        <input type="text" placeholder="--" [value]="state.vitals().hr" (input)="updateVital('hr', $event)"
                              class="flex-1 min-w-0 text-sm font-bold text-[#1C1C1C] placeholder-gray-200 bg-transparent border-none p-0 focus:ring-0">
                        <span class="text-[9px] text-gray-300 font-bold tracking-tighter shrink-0 uppercase">BPM</span>
                    </div>
                  </div>
                  <div class="flex flex-col gap-2 p-3 bg-white border border-gray-100 hover:border-gray-200 transition-colors">
                    <label class="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em]">SpO2</label>
                    <div class="flex items-baseline gap-1">
                        <input type="text" placeholder="--" [value]="state.vitals().spO2" (input)="updateVital('spO2', $event)"
                              class="flex-1 min-w-0 text-sm font-bold text-[#1C1C1C] placeholder-gray-200 bg-transparent border-none p-0 focus:ring-0">
                        <span class="text-[9px] text-gray-300 font-bold shrink-0">%</span>
                    </div>
                  </div>
                  <div class="flex flex-col gap-2 p-3 bg-white border border-gray-100 hover:border-gray-200 transition-colors">
                    <label class="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em]">Temp</label>
                    <div class="flex items-baseline gap-1">
                        <input type="text" placeholder="--" [value]="state.vitals().temp" (input)="updateVital('temp', $event)"
                              class="flex-1 min-w-0 text-sm font-bold text-[#1C1C1C] placeholder-gray-200 bg-transparent border-none p-0 focus:ring-0">
                        <span class="text-[9px] text-gray-300 font-bold shrink-0">°F</span>
                    </div>
                  </div>
                  <div class="flex flex-col gap-2 p-3 bg-white border border-gray-100 hover:border-gray-200 transition-colors">
                    <label class="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em]">Weight</label>
                    <div class="flex items-baseline gap-1">
                        <input type="text" placeholder="--" [value]="state.vitals().weight" (input)="updateVital('weight', $event)"
                              class="flex-1 min-w-0 text-sm font-bold text-[#1C1C1C] placeholder-gray-200 bg-transparent border-none p-0 focus:ring-0">
                        <span class="text-[9px] text-gray-300 font-bold shrink-0 uppercase tracking-tighter">LBS</span>
                    </div>
                  </div>
                  <div class="flex flex-col gap-2 p-3 bg-white border border-gray-100 hover:border-gray-200 transition-colors">
                    <label class="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em]">Height</label>
                    <div class="flex items-baseline gap-1">
                        <input type="text" placeholder="--/--" [value]="state.vitals().height" (input)="updateVital('height', $event)"
                              class="flex-1 min-w-0 text-sm font-bold text-[#1C1C1C] placeholder-gray-200 bg-transparent border-none p-0 focus:ring-0">
                        <span class="text-[9px] text-gray-300 font-bold shrink-0 uppercase tracking-tighter">FT</span>
                    </div>
                  </div>
                </div>

                <!-- Patient Trends Chart -->
                <section>
                    <h2 class="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-6">Retrospective Data Visualization</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div class="w-full h-64 bg-white border border-gray-100 rounded p-6 flex flex-col">
                            <h3 class="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Pain Path / 0–10</h3>
                            <div class="relative flex-1 min-h-0"><canvas #painChart></canvas></div>
                        </div>
                        <div class="w-full h-64 bg-white border border-gray-100 rounded p-6 flex flex-col">
                            <h3 class="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Blood Pressure / Composite</h3>
                            <div class="relative flex-1 min-h-0"><canvas #bpChart></canvas></div>
                        </div>
                        <div class="w-full h-64 bg-white border border-gray-100 rounded p-6 flex flex-col">
                            <h3 class="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Pulse Rate / BPM</h3>
                            <div class="relative flex-1 min-h-0"><canvas #hrChart></canvas></div>
                        </div>
                        <div class="w-full h-64 bg-white border border-gray-100 rounded p-6 flex flex-col">
                            <h3 class="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Oxygen Saturation / %</h3>
                            <div class="relative flex-1 min-h-0"><canvas #spo2Chart></canvas></div>
                        </div>
                        <div class="w-full h-64 bg-white border border-gray-100 rounded p-6 flex flex-col md:col-span-2">
                            <h3 class="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Core Temperature / Trend</h3>
                            <div class="relative flex-1 min-h-0"><canvas #tempChart></canvas></div>
                        </div>
                    </div>
                </section>

                <!-- Pre-existing Conditions -->
                @if(p.preexistingConditions.length > 0) {
                  <section>
                      <h2 class="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-4">Historical Conditions</h2>
                      <div class="flex flex-wrap gap-2">
                          @for(condition of p.preexistingConditions; track condition) {
                            <span class="text-[10px] font-bold uppercase tracking-wider bg-gray-50 border border-gray-100 text-gray-500 px-3 py-1.5 rounded grayscale hover:grayscale-0 transition-all cursor-default">
                              {{ condition }}
                            </span>
                          }
                      </div>
                  </section>
                }

                <!-- Draft Care Plan -->
                @if (state.draftCarePlanItems().length > 0) {
                  <section class="bg-gray-50 p-6 border border-gray-200 rounded">
                    <h2 class="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-4 flex justify-between items-center">
                      <span class="flex items-center gap-2 text-[#689F38]">
                        <div class="w-1.5 h-1.5 bg-[#689F38] rounded-full animate-pulse"></div>
                        Care Recommendation Draft
                      </span>
                    </h2>
                    <ul class="space-y-3 text-[13px] text-[#1C1C1C]">
                      @for (item of state.draftCarePlanItems(); track $index) {
                        <li class="pl-0">
                          <div class="flex justify-between items-start gap-3 group">
                             <div class="w-1 h-4 bg-gray-200 mt-0.5 shrink-0 group-hover:bg-[#689F38] transition-colors"></div>
                            <span class="flex-1 font-medium">{{ item }}</span>
                            <button (click)="removeDraftItem(item)" class="text-gray-300 hover:text-red-500 shrink-0 p-1 rounded transition-colors" title="Remove">
                              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                          </div>
                        </li>
                      }
                    </ul>
                    <div class="mt-6 pt-6 border-t border-gray-200 flex justify-end">
                       <button (click)="finalizeDraftPlan()" class="text-[10px] font-bold text-[#1C1C1C] hover:text-[#689F38] uppercase tracking-[0.15em] flex items-center gap-2 bg-white px-4 py-2 border border-gray-200 shadow-sm hover:border-[#689F38] transition-all active:scale-95">
                          <span>Append to Active Strategics</span>
                          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12l5 5l10-10"/></svg>
                       </button>
                    </div>
                  </section>
                }

                <!-- Active Care Plan -->
                @if (activeCarePlanHTML(); as html) {
                  <section>
                    <h2 class="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-4">Active Strategy Overview</h2>
                    <div class="p-8 bg-white border border-gray-100 rounded prose prose-sm max-w-none prose-p:text-[#1C1C1C] prose-p:font-light prose-headings:text-[11px] prose-headings:font-bold prose-headings:uppercase prose-headings:tracking-[0.1em] prose-headings:text-gray-400" [innerHTML]="html"></div>
                  </section>
                }
      </div>
    </div>
    } @else {
        <div class="p-8 text-center text-gray-400 h-full flex items-center justify-center">
            <p class="text-sm font-medium uppercase tracking-widest">No patient selected.</p>
        </div>
    }
  `
})
export class MedicalChartSummaryComponent implements AfterViewInit {
  state = inject(PatientStateService);
  patientManager = inject(PatientManagementService);
  dictation = inject(DictationService);
  today = new Date();
  newVisitReason = signal('');

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

      const datasets = [{
        label,
        data,
        borderColor: color,
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        pointBackgroundColor: '#1C1C1C',
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: false,
        tension: 0.1,
        spanGaps: true
      }];

      if (dataset2) {
        datasets.push({
          ...dataset2,
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
        borderColor: '#64748B',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        pointBackgroundColor: '#1C1C1C',
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
        pointRadius: 3,
        fill: false,
        tension: 0.1
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
}