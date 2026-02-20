import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SelectionHistoryItem {
    date: string;
    painLevel: number;
    description: string;
}

@Component({
  selector: 'app-selection-history',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
   <div class="relative">
      <!-- The vertical line running through all entries -->
      <div class="absolute left-2.5 top-1 h-full w-0.5 bg-gray-200"></div>

      @for (item of history(); track item.date + item.description; let isLast = $last) {
        <div class="relative pl-8" [class.pb-6]="!isLast">
          
          <!-- Node on the timeline -->
          <div class="absolute left-2.5 top-1 -translate-x-1/2 w-3 h-3 rounded-full bg-white flex items-center justify-center border-2 border-gray-400">
          </div>

          <!-- Data Card -->
          <button (click)="itemSelected.emit(item)"
                  class="relative top-[-5px] w-full text-left group">
            <p class="text-xs font-bold text-gray-500 mb-1 group-hover:text-[#1C1C1C] transition-colors">{{ item.date }}</p>
            <div class="p-3 bg-gray-50/70 border border-gray-200/80 rounded-sm group-hover:bg-gray-100 group-hover:border-gray-300 transition-colors">
                <p class="text-xs text-[#1C1C1C] leading-relaxed">
                    <strong class="font-bold">Pain: {{ item.painLevel }}/10</strong> - 
                    {{ item.description || 'No description provided.' }}
                </p>
            </div>
          </button>
        </div>
      }
   </div>
  `
})
export class SelectionHistoryComponent {
  history = input.required<SelectionHistoryItem[]>();
  itemSelected = output<SelectionHistoryItem>();
}
