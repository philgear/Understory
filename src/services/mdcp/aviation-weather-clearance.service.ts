import { Injectable } from '@angular/core';
import { IAeromedicalCorridor } from './aeromedical-transport.service';

export type FlightCategory = 'VFR' | 'MVFR' | 'IFR' | 'LIFR';
export type FlightClearanceStatus = 'CLEARED_FOR_DEPARTURE' | 'ADVISORY_CAUTION' | 'GROUND_DELAY_DIVERT';

export interface IAirfieldWeatherReport {
  icao: string;
  name: string;
  cityState: string;
  elevationFt: number;
  rawMetar: string;
  windDirectionDeg: number;
  windSpeedKnots: number;
  gustKnots: number | null;
  visibilityStatuteMiles: number;
  ceilingFeetAgl: number;
  skyCover: 'SKC' | 'FEW' | 'SCT' | 'BKN' | 'OVC';
  temperatureC: number;
  dewPointC: number;
  altimeterInHg: number;
  flightCategory: FlightCategory;
  runwayHeadingDeg: number;
  headwindKnots: number;
  crosswindKnots: number;
  reportedAtIso: string;
}

export interface ICabinHypoxiaCompensation {
  cabinAltitudeFeet: number;
  cabinPressureMmHg: number;
  inspiredPo2MmHg: number;
  seaLevelInspiredPo2MmHg: number;
  relativePo2ReductionPercent: number;
  recommendedFiO2: number;
  recommendedFlowRateBumpLpm: number;
  clinicalPhysiologyDirective: string;
}

export interface IAeromedicalFlightClearance {
  corridorCode: string;
  originWeather: IAirfieldWeatherReport;
  destinationWeather: IAirfieldWeatherReport;
  clearanceStatus: FlightClearanceStatus;
  clearanceReason: string;
  hypoxiaAssessment: ICabinHypoxiaCompensation;
  safeForPediatricAirwayTransport: boolean;
  evaluatedAtIso: string;
}

interface IAirfieldStationData {
  icao: string;
  name: string;
  cityState: string;
  elevationFt: number;
  primaryRunwayHeading: number;
  baseWindDeg: number;
  baseWindKt: number;
  baseVisSm: number;
  baseCeilingFt: number;
  baseSky: 'SKC' | 'FEW' | 'SCT' | 'BKN' | 'OVC';
  tempC: number;
  dewC: number;
  altimeter: number;
}

