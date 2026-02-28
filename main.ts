
import { bootstrapApplication, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { AppComponent } from './src/app.component';
import { AI_CONFIG, AiProviderConfig } from './src/services/ai-provider.types';
import { IntelligenceProviderToken } from './src/services/ai/intelligence.provider.token';
import { GeminiProvider } from './src/services/ai/gemini.provider';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    {
      provide: AI_CONFIG,
      useFactory: () => ({
        apiKey: (window as any).GEMINI_API_KEY || '',
        defaultModel: { modelId: 'gemini-2.5-flash', temperature: 0.1 },
        verificationModel: { modelId: 'gemini-2.5-flash', temperature: 0.0 }
      } as AiProviderConfig)
    },
    {
      provide: IntelligenceProviderToken,
      useClass: GeminiProvider
    }, provideClientHydration(withEventReplay())
  ]
}).catch(err => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.
