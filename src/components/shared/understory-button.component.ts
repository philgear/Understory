import { Component, ChangeDetectionStrategy, input, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

@Component({
  selector: 'understory-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      [class]="buttonClasses()"
      [attr.aria-label]="ariaLabel() || null"
      (click)="onClick($event)"
    >
      @if (loading()) {
        <div class="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
      } @else if (icon()) {
        <div class="mr-2 flex items-center justify-center h-full" [innerHTML]="iconHtml()"></div>
      }
      
      <span class="flex-grow text-center">
        <ng-content></ng-content>
      </span>
      
      @if (trailingIcon() && !loading()) {
        <div class="ml-2 flex items-center justify-center h-full" [innerHTML]="trailingIconHtml()"></div>
      }
    </button>
  `,
  styles: [`
    :host {
      display: inline-block;
    }

    .btn-base {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      white-space: nowrap;
      cursor: pointer;
    }

    .btn-base:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    /* Primary */
    .btn-primary {
      background: #1C1C1C;
      color: white;
      border: 1px solid #1C1C1C;
    }
    .btn-primary:not(:disabled):hover {
      background: #558B2F;
      border-color: #558B2F;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(85, 139, 47, 0.2);
    }

    /* Secondary */
    .btn-secondary {
      background: #FFFFFF;
      color: #374151;
      border: 1px solid #E5E7EB;
    }
    .btn-secondary:not(:disabled):hover {
      background: #F9FAFB;
      border-color: #D1D5DB;
      color: #111827;
    }

    /* Danger */
    .btn-danger {
      background: #FFFFFF;
      color: #DC2626;
      border: 1px solid #FCA5A5;
    }
    .btn-danger:not(:disabled):hover {
      background: #FEF2F2;
      border-color: #DC2626;
    }

    /* Ghost */
    .btn-ghost {
      background: transparent;
      color: #6B7280;
      border: 1px solid transparent;
    }
    .btn-ghost:not(:disabled):hover {
      background: rgba(0, 0, 0, 0.05);
      color: #111827;
    }

    /* Outline */
    .btn-outline {
      background: transparent;
      color: #1C1C1C;
      border: 1px solid #1C1C1C;
    }
    .btn-outline:not(:disabled):hover {
      background: #1C1C1C;
      color: white;
    }

    /* Sizes */
    .size-xs {
      padding: 0.375rem 0.75rem;
      font-size: 9px;
    }
    .size-sm {
      padding: 0.5rem 1rem;
      font-size: 10px;
    }
    .size-md {
      padding: 0.75rem 1.5rem;
      font-size: 12px;
    }
    .size-lg {
      padding: 1rem 2rem;
      font-size: 14px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnderstoryButtonComponent {
  private sanitizer = inject(DomSanitizer);

  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  disabled = input<boolean>(false);
  loading = input<boolean>(false);
  icon = input<string>('');
  trailingIcon = input<string>('');
  type = input<'button' | 'submit' | 'reset'>('button');
  ariaLabel = input<string>('');

  clicked = output<MouseEvent>();

  private wrapSvgPath(raw: string) {
    if (!raw) return '';
    let html: string;
    if (raw.includes('<')) {
      html = raw;
    } else {
      html = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="${raw}"></path></svg>`;
    }
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  iconHtml = computed(() => this.wrapSvgPath(this.icon()));
  trailingIconHtml = computed(() => this.wrapSvgPath(this.trailingIcon()));

  buttonClasses(): string {
    return [
      'btn-base',
      `btn-${this.variant()}`,
      `size-${this.size()}`,
      this.disabled() ? 'disabled' : ''
    ].join(' ');
  }

  onClick(event: MouseEvent) {
    if (!this.disabled() && !this.loading()) {
      this.clicked.emit(event);
    }
  }
}

