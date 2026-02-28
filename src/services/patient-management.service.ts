import { Injectable, inject, signal, effect, WritableSignal, computed, untracked } from '@angular/core';
import { PatientStateService } from './patient-state.service';
import { ClinicalIntelligenceService, AnalysisLens } from './clinical-intelligence.service';
import {
  Bookmark,
  HistoryEntry,
  Patient,
  PatientState,
  BodyPartIssue
} from './patient.types';

// Re-export for use in other components
export type { BodyPartIssue };

// Mock Data
const MOCK_PATIENTS: Patient[] = [
  {
    id: 'p001',
    name: 'Robert Davis',
    age: 58,
    gender: 'Male',
    lastVisit: '2024.11.20',
    preexistingConditions: ['Obesity (BMI 42)', 'Severe Obstructive Sleep Apnea', 'Metabolic Syndrome'],
    patientGoals: 'Discuss CPAP compliance issues and weight management strategies.',
    vitals: { bp: '152/95', hr: '88', temp: '98.4°F', spO2: '94%', weight: '295 lbs', height: `5'10"` },
    issues: {
      'chest': [{ id: 'chest', noteId: 'note_p001_chest_1', name: 'Chest & Lungs', painLevel: 1, description: 'Reports waking up gasping for air frequently. Daytime somnolence affecting work performance.', symptoms: [] }],
      'head': [{ id: 'head', noteId: 'note_p001_head_1', name: 'Head & Neck', painLevel: 2, description: 'Morning headaches nearly every day, likely secondary to hypoxemia and OSA.', symptoms: [] }]
    },
    history: [
      {
        type: 'Visit',
        date: '2024.10.10',
        summary: 'Initial consultation for sleep study follow-up.',
        state: {
          patientGoals: 'Review sleep study results.',
          vitals: { bp: '148/92', hr: '85', temp: '98.6°F', spO2: '96%', weight: '298 lbs', height: `5'10"` },
          issues: {}
        }
      }
    ],
    bookmarks: []
  },
  {
    id: 'p002',
    name: 'Sarah Jenkins',
    age: 42,
    gender: 'Female',
    lastVisit: '2024.12.01',
    preexistingConditions: ['Chronic Lower Back Pain', 'Opioid Use Disorder (in remission)', 'Depression'],
    patientGoals: 'Seeking alternative pain management options to avoid opioid relapse.',
    vitals: { bp: '118/72', hr: '76', temp: '98.2°F', spO2: '99%', weight: '145 lbs', height: `5'5"` },
    issues: {
      'mid_back': [{ id: 'mid_back', noteId: 'note_p002_back_1', name: 'Lower Back', painLevel: 7, description: 'Constant aching pain in L4-L5 region radiating to the left glute. Worsens with prolonged standing.', symptoms: [] }]
    },
    history: [
      {
        type: 'Visit',
        date: '2024.10.15',
        summary: 'Discussion of physical therapy and cognitive behavioral therapy for pain.',
        state: {
          patientGoals: 'Need help managing flare-ups without medication.',
          vitals: { bp: '120/75', hr: '74', temp: '98.5°F', spO2: '99%', weight: '148 lbs', height: `5'5"` },
          issues: { 'mid_back': [{ id: 'mid_back', noteId: 'note_p002_back_hist1', name: 'Lower Back', painLevel: 6, description: 'Pain has been increasing recently due to work stress.', symptoms: [] }] }
        }
      }
    ],
    bookmarks: []
  },
  {
    id: 'p003',
    name: 'William Henderson',
    age: 81,
    gender: 'Male',
    lastVisit: '2024.12.05',
    preexistingConditions: ["Mild Cognitive Impairment / Early Alzheimer's", 'Osteoarthritis', 'Fall Risk'],
    patientGoals: 'Family requested evaluation for increased confusion and recent fall at home.',
    vitals: { bp: '135/82', hr: '68', temp: '97.9°F', spO2: '97%', weight: '162 lbs', height: `5'9"` },
    issues: {
      'head': [{ id: 'head', noteId: 'note_p003_head_1', name: 'Brain & Cognition', painLevel: 0, description: `Daughter reports patient got lost returning from the grocery store yesterday. Requires prompting for ADLs. MoCA score: 18/30.`, symptoms: [] }],
      'r_arm': [{ id: 'r_arm', noteId: 'note_p003_arm_1', name: 'Right Arm / Wrist', painLevel: 4, description: 'Bruising and tenderness from mechanical fall two days ago. X-ray negative for fracture.', symptoms: [] }]
    },
    history: [
      { type: 'Visit', date: '2024.06.12', summary: '6-month geriatric assessment.', state: { patientGoals: 'Routine check, family notes mild forgetfulness.', vitals: { bp: '130/80', hr: '70', temp: '98.1°F', spO2: '98%', weight: '165 lbs', height: `5'9"` }, issues: { 'head': [{ id: 'head', noteId: 'note_p003_head_hist2', name: 'Brain & Cognition', painLevel: 0, description: 'Mild short-term memory deficits noted.', symptoms: [] }] } } },
    ],
    bookmarks: []
  }
];


