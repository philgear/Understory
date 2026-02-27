import { inject, Injectable } from '@angular/core';
import { GoogleGenAI, Chat } from '@google/genai';
import { Observable } from 'rxjs';
import { IntelligenceProvider } from './intelligence.provider';
import { AI_CONFIG } from '../ai-provider.types';
import { ClinicalMetrics } from '../clinical-intelligence.service';
import { VerificationIssue } from '../../components/analysis-report.types';
import { VerifyAiService } from '../verify-ai.service';
import { z } from 'zod';

const ClinicalMetricsSchema = z.object({
    complexity: z.number().min(0).max(10),
    stability: z.number().min(0).max(10),
    certainty: z.number().min(0).max(10)
});

@Injectable({
    providedIn: 'root'
})
export class GeminiProvider implements IntelligenceProvider {
    private config = inject(AI_CONFIG);
    private _ai: GoogleGenAI | null = null;

    private get ai(): GoogleGenAI {
        if (!this._ai) {
            let initialKey = (window as any).GEMINI_API_KEY || this.config.apiKey;
            if (!initialKey && typeof process !== 'undefined' && process.env) {
                initialKey = process.env.GEMINI_API_KEY;
            }
            if (!initialKey) {
                throw new Error("API key must be set when using the Gemini API. Ensure server injection or environment variable is present.");
            }
            this._ai = new GoogleGenAI({ apiKey: initialKey });
        }
        return this._ai;
    }

    private chat: Chat | null = null;
    private verifier = inject(VerifyAiService);

    generateReportStream(patientData: string, lens: string, systemInstruction: string): Observable<string> {
        return new Observable<string>(subscriber => {
            (async () => {
                try {
                    const streamResult = await this.ai.models.generateContentStream({
                        model: this.config.defaultModel.modelId,
                        contents: patientData,
                        config: {
                            systemInstruction: systemInstruction,
                            temperature: this.config.defaultModel.temperature
                        }
                    });

                    for await (const chunk of streamResult) {
                        subscriber.next(chunk.text);
                    }
                    subscriber.complete();
                } catch (e) {
                    subscriber.error(e);
                }
            })();
        });
    }

    async generateMetrics(reportText: string): Promise<ClinicalMetrics> {
        const prompt = `Analyze the following clinical report and patient data. 
    Extract three key metrics on a scale of 0 to 10:
    1. Clinical Complexity (0 = Simple/Routine, 10 = Highly Complex/Multimorbid)
    2. Clinical Stability (0 = Unstable/Acute, 10 = Stable/Compensated)
    3. Global Certainty (0 = Speculative/Needs Data, 10 = Definitive/Clear)

    Report:
    ${reportText.substring(0, 3000)}

    Return ONLY a JSON object with this exact structure:
    {"complexity": number, "stability": number, "certainty": number}`;

        const response = await this.ai.models.generateContent({
            model: this.config.defaultModel.modelId,
            contents: prompt,
            config: {
                temperature: 0,
                responseMimeType: 'application/json'
            }
        });

        const data = JSON.parse(response.text);
        return ClinicalMetricsSchema.parse(data);
    }

    async detectClinicalChanges(oldData: string, newData: string): Promise<boolean> {
        const prompt = `Compare these two clinical snapshots and determine if the difference is CLINICALLY SIGNIFICANT (e.g., new symptoms, medication changes, vital sign shifts, or new diagnoses). 
    If the changes are only cosmetic (typos, formatting, minor phrasing), respond with "FALSE". 
    If the changes are clinically meaningful, respond with "TRUE".
    
    OLD DATA: "${oldData.substring(0, 1000)}"
    NEW DATA: "${newData.substring(0, 1000)}"
    
    SIGNIFICANT? (TRUE/FALSE):`;

        const response = await this.ai.models.generateContent({
            model: this.config.defaultModel.modelId,
            contents: prompt,
            config: { temperature: 0 }
        });

        return response.text.toUpperCase().includes('TRUE');
    }

    async verifySection(lens: string, content: string, sourceData: string): Promise<{ status: string, issues: VerificationIssue[] }> {
        return await this.verifier.verifyReportSection(lens as any, content, sourceData);
    }

    startChat(patientData: string, context: string): void {
        const systemInstruction = `${context}\n\nPatient Data:\n${patientData}`;
        this.chat = this.ai.chats.create({
            model: this.config.defaultModel.modelId,
            config: {
                systemInstruction,
                temperature: this.config.defaultModel.temperature
            }
        });
    }

    async sendMessage(message: string): Promise<string> {
        if (!this.chat) throw new Error("Chat not started");
        const result = await this.chat.sendMessage({ message });
        return result.text;
    }

    async getInitialGreeting(prompt: string): Promise<string> {
        if (!this.chat) throw new Error("Chat not started");
        const result = await this.chat.sendMessage({ message: prompt });
        return result.text;
    }
}
