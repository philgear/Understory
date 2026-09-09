import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { McatBiophysicalSolverService } from './mcat-biophysical-solver.service';

describe('McatBiophysicalSolverService', () => {
  let service: McatBiophysicalSolverService;

  beforeEach(() => {
    service = new McatBiophysicalSolverService();
  });

  it('1. should initialize the solver service', () => {
    expect(service).toBeTruthy();
  });

  it('2. should calculate Poiseuille vascular resistance and 16-fold resistance upon 50% stenosis', () => {
    // Vessel: Blood viscosity ~0.0035 Pa*s, length 0.1 m, radius 0.002 m (2 mm)
    const result = service.calculatePoiseuille(0.0035, 0.1, 0.002, 100);
    expect(result.pressureDropPa).toBeGreaterThan(0);
    expect(result.vascularResistancePaSM3).toBeGreaterThan(0);
    expect(result.radiusFoldChangeImpact.resistanceChangeFold).toBe(16);
    expect(result.radiusFoldChangeImpact.summary).toContain('2^4 = 16x');

    // Error on negative or zero radius
    expect(() => service.calculatePoiseuille(0.0035, 0.1, 0)).toThrow();
  });

  it('3. should solve continuity equation and Reynolds flow regime', () => {
    // Continuity: A1=10 cm^2, v1=2 m/s, A2=2 cm^2 -> v2 = (10 * 2)/2 = 10 m/s
    const v2 = service.calculateContinuity(10, 2, 2);
    expect(v2).toBe(10);

    // Reynolds number for laminar blood flow in aorta vs turbulent flow
    const laminar = service.calculateReynoldsNumber(1060, 0.3, 0.02, 0.0035);
    expect(laminar.reynoldsNumber).toBe(1817);
    expect(laminar.flowRegime).toBe('LAMINAR');

    const turbulent = service.calculateReynoldsNumber(1060, 1.2, 0.02, 0.0035);
    expect(turbulent.reynoldsNumber).toBe(7269);
    expect(turbulent.flowRegime).toBe('TURBULENT');
  });

  it('4. should calculate Nernst cell potentials and standard Gibbs free energy', () => {
    // Galvanic cell: E° = +1.10 V (Daniell Cell Zn/Cu, n = 2)
    // Q = 1.0 -> E = 1.10 V
    const nernstQ1 = service.calculateNernst(1.10, 2, 1.0);
    expect(nernstQ1.cellPotentialVolts).toBe(1.10);
    expect(nernstQ1.isSpontaneousCell).toBe(true);
    // ΔG° = -2 * 96485.3 * 1.10 = -212,268 J = -50.7 kcal
    expect(nernstQ1.deltaGStandardJoules).toBeLessThan(-200000);
    expect(nernstQ1.deltaGStandardKcal).toBeLessThan(-50);

    // Q = 100 -> E = 1.10 - (0.0592 / 2) * log10(100) = 1.10 - 0.0592 = 1.041 V
    const nernstQ100 = service.calculateNernst(1.10, 2, 100);
    expect(nernstQ100.cellPotentialVolts).toBeLessThan(1.10);
    expect(nernstQ100.cellPotentialVolts).toBeGreaterThan(1.03);
  });

  it('5. should calculate Thin-Lens real inverted vs virtual upright images and diopter power', () => {
    // Converging lens (f = +10 cm), object placed at do = 30 cm (beyond 2f)
    // 1/di = 1/10 - 1/30 = 2/30 -> di = 15 cm
    // m = -15/30 = -0.5 (real, inverted, reduced)
    const convergingReal = service.calculateThinLens(10, 30);
    expect(convergingReal.imageDistanceCm).toBe(15);
    expect(convergingReal.magnification).toBe(-0.5);
    expect(convergingReal.imageType).toBe('REAL');
    expect(convergingReal.orientation).toBe('INVERTED');
    expect(convergingReal.relativeSize).toBe('REDUCED');
    expect(convergingReal.lensPowerDiopters).toBe(10); // 100 / 10 = +10 D

    // Magnifying glass: object placed within focal length (do = 5 cm, f = 10 cm)
    // 1/di = 1/10 - 1/5 = -1/10 -> di = -10 cm (virtual, upright, enlarged)
    const magnifying = service.calculateThinLens(10, 5);
    expect(magnifying.imageDistanceCm).toBe(-10);
    expect(magnifying.magnification).toBe(2);
    expect(magnifying.imageType).toBe('VIRTUAL');
    expect(magnifying.orientation).toBe('UPRIGHT');
    expect(magnifying.relativeSize).toBe('ENLARGED');
  });

  it('6. should solve Doppler frequency shift for moving ambulance and observer', () => {
    // Ambulance 700 Hz siren moving toward stationary observer at 30 m/s (v_sound = 343 m/s)
    const doppler = service.calculateDoppler(700, 343, 30, 0, true, false);
    expect(doppler.observedFrequencyHz).toBeGreaterThan(700);
    expect(doppler.isShiftHigherPitch).toBe(true);
    expect(doppler.observedFrequencyHz).toBe(767.1);
  });

  it('7. should solve Henderson-Hasselbalch buffer pH and amino acid pI across neutral, acidic, and basic groups', () => {
    // Acetic acid buffer (pKa = 4.76, [A-] = 0.2 M, [HA] = 0.1 M)
    // pH = 4.76 + log10(2) = 4.76 + 0.301 = 5.06
    const buffer = service.calculateHendersonHasselbalch(4.76, 0.2, 0.1);
    expect(buffer.pH).toBe(5.06);
    expect(buffer.bufferCapacityQualitative).toContain('Effective buffer region');

    // Neutral amino acid: Alanine (pK1 = 2.34, pK2 = 9.69) -> pI = (2.34 + 9.69) / 2 = 6.015 ~ 6.02
    const ala = service.calculateAminoAcidPi('ALA');
    expect(ala.isoelectricPointPi).toBe(6.02);
    expect(ala.netChargeAtPh7).toBe(0);

    // Acidic amino acid: Aspartate (pK1 = 1.88, pKR = 3.65, pK2 = 9.60) -> pI = (1.88 + 3.65) / 2 = 2.765 ~ 2.77
    const asp = service.calculateAminoAcidPi('ASP');
    expect(asp.isoelectricPointPi).toBe(2.77);
    expect(asp.netChargeAtPh7).toBe(-1);

    // Basic amino acid: Lysine (pK1 = 2.18, pK2 = 8.95, pKR = 10.53) -> pI = (8.95 + 10.53) / 2 = 9.74
    const lys = service.calculateAminoAcidPi('Lysine');
    expect(lys.isoelectricPointPi).toBe(9.74);
    expect(lys.netChargeAtPh7).toBe(+1);
  });
});
