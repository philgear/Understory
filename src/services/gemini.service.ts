import { Injectable, signal } from '@angular/core';
import { GoogleGenAI } from "@google/genai";

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;
  
  readonly isLoading = signal<boolean>(false);
  readonly analysisResult = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env['API_KEY'] || '' });
  }

  async generateResearch(patientData: string) {
    if (!process.env['API_KEY']) {
      this.error.set("API Key is missing.");
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.analysisResult.set(null);

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `
          You are a world-class Integrative Care Specialist and Medical Researcher.
          Review the following patient intake data. 
          
          ${patientData}
          
          Provide a structured response in Markdown format covering:
          1. Potential Integrative Mechanisms (Connect the symptoms holistically).
          2. Suggested Research Areas (What should the doctor look into?).
          3. Lifestyle & Holistic Approaches (Nutrition, movement, stress management).
          4. Conventional Considerations (Red flags or standard tests to consider).
          
          Keep the tone professional, empathetic, and succinct for a doctor to review quickly.
        `,
        config: {
          systemInstruction: "You are an expert medical assistant specializing in Integrative Medicine.",
          temperature: 0.3
        }
      });

      this.analysisResult.set(response.text);
    } catch (e: any) {
      this.error.set(e.message || "An error occurred while generating the report.");
    } finally {
      this.isLoading.set(false);
    }
  }
}