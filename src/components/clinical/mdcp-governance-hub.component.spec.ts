import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MdcpGovernanceHubComponent } from './mdcp-governance-hub.component';
import { MdcpDomainService } from '../../services/mdcp/mdcp-domain.service';
import { PatientStateService } from '../../services/patient-state.service';
import { FhirExportStrategyService } from '../../services/export/fhir-export-strategy.service';
import { NavigationShellService } from '../../services/navigation-shell.service';
import { PatientManagementService } from '../../services/patient-management.service';
import { signal } from '@angular/core';

describe('MdcpGovernanceHubComponent', () => {
  let component: MdcpGovernanceHubComponent;
  let fixture: ComponentFixture<MdcpGovernanceHubComponent>;
  let mockNavShell: any;
  let mockPatientState: any;
  let mockPatientMgmt: any;
  let mockExportStrategy: any;

  beforeEach(async () => {
    mockNavShell = {
      showMdcpHubModal: signal<boolean>(true),
      openMdcpHub: vi.fn(),
      closeMdcpHub: vi.fn()
    };

    mockPatientState = {
      vitals: signal<any>({ hr: 78, spO2: 99 })
    };

    mockPatientMgmt = {
      selectedPatient: signal<any>({
        id: 'pat-pediatric-01',
        name: 'Jordan Rivera',
        age: 7,
        gender: 'Female'
      }),
      selectedPatientId: signal<string>('pat-pediatric-01')
    };

    mockExportStrategy = {
      exportMdcpBundle: vi.fn(),
      exportEpsdtAppealBundle: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [MdcpGovernanceHubComponent],
      providers: [
        MdcpDomainService,
        { provide: PatientStateService, useValue: mockPatientState },
        { provide: PatientManagementService, useValue: mockPatientMgmt },
        { provide: NavigationShellService, useValue: mockNavShell },
        { provide: FhirExportStrategyService, useValue: mockExportStrategy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MdcpGovernanceHubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize component with default pediatric-waiver tab', () => {
    expect(component).toBeTruthy();
    expect(component.activeTab()).toBe('pediatric-waiver');
  });

  it('should switch between the 4 MDCP domains reactively', () => {
    component.activeTab.set('hospital-careplan');
    fixture.detectChanges();
    expect(component.activeTab()).toBe('hospital-careplan');

    component.activeTab.set('ieee11073-telemetry');
    fixture.detectChanges();
    expect(component.activeTab()).toBe('ieee11073-telemetry');

    component.activeTab.set('ita-standards');
    fixture.detectChanges();
    expect(component.activeTab()).toBe('ita-standards');
  });

  it('should call closeMdcpHub on NavigationShellService when closeModal is invoked', () => {
    component.closeModal();
    expect(mockNavShell.closeMdcpHub).toHaveBeenCalled();
  });

  it('should trigger exportMdcpBundle on exportFhirBundle call', () => {
    component.exportFhirBundle();
    expect(mockExportStrategy.exportMdcpBundle).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'pat-pediatric-01' })
    );
  });

  it('should switch state waiver program reactively and reflect state specific profile data', () => {
    expect(component.selectedStateWaiver()).toBe('TEXAS_STAR_KIDS_MDCP');
    expect(component.stateProfileKeys.length).toBeGreaterThanOrEqual(7);

    // Switch to California
    component.setStateWaiver('CALIFORNIA_HCBA_CCS');
    fixture.detectChanges();

    expect(component.selectedStateWaiver()).toBe('CALIFORNIA_HCBA_CCS');
    const waiver = component.waiverPlan();
    expect(waiver?.stateProfile.stateCode).toBe('CA');
    expect(waiver?.stateProfile.programTitle).toContain('Home and Community-Based Alternatives');
    expect(waiver?.costNeutrality.institutionalCapAnnualUsd).toBe(212000);
    expect(waiver?.costNeutrality.hourlyPdnRateUsd).toBe(58.00);

    // Switch to New York
    component.setStateWaiver('NEW_YORK_CHILDRENS_WAIVER');
    fixture.detectChanges();

    expect(component.selectedStateWaiver()).toBe('NEW_YORK_CHILDRENS_WAIVER');
    expect(component.waiverPlan()?.stateProfile.stateCode).toBe('NY');
    expect(component.waiverPlan()?.costNeutrality.institutionalCapAnnualUsd).toBe(225000);
  });

  it('should switch to regional-crosswalk tab, filter by CMS Region, and activate any state', () => {
    component.activeTab.set('regional-crosswalk');
    fixture.detectChanges();
    expect(component.activeTab()).toBe('regional-crosswalk');

    // Verify all 57 jurisdictions loaded (50 States, DC, 5 Territories, Minor Outlying Islands)
    expect(component.all50StatesList().length).toBe(57);
    expect(component.cmsRegionsList().length).toBe(10);

    // Filter by CMS Region 10 (Seattle - AK, ID, OR, WA)
    component.selectedRegionFilter.set(10);
    fixture.detectChanges();
    const region10Items = component.filteredCrosswalkList();
    expect(region10Items.length).toBe(4);
    expect(region10Items.map(i => i.stateCode).sort()).toEqual(['AK', 'ID', 'OR', 'WA']);

    // Filter by search query
    component.resetFilters();
    component.crosswalkSearchQuery.set('Massachusetts');
    fixture.detectChanges();
    expect(component.filteredCrosswalkList().length).toBe(1);
    expect(component.filteredCrosswalkList()[0].stateCode).toBe('MA');

    // 1-Click activate state from crosswalk
    component.selectAndActivateState('PA');
    fixture.detectChanges();

    expect(component.activeTab()).toBe('pediatric-waiver');
    expect(component.selectedStateWaiver()).toBe('PA');
    expect(component.waiverPlan()?.stateProfile.stateCode).toBe('PA');
    expect(component.waiverPlan()?.stateProfile.stateName).toBe('Pennsylvania');
    expect(component.waiverPlan()?.stateProfile.cmsRegionNumber).toBe(3);
    expect(component.waiverPlan()?.costNeutrality.institutionalCapAnnualUsd).toBe(202000);
    expect(component.waiverPlan()?.costNeutrality.hourlyPdnRateUsd).toBe(54.50);
  });

  it('should switch to epsdt-appeal tab, generate legally binding appeal, and handle copy/download', async () => {
    // 1. Activate EPSDT Tab
    component.activateEpsdtTab();
    fixture.detectChanges();
    expect(component.activeTab()).toBe('epsdt-appeal');

    // Wait for async package generation
    await component.generateEpsdtAppeal();
    fixture.detectChanges();

    const pkg = component.epsdtPackage();
    expect(pkg).toBeTruthy();
    expect(pkg?.disputeCategory).toBe('waiver-waitlist-bypass');
    expect(pkg?.physicianLetterOfMedicalNecessity).toContain('42 U.S.C. § 1396d(r)(5)');
    expect(pkg?.fairHearingPetition).toContain('Aid Paid Pending');
    expect(pkg?.cryptographicIntegrityDigest).toBeTruthy();

    // 2. Change dispute category to nursing hours reduction
    component.setDisputeCategory('nursing-hours-reduction');
    component.onPdnHoursChange(56);
    component.onPriorHoursChange(56);
    await component.generateEpsdtAppeal();
    fixture.detectChanges();

    expect(component.epsdtDispute()).toBe('nursing-hours-reduction');
    expect(component.epsdtPdnHours()).toBe(56);
    expect(component.epsdtPackage()?.physicianLetterOfMedicalNecessity).toContain('56 hours per week');

    // 3. Test document sub-tab switching
    component.epsdtActiveDoc.set('fair-hearing');
    fixture.detectChanges();
    expect(component.epsdtActiveDoc()).toBe('fair-hearing');

    component.epsdtActiveDoc.set('legal-brief');
    fixture.detectChanges();
    expect(component.epsdtActiveDoc()).toBe('legal-brief');

    // 4. Test copy active document
    component.copyActiveDocument();
    expect(component.epsdtPackage()?.federalCaseLawBrief).toContain('O.B. v. Norwood');

    // 5. Test export FHIR R4 EPSDT Bundle
    component.exportFhirEpsdtBundle();
    expect(mockExportStrategy.exportEpsdtAppealBundle).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'pat-pediatric-01' }),
      expect.objectContaining({ disputeCategory: 'nursing-hours-reduction' })
    );
  });

  it('should calculate aeromedical corridor metrics and in-flight oxygen reserves for remote territories (Option 2)', async () => {
    // Select Guam (GU)
    component.selectAndActivateState('GU');
    fixture.detectChanges();

    const corridor = component.currentCorridor();
    expect(corridor).toBeTruthy();
    expect(corridor?.jurisdictionCode).toBe('GU');
    expect(corridor?.originIcao).toBe('PGUM');
    expect(corridor?.destinationHospital).toContain('Kapiʻolani');
    expect(corridor?.distanceNauticalMiles).toBe(3300);
    expect(corridor?.estimatedFlightHours).toBe(7.5);

    // Verify FAA/DoD 2.0x Safety Margin O2 Calculation at default 2.0 L/min
    // (2.0 L/min * 450 min * 2.0 = 1,800 L) -> 3 E-tanks
    const o2 = component.o2Calculation();
    expect(o2).toBeTruthy();
    expect(o2?.baselineOxygenLiters).toBe(900);
    expect(o2?.totalRequiredOxygenLiters).toBe(1800);
    expect(o2?.standardECylinderCount).toBe(3);
    expect(o2?.standardMCylinderCount).toBe(1);

    // Adjust flow rate to 3.0 L/min
    component.onO2FlowChange(3.0);
    fixture.detectChanges();
    const updatedO2 = component.o2Calculation();
    expect(updatedO2?.flowRateLpm).toBe(3.0);
    expect(updatedO2?.totalRequiredOxygenLiters).toBe(2700);

    // Verify HCPCS Emergency Air Transport billing codes
    const bill = component.billingSummary();
    expect(bill?.baseHcpcsCode).toBe('A0430');
    expect(bill?.mileageHcpcsCode).toBe('A0435');
    expect(bill?.statuteMiles).toBe(3798);
    expect(bill?.estimatedTotalTransportUsd).toBeGreaterThan(50000);
    expect(bill?.statutoryPriorApprovalWaiverNotice).toContain('EMTALA');
  });

  it('should support voice-guided clinical airway dictation and preset insertion into physician order (Option 3)', async () => {
    component.selectAndActivateState('HI');
    component.activateEpsdtTab();
    fixture.detectChanges();

    // Insert preset clinical airway event
    const acuteEvent = 'Patient experienced nocturnal desaturation to 78% due to acute mucus plug occlusion requiring sterile catheter suctioning.';
    component.applyPresetDictation(acuteEvent);
    fixture.detectChanges();

    expect(component.dictatedText()).toContain('nocturnal desaturation to 78%');

    await component.generateEpsdtAppeal();
    fixture.detectChanges();

    const letter = component.epsdtPackage()?.physicianLetterOfMedicalNecessity;
    expect(letter).toContain('Recent Acute Desaturation & Dictated Airway Events:');
    expect(letter).toContain('nocturnal desaturation to 78%');
    expect(letter).toContain('Remote Frontier / Island Aeromedical Evacuation Contingency:');
    expect(letter).toContain('Hawaii (HI) Emergency Air Transport Corridor');

    // Test clearing dictation
    component.clearDictation();
    fixture.detectChanges();
    expect(component.dictatedText()).toBe('');

    await component.generateEpsdtAppeal();
    fixture.detectChanges();
    expect(component.epsdtPackage()?.physicianLetterOfMedicalNecessity).not.toContain('Recent Acute Desaturation & Dictated Airway Events');
  });

  it('should verify zero-egress offline edge caching for all 57 jurisdictions (Option 4)', () => {
    expect(component.isOfflineCached()).toBe(true);
    const stats = component.offlineCacheStats();
    expect(stats).toBeTruthy();
    expect(stats?.count).toBe(57);
    expect(stats?.bytes).toBeGreaterThan(1000);
  });

  it('should evaluate live aviation weather clearance and altitude hypoxia directives for remote corridors (Option C)', () => {
    // Select Guam (GU)
    component.selectAndActivateState('GU');
    fixture.detectChanges();

    const clearance = component.flightClearance();
    expect(clearance).toBeTruthy();
    expect(clearance?.corridorCode).toBe('GU');
    expect(clearance?.originWeather.icao).toBe('PGUM');
    expect(clearance?.destinationWeather.icao).toBe('PHNL');
    expect(['CLEARED_FOR_DEPARTURE', 'ADVISORY_CAUTION']).toContain(clearance?.clearanceStatus);
    expect(clearance?.originWeather.flightCategory).toBe('VFR');
    expect(clearance?.originWeather.crosswindKnots).toBeGreaterThanOrEqual(0);

    // Verify Pressurized Cabin Hypoxia Biophysics (8,000 ft cabin equivalent)
    const hypoxia = clearance?.hypoxiaAssessment;
    expect(hypoxia).toBeTruthy();
    expect(hypoxia?.cabinAltitudeFeet).toBe(8000);
    expect(hypoxia?.cabinPressureMmHg).toBeGreaterThan(540);
    expect(hypoxia?.cabinPressureMmHg).toBeLessThan(600);
    expect(hypoxia?.relativePo2ReductionPercent).toBeGreaterThan(20);
    expect(hypoxia?.recommendedFlowRateBumpLpm).toBe(1.0);
    expect(hypoxia?.clinicalPhysiologyDirective).toContain('High-Altitude Pediatric Airway Safeguard');
    expect(hypoxia?.clinicalPhysiologyDirective).toContain('+1 L/min');

    // Change O2 flow and re-evaluate
    component.onO2FlowChange(3.0);
    fixture.detectChanges();
    const updatedClearance = component.flightClearance();
    expect(updatedClearance?.hypoxiaAssessment.clinicalPhysiologyDirective).toContain('prescribed target: 4.0 L/min');
  });

  it('should generate ASC X12 EDI 278 Prior Auth and EDI 837P Claims with download triggers (Option B)', async () => {
    // Mock URL.createObjectURL and click
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    // Select Alaska (AK) with aeromedical corridor
    component.selectAndActivateState('AK');
    component.activateEpsdtTab();
    fixture.detectChanges();

    await component.generateEpsdtAppeal();
    fixture.detectChanges();

    // 1. EDI 278 Prior Authorization Document
    const edi278 = component.edi278Document();
    expect(edi278).toBeTruthy();
    expect(edi278?.transactionType).toBe('278');
    expect(edi278?.rawEdiContent).toContain('ST*278*');
    expect(edi278?.rawEdiContent).toContain('NM1*1P*'); // Billing Provider
    expect(edi278?.rawEdiContent).toContain('UM*'); // Health Care Services Review
    expect(edi278?.rawEdiContent).toContain('HSD*'); // Frequency
    expect(edi278?.rawEdiContent).toContain('SE*');

    // Switch active document sub-tab to edi-278
    component.epsdtActiveDoc.set('edi-278');
    fixture.detectChanges();
    expect(component.epsdtActiveDoc()).toBe('edi-278');

    // Trigger download
    component.downloadEdi278();
    expect(createObjectURLSpy).toHaveBeenCalled();

    // 2. EDI 837P Professional Air Ambulance Claim
    const edi837p = component.edi837pDocument();
    expect(edi837p).toBeTruthy();
    expect(edi837p?.transactionType).toBe('837P');
    expect(edi837p?.rawEdiContent).toContain('ST*837*');
    expect(edi837p?.rawEdiContent).toContain('SV1*HC:A0430*'); // Fixed Wing Air Base
    expect(edi837p?.rawEdiContent).toContain('SV1*HC:A0435*'); // Air Mileage
    expect(edi837p?.rawEdiContent).toContain('CR1*'); // Ambulance Transport Info
    expect(edi837p?.rawEdiContent).toContain('EMTALA');

    // Switch active document sub-tab to edi-837p
    component.epsdtActiveDoc.set('edi-837p');
    fixture.detectChanges();
    expect(component.epsdtActiveDoc()).toBe('edi-837p');

    // Trigger download
    component.downloadEdi837p();
    expect(createObjectURLSpy).toHaveBeenCalled();

    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
  });

  it('should generate School-Based IEP / IDEA § 504 Transition Plan with download triggers (Option D)', async () => {
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    component.selectAndActivateState('TX');
    component.activateEpsdtTab();
    fixture.detectChanges();

    await component.generateEpsdtAppeal();
    fixture.detectChanges();

    const iep = component.schoolIepPackage();
    expect(iep).toBeTruthy();
    expect(iep?.studentName).toBe('Jordan Rivera');
    expect(iep?.fullDossierMarkdown).toContain('20 U.S.C. § 1400');
    expect(iep?.schoolNursingCarePlan).toContain('DEDICATED 1-ON-1 NURSING DIRECTIVE');
    expect(iep?.emergencyBusTransportationProtocol).toContain('The assigned 1-on-1 licensed nurse (RN/LPN) MUST ride onboard');
    expect(iep?.emergencyBusTransportationProtocol).toContain('Portable Electric Suction Aspirator');
    expect(iep?.idea504AccommodationMatrix).toContain('HEPA filtration');
    expect(iep?.controllingLegalPrecedents.some(p => p.includes('Cedar Rapids'))).toBe(true);
    expect(iep?.cryptographicDigest.length).toBeGreaterThan(10);

    // Switch active document sub-tab to school-iep
    component.epsdtActiveDoc.set('school-iep');
    fixture.detectChanges();
    expect(component.epsdtActiveDoc()).toBe('school-iep');

    // Trigger download
    component.downloadSchoolIepPlan();
    expect(createObjectURLSpy).toHaveBeenCalled();

    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
  });
});

