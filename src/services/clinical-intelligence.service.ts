import { Injectable, signal, inject } from '@angular/core';
import { IntelligenceProvider } from './ai/intelligence.provider';
import { AiCacheService } from './ai-cache.service';
import { VerificationIssue } from '../components/analysis-report.types';
import { AI_CONFIG } from './ai-provider.types';
import { IntelligenceProviderToken } from './ai/intelligence.provider.token';

export interface TranscriptEntry {
    role: 'user' | 'model';
    text: string;
}

export interface NodeContext {
    nodeText: string;
    sectionTitle: string;
    transcript: TranscriptEntry[];
    timestamp: Date;
}

export type AnalysisLens = 'Summary Overview' | 'Functional Protocols' | 'Monitoring & Follow-up' | 'Patient Education';

export interface ClinicalMetrics {
    complexity: number; // 0-10
    stability: number;  // 0-10
    certainty: number;  // 0-10
}

@Injectable({
    providedIn: 'root'
})
export class ClinicalIntelligenceService {
    readonly ai = inject(IntelligenceProviderToken);
    private cache = inject(AiCacheService);

    readonly isLoading = signal<boolean>(false);
    readonly error = signal<string | null>(null);

    // Store analysis reports for each lens
    readonly analysisResults = signal<Partial<Record<AnalysisLens, string>>>({});
    readonly analysisMetrics = signal<ClinicalMetrics | null>(null);
    readonly verificationResults = signal<Partial<Record<AnalysisLens, { status: string, issues: VerificationIssue[] }>>>({});
    readonly lastRefreshTime = signal<Date | null>(null);

    // For live agent chat
    readonly transcript = signal<TranscriptEntry[]>([]);

    readonly recentNodes = signal<NodeContext[]>([]);

    readonly lastPatientData = signal<string | null>(null);

    public addRecentNode(nodeContext: NodeContext) {
        this.recentNodes.update(nodes => {
            // Keep only the last 3 most recent nodes to prevent context bloat
            const next = [nodeContext, ...nodes];
            if (next.length > 3) return next.slice(0, 3);
            return next;
        });
    }

    private readonly FORMATTING_RULES = `

FORMATTING RULES (you MUST follow these exactly):
- Use ONLY ### level headings. Never use # or ##.
- Keep paragraphs to 2–3 sentences maximum. Be concise and clinical.
- Use **bold** for key clinical terms. Never use ALL CAPS.
- Prefer bullet lists over numbered lists unless ordering matters clinically.
- Use markdown tables for structured data (labs, dosing, schedules, vitals).
- Never output raw URLs.
- Do NOT repeat the patient data back — synthesize and advise.
- Write in third person clinical voice ("The patient presents with..." not "You have...").
- CITATION INTEGRITY (UKRIO): When referencing medical literature, you MUST use a parenthetical citation [Author et al., Year].
- ACCURACY: Only cite a source if it directly supports the specific clinical claim being made. DO NOT use research sources to support patient-reported symptoms unless the source provides specific diagnostic criteria or evidence matched to those symptoms.
- TRANSPARENCY: Include the full reference in the 'References' section. Use DOIs whenever available. If a source is peer-reviewed, state this clearly in the reference.
- NO HALLUCINATION: Only cite sources provided in the "Research Context" or "Bookmarks" sections. If no provided source supports a claim, do NOT cite anything.

ANNOTATION SYNTAX (place on a NEW LINE after the relevant paragraph or list item, never inline):
[[suggestion: Short actionable suggestion]]
[[proposed: Full replacement text for the paragraph above]]
`;

