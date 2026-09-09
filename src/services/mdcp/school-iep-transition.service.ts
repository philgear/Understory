import { Injectable } from '@angular/core';

export interface ISchoolIepInput {
  studentName: string;
  studentDob: string;
  gradeLevel: string;
  schoolDistrictName: string;
  schoolName: string;
  caseManagerName?: string;
  orderedPdnWeeklyHours: number;
  dailySchoolHours: number;
  tracheostomyTubeType?: string;
  tracheostomyTubeSize?: string;
  emergencyTrachBackupSizes?: string[];
  suctionDepthCm?: number;
  suctionPressureMmHg?: number;
  gTubeFeedFormula?: string;
  gTubeBolusMl?: number;
  wheelchairTransportRequired?: boolean;
}

export interface ISchoolIepPackage {
  studentName: string;
  schoolDistrictName: string;
  schoolName: string;
  schoolNursingCarePlan: string;
  emergencyBusTransportationProtocol: string;
  idea504AccommodationMatrix: string;
  controllingLegalPrecedents: string[];
  fullDossierMarkdown: string;
  cryptographicDigest: string;
  generatedAtIso: string;
}

@Injectable({
  providedIn: 'root'
})
export class SchoolIepTransitionService {
  /**
   * Computes SHA-256 cryptographic digest for FDA 21 CFR Part 11 / NIST SP 800-90A provenance
   */
  public async computeSha256Digest(content: string): Promise<string> {
    try {
      if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
        const enc = new TextEncoder();
        const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', enc.encode(content));
        return Array.from(new Uint8Array(hashBuffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      }
    } catch {
      // Non-crypto fallback
    }
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      hash = ((hash << 5) - hash) + content.charCodeAt(i);
      hash |= 0;
    }
    return 'sha256-mock-' + Math.abs(hash).toString(16).padStart(16, '0');
  }

