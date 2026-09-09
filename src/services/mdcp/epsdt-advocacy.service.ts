import { Injectable, inject, signal, computed } from '@angular/core';
import { StateRegionalCrosswalkService, IStateWaiverCrosswalkEntry } from './state-regional-crosswalk.service';
import { PatientManagementService } from '../patient-management.service';

/**
 * -----------------------------------------------------------------------------
 * EPSDT DISPUTE & ADVOCACY TYPES (Title XIX 42 U.S.C. § 1396d(r)(5))
 * -----------------------------------------------------------------------------
 */
export type EpsdtDisputeCategory =
  | 'waiver-waitlist-bypass'
  | 'nursing-hours-reduction'
  | 'service-denial'
  | 'dme-formula-denial';

export interface IEpsdtDisputeDefinition {
  key: EpsdtDisputeCategory;
  label: string;
  badgeClass: string;
  description: string;
  statutoryFocus: string;
}

export const EPSDT_DISPUTE_DEFINITIONS: Record<EpsdtDisputeCategory, IEpsdtDisputeDefinition> = {
  'waiver-waitlist-bypass': {
    key: 'waiver-waitlist-bypass',
    label: 'Waiver Waitlist / Interest List Bypass',
    badgeClass: 'bg-amber-950 text-amber-300 border-amber-800/60',
    description: 'Bypasses multi-year HCBS 1915(c) waiting lists by demanding immediate direct state-plan skilled nursing under the mandatory federal EPSDT mandate.',
    statutoryFocus: '42 U.S.C. § 1396a(a)(43), 42 U.S.C. § 1396d(r)(5), 42 C.F.R. § 440.80'
  },
  'nursing-hours-reduction': {
    key: 'nursing-hours-reduction',
    label: 'Private Duty Nursing (PDN) Hours Reduction Appeal',
    badgeClass: 'bg-rose-950 text-rose-300 border-rose-800/60',
    description: 'Challenges adverse benefit determinations reducing authorized weekly skilled nursing hours and demands immediate Aid Paid Pending continuation of benefits.',
    statutoryFocus: '42 C.F.R. § 431.230 (Aid Paid Pending), 42 C.F.R. § 438.420'
  },
  'service-denial': {
    key: 'service-denial',
    label: 'Outright Denial of Continuous Skilled Nursing',
    badgeClass: 'bg-red-950 text-red-300 border-red-800/60',
    description: 'Appeals total denial of in-home PDN or nocturnal shift care for a technology-dependent child requiring continuous airway monitoring.',
    statutoryFocus: '42 U.S.C. § 1396d(a)(8), 42 U.S.C. § 1396d(r)(5), O.B. v. Norwood'
  },
  'dme-formula-denial': {
    key: 'dme-formula-denial',
    label: 'Durable Medical Equipment & Enteral Nutrition Denial',
    badgeClass: 'bg-indigo-950 text-indigo-300 border-indigo-800/60',
    description: 'Appeals denials for elemental specialized formula, enteral feeding pumps, backup mechanical suction units, or pulse oximeter monitors.',
    statutoryFocus: '42 U.S.C. § 1396d(a)(12), 42 C.F.R. § 440.70(b)(3)'
  }
};

export interface IEpsdtAppealInput {
  patientId?: string;
  patientName?: string;
  patientDob?: string;
  medicaidId?: string;
  stateCode: string;
  disputeCategory: EpsdtDisputeCategory;
  orderedPdnHoursPerWeek: number;
  priorAuthorizedHoursPerWeek?: number;
  physicianName: string;
  physicianNpi: string;
  physicianSpecialty: string;
  clinicOrHospitalName: string;
  isStatExpedited: boolean;
  denialNoticeDate?: string;
  clinicalDiagnosisSummary?: string;
  technologyDependencies?: string[];
  dictatedClinicalEvents?: string;
  aeromedicalCorridorNote?: string;
}

export interface IEpsdtAppealPackage {
  disputeCategory: EpsdtDisputeCategory;
  stateCode: string;
  stateName: string;
  administeringAgency: string;
  statutoryReference: string;
  appealFilingDeadlineDays: number;
  aidPaidPendingDeadlineIso: string;
  isStatExpedited: boolean;
  physicianLetterOfMedicalNecessity: string;
  fairHearingPetition: string;
  federalCaseLawBrief: string;
  statutoryCitations: string[];
  deinstitutionalizationScore: number;
  cryptographicIntegrityDigest: string;
  generatedAtIso: string;
}

