import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { PatientStateService } from '../patient-state.service';

export interface IPreconditionBoundary {
  minSpO2?: number;
  maxSpO2?: number;
  minHeartRate?: number;
  maxHeartRate?: number;
  minSystolicBp?: number;
  maxSystolicBp?: number;
  requiredMeds?: string[];
  prohibitedMeds?: string[];
  maxAltitudeFt?: number;
  minBarometricPressureMmHg?: number;
}

export type RecommendationValidityStatus =
  | 'ACTIVE_VALID'
  | 'STALE_REQUIRING_REASSESSMENT'
  | 'CONTRAINDICATED_CRITICAL';

export interface IClinicalStateDelta {
  parameter: string;
  baselineValue: number | string;
  currentValue: number | string;
  boundaryLimit: number | string;
  urgency: 'STAT' | 'WARNING' | 'INFORMATIONAL';
  clinicalDeltaDirective: string;
}

export interface IClinicalRecommendationContract {
  id: string;
  title: string;
  recommendationText: string;
  generatedAtIso: string;
  snapshotVitals: {
    hr?: number;
    spO2?: number;
    systolicBp?: number;
  };
  boundary: IPreconditionBoundary;
  status: RecommendationValidityStatus;
  breachedDelta?: IClinicalStateDelta;
}

@Injectable({
  providedIn: 'root'
})
export class ClinicalPreconditionSentinelService {
  private patientState = inject(PatientStateService, { optional: true });

  private readonly baseContracts = signal<Array<Omit<IClinicalRecommendationContract, 'status' | 'breachedDelta'>>>([]);

  readonly registeredContracts = computed<IClinicalRecommendationContract[]>(() => {
    const vitals = this.extractNumericVitals(this.patientState?.vitals());
    return this.baseContracts().map(c => this.evaluateContract({ ...c, status: 'ACTIVE_VALID' }, vitals));
  });

  readonly staleOrCriticalContracts = computed(() => {
    return this.registeredContracts().filter(
      c => c.status === 'STALE_REQUIRING_REASSESSMENT' || c.status === 'CONTRAINDICATED_CRITICAL'
    );
  });

  readonly hasActiveBreaches = computed(() => {
    return this.staleOrCriticalContracts().length > 0;
  });

  /**
   * Registers a new clinical recommendation with explicit physiological boundary conditions
   */
  public registerRecommendation(
    input: Omit<IClinicalRecommendationContract, 'status' | 'breachedDelta'>
  ): IClinicalRecommendationContract {
    this.baseContracts.update(list => [...list.filter(c => c.id !== input.id), input]);
    const current = this.registeredContracts().find(c => c.id === input.id);
    return current || this.evaluateContract({ ...input, status: 'ACTIVE_VALID' }, this.extractNumericVitals(this.patientState?.vitals()));
  }