@Injectable({
  providedIn: 'root'
})
export class PatientManagementService {
  private patientState = inject(PatientStateService);
  private geminiService = inject(ClinicalIntelligenceService);

  readonly patients = signal<Patient[]>(MOCK_PATIENTS);
  readonly selectedPatientId: WritableSignal<string | null> = signal(MOCK_PATIENTS[0]?.id || null);
  readonly selectedPatient = computed(() => {
    const id = this.selectedPatientId();
    return id ? this.patients().find(p => p.id === id) : null;
  });

  constructor() {
    // This effect runs whenever the selected patient changes.
    // It's the central point for orchestrating app state updates.
    effect(() => {
      const patientId = this.selectedPatientId();

      if (patientId) {
        // Important: Use untracked here so we only run this effect when the *selected patient ID* changes,
        // NOT every time the patients array updates (which happens on every keystroke due to auto-save).
        const patient = untracked(() => this.patients().find(p => p.id === patientId));
        if (patient) {
          // Load the selected patient's data into the main state service
          this.patientState.loadState(patient);
          this.findAndLoadActivePatientSummary(patient.history);

          // Reset the AI analysis first, then load the existing one if we have it
          this.geminiService.resetAIState();

          const latestAnalysis = patient.history.find(entry => entry.type === 'AnalysisRun' || entry.type === 'FinalizedPatientSummary');
          if (latestAnalysis) {
            if (latestAnalysis.type === 'AnalysisRun') {
              this.geminiService.loadArchivedAnalysis(latestAnalysis.report);
            } else if (latestAnalysis.type === 'FinalizedPatientSummary') {
              this.geminiService.loadArchivedAnalysis(latestAnalysis.report);
            }
          }
        }
      } else {
        // No patient is selected, so clear the state for a new entry
        this.patientState.clearState();
        this.geminiService.resetAIState();
      }
    }); // Warning: direct signal writes in effects are discouraged but sometimes necessary for orchestration 
  }

  private findAndLoadActivePatientSummary(history: HistoryEntry[]) {
    // Find the most recent patient summary update
    const latestSummary = history.find(entry => entry.type === 'PatientSummaryUpdate');
    if (latestSummary) {
      this.patientState.updateActivePatientSummary(latestSummary.summary);
    } else {
      this.patientState.updateActivePatientSummary(null);
    }
  }

  /** Selects a patient, saving the current one's state first. */
  selectPatient(id: string) {
    if (this.selectedPatientId() === id) return;
    this.saveCurrentPatientState();
    this.selectedPatientId.set(id);
  }

