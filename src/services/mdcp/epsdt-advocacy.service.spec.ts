import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { Injector, runInInjectionContext, signal } from '@angular/core';
import { EpsdtAdvocacyService, EPSDT_DISPUTE_DEFINITIONS, IEpsdtAppealInput } from './epsdt-advocacy.service';
import { StateRegionalCrosswalkService } from './state-regional-crosswalk.service';
import { PatientManagementService } from '../patient-management.service';

describe('EpsdtAdvocacyService', () => {
  let service: EpsdtAdvocacyService;
  let mockPatientMgmt: any;
  let injector: Injector;

  beforeEach(() => {
    mockPatientMgmt = {
      selectedPatient: signal<any>({
        id: 'pat-pediatric-waiver-01',
        name: 'Jordan Rivera',
        dob: '2019-04-12',
        age: 7
      })
    };

    injector = Injector.create({
      providers: [
        StateRegionalCrosswalkService,
        { provide: PatientManagementService, useValue: mockPatientMgmt }
      ]
    });

    runInInjectionContext(injector, () => {
      service = new EpsdtAdvocacyService();
    });
  });

  it('1. should initialize with valid default signals', () => {
    expect(service).toBeTruthy();
    expect(service.activeDisputeCategory()).toBe('waiver-waitlist-bypass');
    expect(service.orderedPdnHoursPerWeek()).toBe(40);
    expect(service.isStatExpedited()).toBe(true);
    expect(service.orderingPhysicianNpi()).toBeTruthy();
    expect(service.activePatientAcuity().name).toBe('Jordan Rivera');
    expect(service.activePatientAcuity().deinstitutionalizationScore).toBe(75);
  });

  it('2. should provide complete definitions for all 4 dispute categories', () => {
    const keys = Object.keys(EPSDT_DISPUTE_DEFINITIONS);
    expect(keys).toContain('waiver-waitlist-bypass');
    expect(keys).toContain('nursing-hours-reduction');
    expect(keys).toContain('service-denial');
    expect(keys).toContain('dme-formula-denial');

    for (const key of keys as (keyof typeof EPSDT_DISPUTE_DEFINITIONS)[]) {
      const def = EPSDT_DISPUTE_DEFINITIONS[key];
      expect(def.label).toBeTruthy();
      expect(def.statutoryFocus).toBeTruthy();
      expect(def.description).toBeTruthy();
    }
  });

  it('3. should generate an Oregon (OR) EPSDT appeal with Oregon Health Authority agency mapping', async () => {
    const input: IEpsdtAppealInput = {
      stateCode: 'OR',
      disputeCategory: 'waiver-waitlist-bypass',
      orderedPdnHoursPerWeek: 40,
      physicianName: 'Dr. Jane Smith, MD',
      physicianNpi: '1234567890',
      physicianSpecialty: 'Pediatric Pulmonology',
      clinicOrHospitalName: 'Doernbecher Children’s Hospital',
      isStatExpedited: true,
      denialNoticeDate: '2026-09-01'
    };

    const pkg = await service.generateAppealPackage(input);
    expect(pkg.stateCode).toBe('OR');
    expect(pkg.stateName).toBe('Oregon');
    expect(pkg.administeringAgency).toContain('Oregon Department of Human Services');
    expect(pkg.physicianLetterOfMedicalNecessity).toContain('Oregon Department of Human Services');
    expect(pkg.physicianLetterOfMedicalNecessity).toContain('42 U.S.C. § 1396d(r)(5)');
    expect(pkg.physicianLetterOfMedicalNecessity).toContain('40 hours per week');
    expect(pkg.fairHearingPetition).toContain('Aid Paid Pending');
    expect(pkg.cryptographicIntegrityDigest).toBeTruthy();
  });

  it('4. should generate a Washington (WA) appeal with Health Care Authority mapping', async () => {
    const input: IEpsdtAppealInput = {
      stateCode: 'WA',
      disputeCategory: 'nursing-hours-reduction',
      orderedPdnHoursPerWeek: 56,
      priorAuthorizedHoursPerWeek: 56,
      physicianName: 'Dr. Robert Chang, MD',
      physicianNpi: '9876543210',
      physicianSpecialty: 'Complex Care Pediatrics',
      clinicOrHospitalName: 'Seattle Children’s Hospital',
      isStatExpedited: true,
      denialNoticeDate: '2026-09-05'
    };

    const pkg = await service.generateAppealPackage(input);
    expect(pkg.stateCode).toBe('WA');
    expect(pkg.stateName).toBe('Washington');
    expect(pkg.administeringAgency).toContain('DSHS');
    expect(pkg.fairHearingPetition).toContain('56 hours/week');
    expect(pkg.aidPaidPendingDeadlineIso).toBe('2026-09-15'); // 10 days after 2026-09-05
  });

  it('5. should generate a Texas (TX) appeal targeting HHSC with waitlist preemption citations', async () => {
    const input: IEpsdtAppealInput = {
      stateCode: 'TX',
      disputeCategory: 'waiver-waitlist-bypass',
      orderedPdnHoursPerWeek: 40,
      physicianName: 'Dr. Sarah Connor, MD',
      physicianNpi: '1122334455',
      physicianSpecialty: 'Pediatric Critical Care',
      clinicOrHospitalName: 'Texas Children’s Hospital',
      isStatExpedited: false
    };

    const pkg = await service.generateAppealPackage(input);
    expect(pkg.stateCode).toBe('TX');
    expect(pkg.administeringAgency).toContain('Texas Health and Human Services Commission');
    expect(pkg.federalCaseLawBrief).toContain('O.B. v. Norwood');
    expect(pkg.federalCaseLawBrief).toContain('Moore ex rel. Moore v. Reese');
    expect(pkg.statutoryCitations.length).toBeGreaterThanOrEqual(7);
  });

  it('6. should compute a valid SHA-256 integrity digest for legal non-repudiation', async () => {
    const text = 'TEST_EPSDT_AFFIDAVIT_CONTENT';
    const hash1 = await service.computeSha256Digest(text);
    const hash2 = await service.computeSha256Digest(text);
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBeGreaterThan(10);
  });

  it('7. should include dictated clinical airway events and aeromedical corridor notes in physician letter', async () => {
    const input: IEpsdtAppealInput = {
      stateCode: 'GU',
      disputeCategory: 'service-denial',
      orderedPdnHoursPerWeek: 56,
      physicianName: 'Dr. Maria Santos, MD',
      physicianNpi: '1987654321',
      physicianSpecialty: 'Pediatric Pulmonology',
      clinicOrHospitalName: 'Guam Memorial Hospital',
      isStatExpedited: true,
      dictatedClinicalEvents: 'Nocturnal desaturation to 74% SpO2 with acute mucus plug requiring deep sterile catheter suctioning.',
      aeromedicalCorridorNote: 'Guam to Kapiʻolani Medical Center Honolulu (3,300 NM, 7.5 hrs, 1,800 L O2 reserve required).'
    };

    const pkg = await service.generateAppealPackage(input);
    expect(pkg.physicianLetterOfMedicalNecessity).toContain('Recent Acute Desaturation & Dictated Airway Events: "Nocturnal desaturation to 74% SpO2');
    expect(pkg.physicianLetterOfMedicalNecessity).toContain('Remote Frontier / Island Aeromedical Evacuation Contingency: Guam to Kapiʻolani');
  });
});
