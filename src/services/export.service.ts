import { Injectable } from '@angular/core';

import { Patient, HistoryEntry, PatientVitals, BodyPartIssue } from './patient.types';

/** Shape of the native JSON export file. */
export interface NativePatientExport {
    _format: 'understory-native';
    _version: 1;
    exportedAt: string;
    patient: Omit<Patient, 'id'>;
}

/** Minimal FHIR R4 resource types used for import/export. */
interface FhirResource {
    resourceType: string;
    id?: string;
    [key: string]: any;
}

interface FhirBundle {
    resourceType: 'Bundle';
    id?: string;
    type: 'collection';
    timestamp: string;
    meta?: { tag?: { system: string; code: string; display: string }[] };
    entry: { resource: FhirResource }[];
}

@Injectable({
    providedIn: 'root'
})
export class ExportService {

    // ─── PDF Export ────────────────────────────────────────────

    /**
     * Generates and downloads a clinical PDF report.
     */
    async downloadAsPdf(data: any, patientName: string = 'Patient'): Promise<void> {
        console.log('[ExportService] Starting PDF generation for:', patientName);
        try {
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF();
            const timestamp = new Date().toLocaleString();
            const margin = 20;
            const pageWidth = 170;
            const pageHeight = 275;
            let currentY = margin;

            const checkPage = (needed: number) => {
                if (currentY + needed > pageHeight) {
                    doc.addPage();
                    currentY = margin;
                    return true;
                }
                return false;
            };

            // Header
            doc.setFontSize(22);
            doc.setTextColor(43, 75, 252); // Understory Blueish
            doc.text('Understory Clinical Intelligence', margin, currentY);
            currentY += 10;

            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`Generated: ${timestamp}`, margin, currentY);
            currentY += 6;
            doc.text(`Patient: ${patientName}`, margin, currentY);
            currentY += 6;

            doc.setDrawColor(200, 200, 200);
            doc.line(margin, currentY, margin + pageWidth, currentY);
            currentY += 15;

            // Summary Section
            doc.setFontSize(16);
            doc.setTextColor(33, 33, 33);
            doc.text('Medical Summary', margin, currentY);
            currentY += 10;

            doc.setFontSize(11);
            const summaryLines = doc.splitTextToSize(data.summary || 'No summary available.', pageWidth);
            summaryLines.forEach((line: string) => {
                checkPage(7);
                doc.text(line, margin, currentY);
                currentY += 7;
            });
            currentY += 15;

            // Analysis Section
            checkPage(20);
            doc.setFontSize(16);
            doc.text('Analysis Report', margin, currentY);
            currentY += 10;

            doc.setFontSize(11);
            const reportContent = typeof data.report === 'object'
                ? Object.entries(data.report).map(([key, val]) => `${key.toUpperCase()}\n\n${val}`).join('\n\n')
                : (data.report || 'No analysis available.');

            console.log('[ExportService] Text splitting for report content...');
            const reportLines = doc.splitTextToSize(reportContent, pageWidth);
            reportLines.forEach((line: string) => {
                checkPage(7);
                doc.text(line, margin, currentY);
                currentY += 7;
            });

            // Save PDF
            const fileName = `Understory_Report_${patientName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
            console.log('[ExportService] Saving PDF:', fileName);
            doc.save(fileName);
            console.log('[ExportService] PDF download triggered.');
        } catch (error) {
            console.error('[ExportService] PDF export failed:', error);
        }
    }

    // ─── Analysis-only FHIR Export (existing) ─────────────────

    /**
     * Generates and downloads a FHIR DiagnosticReport (JSON) for the analysis only.
     */
    async downloadAsFhir(data: any, patientName: string = 'Patient'): Promise<void> {
        console.log('[ExportService] Starting FHIR DiagnosticReport generation...');
        try {
            const fhirReport = {
                resourceType: 'DiagnosticReport',
                id: `understory-${Date.now()}`,
                status: 'final',
                category: [
                    {
                        coding: [
                            {
                                system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
                                code: 'GE',
                                display: 'General'
                            }
                        ]
                    }
                ],
                code: {
                    coding: [
                        {
                            system: 'http://loinc.org',
                            code: '11506-3',
                            display: 'Progress note'
                        }
                    ],
                    text: 'Understory AI Clinical Analysis'
                },
                subject: {
                    display: patientName
                },
                effectiveDateTime: new Date().toISOString(),
                issued: new Date().toISOString(),
                conclusion: data.summary,
                presentedForm: [
                    {
                        contentType: 'text/markdown',
                        data: this._toBase64(typeof data.report === 'object' ? JSON.stringify(data.report) : data.report)
                    }
                ]
            };

            const blob = new Blob([JSON.stringify(fhirReport, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `FHIR_Report_${patientName.replace(/\s+/g, '_')}.json`;
            console.log('[ExportService] Triggering FHIR download:', a.download);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('[ExportService] FHIR export failed:', error);
        }
    }

    // ─── Native JSON Export / Import ──────────────────────────

    /**
     * Exports the full patient record as a native JSON file.
     * This is a lossless round-trip format that preserves all app data.
     */
    downloadAsNativeJson(patient: Patient): void {
        const { id, ...patientWithoutId } = patient;
        const exportData: NativePatientExport = {
            _format: 'understory-native',
            _version: 1,
            exportedAt: new Date().toISOString(),
            patient: patientWithoutId,
        };

        this._downloadJson(exportData, `Understory_Patient_${patient.name.replace(/\s+/g, '_')}.json`);
    }

    /**
     * Parses a native JSON file and returns a Patient object.
     * Assigns a new unique ID so imported patients never collide.
     */
    async importFromNativeJson(file: File): Promise<Patient> {
        const text = await file.text();
        const data = JSON.parse(text) as NativePatientExport;

        if (data._format !== 'understory-native') {
            throw new Error('Not a valid Understory native export file.');
        }

        return {
            id: `p_${Date.now()}`,
            ...data.patient,
            // Ensure required arrays exist even from older exports
            history: data.patient.history ?? [],
            bookmarks: data.patient.bookmarks ?? [],
            preexistingConditions: data.patient.preexistingConditions ?? [],
        };
    }

    // ─── FHIR R4 Bundle Export / Import ───────────────────────

    /**
     * Exports the full patient record as a FHIR R4 Bundle.
     * Includes Patient, Condition, Observation, Goal, and DiagnosticReport resources.
     */
    downloadAsFhirBundle(patient: Patient): void {
        console.log('[ExportService] Starting FHIR Bundle generation for:', patient.name);
        try {
            const patientRef = `Patient/understory-${patient.id}`;
            const entries: { resource: FhirResource }[] = [];

            // 1. Patient resource
            entries.push({
                resource: {
                    resourceType: 'Patient',
                    id: `understory-${patient.id}`,
                    name: [{ text: patient.name }],
                    gender: this._toFhirGender(patient.gender),
                    birthDate: this._estimateBirthYear(patient.age),
                    extension: [
                        {
                            url: 'http://understory.app/fhir/StructureDefinition/last-visit',
                            valueString: patient.lastVisit,
                        }
                    ]
                }
            });

            // 2. Conditions
            patient.preexistingConditions.forEach((condition, i) => {
                entries.push({
                    resource: {
                        resourceType: 'Condition',
                        id: `condition-${i}`,
                        subject: { reference: patientRef },
                        code: { text: condition },
                        clinicalStatus: {
                            coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }]
                        }
                    }
                });
            });

            // 3. Vitals as Observations
            const vitals = patient.vitals;
            const vitalMappings: { field: keyof PatientVitals; loinc: string; display: string }[] = [
                { field: 'bp', loinc: '85354-9', display: 'Blood Pressure' },
                { field: 'hr', loinc: '8867-4', display: 'Heart Rate' },
                { field: 'temp', loinc: '8310-5', display: 'Body Temperature' },
                { field: 'spO2', loinc: '2708-6', display: 'Oxygen Saturation' },
                { field: 'weight', loinc: '29463-7', display: 'Body Weight' },
                { field: 'height', loinc: '8302-2', display: 'Body Height' },
            ];

            vitalMappings.forEach(({ field, loinc, display }) => {
                const value = vitals[field];
                if (!value) return;
                entries.push({
                    resource: {
                        resourceType: 'Observation',
                        id: `vital-${String(field)}`,
                        status: 'final',
                        category: [{
                            coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }]
                        }],
                        code: { coding: [{ system: 'http://loinc.org', code: loinc, display }], text: display },
                        subject: { reference: patientRef },
                        valueString: value,
                    }
                });
            });

            // 4. Body issues as Observations
            Object.entries(patient.issues).forEach(([partId, issues]) => {
                (issues as BodyPartIssue[]).forEach((issue, i) => {
                    entries.push({
                        resource: {
                            resourceType: 'Observation',
                            id: `issue-${partId}-${i}`,
                            status: 'final',
                            category: [{
                                coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'exam' }]
                            }],
                            code: { text: issue.name },
                            subject: { reference: patientRef },
                            bodySite: { text: partId },
                            valueString: issue.description,
                            extension: [
                                {
                                    url: 'http://understory.app/fhir/StructureDefinition/pain-level',
                                    valueInteger: issue.painLevel,
                                },
                                {
                                    url: 'http://understory.app/fhir/StructureDefinition/note-id',
                                    valueString: issue.noteId,
                                },
                            ]
                        }
                    });
                });
            });

            // 5. Patient goals
            if (patient.patientGoals) {
                entries.push({
                    resource: {
                        resourceType: 'Goal',
                        id: 'goal-chief-complaint',
                        lifecycleStatus: 'active',
                        subject: { reference: patientRef },
                        description: { text: patient.patientGoals },
                    }
                });
            }

            // 6. Analysis reports from history
            patient.history
                .filter(h => h.type === 'AnalysisRun' || h.type === 'FinalizedPatientSummary')
                .forEach((entry, i) => {
                    if (entry.type === 'AnalysisRun' || entry.type === 'FinalizedPatientSummary') {
                        entries.push({
                            resource: {
                                resourceType: 'DiagnosticReport',
                                id: `report-${i}`,
                                status: 'final',
                                code: { text: 'Understory AI Clinical Analysis' },
                                subject: { reference: patientRef },
                                effectiveDateTime: this._toISODate(entry.date),
                                conclusion: entry.summary,
                                presentedForm: [{
                                    contentType: 'application/json',
                                    data: this._toBase64(JSON.stringify(entry.report)),
                                }]
                            }
                        });
                    }
                });

            const bundle: FhirBundle = {
                resourceType: 'Bundle',
                id: `understory-bundle-${Date.now()}`,
                type: 'collection',
                timestamp: new Date().toISOString(),
                meta: {
                    tag: [{
                        system: 'http://understory.app/fhir',
                        code: 'understory-export',
                        display: 'Understory Patient Export',
                    }]
                },
                entry: entries,
            };

            const filename = `FHIR_Bundle_${patient.name.replace(/\s+/g, '_')}.json`;
            console.log('[ExportService] Triggering FHIR Bundle download:', filename);
            this._downloadJson(bundle, filename);
        } catch (error) {
            console.error('[ExportService] FHIR Bundle export failed:', error);
        }
    }

    /**
     * Parses a FHIR R4 Bundle and maps it back to an Understory Patient.
     */
    async importFromFhirBundle(file: File): Promise<Patient> {
        const text = await file.text();
        const bundle = JSON.parse(text) as FhirBundle;

        if (bundle.resourceType !== 'Bundle' || !Array.isArray(bundle.entry)) {
            throw new Error('Not a valid FHIR Bundle.');
        }

        const resources = bundle.entry.map(e => e.resource);
        const fhirPatient = resources.find(r => r['resourceType'] === 'Patient');

        // Demographics
        const name = fhirPatient?.name?.[0]?.text || fhirPatient?.name?.[0]?.family || 'Imported Patient';
        const gender = this._fromFhirGender(fhirPatient?.gender);
        const age = fhirPatient?.birthDate ? this._ageFromBirthDate(fhirPatient.birthDate) : 0;
        const lastVisitExt = fhirPatient?.extension?.find((e: any) => e.url?.includes('last-visit'));
        const lastVisit = lastVisitExt?.valueString || new Date().toISOString().split('T')[0].replace(/-/g, '.');

        // Conditions
        const conditions = resources
            .filter(r => r['resourceType'] === 'Condition')
            .map(r => r['code']?.text || 'Unknown Condition');

        // Vitals
        const vitals: PatientVitals = { bp: '', hr: '', temp: '', spO2: '', weight: '', height: '' };
        const vitalObs = resources.filter(r =>
            r['resourceType'] === 'Observation' &&
            r['category']?.[0]?.coding?.[0]?.code === 'vital-signs'
        );
        const loincToField: Record<string, keyof PatientVitals> = {
            '85354-9': 'bp', '8867-4': 'hr', '8310-5': 'temp',
            '2708-6': 'spO2', '29463-7': 'weight', '8302-2': 'height',
        };
        vitalObs.forEach(obs => {
            const loinc = obs['code']?.coding?.[0]?.code;
            const field = loinc ? loincToField[loinc] : undefined;
            if (field) {
                vitals[field] = obs['valueString'] || '';
            }
        });

        // Body issues
        const issues: Record<string, BodyPartIssue[]> = {};
        const issueObs = resources.filter(r =>
            r['resourceType'] === 'Observation' &&
            r['category']?.[0]?.coding?.[0]?.code === 'exam'
        );
        issueObs.forEach(obs => {
            const partId = obs['bodySite']?.text || 'unknown';
            const painExt = obs['extension']?.find((e: any) => e.url?.includes('pain-level'));
            const noteIdExt = obs['extension']?.find((e: any) => e.url?.includes('note-id'));
            const issue: BodyPartIssue = {
                id: partId,
                noteId: noteIdExt?.valueString || `note_imported_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                name: obs['code']?.text || partId,
                painLevel: painExt?.valueInteger ?? 0,
                description: obs['valueString'] || '',
                symptoms: [],
            };
            if (!issues[partId]) issues[partId] = [];
            issues[partId].push(issue);
        });

        // Goals
        const goalResource = resources.find(r => r['resourceType'] === 'Goal');
        const patientGoals = goalResource?.description?.text || '';

        // Analysis history
        const history: HistoryEntry[] = [];
        resources
            .filter(r => r['resourceType'] === 'DiagnosticReport')
            .forEach(report => {
                try {
                    const reportData = report['presentedForm']?.[0]?.data;
                    const parsed = reportData ? JSON.parse(this._fromBase64(reportData)) : {};
                    history.push({
                        type: 'AnalysisRun',
                        date: report['effectiveDateTime']?.split('T')[0]?.replace(/-/g, '.') || lastVisit,
                        summary: report['conclusion'] || 'Imported Analysis',
                        report: parsed,
                    });
                } catch {
                    // Skip malformed reports
                }
            });

        return {
            id: `p_${Date.now()}`,
            name,
            age,
            gender,
            lastVisit,
            preexistingConditions: conditions,
            patientGoals,
            vitals,
            issues,
            history,
            bookmarks: [],
        };
    }

    // ─── Auto-detect and import ───────────────────────────────

    /**
     * Detects the format of a JSON file and imports accordingly.
     */
    async importFromFile(file: File): Promise<Patient> {
        const text = await file.text();
        const data = JSON.parse(text);

        if (data._format === 'understory-native') {
            // Re-create a file-like object from the already-read text
            const blob = new Blob([text], { type: 'application/json' });
            const syntheticFile = new File([blob], file.name, { type: 'application/json' });
            return this.importFromNativeJson(syntheticFile);
        } else if (data.resourceType === 'Bundle') {
            const blob = new Blob([text], { type: 'application/json' });
            const syntheticFile = new File([blob], file.name, { type: 'application/json' });
            return this.importFromFhirBundle(syntheticFile);
        } else {
            throw new Error('Unrecognized file format. Expected Understory native JSON or FHIR R4 Bundle.');
        }
    }

    // ─── Helpers ──────────────────────────────────────────────

    private _downloadJson(data: any, filename: string): void {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    private _toFhirGender(gender: string): string {
        const map: Record<string, string> = {
            'Male': 'male', 'Female': 'female', 'Non-binary': 'other', 'Other': 'unknown'
        };
        return map[gender] || 'unknown';
    }

    private _fromFhirGender(fhirGender?: string): 'Male' | 'Female' | 'Non-binary' | 'Other' {
        const map: Record<string, 'Male' | 'Female' | 'Non-binary' | 'Other'> = {
            'male': 'Male', 'female': 'Female', 'other': 'Non-binary', 'unknown': 'Other'
        };
        return map[fhirGender || ''] || 'Other';
    }

    private _estimateBirthYear(age: number): string {
        const year = new Date().getFullYear() - age;
        return `${year}-01-01`;
    }

    private _ageFromBirthDate(birthDate: string): number {
        const birth = new Date(birthDate);
        const now = new Date();
        let age = now.getFullYear() - birth.getFullYear();
        if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
            age--;
        }
        return Math.max(0, age);
    }

    private _toISODate(dotDate: string): string {
        // Convert "2024.06.15" to "2024-06-15"
        return dotDate.replace(/\./g, '-');
    }

    private _toBase64(str: string): string {
        try {
            return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
                return String.fromCharCode(parseInt(p1, 16));
            }));
        } catch (e) {
            console.error('Base64 encoding failed:', e);
            return btoa(unescape(encodeURIComponent(str)));
        }
    }

    private _fromBase64(base64: string): string {
        try {
            return decodeURIComponent(atob(base64).split('').map((c) => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
        } catch (e) {
            console.error('Base64 decoding failed:', e);
            return decodeURIComponent(escape(atob(base64)));
        }
    }
}