  /** Reloads the current patient's most up-to-date state. Used to exit "review mode". */
  reloadCurrentPatient() {
    const patientId = this.selectedPatientId();
    if (!patientId) return;
    const patient = this.patients().find(p => p.id === patientId);
    if (patient) {
      this.patientState.loadState(patient);
      this.geminiService.resetAIState();

      // Reload the latest analysis so the panel isn't empty after exiting review mode
      const latestAnalysis = patient.history.find(entry => entry.type === 'AnalysisRun' || entry.type === 'FinalizedPatientSummary');
      if (latestAnalysis && (latestAnalysis.type === 'AnalysisRun' || latestAnalysis.type === 'FinalizedPatientSummary')) {
        this.geminiService.loadArchivedAnalysis(latestAnalysis.report);
      }
    }
  }

  /** Creates a new patient record and selects it. */
  createNewPatient() {
    this.saveCurrentPatientState();

    const newPatientId = `p_${Date.now()}`;
    const newPatient: Patient = {
      id: newPatientId,
      name: 'New Patient',
      age: 0,
      gender: 'Other',
      lastVisit: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
      patientGoals: '',
      preexistingConditions: [],
      vitals: { bp: '', hr: '', temp: '', spO2: '', weight: '', height: '' },
      issues: {},
      history: [],
      bookmarks: []
    };

    // Add to the top of the list for immediate visibility
    this.patients.update(patients => [newPatient, ...patients]);
    this.selectedPatientId.set(newPatientId);
  }

  /** Removes a patient record. */
  removePatient(id: string) {
    const isActive = this.selectedPatientId() === id;

    this.patients.update(patients => {
      const filtered = patients.filter(p => p.id !== id);

      // If we removed the active patient, select the next available one or null
      if (isActive) {
        if (filtered.length > 0) {
          // Use setTimeout to avoid expression changed after checked and ensure safe state transition
          setTimeout(() => this.selectedPatientId.set(filtered[0].id));
        } else {
          setTimeout(() => this.selectedPatientId.set(null));
        }
      }

      return filtered;
    });
  }

  /** Imports a pre-built Patient object (from JSON or FHIR import). */
  importPatient(patient: Patient) {
    this.saveCurrentPatientState();
    this.patients.update(patients => [patient, ...patients]);
    this.selectedPatientId.set(patient.id);
  }

  /** Updates the core demographic details of a patient. */
  updatePatientDetails(id: string, details: Partial<{ name: string; age: number; gender: Patient['gender'], patientGoals: string }>) {
    this.patients.update(patients =>
      patients.map(p =>
        p.id === id ? { ...p, ...details } : p
      )
    );
  }

  /** Adds a new entry to a patient's history. */
  addHistoryEntry(patientId: string, entry: HistoryEntry) {
    this.patients.update(patients =>
      patients.map(p => {
        if (p.id !== patientId) return p;

        const updatedHistory = [entry, ...p.history];

        if (entry.type === 'Visit') {
          return { ...p, history: updatedHistory, lastVisit: entry.date };
        }

        return { ...p, history: updatedHistory };
      })
    );
  }

  /** Updates an existing entry in a patient's history, or adds it if it doesn't exist. */
  updateHistoryEntry(patientId: string, entry: HistoryEntry, matchFn: (e: HistoryEntry) => boolean) {
    this.patients.update(patients =>
      patients.map(p => {
        if (p.id !== patientId) return p;

        const index = p.history.findIndex(matchFn);
        if (index === -1) {
          // Add if not found
          const updatedHistory = [entry, ...p.history];
          if (entry.type === 'Visit') {
            return { ...p, history: updatedHistory, lastVisit: entry.date };
          }
          return { ...p, history: updatedHistory };
        }

        // Update existing
        const updatedHistory = [...p.history];
        updatedHistory[index] = entry;
        return { ...p, history: updatedHistory };
      })
    );
  }

  /** Adds a bookmark to the currently selected patient. */
  addBookmark(bookmark: Bookmark) {
    const patientId = this.selectedPatientId();
    if (!patientId) return;

    // Add the bookmark to the list
    this.patients.update(patients =>
      patients.map(p =>
        p.id === patientId
          ? { ...p, bookmarks: [...p.bookmarks, bookmark] }
          : p
      )
    );

    // Add a corresponding history entry
    const historyEntry: HistoryEntry = {
      type: 'BookmarkAdded',
      date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
      summary: bookmark.title,
      bookmark: bookmark
    };
    this.addHistoryEntry(patientId, historyEntry);
  }

