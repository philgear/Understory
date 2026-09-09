import '@angular/compiler';
import { FhirExportStrategyService } from './fhir-export-strategy.service';
import type { IPatient } from '../patient.types';

describe('FhirExportStrategyService Suite', () => {
  const service = new FhirExportStrategyService();

  const mockPatient: IPatient = {
    id: 'pt-spec-99',
    name: 'Ada Lovelace',
    age: 36,
    gender: 'Female',
    vitals: { hr: '72', bp: '120/80', spO2: '98', temp: '36.6', weight: '65', height: '168' },
    preexistingConditions: ['Mathematical Computing Focus'],
    history: [],
    bookmarks: [],
    issues: {},
    patientGoals: 'Mathematical Computing Focus',
    lastVisit: '2026-08-05'
  };

  it('normalizes gender to FHIR R4 standard', () => {
    expect(service.toFhirGender('Female')).toBe('female');
    expect(service.toFhirGender('Male')).toBe('male');
    expect(service.toFhirGender('Non-binary')).toBe('other');
    expect(service.toFhirGender(undefined)).toBe('unknown');
  });

  it('sanitizes malicious script tags during export', () => {
    const dirtyHtml = 'Patient Note <script>alert("xss")</script>';
    const cleanStr = service.sanitizeForExport(dirtyHtml);
    expect(cleanStr).not.toContain('<script>');
  });

  it('generates a valid FHIR R4 collection bundle with Practitioner NPI provenance', () => {
    const bundle = service.generateFhirBundle(mockPatient);
    expect(bundle.resourceType).toBe('Bundle');
    expect(bundle.type).toBe('collection');
    expect(bundle.entry.length).toBeGreaterThan(1);

    const patientResource = bundle.entry[0].resource;
    expect(patientResource.resourceType).toBe('Patient');
    expect(patientResource.gender).toBe('female');

    const practitionerResource = bundle.entry.find(e => e.resource.resourceType === 'Practitioner')?.resource;
    expect(practitionerResource).toBeDefined();
    expect((practitionerResource?.identifier as any)?.[0]?.value).toBe('1487569752');
    expect((practitionerResource?.name as any)?.[0]?.family).toBe('Gear');
  });

  it('generates a compliant HL7 FHIR R4 EPSDT Appeal Bundle with ServiceRequest and SHA-256 DocumentReference', () => {
    const mockAppealPkg: any = {
      disputeCategory: 'waiver-waitlist-bypass',
      stateCode: 'OR',
      stateName: 'Oregon',
      administeringAgency: 'Oregon Department of Human Services',
      statutoryReference: 'Title XIX § 1915(c)',
      appealFilingDeadlineDays: 10,
      aidPaidPendingDeadlineIso: '2026-09-18',
      isStatExpedited: true,
      physicianLetterOfMedicalNecessity: 'PHYSICIAN ORDER TEST CONTENT',
      fairHearingPetition: 'FAIR HEARING PETITION TEST CONTENT',
      federalCaseLawBrief: 'FEDERAL CASE LAW BRIEF TEST CONTENT',
      statutoryCitations: ['42 U.S.C. § 1396d(r)(5)'],
      deinstitutionalizationScore: 75,
      cryptographicIntegrityDigest: 'sha256-4c9b1f7e02a8d11c883e4a9e88b201a6fef91b9a2d04a6e29ff2d1033a8710b1',
      generatedAtIso: '2026-09-08T18:00:00.000Z'
    };

    const bundle = service.generateEpsdtFhirBundle(mockPatient, mockAppealPkg);
    expect(bundle.resourceType).toBe('Bundle');
    expect(bundle.type).toBe('collection');

    const resourceTypes = bundle.entry.map(e => e.resource.resourceType);
    expect(resourceTypes).toContain('Patient');
    expect(resourceTypes).toContain('Practitioner');
    expect(resourceTypes).toContain('ServiceRequest');
    expect(resourceTypes).toContain('DocumentReference');
    expect(resourceTypes).toContain('CoverageEligibilityRequest');

    // Verify ServiceRequest
    const serviceRequest = bundle.entry.find(e => e.resource.resourceType === 'ServiceRequest')?.resource as any;
    expect(serviceRequest.intent).toBe('order');
    expect(serviceRequest.priority).toBe('stat');
    expect(serviceRequest.category[0].coding[0].code).toBe('mandatory-treatment-order');
    expect(serviceRequest.code.coding[0].code).toBe('S9123');

    // Verify DocumentReference SHA-256 seal
    const docRef = bundle.entry.find(e => e.resource.resourceType === 'DocumentReference')?.resource as any;
    expect(docRef.content[0].attachment.hash).toBe(mockAppealPkg.cryptographicIntegrityDigest);

    // Verify metadata tags
    const tags = bundle.meta?.tag?.map(t => t.code);
    expect(tags).toContain('epsdt-appeal-bundle');
    expect(tags).toContain('OR');
  });
});
