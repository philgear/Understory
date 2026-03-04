import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeSeverity = 'info' | 'success' | 'warning' | 'error' | 'neutral';

@Component({
  selector: 'understory-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="badgeClasses()" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all duration-200">
      <ng-content select="[badge-icon]"></ng-content>
      <span [class.ml-1]="hasIcon()">{{ label() }}</span>
    </span>
  `,
  styles: [`
    :host { display: inline-block; }
    
    .severity-info {
      background: rgba(30, 136, 229, 0.08);
      color: #1E88E5;
      border-color: rgba(30, 136, 229, 0.15);
    }
    
    .severity-success {
      background: rgba(104, 159, 56, 0.08); /* Brand Green */
      color: #558B2F;
      border-color: rgba(104, 159, 56, 0.15);
    }
    
    .severity-warning {
      background: rgba(255, 179, 0, 0.08);
      color: #FFB300;
      border-color: rgba(255, 179, 0, 0.15);
    }
    
    .severity-error {
      background: rgba(229, 57, 53, 0.08);
      color: #E53935;
      border-color: rgba(229, 57, 53, 0.15);
    }
    
    .severity-neutral {
      background: rgba(107, 114, 128, 0.08);
      color: #4B5563;
      border-color: rgba(107, 114, 128, 0.15);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnderstoryBadgeComponent {
  label = input.required<string>();
  severity = input<BadgeSeverity>('neutral');
  hasIcon = input<boolean>(false);

  badgeClasses = computed(() => `severity-${this.severity()}`);
}