    private systemInstructions: Record<AnalysisLens, string> = {
        'Summary Overview': `You are a world-class care plan recommendation engine for a clinical decision-support tool.

Analyze the patient overview and generate a **Visit Summary Overview** structured as follows:

### Clinical Assessment
A concise 2–3 sentence synthesis of the patient's current clinical picture — key diagnoses, functional status, and risk factors.

### Priority List
A bullet list of the top 3–5 clinical priorities, ordered by urgency. Each item should be **bold label**: brief rationale.

### Plan of Care
Actionable treatment steps organized by priority. Use sub-bullets for specifics (medication, dose, frequency). Include a markdown table if there are ≥3 medications or interventions to compare.

### Goals
Short-term (2 weeks) and long-term (3 months) measurable clinical goals as bullet points.

### References (UKRIO Compliant)
A structured list of all sources cited in this report. Format: **Author(s)** (Year). *Title*. Publisher/Journal. DOI (as a clickable link if available). Indicate if Peer-Reviewed.
` + this.FORMATTING_RULES,

        'Functional Protocols': `You are an expert functional and integrative medicine strategist for a clinical decision-support tool.

Analyze the patient overview and recommend specific, evidence-based interventions structured as follows:

### Immediate Actions (To start within 72 hours)
(List critical interventions to initiate immediately.)

### Foundation (Diet & Lifestyle)
(Provide recommendations focusing on sleep, nutrition, and movement.)

### Supplementation
(Generate a Markdown table with columns: Intervention | Dose | Timing | Rationale. Ensure the table is properly formatted.)

### Functional Protocols
(Describe any specific therapeutic protocols like "5R Gut Protocol", "HPA Axis Support".)` + this.FORMATTING_RULES,

        'Monitoring & Follow-up': `You are a care coordination AI for a clinical decision-support tool.

Generate a structured monitoring and follow-up plan organized by time horizon:

### Immediate Next Steps (0-30 days)
(Provide an ordered list of high-priority actions.)

### Ongoing (Month 1-3)
(Generate a markdown table of tracking parameters with columns: Parameter | Target | Frequency | Escalation Trigger. Only output the table in this section, do not include preamble.)

### Long-term Trajectory (6+ months)
(Provide a brief narrative on expected outcomes.)` + this.FORMATTING_RULES,

        'Patient Education': `You are a patient education specialist for a clinical decision-support tool. Translate the documented clinical findings into patient-friendly language.

CRITICAL: You must ONLY include information that is explicitly documented in the patient data provided. Do NOT invent, assume, or add any clinical details, recommendations, or advice not present in the source material. Every statement must be directly traceable to the provided data.

Generate clear, empathetic educational content in **plain language** (8th grade reading level). Structure as follows:

### Understanding Your Condition
2–3 sentence explanation of the patient's documented condition(s) using everyday language. ONLY reference diagnoses, symptoms, and findings that appear in the source data. Use everyday analogies where helpful.

### What Was Found
Bullet list summarizing ONLY the documented clinical findings, test results, and observations from the patient record. Each item: **Finding**: plain-language explanation of what it means. Do NOT add findings not in the source.

### Current Plan
Bullet list of ONLY the treatments, medications, or interventions that are explicitly documented or recommended in the other care plan sections. Each item: **Intervention**: plain-language explanation of why it was chosen. If no specific plan is documented, state "Your care team will discuss treatment options with you."

### Important Notes
> 💡 Summarize ONLY the specific precautions, follow-up instructions, or red flags that are documented in the source data. If none are documented, state "Discuss follow-up and precautions with your care team at your next visit."

If a section has no relevant source data, output the heading followed by: "*No specific information documented — please discuss with your care team.*"
` + this.FORMATTING_RULES
    };

    public resetAIState() {
        this.isLoading.set(false);
        this.error.set(null);
        this.analysisResults.set({});
        this.analysisMetrics.set(null);
        this.transcript.set([]);
    }

    public loadArchivedAnalysis(report: Partial<Record<AnalysisLens, string>>) {
        this.resetAIState();
        this.analysisResults.set(report);
        this.lastRefreshTime.set(new Date());
    }

    private async generateVisualMetrics(report: Record<string, string>): Promise<void> {
        const lenses: AnalysisLens[] = ['Summary Overview', 'Functional Protocols', 'Monitoring & Follow-up', 'Patient Education'];
        const reportText = lenses.map(lens => report[lens]).filter(Boolean).join('\n\n');
        const cacheKey = await this.cache.generateKey([reportText, 'visual-metrics-v2']);

        try {
            const cached = await this.cache.get<ClinicalMetrics>(cacheKey);
            if (cached) {
                this.analysisMetrics.set(cached);
                return;
            }

            const validatedData = await this.ai.generateMetrics(reportText);

            const dataToCache = {
                metrics: validatedData,
                _timestamp: new Date().toISOString()
            };
            await this.cache.set(cacheKey, dataToCache);
            this.analysisMetrics.set(validatedData);
        } catch (e) {
            console.warn("Failed to generate visual metrics, using defaults", e);
            this.analysisMetrics.set({ complexity: 5, stability: 5, certainty: 5 });
        }
    }

