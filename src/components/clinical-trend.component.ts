import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-clinical-trend',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="trend-card">
      <div class="trend-header">
        <span class="label">{{ label }} Trend</span>
        <span class="delta" [class.positive]="isImproving()" [class.negative]="!isImproving()">
          {{ delta() > 0 ? '+' : '' }}{{ delta().toFixed(1) }}
        </span>
      </div>
      
      <div class="sparkline-container">
        <svg viewBox="0 0 100 30" preserveAspectRatio="none">
          <path [attr.d]="pathData()" fill="none" [attr.stroke]="strokeColor" stroke-width="2" stroke-linecap="round" />
          <path [attr.d]="areaData()" [attr.fill]="areaColor()" opacity="0.1" />
        </svg>
      </div>
    </div>
  `,
    styles: [`
    .trend-card {
      background: rgba(255, 255, 255, 0.5);
      border-radius: 12px;
      padding: 0.75rem;
      border: 1px solid rgba(255, 255, 255, 0.3);
      margin-bottom: 0.5rem;
    }
    .trend-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .label {
      font-size: 0.7rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
    }
    .delta {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 99px;
    }
    .positive { background: #dcfce7; color: #166534; }
    .negative { background: #fee2e2; color: #991b1b; }
    
    .sparkline-container {
      height: 30px;
      width: 100%;
    }
    svg {
      width: 100%;
      height: 100%;
      overflow: visible;
    }
  `]
})
export class ClinicalTrendComponent {
    @Input() label: string = '';
    @Input() values: number[] = [];
    @Input() type: 'complexity' | 'stability' | 'certainty' = 'certainty';

    delta = computed(() => {
        if (this.values.length < 2) return 0;
        return this.values[this.values.length - 1] - this.values[0];
    });

    isImproving = computed(() => {
        const d = this.delta();
        // For complexity, lower is often better depending on context, 
        // but here we just treat positive delta as "increasing"
        // Usually stability and certainty increasing is positive.
        if (this.type === 'complexity') return d <= 0;
        return d >= 0;
    });

    strokeColor = '#3b82f6'; // Default blue

    areaColor = computed(() => {
        return this.isImproving() ? '#22c55e' : '#ef4444';
    });

    pathData = computed(() => {
        if (this.values.length < 2) return '';
        const max = 10;
        const min = 0;
        const width = 100;
        const height = 30;

        const points = this.values.map((v, i) => {
            const x = (i / (this.values.length - 1)) * width;
            const y = height - ((v - min) / (max - min)) * height;
            return `${x},${y}`;
        });

        return `M ${points.join(' L ')}`;
    });

    areaData = computed(() => {
        const path = this.pathData();
        if (!path) return '';
        return `${path} L 100,30 L 0,30 Z`;
    });
}
