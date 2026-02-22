import { Component, ChangeDetectionStrategy, inject, computed, ViewChild, ElementRef, AfterViewInit, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { PatientStateService, PatientState } from '../services/patient-state.service';
import { PatientManagementService, HistoryEntry, Patient } from '../services/patient-management.service';
import { marked } from 'marked';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-medical-summary',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (patient(); as p) {
      <div class="p-6 font-serif text-gray-800 h-full flex flex-col">

            <!-- Chart Header -->
            <div class="flex justify-between items-start pb-4 border-b border-gray-100">
              <div>
                <h1 class="text-2xl font-normal text-[#1C1C1C]">{{ p.name }}</h1>
                <p class="text-sm text-gray-500 mt-1">{{ today | date:'fullDate' }}</p>
              </div>
              <button (click)="finalizeChart()" 
                      class="px-4 py-2 bg-[#1C1C1C] text-white text-xs font-sans font-bold uppercase tracking-widest rounded-lg hover:bg-[#689F38] transition-colors shadow-sm">
                Finalize & Archive
              </button>
            </div>

            <div class="mt-6 space-y-8">
                <!-- Chief Complaint -->
                <section>
                    <h2 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 font-sans">Chief Complaint</h2>
                    <p class="text-base text-gray-600 italic leading-relaxed">"{{ state.patientGoals() || 'Not specified.' }}"</p>
                </section>
                
                <!-- Vitals & Biometrics -->
                <section>
                    <h2 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 font-sans">Vitals & Biometrics</h2>
                    <div class="grid grid-cols-2 gap-8">
                        <!-- BP Chart -->
                        @if (bpData().valid) {
                          <div class="space-y-3">
                              <div class="text-sm">
                                  <div class="flex justify-between items-baseline">
                                      <span class="font-bold text-gray-600">Systolic</span>
                                      <span class="font-sans font-medium">{{ bpData().systolic }} mmHg</span>
                                  </div>
                                  <svg width="100%" height="20" class="mt-1 rounded overflow-hidden">
                                      <rect x="0" y="0" width="60%" height="20" fill="#f3f4f6" /> <!-- Normal Range (up to 120) -->
                                      <rect x="0" y="0" [attr.width]="bpData().systolicWidth + '%'" height="20" fill="#689F38" />
                                  </svg>
                              </div>
                              <div class="text-sm">
                                  <div class="flex justify-between items-baseline">
                                      <span class="font-bold text-gray-600">Diastolic</span>
                                      <span class="font-sans font-medium">{{ bpData().diastolic }} mmHg</span>
                                  </div>
                                  <svg width="100%" height="20" class="mt-1 rounded overflow-hidden">
                                      <rect x="0" y="0" width="53.33%" height="20" fill="#f3f4f6" /> <!-- Normal Range (up to 80) -->
                                      <rect x="0" y="0" [attr.width]="bpData().diastolicWidth + '%'" height="20" fill="#689F38" />
                                  </svg>
                              </div>
                          </div>
                        }
                        <!-- Other Vitals Table -->
                        <div class="text-sm">
                            <table class="w-full">
                                <tbody>
                                    <tr class="border-b border-gray-100">
                                        <td class="py-2 font-bold text-gray-600">Heart Rate</td>
                                        <td class="py-2 text-right font-sans font-medium">{{ vitals().hr || 'N/A' }} BPM</td>
                                    </tr>
                                    <tr class="border-b border-gray-100">
                                        <td class="py-2 font-bold text-gray-600">SpO2</td>
                                        <td class="py-2 text-right font-sans font-medium">{{ vitals().spO2 || 'N/A' }} %</td>
                                    </tr>
                                    <tr class="border-b border-gray-100">
                                        <td class="py-2 font-bold text-gray-600">Temperature</td>
                                        <td class="py-2 text-right font-sans font-medium">{{ vitals().temp || 'N/A' }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <!-- Patient Trends Chart -->
                <section>
                    <h2 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 font-sans">Health Trends Dashboard</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="w-full h-48 bg-white border border-gray-100 rounded-lg p-4 flex flex-col">
                            <h3 class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Pain Severity</h3>
                            <div class="relative flex-1 min-h-0"><canvas #painChart></canvas></div>
                        </div>
                        <div class="w-full h-48 bg-white border border-gray-100 rounded-lg p-4 flex flex-col">
                            <h3 class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Blood Pressure</h3>
                            <div class="relative flex-1 min-h-0"><canvas #bpChart></canvas></div>
                        </div>
                        <div class="w-full h-48 bg-white border border-gray-100 rounded-lg p-4 flex flex-col">
                            <h3 class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Heart Rate</h3>
                            <div class="relative flex-1 min-h-0"><canvas #hrChart></canvas></div>
                        </div>
                        <div class="w-full h-48 bg-white border border-gray-100 rounded-lg p-4 flex flex-col">
                            <h3 class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">SpO2</h3>
                            <div class="relative flex-1 min-h-0"><canvas #spo2Chart></canvas></div>
                        </div>
                        <div class="w-full h-48 bg-white border border-gray-100 rounded-lg p-4 flex flex-col md:col-span-2">
                            <h3 class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Temperature</h3>
                            <div class="relative flex-1 min-h-0"><canvas #tempChart></canvas></div>
                        </div>
                    </div>
                </section>

                <!-- Pre-existing Conditions -->
                @if(p.preexistingConditions.length > 0) {
                  <section>
                      <h2 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 font-sans">Pre-existing Conditions</h2>
                      <div class="flex flex-wrap gap-2">
                          @for(condition of p.preexistingConditions; track condition) {
                            <span class="text-xs font-sans font-medium bg-gray-50 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-md">
                              {{ condition }}
                            </span>
                          }
                      </div>
                  </section>
                }

                <!-- Draft Care Plan -->
                @if (state.draftCarePlanItems().length > 0) {
                  <section class="bg-yellow-50/50 p-5 border border-yellow-200 rounded-xl">
                    <h2 class="text-xs font-bold text-yellow-700 uppercase tracking-widest mb-3 font-sans flex justify-between items-center">
                      <span class="flex items-center gap-2">
                        <div class="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></div>
                        Care Plan Draft
                      </span>
                      <span class="text-[10px] font-normal normal-case opacity-70">Review & Finalize</span>
                    </h2>
                    <ul class="list-disc pl-4 space-y-2 text-sm text-gray-800">
                      @for (item of state.draftCarePlanItems(); track $index) {
                        <li class="pl-1">
                          <div class="flex justify-between items-start gap-2">
                            <span>{{ item }}</span>
                            <button (click)="removeDraftItem(item)" class="text-gray-400 hover:text-red-500 shrink-0 p-1 rounded hover:bg-yellow-100" title="Remove">
                              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                          </div>
                        </li>
                      }
                    </ul>
                    <div class="mt-4 pt-4 border-t border-yellow-200/50 flex justify-end">
                       <button (click)="finalizeDraftPlan()" class="text-xs font-bold text-yellow-800 hover:text-yellow-900 uppercase tracking-widest flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-yellow-200 shadow-sm hover:bg-yellow-50 transition-colors">
                          <span>Add to Active Plan</span>
                          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12l5 5l10-10"/></svg>
                       </button>
                    </div>
                  </section>
                }

                <!-- Active Care Plan -->
                @if (activeCarePlanHTML(); as html) {
                  <section>
                    <h2 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 font-sans">Active Care Plan</h2>
                    <div class="p-5 bg-gray-50 border border-gray-200 rounded-xl prose prose-sm max-w-none prose-p:font-serif" [innerHTML]="html"></div>
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
  today = new Date();

  @ViewChild('painChart') painChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('bpChart') bpChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('hrChart') hrChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('spo2Chart') spo2ChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('tempChart') tempChartRef!: ElementRef<HTMLCanvasElement>;

  private charts: { [key: string]: Chart | null } = {
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
      // Re-render chart when patient changes
      const p = this.patient();
      if (p) {
        setTimeout(() => this.renderChart(), 0);
      }
    });
  }

  ngAfterViewInit() {
    this.renderChart();
  }

  private renderChart() {
    const p = this.patient();
    if (!p) return;

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
      const ctx = ref.nativeElement.getContext('2d');
      if (!ctx) return null;

      const datasets = [{
        label,
        data,
        borderColor: color,
        backgroundColor: color.replace(')', ', 0.1)').replace('rgb', 'rgba'),
        borderWidth: 2,
        pointBackgroundColor: '#1C1C1C',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        fill: true,
        tension: 0.3,
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
              ...yOpts
            }
          },
          plugins: {
            legend: { display: !!dataset2 },
            tooltip: {
              callbacks: {
                label: (context) => `${context.dataset.label}: ${context.parsed.y}`
              }
            }
          }
        }
      });
    };

    setTimeout(() => {
      this.charts['pain'] = createChart(this.painChartRef, 'Max Pain', painLevels, '#689F38', undefined, { max: 10, beginAtZero: true, ticks: { stepSize: 2 } });
      this.charts['bp'] = createChart(this.bpChartRef, 'Systolic', systolicLevels, '#EF4444', {
        label: 'Diastolic',
        data: diastolicLevels,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        pointBackgroundColor: '#1C1C1C',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        fill: true,
        tension: 0.3
      });
      this.charts['hr'] = createChart(this.hrChartRef, 'Heart Rate (bpm)', hrLevels, '#F59E0B');
      this.charts['spo2'] = createChart(this.spo2ChartRef, 'SpO2 (%)', spo2Levels, '#8B5CF6');
      this.charts['temp'] = createChart(this.tempChartRef, 'Temperature (°F)', tempLevels, '#10B981');
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
}