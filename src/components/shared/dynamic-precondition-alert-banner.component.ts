import { Component, ChangeDetectionStrategy, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ClinicalPreconditionSentinelService,
  IClinicalRecommendationContract
} from '../../services/clinical/clinical-precondition-sentinel.service';

@Component({
  selector: 'app-dynamic-precondition-alert-banner',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full">
      @if (hasActiveBreaches()) {
        <aside
          role="alert"
          aria-live="assertive"
          class="w-full mb-4 p-4 rounded-xl border bg-gradient-to-r from-amber-950/80 via-zinc-900/90 to-red-950/80 border-amber-600/70 shadow-lg text-zinc-100 animate-in fade-in slide-in-from-top-2 duration-300">
          
          <div class="flex items-start justify-between gap-3 border-b border-amber-800/40 pb-3">
            <div class="flex items-center gap-2.5">
              <span class="flex h-3 w-3 relative" aria-hidden="true">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <h3 class="text-sm font-bold uppercase tracking-wider text-amber-300 font-mono flex items-center gap-1.5">
                <span>⚠️</span>
                <span>Clinical Precondition Boundary Breach — Stale Care Plan Detected</span>
              </h3>
            </div>
            <span class="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-200 border border-amber-700/80">
              {{ staleOrCriticalContracts().length }} Directive(s) Requiring Reassessment
            </span>
          </div>

          <div class="mt-3 space-y-3">
            @for (contract of staleOrCriticalContracts(); track contract.id) {
              <div
                class="p-3 rounded-lg bg-zinc-950/80 border text-xs space-y-1.5"
                [class.border-red-700]="contract.status === 'CONTRAINDICATED_CRITICAL'"
                [class.border-amber-700]="contract.status === 'STALE_REQUIRING_REASSESSMENT'">
                
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="font-bold text-zinc-100 flex items-center gap-1.5">
                    <span class="font-mono text-zinc-400">#{{ contract.id }}</span>
                    <span>{{ contract.title }}</span>
                  </span>
                  <span
                    class="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded"
                    [class.bg-red-950]="contract.status === 'CONTRAINDICATED_CRITICAL'"
                    [class.text-red-300]="contract.status === 'CONTRAINDICATED_CRITICAL'"
                    [class.bg-amber-950]="contract.status === 'STALE_REQUIRING_REASSESSMENT'"
                    [class.text-amber-300]="contract.status === 'STALE_REQUIRING_REASSESSMENT'">
                    {{ contract.status === 'CONTRAINDICATED_CRITICAL' ? '🚨 CRITICAL CONTRAINDICATION' : '⚠️ STALE / INVALIDATED' }}
                  </span>
                </div>

                @if (contract.breachedDelta; as delta) {
                  <p class="text-amber-200 leading-relaxed font-sans">
                    {{ delta.clinicalDeltaDirective }}
                  </p>
                  <div class="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono text-zinc-400">
                    <span>Parameter: <strong class="text-zinc-200">{{ delta.parameter }}</strong></span>
                    <span>Baseline: <strong class="text-zinc-300">{{ delta.baselineValue }}</strong></span>
                    <span>Current: <strong class="text-amber-300">{{ delta.currentValue }}</strong></span>
                    <span>Limit: <strong class="text-zinc-300">{{ delta.boundaryLimit }}</strong></span>
                  </div>
                }

                <div class="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800/80">
                  <button
                    type="button"
                    (click)="onReevaluate(contract)"
                    class="px-3 py-1.5 rounded text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-black transition-colors min-h-[44px] flex items-center touch-manipulation shadow-sm focus-visible:ring-2 focus-visible:ring-amber-400">
                    ⚡ Re-evaluate Directive Under Current Vitals
                  </button>
                  <button
                    type="button"
                    (click)="onDismiss(contract.id)"
                    class="px-3 py-1.5 rounded text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors min-h-[44px] flex items-center touch-manipulation focus-visible:ring-2 focus-visible:ring-zinc-400">
                    Acknowledge & Retire
                  </button>
                </div>

              </div>
            }
          </div>

        </aside>
      }
    </div>
  `
})
export class DynamicPreconditionAlertBannerComponent {
  readonly sentinel = inject(ClinicalPreconditionSentinelService);
  readonly hasActiveBreaches = this.sentinel.hasActiveBreaches;
  readonly staleOrCriticalContracts = this.sentinel.staleOrCriticalContracts;

  readonly reevaluateRequested = output<IClinicalRecommendationContract>();
  readonly contractDismissed = output<string>();

  public onReevaluate(contract: IClinicalRecommendationContract): void {
    this.reevaluateRequested.emit(contract);
  }

  public onDismiss(contractId: string): void {
    this.sentinel.acknowledgeAndRetire(contractId);
    this.contractDismissed.emit(contractId);
  }
}
