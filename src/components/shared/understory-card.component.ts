import { Component, ChangeDetectionStrategy, input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'understory-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass-card rounded-xl border border-white/20 shadow-lg relative overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:border-white/40">
      <!-- Glow Effect -->
      <div class="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <div class="px-6 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
        <div class="flex items-center gap-3">
          @if (icon()) {
            <div class="w-8 h-8 rounded-lg bg-primary-10 flex items-center justify-center text-[#689F38]">
              <div [innerHTML]="iconHtml()"></div>
            </div>
          }
          <h3 class="text-sm font-bold uppercase tracking-widest text-[#111827]">{{ title() }}</h3>
        </div>
        <ng-content select="[right-action]"></ng-content>
      </div>

      <div class="flex-grow" [class.p-6]="!noPadding()">
        <ng-content></ng-content>
      </div>
      
      @if (footer()) {
        <div class="px-6 py-4 border-t border-white/10 text-xs text-gray-500 bg-black/5">
          <ng-content select="[card-footer]"></ng-content>
        </div>
      }
    </div>
  `,
  styles: [`
    .glass-card {
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
    
    :host-context(.dark) .glass-card {
      background: rgba(30, 41, 59, 0.7);
    }
    
    .bg-primary-10 {
      background: rgba(104, 159, 56, 0.1);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnderstoryCardComponent {
  private sanitizer = inject(DomSanitizer);

  title = input<string>();
  icon = input<string>('');
  footer = input<boolean>(false);
  noPadding = input<boolean>(false);

  iconHtml = computed(() => {
    const raw = this.icon();
    if (!raw) return '';
    let html: string;
    // If already contains HTML tags, pass through
    if (raw.includes('<')) {
      html = raw;
    } else {
      // Treat as SVG path data
      html = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="${raw}"></path></svg>`;
    }
    return this.sanitizer.bypassSecurityTrustHtml(html);
  });
}

