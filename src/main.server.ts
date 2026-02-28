import { BootstrapContext, bootstrapApplication, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { provideServerRendering } from '@angular/platform-server';
import { provideZonelessChangeDetection, ApplicationConfig } from '@angular/core';
import { AI_CONFIG, AiProviderConfig } from './services/ai-provider.types';
import { IntelligenceProviderToken } from './services/ai/intelligence.provider.token';
import { GeminiProvider } from './services/ai/gemini.provider';

const serverConfig: ApplicationConfig = {
    providers: [
        provideServerRendering(),
        provideZonelessChangeDetection(),
        {
            provide: AI_CONFIG,
            useFactory: () => ({
                // During SSR, we don't have window. Use an empty string or process.env if available, 
                // though our server.ts injects the script into HTML so the client gets it.
                apiKey: process.env['GEMINI_API_KEY'] || '',
                defaultModel: { modelId: 'gemini-2.5-flash', temperature: 0.1 },
                verificationModel: { modelId: 'gemini-2.5-flash', temperature: 0.0 }
            } as AiProviderConfig)
        },
        {
            provide: IntelligenceProviderToken,
            useClass: GeminiProvider
        },
        provideClientHydration(withEventReplay())
    ]
};

const bootstrap = (context: BootstrapContext) =>
    bootstrapApplication(AppComponent, serverConfig, context);

export default bootstrap;
