import { InjectionToken } from '@angular/core';

export type AiModelId =
    | 'gemini-2.5-flash'
    | 'gemini-2.5-pro';

export interface AiModelConfig {
    modelId: AiModelId;
    temperature?: number;
    topP?: number;
    maxOutputTokens?: number;
}

export interface AiProviderConfig {
    apiKey: string;
    defaultModel: AiModelConfig;
    verificationModel: AiModelConfig;
}

export const AI_CONFIG = new InjectionToken<AiProviderConfig>('AI_CONFIG');