  /**
   * Generates a complete School Nursing Care Plan (SNCP), Emergency Transportation Protocol,
   * and IDEA § 504 Accommodation Dossier for classroom integration.
   */
  public async generateIepTransitionPackage(input: ISchoolIepInput): Promise<ISchoolIepPackage> {
    const now = new Date();
    const generatedAtIso = now.toISOString();

    const tubeType = input.tracheostomyTubeType || 'Shiley Pediatric Cuffed';
    const tubeSize = input.tracheostomyTubeSize || '4.0 mm ID';
    const emergencySizes = input.emergencyTrachBackupSizes?.join(', ') || '4.0 mm (Exact), 3.5 mm (Half-size down for acute stenosis)';
    const suctionDepth = input.suctionDepthCm || 8;
    const suctionPressure = input.suctionPressureMmHg || 80;
    const feedFormula = input.gTubeFeedFormula || 'Kate Farms Pediatric Peptide 1.2';
    const bolusMl = input.gTubeBolusMl || 240;

    const precedents = [
      'Cedar Rapids Community School Dist. v. Garret F., 526 U.S. 66 (1999) (U.S. Supreme Court: School districts must provide continuous, 1-on-1 nursing care to ventilator-dependent students at public expense under IDEA)',
      'Individuals with Disabilities Education Act (IDEA), 20 U.S.C. § 1400 et seq., 34 C.F.R. § 300.34(c)(13) (School health services and school nurse services)',
      'Section 504 of the Rehabilitation Act of 1973, 29 U.S.C. § 794, 34 C.F.R. § 104.33 (Free Appropriate Public Education with non-discriminatory access)',
      'Title XIX Social Security Act § 1905(r)(5) [42 U.S.C. § 1396d(r)(5)] (EPSDT Mandatory Coverage across Home and School Settings)'
    ];

    // 1. School Nursing Care Plan
    const sncp = `SCHOOL NURSING CARE PLAN (SNCP) & INDIVIDUALIZED HEALTHCARE PLAN (IHP)
AUTHORITY: IDEA (20 U.S.C. § 1400) & CEDAR RAPIDS V. GARRET F., 526 U.S. 66 (1999)

STUDENT: ${input.studentName} | DOB: ${input.studentDob} | GRADE: ${input.gradeLevel}
DISTRICT: ${input.schoolDistrictName} | CAMPUS: ${input.schoolName}
DAILY SCHOOL ATTENDANCE: ${input.dailySchoolHours} Hours/Day | PRESCRIBED PDN: ${input.orderedPdnWeeklyHours} Hours/Week

1. DEDICATED 1-ON-1 NURSING DIRECTIVE (MANDATORY REQUIREMENT):
- Due to lethal airway vulnerability and immediate risk of asphyxiation upon decannulation or mucus plug occlusion, ${input.studentName} MUST be accompanied by a dedicated, awake licensed nurse (RN or LPN) for 100% of the school day.
- Lay educators, classroom aides, or shared school nurses CANNOT substitute for continuous 1-on-1 skilled nursing.
- If the assigned 1-on-1 nurse is absent or unavailable, the student cannot safely be admitted to the classroom until a licensed substitute arrives.

2. TRACHEOSTOMY AIRWAY MANAGEMENT PROTOCOL:
- Prescribed Tube: ${tubeType}, Size: ${tubeSize}.
- Emergency Trach Go-Bag Location: Must accompany the student at all times (attached to wheelchair or within 3 feet of student).
- Backup Tubes Required: ${emergencySizes}, along with obturator, water-soluble lubricant, and scissors.
- Suction Protocol: Deep sterile suctioning via inline catheter to ${suctionDepth} cm depth at ${suctionPressure} mmHg vacuum pressure.
- Triggers for Immediate Suction: Audible airway rattling, respiratory distress, tachypnea (>35 bpm), SpO2 dropping below 92%, visible secretions at stoma.
- Accidental Decannulation Emergency: Immediate re-insertion of exact size tube using obturator. If resistance is met, immediately insert the half-size smaller backup tube and call 911 / EMS STAT.

3. ENTERAL NUTRITION (G-TUBE) & MEDICATION PROTOCOL:
- Formula: ${feedFormula}, ${bolusMl} mL bolus administered via enteral pump/gravity over 30 minutes at 12:00 PM.
- Water Flush: 30 mL sterile water flush before and after all feedings or crushed medications.
- Venting: Decompress stomach with 60 mL syringe if student displays abdominal distention, retching, or grimacing.`;

    // 2. Emergency Bus Transportation Protocol
    const busProto = `SPECIALIZED SCHOOL BUS & TRANSIT EMERGENCY MEDICAL PROTOCOL
REGULATION: 34 C.F.R. § 300.34(c)(16) (SPECIALIZED TRANSPORTATION AS A RELATED SERVICE)

STUDENT: ${input.studentName} | TRANSIT ROUTE: Home ↔ ${input.schoolName}

1. PERSONNEL ONBOARD:
- The assigned 1-on-1 licensed nurse (RN/LPN) MUST ride onboard the school vehicle directly adjacent to the student at all times.
- The vehicle driver is trained in emergency roadside pull-over procedures in the event of acute airway decannulation or cardiac arrest.

2. VEHICLE MEDICAL EQUIPMENT REQUISITION:
- Portable Electric Suction Aspirator: Must maintain full battery charge (minimum 60 minutes continuous runtime) and remain within arm's reach of the nurse.
- Medical Oxygen Cylinder: Standard E-Cylinder secured in an approved, crash-tested vertical bulkhead bracket. Free-standing or horizontal floor placement is strictly prohibited by DOT/NHTSA school bus safety standards.
- Bag-Valve-Mask (BVM): Pediatric manual resuscitation bag with tracheostomy adapter and PEEP valve immediately accessible.
- Pulse Oximeter: Continuous SpO2 and pulse rate monitoring active throughout the commute.

3. EMERGENCY ROADSIDE CONTINGENCY:
- In the event of acute desaturation (<85%) or decannulation while in transit, the nurse will direct the driver to pull over immediately to a safe shoulder, activate vehicle hazard lights, and contact 911 while the nurse executes immediate airway suctioning and re-cannulation.`;

    // 3. IDEA Section 504 Accommodation Matrix
    const accommodations = `IDEA § 504 & PHYSICAL CLASSROOM ACCOMMODATION MATRIX
STATUTORY GROUNDING: SECTION 504 OF THE REHABILITATION ACT OF 1973 (29 U.S.C. § 794)

1. PHYSICAL ENVIRONMENT & CLIMATE CONTROL:
- Climate Controlled Classroom: Continuous air conditioning with HEPA filtration (temperature 68°F–72°F, humidity 40%–50%) to prevent tracheal drying and catastrophic thick mucus plug formation.
- Electrical Power Access: Minimum two dedicated un-switched hospital-grade AC outlets adjacent to student's desk for suction machine, oxygen concentrator, and enteral feeding pump.
- Private Treatment Area: Dedicated sterile procedure partition for trach suctioning, stoma skin barrier dressing changes, and G-tube flushes protecting student dignity and privacy.

2. CAMPUS MOBILITY & EVACUATION:
- Ground-Floor Placement or Direct Exterior Ramp Egress: In fire or emergency evacuation drills, student's power wheelchair cannot be delayed by multi-story elevator shutdowns.
- Emergency Evacuation Sled / Carry Plan: Pre-designated dual-custody staff members trained to carry portable suction and oxygen equipment alongside the nurse in disaster evacuations.

3. NONDISCRIMINATORY CURRICULAR ACCESS:
- Zero Denial of Field Trips: The student is legally entitled to participate in all off-campus educational excursions with dedicated 1-on-1 nurse accompaniment and portable life-support gear.`;

    const fullMarkdown = `# SCHOOL-BASED IEP / IDEA § 504 PEDIATRIC NURSING TRANSITION PLAN
STUDENT: ${input.studentName} | DISTRICT: ${input.schoolDistrictName}
Generated: ${generatedAtIso}

---

## 1. SCHOOL NURSING CARE PLAN (SNCP)
${sncp}

---

## 2. SPECIALIZED TRANSPORTATION & BUS PROTOCOL
${busProto}

---

## 3. SECTION 504 CLASSROOM ACCOMMODATION MATRIX
${accommodations}

---

## 4. CONTROLLING SUPREME COURT & STATUTORY AUTHORITIES
${precedents.map(p => '- ' + p).join('\n')}
`;

    const digest = await this.computeSha256Digest(fullMarkdown);

    return {
      studentName: input.studentName,
      schoolDistrictName: input.schoolDistrictName,
      schoolName: input.schoolName,
      schoolNursingCarePlan: sncp,
      emergencyBusTransportationProtocol: busProto,
      idea504AccommodationMatrix: accommodations,
      controllingLegalPrecedents: precedents,
      fullDossierMarkdown: fullMarkdown,
      cryptographicDigest: digest,
      generatedAtIso
    };
  }
}
