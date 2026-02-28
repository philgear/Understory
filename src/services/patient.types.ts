import { AnalysisLens } from './clinical-intelligence.service';

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
    'skull': 'head',
    'face': 'head',
    'neck': 'head',
    'chest': 'chest',
    'torso': 'chest',
    'stomach': 'abdomen',
    'abdomen': 'abdomen',
    'belly': 'abdomen',
    'hips': 'pelvis',
    'pelvis': 'pelvis',
    'groin': 'pelvis',
    'right shoulder': 'r_shoulder',
    'right arm': 'r_arm',
    'right bicep': 'r_arm',
    'right elbow': 'r_arm',
    'right forearm': 'r_arm',
    'right hand': 'r_hand',
    'right wrist': 'r_hand',
    'right fingers': 'r_fingers',
    'right thumb': 'r_fingers',
    'left shoulder': 'l_shoulder',
    'left arm': 'l_arm',
    'left bicep': 'l_arm',
    'left elbow': 'l_arm',
    'left forearm': 'l_arm',
    'left hand': 'l_hand',
    'left wrist': 'l_hand',
    'left fingers': 'l_fingers',
    'left thumb': 'l_fingers',
    'right thigh': 'r_thigh',
    'right upper leg': 'r_thigh',
    'right knee': 'r_shin',
    'right shin': 'r_shin',
    'right calf': 'r_shin',
    'right lower leg': 'r_shin',
    'right ankle': 'r_foot',
    'right foot': 'r_foot',
    'right toes': 'r_toes',
    'left thigh': 'l_thigh',
    'left upper leg': 'l_thigh',
    'left knee': 'l_shin',
    'left shin': 'l_shin',
    'left calf': 'l_shin',
    'left lower leg': 'l_shin',
    'left ankle': 'l_foot',
    'left foot': 'l_foot',
    'left toes': 'l_toes',
    'upper back': 'upper_back',
    'lower back': 'lower_back',
    'spine': 'upper_back',
    'back': 'upper_back',
    'glutes': 'glutes',
    'buttocks': 'glutes',
    'bottom': 'glutes'
};

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

export interface BiometricEntry {
    timestamp: string; // ISO string
    type: keyof PatientVitals | 'pain';
    value: string | number;
    unit?: string;
    source?: string;
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

export interface DraftSummaryItem {
    id: string;
    text: string;
}

export interface PatientState {
    issues: Record<string, BodyPartIssue[]>;
    patientGoals: string;
    vitals: PatientVitals;
    biometricHistory?: BiometricEntry[];
    clinicalNotes?: ClinicalNote[];
    checklist?: ChecklistItem[];
}

export interface Bookmark {
    title: string;
    url: string;
    authors?: string;
    doi?: string;
    publicationDate?: string;
    publisher?: string;
    isPeerReviewed?: boolean;
    cited?: boolean; // If true, should be included in references
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
    type: 'PatientSummaryUpdate';
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
    summary: string;
    partId: string;
    noteId: string;
} | {
    type: 'NoteDeleted';
    date: string;
    summary: string;
    partId: string;
    noteId: string;
} | {
    type: 'AnalysisRun';
    date: string;
    summary: string;
    report: Partial<Record<AnalysisLens, string>>;
} | {
    type: 'FinalizedPatientSummary';
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
