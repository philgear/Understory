import { Injectable } from '@angular/core';

export type InhibitionType = 'COMPETITIVE' | 'UNCOMPETITIVE' | 'NONCOMPETITIVE_PURE' | 'MIXED';

export interface ISubunitDef {
  name: string;
  weightKDa: number;
  count: number;
}

export interface IProteinConstruct {
  name: string;
  subunits: ISubunitDef[];
  linkedByDisulfideBonds: boolean;
}

export interface ISdsPageSimResult {
  proteinName: string;
  nonReducingBandsKDa: number[];
  reducingBandsKDa: number[];
  totalIntactKDa: number;
  reducingSummary: string;
  nonReducingSummary: string;
  aamcClinicalRelevance: string;
}

export interface ILineweaverBurkLine {
  slope: number;        // Km / Vmax
  yIntercept: number;   // 1 / Vmax
  xIntercept: number;   // -1 / Km
}

export interface IEnzymeKineticsResult {
  uninhibited: {
    vMax: number;
    kmUm: number;
    kCatS1?: number;
    catalyticEfficiencyM1S1?: number;
    lineweaverBurk: ILineweaverBurkLine;
  };
  inhibited?: {
    type: InhibitionType;
    apparentVMax: number;
    apparentKmUm: number;
    lineweaverBurk: ILineweaverBurkLine;
    intersectionPattern: 'Y_AXIS' | 'PARALLEL_NO_INTERSECTION' | 'X_AXIS' | 'QUADRANT_2';
    aamcRule: string;
  };
}

export interface IMutationAnalysisResult {
  wildType: string;
  mutant: string;
  position: number;
  mutationCode: string;
  substitutionType: 'CONSERVATIVE' | 'CHARGE_INVERSION' | 'CHARGE_TO_NEUTRAL' | 'PHOSPHOMIMETIC' | 'PHOSPHO_DEAD' | 'AROMATIC_DISRUPTION';
  predictedFunctionalImpact: string;
  isoelectricShift: 'MORE_BASIC' | 'MORE_ACIDIC' | 'NEUTRAL';
}

@Injectable({
  providedIn: 'root'
})
export class McatBiochemicalAssayService {
  /**
   * SDS-PAGE & Western Blot Migration Simulator
   * Distinguishes reducing (with β-ME/DTT) vs non-reducing (native disulfide intact) conditions
   */
  public simulateSdsPage(protein: IProteinConstruct): ISdsPageSimResult {
    let totalIntact = 0;
    const individualSubunitWeights: number[] = [];

    for (const sub of protein.subunits) {
      totalIntact += sub.weightKDa * sub.count;
      if (!individualSubunitWeights.includes(sub.weightKDa)) {
        individualSubunitWeights.push(sub.weightKDa);
      }
    }
    individualSubunitWeights.sort((a, b) => b - a);

    let nonReducing: number[];
    let nonRedSummary: string;

    if (protein.linkedByDisulfideBonds) {
      // In non-reducing SDS-PAGE, disulfides remain intact: complex migrates as intact oligomer
      nonReducing = [totalIntact];
      nonRedSummary = `Non-reducing SDS-PAGE: Disulfide bridges remain INTACT. The complex migrates as a single intact ${totalIntact} kDa band.`;
    } else {
      // Non-covalently linked subunits dissociate in SDS alone (SDS disrupts hydrophobic/ionic bonds)
      nonReducing = [...individualSubunitWeights];
      nonRedSummary = `Non-reducing SDS-PAGE: Subunits are held by NON-COVALENT interactions (no inter-chain disulfides). SDS detergent denatures quaternary structure into separate bands: ${individualSubunitWeights.join(', ')} kDa.`;
    }

    // In reducing SDS-PAGE (with β-ME or DTT), disulfides are cleaved
    const reducing = [...individualSubunitWeights];
    const redSummary = `Reducing SDS-PAGE (+β-mercaptoethanol / DTT): All interchain disulfide bonds are cleaved. Subunits separate according to individual chain molecular weights: ${individualSubunitWeights.join(', ')} kDa.`;

    const aamcNote = `Classic AAMC Antibody / Multimer Trap: An intact IgG antibody (150 kDa) running on non-reducing SDS-PAGE shows a SINGLE 150 kDa band. On reducing SDS-PAGE (+β-ME), it cleaves into TWO bands: Heavy Chains (50 kDa) and Light Chains (25 kDa).`;

    return {
      proteinName: protein.name,
      nonReducingBandsKDa: nonReducing,
      reducingBandsKDa: reducing,
      totalIntactKDa: totalIntact,
      nonReducingSummary: nonRedSummary,
      reducingSummary: redSummary,
      aamcClinicalRelevance: aamcNote
    };
  }

