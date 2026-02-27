import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-clinical-gauge',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="gauge-container">
      <div class="gauge-header">
        <span class="label">{{ label }}</span>
        <span class="value">{{ value }}/10</span>
      </div>
      <div class="track">
        <div class="bar" [style.width.%]="value * 10" [style.background]="barColor()"></div>
      </div>
      <div class="description" *ngIf="description">
        {{ description }}
      </div>
    </div>
  `,
    styles: [`
    .gauge-container {
      margin-bottom: 1rem;
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(10px);
      padding: 1.25rem;
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.5);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .gauge-container:hover {
      transform: translateY(-4px) scale(1.02);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      background: rgba(255, 255, 255, 0.9);
      border-color: var(--brand-green-light, #8bc34a);
    }

    .gauge-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .label {
      font-weight: 700;
      font-size: 0.7rem;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .value {
      font-weight: 800;
      font-size: 1.25rem;
      color: #1a202c;
      font-feature-settings: "tnum";
    }

    .track {
      height: 10px;
      background: #edf2f7;
      border-radius: 5px;
      overflow: hidden;
      position: relative;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
    }

    .bar {
      height: 100%;
      border-radius: 5px;
      transition: width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
    }

    .bar::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
      animation: shine 3s infinite;
    }

    @keyframes shine {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

    .description {
      margin-top: 0.75rem;
      font-size: 0.75rem;
      color: #4a5568;
      line-height: 1.5;
      font-weight: 500;
    }
  `]
})
export class ClinicalGaugeComponent {
    @Input() label: string = '';
    @Input() value: number = 0;
    @Input() description: string = '';
    @Input() type: 'complexity' | 'stability' | 'certainty' = 'certainty';

    barColor = computed(() => {
        const val = this.value;
        if (this.type === 'stability') {
            if (val > 7) return 'linear-gradient(90deg, #48bb78, #38a169)'; // Stable Green
            if (val > 4) return 'linear-gradient(90deg, #ecc94b, #d69e2e)'; // Warning Yellow
            return 'linear-gradient(90deg, #f56565, #e53e3e)'; // Unstable Red
        }

        if (this.type === 'complexity') {
            if (val > 7) return 'linear-gradient(90deg, #805ad5, #6b46c1)'; // High Complexity Purple
            if (val > 4) return 'linear-gradient(90deg, #4299e1, #3182ce)'; // Moderate Blue
            return 'linear-gradient(90deg, #4fd1c5, #38b2ac)'; // Low Complexity Teal
        }

        // Default/Certainty
        if (val > 8) return 'linear-gradient(90deg, #4fd1c5, #38b2ac)'; // High Certainty Teal
        if (val > 5) return 'linear-gradient(90deg, #4299e1, #3182ce)'; // Moderate
        return 'linear-gradient(90deg, #a0aec0, #718096)'; // Low
    });
}