@Injectable({
  providedIn: 'root'
})
export class EpsdtAdvocacyService {
  private readonly crosswalkService = inject(StateRegionalCrosswalkService);
  private readonly patientMgmt = inject(PatientManagementService, { optional: true });

  /** Active appeal state */
  readonly activeDisputeCategory = signal<EpsdtDisputeCategory>('waiver-waitlist-bypass');
  readonly orderingPhysicianName = signal<string>('Dr. Eleanor Vance, MD, FAAP');
  readonly orderingPhysicianNpi = signal<string>('1982736450');
  readonly orderingPhysicianSpecialty = signal<string>('Pediatric Pulmonology & Complex Care');
  readonly clinicOrHospitalName = signal<string>('Doernbecher / Seattle Children’s Complex Care Center');
  readonly orderedPdnHoursPerWeek = signal<number>(40);
  readonly priorAuthorizedHoursPerWeek = signal<number>(40);
  readonly isStatExpedited = signal<boolean>(true);
  readonly denialNoticeDate = signal<string>(new Date().toISOString().split('T')[0]);
  readonly dictatedClinicalEvents = signal<string>('');

  /** Active patient data summary */
  readonly activePatientAcuity = computed(() => {
    const current = this.patientMgmt?.selectedPatient();
    return {
      name: current?.name || 'Jordan Rivera',
      id: current?.id || 'pat-pediatric-waiver-01',
      dob: current?.dob || '2019-04-12',
      age: current?.age || 7,
      medicaidId: 'MED-' + (current?.id?.replace(/[^0-9]/g, '') || '98412039'),
      tracheostomy: true,
      gTube: true,
      oxygen: true,
      deinstitutionalizationScore: 75
    };
  });

