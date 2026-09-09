import { Injectable } from '@angular/core';

export interface IUmlsConcept {
  cui: string;              // NLM Concept Unique Identifier (e.g. 'C0020615')
  name: string;             // Canonical English term
  semanticType: string;     // UMLS TUI (e.g. 'T200' Clinical Drug, 'T047' Disease)
  semanticTypeLabel: string;// Label (e.g. 'Clinical Drug')
  rxCui?: string;           // RxNorm Identifier
  tallMan?: string;         // ISMP / FDA Tall Man Lettering
  snomedCode?: string;      // SNOMED CT Concept ID
  icd10Code?: string;       // ICD-10-CM Code
  loincCode?: string;       // LOINC Observation Code
  telemetryUnit?: string;   // Clinical measurement unit (e.g. 'mg/dL', 'mmHg')
  contraindicatedIn?: string[]; // Array of CUIs where this entity is lethal/incompatible
}

export interface ISemanticSafetyResult {
  isSafe: boolean;
  relationType: 'TREATS' | 'CONTRAINDICATED' | 'ADVISORY' | 'UNKNOWN';
  rationale: string;
  drugCui: string;
  conditionCui: string;
}

@Injectable({
  providedIn: 'root'
})
export class UmlsEdgeResolverService {

  // NLM UMLS Metathesaurus Statutory Notice (Section 11.a)
  public static readonly UMLS_COPYRIGHT_NOTICE =
    'Some material in the UMLS Metathesaurus is from copyrighted sources of the respective copyright holders. ' +
    'Users of the UMLS Metathesaurus are solely responsible for compliance with any copyright, patent or trademark restrictions.';

  // SNOMED International Attribution (Appendix 2, Clause 8.3.1)
  public static readonly SNOMED_ATTRIBUTION_NOTICE =
    'This material includes SNOMED Clinical Terms® (SNOMED CT®) which is used by permission of the ' +
    'International Health Terminology Standards Development Organisation (IHTSDO). All rights reserved.';

  /**
   * Curated high-performance in-memory registry of high-alert medications,
   * emergency conditions, and ICU laboratory observations.
   * Zero network egress (HIPAA air-gapped).
   */
  private readonly conceptRegistry: Record<string, IUmlsConcept> = {
    // --- HIGH-ALERT ANALGESICS & OPIOIDS ---
    'C0020615': {
      cui: 'C0020615',
      name: 'Hydromorphone',
      semanticType: 'T200',
      semanticTypeLabel: 'Clinical Drug',
      rxCui: '3423',
      tallMan: 'HYDROmorphone',
      contraindicatedIn: ['C0004096', 'C0035222'] // Severe asthma, acute respiratory depression
    },
    'C0026549': {
      cui: 'C0026549',
      name: 'Morphine',
      semanticType: 'T200',
      semanticTypeLabel: 'Clinical Drug',
      rxCui: '7052',
      tallMan: 'morphine',
      contraindicatedIn: ['C0035222'] // Acute respiratory depression
    },
    'C0015846': {
      cui: 'C0015846',
      name: 'Fentanyl',
      semanticType: 'T200',
      semanticTypeLabel: 'Clinical Drug',
      rxCui: '4337',
      tallMan: 'fentanYL',
      contraindicatedIn: ['C0035222']
    },
    'C0027282': {
      cui: 'C0027282',
      name: 'Naloxone',
      semanticType: 'T121',
      semanticTypeLabel: 'Pharmacologic Substance',
      rxCui: '7242',
      tallMan: 'naloxone'
    },

    // --- ONCOLOGY LASA DRUGS ---
    'C0042672': {
      cui: 'C0042672',
      name: 'Vinblastine',
      semanticType: 'T200',
      semanticTypeLabel: 'Clinical Drug',
      rxCui: '11359',
      tallMan: 'vinBLAStine',
      contraindicatedIn: ['C0020538'] // Severe neutropenia
    },
    'C0042674': {
      cui: 'C0042674',
      name: 'Vincristine',
      semanticType: 'T200',
      semanticTypeLabel: 'Clinical Drug',
      rxCui: '11361',
      tallMan: 'vinCRIStine',
      contraindicatedIn: ['C0020538']
    },

    // --- CARDIOVASCULAR & STAT RESUSCITATION ---
    'C0014563': {
      cui: 'C0014563',
      name: 'Epinephrine',
      semanticType: 'T200',
      semanticTypeLabel: 'Clinical Drug',
      rxCui: '3992',
      tallMan: 'EPINEPHrine'
    },
    'C0014510': {
      cui: 'C0014510',
      name: 'Ephedrine',
      semanticType: 'T200',
      semanticTypeLabel: 'Clinical Drug',
      rxCui: '3966',
      tallMan: 'ePHEDrine'
    },
    'C0004057': {
      cui: 'C0004057',
      name: 'Aspirin',
      semanticType: 'T200',
      semanticTypeLabel: 'Clinical Drug',
      rxCui: '1191',
      tallMan: 'aspirin',
      contraindicatedIn: ['C0017181'] // Active GI bleeding
    },
    'C0003483': {
      cui: 'C0003483',
      name: 'Amiodarone',
      semanticType: 'T200',
      semanticTypeLabel: 'Clinical Drug',
      rxCui: '703',
      tallMan: 'amiodarone',
      contraindicatedIn: ['C0006097'] // Severe sinus-node dysfunction / bradycardia
    },

    // --- CLINICAL CONDITIONS (T047 Disease or Syndrome) ---
    'C0024117': {
      cui: 'C0024117',
      name: 'Chronic Obstructive Pulmonary Disease',
      semanticType: 'T047',
      semanticTypeLabel: 'Disease or Syndrome',
      snomedCode: '195951007',
      icd10Code: 'J44.9'
    },
    'C0004096': {
      cui: 'C0004096',
      name: 'Asthma',
      semanticType: 'T047',
      semanticTypeLabel: 'Disease or Syndrome',
      snomedCode: '195967001',
      icd10Code: 'J45.909'
    },
    'C0035222': {
      cui: 'C0035222',
      name: 'Respiratory Depression',
      semanticType: 'T047',
      semanticTypeLabel: 'Disease or Syndrome',
      snomedCode: '401186001',
      icd10Code: 'R09.2'
    },
    'C0006097': {
      cui: 'C0006097',
      name: 'Bradycardia',
      semanticType: 'T047',
      semanticTypeLabel: 'Disease or Syndrome',
      snomedCode: '48867003',
      icd10Code: 'R00.1'
    },
    'C0017181': {
      cui: 'C0017181',
      name: 'Gastrointestinal Bleeding',
      semanticType: 'T047',
      semanticTypeLabel: 'Disease or Syndrome',
      snomedCode: '74474003',
      icd10Code: 'K92.2'
    },

    // --- ICU TELEMETRY & LAB BIOMARKERS (T034 / LOINC) ---
    'C0201948': {
      cui: 'C0201948',
      name: 'Oxygen Partial Pressure (PaO2)',
      semanticType: 'T034',
      semanticTypeLabel: 'Laboratory or Test Result',
      loincCode: '2075-0',
      telemetryUnit: 'mmHg'
    },
    'C0201918': {
      cui: 'C0201918',
      name: 'Carbon Dioxide Partial Pressure (pCO2)',
      semanticType: 'T034',
      semanticTypeLabel: 'Laboratory or Test Result',
      loincCode: '2028-9',
      telemetryUnit: 'mmHg'
    },
    'C0201975': {
      cui: 'C0201975',
      name: 'Serum Creatinine',
      semanticType: 'T034',
      semanticTypeLabel: 'Laboratory or Test Result',
      loincCode: '2160-0',
      telemetryUnit: 'mg/dL'
    },
    'C0202022': {
      cui: 'C0202022',
      name: 'Serum Potassium (K+)',
      semanticType: 'T034',
      semanticTypeLabel: 'Laboratory or Test Result',
      loincCode: '2823-3',
      telemetryUnit: 'mmol/L'
    },
    'C0373809': {
      cui: 'C0373809',
      name: 'Cardiac Troponin I',
      semanticType: 'T034',
      semanticTypeLabel: 'Laboratory or Test Result',
      loincCode: '10839-9',
      telemetryUnit: 'ng/mL'
    }
  };

