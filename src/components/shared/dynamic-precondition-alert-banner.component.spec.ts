import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext, signal } from '@angular/core';
import { DynamicPreconditionAlertBannerComponent } from './dynamic-precondition-alert-banner.component';
import { ClinicalPreconditionSentinelService } from '../../services/clinical/clinical-precondition-sentinel.service';
import { PatientStateService } from '../../services/patient-state.service';

describe('DynamicPreconditionAlertBannerComponent', () => {
  let component: DynamicPreconditionAlertBannerComponent;
  let sentinel: ClinicalPreconditionSentinelService;
  let mockPatientState: any;

  beforeEach(() => {
    mockPatientState = {
      vitals: signal<any>({ hr: '75', spO2: '98', bp: '120/80' })
    };

    const injector = Injector.create({
      providers: [
        ClinicalPreconditionSentinelService,
        { provide: PatientStateService, useValue: mockPatientState },
        DynamicPreconditionAlertBannerComponent
      ]
    });

    sentinel = injector.get(ClinicalPreconditionSentinelService);
    component = runInInjectionContext(injector, () => injector.get(DynamicPreconditionAlertBannerComponent));
  });

  it('1. should initialize with no active breaches', () => {
    expect(component).toBeTruthy();
    expect(component.hasActiveBreaches()).toBe(false);
    expect(component.staleOrCriticalContracts().length).toBe(0);
  });

  it('2. should reactively detect stale contracts when patient vitals breach safe boundary', () => {
    // Register recommendation with minSpO2: 92
    sentinel.registerRecommendation({
      id: 'rec-test-01',
      title: 'Pediatric Tracheostomy Weaning Protocol',
      recommendationText: 'Wean O2 by 0.5 L/min.',
      generatedAtIso: new Date().toISOString(),
      snapshotVitals: { spO2: 98 },
      boundary: { minSpO2: 92 }
    });

    expect(component.hasActiveBreaches()).toBe(false);

    // Patient desaturates to 88%
    mockPatientState.vitals.set({ hr: '85', spO2: '88', bp: '120/80' });
    sentinel.reassessAllContracts();

    expect(component.hasActiveBreaches()).toBe(true);
    expect(component.staleOrCriticalContracts().length).toBe(1);
    const contract = component.staleOrCriticalContracts()[0];
    expect(contract.title).toBe('Pediatric Tracheostomy Weaning Protocol');
    expect(contract.status).toBe('STALE_REQUIRING_REASSESSMENT');
    expect(contract.breachedDelta?.parameter).toBe('SpO2');
    expect(contract.breachedDelta?.currentValue).toBe(88);
  });

  it('3. should handle re-evaluation requests and retirement dismissals', () => {
    sentinel.registerRecommendation({
      id: 'rec-test-02',
      title: 'Active Hydralazine Therapy',
      recommendationText: 'Vasodilator protocol.',
      generatedAtIso: new Date().toISOString(),
      snapshotVitals: { systolicBp: 130 },
      boundary: { minSystolicBp: 100 }
    });

    // Induce hypotension
    mockPatientState.vitals.set({ hr: '75', spO2: '98', bp: '85/55' });
    sentinel.reassessAllContracts();

    expect(component.hasActiveBreaches()).toBe(true);
    const staleContract = component.staleOrCriticalContracts()[0];
    expect(staleContract.status).toBe('CONTRAINDICATED_CRITICAL');

    // Test re-evaluate event emission
    let emittedContract: any = null;
    component.reevaluateRequested.subscribe(c => {
      emittedContract = c;
    });
    component.onReevaluate(staleContract);
    expect(emittedContract).toEqual(staleContract);

    // Test dismissal and contract retirement
    let dismissedId: string | null = null;
    component.contractDismissed.subscribe(id => {
      dismissedId = id;
    });
    component.onDismiss(staleContract.id);
    expect(dismissedId).toBe('rec-test-02');
    expect(component.hasActiveBreaches()).toBe(false);
    expect(component.staleOrCriticalContracts().length).toBe(0);
  });
});
