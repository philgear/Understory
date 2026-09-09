import { Injectable } from '@angular/core';
import { IEpsdtAppealPackage } from './epsdt-advocacy.service';
import { IAeromedicalCorridor, IAirAmbulanceBillingSummary } from './aeromedical-transport.service';

export interface IEdiParticipant {
  id: string;
  name: string;
  npi?: string;
  medicaidId?: string;
  dob?: string;
  gender?: 'M' | 'F' | 'U' | 'Male' | 'Female' | 'Non-binary' | 'Other' | string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface IEdiDocumentMetadata {
  controlNumber: string;
  transactionType: '278' | '837P';
  segmentCount: number;
  generatedAtIso: string;
  rawEdiContent: string;
}

@Injectable({
  providedIn: 'root'
})
export class EdiClaimsGeneratorService {
  /**
   * Formats a date as YYYYMMDD for X12 standards
   */
  private formatX12Date(date: Date = new Date()): string {
    const y = date.getFullYear().toString();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}${m}${d}`;
  }

  /**
   * Formats a time as HHMM for X12 standards
   */
  private formatX12Time(date: Date = new Date()): string {
    const h = date.getHours().toString().padStart(2, '0');
    const min = date.getMinutes().toString().padStart(2, '0');
    return `${h}${min}`;
  }

  /**
   * Generates a 9-digit deterministic or timestamp-based interchange control number
   */
  private generateControlNumber(prefix: number = 1): string {
    const now = Date.now().toString();
    return (prefix.toString() + now.slice(-8)).padStart(9, '0');
  }

  /**
   * Generates ASC X12N 005010X217 (EDI 278) Health Care Services Review Request
   * for Private Duty Nursing (PDN) Prior Authorization and Continuation of Benefits.
   */
  public generateEdi278PriorAuth(
    appeal: IEpsdtAppealPackage,
    patient?: Partial<IEdiParticipant>,
    physician?: Partial<IEdiParticipant>
  ): IEdiDocumentMetadata {
    const now = new Date();
    const dateStr = this.formatX12Date(now);
    const timeStr = this.formatX12Time(now);
    const ctrlNum = this.generateControlNumber(2);

    const ptName = (patient?.name || 'Jordan Rivera').toUpperCase().trim().split(/\s+/);
    const ptLast = ptName[ptName.length - 1] || 'RIVERA';
    const ptFirst = ptName[0] || 'JORDAN';
    const ptDob = (patient?.dob || '2019-04-12').replace(/[^0-9]/g, '');
    const ptGender = patient?.gender || 'F';
    const ptMedicaid = patient?.medicaidId || 'MED98412039';

    const cleanDr = (physician?.name || 'Dr. Eleanor Vance, MD')
      .replace(/^dr\.?\s+/i, '')
      .replace(/,\s*(MD|DO|FAAP|PHD|RN|NP).*$/i, '')
      .trim()
      .toUpperCase();
    const drName = cleanDr.split(/\s+/);
    const drLast = drName[drName.length - 1] || 'VANCE';
    const drFirst = drName[0] || 'ELEANOR';
    const drNpi = physician?.npi || '1982736450';

    const agencyName = appeal.administeringAgency.toUpperCase();
    const stateCode = appeal.stateCode.toUpperCase();

    // Build segments
    const segments: string[] = [];

    // Interchange Control Header (ISA)
    segments.push(
      `ISA*00*          *00*          *ZZ*POCKETGULL     *ZZ*${stateCode}MEDICAID   *${dateStr.slice(2)}*${timeStr}*^*00501*${ctrlNum}*0*P*:~`
    );

    // Functional Group Header (GS) - HI for Health Care Services Review
    segments.push(
      `GS*HI*POCKETGULL*${stateCode}MEDICAID*${dateStr}*${timeStr}*${ctrlNum}*X*005010X217~`
    );

    // Transaction Set Header (ST)
    segments.push(`ST*278*${ctrlNum.slice(-4)}*005010X217~`);

    // Beginning of Hierarchical Transaction (BHT)
    // 0007 = Prior Authorization Request, 13 = Request, Date/Time
    segments.push(`BHT*0007*13*REQ-${ctrlNum}*${dateStr}*${timeStr}~`);

    // HL Loop 1: Information Source (State Medicaid Agency)
    segments.push(`HL*1**20*1~`);
    segments.push(`NM1*X3*2*${agencyName}*****PI*${stateCode}MCAID~`);

    // HL Loop 2: Information Receiver (Ordering Clinician)
    segments.push(`HL*2*1*21*1~`);
    segments.push(`NM1*1P*1*${drLast}*${drFirst}****XX*${drNpi}~`);

    // HL Loop 3: Subscriber (Insured / Parent / Primary)
    segments.push(`HL*3*2*22*1~`);
    segments.push(`NM1*IL*1*${ptLast}*${ptFirst}****MI*${ptMedicaid}~`);

    // HL Loop 4: Dependent (Pediatric Patient)
    segments.push(`HL*4*3*23*1~`);
    segments.push(`NM1*QC*1*${ptLast}*${ptFirst}~`);
    segments.push(`DMG*D8*${ptDob}*${ptGender}~`);

    // HL Loop 5: Service Review Information
    segments.push(`HL*5*4*EV*0~`);
    // UM: Review Purpose (AR = Admission Review / Prior Auth), Level of Service (1 = Skilled Nursing), Facility Code (12 = Home)
    segments.push(`UM*AR*I*1*12::B~`);

    // Health Care Services Delivery (HSD): Prescribed PDN weekly hours
    // VS = Visits, DA = Days, FL = Units, WK = Weekly
    segments.push(`HSD*VS*40*WK~`);

    // Paperwork Attachment Segment (PWK) - Cites the SHA-256 Attestation Digest
    segments.push(
      `PWK*OZ*BM***FT*${appeal.cryptographicIntegrityDigest.slice(0, 30)}~`
    );

    // Transaction Set Trailer (SE)
    // Count of segments from ST to SE inclusive: segments.length - 2 (since ISA and GS are outside) + 1 for SE itself
    const transactionSegmentsCount = segments.length - 2 + 1;
    segments.push(`SE*${transactionSegmentsCount}*${ctrlNum.slice(-4)}~`);

    // Functional Group Trailer (GE)
    segments.push(`GE*1*${ctrlNum}~`);

    // Interchange Control Trailer (IEA)
    segments.push(`IEA*1*${ctrlNum}~`);

    const rawEdi = segments.join('\n');

    return {
      controlNumber: ctrlNum,
      transactionType: '278',
      segmentCount: segments.length,
      generatedAtIso: now.toISOString(),
      rawEdiContent: rawEdi
    };
  }

  /**
   * Generates ASC X12N 005010X222A1 (EDI 837P) Professional Health Care Claim
   * for Emergency Fixed-Wing Air Ambulance Transport (HCPCS A0430 & A0435).
   */
  public generateEdi837pAirAmbulanceClaim(
    corridor: IAeromedicalCorridor,
    billing: IAirAmbulanceBillingSummary,
    patient?: Partial<IEdiParticipant>
  ): IEdiDocumentMetadata {
    const now = new Date();
    const dateStr = this.formatX12Date(now);
    const timeStr = this.formatX12Time(now);
    const ctrlNum = this.generateControlNumber(8);

    const ptName = (patient?.name || 'Jordan Rivera').toUpperCase().split(' ');
    const ptLast = ptName[ptName.length - 1] || 'RIVERA';
    const ptFirst = ptName[0] || 'JORDAN';
    const ptDob = (patient?.dob || '2019-04-12').replace(/[^0-9]/g, '');
    const ptGender = patient?.gender || 'F';
    const ptMedicaid = patient?.medicaidId || 'MED98412039';

    const segments: string[] = [];

    // ISA
    segments.push(
      `ISA*00*          *00*          *ZZ*POCKETGULLAIR  *ZZ*${corridor.jurisdictionCode}MEDICAID   *${dateStr.slice(2)}*${timeStr}*^*00501*${ctrlNum}*0*P*:~`
    );

    // GS - HC for Health Care Claim (837)
    segments.push(
      `GS*HC*POCKETGULLAIR*${corridor.jurisdictionCode}MEDICAID*${dateStr}*${timeStr}*${ctrlNum}*X*005010X222A1~`
    );

    // ST
    segments.push(`ST*837*${ctrlNum.slice(-4)}*005010X222A1~`);

    // BHT: 0019 = Claim, 00 = Original
    segments.push(`BHT*0019*00*CLM-${ctrlNum}*${dateStr}*${timeStr}*CH~`);

    // Loop 1000A: Submitter
    segments.push(`NM1*41*2*POCKETGULL CRITICAL CARE AIR TRANSPORT*****46*PGMEDEVAC~`);
    segments.push(`PER*IC*DISPATCH FLIGHT DESK*TE*8005550199~`);

    // Loop 1000B: Receiver
    segments.push(`NM1*40*2*${corridor.jurisdictionName.toUpperCase()} MEDICAID ASSISTANCE*****46*${corridor.jurisdictionCode}MED~`);

    // Loop 2000A: Billing Provider (Air Ambulance Entity)
    segments.push(`HL*1**20*1~`);
    segments.push(`NM1*85*2*CRITICAL CARE AEROMEDICAL SERVICES LLC*****XX*1992837465~`);
    segments.push(`N3*AIR AMBULANCE RAMP HANGAR 4~`);
    segments.push(`N4*${corridor.originFacility.split('/')[0].trim().toUpperCase()}*${corridor.jurisdictionCode}*96913~`);

    // Loop 2000B: Subscriber (Patient)
    segments.push(`HL*2*1*22*0~`);
    segments.push(`SBR*P*18*******MC~`); // MC = Medicaid
    segments.push(`NM1*IL*1*${ptLast}*${ptFirst}****MI*${ptMedicaid}~`);
    segments.push(`DMG*D8*${ptDob}*${ptGender}~`);

    // Loop 2300: Claim Information
    const totalClaimUsd = billing.estimatedTotalTransportUsd.toFixed(2);
    segments.push(`CLM*AIR-EVAC-${ctrlNum}*${totalClaimUsd}***41:B:1*Y*A*Y*Y*P~`);

    // DTP: Date of Service
    segments.push(`DTP*472*D8*${dateStr}~`);

    // CR1: Ambulance Transport Information
    // CR1*Unit of Measure*Patient Weight*Ambulance Reason Code*Distance Units*Transport Distance (miles)
    segments.push(`CR1*LB*45*A*DH*${corridor.distanceStatuteMiles}~`);

    // CR2: Ambulance Certification (Emergency condition code)
    segments.push(`CR2*01*EMERGENCY STAT AIR EVACUATION UNSTABLE AIRWAY COMPROMISE~`);

    // NTE: Claim Note citing statutory waiver
    segments.push(`NTE*ADD*EMTALA 42 USC 1395dd / 42 CFR 440.170 EMERGENCY AIR EVAC PRIOR AUTH WAIVED~`);

    // HI: Principal Diagnosis (e.g. Z99.11 Dependence on respirator [ventilator], J96.00 Acute respiratory failure)
    segments.push(`HI*BK:J9600*BF:Z9911~`);

    // Loop 2400: Service Line 1 - HCPCS A0430 (Base Air Transport)
    segments.push(`LX*1~`);
    segments.push(`SV1*HC:A0430*${billing.estimatedBaseAllowanceUsd.toFixed(2)}*UN*1***1~`);
    segments.push(`DTP*472*D8*${dateStr}~`);

    // Loop 2400: Service Line 2 - HCPCS A0435 (Air Mileage)
    segments.push(`LX*2~`);
    segments.push(
      `SV1*HC:A0435*${billing.estimatedMileageAllowanceUsd.toFixed(2)}*UN*${corridor.distanceStatuteMiles}***1~`
    );
    segments.push(`DTP*472*D8*${dateStr}~`);

    // SE Trailer
    const transactionCount = segments.length - 2 + 1;
    segments.push(`SE*${transactionCount}*${ctrlNum.slice(-4)}~`);

    // GE
    segments.push(`GE*1*${ctrlNum}~`);

    // IEA
    segments.push(`IEA*1*${ctrlNum}~`);

    const rawEdi = segments.join('\n');

    return {
      controlNumber: ctrlNum,
      transactionType: '837P',
      segmentCount: segments.length,
      generatedAtIso: now.toISOString(),
      rawEdiContent: rawEdi
    };
  }
}
