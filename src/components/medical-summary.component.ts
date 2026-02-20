import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { PatientStateService, PatientState } from '../services/patient-state.service';
import { PatientManagementService, HistoryEntry, Patient } from '../services/patient-management.service';
import { marked } from 'marked';

@Component({
  selector: 'app-medical-summary',
  standalone: true,
  imports: [CommonModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (patient(); as p) {
      <div class="p-8 font-serif text-gray-800">
        <!-- Chart Header -->
        <div class="flex justify-between items-start pb-4 border-b border-gray-200">
          <div>
            <h1 class="text-2xl font-normal text-[#1C1C1C]">{{ p.name }}</h1>
            <p class="text-sm text-gray-500 mt-1">{{ today | date:'fullDate' }}</p>
          </div>
          <button (click)="finalizeChart()" 
                  class="px-4 py-2 bg-gray-700 text-white text-xs font-sans font-bold uppercase tracking-widest hover:bg-gray-900 transition-colors">
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
                              <svg width="100%" height="20" class="mt-1">
                                  <rect x="0" y="0" width="60%" height="20" fill="#f3f4f6" /> <!-- Normal Range (up to 120) -->
                                  <rect x="0" y="0" [attr.width]="bpData().systolicWidth + '%'" height="20" fill="#769a7e" />
                              </svg>
                          </div>
                          <div class="text-sm">
                              <div class="flex justify-between items-baseline">
                                  <span class="font-bold text-gray-600">Diastolic</span>
                                  <span class="font-sans font-medium">{{ bpData().diastolic }} mmHg</span>
                              </div>
                              <svg width="100%" height="20" class="mt-1">
                                  <rect x="0" y="0" width="53.33%" height="20" fill="#f3f4f6" /> <!-- Normal Range (up to 80) -->
                                  <rect x="0" y="0" [attr.width]="bpData().diastolicWidth + '%'" height="20" fill="#769a7e" />
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

            <!-- Pre-existing Conditions -->
            @if(p.preexistingConditions.length > 0) {
              <section>
                  <h2 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 font-sans">Pre-existing Conditions</h2>
                  <div class="flex flex-wrap gap-2">
                      @for(condition of p.preexistingConditions; track condition) {
                        <span class="text-xs font-sans font-medium bg-gray-100 border border-gray-200 text-gray-600 px-2 py-1 rounded-sm">
                          {{ condition }}
                        </span>
                      }
                  </div>
              </section>
            }

            <!-- Draft Care Plan -->
            @if (state.draftCarePlanItems().length > 0) {
              <section class="bg-yellow-50 p-4 border border-yellow-200 rounded-sm">
                <h2 class="text-xs font-bold text-yellow-700 uppercase tracking-widest mb-3 font-sans flex justify-between items-center">
                  <span>Care Plan Draft</span>
                  <span class="text-[10px] font-normal normal-case opacity-70">Review & Finalize</span>
                </h2>
                <ul class="list-disc pl-4 space-y-2 text-sm text-gray-800">
                  @for (item of state.draftCarePlanItems(); track $index) {
                    <li class="pl-1">
                      <div class="flex justify-between items-start gap-2">
                        <span>{{ item }}</span>
                        <button (click)="removeDraftItem(item)" class="text-gray-400 hover:text-red-500 shrink-0" title="Remove">
                          <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>
                      </div>
                    </li>
                  }
                </ul>
                <div class="mt-4 pt-3 border-t border-yellow-200/50 flex justify-end">
                   <button (click)="finalizeDraftPlan()" class="text-xs font-bold text-yellow-800 hover:text-yellow-900 uppercase tracking-widest flex items-center gap-1">
                      <span>Add to Active Plan</span>
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12l5 5l10-10"/></svg>
                   </button>
                </div>
              </section>
            }

            <!-- Active Care Plan -->
            @if (activeCarePlanHTML(); as html) {
              <section>
                <h2 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 font-sans">Active Care Plan</h2>
                <div class="p-4 bg-gray-50 border border-gray-200 rounded-sm prose prose-sm max-w-none prose-p:font-serif" [innerHTML]="html"></div>
              </section>
            }
        </div>
      </div>
    } @else {
        <div class="p-8 text-center text-gray-400">
            <p class="text-sm">No patient selected.</p>
        </div>
    }
  `
})
export class MedicalChartSummaryComponent {
  state = inject(PatientStateService);
  patientManager = inject(PatientManagementService);
  today = new Date();

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
      // Using a basic renderer to avoid extra classes from rams-typography
      return marked.parse(plan, { gfm: true, breaks: true }) as string;
    } catch (e) {
      console.error('Markdown parse error for care plan', e);
      return `<p>Error parsing care plan.</p>`;
    }
  });

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
    
    // Format the new items as a markdown list
    const newContent = draftItems.map(item => `- ${item}`).join('\n');
    
    // Append to existing plan or start fresh
    const updatedPlan = currentPlan 
      ? `${currentPlan}\n\n### Added ${new Date().toLocaleDateString()}\n${newContent}`
      : `### Care Plan\n${newContent}`;

    this.state.updateActiveCarePlan(updatedPlan);
    this.state.clearDraftCarePlanItems();
  }
}