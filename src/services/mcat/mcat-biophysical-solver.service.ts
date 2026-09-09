import { Injectable } from '@angular/core';

export interface IPoiseuilleResult {
  pressureDropPa: number;
  flowRateM3S: number;
  flowRateMlMin: number;
  vascularResistancePaSM3: number;
  radiusMeters: number;
  radiusFoldChangeImpact: {
    radiusChangeRatio: number;
    resistanceChangeFold: number;
    summary: string;
  };
}

export interface INernstResult {
  standardPotentialVolts: number;
  cellPotentialVolts: number;
  electronsTransferred: number;
  reactionQuotientQ: number;
  temperatureKelvin: number;
  deltaGStandardJoules: number;
  deltaGStandardKcal: number;
  isSpontaneousStandard: boolean;
  isSpontaneousCell: boolean;
  equilibriumConstantKeq: number;
}

export interface IThinLensResult {
  focalLengthCm: number;
  objectDistanceCm: number;
  imageDistanceCm: number;
  magnification: number;
  lensPowerDiopters: number;
  imageType: 'REAL' | 'VIRTUAL';
  orientation: 'INVERTED' | 'UPRIGHT';
  relativeSize: 'ENLARGED' | 'REDUCED' | 'SAME_SIZE';
  lensType: 'CONVERGING' | 'DIVERGING';
}

export interface IDopplerResult {
  sourceFrequencyHz: number;
  observedFrequencyHz: number;
  frequencyShiftHz: number;
  isShiftHigherPitch: boolean;
  speedOfSoundMS: number;
}

export interface IAminoAcidPiResult {
  aminoAcidName: string;
  threeLetter: string;
  oneLetter: string;
  classification: 'NONPOLAR' | 'POLAR_UNCHARGED' | 'ACIDIC' | 'BASIC';
  pk1Carboxyl: number;
  pk2Amino: number;
  pkR_SideChain?: number;
  isoelectricPointPi: number;
  netChargeAtPh7: number;
  formulaDescription: string;
}

const AMINO_ACID_PK_DATA: Record<string, {
  name: string;
  three: string;
  one: string;
  class: 'NONPOLAR' | 'POLAR_UNCHARGED' | 'ACIDIC' | 'BASIC';
  pk1: number;
  pk2: number;
  pkr?: number;
}> = {
  GLY: { name: 'Glycine', three: 'Gly', one: 'G', class: 'NONPOLAR', pk1: 2.34, pk2: 9.60 },
  ALA: { name: 'Alanine', three: 'Ala', one: 'A', class: 'NONPOLAR', pk1: 2.34, pk2: 9.69 },
  VAL: { name: 'Valine', three: 'Val', one: 'V', class: 'NONPOLAR', pk1: 2.32, pk2: 9.62 },
  LEU: { name: 'Leucine', three: 'Leu', one: 'L', class: 'NONPOLAR', pk1: 2.36, pk2: 9.60 },
  ILE: { name: 'Isoleucine', three: 'Ile', one: 'I', class: 'NONPOLAR', pk1: 2.36, pk2: 9.68 },
  MET: { name: 'Methionine', three: 'Met', one: 'M', class: 'NONPOLAR', pk1: 2.28, pk2: 9.21 },
  PHE: { name: 'Phenylalanine', three: 'Phe', one: 'F', class: 'NONPOLAR', pk1: 1.83, pk2: 9.13 },
  TRP: { name: 'Tryptophan', three: 'Trp', one: 'W', class: 'NONPOLAR', pk1: 2.38, pk2: 9.39 },
  PRO: { name: 'Proline', three: 'Pro', one: 'P', class: 'NONPOLAR', pk1: 1.99, pk2: 10.60 },
  SER: { name: 'Serine', three: 'Ser', one: 'S', class: 'POLAR_UNCHARGED', pk1: 2.21, pk2: 9.15 },
  THR: { name: 'Threonine', three: 'Thr', one: 'T', class: 'POLAR_UNCHARGED', pk1: 2.11, pk2: 9.62 },
  CYS: { name: 'Cysteine', three: 'Cys', one: 'C', class: 'POLAR_UNCHARGED', pk1: 1.96, pk2: 10.28, pkr: 8.33 },
  TYR: { name: 'Tyrosine', three: 'Tyr', one: 'Y', class: 'POLAR_UNCHARGED', pk1: 2.20, pk2: 9.11, pkr: 10.07 },
  ASN: { name: 'Asparagine', three: 'Asn', one: 'N', class: 'POLAR_UNCHARGED', pk1: 2.02, pk2: 8.80 },
  GLN: { name: 'Glutamine', three: 'Gln', one: 'Q', class: 'POLAR_UNCHARGED', pk1: 2.17, pk2: 9.13 },
  ASP: { name: 'Aspartic Acid', three: 'Asp', one: 'D', class: 'ACIDIC', pk1: 1.88, pk2: 9.60, pkr: 3.65 },
  GLU: { name: 'Glutamic Acid', three: 'Glu', one: 'E', class: 'ACIDIC', pk1: 2.19, pk2: 9.67, pkr: 4.25 },
  HIS: { name: 'Histidine', three: 'His', one: 'H', class: 'BASIC', pk1: 1.82, pk2: 9.17, pkr: 6.00 },
  LYS: { name: 'Lysine', three: 'Lys', one: 'K', class: 'BASIC', pk1: 2.18, pk2: 8.95, pkr: 10.53 },
  ARG: { name: 'Arginine', three: 'Arg', one: 'R', class: 'BASIC', pk1: 2.17, pk2: 9.04, pkr: 12.48 }
};

