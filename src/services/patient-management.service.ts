import { Injectable, inject, signal, effect, WritableSignal, computed, untracked } from '@angular/core';
import { PatientStateService, PatientState, BodyPartIssue } from './patient-state.service';
import { ClinicalIntelligenceService, AnalysisLens } from './clinical-intelligence.service';

export interface Bookmark {
  title: string;
  url: string;
}

export type HistoryEntry = {
  type: 'Visit';
  date: string;
  summary: string;
  state: PatientState;
} | {
  type: 'ChartArchived';
  date: string;
  summary: string;
  state: PatientState;
} | {
  type: 'CarePlanUpdate';
  date: string;
  summary: string;
} | {
  type: 'BookmarkAdded';
  date: string;
  summary: string;
  bookmark: Bookmark;
} | {
  type: 'NoteCreated';
  date: string;
  summary: string; // e.g. "Note added for Head & Neck"
  partId: string;
  noteId: string;
} | {
  type: 'NoteDeleted';
  date: string;
  summary: string; // e.g. "Note deleted for Head & Neck"
  partId: string;
  noteId: string;
} | {
  type: 'AnalysisRun';
  date: string;
  summary: string;
  report: Partial<Record<AnalysisLens, string>>;
} | {
  type: 'FinalizedCarePlan';
  date: string;
  summary: string;
  report: Partial<Record<AnalysisLens, string>>;
  annotations: Record<string, Record<string, { note: string, bracketState: 'normal' | 'added' | 'removed' }>>;
};

export interface Patient extends PatientState {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Non-binary' | 'Other';
  lastVisit: string;
  preexistingConditions: string[];
  history: HistoryEntry[];
  bookmarks: Bookmark[];
}

// Re-export for use in other components
export type { BodyPartIssue };

