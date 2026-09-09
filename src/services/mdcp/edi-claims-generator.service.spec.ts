import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { EdiClaimsGeneratorService } from './edi-claims-generator.service';
import { IEpsdtAppealPackage } from './epsdt-advocacy.service';
import { IAeromedicalCorridor, IAirAmbulanceBillingSummary } from './aeromedical-transport.service';

describe('EdiClaimsGeneratorService', () => {
  let service: EdiClaimsGeneratorService;

  beforeEach(() => {
    service = new EdiClaimsGeneratorService();
  });

  it('1. should initialize the service', () => {
    expect(service).toBeTruthy();
  });

  it('2. should generate a standard ASC X12N 005010X217 (EDI 278) prior auth request', () => {
    const mockAppeal: IEpsdtAppealPackage = {
      disputeCategory: 'waiver-waitlist-bypass',
      stateCode: 'OR',
      stateName: 'Oregon',
      administeringAgency: 'Oregon Health Authority (OHA)',
      statutoryReference: 'Title XIX § 1905(r)(5)',
      appealFilingDeadlineDays: 10,
      aidPaidPendingDeadlineIso: '2026-09-18',
      isStatExpedited: true,
      physicianLetterOfMedicalNecessity: 'SAMPLE_ORDER',
      fairHearingPetition: 'SAMPLE_PETITION',
      federalCaseLawBrief: 'SAMPLE_BRIEF',
      statutoryCitations: ['42 U.S.C. § 1396d(r)(5)'],
      deinstitutionalizationScore: 75,
      cryptographicIntegrityDigest: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      generatedAtIso: new Date().toISOString()
    };

    const doc = service.generateEdi278PriorAuth(mockAppeal, {
      name: 'Jordan Rivera',
      dob: '2019-04-12',
      medicaidId: 'MED-98412039',
      gender: 'F'
    }, {
      name: 'Dr. Eleanor Vance, MD',
      npi: '1982736450'
    });

    expect(doc).toBeTruthy();
    expect(doc.transactionType).toBe('278');
    expect(doc.rawEdiContent).toContain('ISA*00*');
    expect(doc.rawEdiContent).toContain('GS*HI*POCKETGULL*ORMEDICAID');
    expect(doc.rawEdiContent).toContain('ST*278*');
    expect(doc.rawEdiContent).toContain('BHT*0007*13*');
    expect(doc.rawEdiContent).toContain('HL*1**20*1~');
    expect(doc.rawEdiContent).toContain('NM1*X3*2*OREGON HEALTH AUTHORITY (OHA)');
    expect(doc.rawEdiContent).toContain('HL*2*1*21*1~');
    expect(doc.rawEdiContent).toContain('NM1*1P*1*VANCE*ELEANOR****XX*1982736450~');
    expect(doc.rawEdiContent).toContain('HL*3*2*22*1~');
    expect(doc.rawEdiContent).toContain('NM1*IL*1*RIVERA*JORDAN****MI*MED-98412039~');
    expect(doc.rawEdiContent).toContain('HL*5*4*EV*0~');
    expect(doc.rawEdiContent).toContain('UM*AR*I*1*12::B~');
    expect(doc.rawEdiContent).toContain('HSD*VS*40*WK~');
    expect(doc.rawEdiContent).toContain('PWK*OZ*BM***FT*e3b0c44298fc1c149afbf4c8996fb9~');
    expect(doc.rawEdiContent).toContain('SE*');
    expect(doc.rawEdiContent).toContain('GE*1*');
    expect(doc.rawEdiContent).toContain('IEA*1*');

    // Verify SE segment count matches actual lines inside transaction
    const lines = doc.rawEdiContent.split('\n');
    const seLine = lines.find(l => l.startsWith('SE*'));
    expect(seLine).toBeTruthy();
    const declaredCount = Number(seLine?.split('*')[1]);
    // Lines between ST and SE inclusive:
    const stIndex = lines.findIndex(l => l.startsWith('ST*'));
    const seIndex = lines.findIndex(l => l.startsWith('SE*'));
    expect(declaredCount).toBe(seIndex - stIndex + 1);
  });

  it('3. should generate a standard ASC X12N 005010X222A1 (EDI 837P) air ambulance claim', () => {
    const mockCorridor: IAeromedicalCorridor = {
      jurisdictionCode: 'GU',
      jurisdictionName: 'Guam',
      originFacility: 'Guam Memorial Hospital',
      originIcao: 'PGUM',
      destinationHospital: 'Kapiʻolani Medical Center for Women & Children',
      destinationCityState: 'Honolulu, HI',
      destinationIcao: 'PHNL',
      distanceNauticalMiles: 3300,
      distanceStatuteMiles: 3798,
      preferredAircraft: 'FIXED_WING_CRITICAL_CARE_JET',
      cruiseSpeedKnots: 440,
      estimatedFlightHours: 7.5,
      primarySubspecialtyCapability: 'Pediatric Pulmonology & PICU',
      statutoryTransportAuthority: '42 U.S.C. § 1396d(r)(5)',
      keyLogisticalNotes: 'Overwater flight'
    };

    const mockBilling: IAirAmbulanceBillingSummary = {
      baseHcpcsCode: 'A0430',
      mileageHcpcsCode: 'A0435',
      statuteMiles: 3798,
      estimatedBaseAllowanceUsd: 4850,
      estimatedMileageAllowanceUsd: 70263,
      estimatedTotalTransportUsd: 75113,
      statutoryPriorApprovalWaiverNotice: 'EMTALA emergency transport'
    };

    const doc = service.generateEdi837pAirAmbulanceClaim(mockCorridor, mockBilling, {
      name: 'Jordan Rivera',
      dob: '2019-04-12',
      medicaidId: 'MED-98412039',
      gender: 'F'
    });

    expect(doc).toBeTruthy();
    expect(doc.transactionType).toBe('837P');
    expect(doc.rawEdiContent).toContain('GS*HC*POCKETGULLAIR*GUMEDICAID');
    expect(doc.rawEdiContent).toContain('ST*837*');
    expect(doc.rawEdiContent).toContain('CLM*AIR-EVAC-');
    expect(doc.rawEdiContent).toContain('75113.00');
    expect(doc.rawEdiContent).toContain('CR1*LB*45*A*DH*3798~');
    expect(doc.rawEdiContent).toContain('CR2*01*EMERGENCY STAT AIR EVACUATION UNSTABLE AIRWAY COMPROMISE~');
    expect(doc.rawEdiContent).toContain('NTE*ADD*EMTALA 42 USC 1395dd');
    expect(doc.rawEdiContent).toContain('SV1*HC:A0430*4850.00*UN*1***1~');
    expect(doc.rawEdiContent).toContain('SV1*HC:A0435*70263.00*UN*3798***1~');
    expect(doc.rawEdiContent).toContain('SE*');
    expect(doc.rawEdiContent).toContain('GE*1*');
    expect(doc.rawEdiContent).toContain('IEA*1*');
  });
});
