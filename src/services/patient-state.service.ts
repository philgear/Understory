import { Injectable, signal, computed } from '@angular/core';
import { HistoryEntry } from './patient-management.service';

export interface BodyPartIssue {
  id: string; // body part id
  noteId: string; // unique note id
  name: string;
  painLevel: number; // 1-10
  description: string;
  symptoms: string[];
  recommendation?: string;
}

export interface PatientVitals {
  bp: string;      // Blood Pressure
  hr: string;      // Heart Rate
  temp: string;    // Temperature
  spO2: string;    // Oxygen Saturation
  weight: string;
  height: string;
}

export interface ClinicalNote {
  id: string;
  text: string;
  sourceLens: string;
  date: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface PatientState {
  issues: Record<string, BodyPartIssue[]>;
  patientGoals: string;
  vitals: PatientVitals;
  clinicalNotes?: ClinicalNote[];
  checklist?: ChecklistItem[];
}

export const BODY_PART_NAMES: Record<string, string> = {
  'head': 'Head & Neck',
  'chest': 'Chest & Upper Torso',
  'abdomen': 'Abdomen & Stomach',
  'pelvis': 'Pelvis & Hips',
  'r_shoulder': 'Right Shoulder',
  'r_arm': 'Right Arm',
  'r_hand': 'Right Hand & Wrist',
  'l_shoulder': 'Left Shoulder',
  'l_arm': 'Left Arm',
  'l_hand': 'Left Hand & Wrist',
  'r_thigh': 'Right Thigh',
  'r_shin': 'Right Lower Leg',
  'r_foot': 'Right Foot',
  'l_thigh': 'Left Thigh',
  'l_shin': 'Left Lower Leg',
  'l_foot': 'Left Foot'
};

export const BODY_PART_MAPPING: Record<string, string> = {
  'head': 'head',
  'head and neck': 'head',
  'neck': 'head',

  'chest': 'chest',
  'chest and upper torso': 'chest',
  'upper torso': 'chest',

  'abdomen': 'abdomen',
  'stomach': 'abdomen',
  'abdomen and stomach': 'abdomen',

  'pelvis': 'pelvis',
  'hips': 'pelvis',
  'pelvis and hips': 'pelvis',

  'right shoulder': 'r_shoulder',
  'right arm': 'r_arm',

  'right hand': 'r_hand',
  'right wrist': 'r_hand',
  'right hand and wrist': 'r_hand',

  'left shoulder': 'l_shoulder',
  'left arm': 'l_arm',

  'left hand': 'l_hand',
  'left wrist': 'l_hand',
  'left hand and wrist': 'l_hand',

  'right thigh': 'r_thigh',
  'right upper leg': 'r_thigh',

  'right shin': 'r_shin',
  'right lower leg': 'r_shin',

  'right foot': 'r_foot',

  'left thigh': 'l_thigh',
  'left upper leg': 'l_thigh',

  'left shin': 'l_shin',
  'left lower leg': 'l_shin',

  'left foot': 'l_foot'
};

@Injectable({
  providedIn: 'root'
})
export class PatientStateService {
  // --- UI State ---
  readonly selectedPartId = signal<string | null>(null);
  readonly selectedNoteId = signal<string | null>(null);
  readonly isLiveAgentActive = signal<boolean>(false);
  readonly liveAgentInput = signal<string>('');
  readonly isResearchFrameVisible = signal<boolean>(false);
  readonly analysisUpdateRequest = signal(0);
  readonly requestedResearchUrl = signal<string | null>(null);
  readonly requestedResearchQuery = signal<string | null>(null);
  readonly viewingPastVisit = signal<HistoryEntry | null>(null);
  readonly bodyViewerMode = signal<'3d' | '2d'>('3d');
  readonly isInternalView = signal<boolean>(false);

  // --- Patient Data State ---
  readonly issues = signal<Record<string, BodyPartIssue[]>>({});
  readonly patientGoals = signal<string>("");
  readonly vitals = signal<PatientVitals>({
    bp: '', hr: '', temp: '', spO2: '', weight: '', height: ''
  });
  readonly clinicalNotes = signal<ClinicalNote[]>([]);
  readonly checklist = signal<ChecklistItem[]>([]);
  readonly activeCarePlan = signal<string | null>(null);
  readonly draftCarePlanItems = signal<string[]>([]); // Array of discrete recommendation items for the generative plan

