import { Injectable, signal, computed } from '@angular/core';

export interface BodyPartIssue {
  id: string;
  name: string;
  painLevel: number; // 1-10
  description: string;
  symptoms: string[];
}

export interface PatientVitals {
  bp: string;      // Blood Pressure
  hr: string;      // Heart Rate
  temp: string;    // Temperature
  spO2: string;    // Oxygen Saturation
  weight: string;
  height: string;
}

@Injectable({
  providedIn: 'root'
})
export class PatientStateService {
  // Currently selected body part ID for the form
  readonly selectedPartId = signal<string | null>(null);

  // Map of body part ID to issue details
  readonly issues = signal<Record<string, BodyPartIssue>>({});
  
  // General patient goals
  readonly patientGoals = signal<string>("");

  // Patient Vitals
  readonly vitals = signal<PatientVitals>({
    bp: '', hr: '', temp: '', spO2: '', weight: '', height: ''
  });

  readonly hasIssues = computed(() => 
    Object.keys(this.issues()).length > 0 || this.patientGoals().length > 0
  );

  // Helper to check if a part has an issue
  hasIssue(partId: string): boolean {
    return !!this.issues()[partId];
  }

  selectPart(partId: string | null) {
    this.selectedPartId.set(partId);
  }

  updateIssue(partId: string, issue: BodyPartIssue) {
    this.issues.update(current => ({
      ...current,
      [partId]: issue
    }));
  }

  removeIssue(partId: string) {
    this.issues.update(current => {
      const updated = { ...current };
      delete updated[partId];
      return updated;
    });
  }

  updateGoals(goals: string) {
    this.patientGoals.set(goals);
  }

  updateVital(field: keyof PatientVitals, value: string) {
    this.vitals.update(current => ({
      ...current,
      [field]: value
    }));
  }

  getAllDataForPrompt(): string {
    const issues = this.issues();
    const vitals = this.vitals();
    
    const partsText = Object.values(issues).map((i: BodyPartIssue) => 
      `- Body Part: ${i.name}, Pain Level: ${i.painLevel}/10, Description: ${i.description}`
    ).join('\n');

    const vitalsText = `
    - BP: ${vitals.bp || 'N/A'}
    - HR: ${vitals.hr || 'N/A'}
    - Temp: ${vitals.temp || 'N/A'}
    - SpO2: ${vitals.spO2 || 'N/A'}
    - Weight: ${vitals.weight || 'N/A'}
    - Height: ${vitals.height || 'N/A'}
    `;
    
    return `
    Patient Goals/Chief Complaint: ${this.patientGoals()}
    
    Vitals:
    ${vitalsText}

    Reported Body Issues:
    ${partsText || 'None selected'}
    `;
  }
}