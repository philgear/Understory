import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import {
  StateRegionalCrosswalkService,
  ALL_STATES_CROSSWALK,
  CMS_REGIONS,
  CmsRegionNumber
} from './state-regional-crosswalk.service';

describe('StateRegionalCrosswalkService', () => {
  let service: StateRegionalCrosswalkService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StateRegionalCrosswalkService]
    });
    service = TestBed.inject(StateRegionalCrosswalkService);
  });

  it('should initialize with all 10 CMS Federal Regions', () => {
    const regions = service.cmsRegions();
    expect(Object.keys(regions).length).toBe(10);

    for (let r = 1; r <= 10; r++) {
      const region = regions[r as CmsRegionNumber];
      expect(region).toBeDefined();
      expect(region.regionNumber).toBe(r);
      expect(region.regionalOfficeLocation).toBeTruthy();
      expect(region.statesCovered.length).toBeGreaterThan(0);
    }
  });

  it('should crosswalk all 50 states plus District of Columbia, Territories & Minor Outlying Islands (57 total jurisdictions)', () => {
    const entries = service.allCrosswalkEntries();
    const keys = Object.keys(entries);
    expect(keys.length).toBe(57);

    // Verify key bellwether states across geographic regions
    expect(entries['TX']).toBeDefined(); // Region 6
    expect(entries['CA']).toBeDefined(); // Region 9
    expect(entries['NY']).toBeDefined(); // Region 2
    expect(entries['FL']).toBeDefined(); // Region 4
    expect(entries['IL']).toBeDefined(); // Region 5
    expect(entries['PA']).toBeDefined(); // Region 3
    expect(entries['OH']).toBeDefined(); // Region 5
    expect(entries['WA']).toBeDefined(); // Region 10
    expect(entries['CO']).toBeDefined(); // Region 8
    expect(entries['MO']).toBeDefined(); // Region 7
    expect(entries['MA']).toBeDefined(); // Region 1
    expect(entries['DC']).toBeDefined(); // Region 3

    // Verify U.S. Territories and Minor Outlying Islands
    expect(entries['PR']).toBeDefined(); // Region 2
    expect(entries['VI']).toBeDefined(); // Region 2
    expect(entries['GU']).toBeDefined(); // Region 9
    expect(entries['AS']).toBeDefined(); // Region 9
    expect(entries['MP']).toBeDefined(); // Region 9
    expect(entries['UM']).toBeDefined(); // Region 9
  });

  it('should guarantee data completeness and validity for every single state entry', () => {
    const entries = Object.values(service.allCrosswalkEntries());

    entries.forEach(entry => {
      expect(entry.stateCode.length).toBe(2);
      expect(entry.stateName).toBeTruthy();
      expect(entry.cmsRegionNumber).toBeGreaterThanOrEqual(1);
      expect(entry.cmsRegionNumber).toBeLessThanOrEqual(10);
      expect(entry.programTitle).toBeTruthy();
      expect(entry.administeringAgency).toBeTruthy();
      expect(entry.statutoryReference).toBeTruthy();
      expect(entry.assessmentInstrument).toBeTruthy();
      expect(entry.planFormIdentifier).toBeTruthy();
      expect(entry.institutionalCapAnnualUsd).toBeGreaterThan(150000);
      expect(entry.institutionalCapAnnualUsd).toBeLessThan(300000);
      expect(entry.defaultHourlyPdnRateUsd).toBeGreaterThan(40.00);
      expect(entry.defaultHourlyPdnRateUsd).toBeLessThan(80.00);
      expect(typeof entry.tefraOptionEnacted).toBe('boolean');
      expect(entry.parentalIncomeDeemingWaived).toBe(true);
    });
  });

  it('should compute national telemetry summary accurately', () => {
    const summary = service.nationalSummary();
    expect(summary.totalJurisdictions).toBe(57);
    expect(summary.totalCmsRegions).toBe(10);
    expect(summary.averageInstitutionalCapUsd).toBeGreaterThan(180000);
    expect(summary.averageInstitutionalCapUsd).toBeLessThan(220000);
    expect(summary.medianHourlyPdnRateUsd).toBeGreaterThan(48.00);
    expect(summary.medianHourlyPdnRateUsd).toBeLessThan(56.00);
    expect(summary.statesWithTefraOptionCount).toBeGreaterThanOrEqual(30);
    expect(summary.statesWith1915cWaiversCount).toBeGreaterThanOrEqual(30);
    expect(summary.highestCapState.stateCode).toBe('AK'); // Frontier Alaska transport logistics cap $235,000
    expect(summary.lowestCapState.capUsd).toBeGreaterThanOrEqual(160000);
  });

  it('should look up state entry by case-insensitive code', () => {
    const tx = service.getStateEntry('tx');
    expect(tx).toBeDefined();
    expect(tx?.stateName).toBe('Texas');
    expect(tx?.cmsRegionNumber).toBe(6);
    expect(tx?.planFormIdentifier).toContain('Form 2603');

    const ca = service.getStateEntry('CA');
    expect(ca?.stateName).toBe('California');
    expect(ca?.cmsRegionNumber).toBe(9);

    const invalid = service.getStateEntry('ZZ');
    expect(invalid).toBeUndefined();
  });

  it('should retrieve states partitioned by CMS Region', () => {
    const region1States = service.getStatesByRegion(1);
    expect(region1States.length).toBe(6);
    const codes = region1States.map(s => s.stateCode).sort();
    expect(codes).toEqual(['CT', 'MA', 'ME', 'NH', 'RI', 'VT']);

    const region6States = service.getStatesByRegion(6);
    expect(region6States.length).toBe(5);
    const r6Codes = region6States.map(s => s.stateCode).sort();
    expect(r6Codes).toEqual(['AR', 'LA', 'NM', 'OK', 'TX']);

    // Region 2 (NJ, NY, PR, VI)
    const region2States = service.getStatesByRegion(2);
    expect(region2States.length).toBe(4);
    expect(region2States.map(s => s.stateCode).sort()).toEqual(['NJ', 'NY', 'PR', 'VI']);

    // Region 9 (AZ, CA, HI, NV, AS, GU, MP, UM)
    const region9States = service.getStatesByRegion(9);
    expect(region9States.length).toBe(8);
    expect(region9States.map(s => s.stateCode).sort()).toEqual(['AS', 'AZ', 'CA', 'GU', 'HI', 'MP', 'NV', 'UM']);
  });

  it('should filter crosswalk by search query across multiple fields', () => {
    // Search by state name
    const ohio = service.searchCrosswalk('Ohio');
    expect(ohio.length).toBe(1);
    expect(ohio[0].stateCode).toBe('OH');
    expect(ohio[0].programTitle).toContain('OhioRISE');

    // Search by assessment instrument
    const cansMatches = service.searchCrosswalk('CANS');
    expect(cansMatches.length).toBeGreaterThanOrEqual(2); // NY (CANS-NY) and OH (Ohio CANS)

    // Search by statute keyword
    const tefraMatches = service.searchCrosswalk('TEFRA');
    expect(tefraMatches.length).toBeGreaterThan(10);
  });
});