  /** Removes a bookmark from the currently selected patient. */
  removeBookmark(url: string) {
    const patientId = this.selectedPatientId();
    if (!patientId) return;

    this.patients.update(patients =>
      patients.map(p =>
        p.id === patientId
          ? { ...p, bookmarks: p.bookmarks.filter(b => b.url !== url) }
          : p
      )
    );
  }

  /** Updates an existing bookmark's metadata. */
  updateBookmark(url: string, updates: Partial<Bookmark>) {
    const patientId = this.selectedPatientId();
    if (!patientId) return;

    this.patients.update(patients =>
      patients.map(p => {
        if (p.id !== patientId) return p;
        return {
          ...p,
          bookmarks: p.bookmarks.map(b => b.url === url ? { ...b, ...updates } : b)
        };
      })
    );
  }

  deleteNoteAndHistory(noteEntry: HistoryEntry) {
    if (noteEntry.type !== 'NoteCreated') return;

    const patientId = this.selectedPatientId();
    if (!patientId) return;

    this.patients.update(patients =>
      patients.map(p => {
        if (p.id !== patientId) return p;

        // Create a mutable copy of the patient
        const updatedPatient = { ...p, issues: { ...p.issues } };

        // 1. Remove note from issues
        const issuesForPart = updatedPatient.issues[noteEntry.partId] || [];
        const updatedIssuesForPart = issuesForPart.filter(i => i.noteId !== noteEntry.noteId);

        if (updatedIssuesForPart.length > 0) {
          updatedPatient.issues[noteEntry.partId] = updatedIssuesForPart;
        } else {
          delete updatedPatient.issues[noteEntry.partId];
        }

        // 2. Remove entry from history
        updatedPatient.history = updatedPatient.history.filter(h => {
          if (h.type === 'NoteCreated' && h.noteId === noteEntry.noteId) {
            return false; // filter this one out
          }
          return true;
        });

        return updatedPatient;
      })
    );
  }

  /** Loads the state from a past visit into the main app state for review. */
  loadArchivedVisit(patientId: string, visit: HistoryEntry, select?: { partId: string; noteId: string }) {
    if ((visit.type !== 'Visit' && visit.type !== 'ChartArchived') || !visit.state) return;

    this.saveCurrentPatientState();
    this.patientState.loadState(visit.state);
    this.geminiService.resetAIState();
    this.patientState.setViewingPastVisit(visit);

    // Load the analysis report associated with this visit's date (if one exists)
    const patient = this.patients().find(p => p.id === patientId);
    if (patient) {
      const associatedAnalysis = patient.history.find(entry =>
        (entry.type === 'AnalysisRun' || entry.type === 'FinalizedPatientSummary') && entry.date === visit.date
      );
      if (associatedAnalysis && (associatedAnalysis.type === 'AnalysisRun' || associatedAnalysis.type === 'FinalizedPatientSummary')) {
        this.geminiService.loadArchivedAnalysis(associatedAnalysis.report);
      }
    }

    // After loading the historical state, select the specific note if requested.
    if (select) {
      this.patientState.selectPart(select.partId);
      this.patientState.selectNote(select.noteId);
    }
  }

  /** Loads the state from a past analysis into the main app state for review. */
  loadArchivedAnalysis(analysis: HistoryEntry) {
    if (analysis.type !== 'AnalysisRun') return;
    this.saveCurrentPatientState();
    this.patientState.clearIssuesAndGoalsForReview();
    this.geminiService.loadArchivedAnalysis(analysis.report);
    this.patientState.setViewingPastVisit(analysis);
  }


  /** Persists the current form state to the patient object in the list. */
  private saveCurrentPatientState() {
    const currentId = this.selectedPatientId();
    if (!currentId) return;

    const currentState = this.patientState.getCurrentState();
    this.patients.update(patients =>
      patients.map(p =>
        p.id === currentId ? { ...p, ...currentState } : p
      )
    );
  }
}