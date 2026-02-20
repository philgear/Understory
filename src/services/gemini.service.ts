import { Injectable, signal } from '@angular/core';
import { GoogleGenAI, Chat, GenerateContentResponse } from '@google/genai';

export interface TranscriptEntry {
  role: 'user' | 'model';
  text: string;
}

export type AnalysisLens = 'Standard' | 'Differential Diagnosis' | 'Key Questions' | 'Lifestyle Factors';

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
    this.ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY!});
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

    const lenses: AnalysisLens[] = ['Standard', 'Differential Diagnosis', 'Key Questions', 'Lifestyle Factors'];
    const newReport: Partial<Record<AnalysisLens, string>> = {};

    const systemInstructions: Record<AnalysisLens, string> = {
      'Standard': `You are a world-class integrative medical AI assistant. Your role is to analyze patient data and provide a concise, professional, and well-structured preliminary analysis for a physician. The report should be structured with markdown for clear readability. Do NOT provide a diagnosis. Your tone should be clinical, helpful, and data-driven. Focus on identifying potential correlations between symptoms, suggesting possible areas for further investigation, and outlining potential next steps.`,
      'Differential Diagnosis': `You are an expert diagnostician AI. Analyze the following patient data and generate a list of potential differential diagnoses. For each possibility, provide a brief rationale based on the provided symptoms and vitals. Structure the response clearly using markdown. Do not provide a definitive diagnosis.`,
      'Key Questions': `You are a clinical interview assistant AI. Based on the patient's initial data, generate a list of insightful, open-ended questions the physician should ask to further explore the patient's condition. Group questions by topic (e.g., Symptom Details, Medical History, Lifestyle). Use markdown for formatting.`,
      'Lifestyle Factors': `You are a holistic and integrative medicine AI. Analyze the patient data with a specific focus on potential lifestyle, environmental, and psychosocial factors that could be contributing to their condition. Consider diet, stress, sleep, occupation, etc. Present your analysis in a structured markdown report.`
    };

    try {
        await Promise.all(lenses.map(async (lens) => {
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
        }));

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
    const systemInstruction = `You are a friendly and professional medical AI assistant named "Aura". You are speaking with a doctor. You have already reviewed the following patient's file: \n\n${patientData}\n\nYour role is to answer the doctor's questions concisely, provide differential diagnoses, suggest relevant tests, or research medical topics in real-time. Keep your answers brief and to the point. Be ready to elaborate when asked.`;
    
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