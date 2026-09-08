import { Injectable } from '@angular/core';

export interface IIsmpViolation {
  type: 'TRAILING_ZERO' | 'NAKED_DECIMAL' | 'ERROR_PRONE_ABBREVIATION' | 'LOOK_ALIKE_SOUND_ALIKE';
  original: string;
  corrected: string;
  rule: string;
  severity: 'HIGH_RISK_WARNING' | 'CRITICAL_SAFETY_DEFECT' | 'ADVISORY';
}

export interface IIsmpSafetyAudit {
  originalText: string;
  sanitizedText: string;
  hasViolations: boolean;
  violations: IIsmpViolation[];
  tallManApplied: string[];
  isSafe: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class IsmpSafetyGuardService {
  /**
   * FDA / ISMP Official Tall Man Lettering Map for Look-Alike / Sound-Alike (LASA) medications.
   * Key: Lowercase normalized drug name
   * Value: Official ISMP Tall Man formatted name
   */
  private readonly TALL_MAN_MAP: ReadonlyMap<string, string> = new Map([
    ['hydralazine', 'hydrALAZINE'],
    ['hydroxyzine', 'hydrOXYzine'],
    ['doxorubicin', 'DOXOrubicin'],
    ['daunorubicin', 'DAUNOrubicin'],
    ['prednisone', 'predniSONE'],
    ['prednisolone', 'prednisoLONE'],
    ['clonidine', 'cloNIDine'],
    ['clozapine', 'cloZAPine'],
    ['alprazolam', 'ALPRAZolam'],
    ['lorazepam', 'LORazepam'],
    ['vinblastine', 'vinBLAStine'],
    ['vincristine', 'vinCRIStine'],
    ['bupropion', 'buPROPrion'],
    ['buspirone', 'busPIRone'],
    ['celecoxib', 'celeCOXIB'],
    ['cephalexin', 'cefaLEXin'],
    ['chlorpromazine', 'chlorproMAZINE'],
    ['chlordiazepoxide', 'chlorDIAZepOXIDE'],
    ['dimenhydrinate', 'dimenhyDRINATE'],
    ['diphenhydramine', 'diphenhydrAMINE'],
    ['dobutamine', 'DOBUTamine'],
    ['dopamine', 'DOPamine'],
    ['ephedrine', 'ePHEDrine'],
    ['epinephrine', 'EPINEPHrine'],
    ['fluoxetine', 'FLUoxetine'],
    ['duloxetine', 'DULoxetine'],
    ['glipizide', 'glipiZIDE'],
    ['glyburide', 'glyBURIDE'],
    ['metformin', 'metFORMIN'],
    ['metronidazole', 'metroNIDAZOLE'],
    ['morphine', 'morPHINE'],
    ['hydromorphone', 'HYDROmorphone'],
    ['oxycodone', 'OXYcodone'],
    ['oxymorphone', 'OXYmorphone'],
    ['tramadol', 'traMADol'],
    ['trazodone', 'traZODone'],
    ['propranolol', 'propraNOLOL'],
    ['atenolol', 'atenOLOL'],
    ['lisinopril', 'lisinOPRIL'],
    ['enalapril', 'enalAPRIL'],
    ['losartan', 'loSARtan'],
    ['valsartan', 'valSARtan']
  ]);

  /**
   * ISMP Dangerous / Error-Prone Abbreviations and replacement definitions
   */
  private readonly DANGEROUS_ABBREVIATIONS: ReadonlyArray<{
    pattern: RegExp;
    replacement: string;
    description: string;
  }> = [
    {
      pattern: /\b(\d+)\s*U\b/gi,
      replacement: '$1 units',
      description: 'Mistaken as zero (0), four (4), or cc. Use "units".'
    },
    {
      pattern: /\b(Q\.?D\.?|QD)\b/gi,
      replacement: 'daily',
      description: 'Mistaken for QOD. Write "daily".'
    },
    {
      pattern: /\b(Q\.?O\.?D\.?|QOD)\b/gi,
      replacement: 'every other day',
      description: 'Mistaken for QD. Write "every other day".'
    },
    {
      pattern: /\bMSO4\b/g,
      replacement: 'morphine sulfate',
      description: 'Confused with MgSO4. Write "morphine sulfate".'
    },
    {
      pattern: /\bMgSO4\b/g,
      replacement: 'magnesium sulfate',
      description: 'Confused with MSO4. Write "magnesium sulfate".'
    },
    {
      pattern: /\b(\d+(?:\.\d+)?)\s*(?:µg|ug)\b/gi,
      replacement: '$1 mcg',
      description: 'Mistaken as mg (milligrams), causing 1,000-fold overdose. Write "mcg".'
    }
  ];

  /**
   * Sanitizes a clinical dosage string by correcting trailing zeros, naked decimals,
   * error-prone abbreviations, and applying FDA/ISMP Tall Man Lettering.
   */
  sanitizeClinicalDosage(input: string): string {
    if (!input || typeof input !== 'string') return '';
    let result = input;

    // 1. Correct Trailing Zeros: 5.0 mg -> 5 mg, 10.00 mcg -> 10 mcg
    result = result.replace(/(\b\d+)\.0+\s*(mg|mcg|g|mL|units?|mEq|IU)\b/gi, '$1 $2');

    // 2. Correct Naked Decimals: .5 mg -> 0.5 mg, .25 g -> 0.25 g
    result = result.replace(/(^|[^\d.])\.(\d+)\s*(mg|mcg|g|mL|units?|mEq|IU)\b/gi, '$10.$2 $3');

    // 3. Normalize Dangerous Abbreviations
    for (const abbrev of this.DANGEROUS_ABBREVIATIONS) {
      result = result.replace(abbrev.pattern, abbrev.replacement);
    }

    // 4. Apply Tall Man Lettering
    result = this.applyTallManLettering(result);

    return result.trim();
  }

  /**
   * Formats a drug name using official FDA/ISMP Tall Man casing if present in catalog.
   */
  formatTallMan(drugName: string): string {
    if (!drugName) return '';
    const clean = drugName.trim().toLowerCase();
    return this.TALL_MAN_MAP.get(clean) || drugName;
  }

  /**
   * Performs an exhaustive ISMP safety audit against a clinical order or note.
   */
  auditPrescription(text: string): IIsmpSafetyAudit {
    const originalText = text || '';
    const violations: IIsmpViolation[] = [];
    const tallManApplied: string[] = [];

    // Check Trailing Zeros
    const trailingZeroRegex = /(\b\d+)\.0+\s*(mg|mcg|g|mL|units?|mEq|IU)\b/gi;
    let match: RegExpExecArray | null;
    while ((match = trailingZeroRegex.exec(originalText)) !== null) {
      violations.push({
        type: 'TRAILING_ZERO',
        original: match[0],
        corrected: `${match[1]} ${match[2]}`,
        rule: 'ISMP Rule: Trailing zeros prohibited (e.g., 5.0 mg mistaken as 50 mg)',
        severity: 'CRITICAL_SAFETY_DEFECT'
      });
    }

    // Check Naked Decimals
    const nakedDecimalRegex = /(^|[^\d.])\.(\d+)\s*(mg|mcg|g|mL|units?|mEq|IU)\b/gi;
    while ((match = nakedDecimalRegex.exec(originalText)) !== null) {
      violations.push({
        type: 'NAKED_DECIMAL',
        original: match[0].trim(),
        corrected: `0.${match[2]} ${match[3]}`,
        rule: 'ISMP Rule: Leading zero mandatory before decimal point (e.g., .5 mg mistaken as 5 mg)',
        severity: 'CRITICAL_SAFETY_DEFECT'
      });
    }

    // Check Error-Prone Abbreviations
    for (const abbrev of this.DANGEROUS_ABBREVIATIONS) {
      const abbrevRegex = new RegExp(abbrev.pattern.source, abbrev.pattern.flags);
      while ((match = abbrevRegex.exec(originalText)) !== null) {
        violations.push({
          type: 'ERROR_PRONE_ABBREVIATION',
          original: match[0],
          corrected: match[0].replace(abbrev.pattern, abbrev.replacement),
          rule: `ISMP Do Not Use List: ${abbrev.description}`,
          severity: 'HIGH_RISK_WARNING'
        });
      }
    }

    // Check Tall Man Opportunities
    const sanitizedText = this.sanitizeClinicalDosage(originalText);
    for (const [lower, tall] of this.TALL_MAN_MAP.entries()) {
      const wordRegex = new RegExp(`\\b${lower}\\b`, 'gi');
      if (wordRegex.test(originalText) && !originalText.includes(tall)) {
        tallManApplied.push(tall);
      }
    }

    return {
      originalText,
      sanitizedText,
      hasViolations: violations.length > 0,
      violations,
      tallManApplied,
      isSafe: violations.length === 0
    };
  }

  /**
   * Internal helper to scan and replace words with Tall Man equivalents
   */
  private applyTallManLettering(text: string): string {
    let output = text;
    for (const [lower, tall] of this.TALL_MAN_MAP.entries()) {
      const regex = new RegExp(`\\b${lower}\\b`, 'gi');
      output = output.replace(regex, tall);
    }
    return output;
  }
}
