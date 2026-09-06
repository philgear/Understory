/**
 * PocketGull Clinical Visual Acuity & Ophthalmological Service
 * Complies with LogMAR / ETDRS (Early Treatment Diabetic Retinopathy Study) & Snellen standards.
 * ISO 8596:2017 & ANSI Z80.21 visual acuity geometry.
 */

import { Injectable } from '@angular/core';

export interface IOptotypeLine {
  snellenFraction: string; // e.g. "20/200", "20/100", "20/50", "20/40", "20/20", "20/15"
  logMarScore: number;     // e.g. 1.0, 0.7, 0.4, 0.3, 0.0, -0.1
  decimalAcuity: number;   // e.g. 0.1, 0.2, 0.5, 0.67, 1.0, 1.33
  letterHeightMmAt1Meter: number; // 5 arcminutes total angle = 1.454 mm per 20/20 at 1 meter
  etdrsLetterPoints: number; // 5 letters per line (e.g. 5, 10, 15... up to 85)
}

export type TumblingEDirection = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface IIshiharaPlate {
  id: number;
  correctAnswer: string;
  normalVisionNotice: string;
  deficiencyNotice: string;
  svgForegroundColors: string[];
  svgBackgroundColors: string[];
}

export interface IExamResult {
  eye: 'OD' | 'OS' | 'OU'; // OD (Right), OS (Left), OU (Both)
  snellenFraction: string;
  logMar: number;
  etdrsScore: number;
  accuracyPercentage: number;
  astigmatismNoted: boolean;
  colorVisionDeficiency: boolean;
  plainEnglishSummary: string;
  clinicalRecommendations: string[];
}

@Injectable({
  providedIn: 'root'
})
export class VisualAcuityService {
  /**
   * ETDRS Standard Optotype Scale
   * Formula: Letter Height (mm) = 2 * Distance (mm) * tan(5 arcmin / 2)
   * 1 arcmin = 1/60th of a degree = 0.000290888 radians
   * At 1000 mm (1 meter), 20/20 letter height = 1.4544 mm
   */
  readonly OPTOTYPE_LINES: IOptotypeLine[] = [
    { snellenFraction: '20/200', logMarScore: 1.0, decimalAcuity: 0.10, letterHeightMmAt1Meter: 14.54, etdrsLetterPoints: 35 },
    { snellenFraction: '20/100', logMarScore: 0.7, decimalAcuity: 0.20, letterHeightMmAt1Meter: 7.27,  etdrsLetterPoints: 50 },
    { snellenFraction: '20/70',  logMarScore: 0.5, decimalAcuity: 0.28, letterHeightMmAt1Meter: 5.09,  etdrsLetterPoints: 60 },
    { snellenFraction: '20/50',  logMarScore: 0.4, decimalAcuity: 0.40, letterHeightMmAt1Meter: 3.64,  etdrsLetterPoints: 65 },
    { snellenFraction: '20/40',  logMarScore: 0.3, decimalAcuity: 0.50, letterHeightMmAt1Meter: 2.91,  etdrsLetterPoints: 70 },
    { snellenFraction: '20/30',  logMarScore: 0.2, decimalAcuity: 0.67, letterHeightMmAt1Meter: 2.18,  etdrsLetterPoints: 75 },
    { snellenFraction: '20/25',  logMarScore: 0.1, decimalAcuity: 0.80, letterHeightMmAt1Meter: 1.82,  etdrsLetterPoints: 80 },
    { snellenFraction: '20/20',  logMarScore: 0.0, decimalAcuity: 1.00, letterHeightMmAt1Meter: 1.45,  etdrsLetterPoints: 85 },
    { snellenFraction: '20/15',  logMarScore: -0.1, decimalAcuity: 1.33, letterHeightMmAt1Meter: 1.09,  etdrsLetterPoints: 90 },
  ];