  /**
   * Enzyme Kinetics: Michaelis-Menten & Lineweaver-Burk Inhibition Modalities
   */
  public evaluateKinetics(
    vMax: number,
    kmUm: number,
    enzymeTotalNm?: number,
    inhibition?: {
      type: InhibitionType;
      alpha?: number;   // competitive multiplier on Km
      alphaPrime?: number; // uncompetitive divisor on Vmax and Km
    }
  ): IEnzymeKineticsResult {
    if (vMax <= 0 || kmUm <= 0) {
      throw new Error('Vmax and Km must be positive numbers.');
    }

    let kCat: number | undefined = undefined;
    let catalyticEff: number | undefined = undefined;

    if (enzymeTotalNm && enzymeTotalNm > 0) {
      // Vmax = kCat * [E]T -> kCat = Vmax (umol/min / L = uM/min = 1e-6 M/s)
      // kCat in s^-1 = (Vmax in uM/s) / (Et in uM)
      const vMax_uM_per_s = vMax; // assuming vMax is in uM/s
      const eT_uM = enzymeTotalNm / 1000;
      kCat = vMax_uM_per_s / eT_uM;
      // Catalytic efficiency = kCat / Km (M^-1 * s^-1)
      const km_M = kmUm * 1e-6;
      catalyticEff = kCat / km_M;
    }

    const uninhibitedLB: ILineweaverBurkLine = {
      slope: kmUm / vMax,
      yIntercept: 1 / vMax,
      xIntercept: -1 / kmUm
    };

    let inhibitedResult: IEnzymeKineticsResult['inhibited'] = undefined;

    if (inhibition) {
      const alpha = inhibition.alpha || 2.0;
      const alphaPrime = inhibition.alphaPrime || 2.0;

      let appVmax = vMax;
      let appKm = kmUm;
      let pattern: 'Y_AXIS' | 'PARALLEL_NO_INTERSECTION' | 'X_AXIS' | 'QUADRANT_2' = 'Y_AXIS';
      let rule = '';

      switch (inhibition.type) {
        case 'COMPETITIVE':
          // Km increases by alpha; Vmax unchanged
          appKm = kmUm * alpha;
          appVmax = vMax;
          pattern = 'Y_AXIS';
          rule = 'Competitive Inhibition: Inhibitor binds active site (competes with substrate). Km INCREASES (apparent affinity decreases), Vmax is UNCHANGED. High [S] outcompetes inhibitor. Lineweaver-Burk plots cross directly on the Y-AXIS (1/Vmax is identical).';
          break;

        case 'UNCOMPETITIVE':
          // Both Vmax and Km decrease by alphaPrime
          appVmax = vMax / alphaPrime;
          appKm = kmUm / alphaPrime;
          pattern = 'PARALLEL_NO_INTERSECTION';
          rule = 'Uncompetitive Inhibition: Inhibitor binds EXCLUSIVELY to the Enzyme-Substrate (ES) complex. Both Vmax and Km DECREASE by the exact same factor. Lineweaver-Burk slopes (Km/Vmax) are IDENTICAL, producing PARALLEL lines that never intersect.';
          break;

        case 'NONCOMPETITIVE_PURE':
          // Vmax decreases by alpha; Km unchanged (equal affinity for E and ES)
          appVmax = vMax / alpha;
          appKm = kmUm;
          pattern = 'X_AXIS';
          rule = 'Pure Non-Competitive Inhibition: Inhibitor binds allosteric site with EQUAL affinity for free E and ES complex (alpha = alphaPrime). Vmax DECREASES, Km is UNCHANGED. Lineweaver-Burk plots intersect on the X-AXIS (-1/Km is identical).';
          break;

        case 'MIXED':
          // Vmax decreases; Km either increases or decreases depending on whether inhibitor prefers free E or ES
          appVmax = vMax / alphaPrime;
          appKm = (kmUm * alpha) / alphaPrime;
          pattern = 'QUADRANT_2';
          rule = 'Mixed Inhibition: Inhibitor binds allosteric site with UNEQUAL affinity for E and ES. Vmax always DECREASES. If inhibitor prefers free E (alpha > alphaPrime), Km increases. Lines intersect in Quadrant 2 (above negative x-axis).';
          break;
      }

      inhibitedResult = {
        type: inhibition.type,
        apparentVMax: Math.round(appVmax * 100) / 100,
        apparentKmUm: Math.round(appKm * 100) / 100,
        lineweaverBurk: {
          slope: appKm / appVmax,
          yIntercept: 1 / appVmax,
          xIntercept: -1 / appKm
        },
        intersectionPattern: pattern,
        aamcRule: rule
      };
    }

    return {
      uninhibited: {
        vMax: Math.round(vMax * 100) / 100,
        kmUm: Math.round(kmUm * 100) / 100,
        kCatS1: kCat ? Math.round(kCat * 10) / 10 : undefined,
        catalyticEfficiencyM1S1: catalyticEff ? Math.round(catalyticEff) : undefined,
        lineweaverBurk: uninhibitedLB
      },
      inhibited: inhibitedResult
    };
  }

