import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IntelligenceProvider } from './intelligence.provider';
import { AI_CONFIG } from '../ai-provider.types';
import { ClinicalMetrics } from '../clinical-intelligence.service';
import { VerificationIssue } from '../../components/analysis-report.types';
import { VerifyAiService } from '../verify-ai.service';


@Injectable({
    providedIn: 'root'
})
export class GeminiProvider implements IntelligenceProvider {
    private config = inject(AI_CONFIG);
    private _ai: any = null;

    private async getAi(): Promise<any> {
        console.log("GeminiProvider: getAi() execution started");
        if (!this._ai) {
            console.log("GeminiProvider: _ai is null, initializing...");
            let initialKey = (window as any).GEMINI_API_KEY || this.config.apiKey;
            console.log("GeminiProvider: initialKey from window/config is defined?", !!initialKey);
            if (!initialKey && typeof localStorage !== 'undefined') {
                try {
                    initialKey = localStorage.getItem('GEMINI_API_KEY');
                    console.log("GeminiProvider: initialKey from localStorage is defined?", !!initialKey);
                } catch (e) { console.error("GeminiProvider: localStorage error", e); }
            }
            if (!initialKey && typeof process !== 'undefined' && process.env) {
                try {
                    initialKey = process.env.GEMINI_API_KEY;
                    console.log("GeminiProvider: initialKey from process.env is defined?", !!initialKey);
                } catch (e) { console.error("GeminiProvider: process.env error", e); }
            }
            if (!initialKey) {
                console.error("GeminiProvider: NO API KEY FOUND");
                throw new Error("API key must be set when using the Gemini API. Ensure server injection or environment variable is present.");
            }
            console.log("GeminiProvider: Instantiating GoogleGenAI with key starting with...", initialKey.substring(0, 5));
            try {
                const { GoogleGenAI } = await import('@google/genai');
                this._ai = new GoogleGenAI({ apiKey: initialKey });
                console.log("GeminiProvider: GoogleGenAI instantiated successfully");
            } catch (e) {
                console.error("GeminiProvider: Error instantiating GoogleGenAI", e);
                throw e;
            }
        } else {
            console.log("GeminiProvider: _ai already exists, reusing");
        }
        console.log("GeminiProvider: getAi() returning");
        return this._ai;
    }


    private chat: any = null;
    private verifier = inject(VerifyAiService);

