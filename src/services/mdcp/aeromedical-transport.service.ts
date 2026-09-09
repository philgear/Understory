import { Injectable } from '@angular/core';

export type AircraftCategory =
  | 'FIXED_WING_CRITICAL_CARE_JET'
  | 'FIXED_WING_TURBOPROP'
  | 'MILITARY_AIR_MOBILITY_C130'
  | 'COAST_GUARD_HC130J';

export interface IAeromedicalCorridor {
  jurisdictionCode: string;
  jurisdictionName: string;
  originFacility: string;
  originIcao: string;
  destinationHospital: string;
  destinationCityState: string;
  destinationIcao: string;
  distanceNauticalMiles: number;
  distanceStatuteMiles: number;
  preferredAircraft: AircraftCategory;
  cruiseSpeedKnots: number;
  estimatedFlightHours: number;
  primarySubspecialtyCapability: string;
  statutoryTransportAuthority: string;
  keyLogisticalNotes: string;
}

export interface IOxygenFlightRequirement {
  flowRateLpm: number;
  flightDurationMinutes: number;
  baselineOxygenLiters: number;
  safetyReserveFactor: number;
  totalRequiredOxygenLiters: number;
  standardECylinderCount: number; // 680 L each
  standardMCylinderCount: number; // 3,450 L each
  safetyAttestation: string;
}

export interface IAirAmbulanceBillingSummary {
  baseHcpcsCode: 'A0430' | 'A0434';
  mileageHcpcsCode: 'A0435';
  statuteMiles: number;
  estimatedBaseAllowanceUsd: number;
  estimatedMileageAllowanceUsd: number;
  estimatedTotalTransportUsd: number;
  statutoryPriorApprovalWaiverNotice: string;
}