  // A trigger to force the UI to expand the analysis panel when an item is selected/clicked
  readonly uiExpandTrigger = signal<number>(0);

  constructor() { }

  // --- Computed State ---
  readonly hasIssues = computed(() =>
    Object.keys(this.issues()).length > 0 || this.patientGoals().length > 0
  );

  readonly selectedPartName = computed(() => {
    const id = this.selectedPartId();
    if (!id) return null;
    return BODY_PART_NAMES[id] || id;
  });

  // Helper to check if a part has any notes
  hasIssue(partId: string): boolean {
    const issues = this.issues()[partId];
    return !!issues && issues.length > 0;
  }

  // Helper to check if a part has a note with a pain level > 0
  hasPainfulIssue(partId: string): boolean {
    const issues = this.issues()[partId];
    return !!issues && issues.some(i => i.painLevel > 0);
  }

  // --- Actions ---
  triggerUiExpand() {
    this.uiExpandTrigger.set(Date.now());
  }

  selectPart(partId: string | null) {
    this.selectedPartId.set(partId);
    this.triggerUiExpand();
    if (!partId) {
      this.selectedNoteId.set(null); // Deselect note when part is deselected
    }
  }

  selectNote(noteId: string | null) {
    this.selectedNoteId.set(noteId);
  }

  toggleLiveAgent(active: boolean) {
    this.isLiveAgentActive.set(active);
  }

  toggleResearchFrame(visible?: boolean) {
    if (visible === undefined) {
      this.isResearchFrameVisible.update(v => !v);
    } else {
      this.isResearchFrameVisible.set(visible);
    }
  }

  updateIssue(partId: string, issue: BodyPartIssue) {
    this.issues.update(current => {
      const issuesForPart = current[partId] ? [...current[partId]] : [];
      const existingIndex = issuesForPart.findIndex(i => i.noteId === issue.noteId);
      if (existingIndex > -1) {
        // Update existing issue
        issuesForPart[existingIndex] = issue;
      } else {
        // Add new issue
        issuesForPart.push(issue);
      }
      return {
        ...current,
        [partId]: issuesForPart
      };
    });
  }