// Mock Data
const MOCK_PATIENTS: Patient[] = [
  {
    id: 'p001',
    name: 'Alex Vance',
    age: 45,
    gender: 'Non-binary',
    lastVisit: '2024.06.15',
    preexistingConditions: ['Migraines', 'Cervical Spondylosis'],
    patientGoals: 'Follow-up on persistent cervicogenic headaches and associated right shoulder tension.',
    vitals: { bp: '130/85', hr: '72', temp: '98.7°F', spO2: '98%', weight: '155 lbs', height: `5'7"` },
    issues: {
      'head': [{ id: 'head', noteId: 'note_p001_head_1', name: 'Head & Neck', painLevel: 7, description: 'Reports a dull, throbbing pain originating from the neck and radiating to the temples, rated 7/10. Pain worsens throughout the day, particularly with prolonged computer use.', symptoms: [] }],
      'r_shoulder': [{ id: 'r_shoulder', noteId: 'note_p001_rshoulder_1', name: 'Right Shoulder', painLevel: 5, description: 'Describes a persistent stiffness and ache in the right trapezius and shoulder, rated 5/10, with a noted decrease in cervical rotation.', symptoms: [] }]
    },
    history: [
      {
        type: 'AnalysisRun',
        date: '2024.06.15',
        summary: 'Care Plan Generated',
        report: {
          'Care Plan Overview': `### Executive Care Strategy
**STATUS:** HIGH PRIORITY INTERVENTION

<hr/>

#### Functional Rationale
Analysis of Eleanor's biometric trends indicates a direct correlation between sustained shoulder tension and headache onset. Vitals remain within normal parameters (BP: 130/85), though a 12% increase in heart rate is noted during peak pain episodes.

- **Pathology:** Cervicogenic origin confirmed via segmental testing.
- **Biometrics:** Stable BP suggests pain-induced sympathetic drive.

#### Prioritized Objectives
1. **Acute Tension Relief:** Targeted myofascial release of right trapezius and levator scapulae.
2. **Cervical Stabilization:** Address C2-C3 mobility restrictions via Grade II manual therapy.
3. **Ergonomic Drift:** Correct forward head posture (FHP) through workstation optimization.`,
          'Functional Protocols': `### Functional Protocols
**TARGETED THERAPEUTIC ROADMAP**

<hr/>

#### Phase 01: Acute Normalization
- **Manual Therapy:** Grade II Cervical Mobilization. Focus on C2-C3 segments to restore arthrokinematics.
- **Neuromuscular:** Dry Needling (RA). Active trigger point release in the upper trapezius.

#### Phase 02: Structural Re-education
- Implement **Deep Neck Flexor (DNF)** training protocol. Initial focus on isometric chin tucks with biofeedback monitoring to ensure recruitment of longus colli over superficial musculature.

#### Wholistic Trajectory
> **70% Pain Reduction | 15° ROM Increase**
> *Expected stabilization of C-spine within 4-6 weeks of adherence.*`,
          'Monitoring & Follow-up': `### Track & Review Protocol
**OBSERVATION & ESCALATION**

<hr/>

| Parameter | Frequency | Threshold / Goal | Action |
| :--- | :---: | :--- | :--- |
| **Pain Level (VAS)**| Daily | < 3/10 | Maintain NSAIDs PRN |
| **Cervical ROM**    | Weekly | > 45° rotation | Advance to Phase 02 PT |
| **Headache Freq.**  | Weekly | < 2 episodes/wk | Continue current plan |

#### Red Flag Escalation
**IMMEDIATE REVIEW REQUIRED IF:**
- Onset of radicular symptoms (numbness/tingling in right UE).
- Sudden, severe "thunderclap" headache.
- Loss of cervical motor control.`,
          'Patient Education': `### Patient Directives
**LIFESTYLE & ACTIVITY MODIFICATIONS**

<hr/>

#### 1. Postural Awareness
- **Action:** Anchor "chin tuck" posture to frequent environmental triggers (e.g., every time you send an email).
- **Rationale:** Reduces chronic loading on the suboccipital muscles.

#### 2. Thermal Modulation
- **Action:** 15 mins alternating Heat/Cold therapy on the right shoulder, 3x daily.
- **Rationale:** Heat promotes vasodilation for healing; cold interrupts the pain-spasm cycle.

#### 3. Autonomic Regulation
- **Action:** Integrate 4-7-8 breathing technique during peak stress hours.
- **Rationale:** Mitigates the sympathetic nervous system's amplification of perceived pain.`
        }
      },
      { type: 'BookmarkAdded', date: '2024.06.15', summary: 'Cervicogenic Headaches', bookmark: { title: 'Cervicogenic Headaches', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=cervicogenic+headache' } },
      {
        type: 'Visit',
        date: '2024.05.10',
        summary: 'Initial consultation for neck stiffness.',
        state: {
          patientGoals: 'Initial consultation for neck stiffness and right shoulder pain.',
          vitals: { bp: '128/82', hr: '70', temp: '98.6°F', spO2: '99%', weight: '155 lbs', height: `5'7"` },
          issues: {
            'head': [{ id: 'head', noteId: 'note_p001_head_hist1', name: 'Head & Neck', painLevel: 6, description: 'Patient reports moderate neck stiffness, worse on the right side.', symptoms: [] }],
            'r_shoulder': [{ id: 'r_shoulder', noteId: 'note_p001_rshoulder_hist1', name: 'Right Shoulder', painLevel: 4, description: 'Dull ache in right shoulder, seems related to neck.', symptoms: [] }]
          }
        }
      },
      {
        type: 'Visit',
        date: '2024.04.22',
        summary: 'Annual physical examination.',
        state: {
          patientGoals: 'Annual physical, feeling generally well.',
          vitals: { bp: '120/80', hr: '68', temp: '98.6°F', spO2: '99%', weight: '154 lbs', height: `5'7"` },
          issues: {}
        }
      }
    ],
    bookmarks: [
      { title: 'Cervicogenic Headaches', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=cervicogenic+headache' },
    ]
  },
  {
    id: 'p002',
    name: 'Jordan Holloway',
    age: 38,
    gender: 'Female',
    lastVisit: '2024.05.20',
    preexistingConditions: ['History of Sciatica'],
    patientGoals: 'Evaluation of recurrent lumbar strain, exacerbated by recent improper lifting.',
    vitals: { bp: '122/80', hr: '65', temp: '98.6°F', spO2: '99%', weight: '180 lbs', height: `6'1"` },
    issues: {
      'lower_back': [{ id: 'lower_back', noteId: 'note_p002_lowerback_1', name: 'Lower Back', painLevel: 6, description: 'Patient reports acute, sharp pain (6/10) in the lower lumbar region upon flexion. This transitions to a constant, dull ache when sitting for over 20 minutes. No radiating pain or numbness reported.', symptoms: [] }]
    },
    history: [
      {
        type: 'Visit',
        date: '2024.05.20',
        summary: 'Follow-up for lumbar strain.',
        state: {
          patientGoals: 'Follow-up for lumbar strain, reporting significant improvement with rest.',
          vitals: { bp: '120/80', hr: '65', temp: '98.6°F', spO2: '99%', weight: '180 lbs', height: `6'1"` },
          issues: { 'lower_back': [{ id: 'lower_back', noteId: 'note_p002_lowerback_hist1', name: 'Lower Back', painLevel: 3, description: 'Patient reports pain is much improved, now a dull ache (3/10) only with prolonged sitting. No sharp pain on flexion.', symptoms: [] }] }
        }
      },
      {
        type: 'Visit',
        date: '2024.05.05',
        summary: 'Injury assessment post-lifting incident.',
        state: {
          patientGoals: 'Assessment of back pain after lifting a heavy box.',
          vitals: { bp: '125/85', hr: '75', temp: '98.6°F', spO2: '98%', weight: '180 lbs', height: `6'1"` },
          issues: { 'lower_back': [{ id: 'lower_back', noteId: 'note_p002_lowerback_hist2', name: 'Lower Back', painLevel: 8, description: 'Severe sharp pain in lower back after lifting incident yesterday.', symptoms: [] }] }
        }
      }
    ],
    bookmarks: []
  },
  {
    id: 'p003',
    name: 'Sam Petrova',
    age: 29,
    gender: 'Male',
    lastVisit: '2024.07.01',
    preexistingConditions: ['IBS (unconfirmed)'],
    patientGoals: 'Seeking consultation for chronic postprandial bloating, abdominal cramping, and general gastrointestinal discomfort.',
    vitals: { bp: '115/75', hr: '68', temp: '98.5°F', spO2: '99%', weight: '135 lbs', height: `5'5"` },
    issues: {
      'abdomen': [{ id: 'abdomen', noteId: 'note_p003_abdomen_1', name: 'Abdomen & Stomach', painLevel: 4, description: `Patient describes a diffuse abdominal ache, rated 4/10, accompanied by significant bloating and a feeling of 'fullness' within 30 minutes after eating most meals. Reports cramping is intermittent and not localized. No signs of nausea or vomiting.`, symptoms: [] }]
    },
    history: [
      { type: 'Visit', date: '2024.06.18', summary: 'Dietary follow-up and symptom check.', state: { patientGoals: 'Dietary follow-up.', vitals: { bp: '115/75', hr: '68', temp: '98.5°F', spO2: '99%', weight: '135 lbs', height: `5'5"` }, issues: { 'abdomen': [{ id: 'abdomen', noteId: 'note_p003_abdomen_hist1', name: 'Abdomen & Stomach', painLevel: 5, description: 'Still experiencing bloating and discomfort.', symptoms: [] }] } } },
      { type: 'Visit', date: '2024.05.15', summary: 'Initial consult for gastrointestinal issues.', state: { patientGoals: 'Chronic stomach bloating and pain.', vitals: { bp: '118/76', hr: '70', temp: '98.5°F', spO2: '99%', weight: '138 lbs', height: `5'5"` }, issues: { 'abdomen': [{ id: 'abdomen', noteId: 'note_p003_abdomen_hist2', name: 'Abdomen & Stomach', painLevel: 6, description: 'Bloating after every meal for the last few months.', symptoms: [] }] } } },
    ],
    bookmarks: []
  },
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
          this.findAndLoadActiveCarePlan(patient.history);

          // Reset the AI analysis first, then load the existing one if we have it
          this.geminiService.resetAIState();

          const latestAnalysis = patient.history.find(entry => entry.type === 'AnalysisRun' || entry.type === 'FinalizedCarePlan');
          if (latestAnalysis) {
            if (latestAnalysis.type === 'AnalysisRun') {
              this.geminiService.loadArchivedAnalysis(latestAnalysis.report);
            } else if (latestAnalysis.type === 'FinalizedCarePlan') {
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

  private findAndLoadActiveCarePlan(history: HistoryEntry[]) {
    // Find the most recent care plan update
    const latestCarePlan = history.find(entry => entry.type === 'CarePlanUpdate');
    if (latestCarePlan) {
      this.patientState.updateActiveCarePlan(latestCarePlan.summary);
    } else {
      this.patientState.updateActiveCarePlan(null);
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
      const latestAnalysis = patient.history.find(entry => entry.type === 'AnalysisRun' || entry.type === 'FinalizedCarePlan');
      if (latestAnalysis && (latestAnalysis.type === 'AnalysisRun' || latestAnalysis.type === 'FinalizedCarePlan')) {
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
        (entry.type === 'AnalysisRun' || entry.type === 'FinalizedCarePlan') && entry.date === visit.date
      );
      if (associatedAnalysis && (associatedAnalysis.type === 'AnalysisRun' || associatedAnalysis.type === 'FinalizedCarePlan')) {
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