export const REMOTE_AEROMEDICAL_CORRIDORS: Record<string, IAeromedicalCorridor> = {
  AK: {
    jurisdictionCode: 'AK',
    jurisdictionName: 'Alaska',
    originFacility: 'Providence Alaska Medical Center / Alaska Native Medical Center',
    originIcao: 'PANC',
    destinationHospital: 'Seattle Children’s Hospital',
    destinationCityState: 'Seattle, WA',
    destinationIcao: 'KBFI',
    distanceNauticalMiles: 1440,
    distanceStatuteMiles: 1657,
    preferredAircraft: 'FIXED_WING_CRITICAL_CARE_JET',
    cruiseSpeedKnots: 430,
    estimatedFlightHours: 3.4,
    primarySubspecialtyCapability: 'Pediatric Cardiothoracic Surgery, Complex Airway Reconstruction, ECMO',
    statutoryTransportAuthority: 'Title XIX Medicaid Emergency Medical Transportation (7 AAC 120.300) / EPSDT',
    keyLogisticalNotes: 'Arctic climate pre-flight de-icing, pressurized sea-level equivalent cabin altitude, specialized warming incubators.'
  },
  HI: {
    jurisdictionCode: 'HI',
    jurisdictionName: 'Hawaii',
    originFacility: 'Hilo Medical Center / Maui Memorial / Wilcox Health',
    originIcao: 'PHTO',
    destinationHospital: 'Kapiʻolani Medical Center for Women & Children / Tripler AMC',
    destinationCityState: 'Honolulu, HI',
    destinationIcao: 'PHNL',
    distanceNauticalMiles: 185,
    distanceStatuteMiles: 213,
    preferredAircraft: 'FIXED_WING_TURBOPROP',
    cruiseSpeedKnots: 260,
    estimatedFlightHours: 0.8,
    primarySubspecialtyCapability: 'Level IV Pediatric Intensive Care Unit (PICU), Pediatric Airway Stenting',
    statutoryTransportAuthority: 'Hawaii Administrative Rules (HAR § 17-1737) / EPSDT Mandate',
    keyLogisticalNotes: 'Inter-island rapid rotor/fixed-wing handoff; continuous pulse oximetry and portable suction.'
  },
  PR: {
    jurisdictionCode: 'PR',
    jurisdictionName: 'Puerto Rico',
    originFacility: 'Hospital Pediátrico Universitario (Centro Médico San Juan)',
    originIcao: 'TJSJ',
    destinationHospital: 'Nicklaus Children’s Hospital / Holtz Children’s Hospital',
    destinationCityState: 'Miami, FL',
    destinationIcao: 'KMIA',
    distanceNauticalMiles: 905,
    distanceStatuteMiles: 1041,
    preferredAircraft: 'FIXED_WING_CRITICAL_CARE_JET',
    cruiseSpeedKnots: 420,
    estimatedFlightHours: 2.5,
    primarySubspecialtyCapability: 'Advanced Pediatric Pulmonology, Tracheostomy Reconstruction, Pediatric Transplant',
    statutoryTransportAuthority: 'Title XIX § 1108 / 42 U.S.C. § 1396d(r)(5) Mandatory Out-of-Territory EPSDT Referral',
    keyLogisticalNotes: 'Overwater flight protocol; bilingual clinical flight team (English/Spanish); FAA Part 135 air ambulance clearance.'
  },
  VI: {
    jurisdictionCode: 'VI',
    jurisdictionName: 'U.S. Virgin Islands',
    originFacility: 'Schneider Regional Medical Center (St. Thomas) / Governor Juan F. Luis Hospital (St. Croix)',
    originIcao: 'TIST',
    destinationHospital: 'Centro Médico Pediátrico (San Juan) / Nicklaus Children’s (Miami)',
    destinationCityState: 'San Juan, PR / Miami, FL',
    destinationIcao: 'TJSJ',
    distanceNauticalMiles: 65,
    distanceStatuteMiles: 75,
    preferredAircraft: 'FIXED_WING_TURBOPROP',
    cruiseSpeedKnots: 240,
    estimatedFlightHours: 0.4,
    primarySubspecialtyCapability: 'Pediatric Intensive Care Stabilization, Tracheostomy Decannulation Emergency',
    statutoryTransportAuthority: '34 V.I.C. § 261 / Title XIX § 1108 EPSDT Out-of-Territory Transport Mandate',
    keyLogisticalNotes: 'Zero local PICU beds in territory. Primary stabilization transfer to San Juan (25 min) or Miami (2.7 hrs).'
  },
  GU: {
    jurisdictionCode: 'GU',
    jurisdictionName: 'Guam',
    originFacility: 'Guam Memorial Hospital (GMHA) / Naval Hospital Guam',
    originIcao: 'PGUM',
    destinationHospital: 'Kapiʻolani Medical Center / Tripler Army Medical Center',
    destinationCityState: 'Honolulu, HI',
    destinationIcao: 'PHNL',
    distanceNauticalMiles: 3300,
    distanceStatuteMiles: 3798,
    preferredAircraft: 'FIXED_WING_CRITICAL_CARE_JET',
    cruiseSpeedKnots: 440,
    estimatedFlightHours: 7.5,
    primarySubspecialtyCapability: 'Comprehensive Pediatric Critical Care, Specialized Pediatric Pulmonology & Surgery',
    statutoryTransportAuthority: '10 Guam Code Ann. § 2901 / 42 U.S.C. § 1396d(r)(5) EPSDT Off-Island Referral',
    keyLogisticalNotes: 'Ultra-long range trans-Pacific medical flight; auxiliary fuel tanks, dual certified flight nurses, massive in-flight oxygen capacity required.'
  },
  AS: {
    jurisdictionCode: 'AS',
    jurisdictionName: 'American Samoa',
    originFacility: 'LBJ Tropical Medical Center',
    originIcao: 'NSTU',
    destinationHospital: 'Starship Children’s Health (Auckland) / Kapiʻolani (Honolulu)',
    destinationCityState: 'Auckland, New Zealand / Honolulu, HI',
    destinationIcao: 'NZAA',
    distanceNauticalMiles: 1560,
    distanceStatuteMiles: 1795,
    preferredAircraft: 'FIXED_WING_CRITICAL_CARE_JET',
    cruiseSpeedKnots: 420,
    estimatedFlightHours: 4.2,
    primarySubspecialtyCapability: 'Pediatric Intensive Care, Complex Pediatric Cardiology & Airway Surgery',
    statutoryTransportAuthority: 'Title XIX § 1902(j) Demonstration Alternative State Plan / EPSDT',
    keyLogisticalNotes: 'International medical transport clearance for New Zealand corridor or U.S. domestic flag flight to Honolulu.'
  },
  MP: {
    jurisdictionCode: 'MP',
    jurisdictionName: 'Northern Mariana Islands',
    originFacility: 'Commonwealth Healthcare Corporation (CHCC Hospital Saipan)',
    originIcao: 'PGSN',
    destinationHospital: 'Guam Memorial Hospital (Regional Hub) / Kapiʻolani Medical Center',
    destinationCityState: 'Tamuning, Guam / Honolulu, HI',
    destinationIcao: 'PGUM',
    distanceNauticalMiles: 120,
    distanceStatuteMiles: 138,
    preferredAircraft: 'FIXED_WING_TURBOPROP',
    cruiseSpeedKnots: 240,
    estimatedFlightHours: 0.5,
    primarySubspecialtyCapability: 'Pediatric ICU Stabilization & Airway Management',
    statutoryTransportAuthority: '1 CMC § 2601 / Title XIX § 1108 / 42 U.S.C. § 1396d(r)',
    keyLogisticalNotes: 'Inter-island shuttle to Guam (30 min) for tertiary stabilization, with secondary long-range airbridge to Hawaii if needed.'
  },
  UM: {
    jurisdictionCode: 'UM',
    jurisdictionName: 'U.S. Minor Outlying Islands',
    originFacility: 'Wake Island Airfield / Midway Atoll Airfield / Johnston Atoll Field Station',
    originIcao: 'PWAK',
    destinationHospital: 'Tripler Army Medical Center / Kapiʻolani Medical Center',
    destinationCityState: 'Honolulu, HI',
    destinationIcao: 'PHNL',
    distanceNauticalMiles: 2000,
    distanceStatuteMiles: 2300,
    preferredAircraft: 'COAST_GUARD_HC130J',
    cruiseSpeedKnots: 340,
    estimatedFlightHours: 5.9,
    primarySubspecialtyCapability: 'DoD Military Health System Pediatric Intensive Care & Surgical Stabilization',
    statutoryTransportAuthority: '10 U.S.C. § 1079 (TRICARE ECHO) / 42 U.S.C. § 1396d(r) / USCG Search & Rescue MEDEVAC',
    keyLogisticalNotes: 'Austere unpaved/short airfield operations; U.S. Coast Guard HC-130J or Air Mobility Command C-130 aeromedical evacuation with satellite tele-ICU guidance.'
  }
};