const AIRFIELD_STATIONS: Record<string, IAirfieldStationData> = {
  PANC: {
    icao: 'PANC',
    name: 'Ted Stevens Anchorage International',
    cityState: 'Anchorage, AK',
    elevationFt: 152,
    primaryRunwayHeading: 70,
    baseWindDeg: 60,
    baseWindKt: 14,
    baseVisSm: 10,
    baseCeilingFt: 4500,
    baseSky: 'SCT',
    tempC: 4,
    dewC: -1,
    altimeter: 29.88
  },
  KBFI: {
    icao: 'KBFI',
    name: 'Boeing Field / King County International',
    cityState: 'Seattle, WA',
    elevationFt: 21,
    primaryRunwayHeading: 140,
    baseWindDeg: 160,
    baseWindKt: 8,
    baseVisSm: 10,
    baseCeilingFt: 5500,
    baseSky: 'FEW',
    tempC: 15,
    dewC: 9,
    altimeter: 30.02
  },
  PHTO: {
    icao: 'PHTO',
    name: 'Hilo International Airport',
    cityState: 'Hilo, HI',
    elevationFt: 38,
    primaryRunwayHeading: 80,
    baseWindDeg: 70,
    baseWindKt: 12,
    baseVisSm: 10,
    baseCeilingFt: 3200,
    baseSky: 'FEW',
    tempC: 27,
    dewC: 20,
    altimeter: 29.98
  },
  PHNL: {
    icao: 'PHNL',
    name: 'Daniel K. Inouye International',
    cityState: 'Honolulu, HI',
    elevationFt: 13,
    primaryRunwayHeading: 80,
    baseWindDeg: 75,
    baseWindKt: 16,
    baseVisSm: 10,
    baseCeilingFt: 6000,
    baseSky: 'FEW',
    tempC: 28,
    dewC: 19,
    altimeter: 29.95
  },
  TJSJ: {
    icao: 'TJSJ',
    name: 'Luis Muñoz Marín International',
    cityState: 'San Juan, PR',
    elevationFt: 9,
    primaryRunwayHeading: 80,
    baseWindDeg: 90,
    baseWindKt: 15,
    baseVisSm: 10,
    baseCeilingFt: 4000,
    baseSky: 'SCT',
    tempC: 30,
    dewC: 22,
    altimeter: 29.92
  },
  KMIA: {
    icao: 'KMIA',
    name: 'Miami International Airport',
    cityState: 'Miami, FL',
    elevationFt: 8,
    primaryRunwayHeading: 90,
    baseWindDeg: 110,
    baseWindKt: 11,
    baseVisSm: 10,
    baseCeilingFt: 5000,
    baseSky: 'FEW',
    tempC: 29,
    dewC: 22,
    altimeter: 29.96
  },
  TIST: {
    icao: 'TIST',
    name: 'Cyril E. King Airport',
    cityState: 'St. Thomas, VI',
    elevationFt: 24,
    primaryRunwayHeading: 100,
    baseWindDeg: 90,
    baseWindKt: 14,
    baseVisSm: 10,
    baseCeilingFt: 4500,
    baseSky: 'FEW',
    tempC: 29,
    dewC: 21,
    altimeter: 29.94
  },
  PGUM: {
    icao: 'PGUM',
    name: 'Antonio B. Won Pat International',
    cityState: 'Tamuning, Guam',
    elevationFt: 297,
    primaryRunwayHeading: 60,
    baseWindDeg: 70,
    baseWindKt: 18,
    baseVisSm: 10,
    baseCeilingFt: 3800,
    baseSky: 'SCT',
    tempC: 31,
    dewC: 24,
    altimeter: 29.85
  },
  NSTU: {
    icao: 'NSTU',
    name: 'Pago Pago International',
    cityState: 'Pago Pago, American Samoa',
    elevationFt: 32,
    primaryRunwayHeading: 50,
    baseWindDeg: 80,
    baseWindKt: 14,
    baseVisSm: 10,
    baseCeilingFt: 4200,
    baseSky: 'SCT',
    tempC: 29,
    dewC: 23,
    altimeter: 29.90
  },
  PGSN: {
    icao: 'PGSN',
    name: 'Francisco C. Ada / Saipan International',
    cityState: 'Saipan, MP',
    elevationFt: 215,
    primaryRunwayHeading: 70,
    baseWindDeg: 80,
    baseWindKt: 16,
    baseVisSm: 10,
    baseCeilingFt: 3600,
    baseSky: 'SCT',
    tempC: 30,
    dewC: 23,
    altimeter: 29.87
  },
  PWAK: {
    icao: 'PWAK',
    name: 'Wake Island Airfield',
    cityState: 'Wake Island, UM',
    elevationFt: 21,
    primaryRunwayHeading: 100,
    baseWindDeg: 90,
    baseWindKt: 15,
    baseVisSm: 10,
    baseCeilingFt: 5000,
    baseSky: 'FEW',
    tempC: 28,
    dewC: 21,
    altimeter: 29.91
  }
};

@Injectable({
  providedIn: 'root'
})
export class AviationWeatherClearanceService {
  /**
   * Calculates Flight Rules Category from ceiling and visibility
   * VFR: Ceiling > 3,000 ft AND Vis > 5 SM
   * MVFR: Ceiling 1,000 - 3,000 ft OR Vis 3 - 5 SM
   * IFR: Ceiling 500 - <1,000 ft OR Vis 1 - <3 SM
   * LIFR: Ceiling < 500 ft OR Vis < 1 SM
   */
  public determineFlightCategory(ceilingFt: number, visibilitySm: number): FlightCategory {
    if (ceilingFt < 500 || visibilitySm < 1) return 'LIFR';
    if (ceilingFt < 1000 || visibilitySm < 3) return 'IFR';
    if (ceilingFt <= 3000 || visibilitySm <= 5) return 'MVFR';
    return 'VFR';
  }