@Injectable({
  providedIn: 'root'
})
export class McatBiophysicalSolverService {
  private readonly R_GAS_CONSTANT = 8.31446; // J/(mol*K)
  private readonly FARADAY_CONSTANT = 96485.3; // C/mol

  /**
   * Fluid Mechanics: Poiseuille Flow & Vascular Resistance
   * ΔP = (8 * η * L * Q) / (π * r^4)
   * R_vasc = (8 * η * L) / (π * r^4)
   */
  public calculatePoiseuille(
    viscosityPaS: number,
    lengthMeters: number,
    radiusMeters: number,
    flowRateMlMin?: number,
    pressureDropPa?: number
  ): IPoiseuilleResult {
    if (radiusMeters <= 0) throw new Error('Radius must be greater than zero.');
    const r4 = Math.pow(radiusMeters, 4);
    const resistance = (8 * viscosityPaS * lengthMeters) / (Math.PI * r4);

    let qM3S: number;
    let deltaP: number;

    if (flowRateMlMin !== undefined) {
      qM3S = (flowRateMlMin * 1e-6) / 60;
      deltaP = qM3S * resistance;
    } else if (pressureDropPa !== undefined) {
      deltaP = pressureDropPa;
      qM3S = deltaP / resistance;
    } else {
      // Default: 100 mmHg ~ 13332 Pa
      deltaP = 13332;
      qM3S = deltaP / resistance;
    }

    const calculatedMlMin = qM3S * 1e6 * 60;

    // Resistance scaling example: 50% radius reduction (stenosis) increases resistance by (1/0.5)^4 = 16-fold
    const foldChange = Math.pow(1 / 0.5, 4);

    return {
      pressureDropPa: Math.round(deltaP * 100) / 100,
      flowRateM3S: qM3S,
      flowRateMlMin: Math.round(calculatedMlMin * 100) / 100,
      vascularResistancePaSM3: Math.round(resistance),
      radiusMeters,
      radiusFoldChangeImpact: {
        radiusChangeRatio: 0.5,
        resistanceChangeFold: foldChange,
        summary: `A 50% reduction in vessel radius (r / 2) increases vascular resistance by a factor of 2^4 = 16x under Poiseuille's 4th-power relationship.`
      }
    };
  }

  /**
   * Continuity Equation: A1 * v1 = A2 * v2
   */
  public calculateContinuity(area1M2: number, velocity1MS: number, area2M2: number): number {
    if (area2M2 <= 0) throw new Error('Area 2 must be greater than zero.');
    return (area1M2 * velocity1MS) / area2M2;
  }

  /**
   * Reynolds Number: Re = (ρ * v * D) / η
   * Re < 2000: Laminar flow
   * Re > 3000: Turbulent flow
   */
  public calculateReynoldsNumber(
    densityKgM3: number,
    velocityMS: number,
    diameterM: number,
    viscosityPaS: number
  ): { reynoldsNumber: number; flowRegime: 'LAMINAR' | 'TRANSITIONAL' | 'TURBULENT' } {
    const re = (densityKgM3 * velocityMS * diameterM) / viscosityPaS;
    let regime: 'LAMINAR' | 'TRANSITIONAL' | 'TURBULENT' = 'TRANSITIONAL';
    if (re < 2000) regime = 'LAMINAR';
    else if (re > 3000) regime = 'TURBULENT';

    return {
      reynoldsNumber: Math.round(re),
      flowRegime: regime
    };
  }