@Injectable({
  providedIn: 'root'
})
export class AeromedicalTransportService {
  readonly standardECylinderLiters = 680;
  readonly standardMCylinderLiters = 3450;
  readonly safetyReserveFactor = 2.0; // FAA/DoD aeromedical standard: 100% reserve margin

  /**
   * Retrieves aeromedical corridor for a given state/territory code
   */
  public getCorridorForJurisdiction(jurisdictionCode: string): IAeromedicalCorridor | null {
    if (!jurisdictionCode) return null;
    return REMOTE_AEROMEDICAL_CORRIDORS[jurisdictionCode.toUpperCase()] || null;
  }

  /**
   * Returns all available remote aeromedical corridors
   */
  public getAllCorridors(): IAeromedicalCorridor[] {
    return Object.values(REMOTE_AEROMEDICAL_CORRIDORS);
  }

  /**
   * Calculates required in-flight oxygen reserves adhering to FAA & DoD aeromedical standards:
   * Total Liters = (Flow Rate L/min) * (Flight Duration in minutes) * 2.0 Safety Factor
   */
  public calculateOxygenReserve(flowRateLpm: number, flightHours: number): IOxygenFlightRequirement {
    const validFlow = Math.max(0.25, Number(flowRateLpm) || 2.0);
    const validHours = Math.max(0.1, Number(flightHours) || 1.0);
    const flightDurationMinutes = Math.round(validHours * 60);

    const baselineLiters = Math.round(validFlow * flightDurationMinutes);
    const totalRequiredLiters = Math.round(baselineLiters * this.safetyReserveFactor);

    const eCylinders = Math.ceil(totalRequiredLiters / this.standardECylinderLiters);
    const mCylinders = Math.ceil(totalRequiredLiters / this.standardMCylinderLiters);

    const safetyAttestation = `FAA / DoD Aeromedical Standard: Flight time of ${validHours.toFixed(1)} hrs (${flightDurationMinutes} min) at prescribed ${validFlow} L/min requires a minimum of ${totalRequiredLiters} Liters of medical oxygen, including a mandatory 100% emergency diversion reserve (Safety Factor: ${this.safetyReserveFactor.toFixed(1)}x).`;

    return {
      flowRateLpm: validFlow,
      flightDurationMinutes,
      baselineOxygenLiters: baselineLiters,
      safetyReserveFactor: this.safetyReserveFactor,
      totalRequiredOxygenLiters: totalRequiredLiters,
      standardECylinderCount: Math.max(1, eCylinders),
      standardMCylinderCount: Math.max(1, mCylinders),
      safetyAttestation
    };
  }

  /**
   * Generates HCPCS air ambulance billing codes and statutory prior-approval waiver details
   */
  public calculateBillingSummary(corridor: IAeromedicalCorridor): IAirAmbulanceBillingSummary {
    const miles = corridor.distanceStatuteMiles;
    const baseAllowance = 4850; // Standard Medicare/Medicaid HCPCS A0430 base allowance
    const perMileRate = 18.50; // Standard HCPCS A0435 fixed-wing mileage rate
    const mileageAllowance = Math.round(miles * perMileRate);
    const totalTransport = baseAllowance + mileageAllowance;

    const statutoryWaiver = `Pursuant to EMTALA (42 U.S.C. § 1395dd) and 42 C.F.R. § 440.170, emergency fixed-wing aeromedical transport to a tertiary pediatric facility for acute airway compromise or specialized surgical intervention is exempt from prior authorization delays. State Medicaid agencies must process claims under HCPCS A0430 (Base Air Transport) and A0435 (Air Mileage: ${miles} miles).`;

    return {
      baseHcpcsCode: 'A0430',
      mileageHcpcsCode: 'A0435',
      statuteMiles: miles,
      estimatedBaseAllowanceUsd: baseAllowance,
      estimatedMileageAllowanceUsd: mileageAllowance,
      estimatedTotalTransportUsd: totalTransport,
      statutoryPriorApprovalWaiverNotice: statutoryWaiver
    };
  }
}
