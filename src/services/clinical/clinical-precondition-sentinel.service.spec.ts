import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import {
  ClinicalPreconditionSentinelService,
  IClinicalRecommendationContract
} from './clinical-precondition-sentinel.service';
import { PatientStateService } from '../patient-state.service';

describe('ClinicalPreconditionSentinelService', () => {
  let service: ClinicalPreconditionSentinelService;
  let mockPatientState: any;

  beforeEach(() => {
    mockPatientState = {
      vitals: signal<any>({ hr: '72', spO2: '98', bp: '120/80' })
    };

    TestBed.configureTestingModule({
      providers: [
        ClinicalPreconditionSentinelService,
        { provide: PatientStateService, useValue: mockPatientState }
      ]
    });

    service = TestBed.inject(ClinicalPreconditionSentinelService);
  });

  it('1. should initialize with zero breached contracts', () => {
    expect(service).toBeTruthy();
    expect(service.registeredContracts().length).toBe(0);
    expect(service.hasActiveBreaches()).toBe(false);
  });

  it('2. should register a valid recommendation and keep it ACTIVE when vitals are normal', () => {
    const contract: Omit<IClinicalRecommendationContract, 'status'> = {
      id: 'rec-o2-wean-01',
      title: 'Gradual Tracheostomy Collar Weaning Protocol',
      recommendationText: 'Wean supplemental oxygen by 0.5 L/min every 4 hours while observing nocturnal stability.',
      generatedAtIso: new Date().toISOString(),
      snapshotVitals: { hr: 72, spO2: 98, systolicBp: 120 },
      boundary: {
        minSpO2: 92,
        maxHeartRate: 115,
        minSystolicBp: 90
      }
    };

    const registered = service.registerRecommendation(contract);
    expect(registered.status).toBe('ACTIVE_VALID');
    expect(service.hasActiveBreaches()).toBe(false);
  });

  it('3. should invalidate recommendation when SpO2 drops below safe boundary', () => {
    const contract: Omit<IClinicalRecommendationContract, 'status'> = {
      id: 'rec-o2-wean-01',
      title: 'Gradual Tracheostomy Collar Weaning Protocol',
      recommendationText: 'Wean supplemental oxygen.',
      generatedAtIso: new Date().toISOString(),
      snapshotVitals: { hr: 72, spO2: 98 },
      boundary: { minSpO2: 92 }
    };
    service.registerRecommendation(contract);

    // Patient desaturates to 89%
    const evaluated = service.evaluateContract(
      service.registeredContracts()[0],
      { spO2: 89, hr: 80 }
    );

    expect(evaluated.status).toBe('STALE_REQUIRING_REASSESSMENT');
    expect(evaluated.breachedDelta).toBeTruthy();
    expect(evaluated.breachedDelta?.parameter).toBe('SpO2');
    expect(evaluated.breachedDelta?.currentValue).toBe(89);
    expect(evaluated.breachedDelta?.clinicalDeltaDirective).toContain('breaching safe boundary');
  });

  it('4. should trigger CONTRAINDICATED_CRITICAL on severe hypoxia (<88%) or hypotensive crisis', () => {
    const contract: Omit<IClinicalRecommendationContract, 'status'> = {
      id: 'rec-vasodilator-01',
      title: 'Hydralazine for Chronic Renovascular Hypertension',
      recommendationText: 'Maintain oral vasodilator titration.',
      generatedAtIso: new Date().toISOString(),
      snapshotVitals: { systolicBp: 135 },
      boundary: { minSystolicBp: 100 }
    };
    service.registerRecommendation(contract);

    // Blood pressure plummets to 82 mmHg
    const evaluated = service.evaluateContract(
      service.registeredContracts()[0],
      { systolicBp: 82 }
    );

    expect(evaluated.status).toBe('CONTRAINDICATED_CRITICAL');
    expect(evaluated.breachedDelta?.urgency).toBe('STAT');
    expect(evaluated.breachedDelta?.clinicalDeltaDirective).toContain('Hypotensive crisis');
  });

  it('5. should detect newly prescribed contraindicated medication', () => {
    const contract: Omit<IClinicalRecommendationContract, 'status'> = {
      id: 'rec-sildenafil-01',
      title: 'Sildenafil for Pediatric Pulmonary Hypertension',
      recommendationText: 'Phosphodiesterase-5 inhibitor therapy.',
      generatedAtIso: new Date().toISOString(),
      snapshotVitals: {},
      boundary: {
        prohibitedMeds: ['Nitroglycerin', 'Isosorbide', 'Nitrate']
      }
    };
    service.registerRecommendation(contract);

    // Patient is newly administered sublingual Nitroglycerin
    const evaluated = service.evaluateContract(
      service.registeredContracts()[0],
      {},
      ['Nitroglycerin 0.4mg SL']
    );

    expect(evaluated.status).toBe('CONTRAINDICATED_CRITICAL');
    expect(evaluated.breachedDelta?.parameter).toBe('Medication Contraindication');
    expect(evaluated.breachedDelta?.currentValue).toBe('Nitroglycerin');
  });

  it('6. should acknowledge and retire stale recommendation contracts', () => {
    const contract: Omit<IClinicalRecommendationContract, 'status'> = {
      id: 'rec-to-retire-01',
      title: 'Temporary Ambulation Directive',
      recommendationText: 'Physical therapy ambulation.',
      generatedAtIso: new Date().toISOString(),
      snapshotVitals: {},
      boundary: { maxHeartRate: 120 }
    };
    service.registerRecommendation(contract);
    expect(service.registeredContracts().length).toBe(1);

    service.acknowledgeAndRetire('rec-to-retire-01');
    expect(service.registeredContracts().length).toBe(0);
  });
});
