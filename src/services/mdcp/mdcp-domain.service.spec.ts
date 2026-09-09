import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext, signal } from '@angular/core';
import { MdcpDomainService, ISkSaiAssessment, IEEE_11073_NOMENCLATURE } from './mdcp-domain.service';
import { StateRegionalCrosswalkService } from './state-regional-crosswalk.service';
import { PatientStateService } from '../patient-state.service';
import { PatientManagementService } from '../patient-management.service';
import { IPatient } from '../patient.types';

describe('MdcpDomainService 4-Pillar Governance Engine', () => {
  let service: MdcpDomainService;
  let mockPatientState: any;
  let mockPatientMgmt: any;
  let injector: Injector;

  beforeEach(() => {
    mockPatientState = {
      vitals: signal<any>({ hr: 80, spO2: 97 })
    };

    mockPatientMgmt = {
      selectedPatient: signal<any>({
        id: 'pat-pediatric-waiver-01',
        name: 'Alex Rivera',
        age: 8,
        gender: 'Male'
      }),
      selectedPatientId: signal<string>('pat-pediatric-waiver-01')
    };

    injector = Injector.create({
      providers: [
        StateRegionalCrosswalkService,
        { provide: PatientStateService, useValue: mockPatientState },
        { provide: PatientManagementService, useValue: mockPatientMgmt }
      ]
    });

    runInInjectionContext(injector, () => {
      service = new MdcpDomainService();
    });
  });

  describe('Domain 1: Pediatric Waiver (Medically Dependent Children Program)', () => {
    it('should calculate de-institutionalization score and authorize Form 2603 ISP for ventilator dependent child', () => {
      const assessment: ISkSaiAssessment = {
        cognitiveAdaptiveScore: 30,
        ventilatorDependent: true,
        tracheostomyDependent: true,
        enteralFeedingTube: true,
        intravenousTherapyOrTpn: false,
        continuousOxygenTherapy: true,
        dailySeizureActivity: false,
        unassistedMobilityScore: 1,
        caregiverStrainIndex: 9,
        engagedSubspecialties: ['Pediatric Pulmonology', 'Palliative Care']
      };

      const isp = service.calculatePediatricWaiverIsp('pat-pediatric-waiver-01', assessment);

      expect(isp.medicalNecessityScore).toBeGreaterThanOrEqual(60);
      expect(isp.institutionalDiversionAttested).toBe(true);
      expect(isp.authorizedServices.privateDutyNursingHoursPerWeek).toBe(84);
      expect(isp.authorizedServices.respiteCareHoursPerYear).toBe(360);
      expect(isp.clinicalJustification).toContain('De-institutionalization authorized');
      expect(isp.attendingPhysicianAttestation.certifiedDeinstitutionalization).toBe(true);
    });

    it('should assign tracheostomy-specific PDN hours when ventilator is false', () => {
      const assessment: ISkSaiAssessment = {
        cognitiveAdaptiveScore: 50,
        ventilatorDependent: false,
        tracheostomyDependent: true,
        enteralFeedingTube: false,
        intravenousTherapyOrTpn: false,
        continuousOxygenTherapy: false,
        dailySeizureActivity: false,
        unassistedMobilityScore: 4,
        caregiverStrainIndex: 5,
        engagedSubspecialties: ['ENT']
      };

      const isp = service.calculatePediatricWaiverIsp('pat-pediatric-waiver-02', assessment);

      expect(isp.authorizedServices.privateDutyNursingHoursPerWeek).toBe(40);
      expect(isp.authorizedServices.respiteCareHoursPerYear).toBe(240);
    });

    it('should compute RSBI ventilator liberation metrics and identify WEAN_READY status', () => {
      // Patient with RR 18, Vt 400 mL (0.4 L) -> RSBI = 18 / 0.4 = 45 (< 105), PaO2 96, FiO2 0.30 -> P/F = 320
      const metrics = service.calculateVentilatorLiberation({
        respiratoryRate: 18,
        tidalVolumeMl: 400,
        pao2: 96,
        fio2: 0.30
      });

      expect(metrics.rsbi).toBe(45);
      expect(metrics.pfRatio).toBe(320);
      expect(metrics.liberationTier).toBe('WEAN_READY');
      expect(metrics.weaningReadinessScore).toBeGreaterThanOrEqual(80);
      expect(metrics.clinicalRationale).toContain('favorable');
    });

    it('should identify HIGH_RISK_CONTINUE_VENT when RSBI exceeds 130', () => {
      // Patient with RR 35, Vt 200 mL (0.2 L) -> RSBI = 35 / 0.2 = 175 (> 130)
      const metrics = service.calculateVentilatorLiberation({
        respiratoryRate: 35,
        tidalVolumeMl: 200,
        pao2: 70,
        fio2: 0.45
      });

      expect(metrics.rsbi).toBe(175);
      expect(metrics.liberationTier).toBe('HIGH_RISK_CONTINUE_VENT');
      expect(metrics.weaningReadinessScore).toBeLessThan(50);
    });

    it('should calculate Modified Caregiver Strain Index (MCSI) and allocate bonus respite hours', () => {
      const mcsi = service.calculateModifiedCaregiverStrain({
        sleepInterrupted: 2,
        financialStrain: 2,
        physicalStrain: 2,
        feelingOverwhelmed: 2,
        completelyOverloaded: 2,
        inconvenientSchedule: 2,
        confining: 2
      });

      expect(mcsi.totalScore).toBe(14);
      expect(mcsi.strainLevel).toBe('SEVERE');
      expect(mcsi.recommendedRespiteBonusHours).toBe(120);

      // Verify that calculatePediatricWaiverIsp incorporates MCSI bonus
      const isp = service.calculatePediatricWaiverIsp('pat-caregiver-01', {
        cognitiveAdaptiveScore: 40,
        ventilatorDependent: false,
        tracheostomyDependent: true,
        enteralFeedingTube: false,
        intravenousTherapyOrTpn: false,
        continuousOxygenTherapy: false,
        dailySeizureActivity: false,
        unassistedMobilityScore: 3,
        caregiverStrainIndex: 8,
        engagedSubspecialties: ['Pulmonology'],
        mcsiDetail: { sleepInterrupted: 2, physicalStrain: 2, financialStrain: 2, completelyOverloaded: 2, feelingOverwhelmed: 2, confining: 2, inconvenientSchedule: 2 }
      });

      // Base for caregiverStrainIndex 8 is 360, plus 120 bonus = 480
      expect(isp.authorizedServices.respiteCareHoursPerYear).toBe(480);
      expect(isp.clinicalJustification).toContain('Caregiver Strain: MCSI=14/26');
    });

    it('should model state-specific waiver profiles and calculate dynamic cost-neutrality across TX, CA, and NY', () => {
      // Test Texas STAR Kids MDCP
      service.setStateWaiverProgram('TEXAS_STAR_KIDS_MDCP');
      let current = service.currentWaiverPlan();
      expect(current?.waiverProgram).toBe('TEXAS_STAR_KIDS_MDCP');
      expect(current?.stateProfile.stateCode).toBe('TX');
      expect(current?.stateProfile.institutionalCapAnnualUsd).toBe(184200);
      expect(current?.costNeutrality.hourlyPdnRateUsd).toBe(48.50);
      expect(current?.costNeutrality.costNeutralityCertified).toBe(true);
      expect(current?.costNeutrality.annualCostSavingsUsd).toBeGreaterThan(0);

      // Switch to California HCBA / CCS
      service.setStateWaiverProgram('CALIFORNIA_HCBA_CCS');
      current = service.currentWaiverPlan();
      expect(current?.waiverProgram).toBe('CALIFORNIA_HCBA_CCS');
      expect(current?.stateProfile.stateCode).toBe('CA');
      expect(current?.stateProfile.institutionalCapAnnualUsd).toBe(212000);
      expect(current?.costNeutrality.hourlyPdnRateUsd).toBe(58.00);
      expect(current?.costNeutrality.costNeutralityCertified).toBe(true);

      // Switch to New York Children's Waiver
      service.setStateWaiverProgram('NEW_YORK_CHILDRENS_WAIVER');
      current = service.currentWaiverPlan();
      expect(current?.waiverProgram).toBe('NEW_YORK_CHILDRENS_WAIVER');
      expect(current?.stateProfile.stateCode).toBe('NY');
      expect(current?.stateProfile.institutionalCapAnnualUsd).toBe(225000);
      expect(current?.costNeutrality.hourlyPdnRateUsd).toBe(62.00);
      expect(current?.costNeutrality.costNeutralityCertified).toBe(true);
    });

    it('should dynamically switch and calculate cost-neutrality for ANY of the 50 states via setStateByCode', () => {
      // Test Washington (CMS Region 10)
      service.setStateByCode('WA');
      let plan = service.currentWaiverPlan();
      expect(plan?.stateProfile.stateCode).toBe('WA');
      expect(plan?.stateProfile.stateName).toBe('Washington');
      expect(plan?.stateProfile.cmsRegionNumber).toBe(10);
      expect(plan?.stateProfile.institutionalCapAnnualUsd).toBe(215000);
      expect(plan?.costNeutrality.hourlyPdnRateUsd).toBe(58.50);
      expect(plan?.costNeutrality.costNeutralityCertified).toBe(true);

      // Test Ohio (CMS Region 5)
      service.setStateByCode('OH');
      plan = service.currentWaiverPlan();
      expect(plan?.stateProfile.stateCode).toBe('OH');
      expect(plan?.stateProfile.programTitle).toContain('OhioRISE');
      expect(plan?.stateProfile.cmsRegionNumber).toBe(5);
      expect(plan?.stateProfile.institutionalCapAnnualUsd).toBe(190000);
      expect(plan?.costNeutrality.hourlyPdnRateUsd).toBe(50.00);

      // Test Colorado (CMS Region 8)
      service.setStateByCode('CO');
      plan = service.currentWaiverPlan();
      expect(plan?.stateProfile.stateCode).toBe('CO');
      expect(plan?.stateProfile.cmsRegionNumber).toBe(8);
      expect(plan?.stateProfile.institutionalCapAnnualUsd).toBe(206000);
      expect(plan?.costNeutrality.hourlyPdnRateUsd).toBe(55.00);
    });
  });

  describe('Domain 2: Hospital Multi-Disciplinary Care Plan (MDCP)', () => {
    it('should synchronize multidisciplinary milestones and toggle achievement', () => {
      const plan = service.currentHospitalPlan();
      expect(plan).toBeTruthy();
      expect(plan?.milestones.length).toBeGreaterThan(0);

      const targetMilestone = plan!.milestones[0];
      const originalStatus = targetMilestone.status;
      const newStatus = originalStatus === 'ACHIEVED' ? 'IN_PROGRESS' : 'ACHIEVED';

      service.updateMultidisciplinaryMilestone(targetMilestone.id, newStatus);

      const updatedPlan = service.currentHospitalPlan();
      const updatedMilestone = updatedPlan!.milestones.find(m => m.id === targetMilestone.id);
      expect(updatedMilestone?.status).toBe(newStatus);
    });

    it('should include 3-act plain-language caregiver trajectory and drug interactions', () => {
      const plan = service.currentHospitalPlan();
      expect(plan?.caregiverPlainLanguageRoadmap.act1WhereYouveBeen).toBeTruthy();
      expect(plan?.caregiverPlainLanguageRoadmap.act2WhereYouStandToday).toBeTruthy();
      expect(plan?.caregiverPlainLanguageRoadmap.act3WhereYoureGoing).toBeTruthy();
      expect(plan?.drugInteractions.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Domain 3: ISO/IEEE 11073 Telemetry (MDCP / MDC)', () => {
    it('should have standard Rosetta Terminology Mapping (RTMMS) constants registered', () => {
      expect(IEEE_11073_NOMENCLATURE.PULSE_RATE.mdcCode).toBe('MDC_ECG_HEART_RATE');
      expect(IEEE_11073_NOMENCLATURE.PULSE_RATE.cfCode).toBe(147842);
      expect(IEEE_11073_NOMENCLATURE.SPO2.mdcCode).toBe('MDC_PULS_OXIM_SAT_O2');
      expect(IEEE_11073_NOMENCLATURE.SPO2.loincMapping).toBe('2708-6');
    });

    it('should ingest raw IEEE 11073 packet and trigger alarm on acute hypoxemia', () => {
      const sample = service.ingestIeee11073Packet({
        mdcCode: 'MDC_PULS_OXIM_SAT_O2',
        value: 86,
        vendor: 'PHILIPS_INTELLIVUE'
      });

      expect(sample.alarmState).toBe('HIGH_PHYSIOLOGICAL_ALARM');
      expect(sample.unit).toBe('%');
      expect(sample.qualityIndicator).toBe('VALID');
      expect(service.liveDeviceTelemetry()[0].metricValue).toBe(86);
    });
  });

  describe('Domain 4: ITA Market Development Cooperator Program (15 U.S.C. § 4723)', () => {
    it('should verify international standards conformity and grant ceiling', () => {
      const compliance = service.verifyItaComplianceStatus();

      expect(compliance.statutoryAuthority).toBe('15 U.S.C. § 4723');
      expect(compliance.matchingGrantCeilingUsd).toBe(300000);
      expect(compliance.standardsConformityProfiles.hl7FhirR4UsCore).toBe(true);
      expect(compliance.standardsConformityProfiles.isoIeee11073Sdc).toBe(true);
      expect(compliance.standardsConformityProfiles.fiveEyesInteroperability.ukCore).toBe(true);
      expect(compliance.cryptographicIntegritySeal).toContain('sha256-');
    });
  });

  describe('Unified HL7 FHIR R4 MDCP Bundle Generation', () => {
    it('should assemble all 4 domains into a valid FHIR R4 Bundle with proper tags and resources', () => {
      const patient: Partial<IPatient> = {
        id: 'pat-test-101',
        name: 'Jordan Lee',
        age: 6,
        gender: 'Female'
      };

      const bundle = service.buildUnifiedMdcpFhirBundle(patient);

      expect(bundle['resourceType']).toBe('Bundle');
      expect(bundle['type']).toBe('collection');

      const entryTypes = bundle['entry'].map((e: any) => e.resource.resourceType);
      expect(entryTypes).toContain('Patient');
      expect(entryTypes).toContain('CarePlan');
      expect(entryTypes).toContain('Observation');

      // Check ITA tagging
      const tags = bundle['meta']?.tag || [];
      const itaTag = tags.find((t: any) => t.system === 'https://trade.gov/mdcp');
      expect(itaTag).toBeTruthy();
      expect(itaTag.display).toContain('15 U.S.C. § 4723');
    });
  });
});