  /**
   * Electrochemistry: Nernst Equation & Gibbs Free Energy
   * E_cell = E° - (RT / nF) * ln(Q)
   * ΔG° = -n * F * E°
   * Keq = exp(n * F * E° / (R * T))
   */
  public calculateNernst(
    standardPotentialVolts: number,
    electronsTransferred: number,
    reactionQuotientQ: number,
    temperatureKelvin: number = 298.15
  ): INernstResult {
    if (electronsTransferred <= 0) throw new Error('Electrons transferred must be positive integer.');
    if (reactionQuotientQ <= 0) throw new Error('Reaction quotient Q must be positive.');

    const rt_nf = (this.R_GAS_CONSTANT * temperatureKelvin) / (electronsTransferred * this.FARADAY_CONSTANT);
    const cellPotential = standardPotentialVolts - rt_nf * Math.log(reactionQuotientQ);

    const deltaGStdJoules = -electronsTransferred * this.FARADAY_CONSTANT * standardPotentialVolts;
    const deltaGStdKcal = deltaGStdJoules / 4184;

    const exponent = (electronsTransferred * this.FARADAY_CONSTANT * standardPotentialVolts) / (this.R_GAS_CONSTANT * temperatureKelvin);
    const keq = Math.exp(Math.min(exponent, 700)); // Cap to prevent Infinity overflow

    return {
      standardPotentialVolts: Math.round(standardPotentialVolts * 1000) / 1000,
      cellPotentialVolts: Math.round(cellPotential * 1000) / 1000,
      electronsTransferred,
      reactionQuotientQ,
      temperatureKelvin,
      deltaGStandardJoules: Math.round(deltaGStdJoules),
      deltaGStandardKcal: Math.round(deltaGStdKcal * 100) / 100,
      isSpontaneousStandard: standardPotentialVolts > 0,
      isSpontaneousCell: cellPotential > 0,
      equilibriumConstantKeq: keq
    };
  }

  /**
   * Optics: Thin-Lens Equation & Magnification
   * 1/f = 1/do + 1/di
   * m = -di / do
   * Power (diopters) = 1 / f(m) = 100 / f(cm)
   */
  public calculateThinLens(
    focalLengthCm: number,
    objectDistanceCm: number
  ): IThinLensResult {
    if (objectDistanceCm <= 0) throw new Error('Object distance must be positive for standard single-lens problems.');
    if (focalLengthCm === objectDistanceCm) {
      throw new Error('Object is placed exactly at focal point; image forms at infinity (no focused image).');
    }

    // 1/di = 1/f - 1/do = (do - f) / (f * do) -> di = (f * do) / (do - f)
    const di = (focalLengthCm * objectDistanceCm) / (objectDistanceCm - focalLengthCm);
    const m = -di / objectDistanceCm;
    const power = 100 / focalLengthCm;

    const isReal = di > 0;
    const isUpright = m > 0;
    const absM = Math.abs(m);
    let size: 'ENLARGED' | 'REDUCED' | 'SAME_SIZE' = 'SAME_SIZE';
    if (absM > 1.005) size = 'ENLARGED';
    else if (absM < 0.995) size = 'REDUCED';

    return {
      focalLengthCm: Math.round(focalLengthCm * 100) / 100,
      objectDistanceCm: Math.round(objectDistanceCm * 100) / 100,
      imageDistanceCm: Math.round(di * 100) / 100,
      magnification: Math.round(m * 100) / 100,
      lensPowerDiopters: Math.round(power * 100) / 100,
      imageType: isReal ? 'REAL' : 'VIRTUAL',
      orientation: isUpright ? 'UPRIGHT' : 'INVERTED',
      relativeSize: size,
      lensType: focalLengthCm > 0 ? 'CONVERGING' : 'DIVERGING'
    };
  }

  /**
   * Wave Physics: Doppler Effect
   * f' = f * ((v ± vD) / (v ∓ vS))
   */
  public calculateDoppler(
    sourceFreqHz: number,
    speedOfSoundMS: number,
    sourceVelocityMS: number,
    detectorVelocityMS: number,
    sourceApproaching: boolean,
    detectorApproaching: boolean
  ): IDopplerResult {
    const numerator = speedOfSoundMS + (detectorApproaching ? detectorVelocityMS : -detectorVelocityMS);
    const denominator = speedOfSoundMS - (sourceApproaching ? sourceVelocityMS : -sourceVelocityMS);

    if (denominator <= 0) {
      throw new Error('Source velocity equals or exceeds speed of sound (sonic shockwave).');
    }

    const observed = sourceFreqHz * (numerator / denominator);

    return {
      sourceFrequencyHz: sourceFreqHz,
      observedFrequencyHz: Math.round(observed * 10) / 10,
      frequencyShiftHz: Math.round((observed - sourceFreqHz) * 10) / 10,
      isShiftHigherPitch: observed > sourceFreqHz,
      speedOfSoundMS
    };
  }

