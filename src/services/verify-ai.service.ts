import { Injectable, inject } from '@angular/core';
import { GoogleGenAI } from '@google/genai';
import { VerificationIssue } from '../components/analysis-report.types';
import { AI_CONFIG } from './ai-provider.types';
import { AiCacheService } from './ai-cache.service';

@Injectable({
    providedIn: 'root'
})
export class VerifyAiService {
    private config = inject(AI_CONFIG);
    private _ai: GoogleGenAI | null = null;
    private cache = inject(AiCacheService);

    private get ai(): GoogleGenAI {
        if (!this._ai) {
            const apiKey = (window as any).GEMINI_API_KEY || this.config.apiKey;
            if (!apiKey) {
                throw new Error('API key must be set when using the Gemini API.');
            }
            this._ai = new GoogleGenAI({ apiKey });
        }
        return this._ai;
    }

    /**
     * Verifies a section of the AI report against the source patient data.
     */
    async verifyReportSection(
        sectionTitle: string,
        sectionContent: string,
        sourceTranscript: string
    ): Promise<{ status: 'verified' | 'warning' | 'error', issues: VerificationIssue[] }> {

        const prompt = `
      You are a Medical Auditor AI. Your task is to verify an AI-generated clinical report section against the source patient transcript.
      
      SOURCE TRANSCRIPT:
      ${sourceTranscript}
      
      REPORT SECTION [${sectionTitle}]:
      ${sectionContent}
      
      INSTRUCTIONS:
      1. Cross-reference every clinical claim in the report with the source transcript.
      2. Identify any:
         - Hallucinations (claims not found in transcript)
         - Inaccuracies (claims that distort transcript facts)
         - Critical Omissions (if the section title implies something that was missed)
      3. Rate the overall verification status as:
         - "verified": All claims are supported by the transcript.
         - "warning": Minor inaccuracies or unsupported claims that don't change clinical intent.
         - "error": Major hallucinations or contradictory information.
      
      OUTPUT FORMAT:
      Return a JSON object with the following structure:
      {
        "status": "verified" | "warning" | "error",
        "issues": [
          {
            "severity": "low" | "medium" | "high",
            "message": "Description of the issue",
            "suggestedFix": "Corrected text based on transcript",
            "claim": "The exact substring from the generated report that is problematic"
          }
        ]
      }
      
      Return ONLY the JSON.
    `;

        const cacheKey = await this.cache.generateKey([
            sectionTitle,
            sectionContent,
            sourceTranscript,
            this.config.verificationModel.modelId
        ]);

        try {
            const cached = await this.cache.get(cacheKey);
            if (cached) return cached;

            const response = await this.ai.models.generateContent({
                model: this.config.verificationModel.modelId,
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: {
                    responseMimeType: 'application/json',
                    temperature: this.config.verificationModel.temperature
                }
            });

            const text = response.text;
            const result = JSON.parse(text);
            await this.cache.set(cacheKey, result);
            return result;

        } catch (e) {
            console.error('AI Verification failed', e);
            return {
                status: 'warning',
                issues: [{ severity: 'low', message: 'Verification bridge failed. Please manually check transcript.' }]
            };
        }
    }
}
