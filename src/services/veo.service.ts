import { Injectable, signal } from '@angular/core';
import { GoogleGenAI } from '@google/genai';

export interface VeoGenerationState {
  isGenerating: boolean;
  progress: string;
  videoUrl: string | null;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class VeoService {
  readonly state = signal<VeoGenerationState>({
    isGenerating: false,
    progress: '',
    videoUrl: null,
    error: null
  });

  async hasApiKey(): Promise<boolean> {
    if (typeof window.aistudio?.hasSelectedApiKey === 'function') {
      return await window.aistudio.hasSelectedApiKey();
    }
    return !!process.env.GEMINI_API_KEY;
  }

  async selectApiKey(): Promise<void> {
    if (typeof window.aistudio?.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
    }
  }

  async generateBodyRotation(gender: 'Male' | 'Female', type: 'External' | 'Internal'): Promise<void> {
    this.state.set({
      isGenerating: true,
      progress: 'Initializing generation...',
      videoUrl: null,
      error: null
    });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.state.update(s => ({ ...s, isGenerating: false, error: 'API Key not found. Please select an API key.' }));
      return;
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `A highly detailed medical 3D model of a human ${gender.toLowerCase()} body, ${type.toLowerCase()} view ${type === 'Internal' ? 'showing skeleton and major organs' : 'showing skin and surface anatomy'}, rotating 360 degrees smoothly on a pure white background. Clinical, professional medical visualization style. High resolution, 1080p.`;

    try {
      this.state.update(s => ({ ...s, progress: 'Requesting video generation (this may take a few minutes)...' }));
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '1080p',
          aspectRatio: '9:16'
        }
      });

      // Poll for completion
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        this.state.update(s => ({ ...s, progress: 'Generating video... still working...' }));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        this.state.update(s => ({ 
          ...s, 
          isGenerating: false, 
          progress: 'Generation complete!',
          videoUrl: downloadLink 
        }));
      } else {
        throw new Error('Video generation failed: No download link received.');
      }

    } catch (e: any) {
      console.error('Veo generation error:', e);
      let errorMsg = e?.message || 'An unexpected error occurred during video generation.';
      if (errorMsg.includes('Requested entity was not found')) {
        errorMsg = 'API Key session expired or invalid. Please re-select your API key.';
      }
      this.state.update(s => ({ ...s, isGenerating: false, error: errorMsg }));
    }
  }

  reset() {
    this.state.set({
      isGenerating: false,
      progress: '',
      videoUrl: null,
      error: null
    });
  }
}
