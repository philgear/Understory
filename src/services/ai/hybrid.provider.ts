import { inject, Injectable } from '@angular/core';
import { IIntelligenceProvider } from './intelligence.provider';
import { GeminiProvider } from './gemini.provider';
import { PubGemmaProvider } from './pubgemma.provider';
import { LemonadeProvider } from './lemonade.provider';
import { NanoProvider } from './nano.provider';
import { WebLLMProvider } from './webllm.provider';
import { IClinicalMetrics } from '../clinical-intelligence.service';
import { IVerificationIssue } from '../../components/analysis-report.types';
import { NetworkStateService } from '../network-state.service';
import { HardwareTelemetryService } from '../hardware/hardware-telemetry.service';
import { PatientStateService } from '../patient-state.service';

/**
 * Thrown when all available AI providers in the hybrid chain have been exhausted.
 * Callers should catch this to show appropriate UI feedback rather than silently degrading.
 */
export class AIProviderExhaustedError extends Error {
  public readonly providerErrors: string[];
  constructor(method: string, errors: string[]) {
    super(`[HybridProvider] All providers exhausted for ${method}: ${errors.join('; ')}`);
    this.name = 'AIProviderExhaustedError';
    this.providerErrors = errors;
  }
}

@Injectable({
  providedIn: 'root'
})
export class HybridProvider implements IIntelligenceProvider {
  private gemini = inject(GeminiProvider);
  private nvidia = inject(PubGemmaProvider); // Local NVIDIA server
  private lemonade = inject(LemonadeProvider); // Local Lemonade Server (AMD Radeon Vulkan / Gemma 3 4B)
  private nano = inject(NanoProvider); // On-device Chrome Nano
  private webgpu = inject(WebLLMProvider); // Local WebGPU (WebLLM)
  private network = inject(NetworkStateService);
  private telemetry = inject(HardwareTelemetryService);
  private patientState = inject(PatientStateService);

  /**
   * Builds the dynamically optimized chain of intelligence providers based on
   * user preferences, network status, task complexity, and detected local hardware telemetry.
   */
  private getProviderChain(taskComplexity: 'simple' | 'complex' = 'complex'): IIntelligenceProvider[] {
    if (this.patientState.isEmergencyMode() && !this.network.isOnline()) {
      return [this.nano];
    }
    const path = this.telemetry.recommendedExecutionPath();
    const useLocal = this.network.useLocalInference() || taskComplexity === 'simple';
    const chain: IIntelligenceProvider[] = [];

    if (useLocal) {
      // Local-first preference
      if (path === 'local-lemonade' || this.lemonade.isConnected()) {
        chain.push(this.lemonade, this.webgpu, this.nano);
      } else if (path === 'local-nvidia') {
        chain.push(this.nvidia, this.webgpu, this.nano);
      } else if (path === 'local-webgpu') {
        chain.push(this.webgpu, this.nano);
      } else if (path === 'on-device-nano') {
        chain.push(this.nano, this.webgpu);
      } else {
        chain.push(this.lemonade, this.webgpu, this.nano);
      }
      
      // Cloud fallback as last-ditch effort if online
      if (this.network.isOnline()) {
        chain.push(this.gemini);
      }
    } else {
      // Cloud-first preference
      chain.push(this.gemini);
      
      // Local backups based on telemetry
      if (path === 'local-lemonade' || this.lemonade.isConnected()) {
        chain.push(this.lemonade, this.webgpu, this.nano);
      } else if (path === 'local-nvidia') {
        chain.push(this.nvidia, this.webgpu, this.nano);
      } else if (path === 'local-webgpu') {
        chain.push(this.webgpu, this.nano);
      } else if (path === 'on-device-nano') {
        chain.push(this.nano, this.webgpu);
      } else {
        chain.push(this.lemonade, this.webgpu, this.nano);
      }
    }

    // Filter duplicates
    return Array.from(new Set(chain));
  }

  async *generateReportStream$(patientData: string, lens: string, systemInstruction: string): AsyncIterable<string> {
    const chain = this.getProviderChain();
    let success = false;
    let errors: string[] = [];

    for (const provider of chain) {
      try {
        yield* provider.generateReportStream$(patientData, lens, systemInstruction);
        success = true;
        break;
      } catch (err: any) {
        const name = provider.constructor.name.replace('Provider', '');
        console.warn(`Provider [${name}] failed:`, err);
        errors.push(`${name}: ${err.message || err}`);
        
        // Fast-fail if network dropped while using a cloud provider
        if (name === 'Gemini' && !this.network.isOnline()) {
           yield `\n\n_⚡ Network connection lost. Rerouting to local offline engine..._\n\n`;
        } else {
           yield `\n\n_⚡ AI node ${name} unavailable. Routing to fallback..._\n\n`;
        }
      }
    }

    if (!success) {
      throw new Error(`All available on-device and cloud engines failed: ${errors.join('; ')}`);
    }
  }

  async generateMetrics(reportText: string): Promise<IClinicalMetrics> {
    const chain = this.getProviderChain();
    for (const provider of chain) {
      try {
        return await provider.generateMetrics(reportText);
      } catch (e: any) {
        console.warn(`generateMetrics failed on ${provider.constructor.name}: ${e.message || e}`, e);
      }
    }
    throw new AIProviderExhaustedError('generateMetrics', chain.map(p => p.constructor.name));
  }

  async detectClinicalChanges(oldData: string, newData: string): Promise<boolean> {
    const chain = this.getProviderChain();
    for (const provider of chain) {
      try {
        return await provider.detectClinicalChanges(oldData, newData);
      } catch (e) {
        console.warn(`detectClinicalChanges failed on ${provider.constructor.name}, trying next...`);
      }
    }
    throw new AIProviderExhaustedError('detectClinicalChanges', chain.map(p => p.constructor.name));
  }

