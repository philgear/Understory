import { Injectable, signal, computed, inject } from '@angular/core';
import { HardwareTelemetryService } from './hardware/hardware-telemetry.service';
import { PatientStateService } from './patient-state.service';
import { SecureStorageService } from './secure-storage.service';

const LOCAL_INFERENCE_KEY = 'pg_preferLocalInference';

@Injectable({ providedIn: 'root' })
export class NetworkStateService {
    private telemetry = inject(HardwareTelemetryService);
    private patientState = inject(PatientStateService);
    private storage = inject(SecureStorageService);

    private browserOnline = signal(typeof navigator !== 'undefined' ? navigator.onLine : true);
    readonly forceOffline = signal(false);

    /** When true, routes all AI calls to local inference even when online. Persisted via SecureStorageService. */
    readonly preferLocalInference = signal(
        this.storage.getItem(LOCAL_INFERENCE_KEY) === 'true'
    );

    readonly isOnline = computed(() => this.browserOnline() && !this.forceOffline());

    /** Whether local inference should currently be used (offline OR user prefers it). */
    readonly useLocalInference = computed(() => {
        const path = this.telemetry.recommendedExecutionPath();
        if (path === 'cloud') {
            return false;
        }
        return !this.isOnline() || this.preferLocalInference();
    });

    /**
     * Reactive label for the active AI provider shown in UI status tooltips.
     * Dynamically identifies the engine based on hardware recommendation and offline state.
     */
    readonly activeProvider = computed(() => {
        if (this.patientState.isEmergencyMode() && !this.isOnline()) {
            return 'Offline (Gemma 4 / Built-in AI)';
        }

        if (this.useLocalInference()) {
            const path = this.telemetry.recommendedExecutionPath();
            const prefix = this.isOnline() ? 'Local' : 'Offline';

            if (path === 'local-lemonade') {
                return `${prefix} (Lemonade - Gemma 3 4B Vulkan)`;
            } else if (path === 'local-nvidia') {
                return `${prefix} (CUDA - PubGemma)`;
            } else if (path === 'local-webgpu') {
                return `${prefix} (WebGPU - WebLLM)`;
            } else if (path === 'on-device-nano') {
                return `${prefix} (Built-in AI - Gemma 4 / Nano)`;
            } else {
                return `${prefix} (WebGPU - WebLLM)`;
            }
        }

        return 'Gemini Cloud';
    });

    constructor() {
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => this.browserOnline.set(true));
            window.addEventListener('offline', () => this.browserOnline.set(false));
        }
    }

    toggleForceOffline() {
        this.forceOffline.update(v => !v);
    }

    /**
     * Toggles the user's preference for local inference and persists the choice via SecureStorageService.
     */
    togglePreferLocalInference() {
        const next = !this.preferLocalInference();
        this.preferLocalInference.set(next);
        this.storage.setItem(LOCAL_INFERENCE_KEY, String(next));
    }
}