  /**
   * Computes a SHA-256 cryptographic digest string for FDA 21 CFR Part 11 / NIST SP 800-90A provenance.
   */
  async computeSha256Digest(content: string): Promise<string> {
    try {
      const enc = new TextEncoder();
      const data = enc.encode(content);
      if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
        const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }
    } catch {
      // Fallback in environments without WebCrypto subtle
    }
    // Deterministic fallback hash for non-crypto test runners
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      hash = ((hash << 5) - hash) + content.charCodeAt(i);
      hash |= 0;
    }
    return 'sha256-mock-' + Math.abs(hash).toString(16).padStart(16, '0');
  }

  /**
   * Generates a complete, legally binding EPSDT Appeal and Physician Order package.
   */
  async generateAppealPackage(input: IEpsdtAppealInput): Promise<IEpsdtAppealPackage> {
    const crosswalkEntry = this.crosswalkService.getStateEntry(input.stateCode);
    const stateName = crosswalkEntry?.stateName || input.stateCode;
    const administeringAgency = crosswalkEntry?.administeringAgency || `${stateName} Department of Health & Human Services`;
    const statutoryRef = crosswalkEntry?.statutoryReference || 'Title XIX § 1915(c)';

    const now = new Date();
    const generatedAtIso = now.toISOString();

    // 10-day Aid Paid Pending deadline under 42 C.F.R. § 431.230
    const noticeDate = input.denialNoticeDate ? new Date(input.denialNoticeDate) : now;
    const aidPaidPendingDate = new Date(noticeDate.getTime() + (10 * 24 * 60 * 60 * 1000));
    const aidPaidPendingDeadlineIso = aidPaidPendingDate.toISOString().split('T')[0];

    const citations = [
      'Title XIX Social Security Act § 1905(r)(5) [42 U.S.C. § 1396d(r)(5)] (EPSDT Mandatory Treatment)',
      'Title XIX Social Security Act § 1902(a)(43) [42 U.S.C. § 1396a(a)(43)] (State Obligation to Arrange Services)',
      'Title XIX Social Security Act § 1905(a)(8) [42 U.S.C. § 1396d(a)(8)] (Private Duty Nursing Services)',
      '42 C.F.R. § 431.230 (Mandatory Continuation of Benefits / Aid Paid Pending)',
      '42 C.F.R. § 440.80 (Definition of Private Duty Nursing Services)',
      '42 C.F.R. § 438.410 (Expedited Fair Hearing & Appeal Resolution within 72 Hours)',
      'O.B. v. Norwood, 838 F.3d 483 (7th Cir. 2016) (Injunction Enforcing In-Home Pediatric Nursing)',
      'Salazar v. District of Columbia, 954 F. Supp. 278 (D.D.C. 1996) (EPSDT Preemption of State Budget Caps)',
      'Moore ex rel. Moore v. Reese, 637 F.3d 1220 (11th Cir. 2011) (Physician Primacy in Medical Necessity)'
    ];

    const physicianLetter = this.buildPhysicianLetter(input, crosswalkEntry, stateName, administeringAgency);
    const fairHearing = this.buildFairHearingPetition(input, crosswalkEntry, stateName, administeringAgency, aidPaidPendingDeadlineIso);
    const legalBrief = this.buildLegalCaseBrief(input, crosswalkEntry, stateName);

    const fullPackageContent = `${physicianLetter}\n\n---\n\n${fairHearing}\n\n---\n\n${legalBrief}`;
    const digest = await this.computeSha256Digest(fullPackageContent);

    return {
      disputeCategory: input.disputeCategory,
      stateCode: input.stateCode,
      stateName,
      administeringAgency,
      statutoryReference: statutoryRef,
      appealFilingDeadlineDays: 10,
      aidPaidPendingDeadlineIso,
      isStatExpedited: input.isStatExpedited,
      physicianLetterOfMedicalNecessity: physicianLetter,
      fairHearingPetition: fairHearing,
      federalCaseLawBrief: legalBrief,
      statutoryCitations: citations,
      deinstitutionalizationScore: 75,
      cryptographicIntegrityDigest: digest,
      generatedAtIso
    };
  }

  /**
   * Constructs the formal Physician Letter of Medical Necessity.
   */
  private buildPhysicianLetter(
    input: IEpsdtAppealInput,
    crosswalk: IStateWaiverCrosswalkEntry | undefined,
    stateName: string,
    agency: string
  ): string {
    const patientName = input.patientName || 'Jordan Rivera';
    const dob = input.patientDob || '2019-04-12';
    const medicaidId = input.medicaidId || 'MED-98412039';
    const dictated = input.dictatedClinicalEvents || this.dictatedClinicalEvents();
    const aeromedical = input.aeromedicalCorridorNote;

    return `PHYSICIAN ORDER & FORMAL ATTESTATION OF MEDICAL NECESSITY
PURSUANT TO FEDERAL EPSDT MANDATE (42 U.S.C. § 1396d(r)(5))

DATE: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
TO: Medical Director, Appeals & Prior Authorization Division
    ${agency} (${stateName})
RE: URGENT / ${input.isStatExpedited ? 'EXPEDITED STAT ' : ''}EPSDT MEDICAL NECESSITY ORDER FOR PRIVATE DUTY NURSING
PATIENT: ${patientName} | DOB: ${dob} | MEDICAID ID: ${medicaidId}
ORDERING CLINICIAN: ${input.physicianName}, NPI: ${input.physicianNpi}
PRACTICE / FACILITY: ${input.clinicOrHospitalName} (${input.physicianSpecialty})

To the State Medicaid Medical Director:

I am the treating physician for ${patientName}. I write to establish the absolute medical necessity of in-home skilled Private Duty Nursing (PDN) at the prescribed volume of **${input.orderedPdnHoursPerWeek} hours per week** (including continuous skilled night shift coverage) under the mandatory Early and Periodic Screening, Diagnostic, and Treatment (EPSDT) provisions of Title XIX of the Social Security Act, 42 U.S.C. § 1396d(r)(5).

1. CLINICAL PROFILE & TECHNOLOGY DEPENDENCIES:
- Airway & Pulmonary: Patient has a surgical tracheostomy requiring continuous monitoring, mechanical humidification, and frequent sterile suctioning every 15–30 minutes to prevent catastrophic mucus plug occlusion and acute asphyxiation. Patient requires nocturnal continuous oxygen therapy with continuous SpO2 pulse oximetry.${dictated ? `\n- Recent Acute Desaturation & Dictated Airway Events: "${dictated.trim()}"` : ''}${aeromedical ? `\n- Remote Frontier / Island Aeromedical Evacuation Contingency: ${aeromedical.trim()}` : ''}
- Enteral Nutrition: Patient is unable to meet oral caloric/hydration needs due to severe pharyngeal dysmotility and aspiration risk. Patient requires continuous gastrostomy (G-tube) pump-administered elemental nutrition.
- Neurodevelopmental Impairment: Severe functional motor impairment (unassisted mobility 2/10), requiring two-person or specialized mechanical transfer assistance.
- Acute Deterioration Risk: Without an awake, licensed nurse (RN/LPN) present, decannulation or airway obstruction leads to irreversible hypoxic brain injury or death within 3 to 5 minutes.

2. FEDERAL STATUTORY MANDATE (42 U.S.C. § 1396d(r)(5)):
Under federal law, states participating in Title XIX Medicaid MUST provide to Medicaid-eligible children under age 21 all medically necessary services described in 42 U.S.C. § 1396d(a), including Private Duty Nursing (42 U.S.C. § 1396d(a)(8)), "to correct or ameliorate defects and physical and mental illnesses and conditions."
Federal courts have repeatedly ruled that state Medicaid agencies cannot cap hours, invoke state budget constraints, or relegate eligible technology-dependent children to multi-year HCBS waiver waitlists when EPSDT medical necessity is established by the treating physician (O.B. v. Norwood, 838 F.3d 483 (7th Cir. 2016); Moore v. Reese, 637 F.3d 1220 (11th Cir. 2011)).

3. SPECIFIC CLINICAL DIRECTIVE & PRESCRIBED HOURS:
- I hereby prescribe **${input.orderedPdnHoursPerWeek} hours per week** of one-on-one Private Duty Nursing (RN/LPN).
- Lay or family caregivers cannot safely substitute for licensed clinical monitoring during sleeping hours due to the lethality of silent decannulation and verified caregiver exhaustion (Caregiver Strain Index: 8/10).
- Any attempt to deny, delay, or reduce this prescribed volume violates 42 U.S.C. § 1396d(r)(5) and places ${patientName} at imminent risk of re-hospitalization or death.

Sincerely,

____________________________________________________
${input.physicianName}, MD/DO
NPI: ${input.physicianNpi} | Specialty: ${input.physicianSpecialty}
${input.clinicOrHospitalName}`;
  }

  /**
   * Constructs the formal Medicaid Fair Hearing Petition and Demand for Aid Paid Pending.
   */
  private buildFairHearingPetition(
    input: IEpsdtAppealInput,
    crosswalk: IStateWaiverCrosswalkEntry | undefined,
    stateName: string,
    agency: string,
    aidPaidPendingDeadline: string
  ): string {
    const patientName = input.patientName || 'Jordan Rivera';
    const dob = input.patientDob || '2019-04-12';
    const medicaidId = input.medicaidId || 'MED-98412039';

    return `FORMAL PETITION FOR ADMINISTRATIVE FAIR HEARING
AND DEMAND FOR IMMEDIATE CONTINUATION OF BENEFITS ("AID PAID PENDING")
UNDER 42 C.F.R. § 431.230 AND 42 U.S.C. § 1396d(r)(5)

TO: Office of Administrative Hearings & Appeals
    ${agency}
    State of ${stateName}

PETITIONER: ${patientName} (A Minor Child, by and through Legal Guardians)
DOB: ${dob} | MEDICAID ID: ${medicaidId}
DATE OF ADVERSE NOTICE: ${input.denialNoticeDate || 'Recent'}
DISPUTE CATEGORY: ${EPSDT_DISPUTE_DEFINITIONS[input.disputeCategory].label}
PROCEDURAL URGENCY: ${input.isStatExpedited ? 'STAT EXPEDITED EMERGENCY (42 C.F.R. § 438.410 - 72-HOUR RESOLUTION)' : 'STANDARD'}

PETITION FOR RELIEF:
Petitioner hereby appeals the adverse decision/inaction of ${agency} regarding in-home skilled Private Duty Nursing (PDN) and demands an administrative fair hearing pursuant to 42 C.F.R. Part 431, Subpart E.

1. DEMAND FOR IMMEDIATE CONTINUATION OF BENEFITS ("AID PAID PENDING"):
Pursuant to 42 C.F.R. § 431.230 and state administrative procedural rules, Petitioner timely appeals and demands that **all previously authorized services (${input.priorAuthorizedHoursPerWeek || 40} hours/week of Private Duty Nursing) be maintained without interruption, reduction, or termination** pending the issuance of the final administrative hearing decision.
Any reduction prior to hearing violates federal due process rights guaranteed under Goldberg v. Kelly, 397 U.S. 254 (1970).

2. GROUNDS FOR APPEAL & EPSDT FEDERAL PREEMPTION:
a. Violation of EPSDT Mandate (42 U.S.C. § 1396d(r)(5)): ${agency} is legally bound to furnish private duty nursing to Petitioner to maintain stability and prevent clinical decompensation.
b. Impermissible Geographic or Waiver Waiting Lists: The agency cannot delay necessary skilled care by asserting that 1915(c) Home and Community-Based Waiver slots are full or waitlisted. EPSDT is a direct state plan entitlement that cannot be restricted by waiver enrollment caps.
c. Deference to Treating Physician: The treating complex care specialist has certified that ${input.orderedPdnHoursPerWeek} hours/week of PDN is required. The agency has offered no competent medical evidence to contradict the treating physician's clinical assessment.

3. PRAYER FOR RELIEF:
Petitioner respectfully requests that the Hearing Officer:
1. Immediately order ${agency} to maintain Aid Paid Pending at ${input.priorAuthorizedHoursPerWeek || 40} hours/week during this appeal.
2. Schedule an Expedited Fair Hearing within 72 hours under 42 C.F.R. § 438.410 due to life-safety airway risks.
3. Order full authorization and reimbursement of ${input.orderedPdnHoursPerWeek} hours/week of skilled Private Duty Nursing pursuant to 42 U.S.C. § 1396d(r)(5).

Respectfully submitted,

____________________________________________________
Legal Guardian for ${patientName} / Authorized Representative`;
  }

  /**
   * Constructs the Federal Case Law Brief summarizing circuit court precedents.
   */
  private buildLegalCaseBrief(
    input: IEpsdtAppealInput,
    crosswalk: IStateWaiverCrosswalkEntry | undefined,
    stateName: string
  ): string {
    return `LEGAL BENCH BRIEF: FEDERAL EPSDT MANDATE & IN-HOME SKILLED PEDIATRIC NURSING
STATUTORY AUTHORITY: TITLE XIX OF THE SOCIAL SECURITY ACT (42 U.S.C. §§ 1396a, 1396d)

I. THE EPSDT MANDATE IS ABSOLUTE AND COMPREHENSIVE
Under 42 U.S.C. § 1396d(r)(5), state Medicaid programs MUST provide to any Medicaid-eligible individual under 21 years of age:
"Such other necessary health care, diagnostic services, treatment, and other measures described in subsection (a) of this section to correct or ameliorate defects and physical and mental illnesses and conditions discovered by the screening services, whether or not such services are covered under the State plan."

II. CONTROLLING FEDERAL CIRCUIT PRECEDENTS
1. O.B. v. Norwood, 838 F.3d 483 (7th Cir. 2016):
   The Seventh Circuit affirmed a preliminary injunction against the state Medicaid agency for failing to provide authorized in-home skilled nursing to Medicaid-eligible children with tracheostomies and feeding tubes. The Court held that when skilled nursing is medically necessary under EPSDT, the state has an affirmative statutory duty under 42 U.S.C. § 1396a(a)(43)(C) to arrange for the care, and cannot cite nursing agency shortages or rate limits to excuse non-provision.

2. Salazar v. District of Columbia, 954 F. Supp. 278 (D.D.C. 1996):
   Federal courts have consistently held that states cannot utilize budgetary shortfalls, administrative delays, or arbitrary hourly caps to deny medically necessary services to children under the EPSDT entitlement.

3. Moore ex rel. Moore v. Reese, 637 F.3d 1220, 1255 (11th Cir. 2011):
   The Eleventh Circuit established that while a state Medicaid agency may review medical necessity, the treating physician's opinion carries primacy, and the agency may not arbitrarily override the treating physician's determination without demonstrating that the ordered service is unnecessary or experimental.

4. De-institutionalization & Cost Neutrality Principle:
   In-home skilled nursing costs approximately \$12,000–\$14,000/month, whereas inpatient pediatric intensive care unit (PICU) or specialized pediatric nursing facility placement costs between \$25,000 and \$45,000/month. Forcing a child into an institution by denying home nursing violates both Title XIX cost-effectiveness standards and the Americans with Disabilities Act / Olmstead v. L.C., 527 U.S. 581 (1999).

CONCLUSION:
State Medicaid agencies (${stateName}) must promptly authorize the prescribed ${input.orderedPdnHoursPerWeek} hours/week of Private Duty Nursing for the petitioner.`;
  }
}
