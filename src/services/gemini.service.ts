import { Injectable, signal } from '@angular/core';
import { GoogleGenAI, Chat, GenerateContentResponse } from '@google/genai';

export interface TranscriptEntry {
  role: 'user' | 'model';
  text: string;
}

export type AnalysisLens = 'Care Plan Overview' | 'Clinical Interventions' | 'Monitoring & Follow-up' | 'Patient Education';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;
  private chat: Chat | null = null;

  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Store analysis reports for each lens
  readonly analysisResults = signal<Partial<Record<AnalysisLens, string>>>({});

  // For live agent chat
  readonly transcript = signal<TranscriptEntry[]>([]);

  constructor() {
    // The API key is assumed to be available in the execution environment's process.env
    const env = typeof process !== 'undefined' ? process.env : {} as any;
    const apiKey = env?.GEMINI_API_KEY || 'waiting-for-key';
    this.ai = new GoogleGenAI({ apiKey: apiKey });
  }

  /**
   * Clears all AI-related state, such as reports and transcripts.
   * Essential for when the user switches to a new patient.
   */
  public resetAIState() {
    this.isLoading.set(false);
    this.error.set(null);
    this.analysisResults.set({});
    this.transcript.set([]);
    this.chat = null;
  }

  /**
   * Loads a previously generated analysis report into the state for viewing.
   */
  public loadArchivedAnalysis(report: Partial<Record<AnalysisLens, string>>) {
    this.resetAIState();
    this.analysisResults.set(report);
  }

  /**
   * Generates a one-time, comprehensive analysis report covering all lenses.
   */
  async generateComprehensiveReport(patientData: string): Promise<Partial<Record<AnalysisLens, string>>> {
    this.isLoading.set(true);
    this.error.set(null);
    this.analysisResults.set({});

    const lenses: AnalysisLens[] = ['Care Plan Overview', 'Clinical Interventions', 'Monitoring & Follow-up', 'Patient Education'];
    const newReport: Partial<Record<AnalysisLens, string>> = {};

    const systemInstructions: Record<AnalysisLens, string> = {
      'Care Plan Overview': `You are a world-class care plan recommendation engine. Analyze the provided finalized patient overview (including chief complaint, vitals, history) and generate a cohesive, actionable Care Plan Overview. Do NOT provide a definitive medical diagnosis. Structure the report beautifully in markdown. Your tone should be strategic, supportive, and data-driven. Focus on synthesizing the current state into overarching goals and immediate priorities for the patient's care.`,
      'Clinical Interventions': `You are an expert clinical strategist AI. Analyze the patient overview and recommend specific, evidence-based clinical interventions. This could include suggested lab tests, imaging, specialist referrals, or pharmacological adjustments to consider. Briefly provide rationale for each based on the data. Structure the response clearly using markdown. Keep it concise so a physician can quickly review and approve.`,
      'Monitoring & Follow-up': `You are a care coordination AI. Based on the patient's data, generate a structured timeline and criteria for monitoring their progress and scheduling follow-ups. Specify what vitals, symptoms, or markers need tracking over the next days, weeks, or months. Outline "red flag" conditions that require immediate intervention. Use markdown formatting.`,
      'Patient Education': `You are an empathetic patient education AI. Analyze the clinical data and draft structured, easy-to-understand educational points or lifestyle strategies tailored to the patient's specific conditions. Provide actionable advice for diet, stress reduction, sleep hygiene, or physical activity that the physician can share directly with the patient. Format with clear markdown bullet points.`
    };

    try {
      // Execute requests sequentially to avoid rate limits or parallel execution issues
      for (const lens of lenses) {
        const systemInstruction = systemInstructions[lens];
        try {
          const response: GenerateContentResponse = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: patientData,
            config: {
              systemInstruction: systemInstruction,
            }
          });
          newReport[lens] = response.text;
        } catch (e) {
          console.error(`Error generating report for lens: ${lens}`, e);
          newReport[lens] = `### Error\nAn error occurred while generating the analysis for this section. Please try again.`;
        }
      }

      this.analysisResults.set(newReport);
      return newReport;

    } catch (e: any) {
      const errorMessage = String(e?.message ?? e);
      this.error.set(errorMessage || "A top-level error occurred while communicating with the analysis service.");
      return {};
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Starts a new, stateful chat session.
   */
  startChatSession(patientData: string) {
    this.transcript.set([]);
    const systemInstruction = `You are a collaborative care plan co-pilot named "Aura". You are assisting a doctor in refining a strategy for their patient. You have already reviewed the finalized patient overview and the current recommendations: \n\n${patientData}\n\nYour role is to help the doctor iterate on the care plan, explore clinical interventions, structure follow-ups, or answer specific questions about the patient's data. Keep your answers brief, actionable, and focused on strategic care. Be ready to elaborate when asked.`;

    this.chat = this.ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction
      }
    });
  }

  /**
   * Gets an initial greeting from the AI to start the conversation.
   */
  async getInitialGreeting(): Promise<string> {
    this.isLoading.set(true);
    if (!this.chat) {
      const err = "Chat session not initialized.";
      this.error.set(err);
      this.isLoading.set(false);
      return `Sorry, an error occurred: ${err}`;
    }
    try {
      const response = await this.chat.sendMessage({ message: "Start the conversation with a friendly and professional tone. Greet the doctor and confirm you have reviewed the patient's file and are ready for questions." });
      const responseText = response.text;
      this.transcript.set([{ role: 'model', text: responseText }]);
      return responseText;
    } catch (e: any) {
      const errorMsg = String(e?.message ?? e) || "An error occurred getting the greeting.";
      this.error.set(errorMsg);
      this.transcript.set([{ role: 'model', text: `Error: ${errorMsg}` }]);
      return `Sorry, an error occurred: ${errorMsg}`;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Sends a message in the current chat session.
   */
  async sendChatMessage(message: string): Promise<string> {
    this.isLoading.set(true);
    this.error.set(null);
    this.transcript.update(t => [...t, { role: 'user', text: message }]);

    if (!this.chat) {
      const errorMsg = "Chat session not initialized.";
      this.error.set(errorMsg);
      this.transcript.update(t => [...t, { role: 'model', text: `Error: ${errorMsg}` }]);
      this.isLoading.set(false);
      return `Sorry, an error occurred: ${errorMsg}`;
    }

    try {
      const response: GenerateContentResponse = await this.chat.sendMessage({ message });
      const responseText = response.text;

      this.transcript.update(t => [...t, { role: 'model', text: responseText }]);
      return responseText;

    } catch (e: any) {
      const errorMsg = String(e?.message ?? e) || "An error occurred during the chat.";
      this.error.set(errorMsg);
      this.transcript.update(t => [...t, { role: 'model', text: `Error: ${errorMsg}` }]);
      return `Sorry, an error occurred: ${errorMsg}`;
    } finally {
      this.isLoading.set(false);
    }
  }
}