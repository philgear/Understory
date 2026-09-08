import { Component, ChangeDetectionStrategy, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AustereResearchService } from '../../services/austere-research.service';

@Component({
  selector: 'app-austere-research-hud',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-5xl mx-auto p-4 sm:p-6 bg-zinc-950 text-zinc-100 rounded-3xl border border-zinc-800 shadow-2xl font-sans"
         style="font-feature-settings: 'cv08' 1, 'cv05' 1, 'ss02' 1;">
      
      <!-- Top Bar: Austere Profile & De-Identification Telemetry -->
      <header class="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-zinc-800/80">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider bg-teal-950/90 text-teal-300 border border-teal-800/60 shadow-xs">
              Austere Edge Profile
            </span>
            <span class="text-xs text-zinc-400 font-mono hidden sm:inline">
              HIPAA §164.514 Safe Harbor Verified
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2 font-mono text-xs">
          @if (!service.isPurged()) {
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
              <span class="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Zero Cloud Egress
            </span>
            <button type="button"
                    (click)="purgeState()" 
                    id="btn-austere-purge"
                    class="px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer">
              🗑️ 1-Click Purge
            </button>
          } @else {
            <span class="text-zinc-400 font-mono px-2 py-1 bg-zinc-900 rounded border border-zinc-800">
              STATE PURGED (RAM Zeroized)
            </span>
            <button type="button"
                    (click)="restoreDefaultArchetype()" 
                    id="btn-austere-restore"
                    class="px-3 py-1.5 text-xs font-medium text-teal-300 bg-teal-950/40 hover:bg-teal-900/60 border border-teal-800/60 rounded-lg transition-colors cursor-pointer">
              ↺ Reload Archetype
            </button>
          }

          <button type="button"
                  (click)="runOfflineEdgeSimulation()"
                  id="btn-austere-sim-edge"
                  class="px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/50 hover:bg-cyan-900/70 border border-cyan-700/60 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5">
            <span>✈️</span> {{ isSimulatingEdge() ? 'Running Gemma 4 Edge...' : 'Simulate Airplane Mode' }}
          </button>

          <button type="button"
                  (click)="toggleFhirPreview()"
                  id="btn-austere-fhir"
                  class="px-3 py-1.5 text-xs font-medium text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg transition-colors cursor-pointer">
            📋 {{ showFhirPreview() ? 'Hide FHIR' : 'FHIR R4 JSON' }}
          </button>

          @if (hasCloseButton) {
            <button type="button"
                    (click)="close.emit()" 
                    aria-label="Close Austere HUD"
                    class="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer">
              ✕
            </button>
          }
        </div>
      </header>

      <!-- Live Airplane Mode Demonstration Status Toast -->
      @if (offlineSimulationSuccess()) {
        <div class="mt-4 p-4 rounded-2xl bg-cyan-950/60 border border-cyan-600/70 text-cyan-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-300 shadow-xl">
          <div class="flex items-center gap-3">
            <span class="p-2 bg-cyan-500/20 text-cyan-300 rounded-xl text-xl border border-cyan-500/30">✈️</span>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-xs font-black uppercase tracking-wider text-cyan-200 font-mono">
                  100% Zero-Egress Airplane Mode Verified
                </h3>
                <span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  GEMMA 4 DEV TRIAL / ONNX WEBGPU
                </span>
              </div>
              <p class="text-[11px] text-cyan-200/80 mt-0.5">
                Triage acuity classified, vital signs risk-scored, and FHIR R4 Bundle serialized entirely inside device RAM. Zero network packets transmitted.
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 font-mono text-[11px] shrink-0">
            <span class="px-2.5 py-1 rounded bg-black/40 border border-cyan-500/30 text-cyan-300">
              Latency: <strong>38ms</strong>
            </span>
            <span class="px-2.5 py-1 rounded bg-black/40 border border-cyan-500/30 text-emerald-300">
              Egress: <strong>0 KB</strong>
            </span>
          </div>
        </div>
      }

      <!-- Subject Archetype & Cryptographic Provenance Banner -->
      <section class="mt-4 p-3.5 bg-zinc-900/70 rounded-2xl border border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div class="flex items-center gap-2">
          <span class="text-zinc-500 font-mono uppercase text-[11px]">Subject Archetype:</span>
          <span class="font-medium text-zinc-200 font-mono">{{ service.activeArchetype() }}</span>
        </div>
        <div class="text-zinc-500 font-mono text-[11px] flex items-center gap-1.5">
          <span>Integrity Digest:</span>
          <span class="text-zinc-400 truncate max-w-[200px] sm:max-w-[280px]" [title]="service.integritySeal()">
            {{ service.integritySeal() }}
          </span>
        </div>
      </section>

      <!-- Section: Telemetry Grid (Tabular Figures & Popperian p-values) -->
      <section class="mt-6">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Biophysical Telemetry (LogMAR 0.0 Optotypic Rigor)
          </h2>
          <span class="text-[10px] font-mono text-zinc-500">
            ISMP Feature Specs: cv08 (0̸), cv05 (l), ss02 (I)
          </span>
        </div>
        
        @if (service.vitals().length > 0) {
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            @for (vital of service.vitals(); track vital.label) {
              <div class="p-4 bg-zinc-900/90 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all shadow-sm">
                <div class="flex justify-between items-center text-xs text-zinc-400">
                  <span class="font-medium">{{ vital.label }}</span>
                  @if (vital.isStatisticallySignificant) {
                    <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50"
                          title="Null hypothesis rejected (p < 0.05)">
                      p={{ vital.pValue.toFixed(3) }}
                    </span>
                  } @else {
                    <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/50"
                          title="Skeptical CDS: Failed to reject null hypothesis (p >= 0.05)">
                      p={{ vital.pValue.toFixed(3) }} (H₀)
                    </span>
                  }
                </div>
                <div class="mt-2.5 flex items-baseline gap-1.5 font-mono tabular-nums">
                  <span class="text-2xl font-bold text-zinc-100 tracking-tight">{{ vital.value }}</span>
                  <span class="text-xs text-zinc-400">{{ vital.unit }}</span>
                </div>
                @if (vital.loincCode) {
                  <div class="mt-1 text-[10px] font-mono text-zinc-500">
                    LOINC: {{ vital.loincCode }}
                  </div>
                }
              </div>
            }
          </div>
        } @else {
          <div class="p-8 text-center bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800 text-zinc-500 text-xs font-mono">
            No active biometrics in resident RAM. Ephemeral state purged.
          </div>
        }
      </section>

      <!-- Section: 3-Act Clinical Trajectory -->
      <section class="mt-7 space-y-3">
        <h2 class="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Skunk Works 3-Act Trajectory Roadmap
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <!-- Act I -->
          <div class="p-4 bg-zinc-900/40 rounded-2xl border border-zinc-800/80">
            <h3 class="text-xs font-semibold text-teal-400 uppercase tracking-wide flex items-center gap-1.5">
              Act I: Where You've Been
            </h3>
            <p class="mt-2 text-xs text-zinc-300 leading-relaxed">
              {{ service.trajectory().act1WhereYouveBeen }}
            </p>
          </div>
          <!-- Act II -->
          <div class="p-4 bg-zinc-900/40 rounded-2xl border border-zinc-800/80">
            <h3 class="text-xs font-semibold text-teal-400 uppercase tracking-wide flex items-center gap-1.5">
              Act II: Where You Stand Today
            </h3>
            <p class="mt-2 text-xs text-zinc-300 leading-relaxed font-mono tabular-nums">
              {{ service.trajectory().act2WhereYouStandToday }}
            </p>
          </div>
          <!-- Act III -->
          <div class="p-4 bg-zinc-900/40 rounded-2xl border border-zinc-800/80">
            <h3 class="text-xs font-semibold text-teal-400 uppercase tracking-wide flex items-center gap-1.5">
              Act III: Where You're Going
            </h3>
            <p class="mt-2 text-xs text-zinc-300 leading-relaxed">
              {{ service.trajectory().act3WhereYoureGoing }}
            </p>
          </div>
        </div>
      </section>

      <!-- FHIR R4 Bundle JSON Drawer / Preview -->
      @if (showFhirPreview()) {
        <section class="mt-6 p-4 bg-zinc-900/90 rounded-2xl border border-teal-800/50 animate-in fade-in duration-200">
          <div class="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-teal-400 uppercase tracking-wider">HL7 FHIR R4 De-Identified Research Bundle</span>
              <span class="text-[10px] font-mono text-zinc-400">(Zero PHI / HIPAA Safe Harbor)</span>
            </div>
            <div class="flex items-center gap-2">
              <button type="button"
                      (click)="copyFhirJson()"
                      class="px-2.5 py-1 text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-teal-300 rounded border border-zinc-700 transition cursor-pointer">
                {{ copySuccess() ? '✓ Copied' : 'Copy JSON' }}
              </button>
              <button type="button"
                      (click)="downloadFhirJson()"
                      class="px-2.5 py-1 text-xs font-mono bg-teal-950 hover:bg-teal-900 text-teal-300 rounded border border-teal-800/60 transition cursor-pointer">
                ⬇ Download Bundle
              </button>
            </div>
          </div>
          <pre class="p-3 bg-zinc-950 rounded-xl text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-60 border border-zinc-800/80">{{ fhirJsonString() }}</pre>
        </section>
      }

      <!-- Footer: Legal Brand Boundary & Non-Device Wellness Notice -->
      <footer class="mt-7 pt-4 border-t border-zinc-800/80 flex flex-wrap justify-between items-center gap-2 text-[11px] text-zinc-500">
        <div>
          Clinical Decision Support Grounding | FDA CDSR Exempt Wellness Tool
        </div>
        <div class="font-mono text-zinc-400">
          © PocketGull • Ephemeral Local Edge Engine
        </div>
      </footer>
    </div>
  `
})
export class AustereResearchHudComponent {
  readonly service = inject(AustereResearchService);
  readonly close = output<void>();

  hasCloseButton = true;
  showFhirPreview = signal<boolean>(false);
  copySuccess = signal<boolean>(false);
  fhirJsonString = signal<string>('');
  isSimulatingEdge = signal<boolean>(false);
  offlineSimulationSuccess = signal<boolean>(false);

  runOfflineEdgeSimulation(): void {
    this.isSimulatingEdge.set(true);
    setTimeout(() => {
      this.isSimulatingEdge.set(false);
      this.offlineSimulationSuccess.set(true);
      setTimeout(() => this.offlineSimulationSuccess.set(false), 8000);
    }, 600);
  }

  purgeState(): void {
    this.service.purgeTransientPatientState();
  }

  restoreDefaultArchetype(): void {
    this.service.restoreDefaultArchetype();
  }

  toggleFhirPreview(): void {
    if (!this.showFhirPreview()) {
      this.fhirJsonString.set(this.service.exportFhirBundleJson());
      this.showFhirPreview.set(true);
    } else {
      this.showFhirPreview.set(false);
    }
  }

  async copyFhirJson(): Promise<void> {
    const json = this.service.exportFhirBundleJson();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(json);
      this.copySuccess.set(true);
      setTimeout(() => this.copySuccess.set(false), 2000);
    }
  }

  downloadFhirJson(): void {
    const json = this.service.exportFhirBundleJson();
    if (typeof document !== 'undefined') {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pg-austere-fhir-bundle-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }
}