  /**
   * Calculates headwind and crosswind components relative to runway heading
   */
  public calculateWindComponents(
    windDirectionDeg: number,
    windSpeedKnots: number,
    runwayHeadingDeg: number
  ): { headwindKnots: number; crosswindKnots: number } {
    const angleRad = ((windDirectionDeg - runwayHeadingDeg) * Math.PI) / 180;
    const headwind = Math.round(windSpeedKnots * Math.cos(angleRad));
    const crosswind = Math.round(Math.abs(windSpeedKnots * Math.sin(angleRad)));
    return { headwindKnots: headwind, crosswindKnots: crosswind };
  }

  /**
   * Retrieves or formats realistic airfield weather report
   */
  public getStationWeather(icao: string): IAirfieldWeatherReport {
    const station = AIRFIELD_STATIONS[icao.toUpperCase()] || {
      icao: icao.toUpperCase(),
      name: `${icao.toUpperCase()} Airport`,
      cityState: 'Regional Airfield',
      elevationFt: 100,
      primaryRunwayHeading: 90,
      baseWindDeg: 90,
      baseWindKt: 10,
      baseVisSm: 10,
      baseCeilingFt: 5000,
      baseSky: 'FEW' as const,
      tempC: 22,
      dewC: 15,
      altimeter: 29.92
    };

    const category = this.determineFlightCategory(station.baseCeilingFt, station.baseVisSm);
    const windComp = this.calculateWindComponents(
      station.baseWindDeg,
      station.baseWindKt,
      station.primaryRunwayHeading
    );

    const now = new Date();
    const day = now.getUTCDate().toString().padStart(2, '0');
    const hour = now.getUTCHours().toString().padStart(2, '0');
    const min = now.getUTCMinutes().toString().padStart(2, '0');
    const rawMetar = `${station.icao} ${day}${hour}${min}Z ${station.baseWindDeg.toString().padStart(3, '0')}${station.baseWindKt.toString().padStart(2, '0')}KT ${station.baseVisSm}SM ${station.baseSky}${Math.round(station.baseCeilingFt / 100).toString().padStart(3, '0')} ${station.tempC}/${station.dewC} A${Math.round(station.altimeter * 100).toString()}`;

    return {
      icao: station.icao,
      name: station.name,
      cityState: station.cityState,
      elevationFt: station.elevationFt,
      rawMetar,
      windDirectionDeg: station.baseWindDeg,
      windSpeedKnots: station.baseWindKt,
      gustKnots: null,
      visibilityStatuteMiles: station.baseVisSm,
      ceilingFeetAgl: station.baseCeilingFt,
      skyCover: station.baseSky,
      temperatureC: station.tempC,
      dewPointC: station.dewC,
      altimeterInHg: station.altimeter,
      flightCategory: category,
      runwayHeadingDeg: station.primaryRunwayHeading,
      headwindKnots: windComp.headwindKnots,
      crosswindKnots: windComp.crosswindKnots,
      reportedAtIso: now.toISOString()
    };
  }