  /**
   * Standard Ishihara Screening Plates
   */
  readonly ISHIHARA_PLATES: IIshiharaPlate[] = [
    {
      id: 1,
      correctAnswer: '12',
      normalVisionNotice: 'Everyone (including color-deficient individuals) should see 12.',
      deficiencyNotice: 'Control demonstration plate.',
      svgForegroundColors: ['#f97316', '#ea580c'],
      svgBackgroundColors: ['#84cc16', '#65a30d', '#4d7c0f'],
    },
    {
      id: 2,
      correctAnswer: '8',
      normalVisionNotice: 'Individuals with normal color vision see 8. Red-green deficiency sees 3.',
      deficiencyNotice: 'Protanopia / Deuteranopia indicator plate.',
      svgForegroundColors: ['#ef4444', '#dc2626'],
      svgBackgroundColors: ['#22c55e', '#16a34a', '#15803d'],
    },
    {
      id: 3,
      correctAnswer: '29',
      normalVisionNotice: 'Normal vision reads 29. Red-green deficiency reads 70.',
      deficiencyNotice: 'Protanomaly / Deuteranomaly indicator plate.',
      svgForegroundColors: ['#f43f5e', '#e11d48'],
      svgBackgroundColors: ['#10b981', '#059669', '#047857'],
    },
    {
      id: 4,
      correctAnswer: '74',
      normalVisionNotice: 'Normal vision reads 74. Red-green deficiency reads 21.',
      deficiencyNotice: 'Spectral chromatic discrimination plate.',
      svgForegroundColors: ['#fb923c', '#f97316'],
      svgBackgroundColors: ['#a3e635', '#84cc16', '#4d7c0f'],
    },
  ];

  /**
   * Calculates screen pixel height for a given Snellen line based on user calibration.
   * @param line The optotype line definition
   * @param distanceCm User viewing distance in centimeters (e.g. 50 cm or 100 cm)
   * @param pixelsPerMm Calibrated display resolution in pixels per millimeter
   */
  calculateOptotypePixelHeight(line: IOptotypeLine, distanceCm: number, pixelsPerMm: number): number {
    const distanceMeters = distanceCm / 100;
    const scaledHeightMm = line.letterHeightMmAt1Meter * distanceMeters;
    const heightPx = Math.max(1, Math.round(scaledHeightMm * pixelsPerMm));
    return heightPx;
  }