    async generateComprehensiveReport(patientData: string): Promise<Partial<Record<AnalysisLens, string>>> {
        this.isLoading.set(true);
        this.error.set(null);
        this.analysisResults.set({});
        this.analysisMetrics.set(null);

        const lenses: AnalysisLens[] = ['Summary Overview', 'Functional Protocols', 'Monitoring & Follow-up', 'Patient Education'];
        const newReport: Partial<Record<AnalysisLens, string>> = {};

        if (this.lastPatientData()) {
            const isSignificant = await this.ai.detectClinicalChanges(this.lastPatientData()!, patientData);

            if (!isSignificant) {
                console.log("Clinical Delta: No significant changes detected. Reusing existing report.");
                this.lastPatientData.set(patientData);

                const currentResults = this.analysisResults() as Record<string, string>;
                if (Object.keys(currentResults).length > 0) {
                    for (const lens of lenses) {
                        const cacheKey = await this.cache.generateKey([patientData, this.systemInstructions[lens], lens]);
                        if (currentResults[lens]) {
                            await this.cache.set(cacheKey, currentResults[lens]);
                        }
                    }
                    await this.generateVisualMetrics(currentResults);
                    this.isLoading.set(false);
                    return currentResults;
                }
            }
        }


        try {
            const orchestrationPromises = lenses.map(async (lens) => {
                const sysInstruction = this.systemInstructions[lens];
                const cacheKey = await this.cache.generateKey([patientData, sysInstruction, lens]);

                try {
                    const cached = await this.cache.get<string>(cacheKey);
                    let responseText = '';

                    if (cached) {
                        responseText = cached;
                        newReport[lens] = responseText;
                        this.analysisResults.update(all => ({ ...all, [lens]: responseText }));
                    } else {
                        // Stream-based generation using browser-compatible genai
                        responseText = await new Promise<string>((resolve, reject) => {
                            let accumulated = '';
                            this.ai.generateReportStream(patientData, lens, sysInstruction).subscribe({
                                next: (chunk: string) => {
                                    accumulated += chunk;
                                    newReport[lens] = accumulated;
                                    this.analysisResults.update(all => ({ ...all, [lens]: accumulated }));
                                },
                                error: reject,
                                complete: () => resolve(accumulated)
                            });
                        });
                        await this.cache.set(cacheKey, responseText);
                    }

                    try {
                        const verification = await this.ai.verifySection(lens, responseText, patientData);
                        this.verificationResults.update(all => ({ ...all, [lens]: verification }));
                    } catch (verifError) {
                        console.warn(`Verification failed for ${lens}`, verifError);
                    }
                } catch (e: any) {
                    console.error(`Error in lens ${lens}`, e);
                    newReport[lens] = `### Error\nAn error occurred in this section: ${e?.message ?? e}`;
                }
            });

            await Promise.allSettled(orchestrationPromises);

            this.lastPatientData.set(patientData);
            this.analysisResults.set(newReport);
            this.lastRefreshTime.set(new Date());
            await this.generateVisualMetrics(newReport as Record<string, string>);

            const reportText = lenses.map(lens => newReport[lens]).filter(Boolean).join('\n\n');
            const masterKey = await this.cache.generateKey([reportText, 'MASTER_SNAPSHOT_V1']);
            await this.cache.set(masterKey, {
                report: newReport,
                _metrics: this.analysisMetrics(),
                _timestamp: new Date().toISOString(),
                _isSnapshot: true
            });

            return newReport;
        } catch (e: any) {
            console.error("Critical error in generateComprehensiveReport", e);
            this.error.set(String(e?.message ?? e));
            return {};
        } finally {
            this.isLoading.set(false);
        }
    }

    async startChatSession(patientData: string) {
        this.transcript.set([]);
        const context = `You are a collaborative care plan co-pilot named "Cerebella". You are assisting a doctor in refining a strategy for their patient. You have already reviewed the finalized patient overview and the current recommendations. Your role is to help the doctor iterate on the care plan, explore functional protocols, structure follow-ups, or answer specific questions about the patient's data. Keep your answers brief, actionable, and focused on strategic holistic care. Be ready to elaborate when asked.`;
        await this.ai.startChat(patientData, context);
    }

    async getInitialGreeting(): Promise<string> {
        this.isLoading.set(true);
        try {
            const response = await this.ai.getInitialGreeting("Start the conversation with a friendly and professional tone. Greet the doctor and confirm you have reviewed the patient's file and are ready for questions.");
            this.transcript.set([{ role: 'model', text: response }]);
            return response;
        } catch (e: any) {
            const errorMsg = String(e?.message ?? e);
            this.error.set(errorMsg);
            this.transcript.set([{ role: 'model', text: `Error: ${errorMsg}` }]);
            return `Sorry, an error occurred: ${errorMsg}`;
        } finally {
            this.isLoading.set(false);
        }
    }

    async sendChatMessage(message: string): Promise<string> {
        this.isLoading.set(true);
        this.error.set(null);
        this.transcript.update(t => [...t, { role: 'user', text: message }]);

        try {
            const response = await this.ai.sendMessage(message);
            this.transcript.update(t => [...t, { role: 'model', text: response }]);
            return response;
        } catch (e: any) {
            const errorMsg = String(e?.message ?? e);
            this.error.set(errorMsg);
            this.transcript.update(t => [...t, { role: 'model', text: `Error: ${errorMsg}` }]);
            return `Sorry, an error occurred: ${errorMsg}`;
        } finally {
            this.isLoading.set(false);
        }
    }

    async clearCache() {
        await this.cache.clear();
    }

    async translateReadingLevel(text: string, targetLevel: 'simplified' | 'dyslexia' | 'child'): Promise<string> {
        this.isLoading.set(true);
        this.error.set(null);
        try {
            return await this.ai.translateReadingLevel(text, targetLevel);
        } catch (e: any) {
            const errorMsg = String(e?.message ?? e);
            this.error.set(errorMsg);
            throw new Error(`Translation failed: ${errorMsg}`);
        } finally {
            this.isLoading.set(false);
        }
    }
}
