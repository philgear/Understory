import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { McatBiochemicalAssayService, IProteinConstruct } from './mcat-biochemical-assay.service';

describe('McatBiochemicalAssayService', () => {
  let service: McatBiochemicalAssayService;

  beforeEach(() => {
    service = new McatBiochemicalAssayService();
  });

  it('1. should initialize the biochemical assay service', () => {
    expect(service).toBeTruthy();
  });

  it('2. should model classic antibody reducing vs non-reducing SDS-PAGE migration', () => {
    // Human IgG: 2 Heavy Chains (50 kDa each) + 2 Light Chains (25 kDa each) linked by disulfides
    const igG: IProteinConstruct = {
      name: 'Immunoglobulin G (IgG)',
      subunits: [
        { name: 'Heavy Chain', weightKDa: 50, count: 2 },
        { name: 'Light Chain', weightKDa: 25, count: 2 }
      ],
      linkedByDisulfideBonds: true
    };

    const sim = service.simulateSdsPage(igG);
    expect(sim.totalIntactKDa).toBe(150);
    // Non-reducing: single 150 kDa band
    expect(sim.nonReducingBandsKDa).toEqual([150]);
    expect(sim.nonReducingSummary).toContain('150 kDa');
    // Reducing (+β-ME): two bands (50 kDa and 25 kDa)
    expect(sim.reducingBandsKDa).toEqual([50, 25]);
    expect(sim.reducingSummary).toContain('cleaved');
    expect(sim.aamcClinicalRelevance).toContain('Classic AAMC Antibody / Multimer Trap');
  });

  it('3. should model non-covalent tetramer on SDS-PAGE', () => {
    // Hemoglobin: α2β2 non-covalent tetramer (~64 kDa total, four ~16 kDa monomers)
    const hb: IProteinConstruct = {
      name: 'Hemoglobin A',
      subunits: [
        { name: 'Alpha Subunit', weightKDa: 16, count: 2 },
        { name: 'Beta Subunit', weightKDa: 16, count: 2 }
      ],
      linkedByDisulfideBonds: false
    };

    const sim = service.simulateSdsPage(hb);
    expect(sim.totalIntactKDa).toBe(64);
    // Without disulfide bonds, SDS alone dissociates non-covalent oligomers
    expect(sim.nonReducingBandsKDa).toEqual([16]);
    expect(sim.reducingBandsKDa).toEqual([16]);
  });

  it('4. should calculate Michaelis-Menten kinetics and competitive Lineweaver-Burk intersection on Y-axis', () => {
    // Vmax = 100 uM/s, Km = 20 uM, [E]T = 50 nM
    const kinetics = service.evaluateKinetics(100, 20, 50, {
      type: 'COMPETITIVE',
      alpha: 2.0 // Km doubles to 40 uM
    });

    // Uninhibited
    expect(kinetics.uninhibited.vMax).toBe(100);
    expect(kinetics.uninhibited.kmUm).toBe(20);
    expect(kinetics.uninhibited.kCatS1).toBe(2000); // 100 / 0.05 uM = 2000 s^-1
    expect(kinetics.uninhibited.catalyticEfficiencyM1S1).toBe(100000000);

    // Inhibited
    expect(kinetics.inhibited).toBeTruthy();
    expect(kinetics.inhibited?.apparentKmUm).toBe(40);
    expect(kinetics.inhibited?.apparentVMax).toBe(100);
    expect(kinetics.inhibited?.intersectionPattern).toBe('Y_AXIS');
    expect(kinetics.inhibited?.aamcRule).toContain('Lineweaver-Burk plots cross directly on the Y-AXIS');
  });

  it('5. should calculate uncompetitive inhibition with parallel Lineweaver-Burk plots', () => {
    const kinetics = service.evaluateKinetics(100, 20, undefined, {
      type: 'UNCOMPETITIVE',
      alphaPrime: 2.0 // Both Vmax and Km halved
    });

    expect(kinetics.inhibited?.apparentVMax).toBe(50);
    expect(kinetics.inhibited?.apparentKmUm).toBe(10);
    expect(kinetics.inhibited?.intersectionPattern).toBe('PARALLEL_NO_INTERSECTION');
    // Slopes: uninhibited = 20/100 = 0.2; inhibited = 10/50 = 0.2 (IDENTICAL)
    expect(kinetics.uninhibited.lineweaverBurk.slope).toBe(0.2);
    expect(kinetics.inhibited?.lineweaverBurk.slope).toBe(0.2);
    expect(kinetics.inhibited?.aamcRule).toContain('PARALLEL lines that never intersect');
  });

  it('6. should calculate pure non-competitive inhibition intersecting on X-axis', () => {
    const kinetics = service.evaluateKinetics(100, 20, undefined, {
      type: 'NONCOMPETITIVE_PURE',
      alpha: 2.0 // Vmax halved, Km unchanged
    });

    expect(kinetics.inhibited?.apparentVMax).toBe(50);
    expect(kinetics.inhibited?.apparentKmUm).toBe(20);
    expect(kinetics.inhibited?.intersectionPattern).toBe('X_AXIS');
    // X-intercepts: -1/Km = -1/20 = -0.05
    expect(kinetics.uninhibited.lineweaverBurk.xIntercept).toBe(-0.05);
    expect(kinetics.inhibited?.lineweaverBurk.xIntercept).toBe(-0.05);
  });

  it('7. should analyze point mutations for phosphomimetic, phospho-dead, and catalytic-null effects', () => {
    // Ser to Asp (S218D): Phosphomimetic
    const phosphomimetic = service.evaluatePointMutation('Ser', 218, 'Asp');
    expect(phosphomimetic.substitutionType).toBe('PHOSPHOMIMETIC');
    expect(phosphomimetic.predictedFunctionalImpact).toContain('mimics constitutive phosphorylation');
    expect(phosphomimetic.isoelectricShift).toBe('MORE_ACIDIC');

    // Ser to Ala (S218A): Phospho-dead
    const phosphoDead = service.evaluatePointMutation('S', 218, 'A');
    expect(phosphoDead.substitutionType).toBe('PHOSPHO_DEAD');
    expect(phosphoDead.predictedFunctionalImpact).toContain('Phospho-dead');

    // Asp to Ala (D142A): Catalytic-null
    const catalyticNull = service.evaluatePointMutation('Asp', 142, 'Ala');
    expect(catalyticNull.substitutionType).toBe('CHARGE_TO_NEUTRAL');
    expect(catalyticNull.predictedFunctionalImpact).toContain('Catalytic-null');
    expect(catalyticNull.isoelectricShift).toBe('MORE_BASIC');

    // Lys to Glu (K296E): Charge inversion
    const chargeInversion = service.evaluatePointMutation('K', 296, 'E');
    expect(chargeInversion.substitutionType).toBe('CHARGE_INVERSION');
    expect(chargeInversion.predictedFunctionalImpact).toContain('Severe charge inversion');
  });
});