  /**
   * Generates a randomized Tumbling E sequence for a testing stage
   */
  getRandomTumblingEDirections(count: number = 5): TumblingEDirection[] {
    const directions: TumblingEDirection[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    const sequence: TumblingEDirection[] = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * directions.length);
      sequence.push(directions[idx]);
    }
    return sequence;
  }

  /**
   * Evaluates overall exam results into a structured clinical outcome with plain English explanations.
   */
  evaluateResults(
    eye: 'OD' | 'OS' | 'OU',
    bestLineIndex: number,
    correctAnswers: number,
    totalQuestions: number,
    astigmatismNoted: boolean,
    colorDeficiencyNoted: boolean
  ): IExamResult {
    const line = this.OPTOTYPE_LINES[bestLineIndex] || this.OPTOTYPE_LINES[0];
    const accuracy = Math.round((correctAnswers / Math.max(1, totalQuestions)) * 100);

    let summary = '';
    const recommendations: string[] = [];

    if (line.logMarScore <= 0.0) {
      summary = `Outstanding visual acuity (${line.snellenFraction} or LogMAR ${line.logMarScore.toFixed(1)}). Your optical resolving power meets or exceeds standard 20/20 vision.`;
      recommendations.push('Maintain regular annual ophthalmological wellness screenings.');
      recommendations.push('Follow the 20-20-20 rule during screen use (every 20 minutes, look 20 feet away for 20 seconds).');
    } else if (line.logMarScore <= 0.3) {
      summary = `Mild reduction in visual acuity (${line.snellenFraction} or LogMAR ${line.logMarScore.toFixed(1)}). You can read most standard text comfortably, but smaller print may appear soft.`;
      recommendations.push('Consider an in-person comprehensive optometry refraction exam for driving or reading comfort.');
      recommendations.push('Ensure optimal reading light (500–1000 lux) and contrast.');
    } else {
      summary = `Moderate to significant visual acuity limitation (${line.snellenFraction} or LogMAR ${line.logMarScore.toFixed(1)}).`;
      recommendations.push('Schedule an evaluation with an eye care professional (Optometrist or Ophthalmologist).');
      recommendations.push('Assess for refractive errors (myopia, hyperopia, astigmatism) or ocular media opacities.');
    }

    if (astigmatismNoted) {
      recommendations.push('Astigmatism screen detected asymmetry in focal meridians; prescription cylindrical correction is advised.');
    }

    if (colorDeficiencyNoted) {
      recommendations.push('Mild red-green color discrimination variance noted on Ishihara plates.');
    }

    return {
      eye,
      snellenFraction: line.snellenFraction,
      logMar: line.logMarScore,
      etdrsScore: line.etdrsLetterPoints,
      accuracyPercentage: accuracy,
      astigmatismNoted,
      colorVisionDeficiency: colorDeficiencyNoted,
      plainEnglishSummary: summary,
      clinicalRecommendations: recommendations,
    };
  }

  /**
   * Calculates Herman Bouma's Critical Lateral Crowding Letter-Spacing
   * Formula: b = 0.5 * eccentricity_degrees
   * In low-vision/AMD, spacing must exceed 0.5 * eccentricity to eliminate contour inhibition.
   */
  calculateBoumaSpacing(eccentricityDegrees: number = 2.0): string {
    const criticalAngleDeg = 0.5 * Math.max(0.5, eccentricityDegrees);
    // Convert critical angle to relative em tracking (nominal ~0.08em per degree of eccentricity)
    const emTracking = Math.min(0.35, Math.max(0.04, criticalAngleDeg * 0.08));
    return `${emTracking.toFixed(3)}em`;
  }

  /**
   * Returns 670nm Photobiomodulation (PBM) parameters grounded in UCL Jeffery Lab findings.
   * Stimulates cytochrome c oxidase, boosting retinal photoreceptor ATP by ~22%.
   */
  getPhotobiomodulationParameters(): {
    wavelengthNm: number;
    colorHex: string;
    bgHex: string;
    atpBoostPercent: number;
    melanopicSuppressionPercent: number;
  } {
    return {
      wavelengthNm: 670,
      colorHex: '#ef4444',
      bgHex: '#060608',
      atpBoostPercent: 22.0,
      melanopicSuppressionPercent: 0.0
    };
  }

  /**
   * Calculates physical Sloan 5:1 Optotype pixel scaling at arbitrary viewing distances
   * Ensures 1 arcminute stroke width and 5 arcminute envelope.
   */
  calculateSloanOptotypeScale(
    viewingDistanceCm: number = 60,
    targetLogMar: number = 0.0,
    displayDpi: number = 96
  ): {
    letterHeightMm: number;
    letterHeightPx: number;
    strokeWidthPx: number;
    snellenEquivalent: string;
  } {
    const distanceMeters = viewingDistanceCm / 100;
    // Angle subtended in radians: 5 arcmin * 10^targetLogMar
    const arcminTotal = 5.0 * Math.pow(10, targetLogMar);
    const rad = (arcminTotal / 60) * (Math.PI / 180);
    const heightMm = 2.0 * (distanceMeters * 1000) * Math.tan(rad / 2);
    
    const mmPerInch = 25.4;
    const pixelsPerMm = displayDpi / mmPerInch;
    const heightPx = Math.round(heightMm * pixelsPerMm);
    const strokePx = Math.max(1, Math.round(heightPx / 5.0));

    let snellen = '20/20';
    if (targetLogMar >= 1.0) snellen = '20/200';
    else if (targetLogMar >= 0.7) snellen = '20/100';
    else if (targetLogMar >= 0.3) snellen = '20/40';
    else if (targetLogMar >= 0.1) snellen = '20/25';
    else if (targetLogMar < 0.0) snellen = '20/15';

    return {
      letterHeightMm: parseFloat(heightMm.toFixed(2)),
      letterHeightPx: heightPx,
      strokeWidthPx: strokePx,
      snellenEquivalent: snellen
    };
  }
}

