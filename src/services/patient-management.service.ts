import { Injectable, inject, signal, effect, WritableSignal, computed, untracked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
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
export type { BodyPartIssue, HistoryEntry, Patient };

// Mock Data
const MOCK_PATIENTS: Patient[] = [
  {
    id: 'p001',
    name: 'Robert Davis',
    age: 58,
    gender: 'Male',
    lastVisit: '2024.11.20',
    preexistingConditions: ['Essential Hypertension', 'Type 2 Diabetes Mellitus', 'Obesity (BMI 42)', 'Severe Obstructive Sleep Apnea', 'Metabolic Syndrome'],
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
    bookmarks: [],
    scans: [
      {
        id: 'scan_003',
        type: 'X-Ray',
        title: 'PA and Lateral Chest',
        date: '2024.10.12',
        bodyPartId: 'chest',
        description: 'Bilateral hyperinflation consistent with COPD. No focal consolidation, pneumothorax or pleural effusion. Borderline cardiomegaly.',
        status: 'Reviewed',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Chest_xray_mac.jpg/640px-Chest_xray_mac.jpg'
      }
    ]
  },
  {
    id: 'p002',
    name: 'Sarah Jenkins',
    age: 42,
    gender: 'Female',
    lastVisit: '2024.12.01',
    preexistingConditions: ['Asthma', 'Anxiety Disorder', 'Chronic Lower Back Pain', 'Opioid Use Disorder (in remission)', 'Depression'],
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
    bookmarks: [],
    scans: [
      {
        id: 'scan_001',
        type: 'MRI',
        title: 'Lumbar Spine MRI',
        date: '2024.11.15',
        bodyPartId: 'lower_back',
        description: 'L4-L5 disc desiccation and mild paracentral disc protrusion without significant canal stenosis. Mild bilateral neural foraminal narrowing.',
        status: 'Reviewed',
        // Example realistic MRI URL from Wikimedia Commons
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/MRI_of_the_Lumbar_Spine_%28Sagittal_View%29.jpg/640px-MRI_of_the_Lumbar_Spine_%28Sagittal_View%29.jpg'
      },
      {
        id: 'scan_002',
        type: 'X-Ray',
        title: 'Lumbar Spine AP/Lateral X-Ray',
        date: '2024.11.02',
        bodyPartId: 'lower_back',
        description: 'Normal alignment. No fracture or acute bony abnormality. Mild degenerative disc disease at L4-L5.',
        status: 'Reviewed',
        // Example realistic X-Ray URL from Wikimedia Commons
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/X-ray_of_the_lumbar_spine_%28lateral_view%29.jpg/640px-X-ray_of_the_lumbar_spine_%28lateral_view%29.jpg'
      }
    ]
  },
  {
    id: 'p003',
    name: 'William Henderson',
    age: 81,
    gender: 'Male',
    lastVisit: '2024.12.05',
    preexistingConditions: ['Ischemic Heart Disease', 'Chronic Kidney Disease', "Mild Cognitive Impairment / Early Alzheimer's", 'Osteoarthritis', 'Fall Risk'],
    patientGoals: 'Family requested evaluation for increased confusion and recent fall at home.',
    vitals: { bp: '135/82', hr: '68', temp: '97.9°F', spO2: '97%', weight: '162 lbs', height: `5'9"` },
    issues: {
      'head': [{ id: 'head', noteId: 'note_p003_head_1', name: 'Brain & Cognition', painLevel: 0, description: `Daughter reports patient got lost returning from the grocery store yesterday. Requires prompting for ADLs. MoCA score: 18/30.`, symptoms: [] }],
      'r_arm': [{ id: 'r_arm', noteId: 'note_p003_arm_1', name: 'Right Arm / Wrist', painLevel: 4, description: 'Bruising and tenderness from mechanical fall two days ago. X-ray negative for fracture.', symptoms: [] }]
    },
    history: [
      { type: 'Visit', date: '2024.06.12', summary: '6-month geriatric assessment.', state: { patientGoals: 'Routine check, family notes mild forgetfulness.', vitals: { bp: '130/80', hr: '70', temp: '98.1°F', spO2: '98%', weight: '165 lbs', height: `5'9"` }, issues: { 'head': [{ id: 'head', noteId: 'note_p003_head_hist2', name: 'Brain & Cognition', painLevel: 0, description: 'Mild short-term memory deficits noted.', symptoms: [] }] } } },
    ],
    bookmarks: [],
    scans: [
      {
        id: 'scan_004',
        type: 'CT Scan',
        title: 'Non-Contrast Head CT',
        date: '2024.12.04',
        bodyPartId: 'head',
        description: 'Mild diffuse age-related volume loss. No acute intracranial hemorrhage or mass effect. Tiny focal areas of chronic microvascular ischemic disease.',
        status: 'Reviewed',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/CT_scan_of_the_brain.jpg/640px-CT_scan_of_the_brain.jpg'
      },
      {
        id: 'scan_005',
        type: 'X-Ray',
        title: 'Right Forearm/Wrist',
        date: '2024.12.04',
        bodyPartId: 'r_arm',
        description: 'No acute displaced fracture or dislocation. Degenerative changes in radiocarpal joint.',
        status: 'Reviewed',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/X-Ray_of_Colles_Fracture.jpg/640px-X-Ray_of_Colles_Fracture.jpg'
      }
    ]
  },
  {
    id: 'p004',
    name: 'Global Sentinel',
    age: 72,
    gender: 'Other',
    lastVisit: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
    preexistingConditions: [],
    patientGoals: 'Evaluate global mortality risks and complex multimorbidity presentation.',
    vitals: { bp: '155/95', hr: '88', temp: '98.6°F', spO2: '92%', weight: '185 lbs', height: `5'8"` },
    issues: {
      'full_body': [{
        id: 'full_body',
        noteId: 'note_p004_full_1',
        name: 'Systemic Health',
        painLevel: 5,
        description: 'Patient exhibits clinical signs or risks associated with the top 10 global causes of death based on WHO 2021 estimates.',
        symptoms: [
          { name: 'Ischaemic heart disease', type: 'Cardiovascular', verified: true, timeline: 'Chronic' },
          { name: 'COVID-19', type: 'Respiratory/Infectious', verified: true, timeline: 'Acute/Chronic' },
          { name: 'Stroke', type: 'Neurological/Cardiovascular', verified: true, timeline: 'Acute' },
          { name: 'Chronic obstructive pulmonary disease (COPD)', type: 'Respiratory', verified: true, timeline: 'Chronic' },
          { name: 'Lower respiratory infections', type: 'Respiratory/Infectious', verified: true, timeline: 'Acute' },
          { name: 'Trachea, bronchus, and lung cancers', type: 'Oncology', verified: true, timeline: 'Chronic' },
          { name: 'Alzheimer\'s disease and other dementias', type: 'Neurological', verified: true, timeline: 'Progressive' },
          { name: 'Diabetes mellitus', type: 'Metabolic', verified: true, timeline: 'Chronic' },
          { name: 'Kidney diseases', type: 'Renal', verified: true, timeline: 'Chronic' },
          { name: 'Hypertensive heart disease', type: 'Cardiovascular', verified: true, timeline: 'Chronic' }
        ]
      }]
    },
    history: [
      {
        type: 'Visit',
        date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
        summary: 'Comprehensive review of multimorbidity indicators.',
        state: {
          patientGoals: 'Evaluate global mortality risks.',
          vitals: { bp: '155/95', hr: '88', temp: '98.6°F', spO2: '92%', weight: '185 lbs', height: `5'8"` },
          issues: {}
        }
      }
    ],
    bookmarks: [],
    scans: []
  },
  {
    id: 'p005',
    name: 'CDC Sentinel',
    age: 78,
    gender: 'Other',
    lastVisit: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
    preexistingConditions: [],
    patientGoals: 'Evaluate US mortality risks and complex multimorbidity presentation.',
    vitals: { bp: '148/92', hr: '82', temp: '98.4°F', spO2: '94%', weight: '195 lbs', height: `5'9"` },
    issues: {
      'full_body': [{
        id: 'full_body',
        noteId: 'note_p005_full_1',
        name: 'Systemic Health',
        painLevel: 6,
        description: 'Patient exhibits clinical signs or risks associated with the top 10 leading causes of death in the US based on CDC 2023 provisional data.',
        symptoms: [
          { name: 'Heart disease', type: 'Cardiovascular', verified: true, timeline: 'Chronic' },
          { name: 'Cancer', type: 'Oncology', verified: true, timeline: 'Chronic' },
          { name: 'Unintentional injuries', type: 'Trauma', verified: true, timeline: 'Acute' },
          { name: 'Stroke (cerebrovascular diseases)', type: 'Neurological/Cardiovascular', verified: true, timeline: 'Acute' },
          { name: 'Chronic lower respiratory diseases', type: 'Respiratory', verified: true, timeline: 'Chronic' },
          { name: 'Alzheimer\'s disease', type: 'Neurological', verified: true, timeline: 'Progressive' },
          { name: 'Diabetes mellitus', type: 'Metabolic', verified: true, timeline: 'Chronic' },
          { name: 'Nephritis, nephrotic syndrome, and nephrosis', type: 'Renal', verified: true, timeline: 'Chronic' },
          { name: 'Chronic liver disease and cirrhosis', type: 'Hepatic', verified: true, timeline: 'Chronic' },
          { name: 'COVID-19', type: 'Respiratory/Infectious', verified: true, timeline: 'Acute/Chronic' }
        ]
      }]
    },
    history: [
      {
        type: 'Visit',
        date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
        summary: 'Comprehensive review of leading national mortality indicators.',
        state: {
          patientGoals: 'Evaluate national mortality risks.',
          vitals: { bp: '148/92', hr: '82', temp: '98.4°F', spO2: '94%', weight: '195 lbs', height: `5'9"` },
          issues: {}
        }
      }
    ],
    bookmarks: [],
    scans: []
  },
  {
    id: 'p006',
    name: 'Pediatric Sentinel',
    age: 4,
    gender: 'Male',
    lastVisit: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
    preexistingConditions: [],
    patientGoals: 'Evaluate global pediatric mortality risks (Under 5).',
    vitals: { bp: '95/60', hr: '110', temp: '99.1°F', spO2: '96%', weight: '35 lbs', height: `3'4"` },
    issues: {
      'full_body': [{
        id: 'full_body',
        noteId: 'note_p006_full_1',
        name: 'Systemic Health',
        painLevel: 4,
        description: 'Patient exhibits clinical signs or risks associated with the top causes of global under-5 child mortality.',
        symptoms: [
          { name: 'Preterm birth complications', type: 'Neonatal', verified: true, timeline: 'Chronic' },
          { name: 'Lower respiratory infections (Pneumonia)', type: 'Respiratory/Infectious', verified: true, timeline: 'Acute' },
          { name: 'Intrapartum-related events (Birth Asphyxia/Trauma)', type: 'Neonatal/Trauma', verified: true, timeline: 'Acute' },
          { name: 'Diarrhoeal diseases', type: 'Gastrointestinal/Infectious', verified: true, timeline: 'Acute' },
          { name: 'Congenital anomalies', type: 'Congenital', verified: true, timeline: 'Chronic' },
          { name: 'Malaria', type: 'Infectious', verified: true, timeline: 'Acute' }
        ]
      }]
    },
    history: [
      {
        type: 'Visit',
        date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
        summary: 'Comprehensive review of leading pediatric mortality indicators.',
        state: {
          patientGoals: 'Evaluate pediatric mortality risks.',
          vitals: { bp: '95/60', hr: '110', temp: '99.1°F', spO2: '96%', weight: '35 lbs', height: `3'4"` },
          issues: {}
        }
      }
    ],
    bookmarks: [],
    scans: []
  },
  {
    id: 'p007',
    name: 'Maternal Sentinel',
    age: 28,
    gender: 'Female',
    lastVisit: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
    preexistingConditions: [],
    patientGoals: 'Evaluate global maternal mortality risks.',
    vitals: { bp: '135/85', hr: '90', temp: '98.8°F', spO2: '98%', weight: '165 lbs', height: `5'6"` },
    issues: {
      'full_body': [{
        id: 'full_body',
        noteId: 'note_p007_full_1',
        name: 'Systemic Health',
        painLevel: 7,
        description: 'Patient exhibits clinical signs or risks associated with the top causes of maternal mortality.',
        symptoms: [
          { name: 'Severe bleeding (Hemorrhage)', type: 'Obstetric/Cardiovascular', verified: true, timeline: 'Acute' },
          { name: 'Infections (Sepsis)', type: 'Infectious', verified: true, timeline: 'Acute' },
          { name: 'Gestational Hypertension (Pre-eclampsia/Eclampsia)', type: 'Cardiovascular/Obstetric', verified: true, timeline: 'Acute/Chronic' },
          { name: 'Complications from delivery', type: 'Obstetric', verified: true, timeline: 'Acute' },
          { name: 'Unsafe abortion complications', type: 'Obstetric/Trauma', verified: true, timeline: 'Acute' }
        ]
      }]
    },
    history: [
      {
        type: 'Visit',
        date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
        summary: 'Comprehensive review of leading maternal mortality indicators.',
        state: {
          patientGoals: 'Evaluate maternal mortality risks.',
          vitals: { bp: '135/85', hr: '90', temp: '98.8°F', spO2: '98%', weight: '165 lbs', height: `5'6"` },
          issues: {}
        }
      }
    ],
    bookmarks: [],
    scans: []
  }
];


@Injectable({
  providedIn: 'root'
})
export class PatientManagementService {
  private patientState = inject(PatientStateService);
  private geminiService = inject(ClinicalIntelligenceService);
  private http = inject(HttpClient);

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

  /** Synchronizes the current patient list with the Node.js backend. */
  async syncToCloud(): Promise<boolean> {
    this.saveCurrentPatientState(); // Ensure the latest state is saved
    try {
      const patientsToSync = this.patients();
      await firstValueFrom(this.http.post('/api/patients', patientsToSync));
      console.log('[PatientManagementService] Successfully synced to cloud');
      return true;
    } catch (error) {
      console.error('[PatientManagementService] Error syncing to cloud', error);
      return false;
    }
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