  removeIssueNote(partId: string, noteId: string) {
    this.issues.update(current => {
      const issuesForPart = current[partId] || [];
      const updatedIssuesForPart = issuesForPart.filter(i => i.noteId !== noteId);
      const updated = { ...current };
      if (updatedIssuesForPart.length > 0) {
        updated[partId] = updatedIssuesForPart;
      } else {
        // If no issues are left for this part, remove the part key
        delete updated[partId];
      }
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

  updateActiveCarePlan(plan: string | null) {
    this.activeCarePlan.set(plan);
  }

  // --- Care Plan Drafting Actions ---
  addClinicalNote(note: ClinicalNote) {
    this.clinicalNotes.update(notes => [...notes, note]);
  }

  removeClinicalNote(id: string) {
    this.clinicalNotes.update(notes => notes.filter(n => n.id !== id));
  }

  addDraftCarePlanItem(item: string) {
    this.draftCarePlanItems.update(items => {
      if (items.includes(item)) return items;
      return [...items, item];
    });
  }

  addChecklistItem(item: ChecklistItem) {
    this.checklist.update(items => [...items, item]);
  }

  toggleChecklistItem(id: string) {
    this.checklist.update(items => items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  }

  removeChecklistItem(id: string) {
    this.checklist.update(items => items.filter(item => item.id !== id));
  }

  removeDraftCarePlanItem(itemToRemove: string) {
    this.draftCarePlanItems.update(items => items.filter(item => item !== itemToRemove));
  }

  clearDraftCarePlanItems() {
    this.draftCarePlanItems.set([]);
  }

  requestAnalysisUpdate() {
    this.analysisUpdateRequest.update(v => v + 1);
  }

  requestResearchUrl(url: string) {
    this.requestedResearchUrl.set(url);
  }

  requestResearchSearch(query: string) {
    this.requestedResearchQuery.set(query);
    this.toggleResearchFrame(true);
  }

  setViewingPastVisit(visit: HistoryEntry | null) {
    this.viewingPastVisit.set(visit);
  }


  // --- State Management for Multi-Patient ---

  /** Clears all patient data to represent a clean slate. */
  clearState() {
    this.selectedPartId.set(null);
    this.selectedNoteId.set(null);
    this.isLiveAgentActive.set(false); // also end any active consult
    this.isResearchFrameVisible.set(false);
    this.issues.set({});
    this.patientGoals.set('');
    this.vitals.set({ bp: '', hr: '', temp: '', spO2: '', weight: '', height: '' });
    this.clinicalNotes.set([]);
    this.checklist.set([]);
    this.activeCarePlan.set(null);
    this.draftCarePlanItems.set([]);
    this.requestedResearchUrl.set(null);
    this.requestedResearchQuery.set(null);
    this.viewingPastVisit.set(null);
  }

  /** Clears only patient data, leaving UI state intact, for review mode */
  clearIssuesAndGoalsForReview() {
    this.selectedPartId.set(null);
    this.selectedNoteId.set(null);
    this.issues.set({});
    this.patientGoals.set('');
    this.draftCarePlanItems.set([]);
    // Do not clear clinicalNotes or checklist here
  }

  /** Loads the state of a specific patient. */
  loadState(state: PatientState) {
    this.clearState(); // Start from a clean slate
    this.issues.set(state.issues);
    this.patientGoals.set(state.patientGoals);
    this.vitals.set(state.vitals);
    this.clinicalNotes.set(state.clinicalNotes || []);
    this.checklist.set(state.checklist || []);
    this.viewingPastVisit.set(null); // Ensure we're not in review mode when loading a patient.
  }

  /** Returns the current patient state for saving. */
  getCurrentState(): PatientState {
    return {
      issues: this.issues(),
      patientGoals: this.patientGoals(),
      vitals: this.vitals(),
      clinicalNotes: this.clinicalNotes(),
      checklist: this.checklist(),
    };
  }


  // --- Data Aggregation ---
  getAllDataForPrompt(patientHistory: HistoryEntry[] = []): string {
    const issues = this.issues();
    const vitals = this.vitals();
    const carePlan = this.activeCarePlan();

    // 1. Current Issues
    const partsText = Object.values(issues).flat().map((i: BodyPartIssue) =>
      `- Body Part: ${i.name}, Pain Level: ${i.painLevel}/10, Description: ${i.description}`
    ).join('\n');

    // 2. Vitals
    const vitalsText = `
    - BP: ${vitals.bp || 'N/A'}
    - HR: ${vitals.hr || 'N/A'}
    - Temp: ${vitals.temp || 'N/A'}
    - SpO2: ${vitals.spO2 || 'N/A'}
    - Weight: ${vitals.weight || 'N/A'}
    - Height: ${vitals.height || 'N/A'}
    `;

    // 3. Historical Context (Last 3 visits and recent notes)
    const recentHistory = patientHistory
      .filter(h => h.type === 'Visit' || h.type === 'NoteCreated' || h.type === 'BookmarkAdded')
      .slice(0, 5) // Limit to last 5 relevant entries to keep context manageable
      .map(h => {
        if (h.type === 'Visit') return `- Visit (${h.date}): ${h.summary}`;
        if (h.type === 'NoteCreated') return `- Note (${h.date}): ${h.summary}`;
        if (h.type === 'BookmarkAdded') return `- Bookmark (${h.date}): ${h.summary}`;
        return '';
      }).join('\n');

    let prompt = `
    Patient Goals/Chief Complaint: ${this.patientGoals()}
    
    Vitals:
    ${vitalsText}

    Reported Body Issues (Current):
    ${partsText || 'None selected'}

    Recent History & Context:
    ${recentHistory || 'No recent history available.'}
    `;

    if (carePlan) {
      prompt += `
      \n----\n
      IMPORTANT: A physician-created care plan is already in place. Your analysis should align with, and build upon, this plan. Do not contradict it.
      Care Plan:
      ${carePlan}
      \n----
      `;
    }

    return prompt;
  }
}