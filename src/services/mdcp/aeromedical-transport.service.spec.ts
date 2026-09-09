import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import {
  AeromedicalTransportService,
  REMOTE_AEROMEDICAL_CORRIDORS
} from './aeromedical-transport.service';

describe('AeromedicalTransportService', () => {
  let service: AeromedicalTransportService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AeromedicalTransportService]
    });
    service = TestBed.inject(AeromedicalTransportService);
  });

  it('1. should initialize with corridors for all 8 remote/island jurisdictions', () => {
    expect(service).toBeTruthy();
    const corridors = service.getAllCorridors();
    expect(corridors.length).toBe(8);

    const codes = corridors.map(c => c.jurisdictionCode).sort();
    expect(codes).toEqual(['AK', 'AS', 'GU', 'HI', 'MP', 'PR', 'UM', 'VI']);
  });

  it('2. should retrieve Guam (GU) trans-Pacific corridor to Honolulu with long-range jet specifications', () => {
    const gu = service.getCorridorForJurisdiction('GU');
    expect(gu).toBeDefined();
    expect(gu?.originIcao).toBe('PGUM');
    expect(gu?.destinationIcao).toBe('PHNL');
    expect(gu?.destinationHospital).toContain('Kapiʻolani');
    expect(gu?.distanceNauticalMiles).toBe(3300);
    expect(gu?.preferredAircraft).toBe('FIXED_WING_CRITICAL_CARE_JET');
    expect(gu?.estimatedFlightHours).toBe(7.5);
  });

  it('3. should retrieve U.S. Virgin Islands (VI) corridor and note zero local PICU beds', () => {
    const vi = service.getCorridorForJurisdiction('VI');
    expect(vi).toBeDefined();
    expect(vi?.originIcao).toBe('TIST');
    expect(vi?.keyLogisticalNotes).toContain('Zero local PICU beds');
    expect(vi?.statutoryTransportAuthority).toContain('EPSDT Out-of-Territory Transport Mandate');
  });

  it('4. should accurately calculate in-flight medical oxygen requirements with FAA/DoD 2.0x safety factor', () => {
    // Guam 7.5 hours flight at 2 L/min
    const oxygenGuam = service.calculateOxygenReserve(2.0, 7.5);
    expect(oxygenGuam.flightDurationMinutes).toBe(450);
    expect(oxygenGuam.baselineOxygenLiters).toBe(900);
    expect(oxygenGuam.safetyReserveFactor).toBe(2.0);
    expect(oxygenGuam.totalRequiredOxygenLiters).toBe(1800);
    // 1800 Liters / 680 Liters (E-cylinder) = 2.64 -> 3 E-cylinders
    expect(oxygenGuam.standardECylinderCount).toBe(3);
    // 1800 Liters / 3450 Liters (M-cylinder) = 0.52 -> 1 M-cylinder
    expect(oxygenGuam.standardMCylinderCount).toBe(1);
    expect(oxygenGuam.safetyAttestation).toContain('mandatory 100% emergency diversion reserve');
  });

  it('5. should calculate HCPCS air ambulance billing codes and EMTALA prior-approval waiver notice', () => {
    const ak = service.getCorridorForJurisdiction('AK')!;
    const billing = service.calculateBillingSummary(ak);

    expect(billing.baseHcpcsCode).toBe('A0430');
    expect(billing.mileageHcpcsCode).toBe('A0435');
    expect(billing.statuteMiles).toBe(1657);
    expect(billing.estimatedBaseAllowanceUsd).toBe(4850);
    expect(billing.estimatedMileageAllowanceUsd).toBe(Math.round(1657 * 18.50));
    expect(billing.estimatedTotalTransportUsd).toBe(4850 + Math.round(1657 * 18.50));
    expect(billing.statutoryPriorApprovalWaiverNotice).toContain('EMTALA (42 U.S.C. § 1395dd)');
    expect(billing.statutoryPriorApprovalWaiverNotice).toContain('exempt from prior authorization delays');
  });

  it('6. should gracefully return null for non-remote jurisdictions', () => {
    expect(service.getCorridorForJurisdiction('TX')).toBeNull();
    expect(service.getCorridorForJurisdiction('')).toBeNull();
  });
});