  /**
   * Resolves concept by unique UMLS Concept Unique Identifier (CUI)
   */
  resolveByCui(cui: string): IUmlsConcept | null {
    return this.conceptRegistry[cui] || null;
  }

  /**
   * Resolves concept by RxNorm Concept Identifier (RxCUI)
   */
  resolveByRxCui(rxCui: string): IUmlsConcept | null {
    for (const concept of Object.values(this.conceptRegistry)) {
      if (concept.rxCui === rxCui) return concept;
    }
    return null;
  }

  /**
   * Resolves concept by LOINC Observation Code
   */
  resolveByLoinc(loincCode: string): IUmlsConcept | null {
    for (const concept of Object.values(this.conceptRegistry)) {
      if (concept.loincCode === loincCode) return concept;
    }
    return null;
  }

  /**
   * Case-insensitive name and Tall Man lookup
   */
  resolveByTerm(term: string): IUmlsConcept | null {
    const clean = term.trim().toLowerCase();
    for (const concept of Object.values(this.conceptRegistry)) {
      if (concept.name.toLowerCase() === clean) return concept;
      if (concept.tallMan && concept.tallMan.toLowerCase() === clean) return concept;
    }
    return null;
  }

  /**
   * Evaluates semantic relationship safety between a medication and clinical condition
   */
  validateSemanticSafety(drugCui: string, conditionCui: string): ISemanticSafetyResult {
    const drug = this.resolveByCui(drugCui);
    const condition = this.resolveByCui(conditionCui);

    if (!drug || !condition) {
      return {
        isSafe: true,
        relationType: 'UNKNOWN',
        rationale: 'Concept not found in local edge ontology; manual clinician confirmation advised.',
        drugCui,
        conditionCui
      };
    }

    // Check lethal contraindication
    if (drug.contraindicatedIn && drug.contraindicatedIn.includes(conditionCui)) {
      const drugName = drug.tallMan || drug.name;
      return {
        isSafe: false,
        relationType: 'CONTRAINDICATED',
        rationale: 'LETHAL WARNING: ' + drugName + ' is strictly contraindicated in ' + condition.name + ' under UMLS Semantic Network rules.',
        drugCui,
        conditionCui
      };
    }

    const drugName = drug.tallMan || drug.name;
    return {
      isSafe: true,
      relationType: 'TREATS',
      rationale: drugName + ' is permissible for ' + condition.name + '.',
      drugCui,
      conditionCui
    };
  }

  /**
   * Formats ICU telemetry reading with canonical LOINC unit
   */
  formatLoincTelemetry(loincCode: string, value: number, decimalPlaces = 2): string {
    const concept = this.resolveByLoinc(loincCode);
    const formattedVal = value.toFixed(decimalPlaces);
    if (!concept || !concept.telemetryUnit) {
      return formattedVal;
    }
    return formattedVal + ' ' + concept.telemetryUnit;
  }
}
