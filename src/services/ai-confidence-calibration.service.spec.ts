import { AiConfidenceCalibrationService } from './ai-confidence-calibration.service';

describe('AiConfidenceCalibrationService', () => {
  const service = new AiConfidenceCalibrationService();

  it('should initialize with default metrics', () => {
    const metrics = service.latestMetrics();
    expect(metrics.overallConfidencePercent).toBeGreaterThan(0);
    expect(metrics.isFda520oCompliant).toBe(true);
    expect(metrics.guidelineConcordanceGrade).toBe('Grade A (RCT/Guideline)');
  });

  it('should calibrate highly evidenced text with citations to Grade A and high confidence', () => {
    const evidencedText = `
      According to AHA/ACC Guidelines, first-line therapy for stage 2 hypertension is an ACE inhibitor combined with a dihydropyridine CCB.
      This is a Class I recommendation supported by randomized controlled trials [PMID: 32014521] and Cochrane CD001234.
      Standard of care dictates monitoring serum creatinine and potassium within 2 to 4 weeks.
    `;

    const metrics = service.calibrateText(evidencedText);

    expect(metrics.overallConfidencePercent).toBeGreaterThanOrEqual(85);
    expect(metrics.guidelineConcordanceGrade).toBe('Grade A (RCT/Guideline)');
    expect(metrics.epistemicStatus).toBe('Definitive Standard of Care');
    expect(metrics.citationCount).toBeGreaterThanOrEqual(2);
    expect(metrics.verifiableCitations.length).toBeGreaterThanOrEqual(2);
  });

  it('should detect hedging entropy and downgrade confidence for speculative text', () => {
    const speculativeText = `
      Preliminary findings may suggest that botanical extracts might indicate a possible association with improved sleep.
      However, the data is inconclusive and unclear. Further research is needed to evaluate speculative metabolic benefits.
      Low certainty hypotheses remain theoretical.
    `;

    const metrics = service.calibrateText(speculativeText);

    expect(metrics.hedgingEntropyScore).toBeGreaterThan(30);
    expect(metrics.overallConfidencePercent).toBeLessThan(75);
    expect(metrics.epistemicStatus).toBe('Hypothesis / Requires Clinical Correlation');
    expect(metrics.uncertaintyFlags.length).toBeGreaterThan(0);
  });

  it('should handle empty or whitespace text gracefully with default metrics', () => {
    const metrics = service.calibrateText('');
    expect(metrics.overallConfidencePercent).toBe(88);
    expect(metrics.isFda520oCompliant).toBe(true);
  });

  it('should compute dynamic badge classes matching confidence thresholds', () => {
    service.calibrateText('AHA/ACC Guidelines first-line therapy standard of care [PMID: 12345678] Cochrane CD005678 Level A Evidence Class I recommendation');
    expect(service.confidenceBadgeClass()).toContain('emerald');
  });

  it('should recognize AAP, Texas HHS, and ISO/IEEE 11073 citations', () => {
    const pediatricText = `
      Under AAP Guidelines and Texas HHS Criteria, tracheostomy care requires Form 2603 ISP authorized PDN hours.
      Device telemetry conforms to ISO/IEEE 11073 with RTMMS nomenclature and NIST SP 800-90A security.
    `;
    const metrics = service.calibrateText(pediatricText);
    expect(metrics.citationCount).toBeGreaterThanOrEqual(3);
    expect(metrics.verifiableCitations.some(c => c.includes('AAP'))).toBe(true);
    expect(metrics.verifiableCitations.some(c => c.includes('ISO/IEEE 11073'))).toBe(true);
  });

  it('should compute valid Brier scores and Wilson confidence intervals', () => {
    const bs = service.calculateBrierScore(0.9, true);
    expect(bs).toBeCloseTo(0.01, 2);

    const bss = service.calculateBrierSkillScore(bs, 0.25);
    expect(bss).toBeGreaterThan(0.9);

    const interval = service.calculateWilsonConfidenceInterval(18, 20, 0.95);
    expect(interval.lower).toBeGreaterThan(0.65);
    expect(interval.upper).toBeLessThanOrEqual(1.0);
    expect(interval.lower).toBeLessThan(interval.upper);
  });
});