  /**
   * Mutational Construct Analysis Tracker
   * Evaluates point mutations (conservative, charge changes, phosphomimetics, phospho-dead)
   */
  public evaluatePointMutation(
    wildTypeResidue: string,
    position: number,
    mutantResidue: string
  ): IMutationAnalysisResult {
    const wt = wildTypeResidue.trim().toUpperCase();
    const mut = mutantResidue.trim().toUpperCase();
    const code = `${wt}${position}${mut}`;

    let subType: IMutationAnalysisResult['substitutionType'] = 'CONSERVATIVE';
    let impact = '';
    let shift: IMutationAnalysisResult['isoelectricShift'] = 'NEUTRAL';

    // Phosphorylation checks (Ser/Thr/Tyr)
    if (['S', 'SER', 'T', 'THR', 'Y', 'TYR'].includes(wt)) {
      if (['D', 'ASP', 'E', 'GLU'].includes(mut)) {
        subType = 'PHOSPHOMIMETIC';
        impact = `Phosphomimetic substitution: Replacing ${wt} with negative carboxylate (${mut}) structurally mimics constitutive phosphorylation, keeping the enzyme in a permanently active or locked state.`;
        shift = 'MORE_ACIDIC';
      } else if (['A', 'ALA', 'F', 'PHE'].includes(mut)) {
        subType = 'PHOSPHO_DEAD';
        impact = `Phospho-dead substitution: ${wt} is replaced with un-phosphorylatable neutral residue (${mut}), completely abolishing regulation by kinases.`;
        shift = 'NEUTRAL';
      }
    }

    // Catalytic triad / charge change checks
    if (['D', 'ASP', 'E', 'GLU'].includes(wt) && ['A', 'ALA'].includes(mut)) {
      subType = 'CHARGE_TO_NEUTRAL';
      impact = `Catalytic-null mutation: Negatively charged acidic residue essential for coordinating metal ions or acting as a general base is mutated to neutral Ala, abolishing enzymatic activity.`;
      shift = 'MORE_BASIC';
    } else if (['K', 'LYS', 'R', 'ARG'].includes(wt) && ['D', 'ASP', 'E', 'GLU'].includes(mut)) {
      subType = 'CHARGE_INVERSION';
      impact = `Severe charge inversion: Positively charged basic residue mutated to acidic negative residue. Disrupts salt bridges and drastically destabilizes tertiary structure.`;
      shift = 'MORE_ACIDIC';
    } else if (['K', 'LYS', 'R', 'ARG'].includes(wt) && ['K', 'LYS', 'R', 'ARG'].includes(mut)) {
      subType = 'CONSERVATIVE';
      impact = `Conservative substitution: Preserves positive basic charge and electrostatic interactions with minimal disturbance to native fold.`;
      shift = 'NEUTRAL';
    }

    return {
      wildType: wt,
      mutant: mut,
      position,
      mutationCode: code,
      substitutionType: subType,
      predictedFunctionalImpact: impact || `Substitution of ${wt} to ${mut} at residue ${position}.`,
      isoelectricShift: shift
    };
  }
}