  async verifySection(lens: string, content: string, sourceData: string): Promise<{ status: string, issues: IVerificationIssue[] }> {
    const chain = this.getProviderChain('simple');
    for (const provider of chain) {
      try {
        return await provider.verifySection(lens, content, sourceData);
      } catch (e) {
        console.warn(`verifySection failed on ${provider.constructor.name}, trying next...`);
      }
    }
    throw new AIProviderExhaustedError('verifySection', chain.map(p => p.constructor.name));
  }

  async translateReadingLevel(
    text: string,
    level?: 'simplified' | 'dyslexia' | 'child' | 'spanish' | 'german' | 'french' | 'japanese' | 'hindi',
    cognitiveLevel?: 'standard' | 'simplified' | 'dyslexia' | 'child',
    language?: string
  ): Promise<string> {
    const chain = this.getProviderChain('simple');
    for (const provider of chain) {
      try {
        return await provider.translateReadingLevel(text, level, cognitiveLevel, language);
      } catch (e) {
        console.warn(`translateReadingLevel failed on ${provider.constructor.name}, trying next...`);
      }
    }
    throw new AIProviderExhaustedError('translateReadingLevel', chain.map(p => p.constructor.name));
  }

  async analyzeTranslation(original: string, translated: string): Promise<string> {
    const chain = this.getProviderChain('simple');
    for (const provider of chain) {
      try {
        return await provider.analyzeTranslation(original, translated);
      } catch (e) {
        console.warn(`analyzeTranslation failed on ${provider.constructor.name}, trying next...`);
      }
    }
    console.error('[HybridProvider] All providers exhausted for analyzeTranslation');
    return "Analysis unavailable — all AI engines failed.";
  }

  async analyzeImage(base64Image: string, context?: string): Promise<string> {
    const chain = this.getProviderChain();
    for (const provider of chain) {
      try {
        return await provider.analyzeImage(base64Image, context);
      } catch (e) {
        console.warn(`analyzeImage failed on ${provider.constructor.name}, trying next...`);
      }
    }
    throw new Error('All engines failed image analysis.');
  }

  async startChat(patientData: string, context: string): Promise<void> {
    const chain = this.getProviderChain();
    let errors: string[] = [];
    for (const provider of chain) {
      try {
        await provider.startChat(patientData, context);
        return;
      } catch (e: any) {
        console.warn(`startChat failed on ${provider.constructor.name}, trying next...`);
        errors.push(`${provider.constructor.name}: ${e.message}`);
      }
    }
    throw new Error(`Failed to start chat session on any provider: ${errors.join('; ')}`);
  }

  async sendMessage(message: string, files?: File[]): Promise<string> {
    const chain = this.getProviderChain();
    for (const provider of chain) {
      try {
        return await provider.sendMessage(message, files);
      } catch (e) {
        console.warn(`sendMessage failed on ${provider.constructor.name}, trying next...`);
      }
    }
    throw new Error('All local/cloud chat engines failed to respond.');
  }

  async synthesizeKnowledge(inputText: string): Promise<any> {
    const chain = this.getProviderChain();
    for (const provider of chain) {
      try {
        return await provider.synthesizeKnowledge(inputText);
      } catch (e) {
        console.warn(`synthesizeKnowledge failed on ${provider.constructor.name}, trying next...`);
      }
    }
    throw new Error('All engines failed to synthesize knowledge.');
  }

  async getInitialGreeting(prompt: string): Promise<string> {
    const chain = this.getProviderChain();
    for (const provider of chain) {
      try {
        return await provider.getInitialGreeting(prompt);
      } catch (e) {
        console.warn(`getInitialGreeting failed on ${provider.constructor.name}, trying next...`);
      }
    }
    return "Hello, AI services are currently operating in restricted local offline mode.";
  }

  /**
   * System 1: Fast-Loop Edge Execution (<100ms, 0 network egress).
   * Executes bedside note structuring, ISMP proofreading, and triage acuity classification
   * exclusively on local hardware (Chrome Built-in AI Nano / WebGPU / SmolLM2).
   */
  async executeSystem1EdgeTask(prompt: string): Promise<string> {
    const edgeChain = [this.lemonade, this.nano, this.webgpu, this.nvidia];
    for (const provider of edgeChain) {
      try {
        return await provider.sendMessage(prompt);
      } catch (err) {
        console.warn(`[HybridProvider] System 1 edge task failed on ${provider.constructor.name}:`, err);
      }
    }
    // Deterministic fallback if all local providers fail
    return `[SYSTEM 1 EDGE DETERMINISTIC FALLBACK]: ${prompt}`;
  }

  /**
   * System 2: Deliberative Slow-Loop Deep Thinking (1.5 - 3.0s).
   * Executes statistical H0 hypothesis testing, Cochrane risk of bias auditing,
   * and 3-counter-hypotheses generation with dedicated thinking budget.
   */
  async executeSystem2ThinkingTask(prompt: string): Promise<string> {
    if (this.network.isOnline()) {
      try {
        return await this.gemini.sendMessage(prompt);
      } catch (err) {
        console.warn('[HybridProvider] System 2 cloud thinking failed, falling back to local chain:', err);
      }
    }
    // Local fallback for offline environments: leverage Lemonade Gemma 3 4B if available
    if (this.lemonade.isConnected()) {
      try {
        return await this.lemonade.sendMessage(prompt);
      } catch (err) {
        console.warn('[HybridProvider] System 2 Lemonade fallback failed:', err);
      }
    }
    return this.executeSystem1EdgeTask(prompt);
  }
}
