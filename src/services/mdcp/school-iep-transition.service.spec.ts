import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { SchoolIepTransitionService, ISchoolIepInput } from './school-iep-transition.service';

describe('SchoolIepTransitionService', () => {
  let service: SchoolIepTransitionService;

  beforeEach(() => {
    service = new SchoolIepTransitionService();
  });

  it('1. should initialize the service', () => {
    expect(service).toBeTruthy();
  });

  it('2. should generate a legally grounded School Nursing Care Plan (SNCP)', async () => {
    const input: ISchoolIepInput = {
      studentName: 'Jordan Rivera',
      studentDob: '2019-04-12',
      gradeLevel: '2nd Grade',
      schoolDistrictName: 'Portland Public Schools District 1J',
      schoolName: 'Abernethy Elementary School',
      orderedPdnWeeklyHours: 40,
      dailySchoolHours: 6.5,
      tracheostomyTubeType: 'Shiley Pediatric Cuffed',
      tracheostomyTubeSize: '4.0 mm ID',
      emergencyTrachBackupSizes: ['4.0 mm', '3.5 mm'],
      suctionDepthCm: 8,
      suctionPressureMmHg: 80,
      gTubeFeedFormula: 'Kate Farms Pediatric Peptide 1.2',
      gTubeBolusMl: 240,
      wheelchairTransportRequired: true
    };

    const pkg = await service.generateIepTransitionPackage(input);
    expect(pkg).toBeTruthy();
    expect(pkg.studentName).toBe('Jordan Rivera');
    expect(pkg.schoolDistrictName).toBe('Portland Public Schools District 1J');
    expect(pkg.schoolNursingCarePlan).toContain('DEDICATED 1-ON-1 NURSING DIRECTIVE');
    expect(pkg.schoolNursingCarePlan).toContain('CEDAR RAPIDS V. GARRET F.');
    expect(pkg.schoolNursingCarePlan).toContain('4.0 mm, 3.5 mm');
    expect(pkg.schoolNursingCarePlan).toContain('Kate Farms Pediatric Peptide 1.2');
  });

  it('3. should generate specialized bus transportation protocols complying with 34 CFR 300.34', async () => {
    const input: ISchoolIepInput = {
      studentName: 'Jordan Rivera',
      studentDob: '2019-04-12',
      gradeLevel: '2nd Grade',
      schoolDistrictName: 'Austin Independent School District',
      schoolName: 'Maplewood Elementary',
      orderedPdnWeeklyHours: 40,
      dailySchoolHours: 6.5
    };

    const pkg = await service.generateIepTransitionPackage(input);
    expect(pkg.emergencyBusTransportationProtocol).toContain('34 C.F.R. § 300.34(c)(16)');
    expect(pkg.emergencyBusTransportationProtocol).toContain('Portable Electric Suction Aspirator');
    expect(pkg.emergencyBusTransportationProtocol).toContain('Medical Oxygen Cylinder: Standard E-Cylinder secured in an approved, crash-tested vertical bulkhead bracket');
    expect(pkg.emergencyBusTransportationProtocol).toContain('The assigned 1-on-1 licensed nurse (RN/LPN) MUST ride onboard');
  });

  it('4. should generate IDEA Section 504 accommodations and citations', async () => {
    const input: ISchoolIepInput = {
      studentName: 'Jordan Rivera',
      studentDob: '2019-04-12',
      gradeLevel: '2nd Grade',
      schoolDistrictName: 'Seattle Public Schools',
      schoolName: 'Montlake Elementary',
      orderedPdnWeeklyHours: 56,
      dailySchoolHours: 6.5
    };

    const pkg = await service.generateIepTransitionPackage(input);
    expect(pkg.idea504AccommodationMatrix).toContain('Climate Controlled Classroom: Continuous air conditioning with HEPA filtration');
    expect(pkg.idea504AccommodationMatrix).toContain('Minimum two dedicated un-switched hospital-grade AC outlets');
    expect(pkg.controllingLegalPrecedents.some(p => p.includes('Cedar Rapids Community School Dist. v. Garret F.'))).toBe(true);
    expect(pkg.controllingLegalPrecedents.some(p => p.includes('Section 504 of the Rehabilitation Act'))).toBe(true);
    expect(pkg.cryptographicDigest.length).toBeGreaterThan(10);
  });
});
