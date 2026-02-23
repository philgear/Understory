import { Injectable, signal } from '@angular/core';
import { GoogleGenAI, Chat, GenerateContentResponse } from '@google/genai';

export interface TranscriptEntry {
  role: 'user' | 'model';
  text: string;
}

export type AnalysisLens = 'Care Plan Overview' | 'Functional Protocols' | 'Monitoring & Follow-up' | 'Patient Education';

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

    const lenses: AnalysisLens[] = ['Care Plan Overview', 'Functional Protocols', 'Monitoring & Follow-up', 'Patient Education'];
    const newReport: Partial<Record<AnalysisLens, string>> = {};

    const systemInstructions: Record<AnalysisLens, string> = {
      'Care Plan Overview': `You are a world-class care plan recommendation engine. Analyze the provided finalized patient overview and generate a cohesive, actionable Care Plan Overview. Adopt a strict Medical Chart style (e.g., SOAP note characteristics, objective clinical tone, succinct language). Do NOT provide a definitive medical diagnosis. Structure the report beautifully using rich MDX format (Markdown with extended syntax, semantic headers, and structured data blocks). For key-value pairs, ALWAYS format as "**Label:** Value" (bolding the label only, not the value). Focus on synthesizing the current state into an Assessment and overarching prioritized Plan.`,
      'Functional Protocols': `You are an expert functional strategist AI. Analyze the patient overview and recommend specific, evidence-based integrative interventions using a strict Medical Chart style. Format the response cleanly in MDX format (e.g., utilizing tables, blockquotes, or structured lists). For key-value pairs, ALWAYS format as "**Label:** Value" (bolding the label only). Group recommendations by category (Labs, Imaging, Pharmacology, Specialist Referrals, Therapeutics) with brief, objective physiological rationales for each. Keep it highly concise for quick physician review.`,
      'Monitoring & Follow-up': `You are a care coordination AI. Generate a structured timeline and criteria for monitoring progress and scheduling follow-ups. Use a strict Medical Chart style and highly structured MDX formatting. For key-value pairs, ALWAYS format as "**Label:** Value" (bolding the label only). Clearly specify tracking parameters for vitals, symptoms, or markers over the next timeframe, and explicitly outline "Red Flag" conditions requiring immediate attention.`,
      'Patient Education': `You are an integrative patient education AI. Draft structured, easy-to-understand educational points tailored to the patient's specific conditions. Maintain a structured Medical Chart style (organized, precise) but use a tone accessible to the patient. Use rich MDX formatting with clear headers, nested bullet points, emphasized instructions, and actionable strategies (diet, stress, sleep, physical activity) for the physician to share directly. For key-value pairs, ALWAYS format as "**Label:** Value" (bolding the label only).`
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
    const systemInstruction = `You are a collaborative care plan co-pilot named "Aura". You are assisting a doctor in refining a strategy for their patient. You have already reviewed the finalized patient overview and the current recommendations: \n\n${patientData}\n\nYour role is to help the doctor iterate on the care plan, explore functional protocols, structure follow-ups, or answer specific questions about the patient's data. Keep your answers brief, actionable, and focused on strategic holistic care. Be ready to elaborate when asked.`;

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