  /**
   * Evaluates a single recommendation contract against specified or live vitals
   */
  public evaluateContract(
    contract: IClinicalRecommendationContract,
    currentVitals: { hr?: number; spO2?: number; systolicBp?: number },
    activeMeds: string[] = []
  ): IClinicalRecommendationContract {
    const b = contract.boundary;
    let status: RecommendationValidityStatus = 'ACTIVE_VALID';
    let delta: IClinicalStateDelta | undefined = undefined;

    // 1. SpO2 Oxygenation check
    if (b.minSpO2 !== undefined && currentVitals.spO2 !== undefined) {
      if (currentVitals.spO2 < b.minSpO2) {
        status = currentVitals.spO2 < 88 ? 'CONTRAINDICATED_CRITICAL' : 'STALE_REQUIRING_REASSESSMENT';
        delta = {
          parameter: 'SpO2',
          baselineValue: contract.snapshotVitals.spO2 ?? 'N/A',
          currentValue: currentVitals.spO2,
          boundaryLimit: b.minSpO2,
          urgency: currentVitals.spO2 < 88 ? 'STAT' : 'WARNING',
          clinicalDeltaDirective: `Patient SpO2 dropped to ${currentVitals.spO2}% (breaching safe boundary ≥${b.minSpO2}%). Previous recommendation "${contract.title}" is invalidated. Re-assess airway and oxygenation immediately.`
        };
      }
    }

    // 2. Heart Rate tachycardia/bradycardia check
    if (status === 'ACTIVE_VALID' && b.maxHeartRate !== undefined && currentVitals.hr !== undefined) {
      if (currentVitals.hr > b.maxHeartRate) {
        status = currentVitals.hr > 140 ? 'CONTRAINDICATED_CRITICAL' : 'STALE_REQUIRING_REASSESSMENT';
        delta = {
          parameter: 'Heart Rate',
          baselineValue: contract.snapshotVitals.hr ?? 'N/A',
          currentValue: currentVitals.hr,
          boundaryLimit: b.maxHeartRate,
          urgency: currentVitals.hr > 140 ? 'STAT' : 'WARNING',
          clinicalDeltaDirective: `Heart rate increased to ${currentVitals.hr} bpm (exceeding safe boundary ≤${b.maxHeartRate} bpm). Previous recommendation "${contract.title}" requires hemodynamic reassessment.`
        };
      }
    } else if (status === 'ACTIVE_VALID' && b.minHeartRate !== undefined && currentVitals.hr !== undefined) {
      if (currentVitals.hr < b.minHeartRate) {
        status = currentVitals.hr < 45 ? 'CONTRAINDICATED_CRITICAL' : 'STALE_REQUIRING_REASSESSMENT';
        delta = {
          parameter: 'Heart Rate',
          baselineValue: contract.snapshotVitals.hr ?? 'N/A',
          currentValue: currentVitals.hr,
          boundaryLimit: b.minHeartRate,
          urgency: currentVitals.hr < 45 ? 'STAT' : 'WARNING',
          clinicalDeltaDirective: `Severe bradycardia detected: HR ${currentVitals.hr} bpm (below minimum threshold ${b.minHeartRate} bpm). Invalidate previous care directive and evaluate perfusion.`
        };
      }
    }

    // 3. Blood Pressure check
    if (status === 'ACTIVE_VALID' && b.minSystolicBp !== undefined && currentVitals.systolicBp !== undefined) {
      if (currentVitals.systolicBp < b.minSystolicBp) {
        status = 'CONTRAINDICATED_CRITICAL';
        delta = {
          parameter: 'Systolic BP',
          baselineValue: contract.snapshotVitals.systolicBp ?? 'N/A',
          currentValue: currentVitals.systolicBp,
          boundaryLimit: b.minSystolicBp,
          urgency: 'STAT',
          clinicalDeltaDirective: `Hypotensive crisis: Systolic BP fell to ${currentVitals.systolicBp} mmHg (below minimum threshold ${b.minSystolicBp} mmHg). Vasodilators or fluid-restrictive orders must be halted immediately.`
        };
      }
    }

    // 4. Prohibited Medication / Drug Interaction check
    if (status === 'ACTIVE_VALID' && b.prohibitedMeds && b.prohibitedMeds.length > 0) {
      const lowerActive = activeMeds.map(m => m.toLowerCase());
      const interactingMed = b.prohibitedMeds.find(p => lowerActive.some(a => a.includes(p.toLowerCase())));
      if (interactingMed) {
        status = 'CONTRAINDICATED_CRITICAL';
        delta = {
          parameter: 'Medication Contraindication',
          baselineValue: 'None',
          currentValue: interactingMed,
          boundaryLimit: `Prohibited: ${interactingMed}`,
          urgency: 'STAT',
          clinicalDeltaDirective: `Newly active medication "${interactingMed}" creates a high-risk contraindication against "${contract.title}". Recommendation revoked.`
        };
      }
    }

    return {
      ...contract,
      status,
      breachedDelta: delta
    };
  }

  /**
   * Re-evaluates all registered contracts against latest patient vitals
   */
  public reassessAllContracts(): void {
    this.baseContracts.update(l => [...l]);
  }

  /**
   * Acknowledges a stale or contraindicated recommendation and removes or archives it
   */
  public acknowledgeAndRetire(contractId: string): void {
    this.baseContracts.update(list => list.filter(c => c.id !== contractId));
  }

  /**
   * Helper to parse string or numeric vitals from PatientStateService
   */
  private extractNumericVitals(rawVitals: any): { hr?: number; spO2?: number; systolicBp?: number } {
    if (!rawVitals) return {};

    const hr = rawVitals.hr ? parseFloat(String(rawVitals.hr)) : undefined;
    const spO2 = rawVitals.spO2 ? parseFloat(String(rawVitals.spO2)) : undefined;

    let systolicBp: number | undefined = undefined;
    if (rawVitals.bp) {
      const parts = String(rawVitals.bp).split('/');
      if (parts[0]) systolicBp = parseFloat(parts[0]);
    }

    return {
      hr: isNaN(hr as number) ? undefined : hr,
      spO2: isNaN(spO2 as number) ? undefined : spO2,
      systolicBp: isNaN(systolicBp as number) ? undefined : systolicBp
    };
  }
}
