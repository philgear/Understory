import { Injectable, inject } from '@angular/core';
import { PatientStateService } from './patient-state.service';
import { BiometricEntry, PatientVitals } from './patient.types';

@Injectable({
    providedIn: 'root'
})
export class BiometricImportService {
    private state = inject(PatientStateService);

    async importFile(file: File): Promise<void> {
        const text = await file.text();
        const fileName = file.name.toLowerCase();

        if (fileName.endsWith('.json')) {
            await this.parseJson(text);
        } else if (fileName.endsWith('.csv')) {
            await this.parseCsv(text);
        } else {
            throw new Error('Unsupported file format. Please provide a CSV or JSON file.');
        }
    }

    private async parseJson(content: string): Promise<void> {
        try {
            const data = JSON.parse(content);
            const entries: BiometricEntry[] = [];

            // Handle common Google Fit/Takeout JSON structure (Simplified for MVP)
            // Example target: array of { timestamp, type, value, unit }
            if (Array.isArray(data)) {
                data.forEach(item => {
                    if (this.isValidEntry(item)) {
                        entries.push(item);
                    }
                });
            } else if (data.entries && Array.isArray(data.entries)) {
                data.entries.forEach((item: any) => {
                    if (this.isValidEntry(item)) {
                        entries.push(item);
                    }
                });
            }

            if (entries.length > 0) {
                this.state.addBiometricEntries(entries);
            }
        } catch (e) {
            console.error('Failed to parse Biometric JSON', e);
            throw new Error('Malformed JSON biometric data.');
        }
    }

    private async parseCsv(content: string): Promise<void> {
        try {
            const lines = content.split('\n');
            if (lines.length < 2) return;

            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const entries: BiometricEntry[] = [];

            // Simple CSV Parser
            for (let i = 1; i < lines.length; i++) {
                const row = lines[i].split(',').map(v => v.trim());
                if (row.length < headers.length) continue;

                const entry: Partial<BiometricEntry> = {};

                headers.forEach((header, index) => {
                    if (header.includes('time') || header.includes('date')) {
                        entry.timestamp = new Date(row[index]).toISOString();
                    } else if (header.includes('type')) {
                        entry.type = row[index] as any;
                    } else if (header.includes('value')) {
                        entry.value = row[index];
                    } else if (header.includes('unit')) {
                        entry.unit = row[index];
                    }
                });

                // Heuristic mapping if type isn't explicit
                if (!entry.type) {
                    if (headers.includes('heart_rate') || headers.includes('hr')) {
                        const hrIndex = headers.findIndex(h => h === 'heart_rate' || h === 'hr');
                        if (row[hrIndex]) this.pushEntry(entries, 'hr', row[hrIndex], entry.timestamp);
                    }
                    if (headers.includes('systolic') && headers.includes('diastolic')) {
                        const sIdx = headers.findIndex(h => h === 'systolic');
                        const dIdx = headers.findIndex(h => h === 'diastolic');
                        if (row[sIdx] && row[dIdx]) {
                            this.pushEntry(entries, 'bp', `${row[sIdx]}/${row[dIdx]}`, entry.timestamp);
                        }
                    }
                } else if (entry.timestamp && entry.type && entry.value) {
                    entries.push(entry as BiometricEntry);
                }
            }

            if (entries.length > 0) {
                this.state.addBiometricEntries(entries);
            }
        } catch (e) {
            console.error('Failed to parse Biometric CSV', e);
            throw new Error('Malformed CSV biometric data.');
        }
    }

    private pushEntry(entries: BiometricEntry[], type: keyof PatientVitals | 'pain', value: any, timestamp?: string) {
        entries.push({
            timestamp: timestamp || new Date().toISOString(),
            type,
            value,
            source: 'CSV Upload'
        });
    }

    private isValidEntry(item: any): item is BiometricEntry {
        return !!(item.timestamp && item.type && item.value);
    }
}
