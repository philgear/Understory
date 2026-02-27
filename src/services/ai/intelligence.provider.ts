import { Observable } from 'rxjs';
import { ClinicalMetrics, TranscriptEntry } from '../clinical-intelligence.service';
import { VerificationIssue } from '../../components/analysis-report.types';

export interface ReportGenerationResult {
    lens: string;
    text: string;
    isComplete: boolean;
}

export interface IntelligenceProvider {
    /**
     * Generates a clinical report for a specific lens.
     * Supports streaming via Observable.
     */
    generateReportStream(patientData: string, lens: string, systemInstruction: string): Observable<string>;

    /**
     * Generates clinical metrics (complexity, stability, certainty) for a report.
     */
    generateMetrics(reportText: string): Promise<ClinicalMetrics>;

    /**
     * Detects if changes between two clinical snapshots are clinically significant.
     */
    detectClinicalChanges(oldData: string, newData: string): Promise<boolean>;

    /**
     * Clinical verification layer to cross-reference AI output with source data.
     */
    verifySection(lens: string, content: string, sourceData: string): Promise<{ status: string, issues: VerificationIssue[] }>;

    /**
     * Chat Session Management
     */
    startChat(patientData: string, context: string): void;
    sendMessage(message: string): Promise<string>;
    getInitialGreeting(prompt: string): Promise<string>;
}