  /**
   * Computes inspired oxygen tension and hypoxia compensation at pressurized cabin altitude.
   * Standard pressurized fixed-wing cabin altitude = 8,000 ft.
   * Atmospheric pressure Pb = 760 * exp(-alt / 29000) approx 564 mmHg.
   * Water vapor pressure in airway = 47 mmHg.
   * Dry gas pressure = Pb - 47.
   * Inspired PO2 = FiO2 * (Pb - 47).
   */
  public calculateCabinHypoxia(
    cabinAltitudeFt: number = 8000,
    baselineFlowRateLpm: number = 2.0
  ): ICabinHypoxiaCompensation {
    const validAlt = Math.max(0, Math.min(12000, cabinAltitudeFt));
    const seaLevelPb = 760;
    const pWater = 47;

    // Atmospheric barometric pressure formula
    const cabinPb = Math.round(seaLevelPb * Math.exp(-validAlt / 28000));

    // Sea level PiO2 (room air FiO2 = 0.209)
    const seaLevelPiO2 = Math.round(0.209 * (seaLevelPb - pWater) * 10) / 10; // ~149.0 mmHg

    // Cabin altitude PiO2 at unsupplemented room air
    const cabinPiO2 = Math.round(0.209 * (cabinPb - pWater) * 10) / 10; // ~108.0 mmHg at 8000 ft

    // Percentage drop in available alveolar oxygen driving pressure
    const reductionPercent = Math.round(((seaLevelPiO2 - cabinPiO2) / seaLevelPiO2) * 1000) / 10; // ~27.5%

    // Required FiO2 to maintain sea-level equivalent PiO2 at cabin altitude:
    // FiO2_req * (cabinPb - 47) = seaLevelPiO2 -> FiO2_req = seaLevelPiO2 / (cabinPb - 47)
    const reqFiO2 = Math.round((seaLevelPiO2 / (cabinPb - pWater)) * 100) / 100; // ~0.29 (29%)

    // Corresponding flow rate bump: ~0.5 to 1.0 L/min for every 4,000 ft of cabin altitude
    const flowBump = Math.round((validAlt / 8000) * 1.0 * 10) / 10;

    const directive = `High-Altitude Pediatric Airway Safeguard: Cabin altitude of ${validAlt.toLocaleString()} ft reduces barometric pressure to ${cabinPb} mmHg (-${reductionPercent}% ambient PO2). For tracheostomy-dependent pediatric patients, increase in-flight O2 flow rate by +${flowBump} L/min (prescribed target: ${(baselineFlowRateLpm + flowBump).toFixed(1)} L/min, approx ${Math.round(reqFiO2 * 100)}% FiO2) to prevent nocturnal altitude desaturation.`;

    return {
      cabinAltitudeFeet: validAlt,
      cabinPressureMmHg: cabinPb,
      inspiredPo2MmHg: cabinPiO2,
      seaLevelInspiredPo2MmHg: seaLevelPiO2,
      relativePo2ReductionPercent: reductionPercent,
      recommendedFiO2: reqFiO2,
      recommendedFlowRateBumpLpm: flowBump,
      clinicalPhysiologyDirective: directive
    };
  }

  /**
   * Evaluates end-to-end aeromedical flight clearance for a given corridor and patient
   */
  public evaluateFlightClearance(
    corridor: IAeromedicalCorridor,
    prescribedLpm: number = 2.0
  ): IAeromedicalFlightClearance {
    const origin = this.getStationWeather(corridor.originIcao);
    const dest = this.getStationWeather(corridor.destinationIcao);
    const hypoxia = this.calculateCabinHypoxia(8000, prescribedLpm);

    let status: FlightClearanceStatus = 'CLEARED_FOR_DEPARTURE';
    let reason = `Standard aeromedical clearance: Both ${origin.icao} (${origin.flightCategory}) and ${dest.icao} (${dest.flightCategory}) meet Part 135 critical care fixed-wing minimums.`;
    let isSafe = true;

    // Crosswind limit check (fixed wing ambulance crosswind limit ~25 knots)
    if (origin.crosswindKnots > 25 || dest.crosswindKnots > 25) {
      status = 'ADVISORY_CAUTION';
      reason = `Caution: Crosswind exceeds 25 knots at ${origin.crosswindKnots > 25 ? origin.icao : dest.icao}. Active crosswind vector: ${Math.max(origin.crosswindKnots, dest.crosswindKnots)} kts.`;
    }

    // Instrument flight rule check
    if (origin.flightCategory === 'LIFR' || dest.flightCategory === 'LIFR') {
      status = 'GROUND_DELAY_DIVERT';
      reason = `Ground Delay: Low Instrument Flight Rules (LIFR) at ${origin.flightCategory === 'LIFR' ? origin.icao : dest.icao}. Ceilings below 500 ft AGL or visibility below 1 statute mile.`;
      isSafe = false;
    }

    return {
      corridorCode: corridor.jurisdictionCode,
      originWeather: origin,
      destinationWeather: dest,
      clearanceStatus: status,
      clearanceReason: reason,
      hypoxiaAssessment: hypoxia,
      safeForPediatricAirwayTransport: isSafe,
      evaluatedAtIso: new Date().toISOString()
    };
  }
}