  /**
   * Acid-Base Equilibria: Henderson-Hasselbalch Equation
   * pH = pKa + log10([A-] / [HA])
   */
  public calculateHendersonHasselbalch(
    pKa: number,
    conjugateBaseMolarity: number,
    weakAcidMolarity: number
  ): { pH: number; ratio: number; bufferCapacityQualitative: string } {
    if (conjugateBaseMolarity <= 0 || weakAcidMolarity <= 0) {
      throw new Error('Molar concentrations must be positive non-zero.');
    }
    const ratio = conjugateBaseMolarity / weakAcidMolarity;
    const pH = pKa + Math.log10(ratio);

    let capacity = 'Effective buffer region (pH within pKa ± 1)';
    if (Math.abs(pH - pKa) > 1.0) {
      capacity = 'Exceeds standard buffer range (outside pKa ± 1.0). Buffer capacity is low.';
    }

    return {
      pH: Math.round(pH * 100) / 100,
      ratio: Math.round(ratio * 1000) / 1000,
      bufferCapacityQualitative: capacity
    };
  }

  /**
   * Isoelectric Point (pI) Calculation for Standard Amino Acids
   */
  public calculateAminoAcidPi(aminoCodeOrName: string): IAminoAcidPiResult {
    const key = aminoCodeOrName.trim().toUpperCase();
    let data = AMINO_ACID_PK_DATA[key];

    if (!data) {
      const found = Object.values(AMINO_ACID_PK_DATA).find(
        a => a.name.toUpperCase() === key || a.one.toUpperCase() === key
      );
      if (found) data = found;
    }

    if (!data) {
      throw new Error(`Unrecognized amino acid code or name: ${aminoCodeOrName}`);
    }

    let pi: number;
    let formula: string;

    if (data.class === 'ACIDIC') {
      // Asp, Glu: average of pk1 (carboxyl) and pkR (side chain)
      pi = (data.pk1 + data.pkr!) / 2;
      formula = `pI = (pK1 + pKR) / 2 = (${data.pk1} + ${data.pkr}) / 2`;
    } else if (data.class === 'BASIC') {
      // His, Lys, Arg: average of pkR and pk2 (amino)
      pi = (data.pkr! + data.pk2) / 2;
      formula = `pI = (pKR + pK2) / 2 = (${data.pkr} + ${data.pk2}) / 2`;
    } else if (data.three === 'Cys' || data.three === 'Tyr') {
      // For ionizable uncharged polar: standard pI is neutral (pk1 + pk2)/2
      pi = (data.pk1 + data.pk2) / 2;
      formula = `pI = (pK1 + pK2) / 2 = (${data.pk1} + ${data.pk2}) / 2 (neutral at physiological pH)`;
    } else {
      // Standard neutral amino acids: (pk1 + pk2) / 2
      pi = (data.pk1 + data.pk2) / 2;
      formula = `pI = (pK1 + pK2) / 2 = (${data.pk1} + ${data.pk2}) / 2`;
    }

    // Net charge at physiological pH 7.4
    let netCharge = 0;
    // Carboxyl: pH 7.4 >> pk1 (~2.0) -> fully deprotonated (-1)
    netCharge -= 1;
    // Amino: pH 7.4 << pk2 (~9.5) -> fully protonated (+1)
    netCharge += 1;
    // Side chain:
    if (data.class === 'ACIDIC') {
      // Asp/Glu pkR (~4.0) << 7.4 -> deprotonated (-1)
      netCharge -= 1;
    } else if (data.class === 'BASIC') {
      if (data.three === 'Lys' || data.three === 'Arg') {
        // Lys (10.5) / Arg (12.5) >> 7.4 -> protonated (+1)
        netCharge += 1;
      } else if (data.three === 'His') {
        // His (6.0) < 7.4 -> mostly neutral (~0)
        netCharge += 0;
      }
    }

    return {
      aminoAcidName: data.name,
      threeLetter: data.three,
      oneLetter: data.one,
      classification: data.class,
      pk1Carboxyl: data.pk1,
      pk2Amino: data.pk2,
      pkR_SideChain: data.pkr,
      isoelectricPointPi: Math.round((pi + 0.00001) * 100) / 100,
      netChargeAtPh7: netCharge,
      formulaDescription: formula
    };
  }
}