    generateReportStream(patientData: string, lens: string, systemInstruction: string): Observable<string> {
        return new Observable<string>(subscriber => {
            (async () => {
                try {
                    const ai = await this.getAi();
                    const streamResult = await ai.models.generateContentStream({
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

        const ai = await this.getAi();
        const response = await ai.models.generateContent({
            model: this.config.defaultModel.modelId,
            contents: prompt,
            config: {
                temperature: 0,
                responseMimeType: 'application/json'
            }
        });

        const { z } = await import('zod');
        const ClinicalMetricsSchema = z.object({
            complexity: z.number().min(0).max(10),
            stability: z.number().min(0).max(10),
            certainty: z.number().min(0).max(10)
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

        const ai = await this.getAi();
        const response = await ai.models.generateContent({
            model: this.config.defaultModel.modelId,
            contents: prompt,
            config: { temperature: 0 }
        });

        return response.text.toUpperCase().includes('TRUE');
    }

    async verifySection(lens: string, content: string, sourceData: string): Promise<{ status: string, issues: VerificationIssue[] }> {
        return await this.verifier.verifyReportSection(lens as any, content, sourceData);
    }

    async translateReadingLevel(text: string, level: 'simplified' | 'dyslexia' | 'child'): Promise<string> {
        let systemInstruction = '';
        if (level === 'simplified') {
            systemInstruction = `You are an expert clinical copywriter. Your task is to rewrite the provided medical text to improve its Flesch Reading Ease score and lower its Flesch-Kincaid Grade level (target: Grade 6-8). 
            
CRITICAL RULES:
1. Preserve ALL clinical facts, diagnoses, medications, and dosages exactly.
2. Use shorter sentences.
3. Replace complex medical jargon with simpler terms where possible, but keep the original term in parentheses if it's important (e.g., "high blood pressure (hypertension)").
4. Use active voice.
5. Use bullet points for lists.
6. Return ONLY the rewritten markdown text, with no introductory or concluding remarks.
7. Begin your output with "### [START CARE PLAN]" and end it with "### [END CARE PLAN]".`;
        } else if (level === 'dyslexia') {
            systemInstruction = `You are an expert in accessible communication. Your task is to rewrite the provided medical text to be Dyslexia-friendly and highly readable.

CRITICAL RULES:
1. Preserve ALL clinical facts, diagnoses, medications, and dosages exactly.
2. Structure the text with frequent line breaks and very short paragraphs (1-2 sentences max).
3. Use plain, everyday language. (Target very high Flesch Reading Ease).
4. Use **bold** text to highlight key points instead of italics or underlining.
5. Provide clear, step-by-step instructions using bullet points or numbered lists.
6. Avoid medical jargon; explain concepts simply.
7. Return ONLY the rewritten markdown text, with no introductory or concluding remarks.
8. Begin your output with "### [START CARE PLAN]" and end it with "### [END CARE PLAN]".`;
        } else if (level === 'child') {
            systemInstruction = `You are an expert pediatric communicator and child life specialist. Your task is to rewrite the provided medical text so it is easily understandable, comforting, and engaging for a child (target age: 8-12 years old).

CRITICAL RULES:
1. Explain medical concepts using simple, everyday analogies (e.g., "white blood cells are like tiny superheroes").
2. Focus on what the child will experience, how they will feel, and what they can do to help.
3. Keep the tone encouraging, warm, and not scary.
4. Preserve the core meaning of diagnoses and treatments, but omit overly complex dosage specifics unless relevant to the child's actions.
5. Use short sentences and simple formatting.
6. Return ONLY the rewritten markdown text, with no introductory or concluding remarks.
7. Begin your output with "### [START CARE PLAN]" and end it with "### [END CARE PLAN]".`;
        } else {
            return text; // Should not happen based on types
        }

        const prompt = `Please rewrite the following care plan text according to your system instructions:\n\n<clinical_text>\n${text}\n</clinical_text>`;

        const ai = await this.getAi();
        const response = await ai.models.generateContent({
            model: this.config.defaultModel.modelId,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.2 // Lower temp for more consistent rewriting
            }
        });

        return response.text;
    }

    async startChat(patientData: string, context: string): Promise<void> {
        console.log("GeminiProvider: startChat called");
        const systemInstruction = `${context}\n\nPatient Data:\n${patientData}`;
        console.log("GeminiProvider: calling getAi...");
        const ai = await this.getAi();
        console.log("GeminiProvider: calling ai.chats.create...");
        try {
            this.chat = ai.chats.create({
                model: this.config.defaultModel.modelId,
                config: {
                    systemInstruction,
                    temperature: this.config.defaultModel.temperature
                }
            });
            console.log("GeminiProvider: chat created successfully");
        } catch (e) {
            console.error("GeminiProvider: error in ai.chats.create", e);
            throw e;
        }
    }

    async sendMessage(message: string, files?: File[]): Promise<string> {
        if (!this.chat) throw new Error("Chat not started");

        let payload: any = message;

        if (files && files.length > 0) {
            const parts: any[] = [{ text: message }];
            for (const file of files) {
                const base64Data = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const res = reader.result as string;
                        // Data URL looks like: data:image/png;base64,...
                        const base64Str = res.includes(',') ? res.split(',')[1] : res;
                        resolve(base64Str);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
                parts.push({
                    inlineData: {
                        data: base64Data,
                        mimeType: file.type
                    }
                });
            }
            payload = parts;
        }

        const result = await this.chat.sendMessage({ message: payload });
        return result.text;
    }

    async getInitialGreeting(prompt: string): Promise<string> {
        if (!this.chat) throw new Error("Chat not started");
        const result = await this.chat.sendMessage({ message: prompt });
        return result.text;
    }
}
