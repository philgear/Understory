import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { AviationWeatherClearanceService } from './aviation-weather-clearance.service';
import { IAeromedicalCorridor } from './aeromedical-transport.service';

describe('AviationWeatherClearanceService', () => {
  let service: AviationWeatherClearanceService;

  beforeEach(() => {
    service = new AviationWeatherClearanceService();
  });

  it('1. should initialize the service', () => {
    expect(service).toBeTruthy();
  });

  it('2. should correctly classify flight categories from ceiling and visibility', () => {
    expect(service.determineFlightCategory(5000, 10)).toBe('VFR');
    expect(service.determineFlightCategory(2500, 6)).toBe('MVFR');
    expect(service.determineFlightCategory(4000, 4)).toBe('MVFR');
    expect(service.determineFlightCategory(800, 4)).toBe('IFR');
    expect(service.determineFlightCategory(3500, 2)).toBe('IFR');
    expect(service.determineFlightCategory(400, 5)).toBe('LIFR');
    expect(service.determineFlightCategory(5000, 0.5)).toBe('LIFR');
  });

  it('3. should calculate headwind and crosswind components relative to runway heading', () => {
    // Runway 09 (090 deg), Wind from 090 at 20 knots -> 20 kt headwind, 0 crosswind
    const comp1 = service.calculateWindComponents(90, 20, 90);
    expect(comp1.headwindKnots).toBe(20);
    expect(comp1.crosswindKnots).toBe(0);

    // Runway 09 (090 deg), Wind from 180 (direct 90 deg crosswind) at 15 knots
    const comp2 = service.calculateWindComponents(180, 15, 90);
    expect(comp2.headwindKnots).toBe(0);
    expect(comp2.crosswindKnots).toBe(15);
  });

  it('4. should retrieve accurate weather reports for remote airfields', () => {
    const panc = service.getStationWeather('PANC');
    expect(panc.icao).toBe('PANC');
    expect(panc.cityState).toContain('Anchorage');
    expect(panc.rawMetar).toContain('PANC');
    expect(panc.rawMetar).toContain('KT');
    expect(panc.flightCategory).toBe('VFR');

    const pgum = service.getStationWeather('PGUM');
    expect(pgum.icao).toBe('PGUM');
    expect(pgum.cityState).toContain('Guam');
    expect(pgum.temperatureC).toBe(31);
  });

  it('5. should calculate cabin altitude hypoxia compensation under alveolar gas equation', () => {
    // 8,000 ft standard pressurized cabin altitude
    const hypoxia = service.calculateCabinHypoxia(8000, 2.0);
    expect(hypoxia.cabinAltitudeFeet).toBe(8000);
    expect(hypoxia.cabinPressureMmHg).toBeLessThan(600);
    expect(hypoxia.cabinPressureMmHg).toBeGreaterThan(540);
    expect(hypoxia.relativePo2ReductionPercent).toBeGreaterThan(20);
    expect(hypoxia.recommendedFiO2).toBeGreaterThanOrEqual(0.28);
    expect(hypoxia.recommendedFlowRateBumpLpm).toBe(1.0);
    expect(hypoxia.clinicalPhysiologyDirective).toContain('High-Altitude Pediatric Airway Safeguard');
    expect(hypoxia.clinicalPhysiologyDirective).toContain('+1 L/min');
  });

  it('6. should evaluate end-to-end aeromedical flight clearance for Guam to Honolulu', () => {
    const corridor: IAeromedicalCorridor = {
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

    const clearance = service.evaluateFlightClearance(corridor, 2.0);
    expect(clearance).toBeTruthy();
    expect(clearance.originWeather.icao).toBe('PGUM');
    expect(clearance.destinationWeather.icao).toBe('PHNL');
    expect(clearance.clearanceStatus).toBe('CLEARED_FOR_DEPARTURE');
    expect(clearance.safeForPediatricAirwayTransport).toBe(true);
    expect(clearance.hypoxiaAssessment.recommendedFlowRateBumpLpm).toBe(1.0);
  });
});
