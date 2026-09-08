import { describe, it, expect, beforeEach } from 'vitest';
import { IsmpSafetyGuardService } from './ismp-safety-guard.service';

describe('IsmpSafetyGuardService - ISMP / FDA Pharmacological Safety Suite', () => {
  let service: IsmpSafetyGuardService;

  beforeEach(() => {
    service = new IsmpSafetyGuardService();
  });

  it('1. Corrects trailing zeros to prevent 10x overdose errors', () => {
    const input = 'Administer Propranolol 10.0 mg orally and Levothyroxine 50.00 mcg';
    const output = service.sanitizeClinicalDosage(input);
    expect(output).toContain('10 mg');
    expect(output).toContain('50 mcg');
    expect(output).not.toContain('10.0 mg');
  });

  it('2. Corrects naked decimals by prepending mandatory leading zero', () => {
    const input = 'Order Haloperidol .5 mg IV and Clonazepam .25 mg PO';
    const output = service.sanitizeClinicalDosage(input);
    expect(output).toContain('0.5 mg');
    expect(output).toContain('0.25 mg');
    expect(output).not.toMatch(/(^|\s)\.5\s*mg/);
  });

  it('3. Translates ISMP high-risk error-prone abbreviations', () => {
    const input = 'Regular Insulin 10 U subQ QD; MgSO4 2 g IV QOD';
    const output = service.sanitizeClinicalDosage(input);
    expect(output).toContain('10 units');
    expect(output).toContain('daily');
    expect(output).toContain('magnesium sulfate');
    expect(output).toContain('every other day');
  });

  it('4. Formats Look-Alike / Sound-Alike (LASA) drugs with FDA Tall Man Lettering', () => {
    expect(service.formatTallMan('hydralazine')).toBe('hydrALAZINE');
    expect(service.formatTallMan('hydroxyzine')).toBe('hydrOXYzine');
    expect(service.formatTallMan('prednisone')).toBe('predniSONE');
    expect(service.formatTallMan('prednisolone')).toBe('prednisoLONE');
    expect(service.formatTallMan('losartan')).toBe('loSARtan');
  });

  it('5. Audits prescription orders and flags critical safety defects', () => {
    const orderWithErrors = 'Prescribe hydralazine 25.0 mg QD with MSO4 .5 mg';
    const audit = service.auditPrescription(orderWithErrors);

    expect(audit.hasViolations).toBe(true);
    expect(audit.isSafe).toBe(false);
    expect(audit.violations.some(v => v.type === 'TRAILING_ZERO')).toBe(true);
    expect(audit.violations.some(v => v.type === 'NAKED_DECIMAL')).toBe(true);
    expect(audit.violations.some(v => v.type === 'ERROR_PRONE_ABBREVIATION')).toBe(true);
    expect(audit.sanitizedText).toContain('hydrALAZINE 25 mg daily with morPHINE sulfate 0.5 mg');
  });

  it('6. Normalizes dangerous microgram abbreviations (ug and µg) to mcg', () => {
    const input = 'Administer levothyroxine 50 ug and fentanyl 25 µg IV';
    const output = service.sanitizeClinicalDosage(input);
    expect(output).toBe('Administer levothyroxine 50 mcg and fentanyl 25 mcg IV');
  });

  it('7. Passes clean prescription orders without false-positive violation flags', () => {
    const cleanOrder = 'Give metFORMIN 500 mg daily with dinner';
    const audit = service.auditPrescription(cleanOrder);

    expect(audit.hasViolations).toBe(false);
    expect(audit.isSafe).toBe(true);
    expect(audit.violations.length).toBe(0);
  });
});
