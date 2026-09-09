import '@angular/compiler';
import { UmlsEdgeResolverService } from './umls-edge-resolver.service';

describe('UmlsEdgeResolverService Unit Suite', () => {
  let service: UmlsEdgeResolverService;

  beforeEach(() => {
    service = new UmlsEdgeResolverService();
  });

  it('1. Resolves high-alert opioid Hydromorphone by CUI C0020615 with RxNorm 3423 & Tall Man HYDROmorphone', () => {
    const concept = service.resolveByCui('C0020615');
    expect(concept).not.toBeNull();
    expect(concept?.name).toBe('Hydromorphone');
    expect(concept?.rxCui).toBe('3423');
    expect(concept?.tallMan).toBe('HYDROmorphone');
    expect(concept?.semanticType).toBe('T200');
  });

  it('2. Resolves high-alert chemotherapy Vinblastine (C0042672) vs Vincristine (C0042674) with ISMP Tall Man', () => {
    const vbla = service.resolveByCui('C0042672');
    const vcri = service.resolveByCui('C0042674');
    expect(vbla?.tallMan).toBe('vinBLAStine');
    expect(vcri?.tallMan).toBe('vinCRIStine');
    expect(vbla?.rxCui).toBe('11359');
    expect(vcri?.rxCui).toBe('11361');
  });

  it('3. Resolves clinical condition by SNOMED CT and CUI C0024117 (COPD)', () => {
    const copd = service.resolveByCui('C0024117');
    expect(copd?.snomedCode).toBe('195951007');
    expect(copd?.icd10Code).toBe('J44.9');
    expect(copd?.semanticTypeLabel).toBe('Disease or Syndrome');
  });

  it('4. Formats ICU telemetry observations with canonical LOINC units', () => {
    const crReading = service.formatLoincTelemetry('2160-0', 1.12);
    expect(crReading).toBe('1.12 mg/dL');

    const paO2Reading = service.formatLoincTelemetry('2075-0', 94.5, 1);
    expect(paO2Reading).toBe('94.5 mmHg');

    const kReading = service.formatLoincTelemetry('2823-3', 4.2);
    expect(kReading).toBe('4.20 mmol/L');
  });

  it('5. Intercepts lethal contraindication: Hydromorphone in Acute Respiratory Depression', () => {
    const check = service.validateSemanticSafety('C0020615', 'C0035222');
    expect(check.isSafe).toBe(false);
    expect(check.relationType).toBe('CONTRAINDICATED');
    expect(check.rationale).toContain('LETHAL WARNING');
    expect(check.rationale).toContain('HYDROmorphone');
  });

  it('6. Allows permissible treatment when no contraindication exists', () => {
    const check = service.validateSemanticSafety('C0027282', 'C0035222'); // Naloxone in Resp Depression
    expect(check.isSafe).toBe(true);
    expect(check.relationType).toBe('TREATS');
  });

  it('7. Resolves case-insensitively by Tall Man spelling and generic name', () => {
    const byTall = service.resolveByTerm('hydromorphone');
    const byExact = service.resolveByTerm('HYDROmorphone');
    expect(byTall?.cui).toBe('C0020615');
    expect(byExact?.cui).toBe('C0020615');
  });

  it('8. Exposes mandatory UMLS Section 11.a and SNOMED Clause 8.3.1 statutory notices', () => {
    expect(UmlsEdgeResolverService.UMLS_COPYRIGHT_NOTICE).toContain('UMLS Metathesaurus');
    expect(UmlsEdgeResolverService.SNOMED_ATTRIBUTION_NOTICE).toContain('SNOMED Clinical Terms');
    expect(UmlsEdgeResolverService.SNOMED_ATTRIBUTION_NOTICE).toContain('IHTSDO');
  });
});
